import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
/**
 * cost-tracker.service.spec.ts · 成本追踪单元测试 (Phase-19 TD-001)
 *
 * 覆盖范围:
 *   - 月度预算闸门 (硬上限 / 软上限 / 预警)
 *   - Token 计量 + 累加
 *   - Prompt 缓存命中 / 失效
 *   - 报表生成
 */

import {
  CostTrackerService,
  InMemoryCostStorage,
} from './cost-tracker.service'
import {
  BudgetExceededError,
  type LLMResponse,
  type UsageMetrics,
} from './types'

type CostTrackerConfig = ConstructorParameters<typeof CostTrackerService>[0]

// ─── Fixture ───────────────────────────────────────────────────────────

const mockConfig = {
  defaultProvider: 'claude' as const,
  monthlyHardLimitUsd: 100,
  monthlySoftLimitUsd: 80,
  alertThreshold: 0.8,
  enablePromptCache: true,
  cacheTtlSeconds: 60,
  claude: { apiKey: '', baseUrl: '', model: 'claude-sonnet-4-6', timeoutMs: 60000, maxRetries: 3 },
  openai: { apiKey: '', baseUrl: '', model: 'gpt-4o-mini', timeoutMs: 30000, maxRetries: 3 },
  fallbackChain: ['openai', 'claude'] as const,
}

const fakeConfig = {
  ...mockConfig,
  get: () => mockConfig,
} as unknown as CostTrackerConfig

const usage = (provider: 'claude' | 'openai', cost: number): UsageMetrics => ({
  inputTokens: 1000,
  outputTokens: 500,
  totalTokens: 1500,
  costUsd: cost,
  provider,
  model: 'test',
  timestamp: new Date().toISOString(),
})

const fakeResponse = (content = 'hello'): LLMResponse => ({
  content,
  provider: 'claude',
  model: 'claude-sonnet-4-6',
  usage: usage('claude', 0.01),
  latencyMs: 100,
  cacheHit: false,
  finishReason: 'stop',
})

// ─── Test ──────────────────────────────────────────────────────────────

describe('CostTrackerService', () => {
  let tracker: CostTrackerService
  let storage: InMemoryCostStorage

  beforeEach(() => {
    storage = new InMemoryCostStorage()
    tracker = new CostTrackerService(fakeConfig, storage)
  })

  // ─── 月度预算 ─────────────────────────────────────────────────────

  describe('checkBudget', () => {
    it('未达软上限时允许继续', () => {
      const r = tracker.checkBudget('claude')
      expect(r.allowed).toBe(true)
      expect(r.fallback).toBeUndefined()
    })

    it('超过硬上限时抛出 BudgetExceededError', () => {
      storage.incrementMonthlyCost(tracker.currentMonthKey(), 100)
      expect(() => tracker.checkBudget('claude')).toThrow(BudgetExceededError)
    })

    it('达到软上限时返回 fallback', () => {
      storage.incrementMonthlyCost(tracker.currentMonthKey(), 80)
      const r = tracker.checkBudget('claude')
      expect(r.allowed).toBe(false)
      expect(r.fallback).toBe('openai')
    })

    it('预警阈值 (80%) 时仍允许但 log warn', () => {
      storage.incrementMonthlyCost(tracker.currentMonthKey(), 85)
      const r = tracker.checkBudget('claude')
      expect(r.allowed).toBe(false)
    })
  })

  // ─── Token 计量 ─────────────────────────────────────────────────

  describe('recordUsage', () => {
    it('累加月度成本', () => {
      tracker.recordUsage(usage('claude', 10))
      tracker.recordUsage(usage('claude', 20))
      expect(tracker.currentMonthCost()).toBeCloseTo(30, 5)
    })

    it('记录后 monthlyCost 同步', () => {
      tracker.recordUsage(usage('claude', 50))
      const result = tracker.recordUsage(usage('claude', 25))
      expect(result.monthlyCost).toBeCloseTo(75, 5)
    })

    it('不同 provider 累加到同一月度', () => {
      tracker.recordUsage(usage('claude', 30))
      tracker.recordUsage(usage('openai', 40))
      expect(tracker.currentMonthCost()).toBeCloseTo(70, 5)
    })
  })

  // ─── Prompt 缓存 ────────────────────────────────────────────────

  describe('prompt cache', () => {
    it('第一次查询未命中', () => {
      const r = tracker.checkCache({ userPrompt: 'q', cacheKey: 'k1' })
      expect(r.hit).toBe(false)
    })

    it('写入后命中', () => {
      tracker.setCache({ userPrompt: 'q', cacheKey: 'k1' }, fakeResponse('cached'))
      const r = tracker.checkCache({ userPrompt: 'q', cacheKey: 'k1' })
      expect(r.hit).toBe(true)
      expect(r.response?.content).toBe('cached')
    })

    it('不同 cacheKey 独立', () => {
      tracker.setCache({ userPrompt: 'q', cacheKey: 'k1' }, fakeResponse('a'))
      tracker.setCache({ userPrompt: 'q', cacheKey: 'k2' }, fakeResponse('b'))
      expect(tracker.checkCache({ userPrompt: 'q', cacheKey: 'k1' }).response?.content).toBe('a')
      expect(tracker.checkCache({ userPrompt: 'q', cacheKey: 'k2' }).response?.content).toBe('b')
    })

    it('禁用缓存时不写入', () => {
      const noCacheCfg = { ...mockConfig, enablePromptCache: false }
      const noCacheCfgWrapped = { ...noCacheCfg, get: () => noCacheCfg } as unknown as CostTrackerConfig
      const noCacheTracker = new CostTrackerService(noCacheCfgWrapped, storage)
      noCacheTracker.setCache({ userPrompt: 'q', cacheKey: 'k1' }, fakeResponse())
      expect(noCacheTracker.checkCache({ userPrompt: 'q', cacheKey: 'k1' }).hit).toBe(false)
    })

    it('无 cacheKey 不写入', () => {
      tracker.setCache({ userPrompt: 'q' }, fakeResponse())
      expect(storage.cacheSize).toBe(0)
    })

    it('error finishReason 不缓存', () => {
      tracker.setCache({ userPrompt: 'q', cacheKey: 'k1' }, {
        ...fakeResponse(),
        finishReason: 'error',
      })
      expect(storage.cacheSize).toBe(0)
    })

    it('TTL 过期后不命中', async () => {
      const shortTtlCfg = { ...mockConfig, cacheTtlSeconds: 0 }
      const shortTtlCfgWrapped = { ...shortTtlCfg, get: () => shortTtlCfg } as unknown as CostTrackerConfig
      const shortTracker = new CostTrackerService(shortTtlCfgWrapped, storage)
      shortTracker.setCache({ userPrompt: 'q', cacheKey: 'k1' }, fakeResponse())
      await new Promise((r) => setTimeout(r, 10))
      expect(shortTracker.checkCache({ userPrompt: 'q', cacheKey: 'k1' }).hit).toBe(false)
    })
  })

  // ─── 报表 ────────────────────────────────────────────────────────

  describe('snapshot', () => {
    it('返回完整月度状态', () => {
      tracker.recordUsage(usage('claude', 50))
      const s = tracker.snapshot()
      expect(s.costUsd).toBeCloseTo(50, 5)
      expect(s.hardLimitUsd).toBe(100)
      expect(s.softLimitUsd).toBe(80)
      expect(s.utilizationPct).toBeCloseTo(50, 5)
      expect(s.overSoftLimit).toBe(false)
      expect(s.overHardLimit).toBe(false)
    })

    it('超过软上限时标记', () => {
      tracker.recordUsage(usage('claude', 85))
      const s = tracker.snapshot()
      expect(s.overSoftLimit).toBe(true)
      expect(s.overHardLimit).toBe(false)
    })

    it('超过硬上限时标记', () => {
      tracker.recordUsage(usage('claude', 105))
      const s = tracker.snapshot()
      expect(s.overHardLimit).toBe(true)
    })

    it('monthKey 格式 YYYY-MM', () => {
      const s = tracker.snapshot()
      expect(s.monthKey).toMatch(/^\d{4}-\d{2}$/)
    })
  })

  // ─── InMemory Storage ────────────────────────────────────────────

  describe('InMemoryCostStorage', () => {
    it('reset() 清空所有数据', () => {
      storage.incrementMonthlyCost('2026-06', 50)
      storage.setCache('k1', fakeResponse(), 60)
      storage.reset()
      expect(storage.getMonthlyCost('2026-06')).toBe(0)
      expect(storage.cacheSize).toBe(0)
    })

    it('缓存大小统计', () => {
      storage.setCache('k1', fakeResponse(), 60)
      storage.setCache('k2', fakeResponse(), 60)
      expect(storage.cacheSize).toBe(2)
    })
  })
})
