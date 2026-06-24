import { Controller, Get, Post, Put, Param, Query, Body, Headers } from '@nestjs/common'
import { AiInsightService } from './ai-insight.service'
import {
  GenerateReportDto,
  InsightReportQueryDto,
  KPIQueryDto,
  AnomalyQueryDto,
  ResolveAnomalyDto,
  GenerateForecastDto,
  DashboardQueryDto
} from './ai-insight.dto'

@Controller('ai-insight')
export class AiInsightController {
  constructor(private readonly insightService: AiInsightService) {}

  // ─── KPI 看板 ───

  /**
   * GET /ai-insight/kpis — 获取KPI指标列表
   */
  @Get('kpis')
  getKPIs(
    @Headers('x-tenant-id') tenantId: string,
    @Query() query: KPIQueryDto
  ) {
    return this.insightService.getKPIs(tenantId, query.storeId, query.category)
  }

  /**
   * GET /ai-insight/kpis/:kpiId — 获取单个KPI详情
   */
  @Get('kpis/:kpiId')
  getKPIDetail(@Param('kpiId') kpiId: string) {
    return this.insightService.getKPIDetail(kpiId)
  }

  // ─── 洞察报告 ───

  /**
   * POST /ai-insight/reports — 生成洞察报告
   */
  @Post('reports')
  generateReport(
    @Headers('x-tenant-id') tenantId: string,
    @Body() dto: GenerateReportDto
  ) {
    return this.insightService.generateReport(
      tenantId,
      dto.storeId,
      dto.type,
      dto.periodStart,
      dto.periodEnd
    )
  }

  /**
   * GET /ai-insight/reports — 查询报告列表
   */
  @Get('reports')
  getReports(
    @Headers('x-tenant-id') tenantId: string,
    @Query() query: InsightReportQueryDto
  ) {
    return this.insightService.getReports(tenantId, {
      storeId: query.storeId,
      type: query.type,
      limit: query.limit
    })
  }

  // ─── 异常检测 ───

  /**
   * POST /ai-insight/anomalies/detect — 执行异常检测
   */
  @Post('anomalies/detect')
  detectAnomalies(
    @Headers('x-tenant-id') tenantId: string,
    @Query() query: AnomalyQueryDto
  ) {
    return this.insightService.detectAnomalies(tenantId, query.storeId, query.metric)
  }

  /**
   * GET /ai-insight/anomalies — 查询异常列表
   */
  @Get('anomalies')
  getAnomalies(
    @Headers('x-tenant-id') tenantId: string,
    @Query() query: AnomalyQueryDto
  ) {
    return this.insightService.getAnomalies(tenantId, {
      storeId: query.storeId,
      status: query.status,
      severity: query.severity,
      limit: query.limit
    })
  }

  /**
   * PUT /ai-insight/anomalies/:anomalyId/acknowledge — 确认异常
   */
  @Put('anomalies/:anomalyId/acknowledge')
  acknowledgeAnomaly(@Param('anomalyId') anomalyId: string) {
    return this.insightService.acknowledgeAnomaly(anomalyId)
  }

  /**
   * PUT /ai-insight/anomalies/:anomalyId/resolve — 解决异常
   */
  @Put('anomalies/:anomalyId/resolve')
  resolveAnomaly(@Param('anomalyId') anomalyId: string, @Body() dto: ResolveAnomalyDto) {
    return this.insightService.resolveAnomaly(dto.anomalyId)
  }

  // ─── 趋势预测 ───

  /**
   * POST /ai-insight/forecasts — 生成趋势预测
   */
  @Post('forecasts')
  generateForecast(
    @Headers('x-tenant-id') tenantId: string,
    @Body() dto: GenerateForecastDto
  ) {
    return this.insightService.generateForecast(tenantId, dto.metric, dto.period)
  }

  /**
   * GET /ai-insight/forecasts/:trendId — 获取趋势预测
   */
  @Get('forecasts/:trendId')
  getForecast(@Param('trendId') trendId: string) {
    return this.insightService.getForecast(trendId)
  }

  // ─── 仪表盘 ───

  /**
   * GET /ai-insight/dashboard — 获取仪表盘摘要
   */
  @Get('dashboard')
  getDashboardSummary(
    @Headers('x-tenant-id') tenantId: string,
    @Query() query: DashboardQueryDto
  ) {
    return this.insightService.getDashboardSummary(tenantId, query.storeId)
  }
}
