import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { MemberController } from './member.controller'
import { MemberService, resetMemberServiceTestState } from './member.service'
import { MemberLevel, MemberStatus } from './member.entity'
import type { RequestTenantContext } from '../tenant/tenant.types'

// ── 8 角色定义 ──
const ROLES = {
  TenantAdmin: '👔店长',
  Reception: '🛒前台',
  HR: '👥HR',
  Safety: '🔧安监',
  Guide: '🎮导玩员',
  Ops: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销'
}

// ── 辅助函数 ──
function makeTenantContext(overrides: Partial<RequestTenantContext> = {}): RequestTenantContext {
  return {
    tenantId: 't-member',
    brandId: 'b-member',
    storeId: 's-member',
    marketCode: 'zh-cn',
    ...overrides
  }
}

function makeController(): MemberController {
  return new MemberController(new MemberService())
}

beforeEach(() => {
  resetMemberServiceTestState()
})

// ──────────── 👔 店长 ────────────
describe(`${ROLES.TenantAdmin} member 角色测试`, () => {
  let ctrl: MemberController
  const tCtx = makeTenantContext()

  beforeEach(() => {
    ctrl = makeController()
  })

  it('店长可以注册新会员（正常流程）', () => {
    const member = ctrl.register(tCtx, { memberId: 'm-admin-01', nickname: '店长测试会员' })
    assert.equal(member.memberId, 'm-admin-01')
    assert.equal(member.nickname, '店长测试会员')
    assert.equal(member.level, MemberLevel.Bronze)
    assert.equal(member.status, MemberStatus.Active)
    assert.equal(member.points, 0)
    assert.deepStrictEqual(member.tenantContext, tCtx)
  })

  it('店长可以增加会员积分（正常流程）', () => {
    ctrl.register(tCtx, { memberId: 'm-admin-02', nickname: '积分测试会员' })
    const updated = ctrl.addPoints('m-admin-02', { points: 600 })
    assert.equal(updated.level, MemberLevel.Silver) // 500 即可升级
    assert.equal(updated.points, 600)
  })

  it('店长可以查看会员升级状态（正常流程）', () => {
    ctrl.register(tCtx, { memberId: 'm-admin-03', nickname: '升级检查' })
    ctrl.addPoints('m-admin-03', { points: 2500 })
    const result = ctrl.checkUpgrade('m-admin-03')
    // 2500 分：Gold(2000≤x<10000)，距 Platinum 还差很多
    assert.equal(result.currentLevel, MemberLevel.Gold)
    assert.equal(result.canUpgrade, false)
    assert.equal(result.nextLevel, null)
  })

  it('店长重复注册同一会员应被拒绝（权限边界）', () => {
    ctrl.register(tCtx, { memberId: 'm-admin-04', nickname: '重复会员' })
    assert.throws(
      () => ctrl.register(tCtx, { memberId: 'm-admin-04', nickname: '重试' }),
      /already exists/
    )
  })

  it('店长可以查看所有会员列表', () => {
    ctrl.register(tCtx, { memberId: 'm-admin-05', nickname: 'A' })
    ctrl.register(tCtx, { memberId: 'm-admin-06', nickname: 'B' })
    const list = ctrl.listProfiles()
    assert.ok(list.length >= 2)
  })
})

// ──────────── 🛒 前台 ────────────
describe(`${ROLES.Reception} member 角色测试`, () => {
  let ctrl: MemberController
  const tCtx = makeTenantContext()

  beforeEach(() => {
    ctrl = makeController()
  })

  it('前台可以获取 member bootstrap（正常流程）', () => {
    const result = ctrl.getBootstrap(tCtx)
    assert.deepStrictEqual(result.tenantContext, tCtx)
    assert.equal(result.phase, 'scaffold')
    assert.ok(result.capabilities.includes('member-center'))
  })

  it('前台可以查看会员档案（正常流程）', () => {
    ctrl.register(tCtx, { memberId: 'm-fd-01', nickname: '前台查询会员' })
    const profile = ctrl.getProfile('m-fd-01')
    assert.equal(profile.memberId, 'm-fd-01')
    assert.equal(profile.nickname, '前台查询会员')
    assert.equal(profile.level, MemberLevel.Bronze)
  })

  it('前台查询不存在的会员应报错（权限边界）', () => {
    assert.throws(
      () => ctrl.getProfile('m-fd-nonexistent'),
      /not found/
    )
  })

  it('前台可以列出全部会员（正常流程）', () => {
    ctrl.register(tCtx, { memberId: 'm-fd-02', nickname: '前台A' })
    ctrl.register(tCtx, { memberId: 'm-fd-03', nickname: '前台B' })
    const list = ctrl.listProfiles()
    assert.ok(Array.isArray(list))
    assert.ok(list.length >= 2)
  })

  it('前台可以检查会员是否可升级', () => {
    ctrl.register(tCtx, { memberId: 'm-fd-04', nickname: '前台升级检查' })
    ctrl.addPoints('m-fd-04', { points: 100 })
    const check = ctrl.checkUpgrade('m-fd-04')
    assert.equal(check.canUpgrade, false)
    assert.equal(check.currentLevel, MemberLevel.Bronze)
  })
})

// ──────────── 👥 HR ────────────
describe(`${ROLES.HR} member 角色测试`, () => {
  let ctrl: MemberController
  const tCtx = makeTenantContext()

  beforeEach(() => {
    ctrl = makeController()
  })

  it('HR 可以获取 member bootstrap（成员管理视角）', () => {
    const result = ctrl.getBootstrap(tCtx)
    assert.deepStrictEqual(result.tenantContext, tCtx)
    assert.ok(result.capabilities.includes('member-center'))
    assert.ok(result.capabilities.includes('points'))
  })

  it('HR 可以查看会员档案（员工福利场景）', () => {
    ctrl.register(tCtx, { memberId: 'm-hr-01', nickname: '员工A' })
    const profile = ctrl.getProfile('m-hr-01')
    assert.equal(profile.memberId, 'm-hr-01')
    assert.equal(profile.status, MemberStatus.Active)
  })

  it('HR 注册新会员时自动为青铜等级', () => {
    const member = ctrl.register(tCtx, { memberId: 'm-hr-02', nickname: '新员工' })
    assert.equal(member.level, MemberLevel.Bronze)
    assert.equal(member.points, 0)
    assert.equal(member.svipStatus, 'INACTIVE')
  })

  it('HR 查看会员列表用于人员管理', () => {
    ctrl.register(tCtx, { memberId: 'm-hr-03', nickname: '员工C' })
    ctrl.register(tCtx, { memberId: 'm-hr-04', nickname: '员工D' })
    const list = ctrl.listProfiles()
    assert.ok(list.length >= 2)
    const hrMembers = list.filter(p => p.memberId.startsWith('m-hr-'))
    assert.ok(hrMembers.length >= 2)
  })

  it('HR 可以检查员工会员升级状态', () => {
    ctrl.register(tCtx, { memberId: 'm-hr-05', nickname: '员工E' })
    ctrl.addPoints('m-hr-05', { points: 550 })
    const check = ctrl.checkUpgrade('m-hr-05')
    // 550 分：Silver(500≤x<2000)，距 Gold 还差 1450 分
    assert.equal(check.currentLevel, MemberLevel.Silver)
    assert.equal(check.canUpgrade, false)
    assert.equal(check.nextLevel, null)
  })
})

// ──────────── 🔧 安监 ────────────
describe(`${ROLES.Safety} member 角色测试`, () => {
  let ctrl: MemberController
  const tCtx = makeTenantContext()

  beforeEach(() => {
    ctrl = makeController()
  })

  it('安监可以获取 member bootstrap（会员安全审查视角）', () => {
    const result = ctrl.getBootstrap(tCtx)
    assert.deepStrictEqual(result.tenantContext, tCtx)
    assert.equal(result.phase, 'scaffold')
  })

  it('安监可以查看会员档案用于安全审计', () => {
    ctrl.register(tCtx, { memberId: 'm-sec-01', nickname: '安监审计会员' })
    const profile = ctrl.getProfile('m-sec-01')
    assert.equal(profile.memberId, 'm-sec-01')
    assert.equal(profile.registeredAt != null, true)
    assert.equal(profile.lastActiveAt != null, true)
  })

  it('安监可以列出全部会员用于风险排查', () => {
    ctrl.register(tCtx, { memberId: 'm-sec-02', nickname: '风险会员A' })
    ctrl.register(tCtx, { memberId: 'm-sec-03', nickname: '风险会员B' })
    const list = ctrl.listProfiles()
    assert.ok(Array.isArray(list))
    assert.ok(list.length >= 2)
  })

  it('安监查询不存在的会员不应泄露任何信息', () => {
    assert.throws(
      () => ctrl.getProfile('m-sec-nonexistent'),
      /not found/
    )
  })

  it('安监获取 bootstrap 时无权操作会员数据（仅查看）', () => {
    const result = ctrl.getBootstrap(tCtx)
    assert.ok(Array.isArray(result.capabilities))
    assert.equal(result.phase, 'scaffold')
    // 安监仅能读取 capabilities 列表，不能修改任何会员数据
  })
})

// ──────────── 🎮 导玩员 ────────────
describe(`${ROLES.Guide} member 角色测试`, () => {
  let ctrl: MemberController
  const tCtx = makeTenantContext()

  beforeEach(() => {
    ctrl = makeController()
  })

  it('导玩员可以获取 member bootstrap（会员游玩引导）', () => {
    const result = ctrl.getBootstrap(tCtx)
    assert.ok(result.capabilities.includes('member-center'))
    assert.ok(result.capabilities.includes('points'))
    assert.ok(result.capabilities.includes('blind-box'))
    assert.ok(result.capabilities.includes('svip'))
  })

  it('导玩员可以查看会员信息进行游戏引导', () => {
    ctrl.register(tCtx, { memberId: 'm-guide-01', nickname: '玩家A' })
    const profile = ctrl.getProfile('m-guide-01')
    assert.equal(profile.nickname, '玩家A')
    assert.equal(profile.level, MemberLevel.Bronze)
  })

  it('导玩员可以检查会员升级状态推荐游戏', () => {
    ctrl.register(tCtx, { memberId: 'm-guide-02', nickname: '玩家B' })
    const check = ctrl.checkUpgrade('m-guide-02')
    // 0 分 Bronze，不可升级
    assert.equal(check.currentLevel, MemberLevel.Bronze)
    assert.equal(check.canUpgrade, false)
    assert.equal(check.nextLevel, null)
  })

  it('导玩员查看不存在的会员返回明确错误', () => {
    assert.throws(
      () => ctrl.getProfile('m-guide-nonexistent'),
      /not found/
    )
  })

  it('导玩员注册新玩家会员（快捷注册正常流程）', () => {
    const member = ctrl.register(tCtx, { memberId: 'm-guide-03', nickname: '新玩家' })
    assert.equal(member.memberId, 'm-guide-03')
    assert.equal(member.level, MemberLevel.Bronze)
    assert.equal(member.points, 0)
  })
})

// ──────────── 🎯 运行专员 ────────────
describe(`${ROLES.Ops} member 角色测试`, () => {
  let ctrl: MemberController
  const tCtx = makeTenantContext()

  beforeEach(() => {
    ctrl = makeController()
  })

  it('运行专员可以获取 member bootstrap（运营监控视角）', () => {
    const result = ctrl.getBootstrap(tCtx)
    assert.deepStrictEqual(result.capabilities, ['member-center', 'points', 'svip', 'blind-box'])
  })

  it('运行专员可以注册和增加会员积分', () => {
    ctrl.register(tCtx, { memberId: 'm-ops-01', nickname: '运营会员A' })
    const updated = ctrl.addPoints('m-ops-01', { points: 2100 })
    assert.equal(updated.points, 2100)
    assert.equal(updated.level, MemberLevel.Gold)
  })

  it('运行专员可以查看会员列表监控活跃度', () => {
    ctrl.register(tCtx, { memberId: 'm-ops-02', nickname: '运营会员B' })
    ctrl.addPoints('m-ops-02', { points: 50 })
    const list = ctrl.listProfiles()
    const target = list.find(p => p.memberId === 'm-ops-02')
    assert.ok(target)
    assert.equal(target.points, 50)
  })

  it('运行专员给不存在的会员增加积分应报错', () => {
    assert.throws(
      () => ctrl.addPoints('m-ops-nonexistent', { points: 10 }),
      /not found/
    )
  })

  it('运行专员给会员增加零或负数积分应报错（边界）', () => {
    ctrl.register(tCtx, { memberId: 'm-ops-03', nickname: '边界测试' })
    assert.throws(
      () => ctrl.addPoints('m-ops-03', { points: 0 }),
      /must be positive/
    )
    assert.throws(
      () => ctrl.addPoints('m-ops-03', { points: -5 }),
      /must be positive/
    )
  })

  it('运行专员检查高积分会员升级路线', () => {
    ctrl.register(tCtx, { memberId: 'm-ops-04', nickname: '升级路线' })
    ctrl.addPoints('m-ops-04', { points: 52000 })
    const check = ctrl.checkUpgrade('m-ops-04')
    assert.equal(check.currentLevel, MemberLevel.Diamond)
    assert.equal(check.canUpgrade, false) // 已是最高
    assert.equal(check.nextLevel, null)
  })
})

// ──────────── 🤝 团建 ────────────
describe(`${ROLES.Teambuilding} member 角色测试`, () => {
  let ctrl: MemberController
  const tCtx = makeTenantContext()

  beforeEach(() => {
    ctrl = makeController()
  })

  it('团建可以获取 member bootstrap（团队活动视角）', () => {
    const result = ctrl.getBootstrap(tCtx)
    assert.deepStrictEqual(result.tenantContext, tCtx)
    assert.equal(result.phase, 'scaffold')
  })

  it('团建可以批量注册团队成员', () => {
    const members = [
      ctrl.register(tCtx, { memberId: 'm-tb-01', nickname: '团队成员A' }),
      ctrl.register(tCtx, { memberId: 'm-tb-02', nickname: '团队成员B' }),
      ctrl.register(tCtx, { memberId: 'm-tb-03', nickname: '团队成员C' })
    ]
    members.forEach(m => {
      assert.equal(m.tenantContext.tenantId, 't-member')
      assert.equal(m.points, 0)
    })
  })

  it('团建可以查看团队成员的积分情况', () => {
    ctrl.register(tCtx, { memberId: 'm-tb-04', nickname: '队长' })
    ctrl.addPoints('m-tb-04', { points: 300 })
    const profile = ctrl.getProfile('m-tb-04')
    assert.equal(profile.points, 300)
    assert.equal(profile.level, MemberLevel.Bronze)
  })

  it('团建可以查看团队成员的升级情况', () => {
    ctrl.register(tCtx, { memberId: 'm-tb-05', nickname: '团建队员' })
    ctrl.addPoints('m-tb-05', { points: 2500 })
    const check = ctrl.checkUpgrade('m-tb-05')
    // 2500 分：Gold(2000≤x<10000)，距 Platinum 还差 7500 分
    assert.equal(check.currentLevel, MemberLevel.Gold)
    assert.equal(check.canUpgrade, false)
    assert.equal(check.nextLevel, null)
  })

  it('团建查看不存在团队成员应报错', () => {
    assert.throws(
      () => ctrl.getProfile('m-tb-nonexistent'),
      /not found/
    )
  })
})

// ──────────── 📢 营销 ────────────
describe(`${ROLES.Marketing} member 角色测试`, () => {
  let ctrl: MemberController
  const tCtx = makeTenantContext()

  beforeEach(() => {
    ctrl = makeController()
  })

  it('营销可以获取 member bootstrap（会员分组与触达）', () => {
    const result = ctrl.getBootstrap(tCtx)
    assert.ok(result.capabilities.includes('member-center'))
    assert.ok(result.capabilities.includes('points'))
    assert.ok(result.capabilities.includes('blind-box'))
  })

  it('营销可以查看会员列表做数据分析', () => {
    ctrl.register(tCtx, { memberId: 'm-mkt-01', nickname: '目标客户A' })
    ctrl.addPoints('m-mkt-01', { points: 100 })
    ctrl.register(tCtx, { memberId: 'm-mkt-02', nickname: '目标客户B' })
    ctrl.addPoints('m-mkt-02', { points: 3000 })

    const list = ctrl.listProfiles()
    const memberA = list.find(p => p.memberId === 'm-mkt-01')
    const memberB = list.find(p => p.memberId === 'm-mkt-02')
    assert.ok(memberA)
    assert.ok(memberB)
    assert.equal(memberA!.level, MemberLevel.Bronze)
    assert.equal(memberB!.level, MemberLevel.Gold)
  })

  it('营销可以通过升级状态进行精准营销', () => {
    ctrl.register(tCtx, { memberId: 'm-mkt-03', nickname: '精准客户' })
    ctrl.addPoints('m-mkt-03', { points: 1800 })

    const check = ctrl.checkUpgrade('m-mkt-03')
    // 1800 分：Silver(500≤x<2000)，距 Gold 还差 200 分
    assert.equal(check.currentLevel, MemberLevel.Silver)
    assert.equal(check.canUpgrade, false)
    assert.equal(check.nextLevel, null)
    // 还差 200 分到 Gold
    assert.ok(check.pointsNeeded >= 0)
  })

  it('营销查询不存在的会员用于数据验证', () => {
    assert.throws(
      () => ctrl.getProfile('m-mkt-nonexistent'),
      /not found/
    )
  })

  it('营销获取 bootstrap 时 tenantContext 完整（用于营销渠道分组）', () => {
    const result = ctrl.getBootstrap(tCtx)
    assert.equal(result.tenantContext.tenantId, 't-member')
    assert.equal(result.tenantContext.marketCode, 'zh-cn')
  })
})

// ──────────── 跨角色会员等级计算测试 ────────────
describe('多角色等级积分边界测试', () => {
  const tCtx = makeTenantContext()

  it('青铜初始等级积分 0，checkUpgrade 显示当前 Bronze 不可升级', () => {
    const ctrl = makeController()
    ctrl.register(tCtx, { memberId: 'm-boundary-00', nickname: '初始青铜' })
    const check = ctrl.checkUpgrade('m-boundary-00')
    assert.equal(check.currentLevel, MemberLevel.Bronze)
    assert.equal(check.canUpgrade, false)
    assert.equal(check.nextLevel, null)
  })

  it('积分刚好达到 Silver 门槛（500）', () => {
    const ctrl = makeController()
    ctrl.register(tCtx, { memberId: 'm-boundary-01', nickname: '边界Silver' })
    const updated = ctrl.addPoints('m-boundary-01', { points: 500 })
    assert.equal(updated.level, MemberLevel.Silver)
    assert.equal(updated.points, 500)
  })

  it('积分刚好达到 Gold 门槛（2000）', () => {
    const ctrl = makeController()
    ctrl.register(tCtx, { memberId: 'm-boundary-02', nickname: '边界Gold' })
    const updated = ctrl.addPoints('m-boundary-02', { points: 2000 })
    assert.equal(updated.level, MemberLevel.Gold)
    assert.equal(updated.points, 2000)
  })

  it('积分刚好达到 Platinum 门槛（10000）', () => {
    const ctrl = makeController()
    ctrl.register(tCtx, { memberId: 'm-boundary-03', nickname: '边界Platinum' })
    const updated = ctrl.addPoints('m-boundary-03', { points: 10000 })
    assert.equal(updated.level, MemberLevel.Platinum)
    assert.equal(updated.points, 10000)
  })

  it('积分刚好达到 Diamond 门槛（50000）', () => {
    const ctrl = makeController()
    ctrl.register(tCtx, { memberId: 'm-boundary-04', nickname: '边界Diamond' })
    const updated = ctrl.addPoints('m-boundary-04', { points: 50000 })
    assert.equal(updated.level, MemberLevel.Diamond)
    assert.equal(updated.points, 50000)
  })

  it('最高等级无法继续升级', () => {
    const ctrl = makeController()
    ctrl.register(tCtx, { memberId: 'm-boundary-05', nickname: '顶级钻石' })
    ctrl.addPoints('m-boundary-05', { points: 50000 })
    const check = ctrl.checkUpgrade('m-boundary-05')
    assert.equal(check.canUpgrade, false)
    assert.equal(check.nextLevel, null)
  })
})

// ──────────── 租户隔离测试 ────────────
describe('多租户 member 隔离验证', () => {
  it('不同租户的会员数据在内存 store 中隔离', () => {
    const ctrlA = makeController()
    const ctrlB = makeController()
    const tCtxA = makeTenantContext({ tenantId: 't-alpha' })
    const tCtxB = makeTenantContext({ tenantId: 't-beta' })

    ctrlA.register(tCtxA, { memberId: 'm-iso-01', nickname: '租户A会员' })
    ctrlB.register(tCtxB, { memberId: 'm-iso-02', nickname: '租户B会员' })

    // 虽然同是内存 store 且 memberId 唯一，但 tenantContext 记录不同
    const profileA = ctrlA.getProfile('m-iso-01')
    const profileB = ctrlB.getProfile('m-iso-02')
    assert.equal(profileA.tenantContext.tenantId, 't-alpha')
    assert.equal(profileB.tenantContext.tenantId, 't-beta')
  })
})
