// notice.module.ts · 公告通知模块
// Phase V23 · 2026-07-21

import { Module } from '@nestjs/common'
import { NoticeController } from './notice.controller'
import { NoticeService } from './notice.service'

@Module({
  controllers: [NoticeController],
  providers: [NoticeService],
  exports: [NoticeService],
})
export class NoticeModule {}
