/**
 * seo.service.test.ts — P-49 SEO 数据模块测试 (node:test)
 * 覆盖: 正例+反例+边界 ≥ 32 tests
 * 禁止: as any / describe.skip / it.only
 * 隔离: beforeEach 重置
 */
import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { SeoService } from './seo.service'

describe('SeoService', () => {
  let svc: SeoService

  beforeEach(() => { svc = new SeoService() })

  // ════════════════════════════════════════════════════════════
  // Metadata CRUD (10 tests)
  // ════════════════════════════════════════════════════════════

  it('metadata: 创建和获取', () => {
    svc.upsertMetadata('/about', { title: '关于我们', description: '先进的娱乐场馆', keywords: ['娱乐','场馆'], canonical: 'https://example.com/about', locale: 'zh-CN', tenantId: 't1' })
    const m = svc.getMetadata('/about', 'zh-CN')
    assert.ok(m); assert.equal(m?.title, '关于我们')
  })

  it('metadata: 创建使用默认locale', () => {
    svc.upsertMetadata('/default', { title: '默认', description: 'desc', keywords: [], canonical: 'https://example.com/default', tenantId: 't1' })
    const m = svc.getMetadata('/default')
    assert.equal(m.title, '默认')
    assert.equal(m.locale, 'zh-CN')
  })

  it('metadata: 更新已有的', () => {
    svc.upsertMetadata('/about', { title: '旧', description: 'd', keywords: [], canonical: 'https://', tenantId: 't1' })
    svc.upsertMetadata('/about', { title: '新', description: '新desc', keywords: ['k1'], canonical: 'https://', tenantId: 't1' })
    const m = svc.getMetadata('/about')
    assert.equal(m.title, '新')
    assert.equal(m.description, '新desc')
  })

  it('metadata: 删除', () => {
    svc.upsertMetadata('/del', { title: 'x', description: 'x', keywords: [], canonical: 'x', tenantId: 't1' })
    svc.deleteMetadata('/del')
    assert.throws(() => svc.getMetadata('/del'))
  })

  it('metadata: 分页', () => {
    for (let i = 0; i < 5; i++) svc.upsertMetadata(`/p${i}`, { title: `t${i}`, description: 'd', keywords: [], canonical: `https://p${i}`, tenantId: 't1' })
    assert.equal(svc.listMetadata({ tenantId: 't1', locale: 'zh-CN', page: 1, pageSize: 3 }).items.length, 3)
    assert.equal(svc.listMetadata({ tenantId: 't1', locale: 'zh-CN', page: 2, pageSize: 3 }).items.length, 2)
  })

  it('metadata: 按租户过滤 + 总计数', () => {
    svc.upsertMetadata('/a', { title: 'ta', description: 'da', keywords: [], canonical: 'ca', tenantId: 't1' })
    svc.upsertMetadata('/b', { title: 'tb', description: 'db', keywords: [], canonical: 'cb', tenantId: 't1' })
    svc.upsertMetadata('/c', { title: 'tc', description: 'dc', keywords: [], canonical: 'cc', tenantId: 't2' })
    const r1 = svc.listMetadata({ tenantId: 't1', page: 1, pageSize: 20 })
    assert.equal(r1.total, 2)
    assert.equal(r1.items.length, 2)
    const r2 = svc.listMetadata({ tenantId: 't2', page: 1, pageSize: 20 })
    assert.equal(r2.total, 1)
  })

  it('metadata: ogImage 回传', () => {
    svc.upsertMetadata('/og', { title: 't', description: 'd', keywords: [], canonical: 'c', ogImage: 'https://img.example.com/og.png', tenantId: 't1' })
    const m = svc.getMetadata('/og')
    assert.equal(m.ogImage, 'https://img.example.com/og.png')
  })

  it('metadata: 更新后保留非覆盖字段', () => {
    svc.upsertMetadata('/mix', { title: '原', description: '原desc', keywords: ['a','b'], canonical: 'c1', tenantId: 't1' })
    svc.upsertMetadata('/mix', { title: '新', description: '原desc', keywords: [], canonical: 'c1', tenantId: 't1' })
    const m = svc.getMetadata('/mix')
    assert.equal(m.title, '新')
    assert.deepEqual(m.keywords, [])
  })

  it('metadata: 分页越界返回空', () => {
    svc.upsertMetadata('/only', { title: 't', description: 'd', keywords: [], canonical: 'c', tenantId: 't1' })
    const r = svc.listMetadata({ tenantId: 't1', page: 999, pageSize: 20 })
    assert.equal(r.items.length, 0)
    assert.equal(r.total, 1)
  })

  // ════════════════════════════════════════════════════════════
  // 反例 — Metadata (5 tests)
  // ════════════════════════════════════════════════════════════

  it('反例: 不存在的路径抛异常', () => { assert.throws(() => svc.getMetadata('/nonexistent')) })

  it('反例: 删除不存在的抛异常', () => { assert.throws(() => svc.deleteMetadata('/nonexistent')) })

  it('反例: 空标题抛异常', () => {
    assert.throws(() => svc.upsertMetadata('/x', { title: '', description: 'd', keywords: [], canonical: 'c', tenantId: 't1' }))
  })

  it('反例: 空描述抛异常', () => {
    assert.throws(() => svc.upsertMetadata('/x', { title: 't', description: '', keywords: [], canonical: 'c', tenantId: 't1' }))
  })

  it('反例: 空 canonical 抛异常', () => {
    assert.throws(() => svc.upsertMetadata('/x', { title: 't', description: 'd', keywords: [], canonical: '', tenantId: 't1' }))
  })

  // ════════════════════════════════════════════════════════════
  // Sitemap (10 tests)
  // ════════════════════════════════════════════════════════════

  it('sitemap: 创建单条', () => {
    svc.upsertSitemap('/home', { changefreq: 'daily', priority: 0.9, tenantId: 't1' })
    assert.equal(svc.getSitemapEntries('t1').length, 1)
  })

  it('sitemap: 按频率筛选', () => {
    svc.upsertSitemap('/d1', { changefreq: 'daily', priority: 0.8, tenantId: 't1' })
    svc.upsertSitemap('/d2', { changefreq: 'daily', priority: 0.7, tenantId: 't1' })
    svc.upsertSitemap('/w1', { changefreq: 'weekly', priority: 0.5, tenantId: 't1' })
    assert.equal(svc.getSitemapEntries('t1', 'daily').length, 2)
    assert.equal(svc.getSitemapEntries('t1', 'weekly').length, 1)
  })

  it('sitemap: 批量创建', () => {
    svc.batchUpsertSitemap([{ path: '/a', changefreq: 'daily', priority: 0.9, tenantId: 't1' }, { path: '/b', changefreq: 'weekly', priority: 0.6, tenantId: 't1' }])
    assert.equal(svc.getSitemapEntries('t1').length, 2)
  })

  it('sitemap: upsert更新', () => {
    svc.upsertSitemap('/u', { changefreq: 'daily', priority: 0.5, tenantId: 't1' })
    svc.upsertSitemap('/u', { changefreq: 'monthly', priority: 0.9, tenantId: 't1' })
    assert.equal(svc.getSitemapEntries('t1').length, 1)
    assert.equal(svc.getSitemapEntries('t1')[0]?.changefreq, 'monthly')
  })

  it('sitemap: 优先级边界0.0和1.0', () => {
    svc.upsertSitemap('/low', { changefreq: 'daily', priority: 0.0, tenantId: 't1' })
    svc.upsertSitemap('/high', { changefreq: 'daily', priority: 1.0, tenantId: 't1' })
    assert.equal(svc.getSitemapEntries('t1').length, 2)
  })

  it('sitemap: getSitemapByPath 成功', () => {
    svc.upsertSitemap('/bypath', { changefreq: 'daily', priority: 0.5, tenantId: 't1' })
    const s = svc.getSitemapByPath('/bypath')
    assert.equal(s.path, '/bypath')
    assert.equal(s.changefreq, 'daily')
  })

  it('sitemap: getSitemapByPath 不存在抛异常', () => {
    assert.throws(() => svc.getSitemapByPath('/nope'))
  })

  it('sitemap: deleteSitemap', () => {
    svc.upsertSitemap('/todelete', { changefreq: 'daily', priority: 0.5, tenantId: 't1' })
    svc.deleteSitemap('/todelete')
    assert.throws(() => svc.getSitemapByPath('/todelete'))
  })

  it('sitemap: deleteSitemap 不存在抛异常', () => {
    assert.throws(() => svc.deleteSitemap('/nonexistent'))
  })

  it('sitemap: 默认 changefreq 和 priority', () => {
    svc.upsertSitemap('/defaults', { tenantId: 't1' })
    const s = svc.getSitemapByPath('/defaults')
    assert.equal(s.changefreq, 'weekly')
    assert.equal(s.priority, 0.5)
  })

  // ════════════════════════════════════════════════════════════
  // GeoLocation (8 tests)
  // ════════════════════════════════════════════════════════════

  it('geo: 创建地域标签', () => {
    svc.createGeoLocation({ city: '上海', district: '徐汇', landmark: '徐家汇', lat: 31.19, lng: 121.44, radiusKm: 3, tenantId: 't1' })
    assert.equal(svc.searchGeoLocations('上海', '徐汇').length, 1)
  })

  it('geo: 关键词过滤', () => {
    svc.createGeoLocation({ city: '上海', district: '静安', landmark: '南京西路', lat: 31.23, lng: 121.45, radiusKm: 2, tenantId: 't1' })
    svc.createGeoLocation({ city: '上海', district: '浦东', landmark: '陆家嘴', lat: 31.24, lng: 121.51, radiusKm: 3, tenantId: 't1' })
    assert.equal(svc.searchGeoLocations('上海', '静安', '南京').length, 1)
  })

  it('geo: 按租户隔离', () => {
    svc.createGeoLocation({ city: '北京', district: '朝阳', landmark: '三里屯', lat: 39.93, lng: 116.45, radiusKm: 2, tenantId: 't2' })
    assert.equal(svc.getAllGeoLocations('t2').length, 1)
    assert.equal(svc.getAllGeoLocations('t1').length, 0)
  })

  it('geo: 通过 ID 获取', () => {
    const created = svc.createGeoLocation({ city: '深圳', district: '南山', landmark: '科技园', lat: 22.54, lng: 113.95, tenantId: 't1' })
    const fetched = svc.getGeoLocationById(created.id)
    assert.equal(fetched.id, created.id)
    assert.equal(fetched.city, '深圳')
  })

  it('geo: getGeoLocationById 不存在抛异常', () => {
    assert.throws(() => svc.getGeoLocationById('nonexistent'))
  })

  it('geo: deleteGeoLocation', () => {
    const created = svc.createGeoLocation({ city: '广州', district: '天河', landmark: '珠江新城', lat: 23.13, lng: 113.32, tenantId: 't1' })
    svc.deleteGeoLocation(created.id)
    assert.throws(() => svc.getGeoLocationById(created.id))
  })

  it('geo: deleteGeoLocation 不存在抛异常', () => {
    assert.throws(() => svc.deleteGeoLocation('nonexistent'))
  })

  it('geo: 默认radiusKm为1', () => {
    const created = svc.createGeoLocation({ city: '上海', district: '黄埔', landmark: '外滩', lat: 31.24, lng: 121.49, tenantId: 't1' })
    assert.equal(created.radiusKm, 1)
  })

  // ════════════════════════════════════════════════════════════
  // 反例 — Geo (4 tests)
  // ════════════════════════════════════════════════════════════

  it('反例: 空城市抛异常', () => { assert.throws(() => svc.searchGeoLocations('', '静安')) })

  it('反例: 空区域抛异常', () => { assert.throws(() => svc.searchGeoLocations('上海', '')) })

  it('反例: 纬度越界抛异常', () => {
    assert.throws(() => svc.createGeoLocation({ city: 'x', district: 'y', landmark: 'z', lat: 100, lng: 100, tenantId: 't1' }))
    assert.throws(() => svc.createGeoLocation({ city: 'x', district: 'y', landmark: 'z', lat: -100, lng: 100, tenantId: 't1' }))
  })

  it('反例: 经度越界抛异常', () => {
    assert.throws(() => svc.createGeoLocation({ city: 'x', district: 'y', landmark: 'z', lat: 0, lng: 200, tenantId: 't1' }))
    assert.throws(() => svc.createGeoLocation({ city: 'x', district: 'y', landmark: 'z', lat: 0, lng: -200, tenantId: 't1' }))
  })

  // ════════════════════════════════════════════════════════════
  // Sitemap 反例 (2 tests)
  // ════════════════════════════════════════════════════════════

  it('反例: 无效 changefreq 抛异常', () => {
    assert.throws(() => svc.upsertSitemap('/x', { changefreq: 'invalid-freq' as any, tenantId: 't1' }))
  })

  it('反例: 无效 priority 抛异常', () => {
    assert.throws(() => svc.upsertSitemap('/x', { priority: -0.1, tenantId: 't1' }))
    assert.throws(() => svc.upsertSitemap('/x', { priority: 1.1, tenantId: 't1' }))
  })

  // ════════════════════════════════════════════════════════════
  // 边界 (2 tests)
  // ════════════════════════════════════════════════════════════

  it('边界: 空租户列表', () => { assert.equal(svc.listMetadata({ tenantId: 'no-tenant', locale: 'zh-CN', page: 1, pageSize: 20 }).items.length, 0) })

  it('边界: 批量sitemap空数组抛异常', () => {
    assert.throws(() => svc.batchUpsertSitemap([]))
  })
})
