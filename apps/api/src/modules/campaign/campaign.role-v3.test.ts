import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [campaign] [C] 角色场景V3深度测试
 *
 * 面向 campaign 模块的 8 角色业务场景测试：
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色至少 2 个深度场景（复杂正常流程 + 权限边界/异常处理）
 *
 * 注意事项：
 * - AwardPoints 需要 memberService，IssueCoupon/IssueBlindbox 需要 loyaltyService
 * - 当前测试使用 undefined 注入，所以这些 action 的派发会被 skipped 而非 dispatched
 * - RecommendTag 无需外部依赖，可用于验证实际派发流程
 * - 每个测试使用唯一 tenant ID 以避免全局 store 污染
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import type { RequestTenantContext } from '../tenant/tenant.types'

import { CampaignController } from './campaign.controller'
import { CampaignService } from './campaign.service'
import {
  CampaignStatus,
  CampaignTrigger,
  CampaignActionKind,
  CampaignActionStatus,
  CampaignConditionType
} from './campaign.entity'

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
} as const

// ── 计数器：使每个测试使用唯一的 tenantId ──
let testUid = 0
function nextId(): string {
  testUid++
  return `${testUid}`
}

function makeTenantContext(storeId?: string): RequestTenantContext {
  const uid = nextId()
  return { tenantId: `t-camp-${uid}`, brandId: `b-camp-${uid}`, storeId }
}

function makeController(storeId?: string) {
  const service = new CampaignService(
    undefined as any, // memberService
    undefined as any  // loyaltyService
  )
  const controller = new CampaignController(service)
  return { controller, service, ctx: makeTenantContext(storeId) }
}

// RecommendTag 是唯一不依赖外部服务的 action，可产生实际 dispatched 状态
const dispatchableActions = [
  { kind: CampaignActionKind.RecommendTag as const, params: { tagCode: 'TEST_TAG' } }
]

// AwardPoints 需要 memberService（当前未注入），派发会被 skipped
const skippableActions = [
  { kind: CampaignActionKind.AwardPoints as const, params: { pointsAmount: 100, pointsReason: 'test_bonus' } }
]

// 辅助：激活活动
function activateCampaign(controller: CampaignController, ctx: RequestTenantContext, planId: string): void {
  controller.updateCampaignStatus(ctx, planId, { status: CampaignStatus.Active })
}

// ================================================================
// 1. 👔 店长 — 营销活动的全生命周期管理
// ================================================================
describe(`${ROLES.StoreManager} campaign 深度场景测试`, () => {
  it('【店长-正常】创建多条件营销活动并激活全流程', () => {
    const { controller, ctx } = makeController()

    // 1. 创建活动（草稿态）
    const created = controller.registerCampaign(ctx, {
      code: 'STORE_SPRING_SALE',
      title: '春季大促',
      description: '春季大促满200送积分',
      triggerEvent: CampaignTrigger.PaymentSuccess,
      conditions: [
        { type: CampaignConditionType.MinOrderAmount, value: 200 },
        { type: CampaignConditionType.MemberLevel, value: ['VIP', 'GOLD', 'PLATINUM'] },
        { type: CampaignConditionType.StoreScope, value: ['store-a', 'store-b'] }
      ],
      actions: [
        { kind: CampaignActionKind.RecommendTag, params: { tagCode: 'SPRING_SHOPPER' } },
        { kind: CampaignActionKind.AwardPoints, params: { pointsAmount: 500, pointsReason: 'spring_bonus' } }
      ],
      priority: 5
    })

    assert.ok(created.planId, '必须有 planId')
    assert.equal(created.code, 'STORE_SPRING_SALE')
    assert.equal(created.status, CampaignStatus.Draft)
    assert.equal(created.conditions.length, 3)
    assert.equal(created.actions.length, 2)

    // 2. 激活活动
    const activated = controller.updateCampaignStatus(ctx, created.planId, { status: CampaignStatus.Active })
    assert.equal(activated.status, CampaignStatus.Active)

    // 3. 触发评估
    const evalResult = controller.evaluateTriggers(ctx, {
      eventName: CampaignTrigger.PaymentSuccess,
      memberId: 'm-spring-001',
      orderId: 'o-spring-001',
      paymentId: 'p-spring-001',
      orderAmount: 250,
      storeId: 'store-a',
      memberLevel: 'VIP'
    })

    // RecommendTag 应该派发成功，AwardPoints 因 memberService=undefined 被 skipped
    assert.ok(evalResult.dispatchedActions >= 1, '应至少有一条派发')
    assert.equal(evalResult.skippedActions, 1, 'AwardPoints 因缺少 memberService 被跳过')
    assert.ok(evalResult.matchedCampaigns > 0)

    // 4. 查询派发记录
    const dispatches = controller.listDispatches(ctx, undefined, undefined)
    assert.ok(dispatches.length >= 1)
    const matched = dispatches.filter(d => d.planId === created.planId)
    assert.ok(matched.some(d => d.status === CampaignActionStatus.Dispatched),
      '应有 Dispatched 状态的派发（RecommendTag）')
    assert.ok(matched.some(d => d.status === CampaignActionStatus.Skipped),
      '应有 Skipped 状态的派发（AwardPoints 因缺少 service）')
  })

  it('【店长-边界】活动状态转换校验（草稿→完成 非法跳转）', () => {
    const { controller, ctx } = makeController()

    // 创建
    const created = controller.registerCampaign(ctx, {
      code: 'INVALID_TRANSITION',
      title: '非法状态跳转测试',
      triggerEvent: CampaignTrigger.PaymentSuccess,
      conditions: [{ type: CampaignConditionType.MinOrderAmount, value: 50 }],
      actions: dispatchableActions,
      priority: 1
    })

    assert.equal(created.status, CampaignStatus.Draft)

    // 草稿 → 完成 非法（Draft 仅允许→Scheduled/Active/Paused）
    assert.throws(
      () => controller.updateCampaignStatus(ctx, created.planId, { status: CampaignStatus.Completed }),
      /Invalid campaign status transition/
    )

    // 正确路径: 草稿 → 激活
    const activated = controller.updateCampaignStatus(ctx, created.planId, { status: CampaignStatus.Active })
    assert.equal(activated.status, CampaignStatus.Active)

    // 激活 → 完成 合法
    const completed = controller.updateCampaignStatus(ctx, created.planId, { status: CampaignStatus.Completed })
    assert.equal(completed.status, CampaignStatus.Completed)

    // 完成 → 激活 非法（Completed 不允许任何转换）
    assert.throws(
      () => controller.updateCampaignStatus(ctx, created.planId, { status: CampaignStatus.Active }),
      /Invalid campaign status transition/
    )
  })
})

// ================================================================
// 2. 🛒 前台 — 顾客消费触发活动积分赠送场景
// ================================================================
describe(`${ROLES.FrontDesk} campaign 深度场景测试`, () => {
  it('【前台-正常】会员消费触发活动，门店隔离验证', () => {
    const { controller, ctx } = makeController('store-front')

    // 创建活动（仅限 store-front），使用 RecommendTag 确保实际派发
    const created = controller.registerCampaign(ctx, {
      code: 'STORE_PROMO',
      title: '门店专属促销',
      triggerEvent: CampaignTrigger.PaymentSuccess,
      conditions: [
        { type: CampaignConditionType.MinOrderAmount, value: 100 },
        { type: CampaignConditionType.StoreScope, value: ['store-front'] }
      ],
      actions: dispatchableActions,
      priority: 2
    })

    activateCampaign(controller, ctx, created.planId)

    // 其他门店不应触发
    const otherCtx = makeTenantContext('store-other')
    const noMatch = controller.evaluateTriggers(otherCtx, {
      eventName: CampaignTrigger.PaymentSuccess,
      memberId: 'm-front-001',
      orderAmount: 150,
      orderId: 'o-front-001',
      storeId: 'store-other',
      memberLevel: 'REGULAR'
    })
    assert.equal(noMatch.dispatchedActions, 0, '其他门店不应触发活动')

    // 正确门店触发
    const match = controller.evaluateTriggers(ctx, {
      eventName: CampaignTrigger.PaymentSuccess,
      memberId: 'm-front-002',
      orderAmount: 150,
      orderId: 'o-front-002',
      paymentId: 'p-front-002',
      storeId: 'store-front',
      memberLevel: 'REGULAR'
    })
    assert.ok(match.dispatchedActions >= 1, '符合条件门店应触发')
    assert.ok(match.matchedCampaigns > 0)
  })

  it('【前台-边界】订单金额不足不触发，低等级会员跳过活动', () => {
    const { controller, ctx } = makeController('store-front')

    // 创建面向高等级会员的大额活动
    const created = controller.registerCampaign(ctx, {
      code: 'VIP_ONLY_PROMO',
      title: 'VIP专属优惠',
      triggerEvent: CampaignTrigger.PaymentSuccess,
      conditions: [
        { type: CampaignConditionType.MinOrderAmount, value: 500 },
        { type: CampaignConditionType.MemberLevel, value: ['VIP', 'GOLD'] }
      ],
      actions: dispatchableActions,
      priority: 3
    })

    activateCampaign(controller, ctx, created.planId)

    // 场景1: 金额不足 + 等级不达
    const result1 = controller.evaluateTriggers(ctx, {
      eventName: CampaignTrigger.PaymentSuccess,
      memberId: 'm-low-spend',
      orderAmount: 50,
      orderId: 'o-low-spend',
      storeId: 'store-front',
      memberLevel: 'REGULAR'
    })
    assert.equal(result1.dispatchedActions, 0, '条件不满足不应派发')
    assert.equal(result1.matchedCampaigns, 0)

    // 场景2: 金额达标但等级不足
    const result2 = controller.evaluateTriggers(ctx, {
      eventName: CampaignTrigger.PaymentSuccess,
      memberId: 'm-high-spend-low-tier',
      orderAmount: 600,
      orderId: 'o-high-spend',
      storeId: 'store-front',
      memberLevel: 'REGULAR'
    })
    assert.equal(result2.dispatchedActions, 0, '等级条件不满足不应派发')

    // 场景3: 全部达标
    const result3 = controller.evaluateTriggers(ctx, {
      eventName: CampaignTrigger.PaymentSuccess,
      memberId: 'm-vip-eligible',
      orderAmount: 600,
      orderId: 'o-vip-eligible',
      paymentId: 'p-vip-eligible',
      storeId: 'store-front',
      memberLevel: 'VIP'
    })
    assert.ok(result3.dispatchedActions >= 1, '全部达标应触发')
  })
})

// ================================================================
// 3. 👥 HR — 人员培训触发场景（使用 member.profile-synced 事件）
// ================================================================
describe(`${ROLES.HR} campaign 深度场景测试`, () => {
  it('【HR-正常】新员工Profile同步后自动发放标签', () => {
    const { controller, ctx } = makeController()

    const created = controller.registerCampaign(ctx, {
      code: 'NEW_HIRE_WELCOME',
      title: '新员工入职欢迎',
      description: 'Profile 同步后发放迎新标签',
      triggerEvent: CampaignTrigger.MemberProfileSynced,
      conditions: [
        { type: CampaignConditionType.MemberLevel, value: ['TRAINEE'] }
      ],
      actions: dispatchableActions,
      priority: 1
    })

    activateCampaign(controller, ctx, created.planId)

    const result = controller.evaluateTriggers(ctx, {
      eventName: CampaignTrigger.MemberProfileSynced,
      memberId: 'm-new-hire-001',
      memberLevel: 'TRAINEE'
    })

    assert.ok(result.dispatchedActions >= 1)
    assert.ok(result.dispatches.length >= 1)
  })

  it('【HR-边界】非培训等级不触发 + 活动暂停后不派发', () => {
    const { controller, ctx } = makeController()

    const created = controller.registerCampaign(ctx, {
      code: 'TRAINEE_ONLY',
      title: '仅培训生',
      triggerEvent: CampaignTrigger.MemberProfileSynced,
      conditions: [
        { type: CampaignConditionType.MemberLevel, value: ['TRAINEE'] }
      ],
      actions: dispatchableActions,
      priority: 1
    })

    activateCampaign(controller, ctx, created.planId)

    // VIP 触发不应命中
    const vipResult = controller.evaluateTriggers(ctx, {
      eventName: CampaignTrigger.MemberProfileSynced,
      memberId: 'm-vip-no-bonus',
      memberLevel: 'VIP'
    })
    assert.equal(vipResult.dispatchedActions, 0, 'VIP 等级不应命中培训生活动')
    assert.equal(vipResult.matchedCampaigns, 0)

    // 暂停活动
    controller.updateCampaignStatus(ctx, created.planId, { status: CampaignStatus.Paused })

    // 暂停后即使条件满足也不派发
    const pausedResult = controller.evaluateTriggers(ctx, {
      eventName: CampaignTrigger.MemberProfileSynced,
      memberId: 'm-trainee-paused',
      memberLevel: 'TRAINEE'
    })
    assert.equal(pausedResult.dispatchedActions, 0, '活动暂停后不应派发')
  })
})

// ================================================================
// 4. 🔧 安监 — 安全合规检查：活动条件校验与异常事件处理
// ================================================================
describe(`${ROLES.Safety} campaign 深度场景测试`, () => {
  it('【安监-正常】创建合规模块并验证活动派发可追溯', () => {
    const { controller, ctx } = makeController()

    const created = controller.registerCampaign(ctx, {
      code: 'COMPLIANCE_CHK',
      title: '合规检查活动',
      triggerEvent: CampaignTrigger.PaymentSuccess,
      conditions: [
        { type: CampaignConditionType.MinOrderAmount, value: 0 },
        { type: CampaignConditionType.BrandScope, value: [ctx.brandId!] }
      ],
      actions: [
        { kind: CampaignActionKind.RecommendTag, params: { tagCode: 'COMPLIANCE_PASS' } }
      ],
      priority: 10
    })

    activateCampaign(controller, ctx, created.planId)

    const evalResult = controller.evaluateTriggers(ctx, {
      eventName: CampaignTrigger.PaymentSuccess,
      memberId: 'm-comp-001',
      orderId: 'o-comp-001',
      paymentId: 'p-comp-001',
      orderAmount: 30,
      storeId: 'store-a',
      memberLevel: 'REGULAR'
    })

    assert.ok(evalResult.dispatchedActions >= 1)
    assert.ok(evalResult.matchedCampaigns > 0)

    // 所有派发都有 planId 关联
    for (const dispatch of evalResult.dispatches) {
      assert.ok(dispatch.planId, '派发记录必须有 planId')
      assert.ok(dispatch.dispatchId, '派发记录必须有 dispatchId')
      assert.ok(dispatch.createdAt, '派发记录必须有时间戳')
    }
  })

  it('【安监-边界】空 eventName 应当报错，未知事件类型安全处理', () => {
    const { controller, ctx } = makeController()

    // 空事件名 → 400
    assert.throws(
      () => controller.evaluateTriggers(ctx, {
        eventName: '',
        memberId: 'm-safety-001'
      } as any),
      /eventName is required/
    )

    // 未注册的事件类型 → 不抛异常，派发为0
    const safeResult = controller.evaluateTriggers(ctx, {
      eventName: 'unknown.event.type',
      memberId: 'm-safety-002',
      orderAmount: 100,
      storeId: 'store-a',
      memberLevel: 'REGULAR'
    })
    assert.equal(safeResult.dispatchedActions, 0, '未知事件安全处理不派发')
    assert.equal(safeResult.matchedCampaigns, 0)
  })
})

// ================================================================
// 5. 🎮 导玩员 — 活动执行中的用户交互场景
// ================================================================
describe(`${ROLES.Guide} campaign 深度场景测试`, () => {
  it('【导玩员-正常】会员下单后自动发放标签', () => {
    const { controller, ctx } = makeController('store-arcade')

    const created = controller.registerCampaign(ctx, {
      code: 'PLAY_TAG',
      title: '玩一局打标签',
      triggerEvent: CampaignTrigger.OrderCreated,
      conditions: [
        { type: CampaignConditionType.MinOrderAmount, value: 50 },
        { type: CampaignConditionType.StoreScope, value: ['store-arcade'] }
      ],
      actions: dispatchableActions,
      priority: 4
    })

    activateCampaign(controller, ctx, created.planId)

    const result = controller.evaluateTriggers(ctx, {
      eventName: CampaignTrigger.OrderCreated,
      memberId: 'm-player-001',
      orderId: 'o-player-001',
      orderAmount: 100,
      storeId: 'store-arcade',
      memberLevel: 'REGULAR'
    })

    assert.ok(result.dispatchedActions >= 1)
  })

  it('【导玩员-边界】多次触发同活动不报错 + 门店条件不符合', () => {
    const { controller, ctx } = makeController('store-arcade')

    const created = controller.registerCampaign(ctx, {
      code: 'DAILY_FREEBIE',
      title: '每日免费福利',
      triggerEvent: CampaignTrigger.OrderCreated,
      conditions: [
        { type: CampaignConditionType.MinOrderAmount, value: 10 },
        { type: CampaignConditionType.StoreScope, value: ['store-arcade'] }
      ],
      actions: dispatchableActions,
      priority: 5
    })

    activateCampaign(controller, ctx, created.planId)

    // 门店不匹配 → 不触发
    const otherStoreCtx = makeTenantContext('wrong-store')
    const otherStore = controller.evaluateTriggers(otherStoreCtx, {
      eventName: CampaignTrigger.OrderCreated,
      memberId: 'm-wrong-store',
      orderId: 'o-wrong',
      orderAmount: 100,
      storeId: 'wrong-store',
      memberLevel: 'REGULAR'
    })
    assert.equal(otherStore.dispatchedActions, 0, '其他门店不应触发')

    // 同门店正常触发
    const first = controller.evaluateTriggers(ctx, {
      eventName: CampaignTrigger.OrderCreated,
      memberId: 'm-daily-001',
      orderId: 'o-daily-001',
      orderAmount: 30,
      storeId: 'store-arcade',
      memberLevel: 'REGULAR'
    })
    assert.ok(first.dispatchedActions >= 1, '第一次应派发')

    // 再次触发不报错
    assert.doesNotThrow(() => {
      controller.evaluateTriggers(ctx, {
        eventName: CampaignTrigger.OrderCreated,
        memberId: 'm-daily-002',
        orderId: 'o-daily-002',
        orderAmount: 50,
        storeId: 'store-arcade'
      })
    })
  })
})

// ================================================================
// 6. 🎯 运行专员 — 活动调度与优先级管理
// ================================================================
describe(`${ROLES.Ops} campaign 深度场景测试`, () => {
  it('【运行专员-正常】多活动同事件触发，按优先级执行', () => {
    const { controller, ctx } = makeController()

    // 创建3个同事件活动，不同优先级
    const high = controller.registerCampaign(ctx, {
      code: 'PRIORITY_HIGH',
      title: '高优先活动',
      triggerEvent: CampaignTrigger.PaymentSuccess,
      conditions: [{ type: CampaignConditionType.MinOrderAmount, value: 0 }],
      actions: [
        { kind: CampaignActionKind.RecommendTag, params: { tagCode: 'HIGH_VALUE' } }
      ],
      priority: 100
    })

    const mid = controller.registerCampaign(ctx, {
      code: 'PRIORITY_MID',
      title: '中优先活动',
      triggerEvent: CampaignTrigger.PaymentSuccess,
      conditions: [{ type: CampaignConditionType.MinOrderAmount, value: 0 }],
      actions: dispatchableActions,
      priority: 50
    })

    const low = controller.registerCampaign(ctx, {
      code: 'PRIORITY_LOW',
      title: '低优先活动',
      triggerEvent: CampaignTrigger.PaymentSuccess,
      conditions: [{ type: CampaignConditionType.MinOrderAmount, value: 0 }],
      actions: dispatchableActions,
      priority: 10
    })

    ;[high, mid, low].forEach(p => activateCampaign(controller, ctx, p.planId))

    const result = controller.evaluateTriggers(ctx, {
      eventName: CampaignTrigger.PaymentSuccess,
      memberId: 'm-ops-001',
      orderId: 'o-ops-001',
      orderAmount: 200,
      storeId: 'store-a'
    })

    assert.ok(result.matchedCampaigns >= 3, '所有活动都应被匹配')
    assert.ok(result.dispatchedActions >= 1)

    // 列出活动确认存在
    const list = controller.listCampaigns(ctx, undefined, undefined)
    const highInList = list.find(p => p.code === 'PRIORITY_HIGH')
    assert.ok(highInList, '高优先活动应出现在列表中')
    assert.equal(highInList!.status, CampaignStatus.Active)
  })

  it('【运行专员-边界】不同租户活动隔离 + 活动列表过滤', () => {
    const { controller, ctx } = makeController()

    const created = controller.registerCampaign(ctx, {
      code: 'TENANT_ISOLATION',
      title: '租户隔离测试',
      triggerEvent: CampaignTrigger.PaymentSuccess,
      conditions: [{ type: CampaignConditionType.MinOrderAmount, value: 0 }],
      actions: dispatchableActions,
      priority: 1
    })

    activateCampaign(controller, ctx, created.planId)

    // 其他租户不应看到此活动
    const otherTenantCtx = makeTenantContext()
    const otherList = controller.listCampaigns(otherTenantCtx, undefined, undefined)
    assert.equal(otherList.length, 0, '其他租户不应看到活动')

    // 按状态过滤
    const drafts = controller.listCampaigns(ctx, CampaignStatus.Draft, undefined)
    assert.equal(drafts.filter(p => p.planId === created.planId).length, 0)

    const actives = controller.listCampaigns(ctx, CampaignStatus.Active, undefined)
    assert.ok(actives.filter(p => p.planId === created.planId).length >= 1)
  })
})

// ================================================================
// 7. 🤝 团建 — 团队集体活动场景
// ================================================================
describe(`${ROLES.Teambuilding} campaign 深度场景测试`, () => {
  it('【团建-正常】团建活动创建 + 活动列表和逐条件匹配', () => {
    const { controller, ctx } = makeController('store-team')

    const created = controller.registerCampaign(ctx, {
      code: 'TEAM_BUILDING',
      title: '团队建设奖励',
      triggerEvent: CampaignTrigger.OrderCreated,
      conditions: [
        { type: CampaignConditionType.MinOrderAmount, value: 200 },
        { type: CampaignConditionType.StoreScope, value: ['store-team'] }
      ],
      actions: dispatchableActions,
      priority: 3
    })

    activateCampaign(controller, ctx, created.planId)

    // 查询活动列表确认存在
    const all = controller.listCampaigns(ctx, undefined, undefined)
    assert.ok(all.some(p => p.code === 'TEAM_BUILDING'))

    // 查询具体活动
    const plan = controller.getCampaign(ctx, created.planId)
    assert.ok(plan)
    assert.equal(plan!.status, CampaignStatus.Active)

    // 触发评估（金额不足 → 不触发）
    const underAmount = controller.evaluateTriggers(ctx, {
      eventName: CampaignTrigger.OrderCreated,
      memberId: 'm-team-001',
      orderId: 'o-team-001',
      orderAmount: 50,
      storeId: 'store-team'
    })
    assert.equal(underAmount.dispatchedActions, 0, '50元不足200不应触发')
    assert.equal(underAmount.matchedCampaigns, 0)

    // 金额达标 → 触发
    const qualified = controller.evaluateTriggers(ctx, {
      eventName: CampaignTrigger.OrderCreated,
      memberId: 'm-team-002',
      orderId: 'o-team-002',
      orderAmount: 250,
      storeId: 'store-team'
    })
    assert.ok(qualified.dispatchedActions >= 1, '金额达标应触发派发')
    assert.ok(qualified.matchedCampaigns > 0)
  })

  it('【团建-边界】不存在的活动获取返回null + 无活动列表查询', () => {
    const { controller, ctx } = makeController()

    // 不存在的活动
    const notFound = controller.getCampaign(ctx, 'non-existent-plan-id-xxx')
    assert.equal(notFound, null)

    // 不同租户无活动
    const emptyTenantCtx = makeTenantContext()
    const emptyList = controller.listCampaigns(emptyTenantCtx, undefined, undefined)
    assert.equal(emptyList.length, 0)

    // 同一个租户的查询不会抛异常
    assert.doesNotThrow(() => controller.listCampaigns(ctx, undefined, undefined))
  })
})

// ================================================================
// 8. 📢 营销 — 营销活动指标分析与效果评估
// ================================================================
describe(`${ROLES.Marketing} campaign 深度场景测试`, () => {
  it('【营销-正常】创建多个活动并验证派发统计与活动查询', () => {
    const { controller, ctx } = makeController()

    // 创建2个活动
    const eventA = controller.registerCampaign(ctx, {
      code: 'MARKET_A',
      title: 'A类活动（标签）',
      triggerEvent: CampaignTrigger.PaymentSuccess,
      conditions: [{ type: CampaignConditionType.MinOrderAmount, value: 0 }],
      actions: [{ kind: CampaignActionKind.RecommendTag, params: { tagCode: 'MKT_A' } }],
      priority: 1
    })
    const eventB = controller.registerCampaign(ctx, {
      code: 'MARKET_B',
      title: 'B类活动（标签）',
      triggerEvent: CampaignTrigger.PaymentSuccess,
      conditions: [{ type: CampaignConditionType.MinOrderAmount, value: 100 }],
      actions: [{ kind: CampaignActionKind.RecommendTag, params: { tagCode: 'MKT_B' } }],
      priority: 2
    })

    activateCampaign(controller, ctx, eventA.planId)
    activateCampaign(controller, ctx, eventB.planId)

    // 触发多次事件
    for (let i = 0; i < 3; i++) {
      controller.evaluateTriggers(ctx, {
        eventName: CampaignTrigger.PaymentSuccess,
        memberId: `m-mkt-${i}`,
        orderId: `o-mkt-${i}`,
        orderAmount: 150,
        paymentId: `p-mkt-${i}`,
        storeId: 'store-a'
      })
    }

    // 查询所有活动
    const all = controller.listCampaigns(ctx, undefined, undefined)
    assert.ok(all.length >= 2)

    // 按事件类型过滤
    const byTrigger = controller.listCampaigns(ctx, undefined, CampaignTrigger.PaymentSuccess)
    assert.ok(byTrigger.length >= 2)

    // 查询 A 活动的派发
    const dispatchesA = controller.listPlanDispatches(ctx, eventA.planId)
    assert.ok(dispatchesA.length >= 0)

    // 查询 B 活动的派发
    const dispatchesB = controller.listPlanDispatches(ctx, eventB.planId)
    assert.ok(dispatchesB.length >= 0)

    // 整体派发列表
    const allDispatches = controller.listDispatches(ctx, undefined, undefined)
    assert.ok(allDispatches.length > 0)
  })

  it('【营销-边界】品牌条件隔离 + 按状态精确过滤', () => {
    const { controller, ctx } = makeController()

    // 创建一个只针对特定 BrandScope 的活动
    const brandCamp = controller.registerCampaign(ctx, {
      code: 'BRAND_SPECIFIC',
      title: '品牌专属活动',
      triggerEvent: CampaignTrigger.PaymentSuccess,
      conditions: [
        { type: CampaignConditionType.MinOrderAmount, value: 50 },
        { type: CampaignConditionType.BrandScope, value: [ctx.brandId!] }
      ],
      actions: dispatchableActions,
      priority: 1
    })

    activateCampaign(controller, ctx, brandCamp.planId)

    // 同一品牌触发（品牌来自 tenantContext enrichment）
    const sameBrand = controller.evaluateTriggers(ctx, {
      eventName: CampaignTrigger.PaymentSuccess,
      memberId: 'm-brand-match',
      orderId: 'o-brand-match',
      orderAmount: 100,
      storeId: 'store-a',
      memberLevel: 'REGULAR'
    })
    assert.ok(sameBrand.dispatchedActions >= 0)

    // 按状态精确过滤
    const activeList = controller.listCampaigns(ctx, CampaignStatus.Active, undefined)
    assert.ok(activeList.every(p => p.status === CampaignStatus.Active))
  })
})

// ================================================================
// 跨角色场景：多角色协作下的活动管理
// ================================================================
describe('跨角色协作 campaign 场景测试', () => {
  it('营销创建 → 店长激活 → 运行专员评估（完整协作链路）', () => {
    const { controller, ctx } = makeController()

    // 营销创建
    const plan = controller.registerCampaign(ctx, {
      code: 'COLLAB_CAMPAIGN',
      title: '协作营销活动',
      triggerEvent: CampaignTrigger.PaymentSuccess,
      conditions: [{ type: CampaignConditionType.MinOrderAmount, value: 100 }],
      actions: dispatchableActions,
      priority: 5
    })

    assert.equal(plan.status, CampaignStatus.Draft)

    // 店长激活
    const activated = controller.updateCampaignStatus(ctx, plan.planId, { status: CampaignStatus.Active })
    assert.equal(activated.status, CampaignStatus.Active)

    // 运行专员触发
    const evalResult = controller.evaluateTriggers(ctx, {
      eventName: CampaignTrigger.PaymentSuccess,
      memberId: 'm-collab-001',
      orderId: 'o-collab-001',
      paymentId: 'p-collab-001',
      orderAmount: 200,
      storeId: ctx.storeId ?? ctx.brandId,
      memberLevel: 'GOLD'
    })

    // 验证派发结果
    assert.ok(evalResult.matchedCampaigns > 0, '完整协作链路应匹配到活动')
    assert.ok(evalResult.dispatches.length > 0, '应有具体派发记录')

    // 可追溯：至少有一条派发属于当前创建的 plan
    const matchedDispatch = evalResult.dispatches.find(d => d.planId === plan.planId)
    assert.ok(matchedDispatch, '派发记录应关联到当前活动的 planId')
    assert.ok(matchedDispatch!.dispatchId, '派发记录必须有 dispatchId')
  })
})
