"use strict";
/**
 * 🐜 自动: [market] [C] 角色测试 — credit/cred 视角（积分与信用）
 *
 * 从前端角色视角验证 market 模块的 bootstrap / scoped market / portal market
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
// ── 直接用 require 绕过编译时模块解析 ──
const { MarketController } = require('./market.controller');
const ROLES = {
    StoreManager: '👔店长',
    Reception: '🛒前台',
    HR: '👥HR',
    Security: '🔧安监',
    Guide: '🎮导玩员',
    Operations: '🎯运行专员',
    TeamBuilding: '🤝团建',
    Marketing: '📢营销',
    CreditAdmin: '💎积分管理员',
    CreditConsumer: '💰信用消费者',
};
const cnTenantCtx = { tenantId: 't-cn', brandId: 'b-cn', storeId: 's-cn', marketCode: 'cn-mainland' };
const usTenantCtx = { tenantId: 't-us', brandId: 'b-us', storeId: 's-us', marketCode: 'us-default' };
const cnMarketProfile = {
    marketCode: 'cn-mainland',
    marketName: '中国大陆',
    countryCode: 'CN',
    locale: { defaultLanguage: 'zh-CN', supportedLanguages: ['zh-CN'] },
    timezone: { timezone: 'Asia/Shanghai' },
    currency: { currencyCode: 'CNY', symbol: '¥' },
    tax: { taxMode: 'INCLUDED', taxRate: 6, taxLabel: '增值税' },
    network: { networkRegion: 'MAINLAND_CHINA', apiBaseUrl: 'https://cn-api.m5.local', cdnBaseUrl: 'https://cn-cdn.m5.local', callbackBaseUrl: 'https://cn-hooks.m5.local' },
    email: { provider: 'ALIYUN_DM', fromName: 'M5 China', fromAddress: 'hello-cn@m5.local', replyTo: 'support-cn@m5.local' },
    social: { primaryPlatforms: ['WECHAT', 'XIAOHONGSHU'], supportPlatforms: ['WECHAT', 'WEIBO', 'DOUYIN'] },
};
const usMarketProfile = {
    marketCode: 'us-default',
    marketName: 'United States',
    countryCode: 'US',
    locale: { defaultLanguage: 'en-US', supportedLanguages: ['en-US'] },
    timezone: { timezone: 'America/New_York' },
    currency: { currencyCode: 'USD', symbol: '$' },
    tax: { taxMode: 'EXCLUDED', taxRate: 8.25, taxLabel: 'Sales Tax' },
    network: { networkRegion: 'NORTH_AMERICA', apiBaseUrl: 'https://us-api.m5.local', cdnBaseUrl: 'https://us-cdn.m5.local', callbackBaseUrl: 'https://us-hooks.m5.local' },
    email: { provider: 'SENDGRID', fromName: 'M5 US', fromAddress: 'hello-us@m5.local', replyTo: 'support-us@m5.local' },
    social: { primaryPlatforms: ['LINKEDIN', 'INSTAGRAM'], supportPlatforms: ['LINKEDIN', 'INSTAGRAM', 'FACEBOOK', 'X'] },
};
function makeMockService(profiles = { 'cn-mainland': cnMarketProfile, 'us-default': usMarketProfile }, getOverridesImpl) {
    return {
        getBootstrap: () => ({
            defaultDomesticMarketCode: 'cn-mainland',
            defaultInternationalMarketCode: 'us-default',
            supportedMarkets: Object.values(profiles),
            foundation: { generatedAt: '2026-06-14T02:00:00Z', module: 'market', dependencies: [], contracts: [] },
        }),
        getMergedProfile: (ctx) => {
            const profile = profiles[ctx.marketCode];
            if (!profile)
                throw new Error(`Market not found for code: ${ctx.marketCode}`);
            return profile;
        },
        getOverrides: getOverridesImpl ?? (() => []),
    };
}
// ── 👔店长 ──
(0, node_test_1.describe)(`${ROLES.StoreManager} market 角色测试`, () => {
    (0, node_test_1.default)('店长可以查看 CN market bootstrap 与默认市场', () => {
        const svc = makeMockService();
        const ctrl = new MarketController(svc);
        const result = ctrl.getBootstrap();
        strict_1.default.equal(result.defaultDomesticMarketCode, 'cn-mainland');
        strict_1.default.equal(result.defaultInternationalMarketCode, 'us-default');
        strict_1.default.ok(result.supportedMarkets.length >= 2);
    });
    (0, node_test_1.default)('店长在 CN market scope 下获取 tenant portal 的完整税费信息', () => {
        const svc = makeMockService();
        const ctrl = new MarketController(svc);
        const result = ctrl.getScopedPortalMarket('tenant', 't-cn', cnTenantCtx);
        strict_1.default.equal(result.tax.taxMode, 'INCLUDED');
        strict_1.default.equal(result.tax.taxLabel, '增值税');
        strict_1.default.ok(result.network.apiBaseUrl.includes('cn-api'));
    });
});
// ── 🛒前台 ──
(0, node_test_1.describe)(`${ROLES.Reception} market 角色测试`, () => {
    (0, node_test_1.default)('前台可以查看 US store portal 的邮件配置', () => {
        const svc = makeMockService();
        const ctrl = new MarketController(svc);
        const result = ctrl.getScopedPortalMarket('store', 's-us', usTenantCtx);
        strict_1.default.equal(result.email.provider, 'SENDGRID');
        strict_1.default.ok(result.email.fromAddress.includes('us'));
    });
    (0, node_test_1.default)('前台获取 scoped market 时得到完整的 overrides 数组', () => {
        const overrides = [{ key: 'taxRate', value: 5 }];
        const svc = makeMockService(undefined, () => overrides);
        const ctrl = new MarketController(svc);
        const result = ctrl.getScopedMarket('store', 's-cn', cnTenantCtx);
        strict_1.default.equal(result.overrides.length, 1);
        strict_1.default.equal(result.overrides[0].key, 'taxRate');
    });
});
// ── 👥HR ──
(0, node_test_1.describe)(`${ROLES.HR} market 角色测试`, () => {
    (0, node_test_1.default)('HR 查看 CN market 的社交平台配置', () => {
        const svc = makeMockService();
        const ctrl = new MarketController(svc);
        const result = ctrl.getScopedPortalMarket('tenant', 't-cn', cnTenantCtx);
        strict_1.default.ok(result.social.primaryPlatforms.includes('WECHAT'));
        strict_1.default.ok(result.social.supportPlatforms.includes('WEIBO'));
    });
    (0, node_test_1.default)('HR 在 US market 看到不同的社交平台配置', () => {
        const svc = makeMockService();
        const ctrl = new MarketController(svc);
        const usResult = ctrl.getScopedPortalMarket('tenant', 't-us', usTenantCtx);
        strict_1.default.ok(usResult.social.primaryPlatforms.includes('LINKEDIN'));
        strict_1.default.ok(usResult.social.supportPlatforms.includes('FACEBOOK'));
    });
});
// ── 🔧安监 ──
(0, node_test_1.describe)(`${ROLES.Security} market 角色测试`, () => {
    (0, node_test_1.default)('安监验证 CN market 网络区域配置正确', () => {
        const svc = makeMockService();
        const ctrl = new MarketController(svc);
        const result = ctrl.getScopedPortalMarket('tenant', 't-cn', cnTenantCtx);
        strict_1.default.equal(result.network.networkRegion, 'MAINLAND_CHINA');
        strict_1.default.ok(result.network.callbackBaseUrl.startsWith('https://'));
    });
    (0, node_test_1.default)('安监在不存在 market code 时抛出异常', () => {
        const svc = makeMockService();
        const ctrl = new MarketController(svc);
        strict_1.default.throws(() => ctrl.getScopedMarket('tenant', 't-unknown', { ...cnTenantCtx, marketCode: 'jp-default' }), /Market not found/);
    });
});
// ── 🎮导玩员 ──
(0, node_test_1.describe)(`${ROLES.Guide} market 角色测试`, () => {
    (0, node_test_1.default)('导玩员查看 CN market locale 配置', () => {
        const svc = makeMockService();
        const ctrl = new MarketController(svc);
        const result = ctrl.getScopedPortalMarket('brand', 'b-cn', cnTenantCtx);
        strict_1.default.equal(result.locale.defaultLanguage, 'zh-CN');
        strict_1.default.ok(result.locale.supportedLanguages.includes('zh-CN'));
    });
    (0, node_test_1.default)('导玩员在 US market 看到 en-US locale', () => {
        const svc = makeMockService();
        const ctrl = new MarketController(svc);
        const result = ctrl.getScopedPortalMarket('brand', 'b-us', usTenantCtx);
        strict_1.default.equal(result.locale.defaultLanguage, 'en-US');
    });
});
// ── 🎯运行专员 ──
(0, node_test_1.describe)(`${ROLES.Operations} market 角色测试`, () => {
    (0, node_test_1.default)('运行专员查看 bootstrap supportedMarkets 包含所有市场', () => {
        const svc = makeMockService();
        const ctrl = new MarketController(svc);
        const result = ctrl.getBootstrap();
        strict_1.default.ok(result.supportedMarkets.length >= 2);
        const codes = result.supportedMarkets.map((m) => m.marketCode).sort();
        strict_1.default.ok(codes.includes('cn-mainland'));
        strict_1.default.ok(codes.includes('us-default'));
    });
    (0, node_test_1.default)('运行专员查看 CN market 的时区配置', () => {
        const svc = makeMockService();
        const ctrl = new MarketController(svc);
        const result = ctrl.getScopedPortalMarket('tenant', 't-cn', cnTenantCtx);
        strict_1.default.equal(result.timezone.timezone, 'Asia/Shanghai');
    });
});
// ── 🤝团建 ──
(0, node_test_1.describe)(`${ROLES.TeamBuilding} market 角色测试`, () => {
    (0, node_test_1.default)('团建查看 US market 的时区与其他市场不同', () => {
        const svc = makeMockService();
        const ctrl = new MarketController(svc);
        const usResult = ctrl.getScopedPortalMarket('tenant', 't-us', usTenantCtx);
        strict_1.default.equal(usResult.timezone.timezone, 'America/New_York');
    });
    (0, node_test_1.default)('团建在 CN market 获取 scoped market 包含 marketProfile 和 overrides', () => {
        const svc = makeMockService();
        const ctrl = new MarketController(svc);
        const result = ctrl.getScopedMarket('tenant', 't-cn', cnTenantCtx);
        strict_1.default.equal(result.scopeType, 'tenant');
        strict_1.default.ok(result.marketProfile);
        strict_1.default.ok(Array.isArray(result.overrides));
    });
});
// ── 📢营销 ──
(0, node_test_1.describe)(`${ROLES.Marketing} market 角色测试`, () => {
    (0, node_test_1.default)('营销查看 CN market 邮件配置', () => {
        const svc = makeMockService();
        const ctrl = new MarketController(svc);
        const cnResult = ctrl.getScopedPortalMarket('tenant', 't-cn', cnTenantCtx);
        strict_1.default.equal(cnResult.email.provider, 'ALIYUN_DM');
        strict_1.default.ok(cnResult.email.fromAddress.includes('cn'));
    });
    (0, node_test_1.default)('营销在 CN 和 US market 间切换时税模式不同', () => {
        const svc = makeMockService();
        const ctrl = new MarketController(svc);
        const cnResult = ctrl.getScopedPortalMarket('tenant', 't-cn', cnTenantCtx);
        const usResult = ctrl.getScopedPortalMarket('tenant', 't-us', usTenantCtx);
        strict_1.default.equal(cnResult.tax.taxMode, 'INCLUDED');
        strict_1.default.equal(usResult.tax.taxMode, 'EXCLUDED');
        strict_1.default.notEqual(cnResult.tax.taxRate, usResult.tax.taxRate);
    });
});
// ── 💎积分管理员 ──
(0, node_test_1.describe)(`${ROLES.CreditAdmin} market 角色测试`, () => {
    (0, node_test_1.default)('积分管理员可以查看 CN market 税率配置', () => {
        const svc = makeMockService();
        const ctrl = new MarketController(svc);
        const result = ctrl.getScopedPortalMarket('tenant', 't-cn', cnTenantCtx);
        strict_1.default.equal(result.marketCode, 'cn-mainland');
        strict_1.default.equal(result.tax.taxRate, 6);
    });
    (0, node_test_1.default)('积分管理员可以查看 US market 税率配置', () => {
        const svc = makeMockService();
        const ctrl = new MarketController(svc);
        const result = ctrl.getScopedPortalMarket('tenant', 't-us', usTenantCtx);
        strict_1.default.equal(result.tax.taxRate, 8.25);
    });
    (0, node_test_1.default)('积分管理员检查 bootstrap 中是否存在 foundation 元数据', () => {
        const svc = makeMockService();
        const ctrl = new MarketController(svc);
        const result = ctrl.getBootstrap();
        strict_1.default.ok(result.foundation);
        strict_1.default.equal(result.defaultDomesticMarketCode, 'cn-mainland');
    });
});
// ── 💰信用消费者 ──
(0, node_test_1.describe)(`${ROLES.CreditConsumer} market 角色测试`, () => {
    (0, node_test_1.default)('信用消费者可以看到门店 portal 的税率配置', () => {
        const svc = makeMockService();
        const ctrl = new MarketController(svc);
        const cnResult = ctrl.getScopedPortalMarket('store', 's-cn', cnTenantCtx);
        strict_1.default.equal(cnResult.tax.taxRate, 6);
    });
    (0, node_test_1.default)('信用消费者在 US market 看到的税率不同于 CN', () => {
        const svc = makeMockService();
        const ctrl = new MarketController(svc);
        const usResult = ctrl.getScopedPortalMarket('store', 's-us', usTenantCtx);
        strict_1.default.notEqual(usResult.tax.taxRate, 6);
    });
    (0, node_test_1.default)('信用消费者在获取不存在的 market 时收到异常', () => {
        const svc = makeMockService({ 'cn-mainland': cnMarketProfile });
        const ctrl = new MarketController(svc);
        strict_1.default.throws(() => ctrl.getScopedMarket('tenant', 't-unknown', { ...cnTenantCtx, marketCode: 'jp-default' }), /Market not found/);
    });
});
//# sourceMappingURL=market.credit-role.test.js.map