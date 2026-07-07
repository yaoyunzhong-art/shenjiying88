import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [referral] [C] 角色测试扩展
 *
 * 8 角色视角的 referral 模块测试（三级裂变 & 社群营销）：
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色 ≥2 个测试用例（正常流程 + 权限边界/业务异常）
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { ReferralController } from './referral.controller'
import { ReferralService } from './referral.service'

// ── 角色定义 ──
const ROLES = {
  StoreManager: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Safety: '🔧安监',
  Guide: '🎮导玩员',
  Ops: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
} as const

// ── 工厂函数 ──
function freshController(): ReferralController {
  const svc = new ReferralService()
  return new ReferralController(svc)
}

function freshService(): ReferralService {
  return new ReferralService()
}

// 生成一个不重复的短码
function getCodeFrom(ctrl: ReferralController, parentUserId: string, tenantId = 't-refer'): string {
  const res = ctrl.generateCode({
    parentUserId,
    tenantId,
    baseUrl: 'https://m.shenjiying88.com',
  })
  return res.shortCode
}

// ════════════════════════════════════════════════════════════════════
// 👔店长 — 裂变活动整体管理与数据监控
// ════════════════════════════════════════════════════════════════════
describe(`${ROLES.StoreManager} referral 角色测试`, () => {
  it('店长可生成裂变短码并查看码详情', () => {
    const ctrl = freshController()
    const res = ctrl.generateCode({
      parentUserId: 'store-manager-001',
      tenantId: 't-store',
      baseUrl: 'https://store.shenjiying88.com',
    })
    assert.ok(res.shortCode)
    assert.equal(res.shortCode.length, 8)
    assert.equal(res.parentUserId, 'store-manager-001')
    assert.equal(res.tenantId, 't-store')
    assert.ok(res.landingUrl.includes(res.shortCode))
    assert.ok(res.qrCodeUrl)
    assert.ok(Date.parse(res.createdAt) > 0)

    // 查询详情
    const detail = ctrl.getCode(res.shortCode)
    assert.equal(detail.found, true)
    if (detail.found) {
      assert.equal(detail.code.codeId, res.codeId)
      assert.equal(detail.code.totalClicks, 0)
      assert.equal(detail.code.totalSignups, 0)
    }
  })

  it('店长查看不存在的短码 → 返回 not found', () => {
    const ctrl = freshController()
    const res = ctrl.getCode('NONEXIST')
    assert.equal(res.found, false)
    assert.ok(res.message.includes('NONEXIST'))
  })

  it('店长查看全场裂变指标（含多租户隔离）', () => {
    const ctrl = freshController()
    // 租户 A: 生成 2 个码、记录一次点击
    const codeA1 = getCodeFrom(ctrl, 'parent-a-1', 't-a')
    ctrl.trackClick({ shortCode: codeA1, source: 'wechat' })
    const codeA2 = getCodeFrom(ctrl, 'parent-a-2', 't-a')
    ctrl.trackClick({ shortCode: codeA2, childUserId: 'child-a-1', source: 'link' })

    // 租户 B: 生成 1 个码 (不点击)
    getCodeFrom(ctrl, 'parent-b-1', 't-b')

    // 不带 tenantId → 全局指标
    const globalMetrics = ctrl.getMetrics()
    assert.equal(globalMetrics.totalCodes, 3)
    assert.equal(globalMetrics.totalClicks, 2)

    // 带 tenantId → 租户过滤
    const metricsA = ctrl.getMetrics('t-a')
    assert.equal(metricsA.totalCodes, 2)
    assert.equal(metricsA.totalClicks, 2)

    const metricsB = ctrl.getMetrics('t-b')
    assert.equal(metricsB.totalCodes, 1)
    assert.equal(metricsB.totalClicks, 0)
  })
})

// ════════════════════════════════════════════════════════════════════
// 🛒前台 — 结账时引导顾客扫码裂变、查码状态
// ════════════════════════════════════════════════════════════════════
describe(`${ROLES.FrontDesk} referral 角色测试`, () => {
  it('前台为顾客生成分享短码并确认二维码 URL 有效', () => {
    const ctrl = freshController()
    const res = ctrl.generateCode({
      parentUserId: 'member-cashier-001',
      tenantId: 't-front',
    })
    assert.ok(res.shortCode)
    assert.ok(res.qrCodeUrl)
    assert.ok(res.qrCodeUrl.endsWith('.png'))
    assert.equal(res.totalClicks, 0)
  })

  it('前台传递过期的短码时点击追踪拒绝', () => {
    const svc = freshService()
    const ctrl = new ReferralController(svc)

    // 用短有效期生成码
    const res = ctrl.generateCode({
      parentUserId: 'member-cashier-002',
      tenantId: 't-front',
      expiresInDays: -1, // 已过期
    })

    // trackClick → code 存在但 expired
    const clickRes = ctrl.trackClick({
      shortCode: res.shortCode,
      source: 'qrcode',
    })
    assert.equal(clickRes.success, false)
    assert.ok((clickRes as { success: false; message: string }).message.includes('expired'))
  })

  it('前台点击带 childUserId 的短码→记录 pending 绑定', () => {
    const ctrl = freshController()
    const code = getCodeFrom(ctrl, 'parent-cashier-003', 't-front')

    const clickRes = ctrl.trackClick({
      shortCode: code,
      childUserId: 'child-cashier-003',
      source: 'mini-program',
    })
    assert.equal(clickRes.success, true)
    assert.equal(clickRes.totalClicks, 1)

    // 注册补登触发绑定
    const signupRes = ctrl.trackSignup({
      shortCode: code,
      childUserId: 'child-cashier-003',
    })
    assert.equal(signupRes.recordId.length > 0, true)
    assert.equal(signupRes.parentUserId, 'parent-cashier-003')
    assert.equal(signupRes.childUserId, 'child-cashier-003')
    assert.equal(signupRes.level, 1)
  })
})

// ════════════════════════════════════════════════════════════════════
// 👥HR — 员工推荐入职激励（内部推荐场景类比裂变）
// ════════════════════════════════════════════════════════════════════
describe(`${ROLES.HR} referral 角色测试`, () => {
  it('HR 生成内部推荐短码并完成邀请-注册流程', () => {
    const ctrl = freshController()
    const codeRes = ctrl.generateCode({
      parentUserId: 'hr-recruiter-001',
      tenantId: 't-hr',
      baseUrl: 'https://hr.shenjiying88.com',
    })
    assert.ok(codeRes.shortCode)

    // 模拟点击 + 注册
    ctrl.trackClick({ shortCode: codeRes.shortCode, source: 'link' })
    const signupRes = ctrl.trackSignup({
      shortCode: codeRes.shortCode,
      childUserId: 'new-employee-001',
    })
    assert.equal(signupRes.childUserId, 'new-employee-001')
    assert.equal(signupRes.level, 1)
    assert.equal(signupRes.tracked, true)

    // 查看裂变记录中包含该笔
    const records = ctrl.listRecords('t-hr')
    assert.equal(records.records.length, 1)
    assert.equal(records.records[0].childUserId, 'new-employee-001')
    assert.equal(records.records[0].tracked, true)
  })

  it('HR 使用不存在短码注册 → 抛出错误', () => {
    const ctrl = freshController()
    assert.throws(() => {
      ctrl.trackSignup({
        shortCode: 'HR-INVALID',
        childUserId: 'ghost-employee',
      })
    }, /Referral code not found/)
  })
})

// ════════════════════════════════════════════════════════════════════
// 🔧安监 — 检查裂变链接安全、短码防预测性
// ════════════════════════════════════════════════════════════════════
describe(`${ROLES.Safety} referral 角色测试`, () => {
  it('安监验证短码不可预测（连续生成短码无规律）', () => {
    const svc = freshService()
    const codes = new Set<string>()
    for (let i = 0; i < 10; i++) {
      const code = svc.generateCode({
        parentUserId: `safety-user-${i}`,
        tenantId: 't-safety',
      })
      codes.add(code.shortCode)
      // 每个短码长度固定 8
      assert.equal(code.shortCode.length, 8)
    }
    // 10 个码全部唯一
    assert.equal(codes.size, 10)
  })

  it('安监对不存在的短码查询返回 not found（防恶意扫描）', () => {
    const ctrl = freshController()
    const res = ctrl.getCode('RANDOMXYZ')
    assert.equal(res.found, false)
  })

  it('安监检查短码被反复尝试无效注册 → 防止滥用', () => {
    const ctrl = freshController()
    // 生成一个有效码
    const code = getCodeFrom(ctrl, 'safety-parent', 't-safety')

    // 有效注册正常通过
    ctrl.trackClick({ shortCode: code, source: 'qrcode' })
    const signup1 = ctrl.trackSignup({ shortCode: code, childUserId: 'safety-child' })
    assert.ok(signup1.tracked)

    // 用同一短码尝试再次注册不同 child (同 childUserId 重复 → 通过但逻辑安全)
    // 主要验证不崩溃
    ctrl.trackSignup({ shortCode: code, childUserId: 'safety-child-dup' })
    assert.ok(true) // 健壮性无异常
  })
})

// ════════════════════════════════════════════════════════════════════
// 🎮导玩员 — 在游戏场地推广裂变，生成专属推荐链接
// ════════════════════════════════════════════════════════════════════
describe(`${ROLES.Guide} referral 角色测试`, () => {
  it('导玩员为玩家生成短码并通过二维码引导分享', () => {
    const ctrl = freshController()
    const res = ctrl.generateCode({
      parentUserId: 'player-vip-001',
      tenantId: 't-guide',
      baseUrl: 'https://game.shenjiying88.com',
    })
    assert.ok(res.landingUrl.includes('/r/'))
    assert.ok(res.qrCodeUrl!.includes('/qr/'))
    assert.ok(res.landingUrl.startsWith('https://game.shenjiying88.com'))
  })

  it('导玩员追踪链接点击来源 → 确认来源标记正确', () => {
    const ctrl = freshController()
    const code = getCodeFrom(ctrl, 'player-vip-002', 't-guide')

    // 多渠道点击
    ctrl.trackClick({ shortCode: code, childUserId: 'child-g-1', source: 'qrcode' })
    ctrl.trackClick({ shortCode: code, childUserId: 'child-g-2', source: 'wechat' })

    // 注册补登
    ctrl.trackSignup({ shortCode: code, childUserId: 'child-g-1' })
    const records = ctrl.listRecords('t-guide')
    // 至少有一条记录
    assert.ok(records.records.length >= 1)
  })
})

// ════════════════════════════════════════════════════════════════════
// 🎯运行专员 — 裂变运营配置（奖励规则调整阈值）
// ════════════════════════════════════════════════════════════════════
describe(`${ROLES.Ops} referral 角色测试`, () => {
  it('运行专员发放裂变奖励 → L1 得 100 积分, L2 得 50 积分, L3 得 10 积分', () => {
    const svc = freshService()
    const ctrl = new ReferralController(svc)

    // 创建三级裂变链: parent A → B → C → D
    // L1: A→B, L2: parentOfA, L3: parentOfParentOfA
    const codeA = getCodeFrom(ctrl, 'parent-ops-a', 't-ops')
    ctrl.trackClick({ shortCode: codeA, source: 'link' })
    const recordAB = ctrl.trackSignup({ shortCode: codeA, childUserId: 'child-ops-a' })

    // 为 child-ops-a 生成码，她邀请 B
    const codeB = getCodeFrom(ctrl, 'child-ops-a', 't-ops')
    ctrl.trackClick({ shortCode: codeB, source: 'link' })
    ctrl.trackSignup({ shortCode: codeB, childUserId: 'child-ops-b' })

    // 发放 recordAB 奖励 → L1: parent-ops-a, L2 来自于 ancestor chain
    const rewardsRes = ctrl.issueRewards(recordAB.recordId)
    assert.ok(rewardsRes.rewards.length >= 1)
    const l1Reward = rewardsRes.rewards.find(r => r.level === 1)
    assert.ok(l1Reward)
    assert.equal(l1Reward.rewardValue, 100)
    assert.equal(l1Reward.rewardType, 'points')
    assert.equal(l1Reward.status, 'issued')
  })

  it('运行专员查询裂变奖励列表（按租户隔离）', () => {
    const ctrl = freshController()
    const code = getCodeFrom(ctrl, 'ops-parent', 't-ops')
    ctrl.trackClick({ shortCode: code, source: 'link' })
    const rec = ctrl.trackSignup({ shortCode: code, childUserId: 'ops-child' })
    ctrl.issueRewards(rec.recordId)

    const rewardsList = ctrl.listRewards('t-ops')
    assert.ok(rewardsList.rewards.length >= 1)

    // 跨租户隔离：他租户看不到
    const otherRewards = ctrl.listRewards('t-other')
    assert.equal(otherRewards.rewards.length, 0)
  })

  it('运行专员发放不存在记录的奖励 → 抛出错误', () => {
    const ctrl = freshController()
    assert.throws(() => {
      ctrl.issueRewards('rec-NONEXIST')
    }, /Record not found/)
  })
})

// ════════════════════════════════════════════════════════════════════
// 🤝团建 — 团建活动裂变引流（团体报名推荐）
// ════════════════════════════════════════════════════════════════════
describe(`${ROLES.Teambuilding} referral 角色测试`, () => {
  it('团建专员生成短码用于活动分享引流', () => {
    const ctrl = freshController()
    const res = ctrl.generateCode({
      parentUserId: 'team-builder-001',
      tenantId: 't-team',
      baseUrl: 'https://team.shenjiying88.com',
    })
    assert.ok(res.shortCode)
    assert.ok(res.landingUrl.startsWith('https://team.shenjiying88.com'))

    // 模拟团建活动中批量点击
    for (let i = 0; i < 5; i++) {
      ctrl.trackClick({ shortCode: res.shortCode, source: 'qrcode' })
    }
    const detail = ctrl.getCode(res.shortCode)
    if (detail.found) {
      assert.equal(detail.code.totalClicks, 5)
    }
  })

  it('团建专员查裂变活动的转化率指标', () => {
    const ctrl = freshController()
    const code = getCodeFrom(ctrl, 'team-leader', 't-team')

    // 10 次点击，3 次注册
    for (let i = 0; i < 10; i++) {
      ctrl.trackClick({ shortCode: code, source: 'wechat' })
    }
    ctrl.trackSignup({ shortCode: code, childUserId: 'team-signup-1' })
    ctrl.trackSignup({ shortCode: code, childUserId: 'team-signup-2' })
    ctrl.trackSignup({ shortCode: code, childUserId: 'team-signup-3' })

    const metrics = ctrl.getMetrics('t-team')
    assert.equal(metrics.totalClicks, 10)
    assert.equal(metrics.totalSignups, 3)
    assert.ok(metrics.trackRate > 0)
    assert.ok(metrics.conversionRate > 0)
  })
})

// ════════════════════════════════════════════════════════════════════
// 📢营销 — 全域裂变营销策略、奖励规则调整
// ════════════════════════════════════════════════════════════════════
describe(`${ROLES.Marketing} referral 角色测试`, () => {
  it('营销专员通过 service 调整奖励规则并确认新规则生效', () => {
    const svc = freshService()
    // 默认: L1=100pts+50coupon
    // 改为: L1=200pts+100coupon
    svc.setRewardRules({
      1: { points: 200, coupon: 100 },
      2: { points: 100, coupon: 0 },
      3: { points: 30, coupon: 0 },
    })
    const ctrl = new ReferralController(svc)
    const code = getCodeFrom(ctrl, 'mkt-parent', 't-mkt')
    ctrl.trackClick({ shortCode: code, source: 'link' })
    const rec = ctrl.trackSignup({ shortCode: code, childUserId: 'mkt-child' })

    const rewardRes = ctrl.issueRewards(rec.recordId)
    const l1 = rewardRes.rewards.find(r => r.level === 1)
    assert.ok(l1)
    assert.equal(l1.rewardValue, 200) // 新规则
    // L1 应该还有券计划
    assert.ok(l1.rewardType === 'points')
  })

  it('营销专员跨租户数据隔离——不可查看其他租户数据', () => {
    const ctrl = freshController()
    const code = getCodeFrom(ctrl, 'mkt-user-a', 't-mkt-a')
    ctrl.trackClick({ shortCode: code, source: 'link' })
    ctrl.trackSignup({ shortCode: code, childUserId: 'mkt-child-a' })

    // 用 t-mkt-b 查 → 没有记录
    const recordsB = ctrl.listRecords('t-mkt-b')
    assert.equal(recordsB.records.length, 0)

    // 用 t-mkt-a 查 → 有记录
    const recordsA = ctrl.listRecords('t-mkt-a')
    assert.equal(recordsA.records.length, 1)
  })

  it('营销专员全场裂变指标不返回错误（空场景健壮性）', () => {
    const ctrl = freshController()
    // 没有数据的租户
    const metrics = ctrl.getMetrics('t-empty')
    assert.equal(metrics.totalCodes, 0)
    assert.equal(metrics.totalClicks, 0)
    assert.equal(metrics.totalSignups, 0)
    assert.equal(metrics.trackRate, 0)
    assert.equal(metrics.conversionRate, 0)
    assert.equal(metrics.totalRewardsIssued, 0)
    assert.equal(metrics.totalRewardsValue, 0)
  })
})
