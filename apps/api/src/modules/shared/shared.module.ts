/**
 * shared.module.ts - Phase-34
 * 用途: 共享模块 (审计, 租户校验, 跨租户安全)
 * 关联: shared.controller.ts, audit.service.ts, view-model.service.ts, tenant-validator.ts
 */

import { Module, Global } from '@nestjs/common'
import { SharedController } from './shared.controller'
import { AuditService } from './audit.service'
import { ViewModelService } from './view-model.service'
import { AgentModule } from '../agent/agent.module'

/**
 * SharedModule
 *
 * Global 模块 - 提供全局可用的审计/租户校验服务
 * 同时暴露 REST API 用于 Admin 审计查询
 */
@Global()
@Module({
  imports: [AgentModule],
  controllers: [SharedController],
  providers: [AuditService, ViewModelService],
  exports: [AuditService, ViewModelService],
})
export class SharedModule {}
