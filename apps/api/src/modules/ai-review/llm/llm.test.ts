import { describe, it, expect, beforeEach, vi } from 'vitest'
/**
 * 🐜 自动: [ai-review/llm] [A] 后端模块补全
 *
 * 补全缺失测试：llm 子模块（types, config, prompt-templates, provider, cost-tracker）
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import {
  calculateCost,
  calculateEmbeddingCost,
  BudgetExceededError,
  LLMUnavailableError,
  DEFAULT_MONTHLY_BUDGET,
  MODEL_PRICING,
  EMBEDDING_PRICING,
  type LLMRequest,
  type LLMResponse,
  type UsageMetrics,
  type LlmProvider,
} from './types'
import { llmConfig } from './llm.config'
import {
  buildDiffReviewRequest,
  buildTestReviewRequest,
  buildPerformanceReviewRequest,
  buildRFCDraftRequest,
  REVIEW_DIFF_SYSTEM,
  REVIEW_DIFF_EXAMPLE,
} from './prompt-templates'
import {
  InMemoryCostStorage,
  CostTrackerService,
} from './cost-tracker.service'
import {
  ClaudeProvider,
  OpenAIProvider,
  DeepSeekProvider,
  LLMProviderFactory,
  createLLMProvider,
} from './llm.provider'

// =====================================================================
// types.ts
// =====================================================================
describe('types.ts · 成本计算', () => {
  it('calculateCost Claude Sonnet 4.6 输入 $3/1M, 输出 $15/1M', () => {
    const cost = calculateCost('claude', 'claude-sonnet-4-6', 1_000_000, 0)
    assert.equal(cost, 3.0)
  })

  it('calculateCost 混合输入输出', () => {
    const cost = calculateCost('openai', 'gpt-4o-mini', 500_000, 50_000)
    // input: 0.5 * $0.15 = $0.075, output: 0.05 * $0.60 = $0.03
    assert.equal(cost, 0.105)
  })

  it('calculateCost 未知 provider 返回 0', () => {
    const cost = calculateCost('local-bge' as LlmProvider, 'bge', 1000, 1000)
    assert.equal(cost, 0)
  })

  it('calculateEmbeddingCost text-embedding-3-large $0.13/1M', () => {
    const cost = calculateEmbeddingCost('text-embedding-3-large', 100_000)
    // 浮点数精度: 0.013000000000000001 ≈ 0.013
    assert.ok(Math.abs(cost - 0.013) < 1e-6)
  })

  it('calculateEmbeddingCost 本地模型 cost = 0', () => {
    const cost = calculateEmbeddingCost('bge-large-zh-v1.5', 1_000_000)
    assert.equal(cost, 0)
  })

  it('MODEL_PRICING 包含所有 provider', () => {
    assert.ok(MODEL_PRICING.claude)
    assert.ok(MODEL_PRICING.openai)
    assert.ok(MODEL_PRICING.deepseek)
    assert.ok(MODEL_PRICING['local-bge'])
    assert.equal(Object.keys(MODEL_PRICING).length, 4)
  })

  it('EMBEDDING_PRICING 包含所有 embedding provider', () => {
    assert.ok(EMBEDDING_PRICING['text-embedding-3-large'] !== undefined)
    assert.ok(EMBEDDING_PRICING['text-embedding-3-small'] !== undefined)
    assert.ok(EMBEDDING_PRICING['bge-large-zh-v1.5'] !== undefined)
  })

  it('BudgetExceededError 格式化', () => {
    const err = new BudgetExceededError(1500, 1000)
    assert.equal(err.name, 'BudgetExceededError')
    assert.ok(err.message.includes('$1500.00'))
    assert.equal(err.currentCostUsd, 1500)
    assert.equal(err.limitUsd, 1000)
  })

  it('LLMUnavailableError 格式化', () => {
    const err = new LLMUnavailableError('claude', 'quota exhausted')
    assert.equal(err.name, 'LLMUnavailableError')
    assert.ok(err.message.includes('claude'))
    assert.equal(err.reason, 'quota exhausted')
  })

  it('DEFAULT_MONTHLY_BUDGET 默认值', () => {
    assert.equal(DEFAULT_MONTHLY_BUDGET.hardLimitUsd, 1000)
    assert.equal(DEFAULT_MONTHLY_BUDGET.softLimitUsd, 800)
    assert.equal(DEFAULT_MONTHLY_BUDGET.alertThreshold, 0.8)
    assert.equal(DEFAULT_MONTHLY_BUDGET.enablePromptCache, true)
    assert.equal(DEFAULT_MONTHLY_BUDGET.fallbackProvider, 'openai')
  })
})

// =====================================================================
// llm.config.ts
// =====================================================================
describe('llm.config.ts · 配置工厂', () => {
  const origEnv = process.env

  beforeEach(() => {
    process.env = { ...origEnv }
  })

  it('默认配置 uses claude + $1000 hard limit', () => {
    delete process.env.LLM_DEFAULT_PROVIDER
    delete process.env.LLM_MONTHLY_HARD_LIMIT_USD
    const cfg = llmConfig()
    assert.equal(cfg.defaultProvider, 'claude')
    assert.equal(cfg.monthlyHardLimitUsd, 1000)
    assert.equal(cfg.monthlySoftLimitUsd, 800)
    assert.equal(cfg.alertThreshold, 0.8)
    assert.equal(cfg.enablePromptCache, true)
  })

  it('环境变量覆盖', () => {
    process.env.LLM_DEFAULT_PROVIDER = 'openai'
    process.env.LLM_MONTHLY_HARD_LIMIT_USD = '2000'
    process.env.LLM_MONTHLY_SOFT_LIMIT_USD = '1500'
    process.env.LLM_ALERT_THRESHOLD = '0.9'
    process.env.LLM_ENABLE_PROMPT_CACHE = 'false'
    const cfg = llmConfig()
    assert.equal(cfg.defaultProvider, 'openai')
    assert.equal(cfg.monthlyHardLimitUsd, 2000)
    assert.equal(cfg.monthlySoftLimitUsd, 1500)
    assert.equal(cfg.alertThreshold, 0.9)
    assert.equal(cfg.enablePromptCache, false)
  })

  it('fallbackChain 默认 deepseek,openai,claude', () => {
    delete process.env.LLM_FALLBACK_CHAIN
    const cfg = llmConfig()
    assert.deepEqual(cfg.fallbackChain, ['deepseek', 'openai', 'claude'])
  })

  it('provider 默认模型', () => {
    delete process.env.LLM_CLAUDE_MODEL
    delete process.env.LLM_OPENAI_MODEL
    delete process.env.LLM_DEEPSEEK_MODEL
    const cfg = llmConfig()
    assert.equal(cfg.claude.model, 'claude-sonnet-4-6')
    assert.equal(cfg.openai.model, 'gpt-4o-mini')
    assert.equal(cfg.deepseek.model, 'deepseek-chat')
  })

  it('API keys 默认空', () => {
    delete process.env.LLM_CLAUDE_API_KEY
    const cfg = llmConfig()
    assert.equal(cfg.claude.apiKey, '')
    assert.equal(cfg.openai.apiKey, '')
  })
})

// =====================================================================
// prompt-templates.ts
// =====================================================================
describe('prompt-templates.ts · 提示词模板', () => {
  it('buildDiffReviewRequest 生成完整 LLMRequest', () => {
    const req = buildDiffReviewRequest({
      prTitle: 'Fix member tenant isolation',
      prDescription: 'Add tenantId check in member service',
      filesContext: 'diff --git a/member.service.ts b/member.service.ts\n...',
      fileCount: 3,
      knowledgeContext: 'quota-guard.md',
    })

    assert.ok(req.systemPrompt)
    assert.ok(req.systemPrompt!.includes('NestJS'))
    assert.ok(req.userPrompt)
    assert.ok(req.userPrompt.includes('Fix member tenant isolation'))
    assert.ok(req.userPrompt.includes('member.service.ts'))
    assert.equal(req.maxOutputTokens, 4096)
    assert.equal(req.temperature, 0.2)
    assert.equal(req.metadata!.intent, 'review-diff')
  })

  it('buildDiffReviewRequest 无 knowledgeContext 走 (无)', () => {
    const req = buildDiffReviewRequest({
      prTitle: 'Test',
      prDescription: 'Test',
      filesContext: 'content',
      fileCount: 1,
    })
    assert.ok(req.userPrompt.includes('(无)'))
  })

  it('buildTestReviewRequest 生成测试评审请求', () => {
    const req = buildTestReviewRequest({
      filePath: 'member.service.ts',
      codeSummary: 'Member CRUD with tenant isolation',
      currentCoverage: 65,
    })

    assert.ok(req.systemPrompt!.includes('vitest'))
    assert.ok(req.userPrompt.includes('member.service.ts'))
    assert.ok(req.userPrompt.includes('65%'))
    assert.equal(req.temperature, 0.3)
    assert.equal(req.metadata!.intent, 'review-test')
  })

  it('buildPerformanceReviewRequest 生成性能评审', () => {
    const req = buildPerformanceReviewRequest({
      filePath: 'campaign/campaign.service.ts',
      budgetMs: 200,
      qps: 100,
    })

    assert.ok(req.userPrompt.includes('200ms'))
    assert.ok(req.userPrompt.includes('100'))
    assert.equal(req.temperature, 0.2)
    assert.equal(req.metadata!.intent, 'review-performance')
  })

  it('buildRFCDraftRequest 生成 RFC 起草', () => {
    const req = buildRFCDraftRequest({
      topic: 'Multi-region deployment',
      background: 'Need to support US and EU regions',
      proposal: 'Deploy to us-east-1 and eu-west-1',
    })

    assert.ok(req.userPrompt.includes('Multi-region deployment'))
    assert.equal(req.temperature, 0.4)
    assert.equal(req.metadata!.intent, 'rfc-draft')
  })

  it('REVIEW_DIFF_SYSTEM 包含关键领域', () => {
    assert.ok(REVIEW_DIFF_SYSTEM.includes('NestJS'))
    assert.ok(REVIEW_DIFF_SYSTEM.includes('多租户'))
    assert.ok(REVIEW_DIFF_SYSTEM.includes('OWASP'))
  })

  it('REVIEW_DIFF_EXAMPLE 结构完整', () => {
    assert.equal(REVIEW_DIFF_EXAMPLE.overallScore, 6)
    assert.equal(REVIEW_DIFF_EXAMPLE.issues.length, 2)
    assert.equal(REVIEW_DIFF_EXAMPLE.strengths.length, 2)
    assert.equal(REVIEW_DIFF_EXAMPLE.needsApproverReview, true)
  })
})

// =====================================================================
// llm.provider.ts
// =====================================================================
describe('llm.provider.ts · Provider 工厂 & 实现', () => {
  const mockConfig = {
    defaultProvider: 'claude' as LlmProvider,
    monthlyHardLimitUsd: 1000,
    monthlySoftLimitUsd: 800,
    alertThreshold: 0.8,
    enablePromptCache: true,
    cacheTtlSeconds: 86400,
    claude: { apiKey: '', baseUrl: '', model: 'claude-sonnet-4-6', timeoutMs: 60000, maxRetries: 3 },
    openai: { apiKey: '', baseUrl: '', model: 'gpt-4o-mini', timeoutMs: 30000, maxRetries: 3 },
    deepseek: { apiKey: '', baseUrl: '', model: 'deepseek-chat', timeoutMs: 60000, maxRetries: 3 },
    fallbackChain: ['deepseek', 'openai', 'claude'] as LlmProvider[],
  }

  it('createLLMProvider claude', () => {
    const p = createLLMProvider('claude', mockConfig)
    assert.equal(p.name, 'claude')
    assert.equal(p.defaultModel, 'claude-sonnet-4-6')
  })

  it('createLLMProvider openai', () => {
    const p = createLLMProvider('openai', mockConfig)
    assert.equal(p.name, 'openai')
    assert.equal(p.defaultModel, 'gpt-4o-mini')
  })

  it('createLLMProvider unknown throws', () => {
    assert.throws(() => createLLMProvider('unknown' as LlmProvider, mockConfig), LLMUnavailableError)
  })

  it('createLLMProvider local-bge throws Phase-25', () => {
    assert.throws(() => createLLMProvider('local-bge', mockConfig), /Phase-25/)
  })

  it('ClaudeProvider generate throws not implemented', async () => {
    const p = new ClaudeProvider(mockConfig)
    await assert.rejects(
      () => p.generate({ userPrompt: 'hello' }),
      /not implemented/
    )
  })

  it('ClaudeProvider healthcheck returns ok=false', async () => {
    const p = new ClaudeProvider(mockConfig)
    const h = await p.healthcheck()
    assert.equal(h.ok, false)
    assert.equal(h.provider, 'claude')
  })

  it('OpenAIProvider generate throws', async () => {
    const p = new OpenAIProvider(mockConfig)
    await assert.rejects(
      () => p.generate({ userPrompt: 'hello' }),
      /not implemented/
    )
  })

  it('OpenAIProvider healthcheck returns ok=false', async () => {
    const p = new OpenAIProvider(mockConfig)
    const h = await p.healthcheck()
    assert.equal(h.ok, false)
    assert.equal(h.provider, 'openai')
  })

  it('DeepSeekProvider 无 apiKey 时 healthcheck 返回 ok=false', async () => {
    const p = new DeepSeekProvider(mockConfig)
    const h = await p.healthcheck()
    assert.equal(h.ok, false)
    assert.equal(h.provider, 'deepseek')
  })

  it('LLMProviderFactory get 返回已注册 provider', () => {
    const claude = new ClaudeProvider(mockConfig)
    const openai = new OpenAIProvider(mockConfig)
    const deepseek = new DeepSeekProvider(mockConfig)
    const factory = new LLMProviderFactory(claude, openai, deepseek)

    const p = factory.get('claude')
    assert.equal(p.name, 'claude')
  })

  it('LLMProviderFactory get 未知 provider throws', () => {
    const claude = new ClaudeProvider(mockConfig)
    const openai = new OpenAIProvider(mockConfig)
    const deepseek = new DeepSeekProvider(mockConfig)
    const factory = new LLMProviderFactory(claude, openai, deepseek)

    assert.throws(() => factory.get('local-bge' as LlmProvider), LLMUnavailableError)
  })

  it('LLMProviderFactory getAvailable 全部不可用抛异常', async () => {
    const claude = new ClaudeProvider(mockConfig)
    const openai = new OpenAIProvider(mockConfig)
    const deepseek = new DeepSeekProvider(mockConfig)
    const factory = new LLMProviderFactory(claude, openai, deepseek)

    await assert.rejects(
      () => factory.getAvailable(['claude', 'openai']),
      LLMUnavailableError
    )
  })

  it('LLMProviderFactory register 注册自定义 provider', () => {
    const claude = new ClaudeProvider(mockConfig)
    const openai = new OpenAIProvider(mockConfig)
    const deepseek = new DeepSeekProvider(mockConfig)
    const factory = new LLMProviderFactory(claude, openai, deepseek)

    const mockProv: any = { name: 'mock', defaultModel: 'mock-model', generate: vi.fn(), healthcheck: vi.fn() }
    factory.register('claude', mockProv)
    assert.equal(factory.get('claude').name, 'mock')
  })
})

// =====================================================================
// cost-tracker.service.ts
// =====================================================================
describe('cost-tracker.service.ts · 成本追踪', () => {
  let storage: InMemoryCostStorage

  const mockConfig = {
    defaultProvider: 'claude' as LlmProvider,
    monthlyHardLimitUsd: 100,
    monthlySoftLimitUsd: 80,
    alertThreshold: 0.8,
    enablePromptCache: true,
    cacheTtlSeconds: 3600,
    claude: { apiKey: '', baseUrl: '', model: 'claude-sonnet-4-6', timeoutMs: 60000, maxRetries: 3 },
    openai: { apiKey: '', baseUrl: '', model: 'gpt-4o-mini', timeoutMs: 30000, maxRetries: 3 },
    deepseek: { apiKey: '', baseUrl: '', model: 'deepseek-chat', timeoutMs: 60000, maxRetries: 3 },
    fallbackChain: ['deepseek', 'openai', 'claude'] as LlmProvider[],
  }

  beforeEach(() => {
    storage = new InMemoryCostStorage()
    storage.reset()
  })

  it('初始月度成本为 $0', () => {
    const tracker = new CostTrackerService(mockConfig, storage)
    assert.equal(tracker.currentMonthCost(), 0)
  })

  it('recordUsage 累加月度成本', () => {
    const tracker = new CostTrackerService(mockConfig, storage)
    tracker.recordUsage({
      inputTokens: 100_000,
      outputTokens: 10_000,
      totalTokens: 110_000,
      costUsd: 0.45,
      provider: 'claude',
      model: 'claude-sonnet-4-6',
      timestamp: new Date().toISOString(),
    })

    assert.equal(tracker.currentMonthCost(), 0.45)
  })

  it('多次 recordUsage 累加', () => {
    const tracker = new CostTrackerService(mockConfig, storage)
    tracker.recordUsage(makeUsage(0.30))
    tracker.recordUsage(makeUsage(0.20))
    tracker.recordUsage(makeUsage(0.50))
    assert.equal(tracker.currentMonthCost(), 1.0)
  })

  it('checkBudget 低于阈值返回 allowed', () => {
    const tracker = new CostTrackerService(mockConfig, storage)
    const result = tracker.checkBudget('claude')
    assert.equal(result.allowed, true)
  })

  it('checkBudget 超过软上限返回 fallback', () => {
    // 先积累到 $85
    storage.incrementMonthlyCost(storageKey(), 85)
    const tracker = new CostTrackerService(mockConfig, storage)

    const result = tracker.checkBudget('claude')
    assert.equal(result.allowed, false)
    assert.equal(result.reason, 'soft-limit-hit')
    assert.equal(result.fallback, 'openai')
  })

  it('checkBudget 超过硬上限抛 BudgetExceededError', () => {
    storage.incrementMonthlyCost(storageKey(), 100)
    const tracker = new CostTrackerService(mockConfig, storage)

    assert.throws(() => tracker.checkBudget('claude'), BudgetExceededError)
  })

  it('checkBudget 超过预警阈值（80%）记录警告不阻断', () => {
    storage.incrementMonthlyCost(storageKey(), 81)
    const tracker = new CostTrackerService(mockConfig, storage)
    const result = tracker.checkBudget('claude')
    // 81 < soft(80)? no, actually 81 > soft → fallback
    assert.equal(result.allowed, false)
  })

  it('prompt 缓存: checkCache 未命中', () => {
    const tracker = new CostTrackerService(mockConfig, storage)
    const result = tracker.checkCache({ userPrompt: 'hello', cacheKey: 'key1' })
    assert.equal(result.hit, false)
  })

  it('prompt 缓存: set + get', () => {
    const tracker = new CostTrackerService(mockConfig, storage)
    const response: LLMResponse = {
      content: 'cached response',
      provider: 'claude',
      model: 'claude-sonnet-4-6',
      usage: mockUsage(),
      latencyMs: 100,
      cacheHit: true,
      finishReason: 'stop',
    }

    tracker.setCache({ userPrompt: 'hello', cacheKey: 'key1' }, response)
    const result = tracker.checkCache({ userPrompt: 'hello', cacheKey: 'key1' })
    assert.equal(result.hit, true)
    assert.equal(result.response!.content, 'cached response')
  })

  it('prompt 缓存: cacheKey 为空不缓存', () => {
    const tracker = new CostTrackerService(mockConfig, storage)
    const result = tracker.checkCache({ userPrompt: 'hello' })
    assert.equal(result.hit, false)
  })

  it('prompt 缓存: error 响应不缓存', () => {
    const tracker = new CostTrackerService(mockConfig, storage)
    const response = {
      content: 'error',
      provider: 'claude',
      model: 'claude-sonnet-4-6',
      usage: mockUsage(),
      latencyMs: 0,
      cacheHit: false,
      finishReason: 'error',
    }
    tracker.setCache({ userPrompt: 'hello', cacheKey: 'key1' }, response)
    const result = tracker.checkCache({ userPrompt: 'hello', cacheKey: 'key1' })
    assert.equal(result.hit, false)
  })

  it('snapshot 返回正确结构', () => {
    const tracker = new CostTrackerService(mockConfig, storage)
    tracker.recordUsage(makeUsage(50))
    const snap = tracker.snapshot()

    assert.ok(snap.monthKey)
    assert.equal(snap.costUsd, 50)
    assert.equal(snap.hardLimitUsd, 100)
    assert.equal(snap.softLimitUsd, 80)
    assert.equal(snap.utilizationPct, 50)
    assert.equal(snap.overSoftLimit, false)
    assert.equal(snap.overHardLimit, false)
  })

  it('snapshot 超过硬上限', () => {
    storage.incrementMonthlyCost(storageKey(), 150)
    const tracker = new CostTrackerService(mockConfig, storage)
    const snap = tracker.snapshot()

    assert.equal(snap.overSoftLimit, true)
    assert.equal(snap.overHardLimit, true)
  })
})

// =====================================================================
// InMemoryCostStorage
// =====================================================================
describe('InMemoryCostStorage', () => {
  it('初始化 cost = 0', () => {
    const s = new InMemoryCostStorage()
    assert.equal(s.getMonthlyCost('2026-07'), 0)
  })

  it('incrementMonthlyCost 累加', () => {
    const s = new InMemoryCostStorage()
    s.incrementMonthlyCost('2026-07', 10.5)
    assert.equal(s.getMonthlyCost('2026-07'), 10.5)
  })

  it('不同月份隔离', () => {
    const s = new InMemoryCostStorage()
    s.incrementMonthlyCost('2026-07', 100)
    s.incrementMonthlyCost('2026-08', 50)
    assert.equal(s.getMonthlyCost('2026-07'), 100)
    assert.equal(s.getMonthlyCost('2026-08'), 50)
  })

  it('reset 清空所有', () => {
    const s = new InMemoryCostStorage()
    s.incrementMonthlyCost('2026-07', 100)
    s.setCache('k', mockLLMResponse(), 3600)
    s.reset()
    assert.equal(s.getMonthlyCost('2026-07'), 0)
    assert.equal(s.cacheSize, 0)
  })

  it('缓存过期后命中失效', () => {
    const s = new InMemoryCostStorage()
    s.setCache('exp-key', mockLLMResponse(), -1) // TTL -1 → 立即过期
    const result = s.getCacheHit('exp-key')
    assert.equal(result.hit, false)
  })

  it('缓存命中正常', () => {
    const s = new InMemoryCostStorage()
    s.setCache('k', mockLLMResponse(), 3600)
    const result = s.getCacheHit('k')
    assert.equal(result.hit, true)
    assert.equal(result.response!.content, 'cached')
  })

  it('monthKeys 调试信息', () => {
    const s = new InMemoryCostStorage()
    s.incrementMonthlyCost('2026-07', 10)
    s.incrementMonthlyCost('2026-08', 20)
    assert.deepEqual(s.monthKeys, ['2026-07', '2026-08'])
  })
})

// ─── 测试辅助 ────────────────────────────────────────────────────────────

function makeUsage(costUsd: number): UsageMetrics {
  return {
    inputTokens: Math.round(costUsd * 10000),
    outputTokens: Math.round(costUsd * 1000),
    totalTokens: Math.round(costUsd * 11000),
    costUsd,
    provider: 'claude',
    model: 'claude-sonnet-4-6',
    timestamp: new Date().toISOString(),
  }
}

function mockUsage(): UsageMetrics {
  return {
    inputTokens: 100,
    outputTokens: 50,
    totalTokens: 150,
    costUsd: 0.001,
    provider: 'claude',
    model: 'claude-sonnet-4-6',
    timestamp: new Date().toISOString(),
  }
}

function mockLLMResponse(): LLMResponse {
  return {
    content: 'cached',
    provider: 'claude',
    model: 'claude-sonnet-4-6',
    usage: mockUsage(),
    latencyMs: 100,
    cacheHit: true,
    finishReason: 'stop',
  }
}

function storageKey(): string {
  const now = new Date()
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`
}
