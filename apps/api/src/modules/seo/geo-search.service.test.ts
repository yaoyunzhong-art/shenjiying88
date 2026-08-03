/**
 * geo-search.service.test.ts — GEO搜索排名引擎测试 (node:test)
 * 覆盖: 搜索排名/去重/距离计算/GeoIP/空结果/边界
 */
import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { SeoService } from './seo.service'
import { GeoSearchService } from './geo-search.service'

describe('GeoSearchService', () => {
  let seoService: SeoService
  let geoSearch: GeoSearchService

  beforeEach(() => {
    seoService = new SeoService()
    geoSearch = new GeoSearchService(seoService)
    // 注入测试GEO数据
    seoService.createGeoLocation({ city: '上海', district: '徐汇', landmark: '徐家汇旗舰店', lat: 31.19, lng: 121.44, radiusKm: 3, tenantId: 't1' })
    seoService.createGeoLocation({ city: '上海', district: '浦东', landmark: '陆家嘴', lat: 31.24, lng: 121.51, radiusKm: 3, tenantId: 't1' })
    seoService.createGeoLocation({ city: '北京', district: '朝阳', landmark: '三里屯', lat: 39.93, lng: 116.45, radiusKm: 2, tenantId: 't1' })
  })

  it('正例: 按城市搜索', () => {
    const result = geoSearch.search({ query: '上海', city: '上海' })
    assert.ok(result.items.length > 0)
    assert.ok(result.items.every(r => r.city === '上海'))
  })

  it('正例: 返回按score排序', () => {
    const result = geoSearch.search({ query: '上海', city: '上海', lat: 31.19, lng: 121.44 })
    assert.ok(result.items.length > 0)
    // 第一个的score应>=第二个
    for (let i = 0; i < result.items.length - 1; i++) {
      assert.ok(result.items[i]!.score >= result.items[i + 1]!.score)
    }
  })

  it('正例: 同商圈去重(最多3家)', () => {
    // 加几条同商圈
    for (let i = 0; i < 5; i++) {
      seoService.createGeoLocation({ city: '上海', district: '徐汇', landmark: `分店${i}`, lat: 31.19, lng: 121.44, radiusKm: 2, tenantId: 't1' })
    }
    const result = geoSearch.search({ query: '上海', city: '上海' })
    // 计算每个商圈的数量
    const counts: Record<string, number> = {}
    for (const r of result.items) {
      const key = `${r.city}-${r.district}`
      counts[key] = (counts[key] || 0) + 1
    }
    for (const c of Object.values(counts)) {
      assert.ok(c <= 3, `商圈最多3家, 实际${c}`)
    }
  })

  it('正例: Haversine距离计算', () => {
    const d = geoSearch['haversine'](31.19, 121.44, 31.24, 121.51)
    assert.ok(d > 0)
    assert.ok(d < 20, `上海徐汇到浦东应<20km, 实际${d}km`)
  })

  it('正例: GeoIP城市检测', () => {
    const city = geoSearch.detectCityFromIp('8.8.8.8')
    assert.ok(['北京', '上海', '广州', '深圳'].includes(city))
  })

  it('反例: 空搜索', () => {
    const result = geoSearch.search({ query: '', city: '无此城市' })
    assert.equal(result.items.length, 0)
    assert.equal(result.total, 0)
  })

  it('边界: 关键词相关性计算', () => {
    const score = geoSearch['calcRelevance']('上海电玩城', '上海旗舰店', '徐汇区')
    assert.ok(score >= 0)
    assert.ok(score <= 1)
  })

  it('边界: 关键词无匹配', () => {
    const score = geoSearch['calcRelevance']('ZZZZ_NOTFOUND', '上海旗舰店')
    assert.equal(score, 0)
  })
})
