import { Injectable } from '@nestjs/common'
import type { Candidate, ProductSnapshot } from './recommend.entity'

/**
 * Phase-40 T170: DiversificationService (多样性打散)
 *
 * 反模式 v4 recommendation-cold-start-pattern:
 *  - MMR (Maximal Marginal Relevance) 算法
 *  - λ=0.7 (相关性) + 0.3 (多样性)
 *  - 避免推荐结果同质 (全部同类商品)
 */

@Injectable()
export class DiversificationService {
  private static readonly LAMBDA = 0.7  // 相关性权重
  private static readonly LAMBDA_DIV = 0.3  // 多样性权重

  /**
   * MMR 打散
   */
  rerank(
    candidates: Candidate[],
    productMap: Map<string, ProductSnapshot>,
    topN: number
  ): Candidate[] {
    if (candidates.length === 0) return []
    // 先按 score 降序排序
    const sorted = [...candidates].sort((a, b) => b.score - a.score)
    if (topN >= sorted.length) return sorted

    const selected: Candidate[] = []
    const remaining = [...sorted]

    // 第一轮: 选最高分
    selected.push(remaining.shift()!)

    while (selected.length < topN && remaining.length > 0) {
      let bestIdx = 0
      let bestMMR = -Infinity

      for (let i = 0; i < remaining.length; i++) {
        const c = remaining[i]
        const relevance = c.score
        const maxSim = this.maxSimilarity(c, selected, productMap)
        const mmr = DiversificationService.LAMBDA * relevance -
                    DiversificationService.LAMBDA_DIV * maxSim
        if (mmr > bestMMR) {
          bestMMR = mmr
          bestIdx = i
        }
      }

      selected.push(remaining.splice(bestIdx, 1)[0])
    }

    return selected
  }

  /**
   * 计算候选与已选集合的最大相似度
   */
  private maxSimilarity(
    candidate: Candidate,
    selected: Candidate[],
    productMap: Map<string, ProductSnapshot>
  ): number {
    const candProd = productMap.get(candidate.itemId)
    if (!candProd) return 0

    let max = 0
    for (const s of selected) {
      const sProd = productMap.get(s.itemId)
      if (!sProd) continue
      const sim = this.itemSimilarity(candProd, sProd)
      if (sim > max) max = sim
    }
    return max
  }

  /**
   * 商品相似度 (类目匹配 + 价格相近 + tag 重叠)
   */
  private itemSimilarity(a: ProductSnapshot, b: ProductSnapshot): number {
    let score = 0
    // 类目相同 = +0.5
    if (a.category === b.category) score += 0.5

    // 价格相近 (±20%) = +0.3
    const priceDiff = Math.abs(a.priceCents - b.priceCents) / Math.max(a.priceCents, b.priceCents)
    if (priceDiff < 0.2) score += 0.3

    // tag 重叠
    if (a.tags && b.tags) {
      const overlap = a.tags.filter(t => b.tags!.includes(t)).length
      score += Math.min(0.2, overlap * 0.1)
    }

    return Math.min(1, score)
  }
}