import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { DeviceModule } from './device/device.module';
import { DeviceProfileModule } from './device-profile/device-profile.module';

@Module({
  imports: [PrismaModule, AuthModule, DeviceModule, DeviceProfileModule],
})
export class AppModule {}
