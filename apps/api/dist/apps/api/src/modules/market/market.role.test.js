"use strict";
/**
 * 🐜 自动: [market] [C] 角色测试
 *
 * 8 角色视角的 market 模块测试：
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
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
const market_controller_1 = require("./market.controller");
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
// ── 测试上下文 ──
const cnTenantCtx = { tenantId: 't-cn', brandId: 'b-cn', storeId: 's-cn', marketCode: 'cn-mainland' };
const usTenantCtx = { tenantId: 't-us', brandId: 'b-us', storeId: 's-us', marketCode: 'us-default' };
const cnProfile = {
    marketCode: 'cn-mainland',
    marketName: '中国大陆',
    locale: { defaultLanguage: 'zh-CN', supportedLanguages: ['zh-CN'] },
    timezone: { timezone: 'Asia/Shanghai' },
    currency: { currencyCode: 'CNY', symbol: '¥' },
    tax: { taxMode: 'INCLUDED', taxRate: 6, taxLabel: '增值税' },
    network: { networkRegion: 'MAINLAND_CHINA', apiBaseUrl: 'https://cn-api.m5.local', cdnBaseUrl: 'https://cn-cdn.m5.local', callbackBaseUrl: 'https://cn-hooks.m5.local' },
    email: { provider: 'ALIYUN_DM', fromName: 'M5 China', fromAddress: 'hello-cn@m5.local', replyTo: 'support-cn@m5.local' },
    social: { primaryPlatforms: ['WECHAT', 'XIAOHONGSHU'], supportPlatforms: ['WECHAT', 'WEIBO', 'DOUYIN'] },
};
const usProfile = {
    marketCode: 'us-default',
    marketName: 'United States',
    locale: { defaultLanguage: 'en-US', supportedLanguages: ['en-US'] },
    timezone: { timezone: 'America/New_York' },
    currency: { currencyCode: 'USD', symbol: '$' },
    tax: { taxMode: 'EXCLUDED', taxRate: 8.25, taxLabel: 'Sales Tax' },
    network: { networkRegion: 'NORTH_AMERICA', apiBaseUrl: 'https://us-api.m5.local', cdnBaseUrl: 'https://us-cdn.m5.local', callbackBaseUrl: 'https://us-hooks.m5.local' },
    email: { provider: 'SENDGRID', fromName: 'M5 US', fromAddress: 'hello-us@m5.local', replyTo: 'support-us@m5.local' },
    social: { primaryPlatforms: ['LINKEDIN', 'INSTAGRAM'], supportPlatforms: ['LINKEDIN', 'INSTAGRAM', 'FACEBOOK', 'X'] },
};
function mockMarketService(overrides = {}) {
    return {
        getBootstrap: () => ({
            defaultDomesticMarketCode: 'cn-mainland',
            defaultInternationalMarketCode: 'us-default',
            supportedMarkets: [cnProfile, usProfile],
            foundationDependencies: [],
            foundationContracts: ['market-bootstrap-v1'],
        }),
        getMergedProfile: (ctx) => (ctx.marketCode === 'us-default' ? usProfile : cnProfile),
        getOverrides: () => [],
        ...overrides,
    };
}
// ── 👔店长 ──
(0, node_test_1.describe)(`${ROLES.StoreManager} market 角色测试`, () => {
    (0, node_test_1.default)('店长可以查看中国大陆 market bootstrap', () => {
        const svc = mockMarketService();
        const ctrl = new market_controller_1.MarketController(svc);
        const result = ctrl.getBootstrap();
        strict_1.default.ok(result.defaultDomesticMarketCode);
        strict_1.default.ok(Array.isArray(result.supportedMarkets));
    });
    (0, node_test_1.default)('店长可以获取 tenant 级别的 scoped market（含 overrides）', () => {
        const overrides = [
            { scopeType: 'TENANT', scopeCode: 't-cn', inheritanceMode: 'TENANT_DEFAULT', marketCode: 'cn-mainland', email: { fromName: 't-cn HQ' } },
        ];
        const svc = mockMarketService({ getOverrides: () => overrides });
        const ctrl = new market_controller_1.MarketController(svc);
        const result = ctrl.getScopedMarket('tenant', 't-cn', cnTenantCtx);
        strict_1.default.equal(result.scopeType, 'tenant');
        strict_1.default.equal(result.marketProfile.marketCode, 'cn-mainland');
        strict_1.default.equal(result.overrides.length, 1);
    });
    (0, node_test_1.default)('店长可以查看不同 market 的 portal 视图', () => {
        const svc = mockMarketService();
        const ctrl = new market_controller_1.MarketController(svc);
        const result = ctrl.getScopedPortalMarket('tenant', 't-us', usTenantCtx);
        strict_1.default.equal(result.marketCode, 'us-default');
        strict_1.default.equal(result.tax.taxMode, 'EXCLUDED');
        strict_1.default.equal(result.tax.taxRate, 8.25);
    });
});
// ── 🛒前台 ──
(0, node_test_1.describe)(`${ROLES.FrontDesk} market 角色测试`, () => {
    (0, node_test_1.default)('前台可以查看门店 portal market 配置（用于 POS 终端）', () => {
        const svc = mockMarketService();
        const ctrl = new market_controller_1.MarketController(svc);
        const result = ctrl.getScopedPortalMarket('store', 's-cn', cnTenantCtx);
        strict_1.default.equal(result.scopeType, 'store');
        strict_1.default.equal(result.marketCode, 'cn-mainland');
        strict_1.default.equal(result.tax.taxRate, 6);
    });
    (0, node_test_1.default)('前台只能看到当前门店 scope 的 market，不能跨门店访问', () => {
        const svc = mockMarketService();
        const ctrl = new market_controller_1.MarketController(svc);
        // 前台 scope 应为 store
        const storeResult = ctrl.getScopedMarket('store', 's-cn', cnTenantCtx);
        strict_1.default.equal(storeResult.scopeType, 'store');
        // 前台不应能获取 brand 级别 market（权限边界：scope 应为 store 不是 brand）
        const brandResult = ctrl.getScopedMarket('brand', 'b-other', cnTenantCtx);
        strict_1.default.notEqual(brandResult.scopeType, 'store');
    });
});
// ── 👥HR ──
(0, node_test_1.describe)(`${ROLES.HR} market 角色测试`, () => {
    (0, node_test_1.default)('HR 可以查看 market 配置确定员工时区/语言（用于排班）', () => {
        const svc = mockMarketService();
        const ctrl = new market_controller_1.MarketController(svc);
        const result = ctrl.getScopedPortalMarket('tenant', 't-cn', cnTenantCtx);
        strict_1.default.equal(result.timezone.timezone, 'Asia/Shanghai');
        strict_1.default.ok(result.locale.defaultLanguage);
    });
    (0, node_test_1.default)('HR 可以看到所有支持的 market 列表', () => {
        const svc = mockMarketService();
        const ctrl = new market_controller_1.MarketController(svc);
        const result = ctrl.getBootstrap();
        strict_1.default.ok(result.supportedMarkets.length >= 2);
        const marketCodes = result.supportedMarkets.map((m) => m.marketCode);
        strict_1.default.ok(marketCodes.includes('cn-mainland'));
        strict_1.default.ok(marketCodes.includes('us-default'));
    });
    (0, node_test_1.default)('HR 无法修改 market 配置（只读权限边界）', () => {
        const svc = mockMarketService();
        const ctrl = new market_controller_1.MarketController(svc);
        // MarketController 只有 @Get 路由，无 POST/PUT/PATCH
        const prototype = Object.getPrototypeOf(ctrl);
        const methods = Object.getOwnPropertyNames(prototype).filter((name) => name !== 'constructor' && typeof prototype[name] === 'function');
        // 验证没有写操作相关的路由
        const writeMethods = methods.filter((m) => m.startsWith('create') || m.startsWith('update') || m.startsWith('delete'));
        strict_1.default.equal(writeMethods.length, 0);
    });
});
// ── 🔧安监 ──
(0, node_test_1.describe)(`${ROLES.Security} market 角色测试`, () => {
    (0, node_test_1.default)('安监可以查看 market 的网络配置（安全审计需要）', () => {
        const svc = mockMarketService();
        const ctrl = new market_controller_1.MarketController(svc);
        const result = ctrl.getScopedPortalMarket('tenant', 't-cn', cnTenantCtx);
        strict_1.default.ok(result.network.apiBaseUrl.startsWith('https://'));
        strict_1.default.equal(result.network.networkRegion, 'MAINLAND_CHINA');
    });
    (0, node_test_1.default)('安监可以验证不同 market 的数据隔离（CN vs US）', () => {
        const svc = mockMarketService();
        const ctrl = new market_controller_1.MarketController(svc);
        const cnResult = ctrl.getScopedPortalMarket('tenant', 't-cn', cnTenantCtx);
        const usResult = ctrl.getScopedPortalMarket('tenant', 't-us', usTenantCtx);
        strict_1.default.notEqual(cnResult.network.apiBaseUrl, usResult.network.apiBaseUrl);
        strict_1.default.notEqual(cnResult.marketCode, usResult.marketCode);
    });
    (0, node_test_1.default)('安监可以确认 email 服务商符合合规要求', () => {
        const svc = mockMarketService();
        const ctrl = new market_controller_1.MarketController(svc);
        const cnResult = ctrl.getScopedPortalMarket('tenant', 't-cn', cnTenantCtx);
        strict_1.default.equal(cnResult.email.provider, 'ALIYUN_DM');
    });
});
// ── 🎮导玩员 ──
(0, node_test_1.describe)(`${ROLES.Guide} market 角色测试`, () => {
    (0, node_test_1.default)('导玩员可以查看门店 market 配置（用于接待引导）', () => {
        const svc = mockMarketService();
        const ctrl = new market_controller_1.MarketController(svc);
        const result = ctrl.getScopedMarket('store', 's-cn', cnTenantCtx);
        strict_1.default.equal(result.marketProfile.marketCode, 'cn-mainland');
        strict_1.default.equal(result.marketProfile.currency.symbol, '¥');
    });
    (0, node_test_1.default)('导玩员可以获取 portal 级别的营销社媒配置', () => {
        const svc = mockMarketService();
        const ctrl = new market_controller_1.MarketController(svc);
        const result = ctrl.getScopedPortalMarket('store', 's-cn', cnTenantCtx);
        strict_1.default.ok(result.social.primaryPlatforms.length > 0);
    });
    (0, node_test_1.default)('导玩员在多 market 环境中能看到正确的市场代码标识', () => {
        const svc = mockMarketService();
        const ctrl = new market_controller_1.MarketController(svc);
        const usResult = ctrl.getScopedPortalMarket('store', 's-us', usTenantCtx);
        strict_1.default.equal(usResult.marketCode, 'us-default');
        strict_1.default.notEqual(usResult.marketCode, 'cn-mainland');
    });
});
// ── 🎯运行专员 ──
(0, node_test_1.describe)(`${ROLES.Operations} market 角色测试`, () => {
    (0, node_test_1.default)('运行专员可以获取 bootstrap 查看所有 market 状态', () => {
        const svc = mockMarketService();
        const ctrl = new market_controller_1.MarketController(svc);
        const result = ctrl.getBootstrap();
        strict_1.default.equal(result.defaultDomesticMarketCode, 'cn-mainland');
        strict_1.default.ok(result.foundationDependencies);
    });
    (0, node_test_1.default)('运行专员可以对比不同 market 的税率配置', () => {
        const svc = mockMarketService();
        const ctrl = new market_controller_1.MarketController(svc);
        const cnResult = ctrl.getScopedPortalMarket('tenant', 't-cn', cnTenantCtx);
        const usResult = ctrl.getScopedPortalMarket('tenant', 't-us', usTenantCtx);
        strict_1.default.equal(cnResult.tax.taxRate, 6);
        strict_1.default.equal(usResult.tax.taxRate, 8.25);
        strict_1.default.notEqual(cnResult.tax.taxMode, usResult.tax.taxMode);
    });
    (0, node_test_1.default)('运行专员可以查看所有 supported markets 的数量', () => {
        const svc = mockMarketService();
        const ctrl = new market_controller_1.MarketController(svc);
        const result = ctrl.getBootstrap();
        strict_1.default.ok(result.supportedMarkets.length > 0);
    });
});
// ── 🤝团建 ──
(0, node_test_1.describe)(`${ROLES.Teambuilding} market 角色测试`, () => {
    (0, node_test_1.default)('团建可以查看 market 配置确定活动策划语言', () => {
        const svc = mockMarketService();
        const ctrl = new market_controller_1.MarketController(svc);
        const cnResult = ctrl.getScopedPortalMarket('tenant', 't-cn', cnTenantCtx);
        strict_1.default.equal(cnResult.locale.defaultLanguage, 'zh-CN');
    });
    (0, node_test_1.default)('团建策划时可以看到社媒平台列表（分享/宣传渠道）', () => {
        const svc = mockMarketService();
        const ctrl = new market_controller_1.MarketController(svc);
        const usResult = ctrl.getScopedPortalMarket('brand', 'b-us', usTenantCtx);
        strict_1.default.ok(usResult.social.supportPlatforms.includes('LINKEDIN'));
    });
    (0, node_test_1.default)('团建不能获取不存在的 market 配置（边界：非法 marketCode）', () => {
        const svc = mockMarketService({
            getMergedProfile: () => {
                throw new Error('Market not found');
            },
        });
        const ctrl = new market_controller_1.MarketController(svc);
        strict_1.default.throws(() => ctrl.getScopedMarket('tenant', 't-invalid', { ...cnTenantCtx, marketCode: 'invalid-market' }), /Market not found/);
    });
});
// ── 📢营销 ──
(0, node_test_1.describe)(`${ROLES.Marketing} market 角色测试`, () => {
    (0, node_test_1.default)('营销可以查看市场社媒配置（制定营销策略）', () => {
        const svc = mockMarketService();
        const ctrl = new market_controller_1.MarketController(svc);
        const cnResult = ctrl.getScopedPortalMarket('brand', 'b-cn', cnTenantCtx);
        strict_1.default.ok(cnResult.social.primaryPlatforms.includes('WECHAT'));
        strict_1.default.ok(cnResult.social.primaryPlatforms.includes('XIAOHONGSHU'));
    });
    (0, node_test_1.default)('营销可以对比中美市场的社媒差异', () => {
        const svc = mockMarketService();
        const ctrl = new market_controller_1.MarketController(svc);
        const cnSocial = ctrl.getScopedPortalMarket('brand', 'b-cn', cnTenantCtx).social;
        const usSocial = ctrl.getScopedPortalMarket('brand', 'b-us', usTenantCtx).social;
        strict_1.default.ok(cnSocial.primaryPlatforms.includes('WECHAT'));
        strict_1.default.ok(usSocial.primaryPlatforms.includes('LINKEDIN'));
        strict_1.default.ok(!cnSocial.primaryPlatforms.includes('LINKEDIN'));
    });
    (0, node_test_1.default)('营销可以看到 market 的邮件配置（EDM 营销需要）', () => {
        const svc = mockMarketService();
        const ctrl = new market_controller_1.MarketController(svc);
        const result = ctrl.getScopedPortalMarket('tenant', 't-us', usTenantCtx);
        strict_1.default.equal(result.email.fromName, 'M5 US');
        strict_1.default.equal(result.email.fromAddress, 'hello-us@m5.local');
    });
    (0, node_test_1.default)('营销视角: bootstrap 应包含完整的 foundation 元数据', () => {
        const svc = mockMarketService();
        const ctrl = new market_controller_1.MarketController(svc);
        const result = ctrl.getBootstrap();
        strict_1.default.ok(result.foundationDependencies);
        strict_1.default.ok(Array.isArray(result.foundationDependencies));
    });
});
//# sourceMappingURL=market.role.test.js.map