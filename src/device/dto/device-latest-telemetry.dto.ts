import { ApiProperty } from '@nestjs/swagger';

export class TelemetryValue {
  @ApiProperty({ description: 'The telemetry key name' })
  key: string;

  @ApiProperty({ description: 'The telemetry value' })
  value: string | number | boolean;

  @ApiProperty({ description: 'The timestamp of the telemetry value' })
  ts: number;
}

export class DeviceLatestTelemetryDto {
  @ApiProperty({
    type: [TelemetryValue],
    description: 'Array of latest telemetry values',
  })
  telemetry: TelemetryValue[];
}
