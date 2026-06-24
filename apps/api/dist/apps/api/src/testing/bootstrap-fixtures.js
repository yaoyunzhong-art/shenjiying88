"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createContractTestFoundationDependencySummary = createContractTestFoundationDependencySummary;
exports.createE2EFoundationDependencySummary = createE2EFoundationDependencySummary;
exports.createMarketProfileFixture = createMarketProfileFixture;
exports.createRegionalOverridesFixture = createRegionalOverridesFixture;
exports.createTenantPortalFixture = createTenantPortalFixture;
exports.createBrandPortalFixture = createBrandPortalFixture;
exports.createStorePortalFixture = createStorePortalFixture;
exports.createMinimalTenantContextFixture = createMinimalTenantContextFixture;
exports.createResolvedTenantContextFixture = createResolvedTenantContextFixture;
exports.createSupportedClientsFixture = createSupportedClientsFixture;
const types_1 = require("@m5/types");
function createContractTestFoundationDependencySummary() {
    return {
        dependsOn: ['identity-access', 'configuration-governance'],
        handoffContracts: ['contract-a']
    };
}
function createE2EFoundationDependencySummary() {
    return {
        dependsOn: ['identity-access', 'configuration-governance'],
        handoffContracts: ['@m5/types']
    };
}
function createMarketProfileFixture() {
    return {
        marketCode: 'cn-mainland',
        marketName: '中国大陆',
        countryCode: 'CN',
        locale: { defaultLanguage: 'zh-CN', supportedLanguages: ['zh-CN'] },
        timezone: { timezone: 'Asia/Shanghai' },
        currency: { currencyCode: 'CNY', symbol: '¥' },
        tax: { taxMode: 'PRICES_INCLUDE_TAX', taxRate: 6, taxLabel: '增值税' },
        network: {
            networkRegion: 'MAINLAND_CHINA',
            apiBaseUrl: 'https://cn-api.m5.local',
            cdnBaseUrl: 'https://cn-cdn.m5.local',
            callbackBaseUrl: 'https://cn-hooks.m5.local'
        },
        email: {
            provider: 'ALIYUN_DM',
            fromName: 'M5 China',
            fromAddress: 'hello-cn@m5.local',
            replyTo: 'support-cn@m5.local'
        },
        social: { primaryPlatforms: ['WECHAT'], supportPlatforms: ['WECHAT'] }
    };
}
function createRegionalOverridesFixture() {
    return [
        {
            scopeType: 'TENANT',
            scopeCode: 'tenant-demo',
            inheritanceMode: 'TENANT_DEFAULT',
            marketCode: 'cn-mainland',
            email: { fromName: 'tenant-demo HQ' }
        },
        {
            scopeType: 'BRAND',
            scopeCode: 'brand-demo',
            inheritanceMode: 'BRAND_OVERRIDE',
            marketCode: 'cn-mainland',
            social: { primaryPlatforms: ['WECHAT'] }
        },
        {
            scopeType: 'STORE',
            scopeCode: 'store-001',
            inheritanceMode: 'STORE_OVERRIDE',
            marketCode: 'cn-mainland',
            timezone: { timezone: 'Asia/Shanghai' }
        }
    ];
}
function createTenantPortalFixture() {
    return {
        audience: 'TOB',
        scopeType: 'TENANT',
        scopeCode: 'tenant-demo',
        tenantCode: 'tenant-demo',
        brandCode: undefined,
        marketCode: 'cn-mainland',
        channel: 'WEB',
        name: 'tenant-demo ToB 官网',
        primaryDomain: 'tenant-demo.cn-mainland.b2b.local',
        supportedLanguages: ['zh-CN'],
        heroTitle: 'tenant-demo 企业级经营门户',
        heroSubtitle: 'demo',
        solutionTags: [],
        loginEntry: { label: '进入租户后台', loginPath: '/cn-mainland/tenant-demo/login', ssoEnabled: true }
    };
}
function createBrandPortalFixture() {
    return {
        audience: 'TOB',
        scopeType: 'BRAND',
        scopeCode: 'brand-demo',
        tenantCode: 'tenant-demo',
        brandCode: 'brand-demo',
        marketCode: 'cn-mainland',
        channel: 'WEB',
        name: 'brand-demo 品牌 ToB 官网',
        primaryDomain: 'brand-demo.tenant-demo.cn-mainland.b2b.local',
        supportedLanguages: ['zh-CN'],
        heroTitle: 'brand-demo 品牌经营官网',
        heroSubtitle: 'demo',
        solutionTags: [],
        loginEntry: { label: '进入品牌后台', loginPath: '/cn-mainland/tenant-demo/brand-demo/login', ssoEnabled: true }
    };
}
function createStorePortalFixture() {
    return {
        audience: 'TOC',
        scopeType: 'STORE',
        scopeCode: 'store-001',
        tenantCode: 'tenant-demo',
        brandCode: 'brand-demo',
        storeCode: 'store-001',
        storeName: 'store-001 门店',
        marketCode: 'cn-mainland',
        channel: 'WEB',
        name: 'store-001 门店门户',
        primaryDomain: 'store-001.brand-demo.tenant-demo.cn-mainland.local',
        supportedLanguages: ['zh-CN'],
        supportedSurfaces: ['OFFICIAL_SITE', 'H5', 'MINIAPP', 'APP', 'PC_CONSOLE', 'PAD_CONSOLE']
    };
}
function createMinimalTenantContextFixture() {
    return {
        tenantId: 'tenant-demo'
    };
}
function createResolvedTenantContextFixture() {
    return {
        tenantId: 'tenant-demo',
        brandId: 'brand-demo',
        storeId: 'store-001',
        marketCode: 'cn-mainland'
    };
}
function createSupportedClientsFixture() {
    return [...types_1.foundationSupportedClients];
}
//# sourceMappingURL=bootstrap-fixtures.js.map