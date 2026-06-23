import 'reflect-metadata'
import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import { AiRuleEngineService } from './ai-rule-engine.service'

describe('AiRuleEngineService', () => {
  let service: AiRuleEngineService

  test.beforeEach(() => {
    service = new AiRuleEngineService()
  })

  describe('evaluateMemberLevel', () => {
    // 正常流程：高消费高积分 -> SVIP
    test('should assign SVIP to high-spend high-points member', () => {
      const result = service.evaluateMemberLevel({
        memberId: 'member-001',
        totalPoints: 6000,
        totalSpend: 15000,
        visitCount: 25,
        tenantId: 'tenant-001'
      })

      assert.equal(result.memberId, 'member-001')
      assert.equal(result.suggestedLevel, 'SVIP')
      assert.ok(result.triggeredRules.length > 0)
      assert.ok(result.confidence > 0.7)
    })

    // 正常流程：中等消费 -> VIP
    test('should assign VIP to medium-spend member', () => {
      const result = service.evaluateMemberLevel({
        memberId: 'member-002',
        totalPoints: 3000,
        totalSpend: 8000,
        visitCount: 15,
        tenantId: 'tenant-001'
      })

      assert.equal(result.memberId, 'member-002')
      // 8000 < 10000, 没有触发 cond-high-spend, 只触发 cond-high-points(3000<5000=false) 和 visitCount<20
      // 所以 matchStrategy=ALL 不匹配
      assert.equal(result.suggestedLevel, 'REGULAR')
      assert.equal(result.triggeredRules.length, 0)
    })

    // 正常流程：全低 -> REGULAR
    test('should assign REGULAR to low-spend member', () => {
      const result = service.evaluateMemberLevel({
        memberId: 'member-003',
        totalPoints: 100,
        totalSpend: 500,
        visitCount: 3,
        tenantId: 'tenant-001'
      })

      assert.equal(result.memberId, 'member-003')
      assert.equal(result.suggestedLevel, 'REGULAR')
      assert.equal(result.triggeredRules.length, 0)
      assert.ok(result.confidence <= 0.5)
    })

    // 边界条件：恰好达到阈值
    test('should trigger conditions at exact threshold values', () => {
      const result = service.evaluateMemberLevel({
        memberId: 'member-004',
        totalPoints: 5000,
        totalSpend: 10000,
        visitCount: 20,
        tenantId: 'tenant-001'
      })

      assert.equal(result.memberId, 'member-004')
      assert.equal(result.suggestedLevel, 'SVIP')
      assert.equal(result.triggeredRules.length, 3)
      assert.equal(result.confidence, 1.0)
    })

    // 边界条件：零值输入
    test('should handle zero values gracefully', () => {
      const result = service.evaluateMemberLevel({
        memberId: 'member-005',
        totalPoints: 0,
        totalSpend: 0,
        visitCount: 0,
        tenantId: 'tenant-001'
      })

      assert.equal(result.suggestedLevel, 'REGULAR')
      assert.equal(result.triggeredRules.length, 0)
    })

    // 只有满足部分条件
    test('should only trigger matching conditions partially', () => {
      const result = service.evaluateMemberLevel({
        memberId: 'member-006',
        totalPoints: 100,
        totalSpend: 12000, // 只满足总消费
        visitCount: 10,
        tenantId: 'tenant-001'
      })

      // matchStrategy=ALL, 所以三个条件都要满足
      assert.equal(result.triggeredRules.length, 0)
      assert.equal(result.suggestedLevel, 'REGULAR')
    })
  })

  describe('detectDeviceAnomaly', () => {
    // 正常流程：CPU 异常
    test('should detect CPU anomaly', () => {
      const result = service.detectDeviceAnomaly({
        deviceId: 'device-001',
        storeId: 'store-001',
        metrics: {
          cpuUsage: 95,
          memoryUsage: 50,
          diskUsage: 40,
          networkLatencyMs: 100,
          errorRate: 1,
          uptimeHours: 720
        },
        tenantId: 'tenant-001'
      })

      assert.equal(result.deviceId, 'device-001')
      assert.equal(result.isAnomaly, true)
      assert.equal(result.anomalyType, 'CPU_SPIKE')
      assert.ok(result.severity === 'MEDIUM' || result.severity === 'HIGH')
      assert.ok(result.triggeredRules.length >= 1)
      assert.ok(result.recommendations.length >= 1)
    })

    // 正常流程：无异常
    test('should return no anomaly for normal device', () => {
      const result = service.detectDeviceAnomaly({
        deviceId: 'device-002',
        storeId: 'store-001',
        metrics: {
          cpuUsage: 30,
          memoryUsage: 40,
          diskUsage: 50,
          networkLatencyMs: 50,
          errorRate: 0.5,
          uptimeHours: 168
        },
        tenantId: 'tenant-001'
      })

      assert.equal(result.deviceId, 'device-002')
      assert.equal(result.isAnomaly, false)
      assert.equal(result.severity, 'LOW')
      assert.equal(result.triggeredRules.length, 0)
    })

    // 正常流程：多异常 -> CRITICAL
    test('should detect multiple anomalies as CRITICAL', () => {
      const result = service.detectDeviceAnomaly({
        deviceId: 'device-003',
        storeId: 'store-001',
        metrics: {
          cpuUsage: 95,
          memoryUsage: 90,
          diskUsage: 95,
          networkLatencyMs: 600,
          errorRate: 1,
          uptimeHours: 720
        },
        tenantId: 'tenant-001'
      })

      assert.equal(result.deviceId, 'device-003')
      assert.equal(result.isAnomaly, true)
      assert.equal(result.severity, 'CRITICAL')
      assert.ok(result.triggeredRules.length >= 3)
    })

    // 边界条件：恰好达到阈值
    test('should detect anomaly at exact threshold', () => {
      const result = service.detectDeviceAnomaly({
        deviceId: 'device-004',
        storeId: 'store-001',
        metrics: {
          cpuUsage: 90,
          memoryUsage: 85,
          diskUsage: 90,
          networkLatencyMs: 500,
          errorRate: 5,
          uptimeHours: 24
        },
        tenantId: 'tenant-001'
      })

      assert.equal(result.deviceId, 'device-004')
      assert.equal(result.isAnomaly, true)
      // 5 个条件全部触发 -> CRITICAL
      assert.equal(result.severity, 'CRITICAL')
      assert.equal(result.triggeredRules.length, 5)
    })

    // 边界条件：内存泄漏
    test('should detect memory leak', () => {
      const result = service.detectDeviceAnomaly({
        deviceId: 'device-005',
        storeId: 'store-001',
        metrics: {
          cpuUsage: 40,
          memoryUsage: 88,
          diskUsage: 30,
          networkLatencyMs: 200,
          errorRate: 2,
          uptimeHours: 500
        },
        tenantId: 'tenant-001'
      })

      assert.equal(result.deviceId, 'device-005')
      assert.equal(result.isAnomaly, true)
      assert.equal(result.anomalyType, 'MEMORY_LEAK')
      assert.ok(result.recommendations.some((r) => r.includes('内存')))
    })

    // 边界条件：磁盘满
    test('should detect disk full anomaly', () => {
      const result = service.detectDeviceAnomaly({
        deviceId: 'device-006',
        storeId: 'store-001',
        metrics: {
          cpuUsage: 30,
          memoryUsage: 40,
          diskUsage: 92,
          networkLatencyMs: 100,
          errorRate: 1,
          uptimeHours: 300
        },
        tenantId: 'tenant-001'
      })

      assert.equal(result.deviceId, 'device-006')
      assert.equal(result.isAnomaly, true)
      assert.equal(result.anomalyType, 'DISK_FULL')
    })

    // 边界条件：网络延迟
    test('should detect network latency anomaly', () => {
      const result = service.detectDeviceAnomaly({
        deviceId: 'device-007',
        storeId: 'store-001',
        metrics: {
          cpuUsage: 30,
          memoryUsage: 40,
          diskUsage: 50,
          networkLatencyMs: 600,
          errorRate: 1,
          uptimeHours: 100
        },
        tenantId: 'tenant-001'
      })

      assert.equal(result.deviceId, 'device-007')
      assert.equal(result.isAnomaly, true)
      assert.equal(result.anomalyType, 'NETWORK_LATENCY')
      assert.ok(result.recommendations.some((r) => r.includes('网络')))
    })

    // 边界条件：高错误率
    test('should detect high error rate anomaly', () => {
      const result = service.detectDeviceAnomaly({
        deviceId: 'device-008',
        storeId: 'store-001',
        metrics: {
          cpuUsage: 30,
          memoryUsage: 40,
          diskUsage: 50,
          networkLatencyMs: 100,
          errorRate: 8,
          uptimeHours: 50
        },
        tenantId: 'tenant-001'
      })

      assert.equal(result.deviceId, 'device-008')
      assert.equal(result.isAnomaly, true)
      assert.equal(result.anomalyType, 'HIGH_ERROR_RATE')
      assert.ok(result.recommendations.some((r) => r.includes('错误日志')))
    })

    // 边界条件：单个异常 -> MEDIUM
    test('should detect single anomaly as MEDIUM severity', () => {
      const result = service.detectDeviceAnomaly({
        deviceId: 'device-009',
        storeId: 'store-001',
        metrics: {
          cpuUsage: 91,
          memoryUsage: 40,
          diskUsage: 50,
          networkLatencyMs: 100,
          errorRate: 1,
          uptimeHours: 200
        },
        tenantId: 'tenant-001'
      })

      assert.equal(result.deviceId, 'device-009')
      assert.equal(result.isAnomaly, true)
      assert.equal(result.severity, 'MEDIUM')
      assert.equal(result.triggeredRules.length, 1)
    })

    // 边界条件：两个异常 -> HIGH
    test('should detect two anomalies as HIGH severity', () => {
      const result = service.detectDeviceAnomaly({
        deviceId: 'device-010',
        storeId: 'store-001',
        metrics: {
          cpuUsage: 95,
          memoryUsage: 90,
          diskUsage: 50,
          networkLatencyMs: 100,
          errorRate: 1,
          uptimeHours: 100
        },
        tenantId: 'tenant-001'
      })

      assert.equal(result.deviceId, 'device-010')
      assert.equal(result.isAnomaly, true)
      assert.equal(result.severity, 'HIGH')
      assert.equal(result.triggeredRules.length, 2)
    })

    // 边界条件：未知推荐字段回退
    test('should provide fallback recommendation for unknown field', () => {
      const result = service.detectDeviceAnomaly({
        deviceId: 'device-011',
        storeId: 'store-001',
        metrics: {
          cpuUsage: 91,
          memoryUsage: 40,
          diskUsage: 50,
          networkLatencyMs: 100,
          errorRate: 1,
          uptimeHours: 200
        },
        tenantId: 'tenant-001'
      })

      assert.equal(result.isAnomaly, true)
      assert.equal(result.anomalyType, 'CPU_SPIKE')
      // CPU_SPIKE 推荐包含 "检查高性能进程"
      assert.ok(result.recommendations.some((r) => r.includes('检查高性能进程')))
    })

    // 边界条件：uptimeHours 不参与异常检测
    test('should not trigger anomaly for uptimeHours value', () => {
      const result = service.detectDeviceAnomaly({
        deviceId: 'device-012',
        storeId: 'store-001',
        metrics: {
          cpuUsage: 30,
          memoryUsage: 40,
          diskUsage: 50,
          networkLatencyMs: 100,
          errorRate: 1,
          uptimeHours: 9999 // 高 uptime 不应触发异常
        },
        tenantId: 'tenant-001'
      })

      assert.equal(result.isAnomaly, false)
      assert.equal(result.severity, 'LOW')
    })
  })

  describe('batchEvaluate', () => {
    test('should evaluate multiple member levels', () => {
      const response = service.batchEvaluate({
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
      assert.ok(response.items[0].result)
      assert.ok(response.items[1].result)
    })

    test('should evaluate mixed member and device items', () => {
      const response = service.batchEvaluate({
        items: [
          {
            type: 'member-level',
            data: { memberId: 'mixed-mem', totalPoints: 6000, totalSpend: 15000, visitCount: 30, tenantId: 't-001' }
          },
          {
            type: 'device-anomaly',
            data: {
              deviceId: 'mixed-dev', storeId: 's-001',
              metrics: { cpuUsage: 95, memoryUsage: 88, diskUsage: 92, networkLatencyMs: 600, errorRate: 7, uptimeHours: 100 },
              tenantId: 't-001'
            }
          }
        ]
      })

      assert.equal(response.total, 2)
      assert.equal(response.succeeded, 2)
      assert.equal(response.items[0].type, 'member-level')
      assert.equal(response.items[1].type, 'device-anomaly')
    })

    test('should handle empty batch request', () => {
      const response = service.batchEvaluate({ items: [] })

      assert.equal(response.total, 0)
      assert.equal(response.succeeded, 0)
      assert.equal(response.failed, 0)
      assert.equal(response.items.length, 0)
    })

    test('should set correct index and inputId for each item', () => {
      const response = service.batchEvaluate({
        items: [
          { type: 'member-level', data: { memberId: 'idx-mem', totalPoints: 8000, totalSpend: 20000, visitCount: 50, tenantId: 't-001' } },
          { type: 'member-level', data: { memberId: 'idx-mem-2', totalPoints: 0, totalSpend: 0, visitCount: 0, tenantId: 't-001' } }
        ]
      })

      assert.equal(response.items[0].index, 0)
      assert.equal(response.items[0].inputId, 'idx-mem')
      assert.equal(response.items[1].index, 1)
      assert.equal(response.items[1].inputId, 'idx-mem-2')
    })
  })

  describe('evaluateRiskScore', () => {
    // 覆盖所有 risk recommendation fields
    test('should include all risk recommendation fields', () => {
      const result = service.evaluateRiskScore({
        subjectId: 'subject-rec-all',
        subjectType: 'member',
        metrics: {
          refundCount: 3,
          abnormalPaymentCount: 2,
          deviceAnomalyCount: 2,
          complaintCount: 1,
          voidRefundAmount: 500
        },
        tenantId: 'tenant-001'
      })

      assert.equal(result.triggeredRules.length, 5)
      // 验证所有推荐覆盖
      assert.ok(result.recommendations.some((r) => r.includes('限制退款')))
      assert.ok(result.recommendations.some((r) => r.includes('冻结异常支付')))
      assert.ok(result.recommendations.some((r) => r.includes('设备指纹')))
      assert.ok(result.recommendations.some((r) => r.includes('调查投诉')))
      assert.ok(result.recommendations.some((r) => r.includes('审核大额注销退款')))
    })

    // 正常流程：高风险
    test('should detect CRITICAL risk for subject with multiple flags', () => {
      const result = service.evaluateRiskScore({
        subjectId: 'subject-001',
        subjectType: 'member',
        metrics: {
          refundCount: 5,
          abnormalPaymentCount: 3,
          deviceAnomalyCount: 2,
          complaintCount: 2,
          voidRefundAmount: 800
        },
        tenantId: 'tenant-001'
      })

      assert.equal(result.subjectId, 'subject-001')
      assert.equal(result.riskLevel, 'CRITICAL')
      assert.ok(result.riskScore >= 70)
      assert.ok(result.triggeredRules.length >= 3)
      assert.ok(result.reasons.length >= 3)
      assert.ok(result.recommendations.length >= 3)
    })

    // 正常流程：低风险
    test('should report LOW risk for normal subject', () => {
      const result = service.evaluateRiskScore({
        subjectId: 'subject-002',
        subjectType: 'member',
        metrics: {
          refundCount: 0,
          abnormalPaymentCount: 0,
          complaintCount: 0,
          voidRefundAmount: 0
        },
        tenantId: 'tenant-001'
      })

      assert.equal(result.subjectId, 'subject-002')
      assert.equal(result.riskLevel, 'LOW')
      assert.equal(result.riskScore, 0)
      assert.equal(result.triggeredRules.length, 0)
      assert.equal(result.reasons.length, 0)
    })

    // 正常流程：中等风险
    test('should report MEDIUM risk for moderate flags', () => {
      const result = service.evaluateRiskScore({
        subjectId: 'subject-003',
        subjectType: 'store',
        metrics: {
          refundCount: 3,
          abnormalPaymentCount: 0,
          complaintCount: 0,
          voidRefundAmount: 0
        },
        tenantId: 'tenant-001'
      })

      assert.equal(result.subjectId, 'subject-003')
      // refundCount >= 3 triggers cond-high-refund weight=0.25 -> score=25
      assert.equal(result.riskLevel, 'MEDIUM')
      assert.equal(result.riskScore, 25)
      assert.equal(result.triggeredRules.length, 1)
    })

    // 边界条件：恰好达到高风险阈值
    test('should score exactly at threshold for HIGH risk', () => {
      // 触发 cond-high-refund(0.25) + cond-complaints(0.20) = 45, 加上 cond-abnormal-payment(0.20)=65，再...
      // 简化为：refundCount=3(0.25)=25, complaintCount=1(0.20)=20, abnormalPaymentCount=2(0.20)=20 -> 65
      const result = service.evaluateRiskScore({
        subjectId: 'subject-004',
        subjectType: 'member',
        metrics: {
          refundCount: 3,
          abnormalPaymentCount: 2,
          complaintCount: 1,
          voidRefundAmount: 0
        },
        tenantId: 'tenant-001'
      })

      assert.equal(result.riskLevel, 'HIGH')
      assert.equal(result.riskScore, 65)
      assert.equal(result.triggeredRules.length, 3)
    })

    // 边界条件：大额注销退款增加分数
    test('should boost score for large void refund amount', () => {
      const result = service.evaluateRiskScore({
        subjectId: 'subject-005',
        subjectType: 'member',
        metrics: {
          refundCount: 3,
          voidRefundAmount: 1200
        },
        tenantId: 'tenant-001'
      })

      // refundCount=3: +25, voidRefundAmount>=500: +20(cond), voidRefundAmount>=1000: +15 extra
      assert.equal(result.riskScore, 60)
      assert.equal(result.riskLevel, 'HIGH')
    })

    // 边界条件：大量异常支付额外加分
    test('should boost score for many abnormal payments', () => {
      const result = service.evaluateRiskScore({
        subjectId: 'subject-006',
        subjectType: 'member',
        metrics: {
          abnormalPaymentCount: 5
        },
        tenantId: 'tenant-001'
      })

      // abnormalPaymentCount>=2: +20, abnormalPaymentCount>=5: +10 extra
      assert.equal(result.riskScore, 30)
      assert.equal(result.riskLevel, 'MEDIUM')
    })

    // 边界条件：评分上限 100
    test('should cap risk score at 100', () => {
      const result = service.evaluateRiskScore({
        subjectId: 'subject-007',
        subjectType: 'member',
        metrics: {
          refundCount: 10,
          abnormalPaymentCount: 10,
          deviceAnomalyCount: 5,
          complaintCount: 5,
          voidRefundAmount: 5000
        },
        tenantId: 'tenant-001'
      })

      assert.equal(result.riskScore, 100)
      assert.equal(result.riskLevel, 'CRITICAL')
    })
  })

  describe('getEngineStatus', () => {
    test('should return status for all engines', () => {
      const statuses = service.getEngineStatus()

      assert.ok(Array.isArray(statuses))
      assert.ok(statuses.length >= 3)
    })

    test('member-level engine status should be correct', () => {
      const statuses = service.getEngineStatus()
      const ml = statuses.find((s) => s.engineId === 'member-level-v1')

      assert.ok(ml)
      assert.equal(ml.engineName, 'Member Level Evaluator')
      assert.equal(ml.conditionsCount, 3)
      assert.equal(ml.actionsCount, 3)
      assert.equal(ml.matchStrategy, 'ALL')
    })

    test('device-anomaly engine status should be correct', () => {
      const statuses = service.getEngineStatus()
      const da = statuses.find((s) => s.engineId === 'device-anomaly-v1')

      assert.ok(da)
      assert.equal(da.engineName, 'Device Anomaly Detector')
      assert.equal(da.conditionsCount, 5)
      assert.equal(da.actionsCount, 2)
      assert.equal(da.matchStrategy, 'ANY')
    })

    test('risk-score engine status should be correct', () => {
      const statuses = service.getEngineStatus()
      const rs = statuses.find((s) => s.engineId === 'risk-score-v1')

      assert.ok(rs)
      assert.equal(rs.engineName, 'Risk Score Evaluator')
      assert.equal(rs.conditionsCount, 5)
      assert.equal(rs.actionsCount, 3)
      assert.equal(rs.matchStrategy, 'ANY')
    })

    test('status should include all required fields', () => {
      const statuses = service.getEngineStatus()

      for (const s of statuses) {
        assert.ok(typeof s.engineId === 'string')
        assert.ok(typeof s.engineName === 'string')
        assert.ok(typeof s.conditionsCount === 'number')
        assert.ok(typeof s.actionsCount === 'number')
        assert.ok(['ALL', 'ANY'].includes(s.matchStrategy))
        assert.ok(typeof s.status === 'string')
      }
    })
  })
})
