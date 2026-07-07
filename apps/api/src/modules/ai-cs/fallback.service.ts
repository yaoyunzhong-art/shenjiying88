import { Injectable, Logger } from '@nestjs/common'
import { OpenAIProvider } from './providers/openai.provider'
import { DeepSeekProvider } from './providers/deepseek.provider'
import { MockProvider } from './providers/mock.provider'
import type { AIProvider, AIProviderRequest, AIProviderResponse, ProviderType } from './ai-cs.entity'

/**
 * Phase-41 T171: FallbackService (Provider 降级 + 重试)
 *
 * DR-41-A: Provider 主备切换
 *  - OpenAI (priority=1) 优先
 *  - DeepSeek (priority=2) 降级
 *  - Mock (priority=99) 兜底
 *
 * 反模式 v4 ai-provider-fallback-pattern:
 *  - 主 provider 失败 → 切换备用
 *  - 全部失败 → Mock 兜底回复
 *  - 限流检测 → 自动切换
 *  - 超时控制 (5s)
 */

@Injectable()
export class FallbackService {
  private readonly logger = new Logger(FallbackService.name)
  private readonly TIMEOUT_MS = 5_000
  private readonly MAX_RETRIES = 2

  private providers: AIProvider[]

  constructor(
    private readonly openai: OpenAIProvider,
    private readonly deepseek: DeepSeekProvider,
    private readonly mock: MockProvider
  ) {
    this.providers = [openai, deepseek, mock].sort((a, b) => a.priority - b.priority)
  }

  /**
   * 主入口: 尝试主 Provider, 失败时降级
   */
  async complete(req: AIProviderRequest): Promise<AIProviderResponse> {
    const errors: Array<{ provider: ProviderType; error: string }> = []

    for (const provider of this.providers) {
      const available = await this.tryWithTimeout(() => provider.isAvailable())
      if (!available) {
        errors.push({ provider: provider.name, error: 'not available' })
        continue
      }

      for (let attempt = 0; attempt < this.MAX_RETRIES; attempt++) {
        try {
          const result = await this.tryWithTimeout(
            () => provider.complete(req),
            this.TIMEOUT_MS
          )
          if (attempt > 0) {
            this.logger.warn(`${provider.name} succeeded after ${attempt} retries`)
          }
          if (errors.length > 0) {
            this.logger.warn(`Fallback from ${errors.map(e => e.provider).join('->')} to ${provider.name}`)
          }
          return result
        } catch (e: any) {
          errors.push({ provider: provider.name, error: e.message })
          if (attempt === this.MAX_RETRIES - 1) break
        }
      }
    }

    // 所有 Provider 都失败 (理论上 Mock 兜底)
    throw new Error(`All providers failed: ${JSON.stringify(errors)}`)
  }

  /**
   * 列出可用 Provider (健康状态)
   */
  async listAvailable(): Promise<Array<{ name: ProviderType; priority: number; available: boolean }>> {
    const results = []
    for (const p of this.providers) {
      const available = await this.tryWithTimeout(() => p.isAvailable(), 1000)
      results.push({ name: p.name, priority: p.priority, available })
    }
    return results
  }

  /**
   * 超时控制
   */
  private async tryWithTimeout<T>(fn: () => Promise<T>, timeoutMs: number = this.TIMEOUT_MS): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs)
      fn().then(
        v => { clearTimeout(timer); resolve(v) },
        e => { clearTimeout(timer); reject(e) }
      )
    })
  }
}