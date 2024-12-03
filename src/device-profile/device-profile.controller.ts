// src/device-profile/device-profile.controller.ts
import { Controller, Get, Query, UseGuards, Version } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { GetDeviceProfilesQuery } from '@/device-profile/queries/impl/get-device-profiles.query';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { AuthorityGuard } from '@/auth/guards/authority.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Authority } from '@/common/decorators/authority.decorator';
import { IUser } from '@/auth/interfaces/user.interface';
import { GetDeviceProfilesDto } from '@/device-profile/dto/get-device-profiles.dto';
import { PaginatedDeviceProfileResponse } from '@/device-profile/dto/device-profile-response.dto';
import { GetProfileCountsQuery } from '@/device-profile/queries/impl/get-device-profile-counts.query';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('Device Profiles')
@Controller('device-profiles')
export class DeviceProfileController {
  constructor(private readonly queryBus: QueryBus) {}

  @Version('1')
  @Get()
  @UseGuards(JwtAuthGuard, AuthorityGuard)
  @Authority('TENANT_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get paginated list of device profiles' })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved device profiles',
    type: PaginatedDeviceProfileResponse,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getDeviceProfiles(
    @CurrentUser() user: IUser,
    @Query() query: GetDeviceProfilesDto,
  ): Promise<PaginatedDeviceProfileResponse> {
    return this.queryBus.execute(
      new GetDeviceProfilesQuery(
        user.tenant_id,
        query.pageSize,
        query.pageNumber,
        query.type,
      ),
    );
  }

  @Version('1')
  @Get('count')
  @UseGuards(JwtAuthGuard, AuthorityGuard)
  @Authority('TENANT_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get device profile counts and breakdowns' })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved device profile counts',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getProfileCounts(@CurrentUser() user: IUser) {
    return this.queryBus.execute(new GetProfileCountsQuery(user.tenant_id));
  }
}
