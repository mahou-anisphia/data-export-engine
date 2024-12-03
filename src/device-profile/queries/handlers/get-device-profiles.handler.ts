// src/device-profile/queries/handlers/get-device-profiles.handler.ts
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetDeviceProfilesQuery } from '../impl/get-device-profiles.query';
import { PrismaService } from '../../../prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { DeviceProfileResponseDto } from '../../dto/device-profile-response.dto';

@Injectable()
@QueryHandler(GetDeviceProfilesQuery)
export class GetDeviceProfilesHandler
  implements IQueryHandler<GetDeviceProfilesQuery>
{
  constructor(private prisma: PrismaService) {}

  async execute(
    query: GetDeviceProfilesQuery,
  ): Promise<DeviceProfileResponseDto[]> {
    const { tenantId, type } = query;

    const whereClause = {
      tenant_id: tenantId,
      ...(type && { type }),
    };

    const profiles = await this.prisma.device_profile.findMany({
      where: whereClause,
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
    });

    return profiles;
  }
}
