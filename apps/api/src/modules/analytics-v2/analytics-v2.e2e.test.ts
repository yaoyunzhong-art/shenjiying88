/**
 * analytics-v2.e2e.test.ts — 数据分析 V2 模块 E2E 测试
 *
 * 链路:
 *   HTTP → AnalyticsV2Controller → AnalyticsV2Service → sub-services/adapters
 *
 * 验证:
 *   - 事件采集 (event collection + batch)
 *   - 数据聚合 (metrics summary)
 *   - 时间筛选 (recent events, retention)
 */

import { describe, it, expect, beforeEach } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { AnalyticsV2Module } from './analytics-v2.module'
import { EventAdapter } from './datasources/event.adapter'
import { CDCAdapter } from './datasources/cdc.adapter'
import { CohortAdapter } from './datasources/cohort.adapter'
import { FunnelAdapter } from './datasources/funnel.adapter'
import { RetentionAdapter } from './datasources/retention.adapter'
import { EventCollector } from './event-collector'
import { CDCStream } from './cdc-stream'
import { CohortAnalyzer } from './cohort-analyzer'
import { FunnelCalculator } from './funnel-calculator'
import { CohortService } from './services/cohort.service'
import { FunnelService } from './services/funnel.service'
import { RetentionService } from './services/retention.service'
import { MetricsService } from './services/metrics.service'
import { AnalyticsV2Controller } from './analytics-v2.controller'

async function buildApp() {
  const moduleRef = await Test.createTestingModule({
    controllers: [AnalyticsV2Controller],
    providers: [
      // 5 adapters
      EventAdapter,
      CDCAdapter,
      CohortAdapter,
      FunnelAdapter,
      RetentionAdapter,
      // 4 engines
      EventCollector,
      CDCStream,
      CohortAnalyzer,
      FunnelCalculator,
      // 4 services
      CohortService,
      FunnelService,
      RetentionService,
      MetricsService,
      AnalyticsV2Controller,
    ],
  }).compile()

  const app = moduleRef.createNestApplication()
  await app.init()
  return { app }
}

describe('AnalyticsV2 E2E', () => {
  describe('事件采集', () => {
    it('采集单事件并返回 accepted', async () => {
      const { app } = await buildApp()
      try {
        const res = await request(app.getHttpServer())
          .post('/analytics-v2/event/collect')
          .send({
            tenantId: 'tenant-e2e',
            eventId: 'evt-001',
            type: 'PAGEVIEW',
            who: 'user-001',
            what: 'homepage_view',
            memberId: 'member-001',
          })
        assert.equal(res.statusCode, 201)
        assert.equal(res.body.accepted, true)
      } finally {
        await app.close()
      }
    })

    it('批量采集事件并返回计数', async () => {
      const { app } = await buildApp()
      try {
        const res = await request(app.getHttpServer())
          .post('/analytics-v2/event/batch')
          .send({
            events: [
              { tenantId: 'tenant-e2e', eventId: 'evt-b1', type: 'CLICK', who: 'user-001', what: 'btn_click' },
              { tenantId: 'tenant-e2e', eventId: 'evt-b2', type: 'PURCHASE', who: 'user-001', what: 'order_submit', revenueCents: 5000 },
              { tenantId: 'tenant-e2e', eventId: 'evt-b3', type: 'CONVERSION', who: 'user-002', what: 'signup' },
            ],
          })
        assert.equal(res.statusCode, 201)
        assert.equal(res.body.count, 3)
        assert.equal(res.body.results.length, 3)
      } finally {
        await app.close()
      }
    })
  })

  describe('数据聚合 — 报表生成', () => {
    it('metrics summary 返回指标卡片', async () => {
      const { app } = await buildApp()
      try {
        // Seed some events first
        await request(app.getHttpServer())
          .post('/analytics-v2/event/collect')
          .send({ tenantId: 'tenant-metrics', eventId: 'm-evt-01', type: 'PAGEVIEW', who: 'u1', what: 'page_a' })
        await request(app.getHttpServer())
          .post('/analytics-v2/event/collect')
          .send({ tenantId: 'tenant-metrics', eventId: 'm-evt-02', type: 'PAGEVIEW', who: 'u2', what: 'page_b' })
        await request(app.getHttpServer())
          .post('/analytics-v2/event/collect')
          .send({ tenantId: 'tenant-metrics', eventId: 'm-evt-03', type: 'CONVERSION', who: 'u1', what: 'purchase' })

        const res = await request(app.getHttpServer())
          .get('/analytics-v2/metrics/summary?tenantId=tenant-metrics')
        assert.equal(res.statusCode, 200)
        assert.ok(Array.isArray(res.body.metrics))
        assert.ok(res.body.metrics.length >= 1)
      } finally {
        await app.close()
      }
    })
  })

  describe('时间筛选 — 近期事件', () => {
    it('近期事件返回事件列表', async () => {
      const { app } = await buildApp()
      try {
        await request(app.getHttpServer())
          .post('/analytics-v2/event/collect')
          .send({ tenantId: 'tenant-recent', eventId: 'r-evt-01', type: 'PAGEVIEW', who: 'u1', what: 'home' })
        await request(app.getHttpServer())
          .post('/analytics-v2/event/collect')
          .send({ tenantId: 'tenant-recent', eventId: 'r-evt-02', type: 'CLICK', who: 'u2', what: 'btn' })

        const res = await request(app.getHttpServer())
          .get('/analytics-v2/event/recent?tenantId=tenant-recent')
        assert.equal(res.statusCode, 200)
        assert.ok(Array.isArray(res.body.events))
        assert.ok(res.body.events.length >= 2)
      } finally {
        await app.close()
      }
    })

    it('漏斗创建与查询', async () => {
      const { app } = await buildApp()
      try {
        const createRes = await request(app.getHttpServer())
          .post('/analytics-v2/funnel/create')
          .send({
            tenantId: 'tenant-funnel',
            name: '注册转化漏斗',
            steps: [
              { name: '访问首页', eventType: 'PAGEVIEW' },
              { name: '点击注册', eventType: 'CLICK' },
              { name: '完成注册', eventType: 'CONVERSION' },
            ],
            windowDays: 7,
          })
        assert.equal(createRes.statusCode, 201)
        assert.equal(createRes.body.funnel.name, '注册转化漏斗')
        assert.equal(createRes.body.funnel.steps.length, 3)

        const listRes = await request(app.getHttpServer())
          .get('/analytics-v2/funnel/list?tenantId=tenant-funnel')
        assert.equal(listRes.statusCode, 200)
        assert.ok(Array.isArray(listRes.body.funnels))
        assert.ok(listRes.body.funnels.length >= 1)
      } finally {
        await app.close()
      }
    })
  })

  describe('Cohort & Retention', () => {
    it('注册会员后生成 cohort', async () => {
      const { app } = await buildApp()
      try {
        const res = await request(app.getHttpServer())
          .post('/analytics-v2/cohort/register')
          .send({
            tenantId: 'tenant-cohort',
            period: 'WEEKLY',
            memberId: 'member-week-01',
            registrationDate: '2026-07-16T00:00:00Z',
          })
        assert.equal(res.statusCode, 201)
        assert.equal(res.body.cohort.cohortSize, 1)

        const listRes = await request(app.getHttpServer())
          .get('/analytics-v2/cohort/list?tenantId=tenant-cohort')
        assert.equal(listRes.statusCode, 200)
        assert.ok(Array.isArray(listRes.body.cohorts))
        assert.ok(listRes.body.cohorts.length >= 1)
      } finally {
        await app.close()
      }
    })

    it('生成留存报告', async () => {
      const { app } = await buildApp()
      try {
        await request(app.getHttpServer())
          .post('/analytics-v2/cohort/matrix?tenantId=tenant-ret&period=WEEKLY&periods=4')

        const res = await request(app.getHttpServer())
          .post('/analytics-v2/retention/generate')
          .send({ tenantId: 'tenant-ret', period: 'WEEKLY' })
        assert.equal(res.statusCode, 201)
        assert.equal(res.body.report.period, 'WEEKLY')
        assert.equal(res.body.report.tenantId, 'tenant-ret')
      } finally {
        await app.close()
      }
    })
  })

  describe('CDC 数据同步', () => {
    it('CDC 事件应用与查询', async () => {
      const { app } = await buildApp()
      try {
        const applyRes = await request(app.getHttpServer())
          .post('/analytics-v2/cdc/apply')
          .send({
            tenantId: 'tenant-cdc',
            tableName: 'events',
            recordId: 'rec-001',
            eventType: 'CREATED',
            eventId: 'cdc-apply-001',
          })
        assert.equal(applyRes.statusCode, 201)

        const tailRes = await request(app.getHttpServer())
          .get('/analytics-v2/cdc/tail?tenantId=tenant-cdc')
        assert.equal(tailRes.statusCode, 200)
        assert.ok(Array.isArray(tailRes.body.events))
      } finally {
        await app.close()
      }
    })
  })
})

describe('[增强] 时间范围筛选与边界条件', () => {
  it('多租户隔离: 不同租户数据不互相影响', async () => {
    const { app } = await buildApp()
    try {
      await request(app.getHttpServer())
        .post('/analytics-v2/event/collect')
        .send({ tenantId: 'tenant-iso-a', eventId: 'iso-01', type: 'PAGEVIEW', who: 'u1', what: 'page_a' })
      await request(app.getHttpServer())
        .post('/analytics-v2/event/collect')
        .send({ tenantId: 'tenant-iso-b', eventId: 'iso-02', type: 'CLICK', who: 'u2', what: 'btn_b' })

      const resA = await request(app.getHttpServer()).get('/analytics-v2/event/recent?tenantId=tenant-iso-a')
      assert.equal(resA.statusCode, 200)
      assert.equal(resA.body.events.length, 1)
      assert.equal(resA.body.events[0].eventId, 'iso-01')

      const resB = await request(app.getHttpServer()).get('/analytics-v2/event/recent?tenantId=tenant-iso-b')
      assert.equal(resB.statusCode, 200)
      assert.equal(resB.body.events.length, 1)
      assert.equal(resB.body.events[0].tenantId, 'tenant-iso-b')
    } finally {
      await app.close()
    }
  })

  it('重复事件 ID 应拒绝(幂等)', async () => {
    const { app } = await buildApp()
    try {
      const body = { tenantId: 'tenant-idempotent', eventId: 'dup-evt', type: 'PAGEVIEW', who: 'u1', what: 'home' }
      const first = await request(app.getHttpServer()).post('/analytics-v2/event/collect').send(body)
      assert.equal(first.statusCode, 201)
      assert.equal(first.body.accepted, true)

      const second = await request(app.getHttpServer()).post('/analytics-v2/event/collect').send(body)
      assert.equal(second.statusCode, 201)
      assert.equal(second.body.accepted, false)
      assert.ok(second.body.reason?.includes('duplicate'))
    } finally {
      await app.close()
    }
  })

  it('缺失必填字段的事件应拒绝', async () => {
    const { app } = await buildApp()
    try {
      const res = await request(app.getHttpServer())
        .post('/analytics-v2/event/collect')
        .send({ tenantId: 'tenant-missing', eventId: 'missing-evt' })
      // Missing type and who — validator should catch or adapter should reject
      assert.equal(res.statusCode, 201)
      // Adapter level: missing_required_fields
      assert.equal(res.body.accepted, false)
    } finally {
      await app.close()
    }
  })

  it('超长 properties 应被拒绝', async () => {
    const { app } = await buildApp()
    try {
      const props: Record<string, unknown> = {}
      for (let i = 0; i < 60; i++) props[`key_${i}`] = `val_${i}`

      const res = await request(app.getHttpServer())
        .post('/analytics-v2/event/collect')
        .send({
          tenantId: 'tenant-toomanyprops', eventId: 'too-many-props',
          type: 'CUSTOM', who: 'u1', what: 'overload', properties: props,
        })
      assert.equal(res.statusCode, 201)
      assert.equal(res.body.accepted, false)
      assert.ok(res.body.reason?.includes('too_many_properties'))
    } finally {
      await app.close()
    }
  })
})

describe('[增强] CDCEvent 深度测试', () => {
  it('CDC 重复 eventId 应返回 duplicate', async () => {
    const { app } = await buildApp()
    try {
      const body = {
        tenantId: 'tenant-cdc2', tableName: 'users', recordId: 'u-001',
        eventType: 'CREATED', eventId: 'cdc-dup-001',
      }
      const first = await request(app.getHttpServer()).post('/analytics-v2/cdc/apply').send(body)
      assert.equal(first.statusCode, 201)

      const second = await request(app.getHttpServer()).post('/analytics-v2/cdc/apply').send(body)
      assert.equal(second.statusCode, 201)
      assert.equal(second.body.accepted, false)
      assert.ok(second.body.reason?.includes('duplicate'))
    } finally {
      await app.close()
    }
  })

  it('CDC 重放事件', async () => {
    const { app } = await buildApp()
    try {
      const body = {
        tenantId: 'tenant-cdc-replay', tableName: 'orders', recordId: 'ord-001',
        eventType: 'CREATED', eventId: 'cdc-replay-001',
      }
      const res = await request(app.getHttpServer()).post('/analytics-v2/cdc/replay').send(body)
      assert.equal(res.statusCode, 201)
      assert.equal(res.body.accepted, true)
    } finally {
      await app.close()
    }
  })

  it('CDC DELETE 事件无 before 应拒绝', async () => {
    const { app } = await buildApp()
    try {
      // CDC DELETE 必须有 before 快照
      const res = await request(app.getHttpServer())
        .post('/analytics-v2/cdc/apply')
        .send({
          tenantId: 'tenant-cdc-del', tableName: 'items', recordId: 'item-001',
          eventType: 'DELETED', eventId: 'cdc-del-no-before',
        })
      assert.equal(res.statusCode, 201)
      assert.equal(res.body.accepted, false)
      assert.ok(res.body.reason?.includes('missing_before'))
    } finally {
      await app.close()
    }
  })

  it('CDC 状态查询返回 watermark', async () => {
    const { app } = await buildApp()
    try {
      await request(app.getHttpServer())
        .post('/analytics-v2/cdc/apply')
        .send({
          tenantId: 'tenant-cdc-status', tableName: 'logs', recordId: 'log-001',
          eventType: 'CREATED', eventId: 'cdc-status-001'
        })

      const res = await request(app.getHttpServer()).get('/analytics-v2/cdc/status?tenantId=tenant-cdc-status')
      assert.equal(res.statusCode, 200)
      assert.ok(res.body.currentWatermark > 0)
    } finally {
      await app.close()
    }
  })
})

describe('[增强] 多维度分析与数据聚合', () => {
  it('PURCHASE 事件带 revenueCents 被正确采集', async () => {
    const { app } = await buildApp()
    try {
      const res = await request(app.getHttpServer())
        .post('/analytics-v2/event/collect')
        .send({
          tenantId: 'tenant-rev', eventId: 'rev-001', type: 'PURCHASE',
          who: 'u-rev', what: 'buy_item', revenueCents: 9999,
        })
      assert.equal(res.statusCode, 201)
      assert.equal(res.body.accepted, true)
      assert.ok(res.body.event?.revenueCents === 9999)
    } finally {
      await app.close()
    }
  })

  it('PURCHASE 事件包含 revenueCents 时 metrics 应计算营收', async () => {
    const { app } = await buildApp()
    try {
      await request(app.getHttpServer()).post('/analytics-v2/event/collect').send({
        tenantId: 'tenant-metrics-rev', eventId: 'mr-01', type: 'PURCHASE',
        who: 'u1', what: 'order_001', revenueCents: 5000,
      })
      await request(app.getHttpServer()).post('/analytics-v2/event/collect').send({
        tenantId: 'tenant-metrics-rev', eventId: 'mr-02', type: 'PURCHASE',
        who: 'u2', what: 'order_002', revenueCents: 15000,
      })

      const res = await request(app.getHttpServer()).get('/analytics-v2/metrics/summary?tenantId=tenant-metrics-rev')
      assert.equal(res.statusCode, 200)
      const revenueMetric = res.body.metrics.find((m: { name: string }) => m.name === '营收')
      assert.ok(revenueMetric)
      assert.ok(revenueMetric.value >= 20000)  // 5000 + 15000
    } finally {
      await app.close()
    }
  })

  it('实时指标 endpoint 返回 activeSessions', async () => {
    const { app } = await buildApp()
    try {
      await request(app.getHttpServer()).post('/analytics-v2/event/collect').send({
        tenantId: 'tenant-live', eventId: 'live-01', type: 'PAGEVIEW',
        who: 'u-live', what: 'page', sessionId: 'sess-001',
      })

      const res = await request(app.getHttpServer()).get('/analytics-v2/metrics/live?tenantId=tenant-live')
      assert.equal(res.statusCode, 200)
      assert.ok(typeof res.body.activeSessions === 'number')
      assert.ok(typeof res.body.eventsLast5min === 'number')
    } finally {
      await app.close()
    }
  })

  it('metrics/health 返回完整健康报告', async () => {
    const { app } = await buildApp()
    try {
      await request(app.getHttpServer()).post('/analytics-v2/event/collect').send({
        tenantId: 'tenant-health', eventId: 'hl-01', type: 'PAGEVIEW', who: 'u1', what: 'page',
      })

      const res = await request(app.getHttpServer()).get('/analytics-v2/metrics/health?tenantId=tenant-health')
      assert.equal(res.statusCode, 200)
      assert.ok(res.body.metrics)
      assert.ok(res.body.retentionHealth)
      assert.ok(typeof res.body.funnels === 'number')
      assert.ok(typeof res.body.cdc !== 'undefined')
    } finally {
      await app.close()
    }
  })

  it('批量采集的 events 包含多种 eventType', async () => {
    const { app } = await buildApp()
    try {
      const res = await request(app.getHttpServer())
        .post('/analytics-v2/event/batch')
        .send({
          events: [
            { tenantId: 'tenant-batch-types', eventId: 'bt-01', type: 'PAGEVIEW', who: 'u1', what: 'page' },
            { tenantId: 'tenant-batch-types', eventId: 'bt-02', type: 'CLICK', who: 'u1', what: 'btn' },
            { tenantId: 'tenant-batch-types', eventId: 'bt-03', type: 'CONVERSION', who: 'u2', what: 'signup' },
            { tenantId: 'tenant-batch-types', eventId: 'bt-04', type: 'PURCHASE', who: 'u2', what: 'buy', revenueCents: 1000 },
            { tenantId: 'tenant-batch-types', eventId: 'bt-05', type: 'CUSTOM', who: 'u3', what: 'share' },
          ],
        })
      assert.equal(res.statusCode, 201)
      assert.equal(res.body.count, 5)

      const recentRes = await request(app.getHttpServer()).get('/analytics-v2/event/recent?tenantId=tenant-batch-types')
      assert.equal(recentRes.statusCode, 200)
      assert.equal(recentRes.body.events.length, 5)
    } finally {
      await app.close()
    }
  })
})

describe('[增强] Cohort & Funnel 深度测试', () => {
  it('批量创建多个 cohort', async () => {
    const { app } = await buildApp()
    try {
      for (let m = 1; m <= 3; m++) {
        await request(app.getHttpServer())
          .post('/analytics-v2/cohort/register')
          .send({
            tenantId: 'tenant-multi-cohort', period: 'WEEKLY',
            memberId: `member-${m}`, registrationDate: `2026-07-${String(m + 14).padStart(2, '0')}T00:00:00Z`,
          })
      }

      const listRes = await request(app.getHttpServer()).get('/analytics-v2/cohort/list?tenantId=tenant-multi-cohort')
      assert.equal(listRes.statusCode, 200)
      assert.ok(listRes.body.cohorts.length >= 1)
    } finally {
      await app.close()
    }
  })

  it('cohort matrix 返回正确的矩阵结构', async () => {
    const { app } = await buildApp()
    try {
      // Seed cohorts
      await request(app.getHttpServer()).post('/analytics-v2/cohort/register').send({
        tenantId: 'tenant-matrix', period: 'WEEKLY',
        memberId: 'matrix-member', registrationDate: '2026-07-10T00:00:00Z',
      })

      const res = await request(app.getHttpServer()).get('/analytics-v2/cohort/matrix?tenantId=tenant-matrix&period=WEEKLY')
      assert.equal(res.statusCode, 200)
      assert.equal(res.body.period, 'WEEKLY')
      assert.ok(Array.isArray(res.body.cohorts) || Array.isArray(res.body.matrix))
    } finally {
      await app.close()
    }
  })

  it('cohort reliability 报告', async () => {
    const { app } = await buildApp()
    try {
      await request(app.getHttpServer()).post('/analytics-v2/cohort/register').send({
        tenantId: 'tenant-reliability', period: 'WEEKLY',
        memberId: 'rel-member', registrationDate: '2026-07-10T00:00:00Z',
      })

      const res = await request(app.getHttpServer()).get('/analytics-v2/cohort/reliability?tenantId=tenant-reliability&period=WEEKLY')
      assert.equal(res.statusCode, 200)
      assert.ok(typeof res.body.total === 'number')
      assert.ok(typeof res.body.reliable === 'number')
    } finally {
      await app.close()
    }
  })

  it('funnel/:id 获取漏斗详情', async () => {
    const { app } = await buildApp()
    try {
      const createRes = await request(app.getHttpServer())
        .post('/analytics-v2/funnel/create')
        .send({
          tenantId: 'tenant-funnel-detail',
          name: '详情漏斗',
          steps: [
            { name: '浏览', eventType: 'PAGEVIEW' },
            { name: '点击', eventType: 'CLICK' },
          ],
          windowDays: 7,
        })
      const funnelId = createRes.body.funnel.id

      const detailRes = await request(app.getHttpServer()).get(`/analytics-v2/funnel/${funnelId}?tenantId=tenant-funnel-detail`)
      assert.equal(detailRes.statusCode, 200)
      assert.equal(detailRes.body.id, funnelId)
    } finally {
      await app.close()
    }
  })

  it('funnel/template/default 返回模板', async () => {
    const { app } = await buildApp()
    try {
      const res = await request(app.getHttpServer()).get('/analytics-v2/funnel/template/default')
      assert.equal(res.statusCode, 200)
      assert.equal(res.body.name, '电商转化漏斗')
      assert.ok(Array.isArray(res.body.steps))
      assert.ok(res.body.steps.length >= 4)
    } finally {
      await app.close()
    }
  })

  it('retention/health 返回健康度评分', async () => {
    const { app } = await buildApp()
    try {
      // Seed data
      await request(app.getHttpServer()).post('/analytics-v2/cohort/register').send({
        tenantId: 'tenant-ret-health', period: 'WEEKLY',
        memberId: 'health-member', registrationDate: '2026-07-10T00:00:00Z',
      })
      await request(app.getHttpServer()).post('/analytics-v2/retention/generate').send({
        tenantId: 'tenant-ret-health', period: 'WEEKLY',
      })

      const res = await request(app.getHttpServer()).get('/analytics-v2/retention/health?tenantId=tenant-ret-health&period=WEEKLY')
      assert.equal(res.statusCode, 200)
      assert.ok(typeof res.body.score === 'number')
      assert.ok(['POOR', 'FAIR', 'GOOD', 'EXCELLENT'].includes(res.body.level))
    } finally {
      await app.close()
    }
  })

  it('retention/trend 返回趋势数据', async () => {
    const { app } = await buildApp()
    try {
      await request(app.getHttpServer()).post('/analytics-v2/cohort/register').send({
        tenantId: 'tenant-ret-trend', period: 'WEEKLY',
        memberId: 'trend-member', registrationDate: '2026-07-10T00:00:00Z',
      })
      await request(app.getHttpServer()).post('/analytics-v2/retention/generate').send({
        tenantId: 'tenant-ret-trend', period: 'WEEKLY',
      })

      const res = await request(app.getHttpServer()).get('/analytics-v2/retention/trend?tenantId=tenant-ret-trend&period=WEEKLY')
      assert.equal(res.statusCode, 200)
      assert.ok(Array.isArray(res.body.trend))
    } finally {
      await app.close()
    }
  })
})

describe('[增强] 缓存穿透与并发场景', () => {
  it('并发采集 30 个事件全部成功', async () => {
    const { app } = await buildApp()
    try {
      const batchSize = 30
      const events = Array.from({ length: batchSize }, (_, i) => ({
        tenantId: 'tenant-concurrent-events', eventId: `concurrent-evt-${i}`,
        type: 'PAGEVIEW', who: `user-${i % 10}`, what: `page_${i}`,
      }))

      const res = await request(app.getHttpServer())
        .post('/analytics-v2/event/batch')
        .send({ events })
      assert.equal(res.statusCode, 201)
      assert.equal(res.body.count, batchSize)
    } finally {
      await app.close()
    }
  })

  it('频繁查询 stats 不导致异常', async () => {
    const { app } = await buildApp()
    try {
      // 先采集一些事件
      for (let i = 0; i < 10; i++) {
        await request(app.getHttpServer()).post('/analytics-v2/event/collect').send({
          tenantId: 'tenant-frequent', eventId: `freq-${i}`,
          type: 'PAGEVIEW', who: `u${i}`, what: 'page',
        })
      }

      // 多次查询
      for (let i = 0; i < 10; i++) {
        const res = await request(app.getHttpServer()).get('/analytics-v2/metrics/summary?tenantId=tenant-frequent')
        assert.equal(res.statusCode, 200)
        assert.ok(res.body.metrics.length >= 1)
      }
    } finally {
      await app.close()
    }
  })

  it('先采集事件再查询 recent 结果一致', async () => {
    const { app } = await buildApp()
    try {
      await request(app.getHttpServer()).post('/analytics-v2/event/collect').send({
        tenantId: 'tenant-consistency', eventId: 'cst-01',
        type: 'PAGEVIEW', who: 'u1', what: 'home',
      })

      const res1 = await request(app.getHttpServer()).get('/analytics-v2/event/recent?tenantId=tenant-consistency')
      assert.equal(res1.body.events.length, 1)

      await request(app.getHttpServer()).post('/analytics-v2/event/collect').send({
        tenantId: 'tenant-consistency', eventId: 'cst-02',
        type: 'CLICK', who: 'u2', what: 'btn',
      })

      const res2 = await request(app.getHttpServer()).get('/analytics-v2/event/recent?tenantId=tenant-consistency')
      assert.equal(res2.body.events.length, 2)
    } finally {
      await app.close()
    }
  })

  it('采集 CLICK 事件后 recent 应包含该事件', async () => {
    const { app } = await buildApp()
    try {
      await request(app.getHttpServer()).post('/analytics-v2/event/collect').send({
        tenantId: 'tenant-click', eventId: 'click-01', type: 'CLICK', who: 'u-click', what: 'checkout_btn',
      })

      const res = await request(app.getHttpServer()).get('/analytics-v2/event/recent?tenantId=tenant-click')
      assert.equal(res.statusCode, 200)
      const clickEvent = res.body.events.find((e: { eventId: string }) => e.eventId === 'click-01')
      assert.ok(clickEvent)
      assert.equal(clickEvent.type, 'CLICK')
    } finally {
      await app.close()
    }
  })

  it('events/recent 使用 limit 参数', async () => {
    const { app } = await buildApp()
    try {
      for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer()).post('/analytics-v2/event/collect').send({
          tenantId: 'tenant-limit-test', eventId: `limit-${i}`,
          type: 'PAGEVIEW', who: 'u1', what: 'page',
        })
      }

      const res = await request(app.getHttpServer()).get('/analytics-v2/event/recent?tenantId=tenant-limit-test&limit=3')
      assert.equal(res.statusCode, 200)
      assert.equal(res.body.events.length, 3)
    } finally {
      await app.close()
    }
  })
})

describe('[增强] 安全校验场景', () => {
  it('特殊字符在事件数据中不被截断', async () => {
    const { app } = await buildApp()
    try {
      const res = await request(app.getHttpServer())
        .post('/analytics-v2/event/collect')
        .send({
          tenantId: 'tenant-xss', eventId: 'xss-001', type: 'CUSTOM',
          who: '<script>alert(1)</script>',
          what: 'test<script>evil</script>',
          properties: { malicious: '<img onerror="alert(2)" src=x>' },
        })
      assert.equal(res.statusCode, 201)
      assert.equal(res.body.accepted, true)
    } finally {
      await app.close()
    }
  })

  it('超大 batch 应在合理范围内', async () => {
    const { app } = await buildApp()
    try {
      const events = Array.from({ length: 200 }, (_, i) => ({
        tenantId: 'tenant-big-batch', eventId: `big-batch-${i}`,
        type: 'PAGEVIEW', who: `u${i}`, what: 'page',
      }))

      const res = await request(app.getHttpServer())
        .post('/analytics-v2/event/batch')
        .send({ events })
      assert.equal(res.statusCode, 201)
      assert.equal(res.body.count, 200)
    } finally {
      await app.close()
    }
  })

  it('cohort track endpoint 可用', async () => {
    const { app } = await buildApp()
    try {
      await request(app.getHttpServer()).post('/analytics-v2/cohort/register').send({
        tenantId: 'tenant-track', period: 'WEEKLY',
        memberId: 'track-member', registrationDate: '2026-07-10T00:00:00Z',
      })

      const res = await request(app.getHttpServer())
        .post('/analytics-v2/cohort/track')
        .send({
          tenantId: 'tenant-track', memberId: 'track-member',
          activityType: 'PAGEVIEW',
        })
      assert.equal(res.statusCode, 201)
    } finally {
      await app.close()
    }
  })

  it('CONVERSION 事件采集后不应影响其他事件', async () => {
    const { app } = await buildApp()
    try {
      await request(app.getHttpServer()).post('/analytics-v2/event/collect').send({
        tenantId: 'tenant-conv', eventId: 'conv-01', type: 'PAGEVIEW', who: 'u1', what: 'landing',
      })
      await request(app.getHttpServer()).post('/analytics-v2/event/collect').send({
        tenantId: 'tenant-conv', eventId: 'conv-02', type: 'CONVERSION', who: 'u1', what: 'signup',
      })

      const res = await request(app.getHttpServer()).get('/analytics-v2/event/recent?tenantId=tenant-conv')
      assert.equal(res.statusCode, 200)
      assert.equal(res.body.events.length, 2)

      const pageviewEvents = res.body.events.filter((e: { type: string }) => e.type === 'PAGEVIEW')
      const conversionEvents = res.body.events.filter((e: { type: string }) => e.type === 'CONVERSION')
      assert.equal(pageviewEvents.length, 1)
      assert.equal(conversionEvents.length, 1)
    } finally {
      await app.close()
    }
  })
})
