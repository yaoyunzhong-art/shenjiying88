import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
/**
 * E2E: AI Sales 导购副驾 HTTP 链路
 *
 * 链路:
 *   HTTP → TestController → ProductRecommendationEngine / ObjectionHandler / FollowUpScheduler
 *
 * 验证:
 *   - 上下文感知推荐 POST /recommend
 *   - 向上销售推荐 POST /recommend/upsell
 *   - 交叉销售推荐 POST /recommend/cross-sell
 *   - 商品查询 GET /products
 *   - 异议分类 POST /objection/classify
 *   - 异议回应 POST /objection/respond
 *   - 对话模拟 POST /objection/simulate
 *   - 跟进安排 POST /follow-up
 *   - 到期跟进 GET /follow-up/due/:salesId
 *   - 待处理跟进 GET /follow-up/pending
 *   - 标记完成 POST /follow-up/complete
 *   - 生日提醒 GET /follow-up/upcoming-birthdays
 *   - 设置生日 POST /follow-up/birthday
 *   - 购买记录 POST /purchase
 *   - 异常输入处理
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
import {
  ProductRecommendationEngine,
  ObjectionHandler,
  FollowUpScheduler,
} from './ai-sales-copilot.service'

@Controller('ai-sales')
class TestAiSalesController {
  constructor(
    @Inject(ProductRecommendationEngine)
    private readonly recommendationEngine: ProductRecommendationEngine,
    @Inject(ObjectionHandler)
    private readonly objectionHandler: ObjectionHandler,
    @Inject(FollowUpScheduler)
    private readonly followUpScheduler: FollowUpScheduler
  ) {}

  @Post('recommend')
  recommend(@Body() body: Record<string, unknown>) {
    const { customerId, currentBrowsing, recentViewed, scenario } = body as any
    const recommendations = this.recommendationEngine.recommendForCustomer(customerId, {
      currentBrowsing,
      recentViewed: recentViewed ?? [],
      scenario,
    })
    return { type: 'context-aware', recommendations, timestamp: new Date().toISOString() }
  }

  @Post('recommend/upsell')
  recommendUpsell(@Body() body: Record<string, unknown>) {
    const { productId } = body as any
    const recommendations = this.recommendationEngine.recommendUpsell(productId)
    return { type: 'upsell', recommendations, timestamp: new Date().toISOString() }
  }

  @Post('recommend/cross-sell')
  recommendCrossSell(@Body() body: Record<string, unknown>) {
    const { productId } = body as any
    const recommendations = this.recommendationEngine.recommendCrossSell(productId)
    return { type: 'cross-sell', recommendations, timestamp: new Date().toISOString() }
  }

  @Get('products')
  getAllProducts() {
    return this.recommendationEngine.getAllProducts()
  }

  @Get('products/:id')
  getProduct(@Param('id') id: string) {
    return this.recommendationEngine.getProduct(id)
  }

  @Post('purchase')
  recordPurchase(@Body() body: Record<string, unknown>) {
    const { customerId, productId } = body as any
    this.recommendationEngine.recordPurchase(customerId, productId)
    return { success: true }
  }

  @Post('objection/classify')
  classifyObjection(@Body() body: Record<string, unknown>) {
    const { customerReply } = body as any
    const type = this.objectionHandler.classifyObjection(customerReply)
    return { type }
  }

  @Post('objection/respond')
  generateResponse(@Body() body: Record<string, unknown>) {
    const { customerId, productId, objectionType, conversationHistory } = body as any
    const response = this.objectionHandler.generateResponse(objectionType, {
      customerId,
      productId,
      conversationHistory: conversationHistory ?? [],
    })
    return { type: objectionType, response }
  }

  @Post('objection/simulate')
  simulateConversation(@Body() body: Record<string, unknown>) {
    const { objection, response } = body as any
    const turns = this.objectionHandler.simulateConversation(objection, response)
    const finalSentiment = turns[turns.length - 1].sentiment
    return { turns, finalSentiment }
  }

  @Post('follow-up')
  scheduleFollowUp(@Body() body: Record<string, unknown>) {
    const { customerId, salesId, type, scheduledAt, message } = body as any
    const reminder = this.followUpScheduler.scheduleFollowUp(customerId, {
      customerId,
      salesId,
      type,
      scheduledAt,
      message: message ?? '',
      priority: 3,
    })
    return {
      id: reminder.id,
      message: reminder.message,
      priority: reminder.priority,
      status: reminder.status,
    }
  }

  @Get('follow-up/due/:salesId')
  getDueFollowUps(@Param('salesId') salesId: string) {
    return this.followUpScheduler.getDueFollowUps(salesId)
  }

  @Get('follow-up/pending')
  getPendingFollowUps(@Query('salesId') salesId?: string) {
    return this.followUpScheduler.getAllPending(salesId)
  }

  @Post('follow-up/complete')
  markCompleted(@Body() body: Record<string, unknown>) {
    const { followUpId } = body as any
    const result = this.followUpScheduler.markCompleted(followUpId)
    if (!result) return { error: `FollowUp ${followUpId} not found` }
    return result
  }

  @Get('follow-up/upcoming-birthdays')
  getUpcomingBirthdays(@Query('days') days?: string) {
    const daysAhead = days ? parseInt(days, 10) : 7
    return this.followUpScheduler.getUpcomingBirthdays(daysAhead)
  }

  @Post('follow-up/birthday')
  setBirthday(@Body() body: Record<string, unknown>) {
    const { customerId, birthday } = body as any
    this.followUpScheduler.setCustomerBirthday(customerId, birthday)
    return { success: true }
  }
}

async function buildApp() {
  const moduleRef = await Test.createTestingModule({
    controllers: [TestAiSalesController],
    providers: [
      ProductRecommendationEngine,
      ObjectionHandler,
      FollowUpScheduler,
    ],
  }).compile()

  const app = moduleRef.createNestApplication()
  // NOTE: not using ResponseInterceptor here to test raw controller output
  await app.init()
  return app
}

describe('[ai-sales] E2E: HTTP 链路', () => {
  let app: Awaited<ReturnType<typeof buildApp>>

  beforeAll(async () => {
    app = await buildApp()
  })

  afterAll(async () => {
    await app.close()
  })

  // ─── 商品推荐 ────────────────────────────────

  it('POST /ai-sales/recommend 上下文感知推荐返回正确结构', async () => {
    const res = await request(app.getHttpServer())
      .post('/ai-sales/recommend')
      .send({ customerId: 'cust-001', currentBrowsing: 'prod-002', recentViewed: [] })
      .expect(201)

    assert.equal(res.body.type, 'context-aware')
    assert.ok(Array.isArray(res.body.recommendations))
    assert.ok(res.body.recommendations.length > 0)
    assert.equal(typeof res.body.timestamp, 'string')
  })

  it('POST /ai-sales/recommend 无参数客可返回推荐', async () => {
    const res = await request(app.getHttpServer())
      .post('/ai-sales/recommend')
      .send({ customerId: 'new-customer', recentViewed: [] })
      .expect(201)

    assert.ok(res.body.recommendations.length > 0)
  })

  it('POST /ai-sales/recommend 生日场景返回加成推荐', async () => {
    const res = await request(app.getHttpServer())
      .post('/ai-sales/recommend')
      .send({ customerId: 'cust-001', currentBrowsing: 'prod-002', recentViewed: [], scenario: 'birthday' })
      .expect(201)

    assert.ok(res.body.recommendations.length > 0)
  })

  it('POST /ai-sales/recommend/upsell 返回升级推荐', async () => {
    const res = await request(app.getHttpServer())
      .post('/ai-sales/recommend/upsell')
      .send({ productId: 'prod-001' })
      .expect(201)

    assert.equal(res.body.type, 'upsell')
    assert.ok(Array.isArray(res.body.recommendations))
  })

  it('POST /ai-sales/recommend/upsell 不存在商品返回空数组', async () => {
    const res = await request(app.getHttpServer())
      .post('/ai-sales/recommend/upsell')
      .send({ productId: 'non-existent' })
      .expect(201)

    assert.deepEqual(res.body.recommendations, [])
  })

  it('POST /ai-sales/recommend/cross-sell 返回关联推荐', async () => {
    const res = await request(app.getHttpServer())
      .post('/ai-sales/recommend/cross-sell')
      .send({ productId: 'prod-001' })
      .expect(201)

    assert.equal(res.body.type, 'cross-sell')
    assert.ok(res.body.recommendations.length > 0)
  })

  // ─── 商品查询 ────────────────────────────────

  it('GET /ai-sales/products 返回所有商品', async () => {
    const res = await request(app.getHttpServer())
      .get('/ai-sales/products')
      .expect(200)

    assert.equal(res.body.length, 10)
  })

  it('GET /ai-sales/products/:id 返回单个商品', async () => {
    const res = await request(app.getHttpServer())
      .get('/ai-sales/products/prod-001')
      .expect(200)

    assert.equal(res.body.id, 'prod-001')
    assert.equal(res.body.name, '基础护肤套装')
  })

  // ─── 购买记录 ────────────────────────────────

  it('POST /ai-sales/purchase 记录购买', async () => {
    const res = await request(app.getHttpServer())
      .post('/ai-sales/purchase')
      .send({ customerId: 'cust-e2e', productId: 'prod-005' })
      .expect(201)

    assert.equal(res.body.success, true)
  })

  // ─── 异议处理 ────────────────────────────────

  it('POST /ai-sales/objection/classify 价格异议', async () => {
    const res = await request(app.getHttpServer())
      .post('/ai-sales/objection/classify')
      .send({ customerReply: '太贵了，能便宜点吗' })
      .expect(201)

    assert.equal(res.body.type, 'price')
  })

  it('POST /ai-sales/objection/classify 默认 need 类型', async () => {
    const res = await request(app.getHttpServer())
      .post('/ai-sales/objection/classify')
      .send({ customerReply: '今天天气不错' })
      .expect(201)

    assert.equal(res.body.type, 'need')
  })

  it('POST /ai-sales/objection/respond 返回话术', async () => {
    const res = await request(app.getHttpServer())
      .post('/ai-sales/objection/respond')
      .send({
        customerId: 'cust-001',
        productId: 'prod-001',
        objectionType: 'price',
        conversationHistory: ['太贵了'],
      })
      .expect(201)

    assert.equal(res.body.type, 'price')
    assert.equal(typeof res.body.response, 'string')
    assert.ok(res.body.response.length > 0)
  })

  it('POST /ai-sales/objection/simulate 返回 3 回合对话', async () => {
    const res = await request(app.getHttpServer())
      .post('/ai-sales/objection/simulate')
      .send({ objection: '太贵了', response: '现在有8折优惠' })
      .expect(201)

    assert.equal(res.body.turns.length, 3)
    assert.ok(['positive', 'neutral', 'negative'].includes(res.body.finalSentiment))
  })

  // ─── 跟进提醒 ────────────────────────────────

  it('POST /ai-sales/follow-up 安排跟进', async () => {
    const res = await request(app.getHttpServer())
      .post('/ai-sales/follow-up')
      .send({
        customerId: 'cust-001',
        salesId: 'sales-e2e',
        type: 'inactive',
        scheduledAt: '2026-07-10T00:00:00Z',
        message: '客户已30天未到店',
      })
      .expect(201)

    assert.equal(typeof res.body.id, 'string')
    assert.equal(res.body.status, 'pending')
  })

  it('POST /ai-sales/follow-up 生日类型自动生成消息', async () => {
    const res = await request(app.getHttpServer())
      .post('/ai-sales/follow-up')
      .send({
        customerId: 'cust-001',
        salesId: 'sales-e2e',
        type: 'birthday',
        scheduledAt: '2026-07-15T00:00:00Z',
        message: '',
      })
      .expect(201)

    assert.ok(res.body.message.includes('🎂'))
  })

  it('GET /ai-sales/follow-up/due/:salesId 返回到期跟进', async () => {
    // 先安排一个过期的跟进
    await request(app.getHttpServer())
      .post('/ai-sales/follow-up')
      .send({
        customerId: 'cust-001',
        salesId: 'sales-due',
        type: 'price_alert',
        scheduledAt: '2020-01-01T00:00:00Z',
        message: '过期的价格提醒',
      })

    const res = await request(app.getHttpServer())
      .get('/ai-sales/follow-up/due/sales-due')
      .expect(200)

    assert.ok(Array.isArray(res.body))
    assert.ok(res.body.length >= 1)
    assert.equal(res.body[0].status, 'pending')
  })

  it('GET /ai-sales/follow-up/pending 返回待处理跟进', async () => {
    const res = await request(app.getHttpServer())
      .get('/ai-sales/follow-up/pending')
      .expect(200)

    assert.ok(Array.isArray(res.body))
  })

  it('POST /ai-sales/follow-up/complete 标记完成', async () => {
    // 先安排一个跟进
    const createRes = await request(app.getHttpServer())
      .post('/ai-sales/follow-up')
      .send({
        customerId: 'cust-001',
        salesId: 'sales-complete',
        type: 'reorder',
        scheduledAt: '2026-08-01T00:00:00Z',
        message: '可以安排复购了',
      })

    const followUpId = createRes.body.id

    const res = await request(app.getHttpServer())
      .post('/ai-sales/follow-up/complete')
      .send({ followUpId })
      .expect(201)

    assert.equal(res.body.status, 'completed')
  })

  it('POST /ai-sales/follow-up/complete 不存在的 ID 返回错误', async () => {
    const res = await request(app.getHttpServer())
      .post('/ai-sales/follow-up/complete')
      .send({ followUpId: 'non-existent' })
      .expect(201)

    assert.equal(res.body.error, 'FollowUp non-existent not found')
  })

  it('GET /ai-sales/follow-up/upcoming-birthdays 返回生日列表', async () => {
    const res = await request(app.getHttpServer())
      .get('/ai-sales/follow-up/upcoming-birthdays?days=365')
      .expect(200)

    assert.ok(Array.isArray(res.body))
    // 至少 cust-001 或 cust-003 应该即将过生日
    assert.ok(res.body.length > 0)
    for (const item of res.body) {
      assert.equal(typeof item.customerId, 'string')
      assert.equal(typeof item.daysUntil, 'number')
    }
  })

  it('POST /ai-sales/follow-up/birthday 设置生日', async () => {
    const res = await request(app.getHttpServer())
      .post('/ai-sales/follow-up/birthday')
      .send({ customerId: 'cust-e2e', birthday: '1990-06-15' })
      .expect(201)

    assert.equal(res.body.success, true)
  })

  // ─── 边界情况 ────────────────────────────────

  it('GET /ai-sales/products/:id 不存在返回 null/undefined', async () => {
    const res = await request(app.getHttpServer())
      .get('/ai-sales/products/non-existent')
      .expect(200)

    // NestJS controller returns null/empty for undefined
    const body = JSON.stringify(res.body)
    assert.ok(body === 'null' || body === '{}' || body === 'undefined' || res.body === null)
  })
})
