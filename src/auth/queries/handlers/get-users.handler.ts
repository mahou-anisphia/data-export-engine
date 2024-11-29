// src/auth/queries/handlers/get-users.handler.ts
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetUsersQuery } from '../impl/get-users.query';
import { PrismaService } from '../../../prisma/prisma.service';

@QueryHandler(GetUsersQuery)
export class GetUsersHandler implements IQueryHandler<GetUsersQuery> {
  constructor(private prisma: PrismaService) {}

  async execute(query: GetUsersQuery) {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.tb_user.findMany({
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          first_name: true,
          last_name: true,
          phone: true,
          created_time: true,
          additional_info: true,
        },
        orderBy: {
          created_time: 'desc',
        },
      }),
      this.prisma.tb_user.count(),
    ]);

    const formattedUsers = users.map((user) => ({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      createdTime: user.created_time.toString(),
      additionalInfo: user.additional_info,
    }));

    return {
      users: formattedUsers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
