// src/device/device.controller.ts
import { Controller, Get, Query, UseGuards, Version } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { GetDevicesQuery } from '@/device/queries/impl/get-devices.query';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { AuthorityGuard } from '@/auth/guards/authority.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Authority } from '@/common/decorators/authority.decorator';
import { IUser } from '@/auth/interfaces/user.interface';
import { GetDevicesDto } from '@/device/dto/get-devices.dto';
import { PaginatedDeviceResponse } from '@/device/dto/device-response.dto';
import { GetDeviceCountsQuery } from '@/device/queries/impl/get-device-counts.query';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('Devices')
@Controller('devices')
export class DeviceController {
  constructor(private readonly queryBus: QueryBus) {}

  @Version('1')
  @Get()
  @UseGuards(JwtAuthGuard, AuthorityGuard)
  @Authority('TENANT_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get paginated list of devices' })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved devices',
    type: PaginatedDeviceResponse,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
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
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get device counts and breakdowns' })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved device counts',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getDeviceCounts(
    @CurrentUser() user: IUser,
    @Query('customerId') customerId?: string,
  ) {
    return this.queryBus.execute(
      new GetDeviceCountsQuery(user.tenant_id, customerId),
    );
  }
}
