"use strict";
/**
 * E2E: Portal 门户管理 HTTP 链路
 *
 * 链路:
 *   HTTP → TestController → PortalService → FoundationService + MarketService
 *
 * 验证:
 *   - portal bootstrap 返回 tenant/brand/store 三个 scope 视图
 *   - 含市场画像 + 区域覆盖 + foundation 依赖
 *   - 跨租户 / 跨市场时差异
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const common_1 = require("@nestjs/common");
const testing_1 = require("@nestjs/testing");
const supertest_1 = __importDefault(require("supertest"));
const response_interceptor_1 = require("../../common/interceptors/response.interceptor");
const portal_service_1 = require("./portal.service");
const market_service_1 = require("../market/market.service");
const foundation_service_1 = require("../foundation/foundation.service");
function attachTenantContext(req, _res, next) {
    const ctx = req;
    ctx.tenantContext = {
        tenantId: req.header('x-tenant-id') ?? 'tenant-001',
        brandId: req.header('x-brand-id') ?? 'brand-001',
        storeId: req.header('x-store-id') ?? 'store-001',
        marketCode: req.header('x-market-code') ?? 'cn-mainland'
    };
    next();
}
let TestPortalController = class TestPortalController {
    portalService;
    constructor(portalService) {
        this.portalService = portalService;
    }
    bootstrap(req) {
        const ctx = req.tenantContext;
        return this.portalService.getBootstrap(ctx);
    }
};
__decorate([
    (0, common_1.Get)('bootstrap'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TestPortalController.prototype, "bootstrap", null);
TestPortalController = __decorate([
    (0, common_1.Controller)('portal'),
    __param(0, (0, common_1.Inject)(portal_service_1.PortalService)),
    __metadata("design:paramtypes", [portal_service_1.PortalService])
], TestPortalController);
async function buildApp() {
    // Create a minimal FoundationService-compatible mock to avoid 7-arg constructor
    const foundationService = {
        getModuleCatalog: () => [],
        getConsumerCatalog: () => [],
        getIdentityAccess: () => ({}),
        getConfigurationGovernance: () => ({}),
        getIntegrationOrchestration: () => ({}),
        getTrustGovernance: () => ({}),
        getResilienceOperations: () => ({}),
        getRuntimeGovernance: () => ({}),
        // foundation bootstrap contract needs these
        getGovernanceBaseline: () => ({}),
        getBlueprint: () => ({}),
        getDependencySummary: () => ({ dependsOn: ['identity-access', 'configuration-governance'], handoffContracts: [] })
    };
    const marketService = new market_service_1.MarketService(foundationService);
    const portalService = new portal_service_1.PortalService(marketService, foundationService);
    const moduleRef = await testing_1.Test.createTestingModule({
        controllers: [TestPortalController],
        providers: [
            { provide: portal_service_1.PortalService, useValue: portalService },
            { provide: market_service_1.MarketService, useValue: marketService },
            { provide: foundation_service_1.FoundationService, useValue: foundationService }
        ]
    }).compile();
    const app = moduleRef.createNestApplication();
    app.use(attachTenantContext);
    app.useGlobalInterceptors(new response_interceptor_1.ResponseInterceptor());
    await app.init();
    return { app, portalService };
}
const TENANT_CN = {
    'x-tenant-id': 'tenant-cn',
    'x-brand-id': 'brand-cn',
    'x-store-id': 'store-cn',
    'x-market-code': 'cn-mainland'
};
const TENANT_US = {
    'x-tenant-id': 'tenant-us',
    'x-brand-id': 'brand-us',
    'x-store-id': 'store-us',
    'x-market-code': 'us-default'
};
(0, node_test_1.default)('e2e: portal bootstrap returns three scope portals', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer()).get('/portal/bootstrap').set(TENANT_CN);
        strict_1.default.equal(res.statusCode, 200);
        const data = res.body.data;
        strict_1.default.ok(data.tenantPortal);
        strict_1.default.ok(data.brandPortal);
        strict_1.default.ok(data.storePortal);
        strict_1.default.ok(data.marketProfile);
        strict_1.default.ok(Array.isArray(data.regionalOverrides));
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: tenant portal has scopeCode from headers', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer()).get('/portal/bootstrap').set(TENANT_CN);
        strict_1.default.equal(res.body.data.tenantPortal.scopeCode, 'tenant-cn');
        strict_1.default.equal(res.body.data.brandPortal.scopeCode, 'brand-cn');
        strict_1.default.equal(res.body.data.storePortal.scopeCode, 'store-cn');
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: marketProfile embedded in portal bootstrap', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer()).get('/portal/bootstrap').set(TENANT_CN);
        strict_1.default.equal(res.body.data.marketProfile.marketCode, 'cn-mainland');
        strict_1.default.equal(res.body.data.marketProfile.timezone.timezone, 'Asia/Shanghai');
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: US tenant portal uses LA timezone', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer()).get('/portal/bootstrap').set(TENANT_US);
        strict_1.default.equal(res.body.data.marketProfile.timezone.timezone, 'America/Los_Angeles');
        strict_1.default.equal(res.body.data.tenantPortal.scopeCode, 'tenant-us');
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: regionalOverrides contain all 3 scope types', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer()).get('/portal/bootstrap').set(TENANT_CN);
        const scopeTypes = res.body.data.regionalOverrides.map((o) => o.scopeType);
        strict_1.default.ok(scopeTypes.includes('TENANT'));
        strict_1.default.ok(scopeTypes.includes('BRAND'));
        strict_1.default.ok(scopeTypes.includes('STORE'));
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: portal bootstrap contains foundation dependency', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer()).get('/portal/bootstrap').set(TENANT_CN);
        strict_1.default.ok(Array.isArray(res.body.data.foundationDependencies));
        strict_1.default.ok(res.body.data.foundationDependencies.length >= 1);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: default headers produce tenant-001', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer()).get('/portal/bootstrap');
        strict_1.default.equal(res.statusCode, 200);
        strict_1.default.equal(res.body.data.tenantPortal.scopeCode, 'tenant-001');
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: portal identifiers vary across tenants', async () => {
    const { app } = await buildApp();
    try {
        const a = await (0, supertest_1.default)(app.getHttpServer()).get('/portal/bootstrap').set(TENANT_CN);
        const b = await (0, supertest_1.default)(app.getHttpServer()).get('/portal/bootstrap').set(TENANT_US);
        strict_1.default.notEqual(a.body.data.tenantPortal.scopeCode, b.body.data.tenantPortal.scopeCode);
        strict_1.default.notEqual(a.body.data.marketProfile.marketCode, b.body.data.marketProfile.marketCode);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: portal heroTitle and brand code are derived from tenant context', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer()).get('/portal/bootstrap').set(TENANT_CN);
        strict_1.default.equal(res.body.data.brandPortal.brandCode, 'brand-cn');
        strict_1.default.equal(res.body.data.brandPortal.tenantCode, 'tenant-cn');
        strict_1.default.ok(res.body.data.tenantPortal.heroTitle.includes('tenant-cn'));
        strict_1.default.ok(res.body.data.brandPortal.heroTitle.includes('brand-cn'));
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: portal store portal surfaces cover all 6 storefront surfaces', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer()).get('/portal/bootstrap').set(TENANT_CN);
        const surfaces = res.body.data.storePortal.supportedSurfaces;
        strict_1.default.ok(Array.isArray(surfaces));
        strict_1.default.ok(surfaces.length >= 6);
        strict_1.default.ok(surfaces.includes('OFFICIAL_SITE'));
        strict_1.default.ok(surfaces.includes('H5'));
        strict_1.default.ok(surfaces.includes('MINIAPP'));
        strict_1.default.ok(surfaces.includes('APP'));
        strict_1.default.ok(surfaces.includes('PC_CONSOLE'));
        strict_1.default.ok(surfaces.includes('PAD_CONSOLE'));
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: portal supportedLanguages differ for cn vs us markets', async () => {
    const { app } = await buildApp();
    try {
        const cn = await (0, supertest_1.default)(app.getHttpServer()).get('/portal/bootstrap').set(TENANT_CN);
        const us = await (0, supertest_1.default)(app.getHttpServer()).get('/portal/bootstrap').set(TENANT_US);
        // Tenant portal: inherits full locale list per market
        strict_1.default.ok(cn.body.data.tenantPortal.supportedLanguages.includes('zh-CN'));
        strict_1.default.ok(us.body.data.tenantPortal.supportedLanguages.includes('en-US'));
        // Store portal: zh-CN only for cn, en-US only for us
        strict_1.default.deepEqual(cn.body.data.storePortal.supportedLanguages, ['zh-CN']);
        strict_1.default.deepEqual(us.body.data.storePortal.supportedLanguages, ['en-US']);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: portal login paths follow marketCode/tenantId/brandId pattern', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer()).get('/portal/bootstrap').set(TENANT_CN);
        strict_1.default.equal(res.body.data.tenantPortal.loginEntry.loginPath, '/cn-mainland/tenant-cn/login');
        strict_1.default.equal(res.body.data.brandPortal.loginEntry.loginPath, '/cn-mainland/tenant-cn/brand-cn/login');
        strict_1.default.equal(res.body.data.tenantPortal.loginEntry.ssoEnabled, true);
        strict_1.default.equal(res.body.data.brandPortal.loginEntry.ssoEnabled, true);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: portal primaryDomain embeds scope code and market code', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer()).get('/portal/bootstrap').set(TENANT_CN);
        strict_1.default.match(res.body.data.tenantPortal.primaryDomain, /^tenant-cn\.cn-mainland\.b2b\.local$/);
        strict_1.default.match(res.body.data.brandPortal.primaryDomain, /^brand-cn\.tenant-cn\.cn-mainland\.b2b\.local$/);
        strict_1.default.match(res.body.data.storePortal.primaryDomain, /^store-cn\.brand-cn\.tenant-cn\.cn-mainland\.local$/);
    }
    finally {
        await app.close();
    }
});
//# sourceMappingURL=portal.e2e.test.js.map