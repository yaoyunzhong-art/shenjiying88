// store-rank.entity.ts · 门店排行分析 · 枚举 & 接口

// ═══════════════════════════════════════════════════════════════════════
// RankPeriod 枚举：排行周期
// ═══════════════════════════════════════════════════════════════════════

export enum RankPeriod {
  Weekly = 'weekly',
  Monthly = 'monthly',
  Quarterly = 'quarterly',
}

// ═══════════════════════════════════════════════════════════════════════
// RankMetric 枚举：排名字段
// ═══════════════════════════════════════════════════════════════════════

export enum RankMetric {
  Revenue = 'revenue',
  Growth = 'growth',
  Satisfaction = 'satisfaction',
  Efficiency = 'efficiency',
}

// ═══════════════════════════════════════════════════════════════════════
// StoreRanking 接口：门店排行记录
// ═══════════════════════════════════════════════════════════════════════

export interface StoreRanking {
  id: string
  storeId: string
  storeName: string
  rank: number
  prevRank: number
  revenue: number
  growth: number
  satisfaction: number
  efficiency: number
  memberCount: number
  deviceCount: number
  period: RankPeriod
  metric: RankMetric
  tenantId: string
  createdAt: string
}
