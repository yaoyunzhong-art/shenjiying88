import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'

import { AiRuleEngineController } from './ai-rule-engine.controller'
import { AiRuleEngineService } from './ai-rule-engine.service'

describe('AiRuleEngineController', () => {

  let controller: InstanceType<typeof AiRuleEngineController>
  let service: InstanceType<typeof AiRuleEngineService>

  beforeEach(() => {
    service = new AiRuleEngineService()
    controller = new AiRuleEngineController(service)
  })

  describe('route metadata', () => {
    it('controller path metadata should be ai-rule-engine', () => {
      const path = Reflect.getMetadata('path', AiRuleEngineController)
      assert.equal(path, 'ai-rule-engine')
    })

    it('evaluate route should have POST method and evaluate path', () => {
      const method = Reflect.getMetadata('method', AiRuleEngineController.prototype.evaluate)
      const path = Reflect.getMetadata('path', AiRuleEngineController.prototype.evaluate)

      assert.equal(method, 1) // POST
      assert.equal(path, 'evaluate')
    })

    it('evaluateMemberLevel route should have POST method', () => {
      const method = Reflect.getMetadata('method', AiRuleEngineController.prototype.evaluateMemberLevel)
      const path = Reflect.getMetadata('path', AiRuleEngineController.prototype.evaluateMemberLevel)

      assert.equal(method, 1) // POST
      assert.equal(path, 'evaluate/member-level')
    })

    it('detectDeviceAnomaly route should have POST method', () => {
      const method = Reflect.getMetadata('method', AiRuleEngineController.prototype.detectDeviceAnomaly)
      const path = Reflect.getMetadata('path', AiRuleEngineController.prototype.detectDeviceAnomaly)

      assert.equal(method, 1) // POST
      assert.equal(path, 'evaluate/device-anomaly')
    })

    it('evaluateBatch route should have POST method', () => {
      const method = Reflect.getMetadata('method', AiRuleEngineController.prototype.evaluateBatch)
      const path = Reflect.getMetadata('path', AiRuleEngineController.prototype.evaluateBatch)

      assert.equal(method, 1) // POST
      assert.equal(path, 'evaluate/batch')
    })

    it('getEngines route should have GET method', () => {
      const method = Reflect.getMetadata('method', AiRuleEngineController.prototype.getEngines)
      const path = Reflect.getMetadata('path', AiRuleEngineController.prototype.getEngines)

      assert.equal(method, 0) // GET
      assert.equal(path, 'engines')
    })

    it('evaluateRiskScore route should have POST method', () => {
      const method = Reflect.getMetadata('method', AiRuleEngineController.prototype.evaluateRiskScore)
      const path = Reflect.getMetadata('path', AiRuleEngineController.prototype.evaluateRiskScore)

      assert.equal(method, 1) // POST
      assert.equal(path, 'evaluate/risk-score')
    })
  })

  describe('POST /ai-rule-engine/evaluate (member-level)', () => {
    it('should evaluate member level for SVIP candidate', () => {
      const response = controller.evaluate({
        type: 'member-level',
        data: {
          memberId: 'mem-001',
          totalPoints: 6000,
          totalSpend: 15000,
          visitCount: 25,
          tenantId: 't-001'
        }
      })

      assert.equal(response.type, 'member-level')
      assert.ok(typeof response.timestamp === 'string')
      assert.ok(Date.parse(response.timestamp) > 0)

      const result = response.result as { suggestedLevel: string; memberId: string; triggeredRules: string[]; confidence: number }
      assert.equal(result.suggestedLevel, 'SVIP')
      assert.equal(result.memberId, 'mem-001')
      assert.ok(result.confidence > 0.7)
    })

    it('should evaluate member level for REGULAR member', () => {
      const response = controller.evaluate({
        type: 'member-level',
        data: {
          memberId: 'mem-002',
          totalPoints: 100,
          totalSpend: 200,
          visitCount: 5,
          tenantId: 't-001'
        }
      })

      assert.equal(response.type, 'member-level')

      const result = response.result as { suggestedLevel: string }
      assert.equal(result.suggestedLevel, 'REGULAR')
    })
  })

  describe('POST /ai-rule-engine/evaluate (device-anomaly)', () => {
    it('should detect CPU anomaly via evaluate endpoint', () => {
      const response = controller.evaluate({
        type: 'device-anomaly',
        data: {
          deviceId: 'dev-001',
          storeId: 'store-001',
          metrics: {
            cpuUsage: 95,
            memoryUsage: 50,
            diskUsage: 30,
            networkLatencyMs: 100,
            errorRate: 2,
            uptimeHours: 720
          },
          tenantId: 't-001'
        }
      })

      assert.equal(response.type, 'device-anomaly')

      const result = response.result as { isAnomaly: boolean; anomalyType: string; severity: string }
      assert.equal(result.isAnomaly, true)
      assert.equal(result.anomalyType, 'CPU_SPIKE')
    })

    it('should return no anomaly for healthy device', () => {
      const response = controller.evaluate({
        type: 'device-anomaly',
        data: {
          deviceId: 'dev-002',
          storeId: 'store-001',
          metrics: {
            cpuUsage: 30,
            memoryUsage: 40,
            diskUsage: 50,
            networkLatencyMs: 80,
            errorRate: 1,
            uptimeHours: 168
          },
          tenantId: 't-001'
        }
      })

      const result = response.result as { isAnomaly: boolean; severity: string }
      assert.equal(result.isAnomaly, false)
      assert.equal(result.severity, 'LOW')
    })
  })

  describe('POST /ai-rule-engine/evaluate/member-level', () => {
    it('should evaluate member level directly', () => {
      const response = controller.evaluateMemberLevel({
        memberId: 'direct-001',
        totalPoints: 6000,
        totalSpend: 12000,
        visitCount: 30,
        tenantId: 't-001'
      })

      assert.equal(response.type, 'member-level')

      const result = response.result as { suggestedLevel: string; triggeredRules: string[] }
      assert.equal(result.suggestedLevel, 'SVIP')
      assert.equal(result.triggeredRules.length, 3)
    })

    it('should handle minimal input', () => {
      const response = controller.evaluateMemberLevel({
        memberId: 'direct-002',
        totalPoints: 0,
        totalSpend: 0,
        visitCount: 0,
        tenantId: 't-001'
      })

      const result = response.result as { suggestedLevel: string; triggeredRules: string[] }
      assert.equal(result.suggestedLevel, 'REGULAR')
      assert.equal(result.triggeredRules.length, 0)
    })
  })

  describe('POST /ai-rule-engine/evaluate/device-anomaly', () => {
    it('should detect device anomaly directly', () => {
      const response = controller.detectDeviceAnomaly({
        deviceId: 'direct-dev-001',
        storeId: 'store-001',
        metrics: {
          cpuUsage: 92,
          memoryUsage: 88,
          diskUsage: 50,
          networkLatencyMs: 200,
          errorRate: 2,
          uptimeHours: 1000
        },
        tenantId: 't-001'
      })

      const result = response.result as { isAnomaly: boolean; severity: string }
      assert.equal(result.isAnomaly, true)
      assert.equal(result.severity, 'HIGH')
    })

    it('should return no anomaly for normal metrics', () => {
      const response = controller.detectDeviceAnomaly({
        deviceId: 'direct-dev-002',
        storeId: 'store-001',
        metrics: {
          cpuUsage: 20,
          memoryUsage: 30,
          diskUsage: 40,
          networkLatencyMs: 50,
          errorRate: 0.5,
          uptimeHours: 100
        },
        tenantId: 't-001'
      })

      const result = response.result as { isAnomaly: boolean }
      assert.equal(result.isAnomaly, false)
    })
  })

  describe('POST /ai-rule-engine/evaluate/batch', () => {
    it('should batch evaluate multiple member levels', () => {
      const response = controller.evaluateBatch({
        items: [
          {
            type: 'member-level',
            data: { memberId: 'batch-mem-001', totalPoints: 8000, totalSpend: 20000, visitCount: 50, tenantId: 't-001' }
          },
          {
            type: 'member-level',
            data: { memberId: 'batch-mem-002', totalPoints: 100, totalSpend: 200, visitCount: 3, tenantId: 't-001' }
          }
        ]
      })

      assert.equal(response.total, 2)
      assert.equal(response.succeeded, 2)
      assert.equal(response.failed, 0)
      assert.equal(response.items.length, 2)
      assert.equal(response.items[0].type, 'member-level')
      assert.equal(response.items[0].inputId, 'batch-mem-001')
      assert.ok(Date.parse(response.timestamp) > 0)
    })

    it('should batch evaluate mixed types (member + device)', () => {
      const response = controller.evaluateBatch({
        items: [
          {
            type: 'member-level',
            data: { memberId: 'mixed-mem', totalPoints: 6000, totalSpend: 12000, visitCount: 25, tenantId: 't-001' }
          },
          {
            type: 'device-anomaly',
            data: {
              deviceId: 'mixed-dev', storeId: 'store-1',
              metrics: { cpuUsage: 95, memoryUsage: 88, diskUsage: 92, networkLatencyMs: 600, errorRate: 7, uptimeHours: 100 },
              tenantId: 't-001'
            }
          },
          {
            type: 'device-anomaly',
            data: {
              deviceId: 'mixed-dev-healthy', storeId: 'store-1',
              metrics: { cpuUsage: 20, memoryUsage: 30, diskUsage: 40, networkLatencyMs: 50, errorRate: 0.5, uptimeHours: 200 },
              tenantId: 't-001'
            }
          }
        ]
      })

      assert.equal(response.total, 3)
      assert.equal(response.succeeded, 3)
      assert.equal(response.failed, 0)
      assert.equal(response.items[0].type, 'member-level')
      assert.equal(response.items[1].type, 'device-anomaly')
      assert.equal(response.items[2].type, 'device-anomaly')
    })

    it('should handle empty batch request', () => {
      const response = controller.evaluateBatch({ items: [] })

      assert.equal(response.total, 0)
      assert.equal(response.succeeded, 0)
      assert.equal(response.failed, 0)
      assert.equal(response.items.length, 0)
    })
  })

  describe('GET /ai-rule-engine/engines', () => {
    it('should return all engine statuses', () => {
      const engines = controller.getEngines()

      assert.ok(Array.isArray(engines))
      assert.ok(engines.length >= 3)

      const memberEngine = engines.find((e: { engineId: string }) => e.engineId === 'member-level-v1')
      assert.ok(memberEngine)
      assert.equal(memberEngine.engineName, 'Member Level Evaluator')
      assert.equal(memberEngine.conditionsCount, 3)
      assert.equal(memberEngine.actionsCount, 3)
      assert.equal(memberEngine.matchStrategy, 'ALL')

      const deviceEngine = engines.find((e: { engineId: string }) => e.engineId === 'device-anomaly-v1')
      assert.ok(deviceEngine)
      assert.equal(deviceEngine.engineName, 'Device Anomaly Detector')
      assert.equal(deviceEngine.matchStrategy, 'ANY')
      assert.equal(deviceEngine.conditionsCount, 5)

      const riskEngine = engines.find((e: { engineId: string }) => e.engineId === 'risk-score-v1')
      assert.ok(riskEngine)
      assert.equal(riskEngine.engineName, 'Risk Score Evaluator')
      assert.equal(riskEngine.conditionsCount, 5)
      assert.equal(riskEngine.actionsCount, 3)
    })

    it('engine status should include valid status values', () => {
      const engines = controller.getEngines()

      for (const engine of engines) {
        assert.ok(typeof engine.engineId === 'string')
        assert.ok(typeof engine.engineName === 'string')
        assert.ok(typeof engine.conditionsCount === 'number')
        assert.ok(typeof engine.actionsCount === 'number')
        assert.ok(['ALL', 'ANY'].includes(engine.matchStrategy))
        assert.ok(typeof engine.status === 'string')
      }
    })
  })

  describe('POST /ai-rule-engine/evaluate/risk-score', () => {
    it('should evaluate CRITICAL risk for flagged subject', () => {
      const response = controller.evaluateRiskScore({
        subjectId: 'risk-sub-001',
        subjectType: 'member',
        metrics: {
          refundCount: 5,
          abnormalPaymentCount: 4,
          deviceAnomalyCount: 2,
          complaintCount: 2,
          voidRefundAmount: 1000
        },
        tenantId: 't-001'
      })

      assert.equal(response.type, 'risk-score')
      assert.ok(typeof response.timestamp === 'string')
      assert.ok(Date.parse(response.timestamp) > 0)

      const result = response.result
      assert.equal(result.subjectId, 'risk-sub-001')
      assert.equal(result.riskLevel, 'CRITICAL')
      assert.ok(result.riskScore >= 70)
      assert.ok(result.triggeredRules.length >= 3)
      assert.ok(result.reasons.length >= 3)
      assert.ok(result.recommendations.length >= 3)
    })

    it('should report LOW risk for clean subject', () => {
      const response = controller.evaluateRiskScore({
        subjectId: 'risk-sub-002',
        subjectType: 'store',
        metrics: {
          refundCount: 0,
          abnormalPaymentCount: 0,
          complaintCount: 0
        },
        tenantId: 't-001'
      })

      assert.equal(response.type, 'risk-score')

      const result = response.result
      assert.equal(result.subjectId, 'risk-sub-002')
      assert.equal(result.riskLevel, 'LOW')
      assert.equal(result.riskScore, 0)
      assert.equal(result.triggeredRules.length, 0)
    })

    it('should report MEDIUM risk for single flag', () => {
      const response = controller.evaluateRiskScore({
        subjectId: 'risk-sub-003',
        subjectType: 'device',
        metrics: {
          refundCount: 3
        },
        tenantId: 't-001'
      })

      const result = response.result
      assert.equal(result.riskLevel, 'MEDIUM')
      assert.equal(result.riskScore, 25)
    })

    it('should cap risk score at 100', () => {
      const response = controller.evaluateRiskScore({
        subjectId: 'risk-sub-004',
        subjectType: 'member',
        metrics: {
          refundCount: 10,
          abnormalPaymentCount: 10,
          deviceAnomalyCount: 10,
          complaintCount: 10,
          voidRefundAmount: 10000
        },
        tenantId: 't-001'
      })

      const result = response.result
      assert.equal(result.riskScore, 100)
      assert.equal(result.riskLevel, 'CRITICAL')
    })
  })

  describe('error handling', () => {
    it('should throw for unsupported evaluation type', () => {
      assert.throws(
        () =>
          controller.evaluate({
            type: 'unsupported-type' as never,
            data: {}
          }),
        /Unsupported evaluation type/
      )
    })
  })
})
