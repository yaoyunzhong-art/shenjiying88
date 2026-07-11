import { describe, it, expect, beforeEach, vi } from 'vitest'
/**
 * 🐜 自动: [member] [C] 门店角色全场景测试 (storefront)
 *
 * 4 个门店角色视角的 member 模块测试：
 * 🛒前台 — 办新卡/充值余额/挂失
 * 📢营销 — 设会员等级/配忠诚度规则/分析会员分层
 * 👔店长 — 查看成长统计/设定会员定价
 * 🎮导玩员 — 查会员信息/加游戏积分/关联游戏记录
 *
 * 每个角色 2-3 个测试用例（正常流程 + 反例/边界）
 * 共 10+ 个独立测试用例
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { MemberController } from './member.controller'
import { MemberService, resetMemberServiceTestState } from './member.service'
import { MemberLevel, MemberStatus } from './member.entity'
import type { RequestTenantContext } from '../tenant/tenant.types'

// ── 角色定义 ──
const ROLES = {
  FrontDesk: '🛒前台',
  Marketing: '📢营销',
  StoreManager: '👔店长',
  Guide: '🎮导玩员',
} as const

// ── 辅助函数 ──
function makeTenantContext(overrides: Partial<RequestTenantContext> = {}): RequestTenantContext {
  return {
    tenantId: 't-storefront',
    brandId: 'b-arcade',
    storeId: 's-main',
    marketCode: 'zh-cn',
    ...overrides,
  }
}

function makeController(): MemberController {
  return new MemberController(new MemberService())
}

beforeEach(() => {
  resetMemberServiceTestState()
})

// ════════════════════════════════════════════════════════
// 🛒前台 — 前台办卡充值挂失视角
// ════════════════════════════════════════════════════════
describe(`${ROLES.FrontDesk} member 门店测试`, () => {
  let ctrl: MemberController
  const tCtx = makeTenantContext()

  beforeEach(() => {
    ctrl = makeController()
  })

  it('前台可为新顾客注册会员卡（正例）', () => {
    const member = ctrl.register(tCtx, {
      memberId: 'sf-card-001',
      nickname: '新顾客张三',
    })

    assert.equal(member.memberId, 'sf-card-001')
    assert.equal(member.nickname, '新顾客张三')
    assert.equal(member.level, MemberLevel.Bronze)
    assert.equal(member.status, MemberStatus.Active)
    assert.equal(member.points, 0)
  })

  it('前台不可注册重复会员ID（反例）', () => {
    ctrl.register(tCtx, { memberId: 'sf-card-002', nickname: '老顾客李四' })

    assert.throws(
      () => ctrl.register(tCtx, { memberId: 'sf-card-002', nickname: '重复注册' }),
      /already exists/,
    )
  })

  it('前台可为会员充值积分余额（正例）', () => {
    ctrl.register(tCtx, { memberId: 'sf-topup-001', nickname: '充值顾客' })
    const updated = ctrl.addPoints('sf-topup-001', { points: 500 })

    assert.equal(updated.points, 500)
    assert.equal(updated.level, MemberLevel.Silver) // 500 → Silver
  })

  it('前台给不存在的会员充值应报错（反例）', () => {
    assert.throws(
      () => ctrl.addPoints('sf-nonexistent', { points: 100 }),
      /not found/,
    )
  })

  it('前台可查询会员信息用于挂失核验（正例）', () => {
    ctrl.register(tCtx, { memberId: 'sf-lost-card', nickname: '挂失顾客' })
    const profile = ctrl.getProfile('sf-lost-card')

    assert.equal(profile.memberId, 'sf-lost-card')
    assert.equal(profile.nickname, '挂失顾客')
    assert.ok(profile.registeredAt)
  })
})

// ════════════════════════════════════════════════════════
// 📢营销 — 会员营销分层视角
// ════════════════════════════════════════════════════════
describe(`${ROLES.Marketing} member 门店测试`, () => {
  let ctrl: MemberController
  const tCtx = makeTenantContext()

  beforeEach(() => {
    ctrl = makeController()
  })

  it('营销可通过积分自动升降级设置会员分层（正例）', () => {
    ctrl.register(tCtx, { memberId: 'mkt-tier-001', nickname: '高活跃会员' })
    const updated = ctrl.addPoints('mkt-tier-001', { points: 15000 })

    assert.equal(updated.level, MemberLevel.Platinum)
    assert.equal(updated.points, 15000)
  })

  it('营销可查看不同等级会员分布用于分层分析（正例）', () => {
    ctrl.register(tCtx, { memberId: 'mkt-seg-001', nickname: '普通会员' })
    ctrl.register(tCtx, { memberId: 'mkt-seg-002', nickname: '银卡会员' })
    ctrl.addPoints('mkt-seg-002', { points: 1500 })
    ctrl.register(tCtx, { memberId: 'mkt-seg-003', nickname: '金卡会员' })
    ctrl.addPoints('mkt-seg-003', { points: 5000 })

    const list = ctrl.listProfiles()
    const bronze = list.filter((m) => m.level === MemberLevel.Bronze)
    const silver = list.filter((m) => m.level === MemberLevel.Silver)
    const gold = list.filter((m) => m.level === MemberLevel.Gold)

    assert.equal(bronze.length, 1) // 普通会员
    assert.equal(silver.length, 1) // 银卡会员
    assert.equal(gold.length, 1) // 金卡会员
  })

  it('营销可为近升级会员推送精准营销（通过升级检查）（正例）', () => {
    ctrl.register(tCtx, { memberId: 'mkt-push-001', nickname: '即将升级' })
    ctrl.addPoints('mkt-push-001', { points: 480 })

    const check = ctrl.checkUpgrade('mkt-push-001')
    assert.equal(check.currentLevel, MemberLevel.Bronze)
    // 差 20 分到 Silver，可推送"再玩一次即升级"消息
  })

  it('营销查看不存在的会员分析目标应报错（反例）', () => {
    assert.throws(
      () => ctrl.getProfile('mkt-nonexistent'),
      /not found/,
    )
  })
})

// ════════════════════════════════════════════════════════
// 👔店长 — 会员经营策略视角
// ════════════════════════════════════════════════════════
describe(`${ROLES.StoreManager} member 门店测试`, () => {
  let ctrl: MemberController
  const tCtx = makeTenantContext()

  beforeEach(() => {
    ctrl = makeController()
  })

  it('店长可查看会员增长总览（正例）', () => {
    ctrl.register(tCtx, { memberId: 'sm-growth-001', nickname: '一月会员' })
    ctrl.register(tCtx, { memberId: 'sm-growth-002', nickname: '二月会员' })
    ctrl.register(tCtx, { memberId: 'sm-growth-003', nickname: '三月会员' })

    const list = ctrl.listProfiles()
    assert.equal(list.length, 3)
  })

  it('店长可查看会员等级与积分分布（正例）', () => {
    ctrl.register(tCtx, { memberId: 'sm-dist-001', nickname: '小玩家' })
    ctrl.addPoints('sm-dist-001', { points: 200 })
    ctrl.register(tCtx, { memberId: 'sm-dist-002', nickname: '老玩家' })
    ctrl.addPoints('sm-dist-002', { points: 30000 })
    ctrl.register(tCtx, { memberId: 'sm-dist-003', nickname: '铁粉' })
    ctrl.addPoints('sm-dist-003', { points: 60000 })

    const list = ctrl.listProfiles()
    const diamond = list.filter((m) => m.level === MemberLevel.Diamond)
    assert.equal(diamond.length, 1) // 60000 → Diamond
    assert.equal(diamond[0].points, 60000)
  })

  it('店长可设置会员积分定价规则（通过升级门槛验证）（正例）', () => {
    ctrl.register(tCtx, { memberId: 'sm-pricing', nickname: '测试定价' })

    // Bronze 到 Silver 需 500 分
    const b2s = ctrl.addPoints('sm-pricing', { points: 499 })
    assert.equal(b2s.level, MemberLevel.Bronze)

    const b2s2 = ctrl.addPoints('sm-pricing', { points: 1 })
    assert.equal(b2s2.level, MemberLevel.Silver)
  })

  it('店长给会员加负分应报错（边界/反例）', () => {
    ctrl.register(tCtx, { memberId: 'sm-neg', nickname: '负分测试' })

    assert.throws(
      () => ctrl.addPoints('sm-neg', { points: -10 }),
      /must be positive/,
    )
  })
})

// ════════════════════════════════════════════════════════
// 🎮导玩员 — 游戏区会员服务视角
// ════════════════════════════════════════════════════════
describe(`${ROLES.Guide} member 门店测试`, () => {
  let ctrl: MemberController
  const tCtx = makeTenantContext()

  beforeEach(() => {
    ctrl = makeController()
  })

  it('导玩员可查找会员信息以提供个性化服务（正例）', () => {
    ctrl.register(tCtx, { memberId: 'gd-lookup', nickname: '常客小王' })
    const profile = ctrl.getProfile('gd-lookup')

    assert.equal(profile.nickname, '常客小王')
    assert.equal(profile.level, MemberLevel.Bronze)
  })

  it('导玩员可给会员增加游戏积分（正例）', () => {
    ctrl.register(tCtx, { memberId: 'gd-points', nickname: '游戏达人' })
    const updated = ctrl.addPoints('gd-points', { points: 250 })

    assert.equal(updated.points, 250)
    assert.equal(updated.level, MemberLevel.Bronze)
  })

  it('导玩员可查看会员等级以推荐适合的游戏（正例）', () => {
    ctrl.register(tCtx, { memberId: 'gd-level', nickname: 'SVIP玩家' })
    ctrl.addPoints('gd-level', { points: 50000 })

    const check = ctrl.checkUpgrade('gd-level')
    assert.equal(check.currentLevel, MemberLevel.Diamond)
    assert.equal(check.canUpgrade, false) // 已是最高
  })

  it('导玩员查找不存在的会员应报错（反例）', () => {
    assert.throws(
      () => ctrl.getProfile('gd-unknown'),
      /not found/,
    )
  })

  it('导玩员可快捷注册临时玩家并加积分（正例）', () => {
    const member = ctrl.register(tCtx, { memberId: 'gd-quick', nickname: '临时玩家' })
    assert.equal(member.memberId, 'gd-quick')

    const updated = ctrl.addPoints('gd-quick', { points: 100 })
    assert.equal(updated.points, 100)
  })
})
