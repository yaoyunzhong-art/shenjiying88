"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const tenant_contract_1 = require("./tenant.contract");
/* ------------------------------------------------------------------ */
/*  toTenantResolveContract                                             */
/* ------------------------------------------------------------------ */
(0, node_test_1.default)('toTenantResolveContract maps full context with actor', () => {
    const ctx = {
        authenticated: true,
        actor: {
            actorId: 'user-001',
            actorType: 'tenant-user',
            actorName: '张三',
            tenantId: 'tenant-abc',
            roles: ['STORE_MANAGER'],
            permissions: ['cashier.read', 'member.read'],
            authenticated: true,
            source: 'headers'
        },
        tenantContext: {
            tenantId: 'tenant-abc',
            brandId: 'brand-xyz',
            marketCode: 'zh-CN'
        },
        effectiveTenantId: 'tenant-abc',
        effectiveBrandId: 'brand-xyz',
        effectiveStoreId: 'store-001',
        effectiveMarketCode: 'zh-CN',
        roles: ['STORE_MANAGER'],
        permissions: ['cashier.read', 'member.read']
    };
    const contract = (0, tenant_contract_1.toTenantResolveContract)(ctx);
    strict_1.default.equal(contract.effectiveTenantId, 'tenant-abc');
    strict_1.default.equal(contract.effectiveBrandId, 'brand-xyz');
    strict_1.default.equal(contract.effectiveStoreId, 'store-001');
    strict_1.default.equal(contract.effectiveMarketCode, 'zh-CN');
    strict_1.default.equal(contract.source, 'tenant-module');
    strict_1.default.ok(contract.actor);
    strict_1.default.equal(contract.actor.actorId, 'user-001');
    strict_1.default.equal(contract.actor.actorType, 'tenant-user');
    strict_1.default.equal(contract.actor.actorName, '张三');
    strict_1.default.deepStrictEqual(contract.actor.roles, ['STORE_MANAGER']);
    strict_1.default.deepStrictEqual(contract.actor.permissions, ['cashier.read', 'member.read']);
    strict_1.default.equal(contract.actor.authenticated, true);
    strict_1.default.equal(contract.actor.source, 'headers');
});
(0, node_test_1.default)('toTenantResolveContract maps context with null actor (unauthenticated)', () => {
    const ctx = {
        authenticated: false,
        actor: null,
        tenantContext: {
            tenantId: 'tenant-demo',
            marketCode: 'default'
        },
        effectiveTenantId: 'tenant-demo',
        effectiveMarketCode: 'default',
        roles: [],
        permissions: []
    };
    const contract = (0, tenant_contract_1.toTenantResolveContract)(ctx);
    strict_1.default.equal(contract.effectiveTenantId, 'tenant-demo');
    strict_1.default.equal(contract.actor, null);
    strict_1.default.equal(contract.source, 'tenant-module');
    strict_1.default.equal(contract.effectiveBrandId, undefined);
    strict_1.default.equal(contract.effectiveStoreId, undefined);
});
(0, node_test_1.default)('toTenantResolveContract maps actor without name', () => {
    const ctx = {
        authenticated: true,
        actor: {
            actorId: 'svc-001',
            actorType: 'service-account',
            roles: ['SYSTEM'],
            permissions: ['health.read'],
            authenticated: true,
            source: 'headers'
        },
        tenantContext: {
            tenantId: 'tenant-svc',
            marketCode: 'en-US'
        },
        effectiveTenantId: 'tenant-svc',
        effectiveMarketCode: 'en-US',
        roles: ['SYSTEM'],
        permissions: ['health.read']
    };
    const contract = (0, tenant_contract_1.toTenantResolveContract)(ctx);
    strict_1.default.ok(contract.actor);
    strict_1.default.equal(contract.actor.actorName, undefined);
    strict_1.default.equal(contract.actor.actorId, 'svc-001');
    strict_1.default.equal(contract.actor.actorType, 'service-account');
});
/* ------------------------------------------------------------------ */
/*  toTenantContextContract                                             */
/* ------------------------------------------------------------------ */
(0, node_test_1.default)('toTenantContextContract maps full tenant context', () => {
    const ctx = {
        tenantId: 'tenant-001',
        brandId: 'brand-001',
        storeId: 'store-001',
        marketCode: 'zh-CN'
    };
    const contract = (0, tenant_contract_1.toTenantContextContract)(ctx);
    strict_1.default.equal(contract.tenantId, 'tenant-001');
    strict_1.default.equal(contract.brandId, 'brand-001');
    strict_1.default.equal(contract.storeId, 'store-001');
    strict_1.default.equal(contract.marketCode, 'zh-CN');
});
(0, node_test_1.default)('toTenantContextContract maps minimal tenant context', () => {
    const ctx = {
        tenantId: 'tenant-min',
        marketCode: 'default'
    };
    const contract = (0, tenant_contract_1.toTenantContextContract)(ctx);
    strict_1.default.equal(contract.tenantId, 'tenant-min');
    strict_1.default.equal(contract.marketCode, 'default');
    strict_1.default.equal(contract.brandId, undefined);
    strict_1.default.equal(contract.storeId, undefined);
});
/* ------------------------------------------------------------------ */
/*  toTenantActorContract                                               */
/* ------------------------------------------------------------------ */
(0, node_test_1.default)('toTenantActorContract maps valid actor', () => {
    const actor = {
        actorId: 'emp-001',
        actorType: 'employee-user',
        actorName: '李四',
        tenantId: 'tenant-abc',
        brandId: 'brand-xyz',
        storeId: 'store-001',
        roles: ['GUIDE', 'CASHIER'],
        permissions: ['game.read', 'cashier.write'],
        authenticated: true,
        source: 'headers'
    };
    const contract = (0, tenant_contract_1.toTenantActorContract)(actor);
    strict_1.default.ok(contract);
    strict_1.default.equal(contract.actorId, 'emp-001');
    strict_1.default.equal(contract.actorType, 'employee-user');
    strict_1.default.equal(contract.actorName, '李四');
    strict_1.default.deepStrictEqual(contract.roles, ['GUIDE', 'CASHIER']);
    strict_1.default.deepStrictEqual(contract.permissions, ['game.read', 'cashier.write']);
    strict_1.default.equal(contract.authenticated, true);
    strict_1.default.equal(contract.source, 'headers');
});
(0, node_test_1.default)('toTenantActorContract returns null for null input', () => {
    const contract = (0, tenant_contract_1.toTenantActorContract)(null);
    strict_1.default.equal(contract, null);
});
(0, node_test_1.default)('toTenantActorContract handles actor with empty roles/permissions', () => {
    const actor = {
        actorId: 'guest-001',
        actorType: 'platform-user',
        roles: [],
        permissions: [],
        authenticated: false,
        source: 'headers'
    };
    const contract = (0, tenant_contract_1.toTenantActorContract)(actor);
    strict_1.default.ok(contract);
    strict_1.default.equal(contract.actorId, 'guest-001');
    strict_1.default.deepStrictEqual(contract.roles, []);
    strict_1.default.deepStrictEqual(contract.permissions, []);
    strict_1.default.equal(contract.authenticated, false);
});
(0, node_test_1.default)('toTenantActorContract strips internal fields (tenantId/brandId/storeId)', () => {
    const actor = {
        actorId: 'emp-002',
        actorType: 'store-user',
        actorName: '王五',
        tenantId: 'sensitive-tenant',
        brandId: 'sensitive-brand',
        storeId: 'sensitive-store',
        roles: ['CASHIER'],
        permissions: ['receipt.write'],
        authenticated: true,
        source: 'headers'
    };
    const contract = (0, tenant_contract_1.toTenantActorContract)(actor);
    // Contract must not expose tenantId/brandId/storeId
    const keys = Object.keys(contract).sort();
    strict_1.default.deepStrictEqual(keys, [
        'actorId',
        'actorName',
        'actorType',
        'authenticated',
        'permissions',
        'roles',
        'source'
    ]);
});
/* ------------------------------------------------------------------ */
/*  toTenantScopeCheckContract                                          */
/* ------------------------------------------------------------------ */
(0, node_test_1.default)('toTenantScopeCheckContract matches all requirements', () => {
    const ctx = {
        authenticated: true,
        actor: null,
        tenantContext: { tenantId: 'tenant-abc', marketCode: 'zh-CN' },
        effectiveTenantId: 'tenant-abc',
        effectiveBrandId: 'brand-xyz',
        effectiveStoreId: 'store-001',
        effectiveMarketCode: 'zh-CN',
        roles: [],
        permissions: []
    };
    const contract = (0, tenant_contract_1.toTenantScopeCheckContract)(ctx, 'tenant-abc', 'brand-xyz', 'store-001');
    strict_1.default.equal(contract.matches, true);
    strict_1.default.equal(contract.requiredTenantId, 'tenant-abc');
    strict_1.default.equal(contract.requiredBrandId, 'brand-xyz');
    strict_1.default.equal(contract.requiredStoreId, 'store-001');
});
(0, node_test_1.default)('toTenantScopeCheckContract mismatches on tenant', () => {
    const ctx = {
        authenticated: true,
        actor: null,
        tenantContext: { tenantId: 'tenant-abc', marketCode: 'zh-CN' },
        effectiveTenantId: 'tenant-abc',
        effectiveBrandId: 'brand-xyz',
        effectiveStoreId: 'store-001',
        effectiveMarketCode: 'zh-CN',
        roles: [],
        permissions: []
    };
    const contract = (0, tenant_contract_1.toTenantScopeCheckContract)(ctx, 'tenant-xyz');
    strict_1.default.equal(contract.matches, false);
});
(0, node_test_1.default)('toTenantScopeCheckContract mismatches on brand', () => {
    const ctx = {
        authenticated: true,
        actor: null,
        tenantContext: { tenantId: 'tenant-abc', marketCode: 'zh-CN' },
        effectiveTenantId: 'tenant-abc',
        effectiveBrandId: 'brand-xyz',
        effectiveStoreId: 'store-001',
        effectiveMarketCode: 'zh-CN',
        roles: [],
        permissions: []
    };
    const contract = (0, tenant_contract_1.toTenantScopeCheckContract)(ctx, undefined, 'brand-other');
    strict_1.default.equal(contract.matches, false);
});
(0, node_test_1.default)('toTenantScopeCheckContract mismatches on store', () => {
    const ctx = {
        authenticated: true,
        actor: null,
        tenantContext: { tenantId: 'tenant-abc', marketCode: 'zh-CN' },
        effectiveTenantId: 'tenant-abc',
        effectiveBrandId: 'brand-xyz',
        effectiveStoreId: 'store-001',
        effectiveMarketCode: 'zh-CN',
        roles: [],
        permissions: []
    };
    const contract = (0, tenant_contract_1.toTenantScopeCheckContract)(ctx, undefined, undefined, 'store-999');
    strict_1.default.equal(contract.matches, false);
});
(0, node_test_1.default)('toTenantScopeCheckContract matches with partial requirements', () => {
    const ctx = {
        authenticated: true,
        actor: null,
        tenantContext: { tenantId: 'tenant-abc', marketCode: 'zh-CN' },
        effectiveTenantId: 'tenant-abc',
        effectiveBrandId: 'brand-xyz',
        effectiveStoreId: undefined,
        effectiveMarketCode: 'zh-CN',
        roles: [],
        permissions: []
    };
    // Only require tenant, no brand/store check
    const contract = (0, tenant_contract_1.toTenantScopeCheckContract)(ctx, 'tenant-abc');
    strict_1.default.equal(contract.matches, true);
});
(0, node_test_1.default)('toTenantScopeCheckContract with no requirements always matches', () => {
    const ctx = {
        authenticated: true,
        actor: null,
        tenantContext: { tenantId: 'tenant-abc', marketCode: 'zh-CN' },
        effectiveTenantId: 'tenant-abc',
        effectiveBrandId: 'brand-xyz',
        effectiveStoreId: 'store-001',
        effectiveMarketCode: 'zh-CN',
        roles: [],
        permissions: []
    };
    const contract = (0, tenant_contract_1.toTenantScopeCheckContract)(ctx);
    strict_1.default.equal(contract.matches, true);
    strict_1.default.equal(contract.requiredTenantId, undefined);
    strict_1.default.equal(contract.requiredBrandId, undefined);
    strict_1.default.equal(contract.requiredStoreId, undefined);
});
/* ------------------------------------------------------------------ */
/*  toTenantControllerResponseToContract                                */
/* ------------------------------------------------------------------ */
(0, node_test_1.default)('toTenantControllerResponseToContract maps controller response', () => {
    const response = {
        requestId: 'req-001',
        effectiveTenantId: 'tenant-abc',
        effectiveBrandId: 'brand-xyz',
        effectiveStoreId: 'store-001',
        effectiveMarketCode: 'zh-CN',
        actor: {
            actorId: 'user-001',
            actorType: 'tenant-user',
            actorName: '张三',
            roles: ['STORE_MANAGER'],
            permissions: ['cashier.read'],
            authenticated: true,
            source: 'headers'
        },
        source: 'tenant-module'
    };
    const contract = (0, tenant_contract_1.toTenantControllerResponseToContract)(response);
    strict_1.default.equal(contract.requestId, 'req-001');
    strict_1.default.equal(contract.effectiveTenantId, 'tenant-abc');
    strict_1.default.equal(contract.source, 'tenant-module');
    strict_1.default.ok(contract.actor);
    strict_1.default.equal(contract.actor.actorId, 'user-001');
});
(0, node_test_1.default)('toTenantControllerResponseToContract maps response with null actor', () => {
    const response = {
        requestId: 'req-002',
        effectiveTenantId: 'tenant-demo',
        effectiveBrandId: undefined,
        effectiveStoreId: undefined,
        effectiveMarketCode: 'default',
        actor: null,
        source: 'tenant-module'
    };
    const contract = (0, tenant_contract_1.toTenantControllerResponseToContract)(response);
    strict_1.default.equal(contract.requestId, 'req-002');
    strict_1.default.equal(contract.actor, null);
    strict_1.default.equal(contract.effectiveTenantId, 'tenant-demo');
});
(0, node_test_1.default)('toTenantControllerResponseToContract defaults source when missing', () => {
    const response = {
        effectiveTenantId: 'tenant-abc',
        actor: null
    };
    const contract = (0, tenant_contract_1.toTenantControllerResponseToContract)(response);
    strict_1.default.equal(contract.source, 'tenant-module');
    strict_1.default.equal(contract.effectiveTenantId, 'tenant-abc');
});
/* ------------------------------------------------------------------ */
/*  Contract type structural conformance                               */
/* ------------------------------------------------------------------ */
(0, node_test_1.default)('TenantResolveContract fields match expected shape', () => {
    const ctx = {
        authenticated: true,
        actor: {
            actorId: 'user-001',
            actorType: 'tenant-user',
            actorName: '张三',
            tenantId: 't1',
            roles: ['ADMIN'],
            permissions: ['all'],
            authenticated: true,
            source: 'headers'
        },
        tenantContext: { tenantId: 't1', marketCode: 'zh-CN' },
        effectiveTenantId: 't1',
        effectiveMarketCode: 'zh-CN',
        roles: ['ADMIN'],
        permissions: ['all']
    };
    const contract = (0, tenant_contract_1.toTenantResolveContract)(ctx);
    const keys = Object.keys(contract).sort();
    // requestId is optional and only present when context has it
    strict_1.default.ok(keys.includes('actor'));
    strict_1.default.ok(keys.includes('effectiveTenantId'));
    strict_1.default.ok(keys.includes('effectiveMarketCode'));
    strict_1.default.ok(keys.includes('source'));
});
(0, node_test_1.default)('TenantContextContract fields match expected shape', () => {
    const ctx = { tenantId: 't1', marketCode: 'zh-CN' };
    const contract = (0, tenant_contract_1.toTenantContextContract)(ctx);
    const keys = Object.keys(contract).sort();
    strict_1.default.deepStrictEqual(keys, ['brandId', 'marketCode', 'storeId', 'tenantId']);
});
(0, node_test_1.default)('TenantScopeCheckContract fields match expected shape', () => {
    const ctx = {
        authenticated: true,
        actor: null,
        tenantContext: { tenantId: 't1', marketCode: 'zh-CN' },
        effectiveTenantId: 't1',
        effectiveMarketCode: 'zh-CN',
        roles: [],
        permissions: []
    };
    const contract = (0, tenant_contract_1.toTenantScopeCheckContract)(ctx);
    const keys = Object.keys(contract).sort();
    strict_1.default.deepStrictEqual(keys, [
        'effectiveBrandId',
        'effectiveStoreId',
        'effectiveTenantId',
        'matches',
        'requiredBrandId',
        'requiredStoreId',
        'requiredTenantId'
    ]);
});
//# sourceMappingURL=tenant.contract.test.js.map