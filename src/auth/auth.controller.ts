// src/auth/auth.controller.ts
import {
  Controller,
  Post,
  Get,
  UseGuards,
  Body,
  Version,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { LoginDto } from '@/auth/dto/login.dto';
import { GetUsersDto } from '@/auth/dto/get-users.dto';
import { LoginCommand } from '@/auth/commands/impl/login.command';
import { GetUserQuery } from '@/auth/queries/impl/get-user.query';
import { GetUserCountQuery } from '@/auth/queries/impl/get-user-count.query';
import { GetUsersQuery } from '@/auth/queries/impl/get-users.query';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { AuthorityGuard } from '@/auth/guards/authority.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Authority } from '@/common/decorators/authority.decorator';
import { IUser } from '@/auth/interfaces/user.interface';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Version('1')
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully logged in',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid credentials',
  })
  async login(@Body() loginDto: LoginDto) {
    return this.commandBus.execute(
      new LoginCommand(loginDto.email, loginDto.password),
    );
  }

  @Version('1')
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User profile retrieved successfully',
  })
  async getProfile(@CurrentUser() user: IUser) {
    return this.queryBus.execute(new GetUserQuery(user.id));
  }

  @Version('1')
  @Get('admin')
  @UseGuards(JwtAuthGuard, AuthorityGuard)
  @Authority('TENANT_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin only endpoint' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Admin access granted',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions',
  })
  async adminOnly(@CurrentUser() user: IUser) {
    return { message: 'Admin access granted', userId: user.id };
  }

  @Version('1')
  @Get('users/count')
  @UseGuards(JwtAuthGuard, AuthorityGuard)
  @Authority('TENANT_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get total user count' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User count retrieved successfully',
  })
  async getUserCount() {
    return this.queryBus.execute(new GetUserCountQuery());
  }

  @Version('1')
  @Get('users')
  @UseGuards(JwtAuthGuard, AuthorityGuard)
  @Authority('TENANT_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get paginated user list' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Users retrieved successfully',
  })
  async getUsers(@Query() query: GetUsersDto) {
    return this.queryBus.execute(
      new GetUsersQuery(query.pageNumber, query.pageSize),
    );
  }
}
