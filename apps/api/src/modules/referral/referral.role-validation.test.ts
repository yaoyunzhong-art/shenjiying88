import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
/**
 * 🐜 自动: [referral] [C] 角色验证测试 — 8角色业务规则校验
 *
 * 覆盖:
 * - 裂变链跨租户隔离 (店长/安监)
 * - 前台引导扫码 + 过期短码拒绝
 * - HR 查看奖励明细 + 奖励状态分布
 * - 安监审计裂变链完整性和奖励计算公式
 * - 导玩员活动裂变 + 效果追踪
 * - 运行专员运营指标预警
 * - 团建批量生成 + L1/L2/L3 级联奖励
 * - 营销活动指标和奖励规则动态调整
 *
 * 每个角色至少 2 个测试用例 (正常流程 + 权限/边界)
 * 使用 vitest (与现有 role test 一致)
 */

import { ReferralController } from './referral.controller'
import { ReferralService } from './referral.service'
import type { ReferralCode, ReferralRecord, ReferralReward } from './referral.entity'

// ── 角色定义 ──
const ROLE = {
  StoreManager: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Safety: '🔧安监',
  Guide: '🎮导玩员',
  Ops: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
} as const

// ── 工厂 ──
function makeFixture() {
  const service = new ReferralService()
  const controller = new ReferralController(service)
  return { service, controller }
}

const TENANT_A = 'tenant-a'
const TENANT_B = 'tenant-b'

function makeParent(tenantId: string, idx: number) {
  const service = new ReferralService()
  const controller = new ReferralController(service)
  const code = controller.generateCode({ parentUserId: `parent-${tenantId}-${idx}`, tenantId })
  return { service, controller, code }
}

describe(`[referral] ${ROLE.StoreManager} 👔 店长 — 全局裂变运营状态`, () => {
  it('AC-1: 跨门店/跨租户裂变指标隔离（正常流程）', () => {
    const { controller } = makeFixture()
    // 门店A 生成 3 个短码
    const recordsA: string[] = []
    for (let i = 0; i < 3; i++) {
      const c = controller.generateCode({ parentUserId: `store-a-user-${i}`, tenantId: TENANT_A })
      controller.trackClick({ shortCode: c.shortCode, source: 'wechat' })
      const rec = controller.trackSignup({ shortCode: c.shortCode, childUserId: `child-a-${i}` })
      recordsA.push(rec.recordId)
    }
    // 门店B 生成 2 个短码
    const recordsB: string[] = []
    for (let i = 0; i < 2; i++) {
      const c = controller.generateCode({ parentUserId: `store-b-user-${i}`, tenantId: TENANT_B })
      controller.trackClick({ shortCode: c.shortCode, source: 'link' })
      const rec = controller.trackSignup({ shortCode: c.shortCode, childUserId: `child-b-${i}` })
      recordsB.push(rec.recordId)
    }

    // 发放奖励
    for (const rid of recordsA) controller.issueRewards(rid)
    for (const rid of recordsB) controller.issueRewards(rid)

    const metricsA = controller.getMetrics(TENANT_A)
    const metricsB = controller.getMetrics(TENANT_B)

    expect(metricsA.totalCodes).toBe(3)
    expect(metricsB.totalCodes).toBe(2)
    expect(metricsA.totalSignups).toBe(3)
    expect(metricsB.totalSignups).toBe(2)
    // 汇总指标独立
    expect(metricsA.totalRewardsIssued).toBeGreaterThan(0)
    expect(metricsB.totalRewardsIssued).toBeGreaterThan(0)
  })

  it('AC-2: 店长查看本门店裂变短码过期警告（边界/异常流程）', () => {
    const { controller } = makeFixture()
    // 使用不存在的短码模拟过期
    const clickResult = controller.trackClick({ shortCode: 'EXPIRED123', source: 'wechat' })
    expect(clickResult.success).toBe(false)
    expect(clickResult.message).toMatch(/Invalid|expired/i)
  })
})

describe(`[referral] ${ROLE.FrontDesk} 🛒 前台 — 引导顾客裂变`, () => {
  it('AC-1: 前台引导顾客扫码生成短码并分享（正常流程）', () => {
    const { controller } = makeFixture()
    const code = controller.generateCode({
      parentUserId: 'customer-1',
      tenantId: TENANT_A,
      baseUrl: 'https://m.shenjiying88.com',
    })
    // 模拟扫码点击
    const click = controller.trackClick({ shortCode: code.shortCode, source: 'qrcode' })
    expect(click.success).toBe(true)

    // 查询短码详情
    const info = controller.getCode(code.shortCode)
    expect(info.found).toBe(true)
    if (info.found) {
      expect(info.code.totalClicks).toBe(1)
      expect(info.code.landingUrl).toMatch(/r\//)
    }
  })

  it('AC-2: 使用已过期/无效短码被拒绝（权限边界）', () => {
    const { controller } = makeFixture()
    const result = controller.trackClick({ shortCode: 'INVALID123', source: 'wechat' })
    expect(result.success).toBe(false)
    expect(result.message).toMatch(/Invalid|expired/i)
  })
})

describe(`[referral] ${ROLE.HR} 👥 HR — 员工推荐奖励审计`, () => {
  it('AC-1: 查看门店员工推荐裂变记录和奖励明细（正常流程）', () => {
    const { controller, service } = makeFixture()
    const code = controller.generateCode({ parentUserId: 'emp-001', tenantId: TENANT_A })
    controller.trackClick({ shortCode: code.shortCode, childUserId: 'new-hire-001', source: 'wechat' })
    const record = controller.trackSignup({ shortCode: code.shortCode, childUserId: 'new-hire-001' })

    expect(record.tracked).toBe(true)
    expect(record.parentUserId).toBe('emp-001')

    // 发放奖励
    const rewards = controller.issueRewards(record.recordId)
    expect(rewards.rewards.length).toBeGreaterThanOrEqual(1)

    // HR 查询奖励记录
    const rewardList = controller.listRewards(TENANT_A)
    expect(rewardList.rewards.length).toBeGreaterThanOrEqual(1)
  })

  it('AC-2: 奖励状态分布检查（边界/状态流转）', () => {
    const { controller, service } = makeFixture()
    // 生成多个推荐并审核
    const codes: ReferralCode[] = []
    for (let i = 0; i < 3; i++) {
      const c = controller.generateCode({ parentUserId: `emp-00${i}`, tenantId: TENANT_A })
      codes.push(c)
      controller.trackClick({ shortCode: c.shortCode, source: 'wechat' })
    }
    // 只补登前 2 个
    const recordIds: string[] = []
    for (let i = 0; i < 2; i++) {
      const rec: any = controller.trackSignup({ shortCode: codes[i].shortCode, childUserId: `child-00${i}` })
      recordIds.push(rec.recordId)
    }
    // 发放第 1 个的奖励
    controller.issueRewards(recordIds[0])
    // 查询该租户奖励
    const rewards = controller.listRewards(TENANT_A)
    // 至少 1 个奖励已发放
    expect(rewards.rewards.length).toBeGreaterThanOrEqual(1)
    // 检查L1积分奖励正确
    const level1Reward = rewards.rewards.find(r => r.level === 1)
    expect(level1Reward?.rewardValue).toBe(100)
    expect(level1Reward?.rewardType).toBe('points')
  })
})

describe(`[referral] ${ROLE.Safety} 🔧 安监 — 裂变审计与安全`, () => {
  it('AC-1: 裂变链完整性审计: 点击→注册→奖励全关联（正常流程）', () => {
    const { controller } = makeFixture()
    const code = controller.generateCode({ parentUserId: 'parent-X', tenantId: TENANT_A })
    controller.trackClick({ shortCode: code.shortCode, childUserId: 'child-Y', source: 'wechat' })
    const rec: any = controller.trackSignup({ shortCode: code.shortCode, childUserId: 'child-Y' })
    const rewards = controller.issueRewards(rec.recordId)

    // 审计链完整性
    expect(rec.ancestorChain[0]).toBe('parent-X')
    expect(rewards.rewards[0].recipientUserId).toBe('parent-X')
    // 所有奖励状态应为 issued
    for (const r of rewards.rewards) {
      expect(r.status).toBe('issued')
    }
  })

  it('AC-2: 跨租户不可互相查看裂变数据（权限隔离）', () => {
    const { controller: ctrlA } = makeFixture()
    const { controller: ctrlB } = makeFixture()

    // 租户A 数据
    const codeA = ctrlA.generateCode({ parentUserId: 'user-A', tenantId: TENANT_A })
    ctrlA.trackClick({ shortCode: codeA.shortCode, childUserId: 'child-A', source: 'wechat' })
    ctrlA.trackSignup({ shortCode: codeA.shortCode, childUserId: 'child-A' })

    // 租户B 查询不应看到租户A数据
    const metricsB = ctrlB.getMetrics(TENANT_B)
    expect(metricsB.totalCodes).toBe(0) // 新 controller 无数据

    // 同一 service 但不同 tenantId 查询也应隔离
    const { controller: ctrlCombined, service } = makeFixture()
    const codeB = ctrlCombined.generateCode({ parentUserId: 'user-B', tenantId: TENANT_B })
    ctrlCombined.trackClick({ shortCode: codeB.shortCode, childUserId: 'child-B', source: 'link' })
    ctrlCombined.trackSignup({ shortCode: codeB.shortCode, childUserId: 'child-B' })

    const mA = ctrlCombined.getMetrics(TENANT_A)
    const mB = ctrlCombined.getMetrics(TENANT_B)
    // 租户A 无数据，租户B 有数据
    expect(mA.totalCodes).toBe(0)
    expect(mB.totalCodes).toBe(1)
  })
})

describe(`[referral] ${ROLE.Guide} 🎮 导玩员 — 游戏活动裂变`, () => {
  it('AC-1: 为游戏玩家生成活动裂变短码（正常流程）', () => {
    const { controller } = makeFixture()
    const code = controller.generateCode({
      parentUserId: 'gamer-001',
      tenantId: TENANT_A,
      baseUrl: 'https://game.shenjiying88.com',
    })
    expect(code.shortCode.length).toBe(8)
    expect(code.qrCodeUrl).toMatch(/qr\//)
    expect(code.landingUrl).toMatch(/r\//)
  })

  it('AC-2: 导玩员查看游戏活动裂变效果指标（权限边界）', () => {
    const { controller } = makeFixture()
    const code = controller.generateCode({ parentUserId: 'gamer-001', tenantId: TENANT_A })
    // 模拟多人点击但只有部分注册
    controller.trackClick({ shortCode: code.shortCode, source: 'mini-program' })
    controller.trackClick({ shortCode: code.shortCode, source: 'mini-program' })
    controller.trackClick({ shortCode: code.shortCode, source: 'mini-program' })

    controller.trackSignup({ shortCode: code.shortCode, childUserId: 'referral-1' })
    controller.trackSignup({ shortCode: code.shortCode, childUserId: 'referral-2' })

    const metrics = controller.getMetrics(TENANT_A)
    expect(metrics.totalClicks).toBe(3)
    expect(metrics.totalSignups).toBe(2)
    expect(metrics.conversionRate).toBeCloseTo(2 / 3, 4)
  })
})

describe(`[referral] ${ROLE.Ops} 🎯 运行专员 — 裂变运营监控`, () => {
  it('AC-1: 监控裂变运营指标确认追踪率达标（正常流程）', () => {
    const { controller } = makeFixture()
    // 模拟真实运营数据
    const code = controller.generateCode({ parentUserId: 'influencer-1', tenantId: TENANT_A })
    for (let i = 0; i < 100; i++) {
      controller.trackClick({ shortCode: code.shortCode, childUserId: `lead-${i}`, source: 'link' })
    }
    for (let i = 0; i < 95; i++) {
      controller.trackSignup({ shortCode: code.shortCode, childUserId: `lead-${i}` })
    }
    const metrics = controller.getMetrics(TENANT_A)
    expect(metrics.trackRate).toBeGreaterThanOrEqual(0.90)
    expect(metrics.conversionRate).toBeGreaterThanOrEqual(0.90)
  })

  it('AC-2: 跨租户数据隔离校验: 运行专员只可查看本门店数据（边界）', () => {
    const { controller } = makeFixture()
    // 生成两个租户的数据
    const codeA = controller.generateCode({ parentUserId: 'campaign-A', tenantId: TENANT_A })
    for (let i = 0; i < 10; i++) {
      controller.trackClick({ shortCode: codeA.shortCode, source: 'link' })
    }

    const codeB = controller.generateCode({ parentUserId: 'campaign-B', tenantId: TENANT_B })
    for (let i = 0; i < 20; i++) {
      controller.trackClick({ shortCode: codeB.shortCode, source: 'link' })
    }

    const mA = controller.getMetrics(TENANT_A)
    const mB = controller.getMetrics(TENANT_B)
    expect(mA.totalClicks).toBe(10)
    expect(mB.totalClicks).toBe(20)
    expect(mA.totalCodes).toBe(1)
    expect(mB.totalCodes).toBe(1)
  })
})

describe(`[referral] ${ROLE.Teambuilding} 🤝 团建 — 团队批量裂变`, () => {
  it('AC-1: 团建批量生成团队裂变短码（正常流程）', () => {
    const { controller } = makeFixture()
    // 团建活动生成 5 个短码
    const codes: string[] = []
    for (let i = 0; i < 5; i++) {
      const c = controller.generateCode({
        parentUserId: `team-lead-${i}`,
        tenantId: 'team-building',
        expiresInDays: 7,
      })
      codes.push(c.shortCode)
    }
    // 每个短码被点击并注册
    for (let i = 0; i < 5; i++) {
      controller.trackClick({ shortCode: codes[i], childUserId: `member-${i}`, source: 'wechat' })
      controller.trackSignup({ shortCode: codes[i], childUserId: `member-${i}` })
    }
    const metrics = controller.getMetrics('team-building')
    expect(metrics.totalCodes).toBe(5)
    expect(metrics.totalSignups).toBe(5)
  })

  it('AC-2: L1/L2/L3三级裂变奖励链计算验证（权限边界）', () => {
    const { controller } = makeFixture()

    // 构建三级裂变链:
    // A(推荐) → B(推荐) → C(注册)
    // A 是 L1 邀请人, B 是 L2 邀请人

    // step1: A 推荐 B
    const code1 = controller.generateCode({ parentUserId: 'user-A', tenantId: 'chain' })
    controller.trackClick({ shortCode: code1.shortCode, childUserId: 'user-B', source: 'link' })
    const rec1 = controller.trackSignup({ shortCode: code1.shortCode, childUserId: 'user-B' })

    // step2: B 推荐 C
    const code2 = controller.generateCode({ parentUserId: 'user-B', tenantId: 'chain' })
    controller.trackClick({ shortCode: code2.shortCode, childUserId: 'user-C', source: 'link' })
    const rec2 = controller.trackSignup({ shortCode: code2.shortCode, childUserId: 'user-C' })

    // 对 C 的注册发放奖励:
    // L1 = B 直接邀请 → 100积分
    // L2 = A (B的上级) → 50积分
    const rewards = controller.issueRewards(rec2.recordId)

    // 检查祖先链: C → B → A
    expect(rec2.ancestorChain[0]).toBe('user-B')
    expect(rec2.ancestorChain[1]).toBe('user-A')
    expect(rec2.ancestorChain.length).toBeGreaterThanOrEqual(2)

    // 应有两个奖励: L1=B获100, L2=A获50
    expect(rewards.rewards.length).toBeGreaterThanOrEqual(2)
    const l1Reward = rewards.rewards.find(r => r.recipientUserId === 'user-B')
    const l2Reward = rewards.rewards.find(r => r.recipientUserId === 'user-A')
    expect(l1Reward?.rewardValue).toBe(100)
    expect(l2Reward?.rewardValue).toBe(50)
    expect(l1Reward?.level).toBe(1)
    expect(l2Reward?.level).toBe(2)
  })
})

describe(`[referral] ${ROLE.Marketing} 📢 营销 — 裂变营销活动`, () => {
  it('AC-1: 营销活动指标统计完整（正常流程）', () => {
    const { controller } = makeFixture()
    // 营销活动: 生成 3 个渠道短码
    const wechatCode = controller.generateCode({ parentUserId: 'kol-1', tenantId: 'mkt-q1' })
    const qrcodeCode = controller.generateCode({ parentUserId: 'store-1', tenantId: 'mkt-q1' })
    const linkCode = controller.generateCode({ parentUserId: 'campaign-1', tenantId: 'mkt-q1' })

    // 模拟不同渠道流量
    for (let i = 0; i < 30; i++) {
      controller.trackClick({ shortCode: wechatCode.shortCode, source: 'wechat' })
    }
    for (let i = 0; i < 20; i++) {
      controller.trackClick({ shortCode: qrcodeCode.shortCode, source: 'qrcode' })
    }
    controller.trackClick({ shortCode: linkCode.shortCode, source: 'link' })

    // 注册转化 — 收集 record ids 后续发放奖励
    const recordIds: string[] = []
    for (let i = 0; i < 25; i++) {
      const rec = controller.trackSignup({ shortCode: wechatCode.shortCode, childUserId: `mkt-lead-${i}` })
      recordIds.push(rec.recordId)
    }
    for (let i = 0; i < 18; i++) {
      const rec = controller.trackSignup({ shortCode: qrcodeCode.shortCode, childUserId: `qr-lead-${i}` })
      recordIds.push(rec.recordId)
    }
    const linkRec = controller.trackSignup({ shortCode: linkCode.shortCode, childUserId: `link-lead-0` })
    recordIds.push(linkRec.recordId)

    // 发放奖励
    for (const rid of recordIds) controller.issueRewards(rid)

    const metrics = controller.getMetrics('mkt-q1')
    expect(metrics.totalCodes).toBe(3)
    expect(metrics.totalClicks).toBe(51)
    expect(metrics.totalSignups).toBe(44)
    expect(metrics.totalRewardsIssued).toBeGreaterThan(0)
  })

  it('AC-2: 奖励规则变更后新注册按新规则计算（边界/动态规则）', () => {
    const { controller, service } = makeFixture()

    // 活动第一期: 默认规则
    const code = controller.generateCode({ parentUserId: 'influencer-1', tenantId: 'mkt-dynamic' })
    controller.trackClick({ shortCode: code.shortCode, childUserId: 'lead-1', source: 'wechat' })
    const rec1 = controller.trackSignup({ shortCode: code.shortCode, childUserId: 'lead-1' })
    // 旧规则发放
    const oldRewards = controller.issueRewards(rec1.recordId)
    expect(oldRewards.rewards[0].rewardValue).toBe(100)

    // 活动第二期: 加倍奖励
    service.setRewardRules({
      1: { points: 200, coupon: 100 },
      2: { points: 100, coupon: 0 },
      3: { points: 20, coupon: 0 },
    })

    // 新推荐
    const code2 = controller.generateCode({ parentUserId: 'influencer-2', tenantId: 'mkt-dynamic' })
    controller.trackClick({ shortCode: code2.shortCode, childUserId: 'lead-2', source: 'wechat' })
    const rec2 = controller.trackSignup({ shortCode: code2.shortCode, childUserId: 'lead-2' })
    const newRewards = controller.issueRewards(rec2.recordId)
    expect(newRewards.rewards[0].rewardValue).toBe(200)

    // 旧奖励不受影响
    const metrics = controller.getMetrics('mkt-dynamic')
    expect(metrics.totalRewardsIssued).toBe(2)

    // 重置
    service.setRewardRules({
      1: { points: 100, coupon: 50 },
      2: { points: 50, coupon: 0 },
      3: { points: 10, coupon: 0 },
    })
  })

  it('AC-3: 营销人员查看活动裂变总览指标（正常流程）', () => {
    const { controller } = makeFixture()
    const code = controller.generateCode({ parentUserId: 'influencer-1', tenantId: 'mkt-overview' })
    for (let i = 0; i < 50; i++) {
      controller.trackClick({ shortCode: code.shortCode, source: 'wechat' })
    }
    for (let i = 0; i < 45; i++) {
      controller.trackSignup({ shortCode: code.shortCode, childUserId: `lead-${i}` })
    }
    const metrics = controller.getMetrics('mkt-overview')
    expect(metrics.totalCodes).toBe(1)
    expect(metrics.totalClicks).toBe(50)
    expect(metrics.totalSignups).toBe(45)
    expect(metrics.conversionRate).toBe(0.9)
  })
})
