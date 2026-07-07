import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
/**
 * 🐜 自动: [cdn-cache] [A] entity.test 补全
 *
 * 覆盖 CDN 缓存 Entity 全量类型合同与工具函数：
 * - CdnCacheRule, EdgeNode, CdnCacheEntry, CacheInvalidation
 * - 工具函数 (generateId, compilePattern, matchUrl, buildCacheControlHeader,
 *   generateETag, buildCacheKey, computeHitRate, contentFingerprint)
 * - 枚举类型 (CacheStrategy, CacheableMethod)
 * - 边界测试 (空数据、特殊 pattern、无效输入)
 */

import assert from 'node:assert/strict'
import {
  CdnCacheRule, EdgeNode, CdnCacheEntry, CacheInvalidation,
  CacheStrategy, CacheableMethod,
  generateRuleId, generateNodeId, generateInvalidationId,
  compilePattern, matchUrl, buildCacheControlHeader,
  generateETag, buildCacheKey, computeHitRate, contentFingerprint,
} from './cdn.entity'

// ── CdnCacheRule type contract ────────────────────────────────────
describe('cdn.entity: CdnCacheRule', () => {
  it('creates valid rule with all fields', () => {
    const rule: CdnCacheRule = {
      id: 'cdn-rule-001',
      tenantId: 'tenant-1',
      name: 'product images',
      urlPattern: '/api/images/*',
      methods: ['GET', 'HEAD'],
      strategy: 'public',
      maxAge: 7200,
      staleWhileRevalidate: 3600,
      enableETag: true,
      enableGzip: true,
      enableBrotli: true,
      varyHeaders: ['Accept-Encoding'],
      cacheableStatusCodes: [200, 301, 404],
      priority: 10,
      enabled: true,
      createdAt: '2026-06-29T00:00:00.000Z',
      updatedAt: '2026-06-29T00:00:00.000Z',
    }

    assert.equal(rule.name, 'product images')
    assert.equal(rule.strategy, 'public')
    assert.equal(rule.maxAge, 7200)
    assert.equal(rule.priority, 10)
    assert.deepEqual(rule.methods, ['GET', 'HEAD'])
    assert.deepEqual(rule.cacheableStatusCodes, [200, 301, 404])
  })

  it('rule with no-store strategy and no vary headers', () => {
    const rule: CdnCacheRule = {
      id: 'cdn-rule-002',
      tenantId: 'tenant-1',
      name: 'no-cache api',
      urlPattern: '/api/auth/*',
      methods: ['GET'],
      strategy: 'no-store',
      maxAge: 0,
      staleWhileRevalidate: 0,
      enableETag: false,
      enableGzip: true,
      enableBrotli: false,
      varyHeaders: [],
      cacheableStatusCodes: [],
      priority: 100,
      enabled: true,
      createdAt: '',
      updatedAt: '',
    }

    assert.equal(rule.strategy, 'no-store')
    assert.equal(rule.maxAge, 0)
    assert.deepEqual(rule.varyHeaders, [])
    assert.deepEqual(rule.cacheableStatusCodes, [])
  })

  it('supports all cache strategies', () => {
    const strategies: CacheStrategy[] = ['public', 'private', 'no-store', 'no-cache', 'immutable']
    for (const s of strategies) {
      const rule: CdnCacheRule = {
        id: 'r1', tenantId: 't1', name: 'test', urlPattern: '/api/*',
        methods: ['GET'], strategy: s, maxAge: 60, staleWhileRevalidate: 30,
        enableETag: false, enableGzip: false, enableBrotli: false,
        varyHeaders: [], cacheableStatusCodes: [200], priority: 0, enabled: true,
        createdAt: '', updatedAt: '',
      }
      assert.equal(rule.strategy, s)
    }
  })

  it('methods only GET or HEAD', () => {
    const methods: CacheableMethod[] = ['GET', 'HEAD']
    for (const m of methods) {
      const rule: CdnCacheRule = {
        id: 'r1', tenantId: 't1', name: 'test', urlPattern: '/api/*',
        methods: [m], strategy: 'public', maxAge: 60, staleWhileRevalidate: 30,
        enableETag: false, enableGzip: false, enableBrotli: false,
        varyHeaders: [], cacheableStatusCodes: [200], priority: 0, enabled: true,
        createdAt: '', updatedAt: '',
      }
      assert.ok(rule.methods.includes(m))
    }
  })
})

// ── EdgeNode type contract ────────────────────────────────────────
describe('cdn.entity: EdgeNode', () => {
  it('creates valid online edge node', () => {
    const node: EdgeNode = {
      id: 'edge-cn-shanghai-01',
      name: 'edge-cn-shanghai-01',
      region: 'cn-shanghai',
      endpoint: 'https://edge.shanghai.test.com',
      status: 'online',
      capacityBytes: 10_737_418_240, // 10 GB
      usedBytes: 3_221_225_472,
      hitRate: 0.87,
      avgLatencyMs: 12,
      lastHeartbeatAt: '2026-06-29T00:00:00.000Z',
    }

    assert.equal(node.status, 'online')
    assert.equal(node.region, 'cn-shanghai')
    assert.ok(node.hitRate >= 0 && node.hitRate <= 1)
    assert.ok(node.usedBytes <= node.capacityBytes)
  })

  it('supports all node statuses', () => {
    const statuses: EdgeNode['status'][] = ['online', 'offline', 'degraded']
    for (const s of statuses) {
      const node: EdgeNode = {
        id: 'e1', name: 'n1', region: 'cn-test',
        endpoint: 'https://x.com', status: s,
        capacityBytes: 1000, usedBytes: 0, hitRate: 0, avgLatencyMs: 0,
        lastHeartbeatAt: '',
      }
      assert.equal(node.status, s)
    }
  })
})

// ── CdnCacheEntry type contract ───────────────────────────────────
describe('cdn.entity: CdnCacheEntry', () => {
  it('creates valid cache entry', () => {
    const entry: CdnCacheEntry = {
      key: '/api/images/logo.png?v=1',
      ruleId: 'cdn-rule-001',
      edgeNodeId: 'edge-cn-shanghai-01',
      url: '/api/images/logo.png?v=1',
      statusCode: 200,
      sizeBytes: 45_000,
      cachedAt: '2026-06-29T00:00:00.000Z',
      expiresAt: '2026-06-29T02:00:00.000Z',
      hitCount: 42,
      etag: 'W/"abc123def456"',
    }

    assert.equal(entry.statusCode, 200)
    assert.equal(entry.hitCount, 42)
    assert.equal(entry.etag, 'W/"abc123def456"')
  })

  it('cache entry without etag', () => {
    const entry: CdnCacheEntry = {
      key: '/api/data',
      ruleId: 'r1', edgeNodeId: 'e1',
      url: '/api/data', statusCode: 404,
      sizeBytes: 100, cachedAt: '', expiresAt: '',
      hitCount: 0,
    }

    assert.equal(entry.etag, undefined)
    assert.equal(entry.hitCount, 0)
  })
})

// ── CacheInvalidation type contract ───────────────────────────────
describe('cdn.entity: CacheInvalidation', () => {
  it('creates pending invalidation', () => {
    const inv: CacheInvalidation = {
      id: 'cdn-inv-abc123',
      mode: 'url',
      target: '/api/images/logo.png',
      edgeNodeIds: ['edge-cn-shanghai-01', 'edge-cn-beijing-01'],
      status: 'pending',
      affectedEntries: 0,
      triggeredAt: '2026-06-29T00:00:00.000Z',
      triggeredBy: 'admin',
    }

    assert.equal(inv.mode, 'url')
    assert.equal(inv.status, 'pending')
    assert.equal(inv.triggeredBy, 'admin')
    assert.equal(inv.completedAt, undefined)
  })

  it('completed invalidation', () => {
    const inv: CacheInvalidation = {
      id: 'cdn-inv-def456',
      mode: 'pattern',
      target: '/api/images/*',
      edgeNodeIds: ['edge-1'],
      status: 'completed',
      affectedEntries: 15,
      triggeredAt: '2026-06-29T00:00:00.000Z',
      completedAt: '2026-06-29T00:00:05.000Z',
      triggeredBy: 'system',
    }

    assert.equal(inv.status, 'completed')
    assert.equal(inv.affectedEntries, 15)
    assert.ok(inv.completedAt!.length > 0)
  })

  it('supports all invalidation modes and statuses', () => {
    const modes: CacheInvalidation['mode'][] = ['url', 'pattern']
    const statuses: CacheInvalidation['status'][] = ['pending', 'in_progress', 'completed', 'failed']
    for (const m of modes) {
      for (const s of statuses) {
        const inv: CacheInvalidation = {
          id: 'i1', mode: m, target: '/t', edgeNodeIds: ['e1'],
          status: s, affectedEntries: 0, triggeredAt: '', triggeredBy: '',
        }
        assert.equal(inv.mode, m)
        assert.equal(inv.status, s)
      }
    }
  })
})

// ── generateRuleId ────────────────────────────────────────────────
describe('cdn.entity: generateRuleId', () => {
  it('generates id starting with "cdn-rule-"', () => {
    assert.ok(generateRuleId().startsWith('cdn-rule-'))
  })

  it('generates unique ids', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateRuleId()))
    assert.equal(ids.size, 100)
  })
})

// ── generateNodeId ────────────────────────────────────────────────
describe('cdn.entity: generateNodeId', () => {
  it('generates id starting with "edge-"', () => {
    assert.ok(generateNodeId().startsWith('edge-'))
  })

  it('generates unique ids', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateNodeId()))
    assert.equal(ids.size, 100)
  })
})

// ── generateInvalidationId ────────────────────────────────────────
describe('cdn.entity: generateInvalidationId', () => {
  it('generates id starting with "cdn-inv-"', () => {
    assert.ok(generateInvalidationId().startsWith('cdn-inv-'))
  })

  it('generates unique ids', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateInvalidationId()))
    assert.equal(ids.size, 100)
  })
})

// ── compilePattern ────────────────────────────────────────────────
describe('cdn.entity: compilePattern', () => {
  it('compiles simple pattern with no params', () => {
    const { regex, paramNames } = compilePattern('/api/health')
    assert.equal(paramNames.length, 0)
    assert.ok(regex.test('/api/health'))
    assert.ok(!regex.test('/api/health/extra'))
  })

  it('compiles pattern with wildcard', () => {
    const { regex } = compilePattern('/api/images/*')
    assert.ok(regex.test('/api/images/logo.png'))
    assert.ok(regex.test('/api/images/a/b/c'))
    assert.ok(!regex.test('/other'))
  })

  it('compiles pattern with named params', () => {
    const { regex, paramNames } = compilePattern('/api/reports/:id')
    assert.deepEqual(paramNames, ['id'])
    assert.ok(regex.test('/api/reports/rpt-001'))
    assert.ok(!regex.test('/api/reports/rpt-001/extra'))
  })

  it('compiles pattern with multiple params', () => {
    const { regex, paramNames } = compilePattern('/:org/:repo/blob/:branch/*')
    assert.deepEqual(paramNames, ['org', 'repo', 'branch'])
    assert.ok(regex.test('/acme/cdn/blob/main/README.md'))
  })

  it('compiles pattern special regex chars are escaped', () => {
    const { regex } = compilePattern('/api/v1.0/users')
    assert.ok(regex.test('/api/v1.0/users'))
    assert.ok(!regex.test('/api/v1X0/users'))
  })
})

// ── matchUrl ──────────────────────────────────────────────────────
describe('cdn.entity: matchUrl', () => {
  it('exact match returns true', () => {
    const result = matchUrl('/api/health', '/api/health')
    assert.equal(result.match, true)
    assert.deepEqual(result.params, {})
  })

  it('wildcard match', () => {
    const result = matchUrl('/api/images/*', '/api/images/logo.png')
    assert.equal(result.match, true)
    assert.deepEqual(result.params, {})
  })

  it('named param extraction', () => {
    const result = matchUrl('/api/reports/:id', '/api/reports/rpt-001')
    assert.equal(result.match, true)
    assert.equal(result.params.id, 'rpt-001')
  })

  it('multiple param extraction', () => {
    const result = matchUrl('/:org/:repo/blob/:branch', '/acme/cdn/blob/main')
    assert.equal(result.match, true)
    assert.equal(result.params.org, 'acme')
    assert.equal(result.params.repo, 'cdn')
    assert.equal(result.params.branch, 'main')
  })

  it('no match returns false', () => {
    const result = matchUrl('/api/images/*', '/api/docs/readme')
    assert.equal(result.match, false)
    assert.deepEqual(result.params, {})
  })

  it('handles URL-encoded params', () => {
    const result = matchUrl('/search/:query', '/search/hello%20world')
    assert.equal(result.match, true)
    assert.equal(result.params.query, 'hello world')
  })
})

// ── buildCacheControlHeader ───────────────────────────────────────
describe('cdn.entity: buildCacheControlHeader', () => {
  const baseRule: CdnCacheRule = {
    id: 'r1', tenantId: 't1', name: 'test', urlPattern: '/api/*',
    methods: ['GET'], strategy: 'public', maxAge: 7200, staleWhileRevalidate: 3600,
    enableETag: false, enableGzip: false, enableBrotli: false,
    varyHeaders: [], cacheableStatusCodes: [200], priority: 0, enabled: true,
    createdAt: '', updatedAt: '',
  }

  it('public strategy with max-age and stale-while-revalidate', () => {
    const header = buildCacheControlHeader(baseRule)
    assert.ok(header.includes('max-age=7200'))
    assert.ok(header.includes('stale-while-revalidate=3600'))
  })

  it('private strategy', () => {
    const rule = { ...baseRule, strategy: 'private' as const }
    assert.equal(buildCacheControlHeader(rule), 'private, max-age=7200, stale-while-revalidate=3600')
  })

  it('no-store strategy (no max-age)', () => {
    const rule = { ...baseRule, strategy: 'no-store' as const }
    assert.equal(buildCacheControlHeader(rule), 'no-store')
  })

  it('no-cache strategy', () => {
    const rule = { ...baseRule, strategy: 'no-cache' as const, maxAge: 0 }
    assert.equal(buildCacheControlHeader(rule), 'no-cache, max-age=0, stale-while-revalidate=3600')
  })

  it('immutable strategy with public', () => {
    const rule = { ...baseRule, strategy: 'immutable' as const, staleWhileRevalidate: 0 }
    const header = buildCacheControlHeader(rule)
    assert.equal(header, 'public, immutable, max-age=7200')
  })

  it('no stale-while-revalidate when zero', () => {
    const rule = { ...baseRule, staleWhileRevalidate: 0 }
    const header = buildCacheControlHeader(rule)
    assert.ok(header.includes('max-age=7200'))
    assert.ok(!header.includes('stale-while-revalidate'))
  })
})

// ── generateETag ──────────────────────────────────────────────────
describe('cdn.entity: generateETag', () => {
  it('generates weak etag with correct prefix', () => {
    const etag = generateETag('hello world')
    assert.ok(etag.startsWith('W/"'))
    assert.ok(etag.endsWith('"'))
    assert.ok(etag.length >= 24) // W/" + base64.slice(0,22) + " = 26
  })

  it('same content produces different etag with different timestamps', () => {
    const etag1 = generateETag('hello', '2026-01-01T00:00:00.000Z')
    const etag2 = generateETag('hello', '2026-06-01T00:00:00.000Z')
    assert.notEqual(etag1, etag2)
  })

  it('same content and timestamp produces same etag', () => {
    const ts = '2026-06-29T00:00:00.000Z'
    const etag1 = generateETag('hello', ts)
    const etag2 = generateETag('hello', ts)
    assert.equal(etag1, etag2)
  })

  it('handles Buffer input', () => {
    const etag = generateETag(Buffer.from('binary data'))
    assert.ok(etag.startsWith('W/"'))
  })
})

// ── buildCacheKey ─────────────────────────────────────────────────
describe('cdn.entity: buildCacheKey', () => {
  it('no vary headers returns URL', () => {
    assert.equal(buildCacheKey('/api/data', {}), '/api/data')
  })

  it('with vary headers sorted alphabetically', () => {
    const key = buildCacheKey('/api/data', { 'Accept-Encoding': 'gzip', 'User-Agent': 'Mozilla' })
    assert.equal(key, '/api/data?Accept-Encoding=gzip&User-Agent=Mozilla')
  })

  it('single vary header', () => {
    const key = buildCacheKey('/api/data', { 'Accept-Language': 'en' })
    assert.equal(key, '/api/data?Accept-Language=en')
  })

  it('vary headers are URL-param formatted', () => {
    const key = buildCacheKey('/api/data', { Authorization: 'Bearer token' })
    assert.equal(key, '/api/data?Authorization=Bearer token')
  })
})

// ── computeHitRate ────────────────────────────────────────────────
describe('cdn.entity: computeHitRate', () => {
  it('100% hit rate', () => {
    assert.equal(computeHitRate(100, 0), 1)
  })

  it('50% hit rate', () => {
    assert.equal(computeHitRate(50, 50), 0.5)
  })

  it('0% hit rate', () => {
    assert.equal(computeHitRate(0, 100), 0)
  })

  it('no data returns 0', () => {
    assert.equal(computeHitRate(0, 0), 0)
  })
})

// ── contentFingerprint ────────────────────────────────────────────
describe('cdn.entity: contentFingerprint', () => {
  it('returns 12-char hex string', () => {
    const fp = contentFingerprint('hello world')
    assert.equal(fp.length, 12)
    assert.ok(/^[0-9a-f]+$/.test(fp))
  })

  it('same content produces same fingerprint', () => {
    assert.equal(contentFingerprint('data'), contentFingerprint('data'))
  })

  it('different content produces different fingerprints', () => {
    assert.notEqual(contentFingerprint('hello'), contentFingerprint('world'))
  })

  it('handles empty content', () => {
    const fp = contentFingerprint('')
    assert.equal(fp.length, 12)
  })
})
