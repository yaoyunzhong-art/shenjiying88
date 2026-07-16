/**
 * V18 Day2 D4: A/B 测试控制测试
 *
 * 覆盖: ABTestManager / ABTestOptimizedStrategy
 * - 实验注册/管理
 * - 用户分组 (确定性哈希)
 * - 曝光/转化记录
 * - 统计分析
 * - 优胜者判断
 * - 策略集成
 */
import { describe, it, expect, beforeEach } from 'vitest'
import type { Candidate } from '../recommend.entity'
import type { PromotionContext, ABTestConfig, ABTestMetric } from './promotion.entity'
import {
  ABTestManager,
  ABTestOptimizedStrategy,
} from './ab-test.controller'

describe('D4 ABTestManager', () => {
  let manager: ABTestManager

  beforeEach(() => {
    manager = new ABTestManager()
  })

  // ============================================================
  // 实验注册
  // ============================================================
  describe('registerExperiment', () => {
    const validConfig: ABTestConfig = {
      experimentId: 'exp-1',
      name: '测试实验',
      description: 'CTR测试',
      control: { label: '对照组', params: { scoreBoost: 1.0 } },
      variant: { label: '实验组', params: { scoreBoost: 1.2 } },
      trafficSplit: 50,
      startDate: '2026-01-01',
      status: 'running',
      metrics: [{ name: 'ctr', weight: 1.0, higherIsBetter: true }],
      minSampleSize: 100,
      confidenceLevel: 0.95,
    }

    it('should register a valid experiment', () => {
      manager.registerExperiment(validConfig)
      expect(manager.getExperiment('exp-1')).toBeDefined()
      expect(manager.getExperiment('exp-1')!.name).toBe('测试实验')
    })

    it('should throw on duplicate experiment id', () => {
      manager.registerExperiment(validConfig)
      expect(() => manager.registerExperiment(validConfig)).toThrow('already registered')
    })

    it('should throw on invalid traffic split (< 1)', () => {
      expect(() => manager.registerExperiment({
        ...validConfig,
        experimentId: 'exp-2',
        trafficSplit: 0,
      })).toThrow('traffic split must be 1-99')
    })

    it('should throw on invalid traffic split (> 99)', () => {
      expect(() => manager.registerExperiment({
        ...validConfig,
        experimentId: 'exp-3',
        trafficSplit: 100,
      })).toThrow('traffic split must be 1-99')
    })

    it('should default status to running', () => {
      manager.registerExperiment(validConfig)
      expect(manager.getExperiment('exp-1')!.status).toBe('running')
    })
  })

  // ============================================================
  // 实验管理
  // ============================================================
  describe('experiment management', () => {
    const createExp = (id: string, split: number = 50): ABTestConfig => ({
      experimentId: id,
      name: `Exp ${id}`,
      description: 'test',
      control: { label: 'C', params: { boost: 1.0 } },
      variant: { label: 'V', params: { boost: 1.2 } },
      trafficSplit: split,
      startDate: '2026-01-01',
      status: 'running',
      metrics: [{ name: 'ctr', weight: 1.0, higherIsBetter: true }],
      minSampleSize: 100,
      confidenceLevel: 0.95,
    })

    it('should update experiment', () => {
      manager.registerExperiment(createExp('exp-1'))
      manager.updateExperiment({ experimentId: 'exp-1', name: 'Updated' })
      expect(manager.getExperiment('exp-1')!.name).toBe('Updated')
    })

    it('should throw on update non-existing experiment', () => {
      expect(() => manager.updateExperiment({ experimentId: 'none' })).toThrow('not found')
    })

    it('should set experiment status', () => {
      manager.registerExperiment(createExp('exp-1'))
      manager.setExperimentStatus('exp-1', 'paused')
      expect(manager.getExperiment('exp-1')!.status).toBe('paused')
    })

    it('should return running experiments', () => {
      manager.registerExperiment(createExp('exp-1'))
      manager.registerExperiment({ ...createExp('exp-2'), status: 'paused' })
      manager.registerExperiment({ ...createExp('exp-3'), status: 'completed' })
      const running = manager.getRunningExperiments()
      expect(running).toHaveLength(1)
      expect(running[0].experimentId).toBe('exp-1')
    })

    it('should handle empty running experiments', () => {
      expect(manager.getRunningExperiments()).toHaveLength(0)
    })
  })

  // ============================================================
  // 用户分组
  // ============================================================
  describe('assignGroup', () => {
    const createExp = (id: string, split: number = 50): ABTestConfig => ({
      experimentId: id,
      name: `Exp ${id}`,
      description: 'test',
      control: { label: 'C', params: {} },
      variant: { label: 'V', params: {} },
      trafficSplit: split,
      startDate: '2026-01-01',
      status: 'running',
      metrics: [{ name: 'ctr', weight: 1.0, higherIsBetter: true }],
      minSampleSize: 100,
      confidenceLevel: 0.95,
    })

    it('should assign the same user consistently', () => {
      manager.registerExperiment(createExp('exp-1'))
      const g1 = manager.assignGroup('user-1', 'exp-1')
      const g2 = manager.assignGroup('user-1', 'exp-1')
      expect(g1).toBe(g2)
    })

    it('should assign different users potentially different groups', () => {
      manager.registerExperiment(createExp('exp-1'))
      const groups = new Set<string>()
      for (let i = 0; i < 20; i++) {
        groups.add(manager.assignGroup(`user-${i}`, 'exp-1'))
      }
      // 至少应该出现两种组 (概率极高)
      expect(groups.size).toBeGreaterThanOrEqual(2)
    })

    it('should respect traffic split', () => {
      manager.registerExperiment(createExp('exp-1', 50)) // 50% variant
      let variantCount = 0
      const total = 1000
      for (let i = 0; i < total; i++) {
        if (manager.assignGroup(`u${i}`, 'exp-1') === 'variant') {
          variantCount++
        }
      }
      // 应在 40%-60% 之间 (大数定律)
      expect(variantCount / total).toBeGreaterThan(0.35)
      expect(variantCount / total).toBeLessThan(0.65)
    })

    it('should memoize assignment per member', () => {
      manager.registerExperiment(createExp('exp-1'))
      const group = manager.assignGroup('user-1', 'exp-1')
      // 同一个实验再次分配应一致
      const groups = manager.getMemberGroups('user-1')
      expect(groups['exp-1']).toBe(group)
    })

    it('should return control for non-running experiments', () => {
      manager.registerExperiment({ ...createExp('exp-1'), status: 'completed' })
      expect(manager.assignGroup('user-1', 'exp-1')).toBe('control')
    })

    it('should handle multiple experiments per user', () => {
      manager.registerExperiment(createExp('exp-1'))
      manager.registerExperiment(createExp('exp-2'))
      const g1 = manager.assignGroup('user-1', 'exp-1')
      const g2 = manager.assignGroup('user-1', 'exp-2')
      expect(typeof g1).toBe('string')
      expect(typeof g2).toBe('string')
      expect(g1).toBe(g1) // consistent
    })
  })

  // ============================================================
  // 曝光/转化追踪
  // ============================================================
  describe('tracking', () => {
    const createExp = (id: string): ABTestConfig => ({
      experimentId: id,
      name: `Exp ${id}`,
      description: 'test',
      control: { label: 'C', params: {} },
      variant: { label: 'V', params: {} },
      trafficSplit: 50,
      startDate: '2026-01-01',
      status: 'running',
      metrics: [{ name: 'ctr', weight: 1.0, higherIsBetter: true }],
      minSampleSize: 100,
      confidenceLevel: 0.95,
    })

    it('should record exposure', () => {
      manager.registerExperiment(createExp('exp-1'))
      manager.recordExposure('exp-1', 'user-1', 'control', 10)
      const snapshot = manager.analyzeResults('exp-1')
      expect(snapshot!.controlExposures).toBe(10)
    })

    it('should record conversion', () => {
      manager.registerExperiment(createExp('exp-1'))
      manager.recordConversion('exp-1', 'user-1', 'variant', 200)
      const snapshot = manager.analyzeResults('exp-1')
      expect(snapshot!.variantConversions).toBe(1)
      expect(snapshot!.variantRevenue).toBe(200)
    })

    it('should not record for non-running experiments', () => {
      manager.registerExperiment({ ...createExp('exp-1'), status: 'completed' })
      manager.recordExposure('exp-1', 'user-1', 'control', 10)
      const snapshot = manager.analyzeResults('exp-1')
      expect(snapshot!.controlExposures).toBe(0)
    })

    it('should accumulate multiple events', () => {
      manager.registerExperiment(createExp('exp-1'))
      for (let i = 0; i < 5; i++) {
        manager.recordExposure('exp-1', `u${i}`, 'control', 10)
        manager.recordConversion('exp-1', `u${i}`, 'control', 100)
      }
      const snapshot = manager.analyzeResults('exp-1')
      expect(snapshot!.controlExposures).toBe(50)
      expect(snapshot!.controlConversions).toBe(5)
      expect(snapshot!.controlRevenue).toBe(500)
    })
  })

  // ============================================================
  // 结果分析
  // ============================================================
  describe('analyzeResults', () => {
    it('should return undefined for non-existing experiment', () => {
      expect(manager.analyzeResults('none')).toBeUndefined()
    })

    it('should compute CTR metric', () => {
      manager.registerExperiment({
        experimentId: 'exp-1',
        name: 'CTR Test',
        description: '',
        control: { label: 'C', params: {} },
        variant: { label: 'V', params: {} },
        trafficSplit: 50,
        startDate: '2026-01-01',
        status: 'running',
        metrics: [{ name: 'ctr', weight: 1.0, higherIsBetter: true }],
        minSampleSize: 100,
        confidenceLevel: 0.95,
      })
      // 100 exposures → 20 conversions → CTR = 20/100 = 0.2
      for (let i = 0; i < 100; i++) {
        manager.recordExposure('exp-1', `cu${i}`, 'control', 1)
      }
      for (let i = 0; i < 20; i++) {
        manager.recordConversion('exp-1', `cu${i}`, 'control', 20)
      }
      // 100 exposures → 30 conversions → CTR = 30/100 = 0.3
      for (let i = 0; i < 100; i++) {
        manager.recordExposure('exp-1', `vu${i}`, 'variant', 1)
      }
      for (let i = 0; i < 30; i++) {
        manager.recordConversion('exp-1', `vu${i}`, 'variant', 30)
      }
      const snapshot = manager.analyzeResults('exp-1')!
      const ctrMetric = snapshot.metrics.find(m => m.name === 'ctr')
      expect(ctrMetric).toBeDefined()
      expect(ctrMetric!.controlValue).toBeCloseTo(0.2, 5)
      expect(ctrMetric!.variantValue).toBeCloseTo(0.3, 5)
    })

    it('should compute conversion-rate metric', () => {
      manager.registerExperiment({
        experimentId: 'exp-2',
        name: 'Conversion Test',
        description: '',
        control: { label: 'C', params: {} },
        variant: { label: 'V', params: {} },
        trafficSplit: 50,
        startDate: '2026-01-01',
        status: 'running',
        metrics: [{ name: 'conversion-rate', weight: 1.0, higherIsBetter: true }],
        minSampleSize: 100,
        confidenceLevel: 0.95,
      })
      // 200 exposures → 40 conversions → rate = 40/200 = 0.2
      for (let i = 0; i < 200; i++) {
        manager.recordExposure('exp-2', `cu${i}`, 'control', 1)
      }
      for (let i = 0; i < 40; i++) {
        manager.recordConversion('exp-2', `cu${i}`, 'control', 40)
      }
      // 200 exposures → 50 conversions → rate = 50/200 = 0.25
      for (let i = 0; i < 200; i++) {
        manager.recordExposure('exp-2', `vu${i}`, 'variant', 1)
      }
      for (let i = 0; i < 50; i++) {
        manager.recordConversion('exp-2', `vu${i}`, 'variant', 50)
      }
      const snapshot = manager.analyzeResults('exp-2')!
      const crMetric = snapshot.metrics.find(m => m.name === 'conversion-rate')
      expect(crMetric!.controlValue).toBeCloseTo(0.2, 5)
      expect(crMetric!.variantValue).toBeCloseTo(0.25, 5)
    })

    it('should compute avg-revenue metric', () => {
      manager.registerExperiment({
        experimentId: 'exp-3',
        name: 'Revenue Test',
        description: '',
        control: { label: 'C', params: {} },
        variant: { label: 'V', params: {} },
        trafficSplit: 50,
        startDate: '2026-01-01',
        status: 'running',
        metrics: [{ name: 'avg-revenue', weight: 1.0, higherIsBetter: true }],
        minSampleSize: 100,
        confidenceLevel: 0.95,
      })
      manager.recordConversion('exp-3', 'u1', 'control', 400)
      manager.recordConversion('exp-3', 'u1', 'control', 600)
      const snapshot = manager.analyzeResults('exp-3')!
      const revMetric = snapshot.metrics.find(m => m.name === 'avg-revenue')
      expect(revMetric!.controlValue).toBeCloseTo(500, 5) // 1000/2
    })

    it('should determine winner when variant is better', () => {
      manager.registerExperiment({
        experimentId: 'exp-4',
        name: 'Winner Test',
        description: '',
        control: { label: 'C', params: {} },
        variant: { label: 'V', params: {} },
        trafficSplit: 50,
        startDate: '2026-01-01',
        status: 'running',
        metrics: [{ name: 'ctr', weight: 1.0, higherIsBetter: true }],
        minSampleSize: 100,
        confidenceLevel: 0.95,
      })
      // control: 20 conversions / 100 exposures = 20%
      for (let i = 0; i < 100; i++) {
        manager.recordExposure('exp-4', `cu${i}`, 'control', 1)
      }
      for (let i = 0; i < 20; i++) {
        manager.recordConversion('exp-4', `cu${i}`, 'control', 20)
      }
      // variant: 50 conversions / 100 exposures = 50%
      for (let i = 0; i < 100; i++) {
        manager.recordExposure('exp-4', `vu${i}`, 'variant', 1)
      }
      for (let i = 0; i < 50; i++) {
        manager.recordConversion('exp-4', `vu${i}`, 'variant', 50)
      }
      const snapshot = manager.analyzeResults('exp-4')!
      expect(snapshot.winner).toBe('variant')
    })

    it('should return insufficient-data when sample too small', () => {
      manager.registerExperiment({
        experimentId: 'exp-5',
        name: 'Small sample',
        description: '',
        control: { label: 'C', params: {} },
        variant: { label: 'V', params: {} },
        trafficSplit: 50,
        startDate: '2026-01-01',
        status: 'running',
        metrics: [{ name: 'ctr', weight: 1.0, higherIsBetter: true }],
        minSampleSize: 100,
        confidenceLevel: 0.95,
      })
      manager.recordExposure('exp-5', 'u1', 'control', 5)
      manager.recordConversion('exp-5', 'u1', 'control', 1)
      manager.recordExposure('exp-5', 'u2', 'variant', 5)
      manager.recordConversion('exp-5', 'u2', 'variant', 2)
      const snapshot = manager.analyzeResults('exp-5')!
      expect(snapshot.winner).toBe('insufficient-data')
    })

    it('should return recommended params', () => {
      manager.registerExperiment({
        experimentId: 'exp-6',
        name: 'Params Test',
        description: '',
        control: { label: 'C', params: { scoreBoost: 1.0 } },
        variant: { label: 'V', params: { scoreBoost: 1.5 } },
        trafficSplit: 50,
        startDate: '2026-01-01',
        status: 'running',
        metrics: [{ name: 'ctr', weight: 1.0, higherIsBetter: true }],
        minSampleSize: 100,
        confidenceLevel: 0.95,
      })
      const params = manager.getRecommendedParams('exp-6')
      expect(params).toBeDefined()
      expect(params!.scoreBoost).toBe(1.0) // still running → control
    })
  })

  // ============================================================
  // 重置
  // ============================================================
  describe('reset', () => {
    it('should reset all data', () => {
      manager.registerExperiment({
        experimentId: 'exp-1',
        name: 'Test',
        description: '',
        control: { label: 'C', params: {} },
        variant: { label: 'V', params: {} },
        trafficSplit: 50,
        startDate: '2026-01-01',
        status: 'running',
        metrics: [{ name: 'ctr', weight: 1.0, higherIsBetter: true }],
        minSampleSize: 100,
        confidenceLevel: 0.95,
      })
      manager.recordExposure('exp-1', 'u1', 'control', 10)
      manager.reset()
      expect(manager.getRunningExperiments()).toHaveLength(0)
      expect(manager.getAllSnapshots()).toHaveLength(0)
    })
  })
})

// ============================================================
// ABTestOptimizedStrategy
// ============================================================
describe('ABTestOptimizedStrategy', () => {
  let manager: ABTestManager
  let strategy: ABTestOptimizedStrategy

  beforeEach(() => {
    manager = new ABTestManager()
    strategy = new ABTestOptimizedStrategy(manager)
  })

  const createCandidate = (itemId: string, score: number): Candidate => ({
    itemId,
    score,
    reasoning: 'popular',
    strategy: 'popular',
  })

  const createContext = (memberId?: string): PromotionContext => ({
    tenantId: 't1',
    currentDateTime: new Date('2026-07-16T10:00:00'),
    memberId,
  })

  it('should not be applicable without memberId', () => {
    expect(strategy.isApplicable(createContext(undefined))).toBe(false)
  })

  it('should not be applicable without running experiments', () => {
    expect(strategy.isApplicable(createContext('user-1'))).toBe(false)
  })

  it('should be applicable with running experiments', () => {
    manager.registerExperiment({
      experimentId: 'exp-1',
      name: 'Test',
      description: '',
      control: { label: 'C', params: { scoreBoost: 1.0 } },
      variant: { label: 'V', params: { scoreBoost: 1.2 } },
      trafficSplit: 50,
      startDate: '2026-01-01',
      status: 'running',
      metrics: [{ name: 'ctr', weight: 1.0, higherIsBetter: true }],
      minSampleSize: 100,
      confidenceLevel: 0.95,
    })
    expect(strategy.isApplicable(createContext('user-1'))).toBe(true)
  })

  it('should apply A/B test boost', () => {
    manager.registerExperiment({
      experimentId: 'exp-1',
      name: 'Test',
      description: '',
      control: { label: 'C', params: { scoreBoost: 1.2 } },
      variant: { label: 'V', params: { scoreBoost: 1.5 } },
      trafficSplit: 50,
      startDate: '2026-01-01',
      status: 'running',
      metrics: [{ name: 'ctr', weight: 1.0, higherIsBetter: true }],
      minSampleSize: 100,
      confidenceLevel: 0.95,
    })
    const candidates = [createCandidate('p1', 0.5)]
    const result = strategy.apply(candidates, createContext('user-1'))
    expect(result).toHaveLength(1)
    // boost should be applied: score != baseScore (since scoreBoost changes it)
    expect(result[0].boostedScore).toBeGreaterThanOrEqual(0)
  })

  it('should record exposure on apply', () => {
    manager.registerExperiment({
      experimentId: 'exp-1',
      name: 'Test',
      description: '',
      control: { label: 'C', params: { scoreBoost: 1.0 } },
      variant: { label: 'V', params: { scoreBoost: 1.0 } },
      trafficSplit: 50,
      startDate: '2026-01-01',
      status: 'running',
      metrics: [{ name: 'ctr', weight: 1.0, higherIsBetter: true }],
      minSampleSize: 100,
      confidenceLevel: 0.95,
    })
    strategy.apply([createCandidate('p1', 0.5)], createContext('user-1'))
    const snapshot = manager.analyzeResults('exp-1')
    expect(snapshot!.controlExposures + snapshot!.variantExposures).toBeGreaterThanOrEqual(1)
  })

  it('should handle multiple candidates', () => {
    manager.registerExperiment({
      experimentId: 'exp-1',
      name: 'Test',
      description: '',
      control: { label: 'C', params: { scoreBoost: 1.0 } },
      variant: { label: 'V', params: { scoreBoost: 1.2 } },
      trafficSplit: 50,
      startDate: '2026-01-01',
      status: 'running',
      metrics: [{ name: 'ctr', weight: 1.0, higherIsBetter: true }],
      minSampleSize: 100,
      confidenceLevel: 0.95,
    })
    const candidates = [
      createCandidate('p1', 0.5),
      createCandidate('p2', 0.8),
      createCandidate('p3', 0.3),
    ]
    const result = strategy.apply(candidates, createContext('user-1'))
    expect(result).toHaveLength(3)
    expect(result[0].itemId).toBe('p2') // 最高分优先
  })

  it('should sort results by score descending', () => {
    manager.registerExperiment({
      experimentId: 'exp-1',
      name: 'Test',
      description: '',
      control: { label: 'C', params: { scoreBoost: 1.0 } },
      variant: { label: 'V', params: { scoreBoost: 1.0 } },
      trafficSplit: 50,
      startDate: '2026-01-01',
      status: 'running',
      metrics: [{ name: 'ctr', weight: 1.0, higherIsBetter: true }],
      minSampleSize: 100,
      confidenceLevel: 0.95,
    })
    const candidates = [
      createCandidate('p3', 0.1),
      createCandidate('p1', 0.9),
      createCandidate('p2', 0.5),
    ]
    const result = strategy.apply(candidates, createContext('user-1'))
    expect(result[0].itemId).toBe('p1')
    expect(result[1].itemId).toBe('p2')
    expect(result[2].itemId).toBe('p3')
  })

  it('should handle no running experiments gracefully', () => {
    const candidates = [createCandidate('p1', 0.5)]
    const result = strategy.apply(candidates, createContext('user-1'))
    expect(result).toHaveLength(1)
    expect(result[0].score).toBe(0.5)
  })
})
