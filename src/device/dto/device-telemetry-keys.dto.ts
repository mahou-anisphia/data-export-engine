import { ApiProperty } from '@nestjs/swagger';

export class DeviceTelemetryKeysDto {
  @ApiProperty({ description: 'Device ID' })
  deviceId: string;

  @ApiProperty({ description: 'List of telemetry keys', type: [String] })
  keys: string[];
}
