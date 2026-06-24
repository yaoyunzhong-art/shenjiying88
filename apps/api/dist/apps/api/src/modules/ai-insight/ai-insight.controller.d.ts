import { AiInsightService } from './ai-insight.service';
import { GenerateReportDto, InsightReportQueryDto, KPIQueryDto, AnomalyQueryDto, ResolveAnomalyDto, GenerateForecastDto, DashboardQueryDto } from './ai-insight.dto';
export declare class AiInsightController {
    private readonly insightService;
    constructor(insightService: AiInsightService);
    /**
     * GET /ai-insight/kpis — 获取KPI指标列表
     */
    getKPIs(tenantId: string, query: KPIQueryDto): import("./ai-insight.entity").KPI[];
    /**
     * GET /ai-insight/kpis/:kpiId — 获取单个KPI详情
     */
    getKPIDetail(kpiId: string): import("./ai-insight.entity").KPI | undefined;
    /**
     * POST /ai-insight/reports — 生成洞察报告
     */
    generateReport(tenantId: string, dto: GenerateReportDto): import("./ai-insight.entity").InsightReport;
    /**
     * GET /ai-insight/reports — 查询报告列表
     */
    getReports(tenantId: string, query: InsightReportQueryDto): import("./ai-insight.entity").InsightReport[];
    /**
     * POST /ai-insight/anomalies/detect — 执行异常检测
     */
    detectAnomalies(tenantId: string, query: AnomalyQueryDto): import("./ai-insight.entity").Anomaly[];
    /**
     * GET /ai-insight/anomalies — 查询异常列表
     */
    getAnomalies(tenantId: string, query: AnomalyQueryDto): import("./ai-insight.entity").Anomaly[];
    /**
     * PUT /ai-insight/anomalies/:anomalyId/acknowledge — 确认异常
     */
    acknowledgeAnomaly(anomalyId: string): import("./ai-insight.entity").Anomaly | undefined;
    /**
     * PUT /ai-insight/anomalies/:anomalyId/resolve — 解决异常
     */
    resolveAnomaly(anomalyId: string, dto: ResolveAnomalyDto): import("./ai-insight.entity").Anomaly | undefined;
    /**
     * POST /ai-insight/forecasts — 生成趋势预测
     */
    generateForecast(tenantId: string, dto: GenerateForecastDto): import("./ai-insight.entity").Trend;
    /**
     * GET /ai-insight/forecasts/:trendId — 获取趋势预测
     */
    getForecast(trendId: string): import("./ai-insight.entity").Trend | undefined;
    /**
     * GET /ai-insight/dashboard — 获取仪表盘摘要
     */
    getDashboardSummary(tenantId: string, query: DashboardQueryDto): import("./ai-insight.entity").DashboardSummary;
}
//# sourceMappingURL=ai-insight.controller.d.ts.map