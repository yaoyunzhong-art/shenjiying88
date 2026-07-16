// price-monitor.entity.ts · 价格监控 · 枚举 & 接口

// ═══════════════════════════════════════════════════════════════════════
// PriceCategory 枚举：商品分类
// ═══════════════════════════════════════════════════════════════════════

export enum PriceCategory {
  Game = 'game',
  Food = 'food',
  Vip = 'vip',
  Membership = 'membership',
}

// ═══════════════════════════════════════════════════════════════════════
// PriceItem 接口：价格监控条目
// ═══════════════════════════════════════════════════════════════════════

export interface PriceItem {
  id: string
  storeId: string
  storeName: string
  itemName: string
  category: PriceCategory
  price: number
  marketAvgPrice: number
  priceDiff: number
  diffPercent: number
  isAnomaly: boolean
  tenantId: string
  updatedAt: string
}
