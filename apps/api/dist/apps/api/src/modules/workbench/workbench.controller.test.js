"use strict";
/**
 * 🐜 自动: [workbench] [C] 角色测试编写
 *
 * 完整工作台 controller 测试（正例 + 反例 + 边界 + 8 角色视角 + 权限边界）
 *
 * 8 角色:
 * 👔店长(STORE_MANAGER) 🛒前台(CASHIER) 👥HR(TENANT_ADMIN) 🔧安监(SECURITY_ADMIN/SUPER_ADMIN)
 * 🎮导玩员(GUIDE) 🎯运行专员(OPERATIONS) 🤝团建(TEAM_BUILDING 无映射) 📢营销(MARKETING 无映射)
 *
 * 覆盖:
 * - 角色 → 端点装饰器元数据验证 (@RequireRoles)
 * - 角色能力权限边界 (谁有/没有特定能力)
 * - 角色渠道分配 (PC vs PAD)
 * - read 端点和 action 端点的角色划分
 * - secret-rotation 角色限制 (SUPER_ADMIN + SECURITY_ADMIN)
 *
 * 注意: channel 使用 ClientChannel 枚举值: PC, PAD (全大写)
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
const identity_access_decorator_1 = require("../foundation/identity-access/identity-access.decorator");
const workbench_controller_1 = require("./workbench.controller");
const workbench_service_1 = require("./workbench.service");
// ── Mock 依赖构造: 只需要 service 层 ──
function createService() {
    // getRoleWorkbenches 使用原型上纯方法，不需要 mock 外部依赖
    // getBootstrap 需要完整依赖链，此处跳过
    return new workbench_service_1.WorkbenchService(null, null, null, null);
}
function createController() {
    const service = createService();
    return new workbench_controller_1.WorkbenchController(service);
}
// ── 角色常量 ──
const ROLES = {
    StoreManager: '👔店长',
    FrontDesk: '🛒前台',
    HR: '👥HR',
    Security: '🔧安监',
    Guide: '🎮导玩员',
    Operations: '🎯运行专员',
    Teambuilding: '🤝团建',
    Marketing: '📢营销',
};
// ══════════════════════════════════════════════════
// 1. 路径 / 方法元数据
// ══════════════════════════════════════════════════
(0, node_test_1.describe)('workbench controller metadata', () => {
    const expectedRoles = [
        'SUPER_ADMIN',
        'TENANT_ADMIN',
        'BRAND_MANAGER',
        'STORE_MANAGER',
        'GUIDE',
        'CASHIER',
        'OPERATIONS',
        'SECURITY_ADMIN',
    ];
    (0, node_test_1.default)('controller path is "workbenches"', () => {
        const path = Reflect.getMetadata('path', workbench_controller_1.WorkbenchController);
        strict_1.default.equal(path, 'workbenches');
    });
    (0, node_test_1.default)('getBootstrap route: GET /workbenches/bootstrap', () => {
        const method = Reflect.getMetadata('method', workbench_controller_1.WorkbenchController.prototype.getBootstrap);
        const path = Reflect.getMetadata('path', workbench_controller_1.WorkbenchController.prototype.getBootstrap);
        strict_1.default.equal(method, 0); // GET
        strict_1.default.equal(path, 'bootstrap');
    });
    (0, node_test_1.default)('getWorkbenches route: GET /workbenches', () => {
        const method = Reflect.getMetadata('method', workbench_controller_1.WorkbenchController.prototype.getWorkbenches);
        const path = Reflect.getMetadata('path', workbench_controller_1.WorkbenchController.prototype.getWorkbenches);
        strict_1.default.equal(method, 0); // GET
        strict_1.default.equal(path, '/');
    });
    (0, node_test_1.default)('getNavItems route: GET /workbenches/nav-items', () => {
        const method = Reflect.getMetadata('method', workbench_controller_1.WorkbenchController.prototype.getNavItems);
        const path = Reflect.getMetadata('path', workbench_controller_1.WorkbenchController.prototype.getNavItems);
        strict_1.default.equal(method, 0); // GET
        strict_1.default.equal(path, 'nav-items');
    });
    (0, node_test_1.default)('checkCapability route: GET /workbenches/capability-check', () => {
        const method = Reflect.getMetadata('method', workbench_controller_1.WorkbenchController.prototype.checkCapability);
        const path = Reflect.getMetadata('path', workbench_controller_1.WorkbenchController.prototype.checkCapability);
        strict_1.default.equal(method, 0); // GET
        strict_1.default.equal(path, 'capability-check');
    });
    (0, node_test_1.default)('all read endpoints require tenant scope, workbench roles and workbench.read permission', () => {
        const protectedHandlers = [
            workbench_controller_1.WorkbenchController.prototype.getBootstrap,
            workbench_controller_1.WorkbenchController.prototype.getWorkbenches,
            workbench_controller_1.WorkbenchController.prototype.getNavItems,
            workbench_controller_1.WorkbenchController.prototype.checkCapability,
        ];
        protectedHandlers.forEach((handler) => {
            strict_1.default.deepEqual(Reflect.getMetadata(identity_access_decorator_1.TENANT_SCOPE_METADATA_KEY, handler), {});
            strict_1.default.deepEqual(Reflect.getMetadata(identity_access_decorator_1.ROLES_METADATA_KEY, handler), expectedRoles);
            strict_1.default.deepEqual(Reflect.getMetadata(identity_access_decorator_1.PERMISSIONS_METADATA_KEY, handler), ['workbench.read']);
        });
    });
});
// ══════════════════════════════════════════════════
// 2. getWorkbenches 测试
// ══════════════════════════════════════════════════
(0, node_test_1.describe)('getWorkbenches', () => {
    (0, node_test_1.default)('[正例] 无参数返回全部 10 个工作台', () => {
        const controller = createController();
        const result = controller.getWorkbenches({});
        strict_1.default.ok(Array.isArray(result.workbenches));
        strict_1.default.equal(result.total, 10);
        strict_1.default.equal(result.workbenches.length, 10);
    });
    (0, node_test_1.default)('[正例] 按角色筛选 STORE_MANAGER', () => {
        const controller = createController();
        const result = controller.getWorkbenches({ role: 'STORE_MANAGER' });
        strict_1.default.equal(result.total, 1);
        strict_1.default.equal(result.workbenches[0].title, '店长经营台');
    });
    (0, node_test_1.default)('[正例] 按渠道筛选 PAD（收银台 + 导购工作台 + 教练）', () => {
        const controller = createController();
        const result = controller.getWorkbenches({ channel: 'PAD' });
        strict_1.default.equal(result.total, 3);
        result.workbenches.forEach((w) => {
            strict_1.default.equal(w.channel, 'PAD');
        });
    });
    (0, node_test_1.default)('[正例] 按渠道筛选 PC', () => {
        const controller = createController();
        const result = controller.getWorkbenches({ channel: 'PC' });
        // SUPER_ADMIN / TENANT_ADMIN / BRAND_MANAGER / STORE_MANAGER +
        // OPERATIONS / FINANCE / WAREHOUSE = 7
        strict_1.default.equal(result.total, 7);
        result.workbenches.forEach((w) => {
            strict_1.default.equal(w.channel, 'PC');
        });
    });
    (0, node_test_1.default)('[反例] 不存在的角色返回空', () => {
        const controller = createController();
        const result = controller.getWorkbenches({ role: 'NON_EXISTENT' });
        strict_1.default.equal(result.total, 0);
        strict_1.default.deepEqual(result.workbenches, []);
    });
    (0, node_test_1.default)('[反例] 不存在的渠道返回空', () => {
        const controller = createController();
        const result = controller.getWorkbenches({ channel: 'VR_HEADSET' });
        strict_1.default.equal(result.total, 0);
        strict_1.default.deepEqual(result.workbenches, []);
    });
    (0, node_test_1.default)('[反例] initialized=false 返回空数组（模拟未初始化）', () => {
        const controller = createController();
        const result = controller.getWorkbenches({ initialized: false });
        strict_1.default.equal(result.total, 0);
        strict_1.default.deepEqual(result.workbenches, []);
    });
    (0, node_test_1.default)('[边界] initialized=true 返回全量', () => {
        const controller = createController();
        const result = controller.getWorkbenches({ initialized: true });
        strict_1.default.equal(result.total, 10);
    });
    (0, node_test_1.default)('[边界] 同时筛选 role=GUIDE + channel=PAD', () => {
        const controller = createController();
        const result = controller.getWorkbenches({ role: 'GUIDE', channel: 'PAD' });
        strict_1.default.equal(result.total, 1);
        strict_1.default.equal(result.workbenches[0].title, '导购工作台');
    });
    (0, node_test_1.default)('[边界] role + channel 冲突时返回空（STORE_MANAGER 用 PC，查 PAD）', () => {
        const controller = createController();
        const result = controller.getWorkbenches({ role: 'STORE_MANAGER', channel: 'PAD' });
        strict_1.default.equal(result.total, 0);
    });
    (0, node_test_1.default)('[边界] 每个角色筛选结果都有完整字段', () => {
        const controller = createController();
        const allRoles = ['SUPER_ADMIN', 'TENANT_ADMIN', 'BRAND_MANAGER', 'STORE_MANAGER', 'GUIDE', 'CASHIER', 'OPERATIONS', 'FINANCE', 'WAREHOUSE', 'COACH'];
        allRoles.forEach(role => {
            const result = controller.getWorkbenches({ role });
            strict_1.default.equal(result.total, 1, `role ${role} should have exactly 1 workbench`);
            const wb = result.workbenches[0];
            strict_1.default.equal(wb.role, role);
            strict_1.default.ok(wb.title, `role ${role} should have title`);
            strict_1.default.ok(wb.description, `role ${role} should have description`);
            strict_1.default.ok(wb.channel, `role ${role} should have channel`);
            strict_1.default.ok(Array.isArray(wb.navItems), `role ${role} should have navItems array`);
            strict_1.default.ok(wb.navItems.length >= 2, `role ${role} should have >= 2 nav items`);
        });
    });
    (0, node_test_1.default)('[边界] undefined role 不影响结果', () => {
        const controller = createController();
        // 传入 role 为 undefined 的 query，不过滤
        const result = controller.getWorkbenches({ role: undefined });
        strict_1.default.equal(result.total, 10);
    });
});
// ══════════════════════════════════════════════════
// 3. getNavItems 测试
// ══════════════════════════════════════════════════
(0, node_test_1.describe)('getNavItems', () => {
    (0, node_test_1.default)('[正例] 无参数返回全部导航项（含 role/channel/marketCodes 元数据）', () => {
        const controller = createController();
        const result = controller.getNavItems({});
        strict_1.default.ok(Array.isArray(result.navItems));
        // 6 个工作台，每个有 2-5 个 navItems，总计 > 10
        strict_1.default.ok(result.total > 10);
        result.navItems.forEach((item) => {
            strict_1.default.ok(item.key, 'every navItem should have key');
            strict_1.default.ok(item.label, 'every navItem should have label');
            strict_1.default.ok(item.href, 'every navItem should have href');
            strict_1.default.ok(item.description, 'every navItem should have description');
            strict_1.default.ok(item.role, 'every navItem should have role');
            strict_1.default.ok(item.channel, 'every navItem should have channel');
            strict_1.default.ok(Array.isArray(item.marketCodes), 'every navItem should have marketCodes array');
        });
    });
    (0, node_test_1.default)('[正例] 按角色筛选 STORE_MANAGER', () => {
        const controller = createController();
        const result = controller.getNavItems({ role: 'STORE_MANAGER' });
        strict_1.default.ok(result.total > 0);
        result.navItems.forEach((item) => {
            strict_1.default.equal(item.role, 'STORE_MANAGER');
        });
    });
    (0, node_test_1.default)('[正例] 按渠道筛选 PAD', () => {
        const controller = createController();
        const result = controller.getNavItems({ channel: 'PAD' });
        strict_1.default.ok(result.total > 0);
        result.navItems.forEach((item) => {
            strict_1.default.equal(item.channel, 'PAD');
        });
    });
    (0, node_test_1.default)('[正例] 按市场筛选 cn-mainland', () => {
        const controller = createController();
        const result = controller.getNavItems({ marketCode: 'cn-mainland' });
        strict_1.default.ok(result.total > 0);
        result.navItems.forEach((item) => {
            strict_1.default.ok(item.marketCodes.includes('cn-mainland'));
        });
    });
    (0, node_test_1.default)('[正例] 按市场筛选 us-default', () => {
        const controller = createController();
        const result = controller.getNavItems({ marketCode: 'us-default' });
        strict_1.default.ok(result.total > 0);
        result.navItems.forEach((item) => {
            strict_1.default.ok(item.marketCodes.includes('us-default'));
        });
    });
    (0, node_test_1.default)('[正例] 按能力筛选 promo-conversion 返回所有具备该能力的角色导航项', () => {
        const controller = createController();
        const result = controller.getNavItems({ capability: 'promo-conversion' });
        // GUIDE (2 navItems) + COACH (4 navItems) = 6
        strict_1.default.equal(result.total, 6);
        const guideNav = result.navItems.filter((n) => n.role === 'GUIDE');
        strict_1.default.equal(guideNav.length, 2);
        const coachNav = result.navItems.filter((n) => n.role === 'COACH');
        strict_1.default.equal(coachNav.length, 4);
    });
    (0, node_test_1.default)('[反例] 不存在角色返回空', () => {
        const controller = createController();
        const result = controller.getNavItems({ role: 'GHOST_ROLE' });
        strict_1.default.equal(result.total, 0);
        strict_1.default.deepEqual(result.navItems, []);
    });
    (0, node_test_1.default)('[反例] 不存在市场代码返回空', () => {
        const controller = createController();
        const result = controller.getNavItems({ marketCode: 'mars-colony' });
        strict_1.default.equal(result.total, 0);
    });
    (0, node_test_1.default)('[反例] 不存在能力返回空', () => {
        const controller = createController();
        const result = controller.getNavItems({ capability: 'time-travel' });
        strict_1.default.equal(result.total, 0);
        strict_1.default.deepEqual(result.navItems, []);
    });
    (0, node_test_1.default)('[边界] role=GUIDE + channel=PAD + marketCode=cn-mainland 联合筛选', () => {
        const controller = createController();
        const result = controller.getNavItems({
            role: 'GUIDE',
            channel: 'PAD',
            marketCode: 'cn-mainland'
        });
        strict_1.default.ok(result.total > 0);
        result.navItems.forEach((item) => {
            strict_1.default.equal(item.role, 'GUIDE');
            strict_1.default.equal(item.channel, 'PAD');
            strict_1.default.ok(item.marketCodes.includes('cn-mainland'));
        });
    });
    (0, node_test_1.default)('[边界] role=GUIDE + channel=PC 返回空（GUIDE 只用 PAD）', () => {
        const controller = createController();
        const result = controller.getNavItems({ role: 'GUIDE', channel: 'PC' });
        strict_1.default.equal(result.total, 0);
    });
    (0, node_test_1.default)('[边界] 每个角色的导航项数量合理', () => {
        const controller = createController();
        const roleCounts = {};
        const all = controller.getNavItems({});
        all.navItems.forEach((item) => {
            roleCounts[item.role] = (roleCounts[item.role] || 0) + 1;
        });
        // 每个角色至少有 2 个导航项
        Object.entries(roleCounts).forEach(([role, count]) => {
            strict_1.default.ok(count >= 2, `${role} expected >=2 nav items, got ${count}`);
        });
    });
    (0, node_test_1.default)('[边界] undefined 参数不过滤', () => {
        const controller = createController();
        const result = controller.getNavItems({ role: undefined, channel: undefined });
        strict_1.default.ok(result.total > 10);
    });
});
// ══════════════════════════════════════════════════
// 4. checkCapability 测试（角色能力检查）
// ══════════════════════════════════════════════════
(0, node_test_1.describe)('checkCapability', () => {
    (0, node_test_1.default)('[正例] SUPER_ADMIN 拥有 tenant-management', () => {
        const controller = createController();
        const result = controller.checkCapability({
            role: 'SUPER_ADMIN',
            capability: 'tenant-management'
        });
        strict_1.default.equal(result.role, 'SUPER_ADMIN');
        strict_1.default.equal(result.capability, 'tenant-management');
        strict_1.default.equal(result.has, true);
    });
    (0, node_test_1.default)('[正例] STORE_MANAGER 拥有 daily-report', () => {
        const controller = createController();
        const result = controller.checkCapability({
            role: 'STORE_MANAGER',
            capability: 'daily-report'
        });
        strict_1.default.equal(result.has, true);
    });
    (0, node_test_1.default)('[正例] CASHIER 拥有 checkout-nuclear', () => {
        const controller = createController();
        const result = controller.checkCapability({
            role: 'CASHIER',
            capability: 'checkout-nuclear'
        });
        strict_1.default.equal(result.has, true);
    });
    (0, node_test_1.default)('[反例] GUIDE 不拥有 tenant-management', () => {
        const controller = createController();
        const result = controller.checkCapability({
            role: 'GUIDE',
            capability: 'tenant-management'
        });
        strict_1.default.equal(result.has, false);
    });
    (0, node_test_1.default)('[反例] 不存在角色返回 false', () => {
        const controller = createController();
        const result = controller.checkCapability({
            role: 'UNKNOWN_ROLE',
            capability: 'tenant-management'
        });
        strict_1.default.equal(result.has, false);
    });
    (0, node_test_1.default)('[反例] 不存在能力返回 false', () => {
        const controller = createController();
        const result = controller.checkCapability({
            role: 'SUPER_ADMIN',
            capability: 'time-travel'
        });
        strict_1.default.equal(result.has, false);
    });
    (0, node_test_1.default)('[边界] 大小写必须严格匹配（小写角色返回 false）', () => {
        const controller = createController();
        const result1 = controller.checkCapability({
            role: 'super_admin',
            capability: 'tenant-management'
        });
        strict_1.default.equal(result1.has, false);
        const result2 = controller.checkCapability({
            role: 'SUPER_ADMIN',
            capability: 'tenant-management'
        });
        strict_1.default.equal(result2.has, true);
    });
    (0, node_test_1.default)('[边界] BRAND_MANAGER 拥有 3 个能力', () => {
        const controller = createController();
        const caps = ['member-crm', 'campaign-execution', 'regional-config'];
        caps.forEach(cap => {
            const result = controller.checkCapability({ role: 'BRAND_MANAGER', capability: cap });
            strict_1.default.equal(result.has, true, `BRAND_MANAGER should have ${cap}`);
        });
    });
    (0, node_test_1.default)('[边界] SUPERA_ADMIN 拥有 3 个能力', () => {
        const controller = createController();
        const caps = ['tenant-management', 'audit-center', 'market-governance'];
        caps.forEach(cap => {
            const result = controller.checkCapability({ role: 'SUPER_ADMIN', capability: cap });
            strict_1.default.equal(result.has, true, `SUPER_ADMIN should have ${cap}`);
        });
    });
    (0, node_test_1.default)('[正例] TENANT_ADMIN 拥有品牌矩阵', () => {
        const controller = createController();
        const result = controller.checkCapability({
            role: 'TENANT_ADMIN',
            capability: 'brand-matrix'
        });
        strict_1.default.equal(result.has, true);
    });
});
// ══════════════════════════════════════════════════
// 5. @RequireRoles 装饰器：端点角色权限矩阵验证
// ══════════════════════════════════════════════════
(0, node_test_1.describe)('@RequireRoles 装饰器：端点角色权限矩阵', () => {
    const READ_ROLES_EXPECTED = [
        'SUPER_ADMIN', 'TENANT_ADMIN', 'BRAND_MANAGER', 'STORE_MANAGER',
        'GUIDE', 'CASHIER', 'OPERATIONS', 'SECURITY_ADMIN'
    ];
    const ACTION_ROLES_EXPECTED = ['SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS', 'SECURITY_ADMIN'];
    const SECRET_ROTATION_ROLES_EXPECTED = ['SUPER_ADMIN', 'SECURITY_ADMIN'];
    // read 端点角色检查
    const readHandlers = [
        { name: 'getBootstrap', handler: workbench_controller_1.WorkbenchController.prototype.getBootstrap },
        { name: 'getWorkbenches', handler: workbench_controller_1.WorkbenchController.prototype.getWorkbenches },
        { name: 'getNavItems', handler: workbench_controller_1.WorkbenchController.prototype.getNavItems },
        { name: 'checkCapability', handler: workbench_controller_1.WorkbenchController.prototype.checkCapability },
    ];
    readHandlers.forEach(({ name, handler }) => {
        (0, node_test_1.default)(`read 端点 ${name} @RequireRoles 包含 8 角色`, () => {
            const roles = Reflect.getMetadata(identity_access_decorator_1.ROLES_METADATA_KEY, handler);
            strict_1.default.deepEqual(roles, READ_ROLES_EXPECTED);
        });
    });
    // action 端点角色检查
    const actionHandlers = [
        { name: 'executeApproval', handler: workbench_controller_1.WorkbenchController.prototype.executeApproval },
        { name: 'submitRuntimeReplay', handler: workbench_controller_1.WorkbenchController.prototype.submitRuntimeReplay },
        { name: 'getActionReceipt', handler: workbench_controller_1.WorkbenchController.prototype.getActionReceipt },
        { name: 'syncHandlerReceipt', handler: workbench_controller_1.WorkbenchController.prototype.syncHandlerReceipt },
        { name: 'recordHandlerCallback', handler: workbench_controller_1.WorkbenchController.prototype.recordHandlerCallback },
        { name: 'replayActionReceipt', handler: workbench_controller_1.WorkbenchController.prototype.replayActionReceipt },
    ];
    actionHandlers.forEach(({ name, handler }) => {
        (0, node_test_1.default)(`action 端点 ${name} @RequireRoles 仅限 4 管理员角色`, () => {
            const roles = Reflect.getMetadata(identity_access_decorator_1.ROLES_METADATA_KEY, handler);
            strict_1.default.deepEqual(roles, ACTION_ROLES_EXPECTED);
        });
    });
    // secret-rotation 端点角色检查
    (0, node_test_1.default)('secret-rotation 端点 @RequireRoles 仅限 SUPER_ADMIN + SECURITY_ADMIN', () => {
        const roles = Reflect.getMetadata(identity_access_decorator_1.ROLES_METADATA_KEY, workbench_controller_1.WorkbenchController.prototype.rotateSecret);
        strict_1.default.deepEqual(roles, SECRET_ROTATION_ROLES_EXPECTED);
    });
});
// ══════════════════════════════════════════════════
// 6. 8 角色视角：工作台访问 + 能力权限 + 渠道分配
// ══════════════════════════════════════════════════
(0, node_test_1.describe)('8 角色视角', () => {
    /**
     * 角色语义映射:
     * - 👔店长    → STORE_MANAGER   (PC, 店长经营台)
     * - 🛒前台    → CASHIER         (PAD, 收银台)
     * - 👥HR     → TENANT_ADMIN     (PC, 租户经营台)
     * - 🔧安监    → SECURITY_ADMIN  / SUPER_ADMIN  (PC, 安全中心/总部总控台)
     * - 🎮导玩员  → GUIDE           (PAD, 导购工作台)
     * - 🎯运行专员 → OPERATIONS      (PC, 运行中心)
     * - 🤝团建    → TEAM_BUILDING    (不在 WORKBENCH_READ_ROLES 中 → 无权限)
     * - 📢营销    → MARKETING        (不在 WORKBENCH_READ_ROLES 中 → 无权限)
     */
    const roleToDomainRole = {
        '👔店长': 'STORE_MANAGER',
        '🛒前台': 'CASHIER',
        '👥HR': 'TENANT_ADMIN',
        '🔧安监': 'SUPER_ADMIN',
        '🎮导玩员': 'GUIDE',
        '🎯运行专员': 'OPERATIONS',
        '🤝团建': 'TEAM_BUILDING',
        '📢营销': 'MARKETING',
    };
    const controller = createController();
    // ── 👔 店长 ──
    (0, node_test_1.default)('👔店长: 可见店长经营台 (PC 渠道)', () => {
        const r = controller.getWorkbenches({ role: roleToDomainRole['👔店长'] });
        strict_1.default.equal(r.total, 1);
        strict_1.default.equal(r.workbenches[0].title, '店长经营台');
        strict_1.default.equal(r.workbenches[0].channel, 'PC');
        strict_1.default.equal(r.workbenches[0].role, 'STORE_MANAGER');
    });
    (0, node_test_1.default)('👔店长: 拥有 daily-report 和 field-scheduling 能力', () => {
        strict_1.default.equal(controller.checkCapability({ role: 'STORE_MANAGER', capability: 'daily-report' }).has, true);
        strict_1.default.equal(controller.checkCapability({ role: 'STORE_MANAGER', capability: 'field-scheduling' }).has, true);
    });
    (0, node_test_1.default)('👔店长: 不拥有 audit-center (权限边界)', () => {
        strict_1.default.equal(controller.checkCapability({ role: 'STORE_MANAGER', capability: 'audit-center' }).has, false);
    });
    // ── 🛒 前台 ──
    (0, node_test_1.default)('🛒前台: 使用 PAD 收银台', () => {
        const r = controller.getWorkbenches({ role: roleToDomainRole['🛒前台'] });
        strict_1.default.equal(r.total, 1);
        strict_1.default.equal(r.workbenches[0].channel, 'PAD');
        strict_1.default.equal(r.workbenches[0].title, '收银台');
        strict_1.default.equal(r.workbenches[0].role, 'CASHIER');
    });
    (0, node_test_1.default)('🛒前台: 拥有 checkout-nuclear + offline-fallback', () => {
        strict_1.default.equal(controller.checkCapability({ role: 'CASHIER', capability: 'checkout-nuclear' }).has, true);
        strict_1.default.equal(controller.checkCapability({ role: 'CASHIER', capability: 'offline-fallback' }).has, true);
    });
    (0, node_test_1.default)('🛒前台: 不拥有 member-crm (前台不接触会员运营)', () => {
        strict_1.default.equal(controller.checkCapability({ role: 'CASHIER', capability: 'member-crm' }).has, false);
    });
    // ── 👥 HR (TENANT_ADMIN) ──
    (0, node_test_1.default)('👥HR: 访问租户经营台 (PC)', () => {
        const r = controller.getWorkbenches({ role: roleToDomainRole['👥HR'] });
        strict_1.default.equal(r.workbenches[0].title, '租户经营台');
        strict_1.default.equal(r.workbenches[0].channel, 'PC');
        strict_1.default.equal(r.workbenches[0].role, 'TENANT_ADMIN');
    });
    (0, node_test_1.default)('👥HR: 拥有品牌矩阵+渠道编排+portal管理能力', () => {
        strict_1.default.equal(controller.checkCapability({ role: 'TENANT_ADMIN', capability: 'brand-matrix' }).has, true);
        strict_1.default.equal(controller.checkCapability({ role: 'TENANT_ADMIN', capability: 'channel-orchestration' }).has, true);
        strict_1.default.equal(controller.checkCapability({ role: 'TENANT_ADMIN', capability: 'portal-management' }).has, true);
    });
    (0, node_test_1.default)('👥HR: 不拥有 checkout-nuclear (不懂收银)', () => {
        strict_1.default.equal(controller.checkCapability({ role: 'TENANT_ADMIN', capability: 'checkout-nuclear' }).has, false);
    });
    // ── 🔧 安监 (SUPER_ADMIN) ──
    (0, node_test_1.default)('🔧安监: 访问总部总控台 (PC)', () => {
        const r = controller.getWorkbenches({ role: roleToDomainRole['🔧安监'] });
        strict_1.default.equal(r.workbenches[0].title, '总部总控台');
        strict_1.default.equal(r.workbenches[0].channel, 'PC');
        strict_1.default.equal(r.workbenches[0].role, 'SUPER_ADMIN');
    });
    (0, node_test_1.default)('🔧安监: 拥有 ternary 审计/治理/租户管理能力', () => {
        strict_1.default.equal(controller.checkCapability({ role: 'SUPER_ADMIN', capability: 'audit-center' }).has, true);
        strict_1.default.equal(controller.checkCapability({ role: 'SUPER_ADMIN', capability: 'market-governance' }).has, true);
        strict_1.default.equal(controller.checkCapability({ role: 'SUPER_ADMIN', capability: 'tenant-management' }).has, true);
    });
    (0, node_test_1.default)('🔧安监: 有 secret-rotation 端点权限 (与 SECURITY_ADMIN 共享)', () => {
        // 元数据验证: rotateSecret 只允许 SUPER_ADMIN + SECURITY_ADMIN
        const roles = Reflect.getMetadata(identity_access_decorator_1.ROLES_METADATA_KEY, workbench_controller_1.WorkbenchController.prototype.rotateSecret);
        strict_1.default.ok(roles.includes('SUPER_ADMIN'));
        strict_1.default.ok(roles.includes('SECURITY_ADMIN'));
        strict_1.default.equal(roles.length, 2);
    });
    // ── 🎮 导玩员 ──
    (0, node_test_1.default)('🎮导玩员: 使用 PAD 导购工作台', () => {
        const r = controller.getWorkbenches({ role: roleToDomainRole['🎮导玩员'] });
        strict_1.default.equal(r.workbenches[0].title, '导购工作台');
        strict_1.default.equal(r.workbenches[0].channel, 'PAD');
        strict_1.default.equal(r.workbenches[0].role, 'GUIDE');
    });
    (0, node_test_1.default)('🎮导玩员: 有 member-crm + promo-conversion 推广能力', () => {
        strict_1.default.equal(controller.checkCapability({ role: 'GUIDE', capability: 'member-crm' }).has, true);
        strict_1.default.equal(controller.checkCapability({ role: 'GUIDE', capability: 'promo-conversion' }).has, true);
    });
    (0, node_test_1.default)('🎮导玩员: 不能使用 PC 渠道工作台', () => {
        const r = controller.getWorkbenches({ role: 'GUIDE', channel: 'PC' });
        strict_1.default.equal(r.total, 0);
    });
    // ── 🎯 运行专员 (OPERATIONS) ──
    (0, node_test_1.default)('🎯运行专员: 访问运行中心 (PC)', () => {
        const r = controller.getWorkbenches({ role: roleToDomainRole['🎯运行专员'] });
        strict_1.default.equal(r.total, 1);
        strict_1.default.equal(r.workbenches[0].channel, 'PC');
        strict_1.default.equal(r.workbenches[0].role, 'OPERATIONS');
    });
    (0, node_test_1.default)('🎯运行专员: 拥有治理/调度/租户/审计四合一能力', () => {
        strict_1.default.equal(controller.checkCapability({ role: 'OPERATIONS', capability: 'market-governance' }).has, true);
        strict_1.default.equal(controller.checkCapability({ role: 'OPERATIONS', capability: 'field-scheduling' }).has, true);
        strict_1.default.equal(controller.checkCapability({ role: 'OPERATIONS', capability: 'tenant-management' }).has, true);
        strict_1.default.equal(controller.checkCapability({ role: 'OPERATIONS', capability: 'audit-center' }).has, true);
    });
    (0, node_test_1.default)('🎯运行专员: 不拥有 checkout-nuclear (非收银角色)', () => {
        strict_1.default.equal(controller.checkCapability({ role: 'OPERATIONS', capability: 'checkout-nuclear' }).has, false);
    });
    // ── 🤝 团建 (TEAM_BUILDING: 不在 WORKBENCH_READ_ROLES 中, 无任何端点访问权限) ──
    (0, node_test_1.default)('🤝团建: 系统无此角色工作台 → 返回空', () => {
        // TEAM_BUILDING 不在 ROLE_CAPABILITY_MAP 也不在 defaultRoleWorkbenchContracts 中
        const r = controller.getWorkbenches({ role: roleToDomainRole['🤝团建'] });
        strict_1.default.equal(r.total, 0);
        strict_1.default.deepEqual(r.workbenches, []);
    });
    (0, node_test_1.default)('🤝团建: 无任何能力（capability check 返回 false）', () => {
        strict_1.default.equal(controller.checkCapability({ role: 'TEAM_BUILDING', capability: 'member-crm' }).has, false);
        strict_1.default.equal(controller.checkCapability({ role: 'TEAM_BUILDING', capability: 'field-scheduling' }).has, false);
        strict_1.default.equal(controller.checkCapability({ role: 'TEAM_BUILDING', capability: 'tenant-management' }).has, false);
    });
    (0, node_test_1.default)('🤝团建: 不在任何 @RequireRoles 端点允许列表中（权限边界）', () => {
        // 验证所有 read handler 都不包含 TEAM_BUILDING
        const readHandlers = [
            workbench_controller_1.WorkbenchController.prototype.getBootstrap,
            workbench_controller_1.WorkbenchController.prototype.getWorkbenches,
            workbench_controller_1.WorkbenchController.prototype.getNavItems,
            workbench_controller_1.WorkbenchController.prototype.checkCapability,
        ];
        readHandlers.forEach(handler => {
            const roles = Reflect.getMetadata(identity_access_decorator_1.ROLES_METADATA_KEY, handler);
            strict_1.default.ok(!roles.includes('TEAM_BUILDING'), `${handler.name} should not allow TEAM_BUILDING`);
        });
    });
    (0, node_test_1.default)('🤝团建: navItems 中无任何可访问项', () => {
        const r = controller.getNavItems({ role: 'TEAM_BUILDING' });
        strict_1.default.equal(r.total, 0);
        strict_1.default.deepEqual(r.navItems, []);
    });
    // ── 📢 营销 (MARKETING: 不在 WORKBENCH_READ_ROLES 中, 无任何端点访问权限) ──
    (0, node_test_1.default)('📢营销: 系统无此角色工作台 → 返回空', () => {
        const r = controller.getWorkbenches({ role: roleToDomainRole['📢营销'] });
        strict_1.default.equal(r.total, 0);
        strict_1.default.deepEqual(r.workbenches, []);
    });
    (0, node_test_1.default)('📢营销: 无任何能力（capability check 返回 false）', () => {
        strict_1.default.equal(controller.checkCapability({ role: 'MARKETING', capability: 'campaign-execution' }).has, false);
        strict_1.default.equal(controller.checkCapability({ role: 'MARKETING', capability: 'promo-conversion' }).has, false);
        strict_1.default.equal(controller.checkCapability({ role: 'MARKETING', capability: 'member-crm' }).has, false);
    });
    (0, node_test_1.default)('📢营销: 不在任何 @RequireRoles 端点允许列表中（权限边界）', () => {
        const actionHandlers = [
            workbench_controller_1.WorkbenchController.prototype.executeApproval,
            workbench_controller_1.WorkbenchController.prototype.submitRuntimeReplay,
            workbench_controller_1.WorkbenchController.prototype.syncHandlerReceipt,
            workbench_controller_1.WorkbenchController.prototype.rotateSecret,
        ];
        actionHandlers.forEach(handler => {
            const roles = Reflect.getMetadata(identity_access_decorator_1.ROLES_METADATA_KEY, handler);
            strict_1.default.ok(!roles.includes('MARKETING'), `${handler.name} should not allow MARKETING`);
        });
    });
    (0, node_test_1.default)('📢营销: navItems 中无任何可访问项', () => {
        const r = controller.getNavItems({ role: 'MARKETING' });
        strict_1.default.equal(r.total, 0);
        strict_1.default.deepEqual(r.navItems, []);
    });
});
// ══════════════════════════════════════════════════
// 7. 角色与装饰器权限边界：交叉验证
// ══════════════════════════════════════════════════
(0, node_test_1.describe)('角色与装饰器权限边界', () => {
    (0, node_test_1.default)('READ 端点允许 GUIDE/CASHIER/STORE_MANAGER 但 action 端点不允许', () => {
        // read handler getBootstrap: 含 GUIDE/CASHIER/STORE_MANAGER
        const readRoles = Reflect.getMetadata(identity_access_decorator_1.ROLES_METADATA_KEY, workbench_controller_1.WorkbenchController.prototype.getBootstrap);
        strict_1.default.ok(readRoles.includes('GUIDE'));
        strict_1.default.ok(readRoles.includes('CASHIER'));
        strict_1.default.ok(readRoles.includes('STORE_MANAGER'));
        // action handler executeApproval: 不含 GUIDE/CASHIER/STORE_MANAGER
        const actionRoles = Reflect.getMetadata(identity_access_decorator_1.ROLES_METADATA_KEY, workbench_controller_1.WorkbenchController.prototype.executeApproval);
        strict_1.default.ok(!actionRoles.includes('GUIDE'), 'GUIDE should NOT be in action roles');
        strict_1.default.ok(!actionRoles.includes('CASHIER'), 'CASHIER should NOT be in action roles');
        strict_1.default.ok(!actionRoles.includes('STORE_MANAGER'), 'STORE_MANAGER should NOT be in action roles');
    });
    (0, node_test_1.default)('SUPER_ADMIN / TENANT_ADMIN / OPERATIONS / SECURITY_ADMIN 可以访问 read + action 端点; secret-rotation 仅 SUPER_ADMIN + SECURITY_ADMIN', () => {
        const regularHandlers = [
            { name: 'getBootstrap', handler: workbench_controller_1.WorkbenchController.prototype.getBootstrap },
            { name: 'executeApproval', handler: workbench_controller_1.WorkbenchController.prototype.executeApproval },
        ];
        const allAdminRoles = ['SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS', 'SECURITY_ADMIN'];
        regularHandlers.forEach(({ name, handler }) => {
            const roles = Reflect.getMetadata(identity_access_decorator_1.ROLES_METADATA_KEY, handler);
            allAdminRoles.forEach(adminRole => {
                strict_1.default.ok(roles.includes(adminRole), `${adminRole} should have access to ${name}`);
            });
        });
        // rotateSecret: 仅 SUPER_ADMIN + SECURITY_ADMIN (不包括 TENANT_ADMIN / OPERATIONS)
        const secretRoles = Reflect.getMetadata(identity_access_decorator_1.ROLES_METADATA_KEY, workbench_controller_1.WorkbenchController.prototype.rotateSecret);
        strict_1.default.ok(secretRoles.includes('SUPER_ADMIN'));
        strict_1.default.ok(secretRoles.includes('SECURITY_ADMIN'));
        strict_1.default.ok(!secretRoles.includes('TENANT_ADMIN'), 'TENANT_ADMIN must NOT rotate secrets');
        strict_1.default.ok(!secretRoles.includes('OPERATIONS'), 'OPERATIONS must NOT rotate secrets');
    });
    (0, node_test_1.default)('SECURITY_ADMIN 有 secret-rotation 权限但 GUIDE 没有', () => {
        const secretRoles = Reflect.getMetadata(identity_access_decorator_1.ROLES_METADATA_KEY, workbench_controller_1.WorkbenchController.prototype.rotateSecret);
        strict_1.default.ok(secretRoles.includes('SECURITY_ADMIN'));
        strict_1.default.ok(!secretRoles.includes('GUIDE'), 'GUIDE must NOT rotate secrets');
        strict_1.default.ok(!secretRoles.includes('CASHIER'), 'CASHIER must NOT rotate secrets');
        strict_1.default.ok(!secretRoles.includes('STORE_MANAGER'), 'STORE_MANAGER must NOT rotate secrets');
    });
    (0, node_test_1.default)('所有 action 端点仅限 4 个管理员角色', () => {
        const actionOnlyHandlers = [
            workbench_controller_1.WorkbenchController.prototype.executeApproval,
            workbench_controller_1.WorkbenchController.prototype.rotateSecret,
            workbench_controller_1.WorkbenchController.prototype.submitRuntimeReplay,
            workbench_controller_1.WorkbenchController.prototype.getActionReceipt,
            workbench_controller_1.WorkbenchController.prototype.syncHandlerReceipt,
            workbench_controller_1.WorkbenchController.prototype.recordHandlerCallback,
            workbench_controller_1.WorkbenchController.prototype.replayActionReceipt,
        ];
        const nonAdminRoles = ['GUIDE', 'CASHIER', 'STORE_MANAGER', 'BRAND_MANAGER', 'FINANCE', 'WAREHOUSE', 'COACH'];
        actionOnlyHandlers.forEach(handler => {
            const roles = Reflect.getMetadata(identity_access_decorator_1.ROLES_METADATA_KEY, handler);
            if (roles) {
                nonAdminRoles.forEach(nonAdmin => {
                    strict_1.default.ok(!roles.includes(nonAdmin), `${nonAdmin} must NOT have access to ${handler.name}`);
                });
            }
        });
    });
    (0, node_test_1.default)('read 端点允许 8 个角色, action 端点仅 4 个, secret-rotation 端点仅 2 个', () => {
        const readCount = Reflect.getMetadata(identity_access_decorator_1.ROLES_METADATA_KEY, workbench_controller_1.WorkbenchController.prototype.getBootstrap).length;
        const actionCount = Reflect.getMetadata(identity_access_decorator_1.ROLES_METADATA_KEY, workbench_controller_1.WorkbenchController.prototype.executeApproval).length;
        const secretCount = Reflect.getMetadata(identity_access_decorator_1.ROLES_METADATA_KEY, workbench_controller_1.WorkbenchController.prototype.rotateSecret).length;
        strict_1.default.equal(readCount, 8, 'read endpoints should allow 8 roles');
        strict_1.default.equal(actionCount, 4, 'action endpoints should allow 4 roles');
        strict_1.default.equal(secretCount, 2, 'secret-rotation should allow 2 roles');
        strict_1.default.ok(readCount > actionCount, 'read roles > action roles');
        strict_1.default.ok(actionCount > secretCount, 'action roles > secret roles');
    });
});
//# sourceMappingURL=workbench.controller.test.js.map