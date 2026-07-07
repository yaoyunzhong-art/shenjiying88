import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
import {
  toAnomalyDetectResultContract,
  toPredictResultContract,
  toAttackDetectResultContract,
  toHealingActionResultContract,
  toAIOpsEngineStatusContract,
  toSystemHealthStatusContract,
} from './aiops.contract'
import type { AnomalyDetectResult, PredictResult, AttackDetectResult, HealingActionResult, AIOpsEngineStatus, SystemHealthStatus } from './aiops.entity'

describe('AIOps Contract Mappers', () => {
  describe('toAnomalyDetectResultContract', () => {
    it('should map normal result correctly', () => {
      const entity: AnomalyDetectResult = {
        metricName: 'cpu',
        isAnomaly: false,
        anomalyScore: 0.1,
        severity: 'NORMAL',
        baseline: 50,
        deviation: 2,
        detectedAt: '2026-01-01T00:00:00.000Z',
      }
      const contract = toAnomalyDetectResultContract(entity)
      expect(contract.metricName).toBe('cpu')
      expect(contract.isAnomaly).toBe(false)
      expect(contract.severity).toBe('NORMAL')
    })

    it('should map critical anomaly correctly', () => {
      const entity: AnomalyDetectResult = {
        metricName: 'fire',
        isAnomaly: true,
        anomalyScore: 0.99,
        anomalyType: 'spike',
        severity: 'CRITICAL',
        baseline: 1,
        deviation: 99,
        detectedAt: '2026-01-01T00:00:00.000Z',
        details: '紧急！检测到尖峰异常',
      }
      const contract = toAnomalyDetectResultContract(entity)
      expect(contract.isAnomaly).toBe(true)
      expect(contract.anomalyType).toBe('spike')
      expect(contract.details).toContain('尖峰')
    })
  })

  describe('toPredictResultContract', () => {
    it('should map predict result correctly', () => {
      const entity: PredictResult = {
        metricName: 'traffic',
        horizon: 5,
        predictedValues: [100, 105, 110, 115, 120],
        confidence: 0.85,
        predictedAt: '2026-01-01T00:00:00.000Z',
      }
      const contract = toPredictResultContract(entity)
      expect(contract.horizon).toBe(5)
      expect(contract.predictedValues).toHaveLength(5)
      expect(contract.confidence).toBe(0.85)
    })

    it('should map zero horizon result', () => {
      const entity: PredictResult = {
        metricName: 'empty',
        horizon: 0,
        predictedValues: [],
        confidence: 0,
        predictedAt: '2026-01-01T00:00:00.000Z',
      }
      const contract = toPredictResultContract(entity)
      expect(contract.predictedValues).toHaveLength(0)
      expect(contract.confidence).toBe(0)
    })
  })

  describe('toAttackDetectResultContract', () => {
    it('should map DDoS attack result', () => {
      const entity: AttackDetectResult = {
        metricName: 'api_gateway',
        isUnderAttack: true,
        confidence: 0.95,
        attackType: 'ddos',
        evidence: ['流量突增500%', '150次/分钟'],
        detectedAt: '2026-01-01T00:00:00.000Z',
      }
      const contract = toAttackDetectResultContract(entity)
      expect(contract.isUnderAttack).toBe(true)
      expect(contract.attackType).toBe('ddos')
      expect(contract.evidence).toHaveLength(2)
    })

    it('should map normal traffic result', () => {
      const entity: AttackDetectResult = {
        metricName: 'normal',
        isUnderAttack: false,
        confidence: 0.1,
        evidence: ['数据不足'],
        detectedAt: '2026-01-01T00:00:00.000Z',
      }
      const contract = toAttackDetectResultContract(entity)
      expect(contract.isUnderAttack).toBe(false)
      expect(contract.attackType).toBeUndefined()
    })
  })

  describe('toHealingActionResultContract', () => {
    it('should map completed healing action', () => {
      const entity: HealingActionResult = {
        id: 'heal-001',
        targetSystem: 'web-01',
        action: 'restart',
        status: 'completed',
        triggeredAt: '2026-01-01T00:00:00.000Z',
        completedAt: '2026-01-01T00:01:00.000Z',
        result: '自愈成功',
      }
      const contract = toHealingActionResultContract(entity)
      expect(contract.action).toBe('restart')
      expect(contract.status).toBe('completed')
      expect(contract.result).toBe('自愈成功')
    })

    it('should map pending healing action', () => {
      const entity: HealingActionResult = {
        id: 'heal-002',
        targetSystem: 'db-01',
        action: 'rollback',
        status: 'pending',
        triggeredAt: '2026-01-01T00:00:00.000Z',
      }
      const contract = toHealingActionResultContract(entity)
      expect(contract.status).toBe('pending')
      expect(contract.completedAt).toBeUndefined()
      expect(contract.result).toBeUndefined()
    })
  })

  describe('toAIOpsEngineStatusContract', () => {
    it('should map active engine status', () => {
      const entity: AIOpsEngineStatus = {
        engineName: 'AIOpsPredictionService',
        anomalyRulesCount: 3,
        attackRulesCount: 4,
        healedSystemsCount: 2,
        status: 'ACTIVE',
        lastDetectedAt: '2026-01-01T00:00:00.000Z',
      }
      const contract = toAIOpsEngineStatusContract(entity)
      expect(contract.status).toBe('ACTIVE')
      expect(contract.anomalyRulesCount).toBe(3)
      expect(contract.healedSystemsCount).toBe(2)
    })

    it('should map degraded engine status', () => {
      const entity: AIOpsEngineStatus = {
        engineName: 'AIOpsPredictionService',
        anomalyRulesCount: 0,
        attackRulesCount: 0,
        healedSystemsCount: 0,
        status: 'DEGRADED',
      }
      const contract = toAIOpsEngineStatusContract(entity)
      expect(contract.status).toBe('DEGRADED')
      expect(contract.lastDetectedAt).toBeUndefined()
    })
  })

  describe('toSystemHealthStatusContract', () => {
    it('should map healthy system', () => {
      const entity: SystemHealthStatus = {
        systemId: 'sys-01',
        status: 'healthy',
        lastCheck: '2026-01-01T00:00:00.000Z',
        metrics: { cpu: 30, mem: 50 },
        issues: [],
      }
      const contract = toSystemHealthStatusContract(entity)
      expect(contract.status).toBe('healthy')
      expect(contract.issues).toHaveLength(0)
    })

    it('should map critical system', () => {
      const entity: SystemHealthStatus = {
        systemId: 'sys-02',
        status: 'critical',
        lastCheck: '2026-01-01T00:00:00.000Z',
        metrics: { cpu: 99, mem: 98 },
        issues: ['CPU 99%', '内存 98%'],
      }
      const contract = toSystemHealthStatusContract(entity)
      expect(contract.status).toBe('critical')
      expect(contract.issues).toHaveLength(2)
    })
  })
})
