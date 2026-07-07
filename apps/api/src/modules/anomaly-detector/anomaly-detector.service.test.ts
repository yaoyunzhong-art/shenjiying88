import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
import { AnomalyDetectorService } from './anomaly-detector.service'
import type { TimeSeriesPoint } from '../time-series/time-series-collector.service'

function makeHistory(values: number[]): TimeSeriesPoint[] {
  return values.map((v, i) => ({
    timestamp: new Date(Date.now() - (values.length - i) * 60000).toISOString(),
    value: v,
  }))
}

describe('AnomalyDetectorService', () => {
  let service: AnomalyDetectorService

  beforeEach(() => {
    service = new AnomalyDetectorService()
  })

  describe('detect', () => {
    it('should return NORMAL for values within normal range', () => {
      const history = makeHistory([100, 101, 99, 100, 102, 98, 101, 99, 100, 101])
      const result = service.detect({
        metricKey: 'p95',
        value: 100,
        history,
      })
      expect(result.severity).toBe('NORMAL')
      expect(result.score).toBeLessThan(0.5)
      expect(result.detectors.threeSigma?.detected).toBe(false)
    })

    it('should detect clear outliers via 3-sigma', () => {
      const history = makeHistory([100, 101, 99, 100, 102, 98, 101, 99, 100, 101])
      const result = service.detect({
        metricKey: 'p95',
        value: 500,
        history,
      })
      expect(result.detectors.threeSigma?.detected).toBe(true)
      expect(result.detectors.threeSigma?.zScore).toBeGreaterThan(3)
      expect(['WARNING', 'CRITICAL']).toContain(result.severity)
    })

    it('should detect IQR outlier', () => {
      const history = makeHistory([10, 12, 11, 13, 12, 14, 11, 10, 13, 12])
      const result = service.detect({
        metricKey: 'p95',
        value: 100,
        history,
      })
      expect(result.detectors.iqr?.detected).toBe(true)
    })

    it('should detect EWMA drift', () => {
      const history = makeHistory([100, 100, 100, 100])
      service.detect({ metricKey: 'ewma-test', value: 100, history: [] })
      service.detect({ metricKey: 'ewma-test', value: 100, history: [] })
      const result = service.detect({
        metricKey: 'ewma-test',
        value: 500,
        history,
      })
      expect(result.detectors.ewma?.detected).toBe(true)
    })

    it('should respect whitelist', () => {
      service.configure({
        whitelist: [{ metricKey: 'known-peak', reason: 'Scheduled peak' }],
      })
      const history = makeHistory([100, 100, 100])
      const result = service.detect({
        metricKey: 'known-peak',
        value: 9999,
        history,
      })
      expect(result.whitelisted).toBe(true)
      expect(result.severity).toBe('NORMAL')
      expect(result.score).toBe(0)
    })

    it('should handle short history gracefully', () => {
      const history = makeHistory([50, 50])
      const result = service.detect({
        metricKey: 'short',
        value: 50,
        history,
      })
      expect(result.detectors.threeSigma?.detected).toBe(false)
      expect(result.detectors.iqr?.detected).toBe(false)
      expect(result.severity).toBe('NORMAL')
    })
  })

  describe('detectBatch', () => {
    it('should process multiple points', () => {
      service.detect({ metricKey: 'b', value: 100, history: [] })
      service.detect({ metricKey: 'b', value: 100, history: [] })

      const results = service.detectBatch({
        points: [
          { metricKey: 'a', value: 50, history: makeHistory([50, 50, 50]) },
          { metricKey: 'b', value: 200, history: makeHistory([100, 100, 100]) },
        ],
      })
      expect(results.length).toBe(2)
      expect(results[0].detectors.threeSigma?.detected).toBe(false)
      expect(results[1].detectors.ewma?.detected).toBe(true)
    })
  })

  describe('configure', () => {
    it('should apply custom config and maintain defaults for omitted fields', () => {
      service.configure({ sigmaThreshold: 2 })
      const history = makeHistory([100, 101, 99, 100, 102, 98, 101, 99, 100, 101])
      const result = service.detect({
        metricKey: 'custom',
        value: 115,
        history,
      })
      // With sigma 2, 115 might trigger (z ~ 2.5x)
      expect(result.detectors.threeSigma?.detected).toBe(true)
    })
  })

  describe('resetForTests', () => {
    it('should clear EWMA state and reset config', () => {
      service.detect({ metricKey: 'x', value: 999, history: [] })
      service.resetForTests()
      const history = makeHistory([100, 100, 100])
      const result = service.detect({
        metricKey: 'x',
        value: 999,
        history,
      })
      expect(result.detectors.ewma?.detected).toBe(false) // fresh state
    })
  })
})
