import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
// time-series.controller.test.ts - Phase-19 T27
// 用途: time-series Controller 单元测试
import { Test, TestingModule } from '@nestjs/testing'
import { TimeSeriesController } from './time-series.controller'
import { TimeSeriesCollectorService } from './time-series-collector.service'
import { TimeSeriesService } from './time-series.service'
import { RecordMetricDto, QueryMetricDto, RecordBatchDto, SeasonalityQueryDto, RegisterAlertRuleDto } from './time-series.dto'
import type { TimeSeriesPoint } from './time-series-collector.service'

describe('TimeSeriesController', () => {
  let controller: TimeSeriesController
  let service: TimeSeriesCollectorService
  let timeSeriesService: TimeSeriesService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TimeSeriesController],
      providers: [TimeSeriesCollectorService, TimeSeriesService],
    }).compile()

    controller = module.get<TimeSeriesController>(TimeSeriesController)
    service = module.get<TimeSeriesCollectorService>(TimeSeriesCollectorService)
    timeSeriesService = module.get<TimeSeriesService>(TimeSeriesService)
    service.resetForTests()
  })

  // ── POST /time-series/record ──

  describe('POST /time-series/record', () => {
    it('should record a metric and return ok', () => {
      const dto: RecordMetricDto = {
        metricName: 'test_metric',
        value: 42,
      }
      const result = controller.record(dto)
      expect(result).toEqual({ status: 'ok', metricName: 'test_metric' })
      // Verify data was stored
      const keys = service.listMetricKeys()
      expect(keys).toContain('test_metric:global')
    })

    it('should record with tenantId', () => {
      const dto: RecordMetricDto = {
        metricName: 'test_metric',
        tenantId: 'tenant-1',
        value: 100,
      }
      const result = controller.record(dto)
      expect(result).toEqual({ status: 'ok', metricName: 'test_metric' })
      const keys = service.listMetricKeys()
      expect(keys).toContain('test_metric:tenant-1')
    })

    it('should record with custom timestamp', () => {
      const dto: RecordMetricDto = {
        metricName: 'timed_metric',
        value: 55,
        timestamp: '2026-01-01T00:00:00.000Z',
      }
      const result = controller.record(dto)
      expect(result.status).toBe('ok')
    })
  })

  // ── POST /time-series/query ──

  describe('POST /time-series/query', () => {
    it('should query recorded metric within window', () => {
      // Record some data first
      service.recordMetric({ metricName: 'latency', value: 10 })
      service.recordMetric({ metricName: 'latency', value: 20 })
      service.recordMetric({ metricName: 'latency', value: 30 })

      const dto: QueryMetricDto = {
        metricName: 'latency',
        window: '24h' as const,
      }
      const result = controller.query(dto)
      expect(result.data.metricKey).toBe('latency:global')
      expect(result.data.points.length).toBe(3)
      expect(result.data.aggregate.avg).toBe(20)
      expect(result.data.aggregate.count).toBe(3)
      expect(result.data.seasonality).toBeGreaterThanOrEqual(0)
    })

    it('should return empty for unknown metric', () => {
      const dto: QueryMetricDto = {
        metricName: 'nonexistent',
        window: '1h' as const,
      }
      const result = controller.query(dto)
      expect(result.data.metricKey).toBe('nonexistent:global')
      expect(result.data.points).toEqual([])
      expect(result.data.aggregate.count).toBe(0)
    })

    it('should query with tenantId filter', () => {
      service.recordMetric({ metricName: 'perf', tenantId: 't1', value: 99 })
      const dto: QueryMetricDto = {
        metricName: 'perf',
        tenantId: 't1',
        window: '6h' as const,
      }
      const result = controller.query(dto)
      expect(result.data.tenantId).toBe('t1')
      expect(result.data.points.length).toBe(1)
    })
  })

  // ── POST /time-series/batch ──

  describe('POST /time-series/batch', () => {
    it('should record batch of samples', () => {
      const dto: RecordBatchDto = {
        samples: [
          { route: '/api/test', durationMs: 10 },
          { route: '/api/test', durationMs: 20 },
          { route: '/api/other', durationMs: 15 },
        ],
      }
      const result = controller.recordBatch(dto)
      expect(result.status).toBe('ok')
      expect(result.count).toBe(3)
      // Each route creates its own metric key
      const keys = service.listMetricKeys()
      expect(keys.length).toBe(2)
    })

    it('should handle empty batch', () => {
      const dto: RecordBatchDto = { samples: [] }
      const result = controller.recordBatch(dto)
      expect(result.status).toBe('ok')
      expect(result.count).toBe(0)
    })

    it('should record batch with tenant scoping', () => {
      const dto: RecordBatchDto = {
        samples: [
          { route: '/api/private', durationMs: 5, tenantId: 't1' },
          { route: '/api/public', durationMs: 3 },
        ],
      }
      const result = controller.recordBatch(dto)
      expect(result.count).toBe(2)
      const keys = service.listMetricKeys()
      expect(keys).toContain('/api/private:t1')
      expect(keys).toContain('/api/public:global')
    })
  })

  // ── POST /time-series/seasonality ──

  describe('POST /time-series/seasonality', () => {
    it('should detect seasonality for metric with data', () => {
      // Seed data across different hours
      const now = new Date('2026-06-01T00:00:00.000Z')
      for (let h = 0; h < 24; h++) {
        const ts = new Date(now.getTime() + h * 3600000).toISOString()
        service.recordMetric({ metricName: 'traffic', value: h * 10, timestamp: ts })
      }

      const dto: SeasonalityQueryDto = { metricName: 'traffic' }
      const result = controller.seasonality(dto)
      expect(result.data.daily.length).toBe(24)
      // Traffic was increasing, so daily values should be non-zero and increasing
      expect(result.data.daily[23]).toBeGreaterThan(result.data.daily[0])
    })

    it('should return zero patterns for unknown metric', () => {
      const dto: SeasonalityQueryDto = { metricName: 'unknown' }
      const result = controller.seasonality(dto)
      expect(result.data.daily).toEqual(expect.any(Array))
      expect(result.data.daily.every((v) => v === 0)).toBe(true)
    })
  })

  // ── GET /time-series/keys ──

  describe('GET /time-series/keys', () => {
    it('should list all metric keys', () => {
      service.recordMetric({ metricName: 'a', value: 1 })
      service.recordMetric({ metricName: 'b', value: 2 })
      const result = controller.listKeys()
      expect(result.data.keys).toContain('a:global')
      expect(result.data.keys).toContain('b:global')
      expect(result.data.keys.length).toBe(2)
    })

    it('should return empty list when no metrics recorded', () => {
      const result = controller.listKeys()
      expect(result.data.keys).toEqual([])
    })
  })

  // ── GET /time-series/status ──

  describe('GET /time-series/status', () => {
    it('should return collector status', () => {
      const result = controller.getStatus()
      expect(result.data.collectorName).toBe('TimeSeriesCollector')
      expect(result.data.status).toBe('ACTIVE')
      expect(result.data.uptimeMs).toBeGreaterThanOrEqual(0)
      expect(result.data.buffersCount).toBeGreaterThanOrEqual(0)
    })

    it('should report non-zero buffer count after recording', () => {
      service.recordMetric({ metricName: 'm1', value: 1 })
      service.recordMetric({ metricName: 'm2', value: 2 })
      const result = controller.getStatus()
      expect(result.data.buffersCount).toBe(2)
    })
  })

  // ── GET /time-series/alert-rules ──

  describe('GET /time-series/alert-rules', () => {
    it('should return empty list initially', () => {
      const result = controller.getAlertRules()
      expect(result.data).toEqual([])
    })

    it('should return registered rules', () => {
      controller.registerAlertRule({
        metricName: 'test_metric',
        operator: 'gt',
        threshold: 100,
        window: '1h',
      })
      const result = controller.getAlertRules()
      expect(result.data.length).toBe(1)
      expect(result.data[0].metricName).toBe('test_metric')
    })
  })

  // ── POST /time-series/alert-rules ──

  describe('POST /time-series/alert-rules', () => {
    it('should register a new alert rule', () => {
      const result = controller.registerAlertRule({
        metricName: 'latency',
        operator: 'gt',
        threshold: 500,
        window: '1h',
        description: 'High latency alert',
      })
      expect(result.id).toBe(0)
      expect(result.rule.metricName).toBe('latency')
      expect(result.rule.threshold).toBe(500)
      expect(result.rule.description).toBe('High latency alert')
    })

    it('should assign incrementing ids', () => {
      controller.registerAlertRule({ metricName: 'a', operator: 'gt', threshold: 1, window: '1h' })
      const result = controller.registerAlertRule({ metricName: 'b', operator: 'lt', threshold: 10, window: '6h' })
      expect(result.id).toBe(1)
    })
  })

  // ── DELETE /time-series/alert-rules/:id ──

  describe('DELETE /time-series/alert-rules/:id', () => {
    it('should remove an existing rule', () => {
      controller.registerAlertRule({ metricName: 'x', operator: 'gt', threshold: 50, window: '1h' })
      const result = controller.removeAlertRule('0')
      expect(result.removed).toBe(true)
    })

    it('should return false for invalid id', () => {
      const result = controller.removeAlertRule('999')
      expect(result.removed).toBe(false)
    })
  })

  // ── POST /time-series/alerts/evaluate ──

  describe('POST /time-series/alerts/evaluate', () => {
    it('should return empty when no rules triggered', () => {
      controller.registerAlertRule({ metricName: 'latency', operator: 'gt', threshold: 9999, window: '1h' })
      const result = controller.evaluateAlerts()
      expect(result.data).toEqual([])
    })

    it('should trigger alerts when threshold crossed', () => {
      controller.registerAlertRule({ metricName: 'error_rate', operator: 'gt', threshold: 5, window: '1h' })
      service.recordMetric({ metricName: 'error_rate', value: 10 })
      const result = controller.evaluateAlerts()
      expect(result.data.length).toBe(1)
      expect(result.data[0].rule.metricName).toBe('error_rate')
      expect(result.data[0].currentValue).toBe(10)
    })
  })

  // ── GET /time-series/summary ──

  describe('GET /time-series/summary', () => {
    it('should return zero metrics when empty', () => {
      const result = controller.getSummary()
      expect(result.data.totalMetrics).toBe(0)
      expect(result.data.totalPoints).toBe(0)
    })

    it('should aggregate metric summary correctly', () => {
      service.recordMetric({ metricName: 'cpu', value: 50 })
      service.recordMetric({ metricName: 'mem', value: 60 })
      const result = controller.getSummary()
      expect(result.data.totalMetrics).toBe(2)
      expect(result.data.totalPoints).toBe(2)
      expect(result.data.topMetricNames).toContain('cpu')
    })
  })

  // ── POST /time-series/compare ──

  describe('POST /time-series/compare', () => {
    it('should return 3 window comparisons', () => {
      service.recordMetric({ metricName: 'perf', value: 42 })
      const result = controller.compareWindows({ metricName: 'perf' })
      expect(result.data.length).toBe(3)
      result.data.forEach((c) => {
        expect(['1h', '6h', '24h']).toContain(c.window)
        expect(typeof c.avg).toBe('number')
      })
    })

    it('should return zeros for unknown metric', () => {
      const result = controller.compareWindows({ metricName: 'unknown' })
      expect(result.data.length).toBe(3)
      result.data.forEach((c) => expect(c.avg).toBe(0))
    })
  })
})
