import { describe, it, expect, beforeEach } from 'vitest'
import { ImplicitFeedbackService, type ImplicitAction } from './implicit-feedback.service'

describe('ImplicitFeedbackService', () => {
  let service: ImplicitFeedbackService

  beforeEach(() => {
    service = new ImplicitFeedbackService()
  })

  describe('scoreAction', () => {
    it('should return weight for purchase action', () => {
      const action: ImplicitAction = {
        memberId: 'm1',
        tenantId: 'T',
        itemId: 'A',
        actionType: 'purchase',
        timestamp: '2024-06-01',
        quantity: 1,
      }
      expect(service.scoreAction(action)).toBe(1.0)
    })

    it('should return 0.1 for view action', () => {
      const action: ImplicitAction = {
        memberId: 'm1',
        tenantId: 'T',
        itemId: 'A',
        actionType: 'view',
        timestamp: '2024-06-01',
      }
      expect(service.scoreAction(action)).toBe(0.1)
    })

    it('should return enhanced score for view with long duration', () => {
      const action: ImplicitAction = {
        memberId: 'm1',
        tenantId: 'T',
        itemId: 'A',
        actionType: 'view',
        timestamp: '2024-06-01',
        durationMs: 60_000, // 60 seconds
      }
      // weight = 0.1, durationBonus = min(2.0, max(1.0, 60/30)) = 2.0
      // score = 0.1 * 2.0 = 0.2
      expect(service.scoreAction(action)).toBeCloseTo(0.2, 2)
    })

    it('should penalize very short view as misclick', () => {
      const action: ImplicitAction = {
        memberId: 'm1',
        tenantId: 'T',
        itemId: 'A',
        actionType: 'view',
        timestamp: '2024-06-01',
        durationMs: 500, // under 2 seconds
      }
      // weight = 0.1, penalized to 0.01
      expect(service.scoreAction(action)).toBeCloseTo(0.01, 2)
    })

    it('should boost addToCart with quantity > 1', () => {
      const action: ImplicitAction = {
        memberId: 'm1',
        tenantId: 'T',
        itemId: 'A',
        actionType: 'addToCart',
        timestamp: '2024-06-01',
        quantity: 3,
      }
      // base = 0.5, quantityFactor = min(2.0, 3 * 0.8) = 2.0
      // score = 0.5 * 2.0 = 1.0
      expect(service.scoreAction(action)).toBeCloseTo(1.0, 2)
    })

    it('should boost purchase with large quantity', () => {
      const action: ImplicitAction = {
        memberId: 'm1',
        tenantId: 'T',
        itemId: 'A',
        actionType: 'purchase',
        timestamp: '2024-06-01',
        quantity: 4,
      }
      // base = 1.0, quantityFactor = min(3.0, 1 + 4 * 0.5) = 3.0
      // score = 1.0 * 3.0 = 3.0 (capped to 2.0)
      expect(service.scoreAction(action)).toBeCloseTo(2.0, 2)
    })

    it('should cap score at 2.0', () => {
      const action: ImplicitAction = {
        memberId: 'm1',
        tenantId: 'T',
        itemId: 'A',
        actionType: 'purchase',
        timestamp: '2024-06-01',
        quantity: 10,
      }
      expect(service.scoreAction(action)).toBeLessThanOrEqual(2.0)
    })
  })

  describe('buildPreferenceProfile', () => {
    it('should build profile from actions', () => {
      const actions: ImplicitAction[] = [
        {
          memberId: 'm1',
          tenantId: 'T',
          itemId: 'A',
          category: 'tech',
          tags: ['premium'],
          actionType: 'purchase',
          timestamp: '2024-06-02',
          quantity: 1,
        },
        {
          memberId: 'm1',
          tenantId: 'T',
          itemId: 'B',
          category: 'tech',
          tags: ['new'],
          actionType: 'view',
          timestamp: '2024-06-01',
          durationMs: 30_000,
        },
      ]

      const profile = service.buildPreferenceProfile('m1', 'T', actions)

      expect(profile.memberId).toBe('m1')
      expect(profile.tenantId).toBe('T')
      expect(profile.totalActions).toBe(2)
      expect(profile.categoryAffinities.get('tech')).toBeGreaterThan(0)
      expect(profile.tagAffinities.get('premium')).toBeGreaterThan(0)
      expect(profile.itemScores.has('A')).toBe(true)
      expect(profile.itemScores.has('B')).toBe(true)
    })

    it('should sort actions by time descending', () => {
      const actions: ImplicitAction[] = [
        {
          memberId: 'm1',
          tenantId: 'T',
          itemId: 'A',
          actionType: 'view',
          timestamp: '2024-01-01',
        },
        {
          memberId: 'm1',
          tenantId: 'T',
          itemId: 'B',
          actionType: 'purchase',
          timestamp: '2024-06-01',
        },
      ]

      const profile = service.buildPreferenceProfile('m1', 'T', actions)

      expect(profile.recentActions[0].itemId).toBe('B')
    })

    it('should handle empty actions', () => {
      const profile = service.buildPreferenceProfile('m1', 'T', [])

      expect(profile.totalActions).toBe(0)
      expect(profile.categoryAffinities.size).toBe(0)
      expect(profile.lastActiveAt).toBeNull()
    })
  })

  describe('computeMatchScore', () => {
    it('should return higher score for items matching preference', () => {
      const actions: ImplicitAction[] = [
        {
          memberId: 'm1',
          tenantId: 'T',
          itemId: 'A',
          category: 'tech',
          tags: ['premium'],
          actionType: 'purchase',
          timestamp: '2024-06-01',
          quantity: 1,
        },
      ]

      const profile = service.buildPreferenceProfile('m1', 'T', actions)

      const matchingScore = service.computeMatchScore('A', 'tech', ['premium'], profile)
      const nonMatchingScore = service.computeMatchScore('B', 'food', ['old'], profile)

      expect(matchingScore).toBeGreaterThan(nonMatchingScore)
    })

    it('should return score between 0 and 1', () => {
      const actions: ImplicitAction[] = [
        {
          memberId: 'm1',
          tenantId: 'T',
          itemId: 'A',
          category: 'tech',
          tags: ['premium', 'new'],
          actionType: 'purchase',
          timestamp: '2024-06-01',
          quantity: 5,
        },
      ]

      const profile = service.buildPreferenceProfile('m1', 'T', actions)
      const score = service.computeMatchScore('A', 'tech', ['premium', 'new'], profile)

      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(1)
    })
  })

  describe('validateAction', () => {
    it('should validate correct action', () => {
      const action: ImplicitAction = {
        memberId: 'm1',
        tenantId: 'T',
        itemId: 'A',
        actionType: 'purchase',
        timestamp: '2024-06-01',
      }

      const result = service.validateAction(action)
      expect(result.valid).toBe(true)
    })

    it('should reject action without memberId', () => {
      const action = { tenantId: 'T', actionType: 'purchase', timestamp: '2024-06-01' } as unknown as ImplicitAction
      expect(service.validateAction(action).valid).toBe(false)
    })

    it('should reject unknown action type', () => {
      const action: Record<string, unknown> = {
        memberId: 'm1',
        tenantId: 'T',
        actionType: 'unknown',
        timestamp: '2024-06-01',
      }

      expect(service.validateAction(action as unknown as ImplicitAction).valid).toBe(false)
    })

    it('should reject view with excessive duration', () => {
      const action: ImplicitAction = {
        memberId: 'm1',
        tenantId: 'T',
        itemId: 'A',
        actionType: 'view',
        timestamp: '2024-06-01',
        durationMs: 3_600_000, // 1 hour
      }

      expect(service.validateAction(action).valid).toBe(false)
    })
  })

  describe('filterValidActions', () => {
    it('should keep only valid actions', () => {
      const actions: ImplicitAction[] = [
        {
          memberId: 'm1',
          tenantId: 'T',
          itemId: 'A',
          actionType: 'purchase',
          timestamp: '2024-06-01',
        },
        { memberId: 'm1', tenantId: 'T', actionType: 'unknown', timestamp: '2024-06-01' } as unknown as ImplicitAction,
      ]

      const filtered = service.filterValidActions(actions)
      expect(filtered).toHaveLength(1)
      expect(filtered[0].actionType).toBe('purchase')
    })

    it('should return empty for all invalid', () => {
      const actions = [
        { actionType: 'invalid' },
      ] as unknown as ImplicitAction[]

      expect(service.filterValidActions(actions)).toHaveLength(0)
    })
  })
})
