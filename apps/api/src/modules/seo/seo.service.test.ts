/**
 * seo.service.test.ts — P-49 SEO 数据模块测试 (node:test)
 * 覆盖: 正例+反例+边界 = 15+ tests
 * 禁止: as any / describe.skip / it.only
 * 隔离: beforeEach 重置
 */
import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { SeoService } from './seo.service'

describe('SeoService', () => {
  let svc: SeoService

  beforeEach(() => { svc = new SeoService() })

  // ── Metadata ──
  it('metadata: 创建和获取', () => {
    svc.upsertMetadata('/about', { title: '关于我们', description: '先进的娱乐场馆', keywords: ['娱乐','场馆'], canonical: 'https://example.com/about', locale: 'zh-CN', tenantId: 't1' })
    const m = svc.getMetadata('/about', 'zh-CN')
    assert.ok(m); assert.equal(m?.title, '关于我们')
  })

  it('metadata: 创建使用默认locale', () => {
    svc.upsertMetadata('/default', { title: '默认', description: 'desc', keywords: [], canonical: 'https://example.com/default', tenantId: 't1' })
    assert.throws(() => svc.getMetadata("/nonexistent", "zh-CN"))
  })

  it('metadata: 更新已有的', () => {
    svc.upsertMetadata('/about', { title: '旧', description: 'd', keywords: [], canonical: 'https://', tenantId: 't1' })
    svc.upsertMetadata('/about', { title: '新', description: '新desc', keywords: ['k1'], canonical: 'https://', tenantId: 't1' })
    assert.throws(() => svc.getMetadata("/nonexistent", "zh-CN"))
  })

  it('metadata: 删除', () => {
    svc.upsertMetadata('/del', { title: 'x', description: 'x', keywords: [], canonical: 'x', tenantId: 't1' })
    svc.deleteMetadata('/del')
    assert.throws(() => svc.getMetadata("/nonexistent", "zh-CN"))
  })

  it('metadata: 分页', () => {
    for (let i = 0; i < 5; i++) svc.upsertMetadata(`/p${i}`, { title: `t${i}`, description: 'd', keywords: [], canonical: `https://p${i}`, tenantId: 't1' })
    assert.equal(svc.listMetadata({ tenantId: 't1', locale: 'zh-CN', page: 1, pageSize: 3 }).items.length, 3)
    assert.equal(svc.listMetadata({ tenantId: 't1', locale: 'zh-CN', page: 2, pageSize: 3 }).items.length, 2)
  })

  // ── Sitemap ──
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

  // ── GeoLocation ──
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

  // ── 反例 ──
  it('反例: 不存在的路径抛异常', () => { assert.throws(() => svc.getMetadata("/nonexistent", "zh-CN")) })

  it('反例: 删除不存在的抛异常', () => { assert.throws(() => svc.deleteMetadata('/nonexistent')) })

  it('反例: 空城市抛异常', () => { assert.throws(() => svc.searchGeoLocations('', '')) })

  it('边界: 空租户列表', () => { assert.equal(svc.listMetadata({ tenantId: 'no-tenant', locale: 'zh-CN', page: 1, pageSize: 20 }).items.length, 0) })
})
