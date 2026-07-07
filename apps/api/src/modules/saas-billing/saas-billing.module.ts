/**
 * SaaS 计费模块
 *
 * 提供套餐管理、订阅管理、配额监控、计费与账单、试用管理功能。
 */

import { Module } from '@nestjs/common'
import { SaaSBillingController } from './saas-billing.controller'
import { SaaSBillingService } from './saas-billing.service'

@Module({
  controllers: [SaaSBillingController],
  providers: [SaaSBillingService],
  exports: [SaaSBillingService],
})
export class SaaSBillingModule {}
