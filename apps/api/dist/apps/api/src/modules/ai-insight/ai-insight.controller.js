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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiInsightController = void 0;
const common_1 = require("@nestjs/common");
const ai_insight_service_1 = require("./ai-insight.service");
const ai_insight_dto_1 = require("./ai-insight.dto");
let AiInsightController = class AiInsightController {
    insightService;
    constructor(insightService) {
        this.insightService = insightService;
    }
    // ─── KPI 看板 ───
    /**
     * GET /ai-insight/kpis — 获取KPI指标列表
     */
    getKPIs(tenantId, query) {
        return this.insightService.getKPIs(tenantId, query.storeId, query.category);
    }
    /**
     * GET /ai-insight/kpis/:kpiId — 获取单个KPI详情
     */
    getKPIDetail(kpiId) {
        return this.insightService.getKPIDetail(kpiId);
    }
    // ─── 洞察报告 ───
    /**
     * POST /ai-insight/reports — 生成洞察报告
     */
    generateReport(tenantId, dto) {
        return this.insightService.generateReport(tenantId, dto.storeId, dto.type, dto.periodStart, dto.periodEnd);
    }
    /**
     * GET /ai-insight/reports — 查询报告列表
     */
    getReports(tenantId, query) {
        return this.insightService.getReports(tenantId, {
            storeId: query.storeId,
            type: query.type,
            limit: query.limit
        });
    }
    // ─── 异常检测 ───
    /**
     * POST /ai-insight/anomalies/detect — 执行异常检测
     */
    detectAnomalies(tenantId, query) {
        return this.insightService.detectAnomalies(tenantId, query.storeId, query.metric);
    }
    /**
     * GET /ai-insight/anomalies — 查询异常列表
     */
    getAnomalies(tenantId, query) {
        return this.insightService.getAnomalies(tenantId, {
            storeId: query.storeId,
            status: query.status,
            severity: query.severity,
            limit: query.limit
        });
    }
    /**
     * PUT /ai-insight/anomalies/:anomalyId/acknowledge — 确认异常
     */
    acknowledgeAnomaly(anomalyId) {
        return this.insightService.acknowledgeAnomaly(anomalyId);
    }
    /**
     * PUT /ai-insight/anomalies/:anomalyId/resolve — 解决异常
     */
    resolveAnomaly(anomalyId, dto) {
        return this.insightService.resolveAnomaly(dto.anomalyId);
    }
    // ─── 趋势预测 ───
    /**
     * POST /ai-insight/forecasts — 生成趋势预测
     */
    generateForecast(tenantId, dto) {
        return this.insightService.generateForecast(tenantId, dto.metric, dto.period);
    }
    /**
     * GET /ai-insight/forecasts/:trendId — 获取趋势预测
     */
    getForecast(trendId) {
        return this.insightService.getForecast(trendId);
    }
    // ─── 仪表盘 ───
    /**
     * GET /ai-insight/dashboard — 获取仪表盘摘要
     */
    getDashboardSummary(tenantId, query) {
        return this.insightService.getDashboardSummary(tenantId, query.storeId);
    }
};
exports.AiInsightController = AiInsightController;
__decorate([
    (0, common_1.Get)('kpis'),
    __param(0, (0, common_1.Headers)('x-tenant-id')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, ai_insight_dto_1.KPIQueryDto]),
    __metadata("design:returntype", void 0)
], AiInsightController.prototype, "getKPIs", null);
__decorate([
    (0, common_1.Get)('kpis/:kpiId'),
    __param(0, (0, common_1.Param)('kpiId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AiInsightController.prototype, "getKPIDetail", null);
__decorate([
    (0, common_1.Post)('reports'),
    __param(0, (0, common_1.Headers)('x-tenant-id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, ai_insight_dto_1.GenerateReportDto]),
    __metadata("design:returntype", void 0)
], AiInsightController.prototype, "generateReport", null);
__decorate([
    (0, common_1.Get)('reports'),
    __param(0, (0, common_1.Headers)('x-tenant-id')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, ai_insight_dto_1.InsightReportQueryDto]),
    __metadata("design:returntype", void 0)
], AiInsightController.prototype, "getReports", null);
__decorate([
    (0, common_1.Post)('anomalies/detect'),
    __param(0, (0, common_1.Headers)('x-tenant-id')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, ai_insight_dto_1.AnomalyQueryDto]),
    __metadata("design:returntype", void 0)
], AiInsightController.prototype, "detectAnomalies", null);
__decorate([
    (0, common_1.Get)('anomalies'),
    __param(0, (0, common_1.Headers)('x-tenant-id')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, ai_insight_dto_1.AnomalyQueryDto]),
    __metadata("design:returntype", void 0)
], AiInsightController.prototype, "getAnomalies", null);
__decorate([
    (0, common_1.Put)('anomalies/:anomalyId/acknowledge'),
    __param(0, (0, common_1.Param)('anomalyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AiInsightController.prototype, "acknowledgeAnomaly", null);
__decorate([
    (0, common_1.Put)('anomalies/:anomalyId/resolve'),
    __param(0, (0, common_1.Param)('anomalyId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, ai_insight_dto_1.ResolveAnomalyDto]),
    __metadata("design:returntype", void 0)
], AiInsightController.prototype, "resolveAnomaly", null);
__decorate([
    (0, common_1.Post)('forecasts'),
    __param(0, (0, common_1.Headers)('x-tenant-id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, ai_insight_dto_1.GenerateForecastDto]),
    __metadata("design:returntype", void 0)
], AiInsightController.prototype, "generateForecast", null);
__decorate([
    (0, common_1.Get)('forecasts/:trendId'),
    __param(0, (0, common_1.Param)('trendId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AiInsightController.prototype, "getForecast", null);
__decorate([
    (0, common_1.Get)('dashboard'),
    __param(0, (0, common_1.Headers)('x-tenant-id')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, ai_insight_dto_1.DashboardQueryDto]),
    __metadata("design:returntype", void 0)
], AiInsightController.prototype, "getDashboardSummary", null);
exports.AiInsightController = AiInsightController = __decorate([
    (0, common_1.Controller)('ai-insight'),
    __metadata("design:paramtypes", [ai_insight_service_1.AiInsightService])
], AiInsightController);
//# sourceMappingURL=ai-insight.controller.js.map