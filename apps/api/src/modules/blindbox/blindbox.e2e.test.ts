import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * E2E: BlindBox 盲盒 HTTP 链路测试
 *
 * 链路:
 *   HTTP → TestController → BlindboxService
 *
 * 验证:
 *   - 创建盲盒计划 (POST /plans)
 *   - 单抽 (POST /:planId/draw)
 *   - 十连抽 (POST /:planId/draw/batch)
 *   - 概率公示 (GET /:planId/probabilities)
 *   - 奖品池查询 (GET /:planId/prize-pool)
 *   - 抽盒历史查询 (GET /:planId/history)
 *   - 异常输入 (不存在 planId / 缺少字段)
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Query,
} from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor'
import { BlindboxService } from './blindbox.service'
import { BlindBoxStatus } from './blindbox.entity'

@Controller('blindbox')
class TestBlindboxController {
  constructor(
    @Inject(BlindboxService) private readonly blindboxService: BlindboxService
  ) {}

  @Post('plans')
  createPlan(@Body() dto: Record<string, unknown>) {
    const { name, tiers, guaranteePityCount } = dto as {
      name: string
      tiers: Array<{
        tierId: string
        name: string
        probability: number
        prizes: Array<{ prizeId: string; name: string; stock: number; weight: number }>
      }>
      guaranteePityCount: number
    }
    return this.blindboxService.createPlan({
      name,
      tiers: tiers.map(t => ({
        tierId: t.tierId,
        name: t.name,
        probability: t.probability,
        prizes: t.prizes.map(p => ({
          prizeId: p.prizeId,
          name: p.name,
          stock: p.stock,
          weight: p.weight,
        })),
      })),
      guaranteePityCount,
    })
  }

  @Post(':planId/draw')
  draw(
    @Param('planId') planId: string,
    @Body() body: { userId: string },
  ) {
    return this.blindboxService.drawSingle(body.userId, planId)
  }

  @Post(':planId/draw/batch')
  drawBatch(
    @Param('planId') planId: string,
    @Body() body: { userId: string },
  ) {
    return this.blindboxService.drawBatch10(body.userId, planId)
  }

  @Get(':planId/probabilities')
  getProbabilities(@Param('planId') planId: string) {
    return this.blindboxService.getProbability公示(planId)
  }

  @Get(':planId/prize-pool')
  getPrizePool(@Param('planId') planId: string) {
    return this.blindboxService.getPrizePool(planId)
  }

  @Get(':planId/history')
  getHistory(
    @Param('planId') planId: string,
    @Query('userId') userId: string,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 20
    return this.blindboxService.getDrawHistory(userId, planId, parsedLimit)
  }
}

const PLAN_BODY = {
  name: 'E2E测试盲盒',
  tiers: [
    {
      tierId: '1',
      name: '一等奖',
      probability: 0.1,
      prizes: [{ prizeId: 'p1', name: '金卡', stock: 5, weight: 1 }],
    },
    {
      tierId: '2',
      name: '二等奖',
      probability: 0.3,
      prizes: [{ prizeId: 'p2', name: '银卡', stock: 10, weight: 1 }],
    },
    {
      tierId: '3',
      name: '三等奖',
      probability: 0.6,
      prizes: [{ prizeId: 'p3', name: '铜卡', stock: 20, weight: 2 }],
    },
  ],
  guaranteePityCount: 10,
}

function getData(body: any) {
  // ResponseInterceptor wraps { success, message, data, timestamp }
  if (body && typeof body === 'object' && 'data' in body && 'success' in body) {
    return body.data
  }
  return body
}

describe('BlindBox E2E (HTTP → Controller → Service)', () => {
  let httpServer: any
  let app: any

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [TestBlindboxController],
      providers: [BlindboxService],
    }).compile()

    app = moduleRef.createNestApplication()
    app.useGlobalInterceptors(new ResponseInterceptor())
    await app.init()
    httpServer = app.getHttpServer()
  })

  afterAll(async () => {
    await app?.close()
  })

  // ─── 创建计划 ──────────────────────────────────────────────────

  describe('POST /blindbox/plans', () => {
    it('正例: 应成功创建盲盒计划返回完整结构', async () => {
      const res = await request(httpServer)
        .post('/blindbox/plans')
        .send(PLAN_BODY)
        .expect(201)

      const body = getData(res.body)
      assert.ok(body)
      assert.ok(body.planId)
      assert.equal(body.name, 'E2E测试盲盒')
      assert.equal(body.status, BlindBoxStatus.ACTIVE)
      assert.equal(body.tiers.length, 3)
      assert.equal(body.guaranteePityCount, 10)
    })

    it('边界: 单层单奖品最小配置', async () => {
      const res = await request(httpServer)
        .post('/blindbox/plans')
        .send({
          name: '迷你盒',
          tiers: [{
            tierId: '1',
            name: '唯一',
            probability: 1.0,
            prizes: [{ prizeId: 'p1', name: '唯一奖', stock: 1, weight: 1 }],
          }],
          guaranteePityCount: 1,
        })
        .expect(201)

      const body = getData(res.body)
      assert.equal(body.tiers.length, 1)
      assert.equal(body.tiers[0].prizes.length, 1)
    })
  })

  // ─── 单抽 ──────────────────────────────────────────────────────

  describe('POST /blindbox/:planId/draw', () => {
    let planId: string

    beforeEach(async () => {
      const res = await request(httpServer)
        .post('/blindbox/plans')
        .send(PLAN_BODY)
      planId = getData(res.body).planId
    })

    it('正例: 单抽返回抽取记录', async () => {
      const res = await request(httpServer)
        .post(`/blindbox/${planId}/draw`)
        .send({ userId: 'e2e-user-1' })
        .expect(201)

      const body = getData(res.body)
      assert.ok(body)
      assert.ok(body.recordId)
      assert.equal(body.userId, 'e2e-user-1')
      assert.equal(body.planId, planId)
      assert.ok(body.prizeName)
      assert.ok(body.tier)
    })

    it('反例: 不存在的 planId 返回 null', async () => {
      const res = await request(httpServer)
        .post('/blindbox/non-existent-plan/draw')
        .send({ userId: 'e2e-user-1' })
        .expect(201)

      assert.equal(getData(res.body), null)
    })
  })

  // ─── 十连抽 ────────────────────────────────────────────────────

  describe('POST /blindbox/:planId/draw/batch', () => {
    let planId: string

    beforeEach(async () => {
      const res = await request(httpServer)
        .post('/blindbox/plans')
        .send(PLAN_BODY)
      planId = getData(res.body).planId
    })

    it('正例: 十连抽返回 10 条记录', async () => {
      const res = await request(httpServer)
        .post(`/blindbox/${planId}/draw/batch`)
        .send({ userId: 'e2e-batch-user' })
        .expect(201)

      const body = getData(res.body)
      assert.ok(Array.isArray(body))
      assert.equal(body.length, 10)
      for (const rec of body) {
        assert.equal(rec.userId, 'e2e-batch-user')
        assert.equal(rec.planId, planId)
      }
    })

    it('边界: 十连抽后抽盒记录为 10 条', async () => {
      // 十连抽后历史记录增长
      const planRes = await request(httpServer)
        .post('/blindbox/plans')
        .send(PLAN_BODY)
        .expect(201)
      const freshPlanId = getData(planRes.body).planId

      await request(httpServer)
        .post(`/blindbox/${freshPlanId}/draw/batch`)
        .send({ userId: 'e2e-batch-stock' })
        .expect(201)

      const histRes = await request(httpServer)
        .get(`/blindbox/${freshPlanId}/history`)
        .query({ userId: 'e2e-batch-stock', limit: '100' })
        .expect(200)

      const records = getData(histRes.body)
      assert.equal(records.length, 10)
    })

    it('反例: 不存在的 plan 返回空数组', async () => {
      const res = await request(httpServer)
        .post('/blindbox/non-existent/draw/batch')
        .send({ userId: 'e2e-user' })
        .expect(201)

      const body = getData(res.body)
      assert.ok(Array.isArray(body))
      assert.equal(body.length, 0)
    })
  })

  // ─── 概率公示 ──────────────────────────────────────────────────

  describe('GET /blindbox/:planId/probabilities', () => {
    let planId: string

    beforeEach(async () => {
      const res = await request(httpServer)
        .post('/blindbox/plans')
        .send(PLAN_BODY)
      planId = getData(res.body).planId
    })

    it('正例: 返回各层概率', async () => {
      const res = await request(httpServer)
        .get(`/blindbox/${planId}/probabilities`)
        .expect(200)

      const body = getData(res.body)
      assert.ok(body)
      assert.equal(body.tiers.length, 3)
    })

    it('正例: 概率之和应为 1.0', async () => {
      const res = await request(httpServer)
        .get(`/blindbox/${planId}/probabilities`)
        .expect(200)

      const body = getData(res.body)
      const sum = body.tiers.reduce((s: number, t: any) => s + t.probability, 0)
      assert.ok(Math.abs(sum - 1.0) < 0.001)
    })

    it('反例: 不存在返回 null', async () => {
      const res = await request(httpServer)
        .get('/blindbox/nonexistent/probabilities')
        .expect(200)

      assert.equal(getData(res.body), null)
    })
  })

  // ─── 奖品池 ────────────────────────────────────────────────────

  describe('GET /blindbox/:planId/prize-pool', () => {
    let planId: string

    beforeEach(async () => {
      const res = await request(httpServer)
        .post('/blindbox/plans')
        .send(PLAN_BODY)
      planId = getData(res.body).planId
    })

    it('正例: 返回计划名和完整奖品池', async () => {
      const res = await request(httpServer)
        .get(`/blindbox/${planId}/prize-pool`)
        .expect(200)

      const body = getData(res.body)
      assert.equal(body.planId, planId)
      assert.equal(body.name, 'E2E测试盲盒')
      assert.equal(body.prizePools.length, 3)
    })

    it('边界: 单抽后历史记录增加', async () => {
      const planRes = await request(httpServer)
        .post('/blindbox/plans')
        .send(PLAN_BODY)
        .expect(201)
      const freshPlanId = getData(planRes.body).planId

      await request(httpServer)
        .post(`/blindbox/${freshPlanId}/draw`)
        .send({ userId: 'e2e-pool-user-2' })
        .expect(201)

      const histRes = await request(httpServer)
        .get(`/blindbox/${freshPlanId}/history`)
        .query({ userId: 'e2e-pool-user-2', limit: '100' })
        .expect(200)

      const records = getData(histRes.body)
      assert.equal(records.length, 1)
      assert.equal(records[0].planId, freshPlanId)
    })

    it('反例: 不存在返回 null', async () => {
      const res = await request(httpServer)
        .get('/blindbox/invalid/prize-pool')
        .expect(200)

      assert.equal(getData(res.body), null)
    })
  })

  // ─── 历史记录 ──────────────────────────────────────────────────

  describe('GET /blindbox/:planId/history', () => {
    let planId: string

    beforeEach(async () => {
      const res = await request(httpServer)
        .post('/blindbox/plans')
        .send(PLAN_BODY)
      planId = getData(res.body).planId
    })

    it('正例: 返回用户在该计划的抽取记录', async () => {
      // 先抽一次
      await request(httpServer)
        .post(`/blindbox/${planId}/draw`)
        .send({ userId: 'e2e-hist-user' })
        .expect(201)

      const res = await request(httpServer)
        .get(`/blindbox/${planId}/history`)
        .query({ userId: 'e2e-hist-user', limit: '20' })
        .expect(200)

      const body = getData(res.body)
      assert.ok(Array.isArray(body))
      assert.equal(body.length, 1)
      assert.equal(body[0].userId, 'e2e-hist-user')
      assert.equal(body[0].planId, planId)
    })

    it('边界: limit 限制返回数量', async () => {
      for (let i = 0; i < 5; i++) {
        await request(httpServer)
          .post(`/blindbox/${planId}/draw`)
          .send({ userId: 'e2e-lim-user' })
          .expect(201)
      }

      const res = await request(httpServer)
        .get(`/blindbox/${planId}/history`)
        .query({ userId: 'e2e-lim-user', limit: '3' })
        .expect(200)

      const body = getData(res.body)
      assert.ok(body.length <= 3)
    })

    it('边界: 无记录返回空数组', async () => {
      const res = await request(httpServer)
        .get(`/blindbox/${planId}/history`)
        .query({ userId: 'e2e-new-user', limit: '20' })
        .expect(200)

      const body = getData(res.body)
      assert.ok(Array.isArray(body))
      assert.equal(body.length, 0)
    })
  })
})
