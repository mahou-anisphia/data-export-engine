import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetDeviceTelemetryKeysQuery } from '../impl/get-device-telemetry-keys.query';
import { PrismaService } from '@/prisma/prisma.service';
import { DeviceTelemetryKeysDto } from '@/device/dto/device-telemetry-keys.dto';
import { NotFoundException } from '@nestjs/common';

@QueryHandler(GetDeviceTelemetryKeysQuery)
export class GetDeviceTelemetryKeysHandler
  implements IQueryHandler<GetDeviceTelemetryKeysQuery>
{
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    query: GetDeviceTelemetryKeysQuery,
  ): Promise<DeviceTelemetryKeysDto> {
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

    // Get all unique keys from ts_kv_latest for this device
    const telemetryKeys = await this.prisma.$queryRaw<{ key: string }[]>`
      SELECT DISTINCT d.key
      FROM ts_kv_latest l
      JOIN ts_kv_dictionary d ON l.key = d.key_id
      WHERE l.entity_id = ${query.deviceId}::uuid
      ORDER BY d.key ASC
    `;

    return {
      deviceId: query.deviceId,
      keys: telemetryKeys.map((k) => k.key),
    };
  }
}
