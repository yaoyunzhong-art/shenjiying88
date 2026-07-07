import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
import { AnomalyDetectorController } from './anomaly-detector.controller'
import { AnomalyDetectorService } from './anomaly-detector.service'
import type { TimeSeriesPoint } from '../time-series/time-series-collector.service'

function makeHistory(values: number[]): TimeSeriesPoint[] {
  return values.map((v, i) => ({
    timestamp: new Date(Date.now() - (values.length - i) * 60000).toISOString(),
    value: v,
  }))
}

describe('AnomalyDetectorController', () => {
  let controller: AnomalyDetectorController
  let service: AnomalyDetectorService

  beforeEach(() => {
    service = new AnomalyDetectorService()
    controller = new AnomalyDetectorController(service)
  })

  describe('POST /anomaly-detector/detect', () => {
    it('should return NORMAL for normal input', () => {
      const history = makeHistory([100, 101, 99, 100, 102, 98, 101, 99, 100, 101])
      const result = controller.detect({
        metricKey: 'p95',
        value: 100,
        history,
      })
      expect(result.data.severity).toBe('NORMAL')
      expect(result.data.metricKey).toBe('p95')
      expect(result.data.score).toBeLessThan(0.5)
    })

    it('should detect anomaly for outlier', () => {
      const history = makeHistory([100, 101, 99, 100, 102, 98, 101, 99, 100, 101])
      const result = controller.detect({
        metricKey: 'p95',
        value: 500,
        history,
      })
      expect(result.data.severity).not.toBe('NORMAL')
      expect(result.data.score).toBeGreaterThan(0)
      expect(result.data.baseline).toBeGreaterThan(0)
    })

    it('should handle short history without error', () => {
      const history = makeHistory([50, 50])
      const result = controller.detect({
        metricKey: 'short',
        value: 50,
        history,
      })
      expect(result.data).toBeDefined()
      expect(result.data.severity).toBe('NORMAL')
    })

    it('should return correct deviated value for extreme input', () => {
      const history = makeHistory([100, 101, 99, 100, 102, 98, 101, 99, 100, 101])
      const result = controller.detect({
        metricKey: 'extreme',
        value: 9999,
        history,
      })
      expect(result.data.deviation).toBeGreaterThan(100)
      expect(result.data.severity).toBe('CRITICAL')
    })
  })

  describe('POST /anomaly-detector/detect/batch', () => {
    it('should process batch of points', () => {
      // Pre-warm EWMA for second point
      service.detect({ metricKey: 'b', value: 100, history: [] })
      service.detect({ metricKey: 'b', value: 100, history: [] })

      const result = controller.detectBatch({
        points: [
          { metricKey: 'a', value: 50, history: makeHistory([50, 50, 50]) },
          { metricKey: 'b', value: 200, history: makeHistory([100, 100, 100]) },
        ],
      })
      expect(result.data.length).toBe(2)
      expect(result.data[0].metricKey).toBe('a')
      expect(result.data[1].metricKey).toBe('b')
    })

    it('should handle empty points array', () => {
      const result = controller.detectBatch({
        points: [],
      })
      expect(result.data).toEqual([])
    })
  })

  describe('POST /anomaly-detector/configure', () => {
    it('should accept whitelist configuration', () => {
      const result = controller.configure({
        whitelist: [{ metricKey: 'known-peak', reason: 'Scheduled maintenance' }],
      })
      expect(result.status).toBe('ok')
      expect(result.applied).toContain('whitelist')
    })

    it('should accept sigma threshold configuration', () => {
      const result = controller.configure({
        sigmaThreshold: 2,
      })
      expect(result.status).toBe('ok')
      expect(result.applied).toContain('sigmaThreshold')
    })

    it('should accept empty configuration', () => {
      const result = controller.configure({})
      expect(result.status).toBe('ok')
      expect(result.applied).toEqual([])
    })
  })

  describe('GET /anomaly-detector/status', () => {
    it('should return engine status', () => {
      const result = controller.getStatus()
      expect(result.data.engineName).toBe('AnomalyDetector')
      expect(result.data.status).toBe('ACTIVE')
      expect(result.data.rulesCount).toBe(3)
    })
  })
})
