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
// Ensure types are importable and structurally sound
const types = require('./tenant.types');
(0, node_test_1.describe)('tenant types', () => {
    (0, node_test_1.describe)('ActorType', () => {
        (0, node_test_1.default)('is a string union type (resolved from module)', () => {
            // ActorType is a type, runtime check that module loads without error
            strict_1.default.ok(types);
        });
    });
    (0, node_test_1.describe)('RequestTenantContext shape', () => {
        (0, node_test_1.default)('can construct with required fields', () => {
            const ctx = {
                tenantId: 't-001',
                brandId: 'b-001',
                storeId: 's-001',
                marketCode: 'CN',
            };
            strict_1.default.equal(ctx.tenantId, 't-001');
            strict_1.default.equal(ctx.brandId, 'b-001');
            strict_1.default.equal(ctx.storeId, 's-001');
            strict_1.default.equal(ctx.marketCode, 'CN');
        });
        (0, node_test_1.default)('can construct with only tenantId', () => {
            const ctx = {
                tenantId: 't-minimal',
            };
            strict_1.default.equal(ctx.tenantId, 't-minimal');
            strict_1.default.equal(ctx.brandId, undefined);
        });
    });
    (0, node_test_1.describe)('RequestActorContext shape', () => {
        (0, node_test_1.default)('can construct a minimal authenticated actor', () => {
            const actor = {
                actorId: 'user-1',
                actorType: 'platform-user',
                roles: ['admin'],
                permissions: ['read:all', 'write:all'],
                authenticated: true,
                source: 'headers',
            };
            strict_1.default.equal(actor.actorId, 'user-1');
            strict_1.default.equal(actor.actorType, 'platform-user');
            strict_1.default.deepStrictEqual(actor.roles, ['admin']);
            strict_1.default.deepStrictEqual(actor.permissions, ['read:all', 'write:all']);
            strict_1.default.equal(actor.authenticated, true);
            strict_1.default.equal(actor.source, 'headers');
        });
        (0, node_test_1.default)('can construct an actor with tenant/brand/store context', () => {
            const actor = {
                actorId: 'store-staff-1',
                actorType: 'store-user',
                tenantId: 't-001',
                brandId: 'b-001',
                storeId: 's-001',
                roles: ['store-staff'],
                permissions: ['read:inventory'],
                authenticated: true,
                source: 'headers',
            };
            strict_1.default.equal(actor.tenantId, 't-001');
            strict_1.default.equal(actor.brandId, 'b-001');
            strict_1.default.equal(actor.storeId, 's-001');
        });
        (0, node_test_1.default)('actorType supports all defined union values', () => {
            const validTypes = [
                'platform-user',
                'tenant-user',
                'brand-user',
                'store-user',
                'employee-user',
                'service-account',
            ];
            for (const t of validTypes) {
                const actor = {
                    actorId: `actor-${t}`,
                    actorType: t,
                    roles: [],
                    permissions: [],
                    authenticated: true,
                    source: 'headers',
                };
                strict_1.default.equal(actor.actorType, t);
            }
        });
    });
    (0, node_test_1.describe)('TenantScopeRequirement shape', () => {
        (0, node_test_1.default)('can be constructed empty', () => {
            const req = {};
            strict_1.default.equal(req.tenantId, undefined);
            strict_1.default.equal(req.brandId, undefined);
            strict_1.default.equal(req.storeId, undefined);
        });
        (0, node_test_1.default)('can be constructed with all fields', () => {
            const req = {
                tenantId: 't-001',
                brandId: 'b-001',
                storeId: 's-001',
            };
            strict_1.default.equal(req.tenantId, 't-001');
            strict_1.default.equal(req.brandId, 'b-001');
            strict_1.default.equal(req.storeId, 's-001');
        });
    });
    (0, node_test_1.describe)('RequestRateLimitDecision shape', () => {
        (0, node_test_1.default)('can construct with applied=false', () => {
            const d = { applied: false };
            strict_1.default.equal(d.applied, false);
            strict_1.default.equal(d.allowed, undefined);
        });
        (0, node_test_1.default)('can construct with full rate-limit applied state', () => {
            const d = {
                applied: true,
                scopeKey: 'rate:t-001:/api/hello',
                allowed: true,
                limit: 100,
                remaining: 99,
                retryAfterSeconds: 0,
            };
            strict_1.default.equal(d.applied, true);
            strict_1.default.equal(d.scopeKey, 'rate:t-001:/api/hello');
            strict_1.default.equal(d.allowed, true);
            strict_1.default.equal(d.limit, 100);
            strict_1.default.equal(d.remaining, 99);
            strict_1.default.equal(d.retryAfterSeconds, 0);
        });
        (0, node_test_1.default)('can construct rate-limit exceeding state', () => {
            const d = {
                applied: true,
                allowed: false,
                limit: 10,
                remaining: 0,
                retryAfterSeconds: 30,
            };
            strict_1.default.equal(d.applied, true);
            strict_1.default.equal(d.allowed, false);
            strict_1.default.equal(d.limit, 10);
            strict_1.default.equal(d.remaining, 0);
            strict_1.default.equal(d.retryAfterSeconds, 30);
        });
    });
    (0, node_test_1.describe)('RequestGovernanceContext shape', () => {
        (0, node_test_1.default)('can construct with minimal fields', () => {
            const ctx = {
                requestId: 'req-001',
                startedAt: Date.now(),
            };
            strict_1.default.equal(ctx.requestId, 'req-001');
            strict_1.default.ok(typeof ctx.startedAt === 'number');
        });
        (0, node_test_1.default)('can construct with rateLimit attached', () => {
            const ctx = {
                requestId: 'req-002',
                startedAt: Date.now(),
                rateLimit: {
                    applied: true,
                    scopeKey: 'rl:scope',
                    allowed: true,
                },
            };
            strict_1.default.ok(ctx.rateLimit);
            strict_1.default.equal(ctx.rateLimit.applied, true);
            strict_1.default.equal(ctx.rateLimit.scopeKey, 'rl:scope');
            strict_1.default.equal(ctx.rateLimit.allowed, true);
        });
    });
    (0, node_test_1.describe)('ResolvedActorContext shape', () => {
        (0, node_test_1.default)('can construct a fully resolved actor context', () => {
            const resolved = {
                authenticated: true,
                actor: {
                    actorId: 'u-1',
                    actorType: 'tenant-user',
                    roles: ['admin'],
                    permissions: ['*'],
                    authenticated: true,
                    source: 'headers',
                },
                tenantContext: { tenantId: 't-001' },
                effectiveTenantId: 't-001',
                effectiveBrandId: 'b-001',
                effectiveStoreId: 's-001',
                effectiveMarketCode: 'CN',
                roles: ['admin'],
                permissions: ['*'],
            };
            strict_1.default.equal(resolved.authenticated, true);
            strict_1.default.ok(resolved.actor);
            strict_1.default.equal(resolved.actor.actorId, 'u-1');
            strict_1.default.equal(resolved.actor.actorType, 'tenant-user');
            strict_1.default.equal(resolved.effectiveTenantId, 't-001');
            strict_1.default.equal(resolved.effectiveBrandId, 'b-001');
            strict_1.default.equal(resolved.effectiveStoreId, 's-001');
            strict_1.default.equal(resolved.effectiveMarketCode, 'CN');
            strict_1.default.deepStrictEqual(resolved.roles, ['admin']);
            strict_1.default.deepStrictEqual(resolved.permissions, ['*']);
        });
        (0, node_test_1.default)('can construct an unauthenticated resolved context', () => {
            const resolved = {
                authenticated: false,
                actor: null,
                tenantContext: { tenantId: 't-public' },
                effectiveTenantId: 't-public',
                effectiveMarketCode: 'default',
                roles: [],
                permissions: [],
            };
            strict_1.default.equal(resolved.authenticated, false);
            strict_1.default.equal(resolved.actor, null);
            strict_1.default.deepStrictEqual(resolved.roles, []);
            strict_1.default.deepStrictEqual(resolved.permissions, []);
        });
    });
    (0, node_test_1.describe)('TenantAwareRequest augmentation', () => {
        (0, node_test_1.default)('extends Request with tenant context fields', () => {
            // Structural assertion: object must have the tenant-specific fields
            const req = {
                tenantContext: { tenantId: 't-001' },
                actorContext: {
                    actorId: 'u-1',
                    actorType: 'platform-user',
                    roles: [],
                    permissions: [],
                    authenticated: true,
                    source: 'headers',
                },
            };
            strict_1.default.equal(req.tenantContext.tenantId, 't-001');
            strict_1.default.ok(req.actorContext);
            strict_1.default.equal(req.actorContext.actorId, 'u-1');
            strict_1.default.equal(req.actorContext.source, 'headers');
        });
        (0, node_test_1.default)('TenantAwareRequest omits optional actorContext', () => {
            const req = {
                tenantContext: { tenantId: 't-anon' },
            };
            strict_1.default.equal(req.tenantContext.tenantId, 't-anon');
            strict_1.default.equal(req.actorContext, undefined);
        });
    });
});
//# sourceMappingURL=tenant.types.test.js.map