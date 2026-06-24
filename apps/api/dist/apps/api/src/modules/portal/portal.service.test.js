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
const portal_service_1 = require("./portal.service");
const domain_1 = require("@m5/domain");
function mockMarketService() {
    return {
        getMergedProfile: () => ({
            marketCode: 'cn-mainland',
            marketName: '中国大陆',
            locale: {
                defaultLanguage: domain_1.LanguageCode.ZhCn,
                supportedLanguages: [domain_1.LanguageCode.ZhCn]
            },
            timezone: { timezone: 'Asia/Shanghai' },
            currency: { currencyCode: 'CNY', symbol: '¥' },
            tax: { taxMode: 'INCLUDED', taxRate: 6, taxLabel: '增值税' },
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
                replyTo: 'hello-cn@m5.local'
            }
        }),
        getOverrides: () => []
    };
}
function mockFoundationService() {
    return {
        getDependencySummary: () => ({ consumer: 'portal' })
    };
}
function createContext(overrides = {}) {
    return {
        tenantId: 'tenant-demo',
        brandId: 'brand-demo',
        storeId: 'store-001',
        marketCode: 'cn-mainland',
        ...overrides
    };
}
(0, node_test_1.describe)('portal.service: resolveTenantPortal', () => {
    (0, node_test_1.default)('returns tenant portal with correct audience and scope', () => {
        const svc = new portal_service_1.PortalService(mockMarketService(), mockFoundationService());
        const portal = svc.resolveTenantPortal(createContext());
        strict_1.default.equal(portal.audience, domain_1.PortalAudience.ToB);
        strict_1.default.equal(portal.scopeType, domain_1.PortalScopeType.Tenant);
        strict_1.default.equal(portal.scopeCode, 'tenant-demo');
        strict_1.default.equal(portal.tenantCode, 'tenant-demo');
        strict_1.default.equal(portal.marketCode, 'cn-mainland');
        strict_1.default.equal(portal.channel, domain_1.PortalChannel.Web);
    });
    (0, node_test_1.default)('tenant portal name includes tenantId', () => {
        const svc = new portal_service_1.PortalService(mockMarketService(), mockFoundationService());
        const portal = svc.resolveTenantPortal(createContext());
        strict_1.default.ok(portal.name.includes('tenant-demo'));
    });
    (0, node_test_1.default)('tenant portal has login entry with sso enabled', () => {
        const svc = new portal_service_1.PortalService(mockMarketService(), mockFoundationService());
        const portal = svc.resolveTenantPortal(createContext());
        strict_1.default.ok(portal.loginEntry);
        strict_1.default.equal(portal.loginEntry.ssoEnabled, true);
        strict_1.default.ok(portal.loginEntry.label.includes('租户后台'));
        strict_1.default.ok(portal.loginEntry.loginPath.includes('tenant-demo'));
    });
    (0, node_test_1.default)('tenant portal supports the market profile languages', () => {
        const svc = new portal_service_1.PortalService(mockMarketService(), mockFoundationService());
        const portal = svc.resolveTenantPortal(createContext());
        strict_1.default.deepEqual(portal.supportedLanguages, [domain_1.LanguageCode.ZhCn]);
    });
    (0, node_test_1.default)('tenant portal primaryDomain is constructed correctly', () => {
        const svc = new portal_service_1.PortalService(mockMarketService(), mockFoundationService());
        const portal = svc.resolveTenantPortal(createContext());
        strict_1.default.equal(portal.primaryDomain, 'tenant-demo.cn-mainland.b2b.local');
    });
});
(0, node_test_1.describe)('portal.service: resolveBrandPortal', () => {
    (0, node_test_1.default)('returns brand portal with correct audience and scope', () => {
        const svc = new portal_service_1.PortalService(mockMarketService(), mockFoundationService());
        const portal = svc.resolveBrandPortal(createContext());
        strict_1.default.equal(portal.audience, domain_1.PortalAudience.ToB);
        strict_1.default.equal(portal.scopeType, domain_1.PortalScopeType.Brand);
        strict_1.default.equal(portal.scopeCode, 'brand-demo');
        strict_1.default.equal(portal.brandCode, 'brand-demo');
        strict_1.default.equal(portal.marketCode, 'cn-mainland');
    });
    (0, node_test_1.default)('brand portal uses default brand code when not provided', () => {
        const svc = new portal_service_1.PortalService(mockMarketService(), mockFoundationService());
        const portal = svc.resolveBrandPortal(createContext({ brandId: undefined }));
        strict_1.default.equal(portal.scopeCode, 'brand-demo');
        strict_1.default.equal(portal.brandCode, 'brand-demo');
    });
    (0, node_test_1.default)('brand portal has login entry with sso enabled', () => {
        const svc = new portal_service_1.PortalService(mockMarketService(), mockFoundationService());
        const portal = svc.resolveBrandPortal(createContext());
        strict_1.default.ok(portal.loginEntry);
        strict_1.default.equal(portal.loginEntry.ssoEnabled, true);
        strict_1.default.ok(portal.loginEntry.label.includes('品牌后台'));
    });
});
(0, node_test_1.describe)('portal.service: resolveStorePortal', () => {
    (0, node_test_1.default)('returns store portal with ToC audience', () => {
        const svc = new portal_service_1.PortalService(mockMarketService(), mockFoundationService());
        const portal = svc.resolveStorePortal(createContext());
        strict_1.default.equal(portal.audience, domain_1.PortalAudience.ToC);
        strict_1.default.equal(portal.scopeType, domain_1.PortalScopeType.Store);
        strict_1.default.equal(portal.scopeCode, 'store-001');
        strict_1.default.equal(portal.storeCode, 'store-001');
        strict_1.default.equal(portal.storeName, 'store-001 门店');
    });
    (0, node_test_1.default)('store portal uses defaults when not provided', () => {
        const svc = new portal_service_1.PortalService(mockMarketService(), mockFoundationService());
        const portal = svc.resolveStorePortal(createContext({ brandId: undefined, storeId: undefined }));
        strict_1.default.equal(portal.brandCode, 'brand-demo');
        strict_1.default.equal(portal.storeCode, 'store-001');
    });
    (0, node_test_1.default)('store portal has supported surfaces for all channels', () => {
        const svc = new portal_service_1.PortalService(mockMarketService(), mockFoundationService());
        const portal = svc.resolveStorePortal(createContext());
        strict_1.default.ok(portal.supportedSurfaces.includes(domain_1.StorefrontSurface.OfficialSite));
        strict_1.default.ok(portal.supportedSurfaces.includes(domain_1.StorefrontSurface.H5));
        strict_1.default.ok(portal.supportedSurfaces.includes(domain_1.StorefrontSurface.MiniApp));
        strict_1.default.ok(portal.supportedSurfaces.includes(domain_1.StorefrontSurface.App));
        strict_1.default.ok(portal.supportedSurfaces.includes(domain_1.StorefrontSurface.PcConsole));
        strict_1.default.ok(portal.supportedSurfaces.includes(domain_1.StorefrontSurface.PadConsole));
    });
    (0, node_test_1.default)('store portal in cn-mainland only supports ZhCn', () => {
        const svc = new portal_service_1.PortalService(mockMarketService(), mockFoundationService());
        const portal = svc.resolveStorePortal(createContext());
        strict_1.default.deepEqual(portal.supportedLanguages, [domain_1.LanguageCode.ZhCn]);
    });
});
(0, node_test_1.describe)('portal.service: getBootstrap', () => {
    (0, node_test_1.default)('getBootstrap returns bootstrap response with portals', () => {
        const svc = new portal_service_1.PortalService(mockMarketService(), mockFoundationService());
        const result = svc.getBootstrap(createContext());
        strict_1.default.ok(result);
        strict_1.default.ok(result.tenantPortal);
        strict_1.default.ok(result.brandPortal);
        strict_1.default.ok(result.storePortal);
        strict_1.default.ok(result.marketProfile);
        strict_1.default.ok(result.regionalOverrides);
        strict_1.default.ok(Array.isArray(result.regionalOverrides));
    });
    (0, node_test_1.default)('getBootstrap tenantPortal has ToB audience', () => {
        const svc = new portal_service_1.PortalService(mockMarketService(), mockFoundationService());
        const result = svc.getBootstrap(createContext());
        strict_1.default.equal(result.tenantPortal.audience, domain_1.PortalAudience.ToB);
    });
    (0, node_test_1.default)('getBootstrap storePortal has ToC audience', () => {
        const svc = new portal_service_1.PortalService(mockMarketService(), mockFoundationService());
        const result = svc.getBootstrap(createContext());
        strict_1.default.equal(result.storePortal.audience, domain_1.PortalAudience.ToC);
    });
    (0, node_test_1.default)('getBootstrap marketProfile has correct marketCode', () => {
        const svc = new portal_service_1.PortalService(mockMarketService(), mockFoundationService());
        const result = svc.getBootstrap(createContext());
        strict_1.default.equal(result.marketProfile.marketCode, 'cn-mainland');
    });
});
//# sourceMappingURL=portal.service.test.js.map