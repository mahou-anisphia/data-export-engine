// src/data-export/services/format.service.ts
import { Injectable } from '@nestjs/common';
import { PassThrough } from 'stream';
import * as XLSX from 'xlsx';
import * as fastcsv from 'fast-csv';
import { FileFormat } from '@/data-export/dto/device-export-request.dto';
import { DeviceExportRequestDto } from '@/data-export/dto/device-export-request.dto';

@Injectable()
export class FormatService {
  async formatAndStream(
    format: FileFormat,
    data: any[],
    outputStream: PassThrough,
    exportRequest: DeviceExportRequestDto,
  ): Promise<void> {
    switch (format) {
      case FileFormat.XLSX:
        await this.formatXLSX(data, outputStream);
        break;
      case FileFormat.CSV:
        await this.formatCSV(data, outputStream, exportRequest.csvDelimiter);
        break;
      case FileFormat.JSON:
        await this.formatJSON(data, outputStream);
        break;
    }
  }

  private async formatXLSX(
    data: any[],
    outputStream: PassThrough,
  ): Promise<void> {
    const worksheet = XLSX.utils.json_to_sheet(data);

    const colWidths = {
      A: { wch: 25 }, // timestamp
      B: { wch: 15 }, // key
      C: { wch: 30 }, // value
      D: { wch: 15 }, // partition
    };
    worksheet['!cols'] = [colWidths.A, colWidths.B, colWidths.C, colWidths.D];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    outputStream.write(buffer);
    outputStream.end();
  }

  private async formatCSV(
    data: any[],
    outputStream: PassThrough,
    delimiter: string,
  ): Promise<void> {
    const csvStream = fastcsv.write(data, {
      headers: true,
      delimiter: delimiter,
    });

    csvStream.pipe(outputStream);

    csvStream.on('error', (error) => {
      outputStream.emit('error', error);
    });
  }

  private async formatJSON(
    data: any[],
    outputStream: PassThrough,
  ): Promise<void> {
    outputStream.write(JSON.stringify(data, null, 2));
    outputStream.end();
  }
}
