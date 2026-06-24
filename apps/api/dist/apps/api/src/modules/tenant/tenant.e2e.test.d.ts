/**
 * E2E: Tenant 租户上下文 HTTP 链路
 *
 * 链路:
 *   HTTP → attachTenantContext → TestController (TenantController.resolveTenant)
 *
 * 验证:
 *   - 租户上下文从 headers 解析
 *   - 默认 fallback (缺 headers 时)
 *   - 跨租户隔离
 *   - 不同 marketCode 传递
 */
import 'reflect-metadata';
//# sourceMappingURL=tenant.e2e.test.d.ts.map