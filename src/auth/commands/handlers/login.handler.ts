import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UnauthorizedException } from '@nestjs/common';
import { LoginCommand } from '@/auth/commands/impl/login.command';
import { PrismaService } from '@/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@CommandHandler(LoginCommand)
export class LoginHandler implements ICommandHandler<LoginCommand> {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async execute(command: LoginCommand) {
    const { email, password } = command;

    const user = await this.prisma.tb_user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const credentials = await this.prisma.user_credentials.findUnique({
      where: { user_id: user.id },
    });

    if (!credentials || !credentials.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      credentials.password,
    );

    if (!isPasswordValid) {
      const additionalInfo = JSON.parse(
        user.additional_info || '{"failedLoginAttempts": 0}',
      );
      additionalInfo.failedLoginAttempts =
        (additionalInfo.failedLoginAttempts || 0) + 1;

      await this.prisma.tb_user.update({
        where: { id: user.id },
        data: {
          additional_info: JSON.stringify(additionalInfo),
        },
      });

      throw new UnauthorizedException('Invalid credentials');
    }

    const now = Date.now();
    await this.prisma.tb_user.update({
      where: { id: user.id },
      data: {
        additional_info: JSON.stringify({
          failedLoginAttempts: 0,
          lastLoginTs: now,
        }),
      },
    });

    const payload = {
      sub: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      authority: user.authority,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
      },
    };
  }
}
