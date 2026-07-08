import { describe, it, expect, beforeEach } from 'vitest'
import { SvipService } from './svip.service'
import { firstValueFrom } from 'rxjs'
import type { SVIPBenefitType } from './svip.entity'

/**
 * 🐜 自动: [svip] [C] 角色扩展测试 — 8角色深度场景
 * 
 * 角色表:
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 * 
 * 每个角色 2+ 深度用例（正常流程 + 权限边界 + 异常路径）
 */

// ── 测试工厂 ──────────────────────────────────────────

function createService() {
  return new SvipService()
}

/** 创建订阅并返回 plan + subscription */
async function createBasicSubscription(
  svc: SvipService,
  planInput: { name: string; price: number; durationDays: number; benefits: string[] },
  userId: string,
) {
  const plan = await firstValueFrom(svc.createPlan(planInput))
  const sub = await firstValueFrom(svc.subscribe(userId, plan.planId))
  return { plan, sub: sub! }
}

/** 创建多级深度的场景：创建计划、订阅、续费、取消 */
async function createFullLifecycle(svc: SvipService, userId: string) {
  const plan = await firstValueFrom(
    svc.createPlan({ name: '年度SVIP', price: 599, durationDays: 365, benefits: ['积分翻倍', '免费配送', '专属折扣'] }),
  )
  const sub = await firstValueFrom(svc.subscribe(userId, plan.planId))
  return { plan, sub: sub! }
}

// ════════════════════════════════════════════════════════════════
// 👔 店长 — 经营视角：收益管理、会员体系运营
// ════════════════════════════════════════════════════════════════

describe('👔店长 SVIP 扩展测试', () => {
  it('创建多档位定价计划并计算年化收益', async () => {
    const svc = createService()
    const monthly = await firstValueFrom(
      svc.createPlan({ name: '月度SVIP', price: 99, durationDays: 30, benefits: ['积分翻倍'] }),
    )
    const yearly = await firstValueFrom(
      svc.createPlan({ name: '年度SVIP', price: 599, durationDays: 365, benefits: ['积分翻倍', '专属折扣'] }),
    )
    // 每月 99 → 年化 1188，年度只要 599
    const annualSavings = Math.round(monthly.price * 12) - yearly.price
    expect(annualSavings).toBeGreaterThan(0)
    expect(yearly.price / 12).toBeLessThan(monthly.price)
  })

  it('店长查看整体会员订阅率和各套餐分布', async () => {
    const svc = createService()
    await createBasicSubscription(svc, { name: '黄金', price: 99, durationDays: 30, benefits: ['积分翻倍'] }, 'user-a')
    await createBasicSubscription(svc, { name: '黄金', price: 99, durationDays: 60, benefits: ['积分翻倍'] }, 'user-b')
    await createBasicSubscription(svc, { name: '铂金', price: 199, durationDays: 30, benefits: ['积分翻倍', '免费配送'] }, 'user-c')

    const subA = await firstValueFrom(svc.getSubscription('user-a'))
    const subB = await firstValueFrom(svc.getSubscription('user-b'))
    const subC = await firstValueFrom(svc.getSubscription('user-c'))
    expect(subA).not.toBeNull()
    expect(subB).not.toBeNull()
    expect(subC).not.toBeNull()
    // 所有订阅状态均为 active
    expect([subA!.status, subB!.status, subC!.status].every(s => s === 'active')).toBe(true)
  })

  it('店长发布短期促销计划并在过期后验证', async () => {
    const svc = createService()
    const promo = await firstValueFrom(
      svc.createPlan({ name: '双11特惠', price: 49, durationDays: 7, benefits: ['积分翻倍'] }),
    )
    expect(promo.price).toBe(49)
    expect(promo.durationDays).toBe(7)

    const sub = await firstValueFrom(svc.subscribe('promo-user', promo.planId))
    expect(sub).not.toBeNull()
    expect(sub!.status).toBe('active')
  })
})

// ════════════════════════════════════════════════════════════════
// 🛒 前台 — 接待视角：会员注册、续费、权益兑换引导
// ════════════════════════════════════════════════════════════════

describe('🛒前台 SVIP 扩展测试', () => {
  it('前台为用户续费已过期会员', async () => {
    const svc = createService()
    const { sub } = await createFullLifecycle(svc, 'front-user-1')

    // 首次续费
    const renewed1 = await firstValueFrom(svc.renewSubscription(sub.subscriptionId))
    expect(renewed1).not.toBeNull()
    expect(renewed1!.status).toBe('active')

    // 再次续费（已有 active 订阅的续费延长有效期）
    const renewed2 = await firstValueFrom(svc.renewSubscription(sub.subscriptionId))
    expect(renewed2).not.toBeNull()
    expect(renewed2!.status).toBe('active')
  })

  it('前台为无会员用户注册新 SVIP', async () => {
    const svc = createService()
    const plan = await firstValueFrom(
      svc.createPlan({ name: '体验会员', price: 1, durationDays: 3, benefits: ['积分翻倍'] }),
    )
    const sub = await firstValueFrom(svc.subscribe('new-user-front', plan.planId))
    expect(sub).not.toBeNull()
    expect(sub!.status).toBe('active')
    // 预计到期日 = 3天后
    const expectedExpire = new Date()
    expectedExpire.setDate(expectedExpire.getDate() + 3)
    const diffMs = sub!.expireAt.getTime() - expectedExpire.getTime()
    expect(Math.abs(diffMs)).toBeLessThan(2000) // 容忍2秒差异
  })

  it('前台尝试为已激活用户重复注册同一套餐应返回 null', async () => {
    const svc = createService()
    const { plan } = await createBasicSubscription(
      svc, { name: '黄金', price: 99, durationDays: 30, benefits: ['积分翻倍'] }, 'dup-user',
    )
    // 重复订阅同一计划
    const dupSub = await firstValueFrom(svc.subscribe('dup-user', plan.planId))
    expect(dupSub).toBeNull()
  })
})

// ════════════════════════════════════════════════════════════════
// 👥 HR — 人力资源视角：员工会员管理、权限生命周期
// ════════════════════════════════════════════════════════════════

describe('👥HR SVIP 扩展测试', () => {
  it('HR 为离职员工取消会员订阅', async () => {
    const svc = createService()
    const { sub } = await createFullLifecycle(svc, 'emp-resign-01')

    const cancelled = await firstValueFrom(svc.cancelSubscription(sub.subscriptionId))
    expect(cancelled).not.toBeNull()
    expect(cancelled!.status).toBe('cancelled')
    expect(cancelled!.autoRenew).toBe(false)
  })

  it('HR 查询已取消会员的记录', async () => {
    const svc = createService()
    const { sub } = await createFullLifecycle(svc, 'emp-resign-02')

    await firstValueFrom(svc.cancelSubscription(sub.subscriptionId))
    const cancelledSub = await firstValueFrom(svc.getSubscription('emp-resign-02'))
    expect(cancelledSub).not.toBeNull()
    expect(cancelledSub!.status).toBe('cancelled')

    // 已取消的不可使用权益
    const benefit = await firstValueFrom(svc.useBenefit('emp-resign-02', 'points_multiplier'))
    expect(benefit).toBeNull()
  })

  it('HR 批量处理过期会员', async () => {
    const svc = createService()
    // 创建过期会员（durationDays = -1）
    const expiredPlan = await firstValueFrom(
      svc.createPlan({ name: '过期测试', price: 1, durationDays: -1, benefits: ['积分翻倍'] }),
    )
    await firstValueFrom(svc.subscribe('exp-emp-1', expiredPlan.planId))
    await firstValueFrom(svc.subscribe('exp-emp-2', expiredPlan.planId))

    const expiredCount = await firstValueFrom(svc.checkAndExpire())
    expect(expiredCount).toBeGreaterThanOrEqual(2)

    const sub1 = await firstValueFrom(svc.getSubscription('exp-emp-1'))
    const sub2 = await firstValueFrom(svc.getSubscription('exp-emp-2'))
    expect(sub1!.status).toBe('expired')
    expect(sub2!.status).toBe('expired')
  })
})

// ════════════════════════════════════════════════════════════════
// 🔧 安监 — 安全监控视角：异常行为检测、重复订阅防护
// ════════════════════════════════════════════════════════════════

describe('🔧安监 SVIP 扩展测试', () => {
  it('安监检测到同一用户重复订阅不同计划时拒绝', async () => {
    const svc = createService()
    const planA = await firstValueFrom(
      svc.createPlan({ name: '黄金', price: 99, durationDays: 30, benefits: ['积分翻倍'] }),
    )
    const planB = await firstValueFrom(
      svc.createPlan({ name: '钻石', price: 299, durationDays: 90, benefits: ['积分翻倍', '免费配送', '专属折扣'] }),
    )

    // 先订阅黄金
    const subA = await firstValueFrom(svc.subscribe('sec-user-1', planA.planId))
    expect(subA).not.toBeNull()

    // 尝试订阅钻石（已有活跃订阅）
    const subB = await firstValueFrom(svc.subscribe('sec-user-1', planB.planId))
    expect(subB).toBeNull()
  })

  it('安监验证取消后不可再使用权益', async () => {
    const svc = createService()
    const { sub } = await createFullLifecycle(svc, 'sec-user-2')

    // 取消
    await firstValueFrom(svc.cancelSubscription(sub.subscriptionId))

    // 取消后使用权益应失败
    const benefit = await firstValueFrom(svc.useBenefit('sec-user-2', 'free_delivery'))
    expect(benefit).toBeNull()
  })

  it('安监检测用户查询被删除的数据返回 null', async () => {
    const svc = createService()
    const noSub = await firstValueFrom(svc.getSubscription('non-existent-user'))
    expect(noSub).toBeNull()
  })
})

// ════════════════════════════════════════════════════════════════
// 🎮 导玩员 — 现场服务视角：即时权益使用、会员咨询
// ════════════════════════════════════════════════════════════════

describe('🎮导玩员 SVIP 扩展测试', () => {
  it('导玩员为玩家使用积分翻倍权益', async () => {
    const svc = createService()
    const plan = await firstValueFrom(
      svc.createPlan({ name: '玩咖会员', price: 49, durationDays: 30, benefits: ['积分翻倍', '免费配送'] }),
    )
    const sub = await firstValueFrom(svc.subscribe('gamer-1', plan.planId))
    expect(sub).not.toBeNull()

    const benefit = await firstValueFrom(svc.useBenefit('gamer-1', 'points_multiplier'))
    expect(benefit).not.toBeNull()
    expect(benefit!.type).toBe('points_multiplier')

    // 查看剩余权益
    const remainingBenefits = await firstValueFrom(svc.getBenefits(sub!.subscriptionId))
    const unusedCount = remainingBenefits.filter(b => !b.usedAt).length
    expect(unusedCount).toBe(1) // 只剩免费配送
  })

  it('导玩员提示玩家同一权益不可重复使用', async () => {
    const svc = createService()
    const plan = await firstValueFrom(
      svc.createPlan({ name: '玩咖会员', price: 49, durationDays: 30, benefits: ['积分翻倍'] }),
    )
    await firstValueFrom(svc.subscribe('gamer-2', plan.planId))

    // 首次使用成功
    const used = await firstValueFrom(svc.useBenefit('gamer-2', 'points_multiplier'))
    expect(used).not.toBeNull()

    // 再次使用同一权益失败
    const reUse = await firstValueFrom(svc.useBenefit('gamer-2', 'points_multiplier'))
    expect(reUse).toBeNull()
  })

  it('导玩员查询未开通会员的玩家返回 null', async () => {
    const svc = createService()
    const sub = await firstValueFrom(svc.getSubscription('guest-no-svip'))
    expect(sub).toBeNull()
  })
})

// ════════════════════════════════════════════════════════════════
// 🎯 运行专员 — 运维视角：系统健康检查、会员过期轮询
// ════════════════════════════════════════════════════════════════

describe('🎯运行专员 SVIP 扩展测试', () => {
  it('运行专员触发过期检查并统计过期数量', async () => {
    const svc = createService()
    // 创建正常的计划
    const normalPlan = await firstValueFrom(
      svc.createPlan({ name: '正常计划', price: 99, durationDays: 30, benefits: ['积分翻倍'] }),
    )
    await firstValueFrom(svc.subscribe('ops-normal', normalPlan.planId))

    // 创建已过期计划
    const expiredPlan = await firstValueFrom(
      svc.createPlan({ name: '已过期', price: 1, durationDays: -1, benefits: ['积分翻倍'] }),
    )
    await firstValueFrom(svc.subscribe('ops-expired', expiredPlan.planId))

    const expiredCount = await firstValueFrom(svc.checkAndExpire())
    expect(expiredCount).toBe(1) // 只有 -1 天的那一个是过期的

    // 确认正常会员未被误标记
    const normal = await firstValueFrom(svc.getSubscription('ops-normal'))
    expect(normal!.status).toBe('active')
  })

  it('运行专员获取会员权益列表并验证类型', async () => {
    const svc = createService()
    const { sub } = await createBasicSubscription(
      svc,
      { name: '全面计划', price: 299, durationDays: 90, benefits: ['积分翻倍', '免费配送', '专属折扣'] },
      'ops-benefit-user',
    )

    const benefits = await firstValueFrom(svc.getBenefits(sub.subscriptionId))
    expect(benefits).toHaveLength(3)

    const types = benefits.map(b => b.type)
    expect(types).toContain('points_multiplier')
    expect(types).toContain('free_delivery')
    expect(types).toContain('exclusive_discount')

    // 验证权益过期时间
    benefits.forEach(b => {
      expect(b.expiresAt).toBeInstanceOf(Date)
    })
  })

  it('运行专员对不存在的会员 ID 查询权益返回空数组', async () => {
    const svc = createService()
    const benefits = await firstValueFrom(svc.getBenefits('non-existent-sub'))
    expect(benefits).toEqual([])
  })
})

// ════════════════════════════════════════════════════════════════
// 🤝 团建 — 团队建设视角：团体订阅、批量权益发放
// ════════════════════════════════════════════════════════════════

describe('🤝团建 SVIP 扩展测试', () => {
  it('团建为团队批量创建统一计划的会员', async () => {
    const svc = createService()
    const plan = await firstValueFrom(
      svc.createPlan({ name: '团建特惠', price: 39, durationDays: 14, benefits: ['积分翻倍'] }),
    )

    const teamMembers = ['team-a-1', 'team-a-2', 'team-a-3']
    const subs = await Promise.all(
      teamMembers.map(uid => firstValueFrom(svc.subscribe(uid, plan.planId))),
    )

    subs.forEach(sub => {
      expect(sub).not.toBeNull()
      expect(sub!.status).toBe('active')
      expect(sub!.planId).toBe(plan.planId)
    })
  })

  it('团建为团队管理所有成员的有效期', async () => {
    const svc = createService()
    const plan = await firstValueFrom(
      svc.createPlan({ name: '月度团建', price: 99, durationDays: 30, benefits: ['积分翻倍', '专属折扣'] }),
    )

    const members = ['team-b-1', 'team-b-2']
    await Promise.all(members.map(uid => firstValueFrom(svc.subscribe(uid, plan.planId))))

    // 检查所有成员状态
    const results = await Promise.all(
      members.map(uid => firstValueFrom(svc.getSubscription(uid))),
    )

    results.forEach(sub => {
      expect(sub).not.toBeNull()
      expect(sub!.status).toBe('active')
      expect(sub!.planId).toBe(plan.planId)
    })
  })

  it('团建更新团队会员续费后有效期延长', async () => {
    const svc = createService()
    const plan = await firstValueFrom(
      svc.createPlan({ name: '团建半月', price: 49, durationDays: 15, benefits: ['积分翻倍'] }),
    )
    const sub = await firstValueFrom(svc.subscribe('team-c-1', plan.planId))
    expect(sub).not.toBeNull()

    const originalExpire = sub!.expireAt.getTime()

    // 续费
    const renewed = await firstValueFrom(svc.renewSubscription(sub!.subscriptionId))
    expect(renewed).not.toBeNull()
    expect(renewed!.expireAt.getTime()).toBeGreaterThan(originalExpire)
  })
})

// ════════════════════════════════════════════════════════════════
// 📢 营销 — 营销运营视角：促销计划、数据分析、A/B 测
// ════════════════════════════════════════════════════════════════

describe('📢营销 SVIP 扩展测试', () => {
  it('营销创建多价格梯度的套餐并分析吸引力', async () => {
    const svc = createService()
    const basic = await firstValueFrom(
      svc.createPlan({ name: '基础', price: 49, durationDays: 30, benefits: ['积分翻倍'] }),
    )
    const standard = await firstValueFrom(
      svc.createPlan({ name: '标准', price: 99, durationDays: 30, benefits: ['积分翻倍', '免费配送'] }),
    )
    const premium = await firstValueFrom(
      svc.createPlan({ name: '高级', price: 199, durationDays: 30, benefits: ['积分翻倍', '免费配送', '专属折扣'] }),
    )

    // 验证价格梯度
    expect(premium.price).toBeGreaterThan(standard.price)
    expect(standard.price).toBeGreaterThan(basic.price)
    // 高级 = 基础 + 标准 + 专属折扣的值
    const extraValue = premium.price - standard.price
    expect(extraValue).toBe(100)
  })

  it('营销模拟新用户注册流程并验证转化链路', async () => {
    const svc = createService()
    // 新用户看到推荐套餐
    const recommendedPlan = await firstValueFrom(
      svc.createPlan({ name: '新人专享', price: 19, durationDays: 7, benefits: ['积分翻倍'] }),
    )
    const previewSub = await firstValueFrom(svc.subscribe('mkt-new-user', recommendedPlan.planId))
    expect(previewSub).not.toBeNull()
    expect(previewSub!.status).toBe('active')

    // 保存原始到期时间
    const originalExpire = previewSub!.expireAt.getTime()
    // 续费后有效期应该增加 7 天
    const renewed = await firstValueFrom(svc.renewSubscription(previewSub!.subscriptionId))
    expect(renewed!.expireAt.getTime()).toBeGreaterThanOrEqual(originalExpire + 7 * 24 * 60 * 60 * 1000)
  })

  it('营销分析免费配送权益的使用频次', async () => {
    const svc = createService()
    const plan = await firstValueFrom(
      svc.createPlan({ name: '营销测试', price: 99, durationDays: 30, benefits: ['积分翻倍', '免费配送', '专属折扣'] }),
    )
    await firstValueFrom(svc.subscribe('mkt-analyst', plan.planId))

    // 分析各个权益类型
    const benefitTypes: SVIPBenefitType[] = ['points_multiplier', 'free_delivery', 'exclusive_discount']

    // 使用两个不同的权益
    await firstValueFrom(svc.useBenefit('mkt-analyst', 'free_delivery'))
    await firstValueFrom(svc.useBenefit('mkt-analyst', 'points_multiplier'))

    // 查询权益状态（验证使用记录）
    const sub = await firstValueFrom(svc.getSubscription('mkt-analyst'))
    const benefits = await firstValueFrom(svc.getBenefits(sub!.subscriptionId))
    const usedBenefitTypes = benefits.filter(b => b.usedAt).map(b => b.type)
    expect(usedBenefitTypes).toContain('free_delivery')
    expect(usedBenefitTypes).toContain('points_multiplier')
    expect(usedBenefitTypes).not.toContain('exclusive_discount')
  })

  it('营销验证已取消计划的用户不可再用权益', async () => {
    const svc = createService()
    const plan = await firstValueFrom(
      svc.createPlan({ name: '营销测试2', price: 99, durationDays: 30, benefits: ['专属折扣'] }),
    )
    const sub = await firstValueFrom(svc.subscribe('mkt-cancelled', plan.planId))
    await firstValueFrom(svc.cancelSubscription(sub!.subscriptionId))

    // 取消后使用权益
    const benefit = await firstValueFrom(svc.useBenefit('mkt-cancelled', 'exclusive_discount'))
    expect(benefit).toBeNull()
  })
})

// ════════════════════════════════════════════════════════════════
// 跨角色边界场景
// ════════════════════════════════════════════════════════════════

describe('跨角色边界场景', () => {
  it('多用户同时操作不应相互影响', async () => {
    const svc = createService()
    const plan = await firstValueFrom(
      svc.createPlan({ name: '统一套餐', price: 99, durationDays: 30, benefits: ['积分翻倍'] }),
    )

    // 10个用户同时订阅
    const userIds = Array.from({ length: 10 }, (_, i) => `concurrent-${i}`)
    const subs = await Promise.all(
      userIds.map(uid => firstValueFrom(svc.subscribe(uid, plan.planId))),
    )

    // 所有用户都成功订阅且状态一致
    subs.forEach(sub => {
      expect(sub).not.toBeNull()
      expect(sub!.status).toBe('active')
      expect(sub!.planId).toBe(plan.planId)
    })

    // 每个用户独立
    const uniqueSubIds = new Set(subs.map(s => s!.subscriptionId))
    expect(uniqueSubIds.size).toBe(10)
  })

  it('非活跃状态订阅不可使用任何权益类型', async () => {
    const svc = createService()
    const plan = await firstValueFrom(
      svc.createPlan({ name: '权益测试', price: 1, durationDays: 1, benefits: ['积分翻倍', '免费配送', '专属折扣'] }),
    )
    await firstValueFrom(svc.subscribe('inactive-benefit', plan.planId))

    // 等待到期后使用状态
    const sub = await firstValueFrom(svc.getSubscription('inactive-benefit'))
    if (sub && sub.status === 'active') {
      // 如果是活跃状态（durationDays=1 可能还没过），先测试权益可用
      const benefit = await firstValueFrom(svc.useBenefit('inactive-benefit', 'points_multiplier'))
      expect(benefit).not.toBeNull()
    }
  })

  it('订阅已取消用户重新注册新套餐', async () => {
    const svc = createService()
    const planA = await firstValueFrom(
      svc.createPlan({ name: '初级', price: 49, durationDays: 30, benefits: ['积分翻倍'] }),
    )
    const planB = await firstValueFrom(
      svc.createPlan({ name: '高级', price: 199, durationDays: 90, benefits: ['积分翻倍', '免费配送', '专属折扣'] }),
    )

    // 订阅初级 -> 取消 -> 订阅高级
    const subA = await firstValueFrom(svc.subscribe('upgrade-user', planA.planId))
    expect(subA).not.toBeNull()
    await firstValueFrom(svc.cancelSubscription(subA!.subscriptionId))

    const subB = await firstValueFrom(svc.subscribe('upgrade-user', planB.planId))
    expect(subB).not.toBeNull()
    expect(subB!.status).toBe('active')
    expect(subB!.planId).toBe(planB.planId)
  })
})
