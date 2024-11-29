// src/device/device.controller.ts
import { Controller, Get, Query, UseGuards, Version } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { GetDevicesQuery } from './queries/impl/get-devices.query';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthorityGuard } from '../auth/guards/authority.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Authority } from '../common/decorators/authority.decorator';
import { IUser } from '../auth/interfaces/user.interface';
import { GetDevicesDto } from './dto/get-devices.dto';
import { PaginatedDeviceResponse } from './dto/device-response.dto';
import { GetDeviceCountsQuery } from './queries/impl/get-device-counts.query';
// import { BigIntInterceptor } from '../common/interceptors/bigint.interceptors';

@Controller('devices')
// @UseInterceptors(BigIntInterceptor)
export class DeviceController {
  constructor(private readonly queryBus: QueryBus) {}

  @Version('1')
  @Get()
  @UseGuards(JwtAuthGuard, AuthorityGuard)
  @Authority('TENANT_ADMIN')
  async getDevices(
    @CurrentUser() user: IUser,
    @Query() query: GetDevicesDto,
  ): Promise<PaginatedDeviceResponse> {
    return this.queryBus.execute(
      new GetDevicesQuery(
        user.tenant_id,
        query.pageSize,
        query.pageNumber,
        query.customerId,
        query.type,
        query.profileId,
      ),
    );
  }
  @Version('1')
  @Get('count')
  @UseGuards(JwtAuthGuard, AuthorityGuard)
  @Authority('TENANT_ADMIN')
  async getDeviceCounts(
    @CurrentUser() user: IUser,
    @Query('customerId') customerId?: string,
  ) {
    return this.queryBus.execute(
      new GetDeviceCountsQuery(user.tenant_id, customerId),
    );
  }
}
