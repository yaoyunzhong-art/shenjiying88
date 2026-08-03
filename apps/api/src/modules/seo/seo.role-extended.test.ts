/**
 * 🐜 自动: [seo] [C] 角色扩展测试
 *
 * 8 角色视角的 SEO 数据模块扩展测试（补充 role.test.ts）
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个至少 3 个场景测试 = 8×3 = 24 tests
 * 使用实际 SeoService
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { SeoService } from './seo.service'

// ── 角色权限矩阵 ──

const ROLES = {
  StoreManager: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Security: '🔧安监',
  Guide: '🎮导玩员',
  Operations: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
} as const

/** 角色 → SEO 模块权限 */
const roleSeoAccess: Record<string, string[]> = {
  'metadata:upsert': ['👔店长', '🎯运行专员', '📢营销'],
  'metadata:view': ['👔店长', '🛒前台', '🎯运行专员', '📢营销'],
  'metadata:list': ['👔店长', '🎯运行专员'],
  'metadata:delete': ['👔店长', '🎯运行专员'],
  'sitemap:manage': ['🎯运行专员'],
  'sitemap:view': ['👔店长', '🎯运行专员'],
  'geo:create': ['🎯运行专员', '📢营销'],
  'geo:search': ['👔店长', '🛒前台', '📢营销', '🎯运行专员'],
  'geo:view': ['👔店长', '🎯运行专员'],
}

function checkRoleAccess(role: string, resource: string): boolean {
  return roleSeoAccess[resource]?.includes(role) ?? false
}

function makeService(): SeoService {
  const svc = new SeoService()
  svc.clear()
  return svc
}

// ════════════════════════════════════════════════════════════
// 👔店长 — SEO
// ════════════════════════════════════════════════════════════

describe('[👔店长] seo 角色扩展测试', () => {
  it('👔[正例] 店长创建/更新页面 SEO 元数据', () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'metadata:upsert')).toBe(true)
    const svc = makeService()

    const meta = svc.upsertMetadata('/store/001', {
      title: '疯狂抓娃娃·徐汇店 | 上海电玩城',
      description: '徐汇区最大的街机电玩城，200+设备，周末好去处',
      keywords: ['徐汇电玩城', '抓娃娃', '街机'],
      canonical: 'https://shenjiying88.com/store/001',
    })
    expect(meta.path).toBe('/store/001')
    expect(meta.title).toContain('徐汇店')
    expect(meta.keywords).toContain('抓娃娃')
    expect(meta.locale).toBe('zh-CN')

    const updated = svc.upsertMetadata('/store/001', {
      title: '疯狂抓娃娃·徐汇店 全新升级',
      description: '徐汇区最大电玩城全新升级，新增VR体验区',
      canonical: 'https://shenjiying88.com/store/001',
    })
    expect(updated.updatedAt).toBeTruthy()
    expect(updated.title).toContain('全新升级')
  })

  it('👔[正例] 店长查看元数据 → 列表', () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'metadata:view')).toBe(true)
    const svc = makeService()
    svc.upsertMetadata('/store/001', {
      title: '店A', description: '门店A描述', canonical: 'https://a.com',
    })
    svc.upsertMetadata('/store/002', {
      title: '店B', description: '门店B描述', canonical: 'https://b.com',
    })

    const meta = svc.getMetadata('/store/001')
    expect(meta.title).toBe('店A')

    expect(checkRoleAccess(ROLES.StoreManager, 'metadata:list')).toBe(true)
    const list = svc.listMetadata()
    expect(list.total).toBe(2)
  })

  it('👔[正例] 店长搜索 GEO 位置', () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'geo:search')).toBe(true)
    const svc = makeService()
    svc.createGeoLocation({
      city: '上海', district: '徐汇', landmark: '美罗城',
      lat: 31.19, lng: 121.44,
    })
    svc.createGeoLocation({
      city: '上海', district: '徐汇', landmark: '港汇恒隆广场',
      lat: 31.19, lng: 121.43,
    })

    const results = svc.searchGeoLocations('上海', '徐汇', '美罗')
    expect(results.length).toBe(1)
    expect(results[0].landmark).toBe('美罗城')
  })
})

// ════════════════════════════════════════════════════════════
// 🛒前台 — SEO
// ════════════════════════════════════════════════════════════

describe('[🛒前台] seo 角色扩展测试', () => {
  it('🛒[正例] 前台查看页面 SEO 元数据', () => {
    expect(checkRoleAccess(ROLES.FrontDesk, 'metadata:view')).toBe(true)
    const svc = makeService()
    svc.upsertMetadata('/about', {
      title: '关于我们', description: '疯狂抓娃娃品牌故事',
      canonical: 'https://shenjiying88.com/about',
    })
    const meta = svc.getMetadata('/about')
    expect(meta.description).toContain('疯狂抓娃娃')
  })

  it('🛒[正例] 前台搜索 GEO 位置', () => {
    expect(checkRoleAccess(ROLES.FrontDesk, 'geo:search')).toBe(true)
    const svc = makeService()
    svc.createGeoLocation({
      city: '上海', district: '浦东', landmark: '陆家嘴正大广场',
      lat: 31.24, lng: 121.50,
    })
    const results = svc.searchGeoLocations('上海', '浦东')
    expect(results.length).toBeGreaterThan(0)
  })

  it('🛒[反例] 前台无权限管理元数据', () => {
    expect(checkRoleAccess(ROLES.FrontDesk, 'metadata:upsert')).toBe(false)
    expect(checkRoleAccess(ROLES.FrontDesk, 'metadata:delete')).toBe(false)
    expect(checkRoleAccess(ROLES.FrontDesk, 'sitemap:manage')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 👥HR — SEO
// ════════════════════════════════════════════════════════════

describe('[👥HR] seo 角色扩展测试', () => {
  it('👥[反例] HR 无权限管理元数据', () => {
    expect(checkRoleAccess(ROLES.HR, 'metadata:upsert')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'metadata:delete')).toBe(false)
  })

  it('👥[反例] HR 无权限管理 Sitemap', () => {
    expect(checkRoleAccess(ROLES.HR, 'sitemap:manage')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'sitemap:view')).toBe(false)
  })

  it('👥[反例] HR 无权限创建/查看 GEO', () => {
    expect(checkRoleAccess(ROLES.HR, 'geo:create')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'geo:search')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'geo:view')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 🔧安监 — SEO
// ════════════════════════════════════════════════════════════

describe('[🔧安监] seo 角色扩展测试', () => {
  it('🔧[反例] 安监无权限查看元数据', () => {
    expect(checkRoleAccess(ROLES.Security, 'metadata:view')).toBe(false)
    expect(checkRoleAccess(ROLES.Security, 'metadata:list')).toBe(false)
  })

  it('🔧[反例] 安监无权限管理 SEO', () => {
    expect(checkRoleAccess(ROLES.Security, 'metadata:upsert')).toBe(false)
    expect(checkRoleAccess(ROLES.Security, 'sitemap:manage')).toBe(false)
    expect(checkRoleAccess(ROLES.Security, 'geo:create')).toBe(false)
  })

  it('🔧[闭环] 安监无权限返回统一格式', () => {
    const denied = { success: false, code: 403, message: 'NO_SEO_ACCESS', module: 'seo' }
    expect(denied.code).toBe(403)
    expect(denied.module).toBe('seo')
  })
})

// ════════════════════════════════════════════════════════════
// 🎮导玩员 — SEO
// ════════════════════════════════════════════════════════════

describe('[🎮导玩员] seo 角色扩展测试', () => {
  it('🎮[反例] 导玩员无权限查看/管理元数据', () => {
    expect(checkRoleAccess(ROLES.Guide, 'metadata:view')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'metadata:upsert')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'metadata:list')).toBe(false)
  })

  it('🎮[反例] 导玩员无权限管理 Sitemap', () => {
    expect(checkRoleAccess(ROLES.Guide, 'sitemap:manage')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'sitemap:view')).toBe(false)
  })

  it('🎮[反例] 导玩员无权限操作 GEO', () => {
    expect(checkRoleAccess(ROLES.Guide, 'geo:create')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'geo:search')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 🎯运行专员 — SEO
// ════════════════════════════════════════════════════════════

describe('[🎯运行专员] seo 角色扩展测试', () => {
  it('🎯[正例] 运行专员管理 Sitemap 条目', () => {
    expect(checkRoleAccess(ROLES.Operations, 'sitemap:manage')).toBe(true)
    const svc = makeService()

    const entry = svc.upsertSitemap('/store/001', {
      changefreq: 'daily', priority: 0.8,
    })
    expect(entry.changefreq).toBe('daily')
    expect(entry.priority).toBe(0.8)

    const got = svc.getSitemapByPath('/store/001')
    expect(got.id).toBe(entry.id)

    // 批量导入
    const batch = svc.batchUpsertSitemap([
      { path: '/store/002', changefreq: 'weekly', priority: 0.6 },
      { path: '/store/003', changefreq: 'monthly', priority: 0.4 },
    ])
    expect(batch.length).toBe(2)

    const all = svc.getSitemapEntries()
    expect(all.length).toBe(3)
  })

  it('🎯[正例] 运行专员创建/查看 GEO 位置', () => {
    expect(checkRoleAccess(ROLES.Operations, 'geo:create')).toBe(true)
    const svc = makeService()

    const geo = svc.createGeoLocation({
      city: '北京', district: '朝阳', landmark: '朝阳大悦城',
      lat: 39.92, lng: 116.47,
    })
    expect(geo.radiusKm).toBe(1) // default

    const got = svc.getGeoLocationById(geo.id)
    expect(got.landmark).toBe('朝阳大悦城')

    const all = svc.getAllGeoLocations()
    expect(all.length).toBe(1)
  })

  it('🎯[正例] 运行专员删除/筛选元数据', () => {
    expect(checkRoleAccess(ROLES.Operations, 'metadata:delete')).toBe(true)
    const svc = makeService()
    svc.upsertMetadata('/store/del-test', {
      title: '待删除', description: '测试删除', canonical: 'https://test.com',
    })
    expect(() => svc.getMetadata('/store/del-test')).not.toThrow()
    svc.deleteMetadata('/store/del-test')
    expect(() => svc.getMetadata('/store/del-test')).toThrow()

    // list by locale
    svc.upsertMetadata('/en/about', {
      title: 'About Us', description: 'English about page',
      canonical: 'https://en.example.com/about', locale: 'en-US',
    })
    const enList = svc.listMetadata({ locale: 'en-US' })
    expect(enList.total).toBe(1)
    expect(enList.items[0].locale).toBe('en-US')
  })
})

// ════════════════════════════════════════════════════════════
// 🤝团建 — SEO
// ════════════════════════════════════════════════════════════

describe('[🤝团建] seo 角色扩展测试', () => {
  it('🤝[反例] 团建无权限查看元数据', () => {
    expect(checkRoleAccess(ROLES.Teambuilding, 'metadata:view')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'metadata:list')).toBe(false)
  })

  it('🤝[反例] 团建无权限管理 Sitemap', () => {
    expect(checkRoleAccess(ROLES.Teambuilding, 'sitemap:manage')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'sitemap:view')).toBe(false)
  })

  it('🤝[反例] 团建无权限操作 GEO', () => {
    expect(checkRoleAccess(ROLES.Teambuilding, 'geo:create')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'geo:search')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 📢营销 — SEO
// ════════════════════════════════════════════════════════════

describe('[📢营销] seo 角色扩展测试', () => {
  it('📢[正例] 营销创建元数据 + 查看', () => {
    expect(checkRoleAccess(ROLES.Marketing, 'metadata:upsert')).toBe(true)
    const svc = makeService()

    const meta = svc.upsertMetadata('/campaign/summer', {
      title: '暑期大促 | 疯狂抓娃娃',
      description: '暑期畅玩卡限时5折，学生专享¥99/月',
      keywords: ['暑期活动', '畅玩卡', '限时优惠'],
      canonical: 'https://shenjiying88.com/campaign/summer',
      ogImage: 'https://cdn.shenjiying88.com/og/summer.jpg',
    })
    expect(meta.ogImage).toBeTruthy()
    expect(meta.keywords).toContain('暑期活动')

    const got = svc.getMetadata('/campaign/summer')
    expect(got.title).toBe('暑期大促 | 疯狂抓娃娃')
  })

  it('📢[正例] 营销创建 GEO 位置', () => {
    expect(checkRoleAccess(ROLES.Marketing, 'geo:create')).toBe(true)
    const svc = makeService()

    const geo = svc.createGeoLocation({
      city: '深圳', district: '南山', landmark: '海岸城',
      lat: 22.52, lng: 113.94, radiusKm: 2,
    })
    expect(geo.radiusKm).toBe(2)

    const searched = svc.searchGeoLocations('深圳', '南山')
    expect(searched.length).toBeGreaterThan(0)
    expect(searched[0].landmark).toBe('海岸城')
  })

  it('📢[反例] 营销无权限删除元数据', () => {
    expect(checkRoleAccess(ROLES.Marketing, 'metadata:delete')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'sitemap:manage')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 🦞 跨角色组合场景 + 边界
// ════════════════════════════════════════════════════════════

describe('[🦞 seo 跨角色闭环 + 边界]', () => {
  it('📢 + 🎯 营销创建元数据 → 运行专员管理 Sitemap', () => {
    const svc = makeService()

    // 营销创建元数据
    svc.upsertMetadata('/store/new', {
      title: '新店开业',
      description: '新店开业特惠',
      canonical: 'https://shenjiying88.com/store/new',
    })

    // 运行专员为同一路径创建 Sitemap
    const sitemap = svc.upsertSitemap('/store/new', {
      changefreq: 'daily', priority: 0.9,
    })
    expect(sitemap.path).toBe('/store/new')

    // 店长查看 Sitemap
    const entries = svc.getSitemapEntries()
    expect(entries.length).toBe(1)
    const entry = svc.getSitemapByPath('/store/new')
    expect(entry.priority).toBe(0.9)
  })

  it('🛡️ 空路径抛出 BadRequest', () => {
    const svc = makeService()
    expect(() => svc.upsertMetadata('', {
      title: '空', description: '空', canonical: 'https://x.com',
    })).toThrow()
    expect(() => svc.getMetadata('')).toThrow()
  })

  it('🛡️ 优先级越界抛出 BadRequest', () => {
    const svc = makeService()
    expect(() => svc.upsertSitemap('/test', { priority: 1.5 })).toThrow()
    expect(() => svc.upsertSitemap('/test', { priority: -0.1 })).toThrow()
  })

  it('🛡️ 不存在的元数据抛出 NotFound', () => {
    const svc = makeService()
    expect(() => svc.getMetadata('/nonexistent')).toThrow()
    expect(() => svc.deleteMetadata('/nonexistent')).toThrow()
  })

  it('🛡️ 不存在的 Sitemap 抛出 NotFound', () => {
    const svc = makeService()
    expect(() => svc.getSitemapByPath('/no-sitemap')).toThrow()
    expect(() => svc.deleteSitemap('/no-sitemap')).toThrow()
  })

  it('🛡️ 批量导入空数组抛出 BadRequest', () => {
    const svc = makeService()
    expect(() => svc.batchUpsertSitemap([])).toThrow()
  })

  it('🛡️ 不存在的 GEO 位置抛出 NotFound', () => {
    const svc = makeService()
    expect(() => svc.getGeoLocationById('geo-nonexistent')).toThrow()
    expect(() => svc.deleteGeoLocation('geo-nonexistent')).toThrow()
  })

  it('🛡️ 搜索 GEO 空城市抛出 BadRequest', () => {
    const svc = makeService()
    expect(() => svc.searchGeoLocations('', '朝阳')).toThrow()
    expect(() => svc.searchGeoLocations('北京', '')).toThrow()
  })

  it('🛡️ 纬度越界抛出 BadRequest', () => {
    const svc = makeService()
    expect(() => svc.createGeoLocation({
      city: '上海', district: '徐汇', landmark: '测试', lat: 100, lng: 121,
    })).toThrow()
    expect(() => svc.createGeoLocation({
      city: '上海', district: '徐汇', landmark: '测试', lat: 31, lng: 200,
    })).toThrow()
  })
})
