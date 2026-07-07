import { Injectable } from '@nestjs/common'
import { IntentAdapter } from './datasources/intent.adapter'
import type { Intent } from './ai-cs.entity'

/**
 * Phase-41 T171: IntentService (意图识别 + FAQ 匹配)
 *
 * DR-41-C: 置信度阈值 0.7 自动转人工
 */

@Injectable()
export class IntentService {
  constructor(private readonly intentAdapter: IntentAdapter) {}

  /**
   * 识别意图 (返回 top 1 + 置信度)
   */
  recognize(tenantId: string, text: string): { intent: Intent | null; confidence: number; matched: boolean } {
    const result = this.intentAdapter.recognize(tenantId, text)
    if (!result) return { intent: null, confidence: 0, matched: false }
    return {
      intent: result.intent,
      confidence: result.confidence,
      matched: result.confidence >= 0.5  // 阈值 0.5 为"匹配"
    }
  }

  /**
   * 判断是否需要转人工 (置信度 < 0.7)
   */
  shouldHandoff(confidence: number): boolean {
    return confidence < 0.7
  }

  /**
   * 列出所有意图
   */
  list(tenantId: string): Intent[] {
    return this.intentAdapter.queryAll(tenantId)
  }
}