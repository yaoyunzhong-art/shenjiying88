"use strict";
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
const contract_assertions_1 = require("../../testing/contract-assertions");
const bootstrap_fixtures_1 = require("../../testing/bootstrap-fixtures");
const market_service_1 = require("../market/market.service");
const portal_service_1 = require("../portal/portal.service");
const workbench_service_1 = require("../workbench/workbench.service");
function attachRequestContext(req) {
    const context = (0, bootstrap_fixtures_1.createResolvedTenantContextFixture)();
    req.tenantContext = {
        tenantId: req.header('x-tenant-id') ?? context.tenantId,
        brandId: req.header('x-brand-id') ?? context.brandId,
        storeId: req.header('x-store-id') ?? context.storeId,
        marketCode: req.header('x-market-code') ?? context.marketCode
    };
}
let TestMarketController = class TestMarketController {
    marketService;
    constructor(marketService) {
        this.marketService = marketService;
    }
    getBootstrap() {
        return this.marketService.getBootstrap();
    }
};
__decorate([
    (0, common_1.Get)('bootstrap'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TestMarketController.prototype, "getBootstrap", null);
TestMarketController = __decorate([
    (0, common_1.Controller)('markets'),
    __param(0, (0, common_1.Inject)(market_service_1.MarketService)),
    __metadata("design:paramtypes", [market_service_1.MarketService])
], TestMarketController);
let TestPortalController = class TestPortalController {
    portalService;
    constructor(portalService) {
        this.portalService = portalService;
    }
    getBootstrap(req) {
        return this.portalService.getBootstrap(req.tenantContext);
    }
};
__decorate([
    (0, common_1.Get)('bootstrap'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TestPortalController.prototype, "getBootstrap", null);
TestPortalController = __decorate([
    (0, common_1.Controller)('portals'),
    __param(0, (0, common_1.Inject)(portal_service_1.PortalService)),
    __metadata("design:paramtypes", [portal_service_1.PortalService])
], TestPortalController);
let TestWorkbenchController = class TestWorkbenchController {
    workbenchService;
    constructor(workbenchService) {
        this.workbenchService = workbenchService;
    }
    getBootstrap(req) {
        return this.workbenchService.getBootstrap(req.tenantContext);
    }
};
__decorate([
    (0, common_1.Get)('bootstrap'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TestWorkbenchController.prototype, "getBootstrap", null);
TestWorkbenchController = __decorate([
    (0, common_1.Controller)('workbenches'),
    __param(0, (0, common_1.Inject)(workbench_service_1.WorkbenchService)),
    __metadata("design:paramtypes", [workbench_service_1.WorkbenchService])
], TestWorkbenchController);
(0, node_test_1.default)('e2e: bootstrap consumers expose stable api result envelopes', async () => {
    const moduleRef = await testing_1.Test.createTestingModule({
        controllers: [TestMarketController, TestPortalController, TestWorkbenchController],
        providers: [
            {
                provide: 'FoundationService',
                useValue: {
                    getDependencySummary: () => (0, bootstrap_fixtures_1.createE2EFoundationDependencySummary)()
                }
            },
            {
                provide: market_service_1.MarketService,
                useFactory: (foundationService) => new market_service_1.MarketService(foundationService),
                inject: ['FoundationService']
            },
            {
                provide: portal_service_1.PortalService,
                useFactory: (marketService, foundationService) => new portal_service_1.PortalService(marketService, foundationService),
                inject: [market_service_1.MarketService, 'FoundationService']
            },
            {
                provide: 'RuntimeGovernanceService',
                useValue: {}
            },
            {
                provide: workbench_service_1.WorkbenchService,
                useFactory: (marketService, portalService, foundationService, runtimeGovernanceService) => new workbench_service_1.WorkbenchService(marketService, portalService, foundationService, runtimeGovernanceService),
                inject: [market_service_1.MarketService, portal_service_1.PortalService, 'FoundationService', 'RuntimeGovernanceService']
            }
        ]
    }).compile();
    const app = moduleRef.createNestApplication();
    app.use((req, _res, next) => {
        attachRequestContext(req);
        next();
    });
    app.useGlobalInterceptors(new response_interceptor_1.ResponseInterceptor());
    await app.init();
    try {
        const markets = await (0, supertest_1.default)(app.getHttpServer()).get('/markets/bootstrap');
        strict_1.default.equal(markets.statusCode, 200);
        (0, contract_assertions_1.assertExactKeys)(markets.body, ['success', 'message', 'data', 'timestamp']);
        strict_1.default.equal(markets.body.message, 'OK');
        (0, contract_assertions_1.assertExactKeys)(markets.body.data, [
            'defaultDomesticMarketCode',
            'defaultInternationalMarketCode',
            'supportedMarkets',
            'foundationDependencies',
            'foundationContracts'
        ]);
        strict_1.default.equal(Array.isArray(markets.body.data.supportedMarkets), true);
        strict_1.default.equal(markets.body.data.supportedMarkets.length, 2);
        strict_1.default.deepEqual(markets.body.data.foundationDependencies, [
            'identity-access',
            'configuration-governance'
        ]);
        strict_1.default.deepEqual(markets.body.data.foundationContracts, ['@m5/types']);
        strict_1.default.deepEqual(markets.body.data.supportedMarkets.map((market) => market.marketCode), ['cn-mainland', 'us-default']);
        for (const market of markets.body.data.supportedMarkets) {
            (0, contract_assertions_1.assertExactKeys)(market, [
                'marketCode',
                'marketName',
                'countryCode',
                'locale',
                'timezone',
                'currency',
                'tax',
                'network',
                'email',
                'social'
            ]);
            (0, contract_assertions_1.assertExactKeys)(market.tax, ['taxMode', 'taxRate', 'taxLabel']);
            strict_1.default.equal(typeof market.tax.taxRate, 'number');
            (0, contract_assertions_1.assertExactKeys)(market.network, ['networkRegion', 'apiBaseUrl', 'cdnBaseUrl', 'callbackBaseUrl']);
            strict_1.default.equal(typeof market.network.callbackBaseUrl, 'string');
            (0, contract_assertions_1.assertExactKeys)(market.email, ['provider', 'fromName', 'fromAddress', 'replyTo']);
            strict_1.default.equal(typeof market.email.replyTo, 'string');
        }
        const portals = await (0, supertest_1.default)(app.getHttpServer()).get('/portals/bootstrap');
        strict_1.default.equal(portals.statusCode, 200);
        (0, contract_assertions_1.assertExactKeys)(portals.body, ['success', 'message', 'data', 'timestamp']);
        strict_1.default.equal(portals.body.message, 'OK');
        (0, contract_assertions_1.assertExactKeys)(portals.body.data, [
            'tenantPortal',
            'brandPortal',
            'storePortal',
            'marketProfile',
            'regionalOverrides',
            'foundationDependencies',
            'foundationContracts'
        ]);
        (0, contract_assertions_1.assertExactKeys)(portals.body.data.tenantPortal.loginEntry, ['label', 'loginPath', 'ssoEnabled']);
        strict_1.default.equal(typeof portals.body.data.tenantPortal.primaryDomain, 'string');
        strict_1.default.equal(typeof portals.body.data.storePortal.primaryDomain, 'string');
        strict_1.default.equal(Array.isArray(portals.body.data.regionalOverrides), true);
        strict_1.default.deepEqual(portals.body.data.foundationDependencies, [
            'identity-access',
            'configuration-governance'
        ]);
        strict_1.default.deepEqual(portals.body.data.foundationContracts, ['@m5/types']);
        (0, contract_assertions_1.assertExactKeys)(portals.body.data.regionalOverrides[0], ['scopeType', 'scopeCode', 'inheritanceMode', 'marketCode', 'email']);
        (0, contract_assertions_1.assertExactKeys)(portals.body.data.regionalOverrides[0].email, ['fromName']);
        (0, contract_assertions_1.assertExactKeys)(portals.body.data.marketProfile.tax, ['taxMode', 'taxRate', 'taxLabel']);
        (0, contract_assertions_1.assertExactKeys)(portals.body.data.marketProfile.network, ['networkRegion', 'apiBaseUrl', 'cdnBaseUrl', 'callbackBaseUrl']);
        (0, contract_assertions_1.assertExactKeys)(portals.body.data.marketProfile.email, ['provider', 'fromName', 'fromAddress', 'replyTo']);
        const workbenches = await (0, supertest_1.default)(app.getHttpServer()).get('/workbenches/bootstrap');
        strict_1.default.equal(workbenches.statusCode, 200);
        (0, contract_assertions_1.assertExactKeys)(workbenches.body, ['success', 'message', 'data', 'timestamp']);
        strict_1.default.equal(workbenches.body.message, 'OK');
        (0, contract_assertions_1.assertExactKeys)(workbenches.body.data, [
            'tenantContext',
            'workbenches',
            'storePortals',
            'tenantPortal',
            'brandPortal',
            'marketProfile',
            'regionalLoginPolicies',
            'supportedLocales',
            'supportedClients',
            'foundationDependencies',
            'foundationContracts'
        ]);
        (0, contract_assertions_1.assertExactKeys)(workbenches.body.data.tenantContext, ['tenantId', 'brandId', 'storeId', 'marketCode']);
        (0, contract_assertions_1.assertExactKeys)(workbenches.body.data.regionalLoginPolicies, ['defaultLoginPath', 'ssoEnabled']);
        strict_1.default.deepEqual(workbenches.body.data.supportedLocales, ['zh-CN']);
        strict_1.default.deepEqual(workbenches.body.data.supportedClients, (0, bootstrap_fixtures_1.createSupportedClientsFixture)());
        strict_1.default.deepEqual(workbenches.body.data.foundationDependencies, [
            'identity-access',
            'configuration-governance'
        ]);
        strict_1.default.deepEqual(workbenches.body.data.foundationContracts, ['@m5/types']);
        strict_1.default.deepEqual(workbenches.body.data.regionalLoginPolicies, {
            defaultLoginPath: '/cn-mainland/tenant-demo/login',
            ssoEnabled: true
        });
        strict_1.default.equal(workbenches.body.data.workbenches.length, 10);
        strict_1.default.deepEqual(workbenches.body.data.workbenches.map((workbench) => workbench.role), [
            'SUPER_ADMIN',
            'TENANT_ADMIN',
            'BRAND_MANAGER',
            'STORE_MANAGER',
            'GUIDE',
            'CASHIER',
            'OPERATIONS',
            'FINANCE',
            'WAREHOUSE',
            'COACH'
        ]);
        for (const workbench of workbenches.body.data.workbenches) {
            (0, contract_assertions_1.assertExactKeys)(workbench, ['role', 'channel', 'title', 'description', 'marketCodes', 'navItems']);
            strict_1.default.equal(Array.isArray(workbench.marketCodes), true);
            strict_1.default.equal(Array.isArray(workbench.navItems), true);
            strict_1.default.equal(workbench.navItems.length > 0, true);
            (0, contract_assertions_1.assertExactKeys)(workbench.navItems[0], ['key', 'label', 'href', 'description']);
        }
        (0, contract_assertions_1.assertExactKeys)(workbenches.body.data.marketProfile.tax, ['taxMode', 'taxRate', 'taxLabel']);
        (0, contract_assertions_1.assertExactKeys)(workbenches.body.data.marketProfile.network, ['networkRegion', 'apiBaseUrl', 'cdnBaseUrl', 'callbackBaseUrl']);
        (0, contract_assertions_1.assertExactKeys)(workbenches.body.data.marketProfile.email, ['provider', 'fromName', 'fromAddress', 'replyTo']);
    }
    finally {
        await app.close();
    }
});
async function buildBootstrapApp() {
    const moduleRef = await testing_1.Test.createTestingModule({
        controllers: [TestMarketController, TestPortalController, TestWorkbenchController],
        providers: [
            { provide: 'FoundationService', useValue: { getDependencySummary: () => (0, bootstrap_fixtures_1.createE2EFoundationDependencySummary)() } },
            {
                provide: market_service_1.MarketService,
                useFactory: (foundationService) => new market_service_1.MarketService(foundationService),
                inject: ['FoundationService']
            },
            {
                provide: portal_service_1.PortalService,
                useFactory: (marketService, foundationService) => new portal_service_1.PortalService(marketService, foundationService),
                inject: [market_service_1.MarketService, 'FoundationService']
            },
            { provide: 'RuntimeGovernanceService', useValue: {} },
            {
                provide: workbench_service_1.WorkbenchService,
                useFactory: (marketService, portalService, foundationService, runtimeGovernanceService) => new workbench_service_1.WorkbenchService(marketService, portalService, foundationService, runtimeGovernanceService),
                inject: [market_service_1.MarketService, portal_service_1.PortalService, 'FoundationService', 'RuntimeGovernanceService']
            }
        ]
    }).compile();
    const app = moduleRef.createNestApplication();
    app.use((req, _res, next) => {
        attachRequestContext(req);
        next();
    });
    app.useGlobalInterceptors(new response_interceptor_1.ResponseInterceptor());
    await app.init();
    return app;
}
(0, node_test_1.default)('e2e: markets bootstrap returns exactly 2 supported markets with cn-mainland first', async () => {
    const app = await buildBootstrapApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer()).get('/markets/bootstrap');
        strict_1.default.equal(res.statusCode, 200);
        strict_1.default.equal(res.body.data.supportedMarkets.length, 2);
        strict_1.default.equal(res.body.data.supportedMarkets[0].marketCode, 'cn-mainland');
        strict_1.default.equal(res.body.data.supportedMarkets[1].marketCode, 'us-default');
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: markets bootstrap defaults match cn-mainland + us-default pair', async () => {
    const app = await buildBootstrapApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer()).get('/markets/bootstrap');
        strict_1.default.equal(res.body.data.defaultDomesticMarketCode, 'cn-mainland');
        strict_1.default.equal(res.body.data.defaultInternationalMarketCode, 'us-default');
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: portal bootstrap returns tenantPortal with login entry', async () => {
    const app = await buildBootstrapApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer()).get('/portals/bootstrap');
        strict_1.default.equal(res.statusCode, 200);
        strict_1.default.ok(res.body.data.tenantPortal);
        strict_1.default.ok(res.body.data.tenantPortal.loginEntry);
        strict_1.default.equal(typeof res.body.data.tenantPortal.loginEntry.loginPath, 'string');
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: workbench bootstrap returns 10 roles sorted in order', async () => {
    const app = await buildBootstrapApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer()).get('/workbenches/bootstrap');
        const roles = res.body.data.workbenches.map((w) => w.role);
        strict_1.default.deepEqual(roles, [
            'SUPER_ADMIN',
            'TENANT_ADMIN',
            'BRAND_MANAGER',
            'STORE_MANAGER',
            'GUIDE',
            'CASHIER',
            'OPERATIONS',
            'FINANCE',
            'WAREHOUSE',
            'COACH'
        ]);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: portal bootstrap supports x-market-code override', async () => {
    const app = await buildBootstrapApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .get('/portals/bootstrap')
            .set('x-market-code', 'us-default');
        strict_1.default.equal(res.statusCode, 200);
        strict_1.default.ok(res.body.data.marketProfile);
        strict_1.default.equal(res.body.data.marketProfile.countryCode, 'US');
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: workbench bootstrap respects x-tenant-id in tenantContext echo', async () => {
    const app = await buildBootstrapApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .get('/workbenches/bootstrap')
            .set('x-tenant-id', 'tenant-zzz');
        strict_1.default.equal(res.body.data.tenantContext.tenantId, 'tenant-zzz');
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: market bootstrap returns same payload on second call (idempotency)', async () => {
    const app = await buildBootstrapApp();
    try {
        const first = await (0, supertest_1.default)(app.getHttpServer()).get('/markets/bootstrap');
        const second = await (0, supertest_1.default)(app.getHttpServer()).get('/markets/bootstrap');
        strict_1.default.equal(first.statusCode, 200);
        strict_1.default.equal(second.statusCode, 200);
        strict_1.default.deepEqual(first.body.data, second.body.data);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: workbench bootstrap regionalLoginPolicies defaultLoginPath follows market/tenant pattern', async () => {
    const app = await buildBootstrapApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .get('/workbenches/bootstrap')
            .set('x-market-code', 'us-default')
            .set('x-tenant-id', 'tenant-alpha');
        strict_1.default.equal(res.body.data.regionalLoginPolicies.defaultLoginPath, '/us-default/tenant-alpha/login');
        strict_1.default.equal(res.body.data.regionalLoginPolicies.ssoEnabled, true);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: workbench bootstrap supportedClients is exactly 5 channels', async () => {
    const app = await buildBootstrapApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer()).get('/workbenches/bootstrap');
        strict_1.default.equal(res.body.data.supportedClients.length, 5);
        strict_1.default.deepEqual(res.body.data.supportedClients, (0, bootstrap_fixtures_1.createSupportedClientsFixture)());
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: workbench bootstrap workbenches each have marketCodes array', async () => {
    const app = await buildBootstrapApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer()).get('/workbenches/bootstrap');
        for (const wb of res.body.data.workbenches) {
            strict_1.default.ok(Array.isArray(wb.marketCodes), `${wb.role} must have marketCodes array`);
            strict_1.default.ok(wb.marketCodes.length >= 1, `${wb.role} must support at least 1 market`);
        }
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: portal bootstrap market profile inherits from x-market-code header', async () => {
    const app = await buildBootstrapApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .get('/portals/bootstrap')
            .set('x-market-code', 'cn-mainland');
        strict_1.default.equal(res.body.data.marketProfile.marketCode, 'cn-mainland');
        strict_1.default.equal(res.body.data.marketProfile.locale.defaultLanguage, 'zh-CN');
    }
    finally {
        await app.close();
    }
});
//# sourceMappingURL=bootstrap-consumers.e2e.test.js.map