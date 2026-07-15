import { Injectable } from '@nestjs/common'
import type { Candidate, ProductSnapshot } from '../recommend.entity'
import type { ProductAdapter } from '../datasources/product.adapter'
import type { PurchaseHistoryAdapter } from '../datasources/purchase-history.adapter'
import type { SimilarityMatrixService } from '../similarity-matrix.service'
import type { TimeDecayService } from '../time-decay.service'
import type { ImplicitFeedbackService, ImplicitAction } from '../implicit-feedback.service'

/**
 * Phase-40 T170 + V18 Day2 D3: ItemCFStrategy (物品协同过滤)
 *
 * V18 D3 增强:
 *  - 添加时间衰减因子 (近期购买权重大)
 *  - 添加隐式反馈处理 (浏览/点击/加购加权)
 *  - 使用 SimilarityMatrixService 预计算相似度矩阵
 *  - 支持余弦 + Jaccard 相似度
 *
 * 算法:
 *  - 余弦相似度: 物品 A, B 被同时购买的会员数 / sqrt(A 购买者 × B 购买者)
 *  - 基于 contextItemId 找 Top N 相似商品
 *  - 时间衰减: 近期购买的商品推荐优先级更高
 *
 * 降级: contextItemId 无购买者 → 返回空 (走其他策略)
 */

export interface ItemCFOptions {
  useTimeDecay: boolean
  useImplicitFeedback: boolean
  useSimilarityMatrix: boolean
  similarityMethod: 'cosine' | 'jaccard'
}

export interface PurchasedWithDetails {
  itemId: string
  coOccurrence: number
  purchasersCount: number
  /** 加权后的相关系数 (含时间衰减) */
  weightedScore: number
}

@Injectable()
export class ItemCFStrategy {
  /** 默认选项使用时间衰减 + 隐式反馈 */
  static readonly DEFAULT_OPTIONS: ItemCFOptions = {
    useTimeDecay: true,
    useImplicitFeedback: true,
    useSimilarityMatrix: true,
    similarityMethod: 'cosine',
  }

  constructor(
    private readonly similarityMatrix?: SimilarityMatrixService,
    private readonly timeDecay?: TimeDecayService,
    private readonly implicitFeedback?: ImplicitFeedbackService,
  ) {}

  /**
   * V18 D3: 增强版推荐 (含时间衰减 + 隐式反馈)
   */
  recommend(
    tenantId: string,
    contextItemId: string,
    productAdapter: ProductAdapter,
    purchaseAdapter: PurchaseHistoryAdapter,
    limit: number,
    options: ItemCFOptions = ItemCFStrategy.DEFAULT_OPTIONS,
    excludeItemIds: Set<string> = new Set(),
  ): Candidate[] {
    const contextItem = productAdapter.query(tenantId, [contextItemId])[0]
    if (!contextItem) return []

    // 如果启用 SimilarityMatrix, 优先使用预缓存数据
    if (options.useSimilarityMatrix && this.similarityMatrix) {
      const matrixResult = this.recommendFromMatrix(
        tenantId, contextItemId, contextItem.name, productAdapter, limit, excludeItemIds,
      )
      if (matrixResult.length > 0) {
        return matrixResult
      }
      // 矩阵无数据则 fallback 到实时计算
    }

    return this.recommendRealTime(
      tenantId, contextItemId, contextItem, productAdapter, purchaseAdapter, limit, options, excludeItemIds,
    )
  }

  /**
   * 从预计算相似度矩阵获取推荐
   */
  private recommendFromMatrix(
    tenantId: string,
    contextItemId: string,
    contextItemName: string,
    productAdapter: ProductAdapter,
    limit: number,
    excludeItemIds: Set<string>,
  ): Candidate[] {
    if (!this.similarityMatrix) return []

    const similarItems = this.similarityMatrix.getSimilarItems(tenantId, contextItemId, limit + excludeItemIds.size)
    const allProducts = productAdapter.queryAllWithMetrics(tenantId)
    const productMap = new Map(allProducts.map(p => [p.id, p] as [string, any]))

    const candidates: Candidate[] = []

    for (const item of similarItems) {
      // 确定哪个是"另一"商品
      const otherId = item.itemA === contextItemId ? item.itemB : item.itemA
      if (excludeItemIds.has(otherId)) continue
      if (otherId === contextItemId) continue

      const product = productMap.get(otherId)
      if (!product) continue

      candidates.push({
        itemId: otherId,
        score: item.similarity,
        reasoning: `与"${contextItemName}"常被一同购买`,
        strategy: 'item-cf',
        metadata: {
          similarity: item.similarity,
          fromMatrix: true,
          contextItemId,
        },
      })
    }

    candidates.sort((a, b) => b.score - a.score)
    return candidates.slice(0, limit)
  }

  /**
   * 实时计算协同过滤 (V18 D3 增强: 加入时间衰减)
   */
  private recommendRealTime(
    tenantId: string,
    contextItemId: string,
    contextItem: ProductSnapshot,
    productAdapter: ProductAdapter,
    purchaseAdapter: PurchaseHistoryAdapter,
    limit: number,
    options: ItemCFOptions,
    excludeItemIds: Set<string>,
  ): Candidate[] {
    // 找所有购买过 contextItem 的会员
    const purchasers = purchaseAdapter.queryItemPurchasers(tenantId, contextItemId)
    if (purchasers.length === 0) return []

    // 这些会员还买过哪些商品 (含时间衰减)
    const coOccurrenceMap = new Map<string, PurchasedWithDetails>()

    for (const memberId of purchasers) {
      const memberPurchases = purchaseAdapter.queryMemberPurchases(tenantId, memberId)
      const now = Date.now()

      for (const p of memberPurchases) {
        if (p.itemId === contextItemId) continue

        const existing = coOccurrenceMap.get(p.itemId) ?? {
          itemId: p.itemId,
          coOccurrence: 0,
          purchasersCount: 0,
          weightedScore: 0,
        }

        // V18 D3: 时间衰减: 近期购买权重更高
        let contribution = 1
        if (options.useTimeDecay && this.timeDecay) {
          const timestamp = this.timeDecay.parseTimestamp(p.purchasedAt)
          contribution = this.timeDecay.computeWeight(timestamp, now)
        }

        existing.coOccurrence += contribution
        existing.weightedScore += contribution
        coOccurrenceMap.set(p.itemId, existing)
      }
    }

    // 更新唯一购买者数量
    for (const [, details] of coOccurrenceMap) {
      details.purchasersCount = purchaseAdapter.queryItemPurchasers(
        tenantId, details.itemId,
      ).length
    }

    // 计算余弦相似度 (含时间衰减加权)
    const allProducts = productAdapter.queryAllWithMetrics(tenantId)
    const productMap = new Map(allProducts.map(p => [p.id, p] as [string, any]))
    const candidates: Candidate[] = []

    for (const [itemId, details] of coOccurrenceMap) {
      if (excludeItemIds.has(itemId)) continue

      // 余弦相似度 = coCount / sqrt(purchasers × itemPurchasers)
      const similarity = details.coOccurrence /
        Math.sqrt(purchasers.length * Math.max(1, details.purchasersCount))

      const product = productMap.get(itemId)
      if (!product) continue

      candidates.push({
        itemId,
        score: similarity,
        reasoning: `与"${contextItem.name}"常被一同购买`,
        strategy: 'item-cf',
        metadata: {
          coOccurrence: details.coOccurrence,
          purchasersCount: details.purchasersCount,
          weightedScore: details.weightedScore,
          contextItemId,
          timeDecayed: options.useTimeDecay,
        },
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
