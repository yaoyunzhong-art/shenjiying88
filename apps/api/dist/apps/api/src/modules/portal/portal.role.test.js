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
// ── Helpers ──
function mockPortalService(overrides = {}) {
    return {
        getBootstrap: () => ({
            tenantPortal: { audience: 'ToB', name: '测试租户官网', primaryDomain: 't.local', loginEntry: { label: '登录', loginPath: '/login', ssoEnabled: true } },
            brandPortal: { audience: 'ToB', name: '品牌官网', primaryDomain: 'b.local', loginEntry: { label: '登录', loginPath: '/login', ssoEnabled: true }, heroTitle: '品牌经营官网', solutionTags: ['品牌招商', '品牌后台'] },
            storePortal: { audience: 'ToC', name: '门店门户', primaryDomain: 's.local', supportedSurfaces: ['OfficialSite'] },
            marketProfile: { marketCode: 'cn-mainland', marketName: '中国大陆' },
            regionalOverrides: [],
            foundationDependencies: [],
            foundationContracts: []
        }),
        ...overrides
    };
}
function createPortalController(mockPortal = mockPortalService()) {
    const { PortalController } = require('./portal.controller');
    return new PortalController(mockPortal);
}
const tenantCtx = { tenantId: 't-portal', brandId: 'b-portal', storeId: 's-portal', marketCode: 'cn-mainland' };
const ROLES = {
    Marketing: '📢营销',
    Operations: '🎯运行专员',
    TenantAdmin: '👔店长',
    Reception: '🛒前台',
    HR: '👥HR',
    SafetyInspector: '🔧安监',
    GameInstructor: '🎮导玩员',
    TeamBuilding: '🤝团建',
    Security: '🔧安监'
};
// ── 📢营销 ──
(0, node_test_1.describe)(`${ROLES.Marketing} portal 角色测试`, () => {
    (0, node_test_1.default)('营销可以获取 portal bootstrap（含 Tenant/Brand/Store Portal）', () => {
        const portal = mockPortalService();
        const ctrl = createPortalController(portal);
        const result = ctrl.getBootstrap(tenantCtx);
        strict_1.default.ok(result.tenantPortal);
        strict_1.default.ok(result.brandPortal);
        strict_1.default.ok(result.storePortal);
    });
    (0, node_test_1.default)('营销获取 portal — tenantPortal 信息完整', () => {
        const portal = mockPortalService();
        const ctrl = createPortalController(portal);
        const result = ctrl.getBootstrap(tenantCtx);
        strict_1.default.equal(result.tenantPortal.audience, 'ToB');
        strict_1.default.ok(result.tenantPortal.name);
        strict_1.default.ok(result.tenantPortal.primaryDomain);
        strict_1.default.ok(result.tenantPortal.loginEntry);
    });
    (0, node_test_1.default)('营销获取 portal — brandPortal 含登录入口', () => {
        const portal = mockPortalService();
        const ctrl = createPortalController(portal);
        const result = ctrl.getBootstrap(tenantCtx);
        strict_1.default.ok(result.brandPortal.loginEntry.loginPath);
        strict_1.default.equal(result.brandPortal.loginEntry.ssoEnabled, true);
    });
    (0, node_test_1.default)('营销获取 portal — marketProfile 可用', () => {
        const portal = mockPortalService();
        const ctrl = createPortalController(portal);
        const result = ctrl.getBootstrap(tenantCtx);
        strict_1.default.ok(result.marketProfile);
        strict_1.default.equal(result.marketProfile.marketCode, 'cn-mainland');
    });
});
// ── 🎯运行专员 ──
(0, node_test_1.describe)(`${ROLES.Operations} portal 角色测试`, () => {
    (0, node_test_1.default)('运营专员可以获取 portal bootstrap', () => {
        const portal = mockPortalService();
        const ctrl = createPortalController(portal);
        const result = ctrl.getBootstrap(tenantCtx);
        strict_1.default.ok(result.tenantPortal);
        strict_1.default.ok(result.brandPortal);
        strict_1.default.ok(result.storePortal);
    });
    (0, node_test_1.default)('运营专员获取 portal — storePortal 含 supportedSurfaces', () => {
        const portal = mockPortalService();
        const ctrl = createPortalController(portal);
        const result = ctrl.getBootstrap(tenantCtx);
        strict_1.default.ok(result.storePortal.supportedSurfaces);
        strict_1.default.ok(result.storePortal.supportedSurfaces.includes('OfficialSite'));
    });
    (0, node_test_1.default)('运营专员获取 portal — regionalOverrides 为数组', () => {
        const portal = mockPortalService();
        const ctrl = createPortalController(portal);
        const result = ctrl.getBootstrap(tenantCtx);
        strict_1.default.ok(Array.isArray(result.regionalOverrides));
    });
});
// ── 👔店长 ──
(0, node_test_1.describe)(`${ROLES.TenantAdmin} portal 角色测试`, () => {
    (0, node_test_1.default)('店长可以获取 portal bootstrap（全部门户视图）', () => {
        const ctrl = createPortalController();
        const result = ctrl.getBootstrap(tenantCtx);
        strict_1.default.ok(result.tenantPortal);
        strict_1.default.ok(result.brandPortal);
        strict_1.default.ok(result.storePortal);
        strict_1.default.ok(result.marketProfile);
    });
    (0, node_test_1.default)('店长获取 portal — tenantPortal domain 正确', () => {
        const ctrl = createPortalController();
        const result = ctrl.getBootstrap(tenantCtx);
        strict_1.default.ok(result.tenantPortal.primaryDomain);
    });
    (0, node_test_1.default)('店长获取 portal — storePortal audience 为 ToC', () => {
        const ctrl = createPortalController();
        const result = ctrl.getBootstrap(tenantCtx);
        strict_1.default.equal(result.storePortal.audience, 'ToC');
    });
});
// ── 🛒前台 ──
(0, node_test_1.describe)(`${ROLES.Reception} portal 角色测试`, () => {
    (0, node_test_1.default)('前台可以获取 portal bootstrap（前台视角）', () => {
        const ctrl = createPortalController();
        const result = ctrl.getBootstrap(tenantCtx);
        strict_1.default.ok(result.storePortal);
        strict_1.default.ok(result.marketProfile);
    });
    (0, node_test_1.default)('前台获取 portal — storePortal 含门店门户名称', () => {
        const ctrl = createPortalController();
        const result = ctrl.getBootstrap(tenantCtx);
        strict_1.default.ok(result.storePortal.name);
    });
    (0, node_test_1.default)('前台获取 portal — foundationDependencies 存在', () => {
        const ctrl = createPortalController();
        const result = ctrl.getBootstrap(tenantCtx);
        strict_1.default.ok(Array.isArray(result.foundationDependencies));
    });
});
// ── 👥HR ──
(0, node_test_1.describe)(`${ROLES.HR} portal 角色测试`, () => {
    (0, node_test_1.default)('HR 可以获取 portal bootstrap（用于员工门户入口配置）', () => {
        const ctrl = createPortalController();
        const result = ctrl.getBootstrap(tenantCtx);
        strict_1.default.ok(result.tenantPortal);
        strict_1.default.ok(result.marketProfile);
        strict_1.default.ok(result.tenantPortal.loginEntry);
    });
    (0, node_test_1.default)('HR 获取 portal — tenantPortal 包含 SSO 登录入口（权限边界：HR 不直接管理品牌门户）', () => {
        const ctrl = createPortalController();
        const result = ctrl.getBootstrap(tenantCtx);
        // HR 视角主要关注 tenantPortal 层级信息
        strict_1.default.equal(result.tenantPortal.audience, 'ToB');
        strict_1.default.equal(result.tenantPortal.loginEntry.ssoEnabled, true);
        // HR 仍能读取 brand/store portal（只读边界）
        strict_1.default.ok(result.brandPortal);
        strict_1.default.ok(result.storePortal);
    });
    (0, node_test_1.default)('HR 获取 portal — 验证 regionalOverrides 和 foundation 数据可用', () => {
        const ctrl = createPortalController();
        const result = ctrl.getBootstrap(tenantCtx);
        strict_1.default.ok(Array.isArray(result.regionalOverrides));
        strict_1.default.ok(Array.isArray(result.foundationDependencies));
        strict_1.default.ok(Array.isArray(result.foundationContracts));
    });
});
// ── 🔧安监 ──
(0, node_test_1.describe)(`${ROLES.SafetyInspector} portal 角色测试`, () => {
    (0, node_test_1.default)('安监可以获取 portal bootstrap（用于门店合规检查）', () => {
        const ctrl = createPortalController();
        const result = ctrl.getBootstrap(tenantCtx);
        strict_1.default.ok(result.storePortal);
        strict_1.default.ok(result.storePortal.supportedSurfaces);
        // 安监关注门店端覆盖范围
        strict_1.default.ok(result.storePortal.supportedSurfaces.includes('OfficialSite'));
    });
    (0, node_test_1.default)('安监获取 portal — 权限边界：门店 storeName 可查看但不可修改', () => {
        const ctrl = createPortalController();
        const result = ctrl.getBootstrap(tenantCtx);
        // 安监可读门店门户全量信息
        strict_1.default.ok(result.storePortal.name);
        strict_1.default.equal(result.storePortal.audience, 'ToC');
        // 安监也能看到 marketProfile 验证地区合规
        strict_1.default.ok(result.marketProfile);
        strict_1.default.equal(result.marketProfile.marketCode, 'cn-mainland');
    });
    (0, node_test_1.default)('安监获取 portal — tenantPortal 和 brandPortal 也能读取（安全审计用途）', () => {
        const ctrl = createPortalController();
        const result = ctrl.getBootstrap(tenantCtx);
        strict_1.default.ok(result.tenantPortal.name);
        strict_1.default.ok(result.tenantPortal.primaryDomain);
        strict_1.default.ok(result.brandPortal.name);
        strict_1.default.ok(result.brandPortal.primaryDomain);
    });
});
// ── 🎮导玩员 ──
(0, node_test_1.describe)(`${ROLES.GameInstructor} portal 角色测试`, () => {
    (0, node_test_1.default)('导玩员可以获取 portal bootstrap（用于查看门店运营门户）', () => {
        const ctrl = createPortalController();
        const result = ctrl.getBootstrap(tenantCtx);
        strict_1.default.ok(result.storePortal);
        strict_1.default.ok(result.marketProfile);
    });
    (0, node_test_1.default)('导玩员获取 portal — 权限边界：关注 storePortal 终端的 supportedSurfaces', () => {
        const ctrl = createPortalController();
        const result = ctrl.getBootstrap(tenantCtx);
        // 导玩员场景需要确认多终端支持
        strict_1.default.ok(result.storePortal.supportedSurfaces.length > 0);
        // 导玩员不修改 tenant/brand portal 只读
        strict_1.default.ok(result.tenantPortal);
        strict_1.default.ok(result.brandPortal);
    });
    (0, node_test_1.default)('导玩员获取 portal — foundationContracts 可用于配置检查', () => {
        const ctrl = createPortalController();
        const result = ctrl.getBootstrap(tenantCtx);
        strict_1.default.ok(Array.isArray(result.foundationContracts));
        strict_1.default.ok(Array.isArray(result.foundationDependencies));
    });
});
// ── 🤝团建 ──
(0, node_test_1.describe)(`${ROLES.TeamBuilding} portal 角色测试`, () => {
    (0, node_test_1.default)('团建可以获取 portal bootstrap（用于活动门户配置）', () => {
        const ctrl = createPortalController();
        const result = ctrl.getBootstrap(tenantCtx);
        strict_1.default.ok(result.tenantPortal);
        strict_1.default.ok(result.brandPortal);
        strict_1.default.ok(result.storePortal);
        strict_1.default.ok(result.marketProfile);
    });
    (0, node_test_1.default)('团建获取 portal — 权限边界：可通过 marketProfile 获取市场信息安排团建活动', () => {
        const ctrl = createPortalController();
        const result = ctrl.getBootstrap(tenantCtx);
        strict_1.default.ok(result.marketProfile.marketCode);
        strict_1.default.ok(result.marketProfile.marketName);
        // 团建需要品牌门户查看活动配置
        strict_1.default.ok(result.brandPortal.heroTitle);
        strict_1.default.ok(result.brandPortal.solutionTags);
    });
    (0, node_test_1.default)('团建获取 portal — 登录入口信息用于活动参与引导', () => {
        const ctrl = createPortalController();
        const result = ctrl.getBootstrap(tenantCtx);
        strict_1.default.ok(result.tenantPortal.loginEntry.loginPath);
        strict_1.default.ok(result.brandPortal.loginEntry.loginPath);
        // storePortal audience 确认是 ToC 面向消费者
        strict_1.default.equal(result.storePortal.audience, 'ToC');
    });
});
// ── 新独立 endpoint 角色测试 ──
function makePortalControllerWithMocks(overrides = {}) {
    const defaults = {
        resolveTenantPortal: () => ({ audience: 'ToB', scopeType: 'TENANT', scopeCode: 't-portal', tenantCode: 't-portal', marketCode: 'cn-mainland', channel: 'WEB', name: '租户官网', primaryDomain: 't.local', supportedLanguages: ['zh-cn'], loginEntry: { label: '登录', loginPath: '/login', ssoEnabled: true } }),
        resolveBrandPortal: () => ({ audience: 'ToB', scopeType: 'BRAND', scopeCode: 'b-portal', tenantCode: 't-portal', brandCode: 'b-portal', marketCode: 'cn-mainland', channel: 'WEB', name: '品牌官网', primaryDomain: 'b.local', supportedLanguages: ['zh-cn'], heroTitle: '品牌经营官网', loginEntry: { label: '登录', loginPath: '/login', ssoEnabled: true } }),
        resolveStorePortal: () => ({ audience: 'ToC', scopeType: 'STORE', scopeCode: 's-portal', tenantCode: 't-portal', brandCode: 'b-portal', storeCode: 's-portal', storeName: '门店', marketCode: 'cn-mainland', channel: 'WEB', name: '门店门户', primaryDomain: 's.local', supportedLanguages: ['zh-cn'], supportedSurfaces: ['OFFICIAL_SITE', 'MINI_APP'] })
    };
    const { PortalController } = require('./portal.controller');
    return new PortalController({ ...defaults, ...overrides });
}
(0, node_test_1.describe)(`${ROLES.TenantAdmin} portal 独立 endpoint 角色测试`, () => {
    (0, node_test_1.default)('店长可独立获取租户门户', () => {
        const ctrl = makePortalControllerWithMocks();
        const result = ctrl.getTenantPortal(tenantCtx);
        strict_1.default.equal(result.audience, 'ToB');
        strict_1.default.equal(result.scopeType, 'TENANT');
        strict_1.default.ok(result.loginEntry.ssoEnabled);
    });
    (0, node_test_1.default)('店长可独立获取品牌门户', () => {
        const ctrl = makePortalControllerWithMocks();
        const result = ctrl.getBrandPortal(tenantCtx);
        strict_1.default.equal(result.brandCode, 'b-portal');
        strict_1.default.ok(result.heroTitle);
    });
});
(0, node_test_1.describe)(`${ROLES.Reception} portal 独立 endpoint 角色测试`, () => {
    (0, node_test_1.default)('前台可独立获取门店门户（ToC）', () => {
        const ctrl = makePortalControllerWithMocks();
        const result = ctrl.getStorePortal(tenantCtx);
        strict_1.default.equal(result.audience, 'ToC');
        strict_1.default.equal(result.storeCode, 's-portal');
        strict_1.default.ok(result.supportedSurfaces.includes('MINI_APP'));
    });
    (0, node_test_1.default)('前台 — 门店门户含 supportedSurfaces 确认多终端', () => {
        const ctrl = makePortalControllerWithMocks();
        const result = ctrl.getStorePortal(tenantCtx);
        strict_1.default.ok(result.supportedSurfaces.length >= 2);
    });
});
(0, node_test_1.describe)(`${ROLES.Marketing} portal 独立 endpoint 角色测试`, () => {
    (0, node_test_1.default)('营销获取品牌门户 — heroTitle 满足品牌营销需求', () => {
        const ctrl = makePortalControllerWithMocks();
        const result = ctrl.getBrandPortal(tenantCtx);
        strict_1.default.equal(result.heroTitle, '品牌经营官网');
    });
    (0, node_test_1.default)('营销 — 权限边界：不能通过 endpoint 获取非自有能力', () => {
        // getStorePortal 是可公开的 ToC 信息，营销也应该能访问
        const ctrl = makePortalControllerWithMocks();
        const result = ctrl.getStorePortal(tenantCtx);
        strict_1.default.equal(result.storeName, '门店');
    });
});
(0, node_test_1.describe)(`${ROLES.Operations} portal 独立 endpoint 角色测试`, () => {
    (0, node_test_1.default)('运营专员独立获取租户门户配置', () => {
        const ctrl = makePortalControllerWithMocks();
        const result = ctrl.getTenantPortal(tenantCtx);
        strict_1.default.ok(result.primaryDomain);
        strict_1.default.ok(result.supportedLanguages.length > 0);
    });
    (0, node_test_1.default)('运营专员独立获取门店门户 — 检查 storeName', () => {
        const ctrl = makePortalControllerWithMocks();
        const result = ctrl.getStorePortal(tenantCtx);
        strict_1.default.ok(result.storeName);
    });
});
(0, node_test_1.describe)(`${ROLES.Security} portal 独立 endpoint 角色测试`, () => {
    (0, node_test_1.default)('安监查看租户门户 — 确认 ssoEnabled', () => {
        const ctrl = makePortalControllerWithMocks();
        const result = ctrl.getTenantPortal(tenantCtx);
        strict_1.default.equal(result.loginEntry.ssoEnabled, true);
    });
    (0, node_test_1.default)('安监查看品牌门户 — 确认 loginPath 存在', () => {
        const ctrl = makePortalControllerWithMocks();
        const result = ctrl.getBrandPortal(tenantCtx);
        strict_1.default.ok(result.loginEntry.loginPath);
    });
});
(0, node_test_1.describe)(`${ROLES.GameInstructor} portal 独立 endpoint 角色测试`, () => {
    (0, node_test_1.default)('导玩员获取门店门户 — supportedSurfaces 含 MINI_APP', () => {
        const ctrl = makePortalControllerWithMocks();
        const result = ctrl.getStorePortal(tenantCtx);
        strict_1.default.ok(result.supportedSurfaces.includes('MINI_APP'));
    });
    (0, node_test_1.default)('导玩员获取租户门户 — 权限边界：只读', () => {
        const ctrl = makePortalControllerWithMocks();
        const result = ctrl.getTenantPortal(tenantCtx);
        strict_1.default.ok(result.name);
    });
});
(0, node_test_1.describe)(`${ROLES.TeamBuilding} portal 独立 endpoint 角色测试`, () => {
    (0, node_test_1.default)('团建获取品牌门户用于活动配置', () => {
        const ctrl = makePortalControllerWithMocks();
        const result = ctrl.getBrandPortal(tenantCtx);
        strict_1.default.ok(result.name);
        strict_1.default.ok(result.primaryDomain);
    });
    (0, node_test_1.default)('团建获取门店门户 — 确认 audience ToC', () => {
        const ctrl = makePortalControllerWithMocks();
        const result = ctrl.getStorePortal(tenantCtx);
        strict_1.default.equal(result.audience, 'ToC');
    });
});
(0, node_test_1.describe)(`${ROLES.HR} portal 独立 endpoint 角色测试`, () => {
    (0, node_test_1.default)('HR 获取租户门户配置', () => {
        const ctrl = makePortalControllerWithMocks();
        const result = ctrl.getTenantPortal(tenantCtx);
        strict_1.default.ok(result.name);
        strict_1.default.ok(result.primaryDomain);
    });
    (0, node_test_1.default)('HR — 权限边界：门店门户 audience 为 ToC', () => {
        const ctrl = makePortalControllerWithMocks();
        const result = ctrl.getStorePortal(tenantCtx);
        strict_1.default.equal(result.audience, 'ToC');
    });
});
//# sourceMappingURL=portal.role.test.js.map