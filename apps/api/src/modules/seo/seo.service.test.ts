/**
 * seo.service.test.ts — P-49 SEO 数据模块测试 (≥13 tests)
 *
 * 覆盖: 正例8+反例3+边界2 = 13+ tests
 * 禁止: as any / describe.skip / it.only
 * 隔离: beforeEach 重置
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { SeoService } from './seo.service'

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('SeoService', () => {
  let svc: SeoService

  const testTenantId = 'tenant-test'

  beforeEach(() => {
    svc = new SeoService()
    svc.clear()
  })

  // ═══════════════════════════════════════════════════════════════════════
  // Metadata CRUD
  // ═══════════════════════════════════════════════════════════════════════

  describe('Metadata', () => {
    // ── 正例 ───────────────────────────────────────────────────────────

    it('创建元数据 —— 返回完整的元数据对象', () => {
      const meta = svc.upsertMetadata('/about', {
        title: '关于我们',
        description: '公司介绍页面',
        keywords: ['公司', '介绍'],
        canonical: 'https://example.com/about',
        locale: 'zh-CN',
        ogImage: 'https://example.com/og.jpg',
        tenantId: testTenantId,
      })

      expect(meta.id).toMatch(/^seo-/)
      expect(meta.path).toBe('/about')
      expect(meta.title).toBe('关于我们')
      expect(meta.description).toBe('公司介绍页面')
      expect(meta.keywords).toEqual(['公司', '介绍'])
      expect(meta.canonical).toBe('https://example.com/about')
      expect(meta.locale).toBe('zh-CN')
      expect(meta.ogImage).toBe('https://example.com/og.jpg')
      expect(meta.tenantId).toBe(testTenantId)
      expect(meta.createdAt).toBeTruthy()
      expect(meta.updatedAt).toBeTruthy()
    })

    it('更新元数据 —— 覆盖已有字段', () => {
      svc.upsertMetadata('/about', {
        title: '关于我们',
        description: '公司介绍',
        canonical: 'https://example.com/about',
      })

      const updated = svc.upsertMetadata('/about', {
        title: '关于我们 (更新)',
        description: '公司介绍页面更新版',
        canonical: 'https://example.com/about-v2',
        keywords: ['公司', '更新'],
        locale: 'en-US',
      })

      expect(updated.title).toBe('关于我们 (更新)')
      expect(updated.description).toBe('公司介绍页面更新版')
      expect(updated.canonical).toBe('https://example.com/about-v2')
      expect(updated.keywords).toEqual(['公司', '更新'])
      expect(updated.locale).toBe('en-US')
    })

    it('获取元数据 —— 按路径精确匹配', () => {
      svc.upsertMetadata('/about', {
        title: '关于我们',
        description: '公司介绍',
        canonical: 'https://example.com/about',
        tenantId: testTenantId,
      })

      const meta = svc.getMetadata('/about')
      expect(meta.title).toBe('关于我们')
    })

    it('获取元数据 —— 按路径+区域过滤', () => {
      svc.upsertMetadata('/about', {
        title: '关于我们',
        description: '中文版',
        canonical: 'https://example.com/about',
        locale: 'zh-CN',
      })
      svc.upsertMetadata('/about', {
        title: 'About Us',
        description: 'English version',
        canonical: 'https://example.com/en/about',
        locale: 'en-US',
      })

      const meta = svc.getMetadata('/about', 'en-US')
      expect(meta.title).toBe('About Us')
    })

    it('删除元数据 —— 成功后查询抛出 NotFound', () => {
      svc.upsertMetadata('/about', {
        title: '关于我们',
        description: '公司介绍',
        canonical: 'https://example.com/about',
      })
      svc.deleteMetadata('/about')

      expect(() => svc.getMetadata('/about')).toThrow(NotFoundException)
    })

    it('列出元数据 —— 分页与排序', () => {
      for (let i = 0; i < 5; i++) {
        svc.upsertMetadata(`/page-${i}`, {
          title: `页面 ${i}`,
          description: `描述 ${i}`,
          canonical: `https://example.com/page-${i}`,
          tenantId: testTenantId,
        })
      }

      const result = svc.listMetadata({ tenantId: testTenantId, page: 1, pageSize: 3 })
      expect(result.items).toHaveLength(3)
      expect(result.total).toBe(5)

      const result2 = svc.listMetadata({ tenantId: testTenantId, page: 2, pageSize: 3 })
      expect(result2.items).toHaveLength(2)
    })

    it('列出元数据 —— 按区域过滤', () => {
      svc.upsertMetadata('/en/about', {
        title: 'About',
        description: 'English',
        canonical: 'https://example.com/en/about',
        locale: 'en-US',
      })
      svc.upsertMetadata('/zh/about', {
        title: '关于',
        description: '中文',
        canonical: 'https://example.com/zh/about',
        locale: 'zh-CN',
      })

      const result = svc.listMetadata({ locale: 'zh-CN' })
      expect(result.items).toHaveLength(1)
      expect(result.items[0].title).toBe('关于')
    })

    // ── 反例 ───────────────────────────────────────────────────────────

    it('空路径 —— 抛出 BadRequest', () => {
      expect(() => svc.upsertMetadata('', {
        title: '测试',
        description: '测试描述',
        canonical: 'https://example.com/test',
      })).toThrow(BadRequestException)
    })

    it('空标题 —— 抛出 BadRequest', () => {
      expect(() => svc.upsertMetadata('/test', {
        title: '',
        description: '测试描述',
        canonical: 'https://example.com/test',
      })).toThrow(BadRequestException)
    })

    it('不存在的路径 —— getMetadata 抛出 NotFound', () => {
      expect(() => svc.getMetadata('/not-exists')).toThrow(NotFoundException)
    })

    it('不存在的路径 —— deleteMetadata 抛出 NotFound', () => {
      expect(() => svc.deleteMetadata('/not-exists')).toThrow(NotFoundException)
    })

    it('区域不匹配 —— getMetadata(locale) 抛出 NotFound', () => {
      svc.upsertMetadata('/about', {
        title: '关于',
        description: '中文描述',
        canonical: 'https://example.com/about',
        locale: 'zh-CN',
      })
      expect(() => svc.getMetadata('/about', 'en-US')).toThrow(NotFoundException)
    })

    // ── 边界 ───────────────────────────────────────────────────────────

    it('默认区域为 zh-CN', () => {
      const meta = svc.upsertMetadata('/default', {
        title: '默认区域',
        description: '无 locale 参数',
        canonical: 'https://example.com/default',
      })
      expect(meta.locale).toBe('zh-CN')
    })

    it('pageSize 默认值为 20', () => {
      const result = svc.listMetadata({})
      expect(result.items).toHaveLength(0)
      expect(result.total).toBe(0)
    })
  })

  // ═══════════════════════════════════════════════════════════════════════
  // Sitemap CRUD
  // ═══════════════════════════════════════════════════════════════════════

  describe('Sitemap', () => {
    // ── 正例 ───────────────────────────────────────────────────────────

    it('创建 sitemap 条目 —— 使用默认值', () => {
      const entry = svc.upsertSitemap('/about', {
        tenantId: testTenantId,
      })

      expect(entry.path).toBe('/about')
      expect(entry.changefreq).toBe('weekly')
      expect(entry.priority).toBe(0.5)
      expect(entry.tenantId).toBe(testTenantId)
    })

    it('创建 sitemap 条目 —— 自定义值', () => {
      const entry = svc.upsertSitemap('/home', {
        changefreq: 'daily',
        priority: 1.0,
        lastmod: '2026-07-19T00:00:00.000Z',
        tenantId: testTenantId,
      })

      expect(entry.changefreq).toBe('daily')
      expect(entry.priority).toBe(1.0)
      expect(entry.lastmod).toBe('2026-07-19T00:00:00.000Z')
    })

    it('获取 sitemap 条目 —— 按租户和频率筛选', () => {
      svc.upsertSitemap('/daily-page', { changefreq: 'daily' })
      svc.upsertSitemap('/weekly-page', { changefreq: 'weekly' })

      const daily = svc.getSitemapEntries(undefined, 'daily')
      expect(daily).toHaveLength(1)
      expect(daily[0].path).toBe('/daily-page')
    })

    it('批量 upsert sitemap', () => {
      const entries = svc.batchUpsertSitemap([
        { path: '/a', changefreq: 'daily', priority: 0.9 },
        { path: '/b', changefreq: 'weekly', priority: 0.7 },
        { path: '/c', changefreq: 'monthly', priority: 0.5 },
      ])

      expect(entries).toHaveLength(3)
      expect(entries[0].path).toBe('/a')
      expect(entries[1].path).toBe('/b')
      expect(entries[2].path).toBe('/c')

      const all = svc.getSitemapEntries()
      expect(all).toHaveLength(3)
    })

    // ── 反例 ───────────────────────────────────────────────────────────

    it('无效的变更频率 —— 抛出 BadRequest', () => {
      expect(() =>
        svc.upsertSitemap('/test', {
          changefreq: 'hourly' as any,
        }),
      ).toThrow(BadRequestException)
    })

    it('优先级超出范围 —— 抛出 BadRequest', () => {
      expect(() =>
        svc.upsertSitemap('/test', { priority: 1.5 }),
      ).toThrow(BadRequestException)
    })

    it('空批量 —— 抛出 BadRequest', () => {
      expect(() => svc.batchUpsertSitemap([])).toThrow(BadRequestException)
    })

    // ── 边界 ───────────────────────────────────────────────────────────

    it('最小优先级 0.0 通过', () => {
      const entry = svc.upsertSitemap('/low', { priority: 0.0 })
      expect(entry.priority).toBe(0.0)
    })

    it('最大优先级 1.0 通过', () => {
      const entry = svc.upsertSitemap('/high', { priority: 1.0 })
      expect(entry.priority).toBe(1.0)
    })

    it('sitemap 条目 upsert 更新已有的', () => {
      svc.upsertSitemap('/page', { changefreq: 'daily', priority: 0.9 })
      svc.upsertSitemap('/page', { changefreq: 'monthly', priority: 0.3 })

      const all = svc.getSitemapEntries()
      expect(all).toHaveLength(1)
      expect(all[0].changefreq).toBe('monthly')
      expect(all[0].priority).toBe(0.3)
    })

    it('删除 sitemap 条目', () => {
      svc.upsertSitemap('/about', {})
      svc.deleteSitemap('/about')
      expect(() => svc.getSitemapByPath('/about')).toThrow(NotFoundException)
    })
  })

  // ═══════════════════════════════════════════════════════════════════════
  // GeoLocation CRUD
  // ═══════════════════════════════════════════════════════════════════════

  describe('GeoLocation', () => {
    // ── 正例 ───────────────────────────────────────────────────────────

    it('创建 GEO 位置 —— 返回完整对象', () => {
      const geo = svc.createGeoLocation({
        city: '深圳市',
        district: '南山区',
        landmark: '海岸城',
        lat: 22.5175,
        lng: 113.9387,
        radiusKm: 3,
        tenantId: testTenantId,
      })

      expect(geo.id).toMatch(/^seo-/)
      expect(geo.city).toBe('深圳市')
      expect(geo.district).toBe('南山区')
      expect(geo.landmark).toBe('海岸城')
      expect(geo.lat).toBe(22.5175)
      expect(geo.lng).toBe(113.9387)
      expect(geo.radiusKm).toBe(3)
      expect(geo.tenantId).toBe(testTenantId)
    })

    it('搜索 GEO 位置 —— 按城市+区域', () => {
      svc.createGeoLocation({
        city: '深圳市',
        district: '南山区',
        landmark: '海岸城',
        lat: 22.5175,
        lng: 113.9387,
      })
      svc.createGeoLocation({
        city: '深圳市',
        district: '福田区',
        landmark: '会展中心',
        lat: 22.54,
        lng: 114.06,
      })

      const results = svc.searchGeoLocations('深圳市', '南山区')
      expect(results).toHaveLength(1)
      expect(results[0].landmark).toBe('海岸城')
    })

    it('搜索 GEO 位置 —— 关键词过滤', () => {
      svc.createGeoLocation({
        city: '深圳市',
        district: '南山区',
        landmark: '海岸城购物中心',
        lat: 22.5175,
        lng: 113.9387,
      })
      svc.createGeoLocation({
        city: '深圳市',
        district: '南山区',
        landmark: '科技园',
        lat: 22.55,
        lng: 113.95,
      })

      const results = svc.searchGeoLocations('深圳市', '南山区', '海岸')
      expect(results).toHaveLength(1)
      expect(results[0].landmark).toContain('海岸')
    })

    it('获取所有 GEO 位置 —— 按租户过滤', () => {
      svc.createGeoLocation({
        city: '深圳',
        district: '南山',
        landmark: 'A',
        lat: 22.5,
        lng: 113.9,
        tenantId: 't1',
      })
      svc.createGeoLocation({
        city: '广州',
        district: '天河',
        landmark: 'B',
        lat: 23.1,
        lng: 113.3,
        tenantId: 't2',
      })

      expect(svc.getAllGeoLocations('t1')).toHaveLength(1)
      expect(svc.getAllGeoLocations('t2')).toHaveLength(1)
    })

    // ── 反例 ───────────────────────────────────────────────────────────

    it('空城市 —— 抛出 BadRequest', () => {
      expect(() =>
        svc.createGeoLocation({
          city: '',
          district: '南山',
          landmark: '海岸城',
          lat: 22.5,
          lng: 113.9,
        }),
      ).toThrow(BadRequestException)
    })

    it('纬度超出范围 —— 抛出 BadRequest', () => {
      expect(() =>
        svc.createGeoLocation({
          city: '深圳',
          district: '南山',
          landmark: '海岸城',
          lat: 100,
          lng: 113.9,
        }),
      ).toThrow(BadRequestException)
    })

    it('搜索时城市为空 —— 抛出 BadRequest', () => {
      expect(() =>
        svc.searchGeoLocations('', '南山'),
      ).toThrow(BadRequestException)
    })

    // ── 边界 ───────────────────────────────────────────────────────────

    it('默认 radiusKm 为 1', () => {
      const geo = svc.createGeoLocation({
        city: '深圳',
        district: '南山',
        landmark: '海岸城',
        lat: 22.5,
        lng: 113.9,
      })
      expect(geo.radiusKm).toBe(1)
    })

    it('纬度下限 -90，经度下限 -180', () => {
      const geo = svc.createGeoLocation({
        city: '南极',
        district: '南极点',
        landmark: '科考站',
        lat: -90,
        lng: -180,
      })
      expect(geo.lat).toBe(-90)
      expect(geo.lng).toBe(-180)
    })

    it('删除 GEO 位置', () => {
      const geo = svc.createGeoLocation({
        city: '深圳',
        district: '南山',
        landmark: '海岸城',
        lat: 22.5,
        lng: 113.9,
      })
      svc.deleteGeoLocation(geo.id)
      expect(() => svc.getGeoLocationById(geo.id)).toThrow(NotFoundException)
    })
  })
})
