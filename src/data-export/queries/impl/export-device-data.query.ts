import { DeviceExportRequestDto } from '@/data-export/dto/device-export-request.dto';

export class ExportDeviceDataQuery {
  constructor(
    public readonly tenantId: string,
    public readonly deviceId: string,
    public readonly exportRequest: DeviceExportRequestDto,
  ) {}
}
