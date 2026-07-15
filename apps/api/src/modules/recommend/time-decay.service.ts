import { Injectable } from '@nestjs/common'

/**
 * V18 Day2 D3: TimeDecayService (时间衰减因子)
 *
 * 协同过滤增强: 用户行为随时间推移权重衰减
 *  - 近期行为权重高, 远期行为权重低
 *  - 支持指数衰减和线性衰减两种模式
 *  - 默认使用半衰期 30 天的指数衰减
 */

export type DecayMode = 'exponential' | 'linear'

export interface TimeDecayConfig {
  mode: DecayMode
  halfLifeDays: number
  maxDays: number
}

export interface TimeWeightedItem {
  itemId: string
  score: number
  timestamp: number
  weight: number
}

@Injectable()
export class TimeDecayService {
  static readonly DEFAULT_CONFIG: TimeDecayConfig = {
    mode: 'exponential',
    halfLifeDays: 30,
    maxDays: 365,
  }

  /**
   * 计算单条行为的时间权重系数 (0..1)
   *
   * 指数衰减: weight = 2^(-elapsedDays / halfLifeDays)
   * 线性衰减: weight = max(0, 1 - elapsedDays / maxDays)
   */
  computeWeight(
    timestamp: number,
    now: number = Date.now(),
    config: TimeDecayConfig = TimeDecayService.DEFAULT_CONFIG,
  ): number {
    const elapsedMs = now - timestamp
    if (elapsedMs <= 0) return 1.0

    const elapsedDays = elapsedMs / (1000 * 60 * 60 * 24)

    if (elapsedDays > config.maxDays) return 0

    if (config.mode === 'exponential') {
      return Math.pow(2, -elapsedDays / config.halfLifeDays)
    }

    // linear
    return Math.max(0, 1 - elapsedDays / config.maxDays)
  }

  /**
   * 批量计算时间加权分数
   */
  applyDecay(
    items: { itemId: string; score: number; timestamp: number }[],
    now: number = Date.now(),
    config: TimeDecayConfig = TimeDecayService.DEFAULT_CONFIG,
  ): TimeWeightedItem[] {
    return items.map(item => {
      const weight = this.computeWeight(item.timestamp, now, config)
      return {
        itemId: item.itemId,
        score: item.score,
        timestamp: item.timestamp,
        weight,
      }
    })
  }

  /**
   * 计算加权后的累积分数
   */
  aggregateScores(
    items: { itemId: string; score: number; timestamp: number }[],
    now: number = Date.now(),
    config: TimeDecayConfig = TimeDecayService.DEFAULT_CONFIG,
  ): Map<string, number> {
    const result = new Map<string, number>()

    for (const item of items) {
      const weight = this.computeWeight(item.timestamp, now, config)
      const weighted = item.score * weight
      const existing = result.get(item.itemId) ?? 0
      result.set(item.itemId, existing + weighted)
    }

    return result
  }

  /**
   * 将日期字符串转为毫秒时间戳
   */
  parseTimestamp(dateStr: string): number {
    return new Date(dateStr).getTime()
  }
}
