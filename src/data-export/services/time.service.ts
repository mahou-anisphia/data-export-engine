// src/data-export/services/time.service.ts
import { Injectable } from '@nestjs/common';
import { TimeFormat } from '@/data-export/dto/device-export-request.dto';

@Injectable()
export class TimeService {
  formatTimestamp(timestamp: number, format: TimeFormat): string | number {
    if (format === TimeFormat.UNIX) {
      return timestamp;
    }

    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      return timestamp;
    }

    const formatMap = {
      [TimeFormat.ISO]: date.toISOString(),
      [TimeFormat.HUMAN]: date.toLocaleString(),
      [TimeFormat.RELATIVE]: this.getRelativeTimeString(timestamp),
    };

    return formatMap[format] || timestamp;
  }

  private getRelativeTimeString(timestamp: number): string {
    const diff = Date.now() - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    const years = Math.floor(months / 12);

    if (years > 0) return `${years} ${years === 1 ? 'year' : 'years'} ago`;
    if (months > 0) return `${months} ${months === 1 ? 'month' : 'months'} ago`;
    if (days > 0) return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    if (hours > 0) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    if (minutes > 0)
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    return `${seconds} ${seconds === 1 ? 'second' : 'seconds'} ago`;
  }
}
