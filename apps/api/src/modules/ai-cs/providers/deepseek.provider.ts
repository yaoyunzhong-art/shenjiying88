import { Injectable } from '@nestjs/common'
import { BaseAIProvider, ProviderHealthCheck } from './ai-provider.interface'
import type { AIProviderRequest, AIProviderResponse, ProviderType } from '../ai-cs.entity'

/**
 * Phase-41 T171: DeepSeekProvider
 *
 * DeepSeek 国内降本 (priority=2)
 *  - 与 OpenAI 同接口, 但价格低 10x
 *  - 触发场景: OpenAI 不可用 / 限流 / 海外延迟过高
 */

@Injectable()
export class DeepSeekProvider extends BaseAIProvider {
  readonly name: ProviderType = 'deepseek'
  readonly priority = 2  // 次优先级

  private requestCount = 0
  private windowStart = Date.now()
  private readonly RATE_LIMIT = 100  // 限流更宽松
  private readonly WINDOW_MS = 60_000
  private healthy = true

  async isAvailable(): Promise<boolean> {
    if (Date.now() - this.windowStart > this.WINDOW_MS) {
      this.requestCount = 0
      this.windowStart = Date.now()
    }
    if (this.requestCount >= this.RATE_LIMIT) return false
    return this.healthy
  }

  async healthCheck(): Promise<ProviderHealthCheck> {
    const start = Date.now()
    try {
      // 生产环境: const res = await fetch('https://api.deepseek.com/v1/models', ...)
      return { available: this.healthy, latencyMs: Date.now() - start }
    } catch (e: any) {
      this.healthy = false
      return { available: false, errorMessage: e.message }
    }
  }

  async complete(req: AIProviderRequest): Promise<AIProviderResponse> {
    if (!await this.isAvailable()) {
      throw new Error('DeepSeek rate limited or unhealthy')
    }
    this.requestCount++
    const start = Date.now()

    try {
      // 生产: 调用 DeepSeek API
      const lastUserMsg = [...req.messages].reverse().find(m => m.role === 'user')?.content ?? ''
      const content = this.generateMockResponse(lastUserMsg)
      const confidence = this.estimateConfidence(lastUserMsg)

      return this.buildResponse(content, 'deepseek', start, 90, confidence)
    } catch (e: any) {
      this.healthy = false
      throw new Error(`DeepSeek failed: ${e.message}`)
    }
  }

  private generateMockResponse(userMsg: string): string {
    if (userMsg.includes('订单') || userMsg.includes('order')) {
      return '【DeepSeek】订单处理中,详情请查看订单页。'
    }
    if (userMsg.includes('退') || userMsg.includes('refund')) {
      return '【DeepSeek】退款请在订单页提交,3 个工作日审核。'
    }
    return '【DeepSeek】您好,我是 AI 助手,请问需要什么帮助?'
  }

  private estimateConfidence(msg: string): number {
    if (msg.length < 20) return 0.82
    if (msg.length < 50) return 0.72
    return 0.60
  }

  __setHealthy(healthy: boolean): void { this.healthy = healthy }
  __resetRateLimit(): void { this.requestCount = 0; this.windowStart = Date.now() }
}