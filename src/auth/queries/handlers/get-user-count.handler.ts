// src/auth/queries/handlers/get-user-count.handler.ts
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from '../../../prisma/prisma.service';
import { GetUserCountQuery } from '../impl/get-user-count.query';

@QueryHandler(GetUserCountQuery)
export class GetUserCountHandler implements IQueryHandler<GetUserCountQuery> {
  constructor(private prisma: PrismaService) {}

  async execute() {
    const count = await this.prisma.tb_user.count();
    return { count };
  }
}
