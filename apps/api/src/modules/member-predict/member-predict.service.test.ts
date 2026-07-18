/**
 * member-predict Service 单元测试
 * 
 * 测试科学化三件套：正例 + 反例 + 边界
 * Mock 策略：直接实例化 Service（纯内存服务，无外部依赖）
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { MemberPredictService } from './member-predict.service'
import { RiskLevel } from './member-predict.entity'

function createService(): MemberPredictService {
  return new MemberPredictService()
}

// ─── findAll ───────────────────────────────────────────────────

describe('MemberPredictService.findAll', () => {
  let service: MemberPredictService

  beforeEach(() => {
    service = createService()
  })

  it('should return all predictions when no filter is applied', async () => {
    const result = await service.findAll()
    expect(result).toHaveLength(10)
  })

  it('should filter by storeId', async () => {
    const result = await service.findAll('store-001')
    expect(result.length).toBeGreaterThan(0)
    result.forEach(item => {
      // storeId is not included in DTO; we verify by filtering conditions
      // The store-001 data should have 4 items from mock data
    })
    // store-001: m-001,m-002,m-004,m-007,m-009 → 5 items
    expect(result).toHaveLength(5)
  })

  it('should filter by storeId with no matches', async () => {
    const result = await service.findAll('store-999')
    expect(result).toHaveLength(0)
  })

  it('should filter by riskLevel', async () => {
    const result = await service.findAll(undefined, RiskLevel.HIGH)
    expect(result.length).toBe(3)
    result.forEach(item => {
      expect(item.riskLevel).toBe(RiskLevel.HIGH)
    })
  })

  it('should filter by riskLevel MEDIUM', async () => {
    const result = await service.findAll(undefined, RiskLevel.MEDIUM)
    expect(result.length).toBe(3)
    result.forEach(item => {
      expect(item.riskLevel).toBe(RiskLevel.MEDIUM)
    })
  })

  it('should filter by riskLevel LOW', async () => {
    const result = await service.findAll(undefined, RiskLevel.LOW)
    expect(result.length).toBe(4)
    result.forEach(item => {
      expect(item.riskLevel).toBe(RiskLevel.LOW)
    })
  })

  it('should filter by minScore', async () => {
    const result = await service.findAll(undefined, undefined, 70)
    expect(result.length).toBe(3)
    result.forEach(item => {
      expect(item.riskScore).toBeGreaterThanOrEqual(70)
    })
  })

  it('should filter by minScore = 0 (boundary)', async () => {
    const result = await service.findAll(undefined, undefined, 0)
    expect(result).toHaveLength(10)
    result.forEach(item => {
      expect(item.riskScore).toBeGreaterThanOrEqual(0)
    })
  })

  it('should filter by minScore beyond max', async () => {
    const result = await service.findAll(undefined, undefined, 100)
    expect(result).toHaveLength(0)
  })

  it('should combine storeId + riskLevel + minScore filters', async () => {
    const result = await service.findAll('store-001', RiskLevel.HIGH, 70)
    // store-001 HIGH >= 70: m-001(85), m-002(78) → 2 items
    expect(result).toHaveLength(2)
    result.forEach(item => {
      expect(item.riskScore).toBeGreaterThanOrEqual(70)
    })
  })

  it('should combine storeId + riskLevel with no matches', async () => {
    const result = await service.findAll('store-003', RiskLevel.HIGH, undefined)
    expect(result).toHaveLength(0)
  })
})

// ─── findById ──────────────────────────────────────────────────

describe('MemberPredictService.findById', () => {
  let service: MemberPredictService

  beforeEach(() => {
    service = createService()
  })

  it('should find existing member by ID', async () => {
    const result = await service.findById('m-001')
    expect(result).not.toBeNull()
    expect(result!.memberId).toBe('m-001')
    expect(result!.memberName).toBe('张三')
    expect(result!.riskScore).toBe(85)
  })

  it('should return null for non-existent member ID', async () => {
    const result = await service.findById('m-999')
    expect(result).toBeNull()
  })

  it('should return null for empty member ID', async () => {
    const result = await service.findById('')
    expect(result).toBeNull()
  })
})

// ─── getSummary ────────────────────────────────────────────────

describe('MemberPredictService.getSummary', () => {
  let service: MemberPredictService

  beforeEach(() => {
    service = createService()
  })

  it('should return summary with correct totals', async () => {
    const summary = await service.getSummary()
    expect(summary.totalPredicted).toBe(10)
    expect(summary.highRiskCount).toBe(3)
    expect(summary.mediumRiskCount).toBe(3)
    expect(summary.lowRiskCount).toBe(4)
  })

  it('should calculate average risk score correctly', async () => {
    const summary = await service.getSummary()
    // Sum = 85+78+72+62+55+48+35+28+22+18 = 503, avg = 50.3
    expect(summary.avgRiskScore).toBe(50.3)
  })

  it('should calculate predictedLossAmount', async () => {
    const summary = await service.getSummary()
    // churnProbability sum: 0.75+0.68+0.62+0.45+0.38+0.30+0.18+0.12+0.08+0.05 = 3.61
    // 3.61 * 5000 = 18050, rounded
    expect(summary.predictedLossAmount).toBeGreaterThan(0)
    expect(Number.isInteger(summary.predictedLossAmount)).toBe(true)
  })

  it('should include recommended actions based on risk ratio', async () => {
    const summary = await service.getSummary()
    // highRatio = 3/10 = 0.3, not > 0.3 → no '启动流失预警应急预案'
    // mediumRiskCount > 0 → should include 中风险推送
    expect(summary.recommendedActions.length).toBeGreaterThanOrEqual(3)
    expect(summary.recommendedActions[0]).toContain('电话回访')
  })
})

// ─── getRiskDistribution ───────────────────────────────────────

describe('MemberPredictService.getRiskDistribution', () => {
  let service: MemberPredictService

  beforeEach(() => {
    service = createService()
  })

  it('should return distribution for all 3 risk levels', async () => {
    const dist = await service.getRiskDistribution()
    expect(dist).toHaveLength(3)
    const levels = dist.map(d => d.riskLevel)
    expect(levels).toContain(RiskLevel.HIGH)
    expect(levels).toContain(RiskLevel.MEDIUM)
    expect(levels).toContain(RiskLevel.LOW)
  })

  it('should have correct counts per level', async () => {
    const dist = await service.getRiskDistribution()
    const high = dist.find(d => d.riskLevel === RiskLevel.HIGH)
    const medium = dist.find(d => d.riskLevel === RiskLevel.MEDIUM)
    const low = dist.find(d => d.riskLevel === RiskLevel.LOW)
    expect(high!.count).toBe(3)
    expect(medium!.count).toBe(3)
    expect(low!.count).toBe(4)
  })

  it('should calculate average score per level correctly', async () => {
    const dist = await service.getRiskDistribution()
    const high = dist.find(d => d.riskLevel === RiskLevel.HIGH)!
    // HIGH: 85+78+72 = 235, avg = 78.33
    expect(high.avgScore).toBeCloseTo(78.33, 1)
    const low = dist.find(d => d.riskLevel === RiskLevel.LOW)!
    // LOW: 35+28+22+18 = 103, avg = 25.75
    expect(low.avgScore).toBeCloseTo(25.75, 1)
  })
})

// ─── evaluateRisk ──────────────────────────────────────────────

describe('MemberPredictService.evaluateRisk', () => {
  let service: MemberPredictService

  beforeEach(() => {
    service = createService()
  })

  it('should return HIGH risk for score >= 70', async () => {
    const result = await service.evaluateRisk('test-m', 85, 0.8)
    expect(result.riskLevel).toBe(RiskLevel.HIGH)
    expect(result.suggestion).toContain('立即干预')
  })

  it('should return HIGH risk for boundary score 70', async () => {
    const result = await service.evaluateRisk('test-m', 70, 0.6)
    expect(result.riskLevel).toBe(RiskLevel.HIGH)
  })

  it('should return MEDIUM risk for score between 40 and 69', async () => {
    const result = await service.evaluateRisk('test-m', 55, 0.4)
    expect(result.riskLevel).toBe(RiskLevel.MEDIUM)
    expect(result.suggestion).toContain('关注维护')
  })

  it('should return MEDIUM risk for boundary score 40', async () => {
    const result = await service.evaluateRisk('test-m', 40, 0.3)
    expect(result.riskLevel).toBe(RiskLevel.MEDIUM)
  })

  it('should return LOW risk for score < 40', async () => {
    const result = await service.evaluateRisk('test-m', 25, 0.1)
    expect(result.riskLevel).toBe(RiskLevel.LOW)
    expect(result.suggestion).toContain('常规维护')
  })

  it('should return LOW risk for score 0 (boundary)', async () => {
    const result = await service.evaluateRisk('test-m', 0, 0)
    expect(result.riskLevel).toBe(RiskLevel.LOW)
  })

  it('should return HIGH risk for max score 100 (boundary)', async () => {
    const result = await service.evaluateRisk('test-m', 100, 1)
    expect(result.riskLevel).toBe(RiskLevel.HIGH)
  })
})

// ─── create ────────────────────────────────────────────────────

describe('MemberPredictService.create', () => {
  let service: MemberPredictService

  beforeEach(() => {
    service = createService()
  })

  it('should create a new prediction and return DTO', async () => {
    const result = await service.create({
      memberId: 'm-100',
      memberName: '测试会员',
      memberLevel: 'VIP_L1',
      riskScore: 65,
      churnProbability: 0.5,
      mainReason: '测试创建',
      suggestedAction: '发送测试优惠券',
      lastActiveDate: '2026-07-01',
      storeId: 'store-001'
    })

    expect(result.memberId).toBe('m-100')
    expect(result.memberName).toBe('测试会员')
    expect(result.riskLevel).toBe(RiskLevel.MEDIUM) // 65 → MEDIUM
    expect(result.churnProbability).toBe(0.5)
    expect(result.mainReason).toBe('测试创建')
    expect(result.suggestedAction).toBe('发送测试优惠券')
    // predictedChurnDate should be a date string
    expect(result.predictedChurnDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('should persist the new prediction and be findable', async () => {
    await service.create({
      memberId: 'm-101',
      memberName: '持久化测试',
      memberLevel: 'REGULAR_L1',
      riskScore: 30,
      churnProbability: 0.2,
      mainReason: '测试持久化',
      suggestedAction: '常规跟进',
      lastActiveDate: '2026-07-15',
      storeId: 'store-002'
    })

    const found = await service.findById('m-101')
    expect(found).not.toBeNull()
    expect(found!.memberName).toBe('持久化测试')
  })

  it('should classify HIGH risk for score >= 70 on create', async () => {
    const result = await service.create({
      memberId: 'm-200',
      memberName: '高风险',
      memberLevel: 'REGULAR_L1',
      riskScore: 92,
      churnProbability: 0.95,
      mainReason: '严重流失风险',
      suggestedAction: '紧急干预',
      lastActiveDate: '2026-06-01',
      storeId: 'store-001'
    })
    expect(result.riskLevel).toBe(RiskLevel.HIGH)
  })

  it('should increase total count after create', async () => {
    const before = await service.findAll()
    await service.create({
      memberId: 'm-300',
      memberName: '新增会员',
      memberLevel: 'VIP_L2',
      riskScore: 50,
      churnProbability: 0.3,
      mainReason: '新增测试',
      suggestedAction: '推送活动',
      lastActiveDate: '2026-07-18',
      storeId: 'store-003'
    })
    const after = await service.findAll()
    expect(after).toHaveLength(before.length + 1)
  })
})
