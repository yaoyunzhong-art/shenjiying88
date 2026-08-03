/**
 * venue-data.service.test.ts — 侦察兵数据库查询层测试
 *
 * 覆盖:  正例(同城/设备推荐)  反例(未知城市)  边界(空/超预算)
 * mock:  无pg pool → 自动降级mock
 * 禁止:  as any · skip · only
 */
import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { VenueDataService } from './venue-data.service'

describe('VenueDataService', () => {
  let svc: VenueDataService

  before(() => {
    // 确保无PG URL → 自动降级
    delete process.env.POSTGRES_URL
    svc = new VenueDataService()
  })

  // ─── 正例 ────────────────────────────────────

  it('正例: 已知城市返回竞品数据', async () => {
    const competitors = await svc.getCompetitorsByCity('上海')
    assert.ok(Array.isArray(competitors))
    assert.ok(competitors.length > 0)
  })

  it('正例: 已知城市+区域返回密度和均价', async () => {
    const density = await svc.getCompetitorDensity('上海', '徐汇')
    assert.ok(density.count >= 0)
    assert.ok(density.avgPrice > 0)
    assert.ok(density.minPrice > 0)
    assert.ok(density.maxPrice > density.minPrice)
    assert.ok(Array.isArray(density.districts))
  })

  it('正例: 获取城市统计', async () => {
    const stats = await svc.getCityStats('北京')
    assert.ok(stats.totalCompetitors > 0)
    assert.ok(stats.avgRating > 0)
    assert.ok(stats.avgPrice > 0)
    assert.ok(Array.isArray(stats.topDistricts))
  })

  it('正例: 城市+区域统计', async () => {
    const stats = await svc.getCityStats('深圳', '南山')
    assert.ok(stats.totalCompetitors > 0)
  })

  it('正例: 获取常用设备推荐', () => {
    const eqs = svc.getPopularEquipment('上海', 500)
    assert.ok(Array.isArray(eqs))
    assert.ok(eqs.length > 0)
    assert.ok(eqs[0].name)
    assert.ok(eqs[0].count > 0)
    assert.ok(eqs[0].cost > 0)
    assert.ok(eqs[0].reason)
    assert.ok(eqs[0].brands)
  })

  it('正例: 小预算设备推荐', () => {
    const eqs = svc.getPopularEquipment('成都', 100)
    assert.ok(eqs.every(e => e.count >= 1))
  })

  it('正例: 超大型预算设备推荐', () => {
    const eqs = svc.getPopularEquipment('广州', 2000)
    assert.ok(eqs.every(e => e.count >= 1))
    assert.ok(eqs.some(e => e.count > 5))
  })

  // ─── 反例 ────────────────────────────────────

  it('反例: unknown城市返回空列表', async () => {
    const competitors = await svc.getCompetitorsByCity('')
    assert.equal(competitors.length, 0)
  })

  it('反例: 无效城市密度用默认值', async () => {
    const density = await svc.getCompetitorDensity('火星', '未知区')
    // 默认值 count=1, avgPrice=60
    assert.ok(density.count > 0)
    assert.ok(density.avgPrice > 0)
  })

  it('反例: 不带区域的统计也能跑通', async () => {
    const stats = await svc.getCityStats('杭州')
    assert.ok(stats.totalCompetitors > 0)
  })

  // ─── 边界 ────────────────────────────────────

  it('边界: 空城市字符串', async () => {
    const competitors = await svc.getCompetitorsByCity('')
    assert.equal(competitors.length, 0)
  })

  it('边界: 空区域字符串', async () => {
    // district 空字符串
    const stats = await svc.getCityStats('上海', '')
    assert.ok(stats.totalCompetitors > 0)
  })

  it('边界: 极低预算设备推荐', () => {
    const eqs = svc.getPopularEquipment('深圳', 10)
    assert.ok(eqs.every(e => e.count >= 1))
    assert.ok(eqs.every(e => e.cost > 0))
  })
})
