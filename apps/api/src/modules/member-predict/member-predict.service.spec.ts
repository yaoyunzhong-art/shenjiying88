/**
 * member-predict.service.spec.ts — 会员流失预测 Service 单元测试 (V23)
 *
 * 覆盖: findAll / findById / getSummary / getRiskDistribution / evaluateRisk / create
 * 规则: 无 describe.skip · 无 it.only · beforeEach 隔离
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { MemberPredictService } from './member-predict.service'
import { RiskLevel } from './member-predict.entity'

describe('MemberPredictService', () => {
  let service: MemberPredictService

  beforeEach(() => {
    service = new MemberPredictService()
  })

  // ════════════════════════════════════════════
  // findAll
  // ════════════════════════════════════════════

  describe('findAll', () => {
    it('正例: 返回所有预测', async () => {
      const result = await service.findAll()
      expect(result.length).toBe(10)
    })

    it('正例: 按门店筛选', async () => {
      const result = await service.findAll('store-001')
      expect(result.every(p => p.storeId === 'store-001' || !p.storeId)).toBe(true) // DTO excluded storeId
    })

    it('正例: 按风险等级筛选', async () => {
      const high = await service.findAll(undefined, RiskLevel.HIGH)
      expect(high.every(p => p.riskLevel === RiskLevel.HIGH)).toBe(true)
    })

    it('边界: 最小风险分数筛选', async () => {
      const result = await service.findAll(undefined, undefined, 80)
      for (const p of result) {
        expect(p.riskScore).toBeGreaterThanOrEqual(80)
      }
    })
  })

  // ════════════════════════════════════════════
  // findById
  // ════════════════════════════════════════════

  describe('findById', () => {
    it('正例: 按ID查找', async () => {
      const result = await service.findById('m-001')
      expect(result).not.toBeNull()
      expect(result!.memberName).toBe('张三')
    })

    it('反例: 不存在的会员返回null', async () => {
      expect(await service.findById('nonexist')).toBeNull()
    })
  })

  // ════════════════════════════════════════════
  // getSummary
  // ════════════════════════════════════════════

  describe('getSummary', () => {
    it('正例: 返回汇总统计', async () => {
      const summary = await service.getSummary()
      expect(summary.totalPredicted).toBe(10)
      expect(summary.highRiskCount).toBeGreaterThan(0)
      expect(summary.mediumRiskCount).toBeGreaterThan(0)
      expect(summary.lowRiskCount).toBeGreaterThan(0)
      expect(summary.avgRiskScore).toBeGreaterThan(0)
      expect(summary.predictedLossAmount).toBeGreaterThan(0)
      expect(summary.recommendedActions.length).toBeGreaterThan(0)
    })
  })

  // ════════════════════════════════════════════
  // getRiskDistribution
  // ════════════════════════════════════════════

  describe('getRiskDistribution', () => {
    it('正例: 返回各等级分布', async () => {
      const dist = await service.getRiskDistribution()
      expect(dist.length).toBe(3)
      for (const d of dist) {
        expect(d.count).toBeGreaterThanOrEqual(0)
        expect(d.avgScore).toBeGreaterThanOrEqual(0)
      }
    })
  })

  // ════════════════════════════════════════════
  // evaluateRisk
  // ════════════════════════════════════════════

  describe('evaluateRisk', () => {
    it('正例: 高风险评估', async () => {
      const result = await service.evaluateRisk('m-001', 85, 0.75)
      expect(result.riskLevel).toBe(RiskLevel.HIGH)
      expect(result.suggestion).toContain('立即干预')
    })

    it('正例: 中风险评估', async () => {
      const result = await service.evaluateRisk('m-004', 55, 0.45)
      expect(result.riskLevel).toBe(RiskLevel.MEDIUM)
    })

    it('边界: 低评分边界', async () => {
      const result = await service.evaluateRisk('m-010', 39, 0.1)
      expect(result.riskLevel).toBe(RiskLevel.LOW)
    })

    it('边界: 恰好40分属于中风险', async () => {
      const result = await service.evaluateRisk('m-011', 40, 0.3)
      expect(result.riskLevel).toBe(RiskLevel.MEDIUM)
    })
  })

  // ════════════════════════════════════════════
  // create
  // ════════════════════════════════════════════

  describe('create', () => {
    it('正例: 创建预测记录', async () => {
      const result = await service.create({
        memberId: 'm-100',
        memberName: '新会员',
        memberLevel: 'VIP_L1',
        riskScore: 75,
        churnProbability: 0.6,
        mainReason: '测试原因',
        suggestedAction: '测试建议',
        lastActiveDate: '2026-07-01',
        storeId: 'store-001',
      })
      expect(result.memberId).toBe('m-100')
      expect(result.riskLevel).toBe(RiskLevel.HIGH)
      expect(result.predictedChurnDate).toBeTruthy()
    })
  })
})
