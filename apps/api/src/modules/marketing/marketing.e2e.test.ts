import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * Phase-42 T172: E2E 营销 HTTP 链路
 *
 * 验证:
 *   - POST /marketing/rfm/compute - RFM 计算 (全量 + 指定会员)
 *   - GET  /marketing/rfm/stats    - RFM 统计
 *   - GET  /marketing/rfm/segments - 8 分群
 *   - POST /marketing/ab/create    - 创建 A/B 实验
 *   - POST /marketing/coupon/issue - 发放优惠券
 *   - POST /marketing/roi/calculate - ROI 计算
 *   - GET  /marketing/health       - 健康检查
 *   - POST /marketing/attribution/attribute - 归因
 *   - GET  /marketing/channel/route - 渠道路由
 *   - POST /marketing/ab/record    - 记录事件
 *   - GET  /marketing/ab/result    - 实验结果
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import express from 'express'
import request from 'supertest'
import type { Express, NextFunction, Request, Response } from 'express'

// ─── Module Under Test ───────────────────────────

import { MarketingController } from './marketing.controller'
import { RFMCalculator } from './rfm-calculator'
import { ABTestEngine } from './ab-test'
import { CouponIssuer } from './coupon-issuer'
import { AttributionEngine } from './attribution'
import { SegmentService } from './segment.service'
import { FrequencyCapService } from './frequency-cap.service'
import { ROICalculator } from './roi-calculator'
import { ChannelRouter } from './channel-router'
import { MarketingMetricsService } from '../marketing-metrics/marketing-metrics.service'
import { RFMAdapter } from './datasources/rfm.adapter'
import { MemberAdapter } from './datasources/member.adapter'
import { OrderAdapter } from './datasources/order.adapter'
import { ExperimentAdapter } from './datasources/experiment.adapter'
import { CouponAdapter } from './datasources/coupon.adapter'

// ─── Helper: build a fresh Express app per test ───

function buildApp({
  rfmAdapter: rfmAdapterIn,
  memberAdapter: memberAdapterIn,
  orderAdapter: orderAdapterIn,
  experimentAdapter: experimentAdapterIn,
  couponAdapter: couponAdapterIn,
}: {
  rfmAdapter?: RFMAdapter
  memberAdapter?: MemberAdapter
  orderAdapter?: OrderAdapter
  experimentAdapter?: ExperimentAdapter
  couponAdapter?: CouponAdapter
} = {}): { app: Express; controller: MarketingController; metricsService: MarketingMetricsService } {
  const _app = express()

  // tenant context middleware
  _app.use((req: Request, _res: Response, next: NextFunction) => {
    ;(req as any).tenantContext = {
      tenantId: (req.header('x-tenant-id') as string) ?? 'tenant-001',
      brandId: 'brand-001',
      storeId: 'store-001',
      marketCode: 'cn-mainland',
    }
    next()
  })

  // actor context middleware
  _app.use((req: Request, _res: Response, next: NextFunction) => {
    ;(req as any).actorContext = {
      actorId: 'actor-001',
      roles: ['MARKETING_MANAGER'],
      permissions: ['marketing.rfm.read', 'marketing.campaign.write'],
    }
    next()
  })

  _app.use(express.json())

  // Build dependencies (allow injection for stateful tests)
  const rfmAdapter = rfmAdapterIn ?? new RFMAdapter()
  const memberAdapter = memberAdapterIn ?? new MemberAdapter()
  const orderAdapter = orderAdapterIn ?? new OrderAdapter()
  const experimentAdapter = experimentAdapterIn ?? new ExperimentAdapter()
  const couponAdapter = couponAdapterIn ?? new CouponAdapter()
  const rfmCalc = new RFMCalculator(rfmAdapter, memberAdapter, orderAdapter)
  const abTest = new ABTestEngine(experimentAdapter)
  const couponIssuer = new CouponIssuer(couponAdapter, rfmAdapter)
  const attribution = new AttributionEngine()
  const segment = new SegmentService(rfmAdapter, rfmCalc)
  const freqCap = new FrequencyCapService(couponAdapter)
  const roiCalc = new ROICalculator()
  const channelRouter = new ChannelRouter()
  const metricsService = new MarketingMetricsService()

  const _controller = new MarketingController(
    rfmCalc, abTest, couponIssuer, attribution,
    segment, freqCap, roiCalc, channelRouter, metricsService
  )

  // ─── Route wiring ────────────────────────────────

  _app.post('/marketing/rfm/compute', (req, res) => {
    const result = _controller.computeRFM(req.body)
    res.status(201).json(result)
  })

  _app.get('/marketing/rfm/stats', (req, res) => {
    const result = _controller.rfmStats(req.query as any)
    res.status(200).json(result)
  })

  _app.get('/marketing/rfm/segments', (_req, res) => {
    const result = _controller.listSegments()
    res.status(200).json(result)
  })

  _app.post('/marketing/ab/create', (req, res) => {
    const result = _controller.createExperiment(req.body)
    res.status(201).json(result)
  })

  _app.get('/marketing/ab/list', (req, res) => {
    const result = _controller.listExperiments(req.query as any)
    res.status(200).json(result)
  })

  _app.get('/marketing/ab/result', (req, res) => {
    const result = _controller.abResult(req.query as any)
    res.status(200).json(result)
  })

  _app.post('/marketing/ab/record', (req, res) => {
    const result = _controller.recordEvent(req.body)
    res.status(201).json(result)
  })

  _app.post('/marketing/coupon/issue', (req, res) => {
    const result = _controller.issueCoupon(req.body)
    res.status(201).json(result)
  })

  _app.post('/marketing/roi/calculate', (req, res) => {
    const result = _controller.calculateROI(req.body)
    res.status(201).json(result)
  })

  _app.get('/marketing/health', (_req, res) => {
    const result = _controller.health()
    res.status(200).json(result)
  })

  _app.post('/marketing/attribution/attribute', (req, res) => {
    const result = _controller.attribute(req.body)
    res.status(201).json(result)
  })

  _app.get('/marketing/channel/route', (req, res) => {
    const result = (_controller as any).routeChannel(req.query as any)
    res.status(200).json(result)
  })

  _app.post('/marketing/coupon/auto-issue', (req, res) => {
    const result = _controller.autoIssue(req.body)
    res.status(201).json(result)
  })

  _app.post('/marketing/coupon/redeem', (req, res) => {
    const result = _controller.redeemCoupon(req.body)
    res.status(201).json(result)
  })

  _app.get('/marketing/coupon/frequency-cap', (req, res) => {
    const result = (_controller as any).freqCapStatus(req.query as any)
    res.status(200).json(result)
  })

  _app.post('/marketing/attribution/record', (req, res) => {
    const result = _controller.recordTouch(req.body)
    res.status(201).json(result)
  })

  return { app: _app, controller: _controller, metricsService }
}

// ─── E2E Tests ───────────────────────────────────

it('E2E Marketing: POST /marketing/rfm/compute full tenant', async () => {
  const { app } = buildApp()

  const res = await request(app)
    .post('/marketing/rfm/compute')
    .send({ tenantId: 'tenant-001' })

  assert.equal(res.status, 201)
  assert.ok(Array.isArray(res.body.profiles))
  assert.ok(typeof res.body.count === 'number')
})

it('E2E Marketing: POST /marketing/rfm/compute specific members', async () => {
  const { app } = buildApp()

  const res = await request(app)
    .post('/marketing/rfm/compute')
    .send({ tenantId: 'tenant-001', memberIds: ['member-001'] })

  assert.equal(res.status, 201)
  assert.ok(Array.isArray(res.body.profiles))
})

it('E2E Marketing: GET /marketing/rfm/stats', async () => {
  const { app } = buildApp()

  const res = await request(app)
    .get('/marketing/rfm/stats')
    .query({ tenantId: 'tenant-001' })

  assert.equal(res.status, 200)
  assert.ok(res.body.stats)
  assert.ok('healthy' in res.body)
})

it('E2E Marketing: GET /marketing/rfm/segments returns 8', async () => {
  const { app } = buildApp()

  const res = await request(app).get('/marketing/rfm/segments')

  assert.equal(res.status, 200)
  assert.equal(res.body.segments.length, 8)
})

it('E2E Marketing: POST /marketing/ab/create and list', async () => {
  const { app } = buildApp()

  // create
  const createRes = await request(app)
    .post('/marketing/ab/create')
    .send({
      tenantId: 'tenant-001',
      campaignId: 'camp-001',
      name: 'Test',
      variantA: { id: 'va', name: 'Control', content: 'no discount', rewardType: 'COUPON', rewardValue: 0 },
      variantB: { id: 'vb', name: 'Variant', content: '10% off', rewardType: 'DISCOUNT', rewardValue: 10 },
      trafficSplit: 50,
      minSampleSize: 100,
      status: 'DRAFT',
      startAt: '2026-07-01T00:00:00.000Z',
    })

  assert.equal(createRes.status, 201)
  assert.ok(createRes.body.experiment)
  assert.equal(createRes.body.experiment.name, 'Test')

  // list
  const listRes = await request(app)
    .get('/marketing/ab/list')
    .query({ tenantId: 'tenant-001' })
  assert.equal(listRes.status, 200)
  assert.ok(Array.isArray(listRes.body.experiments))
})

it('E2E Marketing: POST /marketing/ab/record + GET result', async () => {
  const { app } = buildApp()

  // create a running experiment
  const createRes = await request(app)
    .post('/marketing/ab/create')
    .send({
      tenantId: 'tenant-001',
      campaignId: 'camp-002',
      name: 'Event Test',
      variantA: { id: 'va', name: 'A', content: 'a', rewardType: 'COUPON', rewardValue: 0 },
      variantB: { id: 'vb', name: 'B', content: 'b', rewardType: 'DISCOUNT', rewardValue: 10 },
      trafficSplit: 50,
      minSampleSize: 10,
      status: 'RUNNING',
      startAt: '2026-07-01T00:00:00.000Z',
    })

  const expId = createRes.body.experiment.id

  // record events
  for (const event of ['impression', 'click', 'conversion'] as const) {
    const recRes = await request(app)
      .post('/marketing/ab/record')
      .send({ experimentId: expId, memberId: 'member-001', event, revenueCents: event === 'conversion' ? 5000 : undefined })
    assert.equal(recRes.status, 201)
    assert.equal(recRes.body.success, true)
  }

  // get result
  const resultRes = await request(app)
    .get('/marketing/ab/result')
    .query({ experimentId: expId })
  assert.equal(resultRes.status, 200)
  assert.ok(resultRes.body.result)
})

it('E2E Marketing: POST /marketing/coupon/issue', async () => {
  const { app } = buildApp()

  const res = await request(app)
    .post('/marketing/coupon/issue')
    .send({
      tenantId: 'tenant-001',
      memberId: 'member-001',
      campaignId: 'camp-001',
      couponSegment: 'WELCOME_OFFER',
      expiryDays: 30,
    })

  assert.equal(res.status, 201)
  assert.ok(res.body != null)
})

it('E2E Marketing: POST /marketing/coupon/auto-issue', async () => {
  const { app } = buildApp()

  const res = await request(app)
    .post('/marketing/coupon/auto-issue')
    .send({ tenantId: 'tenant-001', memberId: 'member-001', campaignId: 'camp-001' })

  assert.equal(res.status, 201)
})

it('E2E Marketing: GET /marketing/coupon/frequency-cap', async () => {
  const { app } = buildApp()

  const res = await request(app)
    .get('/marketing/coupon/frequency-cap')
    .query({ tenantId: 'tenant-001', memberId: 'member-001' })

  assert.equal(res.status, 200)
  assert.ok(res.body != null)
})

it('E2E Marketing: POST /marketing/roi/calculate', async () => {
  const { app } = buildApp()

  const res = await request(app)
    .post('/marketing/roi/calculate')
    .send({
      campaignId: 'camp-001',
      campaignName: 'Test',
      sent: 10000,
      clicked: 1500,
      converted: 200,
      revenueCents: 5000000,
      costCents: 1000000,
      periodDays: 30,
    })

  assert.equal(res.status, 201)
  assert.equal(res.body.campaignId, 'camp-001')
  assert.ok(typeof res.body.roi === 'number')
  assert.ok(res.body.roi > 0)
})

it('E2E Marketing: GET /marketing/health', async () => {
  const { app } = buildApp()

  const res = await request(app).get('/marketing/health')
  assert.equal(res.status, 200)
  assert.equal(res.body.status, 'ok')
  assert.equal(res.body.module, 'marketing')
})

it('E2E Marketing: POST /marketing/attribution/attribute', async () => {
  const { app } = buildApp()

  const res = await request(app)
    .post('/marketing/attribution/attribute')
    .send({ memberId: 'member-001', conversionId: 'conv-001', revenueCents: 50000, mode: 'last' })

  assert.equal(res.status, 201)
  assert.equal(res.body.memberId, 'member-001')
  assert.ok(Array.isArray(res.body.touchPoints))
})

it('E2E Marketing: POST /marketing/attribution/record', async () => {
  const { app } = buildApp()

  const res = await request(app)
    .post('/marketing/attribution/record')
    .send({
      id: 'tp-001',
      memberId: 'member-001',
      channel: 'IN_APP',
      event: 'IMPRESSION',
      timestamp: '2026-06-28T00:00:00.000Z',
    })

  assert.equal(res.status, 201)
})

it('E2E Marketing: POST /marketing/coupon/redeem', async () => {
  const { app } = buildApp()

  // issue first
  const issueRes = await request(app)
    .post('/marketing/coupon/issue')
    .send({
      tenantId: 'tenant-001',
      memberId: 'member-001',
      campaignId: 'camp-001',
      couponSegment: 'VIP_DISCOUNT',
      expiryDays: 30,
    })

  const recordId = issueRes.body.id || issueRes.body.recordId

  if (recordId) {
    const redeemRes = await request(app)
      .post('/marketing/coupon/redeem')
      .send({ tenantId: 'tenant-001', recordId })
    assert.equal(redeemRes.status, 201)
    assert.equal(redeemRes.body.success, true)
  }
})

it('E2E Marketing: coupon issue + redeem writes tenant metrics', async () => {
  const { app, metricsService } = buildApp()

  const issueRes = await request(app)
    .post('/marketing/coupon/issue')
    .send({
      tenantId: 'tenant-metrics',
      memberId: 'member-metrics',
      campaignId: 'camp-metrics',
      couponSegment: 'WELCOME_OFFER',
      expiryDays: 30,
    })

  assert.equal(issueRes.status, 201)
  assert.equal(issueRes.body.success, true)

  const recordId = issueRes.body.record?.id as string | undefined
  assert.ok(recordId)

  const redeemRes = await request(app)
    .post('/marketing/coupon/redeem')
    .send({ tenantId: 'tenant-metrics', recordId })

  assert.equal(redeemRes.status, 201)
  assert.equal(redeemRes.body.success, true)

  const snap = metricsService.snapshot('tenant-metrics')
  assert.equal(snap.couponIssuedTotal, 1)
  assert.equal(snap.couponRedemptionTotal, 1)
})

it('E2E Marketing: GET /marketing/channel/route', async () => {
  const { app } = buildApp()

  const res = await request(app)
    .get('/marketing/channel/route')
    .query({ tenantId: 'tenant-001', memberId: 'member-001' })

  assert.equal(res.status, 200)
  assert.ok(res.body.channel)
  assert.ok(typeof res.body.costCents === 'number')
})

// ─── Error / Edge Cases ──────────────────────────

it('E2E Marketing: POST /marketing/rfm/compute bad tenant returns empty', async () => {
  const { app } = buildApp()

  const res = await request(app)
    .post('/marketing/rfm/compute')
    .send({ tenantId: 'nonexistent' })

  assert.equal(res.status, 201)
  assert.equal(res.body.count, 0)
})

it('E2E Marketing: GET /marketing/rfm/stats missing tenant returns 200', async () => {
  const { app } = buildApp()

  const res = await request(app).get('/marketing/rfm/stats')

  assert.equal(res.status, 200)
  assert.ok(res.body.stats)
})
