"use strict";
/**
 * E2E: Market 市场配置 HTTP 链路
 *
 * 链路:
 *   HTTP → TenantContext → TestController → MarketService
 *
 * 验证:
 *   - bootstrap 返回支持的市场 / 默认市场 / foundation 依赖
 *   - scope 路由 (tenant/brand/store) 透传 scope + 返回市场画像 + 覆盖
 *   - portal 路由返回市场基础字段
 *   - 跨市场隔离: cn-mainland vs us-default 时区 / 货币
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
const market_service_1 = require("./market.service");
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
let TestMarketController = class TestMarketController {
    marketService;
    constructor(marketService) {
        this.marketService = marketService;
    }
    bootstrap() {
        return this.marketService.getBootstrap();
    }
    scopedMarket(req, scopeType, scopeCode) {
        const ctx = req.tenantContext;
        return {
            scopeType,
            scopeCode,
            marketProfile: this.marketService.getMergedProfile(ctx),
            overrides: this.marketService.getOverrides(ctx)
        };
    }
    portalMarket(req, scopeType, scopeCode) {
        const ctx = req.tenantContext;
        const profile = this.marketService.getMergedProfile(ctx);
        return {
            scopeType,
            scopeCode,
            marketCode: profile.marketCode,
            locale: profile.locale,
            timezone: profile.timezone,
            tax: profile.tax,
            network: profile.network,
            email: profile.email,
            social: profile.social
        };
    }
};
__decorate([
    (0, common_1.Get)('bootstrap'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TestMarketController.prototype, "bootstrap", null);
__decorate([
    (0, common_1.Get)(':scopeType/:scopeCode'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('scopeType')),
    __param(2, (0, common_1.Param)('scopeCode')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], TestMarketController.prototype, "scopedMarket", null);
__decorate([
    (0, common_1.Get)(':scopeType/:scopeCode/portal'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('scopeType')),
    __param(2, (0, common_1.Param)('scopeCode')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], TestMarketController.prototype, "portalMarket", null);
TestMarketController = __decorate([
    (0, common_1.Controller)('markets'),
    __param(0, (0, common_1.Inject)(market_service_1.MarketService)),
    __metadata("design:paramtypes", [market_service_1.MarketService])
], TestMarketController);
async function buildApp() {
    const foundationService = {
        getModuleCatalog: () => [],
        getConsumerCatalog: () => [],
        getGovernanceBaseline: () => ({}),
        getBlueprint: () => ({}),
        getDependencySummary: () => ({ dependsOn: ['identity-access', 'configuration-governance'], handoffContracts: [] })
    };
    const marketService = new market_service_1.MarketService(foundationService);
    const moduleRef = await testing_1.Test.createTestingModule({
        controllers: [TestMarketController],
        providers: [
            { provide: market_service_1.MarketService, useValue: marketService },
            { provide: foundation_service_1.FoundationService, useValue: foundationService }
        ]
    }).compile();
    const app = moduleRef.createNestApplication();
    app.use(attachTenantContext);
    app.useGlobalInterceptors(new response_interceptor_1.ResponseInterceptor());
    await app.init();
    return { app, marketService, foundationService };
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
(0, node_test_1.default)('e2e: bootstrap returns supported markets + foundation dependency', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer()).get('/markets/bootstrap');
        strict_1.default.equal(res.statusCode, 200);
        const data = res.body.data;
        strict_1.default.equal(data.defaultDomesticMarketCode, 'cn-mainland');
        strict_1.default.equal(data.defaultInternationalMarketCode, 'us-default');
        strict_1.default.ok(Array.isArray(data.supportedMarkets));
        strict_1.default.ok(data.supportedMarkets.length >= 2);
        const codes = data.supportedMarkets.map((m) => m.marketCode);
        strict_1.default.ok(codes.includes('cn-mainland'));
        strict_1.default.ok(codes.includes('us-default'));
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: scoped market returns profile + overrides for tenant scope', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .get('/markets/tenant/tenant-cn')
            .set(TENANT_CN);
        strict_1.default.equal(res.statusCode, 200);
        strict_1.default.equal(res.body.data.scopeType, 'tenant');
        strict_1.default.equal(res.body.data.scopeCode, 'tenant-cn');
        strict_1.default.equal(res.body.data.marketProfile.marketCode, 'cn-mainland');
        strict_1.default.equal(res.body.data.marketProfile.timezone.timezone, 'Asia/Shanghai');
        strict_1.default.equal(res.body.data.marketProfile.currency.currencyCode, 'CNY');
        strict_1.default.ok(Array.isArray(res.body.data.overrides));
        strict_1.default.equal(res.body.data.overrides.length, 3);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: scoped market for US uses LA timezone + USD currency', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .get('/markets/tenant/tenant-us')
            .set(TENANT_US);
        strict_1.default.equal(res.statusCode, 200);
        strict_1.default.equal(res.body.data.marketProfile.marketCode, 'us-default');
        strict_1.default.equal(res.body.data.marketProfile.timezone.timezone, 'America/Los_Angeles');
        strict_1.default.equal(res.body.data.marketProfile.currency.currencyCode, 'USD');
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: scoped market for store scope returns store-level override', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .get('/markets/store/store-001')
            .set(TENANT_CN);
        strict_1.default.equal(res.statusCode, 200);
        strict_1.default.equal(res.body.data.scopeType, 'store');
        const storeOverride = res.body.data.overrides.find((o) => o.scopeType === 'STORE');
        strict_1.default.ok(storeOverride);
        strict_1.default.equal(storeOverride.inheritanceMode, 'STORE_OVERRIDE');
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: portal market route returns flat market basics', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .get('/markets/tenant/tenant-cn/portal')
            .set(TENANT_CN);
        strict_1.default.equal(res.statusCode, 200);
        strict_1.default.equal(res.body.data.marketCode, 'cn-mainland');
        strict_1.default.ok(res.body.data.locale);
        strict_1.default.ok(res.body.data.timezone);
        strict_1.default.ok(res.body.data.tax);
        strict_1.default.ok(res.body.data.network);
        strict_1.default.ok(res.body.data.email);
        strict_1.default.ok(res.body.data.social);
        strict_1.default.ok(Array.isArray(res.body.data.social.primaryPlatforms));
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: overrides array contains tenant / brand / store entries', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .get('/markets/tenant/tenant-cn')
            .set(TENANT_CN);
        const overrides = res.body.data.overrides;
        const scopeTypes = overrides.map((o) => o.scopeType);
        strict_1.default.ok(scopeTypes.includes('TENANT'));
        strict_1.default.ok(scopeTypes.includes('BRAND'));
        strict_1.default.ok(scopeTypes.includes('STORE'));
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: CN market has wechat as primary platform', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .get('/markets/tenant/tenant-cn')
            .set(TENANT_CN);
        const platforms = res.body.data.marketProfile.social.primaryPlatforms;
        strict_1.default.ok(platforms.includes('WECHAT'));
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: US market has linkedin as primary platform', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .get('/markets/tenant/tenant-us')
            .set(TENANT_US);
        const platforms = res.body.data.marketProfile.social.primaryPlatforms;
        strict_1.default.ok(platforms.includes('LINKEDIN'));
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: CN market tax mode is Included with 增值税 label', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .get('/markets/tenant/tenant-cn')
            .set(TENANT_CN);
        const tax = res.body.data.marketProfile.tax;
        strict_1.default.equal(tax.taxMode, 'PRICES_INCLUDE_TAX');
        strict_1.default.equal(tax.taxLabel, '增值税');
        strict_1.default.equal(tax.taxRate, 6);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: US market tax mode is Excluded with Sales Tax label', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .get('/markets/tenant/tenant-us')
            .set(TENANT_US);
        const tax = res.body.data.marketProfile.tax;
        strict_1.default.equal(tax.taxMode, 'PRICES_EXCLUDE_TAX');
        strict_1.default.equal(tax.taxLabel, 'Sales Tax');
        strict_1.default.equal(tax.taxRate, 8.25);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: CN/US markets use distinct currency symbols and network regions', async () => {
    const { app } = await buildApp();
    try {
        const cn = await (0, supertest_1.default)(app.getHttpServer())
            .get('/markets/tenant/tenant-cn')
            .set(TENANT_CN);
        const us = await (0, supertest_1.default)(app.getHttpServer())
            .get('/markets/tenant/tenant-us')
            .set(TENANT_US);
        strict_1.default.equal(cn.body.data.marketProfile.currency.symbol, '¥');
        strict_1.default.equal(us.body.data.marketProfile.currency.symbol, '$');
        strict_1.default.equal(cn.body.data.marketProfile.network.networkRegion, 'MAINLAND_CHINA');
        strict_1.default.equal(us.body.data.marketProfile.network.networkRegion, 'NORTH_AMERICA');
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: CN uses AliyunDm email, US uses SendGrid', async () => {
    const { app } = await buildApp();
    try {
        const cn = await (0, supertest_1.default)(app.getHttpServer())
            .get('/markets/tenant/tenant-cn')
            .set(TENANT_CN);
        const us = await (0, supertest_1.default)(app.getHttpServer())
            .get('/markets/tenant/tenant-us')
            .set(TENANT_US);
        strict_1.default.equal(cn.body.data.marketProfile.email.provider, 'ALIYUN_DM');
        strict_1.default.equal(us.body.data.marketProfile.email.provider, 'SENDGRID');
        strict_1.default.match(cn.body.data.marketProfile.email.fromAddress, /cn/);
        strict_1.default.match(us.body.data.marketProfile.email.fromAddress, /us/);
        strict_1.default.notEqual(cn.body.data.marketProfile.email.fromAddress, us.body.data.marketProfile.email.fromAddress);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: override scopeCode matches request tenant context', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .get('/markets/tenant/tenant-cn')
            .set(TENANT_CN);
        const tenantOverride = res.body.data.overrides.find((o) => o.scopeType === 'TENANT');
        const brandOverride = res.body.data.overrides.find((o) => o.scopeType === 'BRAND');
        const storeOverride = res.body.data.overrides.find((o) => o.scopeType === 'STORE');
        strict_1.default.ok(tenantOverride);
        strict_1.default.ok(brandOverride);
        strict_1.default.ok(storeOverride);
        strict_1.default.equal(tenantOverride.scopeCode, 'tenant-cn');
        strict_1.default.equal(brandOverride.scopeCode, 'brand-cn');
        strict_1.default.equal(storeOverride.scopeCode, 'store-cn');
        // Inheritance chain: STORE > BRAND > TENANT
        strict_1.default.equal(tenantOverride.inheritanceMode, 'TENANT_DEFAULT');
        strict_1.default.equal(brandOverride.inheritanceMode, 'BRAND_OVERRIDE');
        strict_1.default.equal(storeOverride.inheritanceMode, 'STORE_OVERRIDE');
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: bootstrap lists exactly 2 supported markets with both country codes', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer()).get('/markets/bootstrap');
        const markets = res.body.data.supportedMarkets;
        const countryCodes = markets.map((m) => m.countryCode);
        strict_1.default.ok(countryCodes.includes('CN'));
        strict_1.default.ok(countryCodes.includes('US'));
        strict_1.default.equal(markets.length, 2);
        const cn = markets.find((m) => m.marketCode === 'cn-mainland');
        strict_1.default.equal(cn.marketName, '中国大陆');
        const us = markets.find((m) => m.marketCode === 'us-default');
        strict_1.default.equal(us.marketName, 'United States');
    }
    finally {
        await app.close();
    }
});
//# sourceMappingURL=market.e2e.test.js.map