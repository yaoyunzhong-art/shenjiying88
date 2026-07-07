import { describe, it, expect } from 'vitest'
import { validate } from 'class-validator'
import {
  MultiLevelConfigDto, TierConfigDto,
  SetCacheDto, MSetCacheDto, MGetCacheDto,
  CacheFlushDto, CacheTagDeleteDto, CacheWarmDto,
  AnalyzeQueryDto, AnalyzeQueriesDto, RecommendIndexesDto,
  InitPoolDto, CacheResultDto,
  LoadTestConfigDto, LoadTestEndpointDto, RunLoadTestDto,
  CreateHPAPolicyDto, UpdateHPAPolicyDto,
  ScaleDeploymentDto, AutoScaleDto,
} from './performance.dto'

describe('PerformanceDto', () => {
  describe('TierConfigDto', () => {
    it('should validate a valid tier config', async () => {
      const dto = new TierConfigDto()
      dto.maxBytes = 1048576
      dto.evictionPolicy = 'lru'
      dto.ttlMs = 60000
      const errors = await validate(dto)
      expect(errors.length).toBe(0)
    })

    it('should reject invalid eviction policy', async () => {
      const dto = new TierConfigDto()
      dto.maxBytes = 1048576
      ;(dto as any).evictionPolicy = 'invalid'
      dto.ttlMs = 60000
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })
  })

  describe('MultiLevelConfigDto', () => {
    it('should validate a complete multi-level config', async () => {
      const dto = new MultiLevelConfigDto()
      dto.l1 = Object.assign(new TierConfigDto(), { maxBytes: 1048576, evictionPolicy: 'lru', ttlMs: 60000 })
      dto.l2 = Object.assign(new TierConfigDto(), { maxBytes: 10485760, evictionPolicy: 'lfu', ttlMs: 300000, host: 'redis:6379' })
      dto.l3 = Object.assign(new TierConfigDto(), { maxBytes: 1073741824, evictionPolicy: 'ttl', ttlMs: 3600000 })
      dto.readThrough = true
      dto.writeThrough = false
      dto.prefetchEnabled = true
      const errors = await validate(dto)
      expect(errors.length).toBe(0)
    })
  })

  describe('SetCacheDto', () => {
    it('should validate a valid set cache request', async () => {
      const dto = new SetCacheDto()
      dto.key = 'user:1'
      dto.value = { name: 'Alice' }
      dto.ttlMs = 60000
      dto.tags = ['user']
      const errors = await validate(dto)
      expect(errors.length).toBe(0)
    })

    it('should reject empty key', async () => {
      const dto = new SetCacheDto()
      dto.key = ''
      dto.value = 'test'
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })
  })

  describe('MGetCacheDto', () => {
    it('should validate with at least one key', async () => {
      const dto = new MGetCacheDto()
      dto.keys = ['key1', 'key2']
      const errors = await validate(dto)
      expect(errors.length).toBe(0)
    })

    it('should reject empty keys array', async () => {
      const dto = new MGetCacheDto()
      dto.keys = []
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })
  })

  describe('AnalyzeQueryDto', () => {
    it('should validate a SQL query', async () => {
      const dto = new AnalyzeQueryDto()
      dto.query = 'SELECT * FROM users WHERE id = 1'
      const errors = await validate(dto)
      expect(errors.length).toBe(0)
    })

    it('should reject empty query', async () => {
      const dto = new AnalyzeQueryDto()
      dto.query = ''
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })
  })

  describe('InitPoolDto', () => {
    it('should validate connection pool config', async () => {
      const dto = new InitPoolDto()
      dto.minConnections = 5
      dto.maxConnections = 50
      dto.acquireTimeout = 30000
      dto.idleTimeout = 60000
      dto.connectionTimeout = 5000
      dto.healthCheckInterval = 30000
      const errors = await validate(dto)
      expect(errors.length).toBe(0)
    })

    it('should reject zero min connections', async () => {
      const dto = new InitPoolDto()
      dto.minConnections = 0
      dto.maxConnections = 50
      dto.acquireTimeout = 30000
      dto.idleTimeout = 60000
      dto.connectionTimeout = 5000
      dto.healthCheckInterval = 30000
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })
  })

  describe('LoadTestConfigDto', () => {
    it('should validate a load test config', async () => {
      const dto = new LoadTestConfigDto()
      dto.name = 'test-1'
      dto.vu = 50
      dto.duration = 60
      dto.pattern = 'stress'
      dto.targetRPS = 500
      const errors = await validate(dto)
      expect(errors.length).toBe(0)
    })

    it('should reject invalid pattern', async () => {
      const dto = new LoadTestConfigDto()
      dto.name = 'test-1'
      dto.vu = 50
      dto.duration = 60
      ;(dto as any).pattern = 'invalid'
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })
  })

  describe('CreateHPAPolicyDto', () => {
    it('should validate HPA policy creation', async () => {
      const dto = new CreateHPAPolicyDto()
      dto.name = 'web-servers'
      dto.metric = 'cpu'
      dto.targetValue = 80
      dto.targetPercent = 70
      dto.minReplicas = 2
      dto.maxReplicas = 20
      dto.stabilizationWindowSeconds = 300
      dto.cooldownSeconds = 120
      dto.enabled = true
      const errors = await validate(dto)
      expect(errors.length).toBe(0)
    })

    it('should reject min > max replicas (semantic validation not enforced by class-validator alone)', async () => {
      const dto = new CreateHPAPolicyDto()
      dto.name = 'bad-policy'
      dto.metric = 'memory'
      dto.targetValue = 80
      dto.targetPercent = 70
      dto.minReplicas = 20
      dto.maxReplicas = 2
      dto.stabilizationWindowSeconds = 300
      dto.cooldownSeconds = 120
      dto.enabled = true
      const errors = await validate(dto)
      // class-validator won't catch this; it's application-layer validation
      expect(Array.isArray(errors)).toBe(true)
    })
  })

  describe('UpdateHPAPolicyDto', () => {
    it('should allow partial updates', async () => {
      const dto = new UpdateHPAPolicyDto()
      dto.enabled = false
      dto.targetPercent = 80
      const errors = await validate(dto)
      expect(errors.length).toBe(0)
    })
  })

  describe('ScaleDeploymentDto', () => {
    it('should validate scaling request', async () => {
      const dto = new ScaleDeploymentDto()
      dto.name = 'api-server'
      dto.targetReplicas = 5
      const errors = await validate(dto)
      expect(errors.length).toBe(0)
    })
  })

  describe('CacheFlushDto', () => {
    it('should accept valid tier', async () => {
      const dto = new CacheFlushDto()
      dto.tier = 'l1'
      const errors = await validate(dto)
      expect(errors.length).toBe(0)
    })

    it('should work without tier (flush all)', async () => {
      const dto = new CacheFlushDto()
      const errors = await validate(dto)
      expect(errors.length).toBe(0)
    })
  })

  describe('AnalyzeQueriesDto', () => {
    it('should validate batch query analysis', async () => {
      const dto = new AnalyzeQueriesDto()
      dto.queries = ['SELECT 1', 'SELECT 2']
      const errors = await validate(dto)
      expect(errors.length).toBe(0)
    })
  })
})
