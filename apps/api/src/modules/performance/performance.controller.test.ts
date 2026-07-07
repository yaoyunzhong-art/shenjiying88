import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Test } from '@nestjs/testing'
import { PerformanceController } from './performance.controller'
import { PerformanceService } from './performance.service'
import { CacheTierService } from './cache-tier.service'
import { DBOptimizeService } from './db-optimize.service'
import { K6RunnerService } from './k6-runner.service'
import { K8sScaleService } from './k8s-scale.service'
import type {
  MultiLevelConfig, CacheStats, GlobalCacheStats,
  QueryAnalysis, IndexCandidate, PoolStats,
  LoadTestResult, HPAPolicy, ReplicaMetrics,
  ScalingDecision, DeploymentHealth, LoadTestConfig, LoadTestEndpoint,
} from './performance.entity'

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

  describe('Cache endpoints', () => {
    it('POST /performance/cache/configure should configure cache', () => {
      const config: MultiLevelConfig = {
        l1: { maxBytes: 1048576, evictionPolicy: 'lru', ttlMs: 60000 },
        l2: { maxBytes: 10485760, evictionPolicy: 'lfu', ttlMs: 300000, host: 'redis-1:6379' },
        l3: { maxBytes: 1073741824, evictionPolicy: 'ttl', ttlMs: 3600000, host: 'redis-2:6379' },
        readThrough: true,
        writeThrough: false,
        prefetchEnabled: true,
      }
      const result = controller.configureCache(config as any)
      expect(result.message).toContain('已应用')
    })

    it('GET /performance/cache/global-stats should return stats', () => {
      const stats = controller.getGlobalCacheStats()
      expect(stats).toBeDefined()
      expect(typeof stats.totalHits).toBe('number')
    })

    it('POST /performance/cache/set and get should work', () => {
      controller.setCache({ key: 'test:1', value: { name: 'test' } })
      const result = controller.getCache({ key: 'test:1' })
      expect(result.value).toEqual({ name: 'test' })
    })

    it('POST /performance/cache/has should check existence', () => {
      controller.setCache({ key: 'exists:1', value: 'data' })
      expect(controller.hasCache({ key: 'exists:1' }).exists).toBe(true)
      expect(controller.hasCache({ key: 'nonexistent' }).exists).toBe(false)
    })

    it('POST /performance/cache/flush with no tier should flush all', () => {
      const result = controller.flushCache({})
      expect(result.message).toContain('已清空')
    })

    it('POST /performance/cache/flush with specific tier should flush that tier', () => {
      const result = controller.flushCache({ tier: 'l1' as any })
      expect(result.message).toContain('(l1)')
    })
  })

  describe('DB optimization endpoints', () => {
    it('POST /performance/db/analyze should analyze a query', () => {
      const result = controller.analyzeQuery({ query: 'SELECT * FROM users' })
      expect(result.queryType).toBe('select')
      expect(result.recommendations).toBeDefined()
    })

    it('POST /performance/db/analyze-batch should analyze multiple queries', () => {
      const result = controller.analyzeQueries({
        queries: ['SELECT * FROM users', 'SELECT * FROM orders'],
      })
      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBe(2)
    })

    it('POST /performance/db/explain should generate execution plan', () => {
      const result = controller.explainQuery({ query: 'SELECT * FROM users WHERE id = 1' })
      expect(result.nodeType).toBeDefined()
      expect(result.warnings).toBeDefined()
    })

    it('POST /performance/db/rewrite should rewrite a query', () => {
      const result = controller.rewriteQuery({ query: 'SELECT * FROM users' })
      expect(result.rewritten).toBeDefined()
      expect(result.improvement).toBeDefined()
    })
  })

  describe('Load test endpoints', () => {
    it('GET /performance/load-test/realtime-metrics should return metrics', () => {
      const metrics = controller.getRealtimeMetrics()
      expect(metrics).toBeDefined()
    })

    it('GET /performance/load-test/result/:testId should return null for unknown ID', () => {
      const result = controller.getLoadTestResult('nonexistent')
      expect(result).toBeNull()
    })
  })

  describe('Scaling endpoints', () => {
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
    })

    it('GET /performance/metrics should collect metrics', () => {
      const metrics = controller.collectMetrics()
      expect(metrics.currentReplicas).toBeGreaterThanOrEqual(0)
    })

    it('POST /performance/scaling/scale should scale a deployment', () => {
      const health = controller.scaleDeployment({ name: 'test-app', targetReplicas: 3 })
      expect(health.status).toBe('healthy')
      expect(health.readyReplicas).toBe(3)
    })

    it('GET /performance/deployments should list deployments', () => {
      const deployments = controller.listDeployments()
      expect(Array.isArray(deployments)).toBe(true)
    })

    it('GET /performance/deployments/:name/health should check health', () => {
      const health = controller.checkDeploymentHealth('test-app')
      expect(health.name).toBe('test-app')
    })

    it('POST /performance/deployments/:name/restart should restart pods', () => {
      const result = controller.restartDeployment('test-app')
      expect(result.message).toContain('已重启')
    })

    it('GET /performance/deployments/:name/bottlenecks should analyze bottlenecks', () => {
      const bottlenecks = controller.analyzeDeploymentBottlenecks('test-app')
      expect(Array.isArray(bottlenecks)).toBe(true)
    })

    it('GET /performance/deployments/:name/cost should estimate cost', () => {
      const cost = controller.estimateCost('test-app')
      expect(cost.totalPerHour).toBeGreaterThan(0)
      expect(cost.totalPerMonth).toBeGreaterThan(0)
    })
  })

  describe('Error handling: unknown deployment', () => {
    it('should return unknown status for non-existent deployment health check', () => {
      const health = controller.checkDeploymentHealth('non-existent')
      expect(health.status).toBe('unknown')
      expect(health.readyReplicas).toBe(0)
    })
  })
})
