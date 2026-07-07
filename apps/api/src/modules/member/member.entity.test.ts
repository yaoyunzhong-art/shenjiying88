import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import {
  MemberLevel,
  MemberStatus,
  MEMBER_LEVEL_THRESHOLDS,
  computeMemberLevel,
  canUpgrade,
  makeMemberBootstrap,
  type MemberProfile,
  type MemberSession
} from './member.entity'

// ── MemberLevel enum ───────────────────────────────────────────
describe('member.entity: MemberLevel enum', () => {
  it('has five levels in ascending order', () => {
    assert.equal(MemberLevel.Bronze, 'BRONZE')
    assert.equal(MemberLevel.Silver, 'SILVER')
    assert.equal(MemberLevel.Gold, 'GOLD')
    assert.equal(MemberLevel.Platinum, 'PLATINUM')
    assert.equal(MemberLevel.Diamond, 'DIAMOND')
  })

  it('values array is ordered', () => {
    const values = Object.values(MemberLevel)
    assert.deepEqual(values, ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND'])
  })
})

// ── MemberStatus enum ──────────────────────────────────────────
describe('member.entity: MemberStatus enum', () => {
  it('has four statuses', () => {
    assert.equal(MemberStatus.Active, 'ACTIVE')
    assert.equal(MemberStatus.Frozen, 'FROZEN')
    assert.equal(MemberStatus.Expired, 'EXPIRED')
    assert.equal(MemberStatus.Blacklisted, 'BLACKLISTED')
  })
})

// ── MEMBER_LEVEL_THRESHOLDS ────────────────────────────────────
describe('member.entity: MEMBER_LEVEL_THRESHOLDS', () => {
  it('Bronze threshold is 0', () => {
    assert.equal(MEMBER_LEVEL_THRESHOLDS[MemberLevel.Bronze], 0)
  })

  it('Silver threshold is 500', () => {
    assert.equal(MEMBER_LEVEL_THRESHOLDS[MemberLevel.Silver], 500)
  })

  it('Gold threshold is 2000', () => {
    assert.equal(MEMBER_LEVEL_THRESHOLDS[MemberLevel.Gold], 2000)
  })

  it('Platinum threshold is 10000', () => {
    assert.equal(MEMBER_LEVEL_THRESHOLDS[MemberLevel.Platinum], 10000)
  })

  it('Diamond threshold is 50000', () => {
    assert.equal(MEMBER_LEVEL_THRESHOLDS[MemberLevel.Diamond], 50000)
  })

  it('thresholds are monotonically increasing', () => {
    const values = Object.values(MEMBER_LEVEL_THRESHOLDS)
    for (let i = 1; i < values.length; i++) {
      assert.ok(values[i] > values[i - 1], `threshold ${i} should be > ${i - 1}`)
    }
  })
})

// ── computeMemberLevel ─────────────────────────────────────────
describe('member.entity: computeMemberLevel', () => {
  it('0 points -> Bronze', () => {
    assert.equal(computeMemberLevel(0), MemberLevel.Bronze)
  })

  it('499 points -> Bronze', () => {
    assert.equal(computeMemberLevel(499), MemberLevel.Bronze)
  })

  it('500 points -> Silver', () => {
    assert.equal(computeMemberLevel(500), MemberLevel.Silver)
  })

  it('1999 points -> Silver', () => {
    assert.equal(computeMemberLevel(1999), MemberLevel.Silver)
  })

  it('2000 points -> Gold', () => {
    assert.equal(computeMemberLevel(2000), MemberLevel.Gold)
  })

  it('9999 points -> Gold', () => {
    assert.equal(computeMemberLevel(9999), MemberLevel.Gold)
  })

  it('10000 points -> Platinum', () => {
    assert.equal(computeMemberLevel(10000), MemberLevel.Platinum)
  })

  it('49999 points -> Platinum', () => {
    assert.equal(computeMemberLevel(49999), MemberLevel.Platinum)
  })

  it('50000 points -> Diamond', () => {
    assert.equal(computeMemberLevel(50000), MemberLevel.Diamond)
  })

  it('100000 points -> Diamond', () => {
    assert.equal(computeMemberLevel(100000), MemberLevel.Diamond)
  })

  it('negative points -> Bronze', () => {
    assert.equal(computeMemberLevel(-100), MemberLevel.Bronze)
  })

  it('non-integer points work correctly', () => {
    assert.equal(computeMemberLevel(2500.5), MemberLevel.Gold)
  })
})

// ── canUpgrade ─────────────────────────────────────────────────
describe('member.entity: canUpgrade', () => {
  it('Bronze with 500 points can upgrade to Silver', () => {
    assert.equal(canUpgrade(MemberLevel.Bronze, 500), true)
  })

  it('Bronze with 0 points cannot upgrade', () => {
    assert.equal(canUpgrade(MemberLevel.Bronze, 0), false)
  })

  it('Silver with 2000 points can upgrade to Gold', () => {
    assert.equal(canUpgrade(MemberLevel.Silver, 2000), true)
  })

  it('Gold with 1500 points cannot upgrade (insufficient for Platinum)', () => {
    assert.equal(canUpgrade(MemberLevel.Gold, 1500), false)
  })

  it('Diamond can never upgrade further', () => {
    assert.equal(canUpgrade(MemberLevel.Diamond, 999999), false)
  })

  it('Platinum with 50000 points can upgrade to Diamond', () => {
    assert.equal(canUpgrade(MemberLevel.Platinum, 50000), true)
  })

  it('Silver with 499 points cannot upgrade', () => {
    assert.equal(canUpgrade(MemberLevel.Silver, 499), false)
  })
})

// ── makeMemberBootstrap ────────────────────────────────────────
describe('member.entity: makeMemberBootstrap', () => {
  const tenantContext = {
    tenantId: 't-entity-1',
    brandId: 'b-entity-1',
    storeId: 's-entity-1',
    marketCode: 'zh-cn'
  }

  it('returns default bootstrap with given tenant context', () => {
    const result = makeMemberBootstrap(tenantContext)
    assert.deepStrictEqual(result.tenantContext, tenantContext)
    assert.equal(result.phase, 'scaffold')
    assert.deepEqual(result.capabilities, ['member-center', 'points', 'svip', 'blind-box'])
  })

  it('allows overriding phase', () => {
    const result = makeMemberBootstrap(tenantContext, { phase: 'production' })
    assert.equal(result.phase, 'production')
  })

  it('allows overriding capabilities', () => {
    const result = makeMemberBootstrap(tenantContext, {
      capabilities: ['member-center']
    })
    assert.deepEqual(result.capabilities, ['member-center'])
  })

  it('allows overriding both phase and capabilities', () => {
    const result = makeMemberBootstrap(tenantContext, {
      phase: 'staging',
      capabilities: ['member-center', 'points']
    })
    assert.equal(result.phase, 'staging')
    assert.deepEqual(result.capabilities, ['member-center', 'points'])
  })

  it('works with minimal tenant context', () => {
    const minimalCtx = { tenantId: 't-min' }
    const result = makeMemberBootstrap(minimalCtx)
    assert.equal(result.tenantContext.tenantId, 't-min')
    assert.equal(result.tenantContext.brandId, undefined)
  })
})

// ── MemberProfile type contract ────────────────────────────────
describe('member.entity: MemberProfile type contract', () => {
  it('can construct a valid MemberProfile object', () => {
    const profile: MemberProfile = {
      memberId: 'mem-001',
      tenantContext: { tenantId: 't-1' },
      nickname: 'TestUser',
      level: MemberLevel.Gold,
      status: MemberStatus.Active,
      points: 3000,
      registeredAt: '2025-01-15T00:00:00.000Z',
      lastActiveAt: '2025-06-14T10:00:00.000Z'
    }

    assert.equal(profile.memberId, 'mem-001')
    assert.equal(profile.nickname, 'TestUser')
    assert.equal(profile.level, 'GOLD')
    assert.equal(profile.status, 'ACTIVE')
    assert.equal(profile.points, 3000)
    assert.ok(profile.lastActiveAt)
    assert.ok(!isNaN(Date.parse(profile.registeredAt)))
  })

  it('lastActiveAt is optional', () => {
    const profile: MemberProfile = {
      memberId: 'mem-002',
      tenantContext: { tenantId: 't-2' },
      nickname: 'Minimal',
      level: MemberLevel.Bronze,
      status: MemberStatus.Active,
      points: 0,
      registeredAt: '2025-06-14T00:00:00.000Z'
    }

    assert.equal(profile.lastActiveAt, undefined)
  })
})

describe('member.entity: MemberSession type contract', () => {
  it('can construct a valid member session', () => {
    const session: MemberSession = {
      sessionToken: 'sess-token',
      memberId: 'mem-001',
      userId: 'user-001',
      tenantId: 'tenant-1',
      brandId: 'brand-1',
      storeId: 'store-1',
      issuedAt: '2026-06-14T00:00:00.000Z',
      expiresAt: '2026-06-21T00:00:00.000Z',
      authenticated: true
    }

    assert.equal(session.memberId, 'mem-001')
    assert.equal(session.userId, 'user-001')
    assert.equal(session.authenticated, true)
  })
})
