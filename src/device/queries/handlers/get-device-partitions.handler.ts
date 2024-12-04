import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetDevicePartitionsQuery } from '../impl/get-device-partitions.query';
import { PrismaService } from '@/prisma/prisma.service';
import { CassandraService } from '@/cassandra/cassandra.service';
import { DevicePartitionsResponseDto } from '@/device/dto/get-device-partitions.dto';
import { NotFoundException } from '@nestjs/common';

@QueryHandler(GetDevicePartitionsQuery)
export class GetDevicePartitionsHandler
  implements IQueryHandler<GetDevicePartitionsQuery>
{
  constructor(
    private readonly prisma: PrismaService,
    private readonly cassandra: CassandraService,
  ) {}

  async execute(
    query: GetDevicePartitionsQuery,
  ): Promise<DevicePartitionsResponseDto> {
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

    // Query Cassandra for partitions
    const result = await this.cassandra.executeQuery(
      `SELECT partition, key
       FROM ts_kv_partitions_cf
       WHERE entity_type = ?
       AND entity_id = ?
       AND key IN ?`,
      ['DEVICE', query.deviceId, query.keys],
    );

    return {
      deviceId: query.deviceId,
      partitions: result.rows.map((row) => ({
        key: row.key,
        partition: row.partition,
      })),
    };
  }
}
