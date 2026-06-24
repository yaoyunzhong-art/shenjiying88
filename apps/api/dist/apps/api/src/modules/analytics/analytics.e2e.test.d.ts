/**
 * E2E: Analytics 诊断 / 快照 / 推荐 HTTP 链路
 *
 * 链路:
 *   HTTP → TenantContext 中间件 → TestController → AnalyticsService → LoyaltyService (可选)
 *
 * 验证:
 *   - OperationSnapshot 聚合订单 / 积分 / 券 / 盲盒指标
 *   - Diagnostics 规则触发 (no-settlement / payment-success-low / quota-near-exhaustion / blindbox-shortfall)
 *   - Recommendations 按 priority 降序
 *   - 多 scope (TENANT / BRAND / STORE) 输入派生
 *   - 空数据时给出 fallback (settlement=0 → no-settlement 触发)
 */
import 'reflect-metadata';
//# sourceMappingURL=analytics.e2e.test.d.ts.map