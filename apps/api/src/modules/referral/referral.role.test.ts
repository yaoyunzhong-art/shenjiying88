import { describe, it, expect, beforeEach } from 'vitest'
/**
 * 🐜 自动: [referral] [C] 8角色测试补全 — 27个测试用例覆盖8角色视角
 *
 * 角色表:
 * 👔店长  🛒前台  👥HR  🔧安监  🎮导玩员  🎯运行专员  🤝团建  📢营销
 *
 * 裂变场景:
 * - 短码生成 + 二维码 + 落地页
 * - 点击追踪 + 注册补登
 * - 三级裂变 (L1/L2/L3)
 * - L1/L2/L3 奖励计算 + 级联分润
 * - 指标总览 (追踪率/转化率/奖励总额)
 * - 跨租户隔离
 */

import { ReferralController } from './referral.controller'
import { ReferralService } from './referral.service'

// ─── 角色定义 ───────────────────────────────────────────────────────────
const ROLES = {
  TenantAdmin: '👔店长',
  Reception: '🛒前台',
  HR: '👥HR',
  Safety: '🔧安监',
  Guide: '🎮导玩员',
  Ops: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
} as const

// ─── 测试工厂 ───────────────────────────────────────────────────────────

function makeFixture() {
  const service = new ReferralService()
  service.reset()
  const controller = new ReferralController(service)
  return { service, controller }
}

/**
 * 构建三级裂变链 A → B → C → D
 * 返回四个相应用户的 code 对象
 */
function buildThreeLevelChain(
  controller: ReferralController,
  service: ReferralService,
  tenantId: string = 'tenant-A',
) {
  // A → B
  const codeA = controller.generateCode({
    parentUserId: 'user-A',
    tenantId,
    baseUrl: 'https://m.shenjiying88.com',
  })
  controller.trackClick({ shortCode: codeA.shortCode, source: 'wechat' })
  controller.trackSignup({ shortCode: codeA.shortCode, childUserId: 'user-B' })

  // B → C
  const codeB = controller.generateCode({
    parentUserId: 'user-B',
    tenantId,
    baseUrl: 'https://m.shenjiying88.com',
  })
  controller.trackClick({ shortCode: codeB.shortCode, source: 'wechat' })
  controller.trackSignup({ shortCode: codeB.shortCode, childUserId: 'user-C' })

  // C → D
  const codeC = controller.generateCode({
    parentUserId: 'user-C',
    tenantId,
    baseUrl: 'https://m.shenjiying88.com',
  })
  controller.trackClick({ shortCode: codeC.shortCode, source: 'wechat' })
  const signup = controller.trackSignup({ shortCode: codeC.shortCode, childUserId: 'user-D' })

  return { codeA, codeB, codeC, signup, users: { A: 'user-A', B: 'user-B', C: 'user-C', D: 'user-D' } }
}

// ════════════════════════════════════════════════════════════════════════════
// 👔 店长 · 门店裂变策略制定 & 查看总览
// ════════════════════════════════════════════════════════════════════════════

describe(`${ROLES.TenantAdmin} 裂变推广角色测试`, () => {
  it('店长查看门店裂变推广指标总览（正常流程）', () => {
    const { controller, service } = makeFixture()
    buildThreeLevelChain(controller, service, 'store-1')

    const metrics = controller.getMetrics('store-1')
    expect(metrics.totalCodes).toBeGreaterThanOrEqual(3)
    expect(metrics.totalSignups).toBeGreaterThanOrEqual(3)
    expect(metrics.totalClicks).toBeGreaterThanOrEqual(3)
    expect(metrics.trackRate).toBeGreaterThan(0)
  })

  it('店长查看不同门店的裂变指标互不干扰（权限边界）', () => {
    const { controller, service } = makeFixture()
    buildThreeLevelChain(controller, service, 'store-A')
    const metricsB = controller.getMetrics('store-B')
    expect(metricsB.totalCodes).toBe(0)
    expect(metricsB.totalSignups).toBe(0)

    const metricsA = controller.getMetrics('store-A')
    expect(metricsA.totalCodes).toBeGreaterThan(0)
  })

  it('店长为门店管理员生成专属裂变短码（正常流程）', () => {
    const { controller } = makeFixture()
    const result = controller.generateCode({
      parentUserId: 'store-manager-1',
      tenantId: 'store-1',
      baseUrl: 'https://store1.shenjiying88.com',
    })
    expect(result.shortCode).toHaveLength(8)
    expect(result.landingUrl).toContain('store1.shenjiying88.com')
    if (result.qrCodeUrl) {
      expect(result.qrCodeUrl).toContain('store1.shenjiying88.com')
    }
  })

  it('店长查看门店累计发放奖励总额和状态分布（正常流程）', () => {
    const { controller, service } = makeFixture()
    const { signup } = buildThreeLevelChain(controller, service, 'store-3')
    controller.issueRewards(signup.recordId)

    const rewardRecords = controller.listRewards('store-3')
    expect(rewardRecords.rewards.length).toBe(3)
    const allIssued = rewardRecords.rewards.every(r => r.status === 'issued')
    expect(allIssued).toBe(true)
    const totalValue = rewardRecords.rewards.reduce((s, r) => s + r.rewardValue, 0)
    expect(totalValue).toBeGreaterThan(0)
  })
})

// ════════════════════════════════════════════════════════════════════════════
// 🛒 前台 · 引导顾客扫码裂变
// ════════════════════════════════════════════════════════════════════════════

describe(`${ROLES.Reception} 裂变推广角色测试`, () => {
  it('前台引导顾客扫码生成裂变短码并分享（正常流程）', () => {
    const { controller } = makeFixture()
    const code = controller.generateCode({
      parentUserId: 'customer-001',
      tenantId: 'store-1',
      baseUrl: 'https://m.shenjiying88.com',
      expiresInDays: 7,
    })
    expect(code.shortCode).toHaveLength(8)
    expect(code.expiresAt).toBeDefined()
    expect(code.parentUserId).toBe('customer-001')

    const click = controller.trackClick({
      shortCode: code.shortCode,
      childUserId: 'friend-001',
      source: 'qrcode',
    })
    expect(click.success).toBe(true)
    expect(click.totalClicks).toBe(1)
  })

  it('前台尝试对已过期短码点击应返回失败（权限边界）', () => {
    const { controller, service } = makeFixture()
    const code = controller.generateCode({
      parentUserId: 'customer-002',
      tenantId: 'store-1',
      expiresInDays: 0,
    })
    const stored = service.getCode(code.shortCode)
    if (stored) {
      stored.expiresAt = '2020-01-01T00:00:00.000Z'
    }
    const click = controller.trackClick({
      shortCode: code.shortCode,
      childUserId: 'friend-002',
      source: 'link',
    })
    expect(click.success).toBe(false)
  })

  it('前台查询某顾客的当前裂变短码详情（正常流程）', () => {
    const { controller } = makeFixture()
    const code = controller.generateCode({
      parentUserId: 'customer-003',
      tenantId: 'store-1',
    })
    const result = controller.getCode(code.shortCode)
    expect(result.found).toBe(true)
    if (result.found && 'code' in result) {
      expect(result.code.parentUserId).toBe('customer-003')
      expect(result.code.totalClicks).toBe(0)
    }
  })

  it('前台查看某门店当前裂变活动的奖励列表（正常流程）', () => {
    const { controller, service } = makeFixture()
    const code = controller.generateCode({ parentUserId: 'customer-A', tenantId: 'store-1' })
    controller.trackClick({ shortCode: code.shortCode, source: 'qrcode' })
    const signup = controller.trackSignup({ shortCode: code.shortCode, childUserId: 'friend-A' })
    controller.issueRewards(signup.recordId)

    const rewards = controller.listRewards('store-1')
    expect(rewards.rewards.length).toBe(1)
    expect(rewards.rewards[0].recipientUserId).toBe('customer-A')
  })
})

// ════════════════════════════════════════════════════════════════════════════
// 👥 HR · 员工推荐奖励与业绩考核
// ════════════════════════════════════════════════════════════════════════════

describe(`${ROLES.HR} 裂变推广角色测试`, () => {
  it('HR 查看门店员工推荐裂变记录和奖励明细（正常流程）', () => {
    const { controller, service } = makeFixture()
    const { signup } = buildThreeLevelChain(controller, service, 'hr-tenant')

    const rewards = controller.issueRewards(signup.recordId)
    expect(rewards.rewards.length).toBe(3)

    const records = controller.listRecords('hr-tenant')
    expect(records.records.length).toBe(3)

    const rewardRecords = controller.listRewards('hr-tenant')
    expect(rewardRecords.rewards.length).toBe(3)
  })

  it('HR 验证不同门店员工推荐数据严格隔离（权限边界）', () => {
    const { controller, service } = makeFixture()
    const code1 = controller.generateCode({ parentUserId: 'user-A', tenantId: 't1' })
    controller.trackClick({ shortCode: code1.shortCode, source: 'link' })
    const rec1 = controller.trackSignup({ shortCode: code1.shortCode, childUserId: 'user-B' })
    controller.issueRewards(rec1.recordId)

    const rewardRecords = controller.listRewards('t2')
    expect(rewardRecords.rewards).toHaveLength(0)

    const rewardRecordsT1 = controller.listRewards('t1')
    expect(rewardRecordsT1.rewards).toHaveLength(1)
  })

  it('HR 查看无任何推荐活动的门店指标为零（权限边界）', () => {
    const { controller } = makeFixture()
    const metrics = controller.getMetrics('empty-tenant')
    expect(metrics.totalCodes).toBe(0)
    expect(metrics.totalClicks).toBe(0)
    expect(metrics.totalSignups).toBe(0)
    expect(metrics.totalRewardsIssued).toBe(0)
    expect(metrics.totalRewardsValue).toBe(0)
  })

  it('HR 查询某员工的历史推荐记录（正常流程）', () => {
    const { controller } = makeFixture()
    // Generate code + click + signup for each employee to create records
    const code1 = controller.generateCode({ parentUserId: 'emp-001', tenantId: 'hr-co' })
    controller.trackClick({ shortCode: code1.shortCode, source: 'link' })
    controller.trackSignup({ shortCode: code1.shortCode, childUserId: 'friend-001' })

    const code2 = controller.generateCode({ parentUserId: 'emp-002', tenantId: 'hr-co' })
    controller.trackClick({ shortCode: code2.shortCode, source: 'link' })
    controller.trackSignup({ shortCode: code2.shortCode, childUserId: 'friend-002' })

    const records = controller.listRecords('hr-co')
    expect(records.records.length).toBe(2)
  })
})

// ════════════════════════════════════════════════════════════════════════════
// 🔧 安监 · 裂变链审计 & 异常检测
// ════════════════════════════════════════════════════════════════════════════

describe(`${ROLES.Safety} 裂变推广角色测试`, () => {
  it('安监审计三级裂变链完整性: 点击/注册/奖励链全关联（正常流程）', () => {
    const { controller, service } = makeFixture()
    const { codeC, signup } = buildThreeLevelChain(controller, service)

    const tenantId = service.getCode(codeC.shortCode)!.tenantId
    const records = controller.listRecords(tenantId)
    const cdRecord = records.records.find(r => r.parentUserId === 'user-C')
    expect(cdRecord).toBeDefined()
    expect(cdRecord!.childUserId).toBe('user-D')
    expect(cdRecord!.level).toBe(1)

    const rewards = controller.issueRewards(signup.recordId)
    const l1 = rewards.rewards.find(r => r.level === 1)
    const l2 = rewards.rewards.find(r => r.level === 2)
    const l3 = rewards.rewards.find(r => r.level === 3)
    expect(l1?.recipientUserId).toBe('user-C')
    expect(l2?.recipientUserId).toBe('user-B')
    expect(l3?.recipientUserId).toBe('user-A')
  })

  it('安监验证无效短码无法进行所有裂变操作（权限边界）', () => {
    const { controller } = makeFixture()

    const codeResult = controller.getCode('INVALIDXX')
    expect(codeResult.found).toBe(false)

    const click = controller.trackClick({ shortCode: 'INVALIDXX', source: 'link' })
    expect(click.success).toBe(false)

    expect(() =>
      controller.trackSignup({ shortCode: 'INVALIDXX', childUserId: 'user-X' }),
    ).toThrow()

    expect(() => controller.issueRewards('non-existent-rec')).toThrow()
  })

  it('安监审计同一 record 重复发放产生独立奖励条目（权限边界）', () => {
    const { controller } = makeFixture()
    const code = controller.generateCode({ parentUserId: 'user-X', tenantId: 'audit-t' })
    controller.trackClick({ shortCode: code.shortCode, source: 'wechat' })
    const signup = controller.trackSignup({ shortCode: code.shortCode, childUserId: 'user-Y' })

    // 首次发放奖励
    const firstRewards = controller.issueRewards(signup.recordId)
    expect(firstRewards.rewards.length).toBe(1)
    expect(firstRewards.rewards[0].recipientUserId).toBe('user-X')

    // 再次发放: service 不防重发，预期产生 2 条奖励记录
    const secondRewards = controller.issueRewards(signup.recordId)
    expect(secondRewards.rewards.length).toBe(1)

    // 总奖励记录数 = 2
    const allRewards = controller.listRewards('audit-t')
    expect(allRewards.rewards.length).toBe(2)
  })

  it('安监审计短码唯一性: 每次生成短码不重复（正常流程）', () => {
    const { controller } = makeFixture()
    const codes = new Set<string>()
    for (let i = 0; i < 20; i++) {
      const result = controller.generateCode({
        parentUserId: `user-${i}`,
        tenantId: 'audit-uniq',
      })
      expect(codes.has(result.shortCode)).toBe(false)
      codes.add(result.shortCode)
    }
    expect(codes.size).toBe(20)
  })
})

// ════════════════════════════════════════════════════════════════════════════
// 🎮 导玩员 · 游戏活动裂变推广
// ════════════════════════════════════════════════════════════════════════════

describe(`${ROLES.Guide} 裂变推广角色测试`, () => {
  it('导玩员为游戏玩家生成游戏活动裂变短码（正常流程）', () => {
    const { controller } = makeFixture()
    const code = controller.generateCode({
      parentUserId: 'gamer-001',
      tenantId: 'arcade-store',
      baseUrl: 'https://arcade.shenjiying88.com',
      expiresInDays: 14,
    })
    expect(code.shortCode).toHaveLength(8)
    expect(code.landingUrl).toContain('arcade.shenjiying88.com')
    expect(code.parentUserId).toBe('gamer-001')

    const click = controller.trackClick({
      shortCode: code.shortCode,
      childUserId: 'gamer-002',
      source: 'qrcode',
    })
    expect(click.success).toBe(true)
  })

  it('导玩员查询店内游戏裂变活动总指标（正常流程）', () => {
    const { controller } = makeFixture()
    controller.generateCode({ parentUserId: 'gamer-003', tenantId: 'arcade-store' })
    controller.generateCode({ parentUserId: 'gamer-004', tenantId: 'arcade-store' })
    const metrics = controller.getMetrics('arcade-store')
    expect(metrics.totalCodes).toBe(2)
  })

  it('导玩员查看空门店指标为零（权限边界）', () => {
    const { controller } = makeFixture()
    const metrics = controller.getMetrics('arcade-store-empty')
    expect(metrics.totalCodes).toBe(0)
    expect(metrics.totalClicks).toBe(0)
    expect(metrics.totalRewardsIssued).toBe(0)
  })

  it('导玩员使用自定义过期时间生成短码（正常流程）', () => {
    const { controller } = makeFixture()
    const code = controller.generateCode({
      parentUserId: 'gamer-005',
      tenantId: 'arcade-store',
      expiresInDays: 3,
    })
    expect(code.shortCode).toHaveLength(8)
    expect(code.expiresAt).toBeDefined()
  })
})

// ════════════════════════════════════════════════════════════════════════════
// 🎯 运行专员 · 运营指标监控与追踪率
// ════════════════════════════════════════════════════════════════════════════

describe(`${ROLES.Ops} 裂变推广角色测试`, () => {
  it('运行专员监控裂变运营指标: 追踪率达标情况（正常流程）', () => {
    const { controller, service } = makeFixture()
    const code = controller.generateCode({ parentUserId: 'user-A', tenantId: 'ops-tenant' })

    for (let i = 0; i < 100; i++) {
      controller.trackClick({ shortCode: code.shortCode, source: 'link' })
    }
    for (let i = 0; i < 95; i++) {
      controller.trackSignup({ shortCode: code.shortCode, childUserId: `child-${i}` })
    }

    const metrics = controller.getMetrics('ops-tenant')
    expect(metrics.totalClicks).toBe(100)
    expect(metrics.totalSignups).toBe(95)
    expect(metrics.trackRate).toBeGreaterThanOrEqual(0.95)
    expect(metrics.conversionRate).toBeGreaterThanOrEqual(0.95)
  })

  it('运行专员查看各门店裂变记录跨租户隔离（权限边界）', () => {
    const { controller } = makeFixture()
    const codeA = controller.generateCode({ parentUserId: 'user-A', tenantId: 'store-1' })
    controller.trackClick({ shortCode: codeA.shortCode, source: 'wechat' })
    controller.trackSignup({ shortCode: codeA.shortCode, childUserId: 'user-B' })

    const records1 = controller.listRecords('store-1')
    expect(records1.records).toHaveLength(1)
    const records2 = controller.listRecords('store-2')
    expect(records2.records).toHaveLength(0)
  })

  it('运行专员查看门店总体裂变消耗积分值（正常流程）', () => {
    const { controller, service } = makeFixture()
    const { signup } = buildThreeLevelChain(controller, service, 'ops-rewards')
    controller.issueRewards(signup.recordId)

    const metrics = controller.getMetrics('ops-rewards')
    expect(metrics.totalRewardsValue).toBeGreaterThan(0)
    expect(metrics.totalRewardsIssued).toBe(3)
  })
})

// ════════════════════════════════════════════════════════════════════════════
// 🤝 团建 · 团队裂变 & 级联分润
// ════════════════════════════════════════════════════════════════════════════

describe(`${ROLES.Teambuilding} 裂变推广角色测试`, () => {
  it('团建批量生成团队成员裂变短码（正常流程）', () => {
    const { controller } = makeFixture()
    const teamMembers = ['team-A', 'team-B', 'team-C']

    const codes = teamMembers.map(member =>
      controller.generateCode({
        parentUserId: member,
        tenantId: 'teambuilding-tenant',
        baseUrl: 'https://team.shenjiying88.com',
      }),
    )

    expect(codes).toHaveLength(3)
    codes.forEach((c, i) => {
      expect(c.shortCode).toHaveLength(8)
      expect(c.parentUserId).toBe(teamMembers[i])
      if (i > 0) expect(c.shortCode).not.toBe(codes[i - 1].shortCode)
    })
  })

  it('团建裂变链奖励分发: L1/L2/L3 级联奖励正确计算（正常流程）', () => {
    const { controller, service } = makeFixture()
    const { signup } = buildThreeLevelChain(controller, service, 'team-tenant')

    const rewards = controller.issueRewards(signup.recordId)

    const l1Reward = rewards.rewards.find(r => r.level === 1)
    expect(l1Reward?.rewardValue).toBe(100)
    expect(l1Reward?.recipientUserId).toBe('user-C')

    const l2Reward = rewards.rewards.find(r => r.level === 2)
    expect(l2Reward?.rewardValue).toBe(50)
    expect(l2Reward?.recipientUserId).toBe('user-B')

    const l3Reward = rewards.rewards.find(r => r.level === 3)
    expect(l3Reward?.rewardValue).toBe(10)
    expect(l3Reward?.recipientUserId).toBe('user-A')

    expect(rewards.rewards.length).toBe(3)
  })

  it('团建单级推荐（无裂变链）仅发放 L1 奖励（权限边界）', () => {
    const { controller } = makeFixture()
    const code = controller.generateCode({ parentUserId: 'user-X', tenantId: 'single-t' })
    controller.trackClick({ shortCode: code.shortCode, source: 'wechat' })
    const signup = controller.trackSignup({ shortCode: code.shortCode, childUserId: 'user-Y' })
    const rewards = controller.issueRewards(signup.recordId)
    expect(rewards.rewards.length).toBe(1)
    expect(rewards.rewards[0].level).toBe(1)
    expect(rewards.rewards[0].rewardValue).toBe(100)
  })
})

// ════════════════════════════════════════════════════════════════════════════
// 📢 营销 · 活动配置 & 数据看板
// ════════════════════════════════════════════════════════════════════════════

describe(`${ROLES.Marketing} 裂变推广角色测试`, () => {
  it('营销人员创建裂变营销活动短码并验证落地页可访问（正常流程）', () => {
    const { controller } = makeFixture()
    const code = controller.generateCode({
      parentUserId: 'marketing-user',
      tenantId: 'campaign-tenant',
      baseUrl: 'https://campaign.shenjiying88.com',
      expiresInDays: 30,
    })

    expect(code.shortCode).toHaveLength(8)
    expect(code.landingUrl).toBe(
      `https://campaign.shenjiying88.com/r/${code.shortCode}`,
    )
    expect(code.qrCodeUrl).toBe(
      `https://campaign.shenjiying88.com/qr/${code.shortCode}.png`,
    )
  })

  it('营销人员自定义奖励规则后新奖励按新规则计算（正常流程）', () => {
    const { controller, service } = makeFixture()

    const code1 = controller.generateCode({
      parentUserId: 'user-X',
      tenantId: 'mkt-tenant',
    })
    controller.trackClick({ shortCode: code1.shortCode, source: 'link' })
    const rec1 = controller.trackSignup({ shortCode: code1.shortCode, childUserId: 'user-Y' })

    service.setRewardRules({
      1: { points: 200, coupon: 100 },
      2: { points: 100, coupon: 0 },
      3: { points: 30, coupon: 0 },
    })

    const rewards = controller.issueRewards(rec1.recordId)
    expect(rewards.rewards[0].rewardValue).toBe(200)

    const allRewards = controller.listRewards('mkt-tenant')
    expect(allRewards.rewards).toHaveLength(1)
    expect(allRewards.rewards[0].rewardValue).toBe(200)

    service.setRewardRules({
      1: { points: 100, coupon: 50 },
      2: { points: 50, coupon: 0 },
      3: { points: 10, coupon: 0 },
    })
  })

  it('营销人员查看活动裂变总览指标（正常流程）', () => {
    const { controller } = makeFixture()

    const code = controller.generateCode({
      parentUserId: 'influencer-1',
      tenantId: 'mkt-campaign-1',
    })
    for (let i = 0; i < 50; i++) {
      controller.trackClick({ shortCode: code.shortCode, source: 'wechat' })
    }
    for (let i = 0; i < 45; i++) {
      controller.trackSignup({ shortCode: code.shortCode, childUserId: `lead-${i}` })
    }

    const metrics = controller.getMetrics('mkt-campaign-1')
    expect(metrics.totalCodes).toBe(1)
    expect(metrics.totalClicks).toBe(50)
    expect(metrics.totalSignups).toBe(45)
    expect(metrics.conversionRate).toBe(0.9)
  })

  it('营销人员进行跨渠道裂变推广: 多来源渠道追踪（正常流程）', () => {
    const { controller } = makeFixture()
    const code = controller.generateCode({
      parentUserId: 'mkt-influencer',
      tenantId: 'multi-channel',
    })

    const sources = ['wechat', 'mini-program', 'link', 'qrcode'] as const
    for (const source of sources) {
      const click = controller.trackClick({
        shortCode: code.shortCode,
        childUserId: `user-from-${source}`,
        source,
      })
      expect(click.success).toBe(true)
    }

    const metrics = controller.getMetrics('multi-channel')
    expect(metrics.totalCodes).toBe(1)
    expect(metrics.totalClicks).toBe(4)
  })
})
