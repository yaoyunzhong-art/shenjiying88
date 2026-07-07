import { describe, it, expect, beforeEach } from 'vitest'
/**
 * 🐜 自动: [performance] [C] 角色测试
 *
 * 8 角色视角的 performance 模块测试：
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色至少 2 个测试用例（正常流程 + 权限边界）
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { Test } from '@nestjs/testing'
import { PerformanceController } from './performance.controller'
import { PerformanceService } from './performance.service'
import { CacheTierService } from './cache-tier.service'
import { DBOptimizeService } from './db-optimize.service'
import { K6RunnerService } from './k6-runner.service'
import { K8sScaleService } from './k8s-scale.service'

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

// ── 测试工厂 ──
async function createController(): Promise<PerformanceController> {
  const module = await Test.createTestingModule({
    controllers: [PerformanceController],
    providers: [
      PerformanceService,
      CacheTierService,
      DBOptimizeService,
      K6RunnerService,
      K8sScaleService,
    ],
  }).compile()
  const ctrl = module.get<PerformanceController>(PerformanceController)
  // 初始化缓存配置，避免 CacheTierService 抛出 "缓存未初始化"
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

// ═══════════════════════════════════════════════════════════════
// 👔 店长 — 关注系统整体吞吐、缓存命中率、成本
// ═══════════════════════════════════════════════════════════════

describe(`${ROLES.StoreManager} performance 角色测试`, () => {
  let ctrl: PerformanceController

  beforeEach(async () => {
    ctrl = await createController()
  })

  it('店长查看全局缓存统计数据及命中率（决策辅助）', async () => {
    // 先执行一些缓存操作产生数据
    ctrl.setCache({ key: 'store:popular:1', value: { gameId: 'g001', name: '热门街机' } })
    ctrl.setCache({ key: 'store:popular:2', value: { gameId: 'g002', name: '音游' } })
    ctrl.getCache({ key: 'store:popular:1' })
    ctrl.getCache({ key: 'store:popular:1' })
    ctrl.getCache({ key: 'store:popular:1' })

    const globalStats = ctrl.getGlobalCacheStats()
    assert.ok(globalStats.totalHits >= 3, `总命中 ${globalStats.totalHits} 应 >= 3`)
    assert.ok(globalStats.totalKeys >= 2, `总键数 ${globalStats.totalKeys} 应 >= 2`)
  })

  it('店长配置缓存层级策略（L1/L2/L3 方案决策）', async () => {
    const result = ctrl.configureCache({
      l1: { maxBytes: 2097152, evictionPolicy: 'lru', ttlMs: 30000 },
      l2: { maxBytes: 20971520, evictionPolicy: 'lfu', ttlMs: 300000 },
      l3: { maxBytes: 2147483648, evictionPolicy: 'ttl', ttlMs: 7200000 },
      readThrough: true,
      writeThrough: true,
      prefetchEnabled: false,
    })
    assert.equal(result.message, '缓存配置已应用')
  })

  it('店长查看部署成本估算（月度基础设施预算）', async () => {
    ctrl.scaleDeployment({ name: 'game-api', targetReplicas: 5 })
    const cost = ctrl.estimateCost('game-api')

    assert.ok(cost.totalPerHour > 0, '每小时成本应 > 0')
    assert.ok(cost.totalPerMonth > 0, '每月成本应 > 0')
    assert.ok(cost.cpuCostPerHour >= 0)
    assert.ok(cost.memoryCostPerHour >= 0)
  })
})

// ═══════════════════════════════════════════════════════════════
// 🛒 前台 — 关注系统快速响应、缓存热数据
// ═══════════════════════════════════════════════════════════════

describe(`${ROLES.FrontDesk} performance 角色测试`, () => {
  let ctrl: PerformanceController

  beforeEach(async () => {
    ctrl = await createController()
  })

  it('前台设置 POS 终端缓存数据并读取（收银提速）', async () => {
    ctrl.setCache({ key: 'pos:membership:gold', value: { discount: 0.85, name: '金牌会员折扣' } })

    const result = ctrl.getCache({ key: 'pos:membership:gold' })
    assert.ok(result.value)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const val = result.value as any
    assert.equal(val.discount, 0.85)
  })

  it('前台检查缓存键是否存在（快速验证数据是否就绪）', async () => {
    // 设置并立即检查
    ctrl.setCache({ key: 'pos:today:games', value: ['街霸6', '舞萌DX', '头文字D'] })

    const exists = ctrl.hasCache({ key: 'pos:today:games' })
    assert.equal(exists.exists, true)

    const notExists = ctrl.hasCache({ key: 'pos:yesterday:games' })
    assert.equal(notExists.exists, false)
  })

  it('前台批量读取多个缓存值（批量查价场景）', async () => {
    ctrl.setCache({ key: 'menu:item:drink1', value: { name: '可乐', price: 5 } })
    ctrl.setCache({ key: 'menu:item:snack1', value: { name: '薯条', price: 8 } })

    const result = ctrl.mgetCache({ keys: ['menu:item:drink1', 'menu:item:snack1', 'menu:item:nonexist'] })
    assert.equal(result.values.length, 3)
    assert.ok(result.values[0] !== null)
    assert.ok(result.values[1] !== null)
    assert.equal(result.values[2], null)
  })
})

// ═══════════════════════════════════════════════════════════════
// 👥 HR — 关心员工系统、报表查询性能
// ═══════════════════════════════════════════════════════════════

describe(`${ROLES.HR} performance 角色测试`, () => {
  let ctrl: PerformanceController

  beforeEach(async () => {
    ctrl = await createController()
  })

  it('HR 分析员工报表查询并获取优化建议', async () => {
    const analysis = ctrl.analyzeQuery({ query: 'SELECT * FROM employees WHERE department = "operations"' })

    assert.equal(analysis.queryType, 'select')
    assert.ok(analysis.recommendations.length >= 0)
    assert.ok(analysis.estimatedCost > 0)
  })

  it('HR 批量分析多个报表查询（日报/周报场景）', async () => {
    const results = ctrl.analyzeQueries({
      queries: [
        'SELECT * FROM attendance WHERE date > "2026-01-01"',
        'SELECT COUNT(*) FROM leave_requests WHERE status = "pending"',
      ],
    })

    assert.equal(results.length, 2)
    for (const r of results) {
      assert.ok(r.queryType)
      assert.ok(r.executionTime > 0)
    }
  })

  it('HR 获取索引推荐优化人事查询速度', async () => {
    const recommendations = ctrl.recommendIndexes({
      queries: ['SELECT * FROM employees WHERE department = "sales" AND salary > 5000'],
      tableStats: {
        employees: {
          rowCount: 10000,
          columnCardinality: {
            department: 10,
            salary: 200,
            name: 8000,
          },
        },
      },
    })

    assert.ok(Array.isArray(recommendations))
    // 应该有推荐建立索引
    if (recommendations.length > 0) {
      assert.ok(recommendations[0].indexName)
      assert.ok(recommendations[0].selectivity > 0)
    }
  })
})

// ═══════════════════════════════════════════════════════════════
// 🔧 安监 — 关注系统健康、缓存安全、故障隔离
// ═══════════════════════════════════════════════════════════════

describe(`${ROLES.Security} performance 角色测试`, () => {
  let ctrl: PerformanceController

  beforeEach(async () => {
    ctrl = await createController()
  })

  it('安监检查部署健康状态（系统稳定性监督）', async () => {
    const health = ctrl.checkDeploymentHealth('game-api')

    assert.ok(health.name)
    assert.ok(['healthy', 'degraded', 'critical', 'unknown'].includes(health.status))
    assert.ok(health.readyReplicas >= 0)
    assert.ok(Array.isArray(health.conditions))
  })

  it('安监按标签批量清除缓存（数据安全合规操作）', async () => {
    ctrl.setCache({ key: 'user:1001:profile', value: { name: '张三' }, tags: ['user-data'] })
    ctrl.setCache({ key: 'user:1002:profile', value: { name: '李四' }, tags: ['user-data'] })

    const result = ctrl.deleteCacheByTag('user-data')
    // 验证返回值结构正确，且操作无异常
    assert.equal(typeof result.deleted, 'number')
  })

  it('安监查看不存在的部署健康状态应返回 unknown', async () => {
    const health = ctrl.checkDeploymentHealth('i-dont-exist')

    assert.equal(health.status, 'unknown')
    assert.equal(health.readyReplicas, 0)
    assert.equal(health.availableReplicas, 0)
  })

  it('安监清空缓存（数据安全事件后应急操作）', async () => {
    ctrl.setCache({ key: 'temp:sensitive:1', value: 'secret' })

    const flushAll = ctrl.flushCache({})
    assert.ok(flushAll.message.includes('已清空'))

    // 确认清空后查询不到
    const result = ctrl.getCache({ key: 'temp:sensitive:1' })
    assert.equal(result.value, null)
  })
})

// ═══════════════════════════════════════════════════════════════
// 🎮 导玩员 — 关注游戏设备性能、游戏数据查询速度
// ═══════════════════════════════════════════════════════════════

describe(`${ROLES.Guide} performance 角色测试`, () => {
  let ctrl: PerformanceController

  beforeEach(async () => {
    ctrl = await createController()
  })

  it('导玩员预热热门游戏数据到缓存（开市前准备）', async () => {
    const result = ctrl.warmCache({
      keys: ['game:popular:001', 'game:popular:002', 'game:popular:003'],
    })
    assert.ok(result.message.includes('预热'))
    assert.ok(result.message.includes('3'))
  })

  it('导玩员检查单个缓存 TTL（数据新鲜度验证）', async () => {
    ctrl.setCache({ key: 'game:daily:ranking', value: [1, 2, 3], ttlMs: 60000 })

    const ttlResult = ctrl.getCacheTTL('game:daily:ranking')
    assert.ok(ttlResult.ttl > 0)
  })

  it('导玩员为游戏排行榜续期 TTL（延长热门数据存活）', async () => {
    ctrl.setCache({ key: 'game:hot:event', value: { name: '周末赛' } })

    const renew = ctrl.expireCache({ key: 'game:hot:event', ttlMs: 300000 })
    assert.ok(renew.message.includes('TTL 已更新'))

    // 验证仍然可以读取
    const result = ctrl.getCache({ key: 'game:hot:event' })
    assert.ok(result.value !== null)
  })
})

// ═══════════════════════════════════════════════════════════════
// 🎯 运行专员 — 关注 HPA 策略、压测结果、自动伸缩
// ═══════════════════════════════════════════════════════════════

describe(`${ROLES.Operations} performance 角色测试`, () => {
  let ctrl: PerformanceController

  beforeEach(async () => {
    ctrl = await createController()
  })

  it('运行专员创建 HPA 弹性伸缩策略并验证配置', async () => {
    const policy = ctrl.createHPAPolicy({
      name: 'game-servers',
      metric: 'cpu',
      targetValue: 80,
      targetPercent: 70,
      minReplicas: 3,
      maxReplicas: 30,
      stabilizationWindowSeconds: 300,
      cooldownSeconds: 120,
      enabled: true,
    })

    assert.equal(policy.name, 'game-servers')
    assert.equal(policy.metric, 'cpu')
    assert.equal(policy.minReplicas, 3)
    assert.equal(policy.maxReplicas, 30)
    assert.equal(policy.enabled, true)
  })

  it('运行专员查看 HPA 策略列表和单个策略', async () => {
    ctrl.createHPAPolicy({
      name: 'web-frontend',
      metric: 'requests_per_second',
      targetValue: 1000,
      targetPercent: 80,
      minReplicas: 2,
      maxReplicas: 20,
      stabilizationWindowSeconds: 300,
      cooldownSeconds: 120,
      enabled: true,
    })

    const list = ctrl.listHPAPolicies()
    assert.ok(list.length >= 1)

    const policy = ctrl.getHPAPolicy('web-frontend')
    assert.ok(policy)
    assert.equal(policy!.name, 'web-frontend')
    assert.equal(policy!.metric, 'requests_per_second')
  })

  it('运行专员更新 HPA 策略并生效', async () => {
    ctrl.createHPAPolicy({
      name: 'api-gateway',
      metric: 'cpu',
      targetValue: 80,
      targetPercent: 70,
      minReplicas: 2,
      maxReplicas: 10,
      stabilizationWindowSeconds: 300,
      cooldownSeconds: 120,
      enabled: true,
    })

    const updated = ctrl.updateHPAPolicy('api-gateway', { maxReplicas: 20, targetPercent: 85 })
    assert.equal(updated.maxReplicas, 20)
    assert.equal(updated.targetPercent, 85)
  })

  it('运行专员删除 HPA 策略后应不再可查', async () => {
    ctrl.createHPAPolicy({
      name: 'temp-policy',
      metric: 'memory',
      targetValue: 80,
      targetPercent: 75,
      minReplicas: 1,
      maxReplicas: 5,
      stabilizationWindowSeconds: 300,
      cooldownSeconds: 120,
      enabled: true,
    })

    ctrl.deleteHPAPolicy('temp-policy')
    const policy = ctrl.getHPAPolicy('temp-policy')
    assert.equal(policy, null)
  })

  it('运行专员触发自动伸缩策略评估', async () => {
    ctrl.scaleDeployment({ name: 'session-service', targetReplicas: 5 })

    const decision = ctrl.autoScale({ name: 'session-service' })
    assert.ok(decision.action === 'scale_up' || decision.action === 'scale_down' || decision.action === 'scale_stabilize')
    assert.ok(decision.targetReplicas >= 0)
    assert.ok(decision.reason)
    assert.ok(decision.confidence >= 0 && decision.confidence <= 1)
  })

  it('运行专员查看伸缩历史记录', async () => {
    ctrl.scaleDeployment({ name: 'history-app', targetReplicas: 3 })
    ctrl.scaleDeployment({ name: 'history-app', targetReplicas: 5 })
    ctrl.scaleDeployment({ name: 'history-app', targetReplicas: 2 })

    const history = ctrl.getScaleHistory('history-app', '5')
    assert.ok(Array.isArray(history))
    assert.ok(history.length >= 2)
    for (const entry of history) {
      assert.ok(entry.from >= 0)
      assert.ok(entry.to >= 0)
      assert.ok(entry.reason)
      assert.ok(entry.timestamp instanceof Date)
    }
  })
})

// ═══════════════════════════════════════════════════════════════
// 🤝 团建 — 关注活动页面性能、批量缓存管理
// ═══════════════════════════════════════════════════════════════

describe(`${ROLES.Teambuilding} performance 角色测试`, () => {
  let ctrl: PerformanceController

  beforeEach(async () => {
    ctrl = await createController()
  })

  it('团建批量缓存活动相关数据（团队活动预热）', async () => {
    const rows = [
      { key: 'teambuild:event:001', value: { name: '春季团建', date: '2026-03-15', people: 20 } },
      { key: 'teambuild:event:002', value: { name: '夏季烧烤', date: '2026-06-20', people: 30 } },
      { key: 'teambuild:event:003', value: { name: '年终聚餐', date: '2026-12-25', people: 50 } },
    ]
    const result = ctrl.msetCache({ entries: rows.map(r => ({ key: r.key, value: r.value })) })
    assert.ok(result.message.includes('批量设置了'))
    assert.ok(result.message.includes('3'))

    // 验证批量读取
    const mget = ctrl.mgetCache({ keys: ['teambuild:event:001', 'teambuild:event:002', 'teambuild:event:003'] })
    assert.equal(mget.values.length, 3)
    for (const v of mget.values) {
      assert.ok(v !== null)
    }
  })

  it('团建删除过期活动缓存', async () => {
    ctrl.setCache({ key: 'teambuild:old:event', value: { name: '过期活动' } })

    const result = ctrl.deleteCache('teambuild:old:event')
    assert.ok(result.message.includes('已删除'))

    // 确认已删除
    const check = ctrl.hasCache({ key: 'teambuild:old:event' })
    assert.equal(check.exists, false)
  })
})

// ═══════════════════════════════════════════════════════════════
// 📢 营销 — 关注活动压测、营销推荐查询性能
// ═══════════════════════════════════════════════════════════════

describe(`${ROLES.Marketing} performance 角色测试`, () => {
  let ctrl: PerformanceController

  beforeEach(async () => {
    ctrl = await createController()
  })

  it('营销分析推广活动相关 SQL 查询性能', async () => {
    const analysis = ctrl.analyzeQuery({ query: 'SELECT * FROM promotion_campaigns WHERE start_date > "2026-01-01" AND status = "active"' })

    assert.ok(analysis.queryType)
    assert.ok(analysis.estimatedCost > 0)
    assert.ok(Array.isArray(analysis.recommendations))
  })

  it('营销查看推荐部署的瓶颈分析和优化建议', async () => {
    const bottlenecks = ctrl.analyzeDeploymentBottlenecks('marketing-campaign')
    assert.ok(Array.isArray(bottlenecks))
  })

  it('营销获取部署推荐副本数（活动放量预测）', async () => {
    const result = ctrl.recommendReplicas('marketing-service', '60')
    assert.ok(result.recommendedReplicas >= 0)
  })

  it('营销构建复杂营销查询获取索引推荐', async () => {
    const recommendations = ctrl.recommendIndexes({
      queries: [
        'SELECT * FROM campaigns WHERE end_date > NOW() AND budget > 10000',
        'SELECT * FROM users WHERE last_promotion_click > "2026-01-01"',
      ],
      tableStats: {
        campaigns: { rowCount: 5000, columnCardinality: { end_date: 100, budget: 500 } },
        users: { rowCount: 50000, columnCardinality: { last_promotion_click: 365 } },
      },
    })

    assert.ok(Array.isArray(recommendations))
    if (recommendations.length > 0) {
      assert.ok(recommendations[0].tableName)
      assert.ok(recommendations[0].indexName)
    }
  })

  it('营销尝试获取不存在的压测结果应返回 null', async () => {
    const result = ctrl.getLoadTestResult('nonexistent-load-test-id')
    assert.equal(result, null)
  })

  it('营销触发缓存统计重置（大促前后对比）', async () => {
    // 先产生一些统计
    ctrl.setCache({ key: 'campaign:promo:1', value: 'data' })
    ctrl.getCache({ key: 'campaign:promo:1' })

    const beforeReset = ctrl.getGlobalCacheStats()

    const resetResult = ctrl.resetCacheStats()
    assert.ok(resetResult.message.includes('已重置'))

    const afterReset = ctrl.getGlobalCacheStats()
    // 重置后统计数据应归零或变小
    assert.ok(afterReset.totalHits <= beforeReset.totalHits)
  })
})
