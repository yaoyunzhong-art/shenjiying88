/**
 * llm.provider.ts · LLM Provider 抽象 + 工厂 (Phase-19)
 *
 * 设计依据:
 *   - knowledge/decision-records/DR-005-rag-architecture.md
 *   - debt.md TD-001 / TD-002
 *
 * 抽象 ILLMProvider:
 *   - generate(): 单次生成
 *   - generateStream(): 流式生成 (Phase-22)
 *   - healthcheck(): 可用性 + quota 查询
 *
 * 工厂:
 *   - createLLMProvider(provider): 返回对应实现
 *   - 当前支持: ClaudeProvider (主) + OpenAIProvider (fallback)
 */

import { Inject, Injectable, Logger } from '@nestjs/common'
import { ConfigType } from '@nestjs/config'
import { llmConfig } from './llm.config'
import { LLMUnavailableError, type LLMRequest, type LLMResponse } from './types'
import type { LlmProvider } from '../../retrieval/retrieval.types'

export type { LlmProvider } from '../../retrieval/retrieval.types'

// ─── 抽象接口 ──────────────────────────────────────────────────────────

export interface ILLMProvider {
  /** Provider 名 */
  readonly name: LlmProvider
  /** 默认模型 */
  readonly defaultModel: string

  /**
   * 单次生成
   *
   * 实现要点:
   *   - 重试 (maxRetries)
   *   - 超时 (timeoutMs)
   *   - 错误分类 (quota / rate limit / content filter)
   */
  generate(request: LLMRequest, options?: { signal?: AbortSignal }): Promise<LLMResponse>

  /**
   * 流式生成 (Phase-22)
   */
  generateStream?(
    request: LLMRequest,
    options?: { signal?: AbortSignal }
  ): AsyncIterable<string>

  /**
   * 健康检查
   */
  healthcheck(): Promise<{ ok: boolean; provider: LlmProvider; latencyMs: number }>
}

// ─── Claude Provider (主选) ─────────────────────────────────────────────

@Injectable()
export class ClaudeProvider implements ILLMProvider {
  readonly name: LlmProvider = 'claude'
  readonly defaultModel: string

  private readonly logger = new Logger(ClaudeProvider.name)

  constructor(@Inject(llmConfig.KEY) private readonly cfg: ConfigType<typeof llmConfig>) {
    this.defaultModel = cfg.claude.model
  }

  async generate(request: LLMRequest, options?: { signal?: AbortSignal }): Promise<LLMResponse> {
    // TODO[Pulse-73]: 真实实现
    //   import Anthropic from '@anthropic-ai/sdk'
    //   const client = new Anthropic({ apiKey: this.cfg.claude.apiKey })
    //   const start = Date.now()
    //   const res = await client.messages.create({
    //     model: request.model ?? this.defaultModel,
    //     max_tokens: request.maxOutputTokens ?? 4096,
    //     temperature: request.temperature ?? 0.3,
    //     system: request.systemPrompt,
    //     messages: [{ role: 'user', content: request.userPrompt }],
    //   }, { signal: options?.signal, timeout: this.cfg.claude.timeoutMs })
    //
    //   const inputTokens = res.usage.input_tokens
    //   const outputTokens = res.usage.output_tokens
    //   const cost = calculateCost('claude', this.defaultModel, inputTokens, outputTokens)
    //
    //   return {
    //     content: res.content[0].type === 'text' ? res.content[0].text : '',
    //     provider: 'claude',
    //     model: this.defaultModel,
    //     usage: { inputTokens, outputTokens, totalTokens: inputTokens + outputTokens, costUsd: cost, provider: 'claude', model: this.defaultModel, timestamp: new Date().toISOString() },
    //     latencyMs: Date.now() - start,
    //     cacheHit: false,
    //     finishReason: res.stop_reason === 'end_turn' ? 'stop' : 'length',
    //   }

    this.logger.warn('[ClaudeProvider] generate not implemented — Pulse-73 skeleton')
    throw new LLMUnavailableError('claude', 'not implemented (Pulse-73 skeleton)')
  }

  async healthcheck(): Promise<{ ok: boolean; provider: LlmProvider; latencyMs: number }> {
    const start = Date.now()
    // TODO[Pulse-73]: try generate minimal request
    return { ok: false, provider: 'claude', latencyMs: Date.now() - start }
  }
}

// ─── DeepSeek Provider (国内主选) ──────────────────────────────────────

@Injectable()
export class DeepSeekProvider implements ILLMProvider {
  readonly name: LlmProvider = 'deepseek'
  readonly defaultModel: string

  private readonly logger = new Logger(DeepSeekProvider.name)

  constructor(@Inject(llmConfig.KEY) private readonly cfg: ConfigType<typeof llmConfig>) {
    this.defaultModel = cfg.deepseek.model
  }

  async generate(request: LLMRequest, options?: { signal?: AbortSignal }): Promise<LLMResponse> {
    // DeepSeek API 兼容 OpenAI 接口格式
    // TODO: 生产环境替换为真实调用
    //   const res = await fetch(`${this.cfg.deepseek.baseUrl}/chat/completions`, {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.cfg.deepseek.apiKey}` },
    //     body: JSON.stringify({
    //       model: request.model ?? this.defaultModel,
    //       messages: [...],
    //       max_tokens: request.maxOutputTokens ?? 4096,
    //       temperature: request.temperature ?? 0.3,
    //     }),
    //     signal: options?.signal,
    //   })

    this.logger.warn('[DeepSeekProvider] generate not implemented — skeleton')
    throw new LLMUnavailableError('deepseek', 'not implemented (skeleton)')
  }

  async healthcheck(): Promise<{ ok: boolean; provider: LlmProvider; latencyMs: number }> {
    const start = Date.now()
    try {
      if (!this.cfg.deepseek.apiKey) return { ok: false, provider: 'deepseek', latencyMs: Date.now() - start }
      const res = await fetch(`${this.cfg.deepseek.baseUrl}/models`, {
        headers: { Authorization: `Bearer ${this.cfg.deepseek.apiKey}` },
        signal: AbortSignal.timeout(5000),
      })
      return { ok: res.ok, provider: 'deepseek', latencyMs: Date.now() - start }
    } catch {
      return { ok: false, provider: 'deepseek', latencyMs: Date.now() - start }
    }
  }
}

// ─── OpenAI Provider (Fallback) ─────────────────────────────────────────

@Injectable()
export class OpenAIProvider implements ILLMProvider {
  readonly name: LlmProvider = 'openai'
  readonly defaultModel: string

  private readonly logger = new Logger(OpenAIProvider.name)

  constructor(@Inject(llmConfig.KEY) private readonly cfg: ConfigType<typeof llmConfig>) {
    this.defaultModel = cfg.openai.model
  }

  async generate(request: LLMRequest, options?: { signal?: AbortSignal }): Promise<LLMResponse> {
    // TODO[Pulse-73]:
    //   import OpenAI from 'openai'
    //   const client = new OpenAI({ apiKey: this.cfg.openai.apiKey })
    //   const start = Date.now()
    //   const messages = []
    //   if (request.systemPrompt) messages.push({ role: 'system', content: request.systemPrompt })
    //   messages.push({ role: 'user', content: request.userPrompt })
    //   const res = await client.chat.completions.create({
    //     model: request.model ?? this.defaultModel,
    //     messages,
    //     max_tokens: request.maxOutputTokens ?? 4096,
    //     temperature: request.temperature ?? 0.3,
    //   }, { signal: options?.signal, timeout: this.cfg.openai.timeoutMs })
    //
    //   const content = res.choices[0].message.content ?? ''
    //   const inputTokens = res.usage?.prompt_tokens ?? 0
    //   const outputTokens = res.usage?.completion_tokens ?? 0
    //   const cost = calculateCost('openai', this.defaultModel, inputTokens, outputTokens)
    //
    //   return { ... }

    this.logger.warn('[OpenAIProvider] generate not implemented — Pulse-73 skeleton')
    throw new LLMUnavailableError('openai', 'not implemented (Pulse-73 skeleton)')
  }

  async healthcheck(): Promise<{ ok: boolean; provider: LlmProvider; latencyMs: number }> {
    const start = Date.now()
    return { ok: false, provider: 'openai', latencyMs: Date.now() - start }
  }
}

// ─── Provider 工厂 ─────────────────────────────────────────────────────

/**
 * Provider 工厂:根据 provider 名返回对应实例
 *
 * 当前仅返回 ClaudeProvider / OpenAIProvider 实例化对象。
 * ⚠️  实际注入请通过 NestJS DI (LLMProviderFactory.providers map)
 */
export function createLLMProvider(
  name: LlmProvider,
  cfg: ConfigType<typeof llmConfig>
): ILLMProvider {
  switch (name) {
    case 'claude':
      return new ClaudeProvider(cfg)
    case 'openai':
      return new OpenAIProvider(cfg)
    case 'local-bge':
      // Phase-25
      throw new LLMUnavailableError('local-bge', 'Phase-25 not enabled yet')
    default:
      throw new LLMUnavailableError(name, 'unknown provider')
  }
}

// ─── Provider 聚合 (NestJS DI 友好) ────────────────────────────────────

@Injectable()
export class LLMProviderFactory {
  private readonly providers: Map<string, ILLMProvider>

  constructor(
    @Inject(ClaudeProvider) private readonly claude: ClaudeProvider,
    @Inject(OpenAIProvider) private readonly openai: OpenAIProvider,
    @Inject(DeepSeekProvider) private readonly deepseek: DeepSeekProvider
  ) {
    this.providers = new Map<string, ILLMProvider>([
      [this.claude.name, this.claude],
      [this.openai.name, this.openai],
      [this.deepseek.name, this.deepseek],
    ])
  }

  /** 获取指定 provider */
  get(name: LlmProvider): ILLMProvider {
    const p = this.providers.get(name)
    if (!p) {
      throw new LLMUnavailableError(name, 'not registered')
    }
    return p
  }

  /** 按 fallback 链获取第一个可用的 */
  async getAvailable(chain: LlmProvider[]): Promise<ILLMProvider> {
    for (const name of chain) {
      const p = this.providers.get(name)
      if (!p) continue
      try {
        const h = await p.healthcheck()
        if (h.ok) return p
      } catch {
        // continue
      }
    }
    throw new LLMUnavailableError(chain[0] ?? 'claude', 'no provider available')
  }

  /** 注册自定义 provider (测试用) */
  register(name: LlmProvider, provider: ILLMProvider): void {
    this.providers.set(name, provider)
  }
}
