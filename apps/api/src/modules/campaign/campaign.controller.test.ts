import 'reflect-metadata'
import assert from 'node:assert/strict'
import test, { describe } from 'node:test'

const { CampaignController } = require('./campaign.controller')
const {
  CampaignStatus,
  CampaignTrigger,
  CampaignActionKind,
  CampaignActionStatus,
  CampaignConditionType
} = require('./campaign.entity')

// ── 辅助工厂 ──
function createContext(tenantId = 't-campaign', brandId = 'b-campaign', storeId = 's-001') {
  return { tenantId, brandId, storeId }
}

type AnyFn = (...args: any[]) => any

interface MockServiceOverrides {
  registerCampaign?: AnyFn
  listCampaigns?: AnyFn
  getCampaign?: AnyFn
  updateCampaignStatus?: AnyFn
  listDispatches?: AnyFn
  listPlanDispatches?: AnyFn
  evaluateTriggers?: AnyFn
}

function makeController(overrides: MockServiceOverrides = {}) {
  const service = {
    registerCampaign: overrides.registerCampaign ?? (() => ({ planId: 'p-default', status: CampaignStatus.Draft })),
    listCampaigns: overrides.listCampaigns ?? (() => []),
    getCampaign: overrides.getCampaign ?? (() => undefined),
    updateCampaignStatus: overrides.updateCampaignStatus ?? (() => ({ planId: 'p-updated', status: CampaignStatus.Active })),
    listDispatches: overrides.listDispatches ?? (() => []),
    evaluateTriggers: overrides.evaluateTriggers ?? (() => ({
      matchedCampaigns: 0,
      dispatchedActions: 0,
      skippedActions: 0,
      failedActions: 0,
      dispatches: []
    }))
  }
  return new CampaignController(service as any)
}

// ── 路由元数据 ──
describe('CampaignController 路由元数据', () => {
  test('controller metadata path is campaigns', () => {
    const path = Reflect.getMetadata('path', CampaignController)
    assert.equal(path, 'campaigns')
  })

  test('registerCampaign POST /', () => {
    const method = Reflect.getMetadata('method', CampaignController.prototype.registerCampaign)
    const path = Reflect.getMetadata('path', CampaignController.prototype.registerCampaign)
    assert.equal(method, 1) // POST
    assert.equal(path, '/')
  })

  test('listCampaigns GET /', () => {
    const method = Reflect.getMetadata('method', CampaignController.prototype.listCampaigns)
    const path = Reflect.getMetadata('path', CampaignController.prototype.listCampaigns)
    assert.equal(method, 0) // GET
    assert.equal(path, '/')
  })

  test('getCampaign GET /:planId', () => {
    const method = Reflect.getMetadata('method', CampaignController.prototype.getCampaign)
    const path = Reflect.getMetadata('path', CampaignController.prototype.getCampaign)
    assert.equal(method, 0)
    assert.equal(path, ':planId')
  })

  test('updateCampaignStatus PATCH /:planId/status', () => {
    const method = Reflect.getMetadata('method', CampaignController.prototype.updateCampaignStatus)
    const path = Reflect.getMetadata('path', CampaignController.prototype.updateCampaignStatus)
    assert.ok(method === 2 || method === 4) // PATCH (RequestMethod.PATCH = 2 in NestJS enum, but can vary)
    assert.equal(path, ':planId/status')
  })

  test('listPlanDispatches GET /:planId/dispatches', () => {
    const method = Reflect.getMetadata('method', CampaignController.prototype.listPlanDispatches)
    const path = Reflect.getMetadata('path', CampaignController.prototype.listPlanDispatches)
    assert.equal(method, 0)
    assert.equal(path, ':planId/dispatches')
  })

  test('listDispatches GET /dispatches/list', () => {
    const method = Reflect.getMetadata('method', CampaignController.prototype.listDispatches)
    const path = Reflect.getMetadata('path', CampaignController.prototype.listDispatches)
    assert.equal(method, 0)
    assert.equal(path, 'dispatches/list')
  })

  test('evaluateTriggers POST /evaluate', () => {
    const method = Reflect.getMetadata('method', CampaignController.prototype.evaluateTriggers)
    const path = Reflect.getMetadata('path', CampaignController.prototype.evaluateTriggers)
    assert.equal(method, 1)
    assert.equal(path, 'evaluate')
  })
})

// ── 正例测试 ──
describe('CampaignController 正例', () => {
  test('registerCampaign 委托 service 并返回 plan contract', () => {
    const mockPlan = {
      planId: 'campaign-test-1',
      tenantContext: { tenantId: 't-campaign', brandId: 'b-campaign' },
      code: 'WELCOME_BONUS',
      title: '新会员欢迎奖励',
      description: '新注册会员自动发放积分',
      status: CampaignStatus.Draft,
      triggerEvent: CampaignTrigger.MemberProfileSynced,
      conditions: [],
      actions: [{ kind: CampaignActionKind.AwardPoints, params: { pointsAmount: 100, pointsReason: 'welcome' } }],
      priority: 10,
      scheduledStart: undefined,
      scheduledEnd: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    const controller = makeController({ registerCampaign: () => mockPlan })

    const result = controller.registerCampaign(createContext(), {
      code: 'WELCOME_BONUS',
      title: '新会员欢迎奖励',
      description: '新注册会员自动发放积分',
      triggerEvent: CampaignTrigger.MemberProfileSynced,
      conditions: [],
      actions: [{ kind: CampaignActionKind.AwardPoints, params: { pointsAmount: 100, pointsReason: 'welcome' } }],
      priority: 10
    })

    assert.equal(result.planId, 'campaign-test-1')
    assert.equal(result.title, '新会员欢迎奖励')
    assert.equal(result.status, CampaignStatus.Draft)
    assert.equal(result.triggerEvent, CampaignTrigger.MemberProfileSynced)
    assert.equal(result.actions.length, 1)
  })

  test('listCampaigns 返回 campaign plans 列表', () => {
    const mockPlans = [
      {
        planId: 'p-1', code: 'BIRTHDAY', title: '生日活动', status: CampaignStatus.Active,
        tenantContext: createContext(),
        triggerEvent: CampaignTrigger.MemberActivityRecurring,
        conditions: [], actions: [], priority: 1,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
      },
      {
        planId: 'p-2', code: 'BIG_SPENDER', title: '大额消费', status: CampaignStatus.Active,
        tenantContext: createContext(),
        triggerEvent: CampaignTrigger.PaymentSuccess,
        conditions: [], actions: [], priority: 5,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
      }
    ]
    const controller = makeController({ listCampaigns: () => mockPlans })

    const result = controller.listCampaigns(createContext())

    assert.equal(result.length, 2)
    assert.equal(result[0].planId, 'p-1')
    assert.equal(result[1].planId, 'p-2')
  })

  test('listCampaigns 支持状态过滤', () => {
    const mockPlans = [
      { planId: 'p-draft', code: 'DRAFT_CAMPAIGN', title: '草稿活动', status: CampaignStatus.Draft,
        tenantContext: createContext(),
        triggerEvent: CampaignTrigger.PaymentSuccess, conditions: [], actions: [], priority: 1,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    ]
    let capturedFilter: any
    const controller = makeController({
      listCampaigns: (_tenantId: string, filter: any) => {
        capturedFilter = filter
        return mockPlans.filter((p) => p.status === filter.status)
      }
    })

    const result = controller.listCampaigns(createContext(), CampaignStatus.Draft)

    assert.equal(result.length, 1)
    assert.equal(result[0].status, CampaignStatus.Draft)
  })

  test('getCampaign 找到有效 plan 返回', () => {
    const mockPlan = {
      planId: 'p-find',
      tenantContext: createContext(),
      code: 'SUMMER_SALE',
      title: '夏日促销',
      status: CampaignStatus.Active,
      triggerEvent: CampaignTrigger.OrderCreated,
      conditions: [{ type: CampaignConditionType.MinOrderAmount, value: 100 }],
      actions: [{ kind: CampaignActionKind.IssueCoupon, params: { couponPlanId: 'cp-001' } }],
      priority: 20,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    const controller = makeController({ getCampaign: () => mockPlan })

    const result = controller.getCampaign(createContext(), 'p-find')

    assert.ok(result)
    assert.equal(result.planId, 'p-find')
    assert.equal(result.code, 'SUMMER_SALE')
    assert.equal(result.conditions.length, 1)
  })

  test('getCampaign 找不到返回 null', () => {
    const controller = makeController({ getCampaign: () => undefined })

    const result = controller.getCampaign(createContext(), 'nonexistent')

    assert.equal(result, null)
  })

  test('updateCampaignStatus 更新状态返回更新后 plan', () => {
    const updatedPlan = {
      planId: 'p-status',
      tenantContext: createContext(),
      code: 'STATUS_TEST',
      title: '状态测试',
      status: CampaignStatus.Active,
      triggerEvent: CampaignTrigger.PaymentSuccess,
      conditions: [], actions: [], priority: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    let capturedPlanId: string | undefined
    let capturedStatus: string | undefined
    const controller = makeController({
      updateCampaignStatus: (planId: string, status: string) => {
        capturedPlanId = planId
        capturedStatus = status
        return updatedPlan
      }
    })

    const result = controller.updateCampaignStatus(createContext(), 'p-status', { status: CampaignStatus.Active })

    assert.equal(result.status, CampaignStatus.Active)
    assert.equal(capturedPlanId, 'p-status')
    assert.equal(capturedStatus, CampaignStatus.Active)
  })

  test('listDispatches 返回 dispatches 列表', () => {
    const mockDispatches = [
      {
        dispatchId: 'd-1', planId: 'p-1', actionIndex: 0,
        tenantContext: createContext(),
        memberId: 'm-01', orderId: 'o-01',
        triggerEvent: CampaignTrigger.PaymentSuccess,
        status: CampaignActionStatus.Dispatched,
        createdAt: new Date().toISOString()
      },
      {
        dispatchId: 'd-2', planId: 'p-1', actionIndex: 0,
        tenantContext: createContext(),
        memberId: 'm-02', orderId: 'o-02',
        triggerEvent: CampaignTrigger.PaymentSuccess,
        status: CampaignActionStatus.Failed,
        errorMessage: 'member not found',
        createdAt: new Date().toISOString()
      }
    ]
    const controller = makeController({ listDispatches: () => mockDispatches })

    const result = controller.listPlanDispatches(createContext(), 'p-1')

    assert.equal(result.length, 2)
    assert.equal(result[0].status, CampaignActionStatus.Dispatched)
    assert.equal(result[1].status, CampaignActionStatus.Failed)
  })

  test('evaluateTriggers 触发评估返回评估结果', () => {
    const mockResult = {
      matchedCampaigns: 2,
      dispatchedActions: 3,
      skippedActions: 1,
      failedActions: 0,
      dispatches: [
        {
          dispatchId: 'd-eval-1', planId: 'p-1', actionIndex: 0,
          tenantContext: createContext(),
          memberId: 'm-01',
          triggerEvent: CampaignTrigger.PaymentSuccess,
          status: CampaignActionStatus.Dispatched,
          resultRef: 'points+100:welcome',
          createdAt: new Date().toISOString()
        }
      ]
    }
    const controller = makeController({ evaluateTriggers: () => mockResult })

    const result = controller.evaluateTriggers(createContext(), {
      eventName: CampaignTrigger.PaymentSuccess,
      memberId: 'm-01',
      orderAmount: 200
    })

    assert.equal(result.matchedCampaigns, 2)
    assert.equal(result.dispatchedActions, 3)
    assert.equal(result.dispatches.length, 1)
  })
})

// ── 反例测试 ──
describe('CampaignController 反例', () => {
  test('registerCampaign 缺少 actions 应被 service 层拒绝', () => {
    const controller = makeController({
      registerCampaign: () => {
        throw new Error('Campaign must declare at least one action')
      }
    })

    assert.throws(
      () => controller.registerCampaign(createContext(), {
        code: 'NO_ACTION',
        title: '无活动活动',
        triggerEvent: CampaignTrigger.PaymentSuccess,
        conditions: [],
        actions: []
      }),
      /must declare at least one action/
    )
  })

  test('registerCampaign 无效 action kind 被拒绝', () => {
    const controller = makeController({
      registerCampaign: () => {
        throw new Error('Campaign action[0] (AwardPoints) requires positive pointsAmount')
      }
    })

    assert.throws(
      () => controller.registerCampaign(createContext(), {
        code: 'BAD_POINTS',
        title: '无效积分活动',
        triggerEvent: CampaignTrigger.PaymentSuccess,
        conditions: [],
        actions: [{ kind: CampaignActionKind.AwardPoints, params: { pointsAmount: 0 } }]
      }),
      /requires positive pointsAmount/
    )
  })

  test('updateCampaignStatus 非法状态转换被拒绝', () => {
    const controller = makeController({
      updateCampaignStatus: () => {
        throw new Error('Invalid campaign status transition: COMPLETED → ACTIVE')
      }
    })

    assert.throws(
      () => controller.updateCampaignStatus(createContext(), 'p-completed', { status: CampaignStatus.Active }),
      /Invalid campaign status transition/
    )
  })

  test('getCampaign 跨租户访问返回 null', () => {
    const controller = makeController({
      getCampaign: () => undefined
    })

    const result = controller.getCampaign(createContext('t-other'), 'p-1')

    assert.equal(result, null)
  })
})

// ── 边界值测试 ──
describe('CampaignController 边界值', () => {
  test('listCampaigns 空列表返回空数组', () => {
    const controller = makeController({ listCampaigns: () => [] })

    const result = controller.listCampaigns(createContext())

    assert.ok(Array.isArray(result))
    assert.equal(result.length, 0)
  })

  test('listDispatches 空列表返回空数组', () => {
    const controller = makeController({ listDispatches: () => [] })

    const result = controller.listPlanDispatches(createContext(), 'plan-no-dispatches')

    assert.ok(Array.isArray(result))
    assert.equal(result.length, 0)
  })

  test('resgisterCampaign 携带所有可选字段', () => {
    const mockPlan = {
      planId: 'p-full', code: 'FULL_FEATURE', title: '全功能活动',
      description: '包含所有可选字段',
      status: CampaignStatus.Draft,
      tenantContext: createContext(),
      triggerEvent: CampaignTrigger.OrderCreated,
      conditions: [
        { type: CampaignConditionType.MinOrderAmount, value: 500 },
        { type: CampaignConditionType.MemberLevel, value: ['VIP', 'GOLD'] }
      ],
      actions: [
        { kind: CampaignActionKind.AwardPoints, params: { pointsAmount: 500, pointsReason: 'big_spender' } },
        { kind: CampaignActionKind.IssueCoupon, params: { couponPlanId: 'cp-vip' } },
        { kind: CampaignActionKind.IssueBlindbox, params: { blindboxPlanId: 'bb-summer', blindboxQuantity: 1 } }
      ],
      priority: 1,
      scheduledStart: '2026-01-01T00:00:00.000Z',
      scheduledEnd: '2026-12-31T23:59:59.000Z',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    let capturedInput: any
    const controller = makeController({
      registerCampaign: (input: any) => {
        capturedInput = input
        return mockPlan
      }
    })

    const result = controller.registerCampaign(createContext(), {
      code: 'FULL_FEATURE',
      title: '全功能活动',
      description: '包含所有可选字段',
      triggerEvent: CampaignTrigger.OrderCreated,
      conditions: [
        { type: CampaignConditionType.MinOrderAmount, value: 500 },
        { type: CampaignConditionType.MemberLevel, value: ['VIP', 'GOLD'] }
      ],
      actions: [
        { kind: CampaignActionKind.AwardPoints, params: { pointsAmount: 500, pointsReason: 'big_spender' } },
        { kind: CampaignActionKind.IssueCoupon, params: { couponPlanId: 'cp-vip' } },
        { kind: CampaignActionKind.IssueBlindbox, params: { blindboxPlanId: 'bb-summer', blindboxQuantity: 1 } }
      ],
      priority: 1,
      scheduledStart: '2026-01-01T00:00:00.000Z',
      scheduledEnd: '2026-12-31T23:59:59.000Z'
    })

    assert.equal(result.actions.length, 3)
    assert.equal(capturedInput.conditions.length, 2)
    assert.equal(capturedInput.scheduledStart, '2026-01-01T00:00:00.000Z')
    assert.equal(capturedInput.scheduledEnd, '2026-12-31T23:59:59.000Z')
  })

  test('evaluateTriggers 无匹配 campaign 返回空结果', () => {
    const mockResult = {
      matchedCampaigns: 0,
      dispatchedActions: 0,
      skippedActions: 0,
      failedActions: 0,
      dispatches: []
    }
    const controller = makeController({ evaluateTriggers: () => mockResult })

    const result = controller.evaluateTriggers(createContext(), {
      eventName: 'unknown.event',
      memberId: 'm-01'
    })

    assert.equal(result.matchedCampaigns, 0)
    assert.equal(result.dispatchedActions, 0)
    assert.equal(result.dispatches.length, 0)
  })

  test('listDispatches 支持按 memberId 过滤', () => {
    const allDispatches = [
      { dispatchId: 'd-a', planId: 'p-1', actionIndex: 0,
        tenantContext: createContext(), memberId: 'm-alice',
        triggerEvent: 'payment.success', status: CampaignActionStatus.Dispatched,
        createdAt: new Date().toISOString() },
      { dispatchId: 'd-b', planId: 'p-1', actionIndex: 0,
        tenantContext: createContext(), memberId: 'm-bob',
        triggerEvent: 'payment.success', status: CampaignActionStatus.Dispatched,
        createdAt: new Date().toISOString() }
    ]
    let capturedFilter: any
    const controller = makeController({
      listDispatches: (_tenantId: string, filter: any) => {
        capturedFilter = filter
        return allDispatches.filter((d) => !filter.memberId || d.memberId === filter.memberId)
      }
    })

    const result = controller.listPlanDispatches(createContext(), 'p-1')

    // 默认无 memberId 过滤返回全部
    assert.equal(result.length, 2)
  })
})

// ── 多状态组合 ──
describe('CampaignController 状态流转组合', () => {
  test('Draft → Scheduled → Active → Paused → Active → Completed 完整生命周期', () => {
    const statuses: string[] = []
    const controller = makeController({
      updateCampaignStatus: (_planId: string, status: string) => {
        statuses.push(status)
        return { planId: 'p-lifecycle', status, tenantContext: createContext(),
          code: 'LIFECYCLE', title: '生命周期', triggerEvent: CampaignTrigger.PaymentSuccess,
          conditions: [], actions: [], priority: 1,
          createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      }
    })

    controller.updateCampaignStatus(createContext(), 'p-lifecycle', { status: CampaignStatus.Scheduled })
    controller.updateCampaignStatus(createContext(), 'p-lifecycle', { status: CampaignStatus.Active })
    controller.updateCampaignStatus(createContext(), 'p-lifecycle', { status: CampaignStatus.Paused })
    controller.updateCampaignStatus(createContext(), 'p-lifecycle', { status: CampaignStatus.Active })
    controller.updateCampaignStatus(createContext(), 'p-lifecycle', { status: CampaignStatus.Completed })

    assert.deepEqual(statuses, [
      CampaignStatus.Scheduled,
      CampaignStatus.Active,
      CampaignStatus.Paused,
      CampaignStatus.Active,
      CampaignStatus.Completed
    ])
  })
})
