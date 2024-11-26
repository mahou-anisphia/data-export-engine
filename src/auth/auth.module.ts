// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { LoginHandler } from './commands/handlers/login.handler';
import { CreateUserHandler } from './commands/handlers/create-user.handler';

const CommandHandlers = [LoginHandler, CreateUserHandler];

@Module({
  imports: [
    CqrsModule,
    JwtModule.register({
      secret: process.env.SECRET_KEY, // In production, use environment variables
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [AuthController],
  providers: [...CommandHandlers],
})
export class AuthModule {}
