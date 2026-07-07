import { Injectable } from '@nestjs/common'
import { BaseAIProvider, ProviderHealthCheck } from './ai-provider.interface'
import type { AIProviderRequest, AIProviderResponse, ProviderType } from '../ai-cs.entity'

/**
 * Phase-41 T171: OpenAIProvider
 *
 * 调用 OpenAI GPT-4o-mini (生产)
 *  - isAvailable: 健康检查 (60 req/min 限流)
 *  - complete: chat completion API
 *
 * 反模式 v4: 失败时由 FallbackService 切换到 DeepSeek
 */

@Injectable()
export class OpenAIProvider extends BaseAIProvider {
  readonly name: ProviderType = 'openai'
  readonly priority = 1  // 最高优先级

  private requestCount = 0
  private windowStart = Date.now()
  private readonly RATE_LIMIT = 60  // req/min
  private readonly WINDOW_MS = 60_000
  private healthy = true

  async isAvailable(): Promise<boolean> {
    // 检查限流
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
      // 生产环境: const res = await fetch('https://api.openai.com/v1/models', ...)
      // 这里 mock
      return {
        available: this.healthy,
        latencyMs: Date.now() - start
      }
    } catch (e: any) {
      this.healthy = false
      return { available: false, errorMessage: e.message }
    }
  }

  async complete(req: AIProviderRequest): Promise<AIProviderResponse> {
    if (!await this.isAvailable()) {
      throw new Error('OpenAI rate limited or unhealthy')
    }
    this.requestCount++
    const start = Date.now()

    try {
      // 生产环境调用 OpenAI API
      // const res = await fetch('https://api.openai.com/v1/chat/completions', {...})
      // 这里返回 mock 内容 (基于用户消息生成简单回复)
      const lastUserMsg = [...req.messages].reverse().find(m => m.role === 'user')?.content ?? ''
      const content = this.generateMockResponse(lastUserMsg)
      const confidence = this.estimateConfidence(lastUserMsg)

      return this.buildResponse(content, 'openai', start, 100, confidence)
    } catch (e: any) {
      this.healthy = false
      throw new Error(`OpenAI failed: ${e.message}`)
    }
  }

  /**
   * Mock 响应生成 (生产环境由 OpenAI 真实响应)
   */
  private generateMockResponse(userMsg: string): string {
    if (userMsg.includes('订单') || userMsg.includes('order')) {
      return '您的订单正在处理中,预计 24 小时内发货。如需查看物流请提供订单号。'
    }
    if (userMsg.includes('退') || userMsg.includes('refund')) {
      return '退款申请已收到,请在"我的订单"中提交退款原因,我们将在 3 个工作日内审核。'
    }
    if (userMsg.includes('价格') || userMsg.includes('price') || userMsg.includes('多少钱')) {
      return '我们的产品价格公道,具体价格请查看商品详情页或咨询客服。'
    }
    return '您好,我是智能客服助手,请问有什么可以帮您?'
  }

  private estimateConfidence(msg: string): number {
    // 简短消息 + 关键词命中 → 高置信度
    if (msg.length < 20) return 0.85
    if (msg.length < 50) return 0.75
    if (msg.length < 100) return 0.65
    return 0.55
  }

  // 测试辅助
  __setHealthy(healthy: boolean): void { this.healthy = healthy }
  __resetRateLimit(): void { this.requestCount = 0; this.windowStart = Date.now() }
}