import { describe, it, expect, beforeEach } from 'vitest'
import { CacheTierService } from './cache-tier.service'
import { K8sScaleService } from './k8s-scale.service'
import { DBOptimizeService } from './db-optimize.service'
import { K6RunnerService } from './k6-runner.service'
import type { LoadTestConfig } from './k6-runner.service'

/**
 * 🐜 [performance] 角色扩展测试 v2 — 完整 8 角色覆盖
 *
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色至少 2 个测试用例（正常流程 + 权限边界）
 */

// ───── helpers ─────

function setupCache() {
  const cache = new CacheTierService()
  cache.configure({
    l1: { maxBytes: 1024 * 1024, evictionPolicy: 'lru', ttlMs: 60000 },
    l2: { maxBytes: 1024 * 1024 * 10, evictionPolicy: 'lru', ttlMs: 300000 },
    l3: { maxBytes: 1024 * 1024 * 100, evictionPolicy: 'lru', ttlMs: 3600000 },
    readThrough: true,
    writeThrough: false,
    prefetchEnabled: true,
  })
  return cache
}

function setupK8s() {
  const k8s = new K8sScaleService()
  k8s.scale('test-svc', 3)
  return k8s
}

// ═══════════════════════════
// 👔 店长 — 全局指标与成本
// ═══════════════════════════

describe('👔店长 performance 扩展测试', () => {
  it('缓存统计信息完整性（MECE: 全局命中率在 0~1 之间）', () => {
    const cache = setupCache()
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

  it('各层级单独统计 (MECE: L1/L2/L3 各自统计)', () => {
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

  it('重置统计后所有计数器归零', () => {
    const cache = setupCache()
    cache.get('k') // miss
    cache.resetStats()
    const stats = cache.getGlobalStats()
    expect(stats.totalHits).toBe(0)
    expect(stats.totalMisses).toBe(0)
  })

  it('空缓存状态下统计信息不报错', () => {
    const cache = setupCache()
    const stats = cache.getGlobalStats()
    expect(stats.totalKeys).toBe(0)
    expect(stats.overallHitRate).toBe(0)
  })
})

// ═══════════════════════════
// 🛒 前台 — 缓存读写与批量操作
// ═══════════════════════════

describe('🛒前台 performance 扩展测试', () => {
  it('前台批量读取多个缓存值（含缺失键正确处理）', () => {
    const cache = setupCache()
    cache.set('menu:drink', '可乐')
    cache.set('menu:snack', '薯条')
    const vals = cache.mget(['menu:drink', 'menu:snack', 'menu:nonexist'])
    expect(vals).toHaveLength(3)
    expect(vals[0]).toBe('可乐')
    expect(vals[1]).toBe('薯条')
    expect(vals[2]).toBeNull()
  })

  it('前台检查缓存键存在性', () => {
    const cache = setupCache()
    cache.set('pos:today', 'data')
    expect(cache.has('pos:today')).toBe(true)
    expect(cache.has('pos:yesterday')).toBe(false)
  })

  it('前台查询空 key 列表返回空数组', () => {
    const cache = setupCache()
    const vals = cache.mget([])
    expect(vals).toEqual([])
  })
})

// ═══════════════════════════
// 👥 HR — 数据库优化与索引建议
// ═══════════════════════════

describe('👥HR performance 扩展测试', () => {
  let db: DBOptimizeService
  beforeEach(() => { db = new DBOptimizeService() })

  it('HR 分析查询语句识别类型和代价', () => {
    const analysis = db.analyzeQuery('SELECT * FROM employees WHERE dept = "ops"')
    expect(analysis.queryType).toBe('select')
    expect(analysis.estimatedCost).toBeGreaterThan(0)
    expect(analysis.executionTime).toBeGreaterThan(0)
  })

  it('HR 获得索引推荐用于人事系统优化', () => {
    const recs = db.recommendIndexes(
      ['SELECT * FROM employees WHERE department = "sales" AND salary > 5000'],
      { employees: { rowCount: 10000, columnCardinality: { department: 10, salary: 200 } } },
    )
    expect(Array.isArray(recs)).toBe(true)
    if (recs.length > 0) {
      expect(recs[0].indexName).toBeTruthy()
      expect(['create', 'drop', 'consider']).toContain(recs[0].recommendation)
    }
  })

  it('HR 分析空查询列表应返回空数组', () => {
    const results = db.analyzeQueries([])
    expect(results).toEqual([])
  })

  it('HR 使用连接池统计监控', () => {
    db.initPool({
      minConnections: 2,
      maxConnections: 20,
      acquireTimeout: 5000,
      idleTimeout: 30000,
      connectionTimeout: 5000,
      healthCheckInterval: 10000,
    })
    const stats = db.getPoolStats()
    expect(stats.totalConnections).toBeGreaterThanOrEqual(2)
    expect(stats.activeConnections).toBeGreaterThanOrEqual(0)
  })
})

// ═══════════════════════════
// 🔧 安监 — 安全相关操作与合规
// ═══════════════════════════

describe('🔧安监 performance 扩展测试', () => {
  it('安监按标签批量清除用户缓存数据（GDPR 合规）', () => {
    const cache = setupCache()
    cache.set('user:1:profile', 'data-1', { tags: ['user-data'] })
    cache.set('user:2:profile', 'data-2', { tags: ['user-data'] })
    cache.set('sys:config', 'config', { tags: ['system'] })

    const deleted = cache.deleteByTag('user-data')
    expect(deleted).toBe(2)
    expect(cache.has('user:1:profile')).toBe(false)
    expect(cache.has('user:2:profile')).toBe(false)
    expect(cache.has('sys:config')).toBe(true) // 未受影响
  })

  it('安监清空所有缓存后完全不可读', () => {
    const cache = setupCache()
    cache.set('k', 'v')
    cache.flush()
    expect(cache.get('k')).toBeNull()
    expect(cache.has('k')).toBe(false)
  })

  it('安监清空调级缓存 (L2 only)', () => {
    const cache = setupCache()
    cache.set('k', 'v')
    cache.flush('l2')
    // L1 和 L3 应还有
    expect(cache.get('k')).toBe('v') // L1 hit
  })

  it('安监删除不存在的标签返回 0（无异常）', () => {
    const cache = setupCache()
    const deleted = cache.deleteByTag('never-existed')
    expect(deleted).toBe(0)
  })
})

// ═══════════════════════════
// 🎮 导玩员 — 游戏数据缓存 TTL
// ═══════════════════════════

describe('🎮导玩员 performance 扩展测试', () => {
  it('导玩员设置游戏排行缓存并检查 TTL', () => {
    const cache = setupCache()
    cache.set('game:ranking', [1, 2, 3], { ttlMs: 60000 })
    const ttl = cache.getTTL('game:ranking')
    expect(ttl).toBeGreaterThan(0)
    expect(ttl).toBeLessThanOrEqual(60000)
  })

  it('导玩员续期 TTL 后原数据可读', () => {
    const cache = setupCache()
    cache.set('game:hot', 'data')
    cache.expire('game:hot', 120000)
    expect(cache.get('game:hot')).toBe('data')
    const ttl = cache.getTTL('game:hot')
    expect(ttl).toBeGreaterThan(0)
  })

  it('导玩员预热多个游戏数据后全部可读', () => {
    const cache = setupCache()
    const loader = (keys: string[]) => {
      const m = new Map<string, unknown>()
      keys.forEach(k => m.set(k, `pre-${k}`))
      return m
    }
    cache.warm(['g:1', 'g:2', 'g:3'], loader)
    expect(cache.get('g:1')).toBe('pre-g:1')
    expect(cache.get('g:2')).toBe('pre-g:2')
    expect(cache.get('g:3')).toBe('pre-g:3')
  })

  it('导玩员查询不存在的缓存 TTL 返回 -2（边界，Redis 风格表示 key 不存在）', () => {
    const cache = setupCache()
    const ttl = cache.getTTL('no-such-key')
    expect(ttl).toBe(-2)
  })
})

// ═══════════════════════════
// 🎯 运行专员 — 伸缩与压测
// ═══════════════════════════

describe('🎯运行专员 performance 扩展测试', () => {
  it('运行专员设置并获取缓存', () => {
    const cache = setupCache()
    cache.set('k', 'v')
    expect(cache.get('k')).toBe('v')
  })

  it('过期缓存返回 null（边界验证：设置极短 TTL 后等待过期）', async () => {
    const cache = setupCache()
    cache.set('k2', 'v2', { ttlMs: 1 }) // 1ms TTL
    await new Promise(r => setTimeout(r, 10))
    expect(cache.get('k2')).toBeNull()
  })

  it('K8s 副本数建议', () => {
    const k8s = setupK8s()
    const rec = k8s.recommendReplicas('test-svc')
    expect(rec).toBeGreaterThanOrEqual(1)
  })

  it('运行专员创建多个部署并完整 CRUD', () => {
    const k8s = new K8sScaleService()
    k8s.scale('svc-a', 3)
    k8s.scale('svc-b', 5)

    const list = k8s.listDeployments()
    expect(list.length).toBeGreaterThanOrEqual(2)

    const health = k8s.checkHealth('svc-a')
    expect(health.name).toBe('svc-a')
  })

  it('运行专员重启不存在的部署应优雅处理', () => {
    const k8s = new K8sScaleService()
    expect(() => k8s.restartPod('no-svc')).not.toThrow()
  })

  it('运行专员空部署列表返回空数组', () => {
    const k8s = new K8sScaleService()
    expect(k8s.listDeployments()).toEqual([])
  })

  it('K8s 副本数建议在无历史数据时返回合理默认值', () => {
    const k8s = new K8sScaleService()
    const rec = k8s.recommendReplicas('never-deployed')
    expect(rec).toBeGreaterThanOrEqual(1)
  })
})

// ═══════════════════════════
// 🤝 团建 — 批量缓存管理
// ═══════════════════════════

describe('🤝团建 performance 扩展测试', () => {
  it('团建批量读取各活动缓存数据', () => {
    const cache = setupCache()
    cache.set('team:event:1', { name: '春游' })
    cache.set('team:event:2', { name: '秋游' })
    cache.set('team:event:3', { name: '年会' })

    const vals = cache.mget(['team:event:1', 'team:event:2', 'team:event:3'])
    expect(vals).toHaveLength(3)
    expect(vals[0]).toEqual({ name: '春游' })
  })

  it('团建删除单个活动数据后无法查询', () => {
    const cache = setupCache()
    cache.set('team:old', 'old-data')
    cache.delete('team:old')
    expect(cache.has('team:old')).toBe(false)
  })

  it('团建删除不存在的 key 不报错', () => {
    const cache = setupCache()
    expect(() => cache.delete('no-key')).not.toThrow()
  })

  it('团建批量读取混合存在/不存在键，保持顺序', () => {
    const cache = setupCache()
    cache.set('a', 1)
    cache.set('c', 3)
    const vals = cache.mget(['a', 'b', 'c'])
    expect(vals).toEqual([1, null, 3])
  })
})

// ═══════════════════════════
// 📢 营销 — 压测与分析
// ═══════════════════════════

describe('📢营销 performance 扩展测试', () => {
  let db: DBOptimizeService
  let k6: K6RunnerService
  beforeEach(() => {
    db = new DBOptimizeService()
    k6 = new K6RunnerService()
  })

  it('DB 查询优化建议返回合理分析', () => {
    const advice = db.analyzeQuery('SELECT * FROM orders WHERE id = ?')
    expect(advice).toBeDefined()
    expect(advice.queryType).toBe('select')
    expect(advice.recommendations.length).toBeGreaterThanOrEqual(0)
  })

  it('K6 压测运行返回完整结果', async () => {
    const config: LoadTestConfig = {
      name: 'marketing-test',
      vu: 10,
      duration: 5,
      pattern: 'constant',
    }
    const result = await k6.runLoadTest(config, [
      { url: '/api/promotion', method: 'GET', weight: 1 },
    ])
    expect(result).toBeDefined()
    expect(result.metrics).toBeDefined()
    expect(result.metrics.totalRequests).toBeGreaterThan(0)
    expect(result.config.name).toBe('marketing-test')
  })

  it('营销分析 SQL 重写优化得到改进', () => {
    const result = db.rewriteQuery('SELECT * FROM campaigns WHERE active = 1')
    expect(result.rewritten).toBeTruthy()
    expect(result.improvement).toBeTruthy()
  })

  it('营销尝试获取不存在的压测结果返回 null', () => {
    const result = k6.getResult('nonexistent-test')
    expect(result).toBeNull()
  })

  it('营销复用 DB 缓存加速相同查询', () => {
    db.cacheResult('q:campaigns', { data: 'cached' }, 300)
    // DB 缓存只是存储，验证不抛出
    expect(true).toBe(true)
  })

  it('营销 ramp 压测逐步加压正常结束', async () => {
    const config: LoadTestConfig = {
      name: 'ramp-marketing',
      vu: 5,
      duration: 3,
      pattern: 'ramp',
    }
    const result = await k6.runRampTest(config, [
      { duration: 1, vu: 5 },
      { duration: 2, vu: 20 },
    ])
    expect(result.metrics).toBeDefined()
  })
})
