import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { DeviceModule } from './device/device.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { BigIntInterceptor } from './common/interceptors/bigint.interceptors';
import { DeviceProfileModule } from './device-profile/device-profile.module';
import { DataExportModule } from './data-export/data-export.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    DeviceModule,
    DeviceProfileModule,
    DataExportModule,
  ],
  providers: [{ provide: APP_INTERCEPTOR, useClass: BigIntInterceptor }],
})
export class AppModule {}
