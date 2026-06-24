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
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importStar(require("node:test"));
const tenant_service_1 = require("./tenant.service");
function makeTenantContext(overrides = {}) {
    return {
        tenantId: 't-1',
        marketCode: 'cn-mainland',
        ...overrides
    };
}
function makeActorContext(overrides = {}) {
    return {
        actorId: 'user-1',
        actorType: 'tenant-user',
        actorName: 'Test User',
        roles: ['admin'],
        permissions: ['read'],
        authenticated: true,
        source: 'headers',
        ...overrides
    };
}
function makeGovernanceContext(overrides = {}) {
    return {
        requestId: 'req-1',
        startedAt: Date.now(),
        ...overrides
    };
}
(0, node_test_1.describe)('TenantService.resolveTenantContext()', () => {
    const tenantService = new tenant_service_1.TenantService();
    (0, node_test_1.default)('merges actor and tenant contexts correctly', () => {
        const result = tenantService.resolveTenantContext(makeTenantContext({ tenantId: 't-1', brandId: undefined, storeId: undefined }), makeActorContext({ tenantId: undefined, brandId: 'b-1', storeId: undefined }), makeGovernanceContext({ requestId: 'req-1' }));
        strict_1.default.equal(result.authenticated, true);
        strict_1.default.equal(result.effectiveTenantId, 't-1');
        strict_1.default.equal(result.effectiveBrandId, 'b-1');
        strict_1.default.equal(result.effectiveStoreId, undefined);
        strict_1.default.equal(result.effectiveMarketCode, 'cn-mainland');
        strict_1.default.ok(result.actor);
        strict_1.default.equal(result.actor?.actorId, 'user-1');
        strict_1.default.equal(result.actor?.actorType, 'tenant-user');
        strict_1.default.deepStrictEqual(result.roles, ['admin']);
        strict_1.default.deepStrictEqual(result.permissions, ['read']);
    });
    (0, node_test_1.default)('returns null actor when no actor context', () => {
        const result = tenantService.resolveTenantContext(makeTenantContext({ tenantId: 't-2', marketCode: 'us-default' }), undefined, makeGovernanceContext({ requestId: 'req-2' }));
        strict_1.default.equal(result.authenticated, false);
        strict_1.default.equal(result.effectiveTenantId, 't-2');
        strict_1.default.equal(result.effectiveMarketCode, 'us-default');
        strict_1.default.equal(result.actor, null);
        strict_1.default.deepStrictEqual(result.roles, []);
        strict_1.default.deepStrictEqual(result.permissions, []);
    });
    (0, node_test_1.default)('falls back to default tenant when no tenant info', () => {
        const result = tenantService.resolveTenantContext(makeTenantContext({ tenantId: undefined }), undefined);
        strict_1.default.equal(result.effectiveTenantId, 'tenant-demo');
        strict_1.default.equal(result.effectiveMarketCode, 'cn-mainland');
    });
    (0, node_test_1.default)('falls back to default marketCode when not provided', () => {
        const result = tenantService.resolveTenantContext({ tenantId: 't-3' }, undefined);
        strict_1.default.equal(result.effectiveMarketCode, 'default');
    });
    (0, node_test_1.default)('actor tenant takes priority over context tenant', () => {
        const result = tenantService.resolveTenantContext(makeTenantContext({ tenantId: 't-ctx' }), makeActorContext({ tenantId: 't-actor' }));
        strict_1.default.equal(result.effectiveTenantId, 't-actor');
    });
    (0, node_test_1.default)('actor brand and store override tenant context', () => {
        const result = tenantService.resolveTenantContext(makeTenantContext({ brandId: 'b-ctx', storeId: 's-ctx' }), makeActorContext({ brandId: 'b-actor', storeId: 's-actor' }));
        strict_1.default.equal(result.effectiveBrandId, 'b-actor');
        strict_1.default.equal(result.effectiveStoreId, 's-actor');
    });
    (0, node_test_1.default)('actor without roles/permissions defaults to empty arrays', () => {
        const result = tenantService.resolveTenantContext(makeTenantContext(), makeActorContext({
            roles: undefined,
            permissions: undefined
        }));
        strict_1.default.deepStrictEqual(result.roles, []);
        strict_1.default.deepStrictEqual(result.permissions, []);
    });
    (0, node_test_1.default)('actor with tenantId preserves other fields', () => {
        const result = tenantService.resolveTenantContext(makeTenantContext(), makeActorContext({ tenantId: 't-x', storeId: 's-5' }));
        strict_1.default.equal(result.effectiveTenantId, 't-x');
        strict_1.default.equal(result.effectiveStoreId, 's-5');
        strict_1.default.ok(result.actor);
        strict_1.default.equal(result.actor?.storeId, 's-5');
    });
});
//# sourceMappingURL=tenant.service.test.js.map