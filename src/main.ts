import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import { BigIntInterceptor } from './common/interceptors/bigint.interceptors';
//import { CqrsExceptionFilter } from './common/filters/cqrs-exception.filter';
dotenv.config();
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix('api');

  // Enable versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalInterceptors(new BigIntInterceptor());
  // app.useGlobalFilters(new CqrsExceptionFilter());
  app.enableCors();

  await app.listen(50060);
}
bootstrap();
