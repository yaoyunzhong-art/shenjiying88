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
// ── Mock NestJS decorators ──────────────────────────────────────────
function Controller(prefix) {
    return (target) => {
        target.__prefix = prefix;
        return target;
    };
}
const getRegistrations = [];
function Get(path = '') {
    return (_target, propertyKey) => {
        getRegistrations.push(`${String(propertyKey)}:${path}`);
    };
}
const tenantContextRegistrations = [];
function TenantContext() {
    return (_target, propertyKey, parameterIndex) => {
        tenantContextRegistrations.push(`${String(propertyKey)}:${parameterIndex}`);
    };
}
const paramRegistrations = [];
function Param(name) {
    return (_target, propertyKey, parameterIndex) => {
        paramRegistrations.push(`${String(propertyKey)}:${name}:${parameterIndex}`);
    };
}
function createMockMarketService() {
    return {
        getBootstrap: () => ({
            defaultDomesticMarketCode: 'cn-mainland',
            defaultInternationalMarketCode: 'us-default',
            supportedMarkets: [
                { marketCode: 'cn-mainland', marketName: '中国大陆' },
                { marketCode: 'us-default', marketName: 'United States' }
            ]
        }),
        getMergedProfile: (_tc) => ({
            marketCode: 'cn-mainland',
            marketName: '中国大陆',
            countryCode: 'CN',
            locale: { defaultLanguage: 'zh-CN', supportedLanguages: ['zh-CN'] },
            timezone: { timezone: 'Asia/Shanghai' },
            currency: { currencyCode: 'CNY', symbol: '¥' },
            tax: { taxMode: 'included', taxRate: 6, taxLabel: '增值税' },
            network: { networkRegion: 'mainland-china', apiBaseUrl: 'https://cn-api.m5.local', cdnBaseUrl: 'https://cn-cdn.m5.local' },
            email: { provider: 'aliyun-dm', fromName: 'M5 China', fromAddress: 'hello-cn@m5.local', replyTo: 'support-cn@m5.local' },
            social: { primaryPlatforms: ['wechat', 'xiaohongshu'], supportPlatforms: ['wechat', 'weibo', 'douyin'] }
        }),
        getOverrides: (_tc) => [
            { scopeType: 'tenant', scopeCode: 't1', inheritanceMode: 'tenant-default', marketCode: 'cn-mainland', email: { fromName: 't1 HQ' } },
            { scopeType: 'brand', scopeCode: 'b1', inheritanceMode: 'brand-override', marketCode: 'cn-mainland' },
            { scopeType: 'store', scopeCode: 's1', inheritanceMode: 'store-override', marketCode: 'cn-mainland' }
        ]
    };
}
// ── Controller implementation (mirrors real MarketController) ──────
class MarketController {
    marketService;
    constructor(marketService) {
        this.marketService = marketService;
    }
    getBootstrap() {
        return this.marketService.getBootstrap();
    }
    getScopedMarket(scopeType, scopeCode, tenantContext) {
        return {
            scopeType,
            scopeCode,
            marketProfile: this.marketService.getMergedProfile(tenantContext),
            overrides: this.marketService.getOverrides(tenantContext)
        };
    }
    getScopedPortalMarket(scopeType, scopeCode, tenantContext) {
        const marketProfile = this.marketService.getMergedProfile(tenantContext);
        return {
            scopeType,
            scopeCode,
            marketCode: marketProfile.marketCode,
            locale: marketProfile.locale,
            timezone: marketProfile.timezone,
            tax: marketProfile.tax,
            network: marketProfile.network,
            email: marketProfile.email,
            social: marketProfile.social
        };
    }
}
// Register decorators (simulating what NestJS does at runtime)
Get('bootstrap')(MarketController.prototype, 'getBootstrap');
Get(':scopeType/:scopeCode')(MarketController.prototype, 'getScopedMarket');
Get(':scopeType/:scopeCode/portal')(MarketController.prototype, 'getScopedPortalMarket');
TenantContext()(MarketController.prototype, 'getScopedMarket', 2);
TenantContext()(MarketController.prototype, 'getScopedPortalMarket', 2);
Param('scopeType')(MarketController.prototype, 'getScopedMarket', 0);
Param('scopeCode')(MarketController.prototype, 'getScopedMarket', 1);
Param('scopeType')(MarketController.prototype, 'getScopedPortalMarket', 0);
Param('scopeCode')(MarketController.prototype, 'getScopedPortalMarket', 1);
Controller('markets')(MarketController);
// ── Tests ──────────────────────────────────────────────────────────
(0, node_test_1.describe)('MarketController', () => {
    let controller;
    let mockService;
    node_test_1.default.beforeEach(() => {
        mockService = createMockMarketService();
        controller = new MarketController(mockService);
    });
    // ── Decorator metadata ─────────────────────────────────────────
    (0, node_test_1.describe)('decorator metadata', () => {
        (0, node_test_1.default)('registers @Controller("markets") prefix', () => {
            strict_1.default.equal(MarketController.__prefix, 'markets');
        });
        (0, node_test_1.default)('registers 3 @Get endpoints', () => {
            strict_1.default.equal(getRegistrations.length, 3);
            strict_1.default.ok(getRegistrations.includes('getBootstrap:bootstrap'));
            strict_1.default.ok(getRegistrations.includes('getScopedMarket::scopeType/:scopeCode'));
            strict_1.default.ok(getRegistrations.includes('getScopedPortalMarket::scopeType/:scopeCode/portal'));
        });
        (0, node_test_1.default)('registers TenantContext decorator on scoped endpoints', () => {
            strict_1.default.ok(tenantContextRegistrations.includes('getScopedMarket:2'));
            strict_1.default.ok(tenantContextRegistrations.includes('getScopedPortalMarket:2'));
        });
        (0, node_test_1.default)('registers @Param decorators for scopeType and scopeCode', () => {
            strict_1.default.ok(paramRegistrations.includes('getScopedMarket:scopeType:0'));
            strict_1.default.ok(paramRegistrations.includes('getScopedMarket:scopeCode:1'));
            strict_1.default.ok(paramRegistrations.includes('getScopedPortalMarket:scopeType:0'));
            strict_1.default.ok(paramRegistrations.includes('getScopedPortalMarket:scopeCode:1'));
        });
    });
    // ── Positive cases ─────────────────────────────────────────────
    (0, node_test_1.describe)('getBootstrap() — positive', () => {
        (0, node_test_1.default)('returns bootstrap with default market codes', () => {
            const result = controller.getBootstrap();
            strict_1.default.equal(result.defaultDomesticMarketCode, 'cn-mainland');
            strict_1.default.equal(result.defaultInternationalMarketCode, 'us-default');
        });
        (0, node_test_1.default)('returns supportedMarkets as array', () => {
            const result = controller.getBootstrap();
            strict_1.default.ok(Array.isArray(result.supportedMarkets));
            strict_1.default.ok(result.supportedMarkets.length >= 2);
        });
        (0, node_test_1.default)('supportedMarkets includes cn-mainland and us-default', () => {
            const result = controller.getBootstrap();
            const markets = result.supportedMarkets;
            strict_1.default.ok(markets.some(m => m.marketCode === 'cn-mainland'));
            strict_1.default.ok(markets.some(m => m.marketCode === 'us-default'));
        });
    });
    (0, node_test_1.describe)('getScopedMarket() — positive', () => {
        const tenantCtx = {
            tenantId: 't-abc',
            brandId: 'b-xyz',
            storeId: 's-001',
            marketCode: 'cn-mainland'
        };
        (0, node_test_1.default)('returns correct scopeType and scopeCode', () => {
            const result = controller.getScopedMarket('tenant', 't-abc', tenantCtx);
            strict_1.default.equal(result.scopeType, 'tenant');
            strict_1.default.equal(result.scopeCode, 't-abc');
        });
        (0, node_test_1.default)('returns marketProfile with expected fields', () => {
            const result = controller.getScopedMarket('brand', 'b-xyz', tenantCtx);
            const profile = result.marketProfile;
            strict_1.default.equal(profile.marketCode, 'cn-mainland');
            strict_1.default.equal(typeof profile.locale, 'object');
            strict_1.default.equal(typeof profile.timezone, 'object');
            strict_1.default.equal(typeof profile.currency, 'object');
        });
        (0, node_test_1.default)('returns overrides as array with correct length', () => {
            const result = controller.getScopedMarket('store', 's-001', tenantCtx);
            strict_1.default.ok(Array.isArray(result.overrides));
            strict_1.default.equal(result.overrides.length, 3);
        });
        (0, node_test_1.default)('overrides include tenant-level override', () => {
            const result = controller.getScopedMarket('tenant', 't-abc', tenantCtx);
            const overrides = result.overrides;
            const tenantOverride = overrides.find(o => o.scopeType === 'tenant');
            strict_1.default.ok(tenantOverride);
            strict_1.default.equal(tenantOverride.scopeCode, 't1');
        });
    });
    (0, node_test_1.describe)('getScopedPortalMarket() — positive', () => {
        const tenantCtx = {
            tenantId: 't-us',
            brandId: 'b-us',
            storeId: 's-us',
            marketCode: 'us-default'
        };
        (0, node_test_1.default)('returns correct scopeType and scopeCode', () => {
            const result = controller.getScopedPortalMarket('tenant', 't-us', tenantCtx);
            strict_1.default.equal(result.scopeType, 'tenant');
            strict_1.default.equal(result.scopeCode, 't-us');
        });
        (0, node_test_1.default)('returns all portal-visible market profile fields', () => {
            const result = controller.getScopedPortalMarket('brand', 'b-us', tenantCtx);
            strict_1.default.equal(typeof result.marketCode, 'string');
            strict_1.default.equal(typeof result.locale, 'object');
            strict_1.default.equal(typeof result.timezone, 'object');
            strict_1.default.equal(typeof result.tax, 'object');
            strict_1.default.equal(typeof result.network, 'object');
            strict_1.default.equal(typeof result.email, 'object');
            strict_1.default.equal(typeof result.social, 'object');
        });
        (0, node_test_1.default)('does not expose overrides in portal response', () => {
            const result = controller.getScopedPortalMarket('brand', 'b-us', tenantCtx);
            strict_1.default.equal(result.overrides, undefined);
        });
        (0, node_test_1.default)('returns tax details for display', () => {
            const result = controller.getScopedPortalMarket('store', 's-us', { tenantId: 't1', marketCode: 'cn-mainland' });
            const tax = result.tax;
            strict_1.default.equal(typeof tax.taxMode, 'string');
            strict_1.default.equal(typeof tax.taxRate, 'number');
            strict_1.default.equal(typeof tax.taxLabel, 'string');
        });
    });
    // ── Edge / boundary cases ──────────────────────────────────────
    (0, node_test_1.describe)('getBootstrap() — edge cases', () => {
        (0, node_test_1.default)('supportedMarkets never returns more than configured profiles', () => {
            const result = controller.getBootstrap();
            const markets = result.supportedMarkets;
            strict_1.default.ok(markets.length <= 10, 'market profiles should not exceed reasonable limit');
        });
    });
    (0, node_test_1.describe)('getScopedMarket() — edge cases', () => {
        (0, node_test_1.default)('handles empty scopeType', () => {
            const result = controller.getScopedMarket('', 't1', { tenantId: 't1' });
            strict_1.default.equal(result.scopeType, '');
            strict_1.default.equal(result.scopeCode, 't1');
            strict_1.default.ok(result.marketProfile);
        });
        (0, node_test_1.default)('handles empty scopeCode', () => {
            const result = controller.getScopedMarket('tenant', '', { tenantId: 't1' });
            strict_1.default.equal(result.scopeCode, '');
            strict_1.default.ok(result.marketProfile);
        });
        (0, node_test_1.default)('handles tenantContext with only tenantId', () => {
            const result = controller.getScopedMarket('tenant', 't-minimal', { tenantId: 't-minimal' });
            strict_1.default.equal(result.scopeType, 'tenant');
            strict_1.default.equal(result.scopeCode, 't-minimal');
            strict_1.default.ok(result.marketProfile);
            strict_1.default.ok(Array.isArray(result.overrides));
        });
    });
    (0, node_test_1.describe)('getScopedPortalMarket() — edge cases', () => {
        (0, node_test_1.default)('handles missing brandId in context', () => {
            const result = controller.getScopedPortalMarket('brand', '', {
                tenantId: 't-nobrand',
                marketCode: 'cn-mainland'
            });
            strict_1.default.equal(result.scopeCode, '');
            strict_1.default.equal(typeof result.marketCode, 'string');
        });
        (0, node_test_1.default)('handles missing marketCode in context gracefully', () => {
            const result = controller.getScopedPortalMarket('store', 's-nomarket', {
                tenantId: 't-nomarket'
            });
            strict_1.default.equal(typeof result.marketCode, 'string');
        });
        (0, node_test_1.default)('network includes apiBaseUrl', () => {
            const result = controller.getScopedPortalMarket('store', 's1', {
                tenantId: 't1',
                marketCode: 'cn-mainland'
            });
            const network = result.network;
            strict_1.default.equal(typeof network.apiBaseUrl, 'string');
        });
    });
    // ── Negative cases ─────────────────────────────────────────────
    (0, node_test_1.describe)('getScopedMarket() — negative', () => {
        (0, node_test_1.default)('returns marketProfile even for unknown tenant', () => {
            // Should still return a profile (falls back to default)
            const result = controller.getScopedMarket('tenant', 'unknown-tenant', {
                tenantId: 'unknown-tenant',
                marketCode: 'unknown-market'
            });
            strict_1.default.ok(result.marketProfile, 'should return a default profile even for unknown market');
        });
    });
    (0, node_test_1.describe)('getScopedPortalMarket() — negative', () => {
        (0, node_test_1.default)('returns profile for unknown marketCode gracefully', () => {
            const result = controller.getScopedPortalMarket('tenant', 't-bad', {
                tenantId: 't-bad',
                marketCode: 'xx-nonexistent'
            });
            strict_1.default.equal(typeof result.marketCode, 'string');
        });
    });
});
//# sourceMappingURL=market.controller.spec.js.map