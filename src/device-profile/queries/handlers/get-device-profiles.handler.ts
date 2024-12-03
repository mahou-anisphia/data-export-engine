// src/device-profile/queries/handlers/get-device-profiles.handler.ts
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetDeviceProfilesQuery } from '@/device-profile/queries/impl/get-device-profiles.query';
import { PrismaService } from '@/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { PaginatedDeviceProfileResponse } from '@/device-profile/dto/device-profile-response.dto';

@Injectable()
@QueryHandler(GetDeviceProfilesQuery)
export class GetDeviceProfilesHandler
  implements IQueryHandler<GetDeviceProfilesQuery>
{
  constructor(private prisma: PrismaService) {}

  async execute(
    query: GetDeviceProfilesQuery,
  ): Promise<PaginatedDeviceProfileResponse> {
    const { tenantId, pageSize, pageNumber, type } = query;

    const take = Number(pageSize);
    const page = Number(pageNumber);
    const skip = (page - 1) * take;

    const whereClause = {
      tenant_id: tenantId,
      ...(type && { type }),
    };

    const [profiles, total] = await Promise.all([
      this.prisma.device_profile.findMany({
        where: whereClause,
        skip,
        take,
        select: {
          id: true,
          name: true,
          type: true,
          description: true,
          image: true,
          transport_type: true,
          provision_type: true,
          is_default: true,
          default_dashboard_id: true,
          default_queue_name: true,
          created_time: true,
        },
        orderBy: {
          created_time: 'desc',
        },
      }),
      this.prisma.device_profile.count({ where: whereClause }),
    ]);

    const totalPages = Math.ceil(total / take);

    return {
      profiles,
      pagination: {
        total,
        page,
        limit: take,
        totalPages,
      },
    };
  }
}
