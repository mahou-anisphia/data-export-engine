// src/data-export/services/null.service.ts
import { Injectable } from '@nestjs/common';
import { NullValueHandling } from '@/data-export/dto/device-export-request.dto';

@Injectable()
export class NullService {
  handleNullValue(
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
}
