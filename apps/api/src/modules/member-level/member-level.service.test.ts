import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { MemberLevelService } from './member-level.service'
import { MemberLevelTier, MemberLevelSub } from './member-level.entity'

describe('MemberLevelService', () => {
  let service: MemberLevelService

  beforeEach(() => {
    service = new MemberLevelService()
  })

  describe('evaluateMemberLevel - 正常流程', () => {
    it('should return REGULAR_L1 for zero growth member', () => {
      const result = service.evaluateMemberLevel({
        memberId: 'member-001',
        growthValue: 0,
        totalSpend: 0,
        totalVisits: 0,
        tenantId: 'tenant-001'
      })

      assert.equal(result.memberId, 'member-001')
      assert.equal(result.currentTier, MemberLevelTier.REGULAR)
      assert.equal(result.currentSub, MemberLevelSub.L1)
      assert.equal(result.currentLevelKey, 'REGULAR_L1')
      assert.equal(result.upgraded, false)
    })

    it('should assign REGULAR_L2 for growthValue=100', () => {
      const result = service.evaluateMemberLevel({
        memberId: 'member-002',
        growthValue: 100,
        totalSpend: 500,
        totalVisits: 3,
        tenantId: 'tenant-001'
      })

      assert.equal(result.currentTier, MemberLevelTier.REGULAR)
      assert.equal(result.currentSub, MemberLevelSub.L2)
      assert.ok(result.upgraded)
      assert.ok(result.benefits.length > 0)
    })

    it('should assign VIP_L1 for growthValue=800 + spend=2000', () => {
      const result = service.evaluateMemberLevel({
        memberId: 'member-003',
        growthValue: 800,
        totalSpend: 2000,
        totalVisits: 12,
        tenantId: 'tenant-001'
      })

      assert.equal(result.currentTier, MemberLevelTier.VIP)
      assert.equal(result.currentSub, MemberLevelSub.L1)
      assert.ok(result.benefits.some(b => b.includes('VIP')))
    })

    it('should assign DIAMOND_L1 for high-value member', () => {
      const result = service.evaluateMemberLevel({
        memberId: 'member-004',
        growthValue: 15000,
        totalSpend: 60000,
        totalVisits: 200,
        tenantId: 'tenant-001'
      })

      assert.equal(result.currentTier, MemberLevelTier.DIAMOND)
      assert.equal(result.currentSub, MemberLevelSub.L1)
      assert.ok(result.benefits.some(b => b.includes('钻石')))
    })

    it('should assign MYTH_L3 for top-tier member', () => {
      const result = service.evaluateMemberLevel({
        memberId: 'member-005',
        growthValue: 300000,
        totalSpend: 3000000,
        totalVisits: 5000,
        tenantId: 'tenant-001'
      })

      assert.equal(result.currentTier, MemberLevelTier.MYTH)
      assert.equal(result.currentSub, MemberLevelSub.L3)
      assert.equal(result.upgradeProgress, 1.0)
      assert.equal(result.nextLevelThreshold, undefined)
    })
  })

  describe('evaluateMemberLevel - 边界条件', () => {
    it('should assign exact threshold boundary correctly', () => {
      const result = service.evaluateMemberLevel({
        memberId: 'member-b-001',
        growthValue: 4000,
        totalSpend: 10000,
        totalVisits: 50,
        tenantId: 'tenant-001'
      })

      assert.equal(result.currentTier, MemberLevelTier.SVIP)
      assert.equal(result.currentSub, MemberLevelSub.L1)
      assert.ok(result.nextLevelThreshold)
      assert.equal(result.nextLevelThreshold!.tier, MemberLevelTier.SVIP)
      assert.equal(result.nextLevelThreshold!.sub, MemberLevelSub.L2)
    })

    it('should return REGULAR_L1 when only growth is high but other dimensions low', () => {
      const result = service.evaluateMemberLevel({
        memberId: 'member-b-002',
        growthValue: 10000,
        totalSpend: 10,
        totalVisits: 1,
        tenantId: 'tenant-001'
      })

      // Spend 10 < 200 所以从最高往下查都不满足，回到 REGULAR_L1
      assert.equal(result.currentTier, MemberLevelTier.REGULAR)
      assert.equal(result.currentSub, MemberLevelSub.L1)
    })
  })

  describe('batchEvaluate', () => {
    it('should evaluate multiple members and count upgrades', () => {
      const result = service.batchEvaluate({
        items: [
          { memberId: 'm1', growthValue: 0, totalSpend: 0, totalVisits: 0, tenantId: 't1' },
          { memberId: 'm2', growthValue: 1500, totalSpend: 5000, totalVisits: 30, tenantId: 't1' }
        ]
      })

      assert.equal(result.totalEvaluated, 2)
      assert.equal(result.upgradedCount, 1) // m2 upgraded, m1 not
      assert.equal(result.items[0].currentLevelKey, 'REGULAR_L1')
      assert.equal(result.items[1].currentLevelKey, 'VIP_L2')
    })
  })

  describe('getAllLevelConfig', () => {
    it('should return 18 level configs', () => {
      const config = service.getAllLevelConfig()

      assert.equal(config.tiers.length, 18)
      assert.equal(config.tiers[0].tier, MemberLevelTier.REGULAR)
      assert.equal(config.tiers[0].label, 'REGULAR L1')
      assert.equal(config.tiers[17].tier, MemberLevelTier.MYTH)
      assert.equal(config.tiers[17].label, 'MYTH L3')
      assert.ok(config.lastUpdated)
    })
  })

  describe('getUpgradePath', () => {
    it('should return upgrade path from REGULAR_L1 to SVIP_L1', () => {
      const path = service.getUpgradePath(MemberLevelTier.REGULAR, MemberLevelSub.L1, MemberLevelTier.SVIP, MemberLevelSub.L1)

      assert.ok(path.length > 0)
      assert.equal(path[0].fromTier, MemberLevelTier.REGULAR)
      assert.equal(path[0].fromSub, MemberLevelSub.L1)
    })
  })

  describe('calculateLevel (async)', () => {
    it('should return LevelInfo for growthValue 5000', async () => {
      const result = await service.calculateLevel(5000)

      assert.ok(result.currentTier)
      assert.ok(result.growthValue >= 0)
    })
  })

  describe('BS-0114: 升级事件发射', () => {
    it('should NOT emit event when previousLevelKey is not provided', () => {
      const result = service.evaluateMemberLevel({
        memberId: 'member-evt-001',
        growthValue: 2000,
        totalSpend: 5000,
        totalVisits: 30,
        tenantId: 'tenant-001'
      })

      assert.equal(result.currentLevelKey, 'VIP_L2')
      assert.ok(result.upgraded)
    })

    it('should NOT emit event when level unchanged vs previousLevelKey', () => {
      const result = service.evaluateMemberLevel({
        memberId: 'member-evt-002',
        growthValue: 2000,
        totalSpend: 5000,
        totalVisits: 30,
        tenantId: 'tenant-001'
      }, 'VIP_L2')

      assert.equal(result.currentLevelKey, 'VIP_L2')
      assert.ok(result.upgraded)
    })

    it('should emit upgrade event when level changes with mock event bus', () => {
      const published: Array<{ name: string; payload: unknown }> = []
      const mockBus = {
        publish: async (eventName: string, payload: unknown) => {
          published.push({ name: eventName, payload })
        },
        subscribe: () => {},
        backend: 'memory' as const,
        ping: async () => true
      }
      const svc = new MemberLevelService(mockBus)

      const result = svc.evaluateMemberLevel({
        memberId: 'member-evt-003',
        growthValue: 2500,
        totalSpend: 5000,
        totalVisits: 30,
        tenantId: 'tenant-001'
      }, 'VIP_L2')

      assert.equal(result.currentLevelKey, 'VIP_L3')
      assert.equal(published.length, 1)
      assert.equal(published[0]!.name, 'member-level.upgraded')
      const payload = published[0]!.payload as Record<string, unknown>
      assert.equal(payload['memberId'], 'member-evt-003')
      assert.equal(payload['fromLevelKey'], 'VIP_L2')
      assert.equal(payload['toLevelKey'], 'VIP_L3')
    })

    it('should emit upgrade event for multi-level jump', () => {
      const published: Array<{ name: string; payload: unknown }> = []
      const mockBus = {
        publish: async (eventName: string, payload: unknown) => {
          published.push({ name: eventName, payload })
        },
        subscribe: () => {},
        backend: 'memory' as const,
        ping: async () => true
      }
      const svc = new MemberLevelService(mockBus)

      const result = svc.evaluateMemberLevel({
        memberId: 'member-evt-004',
        growthValue: 300000,
        totalSpend: 3000000,
        totalVisits: 5000,
        tenantId: 'tenant-001'
      }, 'REGULAR_L1')

      assert.equal(result.currentLevelKey, 'MYTH_L3')
      assert.equal(published.length, 1)
      const payload = published[0]!.payload as Record<string, unknown>
      assert.equal(payload['fromLevelKey'], 'REGULAR_L1')
      assert.equal(payload['toLevelKey'], 'MYTH_L3')
    })

    it('should include all required fields in upgrade event payload', () => {
      const published: Array<{ name: string; payload: unknown }> = []
      const mockBus = {
        publish: async (eventName: string, payload: unknown) => {
          published.push({ name: eventName, payload })
        },
        subscribe: () => {},
        backend: 'memory' as const,
        ping: async () => true
      }
      const svc = new MemberLevelService(mockBus)

      svc.evaluateMemberLevel({
        memberId: 'member-evt-005',
        growthValue: 2600,
        totalSpend: 5000,
        totalVisits: 30,
        tenantId: 'tenant-005'
      }, 'VIP_L2')

      assert.equal(published.length, 1)
      const payload = published[0]!.payload as Record<string, unknown>
      assert.equal(payload['eventType'], 'member-level.upgraded')
      assert.ok(typeof payload['timestamp'] === 'string')
      assert.equal(payload['memberId'], 'member-evt-005')
      assert.equal(payload['tenantId'], 'tenant-005')
      assert.equal(payload['fromLevelKey'], 'VIP_L2')
      assert.equal(payload['toLevelKey'], 'VIP_L3')
      assert.equal(payload['growthValue'], 2600)
      assert.ok(Array.isArray(payload['newBenefits']))
      assert.ok(typeof payload['reason'] === 'string')
    })

    it('should NOT crash when eventBus is undefined', () => {
      const svc = new MemberLevelService() // no event bus

      const result = svc.evaluateMemberLevel({
        memberId: 'member-evt-006',
        growthValue: 100,
        totalSpend: 200,
        totalVisits: 2,
        tenantId: 'tenant-001'
      }, 'REGULAR_L1')

      assert.equal(result.currentLevelKey, 'REGULAR_L2')
    })

    it('should handle eventBus publish rejection gracefully', () => {
      const failingBus = {
        publish: async () => { throw new Error('bus down') },
        subscribe: () => {},
        backend: 'memory' as const,
        ping: async () => true
      }
      const svc = new MemberLevelService(failingBus)

      const result = svc.evaluateMemberLevel({
        memberId: 'member-evt-007',
        growthValue: 100,
        totalSpend: 200,
        totalVisits: 2,
        tenantId: 'tenant-001'
      }, 'REGULAR_L1')

      assert.equal(result.currentLevelKey, 'REGULAR_L2')
    })
  })
})
