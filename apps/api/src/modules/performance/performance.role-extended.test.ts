import { describe, it, expect, beforeEach } from 'vitest'
import { CacheTierService } from './cache-tier.service'
import { K8sScaleService } from './k8s-scale.service'
import { DBOptimizeService } from './db-optimize.service'
import { K6RunnerService } from './k6-runner.service'
import type { LoadTestConfig } from './k6-runner.service'

/**
 * 🐜 [performance] 角色扩展测试
 */

function setup() {
  return {
    cache: new CacheTierService(),
    k8s: new K8sScaleService(),
    db: new DBOptimizeService(),
    k6: new K6RunnerService(),
  }
}

// Need to configure cache before use
function setupCache() {
  const cache = new CacheTierService()
  cache.configure({
    l1: { maxBytes: 1024 * 1024, evictionPolicy: 'lru', ttlMs: 60000 },
    l2: { maxBytes: 1024 * 1024 * 10, evictionPolicy: 'lru', ttlMs: 300000 },
    l3: { maxBytes: 1024 * 1024 * 100, evictionPolicy: 'lru', ttlMs: 3600000 },
    readThrough: true,
    writeThrough: false,
    prefetchEnabled: false,
  })
  return cache
}

describe('👔店长 performance 扩展测试', () => {
  it('缓存统计信息完整性', () => {
    const cache = setupCache()
    // 模拟命中与未命中
    cache.set('key1', 'value1')
    cache.set('key2', 'value2')
    cache.get('key1')
    cache.get('key2')
    cache.get('nonexistent')
    const stats = cache.getGlobalStats()
    expect(stats.totalHits).toBeGreaterThanOrEqual(2)
    expect(stats.overallHitRate).toBeGreaterThanOrEqual(0)
    expect(stats.overallHitRate).toBeLessThanOrEqual(1)
  })

  it('各层级单独统计', () => {
    const cache = setupCache()
    cache.set('k', 'v')
    cache.get('k')
    const tierStats = cache.getStats()
    expect(tierStats).toHaveLength(3)
    for (const ts of tierStats) {
      expect(ts.hitRate).toBeGreaterThanOrEqual(0)
      expect(ts.hitRate).toBeLessThanOrEqual(1)
    }
  })
})

describe('🎯运行专员 performance 扩展测试', () => {
  it('设置并获取缓存', () => {
    const cache = setupCache()
    cache.set('k', 'v')
    expect(cache.get('k')).toBe('v')
  })

  it('过期缓存返回 null', async () => {
    const cache = setupCache()
    cache.set('k2', 'v2', { ttlMs: 0 })
    await new Promise(r => setTimeout(r, 5))
    expect(cache.get('k2')).toBeNull()
  })

  it('K8s 副本数建议', () => {
    const k8s = new K8sScaleService()
    k8s.scale('service-a', 3)
    // recommendReplicas returns based on metrics history
    const rec = k8s.recommendReplicas('service-a')
    expect(rec).toBeGreaterThanOrEqual(1)
  })
})

describe('📢营销 performance 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('DB 查询优化建议', () => {
    const advice = svc.db.analyzeQuery('SELECT * FROM orders WHERE id = ?')
    expect(advice).toBeDefined()
  })

  it('K6 压测运行', async () => {
    const config: LoadTestConfig = {
      name: 'marketing-test',
      vu: 10,
      duration: 5,
      pattern: 'constant',
    }
    const result = await svc.k6.runLoadTest(config, [
      { url: '/api/promotion', method: 'GET', weight: 1 },
    ])
    expect(result).toBeDefined()
    expect(result.metrics).toBeDefined()
  })
})
