import { Module } from '@nestjs/common'
import { PrismaModule } from '../../prisma/prisma.module'
import { FinanceController } from './finance.controller'
import { FinanceService } from './finance.service'
import {
  ReconciliationService,
  ReconciliationCron,
  WeChatReconciliationAdapter,
  AlipayReconciliationAdapter
} from './reconciliation'

/**
 * FinanceModule · 财务模块
 *
 * 包含:
 *  - FinanceService / FinanceController: 财务基础 CRUD (DR-38)
 *  - ReconciliationService: T+1 对账核心 (P1-2.4)
 *  - ReconciliationCron: T+1 2am 调度 (P1-2.5, 重入锁 + 异常隔离)
 *  - WeChatReconciliationAdapter: 微信资金账单 (P1-2.2)
 *  - AlipayReconciliationAdapter: 支付宝账单 (P1-2.3, MVP stub)
 */
@Module({
  imports: [PrismaModule],
  controllers: [FinanceController],
  providers: [
    FinanceService,
    ReconciliationService,
    ReconciliationCron,
    WeChatReconciliationAdapter,
    AlipayReconciliationAdapter
  ],
  exports: [
    FinanceService,
    ReconciliationService,
    ReconciliationCron
  ]
})
export class FinanceModule {}
