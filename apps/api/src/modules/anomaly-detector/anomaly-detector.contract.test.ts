import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
/**
 * anomaly-detector.contract.test.ts
 * 异常检测合约映射单元测试
 */
import {
  toAnomalyResultContract,
  toAnomalyEngineStatusContract,
  toAnomalyAlertContract,
  toAnomalyBatchResultContract,
  toAnomalyResultContracts,
  toAnomalyAlertContracts,
} from './anomaly-detector.contract'
import type {
  AnomalyResult,
  AnomalyEngineStatus,
  AnomalyAlert,
} from './anomaly-detector.entity'

function makeAnomalyResult(overrides: Partial<AnomalyResult> = {}): AnomalyResult {
  return {
    metricKey: 'test-metric',
    value: 100,
    baseline: 50,
    deviation: 50,
    score: 0.85,
    severity: 'CRITICAL',
    detectors: {
      threeSigma: { zScore: 5.2, detected: true },
      iqr: { lower: 30, upper: 70, deviation: 30, detected: true },
      ewma: { expected: 52, deviation: 48, detected: true },
    },
    whitelisted: false,
    reason: '3σ anomaly detected',
    detectedAt: '2026-06-26T11:27:00.000Z',
    ...overrides,
  }
}

function makeAnomalyEngineStatus(overrides: Partial<AnomalyEngineStatus> = {}): AnomalyEngineStatus {
  return {
    engineName: 'AnomalyDetector',
    rulesCount: 3,
    status: 'ACTIVE',
    lastEvaluationAt: '2026-06-26T11:27:00.000Z',
    ...overrides,
  }
}

function makeAnomalyAlert(overrides: Partial<AnomalyAlert> = {}): AnomalyAlert {
  return {
    id: 'alert-001',
    metricKey: 'cpu-usage',
    value: 95,
    score: 0.92,
    severity: 'CRITICAL',
    message: 'CPU usage critically high',
    detectedAt: '2026-06-26T11:27:00.000Z',
    acknowledged: false,
    ...overrides,
  }
}

describe('AnomalyDetectorContract', () => {
  describe('toAnomalyResultContract', () => {
    it('should map a full AnomalyResult to contract shape', () => {
      const entity = makeAnomalyResult()
      const contract = toAnomalyResultContract(entity)

      expect(contract.metricKey).toBe('test-metric')
      expect(contract.value).toBe(100)
      expect(contract.baseline).toBe(50)
      expect(contract.deviation).toBe(50)
      expect(contract.score).toBe(0.85)
      expect(contract.severity).toBe('CRITICAL')
      expect(contract.whitelisted).toBe(false)
      expect(contract.reason).toBe('3σ anomaly detected')
      expect(contract.detectedAt).toBe('2026-06-26T11:27:00.000Z')

      // detectors
      expect(contract.detectors.threeSigma).toBeDefined()
      expect(contract.detectors.threeSigma!.zScore).toBe(5.2)
      expect(contract.detectors.threeSigma!.detected).toBe(true)
      expect(contract.detectors.iqr).toBeDefined()
      expect(contract.detectors.iqr!.lower).toBe(30)
      expect(contract.detectors.iqr!.upper).toBe(70)
      expect(contract.detectors.ewma).toBeDefined()
      expect(contract.detectors.ewma!.expected).toBe(52)

      // ensure no extra fields leak through
      const keys = Object.keys(contract).sort()
      expect(keys).toEqual(['baseline', 'detectedAt', 'detectors', 'deviation', 'metricKey', 'reason', 'score', 'severity', 'value', 'whitelisted'])
    })

    it('should handle undefined detectors gracefully', () => {
      const entity = makeAnomalyResult({ detectors: {} })
      const contract = toAnomalyResultContract(entity)

      expect(contract.detectors.threeSigma).toBeUndefined()
      expect(contract.detectors.iqr).toBeUndefined()
      expect(contract.detectors.ewma).toBeUndefined()
    })

    it('should map partial threeSigma-only detector', () => {
      const entity = makeAnomalyResult({
        detectors: { threeSigma: { zScore: 3.1, detected: true } },
      })
      const contract = toAnomalyResultContract(entity)

      expect(contract.detectors.threeSigma).toBeDefined()
      expect(contract.detectors.threeSigma!.zScore).toBe(3.1)
      expect(contract.detectors.iqr).toBeUndefined()
      expect(contract.detectors.ewma).toBeUndefined()
    })

    it('should preserve severity value NORMAL', () => {
      const entity = makeAnomalyResult({ severity: 'NORMAL', score: 0 })
      const contract = toAnomalyResultContract(entity)
      expect(contract.severity).toBe('NORMAL')
    })

    it('should preserve severity value WARNING', () => {
      const entity = makeAnomalyResult({ severity: 'WARNING', score: 0.6 })
      const contract = toAnomalyResultContract(entity)
      expect(contract.severity).toBe('WARNING')
    })
  })

  describe('toAnomalyEngineStatusContract', () => {
    it('should map engine status with all fields', () => {
      const entity = makeAnomalyEngineStatus()
      const contract = toAnomalyEngineStatusContract(entity)

      expect(contract.engineName).toBe('AnomalyDetector')
      expect(contract.rulesCount).toBe(3)
      expect(contract.status).toBe('ACTIVE')
      expect(contract.lastEvaluationAt).toBe('2026-06-26T11:27:00.000Z')
    })

    it('should handle missing lastEvaluationAt', () => {
      const entity = makeAnomalyEngineStatus({ lastEvaluationAt: undefined })
      const contract = toAnomalyEngineStatusContract(entity)
      expect(contract.lastEvaluationAt).toBeUndefined()
    })

    it('should handle DEGRADED and STOPPED status', () => {
      const degraded = toAnomalyEngineStatusContract(makeAnomalyEngineStatus({ status: 'DEGRADED' }))
      expect(degraded.status).toBe('DEGRADED')

      const stopped = toAnomalyEngineStatusContract(makeAnomalyEngineStatus({ status: 'STOPPED' }))
      expect(stopped.status).toBe('STOPPED')
    })
  })

  describe('toAnomalyAlertContract', () => {
    it('should map alert with all fields', () => {
      const entity = makeAnomalyAlert()
      const contract = toAnomalyAlertContract(entity)

      expect(contract.id).toBe('alert-001')
      expect(contract.metricKey).toBe('cpu-usage')
      expect(contract.value).toBe(95)
      expect(contract.score).toBe(0.92)
      expect(contract.severity).toBe('CRITICAL')
      expect(contract.message).toBe('CPU usage critically high')
      expect(contract.acknowledged).toBe(false)
    })

    it('should map acknowledged alert', () => {
      const entity = makeAnomalyAlert({ acknowledged: true })
      const contract = toAnomalyAlertContract(entity)
      expect(contract.acknowledged).toBe(true)
    })

    it('should handle WARNING severity alert', () => {
      const entity = makeAnomalyAlert({ severity: 'WARNING', score: 0.55 })
      const contract = toAnomalyAlertContract(entity)
      expect(contract.severity).toBe('WARNING')
      expect(contract.score).toBe(0.55)
    })
  })

  describe('toAnomalyBatchResultContract', () => {
    it('should map multiple results with counts', () => {
      const results = [
        makeAnomalyResult({ metricKey: 'cpu', severity: 'CRITICAL', score: 0.9 }),
        makeAnomalyResult({ metricKey: 'mem', severity: 'NORMAL', score: 0.1 }),
        makeAnomalyResult({ metricKey: 'disk', severity: 'WARNING', score: 0.6 }),
      ]
      const contract = toAnomalyBatchResultContract(results)

      expect(contract.results).toHaveLength(3)
      expect(contract.totalCount).toBe(3)
      expect(contract.anomalyCount).toBe(2) // CRITICAL + WARNING
      expect(contract.timestamp).toBeDefined()
      expect(contract.results[0].metricKey).toBe('cpu')
      expect(contract.results[1].metricKey).toBe('mem')
      expect(contract.results[2].metricKey).toBe('disk')
    })

    it('should handle empty results array', () => {
      const contract = toAnomalyBatchResultContract([])
      expect(contract.results).toHaveLength(0)
      expect(contract.totalCount).toBe(0)
      expect(contract.anomalyCount).toBe(0)
    })

    it('should handle all NORMAL results (anomalyCount = 0)', () => {
      const results = [
        makeAnomalyResult({ metricKey: 'cpu', severity: 'NORMAL', score: 0 }),
        makeAnomalyResult({ metricKey: 'mem', severity: 'NORMAL', score: 0 }),
      ]
      const contract = toAnomalyBatchResultContract(results)
      expect(contract.anomalyCount).toBe(0)
    })
  })

  describe('toAnomalyResultContracts (batch mapping)', () => {
    it('should map all results preserving order', () => {
      const entities = [
        makeAnomalyResult({ metricKey: 'a', value: 10 }),
        makeAnomalyResult({ metricKey: 'b', value: 20 }),
        makeAnomalyResult({ metricKey: 'c', value: 30 }),
      ]
      const contracts = toAnomalyResultContracts(entities)

      expect(contracts).toHaveLength(3)
      expect(contracts[0].metricKey).toBe('a')
      expect(contracts[0].value).toBe(10)
      expect(contracts[1].metricKey).toBe('b')
      expect(contracts[1].value).toBe(20)
      expect(contracts[2].metricKey).toBe('c')
      expect(contracts[2].value).toBe(30)
    })
  })

  describe('toAnomalyAlertContracts (batch mapping)', () => {
    it('should map all alerts preserving order', () => {
      const entities = [
        makeAnomalyAlert({ id: 'alert-1' }),
        makeAnomalyAlert({ id: 'alert-2', severity: 'WARNING' }),
      ]
      const contracts = toAnomalyAlertContracts(entities)

      expect(contracts).toHaveLength(2)
      expect(contracts[0].id).toBe('alert-1')
      expect(contracts[1].id).toBe('alert-2')
      expect(contracts[1].severity).toBe('WARNING')
    })
  })
})
