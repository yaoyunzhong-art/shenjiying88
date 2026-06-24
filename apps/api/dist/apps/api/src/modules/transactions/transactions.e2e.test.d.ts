/**
 * E2E: Transactions 交易流水 HTTP 链路
 *
 * 链路:
 *   HTTP → TenantContext → TestController → TransactionsService → CashierService / LoyaltyService
 *
 * 验证:
 *   - 标准化支付回调持久化订单事务
 *   - 退款请求 (requestRefund) → 状态机 (Pending → Approved → Settled)
 *   - 退款拒绝 (reject) → 状态 Rejected
 *   - 退款 dashboard 聚合
 *   - 会员事务时间线
 *   - 跨租户访问拒绝
 *   - 按类型 / 日期范围过滤
 *   - 分页
 *   - 交易统计
 *   - 批量多行交易
 *   - 跨租户隔离
 *   - 不存在交易 404
 */
import 'reflect-metadata';
//# sourceMappingURL=transactions.e2e.test.d.ts.map