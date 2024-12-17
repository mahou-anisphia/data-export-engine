import { Injectable } from '@nestjs/common';
import { PassThrough } from 'stream';
import * as XLSX from 'xlsx';
import * as fastcsv from 'fast-csv';
import {
  FileFormat,
  DataOrganization,
  DeviceExportRequestDto,
} from '@/data-export/dto/device-export-request.dto';
import {
  FlatDataEntry,
  KeyOrganizedEntry,
  PartitionOrganizedEntry,
} from '@/data-export/dto/data-export-query.dto';

@Injectable()
export class FormatService {
  async formatAndStream(
    format: FileFormat,
    data: FlatDataEntry[] | KeyOrganizedEntry[] | PartitionOrganizedEntry[],
    outputStream: PassThrough,
    exportRequest: DeviceExportRequestDto,
  ): Promise<void> {
    // Ensure we're working with the first (and only) array from the generator
    const formattedData = Array.isArray(data[0]) ? data[0] : data;

    switch (format) {
      case FileFormat.JSON: {
        outputStream.write(JSON.stringify(formattedData, null, 2));
        outputStream.end();
        break;
      }

      case FileFormat.CSV: {
        if (exportRequest.dataOrganization === DataOrganization.PARTITION) {
          // For partition organization:
          // 1. Find all unique sensor keys across all entries
          const sensorKeys = new Set<string>();
          formattedData.forEach((entry: any) => {
            Object.keys(entry).forEach((key) => {
              if (key !== 'partition' && key !== 'timestamp') {
                sensorKeys.add(key);
              }
            });
          });

          // 2. Ensure all entries have all sensor keys, with null for missing values
          const normalizedData = formattedData.map((entry: any) => {
            const normalized = {
              partition: entry.partition,
              timestamp: entry.timestamp,
            };

            // Add all sensor values, using null for missing ones
            sensorKeys.forEach((key) => {
              normalized[key] = entry[key] ?? null;
            });

            return normalized;
          });

          // 3. Create the CSV stream with explicit header order
          const headers = [
            'partition',
            'timestamp',
            ...Array.from(sensorKeys).sort(),
          ];

          const csvStream = fastcsv.write(normalizedData, {
            headers: headers,
            delimiter: exportRequest.csvDelimiter,
          });
          csvStream.pipe(outputStream);
        } else {
          // For flat and key organization, use data directly
          const csvStream = fastcsv.write(formattedData, {
            headers: true,
            delimiter: exportRequest.csvDelimiter,
          });
          csvStream.pipe(outputStream);
        }
        break;
      }

      case FileFormat.XLSX: {
        const worksheet = XLSX.utils.json_to_sheet(formattedData);

        // Set column widths
        const defaultWidth = { wch: 15 };
        const timestampWidth = { wch: 25 };
        const valueWidth = { wch: 20 };

        const headers = Object.keys(formattedData[0] || {});
        worksheet['!cols'] = headers.map((header) => {
          if (header === 'timestamp') return timestampWidth;
          if (header === 'value') return valueWidth;
          if (header === 'key' || header === 'partition') return defaultWidth;
          return valueWidth;
        });

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
    }
  }
}
