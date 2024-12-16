// src/data-export/services/data.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CassandraService } from '@/cassandra/cassandra.service';
import { ExportDeviceDataQuery } from '@/data-export/queries/impl/export-device-data.query';
import { TimeService } from './time.service';
import { NullService } from './null.service';
import { FileFormat } from '@/data-export/dto/device-export-request.dto';

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

  async *generateData(query: ExportDeviceDataQuery) {
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

          const processedValue = this.nullService.handleNullValue(
            value,
            query.exportRequest.nullValue,
            query.exportRequest.nullCustomValue,
          );

          if (processedValue === undefined) continue;

          yield {
            timestamp: this.timeService.formatTimestamp(
              Number(row.ts),
              query.exportRequest.timeFormat,
            ),
            key: keyPartition.key,
            value: processedValue,
            partition: partition.toString(),
          };
        }
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
