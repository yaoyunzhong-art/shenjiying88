/**
 * AiSalesController 角色扩展测试
 *
 * 补充覆盖 8 角色中剩余的 4 个角色：
 *   👥HR 🔧安监 🎯运行专员 🤝团建
 *
 * 每个角色至少 2 个测试用例（正常流程 + 权限边界）
 */

import { describe, it, expect, beforeEach } from 'vitest'
import assert from 'node:assert/strict'
import {
  ProductRecommendationEngine,
  ObjectionHandler,
  FollowUpScheduler,
} from './ai-sales-copilot.service'
import { AiSalesController } from './ai-sales.controller'

// ── 角色 Emoji 定义 ──
const ROLES = {
  HR: '👥HR',
  Safety: '🔧安监',
  Ops: '🎯运行专员',
  Teambuilding: '🤝团建',
}

function makeController(): AiSalesController {
  return new AiSalesController(
    new ProductRecommendationEngine(),
    new ObjectionHandler(),
    new FollowUpScheduler(),
  )
}

// ════════════════════════════════════════════════
// 👥 HR 人力资源
// ════════════════════════════════════════════════
describe(`${ROLES.HR} ai-sales 角色扩展测试`, () => {
  let ctrl: AiSalesController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('HR 可以查看完整商品目录（用于员工内购培训）', () => {
    const products = ctrl.getAllProducts()
    assert.ok(products.length >= 10)
    const names = products.map(p => p.name)
    assert.ok(names.includes('基础护肤套装'))
    assert.ok(names.includes('美容仪 Pro'))
  })

  it('HR 可以查询到期跟进任务以管理销售员工工作', () => {
    ctrl.scheduleFollowUp({
      customerId: 'hr-cust-01',
      salesId: 'hr-sales-01',
      type: 'inactive',
      scheduledAt: new Date(Date.now() - 60_000).toISOString(),
      message: '唤醒沉睡客户',
    })
    const due = ctrl.getDueFollowUps('hr-sales-01')
    assert.ok(due.length > 0)
    assert.equal(due[0].customerId, 'hr-cust-01')
  })

  it('HR 尝试访问不存在的商品时得到正确错误', () => {
    assert.throws(
      () => ctrl.getProduct('non-existent-product'),
      /not found/,
    )
  })

  it('HR 可以设置客户生日并验证通过生日跟进创建', () => {
    ctrl.setBirthday({ customerId: 'hr-cust-birthday', birthday: '1992-03-15' })
    const created = ctrl.scheduleFollowUp({
      customerId: 'hr-cust-birthday',
      salesId: 'hr-sales-bd',
      type: 'birthday',
      scheduledAt: new Date().toISOString(),
      message: '',
    })
    assert.ok(created.message.includes('🎂'), '生日跟进自动含蛋糕emoji')
    assert.equal(created.status, 'pending')
  })
})

// ════════════════════════════════════════════════
// 🔧 安监 安全监督
// ════════════════════════════════════════════════
describe(`${ROLES.Safety} ai-sales 角色扩展测试`, () => {
  let ctrl: AiSalesController
  let ctrl2: AiSalesController

  beforeEach(() => {
    ctrl = makeController()
    ctrl2 = makeController()
  })

  it('安监可以查看商品信息以核对产品安全合规描述', () => {
    const p = ctrl.getProduct('prod-007')
    assert.equal(p.name, '氨基酸洁面')
    assert.equal(p.category, 'skincare')
    assert.ok(p.tags.includes('温和'), '安监需确认"温和"标签符合安全宣传')
  })

  it('安监可以对涉及安全异议的品类进行话术检查', () => {
    const result = ctrl.classifyObjection({ customerReply: '这个产品是正品吗？有保证吗？' })
    assert.equal(result.type, 'quality')
    const sim = ctrl.simulateConversation({
      objection: '有保证吗？会过敏吗？',
      response: '产品经过XX认证，符合国家标准，支持30天无理由退换货',
    })
    assert.equal(sim.turns.length, 3)
    assert.equal(sim.turns[1].speaker, 'agent')
  })

  it('安监使用空异议文本时默认返回 need 类型', () => {
    const result = ctrl.classifyObjection({ customerReply: '' })
    assert.equal(result.type, 'need')
  })

  it('安监检查不存在商品的向上销售返回空数组（安全兜底）', () => {
    const result = ctrl.recommendUpsell({ productId: 'unknown-product' })
    assert.equal(result.type, 'upsell')
    assert.equal(result.recommendations.length, 0)
  })

  it('两个独立引擎实例互不干扰（安监关注数据隔离）', () => {
    ctrl.recordPurchase({ customerId: 'safety-c1', productId: 'prod-001' })
    ctrl2.recordPurchase({ customerId: 'safety-c2', productId: 'prod-008' })
    const r1 = ctrl.recommend({ customerId: 'safety-c1', recentViewed: ['prod-001'] })
    const r2 = ctrl2.recommend({ customerId: 'safety-c2', recentViewed: ['prod-008'] })
    const c1Categories = new Set(r1.recommendations.map(r => r.product.category))
    assert.ok(c1Categories.has('skincare'), 'safety-c1 应推荐同品类')
    const c2Categories = new Set(r2.recommendations.map(r => r.product.category))
    assert.ok(c2Categories.has('beauty'), 'safety-c2 应推荐同品类')
  })
})

// ════════════════════════════════════════════════
// 🎯 运行专员 运营执行
// ════════════════════════════════════════════════
describe(`${ROLES.Ops} ai-sales 角色扩展测试`, () => {
  let ctrl: AiSalesController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('运行可以获取当前所有待处理跟进以便分配客服资源', () => {
    ctrl.scheduleFollowUp({
      customerId: 'ops-c1',
      salesId: 'ops-s1',
      type: 'reorder',
      scheduledAt: new Date().toISOString(),
      message: '复购提醒',
    })
    ctrl.scheduleFollowUp({
      customerId: 'ops-c2',
      salesId: 'ops-s1',
      type: 'price_alert',
      scheduledAt: new Date().toISOString(),
      message: '降价提醒',
    })
    const pending = ctrl.getPendingFollowUps('ops-s1')
    assert.equal(pending.length, 2)
  })

  it('运行可以标记跟进完成并验证状态变更', () => {
    const created = ctrl.scheduleFollowUp({
      customerId: 'ops-c3',
      salesId: 'ops-s2',
      type: 'inactive',
      scheduledAt: new Date().toISOString(),
      message: '沉睡唤醒',
    })
    const completed = ctrl.markCompleted({ followUpId: created.id })
    assert.ok('status' in completed)
    assert.equal(completed.status, 'completed')
  })

  it('运行可以为顾客推荐并记录购买（模拟完整运营闭环）', () => {
    const rec = ctrl.recommend({
      customerId: 'ops-c-loop',
      recentViewed: ['prod-005'],
      scenario: 'casual',
    })
    assert.ok(rec.recommendations.length > 0)
    const purchase = ctrl.recordPurchase({ customerId: 'ops-c-loop', productId: 'prod-005' })
    assert.equal(purchase.success, true)
  })

  it('运行可以安排生日跟进以验证生日消息自动生成', () => {
    const created = ctrl.scheduleFollowUp({
      customerId: 'ops-birthday-01',
      salesId: 'ops-test',
      type: 'birthday',
      scheduledAt: new Date().toISOString(),
      message: '',
    })
    assert.ok(created.message.includes('🎂'), '生日跟进自动生成生日消息')
    assert.ok(created.id.startsWith('followup-'))
  })

  it('运行对不存在的 followUpId 标记完成返回错误信息', () => {
    const result = ctrl.markCompleted({ followUpId: 'nonexistent-followup' })
    assert.ok('error' in result)
    assert.ok(String((result as any).error).includes('not found'))
  })

  it('运行可以获取即将到来的生日提醒列表', () => {
    // seedMockData 内置 cust-001~003，其中某客户生日应在范围内
    const bdays = ctrl.getUpcomingBirthdays('365')
    assert.ok(Array.isArray(bdays))
    assert.ok(bdays.length >= 1)
  })
})

// ════════════════════════════════════════════════
// 🤝 团建 团队建设专员
// ════════════════════════════════════════════════
describe(`${ROLES.Teambuilding} ai-sales 角色扩展测试`, () => {
  let ctrl: AiSalesController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('团建可以为团队活动推荐商品（场景化推荐）', () => {
    ctrl.recordPurchase({ customerId: 'team-c1', productId: 'prod-009' })
    const result = ctrl.recommend({
      customerId: 'team-c1',
      recentViewed: ['prod-009'],
      scenario: 'festival',
    })
    assert.equal(result.type, 'context-aware')
    assert.ok(result.recommendations.length > 0)
  })

  it('团建可以对价格异议生成标准应对话术', () => {
    const type = ctrl.classifyObjection({ customerReply: '太贵了，团建经费有限' })
    assert.equal(type.type, 'price')
    const response = ctrl.generateResponse({
      customerId: 'team-obj-01',
      productId: 'prod-009',
      objectionType: 'price',
      conversationHistory: ['团建预算有限'],
    })
    // generateResponse 返回 { type, response } 对象
    assert.ok(typeof response === 'object')
    assert.ok('response' in response)
    assert.ok((response as any).response.length > 5)
  })

  it('团建可以安排多组团队客户的生日跟进', () => {
    const r1 = ctrl.scheduleFollowUp({
      customerId: 'team-member-1',
      salesId: 'team-sales',
      type: 'birthday',
      scheduledAt: new Date().toISOString(),
      message: '',
    })
    const r2 = ctrl.scheduleFollowUp({
      customerId: 'team-member-2',
      salesId: 'team-sales',
      type: 'birthday',
      scheduledAt: new Date().toISOString(),
      message: '',
    })
    assert.ok(r1.message.includes('🎂'))
    assert.ok(r2.message.includes('🎂'))
    assert.equal(r1.status, 'pending')
    assert.equal(r2.status, 'pending')
  })

  it('团建可以查看所有商品的品类分布用于团建选品', () => {
    const products = ctrl.getAllProducts()
    const categories = [...new Set(products.map(p => p.category))]
    assert.ok(categories.includes('skincare'))
    assert.ok(categories.includes('makeup'))
    assert.ok(categories.includes('beauty'))
  })

  it('团建对\n"别家更便宜"竞争类异议正确分类', () => {
    const result = ctrl.classifyObjection({ customerReply: '我在别家更便宜' })
    assert.equal(result.type, 'competitor')
  })

  it('团建模拟价格异议对话最终走向正面的三回合交互', () => {
    const result = ctrl.simulateConversation({
      objection: '太贵了，有优惠吗',
      response: '现在下单可享8折优惠和满减活动',
    })
    assert.equal(result.turns.length, 3)
    assert.equal(result.turns[1].speaker, 'agent')
    assert.equal(result.finalSentiment, 'positive')
  })
})
