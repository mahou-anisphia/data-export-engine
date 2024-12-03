// src/device-profile/dto/device-profile-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class PaginationMeta {
  @ApiProperty({ description: 'Total number of items' })
  total: number;

  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Number of items per page' })
  limit: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages: number;
}

export class DeviceProfileResponseDto {
  @ApiProperty({ description: 'Device profile ID' })
  id: string;

  @ApiProperty({ description: 'Device profile name' })
  name: string;

  @ApiProperty({ description: 'Device profile type' })
  type: string;

  @ApiProperty({ description: 'Device profile description', required: false })
  description?: string;

  @ApiProperty({ description: 'Device profile image URL', required: false })
  image?: string;

  @ApiProperty({ description: 'Transport type', required: false })
  transport_type?: string;

  @ApiProperty({ description: 'Provision type', required: false })
  provision_type?: string;

  @ApiProperty({ description: 'Whether this is the default profile' })
  is_default: boolean;

  @ApiProperty({ description: 'Default dashboard ID', required: false })
  default_dashboard_id?: string;

  @ApiProperty({ description: 'Default queue name', required: false })
  default_queue_name?: string;

  @ApiProperty({ description: 'Creation timestamp' })
  created_time: bigint;
}

export class PaginatedDeviceProfileResponse {
  @ApiProperty({
    description: 'List of device profiles',
    type: [DeviceProfileResponseDto],
  })
  profiles: DeviceProfileResponseDto[];

  @ApiProperty({
    description: 'Pagination metadata',
    type: PaginationMeta,
  })
  pagination: PaginationMeta;
}
