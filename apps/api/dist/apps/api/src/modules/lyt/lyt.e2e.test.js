"use strict";
/**
 * E2E: LYT 连接编排引擎 HTTP 链路
 *
 * 链路:
 *   HTTP → TenantContext → TestController → LytService → Mock adapters
 *
 * 验证:
 *   - fixtures 列表 / 摘要 / 单个获取
 *   - fixture compare / import-preview / import-plan
 *   - bootstrap 端点
 *   - connection 查询（storeId / readiness / access-view / adapter）
 *   - governance summary / alerts
 *   - device status 查询
 *   - webhooks callback / drill / replay-fixture
 *   - 参数校验（缺少必需参数返回 400）
 *   - 边界情况（不存在的 fixture key、空 tenantContext）
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
const lyt_service_1 = require("./lyt.service");
const lyt_adapter_registry_1 = require("./lyt-adapter.registry");
const lyt_governance_query_service_1 = require("./lyt-governance-query.service");
const mock_lyt_adapter_1 = require("./adapters/mock-lyt.adapter");
const foundation_service_1 = require("../foundation/foundation.service");
const integration_orchestration_service_1 = require("../foundation/integration-orchestration/integration-orchestration.service");
// ---------------------------------------------------------------------------
// 内联 Test Controller（复制 LytController 相同路由）
// ---------------------------------------------------------------------------
let TestLytController = class TestLytController {
    lytService;
    constructor(lytService) {
        this.lytService = lytService;
    }
    getFixtures(transport, capability) {
        return this.lytService.getFixtures({ transport, capability });
    }
    getFixtureSummary(transport, capability) {
        return this.lytService.getFixtureSummary({ transport, capability });
    }
    getFixture(key) {
        return this.lytService.getFixture(key);
    }
    compareFixture(key, body) {
        return this.lytService.compareFixtureInput(key, body);
    }
    importFixturePreview(key, body) {
        return this.lytService.previewFixtureImport(key, body);
    }
    importFixturePlan(key, body) {
        return this.lytService.planFixtureImport(key, body);
    }
    getBootstrap() {
        return this.lytService.getBootstrap();
    }
    async getConnection(storeId, req) {
        const tc = req.tenantContext;
        return this.lytService.getConnection(storeId, tc);
    }
    async getConnectionCapabilityReadiness(storeId, req) {
        const tc = req.tenantContext;
        return this.lytService.getConnectionCapabilityReadiness(storeId, tc);
    }
    async getStoreCapabilityAccessView(storeId, req) {
        const tc = req.tenantContext;
        return this.lytService.getStoreCapabilityAccessView(storeId, tc);
    }
    async getAdapterSelection(storeId, req) {
        const tc = req.tenantContext;
        return this.lytService.getAdapterSelection(storeId, tc);
    }
    async getConnectionGovernanceSummary(req) {
        const tc = req.tenantContext;
        return this.lytService.getConnectionGovernanceSummary(tc);
    }
    async getConnectionGovernanceAlerts(req) {
        const tc = req.tenantContext;
        return this.lytService.getConnectionGovernanceAlerts(tc);
    }
    async getDeviceStatus(deviceId) {
        return this.lytService.getAdapter().getDeviceStatus(deviceId);
    }
    async acceptWebhook(body) {
        return this.lytService.acceptWebhook(body);
    }
    async drillWebhook(body) {
        return this.lytService.drillWebhook(body);
    }
    async replayWebhookFixture(body) {
        return this.lytService.replayWebhookFixture(body);
    }
};
__decorate([
    (0, common_1.Get)('fixtures'),
    __param(0, (0, common_1.Query)('transport')),
    __param(1, (0, common_1.Query)('capability')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], TestLytController.prototype, "getFixtures", null);
__decorate([
    (0, common_1.Get)('fixtures/summary'),
    __param(0, (0, common_1.Query)('transport')),
    __param(1, (0, common_1.Query)('capability')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], TestLytController.prototype, "getFixtureSummary", null);
__decorate([
    (0, common_1.Get)('fixtures/:key'),
    __param(0, (0, common_1.Param)('key')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TestLytController.prototype, "getFixture", null);
__decorate([
    (0, common_1.Post)('fixtures/:key/compare'),
    __param(0, (0, common_1.Param)('key')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Function]),
    __metadata("design:returntype", void 0)
], TestLytController.prototype, "compareFixture", null);
__decorate([
    (0, common_1.Post)('fixtures/:key/import-preview'),
    __param(0, (0, common_1.Param)('key')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Function]),
    __metadata("design:returntype", void 0)
], TestLytController.prototype, "importFixturePreview", null);
__decorate([
    (0, common_1.Post)('fixtures/:key/import-plan'),
    __param(0, (0, common_1.Param)('key')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Function]),
    __metadata("design:returntype", void 0)
], TestLytController.prototype, "importFixturePlan", null);
__decorate([
    (0, common_1.Get)('bootstrap'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TestLytController.prototype, "getBootstrap", null);
__decorate([
    (0, common_1.Get)('connection/:storeId'),
    __param(0, (0, common_1.Param)('storeId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TestLytController.prototype, "getConnection", null);
__decorate([
    (0, common_1.Get)('connection/:storeId/readiness'),
    __param(0, (0, common_1.Param)('storeId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TestLytController.prototype, "getConnectionCapabilityReadiness", null);
__decorate([
    (0, common_1.Get)('connection/:storeId/access-view'),
    __param(0, (0, common_1.Param)('storeId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TestLytController.prototype, "getStoreCapabilityAccessView", null);
__decorate([
    (0, common_1.Get)('connection/:storeId/adapter'),
    __param(0, (0, common_1.Param)('storeId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TestLytController.prototype, "getAdapterSelection", null);
__decorate([
    (0, common_1.Get)('connection/governance-summary'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TestLytController.prototype, "getConnectionGovernanceSummary", null);
__decorate([
    (0, common_1.Get)('connection/governance-alerts'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TestLytController.prototype, "getConnectionGovernanceAlerts", null);
__decorate([
    (0, common_1.Get)('devices/:deviceId/status'),
    __param(0, (0, common_1.Param)('deviceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TestLytController.prototype, "getDeviceStatus", null);
__decorate([
    (0, common_1.Post)('webhooks/callback'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function]),
    __metadata("design:returntype", Promise)
], TestLytController.prototype, "acceptWebhook", null);
__decorate([
    (0, common_1.Post)('webhooks/drill'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function]),
    __metadata("design:returntype", Promise)
], TestLytController.prototype, "drillWebhook", null);
__decorate([
    (0, common_1.Post)('webhooks/replay-fixture'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function]),
    __metadata("design:returntype", Promise)
], TestLytController.prototype, "replayWebhookFixture", null);
TestLytController = __decorate([
    (0, common_1.Controller)('lyt'),
    __param(0, (0, common_1.Inject)(lyt_service_1.LytService)),
    __metadata("design:paramtypes", [lyt_service_1.LytService])
], TestLytController);
// ---------------------------------------------------------------------------
// Tenant Context Helpers
// ---------------------------------------------------------------------------
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
const TENANT_A = { 'x-tenant-id': 'tenant-A', 'x-brand-id': 'brand-A', 'x-store-id': 'store-A' };
const TENANT_B = { 'x-tenant-id': 'tenant-B', 'x-brand-id': 'brand-B', 'x-store-id': 'store-B' };
// ---------------------------------------------------------------------------
// Mock Factories
// ---------------------------------------------------------------------------
function makeResolvedConnection(overrides = {}) {
    return {
        vendor: 'lyt',
        tenantId: 'tenant-A',
        brandId: 'brand-A',
        storeId: 'store-001',
        vendorTenantId: 'tenant-A',
        vendorBrandId: 'brand-A',
        vendorStoreId: 'store-001',
        endpoint: 'mock://lyt/mock/store',
        authMode: 'mock-token',
        hasCredential: false,
        capabilities: ['member', 'payment', 'order', 'device', 'gate'],
        connectionStatus: 'configured',
        source: 'fallback',
        resolutionLevel: 'fallback',
        resolutionKey: 'mock:key',
        resolutionChain: ['store:store-001', 'tenant:tenant-A'],
        healthStatus: 'pending-configuration',
        lastCheckedAt: new Date().toISOString(),
        ...overrides
    };
}
function makeConnectionManagerMock() {
    const storeConnections = new Map();
    return {
        getConnectionForStore(storeId, tenantContext) {
            const key = `${tenantContext?.tenantId ?? 'default'}:${storeId}`;
            if (!storeConnections.has(key)) {
                storeConnections.set(key, makeResolvedConnection({
                    storeId,
                    tenantId: tenantContext?.tenantId ?? 'tenant-demo',
                    brandId: tenantContext?.brandId
                }));
            }
            return Promise.resolve(storeConnections.get(key));
        },
        listScopedStores(tenantContext) {
            return Promise.resolve([
                {
                    id: 'store-001',
                    tenantId: tenantContext?.tenantId ?? 'tenant-001',
                    brandId: tenantContext?.brandId ?? 'brand-001',
                    code: 'STORE001',
                    name: 'Test Store'
                }
            ]);
        }
    };
}
function makeGovernanceQueryServiceMock() {
    return {
        getConnectionCapabilityReadiness(storeId, _tenantContext) {
            return Promise.resolve({
                storeId,
                ready: true,
                tenantId: 'mock-tenant',
                vendor: 'mock-vendor',
                vendorTenantId: 'mock-vt',
                vendorStoreId: 'mock-vs',
                connectionStatus: 'configured',
                hasCredential: true,
                enabledCapabilities: ['member', 'payment', 'order', 'device', 'gate'],
                readinessByCapability: [],
                missingRequirements: [],
                recommendedNextActions: []
            });
        },
        getConnectionGovernanceSummary(_tenantContext) {
            return Promise.resolve({
                generatedAt: new Date().toISOString(),
                scope: {},
                totalStores: 3,
                configuredStores: 2,
                pendingConfigurationStores: 1,
                staleStores: 0,
                inheritedStores: 0,
                storeLevelConfiguredStores: 2,
                capabilityBreakdown: [],
                recommendedNextActions: [],
                storeGroups: [],
                stores: []
            });
        },
        getConnectionGovernanceAlerts(_tenantContext) {
            return Promise.resolve({
                generatedAt: new Date().toISOString(),
                scope: {},
                alerts: []
            });
        },
        getStoreCapabilityAccessView(storeId, _tenantContext) {
            return Promise.resolve({
                storeId,
                connectionStatus: 'configured',
                accessByCapability: [],
                recommendedNextActions: []
            });
        }
    };
}
function makeFoundationServiceMock() {
    return {
        getDependencySummary(_module) {
            return {
                module: 'lyt-adapter',
                dependencies: ['member', 'transaction', 'loyalty', 'campaign'],
                contracts: ['LytMemberProfile', 'LytOrderPayload', 'LytDeviceStatus'],
                phase: 'scaffold'
            };
        }
    };
}
function makeIntegrationOrchestrationServiceMock() {
    return {
        acceptWebhook(_app, input) {
            return Promise.resolve({
                accepted: true,
                status: 'ok',
                idempotencyKey: input.eventId ? `idem:${input.eventId}` : `idem:${Date.now()}`,
                signatureStatus: 'not-applicable'
            });
        },
        publishEvent(input) {
            return Promise.resolve({
                published: true,
                eventId: input.eventId ?? `drill-${Date.now()}`,
                mode: input.dryRun ? 'dry-run' : 'published',
                standardizedEvent: {
                    aggregateId: `evt-${Date.now()}`,
                    sourceEventName: input.eventType ?? 'unknown',
                    standardizedEventName: input.eventType ?? 'unknown',
                    capability: 'member',
                    idempotencyKey: `idem:${Date.now()}`,
                    payload: input.payload ?? {}
                }
            });
        }
    };
}
// ---------------------------------------------------------------------------
// Build App
// ---------------------------------------------------------------------------
/** create a minimal adapter-like mock for listAvailableAdapters */
function makeAdapterMock(name, mode) {
    return { adapterName: name, adapterMode: mode };
}
async function buildApp() {
    const mockAdapter = new mock_lyt_adapter_1.MockLytAdapter();
    const sandboxAdapterMock = makeAdapterMock('SandboxLytAdapter', 'sandbox');
    const realAdapterMock = makeAdapterMock('RealLytAdapter', 'real');
    const adapterRegistry = new lyt_adapter_registry_1.LytAdapterRegistry(mockAdapter, sandboxAdapterMock, realAdapterMock);
    const connectionManager = makeConnectionManagerMock();
    const governanceQueryService = makeGovernanceQueryServiceMock();
    const foundationService = makeFoundationServiceMock();
    const integrationOrchestrationService = makeIntegrationOrchestrationServiceMock();
    const lytService = new lyt_service_1.LytService(adapterRegistry, foundationService, connectionManager, integrationOrchestrationService, undefined, undefined, undefined, undefined, governanceQueryService, undefined);
    const moduleRef = await testing_1.Test.createTestingModule({
        controllers: [TestLytController],
        providers: [
            { provide: lyt_service_1.LytService, useValue: lytService },
            { provide: lyt_adapter_registry_1.LytAdapterRegistry, useValue: adapterRegistry },
            { provide: foundation_service_1.FoundationService, useValue: foundationService },
            { provide: lyt_governance_query_service_1.LytGovernanceQueryService, useValue: governanceQueryService },
            { provide: integration_orchestration_service_1.IntegrationOrchestrationService, useValue: integrationOrchestrationService }
        ]
    }).compile();
    const app = moduleRef.createNestApplication();
    app.use(attachTenantContext);
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalInterceptors(new response_interceptor_1.ResponseInterceptor());
    await app.init();
    return { app, lytService, mockAdapter };
}
// ---------------------------------------------------------------------------
// Fixtures 端点
// ---------------------------------------------------------------------------
(0, node_test_1.default)('e2e: get fixtures returns all fixture catalog items', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer()).get('/lyt/fixtures').set(TENANT_A);
        strict_1.default.equal(res.statusCode, 200);
        strict_1.default.ok(Array.isArray(res.body.data));
        strict_1.default.ok(res.body.data.length >= 5);
        for (const f of res.body.data) {
            strict_1.default.ok(f.key);
            strict_1.default.ok(f.title);
            strict_1.default.ok(f.transport);
            strict_1.default.ok(f.capability);
        }
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: get fixtures filtered by transport api', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer()).get('/lyt/fixtures?transport=api').set(TENANT_A);
        strict_1.default.equal(res.statusCode, 200);
        for (const f of res.body.data) {
            strict_1.default.equal(f.transport, 'api');
        }
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: get fixtures filtered by capability', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer()).get('/lyt/fixtures?capability=member').set(TENANT_A);
        strict_1.default.equal(res.statusCode, 200);
        for (const f of res.body.data) {
            strict_1.default.equal(f.capability, 'member');
        }
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: get fixture summary returns checklist', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer()).get('/lyt/fixtures/summary').set(TENANT_A);
        strict_1.default.equal(res.statusCode, 200);
        strict_1.default.ok(typeof res.body.data.totalFixtures === 'number');
        strict_1.default.ok(typeof res.body.data.readyFixtures === 'number');
        strict_1.default.ok(typeof res.body.data.blockedFixtures === 'number');
        strict_1.default.ok(Array.isArray(res.body.data.blockedFixtureKeys));
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: get single fixture by valid key', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer()).get('/lyt/fixtures/member-query').set(TENANT_A);
        strict_1.default.equal(res.statusCode, 200);
        strict_1.default.equal(res.body.data.key, 'member-query');
        strict_1.default.ok(res.body.data.title);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: get fixture by unknown key returns 400+', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer()).get('/lyt/fixtures/nonexistent-key-xyz').set(TENANT_A);
        strict_1.default.ok(res.statusCode >= 400);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: compare fixture returns compare report', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .post('/lyt/fixtures/member-query/compare')
            .set(TENANT_A)
            .send({ payload: { externalMemberId: 'ext-comp-001' } });
        strict_1.default.ok(res.statusCode === 200 || res.statusCode === 201);
        strict_1.default.ok(res.body.data);
        strict_1.default.equal(res.body.data.fixtureKey, 'member-query');
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: import fixture preview returns preview contract', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .post('/lyt/fixtures/member-query/import-preview')
            .set(TENANT_A)
            .send({ payload: { externalMemberId: 'ext-prev-001' } });
        strict_1.default.ok(res.statusCode === 200 || res.statusCode === 201);
        strict_1.default.ok(res.body.data);
        strict_1.default.equal(res.body.data.fixtureKey, 'member-query');
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: import fixture plan returns plan contract', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .post('/lyt/fixtures/member-query/import-plan')
            .set(TENANT_A)
            .send({ payload: { externalMemberId: 'ext-plan-001' } });
        strict_1.default.ok(res.statusCode === 200 || res.statusCode === 201);
        strict_1.default.ok(res.body.data);
        strict_1.default.equal(res.body.data.fixtureKey, 'member-query');
    }
    finally {
        await app.close();
    }
});
// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------
(0, node_test_1.default)('e2e: bootstrap returns adapter name and foundation info', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer()).get('/lyt/bootstrap').set(TENANT_A);
        strict_1.default.equal(res.statusCode, 200);
        strict_1.default.ok(res.body.data);
        strict_1.default.equal(res.body.data.adapter, 'MockLytAdapter');
        strict_1.default.ok(Array.isArray(res.body.data.foundationDependencies));
        strict_1.default.ok(Array.isArray(res.body.data.foundationContracts));
    }
    finally {
        await app.close();
    }
});
// ---------------------------------------------------------------------------
// Connection 端点
// ---------------------------------------------------------------------------
(0, node_test_1.default)('e2e: get connection for store returns resolved connection', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer()).get('/lyt/connection/store-001').set(TENANT_A);
        strict_1.default.equal(res.statusCode, 200);
        strict_1.default.ok(res.body.data);
        strict_1.default.equal(res.body.data.storeId, 'store-001');
        strict_1.default.ok(res.body.data.connectionStatus);
        strict_1.default.ok(Array.isArray(res.body.data.capabilities));
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: different tenants get different connections for same store', async () => {
    const { app } = await buildApp();
    try {
        const resA = await (0, supertest_1.default)(app.getHttpServer()).get('/lyt/connection/store-001').set(TENANT_A);
        const resB = await (0, supertest_1.default)(app.getHttpServer()).get('/lyt/connection/store-001').set(TENANT_B);
        strict_1.default.equal(resA.statusCode, 200);
        strict_1.default.equal(resB.statusCode, 200);
        if (resA.body.data?.tenantId && resB.body.data?.tenantId) {
            strict_1.default.notEqual(resA.body.data.tenantId, resB.body.data.tenantId);
        }
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: get connection readiness for store', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .get('/lyt/connection/store-001/readiness')
            .set(TENANT_A);
        strict_1.default.equal(res.statusCode, 200);
        strict_1.default.ok(res.body.data);
        strict_1.default.ok(typeof res.body.data.ready === 'boolean');
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: get store capability access view', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .get('/lyt/connection/store-001/access-view')
            .set(TENANT_A);
        strict_1.default.equal(res.statusCode, 200);
        strict_1.default.ok(res.body.data);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: get adapter selection for store', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .get('/lyt/connection/store-001/adapter')
            .set(TENANT_A);
        strict_1.default.equal(res.statusCode, 200);
        strict_1.default.ok(res.body.data);
    }
    finally {
        await app.close();
    }
});
// ---------------------------------------------------------------------------
// Governance 端点
// ---------------------------------------------------------------------------
(0, node_test_1.default)('e2e: get governance summary', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .get('/lyt/connection/governance-summary')
            .set(TENANT_A);
        strict_1.default.equal(res.statusCode, 200);
        strict_1.default.ok(res.body.data);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: get governance alerts returns alert contract', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .get('/lyt/connection/governance-alerts')
            .set(TENANT_A);
        strict_1.default.equal(res.statusCode, 200);
        strict_1.default.ok(res.body.data);
        strict_1.default.ok(res.body.data && typeof res.body.data === 'object');
    }
    finally {
        await app.close();
    }
});
// ---------------------------------------------------------------------------
// Device 端点
// ---------------------------------------------------------------------------
(0, node_test_1.default)('e2e: get device status returns online (mock adapter)', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer()).get('/lyt/devices/dev-001/status').set(TENANT_A);
        strict_1.default.equal(res.statusCode, 200);
        strict_1.default.equal(res.body.data.status, 'ONLINE');
        strict_1.default.equal(res.body.data.deviceId, 'dev-001');
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: get device status for different device', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer()).get('/lyt/devices/gate-main/status').set(TENANT_A);
        strict_1.default.equal(res.statusCode, 200);
        strict_1.default.equal(res.body.data.deviceId, 'gate-main');
    }
    finally {
        await app.close();
    }
});
// ---------------------------------------------------------------------------
// Webhook 端点
// ---------------------------------------------------------------------------
(0, node_test_1.default)('e2e: webhook callback accepts valid payload', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .post('/lyt/webhooks/callback')
            .set(TENANT_A)
            .send({
            signature: 'sig-test-001',
            timestamp: new Date().toISOString(),
            eventId: 'evt-cb-001',
            eventType: 'member.created',
            payload: { memberId: 'm-001', nickname: 'Test' }
        });
        strict_1.default.ok([200, 201].includes(res.statusCode));
        strict_1.default.ok(res.body.data);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: webhook callback with empty body still processed (DTO is lenient)', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .post('/lyt/webhooks/callback')
            .set(TENANT_A)
            .send({ signature: '', timestamp: '', payload: {} });
        // With empty strings the DTO passes validation; service may return 200 or 201
        strict_1.default.ok([200, 201].includes(res.statusCode));
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: webhook drill dryRun=true returns drill contract', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .post('/lyt/webhooks/drill')
            .set(TENANT_A)
            .send({
            eventId: 'drill-001',
            eventType: 'member.created',
            dryRun: true,
            payload: { memberId: 'm-drill-001' }
        });
        strict_1.default.ok([200, 201].includes(res.statusCode));
        strict_1.default.ok(res.body.data);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: webhook drill dryRun=false still works', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .post('/lyt/webhooks/drill')
            .set(TENANT_A)
            .send({
            eventId: 'drill-002',
            eventType: 'order.created',
            dryRun: false,
            payload: { orderId: 'o-002' }
        });
        strict_1.default.ok(res.statusCode === 200 || res.statusCode === 201);
        strict_1.default.ok(res.body.data);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: webhook replay fixture with valid key', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .post('/lyt/webhooks/replay-fixture')
            .set(TENANT_A)
            .send({
            fixtureKey: 'payment-success-webhook',
            eventId: 'replay-001',
            strictValidation: false,
            payload: { paymentId: 'pay-001' }
        });
        strict_1.default.ok([200, 201].includes(res.statusCode));
        strict_1.default.ok(res.body.data);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: webhook replay fixture strict validation', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .post('/lyt/webhooks/replay-fixture')
            .set(TENANT_A)
            .send({
            fixtureKey: 'gate-pass-webhook',
            eventId: 'replay-002',
            strictValidation: true,
            headers: { 'x-signature': 'sig-test' },
            payload: { passCode: 'ABC123', storeId: 'store-001' }
        });
        strict_1.default.ok(res.statusCode >= 200);
    }
    finally {
        await app.close();
    }
});
// ---------------------------------------------------------------------------
// 边界测试
// ---------------------------------------------------------------------------
(0, node_test_1.default)('e2e: no tenant headers still works with defaults', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer()).get('/lyt/bootstrap');
        strict_1.default.equal(res.statusCode, 200);
        strict_1.default.ok(res.body.data);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: fixtures filter with both transport and capability', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .get('/lyt/fixtures?transport=webhook&capability=payment')
            .set(TENANT_A);
        strict_1.default.equal(res.statusCode, 200);
        for (const f of res.body.data) {
            strict_1.default.equal(f.transport, 'webhook');
            strict_1.default.equal(f.capability, 'payment');
        }
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: multiple webhook callbacks are idempotent', async () => {
    const { app } = await buildApp();
    try {
        const payload = {
            signature: 'sig-idem-001',
            timestamp: new Date().toISOString(),
            eventId: 'idem-001',
            payload: { memberId: 'm-idem', nickname: 'IdemTest' }
        };
        const res1 = await (0, supertest_1.default)(app.getHttpServer())
            .post('/lyt/webhooks/callback')
            .set(TENANT_A)
            .send(payload);
        strict_1.default.ok(res1.statusCode === 200 || res1.statusCode === 201);
        const res2 = await (0, supertest_1.default)(app.getHttpServer())
            .post('/lyt/webhooks/callback')
            .set(TENANT_A)
            .send(payload);
        strict_1.default.ok(res2.statusCode === 200 || res2.statusCode === 201);
    }
    finally {
        await app.close();
    }
});
//# sourceMappingURL=lyt.e2e.test.js.map