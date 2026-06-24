"use strict";
/**
 * E2E: AI Rule Engine 评估 HTTP 链路
 *
 * 链路:
 *   HTTP → TestController → AiRuleEngineService
 *
 * 验证:
 *   - 成员等级评估 (VIP / SVIP / REGULAR)
 *   - 设备异常检测 (CPU / MEMORY / DISK / NETWORK / ERROR)
 *   - 批量评估 (混合 member + device)
 *   - 引擎状态查询
 *   - 路由分发 (POST /evaluate)
 *   - 异常输入 (未知 type / 缺少字段)
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
const ai_rule_engine_service_1 = require("./ai-rule-engine.service");
let TestAiRuleEngineController = class TestAiRuleEngineController {
    aiRuleEngineService;
    constructor(aiRuleEngineService) {
        this.aiRuleEngineService = aiRuleEngineService;
    }
    evaluate(body) {
        const { type, data } = body;
        if (type === 'member-level') {
            return {
                type: 'member-level',
                result: this.aiRuleEngineService.evaluateMemberLevel(data),
                timestamp: new Date().toISOString()
            };
        }
        if (type === 'device-anomaly') {
            return {
                type: 'device-anomaly',
                result: this.aiRuleEngineService.detectDeviceAnomaly(data),
                timestamp: new Date().toISOString()
            };
        }
        throw new Error(`Unsupported evaluation type: ${type}`);
    }
    evaluateMemberLevel(input) {
        const result = this.aiRuleEngineService.evaluateMemberLevel(input);
        return { type: 'member-level', result, timestamp: new Date().toISOString() };
    }
    detectDeviceAnomaly(input) {
        const result = this.aiRuleEngineService.detectDeviceAnomaly(input);
        return { type: 'device-anomaly', result, timestamp: new Date().toISOString() };
    }
    evaluateBatch(request) {
        return this.aiRuleEngineService.batchEvaluate(request);
    }
    getEngines() {
        return this.aiRuleEngineService.getEngineStatus();
    }
};
__decorate([
    (0, common_1.Post)('evaluate'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TestAiRuleEngineController.prototype, "evaluate", null);
__decorate([
    (0, common_1.Post)('evaluate/member-level'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TestAiRuleEngineController.prototype, "evaluateMemberLevel", null);
__decorate([
    (0, common_1.Post)('evaluate/device-anomaly'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TestAiRuleEngineController.prototype, "detectDeviceAnomaly", null);
__decorate([
    (0, common_1.Post)('evaluate/batch'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TestAiRuleEngineController.prototype, "evaluateBatch", null);
__decorate([
    (0, common_1.Get)('engines'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TestAiRuleEngineController.prototype, "getEngines", null);
TestAiRuleEngineController = __decorate([
    (0, common_1.Controller)('ai-rule-engine'),
    __param(0, (0, common_1.Inject)(ai_rule_engine_service_1.AiRuleEngineService)),
    __metadata("design:paramtypes", [ai_rule_engine_service_1.AiRuleEngineService])
], TestAiRuleEngineController);
async function buildApp() {
    const aiRuleEngineService = new ai_rule_engine_service_1.AiRuleEngineService();
    const moduleRef = await testing_1.Test.createTestingModule({
        controllers: [TestAiRuleEngineController],
        providers: [
            { provide: ai_rule_engine_service_1.AiRuleEngineService, useValue: aiRuleEngineService }
        ]
    }).compile();
    const app = moduleRef.createNestApplication();
    app.useGlobalInterceptors(new response_interceptor_1.ResponseInterceptor());
    await app.init();
    return { app, aiRuleEngineService };
}
(0, node_test_1.default)('e2e: member level → SVIP when high spend + points + visits', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .post('/ai-rule-engine/evaluate/member-level')
            .send({
            memberId: 'm-svip-1',
            totalPoints: 8000,
            totalSpend: 15000,
            visitCount: 30,
            tenantId: 'tenant-A'
        });
        strict_1.default.equal(res.statusCode, 201);
        strict_1.default.equal(res.body.data.type, 'member-level');
        const result = res.body.data.result;
        strict_1.default.equal(result.memberId, 'm-svip-1');
        strict_1.default.equal(result.suggestedLevel, 'SVIP');
        strict_1.default.ok(result.triggeredRules.length >= 3);
        strict_1.default.ok(result.confidence >= 0.8);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: member level → SVIP with all 3 conditions matched (ALL strategy)', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .post('/ai-rule-engine/evaluate/member-level')
            .send({
            memberId: 'm-vip-1',
            totalPoints: 6000,
            totalSpend: 12000,
            visitCount: 25,
            tenantId: 'tenant-A'
        });
        strict_1.default.equal(res.statusCode, 201);
        const result = res.body.data.result;
        strict_1.default.equal(result.suggestedLevel, 'SVIP');
        strict_1.default.equal(result.triggeredRules.length, 3);
        strict_1.default.ok(result.confidence >= 0.8);
        strict_1.default.equal(result.currentLevel, 'SVIP');
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: member level → REGULAR when partial match (ALL strategy fails)', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .post('/ai-rule-engine/evaluate/member-level')
            .send({
            memberId: 'm-partial-1',
            totalPoints: 6000,
            totalSpend: 3000,
            visitCount: 25,
            tenantId: 'tenant-A'
        });
        strict_1.default.equal(res.statusCode, 201);
        const result = res.body.data.result;
        strict_1.default.equal(result.suggestedLevel, 'REGULAR');
        strict_1.default.equal(result.triggeredRules.length, 0);
        strict_1.default.equal(result.confidence, 0.3);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: member level → REGULAR when no conditions match', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .post('/ai-rule-engine/evaluate/member-level')
            .send({
            memberId: 'm-reg-1',
            totalPoints: 50,
            totalSpend: 200,
            visitCount: 2,
            tenantId: 'tenant-A'
        });
        strict_1.default.equal(res.statusCode, 201);
        const result = res.body.data.result;
        strict_1.default.equal(result.suggestedLevel, 'REGULAR');
        strict_1.default.equal(result.triggeredRules.length, 0);
        strict_1.default.equal(result.confidence, 0.3);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: device anomaly → CRITICAL with multiple metrics breached', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .post('/ai-rule-engine/evaluate/device-anomaly')
            .send({
            deviceId: 'dev-1',
            storeId: 'store-1',
            metrics: {
                cpuUsage: 95,
                memoryUsage: 90,
                diskUsage: 95,
                networkLatencyMs: 50,
                errorRate: 1,
                uptimeHours: 100
            },
            tenantId: 'tenant-A'
        });
        strict_1.default.equal(res.statusCode, 201);
        const result = res.body.data.result;
        strict_1.default.equal(result.isAnomaly, true);
        strict_1.default.equal(result.severity, 'CRITICAL');
        strict_1.default.ok(result.triggeredRules.length >= 3);
        strict_1.default.ok(result.anomalyType);
        strict_1.default.ok(result.recommendations.length >= 1);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: device anomaly → LOW with no metrics breached', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .post('/ai-rule-engine/evaluate/device-anomaly')
            .send({
            deviceId: 'dev-2',
            storeId: 'store-1',
            metrics: {
                cpuUsage: 30,
                memoryUsage: 40,
                diskUsage: 50,
                networkLatencyMs: 50,
                errorRate: 0.1,
                uptimeHours: 200
            },
            tenantId: 'tenant-A'
        });
        strict_1.default.equal(res.statusCode, 201);
        const result = res.body.data.result;
        strict_1.default.equal(result.isAnomaly, false);
        strict_1.default.equal(result.severity, 'LOW');
        strict_1.default.equal(result.triggeredRules.length, 0);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: device anomaly → CPU_SPIKE detected with type', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .post('/ai-rule-engine/evaluate/device-anomaly')
            .send({
            deviceId: 'dev-3',
            storeId: 'store-1',
            metrics: {
                cpuUsage: 98,
                memoryUsage: 40,
                diskUsage: 50,
                networkLatencyMs: 50,
                errorRate: 0.1,
                uptimeHours: 200
            },
            tenantId: 'tenant-A'
        });
        strict_1.default.equal(res.statusCode, 201);
        const result = res.body.data.result;
        strict_1.default.equal(result.isAnomaly, true);
        strict_1.default.equal(result.anomalyType, 'CPU_SPIKE');
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: dispatch endpoint routes member-level correctly', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .post('/ai-rule-engine/evaluate')
            .send({
            type: 'member-level',
            data: {
                memberId: 'm-dispatch-1',
                totalPoints: 200,
                totalSpend: 100,
                visitCount: 1,
                tenantId: 'tenant-A'
            }
        });
        strict_1.default.equal(res.statusCode, 201);
        strict_1.default.equal(res.body.data.type, 'member-level');
        strict_1.default.ok(res.body.data.result);
        strict_1.default.ok(res.body.data.timestamp);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: dispatch endpoint routes device-anomaly correctly', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .post('/ai-rule-engine/evaluate')
            .send({
            type: 'device-anomaly',
            data: {
                deviceId: 'dev-dispatch-1',
                storeId: 'store-1',
                metrics: {
                    cpuUsage: 50,
                    memoryUsage: 50,
                    diskUsage: 50,
                    networkLatencyMs: 50,
                    errorRate: 0.1,
                    uptimeHours: 100
                },
                tenantId: 'tenant-A'
            }
        });
        strict_1.default.equal(res.statusCode, 201);
        strict_1.default.equal(res.body.data.type, 'device-anomaly');
        strict_1.default.equal(res.body.data.result.isAnomaly, false);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: dispatch endpoint rejects unsupported type', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .post('/ai-rule-engine/evaluate')
            .send({ type: 'unknown-type', data: {} });
        strict_1.default.equal(res.statusCode, 500);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: batch evaluate mixes member-level + device-anomaly', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .post('/ai-rule-engine/evaluate/batch')
            .send({
            items: [
                {
                    type: 'member-level',
                    data: {
                        memberId: 'm-batch-1',
                        totalPoints: 6000,
                        totalSpend: 12000,
                        visitCount: 25,
                        tenantId: 'tenant-A'
                    }
                },
                {
                    type: 'device-anomaly',
                    data: {
                        deviceId: 'dev-batch-1',
                        storeId: 'store-1',
                        metrics: {
                            cpuUsage: 95,
                            memoryUsage: 95,
                            diskUsage: 95,
                            networkLatencyMs: 50,
                            errorRate: 0.1,
                            uptimeHours: 100
                        },
                        tenantId: 'tenant-A'
                    }
                },
                {
                    type: 'member-level',
                    data: {
                        memberId: 'm-batch-2',
                        totalPoints: 10,
                        totalSpend: 10,
                        visitCount: 0,
                        tenantId: 'tenant-A'
                    }
                }
            ]
        });
        strict_1.default.equal(res.statusCode, 201);
        strict_1.default.equal(res.body.data.total, 3);
        strict_1.default.equal(res.body.data.succeeded, 3);
        strict_1.default.equal(res.body.data.failed, 0);
        strict_1.default.equal(res.body.data.items.length, 3);
        strict_1.default.equal(res.body.data.items[0].inputId, 'm-batch-1');
        strict_1.default.equal(res.body.data.items[0].result.suggestedLevel, 'SVIP');
        strict_1.default.equal(res.body.data.items[1].inputId, 'dev-batch-1');
        strict_1.default.equal(res.body.data.items[1].result.isAnomaly, true);
        strict_1.default.equal(res.body.data.items[2].inputId, 'm-batch-2');
        strict_1.default.equal(res.body.data.items[2].result.suggestedLevel, 'REGULAR');
        strict_1.default.ok(res.body.data.timestamp);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: batch evaluate handles empty items list', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .post('/ai-rule-engine/evaluate/batch')
            .send({ items: [] });
        strict_1.default.equal(res.statusCode, 201);
        strict_1.default.equal(res.body.data.total, 0);
        strict_1.default.equal(res.body.data.succeeded, 0);
        strict_1.default.equal(res.body.data.failed, 0);
        strict_1.default.equal(res.body.data.items.length, 0);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: get engines returns all rule engines with status', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .get('/ai-rule-engine/engines');
        strict_1.default.equal(res.statusCode, 200);
        const engines = res.body.data;
        strict_1.default.equal(engines.length, 3);
        const memberEngine = engines.find((e) => e.engineId === 'member-level-v1');
        strict_1.default.ok(memberEngine);
        strict_1.default.equal(memberEngine.conditionsCount, 3);
        strict_1.default.equal(memberEngine.actionsCount, 3);
        strict_1.default.equal(memberEngine.matchStrategy, 'ALL');
        const deviceEngine = engines.find((e) => e.engineId === 'device-anomaly-v1');
        strict_1.default.ok(deviceEngine);
        strict_1.default.equal(deviceEngine.conditionsCount, 5);
        strict_1.default.equal(deviceEngine.actionsCount, 2);
        strict_1.default.equal(deviceEngine.matchStrategy, 'ANY');
        const riskScoreEngine = engines.find((e) => e.engineId === 'risk-score-v1');
        strict_1.default.ok(riskScoreEngine);
        strict_1.default.equal(riskScoreEngine.conditionsCount, 5);
        strict_1.default.equal(riskScoreEngine.actionsCount, 3);
        strict_1.default.equal(riskScoreEngine.matchStrategy, 'ANY');
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: member level → SVIP with exactly boundary values', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .post('/ai-rule-engine/evaluate/member-level')
            .send({
            memberId: 'm-boundary',
            totalPoints: 5000,
            totalSpend: 10000,
            visitCount: 20,
            tenantId: 'tenant-A'
        });
        strict_1.default.equal(res.body.data.result.suggestedLevel, 'SVIP');
        strict_1.default.equal(res.body.data.result.currentLevel, 'SVIP');
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: member level → REGULAR when just below threshold', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .post('/ai-rule-engine/evaluate/member-level')
            .send({
            memberId: 'm-below',
            totalPoints: 4999,
            totalSpend: 9999,
            visitCount: 19,
            tenantId: 'tenant-A'
        });
        strict_1.default.equal(res.body.data.result.suggestedLevel, 'REGULAR');
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: device anomaly → MEMORY_LEAK type detected', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .post('/ai-rule-engine/evaluate/device-anomaly')
            .send({
            deviceId: 'dev-mem',
            storeId: 'store-1',
            metrics: {
                cpuUsage: 50,
                memoryUsage: 95,
                diskUsage: 50,
                networkLatencyMs: 50,
                errorRate: 0.1,
                uptimeHours: 200
            },
            tenantId: 'tenant-A'
        });
        strict_1.default.equal(res.body.data.result.isAnomaly, true);
        strict_1.default.equal(res.body.data.result.anomalyType, 'MEMORY_LEAK');
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: device anomaly → DISK_FULL type detected', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .post('/ai-rule-engine/evaluate/device-anomaly')
            .send({
            deviceId: 'dev-disk',
            storeId: 'store-1',
            metrics: {
                cpuUsage: 30,
                memoryUsage: 40,
                diskUsage: 95,
                networkLatencyMs: 50,
                errorRate: 0.1,
                uptimeHours: 200
            },
            tenantId: 'tenant-A'
        });
        strict_1.default.equal(res.body.data.result.isAnomaly, true);
        strict_1.default.equal(res.body.data.result.anomalyType, 'DISK_FULL');
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: device anomaly → NETWORK_LATENCY type detected', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .post('/ai-rule-engine/evaluate/device-anomaly')
            .send({
            deviceId: 'dev-net',
            storeId: 'store-1',
            metrics: {
                cpuUsage: 30,
                memoryUsage: 40,
                diskUsage: 50,
                networkLatencyMs: 550,
                errorRate: 0.1,
                uptimeHours: 200
            },
            tenantId: 'tenant-A'
        });
        strict_1.default.equal(res.body.data.result.isAnomaly, true);
        strict_1.default.equal(res.body.data.result.anomalyType, 'NETWORK_LATENCY');
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: device anomaly → HIGH_ERROR_RATE type detected', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .post('/ai-rule-engine/evaluate/device-anomaly')
            .send({
            deviceId: 'dev-err',
            storeId: 'store-1',
            metrics: {
                cpuUsage: 30,
                memoryUsage: 40,
                diskUsage: 50,
                networkLatencyMs: 50,
                errorRate: 8,
                uptimeHours: 200
            },
            tenantId: 'tenant-A'
        });
        strict_1.default.equal(res.body.data.result.isAnomaly, true);
        strict_1.default.equal(res.body.data.result.anomalyType, 'HIGH_ERROR_RATE');
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: device anomaly LOW severity has no anomalyType', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .post('/ai-rule-engine/evaluate/device-anomaly')
            .send({
            deviceId: 'dev-low',
            storeId: 'store-1',
            metrics: {
                cpuUsage: 30,
                memoryUsage: 40,
                diskUsage: 50,
                networkLatencyMs: 50,
                errorRate: 0.1,
                uptimeHours: 200
            },
            tenantId: 'tenant-A'
        });
        strict_1.default.equal(res.body.data.result.isAnomaly, false);
        strict_1.default.equal(res.body.data.result.severity, 'LOW');
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: batch evaluate ignores unknown type without counting as success or failure', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .post('/ai-rule-engine/evaluate/batch')
            .send({
            items: [
                {
                    type: 'member-level',
                    data: {
                        memberId: 'm-mix-1',
                        totalPoints: 5000,
                        totalSpend: 10000,
                        visitCount: 20,
                        tenantId: 'tenant-A'
                    }
                },
                {
                    type: 'unknown-type',
                    data: { foo: 'bar' }
                }
            ]
        });
        strict_1.default.equal(res.body.data.total, 2);
        strict_1.default.equal(res.body.data.succeeded, 1);
        strict_1.default.equal(res.body.data.failed, 0);
        strict_1.default.equal(res.body.data.items.length, 1);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: engines endpoint returns deterministic order', async () => {
    const { app } = await buildApp();
    try {
        const r1 = await (0, supertest_1.default)(app.getHttpServer()).get('/ai-rule-engine/engines');
        const r2 = await (0, supertest_1.default)(app.getHttpServer()).get('/ai-rule-engine/engines');
        strict_1.default.deepEqual(r1.body.data, r2.body.data);
    }
    finally {
        await app.close();
    }
});
//# sourceMappingURL=ai-rule-engine.e2e.test.js.map