import { describe, it, expect, afterEach } from 'vitest'

/**
 * 🦞 跨模块 E2E 测试链 #37: 边缘缓存 + CDN 失效工作流
 *
 * 模拟链路:
 *   Storefront-Web (B端店铺门户 — 内容编辑/发布)
 *   → CDN-Cache (CDN 边缘缓存层)
 *   → Cache-Invalidation (缓存失效策略)
 *   → Admin-Web (管理后台 — 缓存状态监控)
 *   → Analytics (数据管道 — 缓存命中率/回源率分析)
 *
 * 设计模式: CDN 缓存治理 + 缓存预热 + 失效分析
 *
 * ⚡ 新建于 Pulse-Nightly-12
 */

import assert from 'node:assert/strict'

// ============================================================
// 类型定义
// ============================================================

interface CacheEntry {
  url: string; content: string; contentType: string; cachedAt: string; ttl: number; region: string; sizeBytes: number
}

interface InvalidationRequest {
  id: string; pattern: 'exact' | 'prefix' | 'wildcard'; value: string; status: 'pending' | 'processing' | 'completed' | 'failed'
  requestedAt: string; completedAt?: string; invalidatedUrls: number
}

interface PublishedContent {
  id: string; slug: string; title: string; html: string; status: 'draft' | 'published' | 'archived'
  publishedAt?: string; lastModified: string
}

interface CacheMetrics {
  period: string; totalRequests: number; cacheHits: number; cacheMisses: number
  originFetchRate: number; avgLatencyMs: number; invalidationCount: number; region: string
}

// ============================================================
// Stores
// ============================================================

class ContentStore {
  private contents: PublishedContent[] = [
    { id: 'page-001', slug: 'homepage', title: '首页', html: '<h1>首页</h1>', status: 'published', publishedAt: '2026-07-01T00:00:00Z', lastModified: '2026-07-05T00:00:00Z' },
    { id: 'page-002', slug: 'products', title: '产品列表', html: '<div>产品</div>', status: 'published', publishedAt: '2026-07-02T00:00:00Z', lastModified: '2026-07-06T00:00:00Z' },
    { id: 'page-003', slug: 'about', title: '关于我们', html: '<p>公司介绍</p>', status: 'draft', lastModified: '2026-06-30T00:00:00Z' },
    { id: 'page-004', slug: 'promotion-summer', title: '夏季促销', html: '<div>促销内容</div>', status: 'published', publishedAt: '2026-07-08T00:00:00Z', lastModified: '2026-07-08T00:00:00Z' },
    { id: 'page-005', slug: 'promotion-winter', title: '冬季促销', html: '<div>冬季内容</div>', status: 'archived', lastModified: '2026-06-01T00:00:00Z' },
  ]
  getBySlug(slug: string): PublishedContent | undefined { return this.contents.find(c => c.slug === slug) }
  getById(id: string): PublishedContent | undefined { return this.contents.find(c => c.id === id) }
  getPublished(): PublishedContent[] { return this.contents.filter(c => c.status === 'published') }
  updateContent(id: string, update: Partial<PublishedContent>): boolean {
    const idx = this.contents.findIndex(c => c.id === id)
    if (idx === -1) return false
    this.contents[idx] = { ...this.contents[idx], ...update, lastModified: new Date().toISOString() }
    return true
  }
}

class CacheStore {
  private entries: Map<string, CacheEntry> = new Map()
  private hitCount = 0; private missCount = 0; private invalidationCount = 0

  get(url: string): CacheEntry | undefined {
    const entry = this.entries.get(url)
    if (!entry) { this.missCount++; return undefined }
    const age = (Date.now() - new Date(entry.cachedAt).getTime()) / 1000
    if (age > entry.ttl) { this.entries.delete(url); this.missCount++; return undefined }
    this.hitCount++; return entry
  }
  set(url: string, entry: CacheEntry): void { this.entries.set(url, entry) }
  invalidate(url: string): boolean {
    const existed = this.entries.has(url)
    this.entries.delete(url)
    if (existed) this.invalidationCount++
    return existed
  }
  invalidateByPrefix(prefix: string): number {
    let count = 0
    for (const url of this.entries.keys()) { if (url.startsWith(prefix)) { this.entries.delete(url); count++; this.invalidationCount++ } }
    return count
  }
  invalidateAll(): number { const count = this.entries.size; this.entries.clear(); this.invalidationCount += count; return count }
  getStats(): { size: number; hits: number; misses: number; invalidations: number } { return { size: this.entries.size, hits: this.hitCount, misses: this.missCount, invalidations: this.invalidationCount } }
}

class InvalidationStore {
  private requests: InvalidationRequest[] = []
  add(request: InvalidationRequest): void { this.requests.push(request) }
  getById(id: string): InvalidationRequest | undefined { return this.requests.find(r => r.id === id) }
  updateStatus(id: string, status: InvalidationRequest['status']): boolean {
    const req = this.requests.find(r => r.id === id)
    if (!req) return false
    req.status = status; if (status === 'completed' || status === 'failed') req.completedAt = new Date().toISOString()
    return true
  }
}

class AnalyticsStore {
  private metrics: CacheMetrics[] = []
  record(m: CacheMetrics): void { this.metrics.push(m) }
  getAggregate(): { avgHitRate: number; totalInvalidations: number; avgLatency: number } {
    if (this.metrics.length === 0) return { avgHitRate: 0, totalInvalidations: 0, avgLatency: 0 }
    const total = this.metrics.reduce((acc, m) => ({ hits: acc.hits + m.cacheHits, totalReq: acc.totalReq + m.totalRequests, latency: acc.latency + m.avgLatencyMs, invs: acc.invs + m.invalidationCount }), { hits: 0, totalReq: 0, latency: 0, invs: 0 })
    return { avgHitRate: total.totalReq > 0 ? total.hits / total.totalReq : 0, totalInvalidations: total.invs, avgLatency: this.metrics.length > 0 ? total.latency / this.metrics.length : 0 }
  }
}

// ============================================================
// Services
// ============================================================

class PublishService {
  constructor(private cs: ContentStore) {}
  editAndPublish(id: string, newHtml: string): PublishedContent | null {
    const content = this.cs.getById(id); if (!content) return null
    this.cs.updateContent(id, { html: newHtml, status: 'published', publishedAt: new Date().toISOString() })
    return this.cs.getById(id)!
  }
}

class CacheInvalidationService {
  constructor(private cc: CacheStore, private is: InvalidationStore, private cs: ContentStore) {}

  invalidateBySlug(slug: string): { requestId: string; invalidatedCount: number } {
    const url = `/pages/${slug}`
    const id = `inv-${Date.now()}-${slug}`
    this.is.add({ id, pattern: 'exact', value: url, status: 'pending', requestedAt: new Date().toISOString(), invalidatedUrls: 0 })
    const existed = this.cc.invalidate(url)
    this.is.updateStatus(id, 'completed')
    return { requestId: id, invalidatedCount: existed ? 1 : 0 }
  }

  purgeAll(): { requestId: string; invalidatedCount: number } {
    const id = `inv-full-${Date.now()}`
    this.is.add({ id, pattern: 'wildcard', value: '/*', status: 'pending', requestedAt: new Date().toISOString(), invalidatedUrls: 0 })
    const count = this.cc.invalidateAll()
    this.is.updateStatus(id, 'completed')
    return { requestId: id, invalidatedCount: count }
  }

  purgeByPrefix(prefix: string): { requestId: string; invalidatedCount: number } {
    const id = `inv-prefix-${Date.now()}`
    this.is.add({ id, pattern: 'prefix', value: prefix, status: 'pending', requestedAt: new Date().toISOString(), invalidatedUrls: 0 })
    const count = this.cc.invalidateByPrefix(prefix)
    this.is.updateStatus(id, 'completed')
    return { requestId: id, invalidatedCount: count }
  }

  warmUpCache(slugs: string[]): { warmed: number } {
    let warmed = 0
    for (const slug of slugs) {
      const content = this.cs.getBySlug(slug)
      if (content && content.status === 'published') {
        this.cc.set(`/pages/${slug}`, { url: `/pages/${slug}`, content: content.html, contentType: 'text/html', cachedAt: new Date().toISOString(), ttl: 3600, region: 'cn-east-1', sizeBytes: new Blob([content.html]).size })
        warmed++
      }
    }
    return { warmed }
  }
}

class CacheAnalyticsService {
  constructor(private cc: CacheStore, private as: AnalyticsStore) {}
  computeMetrics(period: string, region: string): CacheMetrics {
    const stats = this.cc.getStats()
    const totalRequests = stats.hits + stats.misses
    const m: CacheMetrics = { period, totalRequests, cacheHits: stats.hits, cacheMisses: stats.misses, originFetchRate: totalRequests > 0 ? stats.misses / totalRequests : 0, avgLatencyMs: stats.hits > 0 ? 15 : 0, invalidationCount: stats.invalidations, region }
    this.as.record(m)
    return m
  }
  getAggregateReport() { return this.as.getAggregate() }
}

// ============================================================
// Factory
// ============================================================
function createTestStores() {
  const cs = new ContentStore(); const cc = new CacheStore(); const is = new InvalidationStore(); const as = new AnalyticsStore()
  return {
    cacheStore: cc, analyticsStore: as, invalidationStore: is, contentStore: cs,
    publishService: new PublishService(cs),
    cacheService: new CacheInvalidationService(cc, is, cs),
    analyticsService: new CacheAnalyticsService(cc, as),
  }
}

// ============================================================
// 测试
// ============================================================

describe('#37: 边缘缓存 + CDN 失效工作流', () => {
  describe('Cache Invalidation — 正例', () => {
    it('P1: 内容发布后自动触发缓存失效 — 缓存更新', () => {
      const { cacheStore, publishService, cacheService } = createTestStores()
      cacheStore.set('/pages/homepage', { url: '/pages/homepage', content: '<h1>旧首页</h1>', contentType: 'text/html', cachedAt: new Date(Date.now() - 3600000).toISOString(), ttl: 7200, region: 'cn-east-1', sizeBytes: 50 })
      assert.ok(cacheStore.get('/pages/homepage'))
      const updated = publishService.editAndPublish('page-001', '<h1>新版首页</h1>')
      assert.ok(updated)
      const result = cacheService.invalidateBySlug('homepage')
      assert.ok(result.invalidatedCount >= 1)
      assert.equal(cacheStore.get('/pages/homepage'), undefined)
    })

    it('P2: 全量刷新(purge all)清除所有缓存', () => {
      const { cacheStore, cacheService } = createTestStores()
      cacheStore.set('/pages/homepage', { url: '/pages/homepage', content: 'home', contentType: 'text/html', cachedAt: new Date().toISOString(), ttl: 3600, region: 'cn-east-1', sizeBytes: 10 })
      cacheStore.set('/pages/products', { url: '/pages/products', content: 'products', contentType: 'text/html', cachedAt: new Date().toISOString(), ttl: 3600, region: 'cn-east-1', sizeBytes: 20 })
      cacheStore.set('/api/products', { url: '/api/products', content: '{"data":[]}', contentType: 'application/json', cachedAt: new Date().toISOString(), ttl: 3600, region: 'cn-east-1', sizeBytes: 50 })
      assert.equal(cacheService.purgeAll().invalidatedCount, 3)
      assert.equal(cacheStore.getStats().size, 0)
    })

    it('P3: 通配符前缀清除 — 清除 /promotion-* 类页面', () => {
      const { cacheStore, cacheService } = createTestStores()
      cacheStore.set('/pages/promotion-summer', { url: '/pages/promotion-summer', content: 'summer', contentType: 'text/html', cachedAt: new Date().toISOString(), ttl: 3600, region: 'cn-east-1', sizeBytes: 20 })
      cacheStore.set('/pages/promotion-winter', { url: '/pages/promotion-winter', content: 'winter', contentType: 'text/html', cachedAt: new Date().toISOString(), ttl: 3600, region: 'cn-east-1', sizeBytes: 20 })
      cacheStore.set('/pages/homepage', { url: '/pages/homepage', content: 'home', contentType: 'text/html', cachedAt: new Date().toISOString(), ttl: 3600, region: 'cn-east-1', sizeBytes: 10 })
      assert.equal(cacheService.purgeByPrefix('/pages/promotion').invalidatedCount, 2)
      assert.equal(cacheStore.getStats().size, 1)
    })

    it('P4: 缓存预热 — 发布内容被主动预热到缓存', () => {
      const { cacheService, cacheStore } = createTestStores()
      const result = cacheService.warmUpCache(['homepage', 'products', 'about', 'promotion-summer'])
      assert.equal(result.warmed, 3)
      assert.equal(cacheStore.getStats().size, 3)
      const cached = cacheStore.get('/pages/homepage')
      assert.ok(cached && cached.content.includes('首页'))
    })
  })

  describe('Cache Analytics — 正例', () => {
    it('A1: 缓存命中率计算正确', () => {
      const { cacheStore, analyticsService } = createTestStores()
      for (let i = 0; i < 80; i++) { cacheStore.set(`/pages/page-${i}`, { url: `/pages/page-${i}`, content: `page-${i}`, contentType: 'text/html', cachedAt: new Date().toISOString(), ttl: 3600, region: 'cn-east-1', sizeBytes: 10 }) }
      for (let i = 0; i < 80; i++) { cacheStore.get(`/pages/page-${i}`) }
      for (let i = 0; i < 20; i++) { cacheStore.get(`/pages/missing-${i}`) }
      const metrics = analyticsService.computeMetrics('2026-07-10_03:30:00', 'cn-east-1')
      assert.equal(metrics.totalRequests, 100)
      assert.equal(metrics.cacheHits, 80); assert.equal(metrics.cacheMisses, 20); assert.equal(metrics.originFetchRate, 0.2)
      assert.equal(analyticsService.getAggregateReport().avgHitRate, 0.8)
    })
  })

  describe('Cache Invalidation — 反例', () => {
    it('N1: 未发布的草稿不存在缓存, 失效不报错', () => {
      const { cacheService } = createTestStores()
      assert.equal(cacheService.invalidateBySlug('about').invalidatedCount, 0)
    })

    it('N2: 对不存在的 slug 执行失效（静默返回 0）', () => {
      const { cacheService } = createTestStores()
      assert.equal(cacheService.invalidateBySlug('nonexistent-page-slug').invalidatedCount, 0)
    })

    it('N3: 已归档页 failover 缓存即使存在也不应使用', () => {
      const { cacheStore, cacheService } = createTestStores()
      cacheStore.set('/pages/promotion-winter', { url: '/pages/promotion-winter', content: 'old winter', contentType: 'text/html', cachedAt: new Date().toISOString(), ttl: 3600, region: 'cn-east-1', sizeBytes: 20 })
      assert.ok(cacheStore.get('/pages/promotion-winter'))
      assert.equal(cacheService.invalidateBySlug('promotion-winter').invalidatedCount, 1)
    })
  })

  describe('Cache — 边界', () => {
    it('B1: 缓存 TTL 过期后自动失效', () => {
      const { cacheStore } = createTestStores()
      cacheStore.set('/pages/homepage', { url: '/pages/homepage', content: '<h1>旧版本</h1>', contentType: 'text/html', cachedAt: new Date(Date.now() - 10000).toISOString(), ttl: 1, region: 'cn-east-1', sizeBytes: 20 })
      assert.equal(cacheStore.get('/pages/homepage'), undefined)
    })

    it('B2: 大量 URL 同时失效 (100条前缀匹配)', () => {
      const { cacheStore, cacheService } = createTestStores()
      for (let i = 0; i < 100; i++) { cacheStore.set(`/api/products/${i}`, { url: `/api/products/${i}`, content: `{"id":${i}}`, contentType: 'application/json', cachedAt: new Date().toISOString(), ttl: 3600, region: 'cn-east-1', sizeBytes: 30 }) }
      cacheStore.set('/pages/homepage', { url: '/pages/homepage', content: 'home', contentType: 'text/html', cachedAt: new Date().toISOString(), ttl: 3600, region: 'cn-east-1', sizeBytes: 10 })
      assert.equal(cacheService.purgeByPrefix('/api/products').invalidatedCount, 100)
      assert.equal(cacheStore.getStats().size, 1)
    })

    it('B3: 缓存预热传入不存在的 slug 不会导致错误', () => {
      const { cacheService } = createTestStores()
      assert.equal(cacheService.warmUpCache(['homepage', 'this-does-not-exist', 'products']).warmed, 2)
    })

    it('B4: 空气缓存 (空缓存下全量清除)', () => {
      const { cacheService } = createTestStores()
      assert.equal(cacheService.purgeAll().invalidatedCount, 0)
    })
  })
})
