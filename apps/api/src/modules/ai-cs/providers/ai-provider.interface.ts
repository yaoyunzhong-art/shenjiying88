import type { AIProvider, AIProviderRequest, AIProviderResponse } from '../ai-cs.entity'

/**
 * Phase-41 T171: AIProvider 抽象接口
 *
 * 反模式 v4 ai-provider-fallback-pattern:
 *  - Provider 必须实现 isAvailable() 用于 fallback 决策
 *  - complete() 返回 confidence 用于触发转人工
 */

export interface ProviderHealthCheck {
  available: boolean
  latencyMs?: number
  errorMessage?: string
  rateLimited?: boolean
}

export abstract class BaseAIProvider implements AIProvider {
  abstract readonly name: 'openai' | 'deepseek' | 'mock' | 'fallback'
  abstract readonly priority: number

  abstract isAvailable(): Promise<boolean>
  abstract complete(req: AIProviderRequest): Promise<AIProviderResponse>

  protected buildResponse(
    content: string,
    provider: 'openai' | 'deepseek' | 'mock' | 'fallback',
    startTime: number,
    tokensUsed: number,
    confidence: number,
    cached: boolean = false
  ): AIProviderResponse {
    return {
      content,
      provider,
      tokensUsed,
      latencyMs: Date.now() - startTime,
      cached,
      confidence,
      finishReason: 'stop'
    }
  }
}