import { Controller, Get, Post, Body, Query, Param, Injectable, UseGuards } from '@nestjs/common'
import { EventCollector } from './event-collector'
import { CDCStream } from './cdc-stream'
import { CohortService } from './services/cohort.service'
import { FunnelService } from './services/funnel.service'
import { RetentionService } from './services/retention.service'
import { MetricsService } from './services/metrics.service'
import type {
  TenantId,
  EventType,
  CohortPeriod,
  FunnelStep
} from './analytics-v2.entity'
import { TenantGuard } from '../agent/tenant.guard'

/**
 * Phase-43 T173: AnalyticsV2Controller (数据分析 API)
 *
 * 14 endpoint:
 *  POST /analytics-v2/event/collect         单事件采集
 *  POST /analytics-v2/event/batch           批量采集
 *  GET  /analytics-v2/event/recent          实时事件流
 *  POST /analytics-v2/cdc/apply             CDC 单条应用
 *  POST /analytics-v2/cdc/replay            CDC 重放
 *  GET  /analytics-v2/cdc/tail              CDC tail 查询
 *  GET  /analytics-v2/cdc/status            CDC 状态
 *  POST /analytics-v2/cohort/register       注册新会员建 cohort
 *  POST /analytics-v2/cohort/track          跟踪会员行为
 *  GET  /analytics-v2/cohort/list           cohort 列表
 *  GET  /analytics-v2/cohort/matrix         cohort 矩阵
 *  POST /analytics-v2/funnel/create         创建漏斗
 *  GET  /analytics-v2/funnel/list           漏斗列表
 *  GET  /analytics-v2/funnel/:id            漏斗详情
 *  POST /analytics-v2/retention/generate    生成留存报告
 *  GET  /analytics-v2/retention/health      留存健康度
 *  GET  /analytics-v2/metrics/summary       仪表板汇总
 *  GET  /analytics-v2/metrics/live          实时指标
 *  GET  /analytics-v2/metrics/health        综合健康报告
 */

@Controller('analytics-v2')
@Injectable()
@UseGuards(TenantGuard)
export class AnalyticsV2Controller {
  constructor(
    private readonly eventCollector: EventCollector,
    private readonly cdcStream: CDCStream,
    private readonly cohortService: CohortService,
    private readonly funnelService: FunnelService,
    private readonly retentionService: RetentionService,
    private readonly metricsService: MetricsService
  ) {}

  // ─── Event Collection ───

  @Post('event/collect')
  collectEvent(@Body() body: {
    tenantId: TenantId
    eventId: string
    type: EventType
    who: string
    what: string
    memberId?: string
    sessionId?: string
    where?: Record<string, any>
    why?: string
    how?: string
    properties?: Record<string, any>
    revenueCents?: number
    timestamp?: string
  }) {
    const r = this.eventCollector.collect(body as any)
    return r
  }

  @Post('event/batch')
  collectBatch(@Body() body: { events: Parameters<EventCollector['collect']>[0][] }) {
    const results = this.eventCollector.collectBatch(body.events)
    return { results, count: results.length }
  }

  @Get('event/recent')
  recentEvents(@Query('tenantId') tenantId: TenantId, @Query('limit') limit?: string) {
    const n = limit ? parseInt(limit, 10) : 50
    return { events: this.metricsService.getRecentEvents(tenantId, n) }
  }

  // ─── CDC ───

  @Post('cdc/apply')
  applyCDC(@Body() body: Parameters<CDCStream['apply']>[0]) {
    return this.cdcStream.apply(body)
  }

  @Post('cdc/replay')
  replayCDC(@Body() body: Parameters<CDCStream['replay']>[0]) {
    return this.cdcStream.replay(body)
  }

  @Get('cdc/tail')
  tailCDC(@Query('tenantId') tenantId: TenantId, @Query('since') since?: string) {
    const sinceWm = since ? parseInt(since, 10) : undefined
    return { events: this.cdcStream.tail(tenantId, sinceWm) }
  }

  @Get('cdc/status')
  cdcStatus(@Query('tenantId') tenantId: TenantId) {
    return this.metricsService.getCDCStatus(tenantId)
  }

  // ─── Cohort ───

  @Post('cohort/register')
  registerMember(@Body() body: {
    tenantId: TenantId
    period: CohortPeriod
    memberId: string
    registrationDate: string
  }) {
    return this.cohortService.registerMember({
      tenantId: body.tenantId,
      period: body.period,
      memberId: body.memberId,
      registrationDate: new Date(body.registrationDate)
    })
  }

  @Post('cohort/track')
  trackActivity(@Body() body: {
    tenantId: TenantId
    memberId: string
    activityType: EventType
    properties?: Record<string, any>
  }) {
    return this.cohortService.trackMemberActivity(body)
  }

  @Get('cohort/list')
  listCohorts(@Query('tenantId') tenantId: TenantId, @Query('period') period?: CohortPeriod) {
    return { cohorts: this.cohortService.listCohorts(tenantId, period) }
  }

  @Get('cohort/matrix')
  cohortMatrix(@Query('tenantId') tenantId: TenantId, @Query('period') period: CohortPeriod, @Query('periods') periods?: string) {
    const n = periods ? parseInt(periods, 10) : 12
    return this.cohortService.rebuildMatrix(tenantId, period, n)
  }

  @Get('cohort/reliability')
  cohortReliability(@Query('tenantId') tenantId: TenantId, @Query('period') period: CohortPeriod) {
    return this.cohortService.getReliabilityReport(tenantId, period)
  }

  // ─── Funnel ───

  @Post('funnel/create')
  createFunnel(@Body() body: {
    tenantId: TenantId
    name: string
    steps: FunnelStep[]
    windowDays?: number
  }) {
    return this.funnelService.createFunnel(body)
  }

  @Get('funnel/list')
  listFunnels(@Query('tenantId') tenantId: TenantId) {
    return { funnels: this.funnelService.listFunnels(tenantId) }
  }

  @Get('funnel/:id')
  getFunnel(@Query('tenantId') tenantId: TenantId, @Param('id') id: string) {
    return this.funnelService.getFunnel(tenantId, id)
  }

  @Get('funnel/template/default')
  defaultFunnelTemplate() {
    return this.funnelService.getDefaultFunnelTemplate()
  }

  // ─── Retention ───

  @Post('retention/generate')
  generateRetention(@Body() body: { tenantId: TenantId; period: CohortPeriod }) {
    const report = this.retentionService.generateReport(body.tenantId, body.period)
    return { report }
  }

  @Get('retention/health')
  retentionHealth(@Query('tenantId') tenantId: TenantId, @Query('period') period: CohortPeriod) {
    return this.retentionService.getHealthScore(tenantId, period)
  }

  @Get('retention/trend')
  retentionTrend(@Query('tenantId') tenantId: TenantId, @Query('period') period: CohortPeriod, @Query('window') window?: string) {
    const w = window ? parseInt(window, 10) : 4
    return { trend: this.retentionService.getTrend(tenantId, period, w) }
  }

  // ─── Metrics ───

  @Get('metrics/summary')
  metricsSummary(@Query('tenantId') tenantId: TenantId, @Query('days') days?: string) {
    const n = days ? parseInt(days, 10) : 7
    return this.metricsService.generateSummary(tenantId, n)
  }

  @Get('metrics/live')
  metricsLive(@Query('tenantId') tenantId: TenantId) {
    return this.metricsService.getLiveMetrics(tenantId)
  }

  @Get('metrics/health')
  metricsHealth(@Query('tenantId') tenantId: TenantId) {
    return this.metricsService.getHealthReport(tenantId)
  }
}