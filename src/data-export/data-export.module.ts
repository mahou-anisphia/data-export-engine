import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { DataExportController } from './data-export.controller';
import { ExportDeviceDataHandler } from '@/data-export/queries/handlers/export-device-data.handler';
import { PrismaModule } from '@/prisma/prisma.module';
import { CassandraModule } from '@/cassandra/cassandra.module';
import { DataService } from '@/data-export/services/data.service';
import { TimeService } from '@/data-export/services/time.service';
import { NullService } from '@/data-export/services/null.service';
import { FormatService } from '@/data-export/services/format.service';

const QueryHandlers = [ExportDeviceDataHandler];
const Services = [DataService, TimeService, NullService, FormatService];

@Module({
  imports: [CqrsModule, PrismaModule, CassandraModule],
  controllers: [DataExportController],
  providers: [...QueryHandlers, ...Services],
})
export class DataExportModule {}
