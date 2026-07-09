import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
/**
 * 🐜 自动: [cdn-cache] [C] 合约测试
 *
 * 验证 cdn-cache 模块的实体 Shape、业务逻辑契约
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import {
  CdnCacheRule,
  EdgeNode,
  CdnCacheEntry,
  CacheInvalidation,
  CacheStrategy,
  CacheableMethod,
  generateRuleId,
  generateNodeId,
  generateInvalidationId,
  compilePattern,
  matchUrl,
  buildCacheControlHeader,
  generateETag,
  buildCacheKey,
  computeHitRate,
  contentFingerprint,
} from './cdn.entity'

// ─── 合约: 实体 Shape ─────────────────────────────────

describe('[cdn-cache] 合约: CdnCacheRule 实体', () => {
  it('应有完整的 CdnCacheRule 接口字段', () => {
    const rule: CdnCacheRule = {
      id: 'cdn-rule-test-001',
      tenantId: 't-001',
      name: '静态资源缓存',
      urlPattern: '/static/*',
      methods: ['GET', 'HEAD'],
      strategy: 'public',
      maxAge: 3600,
      staleWhileRevalidate: 86400,
      enableETag: true,
      enableGzip: true,
      enableBrotli: false,
      varyHeaders: ['Accept-Encoding'],
      cacheableStatusCodes: [200, 301, 404],
      priority: 10,
      enabled: true,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    }
    assert.equal(rule.id, 'cdn-rule-test-001')
    assert.equal(rule.tenantId, 't-001')
    assert.equal(rule.name, '静态资源缓存')
    assert.equal(rule.urlPattern, '/static/*')
    assert.deepEqual(rule.methods, ['GET', 'HEAD'])
    assert.equal(rule.strategy, 'public')
    assert.equal(rule.maxAge, 3600)
    assert.equal(rule.staleWhileRevalidate, 86400)
    assert.equal(rule.enableETag, true)
    assert.equal(rule.enableGzip, true)
    assert.equal(rule.enableBrotli, false)
    assert.deepEqual(rule.varyHeaders, ['Accept-Encoding'])
    assert.deepEqual(rule.cacheableStatusCodes, [200, 301, 404])
    assert.equal(rule.priority, 10)
    assert.equal(rule.enabled, true)
  })

  it('CacheStrategy 应为联合类型之一', () => {
    const strategies: CacheStrategy[] = ['public', 'private', 'no-store', 'no-cache', 'immutable']
    assert.equal(strategies.length, 5)
  })

  it('CacheableMethod 应为 GET 或 HEAD', () => {
    const methods: CacheableMethod[] = ['GET', 'HEAD']
    assert.equal(methods.length, 2)
  })
})

describe('[cdn-cache] 合约: EdgeNode 实体', () => {
  it('应有完整的 EdgeNode 接口字段', () => {
    const node: EdgeNode = {
      id: 'edge-test-01',
      name: 'edge-shanghai-01',
      region: 'cn-shanghai',
      endpoint: 'https://edge.sh.test.com',
      status: 'online',
      capacityBytes: 10_737_418_240,
      usedBytes: 5_368_709_120,
      hitRate: 0.85,
      avgLatencyMs: 12.5,
      lastHeartbeatAt: '2026-06-30T00:00:00Z',
    }
    assert.equal(node.id, 'edge-test-01')
    assert.equal(node.status, 'online')
    assert.equal(node.region, 'cn-shanghai')
    assert.equal(node.hitRate, 0.85)
  })

  it('status 应为 online | offline | degraded', () => {
    const statuses: Array<EdgeNode['status']> = ['online', 'offline', 'degraded']
    assert.equal(statuses.length, 3)
  })
})

describe('[cdn-cache] 合约: CdnCacheEntry 实体', () => {
  it('应有完整的 CdnCacheEntry 接口字段', () => {
    const entry: CdnCacheEntry = {
      key: '/static/js/app.js',
      ruleId: 'rule-001',
      edgeNodeId: 'edge-01',
      url: '/static/js/app.js',
      statusCode: 200,
      sizeBytes: 102400,
      cachedAt: 1756900000000,
      expiresAt: '2026-06-30T01:00:00Z',
      hitCount: 42,
      ttl: 3600,
      nodeName: 'edge-01',
      etag: 'W/"abc123"',
    }
    assert.equal(entry.key, '/static/js/app.js')
    assert.equal(entry.statusCode, 200)
    assert.equal(entry.hitCount, 42)
  })
})

describe('[cdn-cache] 合约: CacheInvalidation 实体', () => {
  it('应有完整的 CacheInvalidation 接口字段', () => {
    const inv: CacheInvalidation = {
      id: 'cdn-inv-test-001',
      mode: 'url',
      target: '/static/js/app.js',
      edgeNodeIds: ['edge-01', 'edge-02'],
      status: 'completed',
      affectedEntries: 5,
      pattern: '/static/js/app.js',
      reason: 'test',
      createdAt: '2026-06-30T00:00:00Z',
      triggeredAt: '2026-06-30T00:00:00Z',
      completedAt: '2026-06-30T00:00:01Z',
      triggeredBy: 'admin',
    }
    assert.equal(inv.id, 'cdn-inv-test-001')
    assert.equal(inv.mode, 'url')
    assert.equal(inv.status, 'completed')
    assert.equal(inv.affectedEntries, 5)
  })

  it('mode 应为 url | pattern', () => {
    const modes: Array<CacheInvalidation['mode']> = ['url', 'pattern']
    assert.equal(modes.length, 2)
  })

  it('status 应为 pending | in_progress | completed | failed', () => {
    const statuses: Array<CacheInvalidation['status']> = ['pending', 'in_progress', 'completed', 'failed']
    assert.equal(statuses.length, 4)
  })
})

// ─── 合约: 工具函数 ────────────────────────────────────

describe('[cdn-cache] 合约: ID 生成函数', () => {
  it('generateRuleId 返回格式 cdn-rule-xxx-xxx', () => {
    const id = generateRuleId()
    assert.ok(id.startsWith('cdn-rule-'))
    assert.ok(id.length > 20)
  })

  it('generateNodeId 返回格式 edge-xxx', () => {
    const id = generateNodeId()
    assert.ok(id.startsWith('edge-'))
  })

  it('generateInvalidationId 返回格式 cdn-inv-xxx', () => {
    const id = generateInvalidationId()
    assert.ok(id.startsWith('cdn-inv-'))
  })

  it('每次调用生成不同 ID', () => {
    const ids = new Set(Array.from({ length: 10 }, () => generateRuleId()))
    assert.equal(ids.size, 10)
  })
})

describe('[cdn-cache] 合约: compilePattern', () => {
  it('精确匹配静态路径', () => {
    const { regex } = compilePattern('/api/health')
    assert.ok(regex.test('/api/health'))
    assert.ok(!regex.test('/api/health/extra'))
    assert.ok(!regex.test('/api/not-health'))
  })

  it('通配符 * 匹配任意路径', () => {
    const { regex } = compilePattern('/static/*')
    assert.ok(regex.test('/static/js/app.js'))
    assert.ok(regex.test('/static/css/style.css'))
    assert.ok(!regex.test('/other/resource'))
  })

  it(':param 占位符匹配并提取参数', () => {
    const { regex, paramNames } = compilePattern('/api/reports/:id/stats')
    assert.deepEqual(paramNames, ['id'])
    assert.ok(regex.test('/api/reports/123/stats'))
    assert.ok(!regex.test('/api/reports/123/other'))
  })
})

describe('[cdn-cache] 合约: matchUrl', () => {
  it('匹配静态路径', () => {
    const result = matchUrl('/api/health', '/api/health')
    assert.equal(result.match, true)
    assert.deepEqual(result.params, {})
  })

  it('不匹配不同路径', () => {
    const result = matchUrl('/api/health', '/api/other')
    assert.equal(result.match, false)
  })

  it('通配符匹配', () => {
    const result = matchUrl('/static/*', '/static/images/logo.png')
    assert.equal(result.match, true)
  })

  it('参数提取', () => {
    const result = matchUrl('/api/users/:userId/profile', '/api/users/u-123/profile')
    assert.equal(result.match, true)
    assert.equal(result.params.userId, 'u-123')
  })

  it('多个参数提取', () => {
    const result = matchUrl('/:tenant/:module/:resource', '/t-001/reports/summary')
    assert.equal(result.match, true)
    assert.equal(result.params.tenant, 't-001')
    assert.equal(result.params.module, 'reports')
    assert.equal(result.params.resource, 'summary')
  })
})

describe('[cdn-cache] 合约: buildCacheControlHeader', () => {
  const baseRule: Omit<CdnCacheRule, 'id' | 'tenantId' | 'name' | 'urlPattern' | 'methods' | 'createdAt' | 'updatedAt' | 'cacheableStatusCodes' | 'varyHeaders' | 'priority' | 'enabled' | 'enableETag' | 'enableGzip' | 'enableBrotli'> = {
    strategy: 'public',
    maxAge: 3600,
    staleWhileRevalidate: 86400,
  }

  function makeRule(overrides: Partial<CdnCacheRule> = {}): CdnCacheRule {
    return {
      id: 'rule-test',
      tenantId: 't-001',
      name: 'test',
      urlPattern: '/test/*',
      methods: ['GET', 'HEAD'],
      strategy: 'public',
      maxAge: 3600,
      staleWhileRevalidate: 86400,
      enableETag: true,
      enableGzip: true,
      enableBrotli: false,
      varyHeaders: ['Accept-Encoding'],
      cacheableStatusCodes: [200, 301, 404],
      priority: 0,
      enabled: true,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
      ...overrides,
    }
  }

  it('public 策略', () => {
    const header = buildCacheControlHeader(makeRule())
    assert.ok(header.startsWith('public'))
    assert.ok(header.includes('max-age=3600'))
    assert.ok(header.includes('stale-while-revalidate=86400'))
  })

  it('private 策略', () => {
    const header = buildCacheControlHeader(makeRule({ strategy: 'private' }))
    assert.ok(header.startsWith('private'))
  })

  it('no-store 策略不含 max-age', () => {
    const header = buildCacheControlHeader(makeRule({ strategy: 'no-store' }))
    assert.equal(header, 'no-store')
  })

  it('immutable 策略', () => {
    const header = buildCacheControlHeader(makeRule({ strategy: 'immutable' }))
    assert.ok(header.includes('public'))
    assert.ok(header.includes('immutable'))
    assert.ok(header.includes('max-age=3600'))
  })

  it('no-cache 策略', () => {
    const header = buildCacheControlHeader(makeRule({ strategy: 'no-cache' }))
    assert.ok(header.startsWith('no-cache'))
    assert.ok(header.includes('max-age=3600'))
  })

  it('staleWhileRevalidate=0 时不追加', () => {
    const header = buildCacheControlHeader(makeRule({ staleWhileRevalidate: 0 }))
    assert.ok(header.includes('max-age=3600'))
    assert.ok(!header.includes('stale-while-revalidate'))
  })
})

describe('[cdn-cache] 合约: generateETag', () => {
  it('为相同内容生成相同 ETag', () => {
    const etag1 = generateETag('hello world', '2026-01-01T00:00:00Z')
    const etag2 = generateETag('hello world', '2026-01-01T00:00:00Z')
    assert.equal(etag1, etag2)
    assert.ok(etag1.startsWith('W/"'))
    assert.ok(etag1.endsWith('"'))
  })

  it('为不同内容生成不同 ETag', () => {
    const etag1 = generateETag('hello', '2026-01-01T00:00:00Z')
    const etag2 = generateETag('world', '2026-01-01T00:00:00Z')
    assert.notEqual(etag1, etag2)
  })

  it('相同内容不同时间生成不同 ETag', () => {
    const etag1 = generateETag('hello', '2026-01-01T00:00:00Z')
    const etag2 = generateETag('hello', '2026-06-30T00:00:00Z')
    assert.notEqual(etag1, etag2)
  })
})

describe('[cdn-cache] 合约: buildCacheKey', () => {
  it('无 Vary headers 时仅返回 URL', () => {
    const key = buildCacheKey('/static/app.js', {})
    assert.equal(key, '/static/app.js')
  })

  it('单个 Vary header', () => {
    const key = buildCacheKey('/static/app.js', { 'Accept-Encoding': 'gzip' })
    assert.equal(key, '/static/app.js?Accept-Encoding=gzip')
  })

  it('多个 Vary headers 按 key 排序', () => {
    const key = buildCacheKey('/static/app.js', {
      'Accept-Language': 'zh-CN',
      'Accept-Encoding': 'br',
    })
    assert.equal(key, '/static/app.js?Accept-Encoding=br&Accept-Language=zh-CN')
  })
})

describe('[cdn-cache] 合约: computeHitRate', () => {
  it('完全命中', () => {
    assert.equal(computeHitRate(100, 0), 1)
  })

  it('完全未命中', () => {
    assert.equal(computeHitRate(0, 100), 0)
  })

  it('50% 命中率', () => {
    assert.equal(computeHitRate(50, 50), 0.5)
  })

  it('总数为 0 时返回 0', () => {
    assert.equal(computeHitRate(0, 0), 0)
  })
})

describe('[cdn-cache] 合约: contentFingerprint', () => {
  it('为相同内容生成相同指纹', () => {
    const fp1 = contentFingerprint('hello')
    const fp2 = contentFingerprint('hello')
    assert.equal(fp1, fp2)
    assert.equal(fp1.length, 12)
  })

  it('为不同内容生成不同指纹', () => {
    assert.notEqual(contentFingerprint('hello'), contentFingerprint('world'))
  })

  it('支持 Buffer 输入', () => {
    const fp = contentFingerprint(Buffer.from('hello'))
    assert.equal(fp.length, 12)
  })
})
