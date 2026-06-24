"use strict";
/**
 * E2E: Workbench 工作台 HTTP 链路
 *
 * 链路:
 *   HTTP → TestController → WorkbenchService → MarketService + PortalService + FoundationService
 *
 * 验证:
 *   - bootstrap 返回 tenant/brand/store portal + market profile + role workbenches
 *   - getRoleWorkbenches 返回所有角色
 *   - checkCapability 按角色判断能力
 *   - 跨租户 / 跨市场差异
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
const workbench_service_1 = require("./workbench.service");
const market_service_1 = require("../market/market.service");
const portal_service_1 = require("../portal/portal.service");
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
let TestWorkbenchController = class TestWorkbenchController {
    workbench;
    constructor(workbench) {
        this.workbench = workbench;
    }
    bootstrap(req) {
        const ctx = req.tenantContext;
        return this.workbench.getBootstrap(ctx);
    }
    list() {
        return this.workbench.getRoleWorkbenches();
    }
    checkCapability(body) {
        return {
            result: this.workbench.checkCapability(body.role, body.capability)
        };
    }
};
__decorate([
    (0, common_1.Get)('bootstrap'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TestWorkbenchController.prototype, "bootstrap", null);
__decorate([
    (0, common_1.Get)('role-workbenches'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TestWorkbenchController.prototype, "list", null);
__decorate([
    (0, common_1.Post)('check-capability'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TestWorkbenchController.prototype, "checkCapability", null);
TestWorkbenchController = __decorate([
    (0, common_1.Controller)('workbench'),
    __param(0, (0, common_1.Inject)(workbench_service_1.WorkbenchService)),
    __metadata("design:paramtypes", [workbench_service_1.WorkbenchService])
], TestWorkbenchController);
async function buildApp() {
    const foundationService = {
        getModuleCatalog: () => [],
        getConsumerCatalog: () => [],
        getGovernanceBaseline: () => ({}),
        getBlueprint: () => ({}),
        getDependencySummary: () => ({ dependsOn: ['identity-access', 'configuration-governance'], handoffContracts: [] })
    };
    const marketService = new market_service_1.MarketService(foundationService);
    const portalService = new portal_service_1.PortalService(marketService, foundationService);
    // runtimeGovernanceService is only used for submit/sync/replay (not bootstrap), pass undefined
    const workbench = new workbench_service_1.WorkbenchService(marketService, portalService, foundationService, undefined);
    const moduleRef = await testing_1.Test.createTestingModule({
        controllers: [TestWorkbenchController],
        providers: [
            { provide: workbench_service_1.WorkbenchService, useValue: workbench },
            { provide: market_service_1.MarketService, useValue: marketService },
            { provide: portal_service_1.PortalService, useValue: portalService },
            { provide: foundation_service_1.FoundationService, useValue: foundationService }
        ]
    }).compile();
    const app = moduleRef.createNestApplication();
    app.use(attachTenantContext);
    app.useGlobalInterceptors(new response_interceptor_1.ResponseInterceptor());
    await app.init();
    return { app, workbench };
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
(0, node_test_1.default)('e2e: bootstrap returns workbenches + portals + market', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer()).get('/workbench/bootstrap').set(TENANT_CN);
        strict_1.default.equal(res.statusCode, 200);
        const data = res.body.data;
        strict_1.default.ok(data.tenantContext);
        strict_1.default.equal(data.tenantContext.tenantId, 'tenant-cn');
        strict_1.default.ok(Array.isArray(data.workbenches));
        strict_1.default.ok(data.workbenches.length >= 3);
        strict_1.default.ok(data.tenantPortal);
        strict_1.default.ok(data.brandPortal);
        strict_1.default.ok(Array.isArray(data.storePortals));
        strict_1.default.ok(data.marketProfile);
        strict_1.default.equal(data.marketProfile.marketCode, 'cn-mainland');
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: bootstrap supported clients list', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer()).get('/workbench/bootstrap').set(TENANT_CN);
        strict_1.default.ok(Array.isArray(res.body.data.supportedClients));
        strict_1.default.ok(res.body.data.supportedClients.length >= 4);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: bootstrap supported locales come from market profile', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer()).get('/workbench/bootstrap').set(TENANT_CN);
        strict_1.default.ok(Array.isArray(res.body.data.supportedLocales));
        strict_1.default.ok(res.body.data.supportedLocales.length >= 1);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: getRoleWorkbenches returns role list with nav items', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer()).get('/workbench/role-workbenches');
        strict_1.default.equal(res.statusCode, 200);
        strict_1.default.ok(Array.isArray(res.body.data));
        strict_1.default.ok(res.body.data.length >= 3);
        const superAdmin = res.body.data.find((w) => w.role === 'SUPER_ADMIN');
        strict_1.default.ok(superAdmin);
        strict_1.default.ok(Array.isArray(superAdmin.navItems));
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: checkCapability returns true for SUPER_ADMIN with tenant-management', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .post('/workbench/check-capability')
            .send({ role: 'SUPER_ADMIN', capability: 'tenant-management' });
        strict_1.default.equal(res.body.data.result, true);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: checkCapability returns false for unknown capability', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .post('/workbench/check-capability')
            .send({ role: 'OPERATIONS', capability: 'unknown:capability' });
        strict_1.default.equal(res.body.data.result, false);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: bootstrap marketProfile differs by tenant', async () => {
    const { app } = await buildApp();
    try {
        const cn = await (0, supertest_1.default)(app.getHttpServer()).get('/workbench/bootstrap').set(TENANT_CN);
        const us = await (0, supertest_1.default)(app.getHttpServer()).get('/workbench/bootstrap').set(TENANT_US);
        strict_1.default.equal(cn.body.data.marketProfile.timezone.timezone, 'Asia/Shanghai');
        strict_1.default.equal(us.body.data.marketProfile.timezone.timezone, 'America/Los_Angeles');
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: bootstrap tenantContext reflects request headers', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .get('/workbench/bootstrap')
            .set('x-tenant-id', 'tenant-X')
            .set('x-brand-id', 'brand-X')
            .set('x-store-id', 'store-X');
        strict_1.default.equal(res.body.data.tenantContext.tenantId, 'tenant-X');
        strict_1.default.equal(res.body.data.tenantContext.brandId, 'brand-X');
        strict_1.default.equal(res.body.data.tenantContext.storeId, 'store-X');
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: bootstrap workbenches array has SUPER_ADMIN + others', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer()).get('/workbench/bootstrap').set(TENANT_CN);
        const roles = res.body.data.workbenches.map((w) => w.role);
        strict_1.default.ok(roles.includes('SUPER_ADMIN'));
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: bootstrap foundationDependencies array is present', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer()).get('/workbench/bootstrap').set(TENANT_CN);
        strict_1.default.ok(Array.isArray(res.body.data.foundationDependencies));
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: role workbenches have role/channel/title', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer()).get('/workbench/role-workbenches');
        for (const wb of res.body.data) {
            strict_1.default.ok(wb.role, 'role must be set');
            strict_1.default.ok(wb.channel, 'channel must be set');
            strict_1.default.ok(wb.title, 'title must be set');
        }
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: bootstrap returns portalIdentifier derived from tenant', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer()).get('/workbench/bootstrap').set(TENANT_CN);
        strict_1.default.equal(res.body.data.tenantPortal.scopeCode, 'tenant-cn');
        strict_1.default.equal(res.body.data.brandPortal.scopeCode, 'brand-cn');
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: checkCapability returns true for GUIDE with promo-conversion', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .post('/workbench/check-capability')
            .send({ role: 'GUIDE', capability: 'promo-conversion' });
        strict_1.default.equal(res.body.data.result, true);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: checkCapability returns false for GUIDE with audit-center', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .post('/workbench/check-capability')
            .send({ role: 'GUIDE', capability: 'audit-center' });
        strict_1.default.equal(res.body.data.result, false);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: checkCapability returns false for CASHIER with tenant-management', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .post('/workbench/check-capability')
            .send({ role: 'CASHIER', capability: 'tenant-management' });
        strict_1.default.equal(res.body.data.result, false);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: checkCapability returns false for unknown role', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .post('/workbench/check-capability')
            .send({ role: 'NONEXISTENT_ROLE', capability: 'tenant-management' });
        strict_1.default.equal(res.body.data.result, false);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: bootstrap regionalLoginPolicies contains loginPath and ssoEnabled', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer()).get('/workbench/bootstrap').set(TENANT_CN);
        const policy = res.body.data.regionalLoginPolicies;
        strict_1.default.ok(policy);
        strict_1.default.ok(typeof policy.defaultLoginPath === 'string');
        strict_1.default.equal(policy.ssoEnabled, true);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: bootstrap workbenches have nav items with key, label, href', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer()).get('/workbench/bootstrap').set(TENANT_CN);
        const superAdmin = res.body.data.workbenches.find((w) => w.role === 'SUPER_ADMIN');
        strict_1.default.ok(superAdmin.navItems.length >= 3);
        for (const item of superAdmin.navItems) {
            strict_1.default.ok(item.key);
            strict_1.default.ok(item.label);
            strict_1.default.ok(item.href);
        }
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: bootstrap storePortals array contains one entry per request', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .get('/workbench/bootstrap')
            .set({ ...TENANT_CN, 'x-store-id': 'store-001' });
        strict_1.default.equal(res.body.data.storePortals.length, 1);
        strict_1.default.equal(res.body.data.storePortals[0].scopeCode, 'store-001');
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: supportedClients list includes core channels', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer()).get('/workbench/bootstrap').set(TENANT_CN);
        const clients = res.body.data.supportedClients;
        strict_1.default.ok(Array.isArray(clients));
        strict_1.default.ok(clients.length >= 4);
        // core channels must be present
        strict_1.default.ok(clients.includes('PC'));
        strict_1.default.ok(clients.includes('H5'));
        strict_1.default.ok(clients.includes('MINIAPP'));
        strict_1.default.ok(clients.includes('APP'));
    }
    finally {
        await app.close();
    }
});
//# sourceMappingURL=workbench.e2e.test.js.map