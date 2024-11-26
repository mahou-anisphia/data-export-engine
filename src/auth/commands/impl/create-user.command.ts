import { CreateUserDto } from 'src/auth/dto/create-user.dto';

export class CreateUserCommand {
  constructor(public readonly createUserDto: CreateUserDto) {}
}
