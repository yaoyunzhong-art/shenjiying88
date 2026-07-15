import { Injectable } from '@nestjs/common'
import type { Candidate } from '../recommend.entity'
import type { PurchaseHistoryAdapter } from '../datasources/purchase-history.adapter'
import type { ProductAdapter } from '../datasources/product.adapter'
import type { SimilarityMatrixService } from '../similarity-matrix.service'
import type { TimeDecayService } from '../time-decay.service'
import type { ImplicitFeedbackService, ImplicitAction } from '../implicit-feedback.service'

/**
 * Phase-40 T170 + V18 Day2 D3: UserCFStrategy (用户协同过滤)
 *
 * V18 D3 增强:
 *  - 添加时间衰减因子 (近期购买权重大)
 *  - 使用 SimilarityMatrixService 预计算相似度矩阵
 *  - 支持余弦 + Jaccard 相似度
 *
 * 算法:
 *  - 余弦相似度: 会员 A, B 共同购买的商品数 / sqrt(A 商品数 × B 商品数)
 *  - Top 10 相似会员买过但当前会员没买的商品
 *
 * 降级: 会员数 < 2 → 返回空
 */

export interface UserCFOptions {
  useTimeDecay: boolean
  useSimilarityMatrix: boolean
  similarityMethod: 'cosine' | 'jaccard'
}

@Injectable()
export class UserCFStrategy {
  static readonly DEFAULT_OPTIONS: UserCFOptions = {
    useTimeDecay: true,
    useSimilarityMatrix: true,
    similarityMethod: 'cosine',
  }

  constructor(
    private readonly similarityMatrix?: SimilarityMatrixService,
    private readonly timeDecay?: TimeDecayService,
  ) {}

  /**
   * V18 D3: 增强版推荐相似会员买过的商品
   */
  recommend(
    tenantId: string,
    memberId: string,
    productAdapter: ProductAdapter,
    purchaseAdapter: PurchaseHistoryAdapter,
    limit: number,
    options: UserCFOptions = UserCFStrategy.DEFAULT_OPTIONS,
    excludeItemIds: Set<string> = new Set(),
  ): Candidate[] {
    const myPurchases = purchaseAdapter.queryMemberPurchases(tenantId, memberId)
    if (myPurchases.length === 0) return []
    const myItems = new Set(myPurchases.map(p => p.itemId))

    // 如果启用 SimilarityMatrix, 优先使用预计算缓存
    if (options.useSimilarityMatrix && this.similarityMatrix) {
      const matrixResult = this.recommendFromMatrix(
        tenantId, memberId, myItems, productAdapter, purchaseAdapter,
        limit, excludeItemIds,
      )
      if (matrixResult.length > 0) {
        return matrixResult
      }
    }

    return this.recommendRealTime(
      tenantId, memberId, myItems, productAdapter, purchaseAdapter,
      limit, options, excludeItemIds,
    )
  }

  /**
   * 从预计算用户相似度矩阵获取推荐
   */
  private recommendFromMatrix(
    tenantId: string,
    memberId: string,
    myItems: Set<string>,
    productAdapter: ProductAdapter,
    purchaseAdapter: PurchaseHistoryAdapter,
    limit: number,
    excludeItemIds: Set<string>,
  ): Candidate[] {
    if (!this.similarityMatrix) return []

    const similarUsers = this.similarityMatrix.getSimilarUsers(tenantId, memberId, 10)
    if (similarUsers.length === 0) return []

    const allProducts = productAdapter.queryAllWithMetrics(tenantId)
    const productMap = new Map(allProducts.map(p => [p.id, p] as [string, any]))

    const candidates = new Map<string, { score: number; sourceUsers: string[] }>()

    for (const { userB: otherId, similarity } of similarUsers) {
      const otherPurchases = purchaseAdapter.queryMemberPurchases(tenantId, otherId)
      for (const p of otherPurchases) {
        if (myItems.has(p.itemId)) continue
        if (excludeItemIds.has(p.itemId)) continue

        const existing = candidates.get(p.itemId) ?? { score: 0, sourceUsers: [] }
        existing.score += similarity
        existing.sourceUsers.push(otherId)
        candidates.set(p.itemId, existing)
      }
    }

    const result: Candidate[] = []
    for (const [itemId, { score, sourceUsers }] of candidates) {
      const product = productMap.get(itemId)
      if (!product) continue
      result.push({
        itemId,
        score: Math.min(1, score / Math.max(1, similarUsers.length)),
        reasoning: `${sourceUsers.length} 位相似会员买过`,
        strategy: 'user-cf',
        metadata: {
          sourceUsers: sourceUsers.slice(0, 3),
          fromMatrix: true,
        },
      })
    }

    result.sort((a, b) => b.score - a.score)
    return result.slice(0, limit)
  }

  /**
   * 实时计算用户协同过滤 (V18 D3: 加入时间衰减)
   */
  private recommendRealTime(
    tenantId: string,
    memberId: string,
    myItems: Set<string>,
    productAdapter: ProductAdapter,
    purchaseAdapter: PurchaseHistoryAdapter,
    limit: number,
    options: UserCFOptions,
    excludeItemIds: Set<string>,
  ): Candidate[] {
    // 找出所有其他会员及其购买历史
    const allPurchases = purchaseAdapter.queryAllPurchases(tenantId)
    const memberPurchasesMap = new Map<string, Set<string>>()
    const memberPurchaseDetails = new Map<string, { itemId: string; timestamp: number }[]>()

    const now = Date.now()

    for (const p of allPurchases) {
      if (p.memberId === memberId) continue

      // 构建购买的 Set
      const set = memberPurchasesMap.get(p.memberId) ?? new Set()
      set.add(p.itemId)
      memberPurchasesMap.set(p.memberId, set)

      // V18 D3: 保存时间戳用于衰减
      const details = memberPurchaseDetails.get(p.memberId) ?? []
      details.push({
        itemId: p.itemId,
        timestamp: this.timeDecay
          ? this.timeDecay.parseTimestamp(p.purchasedAt)
          : new Date(p.purchasedAt).getTime(),
      })
      memberPurchaseDetails.set(p.memberId, details)
    }

    // 计算与每个会员的相似度 (含时间衰减)
    const similarities: { memberId: string; similarity: number }[] = []

    for (const [otherMemberId, otherItems] of memberPurchasesMap) {
      let common = 0

      // V18 D3: 时间衰减增强的共现计算
      if (options.useTimeDecay && this.timeDecay) {
        const myDetails = myPurchasesWithTimestamps(purchaseAdapter, tenantId, memberId)

        for (const myItem of myDetails) {
          if (otherItems.has(myItem.itemId)) {
            // 当前会员的购买时间衰减
            const weight = this.timeDecay.computeWeight(myItem.timestamp, now)
            common += weight
          }
        }
      } else {
        for (const item of myItems) {
          if (otherItems.has(item)) common++
        }
      }

      if (common === 0) continue
      const similarity = common / Math.sqrt(myItems.size * otherItems.size)
      similarities.push({ memberId: otherMemberId, similarity })
    }

    similarities.sort((a, b) => b.similarity - a.similarity)
    const topK = similarities.slice(0, 10)

    // 聚合 topK 会员买过的商品 (排除 myItems + excludeItemIds)
    const candidates = new Map<string, { score: number; sourceMembers: string[] }>()
    for (const { memberId: otherId, similarity } of topK) {
      const otherItems = memberPurchasesMap.get(otherId) ?? new Set()
      for (const itemId of otherItems) {
        if (myItems.has(itemId)) continue
        if (excludeItemIds.has(itemId)) continue

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
        metadata: {
          sourceMembers: sourceMembers.slice(0, 3),
          timeDecayed: options.useTimeDecay,
        },
      })
    }

    result.sort((a, b) => b.score - a.score)
    return result.slice(0, limit)
  }
}

/**
 * 带时间戳的会员购买详情
 */
function myPurchasesWithTimestamps(
  purchaseAdapter: PurchaseHistoryAdapter,
  tenantId: string,
  memberId: string,
): { itemId: string; timestamp: number }[] {
  const purchases = purchaseAdapter.queryMemberPurchases(tenantId, memberId)
  return purchases.map(p => ({
    itemId: p.itemId,
    timestamp: new Date(p.purchasedAt).getTime(),
  }))
}
