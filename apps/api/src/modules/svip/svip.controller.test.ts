/**
 * 🐜 自动: [svip] [D] controller spec 补全
 *
 * 覆盖: initDefaultTiers / listTiers / getTier / upsertTier
 *       createMember / listMembers / getMemberTier / getMemberBenefits
 *       upgradeTier / downgradeTier / freezeMember / unfreezeMember
 *       checkAndDowngradeExpired
 *       listBenefits / createBenefit / updateBenefit / useBenefit
 *
 * 正例 + 反例 + 边界
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import test, { describe, beforeEach, afterEach } from 'node:test'
import { SvipController } from './svip.controller'
import { SvipService } from './svip.service'
import { SvipMemberStatus, SvipTierLevel, SvipBenefitType } from './svip.entity'
import type { RequestTenantContext } from '../tenant/tenant.types'

const CTX: RequestTenantContext = {
  tenantId: 'tenant-svip-test',
  brandId: 'brand-svip',
  storeId: 'store-svip',
  marketCode: 'cn-mainland'
}

let controller: SvipController
let service: SvipService

function build() {
  service = new SvipService()
  controller = new SvipController(service)
}

function initThreeTiers() {
  service.upsertTier(CTX, {
    name: '银卡会员',
    level: 1,
    minSpendAmount: 5000,
    minPoints: 500,
    benefits: ['discount_95', 'priority_queue']
  })
  service.upsertTier(CTX, {
    name: '金卡会员',
    level: 2,
    minSpendAmount: 10000,
    minPoints: 2000,
    benefits: ['discount_90', 'priority_queue', 'free_upgrade']
  })
  service.upsertTier(CTX, {
    name: '铂金会员',
    level: 3,
    minSpendAmount: 30000,
    minPoints: 6000,
    benefits: ['discount_88', 'priority_queue', 'free_upgrade', 'vip_room']
  })
}

function createActiveMember(memberId: string, tierLevel: SvipTierLevel = SvipTierLevel.Level1) {
  const tier = service.getTierByLevel(tierLevel, CTX.tenantId)
  const future = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
  return service.createMember(CTX, {
    memberId,
    tierId: tier!.id,
    totalSpend: 6000,
    currentPoints: 600,
    expiresAt: future
  })
}

beforeEach(() => {
  build()
})

afterEach(() => {
  service.resetSvipStoresForTests()
})

describe('svip controller', () => {
  // ── 等级管理 ───────────────────────────────────────────

  describe('initDefaultTiers', () => {
    test('should init default 5 tiers when no tiers exist', () => {
      const result = controller.initDefaultTiers(CTX)
      assert.equal(result.length, 5)
      assert.equal(result[0].level, 1)
      assert.equal(result[4].level, 5)
    })

    test('should return existing tiers and skip re-init', () => {
      initThreeTiers()
      const result = controller.initDefaultTiers(CTX)
      assert.equal(result.length, 3)
    })
  })

  describe('listTiers', () => {
    test('should list all tiers for tenant', () => {
      initThreeTiers()
      const result = controller.listTiers(CTX, {})
      assert.equal(result.length, 3)
    })

    test('should filter by level', () => {
      initThreeTiers()
      const result = controller.listTiers(CTX, { level: 2 })
      assert.equal(result.length, 1)
      assert.equal(result[0].name, '金卡会员')
    })

    test('should return empty when no tiers present', () => {
      const result = controller.listTiers(CTX, {})
      assert.equal(result.length, 0)
    })

    test('should isolate between tenants', () => {
      initThreeTiers()
      const otherCtx: RequestTenantContext = { ...CTX, tenantId: 'other-tenant' }
      const result = controller.listTiers(otherCtx, {})
      assert.equal(result.length, 0)
    })
  })

  describe('getTier', () => {
    test('should get tier by id', () => {
      initThreeTiers()
      const list = controller.listTiers(CTX, {})
      const tierId = list[0].id
      const result = controller.getTier(CTX, tierId)
      assert.ok(result)
      assert.equal(result.id, tierId)
    })

    test('should return undefined for non-existent tier', () => {
      const result = controller.getTier(CTX, 'non-existent-id')
      assert.equal(result, undefined)
    })

    test('should return undefined for tier belonging to other tenant', () => {
      initThreeTiers()
      const list = controller.listTiers(CTX, {})
      const otherCtx: RequestTenantContext = { ...CTX, tenantId: 'other-tenant' }
      const result = controller.getTier(otherCtx, list[0].id)
      assert.equal(result, undefined)
    })
  })

  describe('upsertTier', () => {
    test('should create a new tier', () => {
      const result = controller.upsertTier(CTX, {
        name: '测试等级',
        level: 4,
        minSpendAmount: 50000,
        minPoints: 10000,
        benefits: ['discount_85']
      })
      assert.ok(result.id)
      assert.equal(result.name, '测试等级')
      assert.equal(result.level, 4)
    })

    test('should update an existing tier', () => {
      const created = controller.upsertTier(CTX, {
        name: '原等级',
        level: 1,
        minSpendAmount: 1000,
        minPoints: 100,
        benefits: ['test']
      })
      const updated = controller.upsertTier(CTX, {
        id: created.id,
        name: '更新等级',
        level: 1,
        minSpendAmount: 2000,
        minPoints: 200,
        benefits: ['updated']
      })
      assert.equal(updated.id, created.id)
      assert.equal(updated.name, '更新等级')
      assert.equal(updated.minSpendAmount, 2000)
    })
  })

  // ── 会员管理 ───────────────────────────────────────────

  describe('createMember', () => {
    test('should create a SVIP member', () => {
      initThreeTiers()
      const tier = service.getTierByLevel(1, CTX.tenantId)!
      const future = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      const result = controller.createMember(CTX, {
        memberId: 'mem-001',
        tierId: tier.id,
        totalSpend: 6000,
        currentPoints: 600,
        expiresAt: future
      })
      assert.equal(result.memberId, 'mem-001')
      assert.equal(result.status, SvipMemberStatus.Active)
      assert.equal(result.tierLevel, 1)
    })

    test('should throw when tier not found', () => {
      assert.throws(() => {
        controller.createMember(CTX, {
          memberId: 'mem-002',
          tierId: 'non-existent-tier',
          totalSpend: 1000,
          currentPoints: 100,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        })
      }, /SvipTier not found/)
    })

    test('should throw when duplicate active member', () => {
      initThreeTiers()
      createActiveMember('mem-003', SvipTierLevel.Level1)
      const tier = service.getTierByLevel(1, CTX.tenantId)!
      assert.throws(() => {
        controller.createMember(CTX, {
          memberId: 'mem-003',
          tierId: tier.id,
          totalSpend: 6000,
          currentPoints: 600,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        })
      }, /already has an active SVIP membership/)
    })
  })

  describe('listMembers', () => {
    test('should list all members for tenant', () => {
      initThreeTiers()
      createActiveMember('mem-a', SvipTierLevel.Level1)
      createActiveMember('mem-b', SvipTierLevel.Level2)
      const result = controller.listMembers(CTX, {})
      assert.equal(result.length, 2)
    })

    test('should filter by status', () => {
      initThreeTiers()
      const m = createActiveMember('mem-c', SvipTierLevel.Level1)
      controller.freezeMember(CTX, m.memberId)
      const active = controller.listMembers(CTX, { status: SvipMemberStatus.Active })
      assert.equal(active.length, 0)
      const frozen = controller.listMembers(CTX, { status: SvipMemberStatus.Frozen })
      assert.equal(frozen.length, 1)
    })

    test('should filter by tierLevel', () => {
      initThreeTiers()
      createActiveMember('mem-d', SvipTierLevel.Level1)
      createActiveMember('mem-e', SvipTierLevel.Level2)
      const result = controller.listMembers(CTX, { tierLevel: 2 })
      assert.equal(result.length, 1)
      assert.equal(result[0].memberId, 'mem-e')
    })
  })

  describe('getMemberTier', () => {
    test('should get member tier info', () => {
      initThreeTiers()
      createActiveMember('mem-f', SvipTierLevel.Level2)
      const result = controller.getMemberTier(CTX, 'mem-f')
      assert.ok(result)
      assert.equal(result.memberId, 'mem-f')
      assert.equal(result.tierLevel, 2)
    })

    test('should return undefined for non-existent member', () => {
      const result = controller.getMemberTier(CTX, 'non-existent')
      assert.equal(result, undefined)
    })
  })

  describe('getMemberBenefits', () => {
    test('should get member available benefits', () => {
      initThreeTiers()
      createActiveMember('mem-g', SvipTierLevel.Level1)
      const tierId = service.getTierByLevel(1, CTX.tenantId)!.id
      service.createBenefit({
        tierId,
        benefitType: SvipBenefitType.Discount,
        benefitValue: '95%',
        description: '95折优惠'
      })
      const result = controller.getMemberBenefits(CTX, 'mem-g')
      assert.ok(result)
      assert.equal(result.tierLevel, 1)
      assert.ok(result.benefits.length >= 1)
    })

    test('should return null for frozen member', () => {
      initThreeTiers()
      const m = createActiveMember('mem-h')
      controller.freezeMember(CTX, m.memberId)
      const result = controller.getMemberBenefits(CTX, 'mem-h')
      assert.equal(result, null)
    })
  })

  // ── 升级 / 降级 ────────────────────────────────────────

  describe('upgradeTier', () => {
    test('should upgrade member tier level', () => {
      initThreeTiers()
      createActiveMember('mem-i', SvipTierLevel.Level1)
      const result = controller.upgradeTier(CTX, {
        memberId: 'mem-i',
        targetTierLevel: 2,
        reason: '年度消费达标'
      })
      assert.equal(result.tierLevel, 2)
      assert.equal(result.tierName, '金卡会员')
    })

    test('should throw when upgrading frozen member', () => {
      initThreeTiers()
      const m = createActiveMember('mem-j', SvipTierLevel.Level1)
      controller.freezeMember(CTX, m.memberId)
      assert.throws(() => {
        controller.upgradeTier(CTX, { memberId: 'mem-j', targetTierLevel: 2 })
      }, /not active/)
    })

    test('should throw when target level is not higher', () => {
      initThreeTiers()
      createActiveMember('mem-k', SvipTierLevel.Level2)
      assert.throws(() => {
        controller.upgradeTier(CTX, { memberId: 'mem-k', targetTierLevel: 1 })
      }, /not higher/)
    })

    test('should throw for non-existent member', () => {
      initThreeTiers()
      assert.throws(() => {
        controller.upgradeTier(CTX, { memberId: 'ghost', targetTierLevel: 2 })
      }, /SvipMember not found/)
    })
  })

  describe('downgradeTier', () => {
    test('should downgrade member tier level', () => {
      initThreeTiers()
      createActiveMember('mem-l', SvipTierLevel.Level2)
      const result = controller.downgradeTier(CTX, {
        memberId: 'mem-l',
        targetTierLevel: 1,
        reason: '积分不足'
      })
      assert.equal(result.tierLevel, 1)
      assert.equal(result.tierName, '银卡会员')
    })

    test('should throw when target level is not lower', () => {
      initThreeTiers()
      createActiveMember('mem-m', SvipTierLevel.Level1)
      assert.throws(() => {
        controller.downgradeTier(CTX, { memberId: 'mem-m', targetTierLevel: 2 })
      }, /not lower/)
    })
  })

  // ── 冻结 / 解冻 ────────────────────────────────────────

  describe('freezeMember', () => {
    test('should freeze an active member', () => {
      initThreeTiers()
      createActiveMember('mem-n', SvipTierLevel.Level1)
      const result = controller.freezeMember(CTX, 'mem-n')
      assert.equal(result.status, SvipMemberStatus.Frozen)
    })

    test('should throw when freezing already frozen member', () => {
      initThreeTiers()
      createActiveMember('mem-o', SvipTierLevel.Level1)
      controller.freezeMember(CTX, 'mem-o')
      assert.throws(() => {
        controller.freezeMember(CTX, 'mem-o')
      }, /already frozen/)
    })

    test('should throw for non-existent member', () => {
      assert.throws(() => {
        controller.freezeMember(CTX, 'non-existent')
      }, /SvipMember not found/)
    })
  })

  describe('unfreezeMember', () => {
    test('should unfreeze a frozen member', () => {
      initThreeTiers()
      createActiveMember('mem-p', SvipTierLevel.Level1)
      controller.freezeMember(CTX, 'mem-p')
      const result = controller.unfreezeMember(CTX, 'mem-p')
      assert.equal(result.status, SvipMemberStatus.Active)
    })

    test('should throw when unfreezing active member', () => {
      initThreeTiers()
      createActiveMember('mem-q', SvipTierLevel.Level1)
      assert.throws(() => {
        controller.unfreezeMember(CTX, 'mem-q')
      }, /not frozen/)
    })
  })

  describe('checkAndDowngradeExpired', () => {
    test('should return empty when no expired members', () => {
      initThreeTiers()
      createActiveMember('mem-r', SvipTierLevel.Level1)
      const result = controller.checkAndDowngradeExpired(CTX)
      assert.equal(result.length, 0)
    })

    test('should return empty for different tenant', () => {
      initThreeTiers()
      createActiveMember('mem-s', SvipTierLevel.Level1)
      const otherCtx: RequestTenantContext = { ...CTX, tenantId: 'other-tenant' }
      const result = controller.checkAndDowngradeExpired(otherCtx)
      assert.equal(result.length, 0)
    })
  })

  // ── 权益管理 ───────────────────────────────────────────

  describe('listBenefits', () => {
    test('should list benefits for a tier', () => {
      initThreeTiers()
      const tierId = service.getTierByLevel(1, CTX.tenantId)!.id
      service.createBenefit({
        tierId,
        benefitType: SvipBenefitType.Discount,
        benefitValue: '95%',
        description: '95折'
      })
      const result = controller.listBenefits(tierId)
      assert.equal(result.length, 1)
      assert.equal(result[0].benefitType, SvipBenefitType.Discount)
    })

    test('should return empty for tier with no benefits', () => {
      initThreeTiers()
      const tierId = service.getTierByLevel(3, CTX.tenantId)!.id
      const result = controller.listBenefits(tierId)
      assert.equal(result.length, 0)
    })
  })

  describe('createBenefit', () => {
    test('should create a benefit', () => {
      initThreeTiers()
      const tierId = service.getTierByLevel(1, CTX.tenantId)!.id
      const result = controller.createBenefit({
        tierId,
        benefitType: SvipBenefitType.VipRoom,
        benefitValue: '2h',
        description: 'VIP包厢2小时'
      })
      assert.ok(result.id)
      assert.equal(result.benefitType, SvipBenefitType.VipRoom)
      assert.ok(result.isActive)
    })
  })

  describe('updateBenefit', () => {
    test('should update benefit details', () => {
      initThreeTiers()
      const tierId = service.getTierByLevel(1, CTX.tenantId)!.id
      const created = controller.createBenefit({
        tierId,
        benefitType: SvipBenefitType.Discount,
        benefitValue: '95%',
        description: 'old desc'
      })
      const updated = controller.updateBenefit(created.id, {
        description: 'new desc',
        isActive: false
      })
      assert.equal(updated.description, 'new desc')
      assert.equal(updated.isActive, false)
    })

    test('should throw for non-existent benefit', () => {
      assert.throws(() => {
        controller.updateBenefit('non-existent', { description: 'test' })
      }, /SvipBenefit not found/)
    })
  })

  describe('useBenefit', () => {
    test('should use a benefit successfully', () => {
      initThreeTiers()
      createActiveMember('mem-use', SvipTierLevel.Level2)
      const tierId = service.getTierByLevel(2, CTX.tenantId)!.id
      service.createBenefit({
        tierId,
        benefitType: SvipBenefitType.FreeUpgrade,
        benefitValue: '7d',
        description: '7天免费升级'
      })
      const result = controller.useBenefit(CTX, {
        memberId: 'mem-use',
        benefitType: SvipBenefitType.FreeUpgrade
      })
      assert.equal(result.success, true)
      assert.ok(result.message.includes('successfully'))
    })

    test('should fail when member is frozen', () => {
      initThreeTiers()
      const m = createActiveMember('mem-fail', SvipTierLevel.Level2)
      controller.freezeMember(CTX, m.memberId)
      const result = controller.useBenefit(CTX, {
        memberId: 'mem-fail',
        benefitType: SvipBenefitType.Discount
      })
      assert.equal(result.success, false)
      assert.ok(result.message.includes('not an active'))
    })

    test('should fail when tier does not support benefit type', () => {
      initThreeTiers()
      createActiveMember('mem-x', SvipTierLevel.Level1)
      const result = controller.useBenefit(CTX, {
        memberId: 'mem-x',
        benefitType: SvipBenefitType.ExclusiveEvent
      })
      assert.equal(result.success, false)
      assert.ok(result.message.includes('does not have benefit type'))
    })
  })
})
