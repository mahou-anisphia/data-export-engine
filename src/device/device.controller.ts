// src/device/device.controller.ts
import {
  Controller,
  Get,
  Query,
  UseGuards,
  Version,
  Param,
} from '@nestjs/common';
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
import { GetDeviceTelemetryKeysQuery } from '@/device/queries/impl/get-device-telemetry-keys.query';
import { DeviceTelemetryKeysDto } from '@/device/dto/device-telemetry-keys.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { GetDevicePartitionsQuery } from '@/device/queries/impl/get-device-partitions.query';
import {
  GetDevicePartitionsDto,
  DevicePartitionsResponseDto,
} from '@/device/dto/get-device-partitions.dto';
import { GetDeviceLatestTelemetryQuery } from '@/device/queries/impl/get-device-latest-telemetry.query';
import { DeviceLatestTelemetryDto } from '@/device/dto/device-latest-telemetry.dto';

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

  @Version('1')
  @Get(':deviceId/telemetry-keys')
  @UseGuards(JwtAuthGuard, AuthorityGuard)
  @Authority('TENANT_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get device telemetry keys' })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved device telemetry keys',
    type: DeviceTelemetryKeysDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Device not found',
  })
  async getDeviceTelemetryKeys(
    @CurrentUser() user: IUser,
    @Param('deviceId') deviceId: string,
  ): Promise<DeviceTelemetryKeysDto> {
    return this.queryBus.execute(
      new GetDeviceTelemetryKeysQuery(user.tenant_id, deviceId),
    );
  }

  @Version('1')
  @Get(':deviceId/partitions')
  @UseGuards(JwtAuthGuard, AuthorityGuard)
  @Authority('TENANT_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get device telemetry partitions' })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved device partitions',
    type: DevicePartitionsResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Device not found',
  })
  async getDevicePartitions(
    @CurrentUser() user: IUser,
    @Param('deviceId') deviceId: string,
    @Query() query: GetDevicePartitionsDto,
  ): Promise<DevicePartitionsResponseDto> {
    return this.queryBus.execute(
      new GetDevicePartitionsQuery(user.tenant_id, deviceId, query.keys),
    );
  }

  @Version('1')
  @Get(':deviceId/latest-telemetry')
  @UseGuards(JwtAuthGuard, AuthorityGuard)
  @Authority('TENANT_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get device latest telemetry values' })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved device latest telemetry',
    type: DeviceLatestTelemetryDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Device not found',
  })
  async getDeviceLatestTelemetry(
    @CurrentUser() user: IUser,
    @Param('deviceId') deviceId: string,
  ): Promise<DeviceLatestTelemetryDto> {
    return this.queryBus.execute(
      new GetDeviceLatestTelemetryQuery(user.tenant_id, deviceId),
    );
  }
}
