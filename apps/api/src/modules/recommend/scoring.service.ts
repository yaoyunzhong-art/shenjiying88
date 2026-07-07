import { Injectable } from '@nestjs/common'
import type { Candidate, StrategyType, ScoringContext } from './recommend.entity'

/**
 * Phase-40 T170: ScoringService (评分融合)
 *
 * 反模式 v4 命中:
 *  - recommendation-cold-start-pattern: 多策略加权融合
 *  - multi-tenant-data-isolation: 评分上下文含 tenantId
 *
 * 算法:
 *  - 单策略评分归一化 0..1
 *  - 多策略加权: weightedSum / weightSum
 *  - 同分时按 reasoning 长度优先
 */

@Injectable()
export class ScoringService {
  /**
   * 默认策略权重 (可被请求覆盖)
   */
  static readonly DEFAULT_WEIGHTS: Record<StrategyType, number> = {
    'item-cf': 0.35,
    'user-cf': 0.20,
    'popular': 0.15,
    'recently-viewed': 0.10,
    'personalized': 0.20
  }

  /**
   * 归一化分数到 [0, 1]
   */
  normalize(score: number, min: number, max: number): number {
    if (max <= min) return 1.0
    return Math.max(0, Math.min(1, (score - min) / (max - min)))
  }

  /**
   * 多策略加权融合
   */
  fuse(
    candidatesByStrategy: Record<StrategyType, Candidate[]>,
    weights: Record<StrategyType, number> = ScoringService.DEFAULT_WEIGHTS
  ): Candidate[] {
    // 聚合所有 candidates 按 itemId
    const itemMap = new Map<string, Candidate>()
    let weightSum = 0

    for (const [strategy, candidates] of Object.entries(candidatesByStrategy) as [StrategyType, Candidate[]][]) {
      const weight = weights[strategy] ?? 0
      weightSum += weight
      for (const c of candidates) {
        const existing = itemMap.get(c.itemId)
        if (existing) {
          // 累加加权分 + 合并 reasoning
          existing.score += c.score * weight
          if (!existing.metadata) existing.metadata = {}
          existing.metadata[strategy] = c.score
          if (!existing.reasoning.includes(c.reasoning)) {
            existing.reasoning = `${existing.reasoning}; ${c.reasoning}`
          }
        } else {
          itemMap.set(c.itemId, {
            ...c,
            score: c.score * weight,
            metadata: { ...(c.metadata ?? {}), [strategy]: c.score }
          })
        }
      }
    }

    // 归一化
    if (weightSum > 0) {
      for (const c of itemMap.values()) {
        c.score = Math.min(1, c.score / weightSum)
      }
    }

    // 排序: score desc, 然后 reasoning 长度 desc
    return Array.from(itemMap.values()).sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return b.reasoning.length - a.reasoning.length
    })
  }

  /**
   * 计算策略权重
   */
  computeWeights(
    strategies: StrategyType[],
    context?: ScoringContext
  ): Record<StrategyType, number> {
    // 当没有context时，使用传入的strategies过滤默认权重
    if (!context) {
      const filteredWeights = {} as Record<StrategyType, number>
      for (const s of strategies) {
        if (ScoringService.DEFAULT_WEIGHTS[s] !== undefined) {
          filteredWeights[s] = ScoringService.DEFAULT_WEIGHTS[s]
        }
      }
      return filteredWeights
    }

    const weights = { ...ScoringService.DEFAULT_WEIGHTS }

    // 冷启动时降低 CF 权重
    if (context.memberPreferences?.lifecycleStage === 'NEW') {
      weights['item-cf'] = 0.10
      weights['user-cf'] = 0.05
      weights['popular'] = 0.50
      weights['recently-viewed'] = 0.05
      weights['personalized'] = 0.30
    }

    // 活跃会员提高个性化权重
    if (context.memberPreferences?.lifecycleStage === 'ACTIVE') {
      weights['personalized'] = 0.40
      weights['item-cf'] = 0.30
    }

    // 休眠会员提高热门权重
    if (context.memberPreferences?.lifecycleStage === 'DORMANT') {
      weights['popular'] = 0.40
      weights['personalized'] = 0.30
    }

    // 归一化 (确保总和=1)
    const sum = Object.values(weights).reduce((a, b) => a + b, 0)
    if (sum > 0) {
      for (const k of Object.keys(weights) as StrategyType[]) {
        weights[k] = weights[k] / sum
      }
    }

    // 只保留请求中指定的策略
    return Object.fromEntries(
      strategies.map(s => [s, weights[s] ?? 0])
    ) as Record<StrategyType, number>
  }
}