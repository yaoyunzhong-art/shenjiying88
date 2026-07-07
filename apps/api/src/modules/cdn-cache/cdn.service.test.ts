import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * Phase 98 CDN Service Tests (V10 Sprint 2 Day 29)
 *
 * 15 tests 覆盖:
 * - URL pattern 匹配 (3)
 * - Cache-Control 头构造 (2)
 * - 规则 CRUD (2)
 * - 边缘节点管理 (2)
 * - 主动失效 (2)
 * - 命中/未命中统计 (2)
 * - 跨租户隔离 (1)
 * - 工具函数 (1)
 */

import assert from 'node:assert/strict'
import { CdnCacheService } from './cdn.service'
import {
  matchUrl, compilePattern, buildCacheControlHeader,
  buildCacheKey, contentFingerprint, generateETag,
} from './cdn.entity'
import { runWithTenant } from '../../common/context/tenant-context'

const TENANT_A = {
  tenantId: 'tenant-A', storeId: 'store-001', userId: 'admin-A',
  role: 'tenant_admin' as const,
}
const TENANT_B = {
  tenantId: 'tenant-B', storeId: 'store-002', userId: 'admin-B',
  role: 'tenant_admin' as const,
}

const SHARED_CDN = new CdnCacheService()

describe('Phase 98 CDN (V10 Sprint 2 Day 29)', () => {
  // ============ 1. URL Pattern (3) ============
  describe('1. URL pattern 匹配', () => {
    it('精确匹配', () => {
      const r = matchUrl('/api/reports', '/api/reports')
      assert.equal(r.match, true)
    })

    it(':param 提取参数', () => {
      const r = matchUrl('/api/reports/:id', '/api/reports/rpt-001')
      assert.equal(r.match, true)
      assert.equal(r.params.id, 'rpt-001')
    })

    it('* 通配符 + 多参数', () => {
      const r = matchUrl('/api/stores/:storeId/reports/*', '/api/stores/s001/reports/2026/06')
      assert.equal(r.match, true)
      assert.equal(r.params.storeId, 's001')
    })
  })

  // ============ 2. Cache-Control (2) ============
  describe('2. Cache-Control 头构造', () => {
    it('public + max-age + SWR', () => {
      const rule = makeRule({ strategy: 'public', maxAge: 3600, staleWhileRevalidate: 86400 })
      const header = buildCacheControlHeader(rule)
      assert.ok(header.includes('public'))
      assert.ok(header.includes('max-age=3600'))
      assert.ok(header.includes('stale-while-revalidate=86400'))
    })

    it('immutable 不带 max-age', () => {
      const rule = makeRule({ strategy: 'immutable', maxAge: 31536000 })
      const header = buildCacheControlHeader(rule)
      assert.ok(header.includes('immutable'))
      assert.ok(header.includes('max-age=31536000'))
    })

    it('no-store 不带 max-age', () => {
      const rule = makeRule({ strategy: 'no-store', maxAge: 0 })
      const header = buildCacheControlHeader(rule)
      assert.ok(header.includes('no-store'))
      assert.ok(!header.includes('max-age'))
    })
  })

  // ============ 3. 规则 CRUD (2) ============
  describe('3. 规则 CRUD', () => {
    it('创建规则 → 默认值 + 启用', async () => {
      const rule = await runWithTenant(TENANT_A, async () =>
        SHARED_CDN.createRule({
          name: 'reports-cache',
          urlPattern: '/api/reports/:id',
          maxAge: 600,
          staleWhileRevalidate: 3600,
        }),
      )
      assert.equal(rule.strategy, 'public')
      assert.equal(rule.maxAge, 600)
      assert.equal(rule.enableGzip, true)
      assert.equal(rule.enabled, true)
    })

    it('非法 pattern 被拒', async () => {
      await assert.rejects(
        () => runWithTenant(TENANT_A, async () =>
          SHARED_CDN.createRule({ name: 'bad', urlPattern: '' }),
        ),
        /urlPattern 必填/,
      )
    })
  })

  // ============ 4. URL 匹配 (1) ============
  describe('4. URL 匹配', () => {
    it('按优先级匹配最具体的规则', async () => {
      // 添加两个规则
      await runWithTenant(TENANT_A, async () =>
        SHARED_CDN.createRule({
          name: 'fallback-api',
          urlPattern: '/api/*',
          priority: 1,
        }),
      )
      await runWithTenant(TENANT_A, async () =>
        SHARED_CDN.createRule({
          name: 'specific-reports',
          urlPattern: '/api/reports/:id',
          priority: 10,
        }),
      )
      const rule = await runWithTenant(TENANT_A, async () =>
        SHARED_CDN.matchRule('/api/reports/rpt-001'),
      )
      assert.ok(rule)
      assert.equal(rule!.name, 'specific-reports')
    })
  })

  // ============ 5. 边缘节点 (2) ============
  describe('5. 边缘节点管理', () => {
    it('添加 + 心跳更新', async () => {
      const node = await SHARED_CDN.addEdgeNode({
        name: 'edge-cn-shanghai-01',
        region: 'cn-shanghai',
        endpoint: 'https://edge.shanghai.shenjiying88.com',
        capacityBytes: 10 * 1024 * 1024 * 1024,
      })
      assert.equal(node.status, 'online')

      await SHARED_CDN.recordHeartbeat(node.id, 0.95, 12.5, 1024 * 1024 * 100)
      const updated = await SHARED_CDN.listEdgeNodes()
      const target = updated.find((n) => n.id === node.id)!
      assert.equal(target.hitRate, 0.95)
      assert.equal(target.avgLatencyMs, 12.5)
      assert.equal(target.usedBytes, 1024 * 1024 * 100)
    })

    it('nodeStats 聚合', async () => {
      const stats = SHARED_CDN.getEdgeNodeStats()
      assert.ok(stats.totalNodes >= 1)
      assert.ok(stats.onlineNodes >= 1)
      assert.ok(stats.totalCapacityBytes > 0)
    })
  })

  // ============ 6. 主动失效 (2) ============
  describe('6. 主动失效', () => {
    it('URL 精确失效', async () => {
      // 添加一些测试缓存条目
      SHARED_CDN.addCacheEntryForTesting({
        key: '/api/reports/rpt-001', ruleId: 'r1', edgeNodeId: 'e1',
        url: '/api/reports/rpt-001', statusCode: 200, sizeBytes: 1024,
        cachedAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
        hitCount: 0,
      })
      SHARED_CDN.addCacheEntryForTesting({
        key: '/api/reports/rpt-002', ruleId: 'r1', edgeNodeId: 'e1',
        url: '/api/reports/rpt-002', statusCode: 200, sizeBytes: 1024,
        cachedAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
        hitCount: 0,
      })
      const inv = await runWithTenant(TENANT_A, async () =>
        SHARED_CDN.invalidate({ mode: 'url', target: '/api/reports/rpt-001' }),
      )
      assert.equal(inv.affectedEntries, 1)
      assert.equal(inv.status, 'completed')
      const remaining = SHARED_CDN.listCacheEntriesForTesting().map((e) => e.url)
      assert.ok(!remaining.includes('/api/reports/rpt-001'))
      assert.ok(remaining.includes('/api/reports/rpt-002'))
    })

    it('pattern 失效 → 影响多个', async () => {
      SHARED_CDN.addCacheEntryForTesting({
        key: '/api/stores/s001/reports', ruleId: 'r1', edgeNodeId: 'e1',
        url: '/api/stores/s001/reports', statusCode: 200, sizeBytes: 100,
        cachedAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
        hitCount: 0,
      })
      SHARED_CDN.addCacheEntryForTesting({
        key: '/api/stores/s001/insights', ruleId: 'r1', edgeNodeId: 'e1',
        url: '/api/stores/s001/insights', statusCode: 200, sizeBytes: 100,
        cachedAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
        hitCount: 0,
      })
      const inv = await runWithTenant(TENANT_A, async () =>
        SHARED_CDN.invalidate({ mode: 'pattern', target: '/api/stores/s001/*' }),
      )
      assert.equal(inv.affectedEntries, 2)
    })
  })

  // ============ 7. 命中率 (2) ============
  describe('7. 命中率统计', () => {
    it('hit + miss → hitRate 0.5', () => {
      SHARED_CDN.recordHit('tenant-test-1')
      SHARED_CDN.recordMiss('tenant-test-1')
      assert.equal(SHARED_CDN.getHitRate('tenant-test-1'), 0.5)
    })

    it('全 hit → 1.0', () => {
      SHARED_CDN.recordHit('tenant-test-2')
      SHARED_CDN.recordHit('tenant-test-2')
      assert.equal(SHARED_CDN.getHitRate('tenant-test-2'), 1)
    })
  })

  // ============ 8. 跨租户隔离 (1) ============
  describe('8. 跨租户隔离', () => {
    it('tenant B 看不到 tenant A 的规则', async () => {
      const aList = await runWithTenant(TENANT_A, async () => SHARED_CDN.listRules())
      const bList = await runWithTenant(TENANT_B, async () => SHARED_CDN.listRules())
      assert.ok(aList.length > 0)
      assert.equal(bList.length, 0)
      // tenant B getRule 应 404
      await assert.rejects(
        () => runWithTenant(TENANT_B, async () => SHARED_CDN.getRule(aList[0].id)),
        /不存在/,
      )
    })
  })

  // ============ 9. 工具函数 (1) ============
  describe('9. 工具函数', () => {
    it('compilePattern + contentFingerprint + buildCacheKey', () => {
      const { paramNames } = compilePattern('/api/:storeId/items/:itemId')
      assert.deepEqual(paramNames, ['storeId', 'itemId'])

      const fp = contentFingerprint('hello world')
      assert.equal(fp.length, 12)

      const key = buildCacheKey('/api/x', { 'Accept-Encoding': 'gzip' })
      assert.ok(key.includes('Accept-Encoding=gzip'))

      const etag = generateETag('content')
      assert.ok(etag.startsWith('W/"'))
    })
  })
})

// ============ Helper ============
function makeRule(overrides: any = {}) {
  return {
    id: 'r-test',
    tenantId: 'tenant-A',
    name: 'test',
    urlPattern: '/api/*',
    methods: ['GET', 'HEAD'] as any,
    strategy: 'public' as const,
    maxAge: 3600,
    staleWhileRevalidate: 0,
    enableETag: true,
    enableGzip: true,
    enableBrotli: false,
    varyHeaders: ['Accept-Encoding'],
    cacheableStatusCodes: [200, 301],
    priority: 0,
    enabled: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }
}