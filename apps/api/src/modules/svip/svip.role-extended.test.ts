import { describe, it, expect, beforeEach } from 'vitest'
import { SvipService } from './svip.service'
import { firstValueFrom } from 'rxjs'

/**
 * 🐜 [svip] 角色扩展测试
 * 使用真实 SvipService API（Observable-based）
 * 流程: createPlan → subscribe → getSubscription → useBenefit / renew / cancel
 */

function setup() {
  const svc = new SvipService()
  return { svc }
}

describe('👔店长 svip 扩展测试', () => {
  let svc: SvipService
  beforeEach(() => {
    svc = new SvipService()
  })

  it('创建计划并订阅 SVIP 会员', async () => {
    const plan = await firstValueFrom(
      svc.createPlan({ name: '月度会员', price: 99, durationDays: 30, benefits: ['积分翻倍'] }),
    )
    expect(plan.planId).toBeTruthy()
    expect(plan.name).toBe('月度会员')
    expect(plan.price).toBe(99)

    const sub = await firstValueFrom(svc.subscribe('user-1', plan.planId))
    expect(sub).not.toBeNull()
    expect(sub!.status).toBe('active')
    expect(sub!.planId).toBe(plan.planId)
  })

  it('查询 SVIP 订阅信息', async () => {
    const plan = await firstValueFrom(svc.createPlan({ name: '年度会员', price: 599, durationDays: 365, benefits: ['积分翻倍', '专属折扣'] }))
    await firstValueFrom(svc.subscribe('user-2', plan.planId))

    const sub = await firstValueFrom(svc.getSubscription('user-2'))
    expect(sub).not.toBeNull()
    expect(sub!.planId).toBe(plan.planId)
  })
})

describe('🛒前台 svip 扩展测试', () => {
  let svc: SvipService
  beforeEach(() => {
    svc = new SvipService()
  })

  it('续费 SVIP', async () => {
    const plan = await firstValueFrom(svc.createPlan({ name: '月度会员', price: 99, durationDays: 30, benefits: ['积分翻倍'] }))
    const sub = await firstValueFrom(svc.subscribe('user-3', plan.planId))
    expect(sub).not.toBeNull()

    const renewed = await firstValueFrom(svc.renewSubscription(sub!.subscriptionId))
    expect(renewed).not.toBeNull()
    expect(renewed!.status).toBe('active')
    // 续费后 autoRenew 保持不变
    expect(renewed!.autoRenew).toBe(true)
    expect(renewed!.subscriptionId).toBe(sub!.subscriptionId)
  })
})

describe('📢营销 svip 扩展测试', () => {
  let svc: SvipService
  beforeEach(() => {
    svc = new SvipService()
  })

  it('查询不存在的订阅返回 null', async () => {
    const sub = await firstValueFrom(svc.getSubscription('no-such-user'))
    expect(sub).toBeNull()
  })

  it('取消订阅后状态变为 cancelled', async () => {
    const plan = await firstValueFrom(svc.createPlan({ name: '月度会员', price: 99, durationDays: 30, benefits: ['积分翻倍'] }))
    const sub = await firstValueFrom(svc.subscribe('user-4', plan.planId))
    expect(sub).not.toBeNull()

    const cancelled = await firstValueFrom(svc.cancelSubscription(sub!.subscriptionId))
    expect(cancelled).not.toBeNull()
    expect(cancelled!.status).toBe('cancelled')
    expect(cancelled!.autoRenew).toBe(false)
  })

  it('使用会员权益', async () => {
    const plan = await firstValueFrom(svc.createPlan({ name: '高级会员', price: 199, durationDays: 30, benefits: ['积分翻倍', '免费配送', '专属折扣'] }))
    const sub = await firstValueFrom(svc.subscribe('user-5', plan.planId))
    expect(sub).not.toBeNull()

    const benefit = await firstValueFrom(svc.useBenefit('user-5', 'free_delivery'))
    expect(benefit).not.toBeNull()
    expect(benefit!.type).toBe('free_delivery')
    expect(benefit!.usedAt).toBeInstanceOf(Date)

    // 相同权益不能重复使用
    const secondUse = await firstValueFrom(svc.useBenefit('user-5', 'free_delivery'))
    expect(secondUse).toBeNull()
  })

  it('过期检查功能', async () => {
    const plan = await firstValueFrom(svc.createPlan({ name: '月度会员', price: 99, durationDays: -1, benefits: ['积分翻倍'] }))
    const sub = await firstValueFrom(svc.subscribe('user-6', plan.planId))
    expect(sub).not.toBeNull()

    const expiredCount = await firstValueFrom(svc.checkAndExpire())
    expect(expiredCount).toBeGreaterThan(0)

    // 确认已过期
    const expiredSub = await firstValueFrom(svc.getSubscription('user-6'))
    expect(expiredSub).not.toBeNull()
    expect(expiredSub!.status).toBe('expired')
  })
})

describe('🎯运行专员 svip 扩展测试', () => {
  let svc: SvipService
  beforeEach(() => {
    svc = new SvipService()
  })

  it('批量查询会员权益列表', async () => {
    const plan = await firstValueFrom(svc.createPlan({ name: '测试计划', price: 1, durationDays: 30, benefits: ['积分翻倍', '免费配送'] }))
    const sub = await firstValueFrom(svc.subscribe('user-10', plan.planId))
    expect(sub).not.toBeNull()

    const benefits = await firstValueFrom(svc.getBenefits(sub!.subscriptionId))
    expect(benefits.length).toBe(2)
    expect(benefits[0].type).toBe('points_multiplier')
  })
})
