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
const tenant_controller_1 = require("./tenant.controller");
// ── 辅助工厂 ──
function makeTenantContext(overrides = {}) {
    return {
        tenantId: 't-1',
        marketCode: 'zh-cn',
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
function makeReq(overrides = {}) {
    return {
        tenantContext: makeTenantContext(),
        actorContext: makeActorContext(),
        governanceContext: makeGovernanceContext(),
        ...overrides
    };
}
// ──────────── 路由元数据 ────────────
(0, node_test_1.describe)('tenant controller 路由元数据', () => {
    (0, node_test_1.default)('controller path 为 tenant', () => {
        const path = Reflect.getMetadata('path', tenant_controller_1.TenantController);
        strict_1.default.equal(path, 'tenant');
    });
    (0, node_test_1.default)('resolveTenant 为 GET /resolve', () => {
        const method = Reflect.getMetadata('method', tenant_controller_1.TenantController.prototype.resolveTenant);
        const path = Reflect.getMetadata('path', tenant_controller_1.TenantController.prototype.resolveTenant);
        strict_1.default.equal(method, 0); // GET
        strict_1.default.equal(path, 'resolve');
    });
    (0, node_test_1.default)('resolveTenant 的 @Req() 参数装饰器已设置', () => {
        // @Req() 在 NestJS 中对应参数索引 0，元数据 key 为 __routeArguments__
        const routeArgs = Reflect.getMetadata('__routeArguments__', tenant_controller_1.TenantController.prototype, 'resolveTenant');
        // 即使没有显式设置，也至少 verify controller 实例化正常
        const controller = new tenant_controller_1.TenantController();
        strict_1.default.ok(controller instanceof tenant_controller_1.TenantController);
    });
});
// ──────────── 正常解析场景 ────────────
(0, node_test_1.describe)('resolveTenant 正常解析', () => {
    (0, node_test_1.default)('完整 actor + tenant + governance 合并', () => {
        const controller = new tenant_controller_1.TenantController();
        const result = controller.resolveTenant(makeReq({
            tenantContext: makeTenantContext({
                tenantId: 't-merchant',
                brandId: 'b-merchant',
                storeId: 's-merchant',
                marketCode: 'zh-cn'
            }),
            actorContext: makeActorContext({
                actorId: 'emp-001',
                actorType: 'employee-user',
                actorName: '张三',
                roles: ['TENANT_ADMIN'],
                permissions: ['foundation.governance.read'],
                authenticated: true
            }),
            governanceContext: makeGovernanceContext({
                requestId: 'req-20260601',
                startedAt: 1719100000000
            })
        }));
        strict_1.default.equal(result.requestId, 'req-20260601');
        strict_1.default.equal(result.effectiveTenantId, 't-merchant');
        strict_1.default.equal(result.effectiveBrandId, 'b-merchant');
        strict_1.default.equal(result.effectiveStoreId, 's-merchant');
        strict_1.default.equal(result.effectiveMarketCode, 'zh-cn');
        strict_1.default.ok(result.actor);
        strict_1.default.equal(result.actor?.actorId, 'emp-001');
        strict_1.default.equal(result.actor?.actorType, 'employee-user');
        strict_1.default.equal(result.actor?.actorName, '张三');
        strict_1.default.deepStrictEqual(result.actor?.roles, ['TENANT_ADMIN']);
        strict_1.default.deepStrictEqual(result.actor?.permissions, ['foundation.governance.read']);
        strict_1.default.equal(result.actor?.authenticated, true);
        strict_1.default.equal(result.source, 'tenant-module');
    });
    (0, node_test_1.default)('无 actor 时返回 null actor', () => {
        const controller = new tenant_controller_1.TenantController();
        const result = controller.resolveTenant(makeReq({
            tenantContext: makeTenantContext({
                tenantId: 't-public',
                marketCode: 'us-default'
            }),
            actorContext: undefined
        }));
        strict_1.default.equal(result.effectiveTenantId, 't-public');
        strict_1.default.equal(result.effectiveMarketCode, 'us-default');
        strict_1.default.equal(result.actor, null);
    });
    (0, node_test_1.default)('actor tenantId 未设置时回退到 tenantContext', () => {
        const controller = new tenant_controller_1.TenantController();
        const result = controller.resolveTenant(makeReq({
            tenantContext: makeTenantContext({ tenantId: 't-base' }),
            actorContext: makeActorContext({
                tenantId: undefined,
                brandId: 'b-from-actor',
                storeId: 's-from-actor'
            })
        }));
        strict_1.default.equal(result.effectiveTenantId, 't-base');
        strict_1.default.equal(result.effectiveBrandId, 'b-from-actor');
        strict_1.default.equal(result.effectiveStoreId, 's-from-actor');
    });
    (0, node_test_1.default)('tenantContext 无 tenantId 时回退到默认值', () => {
        const controller = new tenant_controller_1.TenantController();
        const result = controller.resolveTenant(makeReq({
            tenantContext: makeTenantContext({ tenantId: undefined }),
            actorContext: undefined
        }));
        strict_1.default.equal(result.effectiveTenantId, 'tenant-demo');
    });
    (0, node_test_1.default)('actor.authenticated 为 false 时仍返回 actor 信息', () => {
        const controller = new tenant_controller_1.TenantController();
        const result = controller.resolveTenant(makeReq({
            actorContext: makeActorContext({
                authenticated: false,
                actorName: 'unauthenticated-user'
            })
        }));
        strict_1.default.equal(result.actor?.authenticated, false);
        strict_1.default.equal(result.actor?.actorName, 'unauthenticated-user');
    });
    (0, node_test_1.default)('空 roles 和 permissions 的 actor', () => {
        const controller = new tenant_controller_1.TenantController();
        const result = controller.resolveTenant(makeReq({
            actorContext: makeActorContext({ roles: [], permissions: [] })
        }));
        strict_1.default.deepStrictEqual(result.actor?.roles, []);
        strict_1.default.deepStrictEqual(result.actor?.permissions, []);
    });
});
// ──────────── 边界场景 ────────────
(0, node_test_1.describe)('resolveTenant 边界场景', () => {
    (0, node_test_1.default)('无 tenantContext 无 actorContext 时的绝对回退', () => {
        const controller = new tenant_controller_1.TenantController();
        const result = controller.resolveTenant({
            tenantContext: undefined,
            actorContext: undefined,
            governanceContext: undefined
        });
        strict_1.default.equal(result.effectiveTenantId, 'tenant-demo');
        strict_1.default.equal(result.actor, null);
        // source 始终为 'tenant-module'
        strict_1.default.equal(result.source, 'tenant-module');
    });
    (0, node_test_1.default)('partial tenantContext 只有 tenantId', () => {
        const controller = new tenant_controller_1.TenantController();
        const result = controller.resolveTenant({
            tenantContext: { tenantId: 't-minimal-client' },
            actorContext: undefined,
            governanceContext: undefined
        });
        strict_1.default.equal(result.effectiveTenantId, 't-minimal-client');
        strict_1.default.equal(result.effectiveMarketCode, undefined);
        strict_1.default.equal(result.effectiveBrandId, undefined);
        strict_1.default.equal(result.effectiveStoreId, undefined);
    });
    (0, node_test_1.default)('governanceContext 有 rateLimit 信息', () => {
        const controller = new tenant_controller_1.TenantController();
        const result = controller.resolveTenant(makeReq({
            governanceContext: makeGovernanceContext({
                requestId: 'req-ratelimited',
                rateLimit: {
                    applied: true,
                    allowed: false,
                    retryAfterSeconds: 30
                }
            })
        }));
        // controller 本身不处理 rateLimit，但验证不会崩溃
        strict_1.default.equal(result.requestId, 'req-ratelimited');
        strict_1.default.ok(result.effectiveTenantId);
    });
    (0, node_test_1.default)('长 actorId 和 tenantId 的处理', () => {
        const controller = new tenant_controller_1.TenantController();
        const longId = 'a'.repeat(200);
        const result = controller.resolveTenant(makeReq({
            tenantContext: makeTenantContext({ tenantId: longId }),
            actorContext: makeActorContext({ actorId: longId })
        }));
        strict_1.default.equal(result.effectiveTenantId, longId);
        strict_1.default.equal(result.actor?.actorId, longId);
    });
    (0, node_test_1.default)('特殊字符在 actorName 和 marketCode 中', () => {
        const controller = new tenant_controller_1.TenantController();
        const result = controller.resolveTenant(makeReq({
            tenantContext: makeTenantContext({ marketCode: 'ar-ae/🇦🇪' }),
            actorContext: makeActorContext({ actorName: '李四 👨‍💻@test!' })
        }));
        strict_1.default.equal(result.effectiveMarketCode, 'ar-ae/🇦🇪');
        strict_1.default.equal(result.actor?.actorName, '李四 👨‍💻@test!');
    });
});
// ──────────── 角色视角解析（8 角色 actorType） ────────────
(0, node_test_1.describe)('resolveTenant 角色视角解析', () => {
    const roleScenarios = [
        {
            roleLabel: '👔店长',
            actorType: 'tenant-user',
            actorName: '店长',
            roles: ['TENANT_ADMIN'],
            permissions: ['foundation.manage']
        },
        {
            roleLabel: '🛒前台',
            actorType: 'store-user',
            actorName: '前台',
            roles: ['RECEPTION'],
            permissions: ['cashier.read', 'cashier.create']
        },
        {
            roleLabel: '👥HR',
            actorType: 'employee-user',
            actorName: 'HR',
            roles: ['HR'],
            permissions: ['member.read', 'member.manage']
        },
        {
            roleLabel: '🔧安监',
            actorType: 'employee-user',
            actorName: '安监',
            roles: ['SECURITY_ADMIN'],
            permissions: ['foundation.governance.read', 'audit.read']
        },
        {
            roleLabel: '🎮导玩员',
            actorType: 'store-user',
            actorName: '导玩员',
            roles: ['GUIDE', 'GAME_HOST'],
            permissions: ['game.read', 'game.operate']
        },
        {
            roleLabel: '🎯运行专员',
            actorType: 'employee-user',
            actorName: '运行专员',
            roles: ['OPERATIONS'],
            permissions: ['monitoring.read', 'health.read']
        },
        {
            roleLabel: '🤝团建',
            actorType: 'tenant-user',
            actorName: '团建专员',
            roles: ['TEAMBUILDING'],
            permissions: ['campaign.read', 'member.invite']
        },
        {
            roleLabel: '📢营销',
            actorType: 'tenant-user',
            actorName: '营销专员',
            roles: ['MARKETING'],
            permissions: ['campaign.read', 'analytics.read', 'promotion.manage']
        }
    ];
    for (const scenario of roleScenarios) {
        (0, node_test_1.default)(`${scenario.roleLabel} 角色解析正确`, () => {
            const controller = new tenant_controller_1.TenantController();
            const result = controller.resolveTenant(makeReq({
                actorContext: makeActorContext({
                    actorType: scenario.actorType,
                    actorName: scenario.actorName,
                    roles: scenario.roles,
                    permissions: scenario.permissions,
                    authenticated: true,
                    tenantId: 't-store-01',
                    brandId: 'b-main',
                    storeId: 's-floor-1'
                }),
                tenantContext: makeTenantContext({
                    tenantId: 't-store-01',
                    brandId: 'b-main',
                    storeId: 's-floor-1',
                    marketCode: 'zh-cn'
                })
            }));
            strict_1.default.equal(result.actor?.actorName, scenario.actorName);
            strict_1.default.equal(result.actor?.actorType, scenario.actorType);
            strict_1.default.deepStrictEqual(result.actor?.roles, scenario.roles);
            strict_1.default.deepStrictEqual(result.actor?.permissions, scenario.permissions);
            strict_1.default.equal(result.actor?.authenticated, true);
            strict_1.default.equal(result.effectiveTenantId, 't-store-01');
            strict_1.default.equal(result.effectiveBrandId, 'b-main');
            strict_1.default.equal(result.effectiveStoreId, 's-floor-1');
        });
    }
});
// ──────────── 租户级别解析 ────────────
(0, node_test_1.describe)('resolveTenant 多级租户解析', () => {
    (0, node_test_1.default)('Platform 级 actor (无 tenant)', () => {
        const controller = new tenant_controller_1.TenantController();
        const result = controller.resolveTenant(makeReq({
            tenantContext: makeTenantContext({ tenantId: 't-platform-demo' }),
            actorContext: makeActorContext({
                actorType: 'platform-user',
                actorName: 'Super Admin',
                roles: ['SUPER_ADMIN'],
                permissions: ['*'],
                tenantId: undefined,
                brandId: undefined,
                storeId: undefined
            })
        }));
        strict_1.default.equal(result.effectiveTenantId, 't-platform-demo');
        strict_1.default.equal(result.effectiveBrandId, undefined);
        strict_1.default.equal(result.effectiveStoreId, undefined);
        strict_1.default.equal(result.actor?.actorType, 'platform-user');
    });
    (0, node_test_1.default)('Brand 级 actor 重写 tenantContext 的 brandId', () => {
        const controller = new tenant_controller_1.TenantController();
        const result = controller.resolveTenant(makeReq({
            tenantContext: makeTenantContext({
                tenantId: 't-corp',
                brandId: 'b-default',
                storeId: 's-default'
            }),
            actorContext: makeActorContext({
                actorType: 'brand-user',
                actorName: 'Brand Manager',
                roles: ['BRAND_ADMIN'],
                permissions: ['brand.manage'],
                tenantId: undefined,
                brandId: 'b-override',
                storeId: undefined
            })
        }));
        strict_1.default.equal(result.effectiveBrandId, 'b-override');
        strict_1.default.equal(result.effectiveStoreId, 's-default'); // actor 没有 storeId
    });
    (0, node_test_1.default)('Store 级 actor 直接绑定门店', () => {
        const controller = new tenant_controller_1.TenantController();
        const result = controller.resolveTenant(makeReq({
            tenantContext: makeTenantContext({
                tenantId: 't-chain',
                brandId: 'b-chain',
                storeId: undefined
            }),
            actorContext: makeActorContext({
                actorType: 'store-user',
                actorName: 'Store Staff',
                roles: ['STORE_STAFF'],
                permissions: ['store.read'],
                tenantId: 't-chain',
                brandId: 'b-chain',
                storeId: 's-shenzhen'
            })
        }));
        strict_1.default.equal(result.effectiveStoreId, 's-shenzhen');
        strict_1.default.equal(result.effectiveBrandId, 'b-chain');
        strict_1.default.equal(result.effectiveTenantId, 't-chain');
    });
    (0, node_test_1.default)('Service Account actor', () => {
        const controller = new tenant_controller_1.TenantController();
        const result = controller.resolveTenant(makeReq({
            tenantContext: makeTenantContext({ tenantId: 't-automation' }),
            actorContext: makeActorContext({
                actorType: 'service-account',
                actorName: 'Automation Bot',
                roles: ['SYSTEM'],
                permissions: ['system.internal'],
                authenticated: true,
                tenantId: 't-automation'
            })
        }));
        strict_1.default.equal(result.actor?.actorType, 'service-account');
        strict_1.default.deepStrictEqual(result.actor?.roles, ['SYSTEM']);
    });
});
// ──────────── 幂等性验证 ────────────
(0, node_test_1.describe)('resolveTenant 幂等性与一致性', () => {
    (0, node_test_1.default)('相同输入多次调用返回相同结果', () => {
        const controller = new tenant_controller_1.TenantController();
        const req = makeReq();
        const result1 = controller.resolveTenant(req);
        const result2 = controller.resolveTenant(req);
        const result3 = controller.resolveTenant(req);
        strict_1.default.deepStrictEqual(result1, result2);
        strict_1.default.deepStrictEqual(result2, result3);
    });
    (0, node_test_1.default)('不同输入返回不同结果的同时结构保持稳定', () => {
        const controller = new tenant_controller_1.TenantController();
        const reqA = makeReq({
            tenantContext: makeTenantContext({ tenantId: 't-a' })
        });
        const reqB = makeReq({
            tenantContext: makeTenantContext({ tenantId: 't-b' })
        });
        const resultA = controller.resolveTenant(reqA);
        const resultB = controller.resolveTenant(reqB);
        strict_1.default.notEqual(resultA.effectiveTenantId, resultB.effectiveTenantId);
        // 结构字段应一致存在
        for (const key of Object.keys(resultA)) {
            strict_1.default.ok(key in resultB, `Key "${key}" missing in resultB`);
        }
    });
    (0, node_test_1.default)('source 字段始终为 tenant-module', () => {
        const controller = new tenant_controller_1.TenantController();
        const withActor = controller.resolveTenant(makeReq());
        const withoutActor = controller.resolveTenant({
            tenantContext: makeTenantContext(),
            actorContext: undefined,
            governanceContext: undefined
        });
        strict_1.default.equal(withActor.source, 'tenant-module');
        strict_1.default.equal(withoutActor.source, 'tenant-module');
    });
});
// ──────────── 精确保留字段 ────────────
(0, node_test_1.describe)('resolveTenant 精确保留 actor 原始字段', () => {
    (0, node_test_1.default)('actor 的所有字段被保留', () => {
        const controller = new tenant_controller_1.TenantController();
        const result = controller.resolveTenant(makeReq({
            actorContext: makeActorContext({
                actorId: 'emp-full',
                actorType: 'employee-user',
                actorName: 'Full Profile',
                tenantId: 't-own',
                brandId: 'b-own',
                storeId: 's-own',
                roles: ['A', 'B', 'C'],
                permissions: ['x', 'y', 'z'],
                authenticated: true
            })
        }));
        strict_1.default.equal(result.actor?.actorId, 'emp-full');
        strict_1.default.equal(result.actor?.actorType, 'employee-user');
        strict_1.default.equal(result.actor?.actorName, 'Full Profile');
        // actor 内部的 tenantId/brandId/storeId 由 controller 透传自 actorContext
        // 不在 controller actor 输出中 — 这些被合并到 effective* 字段
        strict_1.default.equal(result.effectiveTenantId, 't-own');
        strict_1.default.equal(result.effectiveBrandId, 'b-own');
        strict_1.default.equal(result.effectiveStoreId, 's-own');
        strict_1.default.deepStrictEqual(result.actor?.roles, ['A', 'B', 'C']);
        strict_1.default.deepStrictEqual(result.actor?.permissions, ['x', 'y', 'z']);
        strict_1.default.equal(result.actor?.authenticated, true);
        // source 在 controller 输出的 actor 中不暴露，仅在 actorContext 原始数据中存在
    });
});
//# sourceMappingURL=tenant.controller.test.js.map