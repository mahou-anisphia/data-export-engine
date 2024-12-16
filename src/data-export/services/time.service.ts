// src/data-export/services/time.service.ts
import { Injectable } from '@nestjs/common';
import { TimeFormat } from '@/data-export/dto/device-export-request.dto';

@Injectable()
export class TimeService {
  formatTimestamp(timestamp: number, format: TimeFormat): string | number {
    if (format === TimeFormat.UNIX) {
      return timestamp;
    }

    const timestampMs =
      timestamp.toString().length === 10 ? timestamp * 1000 : timestamp;
    const date = new Date(timestampMs);

    if (isNaN(date.getTime())) {
      return timestamp;
    }

    const formatMap = {
      [TimeFormat.ISO]: date.toISOString(),
      [TimeFormat.HUMAN]: date.toLocaleString(),
      [TimeFormat.RELATIVE]: `${Math.floor((Date.now() - timestampMs) / 1000)} seconds ago`,
    };

    return formatMap[format] || timestamp;
  }
}
