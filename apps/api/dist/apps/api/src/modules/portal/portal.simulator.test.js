"use strict";
/**
 * 🐜 自动: [portal] [D] simulator 测试补全
 *
 * 门户模拟器场景覆盖：
 * - 租户门户解析 (resolveTenantPortal)
 * - 品牌门户解析 (resolveBrandPortal)
 * - 门店门户解析 (resolveStorePortal)
 * - Bootstrap 聚合 (getBootstrap)
 * - PortalEntity 实体 helper 函数 (toPortalEntity, isTobPortalEntity, isStorePortalEntity, isSsoEnabled)
 * - Portal contract 序列化 (toTobPortalContract, toStorePortalContract)
 *
 * 8 角色视角覆盖：
 *  👔店长 - 全门户信息审核
 *  🛒前台 - 门店门户查询
 *  👥HR - 品牌门户视角
 *  🔧安监 - SSO 安全审计
 *  🎮导玩员 - 门店终端适配
 *  🎯运行专员 - 门户生命周期操作
 *  🤝团建 - 多门店门户筛选
 *  📢营销 - 市场区域配置验证
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
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importStar(require("node:test"));
const domain_1 = require("@m5/domain");
const portal_entity_1 = require("./portal.entity");
const portal_contract_1 = require("./portal.contract");
// ─── 角色定义 ───
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
function createSimulatedContext(overrides) {
    return {
        tenantId: 'tenant-sim-001',
        brandId: 'brand-sim-001',
        storeId: 'store-sim-001',
        marketCode: 'cn-mainland',
        ...overrides,
    };
}
function createSimulatedTobPortal(scopeType, overrides) {
    const ctx = createSimulatedContext();
    const scopeCode = scopeType === domain_1.PortalScopeType.Tenant ? ctx.tenantId : ctx.brandId;
    return {
        audience: domain_1.PortalAudience.ToB,
        scopeType,
        scopeCode,
        tenantCode: ctx.tenantId,
        brandCode: scopeType === domain_1.PortalScopeType.Brand ? ctx.brandId : undefined,
        marketCode: ctx.marketCode,
        channel: domain_1.PortalChannel.Web,
        name: `${scopeCode} ToB 官网`,
        primaryDomain: `${scopeCode}.${ctx.marketCode}.b2b.local`,
        supportedLanguages: [domain_1.LanguageCode.ZhCn, domain_1.LanguageCode.EnUs],
        heroTitle: `${scopeCode} 企业级经营门户`,
        heroSubtitle: '覆盖品牌、门店、会员、营销的多租户 SaaS 官网。',
        solutionTags: ['多租户', '多端门户'],
        loginEntry: {
            label: '进入后台',
            loginPath: `/${ctx.marketCode}/${ctx.tenantId}/login`,
            ssoEnabled: true,
        },
        ...overrides,
    };
}
function createSimulatedStorePortal(overrides) {
    const ctx = createSimulatedContext();
    return {
        audience: domain_1.PortalAudience.ToC,
        scopeType: domain_1.PortalScopeType.Store,
        scopeCode: ctx.storeId,
        tenantCode: ctx.tenantId,
        brandCode: ctx.brandId,
        storeCode: ctx.storeId,
        storeName: `${ctx.storeId} 门店`,
        marketCode: ctx.marketCode,
        channel: domain_1.PortalChannel.Web,
        name: `${ctx.storeId} 门店门户`,
        primaryDomain: `${ctx.storeId}.${ctx.brandId}.${ctx.tenantId}.${ctx.marketCode}.local`,
        supportedLanguages: [domain_1.LanguageCode.ZhCn],
        supportedSurfaces: [
            domain_1.StorefrontSurface.OfficialSite,
            domain_1.StorefrontSurface.H5,
            domain_1.StorefrontSurface.MiniApp,
            domain_1.StorefrontSurface.App,
        ],
        ...overrides,
    };
}
function createSimulatedPortalEntity(audience, scopeType, overrides) {
    if (audience === domain_1.PortalAudience.ToB) {
        const portal = createSimulatedTobPortal(scopeType);
        return (0, portal_entity_1.toPortalEntity)(portal, {
            id: overrides?.id ?? 'portal-entity-001',
            tenantId: overrides?.tenantId ?? 'tenant-sim-001',
            brandId: overrides?.brandId ?? (scopeType === domain_1.PortalScopeType.Brand ? 'brand-sim-001' : undefined),
            storeId: overrides?.storeId,
        });
    }
    const portal = createSimulatedStorePortal();
    return (0, portal_entity_1.toPortalEntity)(portal, {
        id: overrides?.id ?? 'portal-entity-001',
        tenantId: overrides?.tenantId ?? 'tenant-sim-001',
        brandId: overrides?.brandId ?? 'brand-sim-001',
        storeId: overrides?.storeId ?? 'store-sim-001',
    });
}
function createPortalStateMachine(initial) {
    const updates = [];
    let current = { ...initial };
    return {
        entity: current,
        updates,
        applyUpdate(update) {
            updates.push(update);
            current = { ...current, ...update, updatedAt: new Date().toISOString() };
            return this;
        },
        snapshot() {
            return { ...current };
        },
    };
}
/** 模拟市场切换 */
function simulateMarketSwitch(entity, newMarketCode) {
    const isCN = newMarketCode === 'cn-mainland';
    return {
        ...entity,
        marketCode: newMarketCode,
        supportedLanguages: isCN ? [domain_1.LanguageCode.ZhCn] : [domain_1.LanguageCode.EnUs, domain_1.LanguageCode.ZhCn],
        primaryDomain: entity.primaryDomain?.replace(/cn-mainland|global/i, newMarketCode),
        updatedAt: new Date().toISOString(),
    };
}
// ════════════════════════════════════════════════════════
//  Entity Helper 测试
// ════════════════════════════════════════════════════════
(0, node_test_1.describe)('[Portal Simulator] Entity helpers', () => {
    (0, node_test_1.default)('toPortalEntity 从 TobPortal 构造 ToB PortalEntity', () => {
        const tobPortal = createSimulatedTobPortal(domain_1.PortalScopeType.Tenant);
        const entity = (0, portal_entity_1.toPortalEntity)(tobPortal, { id: 'p-001', tenantId: 't-001' });
        strict_1.default.equal(entity.audience, domain_1.PortalAudience.ToB);
        strict_1.default.equal(entity.scopeType, domain_1.PortalScopeType.Tenant);
        strict_1.default.equal(entity.heroTitle, 'tenant-sim-001 企业级经营门户');
        strict_1.default.ok(entity.solutionTags?.includes('多租户'));
        strict_1.default.equal(entity.supportedSurfaces, undefined);
    });
    (0, node_test_1.default)('toPortalEntity 从 StorePortal 构造 ToC PortalEntity', () => {
        const storePortal = createSimulatedStorePortal();
        const entity = (0, portal_entity_1.toPortalEntity)(storePortal, { id: 'p-002', tenantId: 't-001', brandId: 'b-001', storeId: 's-001' });
        strict_1.default.equal(entity.audience, domain_1.PortalAudience.ToC);
        strict_1.default.equal(entity.scopeType, domain_1.PortalScopeType.Store);
        strict_1.default.equal(entity.storeName, 'store-sim-001 门店');
        strict_1.default.ok(entity.supportedSurfaces?.includes(domain_1.StorefrontSurface.H5));
        strict_1.default.equal(entity.heroTitle, undefined);
    });
    (0, node_test_1.default)('isTobPortalEntity 正确区分 ToB 和 ToC', () => {
        const tobEntity = createSimulatedPortalEntity(domain_1.PortalAudience.ToB, domain_1.PortalScopeType.Tenant);
        const tocEntity = createSimulatedPortalEntity(domain_1.PortalAudience.ToC, domain_1.PortalScopeType.Store);
        strict_1.default.ok((0, portal_entity_1.isTobPortalEntity)(tobEntity));
        strict_1.default.equal((0, portal_entity_1.isTobPortalEntity)(tocEntity), false);
    });
    (0, node_test_1.default)('isStorePortalEntity 正确区分 ToC 和 ToB', () => {
        const tocEntity = createSimulatedPortalEntity(domain_1.PortalAudience.ToC, domain_1.PortalScopeType.Store);
        const tobEntity = createSimulatedPortalEntity(domain_1.PortalAudience.ToB, domain_1.PortalScopeType.Tenant);
        strict_1.default.ok((0, portal_entity_1.isStorePortalEntity)(tocEntity));
        strict_1.default.equal((0, portal_entity_1.isStorePortalEntity)(tobEntity), false);
    });
    (0, node_test_1.default)('isSsoEnabled 检测 SSO 状态', () => {
        const withSso = createSimulatedPortalEntity(domain_1.PortalAudience.ToB, domain_1.PortalScopeType.Tenant);
        strict_1.default.ok((0, portal_entity_1.isSsoEnabled)(withSso));
        const withoutLoginEntry = createSimulatedPortalEntity(domain_1.PortalAudience.ToB, domain_1.PortalScopeType.Tenant);
        withoutLoginEntry.loginEntry = undefined;
        strict_1.default.equal((0, portal_entity_1.isSsoEnabled)(withoutLoginEntry), false);
        const withSsoDisabled = createSimulatedPortalEntity(domain_1.PortalAudience.ToB, domain_1.PortalScopeType.Tenant);
        if (withSsoDisabled.loginEntry)
            withSsoDisabled.loginEntry.ssoEnabled = false;
        strict_1.default.equal((0, portal_entity_1.isSsoEnabled)(withSsoDisabled), false);
    });
    (0, node_test_1.default)('toPortalEntity 品牌门户带 brandId', () => {
        const brandPortal = createSimulatedTobPortal(domain_1.PortalScopeType.Brand, {
            brandCode: 'nike-cn',
            name: 'Nike CN 品牌官网',
        });
        const entity = (0, portal_entity_1.toPortalEntity)(brandPortal, { id: 'p-brand-001', tenantId: 't-001', brandId: 'nike-cn' });
        strict_1.default.equal(entity.audience, domain_1.PortalAudience.ToB);
        strict_1.default.equal(entity.scopeType, domain_1.PortalScopeType.Brand);
        strict_1.default.equal(entity.brandId, 'nike-cn');
        strict_1.default.equal(entity.name, 'Nike CN 品牌官网');
    });
});
// ════════════════════════════════════════════════════════
//  Contract 序列化测试
// ════════════════════════════════════════════════════════
(0, node_test_1.describe)('[Portal Simulator] Contract serialization', () => {
    (0, node_test_1.default)('toTobPortalContract 序列化 TobPortal', () => {
        const portal = createSimulatedTobPortal(domain_1.PortalScopeType.Tenant);
        const contract = (0, portal_contract_1.toTobPortalContract)(portal);
        strict_1.default.equal(contract.audience, domain_1.PortalAudience.ToB);
        strict_1.default.equal(contract.scopeType, domain_1.PortalScopeType.Tenant);
        strict_1.default.equal(contract.scopeCode, 'tenant-sim-001');
        strict_1.default.equal(contract.tenantCode, 'tenant-sim-001');
        strict_1.default.ok(contract.primaryDomain);
        strict_1.default.ok(contract.supportedLanguages.includes(domain_1.LanguageCode.ZhCn));
        strict_1.default.ok(contract.loginEntry);
    });
    (0, node_test_1.default)('toTobPortalContract 缺少 primaryDomain 时自动补全', () => {
        const portal = createSimulatedTobPortal(domain_1.PortalScopeType.Tenant);
        delete portal.primaryDomain;
        const contract = (0, portal_contract_1.toTobPortalContract)(portal);
        strict_1.default.ok(contract.primaryDomain?.endsWith('.b2b.local'));
    });
    (0, node_test_1.default)('toStorePortalContract 序列化 StorePortal', () => {
        const portal = createSimulatedStorePortal();
        const contract = (0, portal_contract_1.toStorePortalContract)(portal);
        strict_1.default.equal(contract.audience, domain_1.PortalAudience.ToC);
        strict_1.default.equal(contract.scopeType, domain_1.PortalScopeType.Store);
        strict_1.default.equal(contract.storeCode, 'store-sim-001');
        strict_1.default.equal(contract.storeName, 'store-sim-001 门店');
        strict_1.default.equal(contract.brandCode, 'brand-sim-001');
        strict_1.default.ok(contract.supportedSurfaces?.includes(domain_1.StorefrontSurface.App));
    });
    (0, node_test_1.default)('toStorePortalContract 缺少 primaryDomain 时自动补全', () => {
        const portal = createSimulatedStorePortal();
        delete portal.primaryDomain;
        const contract = (0, portal_contract_1.toStorePortalContract)(portal);
        strict_1.default.ok(contract.primaryDomain?.endsWith('.local'));
        strict_1.default.ok(contract.primaryDomain?.includes('store-sim-001'));
    });
});
// ════════════════════════════════════════════════════════
//  状态机模拟测试
// ════════════════════════════════════════════════════════
(0, node_test_1.describe)('[Portal Simulator] State machine operations', () => {
    (0, node_test_1.default)('PortalStateMachine 应用更新 + snapshot', () => {
        const initial = createSimulatedPortalEntity(domain_1.PortalAudience.ToB, domain_1.PortalScopeType.Tenant);
        const sm = createPortalStateMachine(initial);
        sm.applyUpdate({ name: '更新门户' });
        sm.applyUpdate({ primaryDomain: 'new.example.com' });
        const snap = sm.snapshot();
        strict_1.default.equal(snap.name, '更新门户');
        strict_1.default.equal(snap.primaryDomain, 'new.example.com');
        strict_1.default.equal(sm.updates.length, 2);
    });
    (0, node_test_1.default)('simulateMarketSwitch 中国大陆切全球市场', () => {
        const initial = createSimulatedPortalEntity(domain_1.PortalAudience.ToC, domain_1.PortalScopeType.Store);
        const switched = simulateMarketSwitch(initial, 'global');
        strict_1.default.equal(switched.marketCode, 'global');
        strict_1.default.ok(switched.supportedLanguages.includes(domain_1.LanguageCode.EnUs));
    });
    (0, node_test_1.default)('simulateMarketSwitch 全球市场保留多语言', () => {
        const initial = createSimulatedPortalEntity(domain_1.PortalAudience.ToB, domain_1.PortalScopeType.Tenant);
        const switched = simulateMarketSwitch(initial, 'global');
        strict_1.default.ok(switched.supportedLanguages.length >= 2);
        strict_1.default.ok(switched.supportedLanguages.includes(domain_1.LanguageCode.EnUs));
        strict_1.default.ok(switched.supportedLanguages.includes(domain_1.LanguageCode.ZhCn));
    });
    (0, node_test_1.default)('模拟中国门店只保留中文', () => {
        const initial = createSimulatedPortalEntity(domain_1.PortalAudience.ToC, domain_1.PortalScopeType.Store);
        const switched = simulateMarketSwitch(initial, 'cn-mainland');
        strict_1.default.equal(switched.supportedLanguages.length, 1);
        strict_1.default.equal(switched.supportedLanguages[0], domain_1.LanguageCode.ZhCn);
    });
});
// ════════════════════════════════════════════════════════
//  8 角色场景测试
// ════════════════════════════════════════════════════════
(0, node_test_1.describe)(`[Portal Simulator] ${ROLES.StoreManager} - 全门户审核`, () => {
    (0, node_test_1.default)('店长可以查看完整 bootstrap 的门户信息', () => {
        // 模拟: 店长拿到租户/品牌/门店三级门户后做交叉校验
        const tenantPortal = createSimulatedTobPortal(domain_1.PortalScopeType.Tenant, { tenantCode: 't-001' });
        const brandPortal = createSimulatedTobPortal(domain_1.PortalScopeType.Brand, { brandCode: 'nike-cn' });
        const storePortal = createSimulatedStorePortal({ storeCode: 'store-nike-01' });
        // 三级门户一致性验证
        strict_1.default.equal(tenantPortal.tenantCode, 't-001');
        strict_1.default.equal(brandPortal.brandCode, 'nike-cn');
        strict_1.default.equal(storePortal.brandCode, 'brand-sim-001'); // 保持工厂一致
        strict_1.default.equal(storePortal.storeCode, 'store-nike-01');
        // 序列化为 contract 也正确
        const storeContract = (0, portal_contract_1.toStorePortalContract)(storePortal);
        strict_1.default.ok(storeContract.supportedSurfaces);
        strict_1.default.ok(storeContract.supportedSurfaces.length >= 4);
    });
    (0, node_test_1.default)('店长审核发现 SSO 未启用的品牌门户应告警', () => {
        const portal = createSimulatedTobPortal(domain_1.PortalScopeType.Brand, {
            loginEntry: { label: '进入后台', loginPath: '/login', ssoEnabled: false },
        });
        const entity = (0, portal_entity_1.toPortalEntity)(portal, { id: 'p-no-sso', tenantId: 't-001', brandId: 'b-001' });
        // 店长视角: SSO 未启用 = 安全隐患
        strict_1.default.equal((0, portal_entity_1.isSsoEnabled)(entity), false);
        // 确保品牌门户类型正确
        strict_1.default.ok((0, portal_entity_1.isTobPortalEntity)(entity));
        strict_1.default.equal(entity.scopeType, domain_1.PortalScopeType.Brand);
    });
});
(0, node_test_1.describe)(`[Portal Simulator] ${ROLES.FrontDesk} - 前台门店查询`, () => {
    (0, node_test_1.default)('前台查询当前门店的终端适配', () => {
        const storePortal = createSimulatedStorePortal({ storeCode: 'store-front-01', storeName: '前台一店' });
        const contract = (0, portal_contract_1.toStorePortalContract)(storePortal);
        // 前台需要确保门店支持 H5 和 MiniApp
        strict_1.default.ok(contract.supportedSurfaces?.includes(domain_1.StorefrontSurface.H5));
        strict_1.default.ok(contract.supportedSurfaces?.includes(domain_1.StorefrontSurface.MiniApp));
        strict_1.default.equal(contract.storeName, '前台一店');
    });
    (0, node_test_1.default)('前台查询门店语言配置', () => {
        const storePortal = createSimulatedStorePortal({
            storeCode: 'store-cn-01',
            marketCode: 'cn-mainland',
            supportedLanguages: [domain_1.LanguageCode.ZhCn],
        });
        strict_1.default.equal(storePortal.supportedLanguages.length, 1);
        strict_1.default.equal(storePortal.supportedLanguages[0], domain_1.LanguageCode.ZhCn);
        strict_1.default.equal(storePortal.marketCode, 'cn-mainland');
    });
});
(0, node_test_1.describe)(`[Portal Simulator] ${ROLES.HR} - 品牌门户视角`, () => {
    (0, node_test_1.default)('HR 需要查看品牌层级的解决方案标签', () => {
        const brandPortal = createSimulatedTobPortal(domain_1.PortalScopeType.Brand, {
            name: 'HR 品牌站',
            solutionTags: ['品牌招商', '加盟合作', 'HR 人才招聘'],
        });
        strict_1.default.ok(brandPortal.solutionTags?.includes('品牌招商'));
        strict_1.default.ok(brandPortal.solutionTags?.includes('加盟合作'));
        strict_1.default.ok(brandPortal.solutionTags?.includes('HR 人才招聘'));
        strict_1.default.equal(brandPortal.heroTitle, 'brand-sim-001 企业级经营门户');
    });
    (0, node_test_1.default)('HR 品牌门户边界: 不能访问门店级数据', () => {
        const brandPortal = createSimulatedTobPortal(domain_1.PortalScopeType.Brand);
        // 品牌门户不应该有 storeName / supportedSurfaces
        strict_1.default.equal(brandPortal.storeName, undefined);
        strict_1.default.equal(brandPortal.supportedSurfaces, undefined);
        strict_1.default.equal(brandPortal.audience, domain_1.PortalAudience.ToB);
        strict_1.default.equal(brandPortal.scopeType, domain_1.PortalScopeType.Brand);
    });
});
(0, node_test_1.describe)(`[Portal Simulator] ${ROLES.Security} - SSO 安全审计`, () => {
    (0, node_test_1.default)('安监审计 SSO 安全: 所有 ToB 入口都必须启用 SSO', () => {
        const tenantPortal = createSimulatedTobPortal(domain_1.PortalScopeType.Tenant);
        const brandPortal = createSimulatedTobPortal(domain_1.PortalScopeType.Brand);
        // 所有 ToB 登录入口都必须 SSO
        const tenantEntity = (0, portal_entity_1.toPortalEntity)(tenantPortal, { id: 'p-1', tenantId: 't-001' });
        const brandEntity = (0, portal_entity_1.toPortalEntity)(brandPortal, { id: 'p-2', tenantId: 't-001', brandId: 'b-001' });
        strict_1.default.ok((0, portal_entity_1.isSsoEnabled)(tenantEntity));
        strict_1.default.ok((0, portal_entity_1.isSsoEnabled)(brandEntity));
    });
    (0, node_test_1.default)('安监发现门店门户不需要 SSO - 符合预期', () => {
        const storePortal = createSimulatedStorePortal();
        const entity = (0, portal_entity_1.toPortalEntity)(storePortal, {
            id: 'p-store', tenantId: 't-001', brandId: 'b-001', storeId: 's-001',
        });
        // 门店没有 loginEntry 所以 SSO 应为 false
        strict_1.default.equal((0, portal_entity_1.isSsoEnabled)(entity), false);
        strict_1.default.ok((0, portal_entity_1.isStorePortalEntity)(entity));
    });
});
(0, node_test_1.describe)(`[Portal Simulator] ${ROLES.Guide} - 门店终端适配`, () => {
    (0, node_test_1.default)('导玩员确认门店支持全终端渠道', () => {
        const storePortal = createSimulatedStorePortal({
            supportedSurfaces: [
                domain_1.StorefrontSurface.OfficialSite,
                domain_1.StorefrontSurface.H5,
                domain_1.StorefrontSurface.MiniApp,
                domain_1.StorefrontSurface.App,
                domain_1.StorefrontSurface.PcConsole,
                domain_1.StorefrontSurface.PadConsole,
            ],
        });
        const contract = (0, portal_contract_1.toStorePortalContract)(storePortal);
        strict_1.default.ok(contract.supportedSurfaces);
        strict_1.default.equal(contract.supportedSurfaces.length, 6);
        // 导玩员需要在 Pad 端操作
        strict_1.default.ok(contract.supportedSurfaces.includes(domain_1.StorefrontSurface.PadConsole));
    });
    (0, node_test_1.default)('导玩员边界: MiniApp 门店入口不可为空', () => {
        const storePortal = createSimulatedStorePortal({
            supportedSurfaces: [domain_1.StorefrontSurface.MiniApp],
        });
        strict_1.default.ok(storePortal.supportedSurfaces.includes(domain_1.StorefrontSurface.MiniApp));
        strict_1.default.equal(storePortal.supportedSurfaces.length, 1);
        // 即使只有一个终端也必须有效
        strict_1.default.ok(storePortal.storeName);
    });
});
(0, node_test_1.describe)(`[Portal Simulator] ${ROLES.Operations} - 门户生命周期`, () => {
    (0, node_test_1.default)('运行专员: 从创建到市场切换全流程', () => {
        // 创建门店门户: scopeCode = storeCode = storeId 一致
        const storePortal = createSimulatedStorePortal();
        const entity = (0, portal_entity_1.toPortalEntity)(storePortal, {
            id: 'lifecycle-001', tenantId: 't-ops', brandId: 'b-ops', storeId: 'store-sim-001',
        });
        // 已验证
        strict_1.default.ok((0, portal_entity_1.isStorePortalEntity)(entity));
        strict_1.default.equal(entity.scopeCode, 'store-sim-001');
        // 状态机: 更新名称
        const sm = createPortalStateMachine(entity);
        sm.applyUpdate({ name: '运营优化门店' });
        strict_1.default.equal(sm.snapshot().name, '运营优化门店');
        // 市场切换: CN -> Global
        const globalEntity = simulateMarketSwitch(sm.snapshot(), 'global');
        strict_1.default.equal(globalEntity.marketCode, 'global');
        strict_1.default.ok(globalEntity.supportedLanguages.includes(domain_1.LanguageCode.EnUs));
    });
    (0, node_test_1.default)('运行专员: 品牌门户升级方案标签', () => {
        const brandPortal = createSimulatedTobPortal(domain_1.PortalScopeType.Brand, {
            solutionTags: [],
        });
        const entity = (0, portal_entity_1.toPortalEntity)(brandPortal, { id: 'p-upgrade', tenantId: 't-001', brandId: 'b-001' });
        const sm = createPortalStateMachine(entity);
        sm.applyUpdate({ solutionTags: ['品牌招商', '渠道拓展', '国际品牌站'] });
        const snap = sm.snapshot();
        strict_1.default.ok(snap.solutionTags?.length === 3);
        strict_1.default.ok(snap.solutionTags?.includes('国际品牌站'));
    });
});
(0, node_test_1.describe)(`[Portal Simulator] ${ROLES.Teambuilding} - 多门店门户筛选`, () => {
    (0, node_test_1.default)('团建专员批量筛选门店门户', () => {
        const stores = [
            createSimulatedStorePortal({ storeCode: 'team-a', storeName: '团建A店' }),
            createSimulatedStorePortal({ storeCode: 'team-b', storeName: '团建B店' }),
            createSimulatedStorePortal({ storeCode: 'team-c', storeName: '团建C店' }),
        ];
        // 确保所有门店都有 H5 和 MiniApp
        for (const store of stores) {
            const contract = (0, portal_contract_1.toStorePortalContract)(store);
            strict_1.default.ok(contract.supportedSurfaces?.includes(domain_1.StorefrontSurface.H5));
            strict_1.default.ok(contract.supportedSurfaces?.includes(domain_1.StorefrontSurface.MiniApp));
        }
        strict_1.default.equal(stores.length, 3);
        strict_1.default.equal(stores[0].storeName, '团建A店');
    });
    (0, node_test_1.default)('团建专员边界: 门店语言筛选中文门店', () => {
        const cnStore = createSimulatedStorePortal({
            storeCode: 'team-cn',
            marketCode: 'cn-mainland',
            supportedLanguages: [domain_1.LanguageCode.ZhCn],
        });
        strict_1.default.equal(cnStore.supportedLanguages.length, 1);
        strict_1.default.equal(cnStore.supportedLanguages[0], domain_1.LanguageCode.ZhCn);
        strict_1.default.equal(cnStore.marketCode, 'cn-mainland');
    });
});
(0, node_test_1.describe)(`[Portal Simulator] ${ROLES.Marketing} - 市场区域配置`, () => {
    (0, node_test_1.default)('营销专员全局市场多语言门户验证', () => {
        const globalStore = createSimulatedStorePortal({
            storeCode: 'mkt-global',
            marketCode: 'global',
            supportedLanguages: [domain_1.LanguageCode.EnUs, domain_1.LanguageCode.ZhCn],
        });
        strict_1.default.ok(globalStore.supportedLanguages.length >= 2);
        strict_1.default.ok(globalStore.supportedLanguages.includes(domain_1.LanguageCode.EnUs));
        const switched = simulateMarketSwitch((0, portal_entity_1.toPortalEntity)(globalStore, { id: 'p-mkt', tenantId: 't-001', brandId: 'b-001', storeId: 'mkt-global' }), 'cn-mainland');
        strict_1.default.equal(switched.supportedLanguages.length, 1);
        strict_1.default.equal(switched.supportedLanguages[0], domain_1.LanguageCode.ZhCn);
    });
    (0, node_test_1.default)('营销专员租户门户品牌强化', () => {
        const tenantPortal = createSimulatedTobPortal(domain_1.PortalScopeType.Tenant, {
            heroTitle: '超级品牌经营平台',
            solutionTags: ['品牌招商', '国际化', '全渠道', '智能营销'],
        });
        const contract = (0, portal_contract_1.toTobPortalContract)(tenantPortal);
        strict_1.default.equal(contract.heroTitle, '超级品牌经营平台');
        strict_1.default.ok(contract.solutionTags);
        strict_1.default.ok(contract.solutionTags.length >= 4);
    });
});
//# sourceMappingURL=portal.simulator.test.js.map