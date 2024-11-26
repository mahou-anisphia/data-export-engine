import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateUserCommand } from '../impl/create-user.command';
import { PrismaService } from '../../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand> {
  constructor(private prisma: PrismaService) {}

  async execute(command: CreateUserCommand) {
    const { createUserDto } = command;
    const { email, password, firstName, lastName, phone } = createUserDto;

    // Check if user already exists
    const existingUser = await this.prisma.tb_user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      // Create user transaction
      const result = await this.prisma.$transaction(async (prisma) => {
        // Create user
        const userId = uuidv4();
        const user = await prisma.tb_user.create({
          data: {
            id: userId,
            email,
            first_name: firstName,
            last_name: lastName,
            phone,
            created_time: Date.now(),
            additional_info: JSON.stringify({
              failedLoginAttempts: 0,
              lastLoginTs: null,
            }),
          },
        });

        // Create user credentials
        await prisma.user_credentials.create({
          data: {
            id: uuidv4(),
            user_id: user.id,
            password: hashedPassword,
            created_time: Date.now(),
            enabled: true,
          },
        });

        return user;
      });

      return {
        id: result.id,
        email: result.email,
        firstName: result.first_name,
        lastName: result.last_name,
        message: 'User created successfully',
      };
    } catch (error) {
      throw new InternalServerErrorException('Error creating user');
    }
  }
}
