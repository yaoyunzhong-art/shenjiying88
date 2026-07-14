import { Module } from '@nestjs/common'
import { PrismaModule } from '../../prisma/prisma.module'
import { FinanceController } from './finance.controller'
import { FinanceService } from './finance.service'
import {
  ReconciliationService as ReconService,
  ReconciliationCron,
  WeChatReconciliationAdapter,
  AlipayReconciliationAdapter
} from './reconciliation'
import { ReconciliationService } from './reconciliation.service'
import { ReconciliationController } from './reconciliation.controller'

/**
 * FinanceModule · 财务模块
 *
 * 包含:
 *  - FinanceService / FinanceController: 财务基础 CRUD (DR-38)
 *  - (reconciliation/) ReconciliationService: T+1 对账核心 (P1-2.4)
 *  - ReconciliationCron: T+1 2am 调度 (P1-2.5, 重入锁 + 异常隔离)
 *  - (root) ReconciliationService:  通用对账匹配引擎 (订单号/金额/日期)
 *  - (root) ReconciliationController: 对账 REST API
 *  - WeChatReconciliationAdapter: 微信资金账单 (P1-2.2)
 *  - AlipayReconciliationAdapter: 支付宝账单 (P1-2.3, MVP stub)
 */
@Module({
  imports: [PrismaModule],
  controllers: [FinanceController, ReconciliationController],
  providers: [
    FinanceService,
    ReconService,
    ReconciliationService,
    ReconciliationCron,
    WeChatReconciliationAdapter,
    AlipayReconciliationAdapter
  ],
  exports: [
    FinanceService,
    ReconService,
    ReconciliationService,
    ReconciliationCron
  ]
})
export class FinanceModule {}
