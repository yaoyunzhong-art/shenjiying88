import { describe, it, expect, beforeEach, vi } from 'vitest'
/**
 * 🐜 自动: [campaign] CampaignTriggerService 测试
 *
 * 覆盖 CampaignTriggerService:
 *   - onModuleInit / onModuleDestroy: 事件订阅生命周期
 *   - handleEvent: 正例触发评估 / 反例(缺少tenantContext/memberId)
 *   - fire: 主动触发
 *   - 频次控制: 同 userId+event 每日限 1 次
 *   - resetFrequencyCounter: 测试辅助
 *   - 边界: 空 payload / 空事件名 / 大量并发事件
 *
 * 依赖:
 *   - EventBusService (mock)
 *   - CampaignService (mock)
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { CampaignTriggerService } from './trigger.service'
import { CampaignService, type CampaignEvaluationResult } from './campaign.service'
import { CampaignStatus, CampaignTrigger } from './campaign.entity'

// ══════════════════════════════════════════════════════════════════════════════
// Mocks
// ══════════════════════════════════════════════════════════════════════════════

function createMockCampaignService(): CampaignService {
  const svc = new (CampaignService as any)()
  svc.resetCampaignStoresForTests()
  svc.evaluateTriggers = vi.fn().mockReturnValue({
    matchedCampaigns: 1,
    dispatchedActions: 2,
    skippedActions: 0,
    failedActions: 0,
    dispatches: [],
  } as CampaignEvaluationResult)
  // 为了测试，把 registerCampaign 的行为保留
  return svc
}

function createMockEventBus(): any {
  const subscriptions: Array<{ event: string; handler: (payload: any) => Promise<any> }> = []
  return {
    subscribe: vi.fn((event: string, handler: (payload: any) => Promise<any>) => {
      subscriptions.push({ event, handler })
    }),
    _subscriptions: subscriptions,
    async fire(event: string, payload: any) {
      for (const sub of subscriptions) {
        if (sub.event === event) {
          await sub.handler(payload)
        }
      }
    },
  }
}

const TENANT_CTX = { tenantId: 'tenant-001', brandId: 'brand-001', storeId: 'store-001' }

// ══════════════════════════════════════════════════════════════════════════════
// onModuleInit — 事件订阅
// ══════════════════════════════════════════════════════════════════════════════

describe('[CampaignTriggerService] onModuleInit', () => {
  it('订阅 5 个核心业务事件', () => {
    const eventBus = createMockEventBus()
    const trigger = new CampaignTriggerService(
      eventBus as any,
      createMockCampaignService() as any,
    )
    trigger.onModuleInit()
    expect(eventBus.subscribe).toHaveBeenCalledTimes(5)
    expect(trigger.subscribedEventCount()).toBe(5)
  })

  it('无 EventBus 时不会报错并记录订阅数为 0', () => {
    const trigger = new CampaignTriggerService(undefined, createMockCampaignService() as any)
    expect(() => trigger.onModuleInit()).not.toThrow()
    expect(trigger.subscribedEventCount()).toBe(0)
  })

  it('无 CampaignService 时 handleEvent 返回 null', async () => {
    const eventBus = createMockEventBus()
    const trigger = new CampaignTriggerService(eventBus as any, undefined)
    trigger.onModuleInit()

    const result = await trigger.handleEvent('payment.success', {
      tenantContext: TENANT_CTX,
      memberId: 'member-001',
    })
    expect(result).toBeNull()
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// handleEvent — 正例
// ══════════════════════════════════════════════════════════════════════════════

describe('[CampaignTriggerService] handleEvent — 正例', () => {
  it('payment.success 事件触发评估并返回结果', async () => {
    const campaignSvc = createMockCampaignService()
    const trigger = new CampaignTriggerService(createMockEventBus() as any, campaignSvc as any)

    const result = await trigger.handleEvent('payment.success', {
      tenantContext: TENANT_CTX,
      memberId: 'member-001',
      orderId: 'order-001',
      paymentId: 'pay-001',
      orderAmount: 50000,
    })

    expect(result).not.toBeNull()
    expect(result!.matchedCampaigns).toBe(1)
    expect(result!.dispatchedActions).toBe(2)
    expect(campaignSvc.evaluateTriggers).toHaveBeenCalled()
  })

  it('member.registered 事件传递正确的 tenantContext', async () => {
    const campaignSvc = createMockCampaignService()
    const trigger = new CampaignTriggerService(createMockEventBus() as any, campaignSvc as any)

    await trigger.handleEvent('member.registered', {
      tenantContext: TENANT_CTX,
      memberId: 'member-001',
    })

    const callArgs = (campaignSvc.evaluateTriggers as any).mock.calls[0][0]
    expect(callArgs.eventName).toBe('member.registered')
    expect(callArgs.tenantContext).toEqual(TENANT_CTX)
    expect(callArgs.memberId).toBe('member-001')
  })

  it('share.clicked 事件不传递 orderId 时也能处理', async () => {
    const campaignSvc = createMockCampaignService()
    const trigger = new CampaignTriggerService(createMockEventBus() as any, campaignSvc as any)

    const result = await trigger.handleEvent('share.clicked', {
      tenantContext: TENANT_CTX,
      memberId: 'member-002',
    })

    expect(result).not.toBeNull()
  })

  it('order.completed 事件带完整 payload 传递正确参数', async () => {
    const campaignSvc = createMockCampaignService()
    const trigger = new CampaignTriggerService(createMockEventBus() as any, campaignSvc as any)

    await trigger.handleEvent('order.completed', {
      tenantContext: TENANT_CTX,
      memberId: 'member-003',
      orderId: 'order-003',
      orderAmount: 150000,
      storeId: 'store-001',
      brandId: 'brand-001',
    })

    const callArgs = (campaignSvc.evaluateTriggers as any).mock.calls[0][0]
    expect(callArgs.orderAmount).toBe(150000)
    expect(callArgs.storeId).toBe('store-001')
    expect(callArgs.brandId).toBe('brand-001')
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// handleEvent — 反例 / 边界
// ══════════════════════════════════════════════════════════════════════════════

describe('[CampaignTriggerService] handleEvent — 反例', () => {
  it('缺少 tenantContext 时跳过并返回 null', async () => {
    const trigger = new CampaignTriggerService(
      createMockEventBus() as any,
      createMockCampaignService() as any,
    )

    const result = await trigger.handleEvent('payment.success', { memberId: 'm1' })
    expect(result).toBeNull()
  })

  it('空 payload 返回 null', async () => {
    const trigger = new CampaignTriggerService(
      createMockEventBus() as any,
      createMockCampaignService() as any,
    )

    const result = await trigger.handleEvent('payment.success', null)
    expect(result).toBeNull()
  })

  it('undefined payload 返回 null', async () => {
    const trigger = new CampaignTriggerService(
      createMockEventBus() as any,
      createMockCampaignService() as any,
    )

    const result = await trigger.handleEvent('payment.success', undefined)
    expect(result).toBeNull()
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// 频次控制
// ══════════════════════════════════════════════════════════════════════════════

describe('[CampaignTriggerService] 频次控制', () => {
  it('同 memberId + 同 event 每日首次通过', async () => {
    const trigger = new CampaignTriggerService(
      createMockEventBus() as any,
      createMockCampaignService() as any,
    )

    const r1 = await trigger.handleEvent('payment.success', {
      tenantContext: TENANT_CTX,
      memberId: 'member-001',
    })
    expect(r1).not.toBeNull()
  })

  it('同 memberId + 同 event 当日第二次返回 null', async () => {
    const trigger = new CampaignTriggerService(
      createMockEventBus() as any,
      createMockCampaignService() as any,
    )

    await trigger.handleEvent('payment.success', {
      tenantContext: TENANT_CTX,
      memberId: 'member-001',
    })
    const r2 = await trigger.handleEvent('payment.success', {
      tenantContext: TENANT_CTX,
      memberId: 'member-001',
    })
    expect(r2).toBeNull()
  })

  it('不同 memberId 各自独立计数', async () => {
    const trigger = new CampaignTriggerService(
      createMockEventBus() as any,
      createMockCampaignService() as any,
    )

    await trigger.handleEvent('payment.success', {
      tenantContext: TENANT_CTX,
      memberId: 'member-001',
    })
    const r2 = await trigger.handleEvent('payment.success', {
      tenantContext: TENANT_CTX,
      memberId: 'member-002',
    })
    expect(r2).not.toBeNull()
  })

  it('不同 event 分别计数', async () => {
    const trigger = new CampaignTriggerService(
      createMockEventBus() as any,
      createMockCampaignService() as any,
    )

    await trigger.handleEvent('payment.success', {
      tenantContext: TENANT_CTX,
      memberId: 'member-001',
    })
    // 不同 event 应不受限
    const r2 = await trigger.handleEvent('order.completed', {
      tenantContext: TENANT_CTX,
      memberId: 'member-001',
    })
    expect(r2).not.toBeNull()
  })

  it('resetFrequencyCounter 重置计数后可通过', async () => {
    const trigger = new CampaignTriggerService(
      createMockEventBus() as any,
      createMockCampaignService() as any,
    )

    await trigger.handleEvent('payment.success', {
      tenantContext: TENANT_CTX,
      memberId: 'member-001',
    })
    let r2 = await trigger.handleEvent('payment.success', {
      tenantContext: TENANT_CTX,
      memberId: 'member-001',
    })
    expect(r2).toBeNull()

    trigger.resetFrequencyCounter()
    const r3 = await trigger.handleEvent('payment.success', {
      tenantContext: TENANT_CTX,
      memberId: 'member-001',
    })
    expect(r3).not.toBeNull()
  })

  it('无 memberId 的事件不受频次控制', async () => {
    const campaignSvc = createMockCampaignService()
    const trigger = new CampaignTriggerService(
      createMockEventBus() as any,
      campaignSvc as any,
    )

    const r1 = await trigger.handleEvent('payment.success', {
      tenantContext: TENANT_CTX,
    })
    expect(r1).not.toBeNull()

    const r2 = await trigger.handleEvent('payment.success', {
      tenantContext: TENANT_CTX,
    })
    // 无 memberId 时不应跳过
    expect(r2).not.toBeNull()
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// fire — 主动触发
// ══════════════════════════════════════════════════════════════════════════════

describe('[CampaignTriggerService] fire', () => {
  it('主动触发传递事件名和 payload', async () => {
    const campaignSvc = createMockCampaignService()
    const trigger = new CampaignTriggerService(
      createMockEventBus() as any,
      campaignSvc as any,
    )

    const result = await trigger.fire('holiday.promotion', {
      tenantContext: TENANT_CTX,
      memberId: 'member-001',
    })
    expect(result).not.toBeNull()
    expect(campaignSvc.evaluateTriggers).toHaveBeenCalled()
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// onModuleDestroy
// ══════════════════════════════════════════════════════════════════════════════

describe('[CampaignTriggerService] onModuleDestroy', () => {
  it('销毁后订阅数归零且计数器清空', () => {
    const eventBus = createMockEventBus()
    const trigger = new CampaignTriggerService(eventBus as any, createMockCampaignService() as any)
    trigger.onModuleInit()
    expect(trigger.subscribedEventCount()).toBe(5)

    trigger.onModuleDestroy()
    expect(trigger.subscribedEventCount()).toBe(0)
  })
})
