import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from '@/auth/auth.controller';
import { AuthService } from '@/auth/auth.service';
import { LoginHandler } from '@/auth/commands/handlers/login.handler';
import { GetUserHandler } from '@/auth/queries/handlers/get-user.handler';
import { GetUserCountHandler } from '@/auth/queries/handlers/get-user-count.handler';
import { GetUsersHandler } from '@/auth/queries/handlers/get-users.handler';
import { JwtStrategy } from '@/auth/strategies/jwt.strategies';

const CommandHandlers = [LoginHandler];
const QueryHandlers = [GetUserHandler, GetUserCountHandler, GetUsersHandler];
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
