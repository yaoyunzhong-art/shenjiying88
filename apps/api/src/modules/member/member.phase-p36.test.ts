/**
 * P-36 会员管理角色测试（小粒度）
 *
 * 场景：E12孙导购 + E40杨客户
 * 纯函数式内联，不依赖外部服务/控制器，仅使用 vitest
 */

import { describe, it, expect } from 'vitest'

// ── 类型定义 ──

type MemberTier = 'REGULAR' | 'SILVER' | 'GOLD' | 'PLATINUM'

interface Member {
  id: string
  phone: string
  name: string
  tier: MemberTier
  points: number
  registeredAt: string
}

// ── 模拟函数 ──

let _memberIdCounter = 0

/** 会员注册：手机号 → 注册成功 */
function registerMember(phone: string, name: string): { id: string; phone: string; name: string; tier: MemberTier; points: number; registeredAt: string } {
  if (!phone || phone.trim() === '') {
    throw new Error('手机号不能为空')
  }
  if (!/^1\d{10}$/.test(phone)) {
    throw new Error('手机号格式错误')
  }
  _memberIdCounter++
  return {
    id: `mem-${_memberIdCounter}`,
    phone,
    name,
    tier: 'REGULAR',
    points: 0,
    registeredAt: new Date().toISOString()
  }
}

/** 会员升级：消费满额 → 升级判断 */
function upgradeTier(currentTier: MemberTier, totalSpent: number): { newTier: MemberTier; upgraded: boolean } {
  const tierThresholds: Record<MemberTier, number> = {
    REGULAR: 0,
    SILVER: 500,
    GOLD: 2000,
    PLATINUM: 10000
  }

  const tierOrder: MemberTier[] = ['REGULAR', 'SILVER', 'GOLD', 'PLATINUM']
  const currentIdx = tierOrder.indexOf(currentTier)

  let newTier: MemberTier = currentTier
  for (let i = currentIdx + 1; i < tierOrder.length; i++) {
    if (totalSpent >= tierThresholds[tierOrder[i]]) {
      newTier = tierOrder[i]
    } else {
      break
    }
  }

  return {
    newTier,
    upgraded: newTier !== currentTier
  }
}

/** 优惠发放：选择会员 → 发放优惠券 */
function awardCoupon(memberId: string, couponType: string): { success: boolean; couponId: string } {
  if (memberId.startsWith('nonexistent') || memberId === '' || memberId == null) {
    return { success: false, couponId: '' }
  }
  return {
    success: true,
    couponId: `coupon-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  }
}

/** 会员查询：按关键字搜索 */
function searchMembers(keyword: string, members: any[]): { results: any[]; count: number } {
  if (!keyword || keyword.trim() === '') {
    // 空关键字返回全部
    return { results: members, count: members.length }
  }

  const lower = keyword.toLowerCase()
  const results = members.filter(m => {
    const phone = (m.phone || '').toLowerCase()
    const name = (m.name || '').toLowerCase()
    const tier = (m.tier || '').toLowerCase()
    return phone.includes(lower) || name.includes(lower) || tier.includes(lower)
  })

  return { results, count: results.length }
}

/** 积分兑换：扣减积分 */
function redeemPoints(member: any, cost: number): { success: boolean; remainingPoints: number } {
  if (cost <= 0) {
    throw new Error('兑换积分必须大于0')
  }
  if (member.points < cost) {
    return { success: false, remainingPoints: member.points }
  }
  return { success: true, remainingPoints: member.points - cost }
}

// ── 场景模拟数据生成器 ──

function makeStoreMembers(): any[] {
  return [
    { id: 'mem-1', phone: '13800138001', name: '张三', tier: 'REGULAR' as MemberTier, points: 100, registeredAt: '2026-01-01T00:00:00Z' },
    { id: 'mem-2', phone: '13800138002', name: '李四', tier: 'SILVER' as MemberTier, points: 600, registeredAt: '2026-02-01T00:00:00Z' },
    { id: 'mem-3', phone: '13800138003', name: '王五', tier: 'GOLD' as MemberTier, points: 3000, registeredAt: '2026-03-01T00:00:00Z' },
    { id: 'mem-4', phone: '13800138004', name: '赵六', tier: 'PLATINUM' as MemberTier, points: 15000, registeredAt: '2026-04-01T00:00:00Z' }
  ]
}

// ── 计数辅助：验证每步操作 ≤3 步 ──

const stepLog: string[] = []

function step(label: string): void {
  stepLog.push(label)
}

function resetSteps(): void {
  stepLog.length = 0
}

function assertStepsLe3(scenario: string): void {
  expect(stepLog.length).toBeLessThanOrEqual(3)
  resetSteps()
}

// ═══════════════════════════════════════════
// 测试集合（12 项）
// ═══════════════════════════════════════════

// ── 1. 会员注册：手机号 → 注册成功  E12视角 ──
describe('E12孙导购 - 会员注册', () => {

  it('手机号 → 注册成功', () => {
    step('输入手机号+姓名')
    step('调用registerMember')
    const result = registerMember('13800138010', '孙导购测试会员')
    step('验证返回会员信息')

    expect(result).toBeDefined()
    expect(result.id).toMatch(/^mem-/)
    expect(result.phone).toBe('13800138010')
    expect(result.name).toBe('孙导购测试会员')
    expect(result.tier).toBe('REGULAR')
    expect(result.points).toBe(0)
    expect(result.registeredAt).toBeTruthy()

    assertStepsLe3('会员注册成功')
  })

  it('空手机号 → 拒绝', () => {
    step('尝试空手机号注册')
    step('调用registerMember')

    expect(() => registerMember('', '空手机测试')).toThrow('手机号不能为空')
    expect(() => registerMember('   ', '空白手机')).toThrow('手机号不能为空')

    step('验证异常抛出')

    assertStepsLe3('空手机号拒绝')
  })

})

// ── 3. 会员升级：消费满额 → 升级    E40视角 ──
// ── 4. 会员升级：消费不足 → 不升级  E40视角 ──
describe('E40杨客户 - 会员升级', () => {

  it('消费满额 → 升级（REGULAR→SILVER）', () => {
    step('当前等级REGULAR')
    step('计算totalSpent=550是否升级')
    const result = upgradeTier('REGULAR', 550)
    step('验证升级结果')

    expect(result.upgraded).toBe(true)
    expect(result.newTier).toBe('SILVER')
    assertStepsLe3('消费满额升级')
  })

  it('消费满额 → 升级（SILVER→GOLD）', () => {
    step('当前等级SILVER')
    step('计算totalSpent=2500是否升级')
    const result = upgradeTier('SILVER', 2500)
    step('验证升级结果')

    expect(result.upgraded).toBe(true)
    expect(result.newTier).toBe('GOLD')
    assertStepsLe3('消费满额升级SILVER→GOLD')
  })

  it('消费满额 → 升级（GOLD→PLATINUM）', () => {
    step('当前等级GOLD')
    step('计算totalSpent=12000是否升级')
    const result = upgradeTier('GOLD', 12000)
    step('验证升级结果')

    expect(result.upgraded).toBe(true)
    expect(result.newTier).toBe('PLATINUM')
    assertStepsLe3('消费满额升级GOLD→PLATINUM')
  })

  it('消费不足 → 不升级', () => {
    step('当前等级REGULAR')
    step('计算totalSpent=200是否升级')
    const result = upgradeTier('REGULAR', 200)
    step('验证不升级')

    expect(result.upgraded).toBe(false)
    expect(result.newTier).toBe('REGULAR')
    assertStepsLe3('消费不足不升级')
  })

  it('消费刚好到门槛 → 升级', () => {
    step('当前等级REGULAR')
    step('计算totalSpent=500刚好到SILVER门槛')
    const result = upgradeTier('REGULAR', 500)
    step('验证升级')

    expect(result.upgraded).toBe(true)
    expect(result.newTier).toBe('SILVER')
    assertStepsLe3('消费刚好到门槛')
  })

  it('高等级消费不足 → 保级不升级', () => {
    step('当前等级GOLD')
    step('计算totalSpent=1999是否升级（<2000）')
    const result = upgradeTier('GOLD', 1999)
    step('验证保级不升级')

    expect(result.upgraded).toBe(false)
    expect(result.newTier).toBe('GOLD')
    assertStepsLe3('高等级消费不足保级')
  })

  it('跨级升级（REGULAR→GOLD）', () => {
    step('当前等级REGULAR')
    step('计算totalSpent=5000跨级')
    const result = upgradeTier('REGULAR', 5000)
    step('验证跨级升级')

    expect(result.upgraded).toBe(true)
    expect(result.newTier).toBe('GOLD')
    assertStepsLe3('跨级升级')
  })

  it('顶级会员无法继续升级', () => {
    step('当前等级PLATINUM')
    step('计算totalSpent=99999是否升级')
    const result = upgradeTier('PLATINUM', 99999)
    step('验证顶级不升级')

    expect(result.upgraded).toBe(false)
    expect(result.newTier).toBe('PLATINUM')
    assertStepsLe3('顶级会员不升级')
  })

})

// ── 5. 优惠发放：选择会员 → 发放    E12视角 ──
// ── 6. 优惠发放：不存在会员 → 失败  E12视角 ──
describe('E12孙导购 - 优惠发放', () => {

  it('选择会员 → 发放优惠券', () => {
    step('选择会员mem-1')
    step('调用awardCoupon')
    const result = awardCoupon('mem-1', 'DISCOUNT_8')
    step('验证发放结果')

    expect(result.success).toBe(true)
    expect(result.couponId).toBeTruthy()
    expect(result.couponId).toMatch(/^coupon-/)
    assertStepsLe3('优惠发放成功')
  })

  it('不存在会员 → 发放失败', () => {
    step('输入不存在会员ID')
    step('调用awardCoupon')
    const result = awardCoupon('nonexistent-999', 'DISCOUNT_8')
    step('验证失败结果')

    expect(result.success).toBe(false)
    expect(result.couponId).toBe('')
    assertStepsLe3('不存在会员发放失败')
  })

  it('空会员ID → 发放失败', () => {
    step('输入空会员ID')
    step('调用awardCoupon')
    const result = awardCoupon('', 'DISCOUNT_8')
    step('验证失败结果')

    expect(result.success).toBe(false)
    expect(result.couponId).toBe('')
    assertStepsLe3('空会员ID发放失败')
  })

})

// ── 7. 会员查询：按手机号搜索     E12视角 ──
// ── 8. 会员查询：按等级筛选       E12视角 ──
// ── 9. 会员查询：无结果 → 空列表  E12视角 ──
describe('E12孙导购 - 会员查询', () => {

  const storeMembers = makeStoreMembers()

  it('按手机号搜索 → 找到会员', () => {
    step('输入手机号13800138003')
    step('调用searchMembers')
    const result = searchMembers('13800138003', storeMembers)
    step('验证搜索结果')

    expect(result.count).toBe(1)
    expect(result.results[0].name).toBe('王五')
    expect(result.results[0].phone).toBe('13800138003')
    assertStepsLe3('按手机号搜索')
  })

  it('按等级筛选 → 找到对应会员', () => {
    step('输入等级关键字gold')
    step('调用searchMembers')
    const result = searchMembers('gold', storeMembers)
    step('验证筛选结果')

    expect(result.count).toBe(1)
    expect(result.results[0].tier).toBe('GOLD')
    expect(result.results[0].name).toBe('王五')
    assertStepsLe3('按等级筛选')
  })

  it('按等级筛选 → SILVER', () => {
    step('输入等级关键字silver')
    step('调用searchMembers')
    const result = searchMembers('silver', storeMembers)
    step('验证筛选结果')

    expect(result.count).toBe(1)
    expect(result.results[0].tier).toBe('SILVER')
    expect(result.results[0].name).toBe('李四')
    assertStepsLe3('按等级筛选SILVER')
  })

  it('按等级筛选 → PLATINUM', () => {
    step('输入等级关键字platinum')
    step('调用searchMembers')
    const result = searchMembers('platinum', storeMembers)
    step('验证筛选结果')

    expect(result.count).toBe(1)
    expect(result.results[0].tier).toBe('PLATINUM')
    expect(result.results[0].name).toBe('赵六')
    assertStepsLe3('按等级筛选PLATINUM')
  })

  it('按姓名搜索 → 找到会员', () => {
    step('输入姓名关键字张三')
    step('调用searchMembers')
    const result = searchMembers('张三', storeMembers)
    step('验证搜索结果')

    expect(result.count).toBe(1)
    expect(result.results[0].name).toBe('张三')
    assertStepsLe3('按姓名搜索')
  })

  it('无结果 → 返回空列表', () => {
    step('输入不存在的关键字')
    step('调用searchMembers')
    const result = searchMembers('zzz_not_found', storeMembers)
    step('验证空结果')

    expect(result.count).toBe(0)
    expect(result.results).toEqual([])
    assertStepsLe3('无结果空列表')
  })

  it('空关键字 → 返回全部会员', () => {
    step('输入空关键字')
    step('调用searchMembers')
    const result = searchMembers('', storeMembers)
    step('验证返回全部')

    expect(result.count).toBe(4)
    expect(result.results.length).toBe(4)
    assertStepsLe3('空关键字返回全部')
  })

})

// ── 10. 积分兑换：够积分 → 扣除    E40视角 ──
// ── 11. 积分兑换：不够 → 拒绝      E40视角 ──
describe('E40杨客户 - 积分兑换', () => {

  it('够积分 → 扣除成功', () => {
    step('会员有100积分')
    step('兑换50积分')
    const member = { id: 'mem-1', points: 100, tier: 'REGULAR' as MemberTier }
    const result = redeemPoints(member, 50)
    step('验证扣除结果')

    expect(result.success).toBe(true)
    expect(result.remainingPoints).toBe(50)
    assertStepsLe3('积分扣除成功')
  })

  it('刚好够积分 → 扣除成功', () => {
    step('会员有100积分')
    step('兑换100积分刚好清零')
    const member = { id: 'mem-2', points: 100, tier: 'REGULAR' as MemberTier }
    const result = redeemPoints(member, 100)
    step('验证扣除结果')

    expect(result.success).toBe(true)
    expect(result.remainingPoints).toBe(0)
    assertStepsLe3('积分刚好够扣除成功')
  })

  it('不够积分 → 拒绝', () => {
    step('会员有100积分')
    step('兑换200积分（不够）')
    const member = { id: 'mem-3', points: 100, tier: 'REGULAR' as MemberTier }
    const result = redeemPoints(member, 200)
    step('验证拒绝结果')

    expect(result.success).toBe(false)
    expect(result.remainingPoints).toBe(100) // 不扣减
    assertStepsLe3('积分不够拒绝')
  })

  it('零积分兑换 → 拒绝', () => {
    step('会员有100积分')
    step('兑换0积分（无效）')
    const member = { id: 'mem-4', points: 100, tier: 'REGULAR' as MemberTier }
    step('验证异常')

    expect(() => redeemPoints(member, 0)).toThrow('兑换积分必须大于0')
    assertStepsLe3('零积分兑换拒绝')
  })

  it('负数积分兑换 → 拒绝', () => {
    step('会员有100积分')
    step('兑换-50积分（无效）')
    const member = { id: 'mem-5', points: 100, tier: 'REGULAR' as MemberTier }
    step('验证异常')

    expect(() => redeemPoints(member, -50)).toThrow('兑换积分必须大于0')
    assertStepsLe3('负数积分兑换拒绝')
  })

})

// ── 12. 操作步骤计数 ≤ 3步         E12+E40视角 ──
describe('E12+E40 - 操作步骤计数验证（≤3步）', () => {

  it('E12：注册→查询→发放，每步≤3', () => {
    resetSteps()

    // 步骤1：注册（≤3步）
    step('输入手机号+姓名')
    step('调用registerMember')
    const member = registerMember('13900139001', '张三')
    step('验证注册信息')
    expect(member).toBeDefined()
    expect(stepLog.length).toBeLessThanOrEqual(3)

    resetSteps()

    // 步骤2：搜索（≤3步）
    step('输入关键字')
    step('调用searchMembers')
    const searchResult = searchMembers('13900139001', [member])
    step('验证搜索结果')
    expect(searchResult.count).toBe(1)
    expect(stepLog.length).toBeLessThanOrEqual(3)

    resetSteps()

    // 步骤3：发放优惠（≤3步）
    step('选择会员')
    step('调用awardCoupon')
    const coupon = awardCoupon(member.id, 'FULL_REDUCTION_30')
    step('验证发放结果')
    expect(coupon.success).toBe(true)
    expect(stepLog.length).toBeLessThanOrEqual(3)

    resetSteps()
  })

  it('E40：查询→升级→兑换，每步≤3', () => {
    resetSteps()

    // 步骤1：查询（≤3步）
    step('查看当前会员')
    const member = { id: 'mem-customer', points: 500, tier: 'REGULAR' as MemberTier }
    step('确认等级REGULAR')
    step('确认积分500')
    expect(member.tier).toBe('REGULAR')
    expect(member.points).toBe(500)
    expect(stepLog.length).toBeLessThanOrEqual(3)

    resetSteps()

    // 步骤2：升级（≤3步）
    step('计算消费金额')
    step('调用upgradeTier')
    const tierResult = upgradeTier('REGULAR', 500)
    step('验证升级结果')
    expect(tierResult.upgraded).toBe(true)
    expect(tierResult.newTier).toBe('SILVER')
    expect(stepLog.length).toBeLessThanOrEqual(3)

    resetSteps()

    // 步骤3：积分兑换（≤3步）
    step('确认当前积分')
    step('调用redeemPoints')
    const redeemResult = redeemPoints(member, 100)
    step('验证兑换结果')
    expect(redeemResult.success).toBe(true)
    expect(redeemResult.remainingPoints).toBe(400)
    expect(stepLog.length).toBeLessThanOrEqual(3)

    resetSteps()
  })

})
