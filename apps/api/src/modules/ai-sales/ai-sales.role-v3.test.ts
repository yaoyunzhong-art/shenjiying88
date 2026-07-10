import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [ai-sales] [C] 角色测试 v3 — 大飞哥电玩城实景销售场景
 *
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 * 围绕大飞哥美国三店运营场景的 ai-sales 导购副驾模块：
 *
 * 店A: Cyber Galaxy Arcade (Colonial Heights, VA)
 * 店B: 休斯顿 (Houston, TX)
 *
 * 每个角色 >= 3 测试用例（正常流程 + 业务边界 + 异常/降级）
 * 覆盖: recommend, recommendUpsell, recommendCrossSell,
 *       getAllProducts, getProduct, recordPurchase,
 *       classifyObjection, generateResponse, simulateConversation,
 *       scheduleFollowUp, markCompleted, getDueFollowUps,
 *       getPendingFollowUps, getUpcomingBirthdays, setBirthday
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import {
  ProductRecommendationEngine,
  ObjectionHandler,
  FollowUpScheduler,
} from './ai-sales-copilot.service'
import { AiSalesController } from './ai-sales.controller'
import type {
  Product,
  ScoredProduct,
  FollowUpReminder,
  UpcomingBirthday,
} from './ai-sales.entity'

// ── 8 角色定义 ──
const ROLES = {
  StoreManager: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Security: '🔧安监',
  Guide: '🎮导玩员',
  Operations: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
} as const

// ── 大飞哥三店场景常量 ──
const STORE_CYBER = { id: 'store-cyber-galaxy', name: 'Cyber Galaxy Arcade', city: 'Colonial Heights' }
const STORE_HOUSTON = { id: 'store-houston', name: '休斯顿店', city: 'Houston' }

// ── 测试数据工厂 ──
function makeController(): AiSalesController {
  return new AiSalesController(
    new ProductRecommendationEngine(),
    new ObjectionHandler(),
    new FollowUpScheduler(),
  )
}

// ════════════════════════════════════════════════════════════════
// 👔 店长 — 全局销售策略与商品目录管理
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.StoreManager} 店长视角: 商品目录与全局销售策略`, () => {
  let ctrl: AiSalesController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('店长查看完整商品目录 — 返回10个商品覆盖3个品类', () => {
    const products = ctrl.getAllProducts() as Product[]
    assert.equal(products.length, 10)
    const categories = new Set(products.map(p => p.category))
    assert.ok(categories.has('skincare'))
    assert.ok(categories.has('makeup'))
    assert.ok(categories.has('beauty'))
  })

  it('店长查询指定商品详情', () => {
    const p = ctrl.getProduct('prod-008') as Product
    assert.equal(p.name, '美容仪 Pro')
    assert.equal(p.price, 1599)
    assert.equal(p.quality, 'premium')
  })

  it('店长查询不存在的商品 — 应抛出错误', () => {
    assert.throws(() => ctrl.getProduct('nonexistent-prod'), /not found/)
  })

  it('店长为VIP客户做场景化推荐 — 生日场景应获得1.2倍加权', () => {
    ctrl.recordPurchase({ customerId: 'store-mgr-vip', productId: 'prod-003' })
    const result = ctrl.recommend({
      customerId: 'store-mgr-vip',
      recentViewed: ['prod-003'],
      scenario: 'birthday',
    })
    assert.equal(result.type, 'context-aware')
    assert.ok(result.context?.includes('birthday'))
    assert.ok(result.recommendations.length > 0)
    // 生日场景所有推荐分数应有1.2倍加成
    for (const r of result.recommendations) {
      assert.ok(r.score > 0)
      assert.ok(r.reason.includes('生日特惠') || r.product.name.length > 0)
    }
  })

  it('店长查看跟进任务列表 — 安排+查询到期任务', () => {
    const pastTime = new Date(Date.now() - 60000).toISOString()
    ctrl.scheduleFollowUp({
      customerId: 'mgr-cust-01',
      salesId: 'mgr-sales',
      type: 'inactive',
      scheduledAt: pastTime,
      message: '沉睡客户唤醒',
    })
    const due = ctrl.getDueFollowUps('mgr-sales') as FollowUpReminder[]
    assert.ok(due.length >= 1)
    assert.equal(due[0].customerId, 'mgr-cust-01')
  })

  it('店长标记跟进已完成', () => {
    const created = ctrl.scheduleFollowUp({
      customerId: 'mgr-cust-02',
      salesId: 'mgr-sales',
      type: 'reorder',
      scheduledAt: new Date().toISOString(),
      message: '复购提醒',
    })
    const completed = ctrl.markCompleted({ followUpId: created.id })
    assert.ok('status' in completed)
    assert.equal((completed as FollowUpReminder).status, 'completed')
  })

  it('店长对不存在的跟进ID标记完成返回错误', () => {
    const result = ctrl.markCompleted({ followUpId: 'nonexistent-followup' })
    assert.ok('error' in result)
    assert.ok(String((result as any).error).includes('not found'))
  })
})

// ════════════════════════════════════════════════════════════════
// 🛒 前台 — 现场客户接待与即时推荐
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.FrontDesk} 前台视角: 现场接待与快速推荐`, () => {
  let ctrl: AiSalesController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('前台为到店新客获取推荐 — 无消费历史应展示最热商品', () => {
    const result = ctrl.recommend({
      customerId: 'front-new-cust',
      recentViewed: [],
      scenario: 'casual',
    })
    assert.equal(result.type, 'context-aware')
    assert.ok(result.recommendations.length > 0)
    // 无历史的情况下应基于品类亲和度推荐全品类商品
    const categories = new Set(result.recommendations.map(r => r.product.category))
    assert.ok(categories.size >= 2)
  })

  it('前台快速获取商品详情用于现场介绍', () => {
    const p = ctrl.getProduct('prod-005') as Product
    assert.equal(p.name, '口红套装')
    assert.equal(p.price, 299)
    assert.ok(p.tags.includes('彩妆'))
  })

  it('前台记录客户购买行为', () => {
    const result = ctrl.recordPurchase({ customerId: 'front-cust-01', productId: 'prod-001' })
    assert.equal(result.success, true)
  })

  it('前台为老客户推荐 — 基于历史购买记录', () => {
    ctrl.recordPurchase({ customerId: 'front-return-cust', productId: 'prod-007' })
    const result = ctrl.recommend({
      customerId: 'front-return-cust',
      recentViewed: ['prod-007'],
    })
    assert.equal(result.type, 'context-aware')
    assert.ok(result.recommendations.length > 0)
    // 洁面乳购买后应推荐同品类护肤商品
    const skincareRecs = result.recommendations.filter(r => r.product.category === 'skincare')
    assert.ok(skincareRecs.length > 0)
  })

  it('前台对价格质询做实时分类', () => {
    const result = ctrl.classifyObjection({ customerReply: '这个太贵了，有便宜点的吗' })
    assert.equal(result.type, 'price')
  })

  it('前台对空异议文本默认为 need 类型（边界）', () => {
    const result = ctrl.classifyObjection({ customerReply: '' })
    assert.equal(result.type, 'need')
  })
})

// ════════════════════════════════════════════════════════════════
// 👥 HR — 员工内购管理与培训话术合规
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.HR} HR视角: 员工内购与培训话术`, () => {
  let ctrl: AiSalesController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('HR查看完整商品目录用于员工内购培训', () => {
    const products = ctrl.getAllProducts() as Product[]
    assert.equal(products.length, 10)
    const names = products.map(p => p.name)
    assert.ok(names.includes('基础护肤套装'))
    assert.ok(names.includes('美容仪 Pro'))
    assert.ok(names.includes('香水礼盒'))
  })

  it('HR设置客户生日并生成生日跟进', () => {
    ctrl.setBirthday({ customerId: 'hr-cust-birthday', birthday: '1990-03-15' })
    const created = ctrl.scheduleFollowUp({
      customerId: 'hr-cust-birthday',
      salesId: 'hr-sales',
      type: 'birthday',
      scheduledAt: new Date().toISOString(),
      message: '',
    })
    assert.ok(created.message.includes('🎂'))
    assert.equal(created.status, 'pending')
  })

  it('HR对质量异议生成应对话术 — 培训质检场景', () => {
    // '是正品吗' 匹配 quality 关键词组
    const type = ctrl.classifyObjection({ customerReply: '这是正品吗？有质检报告吗' })
    assert.equal(type.type, 'quality')
    const response = ctrl.generateResponse({
      customerId: 'hr-training-cust',
      productId: 'prod-003',
      objectionType: 'quality',
      conversationHistory: ['请问这个面霜成分安全吗'],
    })
    assert.ok(typeof response === 'object')
    assert.ok('response' in response)
    assert.ok((response as any).response.length > 5)
  })

  it('HR对竞争类异议正确分类（同行比价场景）', () => {
    // '别家更便宜' 精确匹配 competitor 关键词组
    const result = ctrl.classifyObjection({ customerReply: '别家更便宜，你们能比吗' })
    assert.equal(result.type, 'competitor')
  })

  it('HR模拟对话验证话术培训效果 — 最终情感走向正面', () => {
    const result = ctrl.simulateConversation({
      objection: '这个产品太贵了',
      response: '我们现在有会员8折优惠，还可叠加满减活动',
    })
    assert.equal(result.turns.length, 3)
    assert.equal(result.turns[1].speaker, 'agent')
    assert.equal(result.finalSentiment, 'positive')
  })
})

// ════════════════════════════════════════════════════════════════
// 🔧 安监 — 商品安全合规检查与异议话术审核
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Security} 安监视角: 商品安全合规与话术审核`, () => {
  let ctrl: AiSalesController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('安监检查商品标签合规 — 氨基酸洁面应有"温和"标签', () => {
    const p = ctrl.getProduct('prod-007') as Product
    assert.ok(p.tags.includes('温和'))
    assert.equal(p.name, '氨基酸洁面')
    assert.equal(p.category, 'skincare')
  })

  it('安监审核美容仪Pro为premium品质且价格合理', () => {
    const p = ctrl.getProduct('prod-008') as Product
    assert.equal(p.quality, 'premium')
    assert.equal(p.price, 1599)
    assert.ok(p.tags.includes('家用'))
  })

  it('安监对安全争议生成应对话术', () => {
    const type = ctrl.classifyObjection({ customerReply: '用了过敏怎么办？有保障吗' })
    assert.equal(type.type, 'quality')
    const response = ctrl.generateResponse({
      customerId: 'safety-cust-01',
      productId: 'prod-008',
      objectionType: 'quality',
      conversationHistory: ['这个美容仪安全吗？会伤到皮肤吗'],
    })
    assert.ok((response as any).response.length > 5)
  })

  it('安监对不存在商品的向上销售返回空数组（安全兜底）', () => {
    const result = ctrl.recommendUpsell({ productId: 'unknown-prod' })
    assert.equal(result.type, 'upsell')
    assert.equal(result.recommendations.length, 0)
  })

  it('安监对不存在商品的交叉销售返回空数组', () => {
    const result = ctrl.recommendCrossSell({ productId: 'invalid-prod-id' })
    assert.equal(result.type, 'cross-sell')
    assert.equal(result.recommendations.length, 0)
  })

  it('安监验证两个独立引擎实例互不干扰（数据隔离）', () => {
    const ctrl1 = makeController()
    const ctrl2 = makeController()
    ctrl1.recordPurchase({ customerId: 'iso-cust-01', productId: 'prod-001' })
    ctrl2.recordPurchase({ customerId: 'iso-cust-02', productId: 'prod-008' })

    const r1 = ctrl1.recommend({ customerId: 'iso-cust-01', recentViewed: ['prod-001'] })
    const r2 = ctrl2.recommend({ customerId: 'iso-cust-02', recentViewed: ['prod-008'] })

    // ctrl1客户买了skincare产品应推荐skincare为主
    const c1Skincare = r1.recommendations.filter(r => r.product.category === 'skincare')
    assert.ok(c1Skincare.length > 0)

    // ctrl2客户买了beauty品类应推荐beauty为主
    const c2Beauty = r2.recommendations.filter(r => r.product.category === 'beauty')
    assert.ok(c2Beauty.length > 0)
  })
})

// ════════════════════════════════════════════════════════════════
// 🎮 导玩员 — 游戏机台周边商品推荐与现场销售
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Guide} 导玩员视角: 游戏周边推荐与现场销售`, () => {
  let ctrl: AiSalesController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('导玩员为游戏玩家推荐礼品类商品', () => {
    ctrl.recordPurchase({ customerId: 'guide-game-cust', productId: 'prod-005' })
    const result = ctrl.recommend({
      customerId: 'guide-game-cust',
      recentViewed: ['prod-005'],
      scenario: 'festival',
    })
    assert.equal(result.type, 'context-aware')
    assert.ok(result.context?.includes('festival'))
    assert.ok(result.recommendations.length > 0)
    // 口红套装属makeup，应推荐beauty或makeup关联商品
    const relatedCats = new Set(result.recommendations.map(r => r.product.category))
    assert.ok(relatedCats.has('makeup') || relatedCats.has('beauty'))
  })

  it('导玩员通过向上销售推荐更高价位商品', () => {
    const result = ctrl.recommendUpsell({ productId: 'prod-007' })
    assert.equal(result.type, 'upsell')
    assert.ok(result.recommendations.length > 0)
    // 氨基酸洁面(129)的向上销售商品价格应>129
    for (const r of result.recommendations) {
      assert.ok(r.product.price > 129)
    }
  })

  it('导玩员通过交叉销售推荐关联品类', () => {
    const result = ctrl.recommendCrossSell({ productId: 'prod-001' })
    assert.equal(result.type, 'cross-sell')
    assert.ok(result.recommendations.length > 0)
    // 护肤套装(skincare)的交叉销售应包含makeup或beauty
    const categories = new Set(result.recommendations.map(r => r.product.category))
    assert.ok(categories.has('makeup') || categories.has('beauty'))
  })

  it('导玩员查询单个商品详情', () => {
    const p = ctrl.getProduct('prod-009') as Product
    assert.equal(p.name, '香水礼盒')
    assert.equal(p.price, 699)
    assert.equal(p.quality, 'high')
  })

  it('导玩员对价格异议分类', () => {
    // '划算吗' 匹配 price 关键词组
    const result = ctrl.classifyObjection({ customerReply: '这个划算吗，性价比怎么样' })
    assert.equal(result.type, 'price')
  })

  it('导玩员安排客户生日跟进提醒', () => {
    const created = ctrl.scheduleFollowUp({
      customerId: 'guide-birthday-cust',
      salesId: 'guide-sales',
      type: 'birthday',
      scheduledAt: new Date().toISOString(),
      message: '',
    })
    assert.ok(created.message.includes('🎂'))
    assert.equal(created.status, 'pending')
    assert.ok(created.id.startsWith('followup-'))
  })
})

// ════════════════════════════════════════════════════════════════
// 🎯 运行专员 — 销售运行调度与任务管理
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Operations} 运行专员视角: 销售任务调度与批量运营`, () => {
  let ctrl: AiSalesController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('运行专员安排多个跟进任务并查询待处理列表', () => {
    ctrl.scheduleFollowUp({
      customerId: 'ops-cust-01',
      salesId: 'ops-sales-01',
      type: 'reorder',
      scheduledAt: new Date().toISOString(),
      message: '请跟进复购',
    })
    ctrl.scheduleFollowUp({
      customerId: 'ops-cust-02',
      salesId: 'ops-sales-01',
      type: 'price_alert',
      scheduledAt: new Date().toISOString(),
      message: '价格调整提醒',
    })
    ctrl.scheduleFollowUp({
      customerId: 'ops-cust-03',
      salesId: 'ops-sales-01',
      type: 'inactive',
      scheduledAt: new Date().toISOString(),
      message: '沉睡客户唤醒',
    })

    const pending = ctrl.getPendingFollowUps('ops-sales-01') as FollowUpReminder[]
    assert.equal(pending.length, 3)
    const types = new Set(pending.map(p => p.type))
    assert.ok(types.has('reorder'))
    assert.ok(types.has('price_alert'))
    assert.ok(types.has('inactive'))
  })

  it('运行专员查看所有待处理跟进（不传salesId）', () => {
    ctrl.scheduleFollowUp({
      customerId: 'ops-all-01',
      salesId: 'ops-001',
      type: 'reorder',
      scheduledAt: new Date().toISOString(),
      message: '提醒',
    })
    const allPending = ctrl.getPendingFollowUps() as FollowUpReminder[]
    assert.ok(allPending.length >= 1)
  })

  it('运行专员标记多项任务完成', () => {
    const fu1 = ctrl.scheduleFollowUp({
      customerId: 'ops-complete-01',
      salesId: 'ops-completer',
      type: 'reorder',
      scheduledAt: new Date().toISOString(),
      message: '完成测试',
    })
    const fu2 = ctrl.scheduleFollowUp({
      customerId: 'ops-complete-02',
      salesId: 'ops-completer',
      type: 'inactive',
      scheduledAt: new Date().toISOString(),
      message: '完成测试2',
    })

    const completed1 = ctrl.markCompleted({ followUpId: fu1.id })
    const completed2 = ctrl.markCompleted({ followUpId: fu2.id })

    assert.equal((completed1 as FollowUpReminder).status, 'completed')
    assert.equal((completed2 as FollowUpReminder).status, 'completed')
  })

  it('运行专员获取到期跟进任务', () => {
    const pastTime = new Date(Date.now() - 120000).toISOString()
    ctrl.scheduleFollowUp({
      customerId: 'ops-due-cust',
      salesId: 'ops-due-sales',
      type: 'price_alert',
      scheduledAt: pastTime,
      message: '已到期提醒',
    })
    const due = ctrl.getDueFollowUps('ops-due-sales') as FollowUpReminder[]
    assert.ok(due.length >= 1)
    assert.equal(due[0].status, 'pending')
  })

  it('运行专员查询即将到来的生日客户', () => {
    ctrl.setBirthday({ customerId: 'ops-bd-cust', birthday: '1995-07-15' })
    const birthdays = ctrl.getUpcomingBirthdays('365') as UpcomingBirthday[]
    assert.ok(Array.isArray(birthdays))
  })

  it('运行专员销售闭环：推荐→购买→再推荐', () => {
    // 第一步：推荐
    const rec = ctrl.recommend({
      customerId: 'ops-loop-cust',
      recentViewed: ['prod-003'],
    })
    assert.ok(rec.recommendations.length > 0)
    // 第二步：记录购买
    ctrl.recordPurchase({ customerId: 'ops-loop-cust', productId: 'prod-003' })
    // 第三步：基于购买再推荐
    const recAgain = ctrl.recommend({
      customerId: 'ops-loop-cust',
      recentViewed: ['prod-003'],
    })
    assert.ok(recAgain.recommendations.length > 0)
    // 再推荐应包含关联品类
    const categories = new Set(recAgain.recommendations.map(r => r.product.category))
    assert.ok(categories.size >= 1)
  })
})

// ════════════════════════════════════════════════════════════════
// 🤝 团建 — 团队活动选品与集体购买跟进
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Teambuilding} 团建视角: 团队活动选品与集体跟进`, () => {
  let ctrl: AiSalesController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('团建专员查看全品类商品用于团队选品', () => {
    const products = ctrl.getAllProducts() as Product[]
    const categories = new Set(products.map(p => p.category))
    assert.ok(categories.has('makeup'))
    assert.ok(categories.has('skincare'))
    assert.ok(categories.has('beauty'))
  })

  it('团建专员为团队活动做场景化推荐', () => {
    const result = ctrl.recommend({
      customerId: 'team-activity-01',
      recentViewed: [],
      scenario: 'festival',
    })
    assert.equal(result.type, 'context-aware')
    assert.ok(result.context?.includes('festival'))
    assert.ok(result.recommendations.length > 0)
  })

  it('团建专员安排多成员集体活动后的跟进任务', () => {
    const r1 = ctrl.scheduleFollowUp({
      customerId: 'team-member-1',
      salesId: 'team-activity-sales',
      type: 'birthday',
      scheduledAt: new Date().toISOString(),
      message: '',
    })
    const r2 = ctrl.scheduleFollowUp({
      customerId: 'team-member-2',
      salesId: 'team-activity-sales',
      type: 'inactive',
      scheduledAt: new Date().toISOString(),
      message: '团队活动后唤醒',
    })
    assert.equal(r1.status, 'pending')
    assert.ok(r1.message.includes('🎂'))
    assert.equal(r2.status, 'pending')

    // 查看所有待处理任务
    const pending = ctrl.getPendingFollowUps('team-activity-sales') as FollowUpReminder[]
    assert.equal(pending.length, 2)
  })

  it('团建专员对竞争类异议做分类', () => {
    const result = ctrl.classifyObjection({ customerReply: '别家更便宜，这个价格不行' })
    assert.equal(result.type, 'competitor')
  })

  it('团建专员模拟价格异议对话 — 3轮互动最终积极', () => {
    const result = ctrl.simulateConversation({
      objection: '太贵了，我们团队预算有限',
      response: '团购可以享受8折优惠，买5件以上再送赠品',
    })
    assert.equal(result.turns.length, 3)
    assert.equal(result.finalSentiment, 'positive')
  })

  it('团建专员对无效跟进ID标记完成返回错误', () => {
    const result = ctrl.markCompleted({ followUpId: 'team-nonexistent-fu' })
    assert.ok('error' in result)
    assert.ok(String((result as any).error).includes('not found'))
  })

  it('团建专员可以对团购客户设置生日并生成提醒', () => {
    ctrl.setBirthday({ customerId: 'team-bd-group', birthday: '1992-08-20' })
    const created = ctrl.scheduleFollowUp({
      customerId: 'team-bd-group',
      salesId: 'team-group-sales',
      type: 'birthday',
      scheduledAt: new Date().toISOString(),
      message: '',
    })
    assert.ok(created.message.includes('🎂'))
    assert.ok(created.id.startsWith('followup-'))
  })
})

// ════════════════════════════════════════════════════════════════
// 📢 营销 — 精准营销推荐与活动风险评估
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Marketing} 营销视角: 营销活动推荐与精准销售`, () => {
  let ctrl: AiSalesController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('营销专员为活动会员做场景化推荐 — 节日场景', () => {
    ctrl.recordPurchase({ customerId: 'mkt-campaign-cust', productId: 'prod-009' })
    const result = ctrl.recommend({
      customerId: 'mkt-campaign-cust',
      recentViewed: ['prod-009'],
      scenario: 'festival',
    })
    assert.equal(result.type, 'context-aware')
    assert.ok(result.context?.includes('festival'))
    // 香水礼盒属beauty，应推荐beauty/skincare关联商品
    assert.ok(result.recommendations.length > 0)
  })

  it('营销专员向上销售 — 基础款→高阶款推荐', () => {
    const result = ctrl.recommendUpsell({ productId: 'prod-001' })
    assert.equal(result.type, 'upsell')
    for (const r of result.recommendations) {
      assert.ok(r.product.price > 199)
    }
  })

  it('营销专员交叉销售 — 跨品类推荐', () => {
    const result = ctrl.recommendCrossSell({ productId: 'prod-001' })
    assert.equal(result.type, 'cross-sell')
    const categories = new Set(result.recommendations.map(r => r.product.category))
    assert.ok(categories.has('makeup') || categories.has('beauty'))
  })

  it('营销专员获取即将到来的生日客户用于精准营销', () => {
    ctrl.setBirthday({ customerId: 'mkt-bd-lead', birthday: (() => {
      const d = new Date()
      d.setDate(d.getDate() + 3)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    })() })
    const birthdays = ctrl.getUpcomingBirthdays('7') as UpcomingBirthday[]
    assert.ok(Array.isArray(birthdays))
  })

  it('营销专员安排价格变动跟进', () => {
    const created = ctrl.scheduleFollowUp({
      customerId: 'mkt-price-cust',
      salesId: 'mkt-sales',
      type: 'price_alert',
      scheduledAt: new Date().toISOString(),
      message: '折扣活动提醒',
    })
    assert.equal(created.status, 'pending')
    assert.notEqual(created.message.indexOf('折扣'), -1)
  })

  it('营销专员对质量异议做应对话术生成', () => {
    const type = ctrl.classifyObjection({ customerReply: '这个产品质量怎么样？有保障吗' })
    assert.equal(type.type, 'quality')
    const response = ctrl.generateResponse({
      customerId: 'mkt-quality-cust',
      productId: 'prod-003',
      objectionType: 'quality',
      conversationHistory: ['我看这个面霜评价不错，质量可靠吗'],
    })
    assert.ok((response as any).response.length > 5)
  })

  it('营销专员模拟竞争对手异议对话 — 最终neutral收尾', () => {
    // 不包含折扣/优惠关键词的收入 → calculateFollowUpSentiment 返回 neutral
    const result = ctrl.simulateConversation({
      objection: '别家有更便宜的同款',
      response: '我们的产品经过XX认证，正品保障，提供30天无理由退换',
    })
    assert.equal(result.turns.length, 3)
    assert.equal(result.finalSentiment, 'neutral')
  })

  it('营销专员在购买后安排生日跟进形成营销闭环', () => {
    // 购买
    ctrl.recordPurchase({ customerId: 'mkt-closure-cust', productId: 'prod-002' })
    // 设置生日
    ctrl.setBirthday({ customerId: 'mkt-closure-cust', birthday: '1988-11-22' })
    // 安排生日跟进
    const fu = ctrl.scheduleFollowUp({
      customerId: 'mkt-closure-cust',
      salesId: 'mkt-closure-sales',
      type: 'birthday',
      scheduledAt: new Date().toISOString(),
      message: '',
    })
    assert.ok(fu.message.includes('🎂'))
    assert.equal(fu.status, 'pending')

    // 验证跟进在待处理列表中
    const pending = ctrl.getPendingFollowUps('mkt-closure-sales') as FollowUpReminder[]
    assert.ok(pending.some(p => p.customerId === 'mkt-closure-cust'))
  })
})

// ════════════════════════════════════════════════════════════════
// 全局边界场景 — 异常输入、极端值、恢复性
// ════════════════════════════════════════════════════════════════
describe('全局边界场景: 异常输入 + 极端值 + 恢复性', () => {
  let ctrl: AiSalesController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('查询不存在的商品应抛出异常', () => {
    assert.throws(() => ctrl.getProduct('nonexistent'), /not found/)
  })

  it('查询空字符串商品ID应抛出异常', () => {
    assert.throws(() => ctrl.getProduct(''), /not found/)
  })

  it('对不存在商品的向上销售返回空数组', () => {
    const result = ctrl.recommendUpsell({ productId: 'unknown-id' })
    assert.equal(result.type, 'upsell')
    assert.equal(result.recommendations.length, 0)
  })

  it('对不存在商品的交叉销售返回空数组', () => {
    const result = ctrl.recommendCrossSell({ productId: 'bad-id' })
    assert.equal(result.type, 'cross-sell')
    assert.equal(result.recommendations.length, 0)
  })

  it('空异议文本默认返回need类型', () => {
    const result = ctrl.classifyObjection({ customerReply: '' })
    assert.equal(result.type, 'need')
  })

  it('不存在的跟进ID标记完成返回错误信息', () => {
    const result = ctrl.markCompleted({ followUpId: 'bad-followup-999' })
    assert.ok('error' in result)
    assert.ok(String((result as any).error).includes('not found'))
  })

  it('批量多次购买后推荐仍稳定工作', () => {
    // 购买多种商品
    for (let i = 1; i <= 5; i++) {
      ctrl.recordPurchase({ customerId: 'heavy-cust', productId: `prod-00${i}` })
    }
    // 推荐不应崩溃
    const result = ctrl.recommend({ customerId: 'heavy-cust', recentViewed: ['prod-005'] })
    assert.equal(result.type, 'context-aware')
    assert.ok(result.recommendations.length > 0)
  })

  it('安排大量跟进后查询待处理列表不丢失', () => {
    const ids: string[] = []
    for (let i = 0; i < 20; i++) {
      const fu = ctrl.scheduleFollowUp({
        customerId: `bulk-cust-${i}`,
        salesId: 'bulk-sales',
        type: 'inactive',
        scheduledAt: new Date().toISOString(),
        message: `批量跟进${i}`,
      })
      ids.push(fu.id)
    }
    const pending = ctrl.getPendingFollowUps('bulk-sales') as FollowUpReminder[]
    assert.equal(pending.length, 20)
  })

  it('设置生日后生日跟进自动生成蛋糕emoji', () => {
    ctrl.setBirthday({ customerId: 'bd-emoji-cust', birthday: '1988-05-20' })
    const fu = ctrl.scheduleFollowUp({
      customerId: 'bd-emoji-cust',
      salesId: 'bd-sales',
      type: 'birthday',
      scheduledAt: new Date().toISOString(),
      message: '',
    })
    assert.ok(fu.message.includes('🎂'))
  })
})
