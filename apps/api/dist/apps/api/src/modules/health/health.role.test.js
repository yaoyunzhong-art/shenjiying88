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
const health_controller_1 = require("./health.controller");
const identity_access_decorator_1 = require("../foundation/identity-access/identity-access.decorator");
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
function createHealthController(overrides = {}) {
    const defaultComponents = [
        { name: 'database', status: 'OK', latencyMs: 5, detail: { connected: true } },
        { name: 'lyt-adapter', status: 'OK', latencyMs: 3, detail: { mode: 'mock' } }
    ];
    const result = overrides.checkResult ?? {
        status: 'OK',
        components: defaultComponents,
        uptimeSeconds: 3600,
        version: '1.0.0',
        lytMode: 'mock'
    };
    return {
        controller: new health_controller_1.HealthController({
            check: () => Promise.resolve(result),
            ping: () => Promise.resolve({ alive: true, timestamp: new Date().toISOString() })
        })
    };
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
const baseReadinessArgs = [
    { tenantId: 't-health', brandId: 'b-health' },
    makeActor([], []),
    { verbose: true }
];
// ──────────── 👔店长 ────────────
(0, node_test_1.describe)(`${ROLES.TenantAdmin} health 角色测试`, () => {
    (0, node_test_1.default)('店长可调用 readiness 获取系统完整健康信息', async () => {
        const { controller } = createHealthController();
        const result = await controller.getReadiness({ tenantId: 't-01', brandId: 'b-01' }, makeActor(['TENANT_ADMIN'], ['foundation.governance.read']), { verbose: true });
        strict_1.default.equal(result.status, 'OK');
        strict_1.default.equal(result.version, '1.0.0');
        strict_1.default.ok(Array.isArray(result.components));
        strict_1.default.ok(result.components.length >= 2);
        strict_1.default.equal(result.lytMode, 'mock');
    });
    (0, node_test_1.default)('店长无 governance.read 权限时 readiness 元数据不匹配（权限边界）', () => {
        const permittedRoles = Reflect.getMetadata(identity_access_decorator_1.ROLES_METADATA_KEY, health_controller_1.HealthController.prototype.getReadiness);
        const permittedPerms = Reflect.getMetadata(identity_access_decorator_1.PERMISSIONS_METADATA_KEY, health_controller_1.HealthController.prototype.getReadiness);
        // 店长在允许角色中
        strict_1.default.ok(permittedRoles.includes('TENANT_ADMIN'));
        // 但必须同时具备 foundation.governance.read 权限
        strict_1.default.deepEqual(permittedPerms, ['foundation.governance.read']);
    });
});
// ──────────── 🛒前台 ────────────
(0, node_test_1.describe)(`${ROLES.Reception} health 角色测试`, () => {
    (0, node_test_1.default)('前台可通过 ping 获取轻量存活信息', async () => {
        const { controller } = createHealthController();
        const result = await controller.getPing();
        strict_1.default.equal(result.alive, true);
        strict_1.default.ok(typeof result.timestamp === 'string');
    });
    (0, node_test_1.default)('前台不在 readiness 允许角色列表中（权限边界）', () => {
        const roles = Reflect.getMetadata(identity_access_decorator_1.ROLES_METADATA_KEY, health_controller_1.HealthController.prototype.getReadiness);
        strict_1.default.ok(!roles.includes('RECEPTION'));
        strict_1.default.ok(!roles.includes('FRONT_DESK'));
    });
});
// ──────────── 👥HR ────────────
(0, node_test_1.describe)(`${ROLES.HR} health 角色测试`, () => {
    (0, node_test_1.default)('HR 不在 readiness 白名单中，仅能通过 ping 确认服务存活', async () => {
        const { controller } = createHealthController();
        const pingResult = await controller.getPing();
        strict_1.default.equal(pingResult.alive, true);
        strict_1.default.ok(pingResult.timestamp);
        // HR 不在 readiness 角色集合中
        const roles = Reflect.getMetadata(identity_access_decorator_1.ROLES_METADATA_KEY, health_controller_1.HealthController.prototype.getReadiness);
        strict_1.default.ok(!roles.includes('HR'));
    });
    (0, node_test_1.default)('HR 调用 ping 返回标准格式的时间戳', async () => {
        const { controller } = createHealthController();
        const r1 = await controller.getPing();
        const r2 = await controller.getPing();
        strict_1.default.equal(r1.alive, true);
        strict_1.default.equal(r2.alive, true);
        // 两次调用应有时间戳
        strict_1.default.ok(new Date(r1.timestamp).getTime() > 0);
        strict_1.default.ok(new Date(r2.timestamp).getTime() > 0);
    });
});
// ──────────── 🔧安监 ────────────
(0, node_test_1.describe)(`${ROLES.Safety} health 角色测试`, () => {
    (0, node_test_1.default)('安监 (SECURITY_ADMIN) 可调用 readiness 检查系统安全状态', async () => {
        const { controller } = createHealthController();
        const result = await controller.getReadiness({ tenantId: 't-safety', brandId: 'b-safety' }, makeActor(['SECURITY_ADMIN'], ['foundation.governance.read']), { verbose: true });
        strict_1.default.equal(result.status, 'OK');
        // 安全人员关心组件列表完整性
        strict_1.default.ok(result.components.find((c) => c.name === 'database') !== undefined);
        strict_1.default.ok(result.components.find((c) => c.name === 'lyt-adapter') !== undefined);
    });
    (0, node_test_1.default)('安监调用 readiness 需同时具备 SECURITY_ADMIN 角色和 governance.read 权限（双因素边界）', () => {
        const roles = Reflect.getMetadata(identity_access_decorator_1.ROLES_METADATA_KEY, health_controller_1.HealthController.prototype.getReadiness);
        const permissions = Reflect.getMetadata(identity_access_decorator_1.PERMISSIONS_METADATA_KEY, health_controller_1.HealthController.prototype.getReadiness);
        strict_1.default.ok(roles.includes('SECURITY_ADMIN'));
        strict_1.default.deepEqual(permissions, ['foundation.governance.read']);
    });
});
// ──────────── 🎮导玩员 ────────────
(0, node_test_1.describe)(`${ROLES.Guide} health 角色测试`, () => {
    (0, node_test_1.default)('导玩员通过根 health 端点获取基础健康信息', async () => {
        const { controller } = createHealthController();
        const result = await controller.getHealth();
        strict_1.default.equal(result.alive, true);
        strict_1.default.ok(typeof result.timestamp === 'string');
    });
    (0, node_test_1.default)('导玩员无权访问 readiness 详细健康数据（只读边界）', () => {
        const roles = Reflect.getMetadata(identity_access_decorator_1.ROLES_METADATA_KEY, health_controller_1.HealthController.prototype.getReadiness);
        strict_1.default.ok(!roles.includes('GUIDE'));
        strict_1.default.ok(!roles.includes('GAME_HOST'));
    });
});
// ──────────── 🎯运行专员 ────────────
(0, node_test_1.describe)(`${ROLES.Ops} health 角色测试`, () => {
    (0, node_test_1.default)('运行专员 (OPERATIONS) 可调用 readiness 获取运维监控数据', async () => {
        const { controller } = createHealthController();
        const result = await controller.getReadiness({ tenantId: 't-ops', brandId: 'b-ops' }, makeActor(['OPERATIONS'], ['foundation.governance.read']), { verbose: true });
        strict_1.default.equal(result.status, 'OK');
        strict_1.default.ok(result.uptimeSeconds >= 0);
        strict_1.default.ok(result.components.every((c) => c.latencyMs >= 0));
    });
    (0, node_test_1.default)('运行专员调用 readiness 时可观察到 lyt 模式', async () => {
        const { controller } = createHealthController();
        const result = await controller.getReadiness({ tenantId: 't-ops', brandId: 'b-ops' }, makeActor(['OPERATIONS'], ['foundation.governance.read']), { verbose: true });
        // 运行专员关心 LYT 集成状态
        strict_1.default.ok(typeof result.lytMode === 'string');
    });
});
// ──────────── 🤝团建 ────────────
(0, node_test_1.describe)(`${ROLES.Teambuilding} health 角色测试`, () => {
    (0, node_test_1.default)('团建通过 getHealth 确认系统可用后开展活动', async () => {
        const { controller } = createHealthController();
        const result = await controller.getHealth();
        strict_1.default.equal(result.alive, true);
        strict_1.default.ok(result.timestamp);
    });
    (0, node_test_1.default)('团建无权访问 readiness 内部组件详情（隔离边界）', () => {
        const roles = Reflect.getMetadata(identity_access_decorator_1.ROLES_METADATA_KEY, health_controller_1.HealthController.prototype.getReadiness);
        strict_1.default.ok(!roles.includes('TEAMBUILDING'));
        strict_1.default.ok(!roles.includes('TEAMBUILD'));
    });
});
// ──────────── 📢营销 ────────────
(0, node_test_1.describe)(`${ROLES.Marketing} health 角色测试`, () => {
    (0, node_test_1.default)('营销通过 ping 确认系统存活以便触达活动', async () => {
        const { controller } = createHealthController();
        const result = await controller.getPing();
        strict_1.default.equal(result.alive, true);
        strict_1.default.ok(result.timestamp);
    });
    (0, node_test_1.default)('营销不在 readiness 允许角色中，无权查看系统内部组件（权限边界）', () => {
        const roles = Reflect.getMetadata(identity_access_decorator_1.ROLES_METADATA_KEY, health_controller_1.HealthController.prototype.getReadiness);
        strict_1.default.ok(!roles.includes('MARKETING'));
        strict_1.default.ok(!roles.includes('PROMOTION'));
    });
});
// ──────────── 元数据回归 ────────────
(0, node_test_1.describe)('health 角色元数据回归', () => {
    (0, node_test_1.default)('readiness 端点要求 4 个特定角色 + 1 个权限', () => {
        const roles = Reflect.getMetadata(identity_access_decorator_1.ROLES_METADATA_KEY, health_controller_1.HealthController.prototype.getReadiness);
        const permissions = Reflect.getMetadata(identity_access_decorator_1.PERMISSIONS_METADATA_KEY, health_controller_1.HealthController.prototype.getReadiness);
        const tenantScope = Reflect.getMetadata(identity_access_decorator_1.TENANT_SCOPE_METADATA_KEY, health_controller_1.HealthController.prototype.getReadiness);
        strict_1.default.deepEqual(roles, ['SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS', 'SECURITY_ADMIN']);
        strict_1.default.deepEqual(permissions, ['foundation.governance.read']);
        strict_1.default.deepEqual(tenantScope, {});
    });
    (0, node_test_1.default)('ping 和根端点无角色/权限限制', () => {
        for (const method of ['getPing', 'getHealth']) {
            const roles = Reflect.getMetadata(identity_access_decorator_1.ROLES_METADATA_KEY, health_controller_1.HealthController.prototype[method]);
            const permissions = Reflect.getMetadata(identity_access_decorator_1.PERMISSIONS_METADATA_KEY, health_controller_1.HealthController.prototype[method]);
            strict_1.default.equal(roles, undefined);
            strict_1.default.equal(permissions, undefined);
        }
    });
    (0, node_test_1.default)('所有允许角色在 readiness 白名单中确保运营连续性', () => {
        const roles = Reflect.getMetadata(identity_access_decorator_1.ROLES_METADATA_KEY, health_controller_1.HealthController.prototype.getReadiness);
        // 运维三剑客 + 超级管理员
        strict_1.default.ok(roles.includes('SUPER_ADMIN'));
        strict_1.default.ok(roles.includes('TENANT_ADMIN'));
        strict_1.default.ok(roles.includes('OPERATIONS'));
        strict_1.default.ok(roles.includes('SECURITY_ADMIN'));
    });
});
//# sourceMappingURL=health.role.test.js.map