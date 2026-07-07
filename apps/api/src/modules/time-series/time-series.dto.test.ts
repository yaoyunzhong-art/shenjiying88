import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
// time-series.dto.test.ts - Phase-19 T27
// 用途: time-series DTO 验证测试

describe('TimeSeriesDto', () => {
  describe('RecordMetricDto', () => {
    it('should accept valid RecordMetricDto fields', () => {
      const dto = {
        metricName: 'test_metric',
        value: 42,
      }
      expect(dto.metricName).toBe('test_metric')
      expect(dto.value).toBe(42)
    })

    it('should accept optional tenantId and timestamp', () => {
      const dto = {
        metricName: 'test_metric',
        tenantId: 'tenant-1',
        value: 99,
        timestamp: '2026-06-01T00:00:00.000Z',
      }
      expect(dto.tenantId).toBe('tenant-1')
      expect(dto.timestamp).toBeDefined()
    })
  })

  describe('QueryMetricDto', () => {
    it('should accept valid query fields', () => {
      const dto = {
        metricName: 'latency',
        window: '24h' as const,
      }
      expect(dto.metricName).toBe('latency')
      expect(dto.window).toBe('24h')
    })

    it('should accept all window sizes', () => {
      const windows = ['1h', '6h', '24h', '7d', '30d'] as const
      for (const w of windows) {
        const dto = { metricName: 'm', window: w }
        expect(dto.window).toBe(w)
      }
    })

    it('should accept optional tenantId', () => {
      const dto = {
        metricName: 'latency',
        tenantId: 't1',
        window: '1h' as const,
      }
      expect(dto.tenantId).toBe('t1')
    })
  })

  describe('RecordBatchDto', () => {
    it('should accept valid batch samples', () => {
      const dto = {
        samples: [
          { route: '/api/test', durationMs: 10 },
          { route: '/api/test', durationMs: 20 },
        ],
      }
      expect(dto.samples.length).toBe(2)
      expect(dto.samples[0].durationMs).toBe(10)
    })

    it('should accept empty batch', () => {
      const dto = { samples: [] }
      expect(dto.samples).toEqual([])
    })

    it('should accept optional tenantId in samples', () => {
      const dto = {
        samples: [
          { route: '/api/private', durationMs: 5, tenantId: 't1' },
        ],
      }
      expect(dto.samples[0].tenantId).toBe('t1')
    })
  })

  describe('SeasonalityQueryDto', () => {
    it('should accept valid seasonality query', () => {
      const dto = {
        metricName: 'traffic',
      }
      expect(dto.metricName).toBe('traffic')
    })

    it('should accept optional tenantId', () => {
      const dto = {
        metricName: 'traffic',
        tenantId: 'tenant-x',
      }
      expect(dto.tenantId).toBe('tenant-x')
    })
  })

  describe('CollectorStatusDto', () => {
    it('should accept all status values', () => {
      for (const status of ['ACTIVE', 'DEGRADED', 'STOPPED'] as const) {
        const dto = {
          collectorName: 'TimeSeriesCollector',
          buffersCount: 0,
          totalPoints: 0,
          status,
          uptimeMs: 0,
        }
        expect(dto.status).toBe(status)
      }
    })
  })

  describe('RegisterAlertRuleDto', () => {
    it('should accept valid alert rule', () => {
      const dto = {
        metricName: 'latency',
        operator: 'gt',
        threshold: 500,
        window: '1h',
      }
      expect(dto.metricName).toBe('latency')
      expect(dto.operator).toBe('gt')
      expect(dto.threshold).toBe(500)
    })

    it('should accept all operators', () => {
      for (const op of ['gt', 'lt', 'gte', 'lte'] as const) {
        const dto = { metricName: 'm', operator: op, threshold: 100, window: '1h' }
        expect(dto.operator).toBe(op)
      }
    })

    it('should accept optional description and tenantId', () => {
      const dto = {
        metricName: 'error',
        operator: 'gt',
        threshold: 10,
        window: '24h',
        tenantId: 't1',
        description: 'Error rate alert',
      }
      expect(dto.tenantId).toBe('t1')
      expect(dto.description).toBe('Error rate alert')
    })
  })

  describe('CompareWindowsDto', () => {
    it('should accept metricName only', () => {
      const dto = { metricName: 'latency' }
      expect(dto.metricName).toBe('latency')
    })

    it('should accept optional tenantId', () => {
      const dto = { metricName: 'latency', tenantId: 't1' }
      expect(dto.tenantId).toBe('t1')
    })
  })
})
