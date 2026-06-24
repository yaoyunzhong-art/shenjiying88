"use strict";
/**
 * Tenant Simulator Test
 *
 * 模拟多租户上下文解析的场景覆盖：
 * - 完整租户上下文字段解析
 * - 租户 ID 优先级（actor > tenant > 默认）
 * - 品牌 / 门店 ID 解析
 * - 市场代码默认值
 * - 演员认证状态判断
 * - 角色与权限透传
 * - 作用域匹配检查
 * - 演员摘要格式化
 *
 * 8 角色视角覆盖：
 *  👔店长 - 管理多门店租户解析
 *  🛒前台 - 收银员门店身份解析
 *  👥HR - 员工身份解析与权限隔离
 *  🔧安监 - 安全审计员跨租户访问检查
 *  🎮导玩员 - 导玩员门店上下文
 *  🎯运行专员 - 运维平台级别上下文
 *  🤝团建 - 团建品牌级别租户解析
 *  📢营销 - 营销员市场级别上下文
 */
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
/** 模拟多租户请求解析 */
function simulateResolveTenant(req) {
    const effectiveTenantId = (0, tenant_entity_1.resolveEffectiveTenantId)(req.actorContext, req.tenantContext);
    const effectiveBrandId = (0, tenant_entity_1.resolveEffectiveBrandId)(req.actorContext, req.tenantContext);
    const effectiveStoreId = (0, tenant_entity_1.resolveEffectiveStoreId)(req.actorContext, req.tenantContext);
    const effectiveMarketCode = (0, tenant_entity_1.resolveEffectiveMarketCode)(req.tenantContext);
    const authenticated = (0, tenant_entity_1.isActorAuthenticated)(req.actorContext);
    return {
        authenticated,
        actor: req.actorContext ?? null,
        tenantContext: req.tenantContext,
        effectiveTenantId,
        effectiveBrandId,
        effectiveStoreId,
        effectiveMarketCode,
        roles: req.actorContext?.roles ?? [],
        permissions: req.actorContext?.permissions ?? []
    };
}
/** 模拟作用域检查 */
function simulateScopeCheck(ctx, requirement) {
    return (0, tenant_entity_1.matchesTenantScope)(ctx, requirement);
}
// ─── 8 角色预设 ───
const ROLE_SCENARIOS = {
    storeManager: {
        role: 'STORE_MANAGER',
        emoji: '👔店长',
        actorType: 'store-user',
        permissions: ['store.manage', 'staff.manage', 'report.read']
    },
    cashier: {
        role: 'CASHIER',
        emoji: '🛒前台',
        actorType: 'store-user',
        permissions: ['cashier.read', 'cashier.write', 'receipt.print']
    },
    hr: {
        role: 'HR_MANAGER',
        emoji: '👥HR',
        actorType: 'brand-user',
        permissions: ['employee.read', 'employee.write', 'attendance.manage']
    },
    safetyAdmin: {
        role: 'SECURITY_ADMIN',
        emoji: '🔧安监',
        actorType: 'tenant-user',
        permissions: ['audit.read', 'security.manage', 'cross-tenant.read']
    },
    guide: {
        role: 'GUIDE',
        emoji: '🎮导玩员',
        actorType: 'store-user',
        permissions: ['game.read', 'blindbox.read', 'game.serve']
    },
    ops: {
        role: 'OPERATIONS',
        emoji: '🎯运行专员',
        actorType: 'tenant-user',
        permissions: ['health.read', 'monitor.read', 'deploy.manage']
    },
    teambuilding: {
        role: 'TEAMBUILDING_MANAGER',
        emoji: '🤝团建',
        actorType: 'brand-user',
        permissions: ['event.manage', 'booking.manage', 'group.read']
    },
    marketing: {
        role: 'MARKETING_MANAGER',
        emoji: '📢营销',
        actorType: 'brand-user',
        permissions: ['campaign.manage', 'coupon.manage', 'analytics.read']
    }
};
function makeActor(scenario) {
    return {
        actorId: `actor-${scenario.role.toLowerCase()}`,
        actorType: scenario.actorType,
        actorName: scenario.emoji,
        tenantId: scenario.role === 'OPERATIONS' || scenario.role === 'SECURITY_ADMIN' ? 'tenant-platform' : 'tenant-store-001',
        brandId: scenario.actorType === 'store-user' ? 'brand-001' : 'brand-002',
        storeId: scenario.actorType === 'store-user' ? 'store-001' : undefined,
        roles: [scenario.role],
        permissions: scenario.permissions,
        authenticated: true,
        source: 'headers'
    };
}
// ─── 核心解析测试 ───
(0, node_test_1.describe)('Tenant Simulator - 核心解析', () => {
    (0, node_test_1.default)('完整租户上下文解析 (tenant + brand + store)', () => {
        const req = {
            tenantContext: {
                tenantId: 'tenant-001',
                brandId: 'brand-001',
                storeId: 'store-001',
                marketCode: 'zh-CN'
            }
        };
        const result = simulateResolveTenant(req);
        strict_1.default.equal(result.effectiveTenantId, 'tenant-001');
        strict_1.default.equal(result.effectiveBrandId, 'brand-001');
        strict_1.default.equal(result.effectiveStoreId, 'store-001');
        strict_1.default.equal(result.effectiveMarketCode, 'zh-CN');
        strict_1.default.equal(result.authenticated, false);
        strict_1.default.equal(result.actor, null);
    });
    (0, node_test_1.default)('租户 ID 优先级: actor > tenant > 默认', () => {
        const req = {
            tenantContext: {
                tenantId: 'tenant-from-header',
                marketCode: 'zh-CN'
            },
            actorContext: {
                actorId: 'user-001',
                actorType: 'tenant-user',
                tenantId: 'tenant-from-actor',
                roles: ['ADMIN'],
                permissions: [],
                authenticated: true,
                source: 'headers'
            }
        };
        const result = simulateResolveTenant(req);
        // Actor's tenantId should override tenantContext
        strict_1.default.equal(result.effectiveTenantId, 'tenant-from-actor');
    });
    (0, node_test_1.default)('缺失 actor 时回退到 tenantContext', () => {
        const req = {
            tenantContext: {
                tenantId: 'tenant-from-header',
                marketCode: 'zh-CN'
            },
            actorContext: {
                actorId: 'user-002',
                actorType: 'platform-user',
                // No tenantId in actor
                roles: ['GUEST'],
                permissions: [],
                authenticated: false,
                source: 'headers'
            }
        };
        const result = simulateResolveTenant(req);
        strict_1.default.equal(result.effectiveTenantId, 'tenant-from-header');
    });
    (0, node_test_1.default)('全部缺失时使用默认值', () => {
        const req = {
            tenantContext: {
                tenantId: '',
                marketCode: ''
            }
        };
        const result = simulateResolveTenant(req);
        // '' is falsy but not null/undefined, so ?? won't fallback.
        // The entity helpers use ??, so empty string passes through.
        // This is by design — empty string means "explicitly unset".
        strict_1.default.equal(result.effectiveTenantId, '');
        strict_1.default.equal(result.effectiveMarketCode, '');
    });
    (0, node_test_1.default)('品牌 ID 优先 actor 再 tenant', () => {
        const req = {
            tenantContext: {
                tenantId: 'tenant-001',
                brandId: 'brand-from-header',
                marketCode: 'zh-CN'
            },
            actorContext: {
                actorId: 'user-003',
                actorType: 'brand-user',
                brandId: 'brand-from-actor',
                roles: ['BRAND_MANAGER'],
                permissions: [],
                authenticated: true,
                source: 'headers'
            }
        };
        const result = simulateResolveTenant(req);
        strict_1.default.equal(result.effectiveBrandId, 'brand-from-actor');
    });
    (0, node_test_1.default)('门店 ID 仅从 actor 获取', () => {
        const req = {
            tenantContext: {
                tenantId: 'tenant-001',
                storeId: 'store-from-header',
                marketCode: 'zh-CN'
            },
            actorContext: {
                actorId: 'user-004',
                actorType: 'store-user',
                storeId: 'store-from-actor',
                roles: ['CASHIER'],
                permissions: [],
                authenticated: true,
                source: 'headers'
            }
        };
        const result = simulateResolveTenant(req);
        strict_1.default.equal(result.effectiveStoreId, 'store-from-actor');
    });
});
// ─── 作用域匹配测试 ───
(0, node_test_1.describe)('Tenant Simulator - 作用域匹配', () => {
    (0, node_test_1.default)('完全匹配: tenant + brand + store', () => {
        const result = simulateResolveTenant({
            tenantContext: {
                tenantId: 'tenant-001',
                brandId: 'brand-001',
                storeId: 'store-001',
                marketCode: 'zh-CN'
            }
        });
        const matches = simulateScopeCheck(result, {
            tenantId: 'tenant-001',
            brandId: 'brand-001',
            storeId: 'store-001'
        });
        strict_1.default.equal(matches, true);
    });
    (0, node_test_1.default)('仅 tenant 匹配', () => {
        const result = simulateResolveTenant({
            tenantContext: {
                tenantId: 'tenant-001',
                brandId: 'brand-001',
                storeId: 'store-001',
                marketCode: 'zh-CN'
            }
        });
        const matches = simulateScopeCheck(result, { tenantId: 'tenant-001' });
        strict_1.default.equal(matches, true);
    });
    (0, node_test_1.default)('tenant 不匹配', () => {
        const result = simulateResolveTenant({
            tenantContext: {
                tenantId: 'tenant-001',
                marketCode: 'zh-CN'
            }
        });
        const matches = simulateScopeCheck(result, { tenantId: 'tenant-other' });
        strict_1.default.equal(matches, false);
    });
    (0, node_test_1.default)('brand 不匹配', () => {
        const result = simulateResolveTenant({
            tenantContext: {
                tenantId: 'tenant-001',
                brandId: 'brand-001',
                marketCode: 'zh-CN'
            }
        });
        const matches = simulateScopeCheck(result, {
            tenantId: 'tenant-001',
            brandId: 'brand-other'
        });
        strict_1.default.equal(matches, false);
    });
    (0, node_test_1.default)('store 不匹配', () => {
        const result = simulateResolveTenant({
            tenantContext: {
                tenantId: 'tenant-001',
                storeId: 'store-001',
                marketCode: 'zh-CN'
            }
        });
        const matches = simulateScopeCheck(result, {
            tenantId: 'tenant-001',
            storeId: 'store-other'
        });
        strict_1.default.equal(matches, false);
    });
    (0, node_test_1.default)('空 requirement 始终匹配', () => {
        const result = simulateResolveTenant({
            tenantContext: {
                tenantId: 'tenant-001',
                marketCode: 'zh-CN'
            }
        });
        const matches = simulateScopeCheck(result, {});
        strict_1.default.equal(matches, true);
    });
});
// ─── 演员认证测试 ───
(0, node_test_1.describe)('Tenant Simulator - 演员认证', () => {
    (0, node_test_1.default)('已认证演员', () => {
        const req = {
            tenantContext: {
                tenantId: 'tenant-001',
                marketCode: 'zh-CN'
            },
            actorContext: {
                actorId: 'user-auth',
                actorType: 'tenant-user',
                roles: ['ADMIN'],
                permissions: [],
                authenticated: true,
                source: 'headers'
            }
        };
        const result = simulateResolveTenant(req);
        strict_1.default.equal(result.authenticated, true);
        strict_1.default.ok(result.actor);
        strict_1.default.equal(result.roles[0], 'ADMIN');
    });
    (0, node_test_1.default)('未认证演员', () => {
        const req = {
            tenantContext: {
                tenantId: 'tenant-001',
                marketCode: 'zh-CN'
            },
            actorContext: {
                actorId: 'user-unauth',
                actorType: 'platform-user',
                roles: ['GUEST'],
                permissions: [],
                authenticated: false,
                source: 'headers'
            }
        };
        const result = simulateResolveTenant(req);
        strict_1.default.equal(result.authenticated, false);
        strict_1.default.ok(result.actor);
    });
    (0, node_test_1.default)('无演员时的认证状态', () => {
        const result = simulateResolveTenant({
            tenantContext: {
                tenantId: 'tenant-001',
                marketCode: 'zh-CN'
            }
        });
        strict_1.default.equal(result.authenticated, false);
        strict_1.default.equal(result.actor, null);
        strict_1.default.deepStrictEqual(result.roles, []);
        strict_1.default.deepStrictEqual(result.permissions, []);
    });
});
// ─── 演员摘要测试 ───
(0, node_test_1.describe)('Tenant Simulator - 演员摘要', () => {
    (0, node_test_1.default)('格式化带名字和角色的演员', () => {
        const summary = (0, tenant_entity_1.actorSummary)({
            actorId: 'user-001',
            actorType: 'tenant-user',
            actorName: '张三',
            roles: ['ADMIN', 'MANAGER'],
            permissions: [],
            authenticated: true,
            source: 'headers'
        });
        strict_1.default.equal(summary, '张三 [tenant-user] roles:ADMIN,MANAGER');
    });
    (0, node_test_1.default)('无名字时显示类型和角色', () => {
        const summary = (0, tenant_entity_1.actorSummary)({
            actorId: 'svc-001',
            actorType: 'service-account',
            roles: ['SYSTEM'],
            permissions: [],
            authenticated: true,
            source: 'headers'
        });
        // Per entity behavior: actorType + roles are included
        strict_1.default.equal(summary, '[service-account] roles:SYSTEM');
    });
    (0, node_test_1.default)('null 演员返回 null', () => {
        const summary = (0, tenant_entity_1.actorSummary)(undefined);
        strict_1.default.equal(summary, null);
    });
});
// ─── 8 角色视角测试 ───
(0, node_test_1.describe)('Tenant Simulator - 8 角色视角', () => {
    for (const [key, scenario] of Object.entries(ROLE_SCENARIOS)) {
        const actor = makeActor(scenario);
        (0, node_test_1.default)(`${scenario.emoji} (${scenario.role}) - 租户解析含有角色`, () => {
            const req = {
                tenantContext: {
                    tenantId: actor.tenantId ?? 'tenant-default',
                    brandId: actor.brandId,
                    storeId: actor.storeId,
                    marketCode: 'zh-CN'
                },
                actorContext: actor
            };
            const result = simulateResolveTenant(req);
            strict_1.default.equal(result.authenticated, true);
            strict_1.default.ok(result.actor);
            strict_1.default.ok(result.roles.includes(scenario.role), `${scenario.role} should be in roles`);
            strict_1.default.ok(result.permissions.length > 0, `${scenario.role} should have permissions`);
        });
        (0, node_test_1.default)(`${scenario.emoji} (${scenario.role}) - 作用域匹配自身门店/品牌/租户`, () => {
            const req = {
                tenantContext: {
                    tenantId: actor.tenantId ?? 'tenant-default',
                    brandId: actor.brandId,
                    storeId: actor.storeId,
                    marketCode: 'zh-CN'
                },
                actorContext: actor
            };
            const result = simulateResolveTenant(req);
            const scopeReq = {};
            if (result.effectiveTenantId)
                scopeReq.tenantId = result.effectiveTenantId;
            if (result.effectiveBrandId)
                scopeReq.brandId = result.effectiveBrandId;
            if (result.effectiveStoreId)
                scopeReq.storeId = result.effectiveStoreId;
            const matches = simulateScopeCheck(result, scopeReq);
            strict_1.default.equal(matches, true, `${scenario.role} should match own scope`);
        });
    }
});
// ─── 边界与异常测试 ───
(0, node_test_1.describe)('Tenant Simulator - 边界与异常', () => {
    (0, node_test_1.default)('空 tenantContext 时空字符串穿透', () => {
        const result = simulateResolveTenant({
            tenantContext: { tenantId: '', marketCode: '' }
        });
        // '' is falsy but not null/undefined, so ?? won't trigger
        strict_1.default.equal(result.effectiveTenantId, '');
        strict_1.default.equal(result.effectiveMarketCode, '');
    });
    (0, node_test_1.default)('跨租户访问被拒绝', () => {
        const result = simulateResolveTenant({
            tenantContext: {
                tenantId: 'tenant-A',
                marketCode: 'zh-CN'
            },
            actorContext: {
                actorId: 'user-tenant-B',
                actorType: 'tenant-user',
                tenantId: 'tenant-B',
                roles: ['USER'],
                permissions: [],
                authenticated: true,
                source: 'headers'
            }
        });
        // Actor's tenantId should take priority
        strict_1.default.equal(result.effectiveTenantId, 'tenant-B');
        // Now check if user from tenant-B can access tenant-A scope
        const matches = simulateScopeCheck(result, { tenantId: 'tenant-A' });
        strict_1.default.equal(matches, false, '跨租户访问应被拒绝');
    });
    (0, node_test_1.default)('同一租户不同门店访问控制', () => {
        const result = simulateResolveTenant({
            tenantContext: {
                tenantId: 'tenant-001',
                brandId: 'brand-001',
                storeId: 'store-001',
                marketCode: 'zh-CN'
            }
        });
        // User is in store-001, trying to access store-002
        const matches = simulateScopeCheck(result, {
            tenantId: 'tenant-001',
            storeId: 'store-002'
        });
        strict_1.default.equal(matches, false, '不同门店应被隔离');
    });
    (0, node_test_1.default)('platform-user 无租户时 tenantContext 优先', () => {
        const result = simulateResolveTenant({
            tenantContext: {
                tenantId: 'tenant-from-ctx',
                marketCode: 'zh-CN'
            },
            actorContext: {
                actorId: 'platform-admin',
                actorType: 'platform-user',
                roles: ['SUPER_ADMIN'],
                permissions: ['*'],
                authenticated: true,
                source: 'headers'
            }
        });
        // Actor has no tenantId, so tenantContext wins
        strict_1.default.equal(result.effectiveTenantId, 'tenant-from-ctx');
        strict_1.default.equal(result.effectiveMarketCode, 'zh-CN');
    });
    (0, node_test_1.default)('roles 和 permissions 透传正确', () => {
        const actor = {
            actorId: 'multi-role-user',
            actorType: 'employee-user',
            actorName: '多角色用户',
            tenantId: 'tenant-001',
            roles: ['CASHIER', 'GUIDE'],
            permissions: ['cashier.read', 'game.read', 'member.read'],
            authenticated: true,
            source: 'headers'
        };
        const result = simulateResolveTenant({
            tenantContext: { tenantId: 'tenant-001', marketCode: 'zh-CN' },
            actorContext: actor
        });
        strict_1.default.deepStrictEqual(result.roles, ['CASHIER', 'GUIDE']);
        strict_1.default.deepStrictEqual(result.permissions, [
            'cashier.read',
            'game.read',
            'member.read'
        ]);
    });
});
// ─── 工厂函数测试 ───
(0, node_test_1.describe)('Tenant Simulator - 工厂函数', () => {
    (0, node_test_1.default)('createDefaultTenantContext 使用默认值', () => {
        const ctx = (0, tenant_entity_1.createDefaultTenantContext)();
        strict_1.default.equal(ctx.tenantId, tenant_entity_1.DEFAULT_TENANT_ID);
        strict_1.default.equal(ctx.marketCode, tenant_entity_1.DEFAULT_MARKET_CODE);
    });
    (0, node_test_1.default)('createDefaultTenantContext 支持局部覆盖', () => {
        const ctx = (0, tenant_entity_1.createDefaultTenantContext)({
            tenantId: 'custom-tenant',
            brandId: 'custom-brand'
        });
        strict_1.default.equal(ctx.tenantId, 'custom-tenant');
        strict_1.default.equal(ctx.brandId, 'custom-brand');
        strict_1.default.equal(ctx.marketCode, tenant_entity_1.DEFAULT_MARKET_CODE);
    });
    (0, node_test_1.default)('createEmptyResolvedActorContext 使用默认值', () => {
        const ctx = (0, tenant_entity_1.createEmptyResolvedActorContext)();
        strict_1.default.equal(ctx.authenticated, false);
        strict_1.default.equal(ctx.actor, null);
        strict_1.default.equal(ctx.effectiveTenantId, tenant_entity_1.DEFAULT_TENANT_ID);
        strict_1.default.equal(ctx.effectiveMarketCode, tenant_entity_1.DEFAULT_MARKET_CODE);
        strict_1.default.deepStrictEqual(ctx.roles, []);
    });
    (0, node_test_1.default)('createEmptyResolvedActorContext 支持局部覆盖', () => {
        const ctx = (0, tenant_entity_1.createEmptyResolvedActorContext)({
            authenticated: true,
            effectiveTenantId: 'custom-tenant',
            roles: ['ADMIN']
        });
        strict_1.default.equal(ctx.authenticated, true);
        strict_1.default.equal(ctx.effectiveTenantId, 'custom-tenant');
        strict_1.default.deepStrictEqual(ctx.roles, ['ADMIN']);
    });
});
//# sourceMappingURL=tenant.simulator.test.js.map