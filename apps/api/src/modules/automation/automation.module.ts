/**
 * automation.module.ts — 自动化规则引擎 Module
 *
 * 提供自动化规则管理、工作流控制、任务管理能力。
 */

import { Module } from '@nestjs/common'
import { AutomationController } from './automation.controller'
import { AutomationService } from './automation.service'

@Module({
  controllers: [AutomationController],
  providers: [AutomationService],
  exports: [AutomationService],
})
export class AutomationModule {}
