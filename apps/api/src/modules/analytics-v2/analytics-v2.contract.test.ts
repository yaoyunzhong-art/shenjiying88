import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * analytics-v2.contract.test.ts - AnalyticsV2 契约测试
 *
 * 验证跨模块转换函数正确性 + 边界情况。
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import {
  toAnalyticsEventContract,
  toCDCEventContract,
  toCohortGroupContract,
  toFunnelResultContract,
  toRetentionResultContract,
  toMetricsSummaryContract,
  isValidEventType,
  isMonetizableEvent,
  isRecentEvent,
  getEventRevenue,
} from './analytics-v2.contract'
import type {
  AnalyticsEvent,
  CDCEvent,
  CohortGroup,
  FunnelResult,
  RetentionResult,
  MetricsSummary,
} from './analytics-v2.entity'

const BASE_TS = '2026-06-27T00:00:00.000Z'

describe('AnalyticsV2Contract - toAnalyticsEventContract', () => {
  it('正常转换所有字段', () => {
    const input: AnalyticsEvent = {
      id: 'evt-001',
      tenantId: 't-001',
      eventId: 'e-001',
      type: 'PURCHASE',
      memberId: 'm-001',
      sessionId: 's-001',
      timestamp: BASE_TS,
      who: 'm-001',
      when: BASE_TS,
      where: { url: '/checkout', channel: 'web' },
      what: { name: 'purchase', category: 'conversion' },
      why: 'btn_click',
      how: 'desktop',
      properties: { amount: 2999 },
      revenueCents: 2999,
    }
    const result = toAnalyticsEventContract(input)
    assert.equal(result.id, 'evt-001')
    assert.equal(result.tenantId, 't-001')
    assert.equal(result.type, 'PURCHASE')
    assert.equal(result.revenueCents, 2999)
    // 不暴露内部字段 (where, when, why, how, properties)
    assert.equal((result as any).where, undefined)
    assert.equal((result as any).why, undefined)
    assert.equal((result as any).how, undefined)
    assert.equal((result as any).properties, undefined)
  })

  it('转换时 what 为字符串', () => {
    const input: AnalyticsEvent = {
      id: 'evt-002',
      tenantId: 't-001',
      eventId: 'e-002',
      type: 'PAGEVIEW',
      timestamp: BASE_TS,
      who: 'anon',
      when: BASE_TS,
      where: {},
      what: { name: 'page_view', category: 'page' } as any,
      properties: {},
    }
    const result = toAnalyticsEventContract(input)
    assert.equal(result.what, 'page_view')
  })

  it('转换时 what 为空 Action 对象', () => {
    const input: AnalyticsEvent = {
      id: 'evt-003',
      tenantId: 't-001',
      eventId: 'e-003',
      type: 'CLICK',
      timestamp: BASE_TS,
      who: 'anon',
      when: BASE_TS,
      where: {},
      what: { name: '', category: '' },
      properties: {},
    }
    const result = toAnalyticsEventContract(input)
    assert.equal(result.what, 'CLICK')
  })

  it('边界: 无 memberId / sessionId', () => {
    const input: AnalyticsEvent = {
      id: 'evt-004',
      tenantId: 't-001',
      eventId: 'e-004',
      type: 'CUSTOM',
      timestamp: BASE_TS,
      who: 'anon-123',
      when: BASE_TS,
      where: {},
      what: { name: 'custom_event' } as any,
      properties: {},
    }
    const result = toAnalyticsEventContract(input)
    assert.equal(result.memberId, undefined)
    assert.equal(result.sessionId, undefined)
    assert.equal(result.revenueCents, undefined)
  })
})

describe('AnalyticsV2Contract - toCDCEventContract', () => {
  it('正常转换 CDCEvent', () => {
    const input: CDCEvent = {
      id: 'cdc-001',
      tenantId: 't-001',
      tableName: 'events',
      recordId: 'e-001',
      eventType: 'CREATED',
      timestamp: BASE_TS,
      eventId: 'cdc-e-001',
      watermark: 1719500000000,
      before: undefined,
      after: { id: 'e-001' },
      replayed: false,
      appliedAt: BASE_TS,
    }
    const result = toCDCEventContract(input)
    assert.equal(result.id, 'cdc-001')
    assert.equal(result.eventType, 'CREATED')
    assert.equal(result.watermark, 1719500000000)
    assert.equal(result.replayed, false)
    // 不暴露内部字段
    assert.equal((result as any).before, undefined)
    assert.equal((result as any).after, undefined)
    assert.equal((result as any).appliedAt, undefined)
  })

  it('边界: replayed = true', () => {
    const input: CDCEvent = {
      id: 'cdc-002',
      tenantId: 't-001',
      tableName: 'members',
      recordId: 'm-001',
      eventType: 'UPDATED',
      timestamp: BASE_TS,
      eventId: 'cdc-m-001',
      watermark: 1719500001000,
      before: { name: '旧' },
      after: { name: '新' },
      replayed: true,
      appliedAt: BASE_TS,
    }
    const result = toCDCEventContract(input)
    assert.equal(result.replayed, true)
    assert.equal(result.eventType, 'UPDATED')
  })

  it('边界: DELETED 类型', () => {
    const input: CDCEvent = {
      id: 'cdc-003',
      tenantId: 't-001',
      tableName: 'events',
      recordId: 'e-003',
      eventType: 'DELETED',
      timestamp: BASE_TS,
      eventId: 'cdc-e-003',
      watermark: 1719500002000,
      replayed: false,
    }
    const result = toCDCEventContract(input)
    assert.equal(result.eventType, 'DELETED')
  })
})

describe('AnalyticsV2Contract - toCohortGroupContract', () => {
  it('正常转换 CohortGroup', () => {
    const input: CohortGroup = {
      id: 'coh-001',
      tenantId: 't-001',
      period: 'WEEKLY',
      periodKey: '2026-W26',
      cohortSize: 100,
      retention: [1, 0.8, 0.6, 0.4, 0.3],
      startDate: '2026-06-22',
      endDate: '2026-06-28',
    }
    const result = toCohortGroupContract(input)
    assert.equal(result.period, 'WEEKLY')
    assert.equal(result.periodKey, '2026-W26')
    assert.equal(result.cohortSize, 100)
    assert.deepEqual(result.retention, [1, 0.8, 0.6, 0.4, 0.3])
  })

  it('边界: MONTHLY 周期 + 空 retention', () => {
    const input: CohortGroup = {
      id: 'coh-002',
      tenantId: 't-001',
      period: 'MONTHLY',
      periodKey: '2026-06',
      cohortSize: 0,
      retention: [],
      startDate: '2026-06-01',
      endDate: '2026-06-30',
    }
    const result = toCohortGroupContract(input)
    assert.equal(result.cohortSize, 0)
    assert.deepEqual(result.retention, [])
  })
})

describe('AnalyticsV2Contract - toFunnelResultContract', () => {
  it('正常转换 FunnelResult', () => {
    const input: FunnelResult = {
      id: 'fun-001',
      tenantId: 't-001',
      name: '注册转化漏斗',
      steps: [
        { name: '访问首页', eventType: 'PAGEVIEW' },
        { name: '注册', eventType: 'CONVERSION' },
      ],
      windowDays: 7,
      stepResults: [
        { stepName: '访问首页', enteredCount: 1000, conversionRate: 1, dropOffRate: 0 },
        { stepName: '注册', enteredCount: 200, conversionRate: 0.2, dropOffRate: 0.8 },
      ],
      totalConversionRate: 0.2,
      computedAt: BASE_TS,
    }
    const result = toFunnelResultContract(input)
    assert.equal(result.name, '注册转化漏斗')
    assert.equal(result.steps.length, 2)
    assert.equal(result.stepResults.length, 2)
    assert.equal(result.totalConversionRate, 0.2)
    assert.equal(result.stepResults[1].dropOffRate, 0.8)
  })

  it('边界: 空步骤', () => {
    const input: FunnelResult = {
      id: 'fun-002',
      tenantId: 't-001',
      name: '空漏斗',
      steps: [],
      windowDays: 1,
      stepResults: [],
      totalConversionRate: 0,
      computedAt: BASE_TS,
    }
    const result = toFunnelResultContract(input)
    assert.equal(result.steps.length, 0)
    assert.equal(result.stepResults.length, 0)
    assert.equal(result.totalConversionRate, 0)
  })
})

describe('AnalyticsV2Contract - toRetentionResultContract', () => {
  it('正常转换 RetentionResult', () => {
    const input: RetentionResult = {
      tenantId: 't-001',
      period: 'WEEKLY',
      matrix: [
        { cohort: '2026-W23', cohortSize: 100, d0: 100, d1: 80, d7: 60, d30: 40 },
        { cohort: '2026-W24', cohortSize: 120, d0: 120, d1: 96, d7: 72, d30: 48 },
      ],
      avgRetention: { d1: 0.8, d7: 0.6, d30: 0.4 },
    }
    const result = toRetentionResultContract(input)
    assert.equal(result.matrix.length, 2)
    assert.equal(result.avgRetention.d1, 0.8)
    assert.equal(result.avgRetention.d30, 0.4)
    // 不暴露 d60/d90
    assert.equal((result.matrix[0] as any).d60, undefined)
  })

  it('边界: 空矩阵', () => {
    const input: RetentionResult = {
      tenantId: 't-001',
      period: 'MONTHLY',
      matrix: [],
      avgRetention: { d1: 0, d7: 0, d30: 0 },
    }
    const result = toRetentionResultContract(input)
    assert.equal(result.matrix.length, 0)
  })
})

describe('AnalyticsV2Contract - toMetricsSummaryContract', () => {
  it('正常转换 MetricsSummary', () => {
    const input: MetricsSummary = {
      tenantId: 't-001',
      period: '7d',
      metrics: [
        { name: 'PV', value: 1000, unit: '次', change: 5, trend: 'UP' },
      ],
      series: {
        pv: [
          { timestamp: '2026-06-27T00:00:00Z', value: 100 },
        ],
      },
    }
    const result = toMetricsSummaryContract(input)
    assert.equal(result.metrics.length, 1)
    assert.equal(result.metrics[0].name, 'PV')
    assert.equal(result.metrics[0].trend, 'UP')
    assert.equal(result.series.pv.length, 1)
  })

  it('边界: 空 metrics / series', () => {
    const input: MetricsSummary = {
      tenantId: 't-001',
      period: '1d',
      metrics: [],
      series: {},
    }
    const result = toMetricsSummaryContract(input)
    assert.equal(result.metrics.length, 0)
    assert.deepEqual(result.series, {})
  })
})

describe('AnalyticsV2Contract - utility functions', () => {
  it('isValidEventType: 有效类型', () => {
    assert.equal(isValidEventType('PAGEVIEW'), true)
    assert.equal(isValidEventType('CLICK'), true)
    assert.equal(isValidEventType('CONVERSION'), true)
    assert.equal(isValidEventType('PURCHASE'), true)
    assert.equal(isValidEventType('CUSTOM'), true)
  })

  it('isValidEventType: 无效类型', () => {
    assert.equal(isValidEventType('INVALID'), false)
    assert.equal(isValidEventType(''), false)
    assert.equal(isValidEventType('VIEW'), false)
  })

  it('isMonetizableEvent: 收费事件', () => {
    const purchaseEvent: Parameters<typeof isMonetizableEvent>[0] = {
      id: 'e-001', tenantId: 't-001', eventId: 'e-001',
      type: 'PURCHASE', timestamp: BASE_TS, who: 'm-001', what: 'purchase',
    }
    const clickEvent: Parameters<typeof isMonetizableEvent>[0] = {
      id: 'e-002', tenantId: 't-001', eventId: 'e-002',
      type: 'CLICK', timestamp: BASE_TS, who: 'anon', what: 'click',
    }
    assert.equal(isMonetizableEvent(purchaseEvent), true)
    assert.equal(isMonetizableEvent(clickEvent), false)
  })

  it('getEventRevenue: revenue 值', () => {
    const withRevenue: Parameters<typeof getEventRevenue>[0] = {
      id: 'e-001', tenantId: 't-001', eventId: 'e-001',
      type: 'PURCHASE', timestamp: BASE_TS, who: 'm-001', what: 'purchase',
      revenueCents: 5000,
    }
    const withoutRevenue: Parameters<typeof getEventRevenue>[0] = {
      id: 'e-002', tenantId: 't-001', eventId: 'e-002',
      type: 'PAGEVIEW', timestamp: BASE_TS, who: 'anon', what: 'view',
    }
    assert.equal(getEventRevenue(withRevenue), 5000)
    assert.equal(getEventRevenue(withoutRevenue), 0)
  })

  it('isRecentEvent: 近期事件', () => {
    const now = new Date()
    const recent = now.toISOString()
    const old = new Date(now.getTime() - 7200000).toISOString()
    assert.equal(isRecentEvent(recent), true)
    assert.equal(isRecentEvent(old), false)
  })
})
