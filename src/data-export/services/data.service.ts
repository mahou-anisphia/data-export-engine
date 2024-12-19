// src/data-export/services/data.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CassandraService } from '@/cassandra/cassandra.service';
import { ExportDeviceDataQuery } from '@/data-export/queries/impl/export-device-data.query';
import { TimeService } from './time.service';
import { NullService } from './null.service';
import {
  FileFormat,
  DataOrganization,
} from '@/data-export/dto/device-export-request.dto';
import {
  FlatDataEntry,
  KeyOrganizedEntry,
  PartitionOrganizedEntry,
} from '@/data-export/dto/data-export-query.dto';

const groupBy = <T, K extends keyof T>(
  array: T[],
  key: K,
): Record<string, T[]> => {
  return array.reduce(
    (acc, item) => {
      const value = item[key];
      const group = acc[value as string] || [];
      return { ...acc, [value as string]: [...group, item] };
    },
    {} as Record<string, T[]>,
  );
};

@Injectable()
export class DataService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cassandra: CassandraService,
    private readonly timeService: TimeService,
    private readonly nullService: NullService,
  ) {}

  async validateDevice(deviceId: string, tenantId: string) {
    const device = await this.prisma.device.findFirst({
      where: {
        id: deviceId,
        tenant_id: tenantId,
      },
    });

    if (!device) {
      throw new NotFoundException('Device not found');
    }

    return device;
  }

  // This is the method your handler is looking for
  async *generateData(
    query: ExportDeviceDataQuery,
  ): AsyncGenerator<
    FlatDataEntry[] | KeyOrganizedEntry[] | PartitionOrganizedEntry[]
  > {
    const rawData: FlatDataEntry[] = [];

    // Collect raw data without null handling
    for (const keyPartition of query.exportRequest.selectedData) {
      for (const partition of keyPartition.partitions) {
        const result = await this.cassandra.executeQuery(
          `SELECT ts, bool_v, dbl_v, json_v, long_v, str_v
           FROM ts_kv_cf
           WHERE entity_type = ?
           AND entity_id = ?
           AND key = ?
           AND partition = ?`,
          ['DEVICE', query.deviceId, keyPartition.key, partition],
        );

        for (const row of result.rows) {
          const value = this.extractValue(row, query.exportRequest.fileFormat);
          const timestamp = this.timeService.formatTimestamp(
            Number(row.ts),
            query.exportRequest.timeFormat,
          );

          rawData.push({
            timestamp,
            key: keyPartition.key,
            value,
            partition: partition.toString(),
          });
        }
      }
    }

    switch (query.exportRequest.dataOrganization) {
      case DataOrganization.PARTITION: {
        const timestampGroups = groupBy(rawData, 'timestamp');
        const partitionOrganized: PartitionOrganizedEntry[] = [];
        const allKeys = new Set(rawData.map((entry) => entry.key));

        for (const [timestamp, entries] of Object.entries(timestampGroups)) {
          const partition = entries[0].partition;
          const sensorValues: { [key: string]: any } = {};

          // Initialize all sensors with null
          allKeys.forEach((key) => {
            sensorValues[key] = this.nullService.handleNullValue(
              null,
              query.exportRequest.nullValue,
              query.exportRequest.nullCustomValue,
            );
          });

          // Fill in actual values
          entries.forEach((entry) => {
            if (entry.value !== null) {
              sensorValues[entry.key] = entry.value;
            }
          });

          // Skip if all values are undefined (SKIP handling)
          const hasNonNullValue = Object.values(sensorValues).some(
            (v) => v !== undefined,
          );
          if (hasNonNullValue) {
            partitionOrganized.push({
              partition,
              timestamp,
              ...sensorValues,
            });
          }
        }

        yield partitionOrganized.sort((a, b) =>
          String(a.timestamp).localeCompare(String(b.timestamp)),
        );
        break;
      }

      case DataOrganization.KEY:
      case DataOrganization.FLAT:
      default: {
        yield rawData.sort((a, b) => {
          const timeCompare = String(a.timestamp).localeCompare(
            String(b.timestamp),
          );
          return timeCompare !== 0 ? timeCompare : a.key.localeCompare(b.key);
        });
      }
    }

    // Then organize based on requested format
    switch (query.exportRequest.dataOrganization) {
      case DataOrganization.KEY: {
        // Simply sort the data by timestamp, then key
        const keyOrganized = [...rawData].sort((a, b) => {
          const timeCompare = String(a.timestamp).localeCompare(
            String(b.timestamp),
          );
          if (timeCompare !== 0) return timeCompare;
          return a.key.localeCompare(b.key);
        });
        yield keyOrganized;
        break;
      }

      case DataOrganization.PARTITION: {
        // Group by timestamp first to get all sensors at each timestamp
        const timestampGroups = groupBy(rawData, 'timestamp');
        const partitionOrganized: PartitionOrganizedEntry[] = [];

        for (const [timestamp, entries] of Object.entries(timestampGroups)) {
          const partition = entries[0].partition; // All entries in same timestamp have same partition

          // Create an object with all sensor values as columns
          const sensorValues: { [key: string]: any } = {};
          entries.forEach((entry) => {
            sensorValues[entry.key] = entry.value;
          });

          partitionOrganized.push({
            partition,
            timestamp,
            ...sensorValues,
          });
        }

        // Sort by timestamp
        yield partitionOrganized.sort((a, b) =>
          String(a.timestamp).localeCompare(String(b.timestamp)),
        );
        break;
      }

      case DataOrganization.FLAT:
      default: {
        // Sort by timestamp, then key
        yield rawData.sort((a, b) => {
          const timeCompare = String(a.timestamp).localeCompare(
            String(b.timestamp),
          );
          if (timeCompare !== 0) return timeCompare;
          return a.key.localeCompare(b.key);
        });
        break;
      }
    }
  }

  private extractValue(row: any, fileFormat: FileFormat): any {
    let value = null;

    if (row.bool_v !== null) value = row.bool_v;
    else if (row.dbl_v !== null) value = Number(row.dbl_v);
    else if (row.long_v !== null) value = Number(row.long_v);
    else if (row.str_v !== null) value = row.str_v;
    else if (row.json_v !== null) {
      try {
        value = JSON.parse(row.json_v);
      } catch {
        value = row.json_v;
      }
    }

    if (fileFormat === FileFormat.XLSX) {
      if (typeof value === 'object') {
        value = JSON.stringify(value);
      }
      if (typeof value === 'boolean') {
        value = value.toString();
      }
      if (typeof value === 'string' && !isNaN(Number(value))) {
        value = Number(value);
      }
    }

    return value;
  }
}
