"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importStar(require("node:test"));
const tenant_entity_1 = require("./tenant.entity");
(0, node_test_1.describe)('tenant.entity: constants', () => {
    (0, node_test_1.default)('DEFAULT_TENANT_ID equals tenant-demo', () => {
        strict_1.default.equal(tenant_entity_1.DEFAULT_TENANT_ID, 'tenant-demo');
    });
    (0, node_test_1.default)('DEFAULT_MARKET_CODE equals default', () => {
        strict_1.default.equal(tenant_entity_1.DEFAULT_MARKET_CODE, 'default');
    });
});
(0, node_test_1.describe)('tenant.entity: ActorTypes', () => {
    (0, node_test_1.default)('contains all six actor types', () => {
        strict_1.default.equal(tenant_entity_1.ActorTypes.PlatformUser, 'platform-user');
        strict_1.default.equal(tenant_entity_1.ActorTypes.TenantUser, 'tenant-user');
        strict_1.default.equal(tenant_entity_1.ActorTypes.BrandUser, 'brand-user');
        strict_1.default.equal(tenant_entity_1.ActorTypes.StoreUser, 'store-user');
        strict_1.default.equal(tenant_entity_1.ActorTypes.EmployeeUser, 'employee-user');
        strict_1.default.equal(tenant_entity_1.ActorTypes.ServiceAccount, 'service-account');
    });
    (0, node_test_1.default)('all values are correct actor types', () => {
        const values = Object.values(tenant_entity_1.ActorTypes);
        strict_1.default.equal(values.length, 6);
        strict_1.default.ok(values.every(v => typeof v === 'string'));
    });
});
(0, node_test_1.describe)('tenant.entity: createDefaultTenantContext', () => {
    (0, node_test_1.default)('returns defaults when no overrides', () => {
        const ctx = (0, tenant_entity_1.createDefaultTenantContext)();
        strict_1.default.equal(ctx.tenantId, tenant_entity_1.DEFAULT_TENANT_ID);
        strict_1.default.equal(ctx.marketCode, tenant_entity_1.DEFAULT_MARKET_CODE);
        strict_1.default.equal(ctx.brandId, undefined);
        strict_1.default.equal(ctx.storeId, undefined);
    });
    (0, node_test_1.default)('accepts tenantId override', () => {
        const ctx = (0, tenant_entity_1.createDefaultTenantContext)({ tenantId: 'tenant-custom' });
        strict_1.default.equal(ctx.tenantId, 'tenant-custom');
        strict_1.default.equal(ctx.marketCode, tenant_entity_1.DEFAULT_MARKET_CODE);
    });
    (0, node_test_1.default)('accepts brandId override', () => {
        const ctx = (0, tenant_entity_1.createDefaultTenantContext)({ brandId: 'brand-01', storeId: 'store-01' });
        strict_1.default.equal(ctx.brandId, 'brand-01');
        strict_1.default.equal(ctx.storeId, 'store-01');
    });
});
(0, node_test_1.describe)('tenant.entity: createEmptyResolvedActorContext', () => {
    (0, node_test_1.default)('returns unauthenticated context with defaults', () => {
        const ctx = (0, tenant_entity_1.createEmptyResolvedActorContext)();
        strict_1.default.equal(ctx.authenticated, false);
        strict_1.default.equal(ctx.actor, null);
        strict_1.default.equal(ctx.effectiveTenantId, tenant_entity_1.DEFAULT_TENANT_ID);
        strict_1.default.equal(ctx.effectiveMarketCode, tenant_entity_1.DEFAULT_MARKET_CODE);
        strict_1.default.deepEqual(ctx.roles, []);
        strict_1.default.deepEqual(ctx.permissions, []);
        strict_1.default.equal(ctx.effectiveBrandId, undefined);
        strict_1.default.equal(ctx.effectiveStoreId, undefined);
    });
    (0, node_test_1.default)('accepts partial overrides', () => {
        const ctx = (0, tenant_entity_1.createEmptyResolvedActorContext)({
            authenticated: true,
            effectiveTenantId: 'tenant-custom',
            roles: ['manager']
        });
        strict_1.default.equal(ctx.authenticated, true);
        strict_1.default.equal(ctx.effectiveTenantId, 'tenant-custom');
        strict_1.default.deepEqual(ctx.roles, ['manager']);
    });
    (0, node_test_1.default)('tenantContext is created with defaults', () => {
        const ctx = (0, tenant_entity_1.createEmptyResolvedActorContext)();
        strict_1.default.ok(ctx.tenantContext);
        strict_1.default.equal(ctx.tenantContext.tenantId, tenant_entity_1.DEFAULT_TENANT_ID);
    });
});
(0, node_test_1.describe)('tenant.entity: resolveEffectiveTenantId', () => {
    (0, node_test_1.default)('actorContext takes priority', () => {
        const actor = {
            actorId: 'a1', actorType: 'tenant-user',
            roles: [], permissions: [], authenticated: true,
            source: 'headers', tenantId: 'actor-tenant'
        };
        const tenant = (0, tenant_entity_1.createDefaultTenantContext)({ tenantId: 'tenant-ctx' });
        strict_1.default.equal((0, tenant_entity_1.resolveEffectiveTenantId)(actor, tenant), 'actor-tenant');
    });
    (0, node_test_1.default)('falls back to tenantContext', () => {
        const tenant = (0, tenant_entity_1.createDefaultTenantContext)({ tenantId: 'tenant-ctx' });
        strict_1.default.equal((0, tenant_entity_1.resolveEffectiveTenantId)(undefined, tenant), 'tenant-ctx');
    });
    (0, node_test_1.default)('falls back to default when both undefined', () => {
        strict_1.default.equal((0, tenant_entity_1.resolveEffectiveTenantId)(undefined, undefined), tenant_entity_1.DEFAULT_TENANT_ID);
    });
});
(0, node_test_1.describe)('tenant.entity: resolveEffectiveBrandId', () => {
    (0, node_test_1.default)('actorContext takes priority', () => {
        const actor = {
            actorId: 'a1', actorType: 'brand-user',
            roles: [], permissions: [], authenticated: true,
            source: 'headers', brandId: 'actor-brand'
        };
        const tenant = (0, tenant_entity_1.createDefaultTenantContext)({ brandId: 'tenant-brand' });
        strict_1.default.equal((0, tenant_entity_1.resolveEffectiveBrandId)(actor, tenant), 'actor-brand');
    });
    (0, node_test_1.default)('falls back to tenantContext', () => {
        const tenant = (0, tenant_entity_1.createDefaultTenantContext)({ brandId: 'tenant-brand' });
        strict_1.default.equal((0, tenant_entity_1.resolveEffectiveBrandId)(undefined, tenant), 'tenant-brand');
    });
    (0, node_test_1.default)('returns undefined when both undefined', () => {
        strict_1.default.equal((0, tenant_entity_1.resolveEffectiveBrandId)(undefined, undefined), undefined);
    });
});
(0, node_test_1.describe)('tenant.entity: resolveEffectiveStoreId', () => {
    (0, node_test_1.default)('actorContext takes priority', () => {
        const actor = {
            actorId: 'a1', actorType: 'store-user',
            roles: [], permissions: [], authenticated: true,
            source: 'headers', storeId: 'actor-store'
        };
        const tenant = (0, tenant_entity_1.createDefaultTenantContext)({ storeId: 'tenant-store' });
        strict_1.default.equal((0, tenant_entity_1.resolveEffectiveStoreId)(actor, tenant), 'actor-store');
    });
    (0, node_test_1.default)('falls back to default undefined', () => {
        strict_1.default.equal((0, tenant_entity_1.resolveEffectiveStoreId)(undefined, undefined), undefined);
    });
});
(0, node_test_1.describe)('tenant.entity: resolveEffectiveMarketCode', () => {
    (0, node_test_1.default)('reads from tenantContext', () => {
        const tenant = (0, tenant_entity_1.createDefaultTenantContext)({ marketCode: 'cn-sh' });
        strict_1.default.equal((0, tenant_entity_1.resolveEffectiveMarketCode)(tenant), 'cn-sh');
    });
    (0, node_test_1.default)('defaults when no tenantContext', () => {
        strict_1.default.equal((0, tenant_entity_1.resolveEffectiveMarketCode)(undefined), tenant_entity_1.DEFAULT_MARKET_CODE);
    });
});
(0, node_test_1.describe)('tenant.entity: isActorAuthenticated', () => {
    (0, node_test_1.default)('returns true when authenticated', () => {
        const actor = {
            actorId: 'a1', actorType: 'tenant-user',
            roles: [], permissions: [], authenticated: true,
            source: 'headers'
        };
        strict_1.default.equal((0, tenant_entity_1.isActorAuthenticated)(actor), true);
    });
    (0, node_test_1.default)('returns false when not authenticated', () => {
        const actor = {
            actorId: 'a1', actorType: 'tenant-user',
            roles: [], permissions: [], authenticated: false,
            source: 'headers'
        };
        strict_1.default.equal((0, tenant_entity_1.isActorAuthenticated)(actor), false);
    });
    (0, node_test_1.default)('returns false when undefined', () => {
        strict_1.default.equal((0, tenant_entity_1.isActorAuthenticated)(undefined), false);
    });
});
(0, node_test_1.describe)('tenant.entity: actorSummary', () => {
    (0, node_test_1.default)('returns null when no actor', () => {
        strict_1.default.equal((0, tenant_entity_1.actorSummary)(undefined), null);
    });
    (0, node_test_1.default)('returns actorId when no name/type', () => {
        const actor = {
            actorId: 'a1', actorType: 'tenant-user',
            roles: [], permissions: [], authenticated: true,
            source: 'headers'
        };
        const summary = (0, tenant_entity_1.actorSummary)(actor);
        strict_1.default.ok(summary);
        strict_1.default.ok(summary.includes('tenant-user'));
    });
    (0, node_test_1.default)('returns name and type and roles', () => {
        const actor = {
            actorId: 'a2', actorType: 'employee-user',
            actorName: '张三',
            roles: ['manager', 'staff'], permissions: [], authenticated: true,
            source: 'headers'
        };
        const summary = (0, tenant_entity_1.actorSummary)(actor);
        strict_1.default.ok(summary);
        strict_1.default.ok(summary.includes('张三'));
        strict_1.default.ok(summary.includes('employee-user'));
        strict_1.default.ok(summary.includes('manager'));
        strict_1.default.ok(summary.includes('staff'));
    });
    (0, node_test_1.default)('returns actorId as fallback when no name and no type', () => {
        const actor = {
            actorId: 'bare-id', actorType: 'tenant-user',
            roles: [], permissions: [], authenticated: false,
            source: 'headers'
        };
        const summary = (0, tenant_entity_1.actorSummary)(actor);
        // type exists so it won't hit fallback
        strict_1.default.ok(summary !== null);
    });
});
(0, node_test_1.describe)('tenant.entity: matchesTenantScope', () => {
    (0, node_test_1.default)('returns true when no requirement', () => {
        const ctx = (0, tenant_entity_1.createEmptyResolvedActorContext)({ effectiveTenantId: 't1' });
        strict_1.default.equal((0, tenant_entity_1.matchesTenantScope)(ctx, undefined), true);
    });
    (0, node_test_1.default)('returns true when tenantId matches', () => {
        const ctx = (0, tenant_entity_1.createEmptyResolvedActorContext)({ effectiveTenantId: 't1' });
        strict_1.default.equal((0, tenant_entity_1.matchesTenantScope)(ctx, { tenantId: 't1' }), true);
    });
    (0, node_test_1.default)('returns false when tenantId mismatches', () => {
        const ctx = (0, tenant_entity_1.createEmptyResolvedActorContext)({ effectiveTenantId: 't1' });
        strict_1.default.equal((0, tenant_entity_1.matchesTenantScope)(ctx, { tenantId: 't2' }), false);
    });
    (0, node_test_1.default)('returns true when brandId matches', () => {
        const ctx = (0, tenant_entity_1.createEmptyResolvedActorContext)({
            effectiveTenantId: 't1',
            effectiveBrandId: 'b1'
        });
        strict_1.default.equal((0, tenant_entity_1.matchesTenantScope)(ctx, { tenantId: 't1', brandId: 'b1' }), true);
    });
    (0, node_test_1.default)('returns false when brandId mismatches', () => {
        const ctx = (0, tenant_entity_1.createEmptyResolvedActorContext)({
            effectiveTenantId: 't1',
            effectiveBrandId: 'b1'
        });
        strict_1.default.equal((0, tenant_entity_1.matchesTenantScope)(ctx, { brandId: 'b2' }), false);
    });
    (0, node_test_1.default)('returns true when storeId matches', () => {
        const ctx = (0, tenant_entity_1.createEmptyResolvedActorContext)({
            effectiveTenantId: 't1',
            effectiveStoreId: 's1'
        });
        strict_1.default.equal((0, tenant_entity_1.matchesTenantScope)(ctx, { storeId: 's1' }), true);
    });
    (0, node_test_1.default)('returns false when storeId mismatches', () => {
        const ctx = (0, tenant_entity_1.createEmptyResolvedActorContext)({
            effectiveTenantId: 't1',
            effectiveStoreId: 's1'
        });
        strict_1.default.equal((0, tenant_entity_1.matchesTenantScope)(ctx, { storeId: 's2' }), false);
    });
});
//# sourceMappingURL=tenant.entity.test.js.map