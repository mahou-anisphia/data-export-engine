// src/data-export/data-export.controller.ts
import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  Version,
  StreamableFile,
  ParseUUIDPipe,
} from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { AuthorityGuard } from '@/auth/guards/authority.guard';
import { Authority } from '@/common/decorators/authority.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { IUser } from '@/auth/interfaces/user.interface';
import { DeviceExportRequestDto } from './dto/device-export-request.dto';
import { ExportDeviceDataQuery } from './queries/impl/export-device-data.query';

@ApiTags('Data Export')
@Controller('data-export')
export class DataExportController {
  constructor(private readonly queryBus: QueryBus) {}

  @Version('1')
  @Post('device/:deviceId')
  @UseGuards(JwtAuthGuard, AuthorityGuard)
  @Authority('TENANT_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Export device telemetry data' })
  @ApiParam({
    name: 'deviceId',
    type: String,
    description: 'UUID of the device',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully exported device data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'Device not found',
  })
  async exportDeviceData(
    @CurrentUser() user: IUser,
    @Param('deviceId', ParseUUIDPipe) deviceId: string,
    @Body() exportRequest: DeviceExportRequestDto,
  ): Promise<StreamableFile> {
    return this.queryBus.execute(
      new ExportDeviceDataQuery(user.tenant_id, deviceId, exportRequest),
    );
  }
}
