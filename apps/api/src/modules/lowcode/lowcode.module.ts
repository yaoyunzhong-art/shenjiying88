/**
 * LowcodeModule · 低代码页面构建器模块
 * 提供页面创建、组件管理、审计告警能力
 */

import { Module } from '@nestjs/common'
import { LowCodePageBuilder, AuditAlertService } from './lowcode-audit.service'
import { LowcodePageController } from './lowcode-page.controller'

@Module({
  controllers: [LowcodePageController],
  providers: [
    LowCodePageBuilder,
    AuditAlertService,
  ],
  exports: [
    LowCodePageBuilder,
    AuditAlertService,
  ],
})
export class LowcodeModule {}
