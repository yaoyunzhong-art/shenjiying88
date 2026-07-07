import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
import type {
  AnomalySeverity,
  AnomalyDetectorConfig,
  ThreeSigmaResult,
  IqrResult,
  EwmaResult,
  AnomalyDetectors,
  AnomalyResult,
  AnomalyDetectInput,
  AnomalyDetectBatchInput,
  AnomalyEngineStatus,
  AnomalyAlert,
} from './anomaly-detector.entity'

describe('AnomalyDetector Entity Types', () => {
  describe('AnomalySeverity', () => {
    it('should allow valid severity values', () => {
      const normal: AnomalySeverity = 'NORMAL'
      const warning: AnomalySeverity = 'WARNING'
      const critical: AnomalySeverity = 'CRITICAL'
      expect(normal).toBe('NORMAL')
      expect(warning).toBe('WARNING')
      expect(critical).toBe('CRITICAL')
    })
  })

  describe('AnomalyDetectorConfig', () => {
    it('should create minimal config', () => {
      const config: AnomalyDetectorConfig = {}
      expect(config).toBeDefined()
    })

    it('should create full config with all fields', () => {
      const config: AnomalyDetectorConfig = {
        whitelist: [{ metricKey: 'p95', reason: 'known', ttlMs: 3600000 }],
        sigmaThreshold: 3,
        ewmaAlpha: 0.3,
        criticalThreshold: 0.9,
        warningThreshold: 0.7,
      }
      expect(config.whitelist).toHaveLength(1)
      expect(config.sigmaThreshold).toBe(3)
      expect(config.ewmaAlpha).toBe(0.3)
      expect(config.criticalThreshold).toBe(0.9)
      expect(config.warningThreshold).toBe(0.7)
    })
  })

  describe('ThreeSigmaResult', () => {
    it('should create detected result', () => {
      const result: ThreeSigmaResult = { zScore: 4.2, detected: true }
      expect(result.zScore).toBe(4.2)
      expect(result.detected).toBe(true)
    })

    it('should create normal result', () => {
      const result: ThreeSigmaResult = { zScore: 0.5, detected: false }
      expect(result.detected).toBe(false)
    })
  })

  describe('IqrResult', () => {
    it('should create with all fields', () => {
      const result: IqrResult = {
        lower: 10,
        upper: 90,
        deviation: 20,
        detected: true,
      }
      expect(result.lower).toBe(10)
      expect(result.upper).toBe(90)
      expect(result.deviation).toBe(20)
      expect(result.detected).toBe(true)
    })
  })

  describe('EwmaResult', () => {
    it('should create with all fields', () => {
      const result: EwmaResult = {
        expected: 100,
        deviation: 15,
        detected: false,
      }
      expect(result.expected).toBe(100)
      expect(result.deviation).toBe(15)
      expect(result.detected).toBe(false)
    })
  })

  describe('AnomalyDetectors', () => {
    it('should allow all three detectors present', () => {
      const detectors: AnomalyDetectors = {
        threeSigma: { zScore: 3.5, detected: true },
        iqr: { lower: 10, upper: 90, deviation: 25, detected: true },
        ewma: { expected: 100, deviation: 20, detected: true },
      }
      expect(detectors.threeSigma!.detected).toBe(true)
      expect(detectors.iqr!.detected).toBe(true)
      expect(detectors.ewma!.detected).toBe(true)
    })

    it('should allow some detectors undefined', () => {
      const detectors: AnomalyDetectors = {
        threeSigma: { zScore: 1.2, detected: false },
      }
      expect(detectors.threeSigma).toBeDefined()
      expect(detectors.iqr).toBeUndefined()
      expect(detectors.ewma).toBeUndefined()
    })
  })

  describe('AnomalyResult', () => {
    it('should create a full anomaly result', () => {
      const result: AnomalyResult = {
        metricKey: 'p95',
        value: 500,
        baseline: 100,
        deviation: 400,
        score: 0.95,
        severity: 'CRITICAL',
        detectors: {
          threeSigma: { zScore: 12.5, detected: true },
          iqr: { lower: 50, upper: 150, deviation: 350, detected: true },
        },
        whitelisted: false,
        reason: 'Value 500 exceeds 3-sigma threshold (z=12.5)',
        detectedAt: '2026-06-26T01:30:00.000Z',
      }
      expect(result.metricKey).toBe('p95')
      expect(result.score).toBe(0.95)
      expect(result.severity).toBe('CRITICAL')
      expect(result.whitelisted).toBe(false)
      expect(result.detectors.threeSigma!.zScore).toBe(12.5)
    })

    it('should create NORMAL result with low score', () => {
      const result: AnomalyResult = {
        metricKey: 'p50',
        value: 100,
        baseline: 100,
        deviation: 0,
        score: 0,
        severity: 'NORMAL',
        detectors: {},
        whitelisted: false,
        reason: 'Within normal range',
        detectedAt: '2026-06-26T01:30:00.000Z',
      }
      expect(result.severity).toBe('NORMAL')
      expect(result.score).toBe(0)
    })

    it('should support whitelisted result', () => {
      const result: AnomalyResult = {
        metricKey: 'errorRate',
        value: 0.15,
        baseline: 0.01,
        deviation: 0.14,
        score: 0.85,
        severity: 'WARNING',
        detectors: {
          threeSigma: { zScore: 3.2, detected: true },
        },
        whitelisted: true,
        reason: 'Whitelisted: known maintenance window',
        detectedAt: '2026-06-26T01:30:00.000Z',
      }
      expect(result.whitelisted).toBe(true)
      expect(result.severity).toBe('WARNING')
    })
  })

  describe('AnomalyDetectInput', () => {
    it('should create with required fields only', () => {
      const input: AnomalyDetectInput = {
        metricKey: 'cpu',
        value: 95,
        history: [
          { timestamp: '2026-06-26T01:00:00Z', value: 50 },
          { timestamp: '2026-06-26T01:05:00Z', value: 55 },
        ],
      }
      expect(input.metricKey).toBe('cpu')
      expect(input.history).toHaveLength(2)
      expect(input.timestamp).toBeUndefined()
    })

    it('should create with optional timestamp', () => {
      const input: AnomalyDetectInput = {
        metricKey: 'memory',
        value: 85,
        history: [{ timestamp: '2026-06-26T01:00:00Z', value: 60 }],
        timestamp: '2026-06-26T01:30:00Z',
      }
      expect(input.timestamp).toBe('2026-06-26T01:30:00Z')
    })
  })

  describe('AnomalyDetectBatchInput', () => {
    it('should create batch input with multiple points', () => {
      const input: AnomalyDetectBatchInput = {
        points: [
          { metricKey: 'cpu', value: 95, history: [] },
          { metricKey: 'memory', value: 80, history: [] },
        ],
      }
      expect(input.points).toHaveLength(2)
    })
  })

  describe('AnomalyEngineStatus', () => {
    it('should create ACTIVE status', () => {
      const status: AnomalyEngineStatus = {
        engineName: 'AnomalyDetector',
        rulesCount: 3,
        status: 'ACTIVE',
        lastEvaluationAt: '2026-06-26T01:30:00Z',
      }
      expect(status.status).toBe('ACTIVE')
    })

    it('should create DEGRADED status without lastEvaluationAt', () => {
      const status: AnomalyEngineStatus = {
        engineName: 'AnomalyDetector',
        rulesCount: 1,
        status: 'DEGRADED',
      }
      expect(status.status).toBe('DEGRADED')
      expect(status.lastEvaluationAt).toBeUndefined()
    })

    it('should create STOPPED status', () => {
      const status: AnomalyEngineStatus = {
        engineName: 'AnomalyDetector',
        rulesCount: 0,
        status: 'STOPPED',
      }
      expect(status.status).toBe('STOPPED')
    })
  })

  describe('AnomalyAlert', () => {
    it('should create unresolved alert', () => {
      const alert: AnomalyAlert = {
        id: 'alert-001',
        metricKey: 'p95',
        value: 500,
        score: 0.95,
        severity: 'CRITICAL',
        message: 'High p95 latency detected',
        detectedAt: '2026-06-26T01:30:00Z',
        acknowledged: false,
      }
      expect(alert.acknowledged).toBe(false)
      expect(alert.severity).toBe('CRITICAL')
    })

    it('should create acknowledged alert', () => {
      const alert: AnomalyAlert = {
        id: 'alert-002',
        metricKey: 'cpu',
        value: 90,
        score: 0.7,
        severity: 'WARNING',
        message: 'CPU usage elevated',
        detectedAt: '2026-06-26T01:00:00Z',
        acknowledged: true,
      }
      expect(alert.acknowledged).toBe(true)
    })

    it('should support NORMAL severity alert', () => {
      const alert: AnomalyAlert = {
        id: 'alert-003',
        metricKey: 'disk',
        value: 40,
        score: 0.1,
        severity: 'NORMAL',
        message: 'All clear',
        detectedAt: '2026-06-26T01:30:00Z',
        acknowledged: true,
      }
      expect(alert.severity).toBe('NORMAL')
      expect(alert.score).toBeLessThan(0.5)
    })
  })
})
