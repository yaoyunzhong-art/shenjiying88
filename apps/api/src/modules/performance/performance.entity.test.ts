import { describe, it, expect } from 'vitest'
import type {
  CacheEntry, CacheStats, MultiLevelConfig, GlobalCacheStats,
  QueryAnalysis, QueryExecutionPlan, IndexCandidate, PoolStats,
  LoadTestConfig, LoadTestResult, AggregateMetrics,
  HPAPolicy, ReplicaMetrics, ScalingDecision, DeploymentHealth,
  ScaleHistoryEntry, CostEstimate, OptimizationSuggestion,
} from './performance.entity'

describe('PerformanceEntity', () => {
  describe('CacheEntry', () => {
    it('should allow creating a valid cache entry', () => {
      const entry: CacheEntry<{ name: string }> = {
        key: 'user:1',
        value: { name: 'Alice' },
        tier: 'l1',
        createdAt: new Date(),
        accessedAt: new Date(),
        accessCount: 1,
        sizeBytes: 128,
        ttlMs: 60000,
        tags: ['user'],
      }
      expect(entry.key).toBe('user:1')
      expect(entry.tier).toBe('l1')
      expect(entry.accessCount).toBeGreaterThan(0)
      expect(Array.isArray(entry.tags)).toBe(true)
    })

    it('should support optional fields being undefined', () => {
      const entry: CacheEntry = {
        key: 'temp',
        value: { data: 'test' },
        tier: 'l2',
        createdAt: new Date(),
        accessedAt: new Date(),
        accessCount: 0,
        sizeBytes: 64,
      }
      expect(entry.ttlMs).toBeUndefined()
      expect(entry.tags).toBeUndefined()
    })
  })

  describe('CacheStats', () => {
    it('should compute hit rate correctly', () => {
      const stats: CacheStats = {
        tier: 'l1',
        totalKeys: 100,
        totalBytes: 4096,
        hitCount: 80,
        missCount: 20,
        hitRate: 0.8,
        evictionCount: 5,
      }
      expect(stats.hitRate).toBeCloseTo(0.8)
      expect(stats.totalKeys).toBe(100)
    })

    it('should handle zero accesses', () => {
      const stats: CacheStats = {
        tier: 'l3',
        totalKeys: 0,
        totalBytes: 0,
        hitCount: 0,
        missCount: 0,
        hitRate: 0,
        evictionCount: 0,
      }
      expect(stats.hitRate).toBe(0)
    })
  })

  describe('MultiLevelConfig', () => {
    it('should define valid multi-level cache configuration', () => {
      const config: MultiLevelConfig = {
        l1: { maxBytes: 1048576, evictionPolicy: 'lru', ttlMs: 60000 },
        l2: { maxBytes: 10485760, evictionPolicy: 'lfu', ttlMs: 300000, host: 'redis-1:6379' },
        l3: { maxBytes: 1073741824, evictionPolicy: 'ttl', ttlMs: 3600000, host: 'redis-2:6379' },
        readThrough: true,
        writeThrough: false,
        prefetchEnabled: true,
      }
      expect(config.l1.evictionPolicy).toBe('lru')
      expect(config.l2.host).toBeDefined()
      expect(config.readThrough).toBe(true)
    })
  })

  describe('QueryAnalysis', () => {
    it('should represent a query analysis result', () => {
      const analysis: QueryAnalysis = {
        query: 'SELECT * FROM users WHERE status = 1',
        queryType: 'select',
        estimatedCost: 50,
        rowsExamined: 1000,
        rowsReturned: 100,
        executionTime: 25,
        recommendations: ['添加 WHERE 条件避免全表扫描'],
        indexUsed: 'idx_users_status',
        tableName: 'users',
      }
      expect(analysis.queryType).toBe('select')
      expect(analysis.recommendations.length).toBeGreaterThan(0)
    })
  })

  describe('QueryExecutionPlan', () => {
    it('should represent a query execution plan', () => {
      const plan: QueryExecutionPlan = {
        query: 'SELECT * FROM orders WHERE total > 100',
        nodeType: 'Seq Scan',
        estimatedCost: 100,
        estimatedRows: 500,
        actualRows: 450,
        actualTime: [0, 12.5],
        warnings: ['全表扫描，建议添加索引'],
      }
      expect(plan.nodeType).toBe('Seq Scan')
      expect(plan.warnings.length).toBe(1)
    })
  })

  describe('IndexCandidate', () => {
    it('should represent a recommended index', () => {
      const candidate: IndexCandidate = {
        tableName: 'orders',
        column: 'status',
        indexName: 'idx_orders_status',
        indexType: 'btree',
        selectivity: 0.25,
        estimatedSize: 8192,
        recommendation: 'create',
        reason: '选择率 25% 适合建索引',
      }
      expect(candidate.recommendation).toBe('create')
      expect(candidate.selectivity).toBeGreaterThan(0)
    })
  })

  describe('PoolStats', () => {
    it('should represent connection pool statistics', () => {
      const stats: PoolStats = {
        totalConnections: 20,
        activeConnections: 5,
        idleConnections: 15,
        waitingRequests: 0,
        avgAcquireTime: 2.5,
        avgQueryTime: 45.0,
        hitRate: 0.85,
        connectionErrors: 0,
      }
      expect(stats.totalConnections).toBe(20)
      expect(stats.activeConnections + stats.idleConnections).toBe(20)
    })
  })

  describe('LoadTestConfig', () => {
    it('should define a valid load test configuration', () => {
      const config: LoadTestConfig = {
        name: 'stress-test-1',
        vu: 50,
        duration: 120,
        pattern: 'stress',
        targetRPS: 500,
      }
      expect(config.pattern).toBe('stress')
      expect(config.vu).toBe(50)
    })
  })

  describe('AggregateMetrics', () => {
    it('should represent aggregated performance metrics', () => {
      const metrics: AggregateMetrics = {
        totalRequests: 10000,
        successfulRequests: 9800,
        failedRequests: 150,
        timeoutRequests: 50,
        avgResponseTime: 125.5,
        p50ResponseTime: 100,
        p95ResponseTime: 300,
        p99ResponseTime: 800,
        maxResponseTime: 2500,
        minResponseTime: 5,
        requestsPerSecond: 83.3,
        errorRate: 0.015,
        throughputBytesPerSec: 50000,
      }
      expect(metrics.errorRate).toBeLessThan(0.02)
      expect(metrics.p50ResponseTime).toBeLessThan(metrics.p99ResponseTime)
    })
  })

  describe('HPAPolicy', () => {
    it('should define an HPA policy', () => {
      const policy: HPAPolicy = {
        name: 'web-servers',
        metric: 'cpu',
        targetValue: 80,
        targetPercent: 70,
        minReplicas: 2,
        maxReplicas: 20,
        stabilizationWindowSeconds: 300,
        cooldownSeconds: 120,
        enabled: true,
      }
      expect(policy.metric).toBe('cpu')
      expect(policy.minReplicas).toBeLessThan(policy.maxReplicas)
    })
  })

  describe('ScalingDecision', () => {
    it('should represent a scaling decision', () => {
      const decision: ScalingDecision = {
        action: 'scale_up',
        targetReplicas: 10,
        reason: 'CPU usage exceeded threshold',
        currentMetrics: {} as ReplicaMetrics,
        triggeredBy: 'cpu',
        confidence: 0.85,
        cooldownRemainingSeconds: 0,
      }
      expect(decision.action).toBe('scale_up')
      expect(decision.confidence).toBeGreaterThan(0)
    })
  })

  describe('DeploymentHealth', () => {
    it('should represent deployment health status', () => {
      const health: DeploymentHealth = {
        name: 'api-server',
        status: 'healthy',
        readyReplicas: 5,
        availableReplicas: 5,
        unavailableReplicas: 0,
        conditions: [{ type: 'Ready', status: 'True' }],
        uptimePercent: 99.9,
      }
      expect(health.status).toBe('healthy')
      expect(health.unavailableReplicas).toBe(0)
    })
  })

  describe('CostEstimate', () => {
    it('should calculate monthly costs correctly', () => {
      const cost: CostEstimate = {
        cpuCostPerHour: 0.10,
        memoryCostPerHour: 0.05,
        totalPerHour: 0.15,
        totalPerMonth: 108.0,
      }
      expect(cost.totalPerHour).toBeCloseTo(0.15)
      expect(cost.totalPerMonth).toBeCloseTo(108.0)
    })
  })

  describe('GlobalCacheStats', () => {
    it('should compute overall hit rate', () => {
      const stats: GlobalCacheStats = {
        totalHits: 500,
        totalMisses: 100,
        overallHitRate: 0.833,
        totalKeys: 1000,
        totalBytes: 1024000,
      }
      expect(stats.overallHitRate).toBeGreaterThan(0.8)
    })
  })
})
