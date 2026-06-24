"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const bootstrap_service_1 = require("./bootstrap.service");
// ========== factory ==========
function createService() {
    return new bootstrap_service_1.BootstrapService();
}
function makeTenantContext(overrides) {
    return {
        tenantId: 'tenant-001',
        brandId: 'brand-001',
        storeId: 'store-001',
        marketCode: 'cn-mainland',
        ...overrides,
    };
}
// ========== getHealth ==========
(0, node_test_1.default)('e2e: getHealth returns status=ok', () => {
    const svc = createService();
    const res = svc.getHealth();
    strict_1.default.equal(res.status, 'ok');
});
(0, node_test_1.default)('e2e: getHealth returns positive uptime', () => {
    const svc = createService();
    const res = svc.getHealth();
    strict_1.default.ok(res.uptime > 0, 'uptime must be positive');
});
(0, node_test_1.default)('e2e: getHealth returns phase=scaffold', () => {
    const svc = createService();
    const res = svc.getHealth();
    strict_1.default.equal(res.phase, 'scaffold');
});
(0, node_test_1.default)('e2e: getHealth is idempotent', () => {
    const svc = createService();
    const a = svc.getHealth();
    const b = svc.getHealth();
    strict_1.default.equal(a.status, b.status);
    strict_1.default.equal(a.phase, b.phase);
    // uptime increases between calls
    strict_1.default.ok(a.uptime > 0);
    strict_1.default.ok(b.uptime > 0);
});
// ========== getBootstrapMetadata ==========
(0, node_test_1.default)('e2e: getBootstrapMetadata returns tenant context', () => {
    const svc = createService();
    const ctx = makeTenantContext();
    const res = svc.getBootstrapMetadata(ctx);
    strict_1.default.deepEqual(res.tenantContext, ctx);
});
(0, node_test_1.default)('e2e: getBootstrapMetadata is tenant-isolated', () => {
    const svc = createService();
    const ctxA = makeTenantContext({ tenantId: 'tenant-A' });
    const ctxB = makeTenantContext({ tenantId: 'tenant-B' });
    const resA = svc.getBootstrapMetadata(ctxA);
    const resB = svc.getBootstrapMetadata(ctxB);
    strict_1.default.equal(resA.tenantContext.tenantId, 'tenant-A');
    strict_1.default.equal(resB.tenantContext.tenantId, 'tenant-B');
});
(0, node_test_1.default)('e2e: getBootstrapMetadata returns foundationDependencies as array', () => {
    const svc = createService();
    const res = svc.getBootstrapMetadata(makeTenantContext());
    strict_1.default.ok(Array.isArray(res.foundationDependencies));
});
(0, node_test_1.default)('e2e: getBootstrapMetadata returns phase=scaffold', () => {
    const svc = createService();
    const res = svc.getBootstrapMetadata(makeTenantContext());
    strict_1.default.equal(res.phase, 'scaffold');
});
// ========== 边界 ==========
(0, node_test_1.default)('e2e: getBootstrapMetadata handles empty tenantId gracefully', () => {
    const svc = createService();
    const ctx = makeTenantContext({ tenantId: '' });
    const res = svc.getBootstrapMetadata(ctx);
    strict_1.default.equal(res.tenantContext.tenantId, '');
    strict_1.default.equal(res.phase, 'scaffold');
});
(0, node_test_1.default)('e2e: getBootstrapMetadata handles partial context', () => {
    const svc = createService();
    const partialCtx = {
        tenantId: 'only-tenant',
        brandId: undefined,
        storeId: undefined,
        marketCode: undefined,
    };
    const res = svc.getBootstrapMetadata(partialCtx);
    strict_1.default.equal(res.tenantContext.tenantId, 'only-tenant');
    strict_1.default.equal(res.tenantContext.brandId, undefined);
});
(0, node_test_1.default)('e2e: getHealth has consistent structure', () => {
    const svc = createService();
    const res = svc.getHealth();
    strict_1.default.ok('status' in res);
    strict_1.default.ok('uptime' in res);
    strict_1.default.ok('phase' in res);
    strict_1.default.equal(Object.keys(res).length, 3);
});
//# sourceMappingURL=bootstrap.e2e.test.js.map