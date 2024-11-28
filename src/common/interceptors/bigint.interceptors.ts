// common/interceptors/bigint.interceptors.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class BigIntInterceptor implements NestInterceptor {
  private transformValue(value: any): any {
    if (value === null || value === undefined) {
      return value;
    }

    if (typeof value === 'bigint') {
      return value.toString();
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.transformValue(item));
    }

    if (typeof value === 'object') {
      const transformed = {};
      for (const key in value) {
        transformed[key] = this.transformValue(value[key]);
      }
      return transformed;
    }

    return value;
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(map((data) => this.transformValue(data)));
  }
}
