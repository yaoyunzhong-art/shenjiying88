import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [ai-recommend] [A] DTO 测试
 * 验证 class-validator 装饰器的约束和 DTO 转换
 */
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { validate } from 'class-validator'
import { plainToInstance } from 'class-transformer'
import {
  PreferencesDto,
  PriceRangeDto,
  UserProfileDto,
  UpdateProfileDto,
  ItemScoreDto,
  RecordInteractionDto,
  RecommendationQueryDto,
  StrategyWeightDto,
  CreateStrategyDto,
  UpdateStrategyDto,
  GenerateRecommendationsDto,
  RecordConversionDto
} from './ai-recommend.dto'

// ── PriceRangeDto ──
describe('ai-recommend.dto: PriceRangeDto', () => {
  it('validates correct price range', async () => {
    const dto = plainToInstance(PriceRangeDto, { min: 0, max: 500 })
    const errors = await validate(dto)
    assert.equal(errors.length, 0)
  })

  it('rejects negative min', async () => {
    const dto = plainToInstance(PriceRangeDto, { min: -1, max: 100 })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
    assert.ok(errors.some(e => e.property === 'min'))
  })

  it('rejects negative max', async () => {
    const dto = plainToInstance(PriceRangeDto, { min: 0, max: -1 })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
    assert.ok(errors.some(e => e.property === 'max'))
  })

  it('rejects missing min', async () => {
    const dto = plainToInstance(PriceRangeDto, { max: 100 })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
    assert.ok(errors.some(e => e.property === 'min'))
  })

  it('rejects missing max', async () => {
    const dto = plainToInstance(PriceRangeDto, { min: 0 })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
    assert.ok(errors.some(e => e.property === 'max'))
  })

  it('rejects string min', async () => {
    const dto = plainToInstance(PriceRangeDto, { min: 'abc', max: 100 })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
  })
})

// ── PreferencesDto ──
describe('ai-recommend.dto: PreferencesDto', () => {
  it('validates correct preferences', async () => {
    const dto = plainToInstance(PreferencesDto, {
      gameTypes: ['MOBA', 'RPG'],
      priceRange: { min: 0, max: 500 },
      visitFrequency: 'weekly',
      avgSpend: 120,
      favoriteTimeSlot: '18:00-22:00'
    })
    const errors = await validate(dto)
    assert.equal(errors.length, 0)
  })

  it('rejects invalid visitFrequency', async () => {
    const dto = plainToInstance(PreferencesDto, {
      gameTypes: ['MOBA'],
      priceRange: { min: 0, max: 100 },
      visitFrequency: 'yearly',
      avgSpend: 50,
      favoriteTimeSlot: '10:00'
    })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
    assert.ok(errors.some(e => e.property === 'visitFrequency'))
  })

  it('rejects negative avgSpend', async () => {
    const dto = plainToInstance(PreferencesDto, {
      gameTypes: [],
      priceRange: { min: 0, max: 100 },
      visitFrequency: 'daily',
      avgSpend: -10,
      favoriteTimeSlot: '10:00'
    })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
    assert.ok(errors.some(e => e.property === 'avgSpend'))
  })

  it('rejects empty gameTypes without array', async () => {
    const dto = plainToInstance(PreferencesDto, {
      gameTypes: 'not-array',
      priceRange: { min: 0, max: 100 },
      visitFrequency: 'weekly',
      avgSpend: 50,
      favoriteTimeSlot: '10:00'
    })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
  })

  it('rejects empty favoriteTimeSlot', async () => {
    const dto = plainToInstance(PreferencesDto, {
      gameTypes: ['MOBA'],
      priceRange: { min: 0, max: 100 },
      visitFrequency: 'weekly',
      avgSpend: 50,
      favoriteTimeSlot: ''
    })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
    assert.ok(errors.some(e => e.property === 'favoriteTimeSlot'))
  })
})

// ── UserProfileDto ──
describe('ai-recommend.dto: UserProfileDto', () => {
  it('validates correct user profile', async () => {
    const dto = plainToInstance(UserProfileDto, {
      memberId: 'member-001',
      tenantId: 'tenant-1',
      preferences: {
        gameTypes: ['MOBA'],
        priceRange: { min: 0, max: 500 },
        visitFrequency: 'weekly',
        avgSpend: 100,
        favoriteTimeSlot: '18:00-22:00'
      },
      behaviorTags: ['game-enthusiast']
    })
    const errors = await validate(dto)
    assert.equal(errors.length, 0)
  })

  it('rejects missing memberId', async () => {
    const dto = plainToInstance(UserProfileDto, {
      tenantId: 'tenant-1',
      preferences: {
        gameTypes: [],
        priceRange: { min: 0, max: 100 },
        visitFrequency: 'daily',
        avgSpend: 0,
        favoriteTimeSlot: '10:00'
      },
      behaviorTags: []
    })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
    assert.ok(errors.some(e => e.property === 'memberId'))
  })

  it('rejects missing tenantId', async () => {
    const dto = plainToInstance(UserProfileDto, {
      memberId: 'm-1',
      preferences: {
        gameTypes: [],
        priceRange: { min: 0, max: 100 },
        visitFrequency: 'daily',
        avgSpend: 0,
        favoriteTimeSlot: '10:00'
      },
      behaviorTags: []
    })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
    assert.ok(errors.some(e => e.property === 'tenantId'))
  })

  it('rejects empty memberId', async () => {
    const dto = plainToInstance(UserProfileDto, {
      memberId: '',
      tenantId: 't1',
      preferences: {
        gameTypes: [],
        priceRange: { min: 0, max: 100 },
        visitFrequency: 'daily',
        avgSpend: 0,
        favoriteTimeSlot: '10:00'
      },
      behaviorTags: []
    })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
  })

  it('validates nested PreferencesDto', async () => {
    const dto = plainToInstance(UserProfileDto, {
      memberId: 'm-1',
      tenantId: 't1',
      preferences: 'not-object',
      behaviorTags: []
    })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
  })
})

// ── UpdateProfileDto ──
describe('ai-recommend.dto: UpdateProfileDto', () => {
  it('validates empty update (all optional)', async () => {
    const dto = plainToInstance(UpdateProfileDto, {})
    const errors = await validate(dto)
    assert.equal(errors.length, 0)
  })

  it('validates partial update with preferences only', async () => {
    const dto = plainToInstance(UpdateProfileDto, {
      preferences: {
        gameTypes: ['MOBA'],
        priceRange: { min: 0, max: 500 },
        visitFrequency: 'weekly',
        avgSpend: 100,
        favoriteTimeSlot: '18:00-22:00'
      }
    })
    const errors = await validate(dto)
    assert.equal(errors.length, 0)
  })

  it('validates partial update with behaviorTags only', async () => {
    const dto = plainToInstance(UpdateProfileDto, {
      behaviorTags: ['new-tag']
    })
    const errors = await validate(dto)
    assert.equal(errors.length, 0)
  })

  it('rejects invalid nested preferences in update', async () => {
    const dto = plainToInstance(UpdateProfileDto, {
      preferences: {
        gameTypes: 'not-array',
        priceRange: { min: 0, max: 100 },
        visitFrequency: 'daily',
        avgSpend: 50,
        favoriteTimeSlot: '10:00'
      }
    })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
  })
})

// ── ItemScoreDto ──
describe('ai-recommend.dto: ItemScoreDto', () => {
  it('validates correct item score', async () => {
    const dto = plainToInstance(ItemScoreDto, {
      memberId: 'member-001',
      itemId: 'game-001',
      itemType: 'game',
      rating: 5,
      interaction: 'play',
      weight: 1.0
    })
    const errors = await validate(dto)
    assert.equal(errors.length, 0)
  })

  it('rejects invalid itemType', async () => {
    const dto = plainToInstance(ItemScoreDto, {
      memberId: 'm-1',
      itemId: 'x',
      itemType: 'invalid',
      rating: 3,
      interaction: 'view',
      weight: 0.5
    })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
    assert.ok(errors.some(e => e.property === 'itemType'))
  })

  it('rejects invalid interaction type', async () => {
    const dto = plainToInstance(ItemScoreDto, {
      memberId: 'm-1',
      itemId: 'x',
      itemType: 'game',
      rating: 3,
      interaction: 'invalid',
      weight: 0.5
    })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
    assert.ok(errors.some(e => e.property === 'interaction'))
  })

  it('rejects rating below 1', async () => {
    const dto = plainToInstance(ItemScoreDto, {
      memberId: 'm-1',
      itemId: 'x',
      itemType: 'game',
      rating: 0,
      interaction: 'view',
      weight: 0.5
    })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
    assert.ok(errors.some(e => e.property === 'rating'))
  })

  it('rejects rating above 5', async () => {
    const dto = plainToInstance(ItemScoreDto, {
      memberId: 'm-1',
      itemId: 'x',
      itemType: 'game',
      rating: 6,
      interaction: 'view',
      weight: 0.5
    })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
    assert.ok(errors.some(e => e.property === 'rating'))
  })

  it('rejects weight below 0', async () => {
    const dto = plainToInstance(ItemScoreDto, {
      memberId: 'm-1',
      itemId: 'x',
      itemType: 'game',
      rating: 3,
      interaction: 'view',
      weight: -0.1
    })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
    assert.ok(errors.some(e => e.property === 'weight'))
  })

  it('rejects weight above 10', async () => {
    const dto = plainToInstance(ItemScoreDto, {
      memberId: 'm-1',
      itemId: 'x',
      itemType: 'game',
      rating: 3,
      interaction: 'view',
      weight: 10.1
    })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
    assert.ok(errors.some(e => e.property === 'weight'))
  })
})

// ── RecordInteractionDto ──
describe('ai-recommend.dto: RecordInteractionDto', () => {
  it('validates correct interaction record', async () => {
    const dto = plainToInstance(RecordInteractionDto, {
      memberId: 'member-001',
      itemId: 'game-001',
      itemType: 'game',
      interaction: 'purchase'
    })
    const errors = await validate(dto)
    assert.equal(errors.length, 0)
  })

  it('rejects invalid interaction type', async () => {
    const dto = plainToInstance(RecordInteractionDto, {
      memberId: 'm-1',
      itemId: 'x',
      itemType: 'game',
      interaction: 'bad'
    })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
    assert.ok(errors.some(e => e.property === 'interaction'))
  })

  it('rejects missing memberId', async () => {
    const dto = plainToInstance(RecordInteractionDto, {
      itemId: 'x',
      itemType: 'game',
      interaction: 'view'
    })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
    assert.ok(errors.some(e => e.property === 'memberId'))
  })

  it('rejects empty itemId', async () => {
    const dto = plainToInstance(RecordInteractionDto, {
      memberId: 'm-1',
      itemId: '',
      itemType: 'game',
      interaction: 'view'
    })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
  })
})

// ── RecommendationQueryDto ──
describe('ai-recommend.dto: RecommendationQueryDto', () => {
  it('validates empty query (all optional)', async () => {
    const dto = plainToInstance(RecommendationQueryDto, {})
    const errors = await validate(dto)
    assert.equal(errors.length, 0)
  })

  it('validates query with all fields', async () => {
    const dto = plainToInstance(RecommendationQueryDto, {
      storeId: 'store-001',
      memberId: 'member-001',
      type: 'game',
      limit: 10
    })
    const errors = await validate(dto)
    assert.equal(errors.length, 0)
  })

  it('rejects invalid type in query', async () => {
    const dto = plainToInstance(RecommendationQueryDto, {
      type: 'invalid'
    })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
    assert.ok(errors.some(e => e.property === 'type'))
  })

  it('rejects limit below 1', async () => {
    const dto = plainToInstance(RecommendationQueryDto, {
      limit: 0
    })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
    assert.ok(errors.some(e => e.property === 'limit'))
  })

  it('rejects limit above 100', async () => {
    const dto = plainToInstance(RecommendationQueryDto, {
      limit: 101
    })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
    assert.ok(errors.some(e => e.property === 'limit'))
  })

  it('accepts limit at boundary values', async () => {
    const dto1 = plainToInstance(RecommendationQueryDto, { limit: 1 })
    const errors1 = await validate(dto1)
    assert.equal(errors1.length, 0)

    const dto2 = plainToInstance(RecommendationQueryDto, { limit: 100 })
    const errors2 = await validate(dto2)
    assert.equal(errors2.length, 0)
  })
})

// ── StrategyWeightDto ──
describe('ai-recommend.dto: StrategyWeightDto', () => {
  it('validates correct weight factor', async () => {
    const dto = plainToInstance(StrategyWeightDto, {
      factor: 'popularity',
      weight: 0.5
    })
    const errors = await validate(dto)
    assert.equal(errors.length, 0)
  })

  it('rejects empty factor', async () => {
    const dto = plainToInstance(StrategyWeightDto, {
      factor: '',
      weight: 0.5
    })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
    assert.ok(errors.some(e => e.property === 'factor'))
  })

  it('rejects weight below 0', async () => {
    const dto = plainToInstance(StrategyWeightDto, {
      factor: 'test',
      weight: -0.1
    })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
    assert.ok(errors.some(e => e.property === 'weight'))
  })

  it('rejects weight above 1', async () => {
    const dto = plainToInstance(StrategyWeightDto, {
      factor: 'test',
      weight: 1.1
    })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
    assert.ok(errors.some(e => e.property === 'weight'))
  })

  it('accepts weight at boundaries', async () => {
    const dto1 = plainToInstance(StrategyWeightDto, { factor: 'a', weight: 0 })
    const errors1 = await validate(dto1)
    assert.equal(errors1.length, 0)

    const dto2 = plainToInstance(StrategyWeightDto, { factor: 'b', weight: 1 })
    const errors2 = await validate(dto2)
    assert.equal(errors2.length, 0)
  })
})

// ── CreateStrategyDto ──
describe('ai-recommend.dto: CreateStrategyDto', () => {
  it('validates correct create strategy', async () => {
    const dto = plainToInstance(CreateStrategyDto, {
      name: 'test-strategy',
      description: 'A test strategy',
      targetType: 'game',
      weights: [{ factor: 'popularity', weight: 1.0 }],
      minScore: 10,
      maxResults: 20
    })
    const errors = await validate(dto)
    assert.equal(errors.length, 0)
  })

  it('validates create with minimal optional fields', async () => {
    const dto = plainToInstance(CreateStrategyDto, {
      name: 'minimal',
      description: 'Minimal',
      targetType: 'game',
      weights: [{ factor: 'rating', weight: 0.5 }]
    })
    const errors = await validate(dto)
    assert.equal(errors.length, 0)
  })

  it('rejects missing name', async () => {
    const dto = plainToInstance(CreateStrategyDto, {
      description: 'test',
      targetType: 'game',
      weights: [{ factor: 'a', weight: 1.0 }]
    })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
    assert.ok(errors.some(e => e.property === 'name'))
  })

  it('rejects missing description', async () => {
    const dto = plainToInstance(CreateStrategyDto, {
      name: 'test',
      targetType: 'game',
      weights: [{ factor: 'a', weight: 1.0 }]
    })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
    assert.ok(errors.some(e => e.property === 'description'))
  })

  it('rejects empty name', async () => {
    const dto = plainToInstance(CreateStrategyDto, {
      name: '',
      description: 'test',
      targetType: 'game',
      weights: [{ factor: 'a', weight: 1.0 }]
    })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
  })

  it('rejects invalid targetType', async () => {
    const dto = plainToInstance(CreateStrategyDto, {
      name: 'test',
      description: 'test',
      targetType: 'invalid',
      weights: [{ factor: 'a', weight: 1.0 }]
    })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
    assert.ok(errors.some(e => e.property === 'targetType'))
  })

  it('rejects empty weights array', async () => {
    const dto = plainToInstance(CreateStrategyDto, {
      name: 'test',
      description: 'test',
      targetType: 'game',
      weights: []
    })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
    assert.ok(errors.some(e => e.property === 'weights'))
  })

  it('rejects minScore below 0', async () => {
    const dto = plainToInstance(CreateStrategyDto, {
      name: 'test',
      description: 'test',
      targetType: 'game',
      weights: [{ factor: 'a', weight: 0.5 }],
      minScore: -1
    })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
    assert.ok(errors.some(e => e.property === 'minScore'))
  })

  it('rejects maxResults below 1', async () => {
    const dto = plainToInstance(CreateStrategyDto, {
      name: 'test',
      description: 'test',
      targetType: 'game',
      weights: [{ factor: 'a', weight: 0.5 }],
      maxResults: 0
    })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
    assert.ok(errors.some(e => e.property === 'maxResults'))
  })

  it('rejects maxResults above 100', async () => {
    const dto = plainToInstance(CreateStrategyDto, {
      name: 'test',
      description: 'test',
      targetType: 'game',
      weights: [{ factor: 'a', weight: 0.5 }],
      maxResults: 101
    })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
    assert.ok(errors.some(e => e.property === 'maxResults'))
  })
})

// ── UpdateStrategyDto ──
describe('ai-recommend.dto: UpdateStrategyDto', () => {
  it('validates empty update (all optional)', async () => {
    const dto = plainToInstance(UpdateStrategyDto, {})
    const errors = await validate(dto)
    assert.equal(errors.length, 0)
  })

  it('validates partial update with name only', async () => {
    const dto = plainToInstance(UpdateStrategyDto, {
      name: 'new-name'
    })
    const errors = await validate(dto)
    assert.equal(errors.length, 0)
  })

  it('validates partial update with weights only', async () => {
    const dto = plainToInstance(UpdateStrategyDto, {
      weights: [{ factor: 'popularity', weight: 0.8 }]
    })
    const errors = await validate(dto)
    assert.equal(errors.length, 0)
  })

  it('rejects invalid targetType in update', async () => {
    const dto = plainToInstance(UpdateStrategyDto, {
      targetType: 'invalid'
    })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
    assert.ok(errors.some(e => e.property === 'targetType'))
  })
})

// ── GenerateRecommendationsDto ──
describe('ai-recommend.dto: GenerateRecommendationsDto', () => {
  it('validates correct generate request', async () => {
    const dto = plainToInstance(GenerateRecommendationsDto, {
      strategyId: 'strategy-hybrid-v1',
      memberId: 'member-001',
      storeId: 'store-001',
      type: 'game',
      limit: 5
    })
    const errors = await validate(dto)
    assert.equal(errors.length, 0)
  })

  it('validates generate with only strategyId', async () => {
    const dto = plainToInstance(GenerateRecommendationsDto, {
      strategyId: 'strategy-popularity-v1'
    })
    const errors = await validate(dto)
    assert.equal(errors.length, 0)
  })

  it('rejects missing strategyId', async () => {
    const dto = plainToInstance(GenerateRecommendationsDto, {
      memberId: 'm-1'
    })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
    assert.ok(errors.some(e => e.property === 'strategyId'))
  })

  it('rejects empty strategyId', async () => {
    const dto = plainToInstance(GenerateRecommendationsDto, {
      strategyId: ''
    })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
  })

  it('rejects invalid type in generate', async () => {
    const dto = plainToInstance(GenerateRecommendationsDto, {
      strategyId: 'hybrid',
      type: 'invalid'
    })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
  })

  it('rejects limit below 1', async () => {
    const dto = plainToInstance(GenerateRecommendationsDto, {
      strategyId: 'hybrid',
      limit: 0
    })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
  })

  it('rejects limit above 100', async () => {
    const dto = plainToInstance(GenerateRecommendationsDto, {
      strategyId: 'hybrid',
      limit: 200
    })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
  })
})

// ── RecordConversionDto ──
describe('ai-recommend.dto: RecordConversionDto', () => {
  it('validates correct conversion record', async () => {
    const dto = plainToInstance(RecordConversionDto, {
      recommendationId: 'rec-001'
    })
    const errors = await validate(dto)
    assert.equal(errors.length, 0)
  })

  it('rejects missing recommendationId', async () => {
    const dto = plainToInstance(RecordConversionDto, {})
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
    assert.ok(errors.some(e => e.property === 'recommendationId'))
  })

  it('rejects empty recommendationId', async () => {
    const dto = plainToInstance(RecordConversionDto, {
      recommendationId: ''
    })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
  })
})

// ── Cross-DTO edge case ──
describe('ai-recommend.dto: cross-DTO edge cases', () => {
  it('price range min can equal max', async () => {
    const dto = plainToInstance(PriceRangeDto, { min: 100, max: 100 })
    const errors = await validate(dto)
    assert.equal(errors.length, 0)
  })

  it('gameTypes can include non-array values rejected', async () => {
    const dto = plainToInstance(PreferencesDto, {
      gameTypes: 'string-illegal',
      priceRange: { min: 0, max: 100 },
      visitFrequency: 'daily',
      avgSpend: 0,
      favoriteTimeSlot: '10:00'
    })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
  })

  it('weight factor names can be arbitrary strings', async () => {
    const dto = plainToInstance(StrategyWeightDto, {
      factor: 'custom-long-factor-name',
      weight: 0.33
    })
    const errors = await validate(dto)
    assert.equal(errors.length, 0)
  })

  it('CreateStrategyDto fallbackStrategy is optional', async () => {
    const dto = plainToInstance(CreateStrategyDto, {
      name: 'no-fallback',
      description: 'no fallback test',
      targetType: 'game',
      weights: [{ factor: 'a', weight: 1.0 }]
    })
    // fallbackStrategy is optional, so accessing it is fine
    assert.equal(dto.fallbackStrategy, undefined)
    const errors = await validate(dto)
    assert.equal(errors.length, 0)
  })
})
