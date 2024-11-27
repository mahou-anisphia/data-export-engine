// src/device/queries/handlers/get-devices.handler.ts
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetDevicesQuery } from '../impl/get-devices.query';
import { PrismaService } from '../../../prisma/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
@QueryHandler(GetDevicesQuery)
export class GetDevicesHandler implements IQueryHandler<GetDevicesQuery> {
  constructor(private prisma: PrismaService) {}

  async execute(query: GetDevicesQuery) {
    const { tenantId, pageSize, pageNumber, customerId, type } = query;
    const skip = (pageNumber - 1) * pageSize;

    const whereClause = {
      tenant_id: tenantId,
      ...(customerId && { customer_id: customerId }),
      ...(type && { type }),
    };

    const [devices, total] = await Promise.all([
      this.prisma.device.findMany({
        where: whereClause,
        skip,
        take: pageSize,
        include: {
          device_profile: true,
        },
      }),
      this.prisma.device.count({
        where: whereClause,
      }),
    ]);

    return {
      data: devices,
      meta: {
        total,
        page: pageNumber,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }
}
