"use strict";
/**
 * TenantController 单元测试 (node:test)
 *
 * 策略：用内联 Controller（模拟 NestJS 装饰器行为）测试 resolveTenant 核心业务逻辑。
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
// ── Inline Controller (mirrors source: tenant.controller.ts) ────
class TenantController {
    resolveTenant(req) {
        const { tenantContext, actorContext, governanceContext } = req;
        const effectiveTenantId = actorContext?.tenantId ?? tenantContext?.tenantId ?? 'tenant-demo';
        return {
            requestId: governanceContext?.requestId,
            effectiveTenantId,
            effectiveBrandId: actorContext?.brandId ?? tenantContext?.brandId,
            effectiveStoreId: actorContext?.storeId ?? tenantContext?.storeId,
            effectiveMarketCode: tenantContext?.marketCode,
            actor: actorContext
                ? {
                    actorId: actorContext.actorId,
                    actorType: actorContext.actorType,
                    actorName: actorContext.actorName,
                    roles: actorContext.roles,
                    permissions: actorContext.permissions,
                    authenticated: actorContext.authenticated,
                }
                : null,
            source: 'tenant-module',
        };
    }
}
// ── Helper ──────────────────────────────────────────────────────
function buildReq(overrides = {}) {
    return {
        tenantContext: {},
        actorContext: undefined,
        governanceContext: {},
        ...overrides,
    };
}
// ── Tests ───────────────────────────────────────────────────────
(0, node_test_1.describe)('TenantController', () => {
    const controller = new TenantController();
    (0, node_test_1.describe)('resolveTenant()', () => {
        (0, node_test_1.test)('returns source "tenant-module"', () => {
            const req = buildReq();
            const result = controller.resolveTenant(req);
            strict_1.default.strictEqual(result.source, 'tenant-module');
        });
        (0, node_test_1.test)('uses tenantContext.tenantId when no actorContext.tenantId', () => {
            const req = buildReq({
                tenantContext: { tenantId: 't-ctx' },
            });
            const result = controller.resolveTenant(req);
            strict_1.default.strictEqual(result.effectiveTenantId, 't-ctx');
        });
        (0, node_test_1.test)('prefers actorContext.tenantId over tenantContext.tenantId', () => {
            const req = buildReq({
                actorContext: { tenantId: 't-actor' },
                tenantContext: { tenantId: 't-ctx' },
            });
            const result = controller.resolveTenant(req);
            strict_1.default.strictEqual(result.effectiveTenantId, 't-actor');
        });
        (0, node_test_1.test)('falls back to "tenant-demo" when no tenantId is set anywhere', () => {
            const req = buildReq();
            const result = controller.resolveTenant(req);
            strict_1.default.strictEqual(result.effectiveTenantId, 'tenant-demo');
        });
        (0, node_test_1.test)('forwards governanceContext.requestId', () => {
            const req = buildReq({
                governanceContext: { requestId: 'req-123' },
            });
            const result = controller.resolveTenant(req);
            strict_1.default.strictEqual(result.requestId, 'req-123');
        });
        (0, node_test_1.test)('prefers actorContext.brandId over tenantContext.brandId', () => {
            const req = buildReq({
                actorContext: { brandId: 'b-actor' },
                tenantContext: { brandId: 'b-ctx' },
            });
            const result = controller.resolveTenant(req);
            strict_1.default.strictEqual(result.effectiveBrandId, 'b-actor');
        });
        (0, node_test_1.test)('effectiveBrandId is undefined when neither context provides it', () => {
            const req = buildReq();
            const result = controller.resolveTenant(req);
            strict_1.default.strictEqual(result.effectiveBrandId, undefined);
        });
        (0, node_test_1.test)('prefers actorContext.storeId over tenantContext.storeId', () => {
            const req = buildReq({
                actorContext: { storeId: 's-actor' },
                tenantContext: { storeId: 's-ctx' },
            });
            const result = controller.resolveTenant(req);
            strict_1.default.strictEqual(result.effectiveStoreId, 's-actor');
        });
        (0, node_test_1.test)('effectiveMarketCode comes from tenantContext', () => {
            const req = buildReq({
                tenantContext: { marketCode: 'zh-cn' },
            });
            const result = controller.resolveTenant(req);
            strict_1.default.strictEqual(result.effectiveMarketCode, 'zh-cn');
        });
        (0, node_test_1.test)('returns full actor details when actorContext is present', () => {
            const req = buildReq({
                actorContext: {
                    actorId: 'u-1',
                    actorType: 'member',
                    actorName: 'Alice',
                    roles: ['admin'],
                    permissions: ['read', 'write'],
                    authenticated: true,
                },
            });
            const result = controller.resolveTenant(req);
            strict_1.default.deepStrictEqual(result.actor, {
                actorId: 'u-1',
                actorType: 'member',
                actorName: 'Alice',
                roles: ['admin'],
                permissions: ['read', 'write'],
                authenticated: true,
            });
        });
        (0, node_test_1.test)('returns null actor when actorContext is undefined', () => {
            const req = buildReq();
            const result = controller.resolveTenant(req);
            strict_1.default.strictEqual(result.actor, null);
        });
        (0, node_test_1.test)('returns undefined requestId when governanceContext is empty', () => {
            const req = buildReq();
            const result = controller.resolveTenant(req);
            strict_1.default.strictEqual(result.requestId, undefined);
        });
    });
});
//# sourceMappingURL=tenant.controller.spec.js.map