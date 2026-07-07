// auto-rollback.module.ts - Phase-19 T27
import { Module } from '@nestjs/common'
import { AutoRollbackController } from './auto-rollback.controller'
import { AutoRollbackService } from './auto-rollback.service'

@Module({
  controllers: [AutoRollbackController],
  providers: [AutoRollbackService],
  exports: [AutoRollbackService],
})
export class AutoRollbackModule {}
