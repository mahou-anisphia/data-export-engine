// src/device-profile/queries/handlers/get-profile-counts.handler.ts
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetProfileCountsQuery } from '../impl/get-device-profile-counts.query';
import { PrismaService } from '../../../prisma/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
@QueryHandler(GetProfileCountsQuery)
export class GetProfileCountsHandler
  implements IQueryHandler<GetProfileCountsQuery>
{
  constructor(private prisma: PrismaService) {}

  async execute(query: GetProfileCountsQuery) {
    const { tenantId } = query;

    // Get all profiles with their device counts
    const profiles = await this.prisma.device_profile.findMany({
      where: {
        tenant_id: tenantId,
      },
      select: {
        id: true,
        name: true,
        type: true,
        is_default: true,
        _count: {
          select: {
            device: true,
          },
        },
      },
    });

    const totalProfiles = profiles.length;
    const totalDevices = profiles.reduce(
      (sum, profile) => sum + profile._count.device,
      0,
    );

    return {
      total_profiles: totalProfiles,
      total_devices: totalDevices,
      profiles: profiles.map((profile) => ({
        id: profile.id,
        name: profile.name,
        type: profile.type,
        is_default: profile.is_default,
        device_count: profile._count.device,
      })),
    };
  }
}
