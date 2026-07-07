import { Injectable } from '@nestjs/common'
import type { Candidate } from '../recommend.entity'
import type { ProductAdapter } from '../datasources/product.adapter'

/**
 * Phase-40 T170: PopularStrategy (热门排行)
 *
 * 算法:
 *  - 按 soldCount 降序
 *  - 冷启动 fallback (无历史 → Popular)
 *  - 多样性: 按 category 打散
 */

@Injectable()
export class PopularStrategy {
  /**
   * 全局热门商品
   */
  recommend(
    tenantId: string,
    productAdapter: ProductAdapter,
    _purchaseAdapter: any,
    limit: number,
    excludeItemIds: Set<string> = new Set()
  ): Candidate[] {
    const allProducts = productAdapter.queryAllWithMetrics(tenantId)

    // 按 soldCount 降序
    const sorted = allProducts
      .filter(p => !excludeItemIds.has(p.id))
      .sort((a, b) => b.soldCount - a.soldCount)

    // 简单多样性: 同类目不超过 ceil(limit/3)
    const result: Candidate[] = []
    const categoryCount = new Map<string, number>()
    const maxPerCategory = Math.ceil(limit / 3)

    for (const product of sorted) {
      const cat = product.category
      const count = categoryCount.get(cat) ?? 0
      if (count >= maxPerCategory) continue
      result.push({
        itemId: product.id,
        score: this.normalizeScore(product.soldCount, sorted[0].soldCount),
        reasoning: `热销 ${product.soldCount} 件`,
        strategy: 'popular',
        metadata: { soldCount: product.soldCount, category: cat }
      })
      categoryCount.set(cat, count + 1)
      if (result.length >= limit) break
    }

    return result
  }

  private normalizeScore(value: number, max: number): number {
    if (max <= 0) return 0
    return Math.min(1, value / max)
  }
}