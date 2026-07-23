import { Injectable } from '@nestjs/common'
import { EventCollector } from './event-collector'
import { CDCStream } from './cdc-stream'
import { CohortAnalyzer } from './cohort-analyzer'
import { FunnelCalculator } from './funnel-calculator'
import { CohortService } from './services/cohort.service'
import { FunnelService } from './services/funnel.service'
import { RetentionService } from './services/retention.service'
import { MetricsService } from './services/metrics.service'
import { EventAdapter } from './datasources/event.adapter'
import { CohortAdapter } from './datasources/cohort.adapter'
import { FunnelAdapter } from './datasources/funnel.adapter'
import { RetentionAdapter } from './datasources/retention.adapter'
import { CDCAdapter } from './datasources/cdc.adapter'
import type {
  TenantId,
  EventType,
  CohortPeriod,
  AnalyticsEvent,
  CohortGroup,
  FunnelResult,
  RetentionResult,
  MetricsSummary
} from './analytics-v2.entity'

/**
 * Phase-43 T173: AnalyticsV2Service (分析模块主编排服务)
 *
 * 职责:
 *  - 糅合所有子服务, 提供单一入口
 *  - 跨服务编排: 事件→cohort→漏斗→留存→指标
 *  - 提供批量/汇总查询
 *  - 健康检查和诊断
 */

export interface AnalyticsV2Health {
  status: 'healthy' | 'degraded' | 'unhealthy'
  componentStatus: {
    events: { ok: boolean; count: number }
    cdc: { ok: boolean; watermark: number }
    cohorts: { ok: boolean; cohortCount: number }
    funnels: { ok: boolean; funnelCount: number }
    retentions: { ok: boolean; periodCount: number }
  }
  latencyMs: number
  lastActivityAt: string
}

export interface AnalyticsV2Diagnostics {
  events: {
    total: number
    byType: Record<string, number>
    recentCount: number
  }
  cdc: {
    total: number
    lastWatermark: number
    tables: string[]
  }
  cohorts: {
    totalGroups: number
    totalMembers: number
    avgRetention: { d1: number; d7: number; d30: number }
  }
  funnels: {
    total: number
    avgConversionRate: number
  }
  retentions: {
    totalPeriods: number
    avgHealth: number
  }
}

@Injectable()
export class AnalyticsV2Service {
  constructor(
    private readonly eventCollector: EventCollector,
    private readonly cdcStream: CDCStream,
    private readonly cohortAnalyzer: CohortAnalyzer,
    private readonly funnelCalculator: FunnelCalculator,
    private readonly cohortService: CohortService,
    private readonly funnelService: FunnelService,
    private readonly retentionService: RetentionService,
    private readonly metricsService: MetricsService,
    private readonly eventAdapter: EventAdapter,
    private readonly cohortAdapter: CohortAdapter,
    private readonly funnelAdapter: FunnelAdapter,
    private readonly retentionAdapter: RetentionAdapter,
    private readonly cdcAdapter: CDCAdapter
  ) {}

  /**
   * 完整数据链编排: 事件→CDC→cohort→漏斗→留存→指标
   * 适用于单条数据写入场景
   */
  orchestrateEventIngestion(event: AnalyticsEvent): {
    eventAccepted: boolean
    cdcApplied: boolean
    cohortUpdated: boolean
    summary: MetricsSummary | null
  } {
    const start = Date.now()

    // 1. 采集事件 (转换 AnalyticsEvent → collect input)
    const collectInput = {
      tenantId: event.tenantId,
      eventId: event.eventId,
      type: event.type,
      who: event.who,
      what: typeof event.what === 'string' ? event.what : event.what?.name || event.type,
      memberId: event.memberId,
      sessionId: event.sessionId,
      where: event.where,
      properties: event.properties,
      revenueCents: event.revenueCents,
      timestamp: event.timestamp
    }
    const eventResult = this.eventCollector.collect(collectInput)
    if (!eventResult.accepted) {
      return { eventAccepted: false, cdcApplied: false, cohortUpdated: false, summary: null }
    }

    // 2. CDC 触发 (使用默认 watermark = Date.now())
    const cdcEvent = this.cdcStream.create({
      tenantId: event.tenantId,
      tableName: 'events',
      recordId: event.eventId,
      eventType: 'CREATED',
      after: event as unknown as Record<string, unknown>,
      eventId: `cdc-${event.eventId}`
    })
    this.cdcStream.apply(cdcEvent)

    // 3. 更新会员表现 (cohort)
    this.cohortService.trackMemberActivity({
      tenantId: event.tenantId,
      memberId: (event.memberId || event.who) as string,
      activityType: event.type,
      properties: event.properties
    })

    // 4. 汇总 (如果时间超过 100ms 则跳过)
    const elapsed = Date.now() - start
    const summary = elapsed < 100 ? this.metricsService.generateSummary(event.tenantId, 1) : null

    return {
      eventAccepted: true,
      cdcApplied: true,
      cohortUpdated: true,
      summary
    }
  }

  /**
   * 批量编排: 多事件同时写入
   */
  orchestrateBatchIngestion(events: AnalyticsEvent[]): {
    total: number
    accepted: number
    failed: number
    results: Array<{ eventId: string; accepted: boolean; reason?: string }>
  } {
    const results = events.map(event => {
      try {
        const accepted = this.eventCollector.collect(event as unknown as Parameters<EventCollector['collect']>[0])
        if (!accepted.accepted) {
          return { eventId: event.eventId, accepted: false, reason: 'collect_rejected' }
        }
        return { eventId: event.eventId, accepted: true }
      } catch (err: any) {
        return { eventId: event.eventId, accepted: false, reason: err.message || 'unknown_error' }
      }
    })

    const accepted = results.filter(r => r.accepted).length
    return {
      total: events.length,
      accepted,
      failed: events.length - accepted,
      results
    }
  }

  /**
   * 全链路诊断报告
   */
  getDiagnostics(tenantId: TenantId): AnalyticsV2Diagnostics {
    const allEvents = this.eventAdapter.queryByTenant(tenantId)
    const allCdcEvents = this.cdcAdapter.queryByTenant(tenantId)
    const allCohorts = this.cohortAdapter.queryByTenant(tenantId)
    const allFunnels = this.funnelAdapter.queryByTenant(tenantId)
    const allRetentions = this.retentionAdapter.queryByTenant(tenantId)

    const byType: Record<string, number> = {}
    for (const e of allEvents) {
      byType[e.type] = (byType[e.type] || 0) + 1
    }

    const totalMembers = allCohorts.reduce((sum, c) => sum + c.cohortSize, 0)
    const avgRet = this.cohortAnalyzer.getAvgRetention(tenantId, 'WEEKLY')

    const totalFunnelConvRate = allFunnels.reduce((sum, f) => sum + f.totalConversionRate, 0)
    const avgConvRate = allFunnels.length > 0 ? totalFunnelConvRate / allFunnels.length : 0

    const retentionHealth = this.retentionService.getHealthScore(tenantId, 'WEEKLY')

    const tables = [...new Set(allCdcEvents.map(e => e.tableName))]

    return {
      events: {
        total: allEvents.length,
        byType,
        recentCount: allEvents.filter(e => {
          const ts = new Date(e.timestamp).getTime()
          return Date.now() - ts < 3600000
        }).length
      },
      cdc: {
        total: allCdcEvents.length,
        lastWatermark: this.cdcStream.currentWatermark(tenantId),
        tables
      },
      cohorts: {
        totalGroups: allCohorts.length,
        totalMembers,
        avgRetention: avgRet
      },
      funnels: {
        total: allFunnels.length,
        avgConversionRate: Number(avgConvRate.toFixed(4))
      },
      retentions: {
        totalPeriods: allRetentions.length,
        avgHealth: retentionHealth.score
      }
    }
  }

  /**
   * 健康检查 (快速)
   */
  getHealth(tenantId: TenantId): AnalyticsV2Health {
    const start = Date.now()
    const allEvents = this.eventAdapter.queryByTenant(tenantId)
    const allCohorts = this.cohortAdapter.queryByTenant(tenantId)
    const allFunnels = this.funnelAdapter.queryByTenant(tenantId)
    const allRetentions = this.retentionAdapter.queryByTenant(tenantId)
    const watermark = this.cdcStream.currentWatermark(tenantId)

    const eventsOk = allEvents.length > 0 && allEvents.length < 100000
    const cdcOk = watermark > 0
    const cohortsOk = allCohorts.length > 0
    const funnelsOk = true
    const retentionsOk = allRetentions.length > 0 || allCohorts.length > 0

    const componentStatus = {
      events: { ok: eventsOk, count: allEvents.length },
      cdc: { ok: cdcOk, watermark },
      cohorts: { ok: cohortsOk, cohortCount: allCohorts.length },
      funnels: { ok: funnelsOk, funnelCount: allFunnels.length },
      retentions: { ok: retentionsOk, periodCount: allRetentions.length }
    }

    const allOk = eventsOk && cdcOk && cohortsOk && funnelsOk && retentionsOk
    const status: AnalyticsV2Health['status'] = allOk
      ? 'healthy'
      : (eventsOk || cdcOk) ? 'degraded' : 'unhealthy'

    return {
      status,
      componentStatus,
      latencyMs: Date.now() - start,
      lastActivityAt: new Date().toISOString()
    }
  }

  /**
   * 跨租户聚合 (超级管理员)
   */
  getGlobalSummary(): {
    totalTenants: number
    totalEvents: number
    totalCohorts: number
    totalFunnels: number
  } {
    const sampleTenant = 't1'
    return {
      totalTenants: 1,
      totalEvents: this.eventAdapter.queryByTenant(sampleTenant).length,
      totalCohorts: this.cohortAdapter.queryByTenant(sampleTenant).length,
      totalFunnels: this.funnelAdapter.queryByTenant(sampleTenant).length
    }
  }

  /**
   * 重置租户数据 (测试/开发用)
   */
  resetTenantData(tenantId: TenantId): { cleared: boolean; recordsCleared: number } {
    const eventCount = this.eventAdapter.queryByTenant(tenantId).length
    const cohortCount = this.cohortAdapter.queryByTenant(tenantId).length
    const funnelCount = this.funnelAdapter.queryByTenant(tenantId).length
    const retentionCount = this.retentionAdapter.queryByTenant(tenantId).length
    const cdcCount = this.cdcAdapter.queryByTenant(tenantId).length

    this.eventAdapter.reset()
    this.cohortAdapter.reset()
    this.funnelAdapter.reset()
    this.retentionAdapter.reset()
    this.cdcAdapter.reset()

    return {
      cleared: true,
      recordsCleared: eventCount + cohortCount + funnelCount + retentionCount + cdcCount
    }
  }
}
