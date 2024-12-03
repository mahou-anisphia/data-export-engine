// src/device/queries/handlers/get-devices.handler.ts
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetDevicesQuery } from '@/device/queries/impl/get-devices.query';
import { PrismaService } from '@/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { PaginatedDeviceResponse } from '@/device/dto/device-response.dto';

@Injectable()
@QueryHandler(GetDevicesQuery)
export class GetDevicesHandler implements IQueryHandler<GetDevicesQuery> {
  constructor(private prisma: PrismaService) {}

  async execute(query: GetDevicesQuery): Promise<PaginatedDeviceResponse> {
    const { tenantId, pageSize, pageNumber, customerId, type, profileId } =
      query;

    const take = Number(pageSize);
    const page = Number(pageNumber);
    const skip = (page - 1) * take;

    const where = {
      tenant_id: tenantId,
      ...(customerId && { customer_id: customerId }),
      ...(type && { type }),
      ...(profileId && { device_profile_id: profileId }),
    };

    const [devices, total] = await Promise.all([
      this.prisma.device.findMany({
        where,
        skip,
        take,
        include: {
          device_profile: {
            select: {
              id: true,
              name: true,
              type: true,
              description: true,
              image: true,
              default_dashboard_id: true,
            },
          },
        },
        orderBy: {
          created_time: 'desc',
        },
      }),
      this.prisma.device.count({ where }),
    ]);

    const totalPages = Math.ceil(total / take);

    return {
      devices,
      pagination: {
        total,
        page,
        limit: take,
        totalPages,
      },
    };
  }
}
