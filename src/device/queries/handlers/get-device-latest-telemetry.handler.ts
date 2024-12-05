import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from '@/prisma/prisma.service';
import { GetDeviceLatestTelemetryQuery } from '../impl/get-device-latest-telemetry.query';
import {
  DeviceLatestTelemetryDto,
  TelemetryValue,
} from '@/device/dto/device-latest-telemetry.dto';
import { NotFoundException } from '@nestjs/common';

@QueryHandler(GetDeviceLatestTelemetryQuery)
export class GetDeviceLatestTelemetryHandler
  implements IQueryHandler<GetDeviceLatestTelemetryQuery>
{
  constructor(private prisma: PrismaService) {}

  async execute(
    query: GetDeviceLatestTelemetryQuery,
  ): Promise<DeviceLatestTelemetryDto> {
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

    // Get latest telemetry from ts_kv_latest and join with ts_kv_dictionary
    const latestTelemetry = await this.prisma.$queryRaw<
      Array<{
        key: string;
        ts: bigint;
        bool_v: boolean | null;
        str_v: string | null;
        long_v: bigint | null;
        dbl_v: number | null;
      }>
    >`
      SELECT d.key, l.ts, l.bool_v, l.str_v, l.long_v, l.dbl_v
      FROM ts_kv_latest l
      JOIN ts_kv_dictionary d ON d.key_id = l.key
      WHERE l.entity_id = ${query.deviceId}::uuid
    `;

    // Transform the raw data into the DTO format
    const telemetry: TelemetryValue[] = latestTelemetry.map((t) => {
      let value: string | number | boolean;
      if (t.bool_v !== null) value = t.bool_v;
      else if (t.str_v !== null) value = t.str_v;
      else if (t.long_v !== null) value = Number(t.long_v);
      else if (t.dbl_v !== null) value = t.dbl_v;
      else value = '';

      return {
        key: t.key,
        value,
        ts: Number(t.ts),
      };
    });

    return { telemetry };
  }
}
