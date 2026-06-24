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
const portal_controller_1 = require("./portal.controller");
const domain_1 = require("@m5/domain");
// ---- metadata assertions ----
(0, node_test_1.default)('portal controller path metadata is set', () => {
    const path = Reflect.getMetadata('path', portal_controller_1.PortalController);
    strict_1.default.equal(path, 'portals');
});
(0, node_test_1.default)('portal controller getBootstrap route has GET metadata', () => {
    const method = Reflect.getMetadata('method', portal_controller_1.PortalController.prototype.getBootstrap);
    const path = Reflect.getMetadata('path', portal_controller_1.PortalController.prototype.getBootstrap);
    strict_1.default.equal(method, 0); // GET = 0 in RequestMethod enum
    strict_1.default.equal(path, 'bootstrap');
});
(0, node_test_1.default)('portal controller getTenantPortal route metadata', () => {
    const method = Reflect.getMetadata('method', portal_controller_1.PortalController.prototype.getTenantPortal);
    const path = Reflect.getMetadata('path', portal_controller_1.PortalController.prototype.getTenantPortal);
    strict_1.default.equal(method, 0);
    strict_1.default.equal(path, 'tenant-portal');
});
(0, node_test_1.default)('portal controller getBrandPortal route metadata', () => {
    const method = Reflect.getMetadata('method', portal_controller_1.PortalController.prototype.getBrandPortal);
    const path = Reflect.getMetadata('path', portal_controller_1.PortalController.prototype.getBrandPortal);
    strict_1.default.equal(method, 0);
    strict_1.default.equal(path, 'brand-portal');
});
(0, node_test_1.default)('portal controller getStorePortal route metadata', () => {
    const method = Reflect.getMetadata('method', portal_controller_1.PortalController.prototype.getStorePortal);
    const path = Reflect.getMetadata('path', portal_controller_1.PortalController.prototype.getStorePortal);
    strict_1.default.equal(method, 0);
    strict_1.default.equal(path, 'store-portal');
});
// ---- runtime behaviour tests ----
(0, node_test_1.describe)('getBootstrap() – happy path', () => {
    const mockBootstrapResponse = {
        tenantPortal: {
            audience: domain_1.PortalAudience.ToB,
            scopeType: domain_1.PortalScopeType.Tenant,
            scopeCode: 't-1',
            tenantCode: 't-1',
            marketCode: 'cn-mainland',
            channel: domain_1.PortalChannel.Web,
            name: 't-1 ToB 官网',
            primaryDomain: 't-1.cn-mainland.b2b.local',
            supportedLanguages: [domain_1.LanguageCode.ZhCn],
            heroTitle: 't-1 企业级经营门户',
            loginEntry: { label: '进入租户后台', loginPath: '/cn-mainland/t-1/login', ssoEnabled: true }
        },
        brandPortal: {
            audience: domain_1.PortalAudience.ToB,
            scopeType: domain_1.PortalScopeType.Brand,
            scopeCode: 'b-1',
            tenantCode: 't-1',
            brandCode: 'b-1',
            marketCode: 'cn-mainland',
            channel: domain_1.PortalChannel.Web,
            name: 'b-1 品牌 ToB 官网',
            primaryDomain: 'b-1.t-1.cn-mainland.b2b.local',
            supportedLanguages: [domain_1.LanguageCode.ZhCn],
            heroTitle: 'b-1 品牌经营官网',
            loginEntry: { label: '进入品牌后台', loginPath: '/cn-mainland/t-1/b-1/login', ssoEnabled: true }
        },
        storePortal: {
            audience: domain_1.PortalAudience.ToC,
            scopeType: domain_1.PortalScopeType.Store,
            scopeCode: 's-1',
            tenantCode: 't-1',
            brandCode: 'b-1',
            storeCode: 's-1',
            storeName: 's-1 门店',
            marketCode: 'cn-mainland',
            channel: domain_1.PortalChannel.Web,
            name: 's-1 门店门户',
            primaryDomain: 's-1.b-1.t-1.cn-mainland.local',
            supportedLanguages: [domain_1.LanguageCode.ZhCn],
            supportedSurfaces: [
                domain_1.StorefrontSurface.OfficialSite,
                domain_1.StorefrontSurface.H5,
                domain_1.StorefrontSurface.MiniApp,
                domain_1.StorefrontSurface.App,
                domain_1.StorefrontSurface.PcConsole,
                domain_1.StorefrontSurface.PadConsole
            ]
        },
        marketProfile: {
            marketCode: 'cn-mainland',
            marketName: '中国大陆',
            locale: { defaultLanguage: domain_1.LanguageCode.ZhCn, supportedLanguages: [domain_1.LanguageCode.ZhCn] },
            timezone: { timezone: 'Asia/Shanghai' },
            tax: { taxMode: 'INCLUDED', taxRate: 13, taxLabel: '增值税' },
            network: { networkRegion: 'CHINA_MAINLAND' },
            email: { provider: 'SMTP', fromName: 'M5 CN', fromAddress: 'hello@cn.local' },
            social: { primaryPlatforms: ['WECHAT'], supportPlatforms: [] }
        },
        regionalOverrides: [],
        foundationDependencies: [],
        foundationContracts: []
    };
    const fullContext = {
        tenantId: 't-1',
        brandId: 'b-1',
        storeId: 's-1',
        marketCode: 'cn-mainland'
    };
    (0, node_test_1.default)('returns expected shape from service delegate', () => {
        const mockService = {
            getBootstrap: (ctx) => ({ ...mockBootstrapResponse })
        };
        const controller = new portal_controller_1.PortalController(mockService);
        const result = controller.getBootstrap(fullContext);
        strict_1.default.equal(result.tenantPortal.scopeType, domain_1.PortalScopeType.Tenant);
        strict_1.default.equal(result.tenantPortal.audience, domain_1.PortalAudience.ToB);
        strict_1.default.equal(result.tenantPortal.scopeCode, 't-1');
        strict_1.default.equal(result.brandPortal.scopeType, domain_1.PortalScopeType.Brand);
        strict_1.default.equal(result.brandPortal.scopeCode, 'b-1');
        strict_1.default.equal(result.brandPortal.brandCode, 'b-1');
        strict_1.default.equal(result.storePortal.scopeType, domain_1.PortalScopeType.Store);
        strict_1.default.equal(result.storePortal.scopeCode, 's-1');
        strict_1.default.equal(result.storePortal.storeName, 's-1 门店');
    });
    (0, node_test_1.default)('passes tenantContext through to service', () => {
        let capturedCtx;
        const mockService = {
            getBootstrap: (ctx) => {
                capturedCtx = ctx;
                return { ...mockBootstrapResponse };
            }
        };
        const controller = new portal_controller_1.PortalController(mockService);
        controller.getBootstrap(fullContext);
        strict_1.default.deepStrictEqual(capturedCtx, fullContext);
    });
    (0, node_test_1.default)('returns foundationDependencies array', () => {
        const mockService = {
            getBootstrap: () => ({ ...mockBootstrapResponse })
        };
        const controller = new portal_controller_1.PortalController(mockService);
        const result = controller.getBootstrap(fullContext);
        strict_1.default.ok(Array.isArray(result.foundationDependencies));
    });
    (0, node_test_1.default)('returns regionalOverrides array', () => {
        const mockService = {
            getBootstrap: () => ({ ...mockBootstrapResponse })
        };
        const controller = new portal_controller_1.PortalController(mockService);
        const result = controller.getBootstrap(fullContext);
        strict_1.default.ok(Array.isArray(result.regionalOverrides));
    });
});
// ---- boundary / edge-case tests ----
(0, node_test_1.describe)('getBootstrap() – boundary cases', () => {
    (0, node_test_1.default)('handles minimal tenant context (tenantId only)', () => {
        const mockService = {
            getBootstrap: (ctx) => ({
                tenantPortal: { scopeCode: ctx.tenantId },
                brandPortal: {},
                storePortal: {},
                marketProfile: {},
                regionalOverrides: [],
                foundationDependencies: [],
                foundationContracts: []
            })
        };
        const controller = new portal_controller_1.PortalController(mockService);
        const minimalCtx = { tenantId: 'min-t-1' };
        const result = controller.getBootstrap(minimalCtx);
        strict_1.default.equal(result.tenantPortal.scopeCode, 'min-t-1');
    });
    (0, node_test_1.default)('handles undefined brandId in context (portal service uses fallback)', () => {
        // The controller simply delegates, so it should not throw when brandId is missing
        const mockService = {
            getBootstrap: (ctx) => ({
                tenantPortal: { scopeCode: ctx.tenantId },
                brandPortal: { scopeCode: ctx.brandId ?? 'brand-demo' },
                storePortal: { scopeCode: ctx.storeId ?? 'store-001' },
                marketProfile: {},
                regionalOverrides: [],
                foundationDependencies: [],
                foundationContracts: []
            })
        };
        const controller = new portal_controller_1.PortalController(mockService);
        const contextWithoutBrand = { tenantId: 't-no-brand' };
        // Should not throw
        strict_1.default.doesNotThrow(() => controller.getBootstrap(contextWithoutBrand));
    });
    (0, node_test_1.default)('handles international market context (en-US)', () => {
        const mockService = {
            getBootstrap: (ctx) => ({
                tenantPortal: { scopeCode: ctx.tenantId, supportedLanguages: [domain_1.LanguageCode.EnUs] },
                brandPortal: {},
                storePortal: { supportedLanguages: [domain_1.LanguageCode.EnUs] },
                marketProfile: { marketCode: 'us-default' },
                regionalOverrides: [],
                foundationDependencies: [],
                foundationContracts: []
            })
        };
        const controller = new portal_controller_1.PortalController(mockService);
        const usContext = {
            tenantId: 't-us',
            brandId: 'b-us',
            storeId: 's-us',
            marketCode: 'us-default'
        };
        const result = controller.getBootstrap(usContext);
        strict_1.default.equal(result.tenantPortal.supportedLanguages[0], domain_1.LanguageCode.EnUs);
        strict_1.default.equal(result.marketProfile.marketCode, 'us-default');
    });
    (0, node_test_1.default)('returns consistent ToB audience for tenant and brand portals', () => {
        const mockService = {
            getBootstrap: () => ({
                tenantPortal: { audience: domain_1.PortalAudience.ToB },
                brandPortal: { audience: domain_1.PortalAudience.ToB },
                storePortal: { audience: domain_1.PortalAudience.ToC },
                marketProfile: {},
                regionalOverrides: [],
                foundationDependencies: [],
                foundationContracts: []
            })
        };
        const controller = new portal_controller_1.PortalController(mockService);
        const ctx = { tenantId: 't-1' };
        const result = controller.getBootstrap(ctx);
        strict_1.default.equal(result.tenantPortal.audience, domain_1.PortalAudience.ToB);
        strict_1.default.equal(result.brandPortal.audience, domain_1.PortalAudience.ToB);
        strict_1.default.equal(result.storePortal.audience, domain_1.PortalAudience.ToC);
    });
    (0, node_test_1.default)('handle empty regional overrides', () => {
        const mockService = {
            getBootstrap: () => ({
                tenantPortal: {},
                brandPortal: {},
                storePortal: {},
                marketProfile: {},
                regionalOverrides: [],
                foundationDependencies: [],
                foundationContracts: []
            })
        };
        const controller = new portal_controller_1.PortalController(mockService);
        const ctx = { tenantId: 't-empty' };
        const result = controller.getBootstrap(ctx);
        strict_1.default.equal(result.regionalOverrides.length, 0);
    });
    (0, node_test_1.default)('handle populated regional overrides', () => {
        const mockOverrides = [
            { scopeType: 'TENANT', scopeCode: 't-1', inheritanceMode: 'TENANT_DEFAULT', marketCode: 'cn-mainland' }
        ];
        const mockService = {
            getBootstrap: () => ({
                tenantPortal: {},
                brandPortal: {},
                storePortal: {},
                marketProfile: {},
                regionalOverrides: mockOverrides,
                foundationDependencies: [],
                foundationContracts: []
            })
        };
        const controller = new portal_controller_1.PortalController(mockService);
        const ctx = { tenantId: 't-1' };
        const result = controller.getBootstrap(ctx);
        strict_1.default.equal(result.regionalOverrides.length, 1);
        strict_1.default.equal(result.regionalOverrides[0].scopeType, 'TENANT');
    });
    (0, node_test_1.default)('returns foundationContracts array', () => {
        const mockService = {
            getBootstrap: () => ({
                tenantPortal: {},
                brandPortal: {},
                storePortal: {},
                marketProfile: {},
                regionalOverrides: [],
                foundationDependencies: [],
                foundationContracts: ['portal-page:v1', 'portal-theme:v1']
            })
        };
        const controller = new portal_controller_1.PortalController(mockService);
        const ctx = { tenantId: 't-contracts' };
        const result = controller.getBootstrap(ctx);
        strict_1.default.ok(Array.isArray(result.foundationContracts));
        strict_1.default.deepStrictEqual(result.foundationContracts, ['portal-page:v1', 'portal-theme:v1']);
    });
});
// ---- error / negative path ----
(0, node_test_1.describe)('getBootstrap() – negative cases', () => {
    (0, node_test_1.default)('throws when service.getBootstrap throws', () => {
        const mockService = {
            getBootstrap: () => {
                throw new Error('Market not found for context');
            }
        };
        const controller = new portal_controller_1.PortalController(mockService);
        const ctx = { tenantId: 't-bad-market', marketCode: 'xx-invalid' };
        strict_1.default.throws(() => controller.getBootstrap(ctx), /Market not found/);
    });
    (0, node_test_1.default)('does not mutate input tenantContext reference', () => {
        const original = Object.freeze({
            tenantId: 't-immutable',
            brandId: 'b-immutable'
        });
        const mockService = {
            getBootstrap: () => ({
                tenantPortal: {},
                brandPortal: {},
                storePortal: {},
                marketProfile: {},
                regionalOverrides: [],
                foundationDependencies: [],
                foundationContracts: []
            })
        };
        const controller = new portal_controller_1.PortalController(mockService);
        // Should not throw due to Object.freeze
        strict_1.default.doesNotThrow(() => controller.getBootstrap(original));
    });
});
// ---- new endpoints: getTenantPortal / getBrandPortal / getStorePortal ----
const independentCtx = {
    tenantId: 't-indep',
    brandId: 'b-indep',
    storeId: 's-indep',
    marketCode: 'cn-mainland'
};
(0, node_test_1.describe)('getTenantPortal() – happy path', () => {
    (0, node_test_1.default)('返回租户 ToB 门户信息', () => {
        const mockService = {
            resolveTenantPortal: (ctx) => ({
                audience: domain_1.PortalAudience.ToB,
                scopeType: domain_1.PortalScopeType.Tenant,
                scopeCode: ctx.tenantId,
                tenantCode: ctx.tenantId,
                marketCode: 'cn-mainland',
                channel: domain_1.PortalChannel.Web,
                name: `${ctx.tenantId} ToB 官网`,
                primaryDomain: `${ctx.tenantId}.cn-mainland.b2b.local`,
                supportedLanguages: [domain_1.LanguageCode.ZhCn],
                heroTitle: `${ctx.tenantId} 企业级经营门户`,
                loginEntry: { label: '进入租户后台', loginPath: '/login', ssoEnabled: true }
            })
        };
        const ctrl = new portal_controller_1.PortalController(mockService);
        const result = ctrl.getTenantPortal(independentCtx);
        strict_1.default.equal(result.audience, domain_1.PortalAudience.ToB);
        strict_1.default.equal(result.scopeType, domain_1.PortalScopeType.Tenant);
        strict_1.default.equal(result.scopeCode, 't-indep');
        strict_1.default.ok(result.loginEntry.ssoEnabled);
    });
    (0, node_test_1.default)('租户门户不包含 brandCode / storeCode', () => {
        const mockService = {
            resolveTenantPortal: (ctx) => ({
                audience: domain_1.PortalAudience.ToB,
                scopeType: domain_1.PortalScopeType.Tenant,
                scopeCode: ctx.tenantId,
                tenantCode: ctx.tenantId,
                marketCode: 'cn-mainland',
                channel: domain_1.PortalChannel.Web,
                name: '租户官网',
                primaryDomain: 't.local',
                supportedLanguages: [domain_1.LanguageCode.ZhCn],
                loginEntry: { label: '登录', loginPath: '/login', ssoEnabled: true }
            })
        };
        const ctrl = new portal_controller_1.PortalController(mockService);
        const result = ctrl.getTenantPortal(independentCtx);
        strict_1.default.equal(result.brandCode, undefined);
        strict_1.default.equal(result.storeCode, undefined);
    });
});
(0, node_test_1.describe)('getBrandPortal() – happy path', () => {
    (0, node_test_1.default)('返回品牌 ToB 门户信息', () => {
        const mockService = {
            resolveBrandPortal: (ctx) => ({
                audience: domain_1.PortalAudience.ToB,
                scopeType: domain_1.PortalScopeType.Brand,
                scopeCode: ctx.brandId,
                tenantCode: ctx.tenantId,
                brandCode: ctx.brandId,
                marketCode: 'cn-mainland',
                channel: domain_1.PortalChannel.Web,
                name: `${ctx.brandId} 品牌官网`,
                primaryDomain: `${ctx.brandId}.local`,
                supportedLanguages: [domain_1.LanguageCode.ZhCn],
                heroTitle: '品牌经营门户',
                loginEntry: { label: '进入品牌后台', loginPath: '/brand/login', ssoEnabled: true }
            })
        };
        const ctrl = new portal_controller_1.PortalController(mockService);
        const result = ctrl.getBrandPortal(independentCtx);
        strict_1.default.equal(result.audience, domain_1.PortalAudience.ToB);
        strict_1.default.equal(result.scopeType, domain_1.PortalScopeType.Brand);
        strict_1.default.equal(result.brandCode, 'b-indep');
    });
    (0, node_test_1.default)('品牌门户 heroTitle 非空', () => {
        const mockService = {
            resolveBrandPortal: () => ({
                audience: domain_1.PortalAudience.ToB,
                scopeType: domain_1.PortalScopeType.Brand,
                scopeCode: 'b-1',
                tenantCode: 't-1',
                brandCode: 'b-1',
                marketCode: 'cn-mainland',
                channel: domain_1.PortalChannel.Web,
                name: '品牌官网',
                primaryDomain: 'b.local',
                supportedLanguages: [domain_1.LanguageCode.ZhCn],
                heroTitle: '品牌经营官网',
                loginEntry: { label: '进入品牌后台', loginPath: '/login', ssoEnabled: true }
            })
        };
        const ctrl = new portal_controller_1.PortalController(mockService);
        const result = ctrl.getBrandPortal(independentCtx);
        strict_1.default.ok(result.heroTitle);
        strict_1.default.ok(result.heroTitle.length > 0);
    });
});
(0, node_test_1.describe)('getStorePortal() – happy path', () => {
    (0, node_test_1.default)('返回门店 ToC 门户信息', () => {
        const mockService = {
            resolveStorePortal: (ctx) => ({
                audience: domain_1.PortalAudience.ToC,
                scopeType: domain_1.PortalScopeType.Store,
                scopeCode: ctx.storeId,
                tenantCode: ctx.tenantId,
                brandCode: ctx.brandId,
                storeCode: ctx.storeId,
                storeName: `${ctx.storeId} 门店`,
                marketCode: 'cn-mainland',
                channel: domain_1.PortalChannel.Web,
                name: `${ctx.storeId} 门店门户`,
                primaryDomain: `${ctx.storeId}.local`,
                supportedLanguages: [domain_1.LanguageCode.ZhCn],
                supportedSurfaces: [domain_1.StorefrontSurface.OfficialSite, domain_1.StorefrontSurface.MiniApp]
            })
        };
        const ctrl = new portal_controller_1.PortalController(mockService);
        const result = ctrl.getStorePortal(independentCtx);
        strict_1.default.equal(result.audience, domain_1.PortalAudience.ToC);
        strict_1.default.equal(result.scopeType, domain_1.PortalScopeType.Store);
        strict_1.default.equal(result.storeCode, 's-indep');
        strict_1.default.ok(result.storeName);
    });
    (0, node_test_1.default)('门店门户含 supportedSurfaces', () => {
        const mockService = {
            resolveStorePortal: () => ({
                audience: domain_1.PortalAudience.ToC,
                scopeType: domain_1.PortalScopeType.Store,
                scopeCode: 's-1',
                tenantCode: 't-1',
                brandCode: 'b-1',
                storeCode: 's-1',
                storeName: '测试门店',
                marketCode: 'cn-mainland',
                channel: domain_1.PortalChannel.Web,
                name: '门店门户',
                primaryDomain: 's.local',
                supportedLanguages: [domain_1.LanguageCode.ZhCn],
                supportedSurfaces: [
                    domain_1.StorefrontSurface.OfficialSite,
                    domain_1.StorefrontSurface.H5,
                    domain_1.StorefrontSurface.MiniApp
                ]
            })
        };
        const ctrl = new portal_controller_1.PortalController(mockService);
        const result = ctrl.getStorePortal(independentCtx);
        strict_1.default.ok(Array.isArray(result.supportedSurfaces));
        strict_1.default.ok(result.supportedSurfaces.length >= 3);
        strict_1.default.ok(result.supportedSurfaces.includes(domain_1.StorefrontSurface.MiniApp));
    });
});
// ---- new endpoints: boundary / negative cases ----
(0, node_test_1.describe)('新 endpoint – 边界和错误场景', () => {
    (0, node_test_1.default)('getTenantPortal 在 service 抛出时向上传播', () => {
        const mockService = {
            resolveTenantPortal: () => { throw new Error('Tenant not found'); }
        };
        const ctrl = new portal_controller_1.PortalController(mockService);
        strict_1.default.throws(() => ctrl.getTenantPortal(independentCtx), /Tenant not found/);
    });
    (0, node_test_1.default)('getBrandPortal 在缺少 brandId 时仍正常工作（由 service 兜底）', () => {
        const mockService = {
            resolveBrandPortal: (ctx) => ({
                audience: domain_1.PortalAudience.ToB,
                scopeType: domain_1.PortalScopeType.Brand,
                scopeCode: ctx.brandId ?? 'brand-demo',
                tenantCode: ctx.tenantId,
                brandCode: ctx.brandId ?? 'brand-demo',
                marketCode: 'cn-mainland',
                channel: domain_1.PortalChannel.Web,
                name: '品牌官网',
                primaryDomain: 'b.local',
                supportedLanguages: [domain_1.LanguageCode.ZhCn],
                loginEntry: { label: '进入品牌后台', loginPath: '/login', ssoEnabled: true }
            })
        };
        const ctrl = new portal_controller_1.PortalController(mockService);
        const ctxNoBrand = { tenantId: 't-nobrand' };
        const result = ctrl.getBrandPortal(ctxNoBrand);
        strict_1.default.equal(result.brandCode, 'brand-demo');
    });
    (0, node_test_1.default)('getStorePortal 国际化市场返回英文', () => {
        const mockService = {
            resolveStorePortal: () => ({
                audience: domain_1.PortalAudience.ToC,
                scopeType: domain_1.PortalScopeType.Store,
                scopeCode: 's-us',
                tenantCode: 't-us',
                brandCode: 'b-us',
                storeCode: 's-us',
                storeName: 'US Store',
                marketCode: 'us-default',
                channel: domain_1.PortalChannel.Web,
                name: 'US Store Portal',
                primaryDomain: 's-us.local',
                supportedLanguages: [domain_1.LanguageCode.EnUs],
                supportedSurfaces: [domain_1.StorefrontSurface.OfficialSite]
            })
        };
        const ctrl = new portal_controller_1.PortalController(mockService);
        const ctxUS = { tenantId: 't-us', marketCode: 'us-default' };
        const result = ctrl.getStorePortal(ctxUS);
        strict_1.default.equal(result.supportedLanguages[0], domain_1.LanguageCode.EnUs);
        strict_1.default.equal(result.marketCode, 'us-default');
    });
});
//# sourceMappingURL=portal.controller.test.js.map