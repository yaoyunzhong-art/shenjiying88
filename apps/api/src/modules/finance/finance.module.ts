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
import { FinanceReconciliationReportService } from './reconciliation/finance-reconciliation-report.service'
import { StorePAndLService, BrandPAndLService } from './finance-dashboard.service'
import { CostAnalysisService, CashFlowService } from './finance-cost-cash-flow.service'
import { FinanceSettlementCron } from './finance-settlement.cron'
import { FinanceSettlementController } from './finance-settlement.controller'
import { FinanceHealthDashboardController } from './finance-health-dashboard.controller'

/**
 * FinanceModule · 财务模块
 *
 * 包含:
 *  - FinanceService / FinanceController: 财务基础 CRUD (DR-38)
 *  - StorePAndLService / BrandPAndLService: 门店+品牌级损益 (T111-2)
 *  - CostAnalysisService: 费用分析面板(分类+环比同比) (P-38 100%)
 *  - CashFlowService: 现金流追踪(流入流出+日余额) (P-38 100%)
 *  - FinanceHealthDashboardController: 仪表盘 API (cost/cashflow)
 *  - (reconciliation/) ReconciliationService: T+1 对账核心 (P1-2.4)
 *  - ReconciliationCron: T+1 2am 调度 (P1-2.5, 重入锁 + 异常隔离)
 *  - (root) ReconciliationService:  通用对账匹配引擎 (订单号/金额/日期)
 *  - (root) ReconciliationController: 对账 REST API (含月度报表)
 *  - FinanceReconciliationReportService: 月度对账报表 + CSV 导出 (P-38 100%)
 *  - WeChatReconciliationAdapter: 微信资金账单 (P1-2.2)
 *  - AlipayReconciliationAdapter: 支付宝账单 (P1-2.3, MVP stub)
 */
@Module({
  imports: [PrismaModule],
  controllers: [
    FinanceController,
    ReconciliationController,
    FinanceHealthDashboardController,
    FinanceSettlementController
  ],
  providers: [
    FinanceService,
    StorePAndLService,
    BrandPAndLService,
    CostAnalysisService,
    CashFlowService,
    ReconService,
    ReconciliationService,
    ReconciliationCron,
    FinanceReconciliationReportService,
    FinanceSettlementCron,
    WeChatReconciliationAdapter,
    AlipayReconciliationAdapter
  ],
  exports: [
    FinanceService,
    ReconService,
    ReconciliationService,
    ReconciliationCron,
    FinanceReconciliationReportService,
    FinanceSettlementCron
  ]
})
export class FinanceModule {}
