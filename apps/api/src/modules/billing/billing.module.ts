/**
 * billing.module.ts — 计费结算 Module
 *
 * 提供账单计算、折扣应用、发票管理、支付查询等计费能力。
 */

import { Module } from '@nestjs/common'
import { BillingController } from './billing.controller'
import { BillingService } from './billing.service'

@Module({
  controllers: [BillingController],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}
