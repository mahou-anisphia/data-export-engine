// src/auth/auth.controller.ts
import {
  Controller,
  Post,
  Get,
  UseGuards,
  Body,
  Version,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { LoginDto } from './dto/login.dto';

import { LoginCommand } from './commands/impl/login.command';

import { GetUserQuery } from './queries/impl/get-user.query';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthorityGuard } from './guards/authority.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { IUser } from './interfaces/user.interface';
import { Authority } from 'src/common/decorators/authority.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Version('1')
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.commandBus.execute(
      new LoginCommand(loginDto.email, loginDto.password),
    );
  }

  @Version('1')
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() user: IUser) {
    return this.queryBus.execute(new GetUserQuery(user.id));
  }

  @Version('1')
  @Get('admin')
  @UseGuards(JwtAuthGuard, AuthorityGuard)
  @Authority('TENANT_ADMIN')
  async adminOnly(@CurrentUser() user: IUser) {
    return { message: 'Admin access granted', userId: user.id };
  }
}
