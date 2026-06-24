/**
 * E2E 跨模块 #7 — 收银台 → 财务 → SVIP 升级联动
 *
 * 链路:
 *   HTTP → TestController
 *     → MemberService.register (前置准备)
 *     → CashierService.createOrder + createPayment + applyPaymentCallback(succeeded)
 *       · 发布 cashier.order-created / cashier.payment-created / cashier.payment-succeeded 事件
 *       · 联动 LoyaltyService.settlePaidOrder → 积分入账
 *     → FinanceService.recordTransactionRevenue → 财务流水 (使用 cashier 产出的 orderId/transactionId)
 *     → SvipService.checkAndAutoUpgrade → 累计消费触发升级
 *
 * 验证:
 *   - 订单/支付状态机: Created → PendingPayment → Paid
 *   - 事件总线 publishEvent 被正确调用 (cashier 端)
 *   - 财务 ledger 含正确 orderId/transactionId/type=Revenue
 *   - SVIP 自动升级触发: 累计消费 >= Level1 阈值
 *   - 财务 + SVIP 跨租户隔离 (Tenant B 看不到 Tenant A 数据)
 *   - 退款链路: payment-failed → Refund ledger → SVIP 不升级
 */
import 'reflect-metadata';
//# sourceMappingURL=cross-module-e2e-7-payment-ledger-svip.test.d.ts.map