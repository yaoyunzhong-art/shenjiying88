import { Injectable } from '@nestjs/common'
import type { ProductSnapshot } from '../recommend.entity'

/**
 * Phase-40 T170: ProductAdapter (商品快照数据源)
 *
 * 反模式 v4 multi-tenant-data-isolation: query(tenantId, ...) 第一参数强制 tenantId
 * 数据来源: 内存模拟 + 反查库存模块
 */

interface InternalProduct extends ProductSnapshot {
  soldCount: number       // 累计销量 (协同过滤用)
  viewCount: number       // 浏览次数
}

@Injectable()
export class ProductAdapter {
  private products: InternalProduct[] = []

  /**
   * 注入商品快照 (测试用 + 同步调用)
   */
  seed(products: ProductSnapshot[]): void {
    this.products = products.map(p => ({
      ...p,
      soldCount: 0,
      viewCount: 0
    }))
  }

  /**
   * 增加销量 (订单完成后调用)
   */
  incrementSold(itemId: string, qty: number): void {
    const p = this.products.find(x => x.id === itemId)
    if (p) p.soldCount += qty
  }

  /**
   * 增加浏览次数
   */
  incrementView(itemId: string): void {
    const p = this.products.find(x => x.id === itemId)
    if (p) p.viewCount++
  }

  /**
   * 查询商品 (按 tenantId 强制)
   */
  query(tenantId: string, itemIds?: string[]): ProductSnapshot[] {
    return this.products
      .filter(p => p.tenantId === tenantId)
      .filter(p => !itemIds || itemIds.includes(p.id))
      .map(({ soldCount, viewCount, ...rest }) => rest)
  }

  /**
   * 全部商品 (含销量) - 协同过滤用
   */
  queryAllWithMetrics(tenantId: string): InternalProduct[] {
    return this.products.filter(p => p.tenantId === tenantId)
  }

  /**
   * 按 category 过滤
   */
  queryByCategory(tenantId: string, category: string): ProductSnapshot[] {
    return this.query(tenantId).filter(p => p.category === category)
  }

  /**
   * 按价格区间
   */
  queryByPriceRange(tenantId: string, min: number, max: number): ProductSnapshot[] {
    return this.query(tenantId).filter(p =>
      p.priceCents >= min && p.priceCents <= max
    )
  }

  /**
   * 重置
   */
  reset(): void {
    this.products = []
  }
}