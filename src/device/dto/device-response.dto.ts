import { ApiProperty } from '@nestjs/swagger';

export class DeviceProfileDto {
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

  @ApiProperty({ description: 'Default dashboard ID', required: false })
  default_dashboard_id?: string;
}

export class DeviceDto {
  @ApiProperty({ description: 'Device ID' })
  id: string;

  @ApiProperty({ description: 'Device name', required: false })
  name?: string;

  @ApiProperty({ description: 'Device label', required: false })
  label?: string;

  @ApiProperty({ description: 'Device type', required: false })
  type?: string;

  @ApiProperty({ description: 'Device creation timestamp' })
  created_time: bigint;

  @ApiProperty({ description: 'Customer ID', required: false })
  customer_id?: string;

  @ApiProperty({ description: 'Device profile information' })
  device_profile: DeviceProfileDto;
}

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

export class PaginatedDeviceResponse {
  @ApiProperty({ description: 'List of devices', type: [DeviceDto] })
  devices: DeviceDto[];

  @ApiProperty({ description: 'Pagination metadata', type: PaginationMeta })
  pagination: PaginationMeta;
}
