/**
 * E2E-level: Bootstrap 启动引导 service 层测试
 *
 * 链路:
 *   BootstrapService.getHealth() → { status, uptime, phase }
 *   BootstrapService.getBootstrapMetadata() → { tenantContext, foundationDependencies, ... }
 *
 * 验证:
 *   - getHealth 返回正确状态和 uptime
 *   - uptime 为正数
 *   - phase 为 'scaffold'
 *   - getBootstrapMetadata 返回租户上下文和依赖
 *   - 不同租户参数返回不同 tenantContext
 *   - foundationDependencies 为数组
 *   - 幂等性: 多次调用 getHealth 一致
 *   - getHealth 返回 status=ok
 *   - getBootstrapMetadata 中 foundationContracts 为数组
 */
export {};
//# sourceMappingURL=bootstrap.e2e.test.d.ts.map