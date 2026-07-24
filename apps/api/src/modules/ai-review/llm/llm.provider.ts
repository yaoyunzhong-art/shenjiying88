import { Inject, Injectable, Logger } from '@nestjs/common'
import { ConfigType } from '@nestjs/config'
import { llmConfig } from './llm.config'
import { type LLMRequest, type LLMResponse } from './types'
import { LLMUnavailableError } from './types'
import type { LlmProvider } from '../../retrieval/retrieval.types'

export type { LlmProvider } from '../../retrieval/retrieval.types'

export interface ILLMProvider {
  readonly name: LlmProvider
  readonly defaultModel: string
  generate(request: LLMRequest, options?: { signal?: AbortSignal }): Promise<LLMResponse>
  healthcheck(): Promise<{ ok: boolean; provider: LlmProvider; latencyMs: number }>
}

@Injectable()
export class ClaudeProvider implements ILLMProvider {
  readonly name: LlmProvider = 'claude'
  readonly defaultModel: string
  private readonly logger = new Logger(ClaudeProvider.name)

  constructor(@Inject(llmConfig.KEY) private readonly cfg: ConfigType<typeof llmConfig>) {
    this.defaultModel = cfg.claude.model
  }

  async generate(request: LLMRequest, _options?: { signal?: AbortSignal }): Promise<LLMResponse> {
    this.logger.debug(`[Claude] generate: ${request.systemPrompt?.slice(0, 50)}...`)
    return {
      content: JSON.stringify({ result: 'noop', provider: 'claude' }),
      provider: 'claude',
      model: request.model ?? this.defaultModel,
      usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0, costUsd: 0, provider: 'claude', model: this.defaultModel, timestamp: new Date().toISOString() },
      latencyMs: 0,
      cacheHit: false,
      finishReason: 'stop',
    }
  }

  async healthcheck(): Promise<{ ok: boolean; provider: LlmProvider; latencyMs: number }> {
    return { ok: false, provider: 'claude', latencyMs: 0 }
  }
}

@Injectable()
export class DeepSeekProvider implements ILLMProvider {
  readonly name: LlmProvider = 'deepseek'
  readonly defaultModel: string
  private readonly logger = new Logger(DeepSeekProvider.name)

  constructor(@Inject(llmConfig.KEY) private readonly cfg: ConfigType<typeof llmConfig>) {
    this.defaultModel = cfg.deepseek.model
  }

  async generate(request: LLMRequest, _options?: { signal?: AbortSignal }): Promise<LLMResponse> {
    if (this.cfg.deepseek.apiKey) {
      try {
        const start = Date.now()
        const res = await fetch(`${this.cfg.deepseek.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.cfg.deepseek.apiKey}` },
          body: JSON.stringify({
            model: request.model ?? this.defaultModel,
            messages: [
              ...(request.systemPrompt ? [{ role: 'system', content: request.systemPrompt }] : []),
              { role: 'user', content: request.userPrompt },
            ],
            max_tokens: request.maxOutputTokens ?? 4096,
            temperature: request.temperature ?? 0.3,
          }),
          signal: AbortSignal.timeout(30000),
        })
        if (res.ok) {
          const data = await res.json() as any
          return {
            content: data.choices?.[0]?.message?.content ?? '',
            provider: 'deepseek',
            model: request.model ?? this.defaultModel,
            usage: { inputTokens: data.usage?.prompt_tokens ?? 0, outputTokens: data.usage?.completion_tokens ?? 0, totalTokens: data.usage?.total_tokens ?? 0, costUsd: 0, provider: 'deepseek', model: this.defaultModel, timestamp: new Date().toISOString() },
            latencyMs: Date.now() - start,
            cacheHit: false,
            finishReason: 'stop',
          }
        }
      } catch (err) {
        this.logger.warn(`[DeepSeek] API call failed, fallback to noop: ${err}`)
      }
    }
    return {
      content: JSON.stringify({ result: 'noop', provider: 'deepseek_no_key' }),
      provider: 'deepseek',
      model: request.model ?? this.defaultModel,
      usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0, costUsd: 0, provider: 'deepseek', model: this.defaultModel, timestamp: new Date().toISOString() },
      latencyMs: 0,
      cacheHit: false,
      finishReason: 'stop',
    }
  }

  async healthcheck(): Promise<{ ok: boolean; provider: LlmProvider; latencyMs: number }> {
    const start = Date.now()
    if (!this.cfg.deepseek.apiKey) return { ok: false, provider: 'deepseek', latencyMs: Date.now() - start }
    try {
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

@Injectable()
export class OpenAIProvider implements ILLMProvider {
  readonly name: LlmProvider = 'openai'
  readonly defaultModel: string
  private readonly logger = new Logger(OpenAIProvider.name)

  constructor(@Inject(llmConfig.KEY) private readonly cfg: ConfigType<typeof llmConfig>) {
    this.defaultModel = cfg.openai.model
  }

  async generate(request: LLMRequest, _options?: { signal?: AbortSignal }): Promise<LLMResponse> {
    this.logger.debug(`[OpenAI] generate noop`)
    return {
      content: JSON.stringify({ result: 'noop', provider: 'openai' }),
      provider: 'openai',
      model: request.model ?? this.defaultModel,
      usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0, costUsd: 0, provider: 'openai', model: this.defaultModel, timestamp: new Date().toISOString() },
      latencyMs: 0,
      cacheHit: false,
      finishReason: 'stop',
    }
  }

  async healthcheck(): Promise<{ ok: boolean; provider: LlmProvider; latencyMs: number }> {
    return { ok: false, provider: 'openai', latencyMs: 0 }
  }
}

export function createLLMProvider(name: LlmProvider, cfg: ConfigType<typeof llmConfig>): ILLMProvider {
  switch (name) {
    case 'claude': return new ClaudeProvider(cfg)
    case 'openai': return new OpenAIProvider(cfg)
    case 'deepseek': return new DeepSeekProvider(cfg)
    default: throw new LLMUnavailableError(name, 'unknown provider')
  }
}

@Injectable()
export class LLMProviderFactory {
  private readonly providers: Map<string, any>

  constructor(
    @Inject(ClaudeProvider) private readonly claude: ClaudeProvider,
    @Inject(OpenAIProvider) private readonly openai: OpenAIProvider,
    @Inject(DeepSeekProvider) private readonly deepseek: DeepSeekProvider
  ) {
    this.providers = new Map<any, any>([
      [this.claude.name, this.claude],
      [this.openai.name, this.openai],
      [this.deepseek.name, this.deepseek],
    ])
  }

  get(name: LlmProvider): ILLMProvider {
    const p = this.providers.get(name)
    if (!p) throw new LLMUnavailableError(name, 'not registered')
    return p
  }

  async getAvailable(chain: LlmProvider[]): Promise<ILLMProvider> {
    for (const name of chain) {
      const p = this.providers.get(name)
      if (!p) continue
      try { const h = await p.healthcheck(); if (h.ok) return p } catch {}
    }
    throw new LLMUnavailableError(chain[0] ?? 'claude', 'no provider available')
  }

  register(name: LlmProvider, provider: ILLMProvider): void {
    this.providers.set(name, provider)
  }
}
