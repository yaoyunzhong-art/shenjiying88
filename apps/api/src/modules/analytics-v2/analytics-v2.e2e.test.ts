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
