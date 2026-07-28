/**
 * scout.service.spec.ts — 竞品侦察模块 Service 单元测试
 *
 * 覆盖: 所有 Prisma 代理方法 / 参数拼接 / 边界输入 / 聚合方法
 * 注意: ScoutService 依赖于 PrismaService，测试中使用 mock
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ScoutService } from './scout.service'

function createMockPrisma() {
  return {
    $queryRawUnsafe: vi.fn().mockResolvedValue([]),
  }
}

describe('ScoutService — 城市查询', () => {
  let svc: ScoutService
  let prisma: ReturnType<typeof createMockPrisma>

  beforeEach(() => {
    prisma = createMockPrisma()
    svc = new ScoutService(prisma as any)
  })

  it('getCities 不带 tier 参数', async () => {
    await svc.getCities()
    expect(prisma.$queryRawUnsafe).toHaveBeenCalledWith(
      expect.stringContaining('SELECT id, name, tier')
    )
  })

  it('getCities 带 tier 参数', async () => {
    await svc.getCities('1')
    expect(prisma.$queryRawUnsafe).toHaveBeenCalledWith(
      expect.stringContaining('WHERE tier = $1'),
      '1'
    )
  })
})

describe('ScoutService — 场馆查询', () => {
  let svc: ScoutService
  let prisma: ReturnType<typeof createMockPrisma>

  beforeEach(() => {
    prisma = createMockPrisma()
    svc = new ScoutService(prisma as any)
  })

  it('getVenues 无筛选条件', async () => {
    await svc.getVenues()
    expect(prisma.$queryRawUnsafe).toHaveBeenCalledWith(
      expect.stringContaining('SELECT * FROM venues'),
      expect.any(Number),
      expect.any(Number)
    )
  })

  it('getVenues 带 city 和 category 筛选', async () => {
    await svc.getVenues('北京', '电玩城', 10, 0)
    const sql = (prisma.$queryRawUnsafe.mock.calls[0] as string[])[0]!
    expect(sql).toContain('WHERE')
    expect(sql).toContain('city = $1')
    expect(sql).toContain('category = $2')
  })

  it('getVenues 使用默认 limit 和 offset', async () => {
    await svc.getVenues()
    const call = prisma.$queryRawUnsafe.mock.calls[0] as [string, ...any[]]
    expect(call[0]).toContain('LIMIT $1')
    expect(call[1]).toBe(50)
    expect(call[2]).toBe(0)
  })
})

describe('ScoutService — 竞品详情查询', () => {
  let svc: ScoutService
  let prisma: ReturnType<typeof createMockPrisma>

  beforeEach(() => {
    prisma = createMockPrisma()
    svc = new ScoutService(prisma as any)
  })

  it('getPrices 查询语句正确', async () => {
    await svc.getPrices(101)
    expect(prisma.$queryRawUnsafe).toHaveBeenCalledWith(
      'SELECT * FROM competitor_prices WHERE venue_id = $1 ORDER BY captured_at DESC',
      101
    )
  })

  it('getDevices 查询语句正确', async () => {
    await svc.getDevices(202)
    expect(prisma.$queryRawUnsafe).toHaveBeenCalledWith(
      'SELECT * FROM competitor_devices WHERE venue_id = $1',
      202
    )
  })

  it('getMembership 查询语句正确', async () => {
    await svc.getMembership(303)
    expect(prisma.$queryRawUnsafe).toHaveBeenCalledWith(
      'SELECT * FROM competitor_membership WHERE venue_id = $1',
      303
    )
  })

  it('getReviews 不带 sentiment', async () => {
    await svc.getReviews(404)
    expect(prisma.$queryRawUnsafe).toHaveBeenCalledWith(
      'SELECT * FROM competitor_reviews WHERE venue_id = $1 ORDER BY posted_at DESC',
      404
    )
  })

  it('getReviews 带 sentiment', async () => {
    await svc.getReviews(505, 'positive')
    expect(prisma.$queryRawUnsafe).toHaveBeenCalledWith(
      'SELECT * FROM competitor_reviews WHERE venue_id = $1 AND sentiment = $2 ORDER BY posted_at DESC',
      505, 'positive'
    )
  })

  it('getActivities 查询语句正确', async () => {
    await svc.getActivities(606)
    expect(prisma.$queryRawUnsafe).toHaveBeenCalledWith(
      'SELECT * FROM competitor_activities WHERE venue_id = $1 ORDER BY start_date DESC',
      606
    )
  })
})

describe('ScoutService — 日志与搜索', () => {
  let svc: ScoutService
  let prisma: ReturnType<typeof createMockPrisma>

  beforeEach(() => {
    prisma = createMockPrisma()
    svc = new ScoutService(prisma as any)
  })

  it('getCollectionLogs 不带 cityId', async () => {
    await svc.getCollectionLogs()
    expect(prisma.$queryRawUnsafe).toHaveBeenCalledWith(
      expect.stringContaining('ORDER BY created_at DESC LIMIT $1'),
      20
    )
  })

  it('getCollectionLogs 带 cityId', async () => {
    await svc.getCollectionLogs('city-001', 50)
    expect(prisma.$queryRawUnsafe).toHaveBeenCalledWith(
      expect.stringContaining('WHERE city_id = $1'),
      'city-001', 50
    )
  })

  it('searchVenues 使用 ILIKE 查询', async () => {
    await svc.searchVenues('神机营', 5)
    const sql = (prisma.$queryRawUnsafe.mock.calls[0] as string[])[0]!
    expect(sql).toContain('ILIKE')
    const params = prisma.$queryRawUnsafe.mock.calls[0]
    expect(params[1]).toBe('%神机营%')
    expect(params[2]).toBe(5)
  })
})

describe('ScoutService — 对比与聚合', () => {
  let svc: ScoutService
  let prisma: ReturnType<typeof createMockPrisma>

  beforeEach(() => {
    prisma = createMockPrisma()
    svc = new ScoutService(prisma as any)
  })

  it('compareVenues 空列表返回空对象', async () => {
    const result = await svc.compareVenues([])
    expect(result.prices).toEqual([])
    expect(result.devices).toEqual([])
    expect(result.memberships).toEqual([])
    expect(result.summary).toBeNull()
  })

  it('compareVenues 生成 IN 查询', async () => {
    prisma.$queryRawUnsafe.mockResolvedValue([])
    await svc.compareVenues([1, 2, 3])
    // Should call $queryRawUnsafe 3 times with IN clauses
    expect(prisma.$queryRawUnsafe).toHaveBeenCalledTimes(3)
    const calls = prisma.$queryRawUnsafe.mock.calls
    for (const call of calls) {
      const sql = call[0] as string
      expect(sql).toContain('IN ($1,$2,$3)')
    }
  })

  it('getComparisonSummary 返回 summary', async () => {
    prisma.$queryRawUnsafe.mockResolvedValue([])
    const summary = await svc.getComparisonSummary([1, 2, 3])
    expect(summary).toEqual({ totalVenues: 3, avgPriceItems: 0, avgDevices: 0 })
  })

  it('batchSnapshot 空城市返回空对比', async () => {
    prisma.$queryRawUnsafe.mockResolvedValue([])
    const result = await svc.batchSnapshot('北京')
    expect(result.prices).toEqual([])
  })

  it('getRegionStats 调用聚合查询', async () => {
    await svc.getRegionStats()
    expect(prisma.$queryRawUnsafe).toHaveBeenCalledWith(
      expect.stringContaining('GROUP BY region')
    )
  })

  it('getCollectionProgress 调用状态分组查询', async () => {
    await svc.getCollectionProgress()
    expect(prisma.$queryRawUnsafe).toHaveBeenCalledWith(
      expect.stringContaining('GROUP BY status')
    )
  })

  it('getRecentUpdated 调用联表查询', async () => {
    await svc.getRecentUpdated(5)
    expect(prisma.$queryRawUnsafe).toHaveBeenCalledWith(
      expect.stringContaining('JOIN scout_cities'),
      5
    )
  })
})
