/**
 * LowcodeModule · 低代码页面构建器模块
 * 提供页面创建、组件管理、审计告警能力
 */

import { Module } from '@nestjs/common'
import { LowCodePageBuilder, AuditAlertService } from './lowcode-audit.service'
import { LowcodePageController } from './lowcode-page.controller'
import { LowcodeController } from './lowcode.controller'
import { LowcodeService } from './lowcode.service'

@Module({
  controllers: [LowcodePageController, LowcodeController],
  providers: [
    LowCodePageBuilder,
    AuditAlertService,
    LowcodeService,
  ],
  exports: [
    LowCodePageBuilder,
    AuditAlertService,
    LowcodeService,
  ],
})
export class LowcodeModule {}
