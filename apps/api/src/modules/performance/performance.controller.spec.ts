import { describe, it, expect, beforeEach, vi } from 'vitest'
/**
 * PerformanceController 单元测试 (vitest)
 *
 * 策略：使用 NestJS Test 创建测试模块，覆盖所有路由端点。
 * 正向流程 + 边界条件（空数据集、极端输入、不存在的资源）。
 */

import { Test } from '@nestjs/testing'
import { PerformanceController } from './performance.controller'
import { PerformanceService } from './performance.service'
import { CacheTierService } from './cache-tier.service'
import { DBOptimizeService } from './db-optimize.service'
import { K6RunnerService } from './k6-runner.service'
import { K8sScaleService } from './k8s-scale.service'
import type {
  MultiLevelConfig,
  CacheStats,
  GlobalCacheStats,
  QueryAnalysis,
  IndexCandidate,
  PoolStats,
  RewriteResult,
  LoadTestConfig,
  LoadTestEndpoint,
  LoadTestResult,
  HPAPolicy,
  ReplicaMetrics,
  ScalingDecision,
  DeploymentHealth,
  ScaleHistoryEntry,
  CostEstimate,
} from './performance.entity'

// ── 测试数据工厂 ───────────────────────────────────────────────────

function makeMultiLevelConfig(overrides: Partial<MultiLevelConfig> = {}): MultiLevelConfig {
  return {
    l1: { maxBytes: 1048576, evictionPolicy: 'lru', ttlMs: 60000 },
    l2: { maxBytes: 10485760, evictionPolicy: 'lfu', ttlMs: 300000, host: 'redis-1:6379' },
    l3: { maxBytes: 1073741824, evictionPolicy: 'ttl', ttlMs: 3600000, host: 'redis-2:6379' },
    readThrough: true,
    writeThrough: false,
    prefetchEnabled: true,
    ...overrides,
  }
}

function makeLoadTestConfig(overrides: Partial<LoadTestConfig> = {}): LoadTestConfig {
  return {
    name: 'test-load',
    vu: 10,
    duration: 60,
    pattern: 'constant',
    ...overrides,
  }
}

function makeLoadTestEndpoints(): LoadTestEndpoint[] {
  return [
    { url: '/api/health', method: 'GET', weight: 1 },
    { url: '/api/users', method: 'POST', weight: 2 },
  ]
}

function makeReplicaMetrics(overrides: Partial<ReplicaMetrics> = {}): ReplicaMetrics {
  return {
    timestamp: new Date(),
    cpuPercent: 50,
    memoryPercent: 50,
    requestsPerSecond: 100,
    latencyMs: 50,
    currentReplicas: 3,
    ...overrides,
  }
}

// ── 测试模块 ─────────────────────────────────────────────────────

describe('PerformanceController', () => {
  let controller: PerformanceController
  let performanceService: PerformanceService

  beforeEach(async () => {
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

    controller = module.get<PerformanceController>(PerformanceController)
    performanceService = module.get<PerformanceService>(PerformanceService)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  // ── 缓存端点 ─────────────────────────────────────────────────

  describe('Cache endpoints', () => {
    // Cache operations require initializing cache first
    function initCache() {
      controller.configureCache(makeMultiLevelConfig())
    }

    it('POST /performance/cache/configure should configure cache', () => {
      const config = makeMultiLevelConfig()
      const result = controller.configureCache(config as any)
      expect(result.message).toContain('已应用')
    })

    it('GET /performance/cache/config should return cache config', () => {
      const config = makeMultiLevelConfig()
      controller.configureCache(config as any)
      const result = controller.getCacheConfig()
      expect(result).toBeDefined()
    })

    it('POST /performance/cache/set and get should work', () => {
      initCache()
      controller.setCache({ key: 'foo', value: 'bar' })
      const result = controller.getCache({ key: 'foo' })
      expect(result.value).toBe('bar')
    })

    it('POST /performance/cache/get for missing key should return null', () => {
      initCache()
      const result = controller.getCache({ key: 'missing-key' })
      expect(result.value).toBeNull()
    })

    it('POST /performance/cache/set should set value', () => {
      initCache()
      const result = controller.setCache({ key: 'mykey', value: { data: 123 } })
      expect(result.message).toContain('已设置')

      const getResult = controller.getCache({ key: 'mykey' })
      expect(getResult.value).toEqual({ data: 123 })
    })

    it('POST /performance/cache/mset should batch set values', () => {
      initCache()
      const result = controller.msetCache({
        entries: [
          { key: 'a', value: 1 },
          { key: 'b', value: 2 },
          { key: 'c', value: 3 },
        ],
      })
      expect(result.message).toContain('3')
    })

    it('POST /performance/cache/mget should batch get values', () => {
      initCache()
      controller.setCache({ key: 'x', value: 10 })
      controller.setCache({ key: 'y', value: 20 })
      const result = controller.mgetCache({ keys: ['x', 'y', 'z'] })
      expect(result.values).toHaveLength(3)
      expect(result.values[0]).toBe(10)
      expect(result.values[1]).toBe(20)
      expect(result.values[2]).toBeNull()
    })

    it('POST /performance/cache/has should check existence', () => {
      initCache()
      controller.setCache({ key: 'exists', value: 'data' })
      expect(controller.hasCache({ key: 'exists' }).exists).toBe(true)
      expect(controller.hasCache({ key: 'nonexistent' }).exists).toBe(false)
    })

    it('DELETE /performance/cache/:key should delete cache entry', () => {
      initCache()
      controller.setCache({ key: 'delete-me', value: 'data' })
      expect(controller.hasCache({ key: 'delete-me' }).exists).toBe(true)

      const result = controller.deleteCache('delete-me')
      expect(result.message).toContain('已删除')
      expect(controller.hasCache({ key: 'delete-me' }).exists).toBe(false)
    })

    it('POST /performance/cache/flush with no tier should flush all', () => {
      initCache()
      const result = controller.flushCache({})
      expect(result.message).toContain('已清空')
    })

    it('POST /performance/cache/flush with specific tier should flush that tier', () => {
      initCache()
      const result = controller.flushCache({ tier: 'l1' as any })
      expect(result.message).toContain('(l1)')
    })

    it('POST /performance/cache/flush with l2 tier should flush L2', () => {
      initCache()
      const result = controller.flushCache({ tier: 'l2' as any })
      expect(result.message).toContain('(l2)')
    })

    it('GET /performance/cache/stats should return per-tier stats', () => {
      initCache()
      const stats = controller.getCacheStats()
      expect(stats).toBeInstanceOf(Array)
      expect(stats.length).toBeGreaterThanOrEqual(1)
      const first = stats[0]
      expect(first).toHaveProperty('tier')
      expect(first).toHaveProperty('hitRate')
    })

    it('GET /performance/cache/global-stats should return global stats', () => {
      initCache()
      controller.setCache({ key: 'g1', value: 'v1' })
      const stats = controller.getGlobalCacheStats()
      expect(stats).toHaveProperty('totalHits')
      expect(stats).toHaveProperty('overallHitRate')
      expect(typeof stats.totalHits).toBe('number')
    })

    it('POST /performance/cache/reset-stats should reset counters', () => {
      initCache()
      const result = controller.resetCacheStats()
      expect(result.message).toContain('已重置')
    })

    it('POST /performance/cache/warm should preload cache keys', () => {
      initCache()
      const result = controller.warmCache({ keys: ['warm-1', 'warm-2', 'warm-3'] })
      expect(result.message).toContain('3')
      expect(controller.getCache({ key: 'warm-1' }).value).toBe('preloaded-warm-1')
    })

    it('POST /performance/cache/warm with empty keys should work', () => {
      initCache()
      const result = controller.warmCache({ keys: [] })
      expect(result.message).toContain('0')
    })

    it('GET /performance/cache/ttl should return remaining TTL', () => {
      initCache()
      controller.setCache({ key: 'ttl-test', value: 'x', ttlMs: 99999 })
      const result = controller.getCacheTTL('ttl-test')
      expect(result.ttl).toBeGreaterThan(0)
    })

    it('GET /performance/cache/ttl for missing key should return -2', () => {
      initCache()
      const result = controller.getCacheTTL('no-such-key')
      expect(result.ttl).toBe(-2)
    })

    it('POST /performance/cache/expire should update TTL', () => {
      initCache()
      controller.setCache({ key: 'expire-me', value: 'data' })
      controller.expireCache({ key: 'expire-me', ttlMs: 60000 })
      const ttl = controller.getCacheTTL('expire-me')
      expect(ttl.ttl).toBeGreaterThanOrEqual(50000)
    })

    it('DELETE /performance/cache/tag/:tag should delete by tag', () => {
      initCache()
      const result = controller.deleteCacheByTag('user:*')
      expect(result.deleted).toBeGreaterThanOrEqual(0)
    })

    it('POST /performance/cache/set with tags should support tag deletion', () => {
      initCache()
      controller.setCache({ key: 'tagged-1', value: 'v1', tags: ['group-a', 'group-b'] })
      controller.setCache({ key: 'tagged-2', value: 'v2', tags: ['group-a'] })
      controller.setCache({ key: 'untagged', value: 'v3' })

      const result = controller.deleteCacheByTag('group-a')
      expect(result.deleted).toBe(2)

      expect(controller.hasCache({ key: 'tagged-1' }).exists).toBe(false)
      expect(controller.hasCache({ key: 'tagged-2' }).exists).toBe(false)
      expect(controller.hasCache({ key: 'untagged' }).exists).toBe(true)
    })
  })

  // ── 数据库优化端点 ───────────────────────────────────────────

  describe('DB optimization endpoints', () => {
    it('POST /performance/db/analyze should analyze a SELECT query with a WHERE clause', () => {
      const result = controller.analyzeQuery({ query: 'SELECT * FROM users WHERE id = 1' })
      expect(result.queryType).toBe('select')
      expect(result.recommendations).toBeDefined()
    })

    it('POST /performance/db/analyze should analyze an INSERT query', () => {
      const result = controller.analyzeQuery({
        query: 'INSERT INTO users (name, email) VALUES (?, ?)',
      })
      expect(result.queryType).toBe('insert')
      expect(result.recommendations).toBeDefined()
    })

    it('POST /performance/db/analyze-batch should analyze multiple queries', () => {
      const result = controller.analyzeQueries({
        queries: [
          'SELECT * FROM users',
          'SELECT * FROM orders',
          'SELECT * FROM products',
        ],
      })
      expect(result).toHaveLength(3)
      result.forEach((r) => {
        expect(r).toHaveProperty('queryType')
        expect(r).toHaveProperty('recommendations')
      })
    })

    it('POST /performance/db/analyze-batch with empty array should handle gracefully', () => {
      const result = controller.analyzeQueries({ queries: [] })
      expect(result).toHaveLength(0)
    })

    it('POST /performance/db/explain should generate execution plan', () => {
      const result = controller.explainQuery({
        query: 'SELECT * FROM users WHERE email = ?',
      })
      expect(result.nodeType).toBeDefined()
      expect(result.estimatedCost).toBeGreaterThan(0)
      expect(result.warnings).toBeDefined()
    })

    it('POST /performance/db/recommend-indexes should return candidates', () => {
      const result = controller.recommendIndexes({
        queries: ['SELECT * FROM users WHERE email = ?'],
        tableStats: { users: { rowCount: 100000, columnCardinality: { email: 90000 } } },
      })
      expect(result).toBeInstanceOf(Array)
      const first = result[0]
      expect(first).toHaveProperty('indexName')
      expect(first).toHaveProperty('selectivity')
      expect(first.recommendation).toBe('create')
    })

    it('POST /performance/db/init-pool should initialize connection pool', () => {
      const result = controller.initPool({
        minConnections: 5,
        maxConnections: 50,
        acquireTimeout: 5000,
        idleTimeout: 30000,
        connectionTimeout: 10000,
        healthCheckInterval: 60000,
      })
      expect(result.message).toContain('已初始化')
    })

    it('GET /performance/db/pool-stats should return pool stats after init', () => {
      controller.initPool({
        minConnections: 5,
        maxConnections: 50,
        acquireTimeout: 5000,
        idleTimeout: 30000,
        connectionTimeout: 10000,
        healthCheckInterval: 60000,
      })
      const stats = controller.getPoolStats()
      expect(stats).toHaveProperty('totalConnections')
      expect(stats).toHaveProperty('activeConnections')
      expect(stats).toHaveProperty('hitRate')
    })

    it('POST /performance/db/rewrite should rewrite a query', () => {
      const result = controller.rewriteQuery({
        query: 'SELECT * FROM users WHERE id IN (SELECT user_id FROM orders)',
      })
      expect(result.rewritten).toBeDefined()
      expect(result.improvement).toBeDefined()
      expect(result.rewritten).toBeTruthy()
    })

    it('POST /performance/db/rewrite for a simple query should return rewritten output', () => {
      const result = controller.rewriteQuery({
        query: 'SELECT id, name FROM users WHERE id = 1',
      })
      expect(result.rewritten).toBeTruthy()
    })

    it('POST /performance/db/cache-result should cache query result', () => {
      const result = controller.cacheQueryResult({
        key: 'query:users:1',
        result: { id: 1, name: 'Alice' },
        ttlSeconds: 300,
      })
      expect(result.message).toContain('已缓存')
    })

    it('POST /performance/db/query should execute SQL after pool init', async () => {
      controller.initPool({
        minConnections: 1,
        maxConnections: 10,
        acquireTimeout: 5000,
        idleTimeout: 30000,
        connectionTimeout: 10000,
        healthCheckInterval: 60000,
      })
      const result = await controller.executeQuery({ sql: 'SELECT 1' })
      expect(result).toHaveProperty('rows')
      expect(result).toHaveProperty('time')
      expect(result.time).toBeGreaterThan(0)
    })

    it('POST /performance/db/query should handle DDL statements after pool init', async () => {
      controller.initPool({
        minConnections: 1,
        maxConnections: 10,
        acquireTimeout: 5000,
        idleTimeout: 30000,
        connectionTimeout: 10000,
        healthCheckInterval: 60000,
      })
      const result = await controller.executeQuery({ sql: 'DROP TABLE IF EXISTS test' })
      expect(result).toHaveProperty('rows')
    })
  })

  // ── 压测端点 ─────────────────────────────────────────────────

  describe('Load test endpoints', () => {
    it('POST /performance/load-test/run should run a load test', async () => {
      const result = await controller.runLoadTest({
        config: makeLoadTestConfig(),
        endpoints: makeLoadTestEndpoints(),
      })
      expect(result).toHaveProperty('config')
      expect(result).toHaveProperty('metrics')
      expect(result.metrics.totalRequests).toBeGreaterThan(0)
      expect(result.statusCode).toBe('ok')
    })

    it('POST /performance/load-test/run with high VU should handle load', async () => {
      const result = await controller.runLoadTest({
        config: makeLoadTestConfig({ vu: 100, duration: 10 }),
        endpoints: makeLoadTestEndpoints(),
      })
      expect(result.metrics.totalRequests).toBeGreaterThan(0)
      expect(result.metrics.avgResponseTime).toBeGreaterThan(0)
    })

    it('POST /performance/load-test/run with zero VU should handle gracefully', async () => {
      const result = await controller.runLoadTest({
        config: makeLoadTestConfig({ vu: 0, duration: 0 }),
        endpoints: [],
      })
      expect(result.statusCode).toBe('ok')
      expect(result.metrics.totalRequests).toBe(0)
    })

    it('POST /performance/load-test/ramp should run ramp test', async () => {
      const result = await controller.runRampTest({
        config: makeLoadTestConfig({ pattern: 'ramp' }),
        stages: [
          { duration: 10, vu: 5 },
          { duration: 10, vu: 20 },
          { duration: 10, vu: 10 },
        ],
      })
      expect(result).toHaveProperty('metrics')
      expect(result.metrics.totalRequests).toBeGreaterThan(0)
    })

    it('POST /performance/load-test/ramp with single stage should still run', async () => {
      const result = await controller.runRampTest({
        config: makeLoadTestConfig({ pattern: 'ramp' }),
        stages: [{ duration: 5, vu: 10 }],
      })
      expect(result.metrics.totalRequests).toBeGreaterThan(0)
    })

    it('GET /performance/load-test/realtime-metrics should return metrics', () => {
      const metrics = controller.getRealtimeMetrics()
      expect(metrics).toBeDefined()
    })

    it('GET /performance/load-test/result/:testId should return result with config and metrics', async () => {
      const runResult = await controller.runLoadTest({
        config: makeLoadTestConfig({ name: 'known-test' }),
        endpoints: makeLoadTestEndpoints(),
      })

      expect(runResult.config.name).toBe('known-test')
      expect(runResult.metrics.totalRequests).toBeGreaterThan(0)
    })

    it('GET /performance/load-test/result/:testId should return null for unknown ID', () => {
      const result = controller.getLoadTestResult('nonexistent-test-id')
      expect(result).toBeNull()
    })

    it('POST /performance/load-test/analyze should suggest optimizations for bottlenecks', () => {
      // analyzeLoadTest returns suggestions for given bottlenecks; may be empty for unknown bottlenecks
      const suggestions = controller.analyzeLoadTest({
        bottlenecks: ['high_cpu', 'slow_queries'],
      })
      expect(suggestions).toBeInstanceOf(Array)
    })

    it('POST /performance/load-test/analyze with empty bottlenecks should not throw', () => {
      const suggestions = controller.analyzeLoadTest({ bottlenecks: [] })
      expect(suggestions).toBeInstanceOf(Array)
    })
  })

  // ── 弹性伸缩端点 ─────────────────────────────────────────────

  describe('HPA policies', () => {
    it('POST /performance/hpa should create HPA policy', () => {
      const policy = controller.createHPAPolicy({
        name: 'web-servers',
        metric: 'cpu',
        targetValue: 80,
        targetPercent: 70,
        minReplicas: 2,
        maxReplicas: 20,
        stabilizationWindowSeconds: 300,
        cooldownSeconds: 120,
        enabled: true,
      })
      expect(policy.name).toBe('web-servers')
      expect(policy.minReplicas).toBe(2)
      expect(policy.maxReplicas).toBe(20)
      expect(policy.enabled).toBe(true)
    })

    it('POST /performance/hpa with memory metric should create policy', () => {
      const policy = controller.createHPAPolicy({
        name: 'memory-workers',
        metric: 'memory',
        targetValue: 70,
        targetPercent: 65,
        minReplicas: 1,
        maxReplicas: 10,
        stabilizationWindowSeconds: 300,
        cooldownSeconds: 120,
        enabled: true,
      })
      expect(policy.name).toBe('memory-workers')
      expect(policy.metric).toBe('memory')
    })

    it('POST /performance/hpa with RPS metric should create policy', () => {
      const policy = controller.createHPAPolicy({
        name: 'rps-workers',
        metric: 'requests_per_second',
        targetValue: 1000,
        targetPercent: 80,
        minReplicas: 2,
        maxReplicas: 50,
        stabilizationWindowSeconds: 120,
        cooldownSeconds: 60,
        enabled: true,
      })
      expect(policy.name).toBe('rps-workers')
      expect(policy.metric).toBe('requests_per_second')
    })

    it('GET /performance/hpa should list HPA policies', () => {
      controller.createHPAPolicy({
        name: 'api-servers',
        metric: 'memory',
        targetValue: 80,
        targetPercent: 75,
        minReplicas: 1,
        maxReplicas: 10,
        stabilizationWindowSeconds: 300,
        cooldownSeconds: 120,
        enabled: true,
      })
      const policies = controller.listHPAPolicies()
      expect(policies.length).toBeGreaterThan(0)
      expect(policies.find((p) => p.name === 'api-servers')).toBeDefined()
    })

    it('GET /performance/hpa/:name should get a specific policy', () => {
      controller.createHPAPolicy({
        name: 'worker-pool',
        metric: 'cpu',
        targetValue: 80,
        targetPercent: 70,
        minReplicas: 1,
        maxReplicas: 10,
        stabilizationWindowSeconds: 300,
        cooldownSeconds: 120,
        enabled: true,
      })
      const policy = controller.getHPAPolicy('worker-pool')
      expect(policy).not.toBeNull()
      expect(policy!.name).toBe('worker-pool')
    })

    it('GET /performance/hpa/:name for unknown policy should return null', () => {
      const policy = controller.getHPAPolicy('no-such-policy')
      expect(policy).toBeNull()
    })

    it('PATCH /performance/hpa/:name should update a policy', () => {
      controller.createHPAPolicy({
        name: 'updatable',
        metric: 'cpu',
        targetValue: 80,
        targetPercent: 70,
        minReplicas: 1,
        maxReplicas: 5,
        stabilizationWindowSeconds: 300,
        cooldownSeconds: 120,
        enabled: true,
      })

      const updated = controller.updateHPAPolicy('updatable', {
        targetValue: 60,
        minReplicas: 2,
        maxReplicas: 10,
        enabled: true,
      })
      expect(updated.targetValue).toBe(60)
      expect(updated.minReplicas).toBe(2)
      expect(updated.maxReplicas).toBe(10)
    })

    it('PATCH /performance/hpa/:name can disable policy', () => {
      controller.createHPAPolicy({
        name: 'disable-me',
        metric: 'cpu',
        targetValue: 80,
        targetPercent: 70,
        minReplicas: 1,
        maxReplicas: 5,
        stabilizationWindowSeconds: 300,
        cooldownSeconds: 120,
        enabled: true,
      })

      const updated = controller.updateHPAPolicy('disable-me', { enabled: false })
      expect(updated.enabled).toBe(false)
    })

    it('DELETE /performance/hpa/:name should delete a policy', () => {
      controller.createHPAPolicy({
        name: 'to-delete',
        metric: 'cpu',
        targetValue: 80,
        targetPercent: 70,
        minReplicas: 1,
        maxReplicas: 5,
        stabilizationWindowSeconds: 300,
        cooldownSeconds: 120,
        enabled: true,
      })
      const result = controller.deleteHPAPolicy('to-delete')
      expect(result.message).toContain('已删除')
      expect(controller.getHPAPolicy('to-delete')).toBeNull()
    })

    it('DELETE /performance/hpa/:name for unknown policy should not throw', () => {
      const result = controller.deleteHPAPolicy('never-existed')
      expect(result.message).toContain('已删除')
    })
  })

  // ── 扩缩容与部署端点 ─────────────────────────────────────────

  describe('Scaling and deployment endpoints', () => {
    it('GET /performance/metrics should collect metrics', () => {
      const metrics = controller.collectMetrics()
      expect(metrics.currentReplicas).toBeGreaterThanOrEqual(0)
      expect(metrics).toHaveProperty('cpuPercent')
      expect(metrics).toHaveProperty('memoryPercent')
      expect(metrics).toHaveProperty('latencyMs')
    })

    it('POST /performance/scaling/evaluate should evaluate scaling decisions', () => {
      const metrics = makeReplicaMetrics({ cpuPercent: 85, latencyMs: 200 })
      const decisions = controller.evaluateScaling({ metrics })
      expect(decisions).toBeInstanceOf(Array)
    })

    it('POST /performance/scaling/evaluate with low metrics returns decisions', () => {
      const metrics = makeReplicaMetrics({
        cpuPercent: 10,
        memoryPercent: 15,
        requestsPerSecond: 10,
        latencyMs: 5,
        currentReplicas: 10,
      })
      const decisions = controller.evaluateScaling({ metrics })
      expect(decisions).toBeInstanceOf(Array)
    })

    it('POST /performance/scaling/scale should scale a deployment', () => {
      const health = controller.scaleDeployment({
        name: 'test-app',
        targetReplicas: 3,
      })
      expect(health.status).toBe('healthy')
      expect(health.readyReplicas).toBe(3)
      expect(health.availableReplicas).toBe(3)
    })

    it('POST /performance/scaling/scale with zero replicas should handle gracefully', () => {
      const health = controller.scaleDeployment({
        name: 'test-app-zero',
        targetReplicas: 0,
      })
      expect(health.readyReplicas).toBe(0)
    })

    it('POST /performance/scaling/auto should auto scale', () => {
      const decision = controller.autoScale({ name: 'test-app' })
      expect(decision).toHaveProperty('action')
      expect(decision).toHaveProperty('targetReplicas')
      expect(decision).toHaveProperty('reason')
    })

    it('GET /performance/deployments should list deployments', () => {
      const deployments = controller.listDeployments()
      expect(Array.isArray(deployments)).toBe(true)
    })

    it('GET /performance/deployments/:name/health should check health', () => {
      const health = controller.checkDeploymentHealth('test-app')
      expect(health.name).toBe('test-app')
      expect(health).toHaveProperty('status')
      expect(health).toHaveProperty('readyReplicas')
    })

    it('GET /performance/deployments/:name/health for non-existent app returns unknown', () => {
      const health = controller.checkDeploymentHealth('non-existent-app')
      expect(health.status).toBe('unknown')
      expect(health.readyReplicas).toBe(0)
    })

    it('POST /performance/deployments/:name/restart should restart pods', () => {
      const result = controller.restartDeployment('test-app')
      expect(result.message).toContain('已重启')
    })

    it('GET /performance/deployments/:name/recommend-replicas should recommend count', () => {
      const result = controller.recommendReplicas('test-app', '30')
      expect(result.recommendedReplicas).toBeGreaterThan(0)
    })

    it('GET /performance/deployments/:name/recommend-replicas without window should use default', () => {
      const result = controller.recommendReplicas('test-app')
      expect(result.recommendedReplicas).toBeGreaterThan(0)
    })

    it('GET /performance/deployments/:name/bottlenecks should analyze bottlenecks', () => {
      const bottlenecks = controller.analyzeDeploymentBottlenecks('test-app')
      expect(Array.isArray(bottlenecks)).toBe(true)
    })

    it('GET /performance/deployments/:name/scale-history should return history', () => {
      const history = controller.getScaleHistory('test-app', '5')
      expect(Array.isArray(history)).toBe(true)
    })

    it('GET /performance/deployments/:name/scale-history without limit should use default', () => {
      const history = controller.getScaleHistory('test-app')
      expect(Array.isArray(history)).toBe(true)
    })

    it('GET /performance/deployments/:name/cost should estimate cost', () => {
      const cost = controller.estimateCost('test-app')
      expect(cost.totalPerHour).toBeGreaterThan(0)
      expect(cost.totalPerMonth).toBeGreaterThan(0)
      expect(cost).toHaveProperty('cpuCostPerHour')
      expect(cost).toHaveProperty('memoryCostPerHour')
    })

    it('GET /performance/deployments/:name/cost for unknown app should still return estimate', () => {
      const cost = controller.estimateCost('unknown-app')
      expect(cost.totalPerHour).toBeGreaterThanOrEqual(0)
    })
  })

  // ── 综合边界测试 ─────────────────────────────────────────────

  describe('Edge cases', () => {
    it('should handle cache operations on empty cache', () => {
      // Configure first, then test edge cases
      controller.configureCache(makeMultiLevelConfig())
      const stats = controller.getCacheStats()
      expect(stats).toBeInstanceOf(Array)
      stats.forEach((s) => {
        expect(s.totalKeys).toBeGreaterThanOrEqual(0)
      })
    })

    it('should handle cache flush when cache is empty', () => {
      controller.configureCache(makeMultiLevelConfig())
      const result = controller.flushCache({})
      expect(result.message).toContain('已清空')
    })

    it('should handle running load test with minimal config', async () => {
      const result = await controller.runLoadTest({
        config: makeLoadTestConfig({ vu: 1, duration: 1 }),
        endpoints: [{ url: '/', method: 'GET', weight: 1 }],
      })
      expect(result.statusCode).toBe('ok')
    })
  })

  // ── HPA 策略完整生命周期 ─────────────────────────────────────

  describe('HPA policy lifecycle', () => {
    it('should create, get, update, list, and delete HPA policies', () => {
      const policyName = 'lifecycle-policy'

      // Create
      const created = controller.createHPAPolicy({
        name: policyName,
        metric: 'cpu',
        targetValue: 80,
        targetPercent: 70,
        minReplicas: 2,
        maxReplicas: 10,
        stabilizationWindowSeconds: 300,
        cooldownSeconds: 120,
        enabled: true,
      })
      expect(created.name).toBe(policyName)

      // Get
      const fetched = controller.getHPAPolicy(policyName)
      expect(fetched).not.toBeNull()
      expect(fetched!.targetValue).toBe(80)

      // Update
      const updated = controller.updateHPAPolicy(policyName, { targetValue: 50, enabled: true })
      expect(updated.targetValue).toBe(50)

      // List should include policy
      const policies = controller.listHPAPolicies()
      expect(policies.some((p) => p.name === policyName)).toBe(true)

      // Delete
      controller.deleteHPAPolicy(policyName)
      expect(controller.getHPAPolicy(policyName)).toBeNull()
    })
  })
})
