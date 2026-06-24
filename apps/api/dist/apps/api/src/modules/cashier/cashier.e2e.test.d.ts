/**
 * E2E: Cashier 收银台 HTTP 链路
 *
 * 链路:
 *   HTTP → TenantContext 中间件 → TestController → CashierService → MemberService / LoyaltyService
 *
 * 验证:
 *   - 订单 CRUD (create/get/list)
 *   - 订单创建校验 (member 必须存在 / items 非空 / tenant 一致)
 *   - 支付创建 + 状态机 (Created → PendingPayment → Paid / PaymentFailed)
 *   - 标准化支付回调 (succeeded → settlePaidOrder 联动 loyalty points / coupons)
 *   - 标准化支付回调 (failed → settleFailedOrder)
 *   - 订单关闭 (manual close / timeout close / 已支付订单不可关闭)
 *   - 跨租户访问拒绝
 */
import 'reflect-metadata';
//# sourceMappingURL=cashier.e2e.test.d.ts.map