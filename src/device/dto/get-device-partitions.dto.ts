import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetDevicePartitionsDto {
  @ApiProperty({
    description:
      'List of telemetry keys to get partitions for. Can be comma-separated string or array.',
    example: 'temperature,humidity',
  })
  @Transform(({ value }) => {
    // If it's already an array, return it
    if (Array.isArray(value)) return value;
    // If it's a string, split by comma
    if (typeof value === 'string') return value.split(',');
    // Otherwise return empty array
    return [];
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  keys: string[];
}

export class DevicePartitionDto {
  @ApiProperty({ description: 'Telemetry key' })
  key: string;

  @ApiProperty({ description: 'Partition value' })
  partition: number;
}

export class DevicePartitionsResponseDto {
  @ApiProperty({ description: 'Device ID' })
  deviceId: string;

  @ApiProperty({
    description: 'List of key-partition pairs',
    type: [DevicePartitionDto],
  })
  partitions: DevicePartitionDto[];
}
