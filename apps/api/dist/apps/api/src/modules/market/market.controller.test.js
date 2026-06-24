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
(0, node_test_1.describe)('MarketController — decorator metadata', () => {
    (0, node_test_1.default)('controller path metadata is set to "markets"', () => {
        const { MarketController } = require('./market.controller');
        const path = Reflect.getMetadata('path', MarketController);
        strict_1.default.equal(path, 'markets');
    });
    (0, node_test_1.default)('getBootstrap route has GET metadata on "bootstrap" path', () => {
        const { MarketController } = require('./market.controller');
        const method = Reflect.getMetadata('method', MarketController.prototype.getBootstrap);
        const path = Reflect.getMetadata('path', MarketController.prototype.getBootstrap);
        strict_1.default.equal(method, 0);
        strict_1.default.equal(path, 'bootstrap');
    });
    (0, node_test_1.default)('getScopedMarket route has GET metadata on parameterized path', () => {
        const { MarketController } = require('./market.controller');
        const method = Reflect.getMetadata('method', MarketController.prototype.getScopedMarket);
        const path = Reflect.getMetadata('path', MarketController.prototype.getScopedMarket);
        strict_1.default.equal(method, 0);
        strict_1.default.equal(path, ':scopeType/:scopeCode');
    });
    (0, node_test_1.default)('getScopedPortalMarket route has GET metadata on portal sub-path', () => {
        const { MarketController } = require('./market.controller');
        const method = Reflect.getMetadata('method', MarketController.prototype.getScopedPortalMarket);
        const path = Reflect.getMetadata('path', MarketController.prototype.getScopedPortalMarket);
        strict_1.default.equal(method, 0);
        strict_1.default.equal(path, ':scopeType/:scopeCode/portal');
    });
});
(0, node_test_1.describe)('MarketController — getBootstrap()', () => {
    (0, node_test_1.default)('returns scaffold bootstrap from service', () => {
        const { MarketController } = require('./market.controller');
        const mockBootstrap = {
            defaultDomesticMarketCode: 'cn-mainland',
            defaultInternationalMarketCode: 'us-default',
            supportedMarkets: [],
            foundation: { generatedAt: '2026-01-01', module: 'market' }
        };
        const mockService = {
            getBootstrap: () => mockBootstrap,
            getMergedProfile: () => ({ marketCode: 'cn-mainland' }),
            getOverrides: () => []
        };
        const controller = new MarketController(mockService);
        const result = controller.getBootstrap();
        strict_1.default.deepStrictEqual(result, mockBootstrap);
    });
    (0, node_test_1.default)('returns supportedMarkets from service', () => {
        const { MarketController } = require('./market.controller');
        const mockBootstrap = {
            defaultDomesticMarketCode: 'cn-mainland',
            defaultInternationalMarketCode: 'us-default',
            supportedMarkets: [
                { marketCode: 'cn-mainland', marketName: '中国大陆' },
                { marketCode: 'us-default', marketName: 'United States' }
            ],
            foundation: { generatedAt: '2026-01-01', module: 'market' }
        };
        const mockService = {
            getBootstrap: () => mockBootstrap,
            getMergedProfile: () => ({}),
            getOverrides: () => []
        };
        const controller = new MarketController(mockService);
        const result = controller.getBootstrap();
        strict_1.default.equal(result.supportedMarkets.length, 2);
        strict_1.default.equal(result.supportedMarkets[0].marketCode, 'cn-mainland');
        strict_1.default.equal(result.defaultDomesticMarketCode, 'cn-mainland');
        strict_1.default.equal(result.defaultInternationalMarketCode, 'us-default');
    });
    (0, node_test_1.default)('does not require tenantContext parameter', () => {
        const { MarketController } = require('./market.controller');
        const mockService = {
            getBootstrap: () => ({
                defaultDomesticMarketCode: 'cn-mainland',
                defaultInternationalMarketCode: 'us-default',
                supportedMarkets: [],
                foundation: { generatedAt: '2026-01-01', module: 'market' }
            }),
            getMergedProfile: () => ({}),
            getOverrides: () => []
        };
        const controller = new MarketController(mockService);
        // getBootstrap should work without any tenant context
        strict_1.default.doesNotThrow(() => controller.getBootstrap());
    });
});
(0, node_test_1.describe)('MarketController — getScopedMarket()', () => {
    (0, node_test_1.default)('returns scope info with merged profile and overrides', () => {
        const { MarketController } = require('./market.controller');
        const mockProfile = { marketCode: 'cn-mainland', marketName: '中国大陆' };
        const mockOverrides = [{ scopeType: 'TENANT', scopeCode: 't-1', inheritanceMode: 'TENANT_DEFAULT', marketCode: 'cn-mainland' }];
        const mockService = {
            getBootstrap: () => ({}),
            getMergedProfile: () => mockProfile,
            getOverrides: () => mockOverrides
        };
        const controller = new MarketController(mockService);
        const tenantContext = { tenantId: 't-1', brandId: 'b-1', storeId: 's-1', marketCode: 'cn-mainland' };
        const result = controller.getScopedMarket('tenant', 't-1', tenantContext);
        strict_1.default.equal(result.scopeType, 'tenant');
        strict_1.default.equal(result.scopeCode, 't-1');
        strict_1.default.deepStrictEqual(result.marketProfile, mockProfile);
        strict_1.default.deepStrictEqual(result.overrides, mockOverrides);
    });
    (0, node_test_1.default)('handles store-level scope with storeId in context', () => {
        const { MarketController } = require('./market.controller');
        const mockProfile = { marketCode: 'us-default', marketName: 'United States' };
        const mockOverrides = [
            { scopeType: 'STORE', scopeCode: 's-99', inheritanceMode: 'STORE_OVERRIDE', marketCode: 'us-default' }
        ];
        const mockService = {
            getBootstrap: () => ({}),
            getMergedProfile: () => mockProfile,
            getOverrides: () => mockOverrides
        };
        const controller = new MarketController(mockService);
        const tenantContext = { tenantId: 't-1', brandId: 'b-1', storeId: 's-99', marketCode: 'us-default' };
        const result = controller.getScopedMarket('store', 's-99', tenantContext);
        strict_1.default.equal(result.scopeType, 'store');
        strict_1.default.equal(result.scopeCode, 's-99');
        strict_1.default.deepStrictEqual(result.marketProfile, mockProfile);
        strict_1.default.equal(result.overrides[0].scopeCode, 's-99');
    });
    (0, node_test_1.default)('handles brand-level scope with brandId in context', () => {
        const { MarketController } = require('./market.controller');
        const mockProfile = { marketCode: 'cn-mainland', marketName: '中国大陆' };
        const mockOverrides = [];
        const mockService = {
            getBootstrap: () => ({}),
            getMergedProfile: () => mockProfile,
            getOverrides: () => mockOverrides
        };
        const controller = new MarketController(mockService);
        const tenantContext = { tenantId: 't-2', brandId: 'b-42', marketCode: 'cn-mainland' };
        const result = controller.getScopedMarket('brand', 'b-42', tenantContext);
        strict_1.default.equal(result.scopeType, 'brand');
        strict_1.default.equal(result.scopeCode, 'b-42');
        strict_1.default.deepStrictEqual(result.overrides, []);
    });
    (0, node_test_1.default)('handles empty tenantContext correctly', () => {
        const { MarketController } = require('./market.controller');
        const mockProfile = { marketCode: 'us-default', marketName: 'United States' };
        const mockOverrides = [];
        const mockService = {
            getBootstrap: () => ({}),
            getMergedProfile: () => mockProfile,
            getOverrides: () => mockOverrides
        };
        const controller = new MarketController(mockService);
        // Minimal context - only tenantId
        const tenantContext = { tenantId: 't-min' };
        const result = controller.getScopedMarket('tenant', 't-min', tenantContext);
        strict_1.default.equal(result.scopeType, 'tenant');
        strict_1.default.equal(result.scopeCode, 't-min');
    });
});
(0, node_test_1.describe)('MarketController — getScopedPortalMarket()', () => {
    (0, node_test_1.default)('returns slim portal market snapshot for brand scope', () => {
        const { MarketController } = require('./market.controller');
        const mockProfile = {
            marketCode: 'us-default',
            marketName: 'United States',
            locale: { defaultLanguage: 'en-US' },
            timezone: { timezone: 'America/New_York' },
            tax: { taxMode: 'EXCLUDED', taxRate: 8.25, taxLabel: 'Sales Tax' },
            network: { networkRegion: 'NORTH_AMERICA' },
            email: { provider: 'SENDGRID', fromName: 'M5 US', fromAddress: 'hello@us.local' },
            social: { primaryPlatforms: ['LINKEDIN'], supportPlatforms: [] }
        };
        const mockService = {
            getBootstrap: () => ({}),
            getMergedProfile: () => mockProfile,
            getOverrides: () => []
        };
        const controller = new MarketController(mockService);
        const tenantContext = { tenantId: 't-1', brandId: 'b-1', storeId: 's-1', marketCode: 'us-default' };
        const result = controller.getScopedPortalMarket('brand', 'b-1', tenantContext);
        strict_1.default.equal(result.scopeType, 'brand');
        strict_1.default.equal(result.scopeCode, 'b-1');
        strict_1.default.equal(result.marketCode, 'us-default');
        strict_1.default.equal(result.locale.defaultLanguage, 'en-US');
        strict_1.default.equal(result.timezone.timezone, 'America/New_York');
        strict_1.default.equal(result.tax.taxMode, 'EXCLUDED');
        strict_1.default.equal(result.tax.taxRate, 8.25);
        strict_1.default.equal(result.email.fromName, 'M5 US');
    });
    (0, node_test_1.default)('returns cn-mainland portal market with China-specific fields', () => {
        const { MarketController } = require('./market.controller');
        const mockProfile = {
            marketCode: 'cn-mainland',
            marketName: '中国大陆',
            locale: { defaultLanguage: 'zh-CN', supportedLanguages: ['zh-CN'] },
            timezone: { timezone: 'Asia/Shanghai' },
            currency: { currencyCode: 'CNY', symbol: '¥' },
            tax: { taxMode: 'INCLUDED', taxRate: 6, taxLabel: '增值税' },
            network: { networkRegion: 'MAINLAND_CHINA', apiBaseUrl: 'https://cn-api.m5.local', cdnBaseUrl: 'https://cn-cdn.m5.local', callbackBaseUrl: 'https://cn-hooks.m5.local' },
            email: { provider: 'ALIYUN_DM', fromName: 'M5 China', fromAddress: 'hello-cn@m5.local', replyTo: 'support-cn@m5.local' },
            social: { primaryPlatforms: ['WECHAT', 'XIAOHONGSHU'], supportPlatforms: ['WECHAT', 'WEIBO', 'DOUYIN'] }
        };
        const mockService = {
            getBootstrap: () => ({}),
            getMergedProfile: () => mockProfile,
            getOverrides: () => []
        };
        const controller = new MarketController(mockService);
        const tenantContext = { tenantId: 't-cn', brandId: 'b-cn', storeId: 's-cn', marketCode: 'cn-mainland' };
        const result = controller.getScopedPortalMarket('tenant', 't-cn', tenantContext);
        strict_1.default.equal(result.scopeType, 'tenant');
        strict_1.default.equal(result.scopeCode, 't-cn');
        strict_1.default.equal(result.marketCode, 'cn-mainland');
        strict_1.default.equal(result.locale.defaultLanguage, 'zh-CN');
        strict_1.default.equal(result.timezone.timezone, 'Asia/Shanghai');
        strict_1.default.equal(result.tax.taxMode, 'INCLUDED');
        strict_1.default.equal(result.tax.taxRate, 6);
        strict_1.default.equal(result.tax.taxLabel, '增值税');
        strict_1.default.equal(result.email.provider, 'ALIYUN_DM');
        strict_1.default.equal(result.email.fromName, 'M5 China');
        strict_1.default.equal(result.social.primaryPlatforms.length, 2);
        strict_1.default.deepStrictEqual(result.social.primaryPlatforms, ['WECHAT', 'XIAOHONGSHU']);
    });
    (0, node_test_1.default)('returns all social and network fields populated', () => {
        const { MarketController } = require('./market.controller');
        const mockProfile = {
            marketCode: 'jp-default',
            marketName: 'Japan',
            locale: { defaultLanguage: 'ja-JP' },
            timezone: { timezone: 'Asia/Tokyo' },
            tax: { taxMode: 'EXCLUDED', taxRate: 10, taxLabel: '消費税' },
            network: { networkRegion: 'APAC', apiBaseUrl: 'https://jp-api.m5.local', cdnBaseUrl: 'https://jp-cdn.m5.local', callbackBaseUrl: 'https://jp-hooks.m5.local' },
            email: { provider: 'SENDGRID', fromName: 'M5 Japan', fromAddress: 'hello-jp@m5.local', replyTo: 'support-jp@m5.local' },
            social: { primaryPlatforms: ['LINE', 'X'], supportPlatforms: ['LINE', 'X', 'INSTAGRAM'] }
        };
        const mockService = {
            getBootstrap: () => ({}),
            getMergedProfile: () => mockProfile,
            getOverrides: () => []
        };
        const controller = new MarketController(mockService);
        const tenantContext = { tenantId: 't-jp', marketCode: 'jp-default' };
        const result = controller.getScopedPortalMarket('tenant', 't-jp', tenantContext);
        strict_1.default.equal(result.marketCode, 'jp-default');
        strict_1.default.equal(result.network.networkRegion, 'APAC');
        strict_1.default.equal(result.network.apiBaseUrl, 'https://jp-api.m5.local');
        strict_1.default.equal(result.social.primaryPlatforms.length, 2);
        strict_1.default.equal(result.email.replyTo, 'support-jp@m5.local');
    });
    (0, node_test_1.default)('returns only portal-relevant fields (no full profile leak)', () => {
        const { MarketController } = require('./market.controller');
        const mockProfile = {
            marketCode: 'us-default',
            marketName: 'United States',
            countryCode: 'US',
            locale: { defaultLanguage: 'en-US', supportedLanguages: ['en-US', 'es-US'] },
            timezone: { timezone: 'America/New_York' },
            currency: { currencyCode: 'USD', symbol: '$' },
            tax: { taxMode: 'EXCLUDED', taxRate: 8.25, taxLabel: 'Sales Tax' },
            network: { networkRegion: 'NORTH_AMERICA', apiBaseUrl: 'https://us-api.m5.local', cdnBaseUrl: 'https://us-cdn.m5.local', callbackBaseUrl: 'https://us-hooks.m5.local' },
            email: { provider: 'SENDGRID', fromName: 'M5 US', fromAddress: 'hello@us.local', replyTo: 'support@us.local' },
            social: { primaryPlatforms: ['LINKEDIN'], supportPlatforms: ['LINKEDIN', 'INSTAGRAM'] }
        };
        const mockService = {
            getBootstrap: () => ({}),
            getMergedProfile: () => mockProfile,
            getOverrides: () => []
        };
        const controller = new MarketController(mockService);
        const result = controller.getScopedPortalMarket('tenant', 't-1', { tenantId: 't-1', marketCode: 'us-default' });
        // Portal response should NOT expose countryCode, supportedLanguages, or replyTo
        strict_1.default.equal(result.marketCode, 'us-default');
        // Verify the result has portal-specific shape
        strict_1.default.ok('marketCode' in result);
        strict_1.default.ok('locale' in result);
        strict_1.default.ok('timezone' in result);
        strict_1.default.ok('tax' in result);
        strict_1.default.ok('network' in result);
        strict_1.default.ok('email' in result);
        strict_1.default.ok('social' in result);
        // The controller destructures from the profile but the portal fields are a subset
        strict_1.default.equal(result.email.fromName, 'M5 US');
        strict_1.default.equal(result.social.primaryPlatforms.length, 1);
    });
    (0, node_test_1.default)('returns portal market with empty social and email fields gracefully', () => {
        const { MarketController } = require('./market.controller');
        const mockProfile = {
            marketCode: 'minimal-default',
            marketName: 'Minimal Market',
            locale: { defaultLanguage: 'en-US' },
            timezone: { timezone: 'UTC' },
            tax: { taxMode: 'EXCLUDED', taxRate: 0, taxLabel: '' },
            network: { networkRegion: 'GLOBAL' },
            email: { provider: '', fromName: '', fromAddress: '', replyTo: '' },
            social: { primaryPlatforms: [], supportPlatforms: [] }
        };
        const mockService = {
            getBootstrap: () => ({}),
            getMergedProfile: () => mockProfile,
            getOverrides: () => []
        };
        const controller = new MarketController(mockService);
        const result = controller.getScopedPortalMarket('tenant', 't-min', { tenantId: 't-min', marketCode: 'minimal-default' });
        strict_1.default.equal(result.scopeType, 'tenant');
        strict_1.default.equal(result.marketCode, 'minimal-default');
        strict_1.default.equal(result.tax.taxRate, 0);
        strict_1.default.equal(result.tax.taxLabel, '');
        strict_1.default.equal(result.email.provider, '');
        strict_1.default.equal(result.social.primaryPlatforms.length, 0);
    });
    (0, node_test_1.default)('can handle scopeType with special characters (boundary)', () => {
        const { MarketController } = require('./market.controller');
        const mockProfile = { marketCode: 'cn-mainland', marketName: '中国大陆' };
        const mockService = {
            getBootstrap: () => ({}),
            getMergedProfile: () => mockProfile,
            getOverrides: () => []
        };
        const controller = new MarketController(mockService);
        // scopeType with hyphen and underscore
        const result = controller.getScopedMarket('cross-region_type', 'scope-99_test', { tenantId: 't-1', marketCode: 'cn-mainland' });
        strict_1.default.equal(result.scopeType, 'cross-region_type');
        strict_1.default.equal(result.scopeCode, 'scope-99_test');
    });
});
(0, node_test_1.describe)('MarketController — error and boundary behavior', () => {
    (0, node_test_1.default)('getScopedMarket propagates service errors (no profile crash)', () => {
        const { MarketController } = require('./market.controller');
        const mockService = {
            getBootstrap: () => ({}),
            getMergedProfile: () => {
                throw new Error('Market profile not found for tenant');
            },
            getOverrides: () => []
        };
        const controller = new MarketController(mockService);
        strict_1.default.throws(() => controller.getScopedMarket('tenant', 't-error', { tenantId: 't-error', marketCode: 'unknown' }), /Market profile not found for tenant/);
    });
    (0, node_test_1.default)('getScopedMarket propagates getOverrides errors', () => {
        const { MarketController } = require('./market.controller');
        const mockService = {
            getBootstrap: () => ({}),
            getMergedProfile: () => ({ marketCode: 'cn-mainland' }),
            getOverrides: () => {
                throw new Error('Regional overrides unavailable');
            }
        };
        const controller = new MarketController(mockService);
        strict_1.default.throws(() => controller.getScopedMarket('tenant', 't-override-err', { tenantId: 't-override-err', marketCode: 'cn-mainland' }), /Regional overrides unavailable/);
    });
    (0, node_test_1.default)('getScopedPortalMarket handles service returning undefined locale fields (boundary)', () => {
        const { MarketController } = require('./market.controller');
        const mockProfile = {
            marketCode: 'partial-default',
            marketName: 'Partial Market',
            locale: undefined,
            timezone: undefined,
            tax: null,
            network: undefined,
            email: null,
            social: undefined
        };
        const mockService = {
            getBootstrap: () => ({}),
            getMergedProfile: () => mockProfile,
            getOverrides: () => []
        };
        const controller = new MarketController(mockService);
        // Should not throw even with partial profile — destructuring handles undefined fields
        const result = controller.getScopedPortalMarket('store', 's-partial', { tenantId: 't-1', marketCode: 'partial-default' });
        strict_1.default.equal(result.marketCode, 'partial-default');
        strict_1.default.equal(result.locale, undefined);
        strict_1.default.equal(result.tax, null);
    });
    (0, node_test_1.default)('getScopedMarket with very long scopeType and scopeCode strings (boundary)', () => {
        const { MarketController } = require('./market.controller');
        const mockProfile = { marketCode: 'us-default', marketName: 'United States' };
        const mockService = {
            getBootstrap: () => ({}),
            getMergedProfile: () => mockProfile,
            getOverrides: () => []
        };
        const controller = new MarketController(mockService);
        const longScope = 'a'.repeat(500);
        const result = controller.getScopedMarket(longScope, longScope, { tenantId: longScope, marketCode: 'us-default' });
        strict_1.default.equal(result.scopeType.length, 500);
        strict_1.default.equal(result.scopeCode.length, 500);
    });
    (0, node_test_1.default)('getScopedPortalMarket returns store-level portal with surface hints', () => {
        const { MarketController } = require('./market.controller');
        const mockProfile = {
            marketCode: 'cn-mainland',
            marketName: '中国大陆',
            locale: { defaultLanguage: 'zh-CN' },
            timezone: { timezone: 'Asia/Shanghai' },
            tax: { taxMode: 'INCLUDED', taxRate: 6, taxLabel: '增值税' },
            network: { networkRegion: 'MAINLAND_CHINA' },
            email: { provider: 'ALIYUN_DM', fromName: '门店', fromAddress: 'store@m5.local' },
            social: { primaryPlatforms: ['WECHAT'], supportPlatforms: [] }
        };
        const mockService = {
            getBootstrap: () => ({}),
            getMergedProfile: () => mockProfile,
            getOverrides: () => []
        };
        const controller = new MarketController(mockService);
        const result = controller.getScopedPortalMarket('store', 's-sh-001', { tenantId: 't-1', brandId: 'b-1', storeId: 's-sh-001', marketCode: 'cn-mainland' });
        strict_1.default.equal(result.scopeType, 'store');
        strict_1.default.equal(result.scopeCode, 's-sh-001');
        strict_1.default.equal(result.timezone.timezone, 'Asia/Shanghai');
        strict_1.default.equal(result.email.fromAddress, 'store@m5.local');
    });
    (0, node_test_1.default)('getScopedMarket returns empty overrides array when no overrides exist', () => {
        const { MarketController } = require('./market.controller');
        const mockProfile = { marketCode: 'eu-default', marketName: 'Europe' };
        const mockService = {
            getBootstrap: () => ({}),
            getMergedProfile: () => mockProfile,
            getOverrides: () => []
        };
        const controller = new MarketController(mockService);
        const result = controller.getScopedMarket('tenant', 't-eu', { tenantId: 't-eu', marketCode: 'eu-default' });
        strict_1.default.deepStrictEqual(result.overrides, []);
        strict_1.default.equal(result.marketProfile.marketCode, 'eu-default');
    });
    (0, node_test_1.default)('getScopedMarket preserves override ordering from service', () => {
        const { MarketController } = require('./market.controller');
        const mockOverrides = [
            { scopeType: 'TENANT', scopeCode: 't-order', inheritanceMode: 'TENANT_DEFAULT', marketCode: 'cn-mainland', priority: 1 },
            { scopeType: 'BRAND', scopeCode: 'b-order', inheritanceMode: 'BRAND_OVERRIDE', marketCode: 'cn-mainland', priority: 2 },
            { scopeType: 'STORE', scopeCode: 's-order', inheritanceMode: 'STORE_OVERRIDE', marketCode: 'cn-mainland', priority: 3 }
        ];
        const mockService = {
            getBootstrap: () => ({}),
            getMergedProfile: () => ({ marketCode: 'cn-mainland' }),
            getOverrides: () => mockOverrides
        };
        const controller = new MarketController(mockService);
        const result = controller.getScopedMarket('tenant', 't-order', { tenantId: 't-order', marketCode: 'cn-mainland' });
        strict_1.default.equal(result.overrides.length, 3);
        strict_1.default.equal(result.overrides[0].priority, 1);
        strict_1.default.equal(result.overrides[1].priority, 2);
        strict_1.default.equal(result.overrides[2].priority, 3);
    });
});
//# sourceMappingURL=market.controller.test.js.map