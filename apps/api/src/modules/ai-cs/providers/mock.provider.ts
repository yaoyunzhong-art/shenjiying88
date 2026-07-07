import { Injectable } from '@nestjs/common'
import { BaseAIProvider } from './ai-provider.interface'
import type { AIProviderRequest, AIProviderResponse, ProviderType } from '../ai-cs.entity'

/**
 * Phase-41 T171: MockProvider (测试 + Fallback)
 *
 * 离线场景使用 (单元测试 / Provider 全挂时降级)
 *  - priority=99 (最低)
 *  - 总是 available=true
 *  - 返回固定回复 + 置信度 0.6
 */

@Injectable()
export class MockProvider extends BaseAIProvider {
  readonly name: ProviderType = 'mock'
  readonly priority = 99  // 最低

  async isAvailable(): Promise<boolean> {
    return true
  }

  async complete(req: AIProviderRequest): Promise<AIProviderResponse> {
    const start = Date.now()
    const lastUserMsg = [...req.messages].reverse().find(m => m.role === 'user')?.content ?? ''
    return this.buildResponse(
      `[Mock 兜底回复] 您的问题是: ${lastUserMsg.slice(0, 50)}... 由于 AI 服务暂不可用, 请稍后重试或转人工客服。`,
      'mock',
      start,
      30,
      0.6  // 兜底回复置信度较低,触发转人工
    )
  }
}