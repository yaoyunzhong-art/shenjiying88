import { Injectable } from '@nestjs/common'
import type { MemberPreference } from './recommend.entity'

/**
 * Phase-40 T170 + V18 Day2 D3: ColdStartService (冷启动 fallback)
 *
 * 反模式 v4 recommendation-cold-start-pattern:
 *  - 新会员 (lifecycleStage=NEW) 无历史 → Popular fallback
 *  - 商品无销量 → 全局热门 fallback
 *  - 数据稀疏 (90%+ 无购买) → Popular 主导
 *
 * V18 D3 增强:
 *  - 强化新用户推荐: 流行度+热力图混合 (popularHeatmap hybrid)
 *  - 强化新商品推荐: 类目相似度+标签匹配 (categoryTag hybrid)
 *  - 分层冷启动策略 (根据数据量自适应)
 *  - itemColdStart 判断
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

export type ColdStartLevel = 'full' | 'partial' | 'none'

export type FallbackStrategy =
  | 'popular'
  | 'popular-heatmap'
  | 'category-tag'
  | 'recently-viewed'
  | 'personalized'
  | 'item-cf'
  | 'user-cf'

export interface ColdStartDecision {
  isColdStart: boolean
  level: ColdStartLevel
  reason?: string
  fallbackStrategy: FallbackStrategy
  recommendedStrategies: FallbackStrategy[]
}

export interface ItemColdStartContext {
  tenantId: string
  itemId: string
  category: string
  tags: string[]
  purchaseCount: number
  viewCount: number
  daysSinceCreation: number
}

export interface ItemColdStartDecision {
  isColdStart: boolean
  reason?: string
  /** 推荐策略: 类目内热门 / 同标签商品 / 类目相似度 */
  recommendedStrategy: 'category-popular' | 'similar-tags' | 'category-similarity' | 'normal'
}

@Injectable()
export class ColdStartService {
  private static readonly PURCHASE_THRESHOLD = 3
  private static readonly VIEW_THRESHOLD = 5
  private static readonly ITEM_PURCHASE_THRESHOLD = 2
  /** 商品: 上架 7 天内视为新品 */
  private static readonly NEW_ITEM_DAYS = 7
  /** 商品: 购买 < 3 视为冷启动 */
  private static readonly ITEM_COLD_PURCHASE_THRESHOLD = 3
  /** 商品: 浏览 < 10 视为冷启动 */
  private static readonly ITEM_COLD_VIEW_THRESHOLD = 10

  // ---- 会员冷启动 ----

  /**
   * 判断是否冷启动 (V18 D3 增强: 分层级别)
   */
  detect(ctx: ColdStartContext): ColdStartDecision {
    // full cold start: 匿名 / 新会员
    if (!ctx.hasMemberId) {
      return {
        isColdStart: true,
        level: 'full',
        reason: '匿名访问',
        fallbackStrategy: 'popular-heatmap',
        recommendedStrategies: ['popular-heatmap', 'popular'],
      }
    }

    if (ctx.lifecycleStage === 'NEW') {
      return {
        isColdStart: true,
        level: 'full',
        reason: '新会员无历史',
        fallbackStrategy: 'popular-heatmap',
        recommendedStrategies: ['popular-heatmap', 'popular', 'category-tag'],
      }
    }

    // partial cold start: 数据量不足但非全新
    if (ctx.purchaseCount < ColdStartService.PURCHASE_THRESHOLD) {
      return {
        isColdStart: true,
        level: 'partial',
        reason: `购买历史 ${ctx.purchaseCount} < ${ColdStartService.PURCHASE_THRESHOLD}`,
        fallbackStrategy: 'popular-heatmap',
        recommendedStrategies: ['popular-heatmap', 'popular', 'recently-viewed'],
      }
    }

    if (ctx.viewCount < ColdStartService.VIEW_THRESHOLD) {
      return {
        isColdStart: true,
        level: 'partial',
        reason: `浏览历史 ${ctx.viewCount} < ${ColdStartService.VIEW_THRESHOLD}`,
        fallbackStrategy: 'popular-heatmap',
        recommendedStrategies: ['popular-heatmap', 'recently-viewed', 'personalized'],
      }
    }

    return {
      isColdStart: false,
      level: 'none',
      fallbackStrategy: 'item-cf',
      recommendedStrategies: ['item-cf', 'user-cf', 'personalized'],
    }
  }

  /**
   * 是否可以走 ItemCF (需要 contextItemId)
   */
  canItemCF(ctx: { hasContextItemId: boolean; itemPurchaseCount: number }): boolean {
    return ctx.hasContextItemId && ctx.itemPurchaseCount >= ColdStartService.ITEM_PURCHASE_THRESHOLD
  }

  // ---- 商品冷启动 (V18 D3 新增) ----

  /**
   * 判断商品是否处于冷启动状态
   */
  detectItemColdStart(ctx: ItemColdStartContext): ItemColdStartDecision {
    // 新商品: 上架时间短 + 无销量
    if (ctx.daysSinceCreation <= ColdStartService.NEW_ITEM_DAYS && ctx.purchaseCount === 0) {
      return {
        isColdStart: true,
        reason: `新商品上架 ${ctx.daysSinceCreation} 天, 无销量`,
        recommendedStrategy: 'category-popular',
      }
    }

    // 有类目有标签但销量低
    if (ctx.purchaseCount < ColdStartService.ITEM_COLD_PURCHASE_THRESHOLD) {
      if (ctx.tags.length > 0) {
        return {
          isColdStart: true,
          reason: `销量低 ${ctx.purchaseCount}, 有标签可匹配`,
          recommendedStrategy: 'similar-tags',
        }
      }
      return {
        isColdStart: true,
        reason: `销量低 ${ctx.purchaseCount}, 走类目相似度`,
        recommendedStrategy: 'category-similarity',
      }
    }

    // 浏览低但购买还行: 可能需要曝光
    if (ctx.viewCount < ColdStartService.ITEM_COLD_VIEW_THRESHOLD && ctx.purchaseCount > 0) {
      return {
        isColdStart: true,
        reason: `曝光不足, 浏览 ${ctx.viewCount} < ${ColdStartService.ITEM_COLD_VIEW_THRESHOLD}`,
        recommendedStrategy: 'category-popular',
      }
    }

    return {
      isColdStart: false,
      recommendedStrategy: 'normal',
    }
  }

  /**
   * 获取商品冷启动推荐策略
   */
  getItemFallbackStrategy(decision: ItemColdStartDecision): FallbackStrategy {
    switch (decision.recommendedStrategy) {
      case 'category-popular':
        return 'popular-heatmap'
      case 'similar-tags':
        return 'category-tag'
      case 'category-similarity':
        return 'popular-heatmap'
      default:
        return 'popular'
    }
  }
}
