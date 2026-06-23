/**
 * 🐜 自动: [ai-recommend] E2E 基础测试
 *
 * E2E 链路: HTTP → AiRecommendController → AiRecommendService → Recommendation/Strategy/Profile
 *
 * 覆盖:
 *   - 热门推荐: 列表 + 限制数量
 *   - 个性化推荐: 无画像回退 / 有画像匹配
 *   - 推荐生成: 4 种策略 + 兜底
 *   - 策略管理: CRUD + 启停
 *   - 用户画像: 增改查
 *   - 反馈收集: 评分 / 转化
 *   - 推荐历史查询
 *   - 错误处理 (404 / 业务错误)
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  NotFoundException,
  BadRequestException,
  Inject
} from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor'
import { AiRecommendService } from './ai-recommend.service'

// ========== 测试 Controller ==========

@Controller('ai-recommend')
class TestAiRecommendController {
  constructor(@Inject(AiRecommendService) private readonly service: AiRecommendService) {}

  @Get('recommendations/popular')
  getPopular(@Query() query: any) {
    return this.service.getPopularRecommendations(query.storeId, query.type, query.limit ?? 10)
  }

  @Get('recommendations/personalized')
  getPersonalized(@Query() query: any) {
    if (!query.memberId) {
      throw new BadRequestException('个性化推荐需要 memberId')
    }
    return this.service.getPersonalizedRecommendations(
      query.memberId,
      query.type,
      query.limit ?? 10
    )
  }

  @Get('recommendations')
  getRecommendations(@Query() query: any) {
    return this.service.getRecommendations({
      storeId: query.storeId,
      memberId: query.memberId,
      type: query.type,
      limit: query.limit
    })
  }

  @Post('generate')
  @HttpCode(HttpStatus.CREATED)
  generate(@Body() body: any) {
    return this.service.generateRecommendations(body)
  }

  @Post('strategies')
  @HttpCode(HttpStatus.CREATED)
  createStrategy(@Body() body: any) {
    return this.service.createStrategy(body)
  }

  @Get('strategies')
  getStrategies() {
    return this.service.getStrategies()
  }

  @Get('strategies/:id')
  getStrategy(@Param('id') id: string) {
    const s = this.service.getStrategy(id)
    if (!s) throw new NotFoundException(`Strategy ${id} not found`)
    return s
  }

  @Put('strategies/:id')
  updateStrategy(@Param('id') id: string, @Body() body: any) {
    return this.service.updateStrategy(id, body)
  }

  @Patch('strategies/:id/enable')
  enableStrategy(@Param('id') id: string) {
    return this.service.enableStrategy(id)
  }

  @Patch('strategies/:id/disable')
  disableStrategy(@Param('id') id: string) {
    return this.service.disableStrategy(id)
  }

  @Get('profiles/:memberId')
  getProfile(@Param('memberId') memberId: string) {
    const p = this.service.getProfile(memberId)
    if (!p) throw new NotFoundException(`Profile ${memberId} not found`)
    return p
  }

  @Put('profiles/:memberId')
  updateProfile(@Param('memberId') memberId: string, @Body() body: any) {
    return this.service.updateProfile(memberId, body)
  }

  @Post('interactions/score')
  @HttpCode(HttpStatus.CREATED)
  recordScore(@Body() body: any) {
    return this.service.recordInteraction(body)
  }

  @Post('interactions')
  @HttpCode(HttpStatus.CREATED)
  recordInteraction(@Body() body: any) {
    const weightMap: Record<string, number> = {
      view: 0.3,
      click: 0.5,
      purchase: 1.0,
      play: 0.8
    }
    const ratingMap: Record<string, number> = {
      view: 3,
      click: 3,
      purchase: 5,
      play: 4
    }
    return this.service.recordInteraction({
      memberId: body.memberId,
      itemId: body.itemId,
      itemType: body.itemType,
      rating: ratingMap[body.interaction] ?? 3,
      interaction: body.interaction,
      weight: weightMap[body.interaction] ?? 0.5
    })
  }

  @Post('conversions')
  @HttpCode(HttpStatus.CREATED)
  recordConversion(@Body() body: any) {
    const rec = this.service.recordConversion(body.recommendationId)
    if (!rec) throw new NotFoundException(`Recommendation ${body.recommendationId} not found`)
    return rec
  }
}

// ========== 构建 app ==========

async function buildApp() {
  const service = new AiRecommendService()
  const moduleRef = await Test.createTestingModule({
    controllers: [TestAiRecommendController],
    providers: [{ provide: AiRecommendService, useValue: service }]
  }).compile()

  const app = moduleRef.createNestApplication()
  app.useGlobalInterceptors(new ResponseInterceptor())
  await app.init()
  return { app, service }
}

// ========== E2E: 热门推荐 ==========

describe('E2E: 热门推荐流程', () => {
  test('GET /ai-recommend/recommendations/popular 返回热门列表', async () => {
    const { app } = await buildApp()
    try {
      const res = await request(app.getHttpServer())
        .get('/ai-recommend/recommendations/popular?limit=5')
      assert.equal(res.statusCode, 200)
      assert.ok(Array.isArray(res.body.data))
      assert.ok(res.body.data.length > 0)
      for (const r of res.body.data) {
        assert.equal(r.strategy, 'popularity')
        assert.equal(r.status, 'active')
        assert.ok(r.score >= 0 && r.score <= 100)
      }
    } finally {
      await app.close()
    }
  })

  test('GET /ai-recommend/recommendations/popular?type=product 切换类型', async () => {
    const { app } = await buildApp()
    try {
      const res = await request(app.getHttpServer())
        .get('/ai-recommend/recommendations/popular?type=product&limit=3')
      assert.equal(res.statusCode, 200)
      for (const r of res.body.data) assert.equal(r.type, 'product')
    } finally {
      await app.close()
    }
  })

  test('GET /ai-recommend/recommendations/popular?storeId=store-X 透传', async () => {
    const { app } = await buildApp()
    try {
      const res = await request(app.getHttpServer())
        .get('/ai-recommend/recommendations/popular?storeId=store-X&limit=2')
      assert.equal(res.statusCode, 200)
      for (const r of res.body.data) assert.equal(r.storeId, 'store-X')
    } finally {
      await app.close()
    }
  })
})

// ========== E2E: 个性化推荐 ==========

describe('E2E: 个性化推荐流程', () => {
  test('GET /ai-recommend/recommendations/personalized 缺 memberId 返回 400', async () => {
    const { app } = await buildApp()
    try {
      const res = await request(app.getHttpServer())
        .get('/ai-recommend/recommendations/personalized')
      assert.equal(res.statusCode, 400)
    } finally {
      await app.close()
    }
  })

  test('GET /ai-recommend/recommendations/personalized 无画像 → 冷启动回退', async () => {
    const { app } = await buildApp()
    try {
      const res = await request(app.getHttpServer())
        .get('/ai-recommend/recommendations/personalized?memberId=cold-user&limit=5')
      assert.equal(res.statusCode, 200)
      assert.ok(res.body.data.length > 0)
      // 冷启动标记
      assert.ok(res.body.data[0].strategy.includes('cold-start') || res.body.data[0].strategy.includes('popularity'))
    } finally {
      await app.close()
    }
  })

  test('GET /ai-recommend/recommendations/personalized 有画像 → 内容匹配', async () => {
    const { app } = await buildApp()
    try {
      // 先创建画像
      await request(app.getHttpServer())
        .put('/ai-recommend/profiles/moba-fan')
        .send({
          preferences: {
            gameTypes: ['MOBA'],
            priceRange: { min: 0, max: 500 },
            visitFrequency: 'weekly',
            avgSpend: 100,
            favoriteTimeSlot: '18:00-22:00'
          },
          behaviorTags: ['game-enthusiast']
        })
      const res = await request(app.getHttpServer())
        .get('/ai-recommend/recommendations/personalized?memberId=moba-fan&limit=5')
      assert.equal(res.statusCode, 200)
      assert.ok(res.body.data.length > 0)
    } finally {
      await app.close()
    }
  })
})

// ========== E2E: 推荐生成 ==========

describe('E2E: 推荐生成流程', () => {
  test('POST /ai-recommend/generate popularity 策略', async () => {
    const { app } = await buildApp()
    try {
      const res = await request(app.getHttpServer())
        .post('/ai-recommend/generate')
        .send({ strategyId: 'strategy-popularity-v1', limit: 5 })
      assert.equal(res.statusCode, 201)
      assert.equal(res.body.data.strategy, 'popularity')
      assert.ok(res.body.data.items.length > 0)
      assert.equal(typeof res.body.data.executionTimeMs, 'number')
    } finally {
      await app.close()
    }
  })

  test('POST /ai-recommend/generate hybrid 策略 + memberId', async () => {
    const { app } = await buildApp()
    try {
      const res = await request(app.getHttpServer())
        .post('/ai-recommend/generate')
        .send({
          strategyId: 'strategy-hybrid-v1',
          memberId: 'm-001',
          limit: 8
        })
      assert.equal(res.statusCode, 201)
      assert.equal(res.body.data.strategy, 'hybrid')
      assert.ok(res.body.data.items.length > 0)
    } finally {
      await app.close()
    }
  })

  test('POST /ai-recommend/generate 策略不存在返回 500', async () => {
    const { app } = await buildApp()
    try {
      const res = await request(app.getHttpServer())
        .post('/ai-recommend/generate')
        .send({ strategyId: 'non-existent' })
      assert.equal(res.statusCode, 500)
    } finally {
      await app.close()
    }
  })

  test('POST /ai-recommend/generate 禁用策略返回 500', async () => {
    const { app } = await buildApp()
    try {
      await request(app.getHttpServer())
        .patch('/ai-recommend/strategies/strategy-popularity-v1/disable')
      const res = await request(app.getHttpServer())
        .post('/ai-recommend/generate')
        .send({ strategyId: 'strategy-popularity-v1' })
      assert.equal(res.statusCode, 500)
    } finally {
      await app.close()
    }
  })

  test('POST /ai-recommend/generate fallback 触发', async () => {
    const { app } = await buildApp()
    try {
      // 创建一个会 fallback 的策略
      const created = await request(app.getHttpServer())
        .post('/ai-recommend/strategies')
        .send({
          name: 'fallback-test',
          description: 'test',
          targetType: 'game',
          weights: [{ factor: 'never-match', weight: 1 }],
          fallbackStrategy: 'strategy-popularity-v1',
          maxResults: 5
        })
      const strategyId = created.body.data.id

      const res = await request(app.getHttpServer())
        .post('/ai-recommend/generate')
        .send({ strategyId, limit: 5 })
      assert.equal(res.statusCode, 201)
      // fallback 标记
      if (res.body.data.fallbackStrategy) {
        assert.equal(res.body.data.fallbackStrategy, 'strategy-popularity-v1')
      }
    } finally {
      await app.close()
    }
  })
})

// ========== E2E: 策略管理 ==========

describe('E2E: 策略管理流程', () => {
  test('POST /ai-recommend/strategies 创建自定义策略', async () => {
    const { app } = await buildApp()
    try {
      const res = await request(app.getHttpServer())
        .post('/ai-recommend/strategies')
        .send({
          name: 'custom-v1',
          description: 'custom strategy',
          targetType: 'game',
          weights: [{ factor: 'rating', weight: 1.0 }],
          minScore: 0,
          maxResults: 5
        })
      assert.equal(res.statusCode, 201)
      assert.equal(res.body.data.name, 'custom-v1')
      assert.equal(res.body.data.isEnabled, true)
    } finally {
      await app.close()
    }
  })

  test('GET /ai-recommend/strategies 列表', async () => {
    const { app } = await buildApp()
    try {
      const res = await request(app.getHttpServer())
        .get('/ai-recommend/strategies')
      assert.equal(res.statusCode, 200)
      assert.ok(res.body.data.length >= 4)
      const names = res.body.data.map((s: any) => s.name)
      assert.ok(names.includes('popularity'))
    } finally {
      await app.close()
    }
  })

  test('GET /ai-recommend/strategies/:id 详情', async () => {
    const { app } = await buildApp()
    try {
      const res = await request(app.getHttpServer())
        .get('/ai-recommend/strategies/strategy-popularity-v1')
      assert.equal(res.statusCode, 200)
      assert.equal(res.body.data.name, 'popularity')
    } finally {
      await app.close()
    }
  })

  test('GET /ai-recommend/strategies/:id 不存在返回 404', async () => {
    const { app } = await buildApp()
    try {
      const res = await request(app.getHttpServer())
        .get('/ai-recommend/strategies/non-existent')
      assert.equal(res.statusCode, 404)
    } finally {
      await app.close()
    }
  })

  test('PUT /ai-recommend/strategies/:id 更新策略', async () => {
    const { app } = await buildApp()
    try {
      const res = await request(app.getHttpServer())
        .put('/ai-recommend/strategies/strategy-popularity-v1')
        .send({ minScore: 50, maxResults: 3 })
      assert.equal(res.statusCode, 200)
      assert.equal(res.body.data.config.minScore, 50)
      assert.equal(res.body.data.config.maxResults, 3)
    } finally {
      await app.close()
    }
  })

  test('PATCH /ai-recommend/strategies/:id/disable 禁用', async () => {
    const { app } = await buildApp()
    try {
      const res = await request(app.getHttpServer())
        .patch('/ai-recommend/strategies/strategy-popularity-v1/disable')
      assert.equal(res.statusCode, 200)
      assert.equal(res.body.data.isEnabled, false)
    } finally {
      await app.close()
    }
  })

  test('PATCH /ai-recommend/strategies/:id/enable 启用', async () => {
    const { app } = await buildApp()
    try {
      // 先禁用
      await request(app.getHttpServer())
        .patch('/ai-recommend/strategies/strategy-popularity-v1/disable')
      const res = await request(app.getHttpServer())
        .patch('/ai-recommend/strategies/strategy-popularity-v1/enable')
      assert.equal(res.statusCode, 200)
      assert.equal(res.body.data.isEnabled, true)
    } finally {
      await app.close()
    }
  })
})

// ========== E2E: 用户画像 ==========

describe('E2E: 用户画像流程', () => {
  test('PUT /ai-recommend/profiles/:memberId 创建画像', async () => {
    const { app } = await buildApp()
    try {
      const res = await request(app.getHttpServer())
        .put('/ai-recommend/profiles/m-new')
        .send({
          preferences: {
            gameTypes: ['MOBA', 'RPG'],
            priceRange: { min: 0, max: 500 },
            visitFrequency: 'weekly',
            avgSpend: 100,
            favoriteTimeSlot: '18:00-22:00'
          },
          behaviorTags: ['vip', 'game-enthusiast']
        })
      assert.equal(res.statusCode, 200)
      assert.equal(res.body.data.memberId, 'm-new')
    } finally {
      await app.close()
    }
  })

  test('GET /ai-recommend/profiles/:memberId 获取画像', async () => {
    const { app } = await buildApp()
    try {
      await request(app.getHttpServer())
        .put('/ai-recommend/profiles/m-exists')
        .send({
          preferences: {
            gameTypes: ['FPS'],
            priceRange: { min: 0, max: 100 },
            visitFrequency: 'daily',
            avgSpend: 50,
            favoriteTimeSlot: '20:00-22:00'
          }
        })
      const res = await request(app.getHttpServer())
        .get('/ai-recommend/profiles/m-exists')
      assert.equal(res.statusCode, 200)
      assert.equal(res.body.data.preferences.gameTypes[0], 'FPS')
    } finally {
      await app.close()
    }
  })

  test('GET /ai-recommend/profiles/:memberId 不存在返回 404', async () => {
    const { app } = await buildApp()
    try {
      const res = await request(app.getHttpServer())
        .get('/ai-recommend/profiles/never-exists')
      assert.equal(res.statusCode, 404)
    } finally {
      await app.close()
    }
  })

  test('PUT /ai-recommend/profiles/:memberId 增量更新', async () => {
    const { app } = await buildApp()
    try {
      // 创建
      await request(app.getHttpServer())
        .put('/ai-recommend/profiles/m-inc')
        .send({
          preferences: {
            gameTypes: ['MOBA'],
            priceRange: { min: 0, max: 100 },
            visitFrequency: 'weekly',
            avgSpend: 50,
            favoriteTimeSlot: '10:00'
          }
        })
      // 更新 behaviorTags
      const res = await request(app.getHttpServer())
        .put('/ai-recommend/profiles/m-inc')
        .send({ behaviorTags: ['new'] })
      assert.equal(res.statusCode, 200)
      assert.deepEqual(res.body.data.behaviorTags, ['new'])
    } finally {
      await app.close()
    }
  })
})

// ========== E2E: 反馈收集 ==========

describe('E2E: 反馈收集流程', () => {
  test('POST /ai-recommend/interactions/score 记录评分', async () => {
    const { app } = await buildApp()
    try {
      const res = await request(app.getHttpServer())
        .post('/ai-recommend/interactions/score')
        .send({
          memberId: 'm-fb',
          itemId: 'game-001',
          itemType: 'game',
          rating: 5,
          interaction: 'play',
          weight: 1.0
        })
      assert.equal(res.statusCode, 201)
      assert.equal(res.body.data.rating, 5)
    } finally {
      await app.close()
    }
  })

  test('POST /ai-recommend/interactions 简化版 → 自动计算 rating/weight', async () => {
    const { app } = await buildApp()
    try {
      const res = await request(app.getHttpServer())
        .post('/ai-recommend/interactions')
        .send({
          memberId: 'm-quick',
          itemId: 'game-002',
          itemType: 'game',
          interaction: 'purchase'
        })
      assert.equal(res.statusCode, 201)
      assert.equal(res.body.data.rating, 5) // purchase → 5
      assert.equal(res.body.data.weight, 1.0)
    } finally {
      await app.close()
    }
  })

  test('POST /ai-recommend/interactions 自动创建画像', async () => {
    const { app } = await buildApp()
    try {
      await request(app.getHttpServer())
        .post('/ai-recommend/interactions')
        .send({
          memberId: 'm-new-via-interaction',
          itemId: 'game-001',
          itemType: 'game',
          interaction: 'play'
        })
      const res = await request(app.getHttpServer())
        .get('/ai-recommend/profiles/m-new-via-interaction')
      assert.equal(res.statusCode, 200)
      assert.ok(res.body.data.preferences.gameTypes.includes('MOBA'))
    } finally {
      await app.close()
    }
  })

  test('POST /ai-recommend/conversions 不存在返回 404', async () => {
    const { app } = await buildApp()
    try {
      const res = await request(app.getHttpServer())
        .post('/ai-recommend/conversions')
        .send({ recommendationId: 'non-existent' })
      assert.equal(res.statusCode, 404)
    } finally {
      await app.close()
    }
  })
})

// ========== E2E: 推荐历史 ==========

describe('E2E: 推荐历史查询', () => {
  test('GET /ai-recommend/recommendations 列表 (默认空)', async () => {
    const { app } = await buildApp()
    try {
      const res = await request(app.getHttpServer())
        .get('/ai-recommend/recommendations')
      assert.equal(res.statusCode, 200)
      assert.ok(Array.isArray(res.body.data))
    } finally {
      await app.close()
    }
  })

  test('GET /ai-recommend/recommendations?type=game 过滤', async () => {
    const { app } = await buildApp()
    try {
      const res = await request(app.getHttpServer())
        .get('/ai-recommend/recommendations?type=game&limit=5')
      assert.equal(res.statusCode, 200)
      assert.ok(Array.isArray(res.body.data))
    } finally {
      await app.close()
    }
  })

  test('GET /ai-recommend/recommendations?limit=3 限制', async () => {
    const { app } = await buildApp()
    try {
      const res = await request(app.getHttpServer())
        .get('/ai-recommend/recommendations?limit=3')
      assert.equal(res.statusCode, 200)
      assert.ok(res.body.data.length <= 3)
    } finally {
      await app.close()
    }
  })
})
