import { Injectable } from '@nestjs/common'
import type { MemberPreference } from './recommend.entity'

/**
 * Phase-40 T170: ColdStartService (冷启动 fallback)
 *
 * 反模式 v4 recommendation-cold-start-pattern:
 *  - 新会员 (lifecycleStage=NEW) 无历史 → Popular fallback
 *  - 商品无销量 → 全局热门 fallback
 *  - 数据稀疏 (90%+ 无购买) → Popular 主导
 *
 * 触发条件:
 *  - 会员历史购买 < 3 条 → 冷启动
 *  - 会员历史浏览 < 5 条 → 冷启动
 *  - lifecycleStage = NEW → 冷启动
 */

export interface ColdStartContext {
  hasMemberId: boolean
  purchaseCount: number
  viewCount: number
  lifecycleStage?: string
}

export interface ColdStartDecision {
  isColdStart: boolean
  reason?: string
  fallbackStrategy: 'popular' | 'recently-viewed' | 'personalized' | 'item-cf'
}

@Injectable()
export class ColdStartService {
  private static readonly PURCHASE_THRESHOLD = 3
  private static readonly VIEW_THRESHOLD = 5

  /**
   * 判断是否冷启动
   */
  detect(ctx: ColdStartContext): ColdStartDecision {
    if (!ctx.hasMemberId) {
      return {
        isColdStart: true,
        reason: '匿名访问',
        fallbackStrategy: 'popular'
      }
    }

    if (ctx.lifecycleStage === 'NEW') {
      return {
        isColdStart: true,
        reason: '新会员无历史',
        fallbackStrategy: 'popular'
      }
    }

    if (ctx.purchaseCount < ColdStartService.PURCHASE_THRESHOLD) {
      return {
        isColdStart: true,
        reason: `购买历史 ${ctx.purchaseCount} < ${ColdStartService.PURCHASE_THRESHOLD}`,
        fallbackStrategy: 'popular'
      }
    }

    if (ctx.viewCount < ColdStartService.VIEW_THRESHOLD) {
      return {
        isColdStart: true,
        reason: `浏览历史 ${ctx.viewCount} < ${ColdStartService.VIEW_THRESHOLD}`,
        fallbackStrategy: 'popular'
      }
    }

    return {
      isColdStart: false,
      fallbackStrategy: 'item-cf'
    }
  }

  /**
   * 是否可以走 ItemCF (需要 contextItemId)
   */
  canItemCF(ctx: { hasContextItemId: boolean; itemPurchaseCount: number }): boolean {
    return ctx.hasContextItemId && ctx.itemPurchaseCount >= 2
  }
}