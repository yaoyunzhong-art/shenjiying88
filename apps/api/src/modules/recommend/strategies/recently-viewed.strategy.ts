import { Injectable } from '@nestjs/common'
import type { Candidate } from '../recommend.entity'
import type { PurchaseHistoryAdapter } from '../datasources/purchase-history.adapter'
import type { ProductAdapter } from '../datasources/product.adapter'

/**
 * Phase-40 T170: RecentlyViewedStrategy (最近浏览)
 *
 * 算法:
 *  - 按 viewedAt 降序
 *  - 排除已购 (排除已购商品可选)
 *  - 排除当前正在浏览的商品
 */

@Injectable()
export class RecentlyViewedStrategy {
  recommend(
    tenantId: string,
    memberId: string,
    productAdapter: ProductAdapter,
    purchaseAdapter: PurchaseHistoryAdapter,
    limit: number,
    excludeItemIds: Set<string> = new Set(),
    currentItemId?: string
  ): Candidate[] {
    const views = purchaseAdapter.queryMemberViews(tenantId, memberId, limit * 2)

    const allProducts = productAdapter.queryAllWithMetrics(tenantId)
    const productMap = new Map(allProducts.map(p => [p.id, p] as [string, any]))

    const seen = new Set<string>()
    const result: Candidate[] = []
    let baseScore = 1.0

    for (const v of views) {
      if (seen.has(v.itemId)) continue
      if (excludeItemIds.has(v.itemId)) continue
      if (v.itemId === currentItemId) continue
      const product = productMap.get(v.itemId)
      if (!product) continue

      seen.add(v.itemId)
      result.push({
        itemId: v.itemId,
        score: Math.max(0.1, baseScore),
        reasoning: `你最近浏览过`,
        strategy: 'recently-viewed',
        metadata: { viewedAt: v.viewedAt, durationMs: v.durationMs }
      })
      baseScore -= 0.1
      if (result.length >= limit) break
    }

    return result
  }
}