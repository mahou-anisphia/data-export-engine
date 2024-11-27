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

@Controller('devices')
export class DeviceController {
  constructor(private readonly queryBus: QueryBus) {}

  @Version('1')
  @Get()
  @UseGuards(JwtAuthGuard, AuthorityGuard)
  @Authority('TENANT_ADMIN')
  async getDevices(@CurrentUser() user: IUser, @Query() query: GetDevicesDto) {
    return this.queryBus.execute(
      new GetDevicesQuery(
        user.tenant_id,
        query.pageSize,
        query.pageNumber,
        query.customerId,
        query.type,
      ),
    );
  }
}
