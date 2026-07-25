/**
 * cashier-transaction.module.ts — 收银流水持久化模块
 *
 * Day6 创新任务: 基于 persistence.service.spec.ts 实现
 */

import { Module } from '@nestjs/common'
import { CashierTransactionPersistenceService } from './persistence.service'
import { CashierTransactionController } from './transaction.controller'

@Module({
  controllers: [CashierTransactionController],
  providers: [CashierTransactionPersistenceService],
  exports: [CashierTransactionPersistenceService],
})
export class CashierTransactionModule {}
