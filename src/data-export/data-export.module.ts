import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { DataExportController } from './data-export.controller';
import { ExportDeviceDataHandler } from '@/data-export/queries/handlers/export-device-data.handler';
import { PrismaModule } from '@/prisma/prisma.module';
import { CassandraModule } from '@/cassandra/cassandra.module';

const QueryHandlers = [ExportDeviceDataHandler];

@Module({
  imports: [CqrsModule, PrismaModule, CassandraModule],
  controllers: [DataExportController],
  providers: [...QueryHandlers],
})
export class DataExportModule {}
