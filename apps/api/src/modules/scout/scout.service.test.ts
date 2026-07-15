/**
 * scout.service.test.ts — Scout 服务单元测试
 *
 * 🐜 V17: thin-module-test-batch
 *
 * 覆盖:
 *   正例 × 8: SQL 生成逻辑 / 参数委托
 *   反例 × 4: 非法参数 / 空值
 *   边界 × 2: 超大 limit / 空搜索结果
 */

import { describe, it, expect, vi } from 'vitest'
import { ScoutService } from './scout.service'

describe('ScoutService', () => {
  // ── 正例 (8) ────────────────────────────────────────────────

  it('getCities 无 tier 参数调用 $queryRawUnsafe', async () => {
    const mockPrisma = { $queryRawUnsafe: vi.fn().mockResolvedValue([]) }
    const svc = new ScoutService(mockPrisma as any)
    await svc.getCities()
    expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalledOnce()
    const sql: string = mockPrisma.$queryRawUnsafe.mock.calls[0][0]
    expect(sql).toContain('scout_cities')
    expect(sql).not.toContain('WHERE')
  })

  it('getCities 传递 tier 参数生成带 WHERE 的 SQL', async () => {
    const mockPrisma = { $queryRawUnsafe: vi.fn().mockResolvedValue([]) }
    const svc = new ScoutService(mockPrisma as any)
    await svc.getCities('1')
    expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalledWith(
      expect.stringContaining('WHERE tier = $1'),
      '1'
    )
  })

  it('getVenues 无过滤调用 $queryRawUnsafe', async () => {
    const mockPrisma = { $queryRawUnsafe: vi.fn().mockResolvedValue([]) }
    const svc = new ScoutService(mockPrisma as any)
    await svc.getVenues()
    expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalledOnce()
    const sql: string = mockPrisma.$queryRawUnsafe.mock.calls[0][0]
    expect(sql).toContain('FROM venues')
    expect(sql).not.toContain('WHERE')
  })

  it('getVenues 传 city 和 category 生成过滤 SQL', async () => {
    const mockPrisma = { $queryRawUnsafe: vi.fn().mockResolvedValue([]) }
    const svc = new ScoutService(mockPrisma as any)
    await svc.getVenues('北京', '电竞', 10, 0)
    expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalledWith(
      expect.stringContaining('WHERE city = $1 AND category = $2'),
      '北京', '电竞', 10, 0
    )
  })

  it('getPrices 调用正确 SQL', async () => {
    const mockPrisma = { $queryRawUnsafe: vi.fn().mockResolvedValue([]) }
    const svc = new ScoutService(mockPrisma as any)
    await svc.getPrices(100)
    expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalledWith(
      expect.stringContaining('competitor_prices WHERE venue_id = $1'),
      100
    )
  })

  it('getDevices 调用正确 SQL', async () => {
    const mockPrisma = { $queryRawUnsafe: vi.fn().mockResolvedValue([]) }
    const svc = new ScoutService(mockPrisma as any)
    await svc.getDevices(200)
    expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalledWith(
      expect.stringContaining('competitor_devices WHERE venue_id = $1'),
      200
    )
  })

  it('getReviews 无 sentiment 不过滤', async () => {
    const mockPrisma = { $queryRawUnsafe: vi.fn().mockResolvedValue([]) }
    const svc = new ScoutService(mockPrisma as any)
    await svc.getReviews(50)
    expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalledOnce()
    const sql: string = mockPrisma.$queryRawUnsafe.mock.calls[0][0]
    expect(sql).toContain('venue_id')
    expect(sql).not.toContain('sentiment')
    expect(mockPrisma.$queryRawUnsafe.mock.calls[0][1]).toBe(50)
  })

  it('getReviews 传 sentiment 加 AND 过滤', async () => {
    const mockPrisma = { $queryRawUnsafe: vi.fn().mockResolvedValue([]) }
    const svc = new ScoutService(mockPrisma as any)
    await svc.getReviews(50, 'positive')
    expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalledWith(
      expect.stringContaining('AND sentiment = $2'),
      50, 'positive'
    )
  })

  // ── 反例 (4) ────────────────────────────────────────────────

  it('getVenues 传负 limit 仍执行（SQL 层会限制）', async () => {
    const mockPrisma = { $queryRawUnsafe: vi.fn().mockResolvedValue([]) }
    const svc = new ScoutService(mockPrisma as any)
    await svc.getVenues(undefined, undefined, -1)
    expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalledOnce()
  })

  it('getCollectionLogs 无 cityId 只传 limit', async () => {
    const mockPrisma = { $queryRawUnsafe: vi.fn().mockResolvedValue([]) }
    const svc = new ScoutService(mockPrisma as any)
    await svc.getCollectionLogs(undefined, 5)
    expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalledWith(
      expect.not.stringContaining('WHERE'),
      5
    )
  })

  it('getCollectionLogs 传 cityId 生成带 WHERE 的 SQL', async () => {
    const mockPrisma = { $queryRawUnsafe: vi.fn().mockResolvedValue([]) }
    const svc = new ScoutService(mockPrisma as any)
    await svc.getCollectionLogs('city-1', 10)
    expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalledWith(
      expect.stringContaining('WHERE city_id = $1'),
      'city-1', 10
    )
  })

  it('searchVenues 生成 ILIKE 查询', async () => {
    const mockPrisma = { $queryRawUnsafe: vi.fn().mockResolvedValue([]) }
    const svc = new ScoutService(mockPrisma as any)
    await svc.searchVenues('测试', 10)
    const sql: string = mockPrisma.$queryRawUnsafe.mock.calls[0][0]
    expect(sql).toContain('ILIKE')
    expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalledWith(
      expect.stringContaining('ILIKE'),
      '%测试%', 10
    )
  })

  // ── 边界 (2) ────────────────────────────────────────────────

  it('getActivities 传 0 作为 venueId 仍生成 SQL', async () => {
    const mockPrisma = { $queryRawUnsafe: vi.fn().mockResolvedValue([]) }
    const svc = new ScoutService(mockPrisma as any)
    await svc.getActivities(0)
    expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalledWith(
      expect.stringContaining('venue_id = $1'),
      0
    )
  })

  it('getMembership 任意 venueId 参数传递', async () => {
    const mockPrisma = { $queryRawUnsafe: vi.fn().mockResolvedValue([]) }
    const svc = new ScoutService(mockPrisma as any)
    await svc.getMembership(99999)
    expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalledWith(
      expect.stringContaining('competitor_membership WHERE venue_id = $1'),
      99999
    )
  })

  // ── 补充正例: 新增方法覆盖 (4) ───────────────────────────

  it('getActivities 委托正确的 SQL', async () => {
    const mockPrisma = { $queryRawUnsafe: vi.fn().mockResolvedValue([]) }
    const svc = new ScoutService(mockPrisma as any)
    await svc.getActivities(42)
    expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalledWith(
      expect.stringContaining('competitor_activities WHERE venue_id = $1'),
      42
    )
  })

  it('getVenues 默认 limit 为 50 offset 为 0', async () => {
    const mockPrisma = { $queryRawUnsafe: vi.fn().mockResolvedValue([]) }
    const svc = new ScoutService(mockPrisma as any)
    await svc.getVenues()
    const sql: string = mockPrisma.$queryRawUnsafe.mock.calls[0][0]
    expect(sql).toContain('LIMIT $1 OFFSET $2')
    expect(mockPrisma.$queryRawUnsafe.mock.calls[0][1]).toBe(50)
    expect(mockPrisma.$queryRawUnsafe.mock.calls[0][2]).toBe(0)
  })

  it('getVenues 只传 city 生成单条件 WHERE', async () => {
    const mockPrisma = { $queryRawUnsafe: vi.fn().mockResolvedValue([]) }
    const svc = new ScoutService(mockPrisma as any)
    await svc.getVenues('上海', undefined, 10, 0)
    const sql: string = mockPrisma.$queryRawUnsafe.mock.calls[0][0]
    expect(sql).toContain('WHERE city = $1')
    expect(sql).not.toContain('AND category')
    expect(mockPrisma.$queryRawUnsafe.mock.calls[0][1]).toBe('上海')
  })

  it('getVenues 只传 category 生成单条件 WHERE', async () => {
    const mockPrisma = { $queryRawUnsafe: vi.fn().mockResolvedValue([]) }
    const svc = new ScoutService(mockPrisma as any)
    await svc.getVenues(undefined, '电竞', 5, 0)
    const sql: string = mockPrisma.$queryRawUnsafe.mock.calls[0][0]
    expect(sql).toContain('WHERE category = $1')
    expect(sql).not.toContain('AND city')
  })

  // ── 补充反例: 边界参数 (3) ───────────────────────────────

  it('getPrices 传 0 作为 venueId 生成正确 SQL', async () => {
    const mockPrisma = { $queryRawUnsafe: vi.fn().mockResolvedValue([]) }
    const svc = new ScoutService(mockPrisma as any)
    await svc.getPrices(0)
    expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalledWith(
      expect.stringContaining('venue_id = $1'),
      0
    )
  })

  it('getReviews 传空字符串 sentiment 按空值处理（不过滤 sentiment）', async () => {
    const mockPrisma = { $queryRawUnsafe: vi.fn().mockResolvedValue([]) }
    const svc = new ScoutService(mockPrisma as any)
    await svc.getReviews(1, '')
    const sql: string = mockPrisma.$queryRawUnsafe.mock.calls[0][0]
    // Empty string is falsy, so no AND sentiment
    expect(sql).not.toContain('AND sentiment')
    expect(sql).toContain('venue_id = $1')
  })

  it('getVenues 传超大 limit 仍传递参数', async () => {
    const mockPrisma = { $queryRawUnsafe: vi.fn().mockResolvedValue([]) }
    const svc = new ScoutService(mockPrisma as any)
    await svc.getVenues(undefined, undefined, 100000, 0)
    expect(mockPrisma.$queryRawUnsafe.mock.calls[0][1]).toBe(100000)
  })

  // ── 补充: searchVenues 边界 (2) ──────────────────────────

  it('searchVenues 传空字符串生成 ILIKE %% 查询', async () => {
    const mockPrisma = { $queryRawUnsafe: vi.fn().mockResolvedValue([]) }
    const svc = new ScoutService(mockPrisma as any)
    await svc.searchVenues('', 10)
    const sql: string = mockPrisma.$queryRawUnsafe.mock.calls[0][0]
    expect(sql).toContain('ILIKE')
    expect(mockPrisma.$queryRawUnsafe.mock.calls[0][1]).toBe('%%')
  })

  it('searchVenues 传特殊字符 безопасно через ILIKE', async () => {
    const mockPrisma = { $queryRawUnsafe: vi.fn().mockResolvedValue([]) }
    const svc = new ScoutService(mockPrisma as any)
    await svc.searchVenues("test's bar", 5)
    const sql: string = mockPrisma.$queryRawUnsafe.mock.calls[0][0]
    expect(sql).toContain('ILIKE')
    expect(mockPrisma.$queryRawUnsafe.mock.calls[0][1]).toBe("%test's bar%")
  })

  // ── 补充: getCollectionLogs 边界 (1) ─────────────────────

  it('getCollectionLogs 默认 limit 为 20', async () => {
    const mockPrisma = { $queryRawUnsafe: vi.fn().mockResolvedValue([]) }
    const svc = new ScoutService(mockPrisma as any)
    await svc.getCollectionLogs(undefined)
    expect(mockPrisma.$queryRawUnsafe.mock.calls[0][1]).toBe(20)
  })

  // ── 新增: 补充测试 (8) ────────────────────────────────────

  it('getCities 传非空 tier 生成 WHERE 子句', async () => {
    const mockPrisma = { $queryRawUnsafe: vi.fn().mockResolvedValue([]) }
    const svc = new ScoutService(mockPrisma as any)
    await svc.getCities('1')
    const sql: string = mockPrisma.$queryRawUnsafe.mock.calls[0][0]
    expect(sql).toContain('WHERE tier = $1')
    expect(mockPrisma.$queryRawUnsafe.mock.calls[0][1]).toBe('1')
  })

  it('getCities 传 undefined tier 不生成 WHERE', async () => {
    const mockPrisma = { $queryRawUnsafe: vi.fn().mockResolvedValue([]) }
    const svc = new ScoutService(mockPrisma as any)
    await svc.getCities(undefined)
    const sql: string = mockPrisma.$queryRawUnsafe.mock.calls[0][0]
    expect(sql).not.toContain('WHERE')
  })

  it('getVenues 传 city 和负 offset 仍传递参数', async () => {
    const mockPrisma = { $queryRawUnsafe: vi.fn().mockResolvedValue([]) }
    const svc = new ScoutService(mockPrisma as any)
    await svc.getVenues('上海', undefined, 10, -1)
    expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalled()
    const params = mockPrisma.$queryRawUnsafe.mock.calls[0]
    expect(params.slice(1)).toEqual(['上海', 10, -1])
  })

  it('getVenues 传 city 和 category 参数顺序正确', async () => {
    const mockPrisma = { $queryRawUnsafe: vi.fn().mockResolvedValue([]) }
    const svc = new ScoutService(mockPrisma as any)
    await svc.getVenues('北京', '台球', 20, 5)
    const params = mockPrisma.$queryRawUnsafe.mock.calls[0]
    expect(params.slice(1)).toEqual(['北京', '台球', 20, 5])
  })

  it('getPrices 传负 venueId 仍生成 SQL', async () => {
    const mockPrisma = { $queryRawUnsafe: vi.fn().mockResolvedValue([]) }
    const svc = new ScoutService(mockPrisma as any)
    await svc.getPrices(-1)
    expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalledWith(
      expect.stringContaining('venue_id = $1'),
      -1
    )
  })

  it('getDevices 传大整数 venueId', async () => {
    const mockPrisma = { $queryRawUnsafe: vi.fn().mockResolvedValue([]) }
    const svc = new ScoutService(mockPrisma as any)
    await svc.getDevices(2147483647)
    expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalledWith(
      expect.stringContaining('competitor_devices'),
      2147483647
    )
  })

  it('getReviews 传 undefined sentiment 不添加 AND 条件', async () => {
    const mockPrisma = { $queryRawUnsafe: vi.fn().mockResolvedValue([]) }
    const svc = new ScoutService(mockPrisma as any)
    await svc.getReviews(1, undefined)
    const sql: string = mockPrisma.$queryRawUnsafe.mock.calls[0][0]
    expect(sql).not.toContain('AND sentiment')
  })

  it('getActivities 传 0 venueId 仍生成 SQL', async () => {
    const mockPrisma = { $queryRawUnsafe: vi.fn().mockResolvedValue([]) }
    const svc = new ScoutService(mockPrisma as any)
    await svc.getActivities(0)
    expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalledWith(
      expect.stringContaining('competitor_activities WHERE venue_id = $1'),
      0
    )
  })

  it('getCollectionLogs 传空 cityId 不过滤', async () => {
    const mockPrisma = { $queryRawUnsafe: vi.fn().mockResolvedValue([]) }
    const svc = new ScoutService(mockPrisma as any)
    await svc.getCollectionLogs('', 10)
    const sql: string = mockPrisma.$queryRawUnsafe.mock.calls[0][0]
    // Empty string is falsy, so no WHERE
    expect(sql).not.toContain('WHERE')
  })
})
