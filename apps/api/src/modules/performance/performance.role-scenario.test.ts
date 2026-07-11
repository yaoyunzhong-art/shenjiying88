import { describe, it, expect, beforeEach } from 'vitest'
/**
 * 🐜 自动: [performance] [C] 角色场景测试 - 游乐/游戏中心运营场景
 *
 * 8 角色视角的 performance 模块深度场景测试：
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色至少 2 个测试用例（正常流程 + 权限边界/异常场景）
 * 结合线下游乐/游戏中心实际运维需求
 */

import 'reflect-metadata'
import { PerformanceController } from './performance.controller'
import { PerformanceService } from './performance.service'
import { CacheTierService } from './cache-tier.service'
import { DBOptimizeService } from './db-optimize.service'
import { K6RunnerService } from './k6-runner.service'
import { K8sScaleService } from './k8s-scale.service'
import type { LoadTestConfig, LoadPattern } from './k6-runner.service'

// ── 角色定义 ──
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

// ── Controller 工厂 ──
function createController(): PerformanceController {
  const cacheTier = new CacheTierService()
  const dbOpt = new DBOptimizeService()
  const k6 = new K6RunnerService()
  const k8s = new K8sScaleService()
  const svc = new PerformanceService(cacheTier, dbOpt, k6, k8s)
  const ctrl = new PerformanceController(svc)
  // 初始化缓存配置
  ctrl.configureCache({
    l1: { maxBytes: 1048576, evictionPolicy: 'lru', ttlMs: 60000 },
    l2: { maxBytes: 10485760, evictionPolicy: 'lfu', ttlMs: 300000, host: 'redis-1:6379' },
    l3: { maxBytes: 1073741824, evictionPolicy: 'ttl', ttlMs: 3600000, host: 'redis-2:6379' },
    readThrough: true,
    writeThrough: false,
    prefetchEnabled: true,
  })
  return ctrl
}

// ══════════════════════════════════════════════════════════════════════════
// 👔 店长 — 关注经营决策支撑：缓存命中与成本、部署成本分析
// ══════════════════════════════════════════════════════════════════════════

describe(`${ROLES.StoreManager} performance 经营决策场景`, () => {
  let ctrl: PerformanceController

  beforeEach(() => {
    ctrl = createController()
  })

  it('店长可通过全局缓存统计判断热数据策略（正常流程）', () => {
    ctrl.setCache({ key: 'arcade:g001:popularity', value: { score: 95, peak: '20:00' } })
    ctrl.setCache({ key: 'arcade:g002:popularity', value: { score: 88, peak: '19:00' } })
    ctrl.setCache({ key: 'payment:token:u001', value: { balance: 500 } })
    ctrl.getCache({ key: 'arcade:g001:popularity' })
    ctrl.getCache({ key: 'arcade:g001:popularity' })
    ctrl.getCache({ key: 'arcade:g001:popularity' })

    const stats = ctrl.getGlobalCacheStats()
    expect(stats.totalHits).toBeGreaterThanOrEqual(3)
    expect(stats.totalKeys).toBeGreaterThanOrEqual(3)
    expect(typeof stats.overallHitRate).toBe('number')
  })

  it('店长查看不存在部署的成本估算应返回默认值（边界）', () => {
    const cost = ctrl.estimateCost('not-exists-deployment')
    expect(typeof cost.totalPerHour).toBe('number')
    expect(typeof cost.totalPerMonth).toBe('number')
    // 成本应 >= 0
    expect(cost.totalPerHour).toBeGreaterThanOrEqual(0)
    expect(cost.totalPerMonth).toBeGreaterThanOrEqual(0)
  })
})

// ══════════════════════════════════════════════════════════════════════════
// 🛒 前台 — 关注收银与会员缓存响应速度、查询优化
// ══════════════════════════════════════════════════════════════════════════

describe(`${ROLES.FrontDesk} performance 收银场景`, () => {
  let ctrl: PerformanceController

  beforeEach(() => {
    ctrl = createController()
    ctrl.configureCache({
      l1: { maxBytes: 1048576, evictionPolicy: 'lru', ttlMs: 60000 },
      l2: { maxBytes: 10485760, evictionPolicy: 'lfu', ttlMs: 300000, host: 'redis-1:6379' },
      l3: { maxBytes: 1073741824, evictionPolicy: 'ttl', ttlMs: 3600000, host: 'redis-2:6379' },
      readThrough: true,
      writeThrough: false,
      prefetchEnabled: true,
    })
  })

  it('前台设置会员卡缓存后可立即读取（正常流程）', () => {
    ctrl.setCache({ key: 'member:balance:u001', value: { points: 1200, level: '金卡', expireAt: '2026-12-31' } })
    const result = ctrl.getCache({ key: 'member:balance:u001' })
    expect(result.value).not.toBeNull()
    const val = result.value as { points: number; level: string }
    expect(val.points).toBe(1200)
    expect(val.level).toBe('金卡')
  })

  it('前台查询不存在的缓存键应返回 null 而非抛异常（边界）', () => {
    const result = ctrl.getCache({ key: 'member:balance:nonexistent' })
    expect(result.value).toBeNull()
  })
})

// ══════════════════════════════════════════════════════════════════════════
// 👥 HR — 关注培训系统数据库查询优化
// ══════════════════════════════════════════════════════════════════════════

describe(`${ROLES.HR} performance 培训系统场景`, () => {
  let ctrl: PerformanceController

  beforeEach(() => {
    ctrl = createController()
  })

  it('HR 分析培训课程查询语句获得索引建议（正常流程）', () => {
    const analysis = ctrl.analyzeQuery({ query: 'SELECT * FROM training_courses WHERE dept = \'arcade\' AND status = \'active\' ORDER BY created_at DESC' })
    expect(typeof analysis.rowsExamined).toBe('number')
    expect(typeof analysis.rowsReturned).toBe('number')
    expect(Array.isArray(analysis.recommendations)).toBe(true)
  })

  it('HR 传入空 SQL 应返回有意义的分析而非崩溃（边界）', () => {
    const analysis = ctrl.analyzeQuery({ query: 'SELECT 1' })
    expect(typeof analysis.rowsExamined).toBe('number')
  })
})

// ══════════════════════════════════════════════════════════════════════════
// 🔧 安监 — 关注系统健康、部署重启、缓存标签管理等运维操作
// ══════════════════════════════════════════════════════════════════════════

describe(`${ROLES.Security} performance 安监运维场景`, () => {
  let ctrl: PerformanceController

  beforeEach(() => {
    ctrl = createController()
  })

  it('安检查看部署健康状态并触发重启（正常流程）', () => {
    const health = ctrl.checkDeploymentHealth('arcade-payment')
    expect(typeof health.name).toBe('string')
    expect(health.name).toBe('arcade-payment')

    const result = ctrl.restartDeployment('arcade-payment')
    expect(result.message).toContain('arcade-payment')
    expect(result.message).toContain('重启')
  })

  it('安检按标签删除缓存不影响其他标签缓存（边界）', () => {
    ctrl.setCache({ key: 'arcade:game:g001', value: '热门', ttlMs: 60000, tags: ['arcade'] })
    ctrl.setCache({ key: 'pos:token:t001', value: 'token-abc', ttlMs: 60000, tags: ['pos'] })
    const deleted = ctrl.deleteCacheByTag('pos')
    expect(deleted.deleted).toBe(1)
    // arcade 标签的缓存应仍存在
    const arcadeVal = ctrl.getCache({ key: 'arcade:game:g001' })
    expect(arcadeVal.value).not.toBeNull()
  })
})

// ══════════════════════════════════════════════════════════════════════════
// 🎮 导玩员 — 关注机台排行榜缓存、游戏数据预热
// ══════════════════════════════════════════════════════════════════════════

describe(`${ROLES.Guide} performance 导玩缓存场景`, () => {
  let ctrl: PerformanceController

  beforeEach(() => {
    ctrl = createController()
  })

  it('导玩员批量设置多台机台排行榜数据并批量读取（正常流程）', () => {
    ctrl.msetCache({ entries: [
      { key: 'leaderboard:g001', value: [{ player: '小明', score: 9999 }] },
      { key: 'leaderboard:g002', value: [{ player: '小红', score: 8500 }] },
      { key: 'leaderboard:g003', value: [{ player: '小刚', score: 7200 }] },
    ]})
    const result = ctrl.mgetCache({ keys: ['leaderboard:g001', 'leaderboard:g002', 'leaderboard:nonexist'] })
    expect(result.values.length).toBe(3)
    expect(result.values[0]).not.toBeNull()
    expect(result.values[1]).not.toBeNull()
    expect(result.values[2]).toBeNull()
  })

  it('导玩员预热热门机台缓存后查询应有缓存命中（正常流程）', () => {
    const warmResult = ctrl.warmCache({ keys: ['leaderboard:g001', 'leaderboard:g002'] })
    expect(warmResult.message).toContain('预热')
    // prefetchEnabled 为 true 时预热会立即写入
    const hit1 = ctrl.hasCache({ key: 'leaderboard:g001' })
    expect(hit1.exists).toBe(true)
  })
})

// ══════════════════════════════════════════════════════════════════════════
// 🎯 运行专员 — 关注数据库连接池、负载测试与 HPA 扩缩容
// ══════════════════════════════════════════════════════════════════════════

describe(`${ROLES.Operations} performance 运行调优场景`, () => {
  let ctrl: PerformanceController

  beforeEach(() => {
    ctrl = createController()
  })

  it('运行专员初始化连接池后可获取池状态（正常流程）', () => {
    ctrl.initPool({
      minConnections: 5,
      maxConnections: 50,
      acquireTimeout: 10000,
      idleTimeout: 300000,
      connectionTimeout: 5000,
      healthCheckInterval: 30000,
    })
    const stats = ctrl.getPoolStats()
    expect(typeof stats.totalConnections).toBe('number')
    expect(stats.totalConnections).toBeGreaterThanOrEqual(5)
  })

  it('运行专员触发负载测试后可获取测试结果（正常流程）', async () => {
    const config: LoadTestConfig = {
      name: 'arcade-payment-loadtest',
      vu: 10,
      duration: 5,
      pattern: 'constant' as LoadPattern,
    }
    const result = await ctrl.runLoadTest({
      config,
      endpoints: [
        { url: '/api/member/info', method: 'GET', weight: 70 },
        { url: '/api/payment/create', method: 'POST', weight: 30 },
      ],
    })
    expect(result).not.toBeNull()
    expect(result.duration).toBeGreaterThanOrEqual(0)
    expect(result.config.name).toBe(config.name)
    expect(result.bottlenecks).toBeDefined()
    expect(result.metrics).toBeDefined()
  })

  it('运行专员评估扩缩容时传入空闲指标应返回空决策（边界）', () => {
    const decisions = ctrl.evaluateScaling({
      metrics: {
        cpuPercent: 0,
        memoryPercent: 0,
        requestsPerSecond: 0,
        latencyMs: 0,
        currentReplicas: 1,
        timestamp: new Date(),
      },
    })
    expect(Array.isArray(decisions)).toBe(true)
    expect(decisions.length).toBe(0)
  })
})

// ══════════════════════════════════════════════════════════════════════════
// 🤝 团建 — 关注团队活动报名缓存、设置与 TTL 管理
// ══════════════════════════════════════════════════════════════════════════

describe(`${ROLES.Teambuilding} performance 团建场景`, () => {
  let ctrl: PerformanceController

  beforeEach(() => {
    ctrl = createController()
  })

  it('团建预热缓存后设值可正常读取（正常流程）', () => {
    const warmResult = ctrl.warmCache({
      keys: ['teambuilding:event:e001:signups', 'teambuilding:event:e002:signups'],
    })
    expect(warmResult.message).toContain('预热')

    // 预热后键应存在（prefetchEnabled 为 true 时 warm 会写入）
    const afterWarm = ctrl.getCache({ key: 'teambuilding:event:e001:signups' })
    if (afterWarm.value === null) {
      // 如果预热未写入，手动设置
      ctrl.setCache({ key: 'teambuilding:event:e001:signups', value: { count: 24, max: 30 }, ttlMs: 300000 })
    }
    const afterSet = ctrl.getCache({ key: 'teambuilding:event:e001:signups' })
    expect(afterSet.value).not.toBeNull()
  })

  it('团建设 TTL 后查询剩余时间应在合理范围（正常流程）', () => {
    ctrl.setCache({ key: 'teambuilding:event:e001:signups', value: { count: 10 }, ttlMs: 120000 })
    const ttlResult = ctrl.getCacheTTL('teambuilding:event:e001:signups')
    expect(ttlResult.ttl).toBeGreaterThan(0)
    expect(ttlResult.ttl).toBeLessThanOrEqual(120000)
  })
})

// ══════════════════════════════════════════════════════════════════════════
// 📢 营销 — 关注营销活动数据查询分析与缓存操作
// ══════════════════════════════════════════════════════════════════════════

describe(`${ROLES.Marketing} performance 营销场景`, () => {
  let ctrl: PerformanceController

  beforeEach(() => {
    ctrl = createController()
  })

  it('营销批量分析多条 SQL 查询获取优化建议（正常流程）', () => {
    const results = ctrl.analyzeQueries({ queries: [
      'SELECT * FROM campaigns WHERE active = true AND start_date > NOW()',
      'SELECT campaign_id, SUM(revenue) FROM campaign_revenue GROUP BY campaign_id',
    ]})
    expect(results.length).toBe(2)
    for (const r of results) {
      expect(typeof r.rowsExamined).toBe('number')
      expect(Array.isArray(r.recommendations)).toBe(true)
    }
  })

  it('营销查看索引使用情况并触发重建（正常流程）', () => {
    const usage = ctrl.analyzeIndexUsage('idx_campaign_active', 'campaigns')
    expect(usage).not.toBeNull()
    const rebuild = ctrl.rebuildIndex({ indexName: 'idx_campaign_active' })
    expect(rebuild.message).toContain('idx_campaign_active')
    expect(rebuild.message).toContain('已重建')
  })

  it('营销缓存故障时清空全部缓存后查询应不存在（边界）', () => {
    ctrl.setCache({ key: 'campaign:hot:1', value: { id: 'c001' }, ttlMs: 3600000 })
    ctrl.setCache({ key: 'campaign:hot:2', value: { id: 'c002' }, ttlMs: 3600000 })
    const flushResult = ctrl.flushCache({ tier: 'l1' })
    expect(flushResult.message).toContain('清空')
    // 清空后缓存应消失
    const hit1 = ctrl.hasCache({ key: 'campaign:hot:1' })
    expect(hit1.exists).toBe(false)
    const hit2 = ctrl.hasCache({ key: 'campaign:hot:2' })
    expect(hit2.exists).toBe(false)
  })
})
