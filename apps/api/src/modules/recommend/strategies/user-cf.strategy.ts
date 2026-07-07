import { Injectable } from '@nestjs/common'
import type { Candidate } from '../recommend.entity'
import type { PurchaseHistoryAdapter } from '../datasources/purchase-history.adapter'
import type { ProductAdapter } from '../datasources/product.adapter'

/**
 * Phase-40 T170: UserCFStrategy (用户协同过滤)
 *
 * 算法:
 *  - 余弦相似度: 会员 A, B 共同购买的商品数 / sqrt(A 商品数 × B 商品数)
 *  - Top 10 相似会员买过但当前会员没买的商品
 *
 * 降级: 会员数 < 2 → 返回空
 */

@Injectable()
export class UserCFStrategy {
  /**
   * 推荐相似会员买过的商品
   */
  recommend(
    tenantId: string,
    memberId: string,
    productAdapter: ProductAdapter,
    purchaseAdapter: PurchaseHistoryAdapter,
    limit: number
  ): Candidate[] {
    const myPurchases = purchaseAdapter.queryMemberPurchases(tenantId, memberId)
    if (myPurchases.length === 0) return []
    const myItems = new Set(myPurchases.map(p => p.itemId))

    // 找出所有其他会员及其购买历史
    const allPurchases = purchaseAdapter.queryAllPurchases(tenantId)
    const memberPurchasesMap = new Map<string, Set<string>>()
    for (const p of allPurchases) {
      if (p.memberId === memberId) continue
      const set = memberPurchasesMap.get(p.memberId) ?? new Set()
      set.add(p.itemId)
      memberPurchasesMap.set(p.memberId, set)
    }

    // 计算与每个会员的相似度
    const similarities: { memberId: string; similarity: number }[] = []
    for (const [otherMemberId, otherItems] of memberPurchasesMap) {
      let common = 0
      for (const item of myItems) {
        if (otherItems.has(item)) common++
      }
      if (common === 0) continue
      const similarity = common / Math.sqrt(myItems.size * otherItems.size)
      similarities.push({ memberId: otherMemberId, similarity })
    }

    similarities.sort((a, b) => b.similarity - a.similarity)
    const topK = similarities.slice(0, 10)

    // 聚合 topK 会员买过的商品 (排除 myItems)
    const candidates = new Map<string, { score: number; sourceMembers: string[] }>()
    for (const { memberId: otherId, similarity } of topK) {
      const otherItems = memberPurchasesMap.get(otherId) ?? new Set()
      for (const itemId of otherItems) {
        if (myItems.has(itemId)) continue
        const existing = candidates.get(itemId) ?? { score: 0, sourceMembers: [] }
        existing.score += similarity
        existing.sourceMembers.push(otherId)
        candidates.set(itemId, existing)
      }
    }

    const allProducts = productAdapter.queryAllWithMetrics(tenantId)
    const productMap = new Map(allProducts.map(p => [p.id, p] as [string, any]))

    const result: Candidate[] = []
    for (const [itemId, { score, sourceMembers }] of candidates) {
      const product = productMap.get(itemId)
      if (!product) continue
      result.push({
        itemId,
        score: Math.min(1, score / topK.length),
        reasoning: `${sourceMembers.length} 位相似会员买过`,
        strategy: 'user-cf',
        metadata: { sourceMembers: sourceMembers.slice(0, 3) }
      })
    }

    result.sort((a, b) => b.score - a.score)
    return result.slice(0, limit)
  }
}