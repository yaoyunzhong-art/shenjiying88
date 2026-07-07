import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [ai-recommend] [A] entity 测试
 * 类型契约测试：Recommendation, UserProfile, ItemScore, RecommendationStrategy, GenerateRecommendationsInput/Output
 */
import 'reflect-metadata'
import assert from 'node:assert/strict'
import type {
  Recommendation,
  UserProfile,
  ItemScore,
  RecommendationStrategy,
  StrategyWeightFactor,
  GenerateRecommendationsInput,
  GenerateRecommendationsOutput,
  RecommendType,
  RecommendationStatus,
  VisitFrequency,
  InteractionType,
  ScoreItemType
} from './ai-recommend.entity'

// ── RecommendType ──
describe('ai-recommend.entity: RecommendType', () => {
  it('supports all 5 recommendation types', () => {
    const types: RecommendType[] = ['game', 'product', 'activity', 'coupon', 'svip']
    assert.equal(types.length, 5)
    for (const t of types) {
      assert.ok(['game', 'product', 'activity', 'coupon', 'svip'].includes(t))
    }
  })

  it('rejects invalid recommend type at type level', () => {
    const valid: RecommendType = 'game'
    assert.equal(valid, 'game')
    // @ts-expect-error - invalid type should be rejected
    const _invalid: RecommendType = 'invalid'
    void _invalid
  })
})

// ── RecommendationStatus ──
describe('ai-recommend.entity: RecommendationStatus', () => {
  it('supports all 4 statuses', () => {
    const statuses: RecommendationStatus[] = ['active', 'clicked', 'converted', 'expired']
    assert.equal(statuses.length, 4)
  })

  it('active is default status', () => {
    const status: RecommendationStatus = 'active'
    assert.equal(status, 'active')
  })
})

// ── VisitFrequency ──
describe('ai-recommend.entity: VisitFrequency', () => {
  it('supports all 4 frequencies', () => {
    const freqs: VisitFrequency[] = ['daily', 'weekly', 'monthly', 'occasional']
    assert.equal(freqs.length, 4)
  })
})

// ── InteractionType ──
describe('ai-recommend.entity: InteractionType', () => {
  it('supports all 4 interaction types', () => {
    const types: InteractionType[] = ['view', 'click', 'purchase', 'play']
    assert.equal(types.length, 4)
  })
})

// ── ScoreItemType ──
describe('ai-recommend.entity: ScoreItemType', () => {
  it('supports all 3 score item types', () => {
    const types: ScoreItemType[] = ['game', 'product', 'activity']
    assert.equal(types.length, 3)
  })
})

// ── Recommendation ──
describe('ai-recommend.entity: Recommendation', () => {
  it('creates valid Recommendation with all required fields', () => {
    const rec: Recommendation = {
      id: 'rec-001',
      tenantId: 'tenant-1',
      type: 'game',
      itemId: 'game-001',
      itemName: '王者荣耀',
      score: 85,
      reason: '热门推荐',
      strategy: 'popularity',
      status: 'active',
      expiresAt: '2026-06-25T00:00:00.000Z',
      createdAt: '2026-06-24T00:00:00.000Z'
    }

    assert.equal(rec.id, 'rec-001')
    assert.equal(rec.tenantId, 'tenant-1')
    assert.equal(rec.type, 'game')
    assert.equal(rec.itemId, 'game-001')
    assert.equal(rec.itemName, '王者荣耀')
    assert.equal(rec.score, 85)
    assert.equal(rec.reason, '热门推荐')
    assert.equal(rec.strategy, 'popularity')
    assert.equal(rec.status, 'active')
    assert.equal(rec.expiresAt, '2026-06-25T00:00:00.000Z')
    assert.equal(rec.createdAt, '2026-06-24T00:00:00.000Z')
  })

  it('creates Recommendation with optional storeId and memberId', () => {
    const rec: Recommendation = {
      id: 'rec-002',
      tenantId: 'tenant-1',
      storeId: 'store-shanghai',
      memberId: 'member-001',
      type: 'product',
      itemId: 'product-001',
      itemName: '游戏手柄',
      score: 72,
      reason: '协同过滤',
      strategy: 'collaborative-filtering',
      status: 'clicked',
      expiresAt: '2026-06-25T00:00:00.000Z',
      createdAt: '2026-06-24T00:00:00.000Z'
    }

    assert.equal(rec.storeId, 'store-shanghai')
    assert.equal(rec.memberId, 'member-001')
    assert.equal(rec.status, 'clicked')
  })

  it('supports all status transitions', () => {
    const active: Recommendation['status'] = 'active'
    const clicked: Recommendation['status'] = 'clicked'
    const converted: Recommendation['status'] = 'converted'
    const expired: Recommendation['status'] = 'expired'

    const rec: Recommendation = {
      id: 'rec-003',
      tenantId: 't1',
      type: 'svip',
      itemId: 'svip-001',
      itemName: 'SVIP 月卡',
      score: 95,
      reason: '高转化率',
      strategy: 'hybrid',
      status: active,
      expiresAt: '2026-06-25T00:00:00.000Z',
      createdAt: '2026-06-24T00:00:00.000Z'
    }
    assert.equal(rec.status, 'active')

    const updated: Recommendation = { ...rec, status: clicked }
    assert.equal(updated.status, 'clicked')

    const convertedRec: Recommendation = { ...rec, status: converted }
    assert.equal(convertedRec.status, 'converted')

    const expiredRec: Recommendation = { ...rec, status: expired }
    assert.equal(expiredRec.status, 'expired')
  })

  it('score is number between 0-100', () => {
    const rec: Recommendation = {
      id: 'rec-score',
      tenantId: 't1',
      type: 'activity',
      itemId: 'act-001',
      itemName: '密室逃脱',
      score: 88,
      reason: '',
      strategy: 'popularity',
      status: 'active',
      expiresAt: '2026-06-25T00:00:00.000Z',
      createdAt: '2026-06-24T00:00:00.000Z'
    }
    assert.equal(typeof rec.score, 'number')
    assert.ok(rec.score >= 0 && rec.score <= 100)
  })

  it('supports coupon type recommendation', () => {
    const rec: Recommendation = {
      id: 'rec-coupon',
      tenantId: 't1',
      memberId: 'm-1',
      type: 'coupon',
      itemId: 'coupon-001',
      itemName: '满100减20券',
      score: 60,
      reason: '用户常客优惠',
      strategy: 'content-based',
      status: 'active',
      expiresAt: '2026-06-25T00:00:00.000Z',
      createdAt: '2026-06-24T00:00:00.000Z'
    }
    assert.equal(rec.type, 'coupon')
    assert.equal(rec.memberId, 'm-1')
  })
})

// ── UserProfile ──
describe('ai-recommend.entity: UserProfile', () => {
  it('creates valid UserProfile with nested preferences', () => {
    const profile: UserProfile = {
      id: 'profile-001',
      memberId: 'member-001',
      tenantId: 'tenant-1',
      preferences: {
        gameTypes: ['MOBA', 'RPG'],
        priceRange: { min: 0, max: 500 },
        visitFrequency: 'weekly',
        avgSpend: 120,
        favoriteTimeSlot: '18:00-22:00'
      },
      behaviorTags: ['game-enthusiast', 'high-spender'],
      lastUpdated: '2026-06-24T00:00:00.000Z'
    }

    assert.equal(profile.memberId, 'member-001')
    assert.deepEqual(profile.preferences.gameTypes, ['MOBA', 'RPG'])
    assert.equal(profile.preferences.priceRange.min, 0)
    assert.equal(profile.preferences.priceRange.max, 500)
    assert.equal(profile.preferences.visitFrequency, 'weekly')
    assert.equal(profile.preferences.avgSpend, 120)
    assert.equal(profile.preferences.favoriteTimeSlot, '18:00-22:00')
    assert.ok(profile.behaviorTags.includes('game-enthusiast'))
  })

  it('supports minimal profile with empty arrays', () => {
    const profile: UserProfile = {
      id: 'profile-min',
      memberId: 'member-min',
      tenantId: 't1',
      preferences: {
        gameTypes: [],
        priceRange: { min: 0, max: 100 },
        visitFrequency: 'occasional',
        avgSpend: 0,
        favoriteTimeSlot: '00:00'
      },
      behaviorTags: [],
      lastUpdated: '2026-06-24T00:00:00.000Z'
    }

    assert.deepEqual(profile.preferences.gameTypes, [])
    assert.deepEqual(profile.behaviorTags, [])
    assert.equal(profile.preferences.avgSpend, 0)
  })

  it('supports all visit frequencies', () => {
    const freqs: VisitFrequency[] = ['daily', 'weekly', 'monthly', 'occasional']
    for (const freq of freqs) {
      const profile: UserProfile = {
        id: `profile-${freq}`,
        memberId: `m-${freq}`,
        tenantId: 't1',
        preferences: {
          gameTypes: [],
          priceRange: { min: 0, max: 100 },
          visitFrequency: freq,
          avgSpend: 0,
          favoriteTimeSlot: '00:00'
        },
        behaviorTags: [],
        lastUpdated: '2026-06-24T00:00:00.000Z'
      }
      assert.equal(profile.preferences.visitFrequency, freq)
    }
  })
})

// ── ItemScore ──
describe('ai-recommend.entity: ItemScore', () => {
  it('creates valid ItemScore', () => {
    const score: ItemScore = {
      id: 'score-001',
      memberId: 'member-001',
      itemId: 'game-001',
      itemType: 'game',
      rating: 5,
      interaction: 'play',
      weight: 1.0,
      createdAt: '2026-06-24T00:00:00.000Z'
    }

    assert.equal(score.rating, 5)
    assert.equal(score.interaction, 'play')
    assert.equal(score.weight, 1.0)
    assert.equal(score.itemType, 'game')
  })

  it('supports all interaction types', () => {
    const interactions: InteractionType[] = ['view', 'click', 'purchase', 'play']
    for (const interaction of interactions) {
      const score: ItemScore = {
        id: `score-${interaction}`,
        memberId: 'm-1',
        itemId: 'game-001',
        itemType: 'product',
        rating: 3,
        interaction,
        weight: 0.5,
        createdAt: '2026-06-24T00:00:00.000Z'
      }
      assert.equal(score.interaction, interaction)
    }
  })

  it('rating is between 1 and 5', () => {
    const score: ItemScore = {
      id: 'score-rating',
      memberId: 'm-1',
      itemId: 'game-001',
      itemType: 'activity',
      rating: 4,
      interaction: 'view',
      weight: 0.3,
      createdAt: '2026-06-24T00:00:00.000Z'
    }
    assert.ok(score.rating >= 1 && score.rating <= 5)
  })
})

// ── StrategyWeightFactor ──
describe('ai-recommend.entity: StrategyWeightFactor', () => {
  it('creates valid weight factor with factor name and weight', () => {
    const factor: StrategyWeightFactor = {
      factor: 'popularity',
      weight: 0.5
    }
    assert.equal(factor.factor, 'popularity')
    assert.equal(factor.weight, 0.5)
  })

  it('weight is between 0 and 1', () => {
    const factors: StrategyWeightFactor[] = [
      { factor: 'a', weight: 0 },
      { factor: 'b', weight: 0.5 },
      { factor: 'c', weight: 1 }
    ]
    for (const f of factors) {
      assert.ok(f.weight >= 0 && f.weight <= 1)
    }
  })

  it('factor can be any descriptive string', () => {
    const factor: StrategyWeightFactor = {
      factor: 'seasonality',
      weight: 0.4
    }
    assert.equal(factor.factor, 'seasonality')
  })
})

// ── RecommendationStrategy ──
describe('ai-recommend.entity: RecommendationStrategy', () => {
  it('creates valid RecommendationStrategy with config', () => {
    const strategy: RecommendationStrategy = {
      id: 'strategy-hybrid-v1',
      name: 'hybrid',
      description: '混合推荐策略',
      targetType: 'game',
      config: {
        weights: [
          { factor: 'popularity', weight: 0.3 },
          { factor: 'collaborative', weight: 0.3 },
          { factor: 'contentMatch', weight: 0.4 }
        ],
        fallbackStrategy: 'strategy-popularity-v1',
        minScore: 20,
        maxResults: 15
      },
      isEnabled: true,
      createdAt: '2026-06-24T00:00:00.000Z',
      updatedAt: '2026-06-24T00:00:00.000Z'
    }

    assert.equal(strategy.name, 'hybrid')
    assert.equal(strategy.targetType, 'game')
    assert.equal(strategy.config.weights.length, 3)
    assert.equal(strategy.config.fallbackStrategy, 'strategy-popularity-v1')
    assert.equal(strategy.config.minScore, 20)
    assert.equal(strategy.config.maxResults, 15)
    assert.equal(strategy.isEnabled, true)
  })

  it('supports strategy with optional fields omitted', () => {
    const strategy: RecommendationStrategy = {
      id: 'strategy-simple-v1',
      name: 'simple',
      description: 'Simple strategy',
      targetType: 'product',
      config: {
        weights: [{ factor: 'rating', weight: 1.0 }]
      },
      isEnabled: true,
      createdAt: '2026-06-24T00:00:00.000Z',
      updatedAt: '2026-06-24T00:00:00.000Z'
    }

    assert.equal(strategy.config.fallbackStrategy, undefined)
    assert.equal(strategy.config.minScore, undefined)
    assert.equal(strategy.config.maxResults, undefined)
  })

  it('supports disabled strategy', () => {
    const strategy: RecommendationStrategy = {
      id: 'strategy-disabled',
      name: 'test-disabled',
      description: '',
      targetType: 'game',
      config: { weights: [] },
      isEnabled: false,
      createdAt: '2026-06-24T00:00:00.000Z',
      updatedAt: '2026-06-24T00:00:00.000Z'
    }
    assert.equal(strategy.isEnabled, false)
  })

  it('supports all target types', () => {
    const types: RecommendType[] = ['game', 'product', 'activity', 'coupon', 'svip']
    for (const t of types) {
      const strategy: RecommendationStrategy = {
        id: `strategy-${t}`,
        name: `test-${t}`,
        description: '',
        targetType: t,
        config: { weights: [] },
        isEnabled: true,
        createdAt: '2026-06-24T00:00:00.000Z',
        updatedAt: '2026-06-24T00:00:00.000Z'
      }
      assert.equal(strategy.targetType, t)
    }
  })
})

// ── GenerateRecommendationsInput ──
describe('ai-recommend.entity: GenerateRecommendationsInput', () => {
  it('requires strategyId only', () => {
    const input: GenerateRecommendationsInput = {
      strategyId: 'strategy-popularity-v1'
    }
    assert.equal(input.strategyId, 'strategy-popularity-v1')
    assert.equal(input.memberId, undefined)
    assert.equal(input.limit, undefined)
  })

  it('accepts optional memberId, storeId, type, limit', () => {
    const input: GenerateRecommendationsInput = {
      strategyId: 'strategy-hybrid-v1',
      memberId: 'member-001',
      storeId: 'store-shanghai',
      type: 'game',
      limit: 5
    }
    assert.equal(input.memberId, 'member-001')
    assert.equal(input.storeId, 'store-shanghai')
    assert.equal(input.type, 'game')
    assert.equal(input.limit, 5)
  })
})

// ── GenerateRecommendationsOutput ──
describe('ai-recommend.entity: GenerateRecommendationsOutput', () => {
  it('creates valid output with required fields', () => {
    const output: GenerateRecommendationsOutput = {
      strategy: 'hybrid',
      items: [],
      executionTimeMs: 15,
      timestamp: '2026-06-24T00:00:00.000Z'
    }
    assert.equal(output.strategy, 'hybrid')
    assert.equal(output.items.length, 0)
    assert.equal(output.executionTimeMs, 15)
    assert.ok(!isNaN(Date.parse(output.timestamp)))
  })

  it('includes optional fallbackStrategy', () => {
    const output: GenerateRecommendationsOutput = {
      strategy: 'content-based',
      fallbackStrategy: 'strategy-popularity-v1',
      items: [
        {
          id: 'rec-fallback',
          tenantId: 't1',
          type: 'game',
          itemId: 'game-001',
          itemName: '王者荣耀',
          score: 80,
          reason: '回退到热门',
          strategy: 'popularity',
          status: 'active',
          expiresAt: '2026-06-25T00:00:00.000Z',
          createdAt: '2026-06-24T00:00:00.000Z'
        }
      ],
      executionTimeMs: 20,
      timestamp: '2026-06-24T00:00:00.000Z'
    }
    assert.equal(output.fallbackStrategy, 'strategy-popularity-v1')
    assert.equal(output.items.length, 1)
    assert.equal(output.items[0].id, 'rec-fallback')
  })

  it('executionTimeMs is non-negative', () => {
    const output: GenerateRecommendationsOutput = {
      strategy: 'popularity',
      items: [],
      executionTimeMs: 0,
      timestamp: '2026-06-24T00:00:00.000Z'
    }
    assert.ok(output.executionTimeMs >= 0)
  })
})

// ── Cross-type composition ──
describe('ai-recommend.entity: cross-type composition', () => {
  it('Recommendation can store svip type items', () => {
    const rec: Recommendation = {
      id: 'rec-svip',
      tenantId: 't1',
      memberId: 'm-1',
      type: 'svip',
      itemId: 'svip-gold',
      itemName: 'SVIP 黄金会员',
      score: 90,
      reason: '高价值用户推荐',
      strategy: 'content-based',
      status: 'active',
      expiresAt: '2026-07-01T00:00:00.000Z',
      createdAt: '2026-06-24T00:00:00.000Z'
    }
    assert.equal(rec.type, 'svip')
    assert.equal(rec.itemName, 'SVIP 黄金会员')
  })

  it('Recommendation can store coupon type items', () => {
    const rec: Recommendation = {
      id: 'rec-coupon-x',
      tenantId: 't1',
      memberId: 'm-2',
      type: 'coupon',
      itemId: 'coupon-discount-50',
      itemName: '50元优惠券',
      score: 65,
      reason: '用户常客优惠',
      strategy: 'hybrid',
      status: 'active',
      expiresAt: '2026-06-28T00:00:00.000Z',
      createdAt: '2026-06-24T00:00:00.000Z'
    }
    assert.equal(rec.type, 'coupon')
    assert.equal(rec.score, 65)
  })

  it('StrategyWeightFactor can be reused across strategies', () => {
    const weight: StrategyWeightFactor = { factor: 'recency', weight: 0.2 }
    const strategyA: RecommendationStrategy = {
      id: 'strat-a',
      name: 'A',
      description: '',
      targetType: 'game',
      config: { weights: [weight] },
      isEnabled: true,
      createdAt: '2026-06-24T00:00:00.000Z',
      updatedAt: '2026-06-24T00:00:00.000Z'
    }
    const strategyB: RecommendationStrategy = {
      id: 'strat-b',
      name: 'B',
      description: '',
      targetType: 'activity',
      config: { weights: [weight, { factor: 'popularity', weight: 0.8 }] },
      isEnabled: true,
      createdAt: '2026-06-24T00:00:00.000Z',
      updatedAt: '2026-06-24T00:00:00.000Z'
    }
    assert.equal(strategyA.config.weights[0].weight, 0.2)
    assert.equal(strategyB.config.weights[0].weight, 0.2)
  })
})
