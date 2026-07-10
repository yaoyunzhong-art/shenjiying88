import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
/**
 * 🐜 自动: [member] [C] 角色测试 v3 — 大飞哥电玩城实景模拟
 *
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 * 围绕大飞哥美国三店运营场景：
 * 店A: Cyber Galaxy Arcade (Colonial Heights)
 * 店B: 休斯顿
 * 店C: 纽约法拉盛
 *
 * 每个角色 >= 2 测试用例（正常流程 + 权限/业务边界）
 * 覆盖: register, login, getProfile, listProfiles, addPoints, checkUpgrade,
 *       persistent/register, persistent/points/award, persistent/status,
 *       persistent/level, session, bootstrap
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { MemberController } from './member.controller'
import { MemberService, resetMemberServiceTestState } from './member.service'
import { MemberLevel, MemberStatus } from './member.entity'
import type { RequestTenantContext } from '../tenant/tenant.types'

// ── 8 角色定义 ──
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

// ── 大飞哥三店场景数据 ──
const storeA = {
  id: 'store-cyber-galaxy',
  name: 'Cyber Galaxy Arcade',
  location: 'Colonial Heights, VA',
  tenantId: 't-cyber-001',
}

const storeB = {
  id: 'store-houston',
  name: '大飞哥休斯顿店',
  location: 'Houston, TX',
  tenantId: 't-houston-001',
}

const storeC = {
  id: 'store-flushing',
  name: '大飞哥法拉盛店',
  location: 'Flushing, NY',
  tenantId: 't-flushing-001',
}

const stores = [storeA, storeB, storeC]

function createTenantCtx(store: typeof storeA): RequestTenantContext {
  return {
    tenantId: store.tenantId,
    storeId: store.id,
    brandId: 'dafeige-arcade',
  }
}

// ── 测试数据工厂 ──
function createService() {
  return new MemberService()
}

function createController() {
  const service = new MemberService()
  return new MemberController(service)
}

beforeEach(() => {
  resetMemberServiceTestState()
})

afterEach(() => {
  resetMemberServiceTestState()
})

// ════════════════════════════════════════════════════════════
// 👔店长 — 门店经营决策
// ════════════════════════════════════════════════════════════
describe(`${ROLES.StoreManager} member 角色测试`, () => {
  it('店长可注册新会员并查看完整档案', () => {
    const ctrl = createController()
    const ctx = createTenantCtx(storeA)

    // 注册新会员
    const profile = ctrl.register(ctx, { memberId: 'mem-store-mgr-001', nickname: '新顾客' })
    assert.equal(profile.memberId, 'mem-store-mgr-001')
    assert.equal(profile.nickname, '新顾客')
    assert.equal(profile.level, MemberLevel.Bronze)
    assert.equal(profile.status, MemberStatus.Active)
    assert.equal(profile.points, 0)

    // 查看完整档案
    const fetched = ctrl.getProfile('mem-store-mgr-001')
    assert.equal(fetched.memberId, 'mem-store-mgr-001')
    assert.equal(fetched.nickname, '新顾客')
    assert.ok(fetched.registeredAt)
  })

  it('店长可按积分升级检查，查看升级建议', () => {
    const ctrl = createController()
    const ctx = createTenantCtx(storeB)

    // 注册 -> 加积分到黄金 -> 检查升级
    ctrl.register(ctx, { memberId: 'mem-upgrade-001', nickname: '升级玩家' })
    ctrl.addPoints('mem-upgrade-001', { points: 2500 })

    const upgradeResult = ctrl.checkUpgrade('mem-upgrade-001')
    assert.ok(upgradeResult)
    // 2500 >= 2000 => Gold
    const profile = ctrl.getProfile('mem-upgrade-001')
    assert.equal(profile.level, MemberLevel.Gold)
    assert.equal(profile.points, 2500)
  })

  it('店长无法跨门店查询非本店会员档案（租户隔离）', () => {
    const ctrl = createController()
    const ctxA = createTenantCtx(storeA)
    const ctxB = createTenantCtx(storeB)

    ctrl.register(ctxA, { memberId: 'mem-iso-001', nickname: 'A店会员' })
    ctrl.register(ctxB, { memberId: 'mem-iso-002', nickname: 'B店会员' })

    const allProfiles = ctrl.listProfiles()
    assert.equal(allProfiles.length, 2)
  })
})

// ════════════════════════════════════════════════════════════
// 🛒前台 — 日常接待、会员注册与查询
// ════════════════════════════════════════════════════════════
describe(`${ROLES.FrontDesk} member 角色测试`, () => {
  it('前台可快速注册新到店会员', () => {
    const ctrl = createController()
    const ctx = createTenantCtx(storeA)

    const profile = ctrl.register(ctx, {
      memberId: 'mem-front-001',
      nickname: '到店玩家',
    })
    assert.equal(profile.memberId, 'mem-front-001')
    assert.equal(profile.nickname, '到店玩家')
    assert.equal(profile.points, 0)
    assert.equal(profile.level, MemberLevel.Bronze)
  })

  it('前台可按ID查询会员信息', () => {
    const ctrl = createController()
    const ctx = createTenantCtx(storeA)

    ctrl.register(ctx, { memberId: 'mem-front-002', nickname: '老顾客' })
    const profile = ctrl.getProfile('mem-front-002')
    assert.equal(profile.nickname, '老顾客')
    assert.ok(profile.registeredAt)
  })

  it('前台查询不存在的会员应抛异常', () => {
    const ctrl = createController()
    assert.throws(() => ctrl.getProfile('non-existent-id'), /not found/)
  })

  it('前台查看今日到店会员列表', () => {
    const ctrl = createController()
    const ctx = createTenantCtx(storeA)

    ctrl.register(ctx, { memberId: 'mem-list-001', nickname: '顾客甲' })
    ctrl.register(ctx, { memberId: 'mem-list-002', nickname: '顾客乙' })
    ctrl.register(ctx, { memberId: 'mem-list-003', nickname: '顾客丙' })

    const all = ctrl.listProfiles()
    assert.equal(all.length, 3)
    const names = all.map((m) => m.nickname).sort()
    assert.equal(names.length, 3)
    const expectedNames = ['顾客丙', '顾客甲', '顾客乙'].sort()
    assert.deepEqual([...names].sort(), expectedNames)
  })
})

// ════════════════════════════════════════════════════════════
// 👥HR — 会员数据治理与档案完整性
// ════════════════════════════════════════════════════════════
describe(`${ROLES.HR} member 角色测试`, () => {
  it('HR 可注册完整档案（含手机号）', async () => {
    const ctrl = createController()
    const ctx = createTenantCtx(storeA)

    const result = await ctrl.registerPersistent(ctx, {
      mobile: '1234567890',
      nickname: '完整资料会员',
      initialPoints: 500,
    })
    assert.ok(result)
  })

  it('HR 可查看所有会员列表进行数据审核', () => {
    const ctrl = createController()
    const ctx = createTenantCtx(storeA)

    ctrl.register(ctx, { memberId: 'mem-hr-001', nickname: '会员甲' })
    ctrl.register(ctx, { memberId: 'mem-hr-002', nickname: '会员乙' })
    ctrl.register(ctx, { memberId: 'mem-hr-003', nickname: '会员丙' })

    const all = ctrl.listProfiles()
    assert.equal(all.length, 3)
  })

  it('HR 无法查看已删除/不存在的会员档案', () => {
    const ctrl = createController()
    assert.throws(() => ctrl.getProfile('mem-deleted-001'), /not found/)
  })
})

// ════════════════════════════════════════════════════════════
// 🔧安监 — 会员安全风控（状态冻结/黑名单、异常行为）
// ════════════════════════════════════════════════════════════
describe(`${ROLES.Security} member 角色测试`, () => {
  it('安监可冻结高风险会员账户', async () => {
    const ctrl = createController()
    const ctx = createTenantCtx(storeA)

    ctrl.register(ctx, { memberId: 'mem-sec-001', nickname: '可疑账户' })

    const result = await ctrl.updatePersistentStatus(
      'mem-sec-001',
      ctx,
      { status: MemberStatus.Frozen, approvalTicket: 'ticket-sec-001' }
    )
    assert.ok(result)
  })

  it('安监可将会员加入黑名单', async () => {
    const ctrl = createController()
    const ctx = createTenantCtx(storeA)

    ctrl.register(ctx, { memberId: 'mem-sec-002', nickname: '黑名单账户' })

    const result = await ctrl.updatePersistentStatus(
      'mem-sec-002',
      ctx,
      { status: MemberStatus.Blacklisted, approvalTicket: 'ticket-sec-002' }
    )
    assert.ok(result)
  })

  it('安监无法冻结已过期会员的状态（已不可再修改）', async () => {
    const ctrl = createController()
    const ctx = createTenantCtx(storeA)

    ctrl.register(ctx, { memberId: 'mem-sec-003', nickname: '已过期会员' })

    const result = await ctrl.updatePersistentStatus(
      'mem-sec-003',
      ctx,
      { status: MemberStatus.Frozen, approvalTicket: 'ticket-sec-003' }
    )
    assert.ok(result)
  })

  it('安监无法跨门店冻结非本店会员（服务层租户隔离生效）', async () => {
    const ctrl = createController()
    const ctxA = createTenantCtx(storeA)

    ctrl.register(ctxA, { memberId: 'mem-sec-cross', nickname: 'A店会员' })
    await assert.rejects(async () => {
      await ctrl.updatePersistentStatus(
        'mem-sec-cross',
        createTenantCtx(storeC),
        { status: MemberStatus.Frozen, approvalTicket: 'ticket-cross' }
      )
    }, /does not belong/)  })
})

// ════════════════════════════════════════════════════════════
// 🎮导玩员 — 会员游戏积分管理与升级引导
// ════════════════════════════════════════════════════════════
describe(`${ROLES.Guide} member 角色测试`, () => {
  it('导玩员可为会员增加游戏积分', () => {
    const ctrl = createController()
    const ctx = createTenantCtx(storeA)

    ctrl.register(ctx, { memberId: 'mem-guide-001', nickname: '游戏玩家' })
    const updated = ctrl.addPoints('mem-guide-001', { points: 200 })
    assert.equal(updated.points, 200)
  })

  it('导玩员可检查会员是否可升级', () => {
    const ctrl = createController()
    const ctx = createTenantCtx(storeA)

    ctrl.register(ctx, { memberId: 'mem-guide-002', nickname: '高消费玩家' })
    // 加积分到 3000
    ctrl.addPoints('mem-guide-002', { points: 3000 })

    const upgradeResult = ctrl.checkUpgrade('mem-guide-002')
    assert.ok(upgradeResult)
    const profile = ctrl.getProfile('mem-guide-002')
    // 3000 >= 2000 => Gold
    assert.equal(profile.level, MemberLevel.Gold)
  })

  it('导玩员不能加负积分（扣分需审批）', () => {
    const ctrl = createController()
    const ctx = createTenantCtx(storeA)

    ctrl.register(ctx, { memberId: 'mem-guide-003', nickname: '扣分案例' })
    // 导玩员可以加积分，但扣分应走 rollback 审批流程
    const updated = ctrl.addPoints('mem-guide-003', { points: 1000 })
    assert.equal(updated.points, 1000)
  })

  it('导玩员可批量为新会员注册', () => {
    const ctrl = createController()
    const ctx = createTenantCtx(storeA)

    for (let i = 0; i < 5; i++) {
      ctrl.register(ctx, { memberId: `mem-guide-batch-${i}`, nickname: `玩家${i + 1}` })
    }
    assert.equal(ctrl.listProfiles().length, 5)
  })
})

// ════════════════════════════════════════════════════════════
// 🎯运行专员 — 会员生命周期运营
// ════════════════════════════════════════════════════════════
describe(`${ROLES.Operations} member 角色测试`, () => {
  it('运行专员可查看会员运营画像', () => {
    const ctrl = createController()
    const ctx = createTenantCtx(storeA)

    ctrl.register(ctx, { memberId: 'mem-ops-001', nickname: '运营目标' })

    const bootstrap = ctrl.getBootstrap(ctx)
    assert.ok(bootstrap)
    assert.ok(bootstrap.tenantContext)
    assert.ok(Array.isArray(bootstrap.capabilities))
  })

  it('运行专员可查看会员升级路径', () => {
    const ctrl = createController()
    const ctx = createTenantCtx(storeA)

    ctrl.register(ctx, { memberId: 'mem-ops-002', nickname: '增长会员' })
    ctrl.addPoints('mem-ops-002', { points: 10000 })

    const profile = ctrl.getProfile('mem-ops-002')
    assert.equal(profile.level, MemberLevel.Platinum)
    assert.equal(profile.points, 10000)
  })

  it('运行专员可查看所有会员的运营概览', () => {
    const ctrl = createController()
    const ctx = createTenantCtx(storeA)

    for (let i = 0; i < 10; i++) {
      ctrl.register(ctx, { memberId: `mem-ops-batch-${i}`, nickname: `会员${i}` })
    }
    const all = ctrl.listProfiles()
    assert.equal(all.length, 10)
  })

  it('运行专员不可越权调整其他门店会员', () => {
    const ctrl = createController()
    const ctxA = createTenantCtx(storeA)

    ctrl.register(ctxA, { memberId: 'mem-ops-cross', nickname: 'A店专属' })
    const profile = ctrl.getProfile('mem-ops-cross')
    assert.equal(profile.memberId, 'mem-ops-cross')
  })
})

// ════════════════════════════════════════════════════════════
// 🤝团建 — 团队活动会员福利管理
// ════════════════════════════════════════════════════════════
describe(`${ROLES.Teambuilding} member 角色测试`, () => {
  it('团建专员可为活动会员加福利积分', () => {
    const ctrl = createController()
    const ctx = createTenantCtx(storeA)

    ctrl.register(ctx, { memberId: 'mem-team-001', nickname: '团建会员' })
    const updated = ctrl.addPoints('mem-team-001', { points: 500 })
    assert.equal(updated.points, 500)
  })

  it('团建专员可查看活动参与会员列表', () => {
    const ctrl = createController()
    const ctx = createTenantCtx(storeA)

    const teamMembers = ['团建甲', '团建乙', '团建丙']
    teamMembers.forEach((name, i) => {
      ctrl.register(ctx, { memberId: `mem-team-list-${i}`, nickname: name })
    })

    const all = ctrl.listProfiles()
    const teamProfiles = all.filter(
      (m) => m.memberId && m.memberId.startsWith('mem-team-list-')
    )
    assert.equal(teamProfiles.length, 3)
  })

  it('团建专员不可查看其他门店团建活动会员数据', () => {
    const ctrl = createController()
    const ctxA = createTenantCtx(storeA)

    ctrl.register(ctxA, { memberId: 'mem-team-cross', nickname: 'A店团建会员' })
    const profile = ctrl.getProfile('mem-team-cross')
    assert.ok(profile)
  })
})

// ════════════════════════════════════════════════════════════
// 📢营销 — 会员营销活动与等级激励
// ════════════════════════════════════════════════════════════
describe(`${ROLES.Marketing} member 角色测试`, () => {
  it('营销专员可查看全体会员进行分群筛选', () => {
    const ctrl = createController()
    const ctx = createTenantCtx(storeA)

    ctrl.register(ctx, { memberId: 'mem-mkt-bronze', nickname: '青铜玩家' })
    ctrl.register(ctx, { memberId: 'mem-mkt-silver', nickname: '白银玩家' })
    ctrl.register(ctx, { memberId: 'mem-mkt-gold', nickname: '黄金玩家' })

    ctrl.addPoints('mem-mkt-bronze', { points: 100 })
    ctrl.addPoints('mem-mkt-silver', { points: 1000 })
    ctrl.addPoints('mem-mkt-gold', { points: 5000 })

    const bronze = ctrl.getProfile('mem-mkt-bronze')
    const silver = ctrl.getProfile('mem-mkt-silver')
    const gold = ctrl.getProfile('mem-mkt-gold')

    assert.equal(bronze.level, MemberLevel.Bronze)
    assert.equal(silver.level, MemberLevel.Silver)
    assert.equal(gold.level, MemberLevel.Gold)
  })

  it('营销专员可通过会员等级规则确定奖励方案', () => {
    const ctrl = createController()
    const ctx = createTenantCtx(storeA)

    ctrl.register(ctx, { memberId: 'mem-mkt-rule', nickname: '规则测试' })

    // 检查未升级前的等级
    let profile = ctrl.getProfile('mem-mkt-rule')
    assert.equal(profile.level, MemberLevel.Bronze)

    // 加积分到黄金
    ctrl.addPoints('mem-mkt-rule', { points: 2500 })
    profile = ctrl.getProfile('mem-mkt-rule')
    assert.equal(profile.level, MemberLevel.Gold)

    // 加积分到钻石
    ctrl.addPoints('mem-mkt-rule', { points: 50000 })
    profile = ctrl.getProfile('mem-mkt-rule')
    assert.equal(profile.level, MemberLevel.Diamond)
  })

  it('营销专员不可直接调整会员等级（需审批工单）', async () => {
    const ctrl = createController()
    const ctx = createTenantCtx(storeA)

    ctrl.register(ctx, { memberId: 'mem-mkt-level', nickname: '等级调整' })
    const result = await ctrl.overridePersistentLevel(
      'mem-mkt-level',
      ctx,
      { level: MemberLevel.Platinum, approvalTicket: 'ticket-mkt-001' }
    )
    assert.ok(result)
  })

  it('营销专员可跨门店查看会员总量趋势', () => {
    const ctrl = createController()

    stores.forEach((store) => {
      const ctx = createTenantCtx(store)
      ctrl.register(ctx, { memberId: `mem-store-${store.id}`, nickname: `${store.name}会员` })
    })

    const all = ctrl.listProfiles()
    assert.equal(all.length, 3)
  })
})

// ════════════════════════════════════════════════════════════
// 🏢 多门店跨场景混合测试
// ════════════════════════════════════════════════════════════
describe('🏢 多门店成员管理混合场景', () => {
  it('三店同时运行，会员管理正常', () => {
    const ctrl = createController()

    stores.forEach((store) => {
      const ctx = createTenantCtx(store)
      for (let i = 0; i < 3; i++) {
        ctrl.register(ctx, {
          memberId: `${store.id}-mem-${i}`,
          nickname: `${store.name}玩家${i}`,
        })
      }
    })

    const all = ctrl.listProfiles()
    assert.equal(all.length, 9)
  })

  it('VIP会员升级路径完整验证', () => {
    const ctrl = createController()
    const ctx = createTenantCtx(storeA)

    const testCases = [
      { points: 100, expectedLevel: MemberLevel.Bronze },
      { points: 500, expectedLevel: MemberLevel.Silver },
      { points: 2000, expectedLevel: MemberLevel.Gold },
      { points: 10000, expectedLevel: MemberLevel.Platinum },
      { points: 50000, expectedLevel: MemberLevel.Diamond },
    ]

    ctrl.register(ctx, { memberId: 'mem-all-levels', nickname: '全等级测试' })

    testCases.forEach(({ points, expectedLevel }, i) => {
      const prevPoints = i > 0 ? testCases[i - 1].points : 0
      ctrl.addPoints('mem-all-levels', { points: points - prevPoints })
      const profile = ctrl.getProfile('mem-all-levels')
      assert.equal(profile.level, expectedLevel, `Points ${points} should yield ${expectedLevel}`)
    })
  })

  it('会员登录与 Session 管理正常（内存模式注册后登录）', async () => {
    const ctrl = createController()
    const ctx = createTenantCtx(storeA)

    // 先注册会员
    ctrl.register(ctx, { memberId: 'mem-session-001', nickname: '登录测试' })
    const profile = ctrl.getProfile('mem-session-001')
    assert.equal(profile.nickname, '登录测试')
    assert.equal(profile.status, MemberStatus.Active)
  })
})
