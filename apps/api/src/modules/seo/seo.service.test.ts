/**
 * seo.service.spec.ts — SEO 模块 Service 单元测试
 *
 * 覆盖: Metadata CRUD / Sitemap CRUD / GeoLocation CRUD / 参数校验
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { SeoService } from './seo.service'
import { NotFoundException, BadRequestException } from '@nestjs/common'
import type { ChangeFreq } from './seo.entity'

describe('SeoService — Metadata CRUD', () => {
  let svc: SeoService

  beforeEach(() => {
    svc = new SeoService()
    svc.clear()
  })

  it('upsertMetadata 创建新元数据', () => {
    const meta = svc.upsertMetadata('/products', {
      title: '产品列表',
      description: '查看所有产品',
      canonical: 'https://shenjiying.com/products',
      keywords: ['产品', '列表'],
      locale: 'zh-CN',
    })
    expect(meta.path).toBe('/products')
    expect(meta.title).toBe('产品列表')
    expect(meta.keywords).toContain('产品')
    expect(meta.locale).toBe('zh-CN')
  })

  it('upsertMetadata 更新已有元数据', () => {
    svc.upsertMetadata('/about', {
      title: '原始标题',
      description: '原始描述',
      canonical: 'https://shenjiying.com/about',
    })
    const updated = svc.upsertMetadata('/about', {
      title: '新标题',
      description: '新描述',
      canonical: 'https://shenjiying.com/about',
      keywords: ['更新'],
    })
    expect(updated.title).toBe('新标题')
    expect(updated.keywords).toEqual(['更新'])
  })

  it('upsertMetadata 空标题抛 BadRequestException', () => {
    expect(() => svc.upsertMetadata('/test', {
      title: '',
      description: 'desc',
      canonical: 'https://s.com/test',
    })).toThrow(BadRequestException)
  })

  it('upsertMetadata 空描述抛 BadRequestException', () => {
    expect(() => svc.upsertMetadata('/test', {
      title: 'title',
      description: '',
      canonical: 'https://s.com/test',
    })).toThrow(BadRequestException)
  })

  it('getMetadata 返回已有元数据', () => {
    svc.upsertMetadata('/home', {
      title: '首页',
      description: '首页描述',
      canonical: 'https://shenjiying.com/home',
    })
    const meta = svc.getMetadata('/home')
    expect(meta.title).toBe('首页')
  })

  it('getMetadata 不存在的路径抛 NotFoundException', () => {
    expect(() => svc.getMetadata('/not-exists')).toThrow(NotFoundException)
  })

  it('getMetadata 带 locale 过滤', () => {
    svc.upsertMetadata('/en', {
      title: 'English',
      description: 'English desc',
      canonical: 'https://s.com/en',
      locale: 'en',
    })
    svc.upsertMetadata('/en', {
      title: '中文',
      description: '中文描述',
      canonical: 'https://s.com/en',
      locale: 'zh-CN',
    })
    // 更新会覆盖，需要不同路径
    svc.upsertMetadata('/zh', {
      title: '中文',
      description: '中文描述',
      canonical: 'https://s.com/zh',
      locale: 'zh-CN',
    })
    expect(() => svc.getMetadata('/en', 'fr')).toThrow(NotFoundException)
  })

  it('deleteMetadata 删除成功', () => {
    svc.upsertMetadata('/delete-me', {
      title: '待删除',
      description: '删除测试',
      canonical: 'https://s.com/delete',
    })
    svc.deleteMetadata('/delete-me')
    expect(() => svc.getMetadata('/delete-me')).toThrow(NotFoundException)
  })

  it('listMetadata 支持分页', () => {
    for (let i = 0; i < 5; i++) {
      svc.upsertMetadata(`/page-${i}`, {
        title: `Page ${i}`,
        description: `Desc ${i}`,
        canonical: `https://s.com/page-${i}`,
      })
    }
    const page1 = svc.listMetadata({ page: 1, pageSize: 2 })
    expect(page1.items).toHaveLength(2)
    expect(page1.total).toBe(5)
  })

  it('listMetadata 按 tenantId 筛选', () => {
    svc.upsertMetadata('/tenant-a', {
      title: 'A', description: 'A', canonical: 'https://s.com/a',
      tenantId: 'tenant-a',
    })
    svc.upsertMetadata('/tenant-b', {
      title: 'B', description: 'B', canonical: 'https://s.com/b',
      tenantId: 'tenant-b',
    })
    const result = svc.listMetadata({ tenantId: 'tenant-a' })
    expect(result.items).toHaveLength(1)
  })
})

describe('SeoService — Sitemap CRUD', () => {
  let svc: SeoService

  beforeEach(() => {
    svc = new SeoService()
    svc.clear()
  })

  it('upsertSitemap 创建新条目', () => {
    const entry = svc.upsertSitemap('/sitemap/products', {
      changefreq: 'daily',
      priority: 0.8,
    })
    expect(entry.path).toBe('/sitemap/products')
    expect(entry.changefreq).toBe('daily')
    expect(entry.priority).toBe(0.8)
  })

  it('upsertSitemap 默认值正确', () => {
    const entry = svc.upsertSitemap('/default-sitemap', {})
    expect(entry.changefreq).toBe('weekly')
    expect(entry.priority).toBe(0.5)
  })

  it('upsertSitemap 无效优先级抛 BadRequestException', () => {
    expect(() => svc.upsertSitemap('/bad', { priority: 1.5 })).toThrow(BadRequestException)
  })

  it('upsertSitemap 无效 changefreq 抛 BadRequestException', () => {
    expect(() => svc.upsertSitemap('/bad', { changefreq: 'never' as ChangeFreq })).toThrow(BadRequestException)
  })

  it('getSitemapEntries 按 tenantId 筛选', () => {
    svc.upsertSitemap('/a', { tenantId: 'ta' })
    svc.upsertSitemap('/b', { tenantId: 'tb' })
    const entries = svc.getSitemapEntries('ta')
    expect(entries).toHaveLength(1)
  })

  it('getSitemapByPath 返回正确的条目', () => {
    svc.upsertSitemap('/sitemap/test', { priority: 0.5 })
    const entry = svc.getSitemapByPath('/sitemap/test')
    expect(entry.path).toBe('/sitemap/test')
  })

  it('getSitemapByPath 不存在的路径抛 NotFoundException', () => {
    expect(() => svc.getSitemapByPath('/nonexistent')).toThrow(NotFoundException)
  })

  it('deleteSitemap 删除成功', () => {
    svc.upsertSitemap('/del-sitemap', {})
    svc.deleteSitemap('/del-sitemap')
    expect(() => svc.getSitemapByPath('/del-sitemap')).toThrow(NotFoundException)
  })

  it('batchUpsertSitemap 批量创建', () => {
    const entries = svc.batchUpsertSitemap([
      { path: '/a', changefreq: 'daily' as ChangeFreq },
      { path: '/b', changefreq: 'weekly' as ChangeFreq },
    ])
    expect(entries).toHaveLength(2)
  })

  it('batchUpsertSitemap 空列表抛 BadRequestException', () => {
    expect(() => svc.batchUpsertSitemap([])).toThrow(BadRequestException)
  })
})

describe('SeoService — GeoLocation CRUD', () => {
  let svc: SeoService

  beforeEach(() => {
    svc = new SeoService()
    svc.clear()
  })

  it('createGeoLocation 创建成功', () => {
    const geo = svc.createGeoLocation({
      city: '北京',
      district: '朝阳区',
      landmark: '国贸大厦',
      lat: 39.9087,
      lng: 116.4714,
    })
    expect(geo.city).toBe('北京')
    expect(geo.district).toBe('朝阳区')
    expect(geo.radiusKm).toBe(1)
  })

  it('createGeoLocation 空城市抛 BadRequestException', () => {
    expect(() => svc.createGeoLocation({
      city: '', district: '朝阳区', landmark: '地标',
      lat: 30, lng: 120,
    })).toThrow(BadRequestException)
  })

  it('createGeoLocation 无效纬度抛 BadRequestException', () => {
    expect(() => svc.createGeoLocation({
      city: '北京', district: '朝阳区', landmark: '地标',
      lat: 100, lng: 120,
    })).toThrow(BadRequestException)
  })

  it('searchGeoLocations 按城市区域搜索', () => {
    svc.createGeoLocation({ city: '上海', district: '浦东新区', landmark: '陆家嘴', lat: 31.23, lng: 121.47 })
    const results = svc.searchGeoLocations('上海', '浦东新区')
    expect(results.length).toBeGreaterThan(0)
  })

  it('searchGeoLocations 支持关键字过滤', () => {
    svc.createGeoLocation({ city: '上海', district: '浦东新区', landmark: '陆家嘴中心', lat: 31.23, lng: 121.47 })
    const results = svc.searchGeoLocations('上海', '浦东新区', '陆家嘴')
    expect(results.length).toBeGreaterThanOrEqual(1)
  })

  it('getAllGeoLocations 返回所有位置', () => {
    svc.createGeoLocation({ city: '北京', district: '海淀区', landmark: '中关村', lat: 39.9, lng: 116.3 })
    const all = svc.getAllGeoLocations()
    expect(all.length).toBeGreaterThan(0)
  })

  it('getGeoLocationById 返回指定位置', () => {
    const geo = svc.createGeoLocation({ city: '广州', district: '天河区', landmark: '天河城', lat: 23.13, lng: 113.32 })
    const found = svc.getGeoLocationById(geo.id)
    expect(found.city).toBe('广州')
  })

  it('getGeoLocationById 不存在抛 NotFoundException', () => {
    expect(() => svc.getGeoLocationById('nonexistent')).toThrow(NotFoundException)
  })

  it('deleteGeoLocation 删除成功', () => {
    const geo = svc.createGeoLocation({ city: '深圳', district: '南山区', landmark: '科技园', lat: 22.54, lng: 113.95 })
    svc.deleteGeoLocation(geo.id)
    expect(() => svc.getGeoLocationById(geo.id)).toThrow(NotFoundException)
  })
})
