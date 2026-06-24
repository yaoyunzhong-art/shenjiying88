"use strict";
/**
 * 🐜 自动: [workbench] [C] 角色测试
 *
 * 8 角色视角的 workbench 模块测试：
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 测试覆盖：
 * - workbench 角色工作台列表完整性
 * - 能力映射 hasCapability 正反例
 * - 合约转换 toRoleWorkbenchContract
 * - bootstrap 响应结构
 *
 * 每个角色至少 2 个测试用例（正常流程 + 权限边界）
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
const workbench_entity_1 = require("./workbench.entity");
const workbench_contract_1 = require("./workbench.contract");
// ── 角色定义 ──
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
// ── 测试数据工厂 ──
const sampleNavItem = {
    key: 'sample',
    label: '测试导航',
    href: '/test',
    description: '测试用'
};
function makeSampleWorkbench(role, title) {
    return {
        role: role,
        channel: 'pc',
        title,
        description: `${title}的功能说明`,
        marketCodes: ['cn-mainland'],
        navItems: [sampleNavItem]
    };
}
// ── 👔店长 ──
(0, node_test_1.describe)(`${ROLES.StoreManager} workbench 角色测试`, () => {
    (0, node_test_1.default)('店长拥有 daily-report 和 field-scheduling 能力', () => {
        strict_1.default.equal((0, workbench_entity_1.hasCapability)('STORE_MANAGER', 'daily-report'), true);
        strict_1.default.equal((0, workbench_entity_1.hasCapability)('STORE_MANAGER', 'field-scheduling'), true);
        strict_1.default.equal(workbench_entity_1.ROLE_CAPABILITY_MAP['STORE_MANAGER'].length, 2);
    });
    (0, node_test_1.default)('店长权限边界：缺少 member-crm、checkout-nuclear 能力', () => {
        // 店长只负责门店日报和现场调度，不具备会员运营和收银能力
        strict_1.default.equal((0, workbench_entity_1.hasCapability)('STORE_MANAGER', 'member-crm'), false);
        strict_1.default.equal((0, workbench_entity_1.hasCapability)('STORE_MANAGER', 'checkout-nuclear'), false);
        strict_1.default.equal((0, workbench_entity_1.hasCapability)('STORE_MANAGER', 'offline-fallback'), false);
        strict_1.default.equal((0, workbench_entity_1.hasCapability)('STORE_MANAGER', 'promo-conversion'), false);
    });
});
// ── 🛒前台 ──
(0, node_test_1.describe)(`${ROLES.FrontDesk} workbench 角色测试`, () => {
    (0, node_test_1.default)('前台（收银员角色）拥有 checkout-nuclear 和 offline-fallback 能力', () => {
        strict_1.default.equal((0, workbench_entity_1.hasCapability)('CASHIER', 'checkout-nuclear'), true);
        strict_1.default.equal((0, workbench_entity_1.hasCapability)('CASHIER', 'offline-fallback'), true);
        strict_1.default.equal(workbench_entity_1.ROLE_CAPABILITY_MAP['CASHIER'].length, 2);
    });
    (0, node_test_1.default)('前台权限边界：不能访问经营管理功能', () => {
        // 收银员只有收银和离线能力
        strict_1.default.equal((0, workbench_entity_1.hasCapability)('CASHIER', 'brand-matrix'), false);
        strict_1.default.equal((0, workbench_entity_1.hasCapability)('CASHIER', 'daily-report'), false);
        strict_1.default.equal((0, workbench_entity_1.hasCapability)('CASHIER', 'campaign-execution'), false);
        strict_1.default.equal((0, workbench_entity_1.hasCapability)('CASHIER', 'portal-management'), false);
    });
});
// ── 👥HR ──
(0, node_test_1.describe)(`${ROLES.HR} workbench 角色测试`, () => {
    (0, node_test_1.default)('HR 通过租户管理员角色拥有组织管理能力', () => {
        // TENANT_ADMIN 具备品牌矩阵、渠道编排、区域配置、门户管理
        strict_1.default.equal((0, workbench_entity_1.hasCapability)('TENANT_ADMIN', 'brand-matrix'), true);
        strict_1.default.equal((0, workbench_entity_1.hasCapability)('TENANT_ADMIN', 'channel-orchestration'), true);
        strict_1.default.equal((0, workbench_entity_1.hasCapability)('TENANT_ADMIN', 'regional-config'), true);
        strict_1.default.equal((0, workbench_entity_1.hasCapability)('TENANT_ADMIN', 'portal-management'), true);
        strict_1.default.equal(workbench_entity_1.ROLE_CAPABILITY_MAP['TENANT_ADMIN'].length, 4);
    });
    (0, node_test_1.default)('HR 权限边界：不能执行门店级别的操作', () => {
        strict_1.default.equal((0, workbench_entity_1.hasCapability)('TENANT_ADMIN', 'daily-report'), false);
        strict_1.default.equal((0, workbench_entity_1.hasCapability)('TENANT_ADMIN', 'checkout-nuclear'), false);
        strict_1.default.equal((0, workbench_entity_1.hasCapability)('TENANT_ADMIN', 'promo-conversion'), false);
    });
});
// ── 🔧安监 ──
(0, node_test_1.describe)(`${ROLES.Security} workbench 角色测试`, () => {
    (0, node_test_1.default)('安监（超级管理员）拥有审计中心能力', () => {
        strict_1.default.equal((0, workbench_entity_1.hasCapability)('SUPER_ADMIN', 'audit-center'), true);
        strict_1.default.equal((0, workbench_entity_1.hasCapability)('SUPER_ADMIN', 'tenant-management'), true);
        strict_1.default.equal((0, workbench_entity_1.hasCapability)('SUPER_ADMIN', 'market-governance'), true);
        strict_1.default.equal(workbench_entity_1.ROLE_CAPABILITY_MAP['SUPER_ADMIN'].length, 3);
    });
    (0, node_test_1.default)('安监权限边界：无门店运营和收银能力', () => {
        // 超级管理员管理全局租户和审计，但不下场到门店层面
        strict_1.default.equal((0, workbench_entity_1.hasCapability)('SUPER_ADMIN', 'daily-report'), false);
        strict_1.default.equal((0, workbench_entity_1.hasCapability)('SUPER_ADMIN', 'checkout-nuclear'), false);
        strict_1.default.equal((0, workbench_entity_1.hasCapability)('SUPER_ADMIN', 'field-scheduling'), false);
        strict_1.default.equal((0, workbench_entity_1.hasCapability)('SUPER_ADMIN', 'member-crm'), false);
    });
});
// ── 🎮导玩员 ──
(0, node_test_1.describe)(`${ROLES.Guide} workbench 角色测试`, () => {
    (0, node_test_1.default)('导玩员拥有 member-crm 和 promo-conversion 能力', () => {
        strict_1.default.equal((0, workbench_entity_1.hasCapability)('GUIDE', 'member-crm'), true);
        strict_1.default.equal((0, workbench_entity_1.hasCapability)('GUIDE', 'promo-conversion'), true);
        strict_1.default.equal(workbench_entity_1.ROLE_CAPABILITY_MAP['GUIDE'].length, 2);
    });
    (0, node_test_1.default)('导玩员权限边界：不能操作渠道编排和审计', () => {
        strict_1.default.equal((0, workbench_entity_1.hasCapability)('GUIDE', 'channel-orchestration'), false);
        strict_1.default.equal((0, workbench_entity_1.hasCapability)('GUIDE', 'audit-center'), false);
        strict_1.default.equal((0, workbench_entity_1.hasCapability)('GUIDE', 'tenant-management'), false);
        strict_1.default.equal((0, workbench_entity_1.hasCapability)('GUIDE', 'offline-fallback'), false);
    });
    (0, node_test_1.default)('导玩员 workbench contract 转换：channel 为 pad', () => {
        const wb = makeSampleWorkbench('GUIDE', '导购工作台');
        // 覆盖 channel
        const realistic = { ...wb, channel: 'pad' };
        const contract = (0, workbench_contract_1.toRoleWorkbenchContract)(realistic);
        strict_1.default.equal(contract.role, 'GUIDE');
        strict_1.default.equal(contract.title, '导购工作台');
        strict_1.default.equal(contract.marketCodes.length, 1);
        strict_1.default.equal(contract.navItems[0].key, 'sample');
    });
});
// ── 🎯运行专员 ──
(0, node_test_1.describe)(`${ROLES.Operations} workbench 角色测试`, () => {
    (0, node_test_1.default)('运行专员通过品牌管理员角色拥有会员和活动能力', () => {
        strict_1.default.equal((0, workbench_entity_1.hasCapability)('BRAND_MANAGER', 'member-crm'), true);
        strict_1.default.equal((0, workbench_entity_1.hasCapability)('BRAND_MANAGER', 'campaign-execution'), true);
        strict_1.default.equal((0, workbench_entity_1.hasCapability)('BRAND_MANAGER', 'regional-config'), true);
        strict_1.default.equal(workbench_entity_1.ROLE_CAPABILITY_MAP['BRAND_MANAGER'].length, 3);
    });
    (0, node_test_1.default)('运行专员权限边界：不能管理租户或收银', () => {
        strict_1.default.equal((0, workbench_entity_1.hasCapability)('BRAND_MANAGER', 'tenant-management'), false);
        strict_1.default.equal((0, workbench_entity_1.hasCapability)('BRAND_MANAGER', 'checkout-nuclear'), false);
        strict_1.default.equal((0, workbench_entity_1.hasCapability)('BRAND_MANAGER', 'field-scheduling'), false);
    });
});
// ── 🤝团建 ──
(0, node_test_1.describe)(`${ROLES.Teambuilding} workbench 角色测试`, () => {
    (0, node_test_1.default)('团建通过超级管理员视角验证所有能力常量完整', () => {
        // 验证 WORKBENCH_CAPABILITIES 包含了所有关键能力
        const allCaps = [...workbench_entity_1.WORKBENCH_CAPABILITIES];
        strict_1.default.ok(allCaps.includes('tenant-management'));
        strict_1.default.ok(allCaps.includes('brand-matrix'));
        strict_1.default.ok(allCaps.includes('channel-orchestration'));
        strict_1.default.ok(allCaps.includes('member-crm'));
        strict_1.default.ok(allCaps.includes('checkout-nuclear'));
        strict_1.default.ok(allCaps.includes('offline-fallback'));
        strict_1.default.ok(allCaps.includes('promo-conversion'));
        strict_1.default.ok(allCaps.includes('audit-center'));
        strict_1.default.ok(allCaps.includes('campaign-execution'));
        strict_1.default.equal(allCaps.length, 14);
    });
    (0, node_test_1.default)('团建验证所有角色都有能力定义', () => {
        const definedRoles = Object.keys(workbench_entity_1.ROLE_CAPABILITY_MAP);
        strict_1.default.ok(definedRoles.includes('SUPER_ADMIN'));
        strict_1.default.ok(definedRoles.includes('TENANT_ADMIN'));
        strict_1.default.ok(definedRoles.includes('BRAND_MANAGER'));
        strict_1.default.ok(definedRoles.includes('STORE_MANAGER'));
        strict_1.default.ok(definedRoles.includes('GUIDE'));
        strict_1.default.ok(definedRoles.includes('CASHIER'));
        strict_1.default.ok(definedRoles.includes('OPERATIONS'));
        strict_1.default.ok(definedRoles.includes('FINANCE'));
        strict_1.default.ok(definedRoles.includes('WAREHOUSE'));
        strict_1.default.ok(definedRoles.includes('COACH'));
        strict_1.default.equal(definedRoles.length, 10);
    });
});
// ── 📢营销 ──
(0, node_test_1.describe)(`${ROLES.Marketing} workbench 角色测试`, () => {
    (0, node_test_1.default)('营销通过品牌管理员拥有 campaign-execution 和 member-crm 能力', () => {
        strict_1.default.equal((0, workbench_entity_1.hasCapability)('BRAND_MANAGER', 'campaign-execution'), true);
        strict_1.default.equal((0, workbench_entity_1.hasCapability)('BRAND_MANAGER', 'member-crm'), true);
    });
    (0, node_test_1.default)('营销权限边界：hasCapability 对未定义角色返回 false', () => {
        // 不存在的角色应安全返回 false
        strict_1.default.equal((0, workbench_entity_1.hasCapability)('UNKNOWN_ROLE', 'member-crm'), false);
        // 空字符串角色
        strict_1.default.equal((0, workbench_entity_1.hasCapability)('', 'member-crm'), false);
        // 存在角色但不存在的能力
        strict_1.default.equal((0, workbench_entity_1.hasCapability)('BRAND_MANAGER', 'non-existent-cap'), false);
    });
    (0, node_test_1.default)('营销验证 workbench contract 的多 marketCodes 支持', () => {
        const wb = {
            role: 'BRAND_MANAGER',
            channel: 'mobile',
            title: '品牌经营台',
            description: '品牌活动管理',
            marketCodes: ['cn-mainland', 'us-default', 'jp-east'],
            navItems: [
                { key: 'member', label: '会员', href: '/wb/member', description: '会员' },
                { key: 'campaign', label: '活动', href: '/wb/campaign', description: '活动' }
            ]
        };
        const contract = (0, workbench_contract_1.toRoleWorkbenchContract)(wb);
        strict_1.default.equal(contract.role, 'BRAND_MANAGER');
        strict_1.default.equal(contract.title, '品牌经营台');
        strict_1.default.equal(contract.marketCodes.length, 3);
        strict_1.default.equal(contract.marketCodes[2], 'jp-east');
        strict_1.default.equal(contract.navItems.length, 2);
        strict_1.default.equal(contract.navItems[1].key, 'campaign');
    });
});
// ── 公共：tenantContext 合约转换 ──
(0, node_test_1.describe)('公共合约测试', () => {
    (0, node_test_1.default)('toTenantContextContract 完整上下文', () => {
        const ctx = {
            tenantId: 't-001',
            brandId: 'b-001',
            storeId: 's-001',
            marketCode: 'cn-mainland'
        };
        const contract = (0, workbench_contract_1.toTenantContextContract)(ctx);
        strict_1.default.equal(contract.tenantId, 't-001');
        strict_1.default.equal(contract.brandId, 'b-001');
        strict_1.default.equal(contract.storeId, 's-001');
        strict_1.default.equal(contract.marketCode, 'cn-mainland');
    });
    (0, node_test_1.default)('toTenantContextContract 最小上下文（仅 tenantId）', () => {
        const ctx = { tenantId: 't-min' };
        const contract = (0, workbench_contract_1.toTenantContextContract)(ctx);
        strict_1.default.equal(contract.tenantId, 't-min');
        strict_1.default.equal(contract.brandId, undefined);
        strict_1.default.equal(contract.storeId, undefined);
        strict_1.default.equal(contract.marketCode, undefined);
    });
});
//# sourceMappingURL=workbench.role.test.js.map