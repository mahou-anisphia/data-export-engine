// src/data-export/queries/handlers/export-device-data.handler.ts
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ExportDeviceDataQuery } from '../impl/export-device-data.query';
import { PrismaService } from '@/prisma/prisma.service';
import { CassandraService } from '@/cassandra/cassandra.service';
import { NotFoundException } from '@nestjs/common';
import { Readable } from 'stream';
import * as XLSX from 'xlsx';
import * as fastcsv from 'fast-csv';
import {
  FileFormat,
  TimeFormat,
  NullValueHandling,
} from '@/data-export/dto/device-export-request.dto';
import { PassThrough } from 'stream';

@QueryHandler(ExportDeviceDataQuery)
export class ExportDeviceDataHandler
  implements IQueryHandler<ExportDeviceDataQuery>
{
  constructor(
    private readonly prisma: PrismaService,
    private readonly cassandra: CassandraService,
  ) {}

  private formatTimestamp(
    timestamp: number,
    format: TimeFormat,
  ): string | number {
    // If it's UNIX format, return the raw timestamp
    if (format === TimeFormat.UNIX) {
      return timestamp;
    }

    // Convert timestamp to milliseconds if needed
    const timestampMs =
      timestamp.toString().length === 10 ? timestamp * 1000 : timestamp;
    const date = new Date(timestampMs);

    // Return original timestamp if date is invalid
    if (isNaN(date.getTime())) {
      return timestamp;
    }

    // Simple mapping of formats to their output
    const formatMap = {
      [TimeFormat.ISO]: date.toISOString(),
      [TimeFormat.HUMAN]: date.toLocaleString(),
      [TimeFormat.RELATIVE]: `${Math.floor((Date.now() - timestampMs) / 1000)} seconds ago`,
    };

    return formatMap[format] || timestamp;
  }

  private handleNullValue(
    value: any,
    nullHandling: NullValueHandling,
    customValue?: string,
  ): any {
    if (value !== null && value !== undefined) return value;

    switch (nullHandling) {
      case NullValueHandling.EMPTY:
        return '';
      case NullValueHandling.NULL:
        return 'null';
      case NullValueHandling.CUSTOM:
        return customValue || '';
      case NullValueHandling.SKIP:
      default:
        return undefined;
    }
  }

  private async *generateData(query: ExportDeviceDataQuery) {
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
          let value = null;
          // Determine the value type and assign accordingly
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

          value = this.handleNullValue(
            value,
            query.exportRequest.nullValue,
            query.exportRequest.nullCustomValue,
          );

          if (value === undefined) continue;

          // For XLSX, only stringify objects and booleans
          if (query.exportRequest.fileFormat === FileFormat.XLSX) {
            if (typeof value === 'object') {
              value = JSON.stringify(value);
            }
            if (typeof value === 'boolean') {
              value = value.toString();
            }
            // Convert string numbers to actual numbers
            if (typeof value === 'string' && !isNaN(Number(value))) {
              value = Number(value);
            }
          }

          yield {
            timestamp: this.formatTimestamp(
              Number(row.ts),
              query.exportRequest.timeFormat,
            ),
            key: keyPartition.key,
            value: value,
            partition: partition.toString(),
          };
        }
      }
    }
  }

  async execute(query: ExportDeviceDataQuery): Promise<Readable> {
    // First verify the device exists and belongs to the tenant
    const device = await this.prisma.device.findFirst({
      where: {
        id: query.deviceId,
        tenant_id: query.tenantId,
      },
    });

    if (!device) {
      throw new NotFoundException('Device not found');
    }

    const outputStream = new PassThrough();

    // Process data using generator
    (async () => {
      try {
        const allData = [];
        for await (const record of this.generateData(query)) {
          allData.push(record);
        }

        switch (query.exportRequest.fileFormat) {
          case FileFormat.XLSX: {
            const worksheet = XLSX.utils.json_to_sheet(allData);

            const colWidths = {
              A: { wch: 25 }, // timestamp
              B: { wch: 15 }, // key
              C: { wch: 30 }, // value
              D: { wch: 15 }, // partition
            };
            worksheet['!cols'] = [
              colWidths.A,
              colWidths.B,
              colWidths.C,
              colWidths.D,
            ];

            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
            const buffer = XLSX.write(workbook, {
              type: 'buffer',
              bookType: 'xlsx',
            });
            outputStream.write(buffer);
            outputStream.end();
            break;
          }
          case FileFormat.CSV: {
            // Create CSV stream and pipe it to outputStream
            const csvStream = fastcsv.write(allData, {
              headers: true,
              delimiter: query.exportRequest.csvDelimiter,
            });

            csvStream.pipe(outputStream);

            // Handle CSV stream events
            csvStream.on('error', (error) => {
              outputStream.emit('error', error);
            });

            // No need to manually end outputStream - it will end when csvStream ends
            break;
          }
          case FileFormat.JSON: {
            outputStream.write(JSON.stringify(allData, null, 2));
            outputStream.end();
            break;
          }
        }
      } catch (error) {
        outputStream.emit('error', error);
        outputStream.end();
      }
    })();

    return outputStream;
  }
}
