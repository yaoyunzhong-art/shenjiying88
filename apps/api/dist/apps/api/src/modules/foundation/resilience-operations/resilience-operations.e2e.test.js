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
const resilience_operations_dto_1 = require("./resilience-operations.dto");
const resilience_operations_service_1 = require("./resilience-operations.service");
let TestResilienceOperationsController = class TestResilienceOperationsController {
    resilienceOperationsService;
    constructor(resilienceOperationsService) {
        this.resilienceOperationsService = resilienceOperationsService;
    }
    getManagementMetadata() {
        return this.resilienceOperationsService.getManagementMetadata();
    }
    getOverview() {
        return this.resilienceOperationsService.getOperationsOverview();
    }
    getObservability(query) {
        return this.resilienceOperationsService.getObservabilitySignals(query);
    }
    getRetryPolicies(query) {
        return this.resilienceOperationsService.listRetryPolicies(query);
    }
    getRecoveryPlans(query) {
        return this.resilienceOperationsService.listRecoveryPlans(query);
    }
    getRecoveryPlan(resource) {
        return this.resilienceOperationsService.describeRecoveryPlan(resource);
    }
    stageEdgeReplay(body) {
        return this.resilienceOperationsService.stageEdgeReplay(body.storeId, body.operationCount);
    }
};
__decorate([
    (0, common_1.Get)('management-metadata'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TestResilienceOperationsController.prototype, "getManagementMetadata", null);
__decorate([
    (0, common_1.Get)('overview'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TestResilienceOperationsController.prototype, "getOverview", null);
__decorate([
    (0, common_1.Get)('observability'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [resilience_operations_dto_1.ObservabilityQueryDto]),
    __metadata("design:returntype", void 0)
], TestResilienceOperationsController.prototype, "getObservability", null);
__decorate([
    (0, common_1.Get)('retry-policies'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [resilience_operations_dto_1.RetryPolicyQueryDto]),
    __metadata("design:returntype", void 0)
], TestResilienceOperationsController.prototype, "getRetryPolicies", null);
__decorate([
    (0, common_1.Get)('recovery-plans'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [resilience_operations_dto_1.RecoveryPlanQueryDto]),
    __metadata("design:returntype", void 0)
], TestResilienceOperationsController.prototype, "getRecoveryPlans", null);
__decorate([
    (0, common_1.Get)('recovery-plans/:resource'),
    __param(0, (0, common_1.Param)('resource')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TestResilienceOperationsController.prototype, "getRecoveryPlan", null);
__decorate([
    (0, common_1.Post)('edge-replay/stage'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [resilience_operations_dto_1.StageEdgeReplayDto]),
    __metadata("design:returntype", void 0)
], TestResilienceOperationsController.prototype, "stageEdgeReplay", null);
TestResilienceOperationsController = __decorate([
    (0, common_1.Controller)('foundation/resilience-operations'),
    __param(0, (0, common_1.Inject)(resilience_operations_service_1.ResilienceOperationsService)),
    __metadata("design:paramtypes", [resilience_operations_service_1.ResilienceOperationsService])
], TestResilienceOperationsController);
(0, node_test_1.default)('e2e: resilience operations exposes observability, retry policies, and recovery plans', async () => {
    const moduleRef = await testing_1.Test.createTestingModule({
        controllers: [TestResilienceOperationsController],
        providers: [resilience_operations_service_1.ResilienceOperationsService]
    }).compile();
    const app = moduleRef.createNestApplication();
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    try {
        const metadata = await (0, supertest_1.default)(app.getHttpServer()).get('/foundation/resilience-operations/management-metadata');
        const metadataPayload = metadata.body.data ?? metadata.body;
        strict_1.default.equal(metadata.statusCode, 200);
        strict_1.default.equal(metadataPayload.length, 4);
        const overview = await (0, supertest_1.default)(app.getHttpServer()).get('/foundation/resilience-operations/overview');
        const overviewPayload = overview.body.data ?? overview.body;
        strict_1.default.equal(overview.statusCode, 200);
        strict_1.default.equal(overviewPayload.observability.totalSignals >= 3, true);
        strict_1.default.equal(overviewPayload.retries.totalPolicies >= 3, true);
        strict_1.default.equal(overviewPayload.recovery.attentionRequired >= 1, true);
        const observability = await (0, supertest_1.default)(app.getHttpServer())
            .get('/foundation/resilience-operations/observability')
            .query({ status: 'warning' });
        const observabilityPayload = observability.body.data ?? observability.body;
        strict_1.default.equal(observability.statusCode, 200);
        strict_1.default.equal(observabilityPayload.length >= 1, true);
        strict_1.default.equal(observabilityPayload.every((signal) => signal.status === 'warning'), true);
        const retryPolicies = await (0, supertest_1.default)(app.getHttpServer())
            .get('/foundation/resilience-operations/retry-policies')
            .query({ capability: 'edge-sync' });
        const retryPoliciesPayload = retryPolicies.body.data ?? retryPolicies.body;
        strict_1.default.equal(retryPolicies.statusCode, 200);
        strict_1.default.equal(retryPoliciesPayload.length, 1);
        strict_1.default.equal(retryPoliciesPayload[0].key, 'edge-sync-retry');
        const recoveryPlans = await (0, supertest_1.default)(app.getHttpServer())
            .get('/foundation/resilience-operations/recovery-plans')
            .query({ status: 'attention' });
        const recoveryPlansPayload = recoveryPlans.body.data ?? recoveryPlans.body;
        strict_1.default.equal(recoveryPlans.statusCode, 200);
        strict_1.default.equal(recoveryPlansPayload.length, 1);
        strict_1.default.equal(recoveryPlansPayload[0].resource, 'edge-sync-pipeline');
        const recoveryPlan = await (0, supertest_1.default)(app.getHttpServer()).get('/foundation/resilience-operations/recovery-plans/edge-sync-pipeline');
        const recoveryPlanPayload = recoveryPlan.body.data ?? recoveryPlan.body;
        strict_1.default.equal(recoveryPlan.statusCode, 200);
        strict_1.default.equal(recoveryPlanPayload.plan.resource, 'edge-sync-pipeline');
        const replay = await (0, supertest_1.default)(app.getHttpServer()).post('/foundation/resilience-operations/edge-replay/stage').send({
            storeId: 'store-sh-001',
            operationCount: 12
        });
        const replayPayload = replay.body.data ?? replay.body;
        strict_1.default.equal(replay.statusCode, 201);
        strict_1.default.equal(replayPayload.status, 'staged');
        strict_1.default.equal(replayPayload.retryPolicy.key, 'edge-sync-retry');
        strict_1.default.equal(replayPayload.recoveryPlan.resource, 'edge-sync-pipeline');
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: observability signals without filter returns all signals', async () => {
    const moduleRef = await testing_1.Test.createTestingModule({
        controllers: [TestResilienceOperationsController],
        providers: [resilience_operations_service_1.ResilienceOperationsService]
    }).compile();
    const app = moduleRef.createNestApplication();
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer()).get('/foundation/resilience-operations/observability');
        const data = res.body.data ?? res.body;
        strict_1.default.equal(res.statusCode, 200);
        strict_1.default.equal(data.length >= 3, true);
        const signalKinds = new Set(data.map((s) => s.signal));
        strict_1.default.ok(signalKinds.has('metrics'));
        strict_1.default.ok(signalKinds.has('logs'));
        strict_1.default.ok(signalKinds.has('traces'));
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: observability filter for healthy status returns only healthy signals', async () => {
    const moduleRef = await testing_1.Test.createTestingModule({
        controllers: [TestResilienceOperationsController],
        providers: [resilience_operations_service_1.ResilienceOperationsService]
    }).compile();
    const app = moduleRef.createNestApplication();
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .get('/foundation/resilience-operations/observability')
            .query({ status: 'healthy' });
        const data = res.body.data ?? res.body;
        strict_1.default.equal(res.statusCode, 200);
        strict_1.default.equal(data.length >= 1, true);
        strict_1.default.equal(data.every((s) => s.status === 'healthy'), true);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: retry policies filter by webhook-delivery capability', async () => {
    const moduleRef = await testing_1.Test.createTestingModule({
        controllers: [TestResilienceOperationsController],
        providers: [resilience_operations_service_1.ResilienceOperationsService]
    }).compile();
    const app = moduleRef.createNestApplication();
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .get('/foundation/resilience-operations/retry-policies')
            .query({ capability: 'webhook-delivery' });
        const data = res.body.data ?? res.body;
        strict_1.default.equal(res.statusCode, 200);
        strict_1.default.equal(data.length, 1);
        strict_1.default.equal(data[0].key, 'webhook-delivery-retry');
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: retry policies without filter returns all policies', async () => {
    const moduleRef = await testing_1.Test.createTestingModule({
        controllers: [TestResilienceOperationsController],
        providers: [resilience_operations_service_1.ResilienceOperationsService]
    }).compile();
    const app = moduleRef.createNestApplication();
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer()).get('/foundation/resilience-operations/retry-policies');
        const data = res.body.data ?? res.body;
        strict_1.default.equal(res.statusCode, 200);
        strict_1.default.equal(data.length >= 3, true);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: recovery plans ready status returns ready plans', async () => {
    const moduleRef = await testing_1.Test.createTestingModule({
        controllers: [TestResilienceOperationsController],
        providers: [resilience_operations_service_1.ResilienceOperationsService]
    }).compile();
    const app = moduleRef.createNestApplication();
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .get('/foundation/resilience-operations/recovery-plans')
            .query({ status: 'ready' });
        const data = res.body.data ?? res.body;
        strict_1.default.equal(res.statusCode, 200);
        strict_1.default.equal(data.length >= 1, true);
        strict_1.default.equal(data.every((p) => p.status === 'ready'), true);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: describe recovery plan for unknown resource returns null plan with attention default', async () => {
    const moduleRef = await testing_1.Test.createTestingModule({
        controllers: [TestResilienceOperationsController],
        providers: [resilience_operations_service_1.ResilienceOperationsService]
    }).compile();
    const app = moduleRef.createNestApplication();
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer()).get('/foundation/resilience-operations/recovery-plans/unknown-resource');
        const data = res.body.data ?? res.body;
        strict_1.default.equal(res.statusCode, 200);
        strict_1.default.equal(data.plan, null);
        strict_1.default.equal(data.status, 'attention');
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: describe recovery plan for postgres-primary returns ready status', async () => {
    const moduleRef = await testing_1.Test.createTestingModule({
        controllers: [TestResilienceOperationsController],
        providers: [resilience_operations_service_1.ResilienceOperationsService]
    }).compile();
    const app = moduleRef.createNestApplication();
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer()).get('/foundation/resilience-operations/recovery-plans/postgres-primary');
        const data = res.body.data ?? res.body;
        strict_1.default.equal(res.statusCode, 200);
        strict_1.default.equal(data.status, 'ready');
        strict_1.default.equal(data.plan.resource, 'postgres-primary');
        strict_1.default.equal(data.plan.rtoMinutes, 30);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: stage edge replay echoes storeId and operationCount', async () => {
    const moduleRef = await testing_1.Test.createTestingModule({
        controllers: [TestResilienceOperationsController],
        providers: [resilience_operations_service_1.ResilienceOperationsService]
    }).compile();
    const app = moduleRef.createNestApplication();
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .post('/foundation/resilience-operations/edge-replay/stage')
            .send({ storeId: 'store-bj-002', operationCount: 50 });
        const data = res.body.data ?? res.body;
        strict_1.default.equal(res.statusCode, 201);
        strict_1.default.equal(data.status, 'staged');
        strict_1.default.equal(data.storeId, 'store-bj-002');
        strict_1.default.equal(data.operationCount, 50);
        strict_1.default.deepEqual(data.replayPipeline, ['local-queue', 'network-recovery', 'reconciliation', 'conflict-review']);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: operations overview surfaces byStatus and byCapability counters', async () => {
    const moduleRef = await testing_1.Test.createTestingModule({
        controllers: [TestResilienceOperationsController],
        providers: [resilience_operations_service_1.ResilienceOperationsService]
    }).compile();
    const app = moduleRef.createNestApplication();
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer()).get('/foundation/resilience-operations/overview');
        const data = res.body.data ?? res.body;
        strict_1.default.equal(res.statusCode, 200);
        strict_1.default.ok(data.observability.byStatus);
        strict_1.default.ok(data.retries.byCapability);
        strict_1.default.equal(typeof data.observability.averageCoverage, 'number');
        strict_1.default.ok(data.observability.maxCollectionLagSeconds >= 0);
        strict_1.default.equal(typeof data.retries.maxAttempts, 'number');
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: management metadata items include required roles and permissions', async () => {
    const moduleRef = await testing_1.Test.createTestingModule({
        controllers: [TestResilienceOperationsController],
        providers: [resilience_operations_service_1.ResilienceOperationsService]
    }).compile();
    const app = moduleRef.createNestApplication();
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer()).get('/foundation/resilience-operations/management-metadata');
        const data = res.body.data ?? res.body;
        strict_1.default.equal(res.statusCode, 200);
        const edgeReplay = data.find((m) => m.operation === 'edge-replay.write');
        strict_1.default.ok(edgeReplay);
        strict_1.default.ok(Array.isArray(edgeReplay.rbac.requiredRoles));
        strict_1.default.ok(Array.isArray(edgeReplay.rbac.requiredPermissions));
        strict_1.default.ok(edgeReplay.rbac.requiredPermissions.includes('foundation.operations.recovery.write'));
    }
    finally {
        await app.close();
    }
});
//# sourceMappingURL=resilience-operations.e2e.test.js.map