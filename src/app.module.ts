import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { DeviceModule } from './device/device.module';

@Module({
  imports: [PrismaModule, AuthModule, DeviceModule],
})
export class AppModule {}
