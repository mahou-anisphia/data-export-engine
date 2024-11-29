// src/device-profile/device-profile.module.ts
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { DeviceProfileController } from './device-profile.controller';
import { GetDeviceProfilesHandler } from './queries/handlers/get-device-profiles.handler';
import { PrismaModule } from '../prisma/prisma.module';
import { GetProfileCountsHandler } from './queries/handlers/get-device-profile-counts.handler';

const QueryHandlers = [GetDeviceProfilesHandler, GetProfileCountsHandler];

@Module({
  imports: [CqrsModule, PrismaModule],
  controllers: [DeviceProfileController],
  providers: [...QueryHandlers],
})
export class DeviceProfileModule {}
