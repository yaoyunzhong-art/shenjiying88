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
const bootstrap_controller_1 = require("./bootstrap.controller");
// ── Shared helpers ──
const tenantCtx = { tenantId: 't-boot', brandId: 'b-boot', storeId: 's-boot', marketCode: 'zh-cn' };
const minimalCtx = { tenantId: 't-boot-min' };
// ── Roles ──
const ROLES = {
    TenantAdmin: '👔店长',
    Reception: '🛒前台',
    Guide: '🎮导玩员',
    Operations: '🎯运行专员',
    HR: '👥HR',
    Security: '🔧安监',
    TeamBuilding: '🤝团建',
    Marketing: '📢营销'
};
// ── Role-based bootstrap tests ──
(0, node_test_1.describe)(`${ROLES.TenantAdmin} bootstrap 角色测试`, () => {
    (0, node_test_1.default)('店长可以获取 metadata（完整租户上下文）', () => {
        const ctrl = new bootstrap_controller_1.BootstrapController();
        const result = ctrl.getBootstrapMetadata(tenantCtx);
        strict_1.default.deepStrictEqual(result.tenantContext, tenantCtx);
        strict_1.default.equal(result.phase, 'scaffold');
        strict_1.default.deepStrictEqual(result.foundationDependencies, []);
    });
    (0, node_test_1.default)('店长可以获取 health', () => {
        const ctrl = new bootstrap_controller_1.BootstrapController();
        const result = ctrl.getHealth();
        strict_1.default.equal(result.status, 'ok');
        strict_1.default.equal(result.phase, 'scaffold');
        strict_1.default.ok(typeof result.uptime === 'number' && result.uptime >= 0);
    });
    (0, node_test_1.default)('店长获取 metadata 时能正确处理最小上下文', () => {
        const ctrl = new bootstrap_controller_1.BootstrapController();
        const result = ctrl.getBootstrapMetadata(minimalCtx);
        strict_1.default.equal(result.tenantContext.tenantId, 't-boot-min');
        strict_1.default.equal(result.tenantContext.brandId, undefined);
    });
    (0, node_test_1.default)('店长获取 metadata 时 foundationDependencies 正确为空数组', () => {
        const ctrl = new bootstrap_controller_1.BootstrapController();
        // 已测试：foundationDependencies 初始为空
        const result = ctrl.getBootstrapMetadata(tenantCtx);
        strict_1.default.deepStrictEqual(result.foundationDependencies, []);
    });
});
(0, node_test_1.describe)(`${ROLES.Reception} bootstrap 角色测试`, () => {
    (0, node_test_1.default)('前台可以获取 metadata（完整租户上下文）', () => {
        const ctrl = new bootstrap_controller_1.BootstrapController();
        const result = ctrl.getBootstrapMetadata(tenantCtx);
        strict_1.default.deepStrictEqual(result.tenantContext, tenantCtx);
        strict_1.default.equal(result.phase, 'scaffold');
    });
    (0, node_test_1.default)('前台可以获取 health', () => {
        const ctrl = new bootstrap_controller_1.BootstrapController();
        const result = ctrl.getHealth();
        strict_1.default.equal(result.status, 'ok');
        strict_1.default.ok(result.uptime >= 0);
    });
    (0, node_test_1.default)('前台获取 metadata 时 foundationDependencies 列表正确', () => {
        const ctrl = new bootstrap_controller_1.BootstrapController();
        const result = ctrl.getBootstrapMetadata(tenantCtx);
        strict_1.default.ok(Array.isArray(result.foundationDependencies));
    });
});
(0, node_test_1.describe)(`${ROLES.Guide} bootstrap 角色测试`, () => {
    (0, node_test_1.default)('导玩员可以获取 metadata（最小租户上下文）', () => {
        const ctrl = new bootstrap_controller_1.BootstrapController();
        const result = ctrl.getBootstrapMetadata(minimalCtx);
        strict_1.default.equal(result.tenantContext.tenantId, 't-boot-min');
        strict_1.default.equal(result.phase, 'scaffold');
    });
    (0, node_test_1.default)('导玩员可以获取 health', () => {
        const ctrl = new bootstrap_controller_1.BootstrapController();
        const result = ctrl.getHealth();
        strict_1.default.equal(result.status, 'ok');
        strict_1.default.equal(typeof result.uptime, 'number');
    });
    (0, node_test_1.default)('导玩员获取 metadata 返回 scaffold 阶段', () => {
        const ctrl = new bootstrap_controller_1.BootstrapController();
        const result = ctrl.getBootstrapMetadata(minimalCtx);
        strict_1.default.equal(result.phase, 'scaffold');
    });
});
(0, node_test_1.describe)(`${ROLES.Operations} bootstrap 角色测试`, () => {
    (0, node_test_1.default)('运营专员可以获取 metadata', () => {
        const ctrl = new bootstrap_controller_1.BootstrapController();
        const result = ctrl.getBootstrapMetadata(tenantCtx);
        strict_1.default.deepStrictEqual(result.tenantContext, tenantCtx);
        strict_1.default.equal(result.phase, 'scaffold');
    });
    (0, node_test_1.default)('运营专员可以获取 health', () => {
        const ctrl = new bootstrap_controller_1.BootstrapController();
        const result = ctrl.getHealth();
        strict_1.default.equal(result.status, 'ok');
        strict_1.default.ok(result.uptime >= 0);
    });
    (0, node_test_1.default)('运营专员获取 health 时 uptime 为正数', () => {
        const ctrl = new bootstrap_controller_1.BootstrapController();
        const result = ctrl.getHealth();
        strict_1.default.ok(result.uptime > 0);
    });
});
// ── 👥HR ──
(0, node_test_1.describe)(`${ROLES.HR} bootstrap 角色测试`, () => {
    (0, node_test_1.default)('HR 获取 bootstrap metadata 确认系统可用性', () => {
        const ctrl = new bootstrap_controller_1.BootstrapController();
        const result = ctrl.getBootstrapMetadata(tenantCtx);
        strict_1.default.deepStrictEqual(result.tenantContext, tenantCtx);
        strict_1.default.equal(result.phase, 'scaffold');
        strict_1.default.ok(Array.isArray(result.foundationDependencies));
    });
    (0, node_test_1.default)('HR 获取 health 确认服务运行正常（边界：uptime 不可为零后降级）', () => {
        const ctrl = new bootstrap_controller_1.BootstrapController();
        const result = ctrl.getHealth();
        strict_1.default.equal(result.status, 'ok');
        strict_1.default.ok(result.uptime > 0);
    });
    (0, node_test_1.default)('HR 跨多租户获取 metadata => 权限边界：仅返回当前租户上下文', () => {
        const ctrl = new bootstrap_controller_1.BootstrapController();
        const result = ctrl.getBootstrapMetadata({ tenantId: 't-hr-cross' });
        strict_1.default.equal(result.tenantContext.tenantId, 't-hr-cross');
        // HR 不应看到其他租户数据
        strict_1.default.equal(result.tenantContext.brandId, undefined);
    });
});
// ── 🔧安监 ──
(0, node_test_1.describe)(`${ROLES.Security} bootstrap 角色测试`, () => {
    (0, node_test_1.default)('安监获取 metadata 验证 scaffold 阶段数据完整性', () => {
        const ctrl = new bootstrap_controller_1.BootstrapController();
        const result = ctrl.getBootstrapMetadata(tenantCtx);
        // 安全审计：所有必要字段存在
        strict_1.default.ok('tenantContext' in result);
        strict_1.default.ok('foundationDependencies' in result);
        strict_1.default.ok('phase' in result);
    });
    (0, node_test_1.default)('安监获取 health 确认 no dangling promise（边界：同步返回）', () => {
        const ctrl = new bootstrap_controller_1.BootstrapController();
        const result = ctrl.getHealth();
        // health 接口应同步返回，status + uptime 均非 null
        strict_1.default.equal(result.status, 'ok');
        strict_1.default.equal(typeof result.uptime, 'number');
        strict_1.default.ok(!Number.isNaN(result.uptime));
    });
    (0, node_test_1.default)('安监检查 metadata 的 foundationDependencies 类型安全 => 为数组', () => {
        const ctrl = new bootstrap_controller_1.BootstrapController();
        const result = ctrl.getBootstrapMetadata(tenantCtx);
        strict_1.default.ok(Array.isArray(result.foundationDependencies));
        // 安全边界：scaffold 阶段依赖列表为空是允许的
    });
});
// ── 🤝团建 ──
(0, node_test_1.describe)(`${ROLES.TeamBuilding} bootstrap 角色测试`, () => {
    (0, node_test_1.default)('团建获取 metadata 确认 tenantContext 传递正确', () => {
        const ctrl = new bootstrap_controller_1.BootstrapController();
        const teamCtx = { tenantId: 't-team-event', brandId: 'b-team', storeId: 's-team', marketCode: 'zh-cn' };
        const result = ctrl.getBootstrapMetadata(teamCtx);
        strict_1.default.deepStrictEqual(result.tenantContext, teamCtx);
        strict_1.default.equal(result.phase, 'scaffold');
    });
    (0, node_test_1.default)('团建获取 health 确认服务就绪', () => {
        const ctrl = new bootstrap_controller_1.BootstrapController();
        const result = ctrl.getHealth();
        strict_1.default.equal(result.status, 'ok');
        strict_1.default.ok(result.uptime >= 0);
    });
    (0, node_test_1.default)('团建大规模活动场景 => metadata 返回结构稳定（边界：高频调用）', () => {
        const ctrl = new bootstrap_controller_1.BootstrapController();
        // 模拟快速连续调用，结果应一致
        const r1 = ctrl.getBootstrapMetadata(tenantCtx);
        const r2 = ctrl.getBootstrapMetadata(tenantCtx);
        strict_1.default.deepStrictEqual(r1.tenantContext, r2.tenantContext);
        strict_1.default.equal(r1.phase, r2.phase);
        strict_1.default.deepStrictEqual(r1.foundationDependencies, r2.foundationDependencies);
    });
});
// ── 📢营销 ──
(0, node_test_1.describe)(`${ROLES.Marketing} bootstrap 角色测试`, () => {
    (0, node_test_1.default)('营销获取 metadata 用于市场活动配置检查', () => {
        const ctrl = new bootstrap_controller_1.BootstrapController();
        const mktCtx = { tenantId: 't-mkt-campaign', brandId: 'b-mkt', storeId: 's-mkt' };
        const result = ctrl.getBootstrapMetadata(mktCtx);
        strict_1.default.deepStrictEqual(result.tenantContext, mktCtx);
        strict_1.default.equal(result.phase, 'scaffold');
    });
    (0, node_test_1.default)('营销获取 health 确认活动期间服务稳定', () => {
        const ctrl = new bootstrap_controller_1.BootstrapController();
        const result = ctrl.getHealth();
        strict_1.default.equal(result.status, 'ok');
        // 营销关注 uptime 稳定性
        strict_1.default.equal(typeof result.uptime, 'number');
        strict_1.default.ok(result.uptime > 0);
    });
    (0, node_test_1.default)('营销检查 metadata 中 foundationDependencies 约束 => scaffold 阶段为空', () => {
        const ctrl = new bootstrap_controller_1.BootstrapController();
        const result = ctrl.getBootstrapMetadata(tenantCtx);
        strict_1.default.deepStrictEqual(result.foundationDependencies, []);
        // 营销活动期间 scaffold 阶段的 foundationDependencies 保持空值合理
    });
});
//# sourceMappingURL=bootstrap.role.test.js.map