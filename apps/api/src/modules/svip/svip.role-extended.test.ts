/**
 * 🐜 扩展角色测试: svip 模块
 *
 * 4 个附加角色视角：
 * 🛒前台 — 检查 VIP 升级资格
 * 👔店长 — 查看 VIP 统计数据
 * 🎯运行专员 — 管理 VIP 权益
 * 📢营销 — 针对 VIP 会员营销
 *
 * 每个角色 3 个测试用例（正常 + 业务异常 + 边界）
 * 共 12+ 个独立测试用例
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import { SvipController } from './svip.controller'
import { SvipService } from './svip.service'
import {
  SvipTierLevel,
  SvipMemberStatus,
  SvipBenefitType,
} from './svip.entity'
import type { RequestTenantContext } from '../tenant/tenant.types'

// ── 测试数据工厂 ──
const tenantCtx: RequestTenantContext = {
  tenantId: 't-svip-ext',
  brandId: 'b-arcade',
  storeId: 's-main',
}

function createController() {
  const service = new SvipService()
  return new SvipController(service)
}

function createSvipEnv(ctrl: SvipController) {
  const tiers = ctrl.initDefaultTiers(tenantCtx)
  assert.equal(tiers.length, 5)

  const level1Tier = tiers.find((t: any) => t.level === SvipTierLevel.Level1)!
  const member = ctrl.createMember(tenantCtx, {
    memberId: 'mem-vip-001',
    tierId: level1Tier.id,
    totalSpend: 6000,
    currentPoints: 800,
    expiresAt: new Date(Date.now() + 365 * 86400000).toISOString(),
  })
  return { tiers, member, level1Tier }
}

// ──────────────────────────────────────────────────────────────────────
// 🛒前台 — 检查 VIP 升级资格 (reception checking VIP upgrade eligibility)
// ──────────────────────────────────────────────────────────────────────
describe('🛒前台 — VIP 升级资格查询视角', () => {
  test('消费达标可升级至更高等级 (tier calculation)', () => {
    const ctrl = createController()
    const { tiers } = createSvipEnv(ctrl)

    // 模拟高消费会员：当前 Level1，消费 15000，积分 3000 → 应可升到 Level2
    const level2Tier = tiers.find((t: any) => t.level === SvipTierLevel.Level2)!
    const upgraded = ctrl.upgradeTier(tenantCtx, {
      memberId: 'mem-vip-001',
      targetTierLevel: SvipTierLevel.Level2,
      totalSpend: 15000,
      currentPoints: 3000,
      reason: '消费达标自动升级',
    })

    assert.equal(upgraded.tierLevel, SvipTierLevel.Level2)
    assert.equal(upgraded.tierName, level2Tier.name)
  })

  test('积分不足无法升级 (upgrade eligibility check)', () => {
    const ctrl = createController()
    createSvipEnv(ctrl)

    // 消费金额足够 Level2（10000+）但积分不足（2000+）
    assert.throws(
      () => ctrl.upgradeTier(tenantCtx, {
        memberId: 'mem-vip-001',
        targetTierLevel: SvipTierLevel.Level2,
        totalSpend: 12000,
        currentPoints: 500,
        reason: '尝试升级',
      }),
      /Insufficient/i
    )
  })

  test('查询会员当前等级信息', () => {
    const ctrl = createController()
    const { tiers } = createSvipEnv(ctrl)

    const info = ctrl.getMemberTier(tenantCtx, 'mem-vip-001')
    assert(info, '应返回会员等级信息')
    assert.equal(info.tierLevel, SvipTierLevel.Level1)
    assert.equal(info.memberId, 'mem-vip-001')

    // 查询不存在的会员返回 undefined
    const notFound = ctrl.getMemberTier(tenantCtx, 'non-existent-member')
    assert.equal(notFound, undefined)
  })
})

// ──────────────────────────────────────────────────────────────────────
// 👔店长 — 查看 VIP 统计数据 (shop manager viewing VIP stats)
// ──────────────────────────────────────────────────────────────────────
describe('👔店长 — VIP 统计视角', () => {
  test('查看所有等级配置与会员分布', () => {
    const ctrl = createController()
    const { tiers } = createSvipEnv(ctrl)

    const allTiers = ctrl.listTiers(tenantCtx, {})
    assert.equal(allTiers.length, 5)

    // 等级有序（Level1 → Level5）
    for (let i = 0; i < allTiers.length; i++) {
      assert.equal(allTiers[i].level, i + 1)
    }
  })

  test('按等级筛选查看会员列表', () => {
    const ctrl = createController()
    const { tiers } = createSvipEnv(ctrl)

    // 创建多个会员在不同等级
    const level2Tier = tiers.find((t: any) => t.level === SvipTierLevel.Level2)!
    ctrl.createMember(tenantCtx, {
      memberId: 'mem-vip-002',
      tierId: level2Tier.id,
      totalSpend: 15000,
      currentPoints: 3000,
      expiresAt: new Date(Date.now() + 365 * 86400000).toISOString(),
    })

    const level2Members = ctrl.listMembers(tenantCtx, { tierLevel: SvipTierLevel.Level2 })
    assert.equal(level2Members.length, 1)
    assert.equal(level2Members[0].memberId, 'mem-vip-002')
  })

  test('查看会员可用权益列表', () => {
    const ctrl = createController()
    const { member } = createSvipEnv(ctrl)

    const benefits = ctrl.getMemberBenefits(tenantCtx, 'mem-vip-001')
    assert(Array.isArray(benefits))
    // Level1 有 95 折 + 优先排队权益
    assert(benefits.length >= 1)
  })
})

// ──────────────────────────────────────────────────────────────────────
// 🎯运行专员 — 管理 VIP 权益 (operations managing VIP benefits)
// ──────────────────────────────────────────────────────────────────────
describe('🎯运行专员 — VIP 权益管理视角', () => {
  test('创建新的 VIP 权益 (benefit assignment)', () => {
    const ctrl = createController()
    const { tiers } = createSvipEnv(ctrl)

    const level3Tier = tiers.find((t: any) => t.level === SvipTierLevel.Level3)!
    const benefit = ctrl.createBenefit({
      tierId: level3Tier.id,
      benefitType: SvipBenefitType.ExclusiveEvent,
      benefitValue: 'yearly_gala',
      description: '年度VIP晚宴',
      isActive: true,
    })

    assert.equal(benefit.benefitType, SvipBenefitType.ExclusiveEvent)
    assert.equal(benefit.isActive, true)

    // 验证权益已关联到等级
    const tierBenefits = ctrl.listBenefits(level3Tier.id)
    assert(tierBenefits.length >= 1)
    assert(tierBenefits.some((b: any) => b.benefitType === SvipBenefitType.ExclusiveEvent))
  })

  test('更新权益状态 (enable/disable benefit)', () => {
    const ctrl = createController()
    const { tiers } = createSvipEnv(ctrl)

    const level1Tier = tiers.find((t: any) => t.level === SvipTierLevel.Level1)!
    const benefit = ctrl.createBenefit({
      tierId: level1Tier.id,
      benefitType: SvipBenefitType.VipRoom,
      benefitValue: '2h_free',
      description: '免费 VIP 房 2 小时',
      isActive: true,
    })

    // 禁用权益
    const deactivated = ctrl.updateBenefit(benefit.id, { isActive: false })
    assert.equal(deactivated.isActive, false)

    // 验证更新已生效
    const updatedBenefit = ctrl.listBenefits(level1Tier.id)
      .find((b: any) => b.id === benefit.id)
    assert(updatedBenefit)
    assert.equal(updatedBenefit.isActive, false)
  })

  test('会员冻结后无法使用权益', () => {
    const ctrl = createController()
    createSvipEnv(ctrl)

    // 冻结会员
    const frozen = ctrl.freezeMember(tenantCtx, 'mem-vip-001')
    assert.equal(frozen.status, SvipMemberStatus.Frozen)

    // 冻结会员使用权益应失败
    assert.throws(
      () => ctrl.useBenefit(tenantCtx, {
        memberId: 'mem-vip-001',
        benefitType: SvipBenefitType.PriorityQueue,
      }),
      /frozen/i
    )
  })
})

// ──────────────────────────────────────────────────────────────────────
// 📢营销 — 针对 VIP 会员营销 (marketing targeting VIP promotions)
// ──────────────────────────────────────────────────────────────────────
describe('📢营销 — VIP 营销视角', () => {
  test('查询所有 VIP 会员用于营销推送 (list VIP members for campaign)', () => {
    const ctrl = createController()
    const { tiers } = createSvipEnv(ctrl)

    // 创建多个会员
    const level3Tier = tiers.find((t: any) => t.level === SvipTierLevel.Level3)!
    ctrl.createMember(tenantCtx, {
      memberId: 'mem-vip-003',
      tierId: level3Tier.id,
      totalSpend: 35000,
      currentPoints: 7000,
      expiresAt: new Date(Date.now() + 365 * 86400000).toISOString(),
    })

    const allMembers = ctrl.listMembers(tenantCtx, {})
    assert.equal(allMembers.length, 2)

    // 按等级筛选高级会员用于定向营销
    const highValue = ctrl.listMembers(tenantCtx, { tierLevel: SvipTierLevel.Level3 })
    assert.equal(highValue.length, 1)
    assert(highValue[0].totalSpend >= 30000, '高级会员应有高消费')
  })

  test('降级超期会员 — 检查自动过期处理 (auto-downgrade expired)', () => {
    const ctrl = createController()
    const { tiers } = createSvipEnv(ctrl)

    // 创建已过期会员
    const level1Tier = tiers.find((t: any) => t.level === SvipTierLevel.Level1)!
    ctrl.createMember(tenantCtx, {
      memberId: 'mem-expired-001',
      tierId: level1Tier.id,
      totalSpend: 6000,
      currentPoints: 800,
      expiresAt: new Date(Date.now() - 1 * 86400000).toISOString(), // 昨天到期
    })

    // 执行过期检查
    const results = ctrl.checkAndDowngradeExpired(tenantCtx)
    assert(Array.isArray(results))
    // 过期会员至少应被处理
    const expiredProcessed = results.some((r: any) => r.memberId === 'mem-expired-001')
    assert(expiredProcessed, '过期会员应在处理结果中')
  })

  test('查询升级路径 — 会员消费是否达标更高等级', () => {
    const ctrl = createController()
    const { tiers } = createSvipEnv(ctrl)

    // Level1 会员，消费 5000 → 应还在 Level1
    const level1Info = ctrl.getMemberTier(tenantCtx, 'mem-vip-001')
    assert.equal(level1Info!.tierLevel, SvipTierLevel.Level1)

    // 手动升级到 Level2
    ctrl.upgradeTier(tenantCtx, {
      memberId: 'mem-vip-001',
      targetTierLevel: SvipTierLevel.Level2,
      totalSpend: 15000,
      currentPoints: 3000,
      reason: '营销活动升级',
    })

    const upgraded = ctrl.getMemberTier(tenantCtx, 'mem-vip-001')
    assert.equal(upgraded!.tierLevel, SvipTierLevel.Level2)
  })
})
