import { Injectable } from '@nestjs/common'
import type { PurchaseHistory, ViewHistory } from '../recommend.entity'

/**
 * Phase-40 T170: PurchaseHistoryAdapter (购买/浏览历史)
 *
 * 反模式 v4 multi-tenant-data-isolation:
 *  - queryPurchases(tenantId, ...) 第一参数强制 tenantId
 *  - queryViews(tenantId, ...) 同
 *
 * 数据来源: 订单完成事件 + 浏览埋点
 */

@Injectable()
export class PurchaseHistoryAdapter {
  private purchases: PurchaseHistory[] = []
  private views: ViewHistory[] = []

  /**
   * 注入购买历史
   */
  seedPurchases(purchases: PurchaseHistory[]): void {
    this.purchases = [...purchases]
  }

  /**
   * 注入浏览历史
   */
  seedViews(views: ViewHistory[]): void {
    this.views = [...views]
  }

  /**
   * 记录购买 (订单完成后)
   */
  recordPurchase(p: PurchaseHistory): void {
    this.purchases.push(p)
  }

  /**
   * 记录浏览
   */
  recordView(v: ViewHistory): void {
    this.views.push(v)
  }

  /**
   * 查询会员的购买历史 (按时间倒序)
   */
  queryMemberPurchases(tenantId: string, memberId: string, limit?: number): PurchaseHistory[] {
    const filtered = this.purchases
      .filter(p => p.tenantId === tenantId && p.memberId === memberId)
      .sort((a, b) => b.purchasedAt.localeCompare(a.purchasedAt))
    return limit ? filtered.slice(0, limit) : filtered
  }

  /**
   * 查询会员的浏览历史 (按时间倒序)
   */
  queryMemberViews(tenantId: string, memberId: string, limit?: number): ViewHistory[] {
    const filtered = this.views
      .filter(v => v.tenantId === tenantId && v.memberId === memberId)
      .sort((a, b) => b.viewedAt.localeCompare(a.viewedAt))
    return limit ? filtered.slice(0, limit) : filtered
  }

  /**
   * 查询商品的所有购买者 (协同过滤用)
   */
  queryItemPurchasers(tenantId: string, itemId: string): string[] {
    return Array.from(new Set(
      this.purchases
        .filter(p => p.tenantId === tenantId && p.itemId === itemId)
        .map(p => p.memberId)
    ))
  }

  /**
   * 查询租户全部购买历史 (协同过滤矩阵)
   */
  queryAllPurchases(tenantId: string): PurchaseHistory[] {
    return this.purchases.filter(p => p.tenantId === tenantId)
  }

  /**
   * 已购商品 ID 集合
   */
  queryPurchasedItemIds(tenantId: string, memberId: string): Set<string> {
    return new Set(
      this.purchases
        .filter(p => p.tenantId === tenantId && p.memberId === memberId)
        .map(p => p.itemId)
    )
  }

  /**
   * 重置
   */
  reset(): void {
    this.purchases = []
    this.views = []
  }
}