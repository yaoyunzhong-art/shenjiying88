/**
 * E2E 跨模块 #13 — 日清结算: 1 天营业周期端到端
 *
 * 链路 (一个完整营业日):
 *   09:00  开班:  createAccount(现金) → 录入期初余额
 *   09:30 营业:  recordTransactionRevenue (订单 1)        +¥5000
 *   10:15 营业:  recordTransactionRevenue (订单 2)        +¥3000
 *   11:00 营业:  recordTransactionRevenue (订单 3)        +¥8000
 *   14:30 退款:  recordTransactionRefund (订单 2 部分退)   -¥1000
 *   16:00 营业:  recordTransactionRevenue (订单 4)        +¥12000
 *   17:30 报销:  recordLedger(type=Expense) 物业水电       -¥500
 *   20:00 关班:  createSettlement → confirmSettlement
 *   20:30 报表:  getSettlementDetail → listSettlements
 *
 * 验证:
 *   - 当日 ledger 总数 = 6 (4 收入 + 1 退款 + 1 支出)
 *   - 结算 totalRevenue = 28000, totalExpense = 500, netProfit = 27500
 *   - confirmSettlement 后 settlementStatus = CONFIRMED
 *   - 多日连续结算: 每天的 settlement 互不干扰
 *   - 对账异常: disputeSettlement 进入 DISPUTED 状态
 *   - 跨租户: tenant-A 日清不影响 tenant-B 数据
 */
import 'reflect-metadata';
//# sourceMappingURL=cross-module-e2e-13-daily-settlement.test.d.ts.map