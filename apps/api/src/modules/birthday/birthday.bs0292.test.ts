/**
 * 🧪 BS-0292: 入场特效预加载测试
 * 覆盖: preloadEffects 方法
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { BirthdayService } from './birthday.service'
import { BirthdayTier } from './birthday.entity'

describe('[BS-0292] 入场特效预加载', () => {
  let svc: BirthdayService

  beforeEach(() => {
    svc = new BirthdayService()
    svc.reset()
  })

  it('[正例] 无生日方案的会员返回空特效', () => {
    const result = svc.preloadEffects('member-no-plan')
    expect(result.memberId).toBe('member-no-plan')
    expect(result.hasActivePlan).toBe(false)
    expect(result.effects).toHaveLength(0)
  })

  it('[正例] 有生日方案的会员返回特效数据', () => {
    // 创建一个生日方案（当天生日）
    svc.createPlan({
      memberId: 'member-001',
      birthday: '07-24', // 今天7月24日
      advanceDays: 3,
      tier: BirthdayTier.Standard,
      rewardType: 'coupon',
      rewardValue: 50,
      allowFriends: true,
      friendDiscount: 0.8,
    })

    // 触发推送以激活
    const plans = svc.listPlans()
    const plan = plans.find(p => p.memberId === 'member-001')
    expect(plan).toBeDefined()

    // 手动触发推送
    if (plan) {
      svc.triggerPush(plan.id)
    }

    const result = svc.preloadEffects('member-001')
    expect(result.memberId).toBe('member-001')
    expect(result.hasActivePlan).toBe(true)
    expect(result.effects.length).toBeGreaterThanOrEqual(1)

    // 验证特效结构
    const entranceAnim = result.effects.find(e => e.type === 'entrance_animation')
    expect(entranceAnim).toBeDefined()
    expect(entranceAnim!.data).toHaveProperty('animationKey')
    expect(entranceAnim!.data).toHaveProperty('duration')

    // 标准会员有50个彩纸粒子
    const confetti = result.effects.find(e => e.type === 'confetti_config')
    expect(confetti).toBeDefined()
    expect(confetti!.data.particleCount).toBe(50)
  })

  it('[正例] VIP会员获取高级特效', () => {
    svc.createPlan({
      memberId: 'member-vip',
      birthday: '07-24',
      advanceDays: 3,
      tier: BirthdayTier.VIP,
      rewardType: 'gift',
      rewardValue: 200,
      allowFriends: true,
      friendDiscount: 0.5,
    })

    const plans = svc.listPlans()
    const plan = plans.find(p => p.memberId === 'member-vip')
    if (plan) svc.triggerPush(plan.id)

    const result = svc.preloadEffects('member-vip')
    expect(result.hasActivePlan).toBe(true)

    const confetti = result.effects.find(e => e.type === 'confetti_config')
    expect(confetti).toBeDefined()
    // VIP: 150个粒子
    expect(confetti!.data.particleCount).toBe(150)
  })

  it('[正例] 未激活的pending方案返回特效', () => {
    svc.createPlan({
      memberId: 'member-pending',
      birthday: '07-24',
      advanceDays: 5,
      tier: BirthdayTier.Premium,
      rewardType: 'discount',
      rewardValue: 100,
    })

    const result = svc.preloadEffects('member-pending')
    expect(result.hasActivePlan).toBe(true)
    expect(result.effects.length).toBeGreaterThanOrEqual(1)
  })
})
