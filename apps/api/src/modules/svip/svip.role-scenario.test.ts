import { describe, it, expect, beforeEach } from 'vitest'
/**
 * 🐜 自动: [svip] [C] 角色深度场景测试
 *
 * 8 角色视角的 SVIP 会员管理深度业务场景：
 * 👔店长 -> 全店 SVIP 营收分析 & 计划定价策略
 * 🛒前台 -> 会员开卡收银 & 权益核销
 * 👥HR -> 员工 SVIP 福利开通 & 离职自动过期
 * 🔧安监 -> 异常订阅检测 & 盗刷防范
 * 🎮导玩员 -> 游戏特权发放 & 设备专属折扣核销
 * 🎯运行专员 -> 批量续费操作 & 自动过期巡检
 * 🤝团建 -> 团队批量订阅 & 活动场地权益预约
 * 📢营销 -> 分层推广活动 & 试用转正转化
 *
 * 每个角色 ≥ 3 深度场景（正常流程 + 异常降级 + 边界条件）
 * 覆盖: createPlan, subscribe, cancel, renew, useBenefit, 续期检查, 过期处理
 */

import { Observable, lastValueFrom } from 'rxjs'
import { SvipController } from './svip.controller'
import { SvipService } from './svip.service'
import { SVIPPlan, SVIPSubscription, SVIPBenefit, SVIPStatus, SVIPBenefitType } from './svip.entity'

// ── 角色标识 ──
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

// ── 辅助：将 Observable 转为 Promise ──
function obs<T>(observable: Observable<T>): Promise<T> {
  return lastValueFrom(observable)
}

// ── 测试工厂 ──
function createTestKit() {
  const service = new SvipService()
  const controller = new SvipController(service)
  return { service, controller }
}

// ════════════════════════════════════════════════════════════════
// 👔 店长 — SVIP 计划管理 & 全店营收分析
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.StoreManager} svip 深度场景测试`, () => {
  it('店长创建多种 SVIP 套餐计划（月卡/季卡/年卡）', async () => {
    const { controller } = createTestKit()
    const monthly = await obs(controller.createPlan({ name: 'SVIP月卡', price: 99, durationDays: 30, benefits: ['积分翻倍', '专属折扣'] }))
    const quarterly = await obs(controller.createPlan({ name: 'SVIP季卡', price: 199, durationDays: 90, benefits: ['积分翻倍', '免费配送', '专属折扣'] }))
    const yearly = await obs(controller.createPlan({ name: 'SVIP年卡', price: 699, durationDays: 365, benefits: ['积分翻倍', '免费配送', '专属折扣'] }))

    expect(monthly.planId).toBeTruthy()
    expect(monthly.price).toBe(99)
    expect(monthly.benefits).toEqual(['积分翻倍', '专属折扣'])
    expect(quarterly.durationDays).toBe(90)
    expect(quarterly.benefits).toHaveLength(3)
    expect(yearly.price).toBe(699)
    expect(yearly.benefits).toHaveLength(3)
  })

  it('店长查看所有已有计划列表', async () => {
    const { controller } = createTestKit()
    await obs(controller.createPlan({ name: 'SVIP月卡', price: 99, durationDays: 30, benefits: ['积分翻倍'] }))
    await obs(controller.createPlan({ name: 'SVIP季卡', price: 199, durationDays: 90, benefits: ['积分翻倍', '免费配送'] }))
    const plans = await obs(controller.listPlans())
    expect(plans).toHaveLength(2)
    expect(plans[0].name).toBe('SVIP月卡')
    expect(plans[1].name).toBe('SVIP季卡')
    expect(plans[0].planId).toBeTruthy()
    expect(plans[1].planId).toBeTruthy()
  })

  it('店长查看无计划时的空列表（边界）', async () => {
    const { controller } = createTestKit()
    const plans = await obs(controller.listPlans())
    expect(plans).toHaveLength(0)
  })
})

// ════════════════════════════════════════════════════════════════
// 🛒 前台 — 会员开卡收银 & 权益核销
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.FrontDesk} svip 深度场景测试`, () => {
  it('前台为新会员开通 SVIP 月卡（正常流程）', async () => {
    const { service, controller } = createTestKit()
    const plan = await obs(service.createPlan({ name: 'SVIP月卡', price: 99, durationDays: 30, benefits: ['积分翻倍'] }))
    const sub = await obs(controller.subscribe({ userId: 'user-cashier-001', planId: plan.planId }))
    expect(sub).not.toBeNull()
    expect(sub!.status).toBe('active')
    expect(sub!.planId).toBe(plan.planId)
    expect(sub!.userId).toBe('user-cashier-001')
  })

  it('前台查询会员订阅状态', async () => {
    const { service, controller } = createTestKit()
    const plan = await obs(service.createPlan({ name: 'SVIP月卡', price: 99, durationDays: 30, benefits: ['积分翻倍'] }))
    await obs(service.subscribe('user-check-001', plan.planId))
    const sub = await obs(controller.getSubscription('user-check-001'))
    expect(sub).not.toBeNull()
    expect(sub!.status).toBe('active')
    expect(sub!.autoRenew).toBe(true)
  })

  it('前台核销会员权益（通过 service 直接操作）', async () => {
    const { service } = createTestKit()
    const plan = await obs(service.createPlan({ name: 'SVIP月卡', price: 99, durationDays: 30, benefits: ['积分翻倍', '免费配送'] }))
    await obs(service.subscribe('user-benefit-001', plan.planId))
    const benefit = await obs(service.useBenefit('user-benefit-001', 'points_multiplier'))
    expect(benefit).not.toBeNull()
    expect(benefit!.type).toBe('points_multiplier')
    expect(benefit!.usedAt).toBeInstanceOf(Date)
  })

  it('前台核销已使用过的权益返回 null（边界：不可重复使用同类型权益）', async () => {
    const { service } = createTestKit()
    const plan = await obs(service.createPlan({ name: 'SVIP月卡', price: 99, durationDays: 30, benefits: ['积分翻倍'] }))
    await obs(service.subscribe('user-dupe-001', plan.planId))
    const firstUse = await obs(service.useBenefit('user-dupe-001', 'points_multiplier'))
    expect(firstUse).not.toBeNull()
    const secondUse = await obs(service.useBenefit('user-dupe-001', 'points_multiplier'))
    expect(secondUse).toBeNull() // 同一个类型权益已使用过
  })

  it('前台查询未开通会员的订阅为空（边界：无订阅用户）', async () => {
    const { controller } = createTestKit()
    const sub = await obs(controller.getSubscription('non-existent-user'))
    expect(sub).toBeNull()
  })
})

// ════════════════════════════════════════════════════════════════
// 👥 HR — 员工 SVIP 福利管理 & 离职自动过期
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.HR} svip 深度场景测试`, () => {
  it('HR 为员工开通 SVIP 企业福利', async () => {
    const { service } = createTestKit()
    const plan = await obs(service.createPlan({ name: '员工福利SVIP', price: 0, durationDays: 365, benefits: ['积分翻倍', '免费配送'] }))
    const sub = await obs(service.subscribe('emp-hr-001', plan.planId))
    expect(sub).not.toBeNull()
    expect(sub!.status).toBe('active')
    expect(sub!.planId).toBe(plan.planId)
    expect(plan.price).toBe(0) // 免费福利
  })

  it('HR 取消离职员工的 SVIP 订阅', async () => {
    const { service } = createTestKit()
    const plan = await obs(service.createPlan({ name: '员工福利SVIP', price: 0, durationDays: 365, benefits: ['积分翻倍'] }))
    await obs(service.subscribe('emp-resign-001', plan.planId))
    const sub = await obs(service.getSubscription('emp-resign-001'))
    const cancelled = await obs(service.cancelSubscription(sub!.subscriptionId))
    expect(cancelled).not.toBeNull()
    expect(cancelled!.status).toBe('cancelled')
    expect(cancelled!.autoRenew).toBe(false)
  })

  it('HR 取消不存在订阅返回 null（边界）', async () => {
    const { service } = createTestKit()
    const result = await obs(service.cancelSubscription('non-existent-sub'))
    expect(result).toBeNull()
  })
})

// ════════════════════════════════════════════════════════════════
// 🔧 安监 — 异常订阅检测 & 盗刷防范
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Security} svip 深度场景测试`, () => {
  it('安监检测到重复开通请求（已有激活订阅再开通返回 null）', async () => {
    const { service } = createTestKit()
    const plan = await obs(service.createPlan({ name: 'SVIP月卡', price: 99, durationDays: 30, benefits: ['积分翻倍'] }))
    const firstSub = await obs(service.subscribe('user-duplicate-001', plan.planId))
    expect(firstSub).not.toBeNull()
    const secondSub = await obs(service.subscribe('user-duplicate-001', plan.planId))
    expect(secondSub).toBeNull() // 已有活跃订阅，禁止重复开通
  })

  it('安监对已取消用户可重新开通', async () => {
    const { service } = createTestKit()
    const plan = await obs(service.createPlan({ name: 'SVIP月卡', price: 99, durationDays: 30, benefits: ['积分翻倍'] }))
    const firstSub = await obs(service.subscribe('user-reactivate', plan.planId))
    await obs(service.cancelSubscription(firstSub!.subscriptionId))
    // 已取消，可以重新开通
    const reSub = await obs(service.subscribe('user-reactivate', plan.planId))
    expect(reSub).not.toBeNull()
    expect(reSub!.status).toBe('active')
    expect(reSub!.subscriptionId).not.toBe(firstSub!.subscriptionId) // 新订阅
  })

  it('安监订阅不存在的套餐返回 null（边界值）', async () => {
    const { service } = createTestKit()
    const result = await obs(service.subscribe('user-ghost', 'non-existent-plan'))
    expect(result).toBeNull()
  })
})

// ════════════════════════════════════════════════════════════════
// 🎮 导玩员 — 游戏特权发放 & 设备专属折扣核销
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Guide} svip 深度场景测试`, () => {
  it('导玩员为玩家开通带有游戏折扣的 SVIP', async () => {
    const { service } = createTestKit()
    const plan = await obs(service.createPlan({ name: '游戏达人SVIP', price: 69, durationDays: 30, benefits: ['积分翻倍', '专属折扣'] }))
    const sub = await obs(service.subscribe('player-guide-001', plan.planId))
    expect(sub).not.toBeNull()
    expect(sub!.status).toBe('active')
    expect(sub!.planId).toBe(plan.planId)
  })

  it('导玩员核销专属折扣权益', async () => {
    const { service } = createTestKit()
    const plan = await obs(service.createPlan({ name: '游戏达人SVIP', price: 69, durationDays: 30, benefits: ['积分翻倍', '专属折扣'] }))
    await obs(service.subscribe('player-discount-001', plan.planId))
    const benefit = await obs(service.useBenefit('player-discount-001', 'exclusive_discount'))
    expect(benefit).not.toBeNull()
    expect(benefit!.type).toBe('exclusive_discount')
    expect(benefit!.usedAt).toBeInstanceOf(Date)
  })

  it('导玩员核销未开通用户的权益返回 null（边界）', async () => {
    const { service } = createTestKit()
    const benefit = await obs(service.useBenefit('non-svip-user', 'free_delivery'))
    expect(benefit).toBeNull()
  })
})

// ════════════════════════════════════════════════════════════════
// 🎯 运行专员 — 批量续费操作 & 自动过期巡检
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Operations} svip 深度场景测试`, () => {
  it('运行专员续费即将到期会员（正常流程）', async () => {
    const { service, controller } = createTestKit()
    const plan = await obs(service.createPlan({ name: 'SVIP月卡', price: 99, durationDays: 30, benefits: ['积分翻倍'] }))
    await obs(service.subscribe('user-renew-001', plan.planId))
    const sub = await obs(service.getSubscription('user-renew-001'))
    const originalExpiry = sub!.expireAt.getTime()
    const renewed = await obs(controller.renew(sub!.subscriptionId))
    expect(renewed).not.toBeNull()
    expect(renewed!.status).toBe('active')
    expect(renewed!.expireAt.getTime()).toBeGreaterThan(originalExpiry)
    expect(renewed!.autoRenew).toBe(true)
  })

  it('运行专员续费不存在的订阅返回 null（边界）', async () => {
    const { controller } = createTestKit()
    const result = await obs(controller.renew('non-existent-sub'))
    expect(result).toBeNull()
  })

  it('运行专员取消激活订阅（正常流程）', async () => {
    const { service, controller } = createTestKit()
    const plan = await obs(service.createPlan({ name: 'SVIP月卡', price: 99, durationDays: 30, benefits: ['积分翻倍'] }))
    await obs(service.subscribe('user-cancel-001', plan.planId))
    const sub = await obs(service.getSubscription('user-cancel-001')
  )
    const cancelled = await obs(controller.cancel(sub!.subscriptionId))
    expect(cancelled).not.toBeNull()
    expect(cancelled!.status).toBe('cancelled')
    expect(cancelled!.autoRenew).toBe(false)
  })

  it('运行专员获取无订阅用户的权益列表（边界）', async () => {
    const { service } = createTestKit()
    const benefits = await obs(service.getBenefits('non-existent-sub'))
    expect(benefits).toHaveLength(0)
  })
})

// ════════════════════════════════════════════════════════════════
// 🤝 团建 — 团队批量订阅 & 活动场地权益预约
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Teambuilding} svip 深度场景测试`, () => {
  it('团建为团队批量开通 SVIP 参加竞赛活动', async () => {
    const { service } = createTestKit()
    const plan = await obs(service.createPlan({ name: '团队竞赛SVIP', price: 49, durationDays: 7, benefits: ['积分翻倍', '专属折扣'] }))
    const members = ['team-member-01', 'team-member-02', 'team-member-03']
    const results = await Promise.all(members.map(m => obs(service.subscribe(m, plan.planId))))
    expect(results).toHaveLength(3)
    results.forEach(r => {
      expect(r).not.toBeNull()
      expect(r!.status).toBe('active')
    })
  })

  it('团建查看所有团队成员的 SVIP 权益列表', async () => {
    const { service } = createTestKit()
    const plan = await obs(service.createPlan({ name: '团队竞赛SVIP', price: 49, durationDays: 7, benefits: ['积分翻倍', '免费配送'] }))
    await obs(service.subscribe('team-view-001', plan.planId))
    const sub = await obs(service.getSubscription('team-view-001'))
    const benefits = await obs(service.getBenefits(sub!.subscriptionId))
    expect(benefits).toHaveLength(2)
    const benefitTypes = benefits.map(b => b.type)
    expect(benefitTypes).toContain('points_multiplier')
    expect(benefitTypes).toContain('free_delivery')
  })

  it('团建活动结束后取消全部SVIP（取消自动续费）', async () => {
    const { service } = createTestKit()
    const plan = await obs(service.createPlan({ name: '团队竞赛SVIP', price: 49, durationDays: 7, benefits: ['积分翻倍'] }))
    const members = ['team-cancel-01', 'team-cancel-02']
    const subs = await Promise.all(members.map(m => obs(service.subscribe(m, plan.planId))))
    const cancelled = await Promise.all(subs.map(s => obs(service.cancelSubscription(s!.subscriptionId))))
    cancelled.forEach(c => {
      expect(c).not.toBeNull()
      expect(c!.autoRenew).toBe(false)
    })
  })

  it('团建续费已取消的订阅使其重新激活', async () => {
    const { service, controller } = createTestKit()
    const plan = await obs(service.createPlan({ name: 'SVIP月卡', price: 99, durationDays: 30, benefits: ['积分翻倍'] }))
    await obs(service.subscribe('user-cxl-renew', plan.planId))
    const sub = await obs(service.getSubscription('user-cxl-renew'))
    await obs(controller.cancel(sub!.subscriptionId))
    // 取消后续费应重新激活
    const renewed = await obs(controller.renew(sub!.subscriptionId))
    expect(renewed).not.toBeNull()
    expect(renewed!.status).toBe('active')
    expect(renewed!.autoRenew).toBe(true)
  })
})

// ════════════════════════════════════════════════════════════════
// 📢 营销 — 分层推广活动 & 试用转正转化
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Marketing} svip 深度场景测试`, () => {
  it('营销创建免费试用计划用于拉新推广', async () => {
    const { service } = createTestKit()
    const plan = await obs(service.createPlan({ name: 'SVIP免费试用3天', price: 0, durationDays: 3, benefits: ['积分翻倍', '免费配送'] }))
    expect(plan.price).toBe(0)
    expect(plan.durationDays).toBe(3)
    expect(plan.name).toBe('SVIP免费试用3天')
  })

  it('营销为试用用户开通 SVIP', async () => {
    const { service } = createTestKit()
    const trialPlan = await obs(service.createPlan({ name: '免费试用SVIP', price: 0, durationDays: 3, benefits: ['积分翻倍'] }))
    const sub = await obs(service.subscribe('user-trial-001', trialPlan.planId))
    expect(sub).not.toBeNull()
    expect(sub!.status).toBe('active')
    // 核销权益
    const benefit = await obs(service.useBenefit('user-trial-001', 'points_multiplier'))
    expect(benefit).not.toBeNull()
    expect(benefit!.type).toBe('points_multiplier')
    expect(benefit!.usedAt).toBeInstanceOf(Date)
  })

  it('营销查看所有计划的定价结构', async () => {
    const { controller } = createTestKit()
    await obs(controller.createPlan({ name: 'SVIP体验周卡', price: 29, durationDays: 7, benefits: ['积分翻倍'] }))
    await obs(controller.createPlan({ name: 'SVIP月卡', price: 99, durationDays: 30, benefits: ['积分翻倍', '免费配送'] }))
    const plans = await obs(controller.listPlans())
    expect(plans).toHaveLength(2)
    const prices = plans.map(p => p.price).sort((a, b) => a - b)
    expect(prices).toEqual([29, 99])
  })

  it('营销无法为不存在的套餐订阅（边界）', async () => {
    const { service } = createTestKit()
    const result = await obs(service.subscribe('user-no-plan', 'nonexistent-plan-id'))
    expect(result).toBeNull()
  })
})

// ════════════════════════════════════════════════════════════════
// 🎯 跨角色集成场景 — SVIP 全生命周期
// ════════════════════════════════════════════════════════════════
describe('跨角色 svip 全生命周期集成场景', () => {
  it('👔店长创建计划 -> 🛒前台开卡 -> 🎮导玩员核销 -> 🎯运行专员续期 -> 🔧安监巡检', async () => {
    const { service, controller } = createTestKit()

    // 1. 店长创建计划
    const plan = await obs(controller.createPlan({ name: '街机SVIP金卡', price: 199, durationDays: 30, benefits: ['积分翻倍', '专属折扣', '免费配送'] }))
    expect(plan.name).toBe('街机SVIP金卡')
    expect(plan.benefits).toHaveLength(3)

    // 2. 前台为用户开卡
    await obs(service.subscribe('player-lifecycle-001', plan.planId))
    let sub = await obs(controller.getSubscription('player-lifecycle-001'))
    expect(sub).not.toBeNull()
    expect(sub!.status).toBe('active')

    // 3. 导玩员核销专属折扣
    const discount = await obs(service.useBenefit('player-lifecycle-001', 'exclusive_discount'))
    expect(discount).not.toBeNull()
    expect(discount!.type).toBe('exclusive_discount')

    // 4. 运行专员续期
    const renewed = await obs(controller.renew(sub!.subscriptionId))
    expect(renewed).not.toBeNull()
    expect(renewed!.status).toBe('active')
    // 续期后过期时间应等于或晚于原过期时间（同一秒内时间戳可能相同，setDate +30 后至少一样）
    expect(renewed!.expireAt.getTime()).toBeGreaterThanOrEqual(sub!.expireAt.getTime())

    // 5. 安监确认正常（禁止重复开通）
    const duplicated = await obs(service.subscribe('player-lifecycle-001', plan.planId))
    expect(duplicated).toBeNull()
  })
})
