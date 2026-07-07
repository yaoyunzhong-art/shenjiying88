/**
 * llm.config.ts · LLM Provider 配置 (Phase-19)
 *
 * 设计依据:
 *   - debt.md TD-001 (LLM API 成本控制)
 *   - knowledge/decision-records/DR-005-rag-architecture.md
 *
 * ⚠️  敏感字段 (apiKey) 必须从环境变量注入,不进 git:
 *   - LLM_CLAUDE_API_KEY
 *   - LLM_OPENAI_API_KEY
 */

import { registerAs } from '@nestjs/config'
import type { LlmProvider } from '../../retrieval/retrieval.types'

export type { LlmProvider } from '../../retrieval/retrieval.types'

export interface LLMConfig {
  /** 默认 provider */
  defaultProvider: LlmProvider
  /** 月度预算 (USD) */
  monthlyHardLimitUsd: number
  monthlySoftLimitUsd: number
  /** 预警阈值 */
  alertThreshold: number
  /** 启用 prompt 缓存 */
  enablePromptCache: boolean
  /** Cache TTL (秒) */
  cacheTtlSeconds: number
  /** Claude 配置 */
  claude: {
    apiKey: string
    baseUrl: string
    model: string
    timeoutMs: number
    maxRetries: number
  }
  /** OpenAI 配置 */
  openai: {
    apiKey: string
    baseUrl: string
    model: string
    timeoutMs: number
    maxRetries: number
  }
  /** DeepSeek 配置 (国内可用) */
  deepseek: {
    apiKey: string
    baseUrl: string
    model: string
    timeoutMs: number
    maxRetries: number
  }
  /** Fallback 链 (按成本从低到高) */
  fallbackChain: LlmProvider[]
}

export const llmConfig = registerAs<LLMConfig>('llm', () => ({
  defaultProvider: (process.env.LLM_DEFAULT_PROVIDER as LlmProvider) ?? 'claude',
  monthlyHardLimitUsd: Number(process.env.LLM_MONTHLY_HARD_LIMIT_USD ?? 1000),
  monthlySoftLimitUsd: Number(process.env.LLM_MONTHLY_SOFT_LIMIT_USD ?? 800),
  alertThreshold: Number(process.env.LLM_ALERT_THRESHOLD ?? 0.8),
  enablePromptCache: process.env.LLM_ENABLE_PROMPT_CACHE !== 'false',
  cacheTtlSeconds: Number(process.env.LLM_CACHE_TTL_SECONDS ?? 86400), // 24h

  claude: {
    apiKey: process.env.LLM_CLAUDE_API_KEY ?? '',
    baseUrl: process.env.LLM_CLAUDE_BASE_URL ?? 'https://api.anthropic.com',
    model: process.env.LLM_CLAUDE_MODEL ?? 'claude-sonnet-4-6',
    timeoutMs: Number(process.env.LLM_CLAUDE_TIMEOUT_MS ?? 60000),
    maxRetries: Number(process.env.LLM_CLAUDE_MAX_RETRIES ?? 3),
  },
  openai: {
    apiKey: process.env.LLM_OPENAI_API_KEY ?? '',
    baseUrl: process.env.LLM_OPENAI_BASE_URL ?? 'https://api.openai.com/v1',
    model: process.env.LLM_OPENAI_MODEL ?? 'gpt-4o-mini',
    timeoutMs: Number(process.env.LLM_OPENAI_TIMEOUT_MS ?? 30000),
    maxRetries: Number(process.env.LLM_OPENAI_MAX_RETRIES ?? 3),
  },
  deepseek: {
    apiKey: process.env.LLM_DEEPSEEK_API_KEY ?? '',
    baseUrl: process.env.LLM_DEEPSEEK_BASE_URL ?? 'https://api.deepseek.com/v1',
    model: process.env.LLM_DEEPSEEK_MODEL ?? 'deepseek-chat',
    timeoutMs: Number(process.env.LLM_DEEPSEEK_TIMEOUT_MS ?? 60000),
    maxRetries: Number(process.env.LLM_DEEPSEEK_MAX_RETRIES ?? 3),
  },
  fallbackChain: (process.env.LLM_FALLBACK_CHAIN ?? 'deepseek,openai,claude').split(',') as LlmProvider[],
}))
