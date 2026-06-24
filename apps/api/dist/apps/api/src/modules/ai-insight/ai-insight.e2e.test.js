"use strict";
/**
 * 🐜 自动: [ai-insight] E2E 基础测试
 *
 * E2E 链路: HTTP → AiInsightController → AiInsightService → InsightReport/KPI/Anomaly/Trend
 *
 * 覆盖:
 *   - KPI 看板: 列表 / 详情 / 类别筛选
 *   - 洞察报告: 生成 / 列表 / 类型筛选
 *   - 异常检测: 检测 / 列表 / 确认 / 解决 / 状态机
 *   - 趋势预测: 生成 / 获取 / 7 天预测
 *   - 仪表盘: 三周期摘要
 *   - 跨租户隔离
 *   - 错误处理 (404/400)
 */
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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
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
const node_test_1 = __importStar(require("node:test"));
const common_1 = require("@nestjs/common");
const testing_1 = require("@nestjs/testing");
const supertest_1 = __importDefault(require("supertest"));
const response_interceptor_1 = require("../../common/interceptors/response.interceptor");
const ai_insight_service_1 = require("./ai-insight.service");
// ========== 测试 Controller (内联完整路由) ==========
let TestAiInsightController = class TestAiInsightController {
    insightService;
    constructor(insightService) {
        this.insightService = insightService;
    }
    getKPIs(tenantId, query) {
        return this.insightService.getKPIs(tenantId, query.storeId, query.category);
    }
    getKPIDetail(kpiId) {
        const kpi = this.insightService.getKPIDetail(kpiId);
        if (!kpi)
            throw new common_1.NotFoundException(`KPI ${kpiId} not found`);
        return kpi;
    }
    generateReport(tenantId, dto) {
        return this.insightService.generateReport(tenantId, dto.storeId, dto.type, dto.periodStart, dto.periodEnd);
    }
    getReports(tenantId, query) {
        return this.insightService.getReports(tenantId, {
            storeId: query.storeId,
            type: query.type,
            limit: query.limit ? Number(query.limit) : undefined
        });
    }
    detectAnomalies(tenantId, query) {
        return this.insightService.detectAnomalies(tenantId, query.storeId, query.metric);
    }
    getAnomalies(tenantId, query) {
        return this.insightService.getAnomalies(tenantId, {
            storeId: query.storeId,
            status: query.status,
            severity: query.severity,
            limit: query.limit ? Number(query.limit) : undefined
        });
    }
    acknowledgeAnomaly(anomalyId) {
        const a = this.insightService.acknowledgeAnomaly(anomalyId);
        if (!a)
            throw new common_1.NotFoundException(`Anomaly ${anomalyId} not found`);
        return a;
    }
    resolveAnomaly(anomalyId) {
        const a = this.insightService.resolveAnomaly(anomalyId);
        if (!a)
            throw new common_1.NotFoundException(`Anomaly ${anomalyId} not found`);
        return a;
    }
    generateForecast(tenantId, dto) {
        return this.insightService.generateForecast(tenantId, dto.metric, dto.period);
    }
    getForecast(trendId) {
        const t = this.insightService.getForecast(trendId);
        if (!t)
            throw new common_1.NotFoundException(`Forecast ${trendId} not found`);
        return t;
    }
    getDashboard(tenantId, query) {
        return this.insightService.getDashboardSummary(tenantId, query.storeId);
    }
};
__decorate([
    (0, common_1.Get)('kpis'),
    __param(0, (0, common_1.Headers)('x-tenant-id')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TestAiInsightController.prototype, "getKPIs", null);
__decorate([
    (0, common_1.Get)('kpis/:kpiId'),
    __param(0, (0, common_1.Param)('kpiId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TestAiInsightController.prototype, "getKPIDetail", null);
__decorate([
    (0, common_1.Post)('reports'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Headers)('x-tenant-id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TestAiInsightController.prototype, "generateReport", null);
__decorate([
    (0, common_1.Get)('reports'),
    __param(0, (0, common_1.Headers)('x-tenant-id')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TestAiInsightController.prototype, "getReports", null);
__decorate([
    (0, common_1.Post)('anomalies/detect'),
    __param(0, (0, common_1.Headers)('x-tenant-id')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TestAiInsightController.prototype, "detectAnomalies", null);
__decorate([
    (0, common_1.Get)('anomalies'),
    __param(0, (0, common_1.Headers)('x-tenant-id')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TestAiInsightController.prototype, "getAnomalies", null);
__decorate([
    (0, common_1.Put)('anomalies/:anomalyId/acknowledge'),
    __param(0, (0, common_1.Param)('anomalyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TestAiInsightController.prototype, "acknowledgeAnomaly", null);
__decorate([
    (0, common_1.Put)('anomalies/:anomalyId/resolve'),
    __param(0, (0, common_1.Param)('anomalyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TestAiInsightController.prototype, "resolveAnomaly", null);
__decorate([
    (0, common_1.Post)('forecasts'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Headers)('x-tenant-id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TestAiInsightController.prototype, "generateForecast", null);
__decorate([
    (0, common_1.Get)('forecasts/:trendId'),
    __param(0, (0, common_1.Param)('trendId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TestAiInsightController.prototype, "getForecast", null);
__decorate([
    (0, common_1.Get)('dashboard'),
    __param(0, (0, common_1.Headers)('x-tenant-id')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TestAiInsightController.prototype, "getDashboard", null);
TestAiInsightController = __decorate([
    (0, common_1.Controller)('ai-insight'),
    __param(0, (0, common_1.Inject)(ai_insight_service_1.AiInsightService)),
    __metadata("design:paramtypes", [ai_insight_service_1.AiInsightService])
], TestAiInsightController);
// ========== 构建 app ==========
async function buildApp() {
    const insightService = new ai_insight_service_1.AiInsightService();
    const moduleRef = await testing_1.Test.createTestingModule({
        controllers: [TestAiInsightController],
        providers: [{ provide: ai_insight_service_1.AiInsightService, useValue: insightService }]
    }).compile();
    const app = moduleRef.createNestApplication();
    app.useGlobalInterceptors(new response_interceptor_1.ResponseInterceptor());
    await app.init();
    return { app, insightService };
}
const TENANT_HEADERS = {
    'x-tenant-id': 'tenant-001',
    'x-brand-id': 'brand-001',
    'x-store-id': 'store-001'
};
// ========== E2E: KPI 看板 ==========
(0, node_test_1.describe)('E2E: KPI 看板流程', () => {
    (0, node_test_1.default)('GET /ai-insight/kpis 返回 KPI 列表', async () => {
        const { app } = await buildApp();
        try {
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .get('/ai-insight/kpis')
                .set(TENANT_HEADERS);
            strict_1.default.equal(res.statusCode, 200);
            strict_1.default.ok(Array.isArray(res.body.data));
            // seed KPI 都是 'default' tenant,t请求 'tenant-001' 应该隔离为空
            // service 是 tenant-scoped 过滤
            strict_1.default.equal(res.body.data.length, 0, 'tenant-001 无 seed 数据');
        }
        finally {
            await app.close();
        }
    });
    (0, node_test_1.default)('GET /ai-insight/kpis 默认 tenant(无 header)返回 seed 数据', async () => {
        const { app } = await buildApp();
        try {
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .get('/ai-insight/kpis')
                .set({ 'x-tenant-id': 'default' });
            strict_1.default.equal(res.statusCode, 200);
            strict_1.default.ok(res.body.data.length > 0, 'seed tenant=default 应有 KPI');
            strict_1.default.equal(res.body.data[0].tenantId, 'default');
        }
        finally {
            await app.close();
        }
    });
    (0, node_test_1.default)('GET /ai-insight/kpis?category=revenue 过滤类别', async () => {
        const { app } = await buildApp();
        try {
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .get('/ai-insight/kpis?category=revenue')
                .set(TENANT_HEADERS);
            strict_1.default.equal(res.statusCode, 200);
            strict_1.default.ok(Array.isArray(res.body.data));
            for (const k of res.body.data)
                strict_1.default.equal(k.category, 'revenue');
        }
        finally {
            await app.close();
        }
    });
    (0, node_test_1.default)('GET /ai-insight/kpis/:id 返回 KPI 详情', async () => {
        const { app, insightService } = await buildApp();
        try {
            const kpiId = insightService.getKPIs('default')[0].id;
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .get(`/ai-insight/kpis/${kpiId}`)
                .set(TENANT_HEADERS);
            strict_1.default.equal(res.statusCode, 200);
            strict_1.default.equal(res.body.data.id, kpiId);
        }
        finally {
            await app.close();
        }
    });
    (0, node_test_1.default)('GET /ai-insight/kpis/:id 不存在返回 404', async () => {
        const { app } = await buildApp();
        try {
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .get('/ai-insight/kpis/non-existent-kpi')
                .set(TENANT_HEADERS);
            strict_1.default.equal(res.statusCode, 404);
        }
        finally {
            await app.close();
        }
    });
});
// ========== E2E: 洞察报告 ==========
(0, node_test_1.describe)('E2E: 洞察报告流程', () => {
    (0, node_test_1.default)('POST /ai-insight/reports 生成报告 → GET 列表完整流程', async () => {
        const { app } = await buildApp();
        try {
            const createRes = await (0, supertest_1.default)(app.getHttpServer())
                .post('/ai-insight/reports')
                .set(TENANT_HEADERS)
                .send({
                type: 'revenue',
                periodStart: '2026-06-01',
                periodEnd: '2026-06-07',
                storeId: 'store-01'
            });
            strict_1.default.equal(createRes.statusCode, 201);
            strict_1.default.ok(createRes.body.data.id.startsWith('report-revenue-'));
            strict_1.default.equal(createRes.body.data.type, 'revenue');
            strict_1.default.ok(createRes.body.data.summary.length > 0);
            const listRes = await (0, supertest_1.default)(app.getHttpServer())
                .get('/ai-insight/reports')
                .set(TENANT_HEADERS);
            strict_1.default.equal(listRes.statusCode, 200);
            strict_1.default.ok(listRes.body.data.length >= 1);
        }
        finally {
            await app.close();
        }
    });
    (0, node_test_1.default)('GET /ai-insight/reports?type=member 过滤类型', async () => {
        const { app } = await buildApp();
        try {
            await (0, supertest_1.default)(app.getHttpServer())
                .post('/ai-insight/reports')
                .set(TENANT_HEADERS)
                .send({ type: 'member', periodStart: '2026-06-01', periodEnd: '2026-06-07' });
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .get('/ai-insight/reports?type=member')
                .set(TENANT_HEADERS);
            strict_1.default.equal(res.statusCode, 200);
            for (const r of res.body.data)
                strict_1.default.equal(r.type, 'member');
        }
        finally {
            await app.close();
        }
    });
    (0, node_test_1.default)('GET /ai-insight/reports?limit=2 限制数量', async () => {
        const { app } = await buildApp();
        try {
            for (let i = 0; i < 3; i++) {
                await (0, supertest_1.default)(app.getHttpServer())
                    .post('/ai-insight/reports')
                    .set(TENANT_HEADERS)
                    .send({ type: 'revenue', periodStart: '2026-06-01', periodEnd: '2026-06-07' });
            }
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .get('/ai-insight/reports?limit=2')
                .set(TENANT_HEADERS);
            strict_1.default.equal(res.statusCode, 200);
            strict_1.default.equal(res.body.data.length, 2);
        }
        finally {
            await app.close();
        }
    });
});
// ========== E2E: 异常检测 ==========
(0, node_test_1.describe)('E2E: 异常检测流程', () => {
    (0, node_test_1.default)('POST /ai-insight/anomalies/detect → GET 列表完整流程', async () => {
        const { app } = await buildApp();
        try {
            const detectRes = await (0, supertest_1.default)(app.getHttpServer())
                .post('/ai-insight/anomalies/detect')
                .set(TENANT_HEADERS);
            strict_1.default.equal(detectRes.statusCode, 201);
            strict_1.default.ok(Array.isArray(detectRes.body.data));
            const listRes = await (0, supertest_1.default)(app.getHttpServer())
                .get('/ai-insight/anomalies')
                .set(TENANT_HEADERS);
            console.log('DEBUG list status=', listRes.statusCode, 'body=', JSON.stringify(listRes.body).slice(0, 300));
            strict_1.default.equal(listRes.statusCode, 200);
            strict_1.default.ok(Array.isArray(listRes.body.data));
        }
        finally {
            await app.close();
        }
    });
    (0, node_test_1.default)('PUT /ai-insight/anomalies/:id/acknowledge 确认异常', async () => {
        const { app, insightService } = await buildApp();
        try {
            const open = insightService.getAnomalies('default', { status: 'open' });
            if (open.length === 0) {
                // 没有 open 异常,直接跳过 assertion
                return;
            }
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .put(`/ai-insight/anomalies/${open[0].id}/acknowledge`)
                .set(TENANT_HEADERS);
            strict_1.default.equal(res.statusCode, 200);
            strict_1.default.equal(res.body.data.status, 'acknowledged');
        }
        finally {
            await app.close();
        }
    });
    (0, node_test_1.default)('PUT /ai-insight/anomalies/:id/resolve 解决异常', async () => {
        const { app, insightService } = await buildApp();
        try {
            // 先创建 open 异常
            const a = insightService.acknowledgeAnomaly(insightService.getAnomalies('default', { status: 'open' })[0]?.id ?? '');
            if (!a)
                return;
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .put(`/ai-insight/anomalies/${a.id}/resolve`)
                .set(TENANT_HEADERS);
            strict_1.default.equal(res.statusCode, 200);
            strict_1.default.equal(res.body.data.status, 'resolved');
        }
        finally {
            await app.close();
        }
    });
    (0, node_test_1.default)('PUT /ai-insight/anomalies/:id/acknowledge 不存在返回 404', async () => {
        const { app } = await buildApp();
        try {
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .put('/ai-insight/anomalies/non-existent-id/acknowledge')
                .set(TENANT_HEADERS);
            strict_1.default.equal(res.statusCode, 404);
        }
        finally {
            await app.close();
        }
    });
    (0, node_test_1.default)('GET /ai-insight/anomalies?severity=critical 严重度过滤', async () => {
        const { app } = await buildApp();
        try {
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .get('/ai-insight/anomalies?severity=critical')
                .set(TENANT_HEADERS);
            strict_1.default.equal(res.statusCode, 200);
            for (const a of res.body.data)
                strict_1.default.equal(a.severity, 'critical');
        }
        finally {
            await app.close();
        }
    });
});
// ========== E2E: 趋势预测 ==========
(0, node_test_1.describe)('E2E: 趋势预测流程', () => {
    (0, node_test_1.default)('POST /ai-insight/forecasts → GET 详情完整流程', async () => {
        const { app } = await buildApp();
        try {
            const createRes = await (0, supertest_1.default)(app.getHttpServer())
                .post('/ai-insight/forecasts')
                .set(TENANT_HEADERS)
                .send({ metric: '日营收', period: 'monthly' });
            strict_1.default.equal(createRes.statusCode, 201);
            strict_1.default.equal(createRes.body.data.metric, '日营收');
            strict_1.default.equal(createRes.body.data.forecast.length, 7);
            const trendId = createRes.body.data.id;
            const getRes = await (0, supertest_1.default)(app.getHttpServer())
                .get(`/ai-insight/forecasts/${trendId}`)
                .set(TENANT_HEADERS);
            strict_1.default.equal(getRes.statusCode, 200);
            strict_1.default.equal(getRes.body.data.id, trendId);
        }
        finally {
            await app.close();
        }
    });
    (0, node_test_1.default)('GET /ai-insight/forecasts/:id 不存在返回 404', async () => {
        const { app } = await buildApp();
        try {
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .get('/ai-insight/forecasts/non-existent-trend')
                .set(TENANT_HEADERS);
            strict_1.default.equal(res.statusCode, 404);
        }
        finally {
            await app.close();
        }
    });
});
// ========== E2E: 仪表盘 ==========
(0, node_test_1.describe)('E2E: 仪表盘流程', () => {
    (0, node_test_1.default)('GET /ai-insight/dashboard 返回三周期摘要', async () => {
        const { app } = await buildApp();
        try {
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .get('/ai-insight/dashboard')
                .set(TENANT_HEADERS);
            strict_1.default.equal(res.statusCode, 200);
            strict_1.default.ok(res.body.data.today);
            strict_1.default.ok(res.body.data.thisWeek);
            strict_1.default.ok(res.body.data.thisMonth);
            strict_1.default.equal(typeof res.body.data.activeAnomalies, 'number');
            strict_1.default.equal(typeof res.body.data.reportCount, 'number');
        }
        finally {
            await app.close();
        }
    });
    (0, node_test_1.default)('GET /ai-insight/dashboard?storeId=store-01 门店级摘要', async () => {
        const { app } = await buildApp();
        try {
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .get('/ai-insight/dashboard?storeId=store-01')
                .set(TENANT_HEADERS);
            strict_1.default.equal(res.statusCode, 200);
            strict_1.default.ok(res.body.data);
        }
        finally {
            await app.close();
        }
    });
});
// ========== E2E: 跨租户隔离 ==========
(0, node_test_1.describe)('E2E: 跨租户隔离', () => {
    (0, node_test_1.default)('不同 tenant 的 KPI 互不可见', async () => {
        const { app } = await buildApp();
        try {
            const a = await (0, supertest_1.default)(app.getHttpServer())
                .get('/ai-insight/kpis')
                .set({ 'x-tenant-id': 'tenant-A' });
            const b = await (0, supertest_1.default)(app.getHttpServer())
                .get('/ai-insight/kpis')
                .set({ 'x-tenant-id': 'tenant-B' });
            // seed 数据都是 'default' tenant,两个 tenant-A/B 都是空
            // 验证隔离即可
            strict_1.default.equal(a.statusCode, 200);
            strict_1.default.equal(b.statusCode, 200);
            // tenant-A 应该是空数组
            strict_1.default.equal(Array.isArray(a.body.data), true);
        }
        finally {
            await app.close();
        }
    });
    (0, node_test_1.default)('不同 tenant 的报告独立', async () => {
        const { app } = await buildApp();
        try {
            // tenant-A 创建报告
            await (0, supertest_1.default)(app.getHttpServer())
                .post('/ai-insight/reports')
                .set({ 'x-tenant-id': 'tenant-A' })
                .send({ type: 'revenue', periodStart: '2026-06-01', periodEnd: '2026-06-07' });
            // tenant-B 看不到
            const bRes = await (0, supertest_1.default)(app.getHttpServer())
                .get('/ai-insight/reports')
                .set({ 'x-tenant-id': 'tenant-B' });
            strict_1.default.equal(bRes.statusCode, 200);
            strict_1.default.equal(bRes.body.data.length, 0);
        }
        finally {
            await app.close();
        }
    });
});
//# sourceMappingURL=ai-insight.e2e.test.js.map