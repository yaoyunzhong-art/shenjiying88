import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CostTrackerService, InMemoryCostStorage } from './cost-tracker.service'
import type { UsageMetrics, LLMRequest, LLMResponse } from './types'

function makeMockConfig(overrides: Record<string, unknown> = {}) {
  return {
    defaultProvider: 'claude',
    monthlyHardLimitUsd: 1000,
    monthlySoftLimitUsd: 800,
    alertThreshold: 0.8,
    enablePromptCache: true,
    cacheTtlSeconds: 86400,
    claude: { apiKey: 'sk-test', baseUrl: 'https://api.anthropic.com', model: 'claude-sonnet-4-6', timeoutMs: 60000, maxRetries: 3 },
    openai: { apiKey: 'sk-test', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini', timeoutMs: 30000, maxRetries: 3 },
    deepseek: { apiKey: 'sk-test', baseUrl: 'https://api.deepseek.com/v1', model: 'deepseek-chat', timeoutMs: 60000, maxRetries: 3 },
    fallbackChain: ['deepseek', 'openai', 'claude'],
    ...overrides,
  } as any
}

describe('CostTrackerService', () => {
  describe('InMemoryCostStorage', () => {
    let storage: InMemoryCostStorage
    beforeEach(() => { storage = new InMemoryCostStorage() })

    it('should start with zero monthly cost', () => {
      expect(storage.getMonthlyCost('2026-07')).toBe(0)
    })

    it('should increment monthly cost correctly', () => {
      storage.incrementMonthlyCost('2026-07', 10)
      expect(storage.getMonthlyCost('2026-07')).toBe(10)
      storage.incrementMonthlyCost('2026-07', 5.5)
      expect(storage.getMonthlyCost('2026-07')).toBe(15.5)
    })

    it('should isolate different months', () => {
      storage.incrementMonthlyCost('2026-07', 100)
      storage.incrementMonthlyCost('2026-08', 50)
      expect(storage.getMonthlyCost('2026-07')).toBe(100)
      expect(storage.getMonthlyCost('2026-08')).toBe(50)
    })

    it('should cache and retrieve entries', () => {
      const response: LLMResponse = { content: 'test', provider: 'claude', model: 'test', usage: { inputTokens: 10, outputTokens: 5, totalTokens: 15, costUsd: 0.01, provider: 'claude', model: 'test', timestamp: '2026-07-20T00:00:00Z' }, latencyMs: 100, cacheHit: false }
      storage.setCache('key-1', response, 3600)
      const result = storage.getCacheHit('key-1')
      expect(result.hit).toBe(true)
      expect(result.response!.content).toBe('test')
    })

    it('should expire cache entries by TTL', () => {
      const response: LLMResponse = { content: 'expired', provider: 'claude', model: 'test', usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0, costUsd: 0, provider: 'claude', model: 'test', timestamp: '' }, latencyMs: 0, cacheHit: false }
      storage.setCache('key-exp', response, 0)
      const result = storage.getCacheHit('key-exp')
      expect(result.hit).toBe(false)
    })

    it('should return cache miss for unknown key', () => {
      const result = storage.getCacheHit('nonexistent')
      expect(result.hit).toBe(false)
    })

    it('should reset all state', () => {
      storage.incrementMonthlyCost('2026-07', 50)
      storage.setCache('k', { content: 'x', provider: 'claude', model: 'x', usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0, costUsd: 0, provider: 'claude', model: 'x', timestamp: '' }, latencyMs: 0, cacheHit: false }, 3600)
      storage.reset()
      expect(storage.getMonthlyCost('2026-07')).toBe(0)
      expect(storage.cacheSize).toBe(0)
    })

    it('should track month keys correctly', () => {
      storage.incrementMonthlyCost('2026-07', 10)
      storage.incrementMonthlyCost('2026-08', 20)
      expect(storage.monthKeys.sort()).toEqual(['2026-07', '2026-08'])
    })
  })

  describe('CostTrackerService — budget', () => {
    it('should allow usage within budget', () => {
      const storage = new InMemoryCostStorage()
      const service = new CostTrackerService(makeMockConfig({ monthlyHardLimitUsd: 1000 }), storage)
      const result = service.checkBudget('claude')
      expect(result.allowed).toBe(true)
    })

    it('should throw BudgetExceededError when over hard limit', () => {
      const storage = new InMemoryCostStorage()
      storage.incrementMonthlyCost('2026-07', 1000)
      const service = new CostTrackerService(makeMockConfig({ monthlyHardLimitUsd: 1000 }), storage)
      expect(() => service.checkBudget('claude')).toThrow('BudgetExceededError')
    })

    it('should return fallback provider when over soft limit', () => {
      const storage = new InMemoryCostStorage()
      storage.incrementMonthlyCost('2026-07', 800)
      const service = new CostTrackerService(makeMockConfig({ monthlyHardLimitUsd: 1000, monthlySoftLimitUsd: 800 }), storage)
      const result = service.checkBudget('claude')
      expect(result.allowed).toBe(false)
      expect(result.reason).toBe('soft-limit-hit')
      expect(result.fallback).toBe('openai')
    })

    it('should format current month key properly', () => {
      const storage = new InMemoryCostStorage()
      const service = new CostTrackerService(makeMockConfig({ monthlyHardLimitUsd: 1000 }), storage)
      const key = service.currentMonthKey()
      expect(key).toMatch(/^\d{4}-\d{2}$/)
    })

    it('should track monthly cost accurately', () => {
      const storage = new InMemoryCostStorage()
      const service = new CostTrackerService(makeMockConfig({ monthlyHardLimitUsd: 1000 }), storage)
      const usage: UsageMetrics = { inputTokens: 1000, outputTokens: 500, totalTokens: 1500, costUsd: 0.01, provider: 'claude', model: 'claude-sonnet-4-6', timestamp: new Date().toISOString() }
      service.recordUsage(usage)
      expect(storage.getMonthlyCost(service.currentMonthKey())).toBe(0.01)
    })
  })

  describe('CostTrackerService — cache', () => {
    it('should check cache and return hit if available', () => {
      const storage = new InMemoryCostStorage()
      const service = new CostTrackerService(makeMockConfig({ enablePromptCache: true }), storage)
      const response: LLMResponse = { content: 'cached', provider: 'claude', model: 'test', usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0, costUsd: 0, provider: 'claude', model: 'test', timestamp: '' }, latencyMs: 0, cacheHit: false }
      storage.setCache('ckey', response, 3600)
      const result = service.checkCache({ userPrompt: 'hello', cacheKey: 'ckey' } as LLMRequest)
      expect(result.hit).toBe(true)
      expect(result.response!.content).toBe('cached')
    })

    it('should miss cache when disabled', () => {
      const storage = new InMemoryCostStorage()
      const service = new CostTrackerService(makeMockConfig({ enablePromptCache: false }), storage)
      const result = service.checkCache({ userPrompt: 'hello', cacheKey: 'some-key' } as LLMRequest)
      expect(result.hit).toBe(false)
    })

    it('should miss cache when no cacheKey', () => {
      const storage = new InMemoryCostStorage()
      const service = new CostTrackerService(makeMockConfig({ enablePromptCache: true }), storage)
      const result = service.checkCache({ userPrompt: 'hello' } as LLMRequest)
      expect(result.hit).toBe(false)
    })

    it('should set cache entries', () => {
      const storage = new InMemoryCostStorage()
      const service = new CostTrackerService(makeMockConfig({ enablePromptCache: true }), storage)
      const response: LLMResponse = { content: 'new', provider: 'claude', model: 'test', usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0, costUsd: 0, provider: 'claude', model: 'test', timestamp: '' }, latencyMs: 0, cacheHit: false, finishReason: 'stop' }
      service.setCache({ userPrompt: 'hi', cacheKey: 'ck2' } as LLMRequest, response)
      const hit = storage.getCacheHit('ck2')
      expect(hit.hit).toBe(true)
    })

    it('should not cache error responses', () => {
      const storage = new InMemoryCostStorage()
      const service = new CostTrackerService(makeMockConfig({ enablePromptCache: true }), storage)
      const errorResponse: LLMResponse = { content: 'error', provider: 'claude', model: 'test', usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0, costUsd: 0, provider: 'claude', model: 'test', timestamp: '' }, latencyMs: 0, cacheHit: false, finishReason: 'error' }
      service.setCache({ userPrompt: 'hi', cacheKey: 'ck3' } as LLMRequest, errorResponse)
      expect(storage.cacheSize).toBe(0)
    })
  })

  describe('CostTrackerService — snapshot', () => {
    it('should return snapshot with utilization percentage', () => {
      const storage = new InMemoryCostStorage()
      storage.incrementMonthlyCost('2026-07', 100)
      const service = new CostTrackerService(makeMockConfig({ monthlyHardLimitUsd: 1000 }), storage)
      const snap = service.snapshot()
      expect(snap.costUsd).toBe(100)
      expect(snap.utilizationPct).toBe(10)
      expect(snap.overSoftLimit).toBe(false)
      expect(snap.overHardLimit).toBe(false)
    })

    it('should indicate over soft/hard limits', () => {
      const storage = new InMemoryCostStorage()
      storage.incrementMonthlyCost('2026-07', 900)
      const service = new CostTrackerService(makeMockConfig({ monthlyHardLimitUsd: 1000, monthlySoftLimitUsd: 800 }), storage)
      const snap = service.snapshot()
      expect(snap.overSoftLimit).toBe(true)
      expect(snap.overHardLimit).toBe(false)
    })
  })
})
