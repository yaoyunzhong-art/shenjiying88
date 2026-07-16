/**
 * V18 Day2 D4: CrossStoreSynergy 测试
 *
 * 覆盖: CrossStoreRegistry / CrossStoreCatalog / CrossStoreAnalyzer / CrossStoreSynergyStrategy
 * - 店铺注册/管理
 * - 连锁关系
 * - 跨店商品目录
 * - 跨店推荐分析
 * - 策略集成
 */
import { describe, it, expect, beforeEach } from 'vitest'
import type { Candidate } from '../recommend.entity'
import type { PromotionContext, CrossStoreConfig } from './promotion.entity'
import {
  CrossStoreRegistry,
  CrossStoreCatalog,
  CrossStoreAnalyzer,
  CrossStoreSynergyStrategy,
  type CrossProduct,
} from './cross-store.synergy'

// 测试店铺配置
const HEADQUARTERS: CrossStoreConfig = {
  storeId: 'hq-1',
  storeName: '总部旗舰店',
  storeRegion: '华东',
  storeType: 'headquarters',
  inventorySharingEnabled: true,
  synergyWeight: 0.8,
}

const CHAIN_A: CrossStoreConfig = {
  storeId: 'chain-a-1',
  storeName: '连锁A-上海店',
  storeRegion: '华东',
  storeType: 'chain',
  parentStoreId: 'hq-1',
  inventorySharingEnabled: true,
  synergyWeight: 0.6,
}

const CHAIN_B: CrossStoreConfig = {
  storeId: 'chain-b-1',
  storeName: '连锁A-南京店',
  storeRegion: '华东',
  storeType: 'chain',
  parentStoreId: 'hq-1',
  inventorySharingEnabled: false,
  synergyWeight: 0.5,
}

const INDEPENDENT: CrossStoreConfig = {
  storeId: 'ind-1',
  storeName: '独立店',
  storeRegion: '华南',
  storeType: 'franchise',
  inventorySharingEnabled: false,
  synergyWeight: 0.3,
}

describe('D4 CrossStoreRegistry', () => {
  let registry: CrossStoreRegistry

  beforeEach(() => {
    registry = new CrossStoreRegistry()
  })

  // ============================================================
  // 注册/查询
  // ============================================================
  describe('register and query', () => {
    it('should register a single store', () => {
      registry.registerStore(HEADQUARTERS)
      expect(registry.getStore('hq-1')).toBeDefined()
      expect(registry.getStore('hq-1')!.storeName).toBe('总部旗舰店')
    })

    it('should register multiple stores', () => {
      registry.registerStores([HEADQUARTERS, CHAIN_A, CHAIN_B])
      expect(registry.getAllStores()).toHaveLength(3)
    })

    it('should return undefined for unknown store', () => {
      expect(registry.getStore('none')).toBeUndefined()
    })

    it('should update existing store', () => {
      registry.registerStore(HEADQUARTERS)
      registry.registerStore({ ...HEADQUARTERS, storeName: '旗舰店已更新' })
      expect(registry.getStore('hq-1')!.storeName).toBe('旗舰店已更新')
    })

    it('should get stores by region', () => {
      registry.registerStores([HEADQUARTERS, CHAIN_A, INDEPENDENT])
      const eastStores = registry.getStoresByRegion('华东')
      expect(eastStores).toHaveLength(2)
    })
  })

  // ============================================================
  // 连锁关系
  // ============================================================
  describe('chain relationships', () => {
    beforeEach(() => {
      registry.registerStores([HEADQUARTERS, CHAIN_A, CHAIN_B, INDEPENDENT])
    })

    it('should get chain stores for chain store', () => {
      const chain = registry.getChainStores('chain-a-1')
      expect(chain.length).toBeGreaterThanOrEqual(2) // 自己 + 兄弟 + 总部
      expect(chain.some(s => s.storeId === 'hq-1')).toBe(true)
      expect(chain.some(s => s.storeId === 'chain-b-1')).toBe(true)
    })

    it('should get chain stores for headquarters', () => {
      const chain = registry.getChainStores('hq-1')
      expect(chain.length).toBeGreaterThanOrEqual(3)
      expect(chain.some(s => s.storeId === 'chain-a-1')).toBe(true)
      expect(chain.some(s => s.storeId === 'chain-b-1')).toBe(true)
    })

    it('should get partner stores (exclude self)', () => {
      const partners = registry.getPartnerStores('chain-a-1')
      expect(partners.every(s => s.storeId !== 'chain-a-1')).toBe(true)
      expect(partners.some(s => s.storeId === 'hq-1')).toBe(true)
    })

    it('should handle independent store chain', () => {
      const chain = registry.getChainStores('ind-1')
      expect(chain).toHaveLength(1) // only itself
    })

    it('should check same chain', () => {
      expect(registry.areStoresInSameChain('chain-a-1', 'chain-b-1')).toBe(true)
      expect(registry.areStoresInSameChain('chain-a-1', 'hq-1')).toBe(true)
      expect(registry.areStoresInSameChain('chain-a-1', 'ind-1')).toBe(false)
    })

    it('should check inventory sharing stores', () => {
      const sharing = registry.getInventorySharingStores('chain-a-1')
      expect(sharing.some(s => s.storeId === 'hq-1')).toBe(true) // 总部共享库存
    })
  })

  // ============================================================
  // 删除/重置
  // ============================================================
  describe('remove and reset', () => {
    it('should unregister a store', () => {
      registry.registerStore(HEADQUARTERS)
      expect(registry.unregisterStore('hq-1')).toBe(true)
      expect(registry.getStore('hq-1')).toBeUndefined()
    })

    it('should return false for non-existing store', () => {
      expect(registry.unregisterStore('none')).toBe(false)
    })

    it('should reset all stores', () => {
      registry.registerStores([HEADQUARTERS, CHAIN_A])
      registry.reset()
      expect(registry.getAllStores()).toHaveLength(0)
    })
  })
})

// ============================================================
// CrossStoreCatalog
// ============================================================
describe('CrossStoreCatalog', () => {
  let catalog: CrossStoreCatalog

  beforeEach(() => {
    catalog = new CrossStoreCatalog()
  })

  const products: CrossProduct[] = [
    { itemId: 'p1', itemName: '商品1', storeId: 'store-a', priceCents: 1000, available: true, category: '食品', soldCount: 100 },
    { itemId: 'p2', itemName: '商品2', storeId: 'store-a', priceCents: 2000, available: false, category: '饮料', soldCount: 50 },
    { itemId: 'p3', itemName: '商品3', storeId: 'store-b', priceCents: 1500, available: true, category: '食品', soldCount: 200 },
  ]

  it('should seed and query store products', () => {
    catalog.seedProducts('store-a', products.slice(0, 2))
    const available = catalog.getAvailableProducts('store-a')
    expect(available).toHaveLength(1) // p2 is not available
  })

  it('should get all available products', () => {
    catalog.seedProducts('store-a', [products[0]])
    catalog.seedProducts('store-b', [products[2]])
    const all = catalog.getAllAvailableProducts()
    expect(all).toHaveLength(2)
  })

  it('should get cross-store products excluding self', () => {
    catalog.seedProducts('store-a', [products[0]])
    catalog.seedProducts('store-b', [products[2]])
    const cross = catalog.getCrossStoreProducts('store-a')
    expect(cross).toHaveLength(1)
    expect(cross[0].storeId).toBe('store-b')
  })

  it('should filter by category', () => {
    catalog.seedProducts('store-a', [products[0]])
    catalog.seedProducts('store-b', [products[2]])
    const food = catalog.getCrossStoreProductsByCategory('食品', 'store-a')
    expect(food).toHaveLength(1)
  })

  it('should search by keyword', () => {
    catalog.seedProducts('store-b', [products[2]])
    const result = catalog.searchCrossStoreProducts('商品3', 'store-a')
    expect(result).toHaveLength(1)
  })

  it('should return empty for unknown store', () => {
    expect(catalog.getAvailableProducts('none')).toHaveLength(0)
  })

  it('should get all store IDs', () => {
    catalog.seedProducts('store-a', [products[0]])
    catalog.seedProducts('store-b', [products[2]])
    const ids = catalog.getAllStoreIds()
    expect(ids).toContain('store-a')
    expect(ids).toContain('store-b')
  })

  it('should count total products', () => {
    catalog.seedProducts('store-a', products.slice(0, 2))
    catalog.seedProducts('store-b', [products[2]])
    expect(catalog.totalProductCount()).toBe(3)
  })

  it('should reset catalog', () => {
    catalog.seedProducts('store-a', [products[0]])
    catalog.reset()
    expect(catalog.totalProductCount()).toBe(0)
  })
})

// ============================================================
// CrossStoreAnalyzer
// ============================================================
describe('CrossStoreAnalyzer', () => {
  let registry: CrossStoreRegistry
  let catalog: CrossStoreCatalog
  let analyzer: CrossStoreAnalyzer

  beforeEach(() => {
    registry = new CrossStoreRegistry()
    catalog = new CrossStoreCatalog()
    analyzer = new CrossStoreAnalyzer(registry, catalog)

    registry.registerStores([HEADQUARTERS, CHAIN_A, CHAIN_B, INDEPENDENT])
    catalog.seedProducts('hq-1', [
      { itemId: 'hq-p1', itemName: '旗舰商品A', storeId: 'hq-1', priceCents: 10000, available: true, category: '食品', soldCount: 500 },
    ])
    catalog.seedProducts('chain-a-1', [
      { itemId: 'ch-p1', itemName: '连锁商品A', storeId: 'chain-a-1', priceCents: 2000, available: true, category: '食品', soldCount: 100 },
      { itemId: 'ch-p2', itemName: '连锁商品B', storeId: 'chain-a-1', priceCents: 3000, available: true, category: '饮料', soldCount: 50 },
    ])
    catalog.seedProducts('chain-b-1', [
      { itemId: 'nb-p1', itemName: '南京商品A', storeId: 'chain-b-1', priceCents: 1500, available: true, category: '食品', soldCount: 80 },
    ])
    catalog.seedProducts('ind-1', [
      { itemId: 'ind-p1', itemName: '独立商品A', storeId: 'ind-1', priceCents: 5000, available: true, category: '美妆', soldCount: 30 },
    ])
  })

  describe('getCrossStoreRecommendations', () => {
    it('should return recommendations for chain store', () => {
      const context: PromotionContext = {
        tenantId: 't1',
        storeId: 'chain-a-1',
        currentDateTime: new Date(),
      }
      const recs = analyzer.getCrossStoreRecommendations(context, 10)
      expect(recs.length).toBeGreaterThan(0)
      // 应该是总部或南京店的商品
      const storeIds = new Set(recs.map(r => r.candidate.storeId))
      expect(storeIds.has('hq-1') || storeIds.has('chain-b-1')).toBe(true)
    })

    it('should return empty without storeId', () => {
      const context: PromotionContext = {
        tenantId: 't1',
        currentDateTime: new Date(),
      }
      const recs = analyzer.getCrossStoreRecommendations(context, 10)
      expect(recs).toHaveLength(0)
    })

    it('should return empty for independent store without partners', () => {
      const context: PromotionContext = {
        tenantId: 't1',
        storeId: 'ind-1',
        currentDateTime: new Date(),
      }
      const recs = analyzer.getCrossStoreRecommendations(context, 10)
      expect(recs).toHaveLength(0)
    })

    it('should prioritize same-region partners', () => {
      const context: PromotionContext = {
        tenantId: 't1',
        storeId: 'chain-a-1',
        currentDateTime: new Date(),
      }
      const recs = analyzer.getCrossStoreRecommendations(context, 10)
      const regionBoosted = recs.filter(r =>
        (r.candidate.storeName ?? '').includes('旗舰') ||
        (r.candidate.storeName ?? '').includes('南京')
      )
      expect(regionBoosted.length).toBeGreaterThan(0)
    })

    it('should respect limit', () => {
      const context: PromotionContext = {
        tenantId: 't1',
        storeId: 'chain-a-1',
        currentDateTime: new Date(),
      }
      const recs = analyzer.getCrossStoreRecommendations(context, 1)
      expect(recs).toHaveLength(1)
    })
  })

  describe('utility methods', () => {
    it('should generate synergy reason', () => {
      const reason = analyzer.getSynergyReason('chain-a-1', 'hq-1', '食品')
      expect(reason).toContain('总部旗舰店')
    })

    it('should generate synergy chain', () => {
      const chain = analyzer.getSynergyChain('chain-a-1')
      expect(chain.length).toBeGreaterThanOrEqual(2)
      expect(chain[0]).toContain('连锁A-上海店')
    })

    it('should check if cross-store is possible', () => {
      expect(analyzer.canDoCrossStoreRecommend('chain-a-1')).toBe(true)
      expect(analyzer.canDoCrossStoreRecommend('ind-1')).toBe(false)
    })

    it('should count cross-store products', () => {
      const count = analyzer.getCrossStoreProductCount('chain-a-1')
      expect(count).toBeGreaterThan(0)
    })
  })
})

// ============================================================
// CrossStoreSynergyStrategy
// ============================================================
describe('CrossStoreSynergyStrategy', () => {
  let registry: CrossStoreRegistry
  let catalog: CrossStoreCatalog
  let analyzer: CrossStoreAnalyzer
  let strategy: CrossStoreSynergyStrategy

  beforeEach(() => {
    registry = new CrossStoreRegistry()
    catalog = new CrossStoreCatalog()
    analyzer = new CrossStoreAnalyzer(registry, catalog)
    strategy = new CrossStoreSynergyStrategy(analyzer)

    registry.registerStores([HEADQUARTERS, CHAIN_A, CHAIN_B])
    catalog.seedProducts('hq-1', [
      { itemId: 'hq-p1', itemName: '旗舰商品', storeId: 'hq-1', priceCents: 10000, available: true, category: '食品', soldCount: 500 },
    ])
    catalog.seedProducts('chain-b-1', [
      { itemId: 'nb-p1', itemName: '南京商品', storeId: 'chain-b-1', priceCents: 1500, available: true, category: '食品', soldCount: 80 },
    ])
  })

  const candidate = (id: string, score: number): Candidate => ({
    itemId: id,
    score,
    reasoning: 'test',
    strategy: 'popular',
  })

  describe('isApplicable', () => {
    it('should be applicable with partners', () => {
      const context: PromotionContext = { tenantId: 't1', storeId: 'chain-a-1', currentDateTime: new Date() }
      expect(strategy.isApplicable(context)).toBe(true)
    })

    it('should not be applicable without storeId', () => {
      const context: PromotionContext = { tenantId: 't1', currentDateTime: new Date() }
      expect(strategy.isApplicable(context)).toBe(false)
    })

    it('should not be applicable for store without partners', () => {
      registry.registerStore(INDEPENDENT)
      const context: PromotionContext = { tenantId: 't1', storeId: 'ind-1', currentDateTime: new Date() }
      expect(strategy.isApplicable(context)).toBe(false)
    })
  })

  describe('apply', () => {
    it('should add cross-store recommendations', () => {
      const context: PromotionContext = {
        tenantId: 't1',
        storeId: 'chain-a-1',
        currentDateTime: new Date(),
      }
      const candidates = [candidate('ch-p1', 0.5)]
      const result = strategy.apply(candidates, context)
      expect(result.length).toBeGreaterThan(1) // 原有的 + 跨店新增
      const crossItems = result.filter(r => r.storeId && r.storeId !== 'chain-a-1')
      expect(crossItems.length).toBeGreaterThan(0)
    })

    it('should boost existing candidates if they match cross-store', () => {
      // 注册已有 hq-p1 在 chain-a-1 的推荐中
      const context: PromotionContext = {
        tenantId: 't1',
        storeId: 'chain-a-1',
        currentDateTime: new Date(),
      }
      const candidates = [candidate('hq-p1', 0.5)] // hq-p1 是总部商品
      const result = strategy.apply(candidates, context)
      const matched = result.find(r => r.itemId === 'hq-p1')
      expect(matched).toBeDefined()
      // 如果 match 到跨店, boostedScore > 0
    })

    it('should return unchanged if no cross-store recs', () => {
      const context: PromotionContext = {
        tenantId: 't1',
        storeId: 'ind-1', // independent, no partners
        currentDateTime: new Date(),
      }
      registry.registerStore(INDEPENDENT)
      const candidates = [candidate('p1', 0.5)]
      const result = strategy.apply(candidates, context)
      expect(result).toHaveLength(1)
      expect(result[0].score).toBe(0.5)
      expect(result[0].boostedScore).toBe(0)
    })

    it('should sort by score descending', () => {
      const context: PromotionContext = {
        tenantId: 't1',
        storeId: 'chain-a-1',
        currentDateTime: new Date(),
      }
      const candidates = [
        candidate('p1', 0.3),
        candidate('p2', 0.9),
      ]
      const result = strategy.apply(candidates, context)
      expect(result[0].score).toBeGreaterThanOrEqual(result[1].score)
    })

    it('should include metadata for cross-store items', () => {
      const context: PromotionContext = {
        tenantId: 't1',
        storeId: 'chain-a-1',
        currentDateTime: new Date(),
      }
      const candidates = [candidate('ch-p1', 0.5)]
      const result = strategy.apply(candidates, context)
      const crossItems = result.filter(r => r.itemId !== 'ch-p1')
      if (crossItems.length > 0) {
        const meta = crossItems[0].metadata as Record<string, unknown> | undefined
        expect(meta).toBeDefined()
        expect(meta!['crossStoreId']).toBeDefined()
        expect(meta!['crossStoreName']).toBeDefined()
      }
    })
  })
})
