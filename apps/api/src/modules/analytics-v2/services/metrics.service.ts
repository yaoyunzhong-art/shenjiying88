import { Injectable } from '@nestjs/common'
import { EventCollector } from '../event-collector'
import { CDCStream } from '../cdc-stream'
import { CohortService } from './cohort.service'
import { FunnelService } from './funnel.service'
import { RetentionService } from './retention.service'
import { EventAdapter } from '../datasources/event.adapter'
import { CDCAdapter } from '../datasources/cdc.adapter'
import { FunnelAdapter } from '../datasources/funnel.adapter'
import { RetentionAdapter } from '../datasources/retention.adapter'
import { CohortAdapter } from '../datasources/cohort.adapter'
import type {
  TenantId,
  MetricCard,
  MetricsSummary,
  TimeSeriesPoint
} from '../analytics-v2.entity'

/**
 * Phase-43 T173: MetricsService (指标聚合业务层)
 *
 * 业务职责:
 *  - 核心指标聚合 (DAU/UV/PV/转化/营收)
 *  - 时间序列生成
 *  - 变化率计算
 *  - 仪表板卡片
 */
@Injectable()
export class MetricsService {
  constructor(
    private readonly eventCollector: EventCollector,
    private readonly cdcStream: CDCStream,
    private readonly cohortService: CohortService,
    private readonly funnelService: FunnelService,
    private readonly retentionService: RetentionService,
    private readonly eventAdapter: EventAdapter,
    private readonly cdcAdapter: CDCAdapter,
    private readonly funnelAdapter: FunnelAdapter,
    private readonly retentionAdapter: RetentionAdapter,
    private readonly cohortAdapter: CohortAdapter
  ) {}

  /**
   * 生成仪表板汇总 (DAU/转化/营收)
   */
  generateSummary(tenantId: TenantId, periodDays: number = 7): MetricsSummary {
    const now = Date.now()
    const startMs = now - periodDays * 86400000

    // 1. 事件聚合
    const events = this.eventAdapter.queryByTimeRange(tenantId, startMs, now)

    const uniqueMembers = new Set<string>()
    const dailyActivity = new Map<string, Set<string>>()  // dateStr -> members
    const conversionEvents = events.filter(e => e.type === 'CONVERSION')
    const purchaseEvents = events.filter(e => e.type === 'PURCHASE')
    const totalRevenueCents = purchaseEvents.reduce((sum, e) => sum + (e.revenueCents || 0), 0)

    for (const e of events) {
      if (e.memberId) {
        uniqueMembers.add(e.memberId)
        const dateStr = e.timestamp.slice(0, 10)
        if (!dailyActivity.has(dateStr)) dailyActivity.set(dateStr, new Set())
        dailyActivity.get(dateStr)!.add(e.memberId)
      }
    }

    // 2. 时间序列
    const dauSeries: TimeSeriesPoint[] = []
    for (let d = periodDays - 1; d >= 0; d--) {
      const dateMs = now - d * 86400000
      const dateStr = new Date(dateMs).toISOString().slice(0, 10)
      const cnt = dailyActivity.get(dateStr)?.size || 0
      dauSeries.push({ timestamp: dateStr, value: cnt })
    }

    // 3. 指标卡
    const totalEvents = events.length
    const pvCount = events.filter(e => e.type === 'PAGEVIEW').length
    const clickCount = events.filter(e => e.type === 'CLICK').length
    const conversionRate = events.length > 0 ? conversionEvents.length / events.length : 0
    const ctr = pvCount > 0 ? clickCount / pvCount : 0

    const metrics: MetricCard[] = [
      {
        name: '总事件数',
        value: totalEvents,
        unit: 'count',
        change: 0,
        trend: 'STABLE'
      },
      {
        name: '活跃会员数',
        value: uniqueMembers.size,
        unit: 'members',
        change: 0,
        trend: 'STABLE'
      },
      {
        name: '转化率',
        value: Number(conversionRate.toFixed(4)),
        unit: 'ratio',
        change: 0,
        trend: conversionRate > 0.05 ? 'UP' : 'STABLE'
      },
      {
        name: '点击率',
        value: Number(ctr.toFixed(4)),
        unit: 'ratio',
        change: 0,
        trend: ctr > 0.1 ? 'UP' : 'STABLE'
      },
      {
        name: '营收',
        value: totalRevenueCents,
        unit: 'cents',
        change: 0,
        trend: totalRevenueCents > 0 ? 'UP' : 'STABLE'
      },
      {
        name: '漏斗数',
        value: this.funnelAdapter.count(tenantId),
        unit: 'count',
        change: 0,
        trend: 'STABLE'
      },
      {
        name: '留存期数',
        value: this.retentionAdapter.count(tenantId),
        unit: 'periods',
        change: 0,
        trend: 'STABLE'
      },
      {
        name: 'Cohort 数',
        value: this.cohortAdapter.count(tenantId),
        unit: 'cohorts',
        change: 0,
        trend: 'STABLE'
      }
    ]

    return {
      tenantId,
      period: `${periodDays}d`,
      metrics,
      series: {
        dau: dauSeries,
        events: this.buildEventsSeries(events, periodDays),
        revenue: this.buildRevenueSeries(purchaseEvents, periodDays)
      }
    }
  }

  /**
   * 实时事件流 (最近 N 条)
   */
  getRecentEvents(tenantId: TenantId, limit: number = 50) {
    return this.eventAdapter.queryByTenant(tenantId, limit)
  }

  /**
   * CDC 状态
   */
  getCDCStatus(tenantId: TenantId) {
    return {
      currentWatermark: this.cdcStream.currentWatermark(tenantId),
      events: this.cdcAdapter.queryByTenant(tenantId).length,
      lastEvents: this.cdcAdapter.queryByTenant(tenantId).slice(-5)
    }
  }

  /**
   * 实时指标 (单点)
   */
  getLiveMetrics(tenantId: TenantId): {
    activeSessions: number
    eventsLast5min: number
    conversionsLast5min: number
    revenueLast5min: number
  } {
    const fiveMinAgo = Date.now() - 5 * 60 * 1000
    const recent = this.eventAdapter.queryByTimeRange(tenantId, fiveMinAgo, Date.now())
    const sessions = new Set<string>()
    let conversions = 0
    let revenue = 0
    for (const e of recent) {
      if (e.sessionId) sessions.add(e.sessionId)
      if (e.type === 'CONVERSION') conversions++
      if (e.type === 'PURCHASE') revenue += e.revenueCents || 0
    }
    return {
      activeSessions: sessions.size,
      eventsLast5min: recent.length,
      conversionsLast5min: conversions,
      revenueLast5min: revenue
    }
  }

  /**
   * 业务级: 综合健康报告
   */
  getHealthReport(tenantId: TenantId): {
    metrics: MetricsSummary
    retentionHealth: ReturnType<RetentionService['getHealthScore']>
    funnels: number
    cohorts: number
    cdc: { currentWatermark: number; events: number }
  } {
    const summary = this.generateSummary(tenantId, 7)
    const retentionHealth = this.retentionService.getHealthScore(tenantId, 'WEEKLY')
    return {
      metrics: summary,
      retentionHealth,
      funnels: this.funnelAdapter.count(tenantId),
      cohorts: this.cohortAdapter.count(tenantId),
      cdc: this.getCDCStatus(tenantId)
    }
  }

  // ─── 内部: 时间序列构建 ──────────────────

  private buildEventsSeries(events: any[], periodDays: number): TimeSeriesPoint[] {
    const now = Date.now()
    const result: TimeSeriesPoint[] = []
    for (let d = periodDays - 1; d >= 0; d--) {
      const dateMs = now - d * 86400000
      const dateStr = new Date(dateMs).toISOString().slice(0, 10)
      const cnt = events.filter(e => e.timestamp.startsWith(dateStr)).length
      result.push({ timestamp: dateStr, value: cnt })
    }
    return result
  }

  private buildRevenueSeries(purchaseEvents: any[], periodDays: number): TimeSeriesPoint[] {
    const now = Date.now()
    const result: TimeSeriesPoint[] = []
    for (let d = periodDays - 1; d >= 0; d--) {
      const dateMs = now - d * 86400000
      const dateStr = new Date(dateMs).toISOString().slice(0, 10)
      const sum = purchaseEvents
        .filter(e => e.timestamp.startsWith(dateStr))
        .reduce((s, e) => s + (e.revenueCents || 0), 0)
      result.push({ timestamp: dateStr, value: sum })
    }
    return result
  }
}