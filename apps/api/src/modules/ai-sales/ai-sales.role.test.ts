import { describe, it, expect, beforeEach } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import {
  ProductRecommendationEngine,
  ObjectionHandler,
  FollowUpScheduler
} from './ai-sales-copilot.service'
import { AiSalesController } from './ai-sales.controller'

// ── 8 角色定义 ──
const ROLES = {
  TenantAdmin: '👔店长',
  Reception: '🛒前台',
  HR: '👥HR',
  Safety: '🔧安监',
  Guide: '🎮导玩员',
  Ops: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销'
}

function makeController(): AiSalesController {
  return new AiSalesController(
    new ProductRecommendationEngine(),
    new ObjectionHandler(),
    new FollowUpScheduler()
  )
}

// ──────────── 🎮 导玩员 ────────────
describe(`${ROLES.Guide} ai-sales 角色测试`, () => {
  let ctrl: AiSalesController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('导玩员可以为顾客获取商品推荐（推荐游戏间消费）', () => {
    ctrl.recordPurchase({ customerId: 'guide-cust-01', productId: 'prod-001' })
    const result = ctrl.recommend({
      customerId: 'guide-cust-01',
      recentViewed: ['prod-001']
    })
    assert.equal(result.type, 'context-aware')
    assert.ok(result.recommendations.length > 0)
  })

  it('导玩员可以查询商品列表（便于现场介绍）', () => {
    const products = ctrl.getAllProducts()
    assert.ok(Array.isArray(products))
    assert.ok(products.length >= 10) // seedMockProducts 有 10 个
  })

  it('导玩员可以获取单个商品详情', () => {
    const product = ctrl.getProduct('prod-005')
    assert.equal(product.id, 'prod-005')
    assert.equal(product.name, '口红套装')
  })

  it('导玩员可以给新客户进行需求型异议分类', () => {
    const result = ctrl.classifyObjection({ customerReply: '这个适合我吗' })
    assert.equal(result.type, 'need')
  })

  it('导玩员可以安排生日跟进提醒', () => {
    const result = ctrl.scheduleFollowUp({
      customerId: 'guide-cust-birthday',
      salesId: 'guide-sales',
      type: 'birthday',
      scheduledAt: new Date().toISOString(),
      message: ''
    })
    assert.ok(result.id)
    assert.ok(result.message.includes('生日'))
    assert.equal(result.status, 'pending')
  })
})

// ──────────── 📢 营销 ────────────
describe(`${ROLES.Marketing} ai-sales 角色测试`, () => {
  let ctrl: AiSalesController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('营销可以为精准客户获取场景化推荐', () => {
    ctrl.recordPurchase({ customerId: 'mkt-cust-01', productId: 'prod-003' })
    const result = ctrl.recommend({
      customerId: 'mkt-cust-01',
      recentViewed: ['prod-003'],
      scenario: 'birthday'
    })
    assert.equal(result.type, 'context-aware')
    assert.ok(result.context?.includes('birthday'))
    // 生日场景有 1.2 倍分数加成
    assert.ok(result.recommendations.length > 0)
  })

  it('营销可以进行向上销售推荐（提升客单价）', () => {
    const result = ctrl.recommendUpsell({ productId: 'prod-001' })
    assert.equal(result.type, 'upsell')
    // prod-001(199) 的向上销售商品价格都应 > 199
    assert.ok(result.recommendations.length > 0)
    for (const r of result.recommendations) {
      assert.ok(r.product.price > 199)
    }
  })

  it('营销可以进行交叉销售推荐（关联品类）', () => {
    const result = ctrl.recommendCrossSell({ productId: 'prod-001' })
    assert.equal(result.type, 'cross-sell')
    assert.ok(result.recommendations.length > 0)
    // 护肤品→彩妆/美容应有亲和度
    const categories = new Set(result.recommendations.map(r => r.product.category))
    assert.ok(categories.has('makeup') || categories.has('beauty'))
  })

  it('营销可以获取待发送的跟进提醒', () => {
    ctrl.scheduleFollowUp({
      customerId: 'mkt-cust-02',
      salesId: 'mkt-sales',
      type: 'price_alert',
      scheduledAt: new Date().toISOString(),
      message: '调价提醒'
    })
    const pending = ctrl.getPendingFollowUps('mkt-sales')
    assert.ok(pending.length > 0)
    assert.equal(pending[0].salesId, 'mkt-sales')
  })

  it('营销可以查询即将到来的生日客户', () => {
    const birthdays = ctrl.getUpcomingBirthdays('365')
    assert.ok(Array.isArray(birthdays))
    assert.ok(birthdays.length > 0) // seedMockData 有 3 个客户
  })
})

// ──────────── 🛒 前台 ────────────
describe(`${ROLES.Reception} ai-sales 角色测试`, () => {
  let ctrl: AiSalesController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('前台可以为到店顾客获取商品推荐', () => {
    const result = ctrl.recommend({
      customerId: 'reception-cust',
      recentViewed: [],
      scenario: 'casual'
    })
    assert.equal(result.type, 'context-aware')
    assert.ok(result.recommendations.length > 0)
  })

  it('前台可以查询所有商品和详情', () => {
    const all = ctrl.getAllProducts()
    const single = ctrl.getProduct('prod-007')
    assert.ok(all.length >= 10)
    assert.equal(single.name, '氨基酸洁面')
  })

  it('前台可以记录顾客购买', () => {
    const result = ctrl.recordPurchase({
      customerId: 'reception-cust',
      productId: 'prod-001'
    })
    assert.equal(result.success, true)
  })

  it('前台可以查询即将进行的活动跟进', () => {
    const birthdays = ctrl.getUpcomingBirthdays('30')
    assert.ok(Array.isArray(birthdays))
  })

  it('前台对价格异议进行分类（面对面的场景）', () => {
    const result = ctrl.classifyObjection({ customerReply: '太贵了，有优惠吗' })
    assert.equal(result.type, 'price')
  })
})

// ──────────── 👔 店长 ────────────
describe(`${ROLES.TenantAdmin} ai-sales 角色测试`, () => {
  let ctrl: AiSalesController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('店长可以查看完整的商品目录', () => {
    const products = ctrl.getAllProducts()
    assert.ok(products.length >= 10)
    const categories = new Set(products.map(p => p.category))
    assert.ok(categories.has('skincare'))
    assert.ok(categories.has('makeup'))
    assert.ok(categories.has('beauty'))
  })

  it('店长可以查询销售跟进任务', () => {
    ctrl.scheduleFollowUp({
      customerId: 'admin-cust-01',
      salesId: 'admin-sales',
      type: 'reorder',
      scheduledAt: new Date().toISOString(),
      message: '复购提醒'
    })
    const pending = ctrl.getPendingFollowUps('admin-sales')
    assert.ok(pending.length > 0)
  })

  it('店长可以标记跟进完成为已完成状态', () => {
    const created = ctrl.scheduleFollowUp({
      customerId: 'admin-cust-02',
      salesId: 'admin-sales',
      type: 'inactive',
      scheduledAt: new Date().toISOString(),
      message: '唤醒提醒'
    })
    const completed = ctrl.markCompleted({ followUpId: created.id })
    assert.ok('status' in completed)
    assert.equal(completed.status, 'completed')
  })

  it('店长可以设置客户生日信息', () => {
    const result = ctrl.setBirthday({
      customerId: 'admin-cust-birthday',
      birthday: '1990-06-15'
    })
    assert.equal(result.success, true)
  })

  it('店长可以获取到期跟进任务', () => {
    const pastTime = new Date(Date.now() - 5000).toISOString()
    ctrl.scheduleFollowUp({
      customerId: 'admin-cust-03',
      salesId: 'admin-sales-due',
      type: 'price_alert',
      scheduledAt: pastTime,
      message: '到期提醒'
    })
    const due = ctrl.getDueFollowUps('admin-sales-due')
    assert.ok(due.length > 0)
    assert.equal(due[0].status, 'pending')
  })
})

// ──────────── 跨角色边界测试 ────────────
describe('多角色 ai-sales 边界测试', () => {
  it('空商品ID查询返回商品未找到错误', () => {
    const ctrl = makeController()
    assert.throws(
      () => ctrl.getProduct('non-existent'),
      /not found/
    )
  })

  it('不存在的 upsell 商品返回空数组', () => {
    const ctrl = makeController()
    const result = ctrl.recommendUpsell({ productId: 'non-existent' })
    assert.equal(result.recommendations.length, 0)
  })

  it('不存在的 cross-sell 商品返回空数组', () => {
    const ctrl = makeController()
    const result = ctrl.recommendCrossSell({ productId: 'non-existent' })
    assert.equal(result.recommendations.length, 0)
  })

  it('不存在的 follow-up 标记完成返回错误', () => {
    const ctrl = makeController()
    const result = ctrl.markCompleted({ followUpId: 'non-existent' })
    assert.ok('error' in result)
    assert.ok(result.error.includes('not found'))
  })

  it('空字符串异议分类默认为 need', () => {
    const ctrl = makeController()
    const result = ctrl.classifyObjection({ customerReply: '' })
    assert.equal(result.type, 'need')
  })

  it('模拟对话返回3轮', () => {
    const ctrl = makeController()
    const result = ctrl.simulateConversation({
      objection: '太贵了',
      response: '现在购买可享8折优惠和满减活动'
    })
    assert.equal(result.turns.length, 3)
    assert.equal(result.finalSentiment, 'positive')
  })
})
