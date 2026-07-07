import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [campaign] [C] 8角色深度测试补全
 *
 * 从 8 角色视角深度测试 campaign 模块:
 *   👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色 2-3 个测试用例（正常流程 + 权限边界 + 数据边界）
 * 补充 role.test.ts 未覆盖的场景:
 *   - 多条件组合触发逻辑
 *   - 定时活动窗口边界
 *   - 跨角色活动匹配隔离
 *   - 空活动/无活动边界
 *   - 活动优先级多活动匹配
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { CampaignController } from './campaign.controller'
import { CampaignService } from './campaign.service'
import {
  CampaignStatus,
  CampaignTrigger,
  CampaignActionKind,
  CampaignActionStatus,
  CampaignConditionType
} from './campaign.entity'
import type { RequestTenantContext } from '../tenant/tenant.types'

// ── 8 角色定义 ──
const ROLES = {
  StoreManager: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Safety: '🔧安监',
  Guide: '🎮导玩员',
  Ops: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销'
}

// ── 辅助工厂 ──
function makeTenantContext(tenantId = 't-campaign-ext', brandId = 'b-campaign-ext', storeId?: string): RequestTenantContext {
  return { tenantId, brandId, storeId }
}

function makeController() {
  const service = new CampaignService()
  const controller = new CampaignController(service)
  return { controller, service }
}

const basicActions = [
  { kind: CampaignActionKind.RecommendTag, params: { tagCode: 'VIP_FAN' } }
]

const awardPointsAction = [
  { kind: CampaignActionKind.AwardPoints, params: { pointsAmount: 100, pointsReason: 'test' } }
]

// ───────────────── 👔店长 ─────────────────

describe(`${ROLES.StoreManager} - Campaign 深度测试`, () => {
  it('店长创建定时活动，未到开始窗口时不触发（时间窗口边界）', () => {
    const { controller, service } = makeController()
    const ctx = makeTenantContext()
    service.resetCampaignStoresForTests()

    const futureStart = new Date(Date.now() + 86400000).toISOString() // 明天
    const plan = controller.registerCampaign(ctx, {
      code: 'FUTURE_EVENT',
      title: '未来活动',
      triggerEvent: CampaignTrigger.PaymentSuccess,
      conditions: [],
      actions: basicActions,
      scheduledStart: futureStart
    })

    // 激活
    controller.updateCampaignStatus(ctx, plan.planId, { status: CampaignStatus.Scheduled })
    controller.updateCampaignStatus(ctx, plan.planId, { status: CampaignStatus.Active })

    // 应该不触发（还没到时间）
    const result = controller.evaluateTriggers(ctx, {
      eventName: CampaignTrigger.PaymentSuccess,
      memberId: 'm-future',
      orderAmount: 500
    })

    assert.equal(result.matchedCampaigns, 0)
    assert.equal(result.dispatchedActions, 0)
  })

  it('店长创建定时活动，在窗口内正常触发', () => {
    const { controller, service } = makeController()
    const ctx = makeTenantContext()
    service.resetCampaignStoresForTests()

    const pastStart = new Date(Date.now() - 86400000).toISOString() // 昨天
    const futureEnd = new Date(Date.now() + 86400000).toISOString() // 明天
    const plan = controller.registerCampaign(ctx, {
      code: 'ACTIVE_WINDOW',
      title: '活动窗口测试',
      triggerEvent: CampaignTrigger.OrderCreated,
      conditions: [],
      actions: basicActions,
      scheduledStart: pastStart,
      scheduledEnd: futureEnd
    })

    controller.updateCampaignStatus(ctx, plan.planId, { status: CampaignStatus.Active })

    const result = controller.evaluateTriggers(ctx, {
      eventName: CampaignTrigger.OrderCreated,
      memberId: 'm-window-ok',
      orderAmount: 100
    })

    assert.equal(result.matchedCampaigns, 1)
    assert.equal(result.dispatchedActions, 1)
  })

  it('店长创建活动后触发已过期定时活动（期满边界）', () => {
    const { controller, service } = makeController()
    const ctx = makeTenantContext()
    service.resetCampaignStoresForTests()

    const pastEnd = new Date(Date.now() - 86400000).toISOString() // 昨天就结束了
    const plan = controller.registerCampaign(ctx, {
      code: 'EXPIRED',
      title: '已过期活动',
      triggerEvent: CampaignTrigger.PaymentSuccess,
      conditions: [],
      actions: basicActions,
      scheduledStart: new Date(Date.now() - 7 * 86400000).toISOString(),
      scheduledEnd: pastEnd
    })

    controller.updateCampaignStatus(ctx, plan.planId, { status: CampaignStatus.Active })

    const result = controller.evaluateTriggers(ctx, {
      eventName: CampaignTrigger.PaymentSuccess,
      memberId: 'm-expired',
      orderAmount: 500
    })

    assert.equal(result.matchedCampaigns, 0)
  })
})

// ───────────────── 🛒前台 ─────────────────

describe(`${ROLES.FrontDesk} - Campaign 深度测试`, () => {
  it('前台批量查询活跃活动（快速获取最近活动）', () => {
    const { controller, service } = makeController()
    const ctx = makeTenantContext()
    service.resetCampaignStoresForTests()

    // 创建2个活动
    const plan1 = controller.registerCampaign(ctx, {
      code: 'FD_ACTIVE_1',
      title: '前台活动1',
      triggerEvent: CampaignTrigger.PaymentSuccess,
      conditions: [],
      actions: basicActions,
      priority: 1
    })
    const plan2 = controller.registerCampaign(ctx, {
      code: 'FD_ACTIVE_2', 
      title: '前台活动2',
      triggerEvent: CampaignTrigger.PaymentSuccess,
      conditions: [],
      actions: basicActions,
      priority: 2
    })

    controller.updateCampaignStatus(ctx, plan1.planId, { status: CampaignStatus.Active })
    controller.updateCampaignStatus(ctx, plan2.planId, { status: CampaignStatus.Active })

    // 前台查看活跃活动，按优先级排序
    const campaigns = controller.listCampaigns(ctx, CampaignStatus.Active)
    assert.ok(campaigns.length >= 2)
    // 低 priority 值排在前面
    assert.equal(campaigns[0].priority, 1)
    assert.equal(campaigns[1].priority, 2)
  })

  it('前台查询前门店专属活动（按门店筛选）', () => {
    const { controller, service } = makeController()
    const ctx = makeTenantContext('t-campaign-ext', 'b-campaign-ext', 'store-front-001')
    service.resetCampaignStoresForTests()

    controller.registerCampaign(ctx, {
      code: 'STORE_ONLY',
      title: '门店专属活动',
      triggerEvent: CampaignTrigger.PaymentSuccess,
      conditions: [
        { type: CampaignConditionType.StoreScope, value: 'store-front-001' }
      ],
      actions: basicActions,
      priority: 1
    })

    // 激活
    const campaigns = controller.listCampaigns(ctx)
    const planId = campaigns.find((c: any) => c.code === 'STORE_ONLY')!.planId
    controller.updateCampaignStatus(ctx, planId, { status: CampaignStatus.Active })

    // 前台支付触发 - 在 body 中传 storeId
    const result = controller.evaluateTriggers(ctx, {
      eventName: CampaignTrigger.PaymentSuccess,
      memberId: 'm-front',
      orderAmount: 200,
      storeId: 'store-front-001'
    })

    assert.equal(result.matchedCampaigns, 1)
    assert.equal(result.dispatchedActions, 1)
  })
})

// ───────────────── 👥HR ─────────────────

describe(`${ROLES.HR} - Campaign 深度测试`, () => {
  it('HR 创建员工积分活动包含多条动作', () => {
    const { controller, service } = makeController()
    const ctx = makeTenantContext()
    service.resetCampaignStoresForTests()

    const plan = controller.registerCampaign(ctx, {
      code: 'HR_MULTI_ACTION',
      title: 'HR多动作活动',
      triggerEvent: CampaignTrigger.MemberProfileSynced,
      conditions: [
        { type: CampaignConditionType.MemberLevel, value: ['STAFF'] }
      ],
      actions: [
        { kind: CampaignActionKind.AwardPoints, params: { pointsAmount: 200, pointsReason: 'hr_bonus' } },
        { kind: CampaignActionKind.RecommendTag, params: { tagCode: 'STAFF_STAR' } }
      ],
      priority: 1
    })

    controller.updateCampaignStatus(ctx, plan.planId, { status: CampaignStatus.Active })

    const result = controller.evaluateTriggers(ctx, {
      eventName: CampaignTrigger.MemberProfileSynced,
      memberId: 'm-hr-staff',
      memberLevel: 'STAFF'
    })

    // 2个动作，但 AwardPoints 因无 memberService 会 Skipped
    assert.equal(result.matchedCampaigns, 1)
    assert.ok(result.dispatches.length >= 1)
  })

  it('HR 查看员工定向活动清单（按触发事件过滤）', () => {
    const { controller, service } = makeController()
    const ctx = makeTenantContext()
    service.resetCampaignStoresForTests()

    controller.registerCampaign(ctx, {
      code: 'HR_PROFILE_EVENT',
      title: '员工入档活动',
      triggerEvent: CampaignTrigger.MemberProfileSynced,
      conditions: [],
      actions: basicActions,
      priority: 5
    })

    controller.registerCampaign(ctx, {
      code: 'HR_ORDER_EVENT',
      title: '员工下单活动',
      triggerEvent: CampaignTrigger.OrderCreated,
      conditions: [],
      actions: basicActions,
      priority: 10
    })

    // 按事件过滤
    const profileCampaigns = controller.listCampaigns(ctx, undefined, CampaignTrigger.MemberProfileSynced)
    assert.equal(profileCampaigns.length, 1)
    assert.equal(profileCampaigns[0].code, 'HR_PROFILE_EVENT')
  })
})

// ───────────────── 🔧安监 ─────────────────

describe(`${ROLES.Safety} - Campaign 深度测试`, () => {
  it('安监查看活动触发失败记录（审计异常数据）', () => {
    const { controller, service } = makeController()
    const ctx = makeTenantContext()
    service.resetCampaignStoresForTests()

    // 创建带积分活动的 campaign（但 memberService 未注入，会触发 Skipped）
    const plan = controller.registerCampaign(ctx, {
      code: 'SAFETY_AWARD_FAIL',
      title: '安全审计-积分失败',
      triggerEvent: CampaignTrigger.PaymentSuccess,
      conditions: [],
      actions: awardPointsAction,
      priority: 1
    })

    controller.updateCampaignStatus(ctx, plan.planId, { status: CampaignStatus.Active })
    controller.evaluateTriggers(ctx, {
      eventName: CampaignTrigger.PaymentSuccess,
      memberId: 'm-safety-01'
    })

    // 安监查看分发记录
    const dispatches = controller.listPlanDispatches(ctx, plan.planId)
    assert.ok(dispatches.length >= 1)
    // 无 memberService，行动会 Skipped
    const skipped = dispatches.filter((d: any) => d.status === CampaignActionStatus.Skipped)
    assert.ok(skipped.length >= 1)
  })

  it('安监查看全部活动分发记录（全量审计）', () => {
    const { controller, service } = makeController()
    const ctx = makeTenantContext()
    service.resetCampaignStoresForTests()

    const plan1 = controller.registerCampaign(ctx, {
      code: 'AUDIT_PLAN_1',
      title: '审计活动1',
      triggerEvent: CampaignTrigger.OrderCreated,
      conditions: [],
      actions: basicActions,
      priority: 1
    })
    controller.updateCampaignStatus(ctx, plan1.planId, { status: CampaignStatus.Active })
    controller.evaluateTriggers(ctx, { eventName: CampaignTrigger.OrderCreated, memberId: 'm-audit-1', orderAmount: 100 })
    controller.evaluateTriggers(ctx, { eventName: CampaignTrigger.OrderCreated, memberId: 'm-audit-2', orderAmount: 200 })

    // 全量查看
    const allDispatches = controller.listDispatches(ctx)
    assert.ok(allDispatches.length >= 2)

    // 按成员过滤
    const memberDispatches = controller.listDispatches(ctx, 'm-audit-1')
    assert.equal(memberDispatches.length, 1)
  })
})

// ───────────────── 🎮导玩员 ─────────────────

describe(`${ROLES.Guide} - Campaign 深度测试`, () => {
  it('导玩员触发StoreScope条件匹配活动（限定门店场景）', () => {
    const { controller, service } = makeController()
    const ctx = makeTenantContext('t-campaign-ext', 'b-campaign-ext', 'store-guide-01')
    service.resetCampaignStoresForTests()

    const plan = controller.registerCampaign(ctx, {
      code: 'GUIDE_STORE',
      title: '导玩门店活动',
      triggerEvent: CampaignTrigger.PaymentSuccess,
      conditions: [
        { type: CampaignConditionType.StoreScope, value: 'store-guide-01' },
        { type: CampaignConditionType.MinOrderAmount, value: 100 }
      ],
      actions: basicActions,
      priority: 1
    })

    controller.updateCampaignStatus(ctx, plan.planId, { status: CampaignStatus.Active })

    // 导玩员门店触发 - 满足条件
    const pass = controller.evaluateTriggers(ctx, {
      eventName: CampaignTrigger.PaymentSuccess,
      memberId: 'm-guide-ok',
      orderAmount: 200,
      storeId: 'store-guide-01'
    })
    assert.equal(pass.matchedCampaigns, 1)

    // 其他门店不满足（用不同的 tenant context）
    const ctxOther = makeTenantContext('t-campaign-ext', 'b-campaign-ext', 'store-guide-other')
    const fail = controller.evaluateTriggers(ctxOther, {
      eventName: CampaignTrigger.PaymentSuccess,
      memberId: 'm-guide-fail',
      orderAmount: 200,
      storeId: 'store-guide-other'
    })
    assert.equal(fail.matchedCampaigns, 0)
  })
})

// ───────────────── 🎯运行专员 ─────────────────

describe(`${ROLES.Ops} - Campaign 深度测试`, () => {
  it('运行专员查看活动优先级排序', () => {
    const { controller, service } = makeController()
    const ctx = makeTenantContext()
    service.resetCampaignStoresForTests()

    const hp = controller.registerCampaign(ctx, {
      code: 'HIGH_PRIORITY',
      title: '高优先级',
      triggerEvent: CampaignTrigger.PaymentSuccess,
      conditions: [
        { type: CampaignConditionType.MinOrderAmount, value: 50 }
      ],
      actions: basicActions,
      priority: 1
    })

    const lp = controller.registerCampaign(ctx, {
      code: 'LOW_PRIORITY',
      title: '低优先级',
      triggerEvent: CampaignTrigger.PaymentSuccess,
      conditions: [
        { type: CampaignConditionType.MinOrderAmount, value: 50 }
      ],
      actions: basicActions,
      priority: 99
    })

    controller.updateCampaignStatus(ctx, hp.planId, { status: CampaignStatus.Active })
    controller.updateCampaignStatus(ctx, lp.planId, { status: CampaignStatus.Active })

    // 触发事件 - 应该匹配所有符合条件的活动，按优先级排序
    const result = controller.evaluateTriggers(ctx, {
      eventName: CampaignTrigger.PaymentSuccess,
      memberId: 'm-ops-priority',
      orderAmount: 100
    })

    // 两个活动都匹配
    assert.equal(result.matchedCampaigns, 2)
    // 两个活动都分发 action
    assert.equal(result.dispatchedActions, 2)
  })

  it('运行专员处理活动完成后的最终状态', () => {
    const { controller, service } = makeController()
    const ctx = makeTenantContext()
    service.resetCampaignStoresForTests()

    const plan = controller.registerCampaign(ctx, {
      code: 'OPS_COMPLETE',
      title: '运行完成活动',
      triggerEvent: CampaignTrigger.PaymentSuccess,
      conditions: [],
      actions: basicActions,
      priority: 10
    })

    // Draft → Scheduled → Active → Completed 完整流程
    controller.updateCampaignStatus(ctx, plan.planId, { status: CampaignStatus.Scheduled })
    controller.updateCampaignStatus(ctx, plan.planId, { status: CampaignStatus.Active })
    controller.updateCampaignStatus(ctx, plan.planId, { status: CampaignStatus.Completed })

    const detail = controller.getCampaign(ctx, plan.planId)
    assert.ok(detail)
    assert.equal(detail!.status, CampaignStatus.Completed)

    // Completed 后触发不应匹配
    const result = controller.evaluateTriggers(ctx, {
      eventName: CampaignTrigger.PaymentSuccess,
      memberId: 'm-ops-complete',
      orderAmount: 500
    })
    assert.equal(result.matchedCampaigns, 0)
  })
})

// ───────────────── 🤝团建 ─────────────────

describe(`${ROLES.Teambuilding} - Campaign 深度测试`, () => {
  it('团建创建混合动作活动（积分+标签+盲盒组合）', () => {
    const { controller, service } = makeController()
    const ctx = makeTenantContext()
    service.resetCampaignStoresForTests()

    const plan = controller.registerCampaign(ctx, {
      code: 'TEAM_MIXED',
      title: '团建混合活动',
      triggerEvent: CampaignTrigger.OrderCreated,
      conditions: [
        { type: CampaignConditionType.MinOrderAmount, value: 3000 },
        { type: CampaignConditionType.BrandScope, value: 'b-campaign-ext' }
      ],
      actions: [
        { kind: CampaignActionKind.AwardPoints, params: { pointsAmount: 500, pointsReason: 'team_bonus' } },
        { kind: CampaignActionKind.RecommendTag, params: { tagCode: 'TEAM_STAR' } },
        { kind: CampaignActionKind.IssueBlindbox, params: { blindboxPlanId: 'bb-team-mixed' } }
      ],
      priority: 2
    })

    assert.equal(plan.actions.length, 3)
    assert.equal(plan.conditions.length, 2)
    assert.equal(plan.status, CampaignStatus.Draft)

    // 验证 BrandScope 条件
    assert.equal(plan.conditions[1].type, CampaignConditionType.BrandScope)
    assert.equal(plan.conditions[1].value, 'b-campaign-ext')
  })

  it('团建活动按品牌域匹配', () => {
    const { controller, service } = makeController()
    const ctx = makeTenantContext('t-campaign-ext', 'brand-team-01')
    service.resetCampaignStoresForTests()

    const plan = controller.registerCampaign(ctx, {
      code: 'TEAM_BRAND',
      title: '团建品牌活动',
      triggerEvent: CampaignTrigger.PaymentSuccess,
      conditions: [
        { type: CampaignConditionType.BrandScope, value: 'brand-team-01' }
      ],
      actions: basicActions,
      priority: 5
    })

    controller.updateCampaignStatus(ctx, plan.planId, { status: CampaignStatus.Active })

    // 同品牌触发成功
    const pass = controller.evaluateTriggers(ctx, {
      eventName: CampaignTrigger.PaymentSuccess,
      memberId: 'm-team-brand',
      orderAmount: 100,
      brandId: 'brand-team-01'
    })
    assert.equal(pass.matchedCampaigns, 1)
  })
})

// ───────────────── 📢营销 ─────────────────

describe(`${ROLES.Marketing} - Campaign 深度测试`, () => {
  it('营销创建活动后调用 evaluate 端点查看完整结果', () => {
    const { controller, service } = makeController()
    const ctx = makeTenantContext()
    service.resetCampaignStoresForTests()

    controller.registerCampaign(ctx, {
      code: 'MKT_DEEP_VIEW',
      title: '营销深度查看活动',
      triggerEvent: CampaignTrigger.PaymentSuccess,
      conditions: [
        { type: CampaignConditionType.MinOrderAmount, value: 100 }
      ],
      actions: basicActions,
      priority: 10
    })

    // 激活
    const campaigns = controller.listCampaigns(ctx)
    const planId = campaigns.find((c: any) => c.code === 'MKT_DEEP_VIEW')!.planId
    controller.updateCampaignStatus(ctx, planId, { status: CampaignStatus.Active })

    // 触发多个会员
    const r1 = controller.evaluateTriggers(ctx, {
      eventName: CampaignTrigger.PaymentSuccess,
      memberId: 'm-mkt-1',
      orderAmount: 200
    })
    assert.equal(r1.dispatchedActions, 1)

    const r2 = controller.evaluateTriggers(ctx, {
      eventName: CampaignTrigger.PaymentSuccess,
      memberId: 'm-mkt-2',
      orderAmount: 50 // 不满足 MinOrderAmount
    })
    assert.equal(r2.matchedCampaigns, 0)

    // 营销查看分发记录
    const dispatches = controller.listPlanDispatches(ctx, planId)
    assert.ok(dispatches.length >= 1)
    // 只有满足条件的会员有记录
    assert.equal(dispatches[0].memberId, 'm-mkt-1')
  })

  it('营销创建多个触发事件活动进行ROI对比', () => {
    const { controller, service } = makeController()
    const ctx = makeTenantContext()
    service.resetCampaignStoresForTests()

    // 支付成功活动
    controller.registerCampaign(ctx, {
      code: 'PAYMENT_CAMPAIGN',
      title: '支付活动',
      triggerEvent: CampaignTrigger.PaymentSuccess,
      conditions: [],
      actions: basicActions,
      priority: 5
    })

    // 下单活动
    controller.registerCampaign(ctx, {
      code: 'ORDER_CAMPAIGN',
      title: '下单活动',
      triggerEvent: CampaignTrigger.OrderCreated,
      conditions: [],
      actions: basicActions,
      priority: 5
    })

    // 激活所有
    const campaigns = controller.listCampaigns(ctx)
    for (const c of campaigns) {
      controller.updateCampaignStatus(ctx, (c as any).planId, { status: CampaignStatus.Active })
    }

    // 支付事件触发
    const paymentResult = controller.evaluateTriggers(ctx, {
      eventName: CampaignTrigger.PaymentSuccess,
      memberId: 'm-roi-1'
    })
    assert.equal(paymentResult.matchedCampaigns, 1)

    // 下单事件触发
    const orderResult = controller.evaluateTriggers(ctx, {
      eventName: CampaignTrigger.OrderCreated,
      memberId: 'm-roi-2'
    })
    assert.equal(orderResult.matchedCampaigns, 1)

    // 按触发事件过滤查看活动
    const paymentCampaigns = controller.listCampaigns(ctx, undefined, CampaignTrigger.PaymentSuccess)
    assert.equal(paymentCampaigns.length, 1)
  })
})

// ───────────────── 跨角色 · 边界测试 ─────────────────

describe('Campaign 深度边界测试', () => {
  it('无任何活动时触发事件返回空结果', () => {
    const { controller, service } = makeController()
    const ctx = makeTenantContext()
    service.resetCampaignStoresForTests()

    const result = controller.evaluateTriggers(ctx, {
      eventName: CampaignTrigger.PaymentSuccess,
      memberId: 'm-none',
      orderAmount: 500
    })

    assert.equal(result.matchedCampaigns, 0)
    assert.equal(result.dispatches.length, 0)
    assert.equal(result.dispatchedActions, 0)
  })

  it('活动创建后不激活不触发', () => {
    const { controller, service } = makeController()
    const ctx = makeTenantContext()
    service.resetCampaignStoresForTests()

    controller.registerCampaign(ctx, {
      code: 'DRAFT_ONLY_EXT',
      title: '仅草稿深度',
      triggerEvent: CampaignTrigger.PaymentSuccess,
      conditions: [],
      actions: basicActions,
      priority: 10
    })

    // 只创建，不激活
    const result = controller.evaluateTriggers(ctx, {
      eventName: CampaignTrigger.PaymentSuccess,
      memberId: 'm-draft-only'
    })

    assert.equal(result.matchedCampaigns, 0)
  })

  it('创建活动并获取单个活动返回正确数据', () => {
    const { controller, service } = makeController()
    const ctx = makeTenantContext()
    service.resetCampaignStoresForTests()

    const plan = controller.registerCampaign(ctx, {
      code: 'SINGLE_GET',
      title: '单个获取测试',
      triggerEvent: CampaignTrigger.PaymentSuccess,
      conditions: [
        { type: CampaignConditionType.MemberLevel, value: 'VIP' }
      ],
      actions: basicActions,
      priority: 1
    })

    const detail = controller.getCampaign(ctx, plan.planId)
    assert.ok(detail)
    assert.equal(detail.code, 'SINGLE_GET')
    assert.equal(detail.conditions[0].type, CampaignConditionType.MemberLevel)
    assert.equal(detail.conditions[0].value, 'VIP')
  })

  it('获取不存在的活动返回 null', () => {
    const { controller } = makeController()
    const ctx = makeTenantContext()

    const detail = controller.getCampaign(ctx, 'non-existent-plan-id')
    assert.equal(detail, null)
  })
})
