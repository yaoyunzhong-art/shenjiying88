/**
 * E2E: Loyalty Coupon/Blindbox 计划 HTTP 链路
 *
 * 链路:
 *   HTTP → TenantContext 中间件 → Test 包装 Controller → LoyaltyService → in-memory store
 *
 * 验证:
 *   - Coupon plan register / list / get / status 完整 CRUD
 *   - Blindbox plan register / list / get / status 完整 CRUD
 *   - Issue 端点的 quota / perMemberLimit / 状态守卫
 *   - Tenant scope 隔离
 */
import 'reflect-metadata';
//# sourceMappingURL=loyalty-plan.e2e.test.d.ts.map