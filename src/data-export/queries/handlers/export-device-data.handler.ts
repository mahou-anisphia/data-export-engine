// src/data-export/handlers/export-device-data.handler.ts
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ExportDeviceDataQuery } from '../impl/export-device-data.query';
import { Readable, PassThrough } from 'stream';
import { DataService } from '@/data-export/services/data.service';
import { TimeService } from '@/data-export/services/time.service';
import { NullService } from '@/data-export/services/null.service';
import { FormatService } from '@/data-export/services/format.service';

@QueryHandler(ExportDeviceDataQuery)
export class ExportDeviceDataHandler
  implements IQueryHandler<ExportDeviceDataQuery>
{
  constructor(
    private readonly dataService: DataService,
    private readonly timeService: TimeService,
    private readonly nullService: NullService,
    private readonly formatService: FormatService,
  ) {}

  async execute(query: ExportDeviceDataQuery): Promise<Readable> {
    await this.dataService.validateDevice(query.deviceId, query.tenantId);
    const outputStream = new PassThrough();

    (async () => {
      try {
        const allData = [];
        for await (const record of this.dataService.generateData(query)) {
          allData.push(record);
        }

        await this.formatService.formatAndStream(
          query.exportRequest.fileFormat,
          allData,
          outputStream,
          query.exportRequest,
        );
      } catch (error) {
        outputStream.emit('error', error);
        outputStream.end();
      }
    })();

    return outputStream;
  }
}
