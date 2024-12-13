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
  Res,
} from '@nestjs/common';
import { Response } from 'express';
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
import { FileFormat } from '@/data-export/dto/device-export-request.dto'; // Update import path

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
    @Res() res: Response,
  ): Promise<void> {
    try {
      const stream = await this.queryBus.execute(
        new ExportDeviceDataQuery(user.tenant_id, deviceId, exportRequest),
      );

      // Set appropriate headers based on file format
      let contentType: string;
      let filename = `device-${deviceId}-export-${Date.now()}`;

      switch (exportRequest.fileFormat) {
        case FileFormat.XLSX:
          contentType =
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          filename += '.xlsx';
          break;
        case FileFormat.CSV:
          contentType = 'text/csv';
          filename += '.csv';
          break;
        case FileFormat.JSON:
          contentType = 'application/json';
          filename += '.json';
          break;
        default:
          contentType = 'application/octet-stream';
          filename += '.bin';
      }

      res.set({
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
      });

      // Pipe the stream to the response
      stream.pipe(res);

      // Handle stream errors
      stream.on('error', (error) => {
        if (!res.headersSent) {
          res.status(500).json({
            message: error.message || 'Export failed',
          });
        }
      });
    } catch (error) {
      // Only send error response if headers haven't been sent
      if (!res.headersSent) {
        res.status(500).json({
          message: error.message || 'Export failed',
        });
      }
    }
  }
}
