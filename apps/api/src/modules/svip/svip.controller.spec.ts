/**
 * SvipController 单元测试 (node:test)
 *
 * 策略：内联 Controller + Mock Service，覆盖所有路由端点。
 * 正向流程 + 边界条件（空数据集、不存在的 ID、无效状态转换）。
 */

import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

// ── Entity mirrors (avoid NestJS DI) ───────────────────────────
const SvipTierLevel = {
  Level1: 1,
  Level2: 2,
  Level3: 3,
  Level4: 4,
  Level5: 5,
} as const

const SvipMemberStatus = {
  Active: 'active',
  Expired: 'expired',
  Frozen: 'frozen',
} as const

const SvipBenefitType = {
  Discount: 'discount',
  FreeUpgrade: 'freeUpgrade',
  PriorityQueue: 'priorityQueue',
  VipRoom: 'vipRoom',
  ExclusiveEvent: 'exclusiveEvent',
} as const

// ── Inline Controller (mirrors source: svip.controller.ts) ─
class SvipController {
  private svipService: any

  constructor(svipService: any) {
    this.svipService = svipService
  }

  initDefaultTiers(tenantContext: any) {
    return this.svipService.initDefaultTiers(tenantContext)
  }

  listTiers(tenantContext: any, query: any) {
    const tiers = this.svipService.listTiers(tenantContext.tenantId)
    if (query.level !== undefined) {
      return tiers.filter((t: any) => t.level === query.level)
    }
    return tiers
  }

  getTier(tenantContext: any, tierId: string) {
    return this.svipService.getTier(tierId, tenantContext.tenantId) ?? null
  }

  upsertTier(tenantContext: any, body: any) {
    return this.svipService.upsertTier(tenantContext, body)
  }

  createMember(tenantContext: any, body: any) {
    return this.svipService.createMember(tenantContext, body)
  }

  listMembers(tenantContext: any, query: any) {
    return this.svipService.listMembers(tenantContext.tenantId, {
      status: query.status,
      tierLevel: query.tierLevel,
    })
  }

  getMemberTier(tenantContext: any, memberId: string) {
    return this.svipService.getMemberTier(memberId, tenantContext.tenantId) ?? null
  }

  getMemberBenefits(tenantContext: any, memberId: string) {
    return this.svipService.getMemberAvailableBenefits(memberId, tenantContext.tenantId)
  }

  upgradeTier(tenantContext: any, body: any) {
    return this.svipService.upgradeTier(tenantContext, body)
  }

  downgradeTier(tenantContext: any, body: any) {
    return this.svipService.downgradeTier(tenantContext, body)
  }

  freezeMember(tenantContext: any, memberId: string) {
    return this.svipService.freezeMember(memberId, tenantContext.tenantId)
  }

  unfreezeMember(tenantContext: any, memberId: string) {
    return this.svipService.unfreezeMember(memberId, tenantContext.tenantId)
  }

  checkAndDowngradeExpired(tenantContext: any) {
    return this.svipService.checkAndDowngradeExpired(tenantContext.tenantId)
  }

  listBenefits(tierId: string) {
    return this.svipService.listBenefits(tierId)
  }

  createBenefit(body: any) {
    return this.svipService.createBenefit(body)
  }

  updateBenefit(benefitId: string, body: any) {
    return this.svipService.updateBenefit(benefitId, body)
  }

  useBenefit(tenantContext: any, body: any) {
    return this.svipService.useBenefit(body.memberId, body.benefitType, tenantContext.tenantId)
  }
}

// ── Helpers ───────────────────────────────────────────────────
function makeTenantContext(overrides: Record<string, any> = {}) {
  return {
    tenantId: 't-001',
    brandId: 'b-001',
    storeId: 's-001',
    marketCode: 'zh-cn',
    ...overrides,
  }
}

function makeSvipTier(overrides: Record<string, any> = {}) {
  return {
    id: 'tier-001',
    tenantContext: makeTenantContext(),
    name: '银卡会员',
    level: SvipTierLevel.Level1,
    minSpendAmount: 5000,
    minPoints: 500,
    benefits: ['discount_95', 'priority_queue'],
    icon: 'silver',
    color: '#C0C0C0',
    createdAt: '2026-06-23T10:00:00Z',
    ...overrides,
  }
}

function makeSvipMember(overrides: Record<string, any> = {}) {
  return {
    id: 'svip-mem-001',
    tenantContext: makeTenantContext(),
    brandId: 'b-001',
    storeId: 's-001',
    memberId: 'mem-001',
    tierId: 'tier-001',
    tierName: '银卡会员',
    tierLevel: SvipTierLevel.Level1,
    totalSpend: 8000,
    currentPoints: 1000,
    joinedAt: '2026-06-01T00:00:00Z',
    expiresAt: '2027-06-01T00:00:00Z',
    status: SvipMemberStatus.Active,
    autoRenew: true,
    createdAt: '2026-06-01T00:00:00Z',
    updatedAt: '2026-06-23T10:00:00Z',
    ...overrides,
  }
}

function makeSvipBenefit(overrides: Record<string, any> = {}) {
  return {
    id: 'benefit-001',
    tierId: 'tier-001',
    benefitType: SvipBenefitType.Discount,
    benefitValue: '95折',
    description: '全场商品 95 折优惠',
    isActive: true,
    ...overrides,
  }
}

function makeMockService(overrides: Record<string, any> = {}) {
  return {
    initDefaultTiers: () => [makeSvipTier()],
    listTiers: () => [],
    getTier: () => undefined,
    upsertTier: () => makeSvipTier(),
    createMember: () => makeSvipMember(),
    listMembers: () => [],
    getMemberTier: () => undefined,
    getMemberAvailableBenefits: () => [],
    upgradeTier: () => makeSvipMember({ tierLevel: SvipTierLevel.Level2, tierName: '金卡会员' }),
    downgradeTier: () => makeSvipMember({ tierLevel: SvipTierLevel.Level1, tierName: '银卡会员' }),
    freezeMember: () => makeSvipMember({ status: SvipMemberStatus.Frozen }),
    unfreezeMember: () => makeSvipMember({ status: SvipMemberStatus.Active }),
    checkAndDowngradeExpired: () => [],
    listBenefits: () => [],
    createBenefit: () => makeSvipBenefit(),
    updateBenefit: () => makeSvipBenefit({ benefitValue: '9折' }),
    useBenefit: () => ({ success: true, benefitUsed: 'discount' }),
    ...overrides,
  }
}

function makeMockServiceWithData() {
  const tier1 = makeSvipTier()
  const tier2 = makeSvipTier({
    id: 'tier-002',
    name: '金卡会员',
    level: SvipTierLevel.Level2,
    minSpendAmount: 10000,
    minPoints: 2000,
    benefits: ['discount_90', 'priority_queue', 'free_upgrade'],
    icon: 'gold',
    color: '#FFD700',
  })
  const member = makeSvipMember()
  const benefit = makeSvipBenefit()

  return makeMockService({
    initDefaultTiers: () => [tier1, tier2],
    listTiers: () => [tier1, tier2],
    getTier: (id: string) => (id === 'tier-001' ? tier1 : id === 'tier-002' ? tier2 : undefined),
    listMembers: () => [member],
    getMemberTier: (id: string) => (id === 'mem-001' ? member : undefined),
    getMemberAvailableBenefits: () => [benefit],
    listBenefits: () => [benefit],
  })
}

// ── Tests ─────────────────────────────────────────────────────
describe('SvipController', () => {

  // ── POST /svip/tiers/init ──────────────────────────────────
  describe('initDefaultTiers()', () => {
    test('returns default tiers on first init', () => {
      const mock = makeMockServiceWithData()
      const ctrl = new SvipController(mock)
      const result = ctrl.initDefaultTiers(makeTenantContext())
      assert.strictEqual(result.length, 2)
      assert.strictEqual(result[0].name, '银卡会员')
      assert.strictEqual(result[1].name, '金卡会员')
    })

    test('returns existing tiers if already initialized', () => {
      let callCount = 0
      const mock = makeMockService({
        initDefaultTiers: () => {
          callCount++
          return [makeSvipTier()]
        },
      })
      const ctrl = new SvipController(mock)
      const ctx = makeTenantContext()
      ctrl.initDefaultTiers(ctx)
      ctrl.initDefaultTiers(ctx)
      assert.strictEqual(callCount, 2)
    })
  })

  // ── GET /svip/tiers ───────────────────────────────────────
  describe('listTiers()', () => {
    test('returns empty array when no tiers exist', () => {
      const mock = makeMockService()
      const ctrl = new SvipController(mock)
      const result = ctrl.listTiers(makeTenantContext(), {})
      assert.deepStrictEqual(result, [])
    })

    test('returns all tiers when no filter', () => {
      const mock = makeMockServiceWithData()
      const ctrl = new SvipController(mock)
      const result = ctrl.listTiers(makeTenantContext(), {})
      assert.strictEqual(result.length, 2)
      assert.strictEqual(result[0].level, SvipTierLevel.Level1)
      assert.strictEqual(result[1].level, SvipTierLevel.Level2)
    })

    test('filters by level', () => {
      const mock = makeMockServiceWithData()
      const ctrl = new SvipController(mock)
      const result = ctrl.listTiers(makeTenantContext(), { level: SvipTierLevel.Level2 })
      assert.strictEqual(result.length, 1)
      assert.strictEqual(result[0].level, SvipTierLevel.Level2)
    })

    test('returns empty when filtering by non-existent level', () => {
      const mock = makeMockServiceWithData()
      const ctrl = new SvipController(mock)
      const result = ctrl.listTiers(makeTenantContext(), { level: 99 })
      assert.deepStrictEqual(result, [])
    })
  })

  // ── GET /svip/tiers/:tierId ──────────────────────────────
  describe('getTier()', () => {
    test('returns tier for existing id', () => {
      const mock = makeMockServiceWithData()
      const ctrl = new SvipController(mock)
      const result = ctrl.getTier(makeTenantContext(), 'tier-001')
      assert.notStrictEqual(result, null)
      assert.strictEqual(result!.id, 'tier-001')
      assert.strictEqual(result!.name, '银卡会员')
    })

    test('returns null for non-existing tier', () => {
      const mock = makeMockServiceWithData()
      const ctrl = new SvipController(mock)
      const result = ctrl.getTier(makeTenantContext(), 'tier-999')
      assert.strictEqual(result, null)
    })

    test('forwards tenantId to service', () => {
      let capturedTenantId: string | null = null
      const mock = makeMockService({
        getTier: (id: string, tenantId: string) => {
          capturedTenantId = tenantId
          return makeSvipTier({ id })
        },
      })
      const ctrl = new SvipController(mock)
      ctrl.getTier(makeTenantContext({ tenantId: 't-custom' }), 'tier-001')
      assert.strictEqual(capturedTenantId, 't-custom')
    })
  })

  // ── POST /svip/tiers ────────────────────────────────────
  describe('upsertTier()', () => {
    test('creates a new tier', () => {
      let capturedBody: any = null
      const mock = makeMockService({
        upsertTier: (ctx: any, body: any) => {
          capturedBody = body
          return makeSvipTier({
            name: body.name,
            level: body.level,
            minSpendAmount: body.minSpendAmount,
            minPoints: body.minPoints,
            benefits: body.benefits,
          })
        },
      })
      const ctrl = new SvipController(mock)
      const ctx = makeTenantContext()
      const body = {
        name: '铂金会员',
        level: SvipTierLevel.Level3,
        minSpendAmount: 30000,
        minPoints: 6000,
        benefits: ['discount_88', 'priority_queue', 'free_upgrade', 'vip_room'],
      }
      const result = ctrl.upsertTier(ctx, body)
      assert.strictEqual(capturedBody.name, '铂金会员')
      assert.strictEqual(capturedBody.level, SvipTierLevel.Level3)
      assert.strictEqual(result.minSpendAmount, 30000)
    })

    test('updates existing tier with id', () => {
      let capturedId: string | null = null
      const mock = makeMockService({
        upsertTier: (ctx: any, body: any) => {
          capturedId = body.id
          return makeSvipTier({ id: body.id, name: body.name })
        },
      })
      const ctrl = new SvipController(mock)
      const result = ctrl.upsertTier(makeTenantContext(), {
        id: 'tier-001',
        name: '银卡升级版',
        level: SvipTierLevel.Level1,
        minSpendAmount: 5000,
        minPoints: 500,
        benefits: ['discount_93'],
      })
      assert.strictEqual(capturedId, 'tier-001')
      assert.strictEqual(result.name, '银卡升级版')
    })

    test('handles optional icon and color', () => {
      let capturedBody: any = null
      const mock = makeMockService({
        upsertTier: (ctx: any, body: any) => {
          capturedBody = body
          return makeSvipTier(body)
        },
      })
      const ctrl = new SvipController(mock)
      ctrl.upsertTier(makeTenantContext(), {
        name: '钻石会员',
        level: SvipTierLevel.Level4,
        minSpendAmount: 80000,
        minPoints: 15000,
        benefits: ['discount_85'],
        icon: 'diamond',
        color: '#B9F2FF',
      })
      assert.strictEqual(capturedBody.icon, 'diamond')
      assert.strictEqual(capturedBody.color, '#B9F2FF')
    })
  })

  // ── POST /svip/members ──────────────────────────────────
  describe('createMember()', () => {
    test('creates a new SVIP member', () => {
      let capturedBody: any = null
      const mock = makeMockService({
        createMember: (ctx: any, body: any) => {
          capturedBody = body
          return makeSvipMember({ memberId: body.memberId, tierId: body.tierId })
        },
      })
      const ctrl = new SvipController(mock)
      const ctx = makeTenantContext()
      const result = ctrl.createMember(ctx, { memberId: 'mem-new', tierId: 'tier-001' })
      assert.strictEqual(capturedBody.memberId, 'mem-new')
      assert.strictEqual(capturedBody.tierId, 'tier-001')
      assert.strictEqual(result.memberId, 'mem-new')
    })

    test('throws when tier does not exist', () => {
      const mock = makeMockService({
        createMember: () => { throw new Error('SvipTier not found: tier-999') },
      })
      const ctrl = new SvipController(mock)
      assert.throws(
        () => ctrl.createMember(makeTenantContext(), { memberId: 'mem-x', tierId: 'tier-999' }),
        /SvipTier not found/
      )
    })
  })

  // ── GET /svip/members ────────────────────────────────────
  describe('listMembers()', () => {
    test('returns empty array when no members', () => {
      const mock = makeMockService()
      const ctrl = new SvipController(mock)
      const result = ctrl.listMembers(makeTenantContext(), {})
      assert.deepStrictEqual(result, [])
    })

    test('returns members with filters', () => {
      let capturedFilters: any = null
      const mock = makeMockService({
        listMembers: (tid: string, filters: any) => {
          capturedFilters = filters
          return [makeSvipMember()]
        },
      })
      const ctrl = new SvipController(mock)
      const result = ctrl.listMembers(makeTenantContext(), {
        status: SvipMemberStatus.Active,
        tierLevel: SvipTierLevel.Level1,
      })
      assert.strictEqual(capturedFilters.status, SvipMemberStatus.Active)
      assert.strictEqual(capturedFilters.tierLevel, SvipTierLevel.Level1)
      assert.strictEqual(result.length, 1)
    })
  })

  // ── GET /svip/members/:memberId ───────────────────────────
  describe('getMemberTier()', () => {
    test('returns member for existing memberId', () => {
      const mock = makeMockServiceWithData()
      const ctrl = new SvipController(mock)
      const result = ctrl.getMemberTier(makeTenantContext(), 'mem-001')
      assert.notStrictEqual(result, null)
      assert.strictEqual(result!.memberId, 'mem-001')
      assert.strictEqual(result!.tierName, '银卡会员')
    })

    test('returns null for non-existing member', () => {
      const mock = makeMockServiceWithData()
      const ctrl = new SvipController(mock)
      const result = ctrl.getMemberTier(makeTenantContext(), 'mem-999')
      assert.strictEqual(result, null)
    })
  })

  // ── GET /svip/members/:memberId/benefits ─────────────────
  describe('getMemberBenefits()', () => {
    test('returns benefits for existing member', () => {
      const mock = makeMockServiceWithData()
      const ctrl = new SvipController(mock)
      const result = ctrl.getMemberBenefits(makeTenantContext(), 'mem-001')
      assert.strictEqual(result.length, 1)
      assert.strictEqual(result[0].id, 'benefit-001')
    })

    test('returns empty when member has no benefits', () => {
      const mock = makeMockService()
      const ctrl = new SvipController(mock)
      const result = ctrl.getMemberBenefits(makeTenantContext(), 'mem-empty')
      assert.deepStrictEqual(result, [])
    })
  })

  // ── POST /svip/upgrade ───────────────────────────────────
  describe('upgradeTier()', () => {
    test('upgrades member to next tier', () => {
      let capturedBody: any = null
      const mock = makeMockService({
        upgradeTier: (ctx: any, body: any) => {
          capturedBody = body
          return makeSvipMember({ memberId: body.memberId, tierLevel: SvipTierLevel.Level2, tierName: '金卡会员' })
        },
      })
      const ctrl = new SvipController(mock)
      const body = { memberId: 'mem-001', newTierId: 'tier-002' }
      const result = ctrl.upgradeTier(makeTenantContext(), body)
      assert.strictEqual(capturedBody.memberId, 'mem-001')
      assert.strictEqual(capturedBody.newTierId, 'tier-002')
      assert.strictEqual(result.tierLevel, SvipTierLevel.Level2)
      assert.strictEqual(result.tierName, '金卡会员')
    })

    test('throws when upgrading non-existent member', () => {
      const mock = makeMockService({
        upgradeTier: () => { throw new Error('SvipMember not found') },
      })
      const ctrl = new SvipController(mock)
      assert.throws(
        () => ctrl.upgradeTier(makeTenantContext(), { memberId: 'mem-999', newTierId: 'tier-002' }),
        /not found/
      )
    })
  })

  // ── POST /svip/downgrade ─────────────────────────────────
  describe('downgradeTier()', () => {
    test('downgrades member to lower tier', () => {
      let capturedBody: any = null
      const mock = makeMockService({
        downgradeTier: (ctx: any, body: any) => {
          capturedBody = body
          return makeSvipMember({ memberId: body.memberId, tierLevel: SvipTierLevel.Level1, tierName: '银卡会员' })
        },
      })
      const ctrl = new SvipController(mock)
      const body = { memberId: 'mem-002', newTierId: 'tier-001' }
      const result = ctrl.downgradeTier(makeTenantContext(), body)
      assert.strictEqual(capturedBody.memberId, 'mem-002')
      assert.strictEqual(result.tierLevel, SvipTierLevel.Level1)
      assert.strictEqual(result.tierName, '银卡会员')
    })
  })

  // ── POST /svip/members/:memberId/freeze ─────────────────
  describe('freezeMember()', () => {
    test('freezes an active member', () => {
      const mock = makeMockService({
        freezeMember: (id: string) => makeSvipMember({ memberId: id, status: SvipMemberStatus.Frozen }),
      })
      const ctrl = new SvipController(mock)
      const result = ctrl.freezeMember(makeTenantContext(), 'mem-001')
      assert.strictEqual(result.status, SvipMemberStatus.Frozen)
    })

    test('throws when freezing non-existent member', () => {
      const mock = makeMockService({
        freezeMember: () => { throw new Error('SvipMember not found') },
      })
      const ctrl = new SvipController(mock)
      assert.throws(() => ctrl.freezeMember(makeTenantContext(), 'mem-999'), /not found/)
    })

    test('passes tenantId to service', () => {
      let capturedTenantId: string | null = null
      const mock = makeMockService({
        freezeMember: (id: string, tenantId: string) => {
          capturedTenantId = tenantId
          return makeSvipMember({ memberId: id, status: SvipMemberStatus.Frozen })
        },
      })
      const ctrl = new SvipController(mock)
      ctrl.freezeMember(makeTenantContext({ tenantId: 't-freeze' }), 'mem-001')
      assert.strictEqual(capturedTenantId, 't-freeze')
    })
  })

  // ── POST /svip/members/:memberId/unfreeze ──────────────
  describe('unfreezeMember()', () => {
    test('unfreezes a frozen member', () => {
      const mock = makeMockService({
        unfreezeMember: (id: string) => makeSvipMember({ memberId: id, status: SvipMemberStatus.Active }),
      })
      const ctrl = new SvipController(mock)
      const result = ctrl.unfreezeMember(makeTenantContext(), 'mem-001')
      assert.strictEqual(result.status, SvipMemberStatus.Active)
    })

    test('throws when unfreezing non-existent member', () => {
      const mock = makeMockService({
        unfreezeMember: () => { throw new Error('SvipMember not found') },
      })
      const ctrl = new SvipController(mock)
      assert.throws(() => ctrl.unfreezeMember(makeTenantContext(), 'mem-999'), /not found/)
    })
  })

  // ── PATCH /svip/expired/check ────────────────────────────
  describe('checkAndDowngradeExpired()', () => {
    test('returns downgraded members when expired exist', () => {
      const downgraded = makeSvipMember({ status: SvipMemberStatus.Expired })
      const mock = makeMockService({
        checkAndDowngradeExpired: () => [downgraded],
      })
      const ctrl = new SvipController(mock)
      const result = ctrl.checkAndDowngradeExpired(makeTenantContext())
      assert.strictEqual(result.length, 1)
      assert.strictEqual(result[0].status, SvipMemberStatus.Expired)
    })

    test('returns empty when no expired members', () => {
      const mock = makeMockService()
      const ctrl = new SvipController(mock)
      const result = ctrl.checkAndDowngradeExpired(makeTenantContext())
      assert.deepStrictEqual(result, [])
    })
  })

  // ── GET /svip/benefits/:tierId ──────────────────────────
  describe('listBenefits()', () => {
    test('returns benefits for a tier', () => {
      const mock = makeMockServiceWithData()
      const ctrl = new SvipController(mock)
      const result = ctrl.listBenefits('tier-001')
      assert.strictEqual(result.length, 1)
      assert.strictEqual(result[0].tierId, 'tier-001')
    })

    test('returns empty for tier with no benefits', () => {
      const mock = makeMockService()
      const ctrl = new SvipController(mock)
      const result = ctrl.listBenefits('tier-999')
      assert.deepStrictEqual(result, [])
    })
  })

  // ── POST /svip/benefits ────────────────────────────────
  describe('createBenefit()', () => {
    test('creates a new benefit', () => {
      let capturedBody: any = null
      const mock = makeMockService({
        createBenefit: (body: any) => {
          capturedBody = body
          return makeSvipBenefit(body)
        },
      })
      const ctrl = new SvipController(mock)
      const body = {
        tierId: 'tier-001',
        benefitType: SvipBenefitType.PriorityQueue,
        benefitValue: '免排队',
        description: '优先入场免排队',
        isActive: true,
      }
      const result = ctrl.createBenefit(body)
      assert.strictEqual(capturedBody.benefitType, SvipBenefitType.PriorityQueue)
      assert.strictEqual(result.benefitType, SvipBenefitType.PriorityQueue)
    })
  })

  // ── PATCH /svip/benefits/:benefitId ────────────────────
  describe('updateBenefit()', () => {
    test('updates an existing benefit', () => {
      let capturedId: string | null = null
      const mock = makeMockService({
        updateBenefit: (id: string, body: any) => {
          capturedId = id
          return makeSvipBenefit({ id, ...body })
        },
      })
      const ctrl = new SvipController(mock)
      const result = ctrl.updateBenefit('benefit-001', { benefitValue: '8折' })
      assert.strictEqual(capturedId, 'benefit-001')
      assert.strictEqual(result.benefitValue, '8折')
    })

    test('partial update works', () => {
      let capturedBody: any = null
      const mock = makeMockService({
        updateBenefit: (id: string, body: any) => {
          capturedBody = body
          return makeSvipBenefit({ id, ...body })
        },
      })
      const ctrl = new SvipController(mock)
      ctrl.updateBenefit('benefit-001', { isActive: false })
      assert.strictEqual(capturedBody.isActive, false)
      assert.strictEqual(capturedBody.benefitType, undefined)
    })
  })

  // ── POST /svip/benefits/use ─────────────────────────────
  describe('useBenefit()', () => {
    test('uses benefit for a member', () => {
      let capturedMemberId: string | null = null
      let capturedBenefitType: string | null = null
      let capturedTenantId: string | null = null
      const mock = makeMockService({
        useBenefit: (memberId: string, benefitType: string, tenantId: string) => {
          capturedMemberId = memberId
          capturedBenefitType = benefitType
          capturedTenantId = tenantId
          return { success: true, benefitUsed: benefitType }
        },
      })
      const ctrl = new SvipController(mock)
      const body = { memberId: 'mem-001', benefitType: SvipBenefitType.Discount }
      const result = ctrl.useBenefit(makeTenantContext({ tenantId: 't-benefit' }), body)
      assert.strictEqual(capturedMemberId, 'mem-001')
      assert.strictEqual(capturedBenefitType, SvipBenefitType.Discount)
      assert.strictEqual(capturedTenantId, 't-benefit')
      assert.strictEqual(result.success, true)
    })
  })

  // ── Edge cases ──────────────────────────────────────────
  describe('edge cases', () => {
    test('upsertTier with minimal body (no icon or color)', () => {
      let capturedBody: any = null
      const mock = makeMockService({
        upsertTier: (ctx: any, body: any) => {
          capturedBody = body
          return makeSvipTier(body)
        },
      })
      const ctrl = new SvipController(mock)
      ctrl.upsertTier(makeTenantContext(), {
        name: '基本会员',
        level: SvipTierLevel.Level1,
        minSpendAmount: 0,
        minPoints: 0,
        benefits: [],
      })
      assert.strictEqual(capturedBody.icon, undefined)
      assert.strictEqual(capturedBody.color, undefined)
      assert.deepStrictEqual(capturedBody.benefits, [])
    })

    test('listTiers with filter on nonexistent level returns empty', () => {
      const mock = makeMockService()
      const ctrl = new SvipController(mock)
      const result = ctrl.listTiers(makeTenantContext(), { level: 99 })
      assert.deepStrictEqual(result, [])
    })
  })
})
