import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthService } from './health.service'
import { DatabaseBackupService } from './database-backup.service';
import { LytModule } from '../lyt/lyt.module';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [LytModule, PrismaModule],
  controllers: [HealthController],
  providers: [HealthService, DatabaseBackupService],
  exports: [HealthService, DatabaseBackupService]
})
export class HealthModule {}
