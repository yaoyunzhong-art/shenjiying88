/**
 * V18 Day2 D4: CrossStoreSynergy (跨店协同)
 *
 * 连锁店铺间的协同推荐:
 * - 店铺间库存共享检查
 * - 同区域/跨区域推荐
 * - 跨店商品统一打分
 * - 总店到分店或分店间推荐
 *
 * 核心逻辑:
 * 1. 获取用户关联店铺
 * 2. 获取连锁店全部商品
 * 3. 按协同权重 + 跨店分数排序
 * 4. 标注跨店推荐来源
 */

import { Injectable } from '@nestjs/common'
import { BasePromotionStrategy } from './promotion.strategy'
import type { PromotionContext, PromotionCandidate } from './promotion.entity'
import type { Candidate } from '../recommend.entity'
import {
  type CrossStoreConfig,
  type CrossStoreProduct,
  type CrossStoreRecommendation,
  DEFAULT_CROSS_STORE_BOOST_FACTOR,
} from './promotion.entity'

// ============================================================
// 跨店店铺注册表
// ============================================================

@Injectable()
export class CrossStoreRegistry {
  private stores: Map<string, CrossStoreConfig> = new Map()

  /**
   * 注册或更新店铺
   */
  registerStore(config: CrossStoreConfig): void {
    this.stores.set(config.storeId, config)
  }

  /**
   * 批量注册店铺
   */
  registerStores(stores: CrossStoreConfig[]): void {
    for (const s of stores) {
      this.registerStore(s)
    }
  }

  /**
   * 获取店铺配置
   */
  getStore(storeId: string): CrossStoreConfig | undefined {
    return this.stores.get(storeId)
  }

  /**
   * 获取所有店铺
   */
  getAllStores(): CrossStoreConfig[] {
    return Array.from(this.stores.values())
  }

  /**
   * 获取同区域店铺
   */
  getStoresByRegion(region: string): CrossStoreConfig[] {
    return Array.from(this.stores.values())
      .filter(s => s.storeRegion === region)
  }

  /**
   * 获取连锁店铺 (同集团)
   */
  getChainStores(storeId: string): CrossStoreConfig[] {
    const store = this.stores.get(storeId)
    if (!store) return []

    const allStores = Array.from(this.stores.values())

    if (store.parentStoreId) {
      // 分店: 返回同一总店下的所有分店
      return allStores.filter(s =>
        s.parentStoreId === store.parentStoreId ||
        s.storeId === store.parentStoreId
      )
    }

    if (store.storeType === 'headquarters') {
      // 总店: 返回所有分店
      return allStores.filter(s =>
        s.parentStoreId === store.storeId || s.storeId === store.storeId
      )
    }

    // 独立店: 只返回自己
    return [store]
  }

  /**
   * 获取可用做协同推荐的店铺 (排除自身)
   */
  getPartnerStores(storeId: string): CrossStoreConfig[] {
    return this.getChainStores(storeId).filter(s => s.storeId !== storeId)
  }

  /**
   * 判断两家店是否属于同一连锁
   */
  areStoresInSameChain(storeA: string, storeB: string): boolean {
    const configA = this.stores.get(storeA)
    const configB = this.stores.get(storeB)
    if (!configA || !configB) return false

    if (configA.storeType === 'headquarters' && configB.parentStoreId === storeA) return true
    if (configB.storeType === 'headquarters' && configA.parentStoreId === storeB) return true
    if (configA.parentStoreId && configA.parentStoreId === configB.parentStoreId) return true
    if (configA.storeRegion && configB.storeRegion && configA.storeRegion === configB.storeRegion) return true

    return false
  }

  /**
   * 获取库存共享的店铺
   */
  getInventorySharingStores(storeId: string): CrossStoreConfig[] {
    return this.getChainStores(storeId).filter(s => s.inventorySharingEnabled)
  }

  /**
   * 移除店铺
   */
  unregisterStore(storeId: string): boolean {
    return this.stores.delete(storeId)
  }

  /**
   * 重置
   */
  reset(): void {
    this.stores.clear()
  }
}

// ============================================================
// 跨店商品目录 (模拟外部数据源)
// ============================================================

export interface CrossProduct {
  itemId: string
  itemName: string
  storeId: string
  priceCents: number
  available: boolean
  category: string
  soldCount: number
}

@Injectable()
export class CrossStoreCatalog {
  private products: Map<string, CrossProduct[]> = new Map()

  /**
   * 注册店铺商品
   */
  seedProducts(storeId: string, products: CrossProduct[]): void {
    this.products.set(storeId, products)
  }

  /**
   * 获取店铺所有可用商品
   */
  getAvailableProducts(storeId: string): CrossProduct[] {
    return (this.products.get(storeId) ?? []).filter(p => p.available)
  }

  /**
   * 获取所有店铺可用商品 (跨店用)
   */
  getAllAvailableProducts(): CrossProduct[] {
    const all: CrossProduct[] = []
    for (const products of this.products.values()) {
      all.push(...products.filter(p => p.available))
    }
    return all
  }

  /**
   * 获取跨店可用商品 (排除指定店铺)
   */
  getCrossStoreProducts(excludeStoreId: string): CrossProduct[] {
    return this.getAllAvailableProducts()
      .filter(p => p.storeId !== excludeStoreId)
  }

  /**
   * 按类目获取跨店商品
   */
  getCrossStoreProductsByCategory(
    category: string,
    excludeStoreId: string,
  ): CrossProduct[] {
    return this.getCrossStoreProducts(excludeStoreId)
      .filter(p => p.category === category)
  }

  /**
   * 搜索跨店商品
   */
  searchCrossStoreProducts(
    keyword: string,
    excludeStoreId: string,
  ): CrossProduct[] {
    const lower = keyword.toLowerCase()
    return this.getCrossStoreProducts(excludeStoreId)
      .filter(p => p.itemName.toLowerCase().includes(lower))
  }

  /**
   * 获取所有店铺 ID
   */
  getAllStoreIds(): string[] {
    return Array.from(this.products.keys())
  }

  /**
   * 获取商品总数
   */
  totalProductCount(): number {
    let count = 0
    for (const products of this.products.values()) {
      count += products.length
    }
    return count
  }

  /**
   * 重置
   */
  reset(): void {
    this.products.clear()
  }
}

// ============================================================
// 跨店协同分析器
// ============================================================

@Injectable()
export class CrossStoreAnalyzer {
  constructor(
    private readonly registry: CrossStoreRegistry,
    private readonly catalog: CrossStoreCatalog,
  ) {}

  /**
   * 获取跨店推荐
   */
  getCrossStoreRecommendations(
    context: PromotionContext,
    limit: number = 10,
  ): CrossStoreRecommendation[] {
    if (!context.storeId) return []

    const partnerStores = this.registry.getPartnerStores(context.storeId)
    if (partnerStores.length === 0) return []

    const recommendations: CrossStoreRecommendation[] = []

    for (const partner of partnerStores) {
      const partnerProducts = this.catalog.getAvailableProducts(partner.storeId)

      for (const product of partnerProducts) {
        let boostFactor = DEFAULT_CROSS_STORE_BOOST_FACTOR

        // 同区域加权
        const currentStore = this.registry.getStore(context.storeId)
        if (currentStore && currentStore.storeRegion === partner.storeRegion) {
          boostFactor += 0.2
        }

        // 库存共享加权
        if (partner.inventorySharingEnabled) {
          boostFactor += 0.1
        }

        // 类目匹配加权
        if (context.itemCategory && product.category === context.itemCategory) {
          boostFactor += 0.3
        }

        // 销量加权
        const salesWeight = Math.min(1, product.soldCount / 1000) * 0.2

        const crossStoreProduct: CrossStoreProduct = {
          itemId: product.itemId,
          itemName: product.itemName,
          storeId: product.storeId,
          storeName: partner.storeName,
          category: product.category,
          priceCents: product.priceCents,
          available: product.available,
          crossStoreScore: Math.min(1, boostFactor + salesWeight),
        }

        recommendations.push({
          candidate: crossStoreProduct,
          synergyReason: `来自${partner.storeName}的协同推荐`,
          boostFactor,
        })
      }
    }

    // 按分数降序
    return recommendations
      .sort((a, b) => b.candidate.crossStoreScore - a.candidate.crossStoreScore)
      .slice(0, limit)
  }

  /**
   * 获取跨店推荐理由
   */
  getSynergyReason(
    storeA: string,
    storeB: string,
    productCategory: string,
  ): string {
    const configA = this.registry.getStore(storeA)
    const configB = this.registry.getStore(storeB)

    if (!configA || !configB) return '跨店推荐'

    const parts: string[] = []

    if (configA.storeRegion === configB.storeRegion) {
      parts.push(`同区域(${configA.storeRegion})`)
    }

    if (configA.parentStoreId === configB.parentStoreId) {
      parts.push('同连锁')
    }

    if (configB.inventorySharingEnabled) {
      parts.push('库存共享')
    }

    if (parts.length > 0) {
      return `${configB.storeName} ${parts.join('·')} · ${productCategory}系列`
    }

    return `${configB.storeName} 推荐 · ${productCategory}系列`
  }

  /**
   * 获取跨店协同链路信息
   */
  getSynergyChain(storeId: string): string[] {
    const partners = this.registry.getPartnerStores(storeId)
    if (partners.length === 0) return [this.registry.getStore(storeId)?.storeName ?? '未知店铺']

    const chain: string[] = []
    const currentStore = this.registry.getStore(storeId)
    if (currentStore) chain.push(currentStore.storeName)

    for (const partner of partners) {
      chain.push(`→ ${partner.storeName}(${partner.storeRegion})`)
    }

    return chain
  }

  /**
   * 判断是否可以做跨店推荐
   */
  canDoCrossStoreRecommend(storeId: string): boolean {
    const partners = this.registry.getPartnerStores(storeId)
    return partners.length > 0
  }

  /**
   * 获取跨店覆盖商品数
   */
  getCrossStoreProductCount(storeId: string): number {
    const partners = this.registry.getPartnerStores(storeId)
    let count = 0
    for (const partner of partners) {
      count += this.catalog.getAvailableProducts(partner.storeId).length
    }
    return count
  }
}

// ============================================================
// 跨店协同推广策略 (实现 IPromotionStrategy)
// ============================================================

@Injectable()
export class CrossStoreSynergyStrategy extends BasePromotionStrategy {
  readonly type = 'cross-store-synergy' as const
  readonly name = '跨店协同'
  readonly priority = 40

  constructor(
    private readonly analyzer: CrossStoreAnalyzer,
  ) {
    super()
  }

  isApplicable(context: PromotionContext): boolean {
    if (!context.storeId) return false
    return this.analyzer.canDoCrossStoreRecommend(context.storeId)
  }

  apply(
    candidates: Candidate[],
    context: PromotionContext,
  ): PromotionCandidate[] {
    const crossRecommendations = this.analyzer.getCrossStoreRecommendations(
      context,
      candidates.length,
    )

    if (crossRecommendations.length === 0) {
      return candidates.map(c => ({
        itemId: c.itemId,
        score: c.score,
        baseScore: c.score,
        boostedScore: 0,
        strategy: this.type,
        reasoning: c.reasoning,
        metadata: c.metadata,
      }))
    }

    // 原有候选 + 跨店候选 (但跨店商品打分从原推荐加分, 不是独立替换)
    const existingItemIds = new Set(candidates.map(c => c.itemId))
    const promotionCandidates: PromotionCandidate[] = candidates.map(c => {
      const crossItem = crossRecommendations.find(r => r.candidate.itemId === c.itemId)
      if (crossItem) {
        // 已存在于推荐中 → 增强
        return this.toPromotionCandidate(
          c,
          this.type,
          crossItem.synergyReason,
          crossItem.boostFactor,
          {
            crossStoreId: crossItem.candidate.storeId,
            crossStoreName: crossItem.candidate.storeName,
          },
        )
      }
      return {
        itemId: c.itemId,
        score: c.score,
        baseScore: c.score,
        boostedScore: 0,
        strategy: this.type,
        reasoning: c.reasoning,
        metadata: c.metadata,
      }
    })

    // 添加新的跨店商品
    for (const rec of crossRecommendations) {
      if (existingItemIds.has(rec.candidate.itemId)) continue
      const baseScore = rec.candidate.crossStoreScore
      const boostedScore = baseScore * rec.boostFactor
      promotionCandidates.push({
        itemId: rec.candidate.itemId,
        score: Math.min(1, boostedScore),
        baseScore,
        boostedScore,
        strategy: this.type,
        reasoning: rec.synergyReason,
        storeId: rec.candidate.storeId,
        metadata: {
          crossStoreId: rec.candidate.storeId,
          crossStoreName: rec.candidate.storeName,
          boostFactor: rec.boostFactor,
          category: rec.candidate.category,
          priceCents: rec.candidate.priceCents,
        },
      })
    }

    // 按分数降序
    return promotionCandidates.sort((a, b) => b.score - a.score)
  }
}
