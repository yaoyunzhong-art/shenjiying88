// session.module.ts · 会话管理模块
// Phase-FP P10 · 2026-07-08

import { Module } from '@nestjs/common'
import { SessionController } from './session.controller'
import { SessionService } from './session.service'

@Module({
  controllers: [SessionController],
  providers: [SessionService],
  exports: [SessionService],
})
export class SessionModule {}
