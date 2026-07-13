/**
 * ai-rule-engine-ringbeam.test.ts - V17#圈梁 Phase3 AI模块
 * 用途: PRD对齐测试 - 验证规则引擎评分/成员等级/设备异常/风险评分及模拟器
 * 覆盖: 正例(等级评估+设备检测+风险评分) + 反例(无匹配/无效引擎/空批量) + 边界(模拟器变异/引擎配置更新/重置)
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { AiRuleEngineService } from './ai-rule-engine.service'
import type { SimulatorRunInput } from './ai-rule-engine.entity'

describe('🔵 AiRuleEngineRingBeam: 规则引擎PRD对齐', () => {
  let ruleEngine: AiRuleEngineService

  beforeEach(() => {
    ruleEngine = new AiRuleEngineService()
  })

  // ─── 1. 会员等级评估 ────────────────────────────────────────────

  describe('会员等级评估', () => {
    it('[P0] 高消费高积分会员评估为SVIP', () => {
      const result = ruleEngine.evaluateMemberLevel({
        memberId: 'member-svip',
        totalSpend: 15000,
        totalPoints: 10000,
        visitCount: 50,
        tenantId: 'tenant-001',
      })

      expect(result.memberId).toBe('member-svip')
      expect(result.suggestedLevel).toBe('SVIP')
      expect(result.triggeredRules.length).toBeGreaterThan(0)
      expect(result.confidence).toBeGreaterThanOrEqual(0.8)
    })

    it('[P1] 中等消费会员评估为VIP(满足任意条件达到VIP阈值)', () => {
      // member-level-v1 引擎使用 ALL 匹配策略(需全匹配),要SVIP需全大于等于条件值
      // inferCurrentLevel 逻辑: totalSpend>=5000 或 totalPoints>=2000 判断为VIP
      // 这里验证evaluateMemberLevel返回的currentLevel字段
      const result = ruleEngine.evaluateMemberLevel({
        memberId: 'member-vip',
        totalSpend: 8000,
        totalPoints: 3000,
        visitCount: 15,
        tenantId: 'tenant-001',
      })

      // 此数据不满足全匹配条件(8000<10000,3000<5000,15<20)，因此suggestedLevel为REGULAR
      // 但currentLevel根据独立逻辑可推断为VIP
      expect(result.currentLevel).toBe('VIP')
      expect(result.suggestedLevel).toBe('REGULAR')
      expect(result.triggeredRules).toEqual([])
    })

    it('[P1] 低消费低活跃会员评估为REGULAR', () => {
      const result = ruleEngine.evaluateMemberLevel({
        memberId: 'member-regular',
        totalSpend: 1000,
        totalPoints: 500,
        visitCount: 3,
        tenantId: 'tenant-001',
      })

      expect(result.suggestedLevel).toBe('REGULAR')
      expect(result.triggeredRules).toEqual([])
      expect(result.confidence).toBeLessThan(0.5)
    })
  })

  // ─── 2. 设备异常检测 ────────────────────────────────────────────

  describe('设备异常检测', () => {
    it('[P0] 多项指标超标标记为严重异常', () => {
      const result = ruleEngine.detectDeviceAnomaly({
        deviceId: 'device-abnormal-01',
        storeId: 'store-001',
        tenantId: 'tenant-001',
        metrics: {
          cpuUsage: 95,
          memoryUsage: 90,
          diskUsage: 92,
          networkLatencyMs: 600,
          errorRate: 8,
        },
      })

      expect(result.isAnomaly).toBe(true)
      expect(result.severity).toBe('CRITICAL') // >=3 triggered
      expect(result.triggeredRules.length).toBeGreaterThanOrEqual(3)
      expect(result.recommendations.length).toBeGreaterThan(0)
    })

    it('[P1] 全部指标正常返回isAnomaly=false', () => {
      const result = ruleEngine.detectDeviceAnomaly({
        deviceId: 'device-healthy',
        storeId: 'store-001',
        tenantId: 'tenant-001',
        metrics: {
          cpuUsage: 30,
          memoryUsage: 40,
          diskUsage: 50,
          networkLatencyMs: 50,
          errorRate: 0.5,
        },
      })

      expect(result.isAnomaly).toBe(false)
      expect(result.severity).toBe('LOW')
      expect(result.triggeredRules).toEqual([])
    })

    it('[P1] 一个指标超标返回MEDIUM级别', () => {
      const result = ruleEngine.detectDeviceAnomaly({
        deviceId: 'device-mild',
        storeId: 'store-001',
        tenantId: 'tenant-001',
        metrics: {
          cpuUsage: 95,
          memoryUsage: 40,
          diskUsage: 50,
          networkLatencyMs: 50,
          errorRate: 0.5,
        },
      })

      expect(result.isAnomaly).toBe(true)
      expect(result.severity).toBe('MEDIUM') // 1 triggered -> MEDIUM
      expect(result.triggeredRules.length).toBe(1)
    })
  })

  // ─── 3. 风险评分 ────────────────────────────────────────────

  describe('风险评分', () => {
    it('[P0] 多项风险指标触发CRITICAL级别', () => {
      const result = ruleEngine.evaluateRiskScore({
        subjectId: 'user-risky',
        subjectType: 'member',
        tenantId: 'tenant-001',
        metrics: {
          refundCount: 5,
          abnormalPaymentCount: 3,
          deviceAnomalyCount: 3,
          complaintCount: 2,
          voidRefundAmount: 1000,
        },
      })

      expect(result.subjectId).toBe('user-risky')
      expect(result.riskScore).toBeGreaterThanOrEqual(70)
      expect(result.riskLevel).toBe('CRITICAL')
      expect(result.triggeredRules.length).toBeGreaterThan(0)
      expect(result.recommendations.length).toBeGreaterThan(0)
    })

    it('[P1] 无风险指标返回LOW级别', () => {
      const result = ruleEngine.evaluateRiskScore({
        subjectId: 'user-safe',
        subjectType: 'member',
        tenantId: 'tenant-001',
        metrics: {
          refundCount: 0,
          abnormalPaymentCount: 0,
          deviceAnomalyCount: 0,
          complaintCount: 0,
          voidRefundAmount: 0,
        },
      })

      expect(result.riskLevel).toBe('LOW')
      expect(result.riskScore).toBe(0)
      expect(result.triggeredRules).toEqual([])
    })

    it('[P1] 单个指标触发返回MEDIUM', () => {
      const result = ruleEngine.evaluateRiskScore({
        subjectId: 'user-med',
        subjectType: 'member',
        tenantId: 'tenant-001',
        metrics: {
          refundCount: 3,
          abnormalPaymentCount: 0,
          deviceAnomalyCount: 0,
          complaintCount: 0,
          voidRefundAmount: 0,
        },
      })

      expect(result.riskLevel).toBe('MEDIUM')
      expect(result.riskScore).toBeGreaterThanOrEqual(25)
      expect(result.riskScore).toBeLessThan(50)
    })
  })

  // ─── 4. 批量评估 ────────────────────────────────────────────

  describe('批量评估', () => {
    it('[P0] 批量评估同时处理多条请求', () => {
      const result = ruleEngine.batchEvaluate({
        items: [
          {
            index: 0,
            type: 'member-level',
            data: { memberId: 'batch-user-1', totalSpend: 15000, totalPoints: 10000, visitCount: 50, tenantId: 'tenant-001' },
          },
          {
            index: 1,
            type: 'device-anomaly',
            data: { deviceId: 'batch-dev-1', storeId: 'store-001', tenantId: 'tenant-001', metrics: { cpuUsage: 95, memoryUsage: 90, diskUsage: 50, networkLatencyMs: 50, errorRate: 1 } },
          },
        ],
      })

      expect(result.total).toBe(2)
      expect(result.succeeded).toBe(2)
      expect(result.failed).toBe(0)
      expect(result.items.length).toBe(2)
    })

    it('[P1] 空批量请求返回空结果', () => {
      const result = ruleEngine.batchEvaluate({ items: [] })
      expect(result.total).toBe(0)
      expect(result.succeeded).toBe(0)
      expect(result.failed).toBe(0)
      expect(result.items).toEqual([])
    })
  })

  // ─── 5. 引擎状态与管理 ────────────────────────────────────────────

  describe('引擎配置管理', () => {
    it('[P0] getEngineStatus返回所有引擎状态', () => {
      const statuses = ruleEngine.getEngineStatus()
      expect(statuses.length).toBe(3)
      statuses.forEach((s) => {
        expect(s.engineId).toBeTruthy()
        expect(s.conditionsCount).toBeGreaterThan(0)
        expect(s.status).toBeTruthy()
      })
    })

    it('[P1] getEngineDetail返回引擎详细信息', () => {
      const detail = ruleEngine.getEngineDetail('member-level-v1')
      expect(detail).toBeDefined()
      expect(detail!.engineName).toBe('Member Level Evaluator')
      expect(detail!.conditions.length).toBeGreaterThan(0)
      expect(detail!.actions.length).toBeGreaterThan(0)
    })

    it('[P1] updateEngineConfig可以更新匹配策略', () => {
      ruleEngine.updateEngineConfig('member-level-v1', {
        matchStrategy: 'ANY',
      })
      const detail = ruleEngine.getEngineDetail('member-level-v1')
      expect(detail!.matchStrategy).toBe('ANY')
    })

    it('[P2] resetEngine恢复引擎状态', () => {
      ruleEngine.updateEngineConfig('member-level-v1', { enabled: false })
      const before = ruleEngine.getEngineDetail('member-level-v1')
      expect(before!.enabled).toBe(false)

      ruleEngine.resetEngine('member-level-v1')
      const after = ruleEngine.getEngineDetail('member-level-v1')
      expect(after!.enabled).toBe(true)
    })
  })

  // ─── 6. 模拟器 ────────────────────────────────────────────

  describe('规则模拟器', () => {
    it('[P0] runSimulator单次模拟返回匹配结果', () => {
      const input: SimulatorRunInput = {
        simulatorId: 'sim-member-level-v1',
        dataType: 'member-level',
        data: { totalSpend: 15000, totalPoints: 10000, visitCount: 50 },
        verbose: false,
      }
      const result = ruleEngine.runSimulator(input)

      expect(result.simulatorId).toBe('sim-member-level-v1')
      expect(result.matched).toBe(true)
      expect(result.matchScore).toBeGreaterThan(0)
      expect(result.executionTimeMs).toBeGreaterThanOrEqual(0)
    })

    it('[P1] runSimulator不匹配时matched=false', () => {
      const input: SimulatorRunInput = {
        simulatorId: 'sim-member-level-v1',
        dataType: 'member-level',
        data: { totalSpend: 100, totalPoints: 50, visitCount: 1 },
        verbose: false,
      }
      const result = ruleEngine.runSimulator(input)

      expect(result.matched).toBe(false)
      expect(result.matchScore).toBe(0)
      expect(result.triggeredConditions).toEqual([])
    })

    it('[P1] 无效模拟器ID抛出异常', () => {
      expect(() =>
        ruleEngine.runSimulator({
          simulatorId: 'sim-nonexistent',
          dataType: 'member-level',
          data: {},
        })
      ).toThrow('Simulator sim-nonexistent not found')
    })

    it('[P1] runSimulatorBatch批量运行并返回聚合摘要', () => {
      const batch = ruleEngine.runSimulatorBatch({
        simulatorId: 'sim-member-level-v1',
        dataType: 'member-level',
        data: { totalSpend: 10000, totalPoints: 5000, visitCount: 20 },
        rounds: 5,
      })

      expect(batch.totalRuns).toBe(5)
      expect(batch.matchRate).toBeGreaterThanOrEqual(0)
      expect(batch.matchRate).toBeLessThanOrEqual(1)
      expect(batch.avgExecutionTimeMs).toBeGreaterThanOrEqual(0)
    })
  })
})
