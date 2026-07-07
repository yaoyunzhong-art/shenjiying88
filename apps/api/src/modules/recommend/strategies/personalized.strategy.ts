import { Injectable } from '@nestjs/common'
import type { Candidate } from '../recommend.entity'
import type { ProductAdapter } from '../datasources/product.adapter'
import type { MemberPreferenceAdapter } from '../datasources/member-preference.adapter'

/**
 * Phase-40 T170: PersonalizedStrategy (会员个性化)
 *
 * 算法:
 *  - 基于会员偏好 (favoriteCategories + favoriteTags + lifecycleStage)
 *  - 活跃会员: 偏好 + 消费能力加权
 *  - 休眠会员: 偏好转为热门兜底
 *  - 新会员: 简单热门
 */

@Injectable()
export class PersonalizedStrategy {
  recommend(
    tenantId: string,
    memberId: string,
    productAdapter: ProductAdapter,
    prefAdapter: MemberPreferenceAdapter,
    limit: number,
    excludeItemIds: Set<string> = new Set()
  ): Candidate[] {
    const pref = prefAdapter.query(tenantId, memberId)
    if (!pref) return []

    const allProducts = productAdapter.queryAllWithMetrics(tenantId)
    const candidates: Candidate[] = []

    for (const product of allProducts) {
      if (excludeItemIds.has(product.id)) continue
      if (!product.available) continue

      let score = 0
      const reasons: string[] = []

      // 类目偏好匹配 (0.5)
      if (pref.favoriteCategories.includes(product.category)) {
        score += 0.5
        reasons.push(`喜欢"${product.category}"类目`)
      }

      // tag 偏好匹配 (0.3)
      if (product.tags) {
        const matchedTags = product.tags.filter(t => pref.favoriteTags.includes(t))
        if (matchedTags.length > 0) {
          score += Math.min(0.3, matchedTags.length * 0.1)
          reasons.push(`匹配标签 ${matchedTags.join('/')}`)
        }
      }

      // 价格匹配消费能力 (±50% 平均消费)
      const avgOrderAmount = pref.orderCount > 0 ? pref.totalSpendCents / pref.orderCount : 0
      if (avgOrderAmount > 0) {
        const priceRatio = product.priceCents / avgOrderAmount
        if (priceRatio >= 0.5 && priceRatio <= 2.0) {
          score += 0.2
          reasons.push('价格符合消费习惯')
        }
      }

      // 活跃会员加权
      if (pref.lifecycleStage === 'ACTIVE') {
        score *= 1.1
      }

      if (score <= 0) continue

      candidates.push({
        itemId: product.id,
        score: Math.min(1, score),
        reasoning: reasons.join('; ') || '个性化推荐',
        strategy: 'personalized',
        metadata: { lifecycleStage: pref.lifecycleStage, score }
      })
    }

    candidates.sort((a, b) => b.score - a.score)
    return candidates.slice(0, limit)
  }
}