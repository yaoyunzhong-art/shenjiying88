import { describe, it, expect } from 'vitest'
import { AdvancedModelConfigService } from './ai-model-config-advanced.service'

describe('AdvancedModelConfigService', () => {
  const service = new AdvancedModelConfigService()

  describe('getVersionHistory', () => {
    it('should return version history sorted by release date desc', () => {
      const result = service.getVersionHistory('model-001')
      expect(result.length).toBeGreaterThan(0)
      expect(result[0].version).toBe('v3.0.0')
      expect(result[result.length - 1].version).toBe('v1.0.0')
    })

    it('should have status for each version', () => {
      const result = service.getVersionHistory('model-001')
      for (const v of result) {
        expect(['active', 'deprecated', 'sunset']).toContain(v.status)
      }
    })

    it('should return metrics for each version', () => {
      const result = service.getVersionHistory('model-001')
      for (const v of result) {
        expect(v.accuracy).toBeGreaterThan(0)
        expect(v.latencyP50).toBeGreaterThan(0)
      }
    })
  })

  describe('runBenchmark', () => {
    it('should return benchmark results', () => {
      const result = service.runBenchmark('model-001', 'v3.0.0')
      expect(result.modelId).toBe('model-001')
      expect(result.version).toBe('v3.0.0')
      expect(result.accuracy).toBeGreaterThan(0)
    })

    it('should include latency percentiles', () => {
      const result = service.runBenchmark('model-001', 'v3.0.0')
      expect(result.latencyP50).toBeLessThanOrEqual(result.latencyP95)
      expect(result.latencyP95).toBeLessThanOrEqual(result.latencyP99)
    })

    it('should record throughput and memory usage', () => {
      const result = service.runBenchmark('model-001', 'v3.0.0')
      expect(result.throughputRps).toBeGreaterThan(0)
      expect(result.memoryUsageMb).toBeGreaterThan(0)
    })
  })

  describe('analyzeCost', () => {
    it('should return cost analysis with trend', () => {
      const result = service.analyzeCost('model-001', '2026-07')
      expect(result.totalCost).toBeGreaterThan(0)
      expect(result.monthlyTrend.length).toBeGreaterThan(0)
      expect(result.projectedMonthlyCost).toBeGreaterThan(0)
    })

    it('should have cost breakdown summing to total', () => {
      const result = service.analyzeCost('model-001', '2026-07')
      const breakdownSum = Object.values(result.costBreakdown).reduce((s, v) => s + v, 0)
      expect(breakdownSum).toBe(result.totalCost)
    })
  })

  describe('getModelRegistry', () => {
    it('should return active models', () => {
      const result = service.getModelRegistry()
      expect(result.models.length).toBeGreaterThan(0)
      for (const m of result.models) {
        expect(m).toHaveProperty('modelId')
        expect(m).toHaveProperty('provider')
        expect(m).toHaveProperty('status')
      }
    })
  })

  describe('validateConfig', () => {
    it('should reject config without modelId', () => {
      const result = service.validateConfig({ temperature: 0.5 })
      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.field === 'modelId')).toBe(true)
    })

    it('should accept valid config', () => {
      const result = service.validateConfig({ modelId: 'claude-opus', temperature: 1.0 })
      expect(result.valid).toBe(true)
    })

    it('should warn on high temperature', () => {
      const result = service.validateConfig({ modelId: 'test', temperature: 2.5 })
      expect(result.errors.some((e) => e.field === 'temperature' && e.severity === 'warning')).toBe(true)
    })

    it('should handle empty config gracefully', () => {
      const result = service.validateConfig({})
      expect(result.valid).toBe(false)
    })
  })

  describe('getAlerts', () => {
    it('should return alerts with severity', () => {
      const result = service.getAlerts('model-001')
      expect(result.length).toBeGreaterThan(0)
      for (const alert of result) {
        expect(['info', 'warning', 'critical']).toContain(alert.severity)
      }
    })

    it('should have acknowledged flag', () => {
      const result = service.getAlerts('model-001')
      for (const alert of result) {
        expect(typeof alert.acknowledged).toBe('boolean')
      }
    })
  })

  describe('getPromptTemplates', () => {
    it('should return available templates', () => {
      const result = service.getPromptTemplates()
      expect(result.length).toBeGreaterThan(0)
      for (const t of result) {
        expect(t).toHaveProperty('id')
        expect(t).toHaveProperty('template')
        expect(t).toHaveProperty('variables')
      }
    })
  })

  describe('getRateLimitConfig', () => {
    it('should return rate limit for given tier', () => {
      const result = service.getRateLimitConfig('model-001', 'premium')
      expect(result.rps).toBeGreaterThan(0)
      expect(result.burstRps).toBeGreaterThan(result.rps)
    })
  })

  describe('getHealthStatus', () => {
    it('should return healthy status with latency', () => {
      const result = service.getHealthStatus('model-001')
      expect(['healthy', 'degraded', 'unhealthy']).toContain(result.overall)
      expect(result.uptime).toBeGreaterThan(99)
      expect(result.avgLatencyMs).toBeGreaterThan(0)
    })

    it('should have error rate >= 0', () => {
      const result = service.getHealthStatus('model-001')
      expect(result.errorRate).toBeGreaterThanOrEqual(0)
    })
  })
})
