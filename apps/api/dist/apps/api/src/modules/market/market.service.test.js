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
(0, node_test_1.describe)('MarketService', () => {
    const { MarketService } = require('./market.service');
    (0, node_test_1.default)('getBootstrap returns bootstrap with supported markets and foundation metadata', () => {
        const mockFoundation = {
            getDependencySummary: () => ({
                consumer: 'market',
                dependsOn: ['identity-access'],
                handoffContracts: ['market:v1']
            })
        };
        const service = new MarketService(mockFoundation);
        const result = service.getBootstrap();
        strict_1.default.equal(result.defaultDomesticMarketCode, 'cn-mainland');
        strict_1.default.equal(result.defaultInternationalMarketCode, 'us-default');
        strict_1.default.ok(Array.isArray(result.supportedMarkets));
        strict_1.default.ok(result.supportedMarkets.length >= 2);
        strict_1.default.ok(result.supportedMarkets.some((m) => m.marketCode === 'cn-mainland'));
        strict_1.default.ok(result.supportedMarkets.some((m) => m.marketCode === 'us-default'));
        strict_1.default.deepStrictEqual(result.foundationDependencies, ['identity-access']);
        strict_1.default.deepStrictEqual(result.foundationContracts, ['market:v1']);
    });
    (0, node_test_1.default)('getBootstrap handles null foundation dependency', () => {
        const mockFoundation = { getDependencySummary: () => null };
        const service = new MarketService(mockFoundation);
        const result = service.getBootstrap();
        strict_1.default.equal(result.defaultDomesticMarketCode, 'cn-mainland');
        strict_1.default.equal(result.defaultInternationalMarketCode, 'us-default');
        strict_1.default.ok(Array.isArray(result.supportedMarkets));
    });
    (0, node_test_1.default)('getByMarketCode returns cn-mainland profile', () => {
        const mockFoundation = { getDependencySummary: () => null };
        const service = new MarketService(mockFoundation);
        const result = service.getByMarketCode('cn-mainland');
        strict_1.default.equal(result.marketCode, 'cn-mainland');
        strict_1.default.equal(result.marketName, '中国大陆');
        strict_1.default.equal(result.currency.currencyCode, 'CNY');
        strict_1.default.equal(result.currency.symbol, '¥');
        strict_1.default.equal(result.tax.taxMode, 'PRICES_INCLUDE_TAX');
        strict_1.default.equal(result.network.networkRegion, 'MAINLAND_CHINA');
    });
    (0, node_test_1.default)('getByMarketCode returns us-default profile', () => {
        const mockFoundation = { getDependencySummary: () => null };
        const service = new MarketService(mockFoundation);
        const result = service.getByMarketCode('us-default');
        strict_1.default.equal(result.marketCode, 'us-default');
        strict_1.default.equal(result.marketName, 'United States');
        strict_1.default.equal(result.currency.currencyCode, 'USD');
        strict_1.default.equal(result.currency.symbol, '$');
        strict_1.default.equal(result.tax.taxMode, 'PRICES_EXCLUDE_TAX');
        strict_1.default.equal(result.network.networkRegion, 'NORTH_AMERICA');
    });
    (0, node_test_1.default)('getByMarketCode falls back to us-default for unknown marketCode', () => {
        const mockFoundation = { getDependencySummary: () => null };
        const service = new MarketService(mockFoundation);
        const result = service.getByMarketCode('de-unknown');
        // Falls back to us-default
        strict_1.default.equal(result.marketCode, 'us-default');
    });
    (0, node_test_1.default)('getOverrides returns tenant/brand/store overrides for cn-mainland', () => {
        const mockFoundation = { getDependencySummary: () => null };
        const service = new MarketService(mockFoundation);
        const context = {
            tenantId: 't-acme',
            brandId: 'b-shoes',
            storeId: 's-flagship',
            marketCode: 'cn-mainland'
        };
        const result = service.getOverrides(context);
        strict_1.default.equal(result.length, 3);
        strict_1.default.equal(result[0].scopeType, 'TENANT');
        strict_1.default.equal(result[0].scopeCode, 't-acme');
        strict_1.default.equal(result[0].inheritanceMode, 'TENANT_DEFAULT');
        strict_1.default.equal(result[0].email.fromName, 't-acme HQ');
        strict_1.default.equal(result[1].scopeType, 'BRAND');
        strict_1.default.equal(result[1].scopeCode, 'b-shoes');
        strict_1.default.deepStrictEqual(result[1].social.primaryPlatforms, ['WECHAT', 'DOUYIN']);
        strict_1.default.equal(result[2].scopeType, 'STORE');
        strict_1.default.equal(result[2].scopeCode, 's-flagship');
        strict_1.default.equal(result[2].timezone.timezone, 'Asia/Shanghai');
    });
    (0, node_test_1.default)('getOverrides uses us-default platforms and timezone for non-cn market', () => {
        const mockFoundation = { getDependencySummary: () => null };
        const service = new MarketService(mockFoundation);
        const context = {
            tenantId: 't-global',
            brandId: 'b-fashion',
            storeId: 's-la',
            marketCode: 'us-default'
        };
        const result = service.getOverrides(context);
        strict_1.default.equal(result.length, 3);
        strict_1.default.deepStrictEqual(result[1].social.primaryPlatforms, ['LINKEDIN', 'INSTAGRAM']);
        strict_1.default.equal(result[2].timezone.timezone, 'America/Los_Angeles');
    });
    (0, node_test_1.default)('getOverrides defaults to us-default when no marketCode', () => {
        const mockFoundation = { getDependencySummary: () => null };
        const service = new MarketService(mockFoundation);
        const context = {
            tenantId: 't-x',
            brandId: 'b-x',
            storeId: 's-x',
            marketCode: undefined
        };
        const result = service.getOverrides(context);
        strict_1.default.equal(result.length, 3);
        strict_1.default.deepStrictEqual(result[1].social.primaryPlatforms, ['LINKEDIN', 'INSTAGRAM']);
    });
    (0, node_test_1.default)('getOverrides uses default brand and store when not provided', () => {
        const mockFoundation = { getDependencySummary: () => null };
        const service = new MarketService(mockFoundation);
        const context = {
            tenantId: 't-minimal',
            brandId: undefined,
            storeId: undefined,
            marketCode: 'cn-mainland'
        };
        const result = service.getOverrides(context);
        strict_1.default.equal(result[1].scopeCode, 'brand-demo');
        strict_1.default.equal(result[2].scopeCode, 'store-001');
    });
    (0, node_test_1.default)('getMergedProfile returns base profile merged with overrides for cn-mainland', () => {
        const mockFoundation = { getDependencySummary: () => null };
        const service = new MarketService(mockFoundation);
        const context = {
            tenantId: 't-acme',
            brandId: 'b-shoes',
            storeId: 's-flagship',
            marketCode: 'cn-mainland'
        };
        const result = service.getMergedProfile(context);
        strict_1.default.equal(result.marketCode, 'cn-mainland');
        strict_1.default.equal(result.marketName, '中国大陆');
        // Store override applied last → timezone preserved as Asia/Shanghai
        strict_1.default.equal(result.timezone.timezone, 'Asia/Shanghai');
        // Email override from tenant level
        strict_1.default.ok(result.email.fromName.includes('t-acme'));
        // Social from brand override
        strict_1.default.deepStrictEqual(result.social.primaryPlatforms, ['WECHAT', 'DOUYIN']);
    });
    (0, node_test_1.default)('getMergedProfile returns us-default with overrides', () => {
        const mockFoundation = { getDependencySummary: () => null };
        const service = new MarketService(mockFoundation);
        const context = {
            tenantId: 't-global',
            brandId: 'b-fashion',
            storeId: 's-la',
            marketCode: 'us-default'
        };
        const result = service.getMergedProfile(context);
        strict_1.default.equal(result.marketCode, 'us-default');
        strict_1.default.equal(result.marketName, 'United States');
        strict_1.default.equal(result.currency.currencyCode, 'USD');
        // Store override: America/Los_Angeles
        strict_1.default.equal(result.timezone.timezone, 'America/Los_Angeles');
        strict_1.default.deepStrictEqual(result.social.primaryPlatforms, ['LINKEDIN', 'INSTAGRAM']);
    });
});
//# sourceMappingURL=market.service.test.js.map