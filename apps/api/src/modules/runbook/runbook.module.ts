// runbook.module.ts - 运维手册模块
import { Module } from '@nestjs/common'
import { RunbookController } from './runbook.controller'
import { RunbookService } from './runbook.service'

@Module({
  controllers: [RunbookController],
  providers: [RunbookService],
  exports: [RunbookService],
})
export class RunbookModule {}
