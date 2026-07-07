import { Module } from '@nestjs/common'
import { FinancePaymentController } from './finance-payment.controller'
import { FinancePaymentService } from './finance-payment.service'
import { FinancePaymentCron } from './finance-payment.cron'

/**
 * Phase-38 T168: FinancePaymentModule (Payment + Refund)
 *
 * 不影响 Phase-6 FinanceModule (Ledger/Account/Settlement/Invoice)
 * 路由前缀 /api/finance/payments + /api/finance/refunds (与 /api/finance/ledger 并存)
 *
 * 联动:
 *  - PaymentService.setLedgerCallback(cb) 注入 Ledger 联动
 *  - Phase-46 接 Bull Queue 后改为异步回调
 */

@Module({
  controllers: [FinancePaymentController],
  providers: [FinancePaymentService, FinancePaymentCron],
  exports: [FinancePaymentService]
})
export class FinancePaymentModule {}
