// src/device/queries/handlers/get-device-counts.handler.ts
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetDeviceCountsQuery } from '../impl/get-device-counts.query';
import { PrismaService } from '../../../prisma/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
@QueryHandler(GetDeviceCountsQuery)
export class GetDeviceCountsHandler
  implements IQueryHandler<GetDeviceCountsQuery>
{
  constructor(private prisma: PrismaService) {}

  async execute(query: GetDeviceCountsQuery) {
    const { tenantId, customerId } = query;

    const whereClause = {
      tenant_id: tenantId,
      ...(customerId && { customer_id: customerId }),
    };

    // Get total count
    const totalCount = await this.prisma.device.count({
      where: whereClause,
    });

    // Get count by type
    const countByType = await this.prisma.device.groupBy({
      by: ['type'],
      where: whereClause,
      _count: true,
    });

    // Get count by profile
    const countByProfile = await this.prisma.device.groupBy({
      by: ['device_profile_id'],
      where: whereClause,
      _count: true,
    });

    // Get profile names
    const profileIds = countByProfile.map((p) => p.device_profile_id);
    const profiles = await this.prisma.device_profile.findMany({
      where: {
        id: { in: profileIds },
      },
      select: {
        id: true,
        name: true,
      },
    });

    // Map profile names to counts
    const countByProfileWithNames = countByProfile.map((profile) => ({
      profile_id: profile.device_profile_id,
      profile_name: profiles.find((p) => p.id === profile.device_profile_id)
        ?.name,
      count: profile._count,
    }));

    return {
      total: totalCount,
      by_type: countByType.map((type) => ({
        type: type.type || 'undefined',
        count: type._count,
      })),
      by_profile: countByProfileWithNames,
    };
  }
}
