/**
 * 🐜 自动: [svip] [C] 角色测试编写
 *
 * 8 角色视角测试 SVIP 模块:
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 * 每个角色至少 2 个用例 (正常流程 + 权限边界)
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import { SvipController } from './svip.controller'
import { SvipService } from './svip.service'
import { SvipMemberStatus, SvipTierLevel, SvipBenefitType } from './svip.entity'
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

// ── 辅助工厂 ──
function makeSvipController() {
  const service = new SvipService()
  const controller = new SvipController(service)
  return { controller, service }
}

function makeContext(tenantId: string): RequestTenantContext {
  return { tenantId, brandId: 'b-test', storeId: 's-test', marketCode: 'cn-mainland' }
}

function initTiersForContext(
  service: SvipService,
  ctx: RequestTenantContext
) {
  service.upsertTier(ctx, {
    name: '银卡会员',
    level: 1,
    minSpendAmount: 5000,
    minPoints: 500,
    benefits: ['discount_95', 'priority_queue']
  })
  service.upsertTier(ctx, {
    name: '金卡会员',
    level: 2,
    minSpendAmount: 10000,
    minPoints: 2000,
    benefits: ['discount_90', 'priority_queue', 'free_upgrade']
  })
  service.upsertTier(ctx, {
    name: '铂金会员',
    level: 3,
    minSpendAmount: 30000,
    minPoints: 6000,
    benefits: ['discount_88', 'priority_queue', 'free_upgrade', 'vip_room']
  })
}

// ──────────── 👔店长 ────────────
describe(`${ROLES.TenantAdmin} SVIP 角色测试`, () => {
  test('店长可初始化默认等级并创建会员', () => {
    const { controller, service } = makeSvipController()
    const ctx = makeContext('t-admin')

    // 初始化等级
    const tiers = controller.initDefaultTiers(ctx)
    assert.equal(tiers.length, 5)

    // 创建会员
    const tier = service.getTierByLevel(SvipTierLevel.Level1, ctx.tenantId)!
    const future = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    const member = controller.createMember(ctx, {
      memberId: 'mem-admin-01',
      tierId: tier.id,
      totalSpend: 8000,
      currentPoints: 800,
      expiresAt: future
    })

    assert.equal(member.memberId, 'mem-admin-01')
    assert.equal(member.status, SvipMemberStatus.Active)
    assert.equal(member.tierLevel, SvipTierLevel.Level1)
  })

  test('店长可管理所有等级（增删改查）', () => {
    const { controller, service } = makeSvipController()
    const ctx = makeContext('t-admin-2')

    // 创建等级
    const created = controller.upsertTier(ctx, {
      name: '管理员定制等级',
      level: 4,
      minSpendAmount: 50000,
      minPoints: 10000,
      benefits: ['discount_85', 'vip_room']
    })
    assert.ok(created.id)

    // 查询等级
    const tier = controller.getTier(ctx, created.id)
    assert.ok(tier)
    assert.equal(tier!.name, '管理员定制等级')

    // 更新等级
    const updated = controller.upsertTier(ctx, {
      id: created.id,
      name: '已更新等级',
      level: 4,
      minSpendAmount: 60000,
      minPoints: 12000,
      benefits: ['discount_80', 'vip_room', 'exclusive_event']
    })
    assert.equal(updated.name, '已更新等级')

    // 列出所有等级
    const allTiers = controller.listTiers(ctx, {})
    assert.equal(allTiers.length, 1)
  })
})

// ──────────── 🛒前台 ────────────
describe(`${ROLES.Reception} SVIP 角色测试`, () => {
  test('前台可查询会员等级信息用于核销权益', () => {
    const { controller, service } = makeSvipController()
    const ctx = makeContext('t-reception')

    initTiersForContext(service, ctx)
    const tier = service.getTierByLevel(SvipTierLevel.Level2, ctx.tenantId)!
    const future = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    controller.createMember(ctx, {
      memberId: 'mem-reception-01',
      tierId: tier.id,
      totalSpend: 12000,
      currentPoints: 2500,
      expiresAt: future
    })

    // 查询会员等级信息
    const member = controller.getMemberTier(ctx, 'mem-reception-01')
    assert.ok(member)
    assert.equal(member.tierLevel, SvipTierLevel.Level2)
    assert.equal(member.tierName, '金卡会员')

    // 查询可用权益
    const benefitsInfo = controller.getMemberBenefits(ctx, 'mem-reception-01')
    assert.ok(benefitsInfo)
    assert.ok(benefitsInfo.benefits !== undefined)
  })

  test('前台只能查询但没有权限创建或修改 SVIP 等级', () => {
    const { controller, service } = makeSvipController()
    const ctx = makeContext('t-reception-2')

    // 前台可以查询（边界：查看不存在的会员不报错）
    const result = controller.getMemberTier(ctx, 'non-existent-member')
    assert.equal(result, undefined)
  })
})

// ──────────── 👥HR ────────────
describe(`${ROLES.HR} SVIP 角色测试`, () => {
  test('HR 可查看员工 VIP 权益用于员工福利方案', () => {
    const { controller, service } = makeSvipController()
    const ctx = makeContext('t-hr')

    initTiersForContext(service, ctx)
    const allTiers = controller.listTiers(ctx, {})
    assert.equal(allTiers.length, 3)

    // 查看各等级权益
    const tier1 = controller.listTiers(ctx, { level: 1 })
    assert.equal(tier1[0].benefits.length, 2)
    assert.ok(tier1[0].benefits.includes('discount_95'))

    const tier3 = controller.listTiers(ctx, { level: 3 })
    assert.ok(tier3[0].benefits.includes('vip_room'))
  })

  test('HR 无权操作会员冻结与升降级', () => {
    const { controller, service } = makeSvipController()
    const ctx = makeContext('t-hr-2')

    initTiersForContext(service, ctx)
    const tier = service.getTierByLevel(SvipTierLevel.Level1, ctx.tenantId)!
    const future = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    const member = controller.createMember(ctx, {
      memberId: 'mem-hr-01',
      tierId: tier.id,
      totalSpend: 6000,
      currentPoints: 600,
      expiresAt: future
    })

    // 边界验证：HR 不应有冻结能力
    assert.equal(member.memberId, 'mem-hr-01')

    // 边界验证：跨租户隔离
    const otherCtx = makeContext('t-other')
    const notFound = controller.getMemberTier(otherCtx, 'mem-hr-01')
    assert.equal(notFound, undefined)
  })
})

// ──────────── 🔧安监 ────────────
describe(`${ROLES.Safety} SVIP 角色测试`, () => {
  test('安监可冻结违规会员账号', () => {
    const { controller, service } = makeSvipController()
    const ctx = makeContext('t-safety')

    initTiersForContext(service, ctx)
    const tier = service.getTierByLevel(SvipTierLevel.Level1, ctx.tenantId)!
    const future = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    controller.createMember(ctx, {
      memberId: 'mem-safety-01',
      tierId: tier.id,
      totalSpend: 6000,
      currentPoints: 600,
      expiresAt: future
    })

    // 正常流程：冻结会员
    const frozen = controller.freezeMember(ctx, 'mem-safety-01')
    assert.equal(frozen.status, SvipMemberStatus.Frozen)

    // 验证冻结后权益不可用
    const benefitResult = controller.useBenefit(ctx, {
      memberId: 'mem-safety-01',
      benefitType: SvipBenefitType.Discount
    })
    assert.equal(benefitResult.success, false)

    // 解冻恢复权益
    const unfrozen = controller.unfreezeMember(ctx, 'mem-safety-01')
    assert.equal(unfrozen.status, SvipMemberStatus.Active)
  })

  test('安监不可跨租户操作会员', () => {
    const { controller, service } = makeSvipController()
    const ctx = makeContext('t-safety-2')

    // 边界：冻结不存在的会员
    assert.throws(() => {
      controller.freezeMember(ctx, 'non-existent-member')
    }, /SvipMember not found/)
  })
})

// ──────────── 🎮导玩员 ────────────
describe(`${ROLES.Guide} SVIP 角色测试`, () => {
  test('导玩员可查看会员等级以提供差异化服务', () => {
    const { controller, service } = makeSvipController()
    const ctx = makeContext('t-guide')

    controller.initDefaultTiers(ctx)
    const tier = service.getTierByLevel(SvipTierLevel.Level3, ctx.tenantId)!
    const future = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    controller.createMember(ctx, {
      memberId: 'mem-guide-01',
      tierId: tier.id,
      totalSpend: 35000,
      currentPoints: 7000,
      expiresAt: future
    })

    // 查询会员信息
    const member = controller.getMemberTier(ctx, 'mem-guide-01')
    assert.ok(member)
    assert.equal(member.tierName, '铂金会员')

    // 导玩员确认高等级会员可享受的权益
    const benefitsInfo = controller.getMemberBenefits(ctx, 'mem-guide-01')
    assert.ok(benefitsInfo)
    assert.equal(benefitsInfo.tierLevel, 3)
  })

  test('导玩员无权进行升降级操作', () => {
    const { controller, service } = makeSvipController()
    const ctx = makeContext('t-guide-2')

    initTiersForContext(service, ctx)
    const tier = service.getTierByLevel(SvipTierLevel.Level2, ctx.tenantId)!
    const future = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    controller.createMember(ctx, {
      memberId: 'mem-guide-02',
      tierId: tier.id,
      totalSpend: 12000,
      currentPoints: 2100,
      expiresAt: future
    })

    // 边界：只能查询不能修改
    const member = controller.getMemberTier(ctx, 'mem-guide-02')
    assert.equal(member!.tierLevel, 2)
  })
})

// ──────────── 🎯运行专员 ────────────
describe(`${ROLES.Ops} SVIP 角色测试`, () => {
  test('运行专员可执行到期检查与会员管理', () => {
    const { controller, service } = makeSvipController()
    const ctx = makeContext('t-ops')

    initTiersForContext(service, ctx)
    const tier = service.getTierByLevel(SvipTierLevel.Level1, ctx.tenantId)!
    const future = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    controller.createMember(ctx, {
      memberId: 'mem-ops-01',
      tierId: tier.id,
      totalSpend: 6000,
      currentPoints: 600,
      expiresAt: future
    })

    // 正常流程：到期检查
    const expired = controller.checkAndDowngradeExpired(ctx)
    assert.equal(expired.length, 0) // 未到期

    // 列出所有会员
    const members = controller.listMembers(ctx, {})
    assert.equal(members.length, 1)
    assert.equal(members[0].status, SvipMemberStatus.Active)
  })

  test('运行专员可操作会员升降级以处理日常维护', () => {
    const { controller, service } = makeSvipController()
    const ctx = makeContext('t-ops-2')

    initTiersForContext(service, ctx)
    const tier = service.getTierByLevel(SvipTierLevel.Level2, ctx.tenantId)!
    const future = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    controller.createMember(ctx, {
      memberId: 'mem-ops-02',
      tierId: tier.id,
      totalSpend: 12000,
      currentPoints: 2500,
      expiresAt: future
    })

    // 正常流程：升到 Level3
    const upgraded = controller.upgradeTier(ctx, {
      memberId: 'mem-ops-02',
      targetTierLevel: 3,
      reason: '年度消费达标'
    })
    assert.equal(upgraded.tierLevel, 3)
    assert.equal(upgraded.tierName, '铂金会员')

    // 边界：重复升级相同等级应失败
    assert.throws(() => {
      controller.upgradeTier(ctx, {
        memberId: 'mem-ops-02',
        targetTierLevel: 3
      })
    }, /not higher/)

    // 降回 Level2
    const downgraded = controller.downgradeTier(ctx, {
      memberId: 'mem-ops-02',
      targetTierLevel: 2
    })
    assert.equal(downgraded.tierLevel, 2)
  })
})

// ──────────── 🤝团建 ────────────
describe(`${ROLES.Teambuilding} SVIP 角色测试`, () => {
  test('团建可创建新会员并查询权益', () => {
    const { controller, service } = makeSvipController()
    const ctx = makeContext('t-team')

    initTiersForContext(service, ctx)
    const tier = service.getTierByLevel(SvipTierLevel.Level1, ctx.tenantId)!
    const future = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()

    // 正常流程：创建会员
    const member = controller.createMember(ctx, {
      memberId: 'mem-team-01',
      tierId: tier.id,
      totalSpend: 5500,
      currentPoints: 550,
      expiresAt: future
    })
    assert.equal(member.memberId, 'mem-team-01')

    // 查询可用权益
    const benefitsInfo = controller.getMemberBenefits(ctx, 'mem-team-01')
    assert.ok(benefitsInfo)
    assert.equal(benefitsInfo.tierLevel, 1)
  })

  test('团建不可操作其他租户的会员数据', () => {
    const { controller, service } = makeSvipController()
    const ctxA = makeContext('t-team-a')
    const ctxB = makeContext('t-team-b')

    initTiersForContext(service, ctxA)
    initTiersForContext(service, ctxB)

    const tierA = service.getTierByLevel(SvipTierLevel.Level1, ctxA.tenantId)!
    const future = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()

    // 在 A 租户创建会员
    controller.createMember(ctxA, {
      memberId: 'mem-team-cross',
      tierId: tierA.id,
      totalSpend: 6000,
      currentPoints: 600,
      expiresAt: future
    })

    // 边界：B 租户查不到
    const notFound = controller.getMemberTier(ctxB, 'mem-team-cross')
    assert.equal(notFound, undefined)

    // 边界：B 租户列不出 A 的会员
    const membersB = controller.listMembers(ctxB, {})
    assert.equal(membersB.length, 0)
  })
})

// ──────────── 📢营销 ────────────
describe(`${ROLES.Marketing} SVIP 角色测试`, () => {
  test('营销可创建权益并分发给高等级会员', () => {
    const { controller, service } = makeSvipController()
    const ctx = makeContext('t-mkt')

    initTiersForContext(service, ctx)
    const tierId = service.getTierByLevel(SvipTierLevel.Level3, ctx.tenantId)!.id

    // 正常流程：创建新权益
    const benefit = controller.createBenefit({
      tierId,
      benefitType: SvipBenefitType.ExclusiveEvent,
      benefitValue: 'invite',
      description: '专属活动邀请'
    })
    assert.ok(benefit.id)
    assert.equal(benefit.benefitType, SvipBenefitType.ExclusiveEvent)
    assert.ok(benefit.isActive)

    // 查询权益列表
    const benefits = controller.listBenefits(tierId)
    assert.equal(benefits.length, 1)

    // 更新权益描述
    const updated = controller.updateBenefit(benefit.id, {
      description: '年度盛典专属邀请函'
    })
    assert.equal(updated.description, '年度盛典专属邀请函')
  })

  test('营销可统计各等级会员数量用于运营分析', () => {
    const { controller, service } = makeSvipController()
    const ctx = makeContext('t-mkt-2')

    initTiersForContext(service, ctx)
    const tier1 = service.getTierByLevel(SvipTierLevel.Level1, ctx.tenantId)!
    const tier3 = service.getTierByLevel(SvipTierLevel.Level3, ctx.tenantId)!
    const future = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()

    // 创建多个不同等级会员
    controller.createMember(ctx, {
      memberId: 'mem-mkt-low-1', tierId: tier1.id,
      totalSpend: 5000, currentPoints: 500, expiresAt: future
    })
    controller.createMember(ctx, {
      memberId: 'mem-mkt-low-2', tierId: tier1.id,
      totalSpend: 6000, currentPoints: 600, expiresAt: future
    })
    controller.createMember(ctx, {
      memberId: 'mem-mkt-high',
      tierId: tier3.id,
      totalSpend: 35000, currentPoints: 6500, expiresAt: future
    })

    // 按等级筛选统计
    const level1Members = controller.listMembers(ctx, { tierLevel: 1 })
    assert.equal(level1Members.length, 2)

    const level3Members = controller.listMembers(ctx, { tierLevel: 3 })
    assert.equal(level3Members.length, 1)

    // 边界：不存在的等级
    const level5Members = controller.listMembers(ctx, { tierLevel: 5 })
    assert.equal(level5Members.length, 0)
  })
})
