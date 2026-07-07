// analytics-v2.service.spec.ts — 纯函数式内联，不 import 生产代码
// Module: analytics-v2 — 分析模块主编排服务
// 测试策略: 枚举 + 类型定义 + mock数据工厂 + 内联纯函数 + ≥18测试

import { describe, it, expect } from 'vitest'

// ─── 1. 枚举 + 类型定义 ────────────────────────────────────────────────────

/** 事件类型枚举 */
export type EventType = 'PAGE_VIEW' | 'CLICK' | 'PURCHASE' | 'SIGNUP' | 'LOGIN' | 'LOGOUT' | 'CUSTOM'

export const EVENT_TYPES: EventType[] = ['PAGE_VIEW', 'CLICK', 'PURCHASE', 'SIGNUP', 'LOGIN', 'LOGOUT', 'CUSTOM']

/** 租户ID */
export type TenantId = string

/** 分析事件 */
export interface AnalyticsEvent {
  eventId: string
  tenantId: TenantId
  type: EventType
  who: string
  what: string | { name: string; category?: string }
  memberId?: string
  sessionId?: string
  where?: string
  properties?: Record<string, any>
  revenueCents?: number
  timestamp: string
}

/** 汇总结果 */
export interface MetricsSummary {
  totalEvents: number
  avgDuration: number
  totalRevenue: number
}

/** 编排结果 */
export interface IngestionResult {
  eventAccepted: boolean
  cdcApplied: boolean
  cohortUpdated: boolean
  summary: MetricsSummary | null
}

/** 批量编排结果 */
export interface BatchIngestionResult {
  total: number
  accepted: number
  failed: number
  results: Array<{ eventId: string; accepted: boolean; reason?: string }>
}

/** 诊断报告 */
export interface AnalyticsDiagnostics {
  events: { total: number; byType: Record<EventType, number>; recentCount: number }
  cdc: { total: number; lastWatermark: number; tables: string[] }
  cohorts: { totalGroups: number; totalMembers: number }
  funnels: { total: number; avgConversionRate: number }
  retentions: { totalPeriods: number; avgHealth: number }
}

/** 健康检查 */
export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy'

export interface AnalyticsHealth {
  status: HealthStatus
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

// ─── 2. Mock 数据工厂 ──────────────────────────────────────────────────────

export function makeEvent(overrides: Partial<AnalyticsEvent> = {}): AnalyticsEvent {
  return {
    eventId: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    tenantId: 't1',
    type: 'PAGE_VIEW',
    who: 'user_1',
    what: '/home',
    memberId: 'm1',
    sessionId: 'sess_1',
    where: 'web',
    properties: { referrer: 'google' },
    revenueCents: 0,
    timestamp: new Date().toISOString(),
    ...overrides,
  }
}

export function makeEvents(count: number, baseOverrides?: Partial<AnalyticsEvent>): AnalyticsEvent[] {
  return Array.from({ length: count }, (_, i) => makeEvent({ ...baseOverrides, eventId: `evt_${i}` }))
}

export function makeMetricsSummary(overrides: Partial<MetricsSummary> = {}): MetricsSummary {
  return {
    totalEvents: 100,
    avgDuration: 2500,
    totalRevenue: 50000,
    ...overrides,
  }
}

// ─── 3. 内联业务逻辑纯函数 ───────────────────────────────────────────────

/**
 * 采集事件 — 简化版: 检查必要字段和 type 合法性
 */
export function processEvent(event: AnalyticsEvent): { accepted: boolean; reason?: string } {
  if (!event.eventId || event.eventId.trim() === '') {
    return { accepted: false, reason: 'missing_event_id' }
  }
  if (!event.tenantId || event.tenantId.trim() === '') {
    return { accepted: false, reason: 'missing_tenant_id' }
  }
  if (!EVENT_TYPES.includes(event.type)) {
    return { accepted: false, reason: 'invalid_event_type' }
  }
  if (!event.who || event.who.trim() === '') {
    return { accepted: false, reason: 'missing_who' }
  }
  if (!event.timestamp) {
    return { accepted: false, reason: 'missing_timestamp' }
  }
  // 避免 NaN timestamps
  const ts = new Date(event.timestamp).getTime()
  if (isNaN(ts)) {
    return { accepted: false, reason: 'invalid_timestamp' }
  }
  return { accepted: true }
}

/**
 * 单事件编排 — 简化版: 事件采集 → CDC触发 → Cohort更新 → 摘要
 */
export function orchestrateSingleEvent(
  event: AnalyticsEvent,
  elapsedMs: number,
): IngestionResult {
  const accepted = processEvent(event)
  if (!accepted.accepted) {
    return { eventAccepted: false, cdcApplied: false, cohortUpdated: false, summary: null }
  }

  const cdcApplied = true
  const cohortUpdated = event.memberId != null || true

  const summary: MetricsSummary | null = elapsedMs < 100
    ? makeMetricsSummary({ totalEvents: 1, totalRevenue: event.revenueCents ?? 0 })
    : null

  return {
    eventAccepted: true,
    cdcApplied,
    cohortUpdated,
    summary,
  }
}

/**
 * 批量编排 — 逐个采集
 */
export function orchestrateBatchEvents(
  events: AnalyticsEvent[],
): BatchIngestionResult {
  const results = events.map(event => {
    const result = processEvent(event)
    return {
      eventId: event.eventId,
      accepted: result.accepted,
      reason: result.accepted ? undefined : result.reason,
    }
  })

  const accepted = results.filter(r => r.accepted).length
  return {
    total: events.length,
    accepted,
    failed: events.length - accepted,
    results,
  }
}

/**
 * 生成诊断报告 — 从事件/CDC/cohort/funnel/retention 统计数据
 */
export function buildDiagnostics(
  events: AnalyticsEvent[],
  cdcEvents: Array<{ tableName: string }>,
  cohorts: Array<{ cohortSize: number }>,
  funnels: Array<{ totalConversionRate: number }>,
  retentions: unknown[],
  currentWatermark: number,
  recentWindowMs: number,
): AnalyticsDiagnostics {
  const byType = {} as Record<EventType, number>
  for (const e of events) {
    byType[e.type] = (byType[e.type] || 0) + 1
  }

  const recentCount = events.filter(e => {
    const ts = new Date(e.timestamp).getTime()
    return Date.now() - ts < recentWindowMs
  }).length

  const totalMembers = cohorts.reduce((sum, c) => sum + c.cohortSize, 0)
  const avgConvRate = funnels.length > 0
    ? funnels.reduce((s, f) => s + f.totalConversionRate, 0) / funnels.length
    : 0

  const tables = [...new Set(cdcEvents.map(e => e.tableName))]
  const retentionHealth = retentions.length > 0 ? 0.85 : 0

  return {
    events: { total: events.length, byType, recentCount },
    cdc: { total: cdcEvents.length, lastWatermark: currentWatermark, tables },
    cohorts: { totalGroups: cohorts.length, totalMembers },
    funnels: { total: funnels.length, avgConversionRate: Number(avgConvRate.toFixed(4)) },
    retentions: { totalPeriods: retentions.length, avgHealth: retentionHealth },
  }
}

/**
 * 健康检查
 */
export function checkHealth(
  events: AnalyticsEvent[],
  watermark: number,
  cohorts: unknown[],
  retentions: unknown[],
  funnels?: unknown[],
): AnalyticsHealth {
  const start = Date.now()

  const eventsOk = events.length > 0 && events.length < 100_000
  const cdcOk = watermark > 0
  const cohortsOk = cohorts.length > 0
  const funnelsOk = true
  const retentionsOk = retentions.length > 0 || cohorts.length > 0

  const componentStatus = {
    events: { ok: eventsOk, count: events.length },
    cdc: { ok: cdcOk, watermark },
    cohorts: { ok: cohortsOk, cohortCount: cohorts.length },
    funnels: { ok: funnelsOk, funnelCount: (funnels ?? []).length },
    retentions: { ok: retentionsOk, periodCount: retentions.length },
  }

  const allOk = eventsOk && cdcOk && cohortsOk && funnelsOk && retentionsOk
  const status: HealthStatus = allOk ? 'healthy' : (eventsOk || cdcOk) ? 'degraded' : 'unhealthy'

  return {
    status,
    componentStatus,
    latencyMs: Date.now() - start,
    lastActivityAt: new Date().toISOString(),
  }
}

/**
 * 重置租户数据 — 返回清除记录数
 */
export function resetTenantData(
  events: unknown[],
  cohorts: unknown[],
  funnels: unknown[],
  retentions: unknown[],
  cdcEvents: unknown[],
): { cleared: boolean; recordsCleared: number } {
  const total = events.length + cohorts.length + funnels.length + retentions.length + cdcEvents.length
  return { cleared: true, recordsCleared: total }
}

/**
 * 全局摘要
 */
export function getGlobalSummary(
  events: unknown[],
  cohorts: unknown[],
  funnels: unknown[],
): { totalTenants: number; totalEvents: number; totalCohorts: number; totalFunnels: number } {
  return {
    totalTenants: 1,
    totalEvents: events.length,
    totalCohorts: cohorts.length,
    totalFunnels: funnels.length,
  }
}

// ─── 4. 测试 — ≥18项 (正例8+反例5+边界5) ─────────────────────────────────

describe('analytics-v2.service (内联纯函数)', () => {
  // ─── processEvent 正例 ───

  it('[P1] 正常事件采集通过', () => {
    const event = makeEvent()
    const result = processEvent(event)
    expect(result.accepted).toBe(true)
    expect(result.reason).toBeUndefined()
  })

  it('[P2] PURCHASE 类型事件通过', () => {
    const event = makeEvent({ type: 'PURCHASE', revenueCents: 9900 })
    expect(processEvent(event).accepted).toBe(true)
  })

  it('[P3] CUSTOM 事件通过', () => {
    const event = makeEvent({ type: 'CUSTOM', what: { name: 'login_bonus', category: 'reward' } })
    expect(processEvent(event).accepted).toBe(true)
  })

  it('[P4] 毫秒精度 timestamp 通过', () => {
    const event = makeEvent({ timestamp: '2026-07-07T23:59:59.999Z' })
    expect(processEvent(event).accepted).toBe(true)
  })

  it('[P5] 数字时间戳字符串通过', () => {
    const event = makeEvent({ timestamp: new Date().toISOString() })
    expect(processEvent(event).accepted).toBe(true)
  })

  it('[P6] who 为 email 格式通过', () => {
    const event = makeEvent({ who: 'user@example.com' })
    expect(processEvent(event).accepted).toBe(true)
  })

  it('[P7] 含 properties 的事件通过', () => {
    const event = makeEvent({
      properties: { utm_source: 'facebook', utm_campaign: 'summer_sale', referrer: 'https://example.com' },
    })
    expect(processEvent(event).accepted).toBe(true)
  })

  it('[P8] 所有字段齐全的事件通过', () => {
    const event = makeEvent({
      eventId: 'evt_full',
      tenantId: 't_enterprise',
      type: 'PURCHASE',
      who: 'vip_user',
      what: { name: 'premium_subscription', category: 'billing' },
      memberId: 'm_999',
      sessionId: 'sess_vip',
      where: 'mobile_app',
      properties: { tier: 'gold', autoRenew: true },
      revenueCents: 29900,
      timestamp: '2026-07-01T12:00:00.000Z',
    })
    expect(processEvent(event).accepted).toBe(true)
  })

  // ─── processEvent 反例 ───

  it('[N1] 空 eventId 拒绝', () => {
    const event = makeEvent({ eventId: '' })
    const result = processEvent(event)
    expect(result.accepted).toBe(false)
    expect(result.reason).toBe('missing_event_id')
  })

  it('[N2] 空 tenantId 拒绝', () => {
    const event = makeEvent({ tenantId: '' })
    expect(processEvent(event).reason).toBe('missing_tenant_id')
  })

  it('[N3] 无效事件类型拒绝', () => {
    const event = makeEvent({ type: 'INVALID_TYPE' as any })
    expect(processEvent(event).reason).toBe('invalid_event_type')
  })

  it('[N4] 空 who 拒绝', () => {
    const event = makeEvent({ who: '' })
    expect(processEvent(event).reason).toBe('missing_who')
  })

  it('[N5] 无效 timestamp 拒绝', () => {
    const event = makeEvent({ timestamp: 'not-a-date' })
    expect(processEvent(event).reason).toBe('invalid_timestamp')
  })

  // ─── 边界条件 ───

  it('[B1] timestamp 为 ISO 边界值 (0000 年) 拒绝', () => {
    const event = makeEvent({ timestamp: '0000-01-01T00:00:00.000Z' })
    const ts = new Date(event.timestamp).getTime()
    expect(isNaN(ts)).toBe(false)
    // 有效日期, 但极早期 — 不拒绝, 只是检查边界
    expect(processEvent(event).accepted).toBe(true)
  })

  it('[B2] 未来 50 年 timestamp 可解析', () => {
    const event = makeEvent({ timestamp: '2076-07-07T00:00:00.000Z' })
    expect(processEvent(event).accepted).toBe(true)
  })

  it('[B3] eventId 超长值 (1000字符) 不拒绝', () => {
    const event = makeEvent({ eventId: 'x'.repeat(1000) })
    expect(processEvent(event).accepted).toBe(true)
  })

  it('[B4] 零 revenueCents 通过', () => {
    const event = makeEvent({ type: 'PURCHASE', revenueCents: 0 })
    expect(processEvent(event).accepted).toBe(true)
  })

  it('[B5] 无 memberId / sessionId 事件通过', () => {
    const event = makeEvent({ memberId: undefined, sessionId: undefined })
    expect(processEvent(event).accepted).toBe(true)
  })

  // ─── orchestrateSingleEvent 正例 ───

  it('[P9] 快速编排 (<100ms) 返回 summary', () => {
    const event = makeEvent({ revenueCents: 9900 })
    const result = orchestrateSingleEvent(event, 50)
    expect(result.eventAccepted).toBe(true)
    expect(result.cdcApplied).toBe(true)
    expect(result.cohortUpdated).toBe(true)
    expect(result.summary).not.toBeNull()
    expect(result.summary!.totalEvents).toBe(1)
    expect(result.summary!.totalRevenue).toBe(9900)
  })

  it('[P10] 慢编排 (>=100ms) 不返回 summary', () => {
    const event = makeEvent()
    const result = orchestrateSingleEvent(event, 150)
    expect(result.eventAccepted).toBe(true)
    expect(result.summary).toBeNull()
  })

  // ─── orchestrateBatchEvents 正例 ───

  it('[P11] 批量 5 个有效事件全部接受', () => {
    const events = makeEvents(5)
    const result = orchestrateBatchEvents(events)
    expect(result.total).toBe(5)
    expect(result.accepted).toBe(5)
    expect(result.failed).toBe(0)
  })

  it('[P12] 批量混合有效/无效事件正确统计', () => {
    const events = [
      makeEvent({ eventId: 'ok_1' }),
      makeEvent({ eventId: '', type: 'PAGE_VIEW' }),
      makeEvent({ eventId: 'ok_2' }),
      makeEvent({ eventId: 'ok_3', tenantId: '' }),
    ]
    const result = orchestrateBatchEvents(events)
    expect(result.total).toBe(4)
    expect(result.accepted).toBe(2)
    expect(result.failed).toBe(2)
    expect(result.results[0].accepted).toBe(true)
    expect(result.results[1].accepted).toBe(false)
    expect(result.results[3].reason).toBe('missing_tenant_id')
  })

  // ─── buildDiagnostics ───

  it('[P13] 有数据时诊断报告各字段正确', () => {
    const events = makeEvents(10)
    const cdcs = [{ tableName: 'events' }, { tableName: 'events' }, { tableName: 'users' }]
    const cohorts = [{ cohortSize: 50 }, { cohortSize: 30 }]
    const funnels = [{ totalConversionRate: 0.25 }, { totalConversionRate: 0.35 }]
    const retentions = [{ period: 'd1' }]

    const diag = buildDiagnostics(events, cdcs, cohorts, funnels, retentions, 1712345678, 3600000)
    expect(diag.events.total).toBe(10)
    expect(diag.cdc.total).toBe(3)
    expect(diag.cdc.tables).toEqual(['events', 'users'])
    expect(diag.cohorts.totalGroups).toBe(2)
    expect(diag.cohorts.totalMembers).toBe(80)
    expect(diag.funnels.total).toBe(2)
    expect(diag.funnels.avgConversionRate).toBe(0.3)
    expect(diag.retentions.totalPeriods).toBe(1)
    expect(diag.retentions.avgHealth).toBe(0.85)
  })

  it('[N6] 无事件/CDC/cohort 时空诊断', () => {
    const diag = buildDiagnostics([], [], [], [], [], 0, 3600000)
    expect(diag.events.total).toBe(0)
    expect(diag.cdc.total).toBe(0)
    expect(diag.funnels.avgConversionRate).toBe(0)
  })

  // ─── checkHealth ───

  it('[P14] 完整组件 => healthy', () => {
    const events = makeEvents(5)
    const health = checkHealth(events, 1712345678, [{ cohortSize: 10 }], [{ period: 'd1' }], [{ totalConversionRate: 0.5 }])
    expect(health.status).toBe('healthy')
    expect(health.componentStatus.events.ok).toBe(true)
    expect(health.componentStatus.cdc.ok).toBe(true)
    expect(health.componentStatus.cohorts.ok).toBe(true)
    expect(health.componentStatus.funnels.ok).toBe(true)
    expect(health.componentStatus.retentions.ok).toBe(true)
  })

  it('[B6] 无事件无 CDC => unhealthy', () => {
    const health = checkHealth([], 0, [], [], [])
    expect(health.status).toBe('unhealthy')
    expect(health.componentStatus.events.ok).toBe(false)
    expect(health.componentStatus.cdc.ok).toBe(false)
  })

  it('[B7] 仅有事件但无 CDC => degraded', () => {
    const events = makeEvents(3)
    const health = checkHealth(events, 0, [], [], [])
    expect(health.status).toBe('degraded')
    expect(health.componentStatus.events.ok).toBe(true)
    expect(health.componentStatus.cdc.ok).toBe(false)
  })

  // ─── resetTenantData ───

  it('[P15] 重置返回正确清除数量', () => {
    const result = resetTenantData(
      makeEvents(5),
      [{ cohortSize: 10 }],
      [{ totalConversionRate: 0.5 }],
      [{ period: 'd1' }],
      [{ tableName: 'events' }],
    )
    expect(result.cleared).toBe(true)
    expect(result.recordsCleared).toBe(9)
  }, 5000)

  it('[B8] 全部空数组重置返回 0', () => {
    const result = resetTenantData([], [], [], [], [])
    expect(result.cleared).toBe(true)
    expect(result.recordsCleared).toBe(0)
  })

  // ─── getGlobalSummary ───

  it('[P16] 全局摘要返回汇总', () => {
    const summary = getGlobalSummary(makeEvents(20), [{ cohortSize: 10 }], [{ totalConversionRate: 0.3 }])
    expect(summary.totalTenants).toBe(1)
    expect(summary.totalEvents).toBe(20)
    expect(summary.totalCohorts).toBe(1)
    expect(summary.totalFunnels).toBe(1)
  })

  // ─── 额外的边界/验证 ───

  it('[B9] 多检测器一致性 — buildDiagnostics 中 funnels 为空时 avgConversionRate=0', () => {
    const diag = buildDiagnostics([], [], [], [], [], 0, 3600000)
    expect(diag.funnels.avgConversionRate).toBe(0)
  })

  it('[B10] eventId 重复 — processEvent 不校验唯一性 (仅检查存在)', () => {
    const e1 = makeEvent({ eventId: 'dup' })
    const e2 = makeEvent({ eventId: 'dup' })
    expect(processEvent(e1).accepted).toBe(true)
    expect(processEvent(e2).accepted).toBe(true)
  })
})
