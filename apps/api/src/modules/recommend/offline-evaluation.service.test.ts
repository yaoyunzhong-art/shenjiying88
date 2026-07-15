import { describe, it, expect, beforeEach } from 'vitest'
import {
  OfflineEvaluationService,
  type RecommendationResult,
  type GroundTruthItem,
  type EvalConfig,
  type TestDataSet,
  type ATestConfig,
} from './offline-evaluation.service'

describe('OfflineEvaluationService', () => {
  let service: OfflineEvaluationService

  beforeEach(() => {
    service = new OfflineEvaluationService()
  })

  // ============================================================
  // Precision / Recall
  // ============================================================

  describe('computePrecisionRecall', () => {
    it('should compute perfect precision and recall', () => {
      const recommended: RecommendationResult[] = [
        { itemId: 'A', score: 1.0, rank: 1 },
        { itemId: 'B', score: 0.9, rank: 2 },
        { itemId: 'C', score: 0.8, rank: 3 },
      ]

      const groundTruth: GroundTruthItem[] = [
        { itemId: 'A', relevance: 1.0 },
        { itemId: 'B', relevance: 0.8 },
        { itemId: 'C', relevance: 0.6 },
      ]

      const result = service.computePrecisionRecall(recommended, groundTruth, { k: 3, relevanceThreshold: 0.5 })

      expect(result.precision).toBe(1.0)
      expect(result.recall).toBe(1.0)
      expect(result.f1Score).toBeCloseTo(1.0, 2)
      expect(result.hitCount).toBe(3)
    })

    it('should compute zero precision when nothing matches', () => {
      const recommended: RecommendationResult[] = [
        { itemId: 'A', score: 1.0, rank: 1 },
      ]

      const groundTruth: GroundTruthItem[] = [
        { itemId: 'B', relevance: 1.0 },
      ]

      const result = service.computePrecisionRecall(recommended, groundTruth, { k: 1, relevanceThreshold: 0.5 })

      expect(result.precision).toBe(0)
      expect(result.recall).toBe(0)
      expect(result.hitCount).toBe(0)
    })

    it('should respect k parameter', () => {
      const recommended: RecommendationResult[] = [
        { itemId: 'A', score: 1.0, rank: 1 },
        { itemId: 'B', score: 0.9, rank: 2 },
        { itemId: 'C', score: 0.8, rank: 3 },
        { itemId: 'D', score: 0.7, rank: 4 },
      ]

      const groundTruth: GroundTruthItem[] = [
        { itemId: 'A', relevance: 1.0 },
        { itemId: 'D', relevance: 1.0 },
      ]

      // k=2: 只 check A 和 B
      const result = service.computePrecisionRecall(recommended, groundTruth, { k: 2, relevanceThreshold: 0.5 })

      expect(result.precision).toBe(0.5) // 1/2 hit
      expect(result.recall).toBe(0.5)    // 1/2 total
    })

    it('should handle empty ground truth', () => {
      const recommended: RecommendationResult[] = [
        { itemId: 'A', score: 1.0, rank: 1 },
      ]

      const result = service.computePrecisionRecall(recommended, [], { k: 1, relevanceThreshold: 0.5 })

      expect(result.precision).toBe(0)
      expect(result.recall).toBe(0)
      expect(result.hitCount).toBe(0)
      expect(result.f1Score).toBe(0)
    })
  })

  // ============================================================
  // NDCG
  // ============================================================

  describe('computeNDCG', () => {
    it('should compute perfect NDCG', () => {
      const recommended: RecommendationResult[] = [
        { itemId: 'A', score: 1.0, rank: 1 },
        { itemId: 'B', score: 0.9, rank: 2 },
        { itemId: 'C', score: 0.8, rank: 3 },
      ]

      const groundTruth: GroundTruthItem[] = [
        { itemId: 'A', relevance: 1.0 },
        { itemId: 'B', relevance: 0.8 },
        { itemId: 'C', relevance: 0.6 },
      ]

      const result = service.computeNDCG(recommended, groundTruth, { k: 3, relevanceThreshold: 0.5 })

      // Perfect ranking => NDCG = 1.0
      expect(result.ndcg).toBeCloseTo(1.0, 1)
      expect(result.dcg).toBeGreaterThan(0)
      expect(result.idealDcg).toBeGreaterThan(0)
    })

    it('should penalize non-ideal ordering', () => {
      // High relevance item ranked lower
      const recommended: RecommendationResult[] = [
        { itemId: 'C', score: 0.1, rank: 1 },  // low relevance
        { itemId: 'A', score: 1.0, rank: 2 },  // high relevance but low rank
      ]

      const groundTruth: GroundTruthItem[] = [
        { itemId: 'A', relevance: 1.0 },
        { itemId: 'C', relevance: 0.1 },
      ]

      const result = service.computeNDCG(recommended, groundTruth, { k: 2, relevanceThreshold: 0.5 })

      // NDCG < 1 because best item (A) is at rank 2
      expect(result.ndcg).toBeLessThan(1.0)
    })

    it('should return zero for no matching items', () => {
      const recommended: RecommendationResult[] = [
        { itemId: 'A', score: 1.0, rank: 1 },
      ]

      const groundTruth: GroundTruthItem[] = [
        { itemId: 'B', relevance: 1.0 },
      ]

      const result = service.computeNDCG(recommended, groundTruth, { k: 1, relevanceThreshold: 0.5 })

      expect(result.ndcg).toBe(0)
    })

    it('should handle k larger than recommended length', () => {
      const recommended: RecommendationResult[] = [
        { itemId: 'A', score: 1.0, rank: 1 },
      ]

      const groundTruth: GroundTruthItem[] = [
        { itemId: 'A', relevance: 1.0 },
      ]

      const result = service.computeNDCG(recommended, groundTruth, { k: 10, relevanceThreshold: 0.5 })

      expect(result.k).toBe(1) // clamped to recommended length
      expect(result.ndcg).toBe(1.0)
    })
  })

  // ============================================================
  // Full evaluation
  // ============================================================

  describe('evaluate', () => {
    it('should return combined precision, recall and ndcg', () => {
      const recommended: RecommendationResult[] = [
        { itemId: 'A', score: 1.0, rank: 1 },
        { itemId: 'B', score: 0.9, rank: 2 },
      ]

      const groundTruth: GroundTruthItem[] = [
        { itemId: 'A', relevance: 1.0 },
      ]

      const result = service.evaluate(recommended, groundTruth, { k: 2, relevanceThreshold: 0.5 })

      expect(result.precisionRecall.precision).toBeGreaterThan(0)
      expect(result.precisionRecall.recall).toBeGreaterThan(0)
      expect(result.ndcg.ndcg).toBeGreaterThan(0)
      expect(result.sampleSize).toBe(2)
      expect(result.evaluatedAt).toBeDefined()
    })
  })

  // ============================================================
  // Test Dataset Generation
  // ============================================================

  describe('generateTestDataSet', () => {
    it('should split purchases by time', () => {
      const purchases = [
        { memberId: 'm1', itemId: 'A', purchasedAt: '2024-01-01' },
        { memberId: 'm1', itemId: 'B', purchasedAt: '2024-02-01' },
        { memberId: 'm1', itemId: 'C', purchasedAt: '2024-03-01' },
        { memberId: 'm1', itemId: 'D', purchasedAt: '2024-04-01' },
      ]

      const dataset = service.generateTestDataSet(purchases, 0.75)

      expect(dataset.trainPurchases.length).toBe(3)
      expect(dataset.testPurchases.length).toBe(1)
      expect(dataset.memberIds).toContain('m1')
      expect(dataset.splitRatio).toBe(0.75)
    })

    it('should handle members with single purchase as all train', () => {
      const purchases = [
        { memberId: 'm1', itemId: 'A', purchasedAt: '2024-01-01' },
      ]

      const dataset = service.generateTestDataSet(purchases)

      expect(dataset.trainPurchases.length).toBe(1)
      expect(dataset.testPurchases.length).toBe(0)
    })

    it('should handle multiple members', () => {
      const purchases = [
        { memberId: 'm1', itemId: 'A', purchasedAt: '2024-01-01' },
        { memberId: 'm1', itemId: 'B', purchasedAt: '2024-02-01' },
        { memberId: 'm2', itemId: 'C', purchasedAt: '2024-01-01' },
      ]

      const dataset = service.generateTestDataSet(purchases)

      expect(dataset.memberIds).toHaveLength(2)
      expect(dataset.itemIds).toHaveLength(3)
    })

    it('should return empty test set for empty input', () => {
      const dataset = service.generateTestDataSet([])
      expect(dataset.trainPurchases).toHaveLength(0)
      expect(dataset.testPurchases).toHaveLength(0)
    })
  })

  // ============================================================
  // Build Ground Truth
  // ============================================================

  describe('buildGroundTruth', () => {
    it('should build relevance from purchase frequency', () => {
      const testPurchases = [
        { memberId: 'm1', itemId: 'A', purchasedAt: '2024-01-01' },
        { memberId: 'm1', itemId: 'A', purchasedAt: '2024-02-01' },
        { memberId: 'm1', itemId: 'B', purchasedAt: '2024-03-01' },
      ]

      const groundTruth = service.buildGroundTruth(testPurchases, 'm1')

      expect(groundTruth.length).toBe(2)
      // A purchased twice => higher relevance
      const itemA = groundTruth.find(gt => gt.itemId === 'A')!
      const itemB = groundTruth.find(gt => gt.itemId === 'B')!
      expect(itemA.relevance).toBeGreaterThan(itemB.relevance)
    })

    it('should return all items without memberId filter', () => {
      const testPurchases = [
        { memberId: 'm1', itemId: 'A', purchasedAt: '2024-01-01' },
        { memberId: 'm2', itemId: 'B', purchasedAt: '2024-01-01' },
      ]

      const groundTruth = service.buildGroundTruth(testPurchases)

      expect(groundTruth).toHaveLength(2)
    })
  })

  // ============================================================
  // A/B Test
  // ============================================================

  describe('createExperiment', () => {
    it('should create experiment with valid traffic', () => {
      const control: ATestConfig = {
        name: 'control',
        description: 'Existing strategy',
        trafficPercent: 50,
        enabledStrategies: ['popular'],
        params: {},
        enabled: true,
      }

      const variant: ATestConfig = {
        name: 'variant',
        description: 'New strategy',
        trafficPercent: 50,
        enabledStrategies: ['item-cf'],
        params: {},
        enabled: true,
      }

      const experiment = service.createExperiment('exp1', 'test', 'A/B test for recommendation', control, variant)

      expect(experiment.id).toBe('exp1')
      expect(experiment.status).toBe('running')
      expect(experiment.control.trafficPercent).toBe(50)
      expect(experiment.variant.trafficPercent).toBe(50)
    })

    it('should throw if traffic does not sum to 100', () => {
      const control: ATestConfig = {
        name: 'control',
        description: '',
        trafficPercent: 30,
        enabledStrategies: [],
        params: {},
        enabled: true,
      }

      const variant: ATestConfig = {
        name: 'variant',
        description: '',
        trafficPercent: 30,
        enabledStrategies: [],
        params: {},
        enabled: true,
      }

      expect(() => service.createExperiment('exp2', 'bad', 'invalid traffic', control, variant)).toThrow()
    })
  })

  describe('simulateATest', () => {
    it('should simulate and determine winner', () => {
      const control: ATestConfig = {
        name: 'control',
        description: 'Popular baseline',
        trafficPercent: 50,
        enabledStrategies: ['popular'],
        params: {},
        enabled: true,
      }

      const variant: ATestConfig = {
        name: 'variant',
        description: 'Item CF',
        trafficPercent: 50,
        enabledStrategies: ['item-cf'],
        params: {},
        enabled: true,
      }

      const experiment = service.createExperiment('exp3', 'recommend AB', 'compare strategies', control, variant)

      const testData = service.generateTestDataSet([
        { memberId: 'm1', itemId: 'A', purchasedAt: '2024-01-01' },
        { memberId: 'm1', itemId: 'B', purchasedAt: '2024-02-01' },
        { memberId: 'm1', itemId: 'A', purchasedAt: '2024-03-01' },
        { memberId: 'm2', itemId: 'A', purchasedAt: '2024-01-01' },
        { memberId: 'm2', itemId: 'B', purchasedAt: '2024-01-15' },
        { memberId: 'm2', itemId: 'C', purchasedAt: '2024-02-01' },
      ])

      const mockEvaluateFn = (
        _strategy: string,
        purchases: { memberId: string; itemId: string; purchasedAt: string }[],
      ) => {
        const recommended = purchases
          .slice(0, 10)
          .map((p, idx) => ({ itemId: p.itemId, score: 1 - idx * 0.1, rank: idx + 1 }))

        const gt = service.buildGroundTruth(purchases)
        return service.evaluate(recommended, gt, { k: 5, relevanceThreshold: 0.5 })
      }

      const result = service.simulateATest(experiment, testData, mockEvaluateFn)

      expect(result.status).toBe('completed')
      expect(result.results).toBeDefined()
      expect(['control', 'variant', 'tie']).toContain(result.results!.winner)
      expect(result.results!.control.evalResult).toBeDefined()
      expect(result.results!.variant.evalResult).toBeDefined()
    })
  })
})
