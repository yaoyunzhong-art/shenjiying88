/**
 * V18 Day2 D4: Promotion Strategy 基类/工厂/执行器测试
 *
 * 覆盖: 策略注册 / 工厂 / 执行器 / NoOp策略 / 边界案例
 */
import { describe, it, expect, beforeEach } from 'vitest'
import type { Candidate } from '../recommend.entity'
import type { PromotionContext, PromotionCandidate, PromotionStrategyType } from './promotion.entity'
import {
  BasePromotionStrategy,
  NoOpPromotionStrategy,
  PromotionStrategyFactory,
  PromotionExecutor,
} from './promotion.strategy'

// ============================================================
// 测试用策略
// ============================================================

class TestBoostStrategy extends BasePromotionStrategy {
  readonly type: PromotionStrategyType = 'time-boosted'
  readonly name = '测试增强'
  readonly priority = 70

  isApplicable(context: PromotionContext): boolean {
    return context.tenantId === 'test-tenant'
  }

  apply(candidates: Candidate[], _context: PromotionContext): PromotionCandidate[] {
    return candidates.map(c => this.toPromotionCandidate(c, this.type, '测试增强', 1.5, { test: true }))
  }
}

class InapplicableStrategy extends BasePromotionStrategy {
  readonly type: PromotionStrategyType = 'cross-store-synergy'
  readonly name = '永不适用'
  readonly priority = 100

  isApplicable(_context: PromotionContext): boolean {
    return false
  }

  apply(candidates: Candidate[], _context: PromotionContext): PromotionCandidate[] {
    return candidates.map(c => ({
      itemId: c.itemId,
      score: c.score,
      baseScore: c.score,
      boostedScore: 0,
      strategy: this.type,
      reasoning: c.reasoning,
      metadata: c.metadata,
    }))
  }
}

describe('D4 Promotion Strategy', () => {
  let factory: PromotionStrategyFactory
  let executor: PromotionExecutor

  beforeEach(() => {
    factory = new PromotionStrategyFactory()
    executor = new PromotionExecutor(factory)
  })

  // ============================================================
  // BasePromotionStrategy
  // ============================================================
  describe('BasePromotionStrategy', () => {
    it('should create PromotionCandidate with capped score', () => {
      const strategy = new TestBoostStrategy()
      const candidates: Candidate[] = [
        { itemId: 'p1', score: 0.5, reasoning: 'test', strategy: 'popular' },
      ]

      const result = strategy.apply(candidates, { tenantId: 'test-tenant', currentDateTime: new Date() })
      expect(result).toHaveLength(1)
      expect(result[0].itemId).toBe('p1')
      expect(result[0].baseScore).toBe(0.5)
      expect(result[0].boostedScore).toBeCloseTo(0.75, 5) // 0.5 * 1.5 = 0.75
      expect(result[0].score).toBeCloseTo(0.75, 5) // min(1, 0.5 * 1.5) = 0.75
      expect(result[0].strategy).toBe('time-boosted')
    })

    it('should cap score at 1.0', () => {
      const strategy = new TestBoostStrategy()
      const candidates: Candidate[] = [
        { itemId: 'p1', score: 0.9, reasoning: 'test', strategy: 'popular' },
      ]
      const result = strategy.apply(candidates, { tenantId: 'test-tenant', currentDateTime: new Date() })
      expect(result[0].score).toBe(1.0) // 0.9 * 1.5 = 1.35 capped to 1.0
    })

    it('should handle zero base score', () => {
      const strategy = new TestBoostStrategy()
      const candidates: Candidate[] = [
        { itemId: 'p1', score: 0, reasoning: 'test', strategy: 'popular' },
      ]
      const result = strategy.apply(candidates, { tenantId: 'test-tenant', currentDateTime: new Date() })
      expect(result[0].score).toBe(0)
      expect(result[0].baseScore).toBe(0)
    })

    it('should capScore properly', () => {
      const strategy = new TestBoostStrategy()
      expect(strategy['capScore'](1.5)).toBe(1)
      expect(strategy['capScore'](-0.1)).toBe(0)
      expect(strategy['capScore'](0.5)).toBe(0.5)
      expect(strategy['capScore'](0)).toBe(0)
      expect(strategy['capScore'](1)).toBe(1)
    })
  })

  // ============================================================
  // NoOpPromotionStrategy
  // ============================================================
  describe('NoOpPromotionStrategy', () => {
    it('should never be applicable', () => {
      const noop = new NoOpPromotionStrategy()
      expect(noop.isApplicable({ tenantId: 'any', currentDateTime: new Date() })).toBe(false)
    })

    it('should return candidates unchanged', () => {
      const noop = new NoOpPromotionStrategy()
      const candidates: Candidate[] = [
        { itemId: 'p1', score: 0.8, reasoning: 'hot', strategy: 'popular' },
      ]
      const result = noop.apply(candidates, { tenantId: 'any', currentDateTime: new Date() })
      expect(result[0].itemId).toBe('p1')
      expect(result[0].score).toBe(0.8)
      expect(result[0].boostedScore).toBe(0)
    })

    it('should have priority 0', () => {
      const noop = new NoOpPromotionStrategy()
      expect(noop.priority).toBe(0)
    })
  })

  // ============================================================
  // PromotionStrategyFactory
  // ============================================================
  describe('PromotionStrategyFactory', () => {
    it('should register a strategy', () => {
      const strategy = new TestBoostStrategy()
      factory.register(strategy)
      expect(factory.get('time-boosted')).toBe(strategy)
    })

    it('should register multiple strategies', () => {
      factory.registerAll([new TestBoostStrategy(), new InapplicableStrategy()])
      expect(factory.getAll()).toHaveLength(2)
    })

    it('should return undefined for unregistered type', () => {
      expect(factory.get('ab-test-optimized')).toBeUndefined()
    })

    it('should return applicable strategies sorted by priority desc', () => {
      factory.registerAll([new TestBoostStrategy(), new InapplicableStrategy()])
      const applicable = factory.getApplicable({ tenantId: 'test-tenant', currentDateTime: new Date() })
      expect(applicable).toHaveLength(1) // 只有 TestBoostStrategy 适用
      expect(applicable[0].priority).toBe(70)
    })

    it('should return empty array when no strategies applicable', () => {
      factory.registerAll([new InapplicableStrategy()])
      const applicable = factory.getApplicable({ tenantId: 'none', currentDateTime: new Date() })
      expect(applicable).toHaveLength(0)
    })

    it('should clear all strategies', () => {
      factory.register(new TestBoostStrategy())
      factory.clear()
      expect(factory.getAll()).toHaveLength(0)
    })

    it('should return registered types', () => {
      factory.register(new TestBoostStrategy())
      const types = factory.getRegisteredTypes()
      expect(types).toContain('time-boosted')
    })

    it('should overwrite existing strategy type on re-register', () => {
      const s1 = new TestBoostStrategy()
      factory.register(s1)
      expect(factory.getAll()).toHaveLength(1)
      factory.register(s1) // same type, should not duplicate
      expect(factory.getAll()).toHaveLength(1)
    })
  })

  // ============================================================
  // PromotionExecutor
  // ============================================================
  describe('PromotionExecutor', () => {
    it('should return unchanged when no strategies applicable', () => {
      const candidates: Candidate[] = [
        { itemId: 'p1', score: 0.5, reasoning: 'test', strategy: 'popular' },
      ]
      const result = executor.execute(candidates, { tenantId: 'unknown', currentDateTime: new Date() })
      expect(result.strategiesUsed).toHaveLength(0)
      expect(result.boostCount).toBe(0)
      expect(result.promotedCandidates).toHaveLength(1)
      expect(result.promotedCandidates[0].score).toBe(0.5)
    })

    it('should apply applicable strategies', () => {
      factory.register(new TestBoostStrategy())
      const candidates: Candidate[] = [
        { itemId: 'p1', score: 0.5, reasoning: 'test', strategy: 'popular' },
      ]
      const result = executor.execute(candidates, { tenantId: 'test-tenant', currentDateTime: new Date() })
      expect(result.strategiesUsed).toContain('time-boosted')
      expect(result.boostCount).toBe(1)
      expect(result.promotedCandidates[0].score).toBeGreaterThan(0.5)
    })

    it('should sort by score descending after promotion', () => {
      factory.register(new TestBoostStrategy())
      const candidates: Candidate[] = [
        { itemId: 'p2', score: 0.3, reasoning: 'a', strategy: 'popular' },
        { itemId: 'p1', score: 0.8, reasoning: 'b', strategy: 'popular' },
      ]
      const result = executor.execute(candidates, { tenantId: 'test-tenant', currentDateTime: new Date() })
      expect(result.promotedCandidates[0].itemId).toBe('p1')
      expect(result.promotedCandidates[1].itemId).toBe('p2')
    })

    it('should compute total scores', () => {
      factory.register(new TestBoostStrategy())
      const candidates: Candidate[] = [
        { itemId: 'p1', score: 0.5, reasoning: 'a', strategy: 'popular' },
        { itemId: 'p2', score: 0.3, reasoning: 'b', strategy: 'popular' },
      ]
      const result = executor.execute(candidates, { tenantId: 'test-tenant', currentDateTime: new Date() })
      expect(result.totalBaseScore).toBeCloseTo(0.8, 5)
      expect(result.totalBoostedScore).toBeGreaterThan(result.totalBaseScore)
    })

    it('should track execution time', () => {
      factory.register(new TestBoostStrategy())
      const candidates: Candidate[] = [
        { itemId: 'p1', score: 0.5, reasoning: 'a', strategy: 'popular' },
      ]
      const result = executor.execute(candidates, { tenantId: 'test-tenant', currentDateTime: new Date() })
      expect(result.executionMs).toBeGreaterThanOrEqual(0)
      expect(typeof result.generatedAt).toBe('string')
    })

    it('should set strategy flags correctly', () => {
      factory.register(new TestBoostStrategy())
      const candidates: Candidate[] = [
        { itemId: 'p1', score: 0.5, reasoning: 'a', strategy: 'popular' },
      ]
      const result = executor.execute(candidates, { tenantId: 'test-tenant', currentDateTime: new Date() })
      expect(result.timeWindowApplied).toBe(true)
      expect(result.abTestApplied).toBe(false)
      expect(result.crossStoreApplied).toBe(false)
    })

    it('should handle large candidate set', () => {
      factory.register(new TestBoostStrategy())
      const candidates: Candidate[] = Array.from({ length: 100 }, (_, i) => ({
        itemId: `p${i}`,
        score: Math.random(),
        reasoning: `item ${i}`,
        strategy: 'popular' as const,
      }))
      const result = executor.execute(candidates, { tenantId: 'test-tenant', currentDateTime: new Date() })
      expect(result.promotedCandidates).toHaveLength(100)
      expect(result.boostCount).toBe(100)
    })
  })
})
