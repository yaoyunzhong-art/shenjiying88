import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
import type {
  AnomalyDetectInput,
  AnomalyDetectResult,
  PredictInput,
  PredictResult,
  AttackDetectInput,
  AttackDetectResult,
  HealInput,
  HealingActionResult,
  SystemHealthStatus,
  AIOpsEngineStatus,
} from './aiops.entity'

describe('AIOps Entity Types', () => {
  describe('AnomalyDetectInput', () => {
    it('should create valid input with required fields', () => {
      const input: AnomalyDetectInput = {
        metricName: 'cpu_usage',
        value: 95,
        history: [{ timestamp: new Date().toISOString(), value: 50 }],
      }
      expect(input.metricName).toBe('cpu_usage')
      expect(input.value).toBe(95)
      expect(input.history).toHaveLength(1)
    })

    it('should accept optional timestamp', () => {
      const input: AnomalyDetectInput = {
        metricName: 'memory',
        value: 80,
        history: [],
        timestamp: new Date().toISOString(),
      }
      expect(input.timestamp).toBeDefined()
    })
  })

  describe('AnomalyDetectResult', () => {
    it('should represent a normal result', () => {
      const result: AnomalyDetectResult = {
        metricName: 'cpu_usage',
        isAnomaly: false,
        anomalyScore: 0.1,
        severity: 'NORMAL',
        baseline: 50,
        deviation: 5,
        detectedAt: new Date().toISOString(),
      }
      expect(result.isAnomaly).toBe(false)
      expect(result.severity).toBe('NORMAL')
    })

    it('should represent a critical anomaly', () => {
      const result: AnomalyDetectResult = {
        metricName: 'fire_alarm',
        isAnomaly: true,
        anomalyScore: 0.95,
        anomalyType: 'spike',
        severity: 'CRITICAL',
        baseline: 1,
        deviation: 99,
        detectedAt: new Date().toISOString(),
        details: '检测到尖峰异常',
      }
      expect(result.isAnomaly).toBe(true)
      expect(result.severity).toBe('CRITICAL')
      expect(result.anomalyType).toBe('spike')
      expect(result.details).toContain('尖峰')
    })

    it('should support all anomaly types', () => {
      const types: Array<'spike' | 'drop' | 'trend' | 'seasonal'> = ['spike', 'drop', 'trend', 'seasonal']
      for (const t of types) {
        const result: AnomalyDetectResult = {
          metricName: 'test',
          isAnomaly: true,
          anomalyScore: 0.8,
          anomalyType: t,
          severity: 'WARNING',
          baseline: 100,
          deviation: 20,
          detectedAt: new Date().toISOString(),
        }
        expect(result.anomalyType).toBe(t)
      }
    })
  })

  describe('PredictInput / PredictResult', () => {
    it('should create valid predict input', () => {
      const input: PredictInput = {
        metricName: 'requests',
        horizon: 5,
      }
      expect(input.metricName).toBe('requests')
      expect(input.horizon).toBe(5)
    })

    it('should create valid predict result', () => {
      const result: PredictResult = {
        metricName: 'requests',
        horizon: 3,
        predictedValues: [100, 105, 110],
        confidence: 0.85,
        predictedAt: new Date().toISOString(),
      }
      expect(result.predictedValues).toHaveLength(3)
      expect(result.confidence).toBeGreaterThan(0.5)
    })
  })

  describe('AttackDetectInput / AttackDetectResult', () => {
    it('should create valid attack detect input', () => {
      const input: AttackDetectInput = {
        metricName: 'api_gateway',
      }
      expect(input.metricName).toBe('api_gateway')
    })

    it('should create valid attack detect result', () => {
      const result: AttackDetectResult = {
        metricName: 'api_gateway',
        isUnderAttack: true,
        confidence: 0.9,
        attackType: 'ddos',
        evidence: ['请求量突增300%', '高频请求：150次/分钟'],
        detectedAt: new Date().toISOString(),
      }
      expect(result.isUnderAttack).toBe(true)
      expect(result.attackType).toBe('ddos')
      expect(result.evidence).toHaveLength(2)
    })

    it('should support all attack types', () => {
      const types: Array<'ddos' | 'brute_force' | 'data_exfil'> = ['ddos', 'brute_force', 'data_exfil']
      for (const t of types) {
        const result: AttackDetectResult = {
          metricName: 'test',
          isUnderAttack: true,
          confidence: 0.8,
          attackType: t,
          evidence: [`检测到${t}`],
          detectedAt: new Date().toISOString(),
        }
        expect(result.attackType).toBe(t)
      }
    })
  })

  describe('HealInput / HealingActionResult', () => {
    it('should create valid heal input', () => {
      const input: HealInput = {
        targetSystem: 'web-server-01',
      }
      expect(input.targetSystem).toBe('web-server-01')
    })

    it('should create valid healing action result', () => {
      const result: HealingActionResult = {
        id: 'heal-123456',
        targetSystem: 'web-server-01',
        action: 'restart',
        status: 'completed',
        triggeredAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        result: '自愈成功，系统状态: healthy',
      }
      expect(result.action).toBe('restart')
      expect(result.status).toBe('completed')
    })

    it('should support all action types', () => {
      const actions: HealingActionResult['action'][] = ['restart', 'rollback', 'scale', 'isolate']
      for (const action of actions) {
        const result: HealingActionResult = {
          id: `heal-${action}`,
          targetSystem: 'test',
          action,
          status: 'pending',
          triggeredAt: new Date().toISOString(),
        }
        expect(result.action).toBe(action)
      }
    })
  })

  describe('SystemHealthStatus', () => {
    it('should support all status values', () => {
      const statuses: SystemHealthStatus['status'][] = ['healthy', 'degraded', 'critical', 'unknown']
      for (const status of statuses) {
        const health: SystemHealthStatus = {
          systemId: 'sys-01',
          status,
          lastCheck: new Date().toISOString(),
          metrics: { cpu: 50, mem: 60 },
          issues: status === 'healthy' ? [] : ['some issue'],
        }
        expect(health.status).toBe(status)
      }
    })
  })

  describe('AIOpsEngineStatus', () => {
    it('should create valid engine status', () => {
      const status: AIOpsEngineStatus = {
        engineName: 'AIOpsPredictionService',
        anomalyRulesCount: 3,
        attackRulesCount: 4,
        healedSystemsCount: 5,
        status: 'ACTIVE',
        lastDetectedAt: new Date().toISOString(),
      }
      expect(status.engineName).toBe('AIOpsPredictionService')
      expect(status.anomalyRulesCount).toBe(3)
      expect(status.status).toBe('ACTIVE')
    })

    it('should support DEGRADED and STOPPED status', () => {
      const degraded: AIOpsEngineStatus = {
        engineName: 'AIOpsPredictionService',
        anomalyRulesCount: 0,
        attackRulesCount: 0,
        healedSystemsCount: 0,
        status: 'DEGRADED',
      }
      expect(degraded.status).toBe('DEGRADED')

      const stopped: AIOpsEngineStatus = {
        engineName: 'AIOpsPredictionService',
        anomalyRulesCount: 0,
        attackRulesCount: 0,
        healedSystemsCount: 0,
        status: 'STOPPED',
      }
      expect(stopped.status).toBe('STOPPED')
    })
  })
})
