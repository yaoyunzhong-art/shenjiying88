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
const resilience_operations_controller_1 = require("./resilience-operations.controller");
const identity_access_decorator_1 = require("../identity-access/identity-access.decorator");
// ── 8 角色定义 ──
const ROLES = {
    TenantAdmin: '👔店长',
    Reception: '🛒前台',
    HR: '👥HR',
    Safety: '🔧安监',
    Guide: '🎮导玩员',
    Ops: '🎯运行专员',
    Teambuilding: '🤝团建',
    Marketing: '📢营销'
};
// ── 辅助工厂 ──
function mockResilienceOpsService() {
    return {
        getManagementMetadata: () => ({ module: 'resilience-operations', type: 'governance' }),
        getOperationsOverview: () => ({
            observability: { degradedSignals: 3 },
            recovery: { attentionRequired: 1 },
            generatedAt: '2026-06-23T07:00:00.000Z'
        }),
        getObservabilitySignals: () => ({ metrics: [], logs: [], traces: [] }),
        listRetryPolicies: () => ({ policies: [{ resource: 'booking-service', maxRetries: 3 }] }),
        listRecoveryPlans: () => ({ plans: [{ resource: 'booking-db', drills: [] }] }),
        describeRecoveryPlan: () => ({ resource: 'booking-db', steps: ['snapshot', 'restore'], lastDrill: '2026-01-01' }),
        stageEdgeReplay: () => ({ staged: true, storeId: 'store-001', operationCount: 5 }),
        getGovernanceBaselines: () => [],
        getDescriptor: () => ({ module: 'resilience-operations' })
    };
}
function createResilienceOpsController(mockSvc = mockResilienceOpsService()) {
    return new resilience_operations_controller_1.ResilienceOperationsController(mockSvc);
}
// ── 通用 actor 上下文辅助 ──
function makeActor(roles, permissions = []) {
    return {
        actorId: 'actor-01',
        actorType: 'employee-user',
        roles,
        permissions,
        authenticated: true,
        source: 'headers'
    };
}
// ──────────── 👔店长 ────────────
(0, node_test_1.describe)(`${ROLES.TenantAdmin} resilience-operations 角色测试`, () => {
    (0, node_test_1.default)('店长可获取 management-metadata 查看治理元数据', () => {
        const ctrl = createResilienceOpsController();
        const result = ctrl.getManagementMetadata();
        strict_1.default.ok(result);
        strict_1.default.equal(result.module, 'resilience-operations');
        strict_1.default.equal(result.type, 'governance');
    });
    (0, node_test_1.default)('店长可查看 operations-overview 了解系统整体运行状态', () => {
        const ctrl = createResilienceOpsController();
        const result = ctrl.getOperationsOverview();
        strict_1.default.ok(result);
        strict_1.default.ok(result.observability);
        strict_1.default.ok(result.recovery);
        strict_1.default.ok(result.generatedAt);
    });
    (0, node_test_1.default)('店长在 readiness 端点白名单中（权限边界验证）', () => {
        const roles = Reflect.getMetadata(identity_access_decorator_1.ROLES_METADATA_KEY, resilience_operations_controller_1.ResilienceOperationsController.prototype.getOperationsOverview);
        strict_1.default.ok(roles.includes('TENANT_ADMIN'));
    });
    (0, node_test_1.default)('店长可查看所有恢复计划以决策运维策略', () => {
        const ctrl = createResilienceOpsController();
        const result = ctrl.getRecoveryPlans({});
        strict_1.default.ok(result.plans);
        strict_1.default.ok(result.plans.length > 0);
    });
});
// ──────────── 🛒前台 ────────────
(0, node_test_1.describe)(`${ROLES.Reception} resilience-operations 角色测试`, () => {
    (0, node_test_1.default)('前台不在 management-metadata 允许角色列表中（权限边界）', () => {
        const roles = Reflect.getMetadata(identity_access_decorator_1.ROLES_METADATA_KEY, resilience_operations_controller_1.ResilienceOperationsController.prototype.getManagementMetadata);
        strict_1.default.ok(!roles.includes('RECEPTION'));
        strict_1.default.ok(!roles.includes('FRONT_DESK'));
    });
    (0, node_test_1.default)('前台无法访问 overview 端点，需 TENANT_ADMIN 或 OPERATIONS 角色', () => {
        const roles = Reflect.getMetadata(identity_access_decorator_1.ROLES_METADATA_KEY, resilience_operations_controller_1.ResilienceOperationsController.prototype.getOperationsOverview);
        strict_1.default.ok(!roles.includes('RECEPTION'));
        // 确认确实有严格角色限制
        strict_1.default.ok(roles.length > 0);
    });
    (0, node_test_1.default)('前台不在 recovery-plans 端点角色白名单中（隔离边界）', () => {
        const roles = Reflect.getMetadata(identity_access_decorator_1.ROLES_METADATA_KEY, resilience_operations_controller_1.ResilienceOperationsController.prototype.getRecoveryPlan);
        strict_1.default.ok(!roles.includes('RECEPTION'));
    });
    (0, node_test_1.default)('前台不在 edge-replay stage 端点角色白名单中（写操作隔离）', () => {
        const roles = Reflect.getMetadata(identity_access_decorator_1.ROLES_METADATA_KEY, resilience_operations_controller_1.ResilienceOperationsController.prototype.stageEdgeReplay);
        strict_1.default.ok(!roles.includes('RECEPTION'));
    });
});
// ──────────── 👥HR ────────────
(0, node_test_1.describe)(`${ROLES.HR} resilience-operations 角色测试`, () => {
    (0, node_test_1.default)('HR 不在 management-metadata 角色白名单中', () => {
        const roles = Reflect.getMetadata(identity_access_decorator_1.ROLES_METADATA_KEY, resilience_operations_controller_1.ResilienceOperationsController.prototype.getManagementMetadata);
        strict_1.default.ok(!roles.includes('HR'));
    });
    (0, node_test_1.default)('HR 不在 overview 允许角色中（HR 无需运维视图）', () => {
        const roles = Reflect.getMetadata(identity_access_decorator_1.ROLES_METADATA_KEY, resilience_operations_controller_1.ResilienceOperationsController.prototype.getOperationsOverview);
        strict_1.default.ok(!roles.includes('HR'));
    });
    (0, node_test_1.default)('HR 无法通过 controller 端点获取观察信号数据', () => {
        const roles = Reflect.getMetadata(identity_access_decorator_1.ROLES_METADATA_KEY, resilience_operations_controller_1.ResilienceOperationsController.prototype.getObservabilitySignals);
        strict_1.default.ok(!roles.includes('HR'));
    });
    (0, node_test_1.default)('HR 不在 edge-replay 写操作白名单中', () => {
        const roles = Reflect.getMetadata(identity_access_decorator_1.ROLES_METADATA_KEY, resilience_operations_controller_1.ResilienceOperationsController.prototype.stageEdgeReplay);
        strict_1.default.ok(!roles.includes('HR'));
    });
});
// ──────────── 🔧安监 ────────────
(0, node_test_1.describe)(`${ROLES.Safety} resilience-operations 角色测试`, () => {
    (0, node_test_1.default)('安监可获取 management-metadata 检查治理合规', () => {
        const ctrl = createResilienceOpsController();
        const result = ctrl.getManagementMetadata();
        strict_1.default.ok(result);
        strict_1.default.equal(result.type, 'governance');
    });
    (0, node_test_1.default)('安监可查看 observability signals 以审计系统健康（安全审计视角）', () => {
        const ctrl = createResilienceOpsController();
        const result = ctrl.getObservabilitySignals({ status: 'degraded' });
        strict_1.default.ok(result);
    });
    (0, node_test_1.default)('安监需要同时具备 SECURITY_ADMIN 角色和 governance.read 权限（双因素边界）', () => {
        const roles = Reflect.getMetadata(identity_access_decorator_1.ROLES_METADATA_KEY, resilience_operations_controller_1.ResilienceOperationsController.prototype.getObservabilitySignals);
        const perms = Reflect.getMetadata(identity_access_decorator_1.PERMISSIONS_METADATA_KEY, resilience_operations_controller_1.ResilienceOperationsController.prototype.getObservabilitySignals);
        strict_1.default.ok(roles.includes('SECURITY_ADMIN'));
        strict_1.default.deepEqual(perms, ['foundation.governance.read']);
    });
    (0, node_test_1.default)('安监可查看恢复计划以进行合规审查', () => {
        const ctrl = createResilienceOpsController();
        const result = ctrl.getRecoveryPlans({});
        strict_1.default.ok(result.plans);
    });
    (0, node_test_1.default)('安监不在 edge-replay 写操作白名单中（只读安全角色）', () => {
        const roles = Reflect.getMetadata(identity_access_decorator_1.ROLES_METADATA_KEY, resilience_operations_controller_1.ResilienceOperationsController.prototype.stageEdgeReplay);
        strict_1.default.ok(!roles.includes('SECURITY_ADMIN'));
    });
});
// ──────────── 🎮导玩员 ────────────
(0, node_test_1.describe)(`${ROLES.Guide} resilience-operations 角色测试`, () => {
    (0, node_test_1.default)('导玩员不在 overview 角色白名单中', () => {
        const roles = Reflect.getMetadata(identity_access_decorator_1.ROLES_METADATA_KEY, resilience_operations_controller_1.ResilienceOperationsController.prototype.getOperationsOverview);
        strict_1.default.ok(!roles.includes('GUIDE'));
        strict_1.default.ok(!roles.includes('GAME_HOST'));
    });
    (0, node_test_1.default)('导玩员不在 management-metadata 角色白名单中（无治理权限）', () => {
        const roles = Reflect.getMetadata(identity_access_decorator_1.ROLES_METADATA_KEY, resilience_operations_controller_1.ResilienceOperationsController.prototype.getManagementMetadata);
        strict_1.default.ok(!roles.includes('GUIDE'));
    });
    (0, node_test_1.default)('导玩员不在 recovery-plans 角色白名单中（隔离边界）', () => {
        const roles = Reflect.getMetadata(identity_access_decorator_1.ROLES_METADATA_KEY, resilience_operations_controller_1.ResilienceOperationsController.prototype.getRecoveryPlans);
        strict_1.default.ok(!roles.includes('GUIDE'));
    });
    (0, node_test_1.default)('导玩员不在 edge-replay 写操作白名单中（无运维权限）', () => {
        const roles = Reflect.getMetadata(identity_access_decorator_1.ROLES_METADATA_KEY, resilience_operations_controller_1.ResilienceOperationsController.prototype.stageEdgeReplay);
        strict_1.default.ok(!roles.includes('GUIDE'));
    });
});
// ──────────── 🎯运行专员 ────────────
(0, node_test_1.describe)(`${ROLES.Ops} resilience-operations 角色测试`, () => {
    (0, node_test_1.default)('运行专员可查看 overview 获取系统运维总览', () => {
        const ctrl = createResilienceOpsController();
        const result = ctrl.getOperationsOverview();
        strict_1.default.ok(result);
        strict_1.default.ok(result.observability.degradedSignals >= 0);
        strict_1.default.ok(result.generatedAt);
    });
    (0, node_test_1.default)('运行专员可查看 retry-policies 了解重试策略', () => {
        const ctrl = createResilienceOpsController();
        const result = ctrl.getRetryPolicies({});
        strict_1.default.ok(result.policies);
        strict_1.default.ok(result.policies.length > 0);
    });
    (0, node_test_1.default)('运行专员可查看 recovery plan 详情用于故障演练', () => {
        const ctrl = createResilienceOpsController();
        const result = ctrl.getRecoveryPlan('booking-db');
        strict_1.default.equal(result.resource, 'booking-db');
        strict_1.default.ok(result.steps);
    });
    (0, node_test_1.default)('运行专员可 stage edge-replay 触发门店数据回放', () => {
        const ctrl = createResilienceOpsController();
        const result = ctrl.stageEdgeReplay({ storeId: 'store-001', operationCount: 5 });
        strict_1.default.ok(result.staged);
        strict_1.default.equal(result.storeId, 'store-001');
        strict_1.default.equal(result.operationCount, 5);
    });
    (0, node_test_1.default)('运行专员在 edge-replay 端点白名单中（可执行写操作）', () => {
        const roles = Reflect.getMetadata(identity_access_decorator_1.ROLES_METADATA_KEY, resilience_operations_controller_1.ResilienceOperationsController.prototype.stageEdgeReplay);
        strict_1.default.ok(roles.includes('OPERATIONS'));
    });
    (0, node_test_1.default)('运行专员有权查看 observability 信号用于监控值班', () => {
        const ctrl = createResilienceOpsController();
        const result = ctrl.getObservabilitySignals({});
        strict_1.default.ok(result);
    });
});
// ──────────── 🤝团建 ────────────
(0, node_test_1.describe)(`${ROLES.Teambuilding} resilience-operations 角色测试`, () => {
    (0, node_test_1.default)('团建不在 overview 角色白名单中（团建无需运维监控）', () => {
        const roles = Reflect.getMetadata(identity_access_decorator_1.ROLES_METADATA_KEY, resilience_operations_controller_1.ResilienceOperationsController.prototype.getOperationsOverview);
        strict_1.default.ok(!roles.includes('TEAMBUILDING'));
        strict_1.default.ok(!roles.includes('TEAMBUILD'));
    });
    (0, node_test_1.default)('团建不在 retry-policies 角色白名单中', () => {
        const roles = Reflect.getMetadata(identity_access_decorator_1.ROLES_METADATA_KEY, resilience_operations_controller_1.ResilienceOperationsController.prototype.getRetryPolicies);
        strict_1.default.ok(!roles.includes('TEAMBUILDING'));
    });
    (0, node_test_1.default)('团建不在 recovery-plans 角色白名单中（无灾备访问权限）', () => {
        const roles = Reflect.getMetadata(identity_access_decorator_1.ROLES_METADATA_KEY, resilience_operations_controller_1.ResilienceOperationsController.prototype.getRecoveryPlans);
        strict_1.default.ok(!roles.includes('TEAMBUILDING'));
    });
    (0, node_test_1.default)('团建不在 edge-replay 角色白名单中（无运维写权限）', () => {
        const roles = Reflect.getMetadata(identity_access_decorator_1.ROLES_METADATA_KEY, resilience_operations_controller_1.ResilienceOperationsController.prototype.stageEdgeReplay);
        strict_1.default.ok(!roles.includes('TEAMBUILDING'));
    });
});
// ──────────── 📢营销 ────────────
(0, node_test_1.describe)(`${ROLES.Marketing} resilience-operations 角色测试`, () => {
    (0, node_test_1.default)('营销不在 overview 角色白名单中', () => {
        const roles = Reflect.getMetadata(identity_access_decorator_1.ROLES_METADATA_KEY, resilience_operations_controller_1.ResilienceOperationsController.prototype.getOperationsOverview);
        strict_1.default.ok(!roles.includes('MARKETING'));
        strict_1.default.ok(!roles.includes('PROMOTION'));
    });
    (0, node_test_1.default)('营销不在 management-metadata 角色白名单中（无治理权限）', () => {
        const roles = Reflect.getMetadata(identity_access_decorator_1.ROLES_METADATA_KEY, resilience_operations_controller_1.ResilienceOperationsController.prototype.getManagementMetadata);
        strict_1.default.ok(!roles.includes('MARKETING'));
    });
    (0, node_test_1.default)('营销不在 observability 端点角色白名单中', () => {
        const roles = Reflect.getMetadata(identity_access_decorator_1.ROLES_METADATA_KEY, resilience_operations_controller_1.ResilienceOperationsController.prototype.getObservabilitySignals);
        strict_1.default.ok(!roles.includes('MARKETING'));
    });
    (0, node_test_1.default)('营销不在 edge-replay 写操作白名单中（数据写隔离）', () => {
        const roles = Reflect.getMetadata(identity_access_decorator_1.ROLES_METADATA_KEY, resilience_operations_controller_1.ResilienceOperationsController.prototype.stageEdgeReplay);
        strict_1.default.ok(!roles.includes('MARKETING'));
    });
});
// ──────────── 元数据回归 ────────────
(0, node_test_1.describe)('resilience-operations 角色元数据回归', () => {
    (0, node_test_1.default)('management-metadata 端点要求 4 个特定角色 + 1 个权限', () => {
        const roles = Reflect.getMetadata(identity_access_decorator_1.ROLES_METADATA_KEY, resilience_operations_controller_1.ResilienceOperationsController.prototype.getManagementMetadata);
        const permissions = Reflect.getMetadata(identity_access_decorator_1.PERMISSIONS_METADATA_KEY, resilience_operations_controller_1.ResilienceOperationsController.prototype.getManagementMetadata);
        strict_1.default.deepEqual(roles, ['SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS', 'SECURITY_ADMIN']);
        strict_1.default.deepEqual(permissions, ['foundation.governance.read']);
    });
    (0, node_test_1.default)('overview 端点要求 4 个特定角色 + 1 个权限', () => {
        const roles = Reflect.getMetadata(identity_access_decorator_1.ROLES_METADATA_KEY, resilience_operations_controller_1.ResilienceOperationsController.prototype.getOperationsOverview);
        const permissions = Reflect.getMetadata(identity_access_decorator_1.PERMISSIONS_METADATA_KEY, resilience_operations_controller_1.ResilienceOperationsController.prototype.getOperationsOverview);
        strict_1.default.deepEqual(roles, ['SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS', 'SECURITY_ADMIN']);
        strict_1.default.deepEqual(permissions, ['foundation.governance.read']);
    });
    (0, node_test_1.default)('observability 端点要求 4 个特定角色 + 1 个权限', () => {
        const roles = Reflect.getMetadata(identity_access_decorator_1.ROLES_METADATA_KEY, resilience_operations_controller_1.ResilienceOperationsController.prototype.getObservabilitySignals);
        const permissions = Reflect.getMetadata(identity_access_decorator_1.PERMISSIONS_METADATA_KEY, resilience_operations_controller_1.ResilienceOperationsController.prototype.getObservabilitySignals);
        strict_1.default.deepEqual(roles, ['SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS', 'SECURITY_ADMIN']);
        strict_1.default.deepEqual(permissions, ['foundation.governance.read']);
    });
    (0, node_test_1.default)('recovery-plans 端点要求 4 个特定角色 + 1 个权限', () => {
        const roles = Reflect.getMetadata(identity_access_decorator_1.ROLES_METADATA_KEY, resilience_operations_controller_1.ResilienceOperationsController.prototype.getRecoveryPlans);
        const permissions = Reflect.getMetadata(identity_access_decorator_1.PERMISSIONS_METADATA_KEY, resilience_operations_controller_1.ResilienceOperationsController.prototype.getRecoveryPlans);
        strict_1.default.deepEqual(roles, ['SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS', 'SECURITY_ADMIN']);
        strict_1.default.deepEqual(permissions, ['foundation.governance.read']);
    });
    (0, node_test_1.default)('edge-replay stage 端点要求 3 个特定角色 + 1 个写权限', () => {
        const roles = Reflect.getMetadata(identity_access_decorator_1.ROLES_METADATA_KEY, resilience_operations_controller_1.ResilienceOperationsController.prototype.stageEdgeReplay);
        const permissions = Reflect.getMetadata(identity_access_decorator_1.PERMISSIONS_METADATA_KEY, resilience_operations_controller_1.ResilienceOperationsController.prototype.stageEdgeReplay);
        strict_1.default.deepEqual(roles, ['SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS']);
        strict_1.default.deepEqual(permissions, ['foundation.operations.recovery.write']);
    });
    (0, node_test_1.default)('controller 类级别要求租户作用域', () => {
        const tenantScope = Reflect.getMetadata(identity_access_decorator_1.TENANT_SCOPE_METADATA_KEY, resilience_operations_controller_1.ResilienceOperationsController);
        strict_1.default.deepEqual(tenantScope, {});
    });
    (0, node_test_1.default)('只读端点（read）拒绝写权限角色交叉访问', () => {
        const readOnlyEndpoints = ['getManagementMetadata', 'getOperationsOverview', 'getObservabilitySignals', 'getRecoveryPlans', 'getRetryPolicies', 'getRecoveryPlan'];
        for (const method of readOnlyEndpoints) {
            const perms = Reflect.getMetadata(identity_access_decorator_1.PERMISSIONS_METADATA_KEY, resilience_operations_controller_1.ResilienceOperationsController.prototype[method]);
            // 只读端点应有 foundation.governance.read 权限
            strict_1.default.deepEqual(perms, ['foundation.governance.read'], `${method} should require read permission`);
            // 只读端点不应包含写权限
            strict_1.default.ok(!perms.includes('foundation.operations.recovery.write'), `${method} should NOT require write permission`);
        }
    });
    (0, node_test_1.default)('写端点（stage-edge-replay）确认不能仅凭只读权限访问', () => {
        const perms = Reflect.getMetadata(identity_access_decorator_1.PERMISSIONS_METADATA_KEY, resilience_operations_controller_1.ResilienceOperationsController.prototype.stageEdgeReplay);
        strict_1.default.ok(perms.includes('foundation.operations.recovery.write'));
        strict_1.default.ok(!perms.includes('foundation.governance.read'));
    });
    (0, node_test_1.default)('所有路由端点均定义了角色元数据（无缺漏）', () => {
        const allEndpoints = Object.getOwnPropertyNames(resilience_operations_controller_1.ResilienceOperationsController.prototype).filter((name) => name !== 'constructor');
        for (const method of allEndpoints) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const roles = Reflect.getMetadata(identity_access_decorator_1.ROLES_METADATA_KEY, resilience_operations_controller_1.ResilienceOperationsController.prototype[method]);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const perms = Reflect.getMetadata(identity_access_decorator_1.PERMISSIONS_METADATA_KEY, resilience_operations_controller_1.ResilienceOperationsController.prototype[method]);
            strict_1.default.ok(Array.isArray(roles) && roles.length > 0, `${method} should have roles defined`);
            strict_1.default.ok(Array.isArray(perms) && perms.length > 0, `${method} should have permissions defined`);
        }
    });
});
//# sourceMappingURL=resilience-operations.role.test.js.map