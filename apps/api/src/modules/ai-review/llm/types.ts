/**
 * llm/types.ts · LLM Provider 类型定义 (Phase-19)
 *
 * 设计依据:
 *   - knowledge/decision-records/DR-005-rag-architecture.md §3.2
 *   - debt.md TD-001 (LLM API 成本控制)
 *   - debt.md TD-002 (AI Review 准确率阈值)
 *
 * 核心抽象:
 *   - LLMProvider: provider 抽象接口
 *   - LLMRequest / LLMResponse: 请求响应
 *   - UsageMetrics: token + cost 计量
 *
 * 多 provider 支持:
 *   - claude: Claude Sonnet 4.6 (主选,中文友好)
 *   - openai: GPT-4o-mini (fallback,便宜)
 *   - local-bge: 本地 BGE (Phase-25 启用)
 */

import type { LlmProvider, EmbeddingProvider } from '../../retrieval/retrieval.types'

export type { LlmProvider, EmbeddingProvider } from '../../retrieval/retrieval.types'

// ─── 成本模型 (USD per 1M tokens) ───────────────────────────────────────

/**
 * 模型定价 (2026-06 行情)
 *
 * 字段:
 *   - input:  输入 token 单价
 *   - output: 输出 token 单价
 *
 * 来源:
 *   - Claude Sonnet 4.6: $3 / $15
 *   - GPT-4o-mini:       $0.15 / $0.60
 *   - text-embedding-3-large: $0.13 (embedding only)
 *
 * ⚠️  Phase-25 启用 local-bge 后,本地模型 embedding cost = 0
 */
export interface ModelPricing {
  inputPerMillion: number
  outputPerMillion: number
}

export const MODEL_PRICING: Record<LlmProvider, ModelPricing> = {
  claude: { inputPerMillion: 3.0, outputPerMillion: 15.0 },
  openai: { inputPerMillion: 0.15, outputPerMillion: 0.60 },
  deepseek: { inputPerMillion: 0.50, outputPerMillion: 2.0 },
  'local-bge': { inputPerMillion: 0, outputPerMillion: 0 },
}

export const EMBEDDING_PRICING: Record<EmbeddingProvider, number> = {
  'text-embedding-3-large': 0.13,
  'text-embedding-3-small': 0.02,
  'bge-large-zh-v1.5': 0, // 本地
}

// ─── LLM Request / Response ────────────────────────────────────────────

/**
 * LLM 调用请求
 */
export interface LLMRequest {
  /** 系统提示 (角色定义) */
  systemPrompt?: string
  /** 用户提示 (主输入) */
  userPrompt: string
  /** 期望最大输出 token 数 */
  maxOutputTokens?: number
  /** 温度 (0 = 确定性, 1 = 创造性) */
  temperature?: number
  /** Provider 覆盖 (默认走 config) */
  provider?: LlmProvider
  /** 模型名 (覆盖 provider 默认) */
  model?: string
  /** 缓存键 (命中则跳过 API 调用) */
  cacheKey?: string
  /** 元数据 (用于 cost tracking 报表) */
  metadata?: Record<string, string>
}

/**
 * LLM 调用响应
 */
export interface LLMResponse {
  /** 生成文本 */
  content: string
  /** 实际 provider */
  provider: LlmProvider
  /** 实际模型 */
  model: string
  /** 使用量统计 */
  usage: UsageMetrics
  /** 耗时 (ms) */
  latencyMs: number
  /** 是否命中缓存 */
  cacheHit: boolean
  /** 结束原因 */
  finishReason?: 'stop' | 'length' | 'content_filter' | 'error'
}

// ─── Usage / Cost 计量 ──────────────────────────────────────────────────

/**
 * 单次调用使用量
 */
export interface UsageMetrics {
  /** 输入 token */
  inputTokens: number
  /** 输出 token */
  outputTokens: number
  /** 总 token */
  totalTokens: number
  /** 实际成本 (USD) */
  costUsd: number
  /** Provider */
  provider: LlmProvider
  /** 模型名 */
  model: string
  /** 时间戳 */
  timestamp: string
}

/**
 * 计算单次调用成本
 */
export function calculateCost(
  provider: LlmProvider,
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = MODEL_PRICING[provider]
  if (!pricing) return 0
  const inputCost = (inputTokens / 1_000_000) * pricing.inputPerMillion
  const outputCost = (outputTokens / 1_000_000) * pricing.outputPerMillion
  return inputCost + outputCost
}

/**
 * 计算 embedding 成本
 */
export function calculateEmbeddingCost(provider: EmbeddingProvider, tokens: number): number {
  const price = EMBEDDING_PRICING[provider] ?? 0
  return (tokens / 1_000_000) * price
}

// ─── 月度预算 ──────────────────────────────────────────────────────────

/**
 * 月度预算配置 (TD-001 缓解)
 */
export interface MonthlyBudget {
  /** 月度硬上限 (USD),超过后直接拒绝 */
  hardLimitUsd: number
  /** 月度软上限 (USD),超过后告警 + 切换便宜模型 */
  softLimitUsd: number
  /** 预警阈值 (0~1),如 0.8 = 80% 时告警 */
  alertThreshold: number
  /** 是否启用 prompt 缓存 (≥60% 命中率) */
  enablePromptCache: boolean
  /** Fallback 模型 (预算耗尽时自动切换) */
  fallbackProvider: LlmProvider
}

/**
 * 默认月度预算 ($1000/月,符合 TD-001 起步值)
 */
export const DEFAULT_MONTHLY_BUDGET: MonthlyBudget = {
  hardLimitUsd: 1000,
  softLimitUsd: 800,
  alertThreshold: 0.8,
  enablePromptCache: true,
  fallbackProvider: 'openai', // 便宜模型
}

// ─── 异常类型 ──────────────────────────────────────────────────────────

/**
 * 预算超限异常
 */
export class BudgetExceededError extends Error {
  constructor(
    public readonly currentCostUsd: number,
    public readonly limitUsd: number
  ) {
    super(`LLM monthly budget exceeded: $${currentCostUsd.toFixed(2)} / $${limitUsd}`)
    this.name = 'BudgetExceededError'
  }
}

/**
 * Provider 不可用异常
 */
export class LLMUnavailableError extends Error {
  constructor(
    public readonly provider: LlmProvider,
    public readonly reason: string
  ) {
    super(`LLM provider ${provider} unavailable: ${reason}`)
    this.name = 'LLMUnavailableError'
  }
}
