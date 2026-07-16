import { randomUUID } from 'node:crypto'
import { Injectable, NotFoundException } from '@nestjs/common'
import { RankPeriod, RankMetric, type StoreRanking } from './store-rank.entity'

// ═══════════════════════════════════════════════════════════════════════
// In-memory store
// ═══════════════════════════════════════════════════════════════════════

const rankingStore = new Map<string, StoreRanking>()

// ═══════════════════════════════════════════════════════════════════════
// Mock data — 8 条，覆盖 revenue / growth / satisfaction / efficiency
// ═══════════════════════════════════════════════════════════════════════

let seeded = false

function seedMockRankings(): void {
  if (seeded) return
  seeded = true

  const tenant = 'tenant-001'
  const now = new Date().toISOString()

  const mockRankings: Array<{
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
  }> = [
    // ── Revenue 排行 ──
    {
      storeId: 'store-003',
      storeName: '上海南京路店',
      rank: 1, prevRank: 1,
      revenue: 1420000, growth: 5.19, satisfaction: 92, efficiency: 87,
      memberCount: 3800, deviceCount: 12, period: RankPeriod.Monthly, metric: RankMetric.Revenue,
    },
    {
      storeId: 'store-001',
      storeName: '深圳万象城店',
      rank: 2, prevRank: 2,
      revenue: 1285000, growth: 7.08, satisfaction: 90, efficiency: 85,
      memberCount: 4200, deviceCount: 15, period: RankPeriod.Monthly, metric: RankMetric.Revenue,
    },
    {
      storeId: 'store-002',
      storeName: '北京国贸店',
      rank: 3, prevRank: 3,
      revenue: 985000, growth: 3.68, satisfaction: 88, efficiency: 82,
      memberCount: 3100, deviceCount: 10, period: RankPeriod.Monthly, metric: RankMetric.Revenue,
    },
    // ── Growth 排行 ──
    {
      storeId: 'store-001',
      storeName: '深圳万象城店',
      rank: 1, prevRank: 2,
      revenue: 1285000, growth: 7.08, satisfaction: 90, efficiency: 85,
      memberCount: 4200, deviceCount: 15, period: RankPeriod.Monthly, metric: RankMetric.Growth,
    },
    {
      storeId: 'store-006',
      storeName: '杭州西湖店',
      rank: 2, prevRank: 4,
      revenue: 650000, growth: 4.84, satisfaction: 86, efficiency: 79,
      memberCount: 1800, deviceCount: 6, period: RankPeriod.Monthly, metric: RankMetric.Growth,
    },
    // ── Satisfaction 排行 ──
    {
      storeId: 'store-003',
      storeName: '上海南京路店',
      rank: 1, prevRank: 1,
      revenue: 1420000, growth: 5.19, satisfaction: 92, efficiency: 87,
      memberCount: 3800, deviceCount: 12, period: RankPeriod.Monthly, metric: RankMetric.Satisfaction,
    },
    {
      storeId: 'store-001',
      storeName: '深圳万象城店',
      rank: 2, prevRank: 3,
      revenue: 1285000, growth: 7.08, satisfaction: 90, efficiency: 85,
      memberCount: 4200, deviceCount: 15, period: RankPeriod.Monthly, metric: RankMetric.Satisfaction,
    },
    // ── Efficiency 排行 ──
    {
      storeId: 'store-001',
      storeName: '深圳万象城店',
      rank: 1, prevRank: 1,
      revenue: 1285000, growth: 7.08, satisfaction: 90, efficiency: 85,
      memberCount: 4200, deviceCount: 15, period: RankPeriod.Monthly, metric: RankMetric.Efficiency,
    },
  ]

  for (const m of mockRankings) {
    const ranking: StoreRanking = {
      id: `rank-${randomUUID()}`,
      storeId: m.storeId,
      storeName: m.storeName,
      rank: m.rank,
      prevRank: m.prevRank,
      revenue: m.revenue,
      growth: m.growth,
      satisfaction: m.satisfaction,
      efficiency: m.efficiency,
      memberCount: m.memberCount,
      deviceCount: m.deviceCount,
      period: m.period,
      metric: m.metric,
      tenantId: tenant,
      createdAt: now,
    }
    rankingStore.set(ranking.id, ranking)
  }
}

@Injectable()
export class StoreRankService {
  // ═══════════════════════════════════════════════════════════════════
  // CRUD
  // ═══════════════════════════════════════════════════════════════════

  create(input: {
    tenantId: string
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
  }): StoreRanking {
    const ranking: StoreRanking = {
      id: `rank-${randomUUID()}`,
      storeId: input.storeId,
      storeName: input.storeName,
      rank: input.rank,
      prevRank: input.prevRank,
      revenue: input.revenue,
      growth: input.growth,
      satisfaction: input.satisfaction,
      efficiency: input.efficiency,
      memberCount: input.memberCount,
      deviceCount: input.deviceCount,
      period: input.period,
      metric: input.metric,
      tenantId: input.tenantId,
      createdAt: new Date().toISOString(),
    }
    rankingStore.set(ranking.id, ranking)
    return ranking
  }

  get(id: string, tenantId: string): StoreRanking | undefined {
    const item = rankingStore.get(id)
    if (!item || item.tenantId !== tenantId) return undefined
    return item
  }

  require(id: string, tenantId: string): StoreRanking {
    const item = this.get(id, tenantId)
    if (!item) {
      throw new NotFoundException(`Store ranking not found: ${id}`)
    }
    return item
  }

  list(
    tenantId: string,
    filter?: {
      sortBy?: RankMetric
      period?: RankPeriod
      limit?: number
    }
  ): StoreRanking[] {
    seedMockRankings()

    let items = Array.from(rankingStore.values())
      .filter((r) => r.tenantId === tenantId)

    // ── Filter by period ──
    if (filter?.period) {
      items = items.filter((r) => r.period === filter.period)
    }

    // ── Sort & rank by metric ──
    if (filter?.sortBy) {
      items = items
        .filter((r) => r.metric === filter.sortBy)
        .sort((a, b) => {
          switch (filter.sortBy) {
            case RankMetric.Revenue:
              return b.revenue - a.revenue
            case RankMetric.Growth:
              return b.growth - a.growth
            case RankMetric.Satisfaction:
              return b.satisfaction - a.satisfaction
            case RankMetric.Efficiency:
              return b.efficiency - a.efficiency
            default:
              return a.rank - b.rank
          }
        })
    } else {
      items.sort((a, b) => a.rank - b.rank)
    }

    if (filter?.limit && filter.limit > 0) {
      items = items.slice(0, filter.limit)
    }

    return items
  }

  delete(id: string, tenantId: string): void {
    this.require(id, tenantId)
    rankingStore.delete(id)
  }

  // ═══════════════════════════════════════════════════════════════════
  // 排名计算
  // ═══════════════════════════════════════════════════════════════════

  computeRanking(
    input: {
      tenantId: string
      storeId: string
      storeName: string
      revenue: number
      growth: number
      satisfaction: number
      efficiency: number
      memberCount: number
      deviceCount: number
      period: RankPeriod
    }
  ): StoreRanking[] {
    // For each metric, generate a ranking entry
    const metrics = [RankMetric.Revenue, RankMetric.Growth, RankMetric.Satisfaction, RankMetric.Efficiency]
    const results: StoreRanking[] = []

    for (const metric of metrics) {
      // Find existing rankings for same metric/period to derive prevRank
      const existing = this.list(input.tenantId, { sortBy: metric, period: input.period })
      const existingIdx = existing.findIndex((r) => r.storeId === input.storeId)
      const prevRank = existingIdx >= 0 ? existingIdx + 1 : 0

      // Compute new rank: append + sort
      const mockValue = this.getMetricValue(input, metric)
      const allMetrics = [...existing, {
        storeId: input.storeId,
        storeName: input.storeName,
        prevRank: 0,
        rank: 0,
        revenue: input.revenue,
        growth: input.growth,
        satisfaction: input.satisfaction,
        efficiency: input.efficiency,
        memberCount: input.memberCount,
        deviceCount: input.deviceCount,
        metric,
        period: input.period,
        tenantId: input.tenantId,
        createdAt: '',
        id: '',
      } as StoreRanking].sort((a, b) => {
        const av = this.getMetricValue(a, metric)
        const bv = this.getMetricValue(b, metric)
        return bv - av
      })

      allMetrics.forEach((r, idx) => {
        r.rank = idx + 1
        if (r.storeId === input.storeId) {
          r.prevRank = prevRank
        }
      })

      // Create the new entry
      const me = allMetrics.find((r) => r.storeId === input.storeId)
      if (me) {
        const ranking = this.create({
          tenantId: input.tenantId,
          storeId: input.storeId,
          storeName: input.storeName,
          rank: me.rank,
          prevRank: me.prevRank,
          revenue: input.revenue,
          growth: input.growth,
          satisfaction: input.satisfaction,
          efficiency: input.efficiency,
          memberCount: input.memberCount,
          deviceCount: input.deviceCount,
          period: input.period,
          metric,
        })
        results.push(ranking)
      }
    }

    return results
  }

  // ═══════════════════════════════════════════════════════════════════
  // 排名变化追踪
  // ═══════════════════════════════════════════════════════════════════

  getRankChanges(
    tenantId: string,
    storeId?: string,
    period?: RankPeriod
  ): Array<{
    storeId: string
    storeName: string
    metric: RankMetric
    currentRank: number
    prevRank: number
    change: number // positive ⇢ improved; negative ⇢ declined
  }> {
    seedMockRankings()
    let items = Array.from(rankingStore.values())
      .filter((r) => r.tenantId === tenantId)
      .filter((r) => (storeId ? r.storeId === storeId : true))
      .filter((r) => (period ? r.period === period : true))

    const resultMap = new Map<string, {
      storeId: string
      storeName: string
      metric: RankMetric
      currentRank: number
      prevRank: number
    }>()

    // Take latest entry per store+metric (by creation order dedup)
    const seen = new Set<string>()
    items.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    for (const item of items) {
      const key = `${item.storeId}:${item.metric}`
      if (!seen.has(key)) {
        seen.add(key)
        resultMap.set(key, {
          storeId: item.storeId,
          storeName: item.storeName,
          metric: item.metric,
          currentRank: item.rank,
          prevRank: item.prevRank,
        })
      }
    }

    return Array.from(resultMap.values()).map((r) => ({
      ...r,
      change: Math.max(0, r.prevRank - r.currentRank), // positive = improved
    }))
  }

  // ═══════════════════════════════════════════════════════════════════
  // 排行摘要
  // ═══════════════════════════════════════════════════════════════════

  getSummary(
    tenantId: string,
    metric?: RankMetric,
    period?: RankPeriod
  ): {
    totalStores: number
    avgRevenue: number
    topStore: string
    improvedStores: number
    declinedStores: number
  } {
    seedMockRankings()

    let items = Array.from(rankingStore.values())
      .filter((r) => r.tenantId === tenantId)
      .filter((r) => (metric ? r.metric === metric : true))
      .filter((r) => (period ? r.period === period : true))

    const totalStores = new Set(items.map((r) => r.storeId)).size
    const avgRevenue = items.length > 0
      ? Math.round(items.reduce((s, r) => s + r.revenue, 0) / items.length)
      : 0

    // Top store = highest current rank across metrics
    const topStoreEntry = items.sort((a, b) => a.rank - b.rank)[0]
    const topStore = topStoreEntry?.storeName ?? 'N/A'

    // Count rank changes
    const changes = this.getRankChanges(tenantId, undefined, period)
    const improvedStores = changes.filter((c) => c.change > 0).length
    const declinedStores = changes.filter((c) => c.change < 0).length

    return { totalStores, avgRevenue, topStore, improvedStores, declinedStores }
  }

  // ═══════════════════════════════════════════════════════════════════
  // 工具
  // ═══════════════════════════════════════════════════════════════════

  private getMetricValue(ranking: { revenue: number; growth: number; satisfaction: number; efficiency: number }, metric: RankMetric): number {
    switch (metric) {
      case RankMetric.Revenue: return ranking.revenue
      case RankMetric.Growth: return ranking.growth
      case RankMetric.Satisfaction: return ranking.satisfaction
      case RankMetric.Efficiency: return ranking.efficiency
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // Test helpers
  // ═══════════════════════════════════════════════════════════════════

  resetStoreForTests(): void {
    rankingStore.clear()
    seeded = false
  }
}
