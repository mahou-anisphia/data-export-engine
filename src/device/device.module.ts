// src/device/device.module.ts
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { DeviceController } from '@/device/device.controller';
import { GetDevicesHandler } from '@/device/queries/handlers/get-devices.handler';
import { GetDeviceCountsHandler } from '@/device/queries/handlers/get-device-counts.handler';
import { GetDeviceTelemetryKeysHandler } from '@/device/queries/handlers/get-device-telemetry-keys.handler';
import { GetDevicePartitionsHandler } from '@/device/queries/handlers/get-device-partitions.handler';
import { GetDeviceLatestTelemetryHandler } from '@/device/queries/handlers/get-device-latest-telemetry.handler';
import { CassandraModule } from '@/cassandra/cassandra.module';
import { PrismaModule } from '@/prisma/prisma.module';

const QueryHandlers = [
  GetDevicesHandler,
  GetDeviceCountsHandler,
  GetDeviceTelemetryKeysHandler,
  GetDevicePartitionsHandler,
  GetDeviceLatestTelemetryHandler,
];

@Module({
  imports: [CqrsModule, PrismaModule, CassandraModule],
  controllers: [DeviceController],
  providers: [...QueryHandlers],
})
export class DeviceModule {}
