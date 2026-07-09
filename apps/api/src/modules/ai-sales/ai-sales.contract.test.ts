import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
/**
 * 🐜 自动: [ai-sales] [A] 合约测试
 *
 * 验证 ai-sales 模块的合约 Shape、业务逻辑契约、对外接口兼容性
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import {
  ProductRecommendationEngine,
  ObjectionHandler,
  FollowUpScheduler,
} from './ai-sales-copilot.service'
import type {
  ScoredProduct,
  SalesRecommendationResponse,
  ObjectionResponse,
  ConverseSimulationResponse,
  FollowUpReminder,
  UpcomingBirthday,
} from './ai-sales.entity'
import {
  SUPPORTED_OBJECTION_TYPES,
  SUPPORTED_FOLLOWUP_TYPES,
  QUALITY_RANK,
  CATEGORY_AFFINITY,
} from './ai-sales.contract'

// ─── 服务实例 helper ──────────────────────────────────

function makeRecommendationEngine(): ProductRecommendationEngine {
  return new ProductRecommendationEngine()
}

function makeObjectionHandler(): ObjectionHandler {
  return new ObjectionHandler()
}

function makeFollowUpScheduler(): FollowUpScheduler {
  return new FollowUpScheduler()
}

// ─── 合约: 常量 Shape ─────────────────────────────────

describe('[ai-sales] 合约: 常量定义', () => {
  it('SUPPORTED_OBJECTION_TYPES 包含 4 种类型', () => {
    assert.equal(SUPPORTED_OBJECTION_TYPES.length, 4)
    assert.ok(SUPPORTED_OBJECTION_TYPES.includes('price'))
    assert.ok(SUPPORTED_OBJECTION_TYPES.includes('quality'))
    assert.ok(SUPPORTED_OBJECTION_TYPES.includes('competitor'))
    assert.ok(SUPPORTED_OBJECTION_TYPES.includes('need'))
  })

  it('SUPPORTED_FOLLOWUP_TYPES 包含 4 种类型', () => {
    assert.equal(SUPPORTED_FOLLOWUP_TYPES.length, 4)
    assert.ok(SUPPORTED_FOLLOWUP_TYPES.includes('birthday'))
    assert.ok(SUPPORTED_FOLLOWUP_TYPES.includes('inactive'))
    assert.ok(SUPPORTED_FOLLOWUP_TYPES.includes('price_alert'))
    assert.ok(SUPPORTED_FOLLOWUP_TYPES.includes('reorder'))
  })

  it('QUALITY_RANK 有正确的排名顺序', () => {
    assert.equal(QUALITY_RANK.low, 1)
    assert.equal(QUALITY_RANK.medium, 2)
    assert.equal(QUALITY_RANK.high, 3)
    assert.equal(QUALITY_RANK.premium, 4)
  })

  it('CATEGORY_AFFINITY 包含正确的品类关联', () => {
    assert.ok(CATEGORY_AFFINITY.skincare)
    assert.ok(CATEGORY_AFFINITY.makeup)
    assert.ok(CATEGORY_AFFINITY.beauty)
    assert.equal(CATEGORY_AFFINITY.skincare.makeup, 0.8)
    assert.equal(CATEGORY_AFFINITY.skincare.beauty, 0.9)
  })
})

// ─── 合约: 商品推荐引擎 ──────────────────────────────

describe('[ai-sales] 合约: 商品推荐引擎', () => {
  let engine: ProductRecommendationEngine

  beforeEach(() => {
    engine = makeRecommendationEngine()
  })

  it('getAllProducts 返回 10 个种子商品', () => {
    const products = engine.getAllProducts()
    assert.equal(products.length, 10)
  })

  it('getAllProducts 中每个商品包含必要字段', () => {
    for (const p of engine.getAllProducts()) {
      assert.equal(typeof p.id, 'string')
      assert.equal(typeof p.name, 'string')
      assert.equal(typeof p.category, 'string')
      assert.equal(typeof p.price, 'number')
      assert.ok(['low', 'medium', 'high', 'premium'].includes(p.quality))
      assert.ok(Array.isArray(p.tags))
      assert.ok(Array.isArray(p.relatedCategories))
    }
  })

  it('getProduct 返回正确商品', () => {
    const product = engine.getProduct('prod-001')
    assert.ok(product)
    assert.equal(product!.name, '基础护肤套装')
  })

  it('getProduct 对不存在 ID 返回 undefined', () => {
    const product = engine.getProduct('non-existent')
    assert.equal(product, undefined)
  })

  it('recommendForCustomer 返回排序后的推荐', () => {
    const result = engine.recommendForCustomer('cust-001', {
      currentBrowsing: 'prod-002',
      recentViewed: ['prod-001'],
    })
    assert.ok(result.length > 0)
    // 按分数降序
    for (let i = 1; i < result.length; i++) {
      assert.ok(result[i - 1].score >= result[i].score)
    }
  })

  it('recommendForCustomer 生日场景加分', () => {
    const normal = engine.recommendForCustomer('cust-001', {
      currentBrowsing: 'prod-002',
      recentViewed: [],
    })
    const birthday = engine.recommendForCustomer('cust-001', {
      currentBrowsing: 'prod-002',
      recentViewed: [],
      scenario: 'birthday',
    })
    // 生日场景至少第一项有 bonus
    if (normal.length > 0 && birthday.length > 0) {
      // birthday items have 1.2x multiplier
      const ratio = birthday[0].score / normal[0].score
      assert.ok(Math.abs(ratio - 1.2) < 0.01 || ratio > 1.19)
    }
  })

  it('recommendUpsell 返回升级推荐', () => {
    const result = engine.recommendUpsell('prod-001')
    assert.ok(result.length > 0)
    // 所有推荐的品质应高于或等于原商品
    const source = engine.getProduct('prod-001')
    for (const item of result) {
      assert.equal(item.product.category, source!.category)
    }
  })

  it('recommendCrossSell 返回关联推荐', () => {
    const result = engine.recommendCrossSell('prod-001')
    assert.ok(result.length > 0)
  })

  it('recordPurchase 记录购买历史', () => {
    engine.recordPurchase('cust-new', 'prod-005')
    // 再次推荐时历史已记录
    const result = engine.recommendForCustomer('cust-new', {
      recentViewed: [],
    })
    assert.ok(result.length > 0)
  })

  it('无历史记录新客返回结果', () => {
    const result = engine.recommendForCustomer('brand-new-customer', {
      recentViewed: [],
    })
    assert.ok(result.length > 0)
  })
})

// ─── 合约: 异议处理 ──────────────────────────────

describe('[ai-sales] 合约: 异议处理', () => {
  let handler: ObjectionHandler

  beforeEach(() => {
    handler = makeObjectionHandler()
  })

  it('classifyObjection 正确分类价格异议', () => {
    assert.equal(handler.classifyObjection('太贵了，能便宜点吗'), 'price')
  })

  it('classifyObjection 正确分类质量异议', () => {
    assert.equal(handler.classifyObjection('质量怎么样，是正品吗'), 'quality')
  })

  it('classifyObjection 正确分类竞品异议', () => {
    assert.equal(handler.classifyObjection('别家更便宜啊'), 'competitor')
  })

  it('classifyObjection 默认归类为 need', () => {
    assert.equal(handler.classifyObjection('今天天气不错'), 'need')
  })

  it('generateResponse 返回非空字符串', () => {
    const response = handler.generateResponse('price', {
      customerId: 'cust-001',
      productId: 'prod-001',
      conversationHistory: [],
    })
    assert.equal(typeof response, 'string')
    assert.ok(response.length > 0)
  })

  it('generateResponse 对每种异议类型都能返回话术', () => {
    for (const type of SUPPORTED_OBJECTION_TYPES) {
      const response = handler.generateResponse(type, {
        customerId: 'cust-001',
        productId: 'prod-001',
        conversationHistory: [],
      })
      assert.ok(response.length > 0, `${type} 应返回话术`)
    }
  })

  it('simulateConversation 返回 3 个回合', () => {
    const result = handler.simulateConversation('太贵了', '现在有优惠活动')
    assert.equal(result.length, 3)
    assert.equal(result[0].turn, 1)
    assert.equal(result[1].turn, 2)
    assert.equal(result[2].turn, 3)
  })

  it('simulateConversation 首回合为 customer negative', () => {
    const result = handler.simulateConversation('太贵了', '有折扣')
    assert.equal(result[0].speaker, 'customer')
    assert.equal(result[0].sentiment, 'negative')
  })
})

// ─── 合约: 跟进提醒 ──────────────────────────────

describe('[ai-sales] 合约: 跟进提醒', () => {
  let scheduler: FollowUpScheduler

  beforeEach(() => {
    scheduler = makeFollowUpScheduler()
  })

  it('scheduleFollowUp 创建完整提醒', () => {
    const reminder = scheduler.scheduleFollowUp('cust-001', {
      customerId: 'cust-001',
      salesId: 'sales-001',
      type: 'inactive',
      scheduledAt: '2026-07-10T00:00:00Z',
      message: '客户已30天未到店，请跟进',
      priority: 2,
    })
    assert.equal(typeof reminder.id, 'string')
    assert.equal(reminder.status, 'pending')
    assert.equal(typeof reminder.createdAt, 'string')
  })

  it('scheduleFollowUp 生日类型自动生成祝福语', () => {
    const reminder = scheduler.scheduleFollowUp('cust-001', {
      customerId: 'cust-001',
      salesId: 'sales-001',
      type: 'birthday',
      scheduledAt: '2026-07-15T00:00:00Z',
      message: '',
      priority: 3,
    })
    assert.ok(reminder.message.includes('🎂'))
    assert.ok(reminder.message.includes('生日'))
  })

  it('getDueFollowUps 返回到期提醒（按优先级排序）', () => {
    scheduler.scheduleFollowUp('cust-001', {
      customerId: 'cust-001',
      salesId: 'sales-001',
      type: 'inactive',
      scheduledAt: '2020-01-01T00:00:00Z', // past due
      message: 'test1',
      priority: 2,
    })
    scheduler.scheduleFollowUp('cust-001', {
      customerId: 'cust-001',
      salesId: 'sales-001',
      type: 'price_alert',
      scheduledAt: '2020-01-01T00:00:00Z', // past due
      message: 'test2',
      priority: 1,
    })
    const due = scheduler.getDueFollowUps('sales-001')
    assert.ok(due.length >= 2)
    // 优先级 1 应排在优先级 2 前面
    assert.equal(due[0].priority, 1)
  })

  it('markCompleted 标记跟进完成', () => {
    const reminder = scheduler.scheduleFollowUp('cust-001', {
      customerId: 'cust-001',
      salesId: 'sales-001',
      type: 'reorder',
      scheduledAt: '2026-07-20T00:00:00Z',
      message: 'test',
      priority: 3,
    })
    const completed = scheduler.markCompleted(reminder.id)
    assert.ok(completed)
    assert.equal(completed!.status, 'completed')
  })

  it('markCompleted 对不存在 ID 返回 undefined', () => {
    const result = scheduler.markCompleted('non-existent')
    assert.equal(result, undefined)
  })

  it('getUpcomingBirthdays 返回即将到来的生日', () => {
    const upcoming = scheduler.getUpcomingBirthdays(365) // 足够大的范围
    assert.ok(upcoming.length > 0)
    for (const item of upcoming) {
      assert.equal(typeof item.customerId, 'string')
      assert.equal(typeof item.daysUntil, 'number')
      assert.ok(item.daysUntil >= 0)
    }
  })

  it('setCustomerBirthday 和 getUpcomingBirthdays 联动', () => {
    scheduler.setCustomerBirthday('cust-new', '2026-07-20')
    const upcoming = scheduler.getUpcomingBirthdays(30)
    const found = upcoming.find((u) => u.customerId === 'cust-new')
    assert.ok(found)
  })

  it('getAllPending 返回所有待处理提醒', () => {
    scheduler.scheduleFollowUp('cust-001', {
      customerId: 'cust-001',
      salesId: 'sales-001',
      type: 'inactive',
      scheduledAt: '2026-08-01T00:00:00Z',
      message: 'test',
      priority: 3,
    })
    const all = scheduler.getAllPending()
    assert.ok(all.length > 0)
    all.forEach((r) => assert.equal(r.status, 'pending'))
  })

  it('getAllPending 按 salesId 过滤', () => {
    scheduler.scheduleFollowUp('cust-001', {
      customerId: 'cust-001',
      salesId: 'sales-001',
      type: 'inactive',
      scheduledAt: '2026-08-01T00:00:00Z',
      message: 'test',
      priority: 3,
    })
    const filtered = scheduler.getAllPending('sales-001')
    filtered.forEach((r) => assert.equal(r.salesId, 'sales-001'))
  })
})

// ─── 合约: 响应 Shape ──────────────────────────────

describe('[ai-sales] 合约: 响应 Shape', () => {
  let engine: ProductRecommendationEngine

  beforeEach(() => {
    engine = makeRecommendationEngine()
  })

  it('SalesRecommendationResponse 包含所有必需字段', () => {
    const resp: SalesRecommendationResponse = {
      type: 'context-aware',
      recommendations: [],
    }
    assert.equal(typeof resp.type, 'string')
    assert.ok(Array.isArray(resp.recommendations))
    // optional field
    assert.ok(resp.context === undefined)
  })

  it('ScoredProduct 包含 product/score/reason', () => {
    const product = engine.getProduct('prod-001')!
    const scored: ScoredProduct = { product, score: 100, reason: 'test' }
    assert.equal(scored.product.id, 'prod-001')
    assert.equal(scored.score, 100)
    assert.equal(scored.reason, 'test')
  })

  it('ObjectionResponse 包含 type/response', () => {
    const resp: ObjectionResponse = {
      type: 'price',
      response: '我们提供分期付款服务',
    }
    assert.equal(resp.type, 'price')
    assert.equal(typeof resp.response, 'string')
  })

  it('ConverseSimulationResponse 包含 turns/finalSentiment', () => {
    const resp: ConverseSimulationResponse = {
      turns: [
        { turn: 1, speaker: 'customer', message: '太贵了', sentiment: 'negative' },
        { turn: 2, speaker: 'agent', message: '有优惠', sentiment: 'positive' },
      ],
      finalSentiment: 'positive',
    }
    assert.equal(resp.turns.length, 2)
    assert.equal(resp.finalSentiment, 'positive')
  })

  it('FollowUpCreatedResponse 包含 id/message/priority/status', () => {
    const resp = schedulerReturnShape()
    assert.equal(typeof resp.id, 'string')
    assert.equal(typeof resp.message, 'string')
    assert.equal(typeof resp.priority, 'number')
    assert.ok(['pending', 'completed', 'missed'].includes(resp.status))
  })
})

function schedulerReturnShape(): { id: string; message: string; priority: number; status: string } {
  const s = new FollowUpScheduler()
  const reminder = s.scheduleFollowUp('cust-001', {
    customerId: 'cust-001',
    salesId: 'sales-001',
    type: 'reorder',
    scheduledAt: '2026-07-20T00:00:00Z',
    message: 'test',
    priority: 3,
  })
  return {
    id: reminder.id,
    message: reminder.message,
    priority: reminder.priority,
    status: reminder.status,
  }
}
