import { Injectable } from '@nestjs/common'
import type { Candidate, ProductSnapshot } from '../recommend.entity'
import type { ProductAdapter } from '../datasources/product.adapter'
import type { PurchaseHistoryAdapter } from '../datasources/purchase-history.adapter'

/**
 * Phase-40 T170: ItemCFStrategy (物品协同过滤)
 *
 * 算法:
 *  - 余弦相似度: 物品 A, B 被同时购买的会员数 / sqrt(A 购买者 × B 购买者)
 *  - 基于 contextItemId 找 Top N 相似商品
 *
 * 降级: contextItemId 无购买者 → 返回空 (走其他策略)
 */

@Injectable()
export class ItemCFStrategy {
  /**
   * 推荐与 contextItemId 相似的商品
   */
  recommend(
    tenantId: string,
    contextItemId: string,
    productAdapter: ProductAdapter,
    purchaseAdapter: PurchaseHistoryAdapter,
    limit: number
  ): Candidate[] {
    const contextItem = productAdapter.query(tenantId, [contextItemId])[0]
    if (!contextItem) return []

    // 找所有购买过 contextItem 的会员
    const purchasers = purchaseAdapter.queryItemPurchasers(tenantId, contextItemId)
    if (purchasers.length === 0) return []

    // 这些会员还买过哪些商品
    const coOccurrence = new Map<string, number>()
    for (const memberId of purchasers) {
      const memberPurchases = purchaseAdapter.queryMemberPurchases(tenantId, memberId)
      for (const p of memberPurchases) {
        if (p.itemId === contextItemId) continue
        coOccurrence.set(p.itemId, (coOccurrence.get(p.itemId) ?? 0) + 1)
      }
    }

    // 计算余弦相似度
    const allProducts = productAdapter.queryAllWithMetrics(tenantId)
    const productMap = new Map(allProducts.map(p => [p.id, p] as [string, any]))
    const candidates: Candidate[] = []

    for (const [itemId, coCount] of coOccurrence) {
      const itemPurchasers = purchaseAdapter.queryItemPurchasers(tenantId, itemId)
      // 余弦相似度 = coCount / sqrt(purchasers × itemPurchasers)
      const similarity = coCount / Math.sqrt(purchasers.length * itemPurchasers.length)
      const product = productMap.get(itemId)
      if (!product) continue
      candidates.push({
        itemId,
        score: similarity,
        reasoning: `与"${contextItem.name}"常被一同购买`,
        strategy: 'item-cf',
        metadata: {
          coOccurrence: coCount,
          itemPurchasers: itemPurchasers.length,
          contextItemId
        }
      })
    }

    candidates.sort((a, b) => b.score - a.score)
    return candidates.slice(0, limit)
  }

  /**
   * 简单物品相似度 (用于其他场景)
   */
  static similarity(a: ProductSnapshot, b: ProductSnapshot): number {
    let score = 0
    if (a.category === b.category) score += 0.5
    const priceDiff = Math.abs(a.priceCents - b.priceCents) / Math.max(a.priceCents, b.priceCents)
    if (priceDiff < 0.3) score += 0.3
    return score
  }
}