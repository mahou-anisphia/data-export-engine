import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginHandler } from './commands/handlers/login.handler';
import { GetUserHandler } from './queries/handlers/get-user.handler';
import { JwtStrategy } from './strategies/jwt.strategies';

const CommandHandlers = [LoginHandler];
const QueryHandlers = [GetUserHandler];

@Module({
  imports: [
    CqrsModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.SECRET_KEY || 'alternate-secret',
      signOptions: {
        expiresIn: process.env.JWT_EXPIRATION || '1h',
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, ...CommandHandlers, ...QueryHandlers],
  exports: [JwtStrategy, PassportModule],
})
export class AuthModule {}
