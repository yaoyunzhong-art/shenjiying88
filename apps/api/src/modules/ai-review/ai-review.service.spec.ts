/**
 * ai-review.service.spec.ts · AIReviewService 单元测试 (Vitest)
 *
 * 覆盖策略:
 *   - reviewPRDiff: skeleton 抛错
 *   - reviewTestCoverage / reviewPerformance / draftRFC: skeleton 抛错
 *   - parseReviewOutput: JSON 解析 / markdown 包装 / 降级
 *   - formatFilesContext: 格式化 / 空列表
 *   - healthcheck: 委托 costTracker snapshot
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AIReviewService, type PRDiffReviewParams } from './ai-review.service'
import { LLMProviderFactory, type ILLMProvider } from './llm/llm.provider'
import { CostTrackerService, InMemoryCostStorage } from './llm/cost-tracker.service'
import type { LLMRequest, LLMResponse, UsageMetrics } from './llm/types'
import type { LlmProvider } from './llm/types'

// ─── Mock 辅助 ──────────────────────────────────────────────────────────

function createMockConfig(): any {
  return {
    defaultProvider: 'claude' as LlmProvider,
    monthlyHardLimitUsd: 1000,
    monthlySoftLimitUsd: 800,
    alertThreshold: 0.8,
    enablePromptCache: true,
    cacheTtlSeconds: 86400,
    claude: { apiKey: 'sk-test', baseUrl: 'https://api.anthropic.com', model: 'claude-sonnet-4-6', timeoutMs: 60000, maxRetries: 3 },
    openai: { apiKey: 'sk-test', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini', timeoutMs: 30000, maxRetries: 3 },
    deepseek: { apiKey: 'sk-test', baseUrl: 'https://api.deepseek.com/v1', model: 'deepseek-chat', timeoutMs: 60000, maxRetries: 3 },
    fallbackChain: ['deepseek', 'openai', 'claude'] as LlmProvider[],
  }
}

function createMockFactory(): any {
  const mockProvider: ILLMProvider = {
    name: 'claude' as LlmProvider,
    defaultModel: 'claude-sonnet-4-6',
    generate: vi.fn(),
    healthcheck: vi.fn().mockResolvedValue({ ok: true, provider: 'claude' as LlmProvider, latencyMs: 50 }),
  }
  return {
    providers: new Map([['claude', mockProvider]]),
    claude: mockProvider,
    openai: { name: 'openai', defaultModel: 'gpt-4o-mini', generate: vi.fn(), healthcheck: vi.fn() },
    deepseek: { name: 'deepseek', defaultModel: 'deepseek-chat', generate: vi.fn(), healthcheck: vi.fn() },
    get: vi.fn().mockReturnValue(mockProvider),
    getAvailable: vi.fn(),
    register: vi.fn(),
  }
}

function makePRDiffParams(overrides?: Partial<PRDiffReviewParams>): PRDiffReviewParams {
  return {
    prTitle: 'Fix login validation',
    prDescription: 'Fixed token expiry check',
    files: [
      {
        filePath: 'src/auth/login.ts',
        language: 'typescript',
        diff: '@@ -10,5 +10,8 @@\n+  if (!token) return',
        additions: 5,
        deletions: 2,
      },
    ],
    ...overrides,
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Test Suite
// ═══════════════════════════════════════════════════════════════════════════

describe('AIReviewService', () => {
  let service: AIReviewService
  let mockCfg: any
  let mockFactory: any
  let costTracker: CostTrackerService
  let costStorage: InMemoryCostStorage

  beforeEach(() => {
    mockCfg = createMockConfig()
    mockFactory = createMockFactory()
    costStorage = new InMemoryCostStorage()
    costTracker = new CostTrackerService(mockCfg, costStorage)
    service = new AIReviewService(mockCfg, mockFactory, costTracker)
  })

  // ─── reviewPRDiff ─────────────────────────────────────────────────

  describe('reviewPRDiff', () => {
    it('should throw NotImplementedError (skeleton)', async () => {
      const params = makePRDiffParams()
      await expect(service.reviewPRDiff(params)).rejects.toThrow(
        'AIReviewService.reviewPRDiff not implemented',
      )
    })
  })

  // ─── reviewTestCoverage ────────────────────────────────────────────

  describe('reviewTestCoverage', () => {
    it('should throw NotImplementedError (skeleton)', async () => {
      await expect(
        service.reviewTestCoverage({
          filePath: 'src/auth/login.ts',
          codeSummary: 'login function with token validation',
          currentCoverage: 0.65,
        }),
      ).rejects.toThrow('not implemented')
    })
  })

  // ─── reviewPerformance ─────────────────────────────────────────────

  describe('reviewPerformance', () => {
    it('should throw NotImplementedError (skeleton)', async () => {
      await expect(
        service.reviewPerformance({
          filePath: 'src/auth/login.ts',
          budgetMs: 200,
          qps: 100,
        }),
      ).rejects.toThrow('not implemented')
    })
  })

  // ─── draftRFC ──────────────────────────────────────────────────────

  describe('draftRFC', () => {
    it('should throw NotImplementedError (skeleton)', async () => {
      await expect(
        service.draftRFC({
          topic: 'API rate limiting',
          background: 'Current no rate limiting',
          proposal: 'Add token bucket algorithm',
        }),
      ).rejects.toThrow('not implemented')
    })
  })

  // ─── parseReviewOutput ─────────────────────────────────────────────

  describe('parseReviewOutput', () => {
    /**
     * 注意: 当前 skeleton 实现始终返回 overallScore=0 (解析逻辑未实现)
     * 这里验证返回结构的完整性与稳定性
     */

    it('should return skeleton output with correct structure', () => {
      const result = service.parseReviewOutput('any content')
      expect(result).toHaveProperty('overallScore')
      expect(result).toHaveProperty('issues')
      expect(result).toHaveProperty('strengths')
      expect(result).toHaveProperty('summary')
      expect(result).toHaveProperty('needsApproverReview')
    })

    it('should return overallScore 0 from skeleton', () => {
      const result = service.parseReviewOutput(JSON.stringify({ overallScore: 8 }))
      expect(result.overallScore).toBe(0)
    })

    it('should return empty issues array from skeleton', () => {
      const result = service.parseReviewOutput('[] {} whatever')
      expect(result.issues).toEqual([])
    })

    it('should return empty strengths array from skeleton', () => {
      const result = service.parseReviewOutput('test')
      expect(result.strengths).toEqual([])
    })

    it('should return meaningful summary from skeleton', () => {
      const result = service.parseReviewOutput('test')
      expect(typeof result.summary).toBe('string')
      expect(result.summary.length).toBeGreaterThan(0)
    })

    it('should return needsApproverReview false from skeleton', () => {
      const result = service.parseReviewOutput('anything')
      expect(result.needsApproverReview).toBe(false)
    })

    it('should be resilient to empty string input', () => {
      const result = service.parseReviewOutput('')
      expect(result.overallScore).toBe(0)
      expect(result.needsApproverReview).toBe(false)
    })
  })

  // ─── formatFilesContext ────────────────────────────────────────────

  describe('formatFilesContext', () => {
    it('should format single file', () => {
      const result = service.formatFilesContext([
        { filePath: 'src/main.ts', language: 'typescript', diff: '', additions: 10, deletions: 2 },
      ])
      expect(result).toBe('src/main.ts: +10/-2')
    })

    it('should format multiple files', () => {
      const result = service.formatFilesContext([
        { filePath: 'src/a.ts', language: 'typescript', diff: '', additions: 5, deletions: 1 },
        { filePath: 'src/b.ts', language: 'typescript', diff: '', additions: 3, deletions: 3 },
      ])
      expect(result).toContain('src/a.ts: +5/-1')
      expect(result).toContain('src/b.ts: +3/-3')
      expect(result.split('\n')).toHaveLength(2)
    })

    it('should handle empty files list', () => {
      const result = service.formatFilesContext([])
      expect(result).toBe('')
    })

    it('should handle zero additions/deletions', () => {
      const result = service.formatFilesContext([
        { filePath: 'src/readme.md', language: 'markdown', diff: '', additions: 0, deletions: 0 },
      ])
      expect(result).toBe('src/readme.md: +0/-0')
    })
  })

  // ─── healthcheck ───────────────────────────────────────────────────

  describe('healthcheck', () => {
    it('should return health status from cost tracker snapshot', async () => {
      costStorage.incrementMonthlyCost(costTracker.currentMonthKey(), 50)

      const result = await service.healthcheck()
      expect(result.ok).toBe(true)
      expect(result.defaultProvider).toBe('claude')
      expect(result.budgetUtilization).toBeGreaterThan(0)
      expect(result.cacheEnabled).toBe(true)
    })

    it('should return zero utilization when no usage recorded', async () => {
      const result = await service.healthcheck()
      expect(result.budgetUtilization).toBe(0)
    })

    it('should reflect cache disabled config', async () => {
      const disabledCfg = { ...mockCfg, enablePromptCache: false }
      const svc = new AIReviewService(disabledCfg, mockFactory, costTracker)
      const result = await svc.healthcheck()
      expect(result.cacheEnabled).toBe(false)
    })
  })
})
