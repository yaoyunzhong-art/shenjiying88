import { randomUUID } from 'node:crypto'
import { Injectable, NotFoundException } from '@nestjs/common'
import { PriceCategory, type PriceItem } from './price-monitor.entity'

// ═══════════════════════════════════════════════════════════════════════
// In-memory store
// ═══════════════════════════════════════════════════════════════════════

const priceStore = new Map<string, PriceItem>()

// ═══════════════════════════════════════════════════════════════════════
// Mock data — 10 条，覆盖 game / food / vip / membership 分类
// ═══════════════════════════════════════════════════════════════════════

let seeded = false

function seedMockPrices(): void {
  if (seeded) return
  seeded = true

  const tenant = 'tenant-001'
  const now = new Date().toISOString()

  interface MockData {
    storeId: string
    storeName: string
    itemName: string
    category: PriceCategory
    price: number
    marketAvgPrice: number
  }

  const mockPrices: MockData[] = [
    // ── Game 游戏品类 ──
    { storeId: 'store-001', storeName: '深圳万象城店', itemName: '街霸6 投币',   category: PriceCategory.Game, price: 2,   marketAvgPrice: 3 },
    { storeId: 'store-002', storeName: '北京国贸店',   itemName: '赛车游戏 投币', category: PriceCategory.Game, price: 3,   marketAvgPrice: 3 },
    { storeId: 'store-003', storeName: '上海南京路店', itemName: '抓娃娃 投币',   category: PriceCategory.Game, price: 4,   marketAvgPrice: 3 },
    // ── Food 食品饮品 ──
    { storeId: 'store-001', storeName: '深圳万象城店', itemName: '可乐 330ml',    category: PriceCategory.Food, price: 5,   marketAvgPrice: 4 },
    { storeId: 'store-002', storeName: '北京国贸店',   itemName: '爆米花 小份',   category: PriceCategory.Food, price: 12,  marketAvgPrice: 10 },
    // ── Vip 会员卡 ──
    { storeId: 'store-003', storeName: '上海南京路店', itemName: '月卡 畅玩',     category: PriceCategory.Vip, price: 299, marketAvgPrice: 249 },
    { storeId: 'store-004', storeName: '广州天河城店', itemName: '季卡 畅玩',     category: PriceCategory.Vip, price: 699, marketAvgPrice: 599 },
    // ── Membership 会员 ──
    { storeId: 'store-001', storeName: '深圳万象城店', itemName: '黄金会员 月费', category: PriceCategory.Membership, price: 39,  marketAvgPrice: 49 },
    { storeId: 'store-005', storeName: '成都春熙路店', itemName: '钻石会员 年费', category: PriceCategory.Membership, price: 499, marketAvgPrice: 499 },
    { storeId: 'store-006', storeName: '杭州西湖店',   itemName: '白银会员 月费', category: PriceCategory.Membership, price: 19,  marketAvgPrice: 29 },
  ]

  for (const m of mockPrices) {
    const priceDiff = m.price - m.marketAvgPrice
    const diffPercent = m.marketAvgPrice > 0
      ? Number(((priceDiff / m.marketAvgPrice) * 100).toFixed(1))
      : 0
    const isAnomaly = Math.abs(diffPercent) > 20

    const item: PriceItem = {
      id: `price-${randomUUID()}`,
      storeId: m.storeId,
      storeName: m.storeName,
      itemName: m.itemName,
      category: m.category,
      price: m.price,
      marketAvgPrice: m.marketAvgPrice,
      priceDiff,
      diffPercent,
      isAnomaly,
      tenantId: tenant,
      updatedAt: now,
    }
    priceStore.set(item.id, item)
  }
}

@Injectable()
export class PriceMonitorService {
  // ═══════════════════════════════════════════════════════════════════
  // CRUD
  // ═══════════════════════════════════════════════════════════════════

  create(input: {
    tenantId: string
    storeId: string
    storeName: string
    itemName: string
    category: PriceCategory
    price: number
    marketAvgPrice: number
  }): PriceItem {
    const priceDiff = input.price - input.marketAvgPrice
    const diffPercent = input.marketAvgPrice > 0
      ? Number(((priceDiff / input.marketAvgPrice) * 100).toFixed(1))
      : 0

    const item: PriceItem = {
      id: `price-${randomUUID()}`,
      storeId: input.storeId,
      storeName: input.storeName,
      itemName: input.itemName,
      category: input.category,
      price: input.price,
      marketAvgPrice: input.marketAvgPrice,
      priceDiff,
      diffPercent,
      isAnomaly: Math.abs(diffPercent) > 20,
      tenantId: input.tenantId,
      updatedAt: new Date().toISOString(),
    }
    priceStore.set(item.id, item)
    return item
  }

  get(id: string, tenantId: string): PriceItem | undefined {
    const item = priceStore.get(id)
    if (!item || item.tenantId !== tenantId) return undefined
    return item
  }

  require(id: string, tenantId: string): PriceItem {
    const item = this.get(id, tenantId)
    if (!item) {
      throw new NotFoundException(`Price item not found: ${id}`)
    }
    return item
  }

  list(
    tenantId: string,
    filter?: {
      storeId?: string
      category?: PriceCategory
      minPrice?: number
      maxPrice?: number
    }
  ): PriceItem[] {
    seedMockPrices()

    let items = Array.from(priceStore.values())
      .filter((r) => r.tenantId === tenantId)
      .filter((r) => (filter?.storeId ? r.storeId === filter.storeId : true))
      .filter((r) => (filter?.category ? r.category === filter.category : true))
      .filter((r) => (filter?.minPrice !== undefined ? r.price >= filter.minPrice : true))
      .filter((r) => (filter?.maxPrice !== undefined ? r.price <= filter.maxPrice : true))

    // Most recent first
    items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    return items
  }

  delete(id: string, tenantId: string): void {
    this.require(id, tenantId)
    priceStore.delete(id)
  }

  // ═══════════════════════════════════════════════════════════════════
  // 对比市场均价
  // ═══════════════════════════════════════════════════════════════════

  getPriceComparison(
    tenantId: string,
    filter?: { storeId?: string; category?: PriceCategory }
  ): Array<{
    storeId: string
    storeName: string
    itemName: string
    price: number
    marketAvgPrice: number
    diffPercent: number
  }> {
    const items = this.list(tenantId, filter)
    return items.map((item) => ({
      storeId: item.storeId,
      storeName: item.storeName,
      itemName: item.itemName,
      price: item.price,
      marketAvgPrice: item.marketAvgPrice,
      diffPercent: item.diffPercent,
    }))
  }

  // ═══════════════════════════════════════════════════════════════════
  // 价格异常检测 — 偏离市场均价 > 20%
  // ═══════════════════════════════════════════════════════════════════

  getAnomalies(
    tenantId: string,
    filter?: { storeId?: string; category?: PriceCategory; minDiffPercent?: number }
  ): PriceItem[] {
    const threshold = filter?.minDiffPercent ?? 20

    const items = this.list(tenantId, {
      storeId: filter?.storeId,
      category: filter?.category,
    })

    return items.filter((item) => Math.abs(item.diffPercent) >= threshold)
  }

  // ═══════════════════════════════════════════════════════════════════
  // 价格监控摘要
  // ═══════════════════════════════════════════════════════════════════

  getSummary(
    tenantId: string,
    filter?: { storeId?: string; category?: PriceCategory }
  ): {
    totalItems: number
    avgPrice: number
    avgMarketPrice: number
    lowestPriceStore: string
    highestPriceStore: string
    avgDiffPercent: number
  } {
    const items = this.list(tenantId, filter)

    if (items.length === 0) {
      return {
        totalItems: 0,
        avgPrice: 0,
        avgMarketPrice: 0,
        lowestPriceStore: '',
        highestPriceStore: '',
        avgDiffPercent: 0,
      }
    }

    const avgPrice = Number(
      (items.reduce((s, i) => s + i.price, 0) / items.length).toFixed(2)
    )
    const avgMarketPrice = Number(
      (items.reduce((s, i) => s + i.marketAvgPrice, 0) / items.length).toFixed(2)
    )
    const avgDiffPercent = Number(
      (items.reduce((s, i) => s + i.diffPercent, 0) / items.length).toFixed(1)
    )

    const sortedByPrice = [...items].sort((a, b) => a.price - b.price)
    const lowestPriceStore = sortedByPrice[0].storeName
    const highestPriceStore = sortedByPrice[sortedByPrice.length - 1].storeName

    return {
      totalItems: items.length,
      avgPrice,
      avgMarketPrice,
      lowestPriceStore,
      highestPriceStore,
      avgDiffPercent,
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // Test helpers
  // ═══════════════════════════════════════════════════════════════════

  resetStoreForTests(): void {
    priceStore.clear()
    seeded = false
  }
}
