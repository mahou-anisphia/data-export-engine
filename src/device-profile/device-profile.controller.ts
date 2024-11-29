// src/device-profile/device-profile.controller.ts
import { Controller, Get, Query, UseGuards, Version } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { GetDeviceProfilesQuery } from './queries/impl/get-device-profiles.query';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthorityGuard } from '../auth/guards/authority.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Authority } from '../common/decorators/authority.decorator';
import { IUser } from '../auth/interfaces/user.interface';
import { GetDeviceProfilesDto } from './dto/get-device-profiles.dto';
import { DeviceProfileResponseDto } from './dto/device-profile-response.dto';
import { GetProfileCountsQuery } from './queries/impl/get-device-profile-counts.query';

@Controller('device-profiles')
export class DeviceProfileController {
  constructor(private readonly queryBus: QueryBus) {}

  @Version('1')
  @Get()
  @UseGuards(JwtAuthGuard, AuthorityGuard)
  @Authority('TENANT_ADMIN')
  async getDeviceProfiles(
    @CurrentUser() user: IUser,
    @Query() query: GetDeviceProfilesDto,
  ): Promise<DeviceProfileResponseDto[]> {
    return this.queryBus.execute(
      new GetDeviceProfilesQuery(user.tenant_id, query.type),
    );
  }
  @Version('1')
  @Get('count')
  @UseGuards(JwtAuthGuard, AuthorityGuard)
  @Authority('TENANT_ADMIN')
  async getProfileCounts(@CurrentUser() user: IUser) {
    return this.queryBus.execute(new GetProfileCountsQuery(user.tenant_id));
  }
}
