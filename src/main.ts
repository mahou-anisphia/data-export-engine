import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
// import { BigIntInterceptor } from './common/interceptors/bigint.interceptors';
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

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Nordlicht ThingsBoard Extension API')
    .setDescription('API documentation for ThingsBoard Extension')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'access-token', // This is the key we'll use in @ApiBearerAuth() decorator
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  // app.useGlobalInterceptors(new BigIntInterceptor());
  // app.useGlobalFilters(new CqrsExceptionFilter());
  app.enableCors();

  await app.listen(50060);
}
bootstrap();
