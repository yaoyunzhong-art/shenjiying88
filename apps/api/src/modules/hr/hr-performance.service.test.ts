/**
 * hr-performance.service.spec.ts — 绩效考核模块 Service 单元测试
 *
 * 覆盖内容（≥15个测试用例）：
 * - 考核模板 CRUD
 * - 考核评估创建、查询、更新
 * - SBI面谈管理
 * - 星级员工管理
 * - 绩效统计聚合
 * - 边界值与异常处理
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { HrPerformanceService } from './hr-performance.service'
import type { KpiDefinition, OkrDefinition } from './hr-performance.service'

// ═══════════════════════════════════════════════════════════════
// 辅助: 测试数据工厂
// ═══════════════════════════════════════════════════════════════

const TENANT_ID = 'tenant-001'
const OTHER_TENANT = 'tenant-999'

function makeSampleKpis(): KpiDefinition[] {
  return [
    { name: '收银准确率', target: '≥99.8%', weight: 30 },
    { name: '服务态度评分', target: '≥4.5/5分', weight: 25 },
    { name: '日均交易量', target: '≥200笔', weight: 25 },
    { name: '准时出勤率', target: '100%', weight: 20 },
  ]
}

function makeSampleOkrs(): OkrDefinition[] {
  return [
    { objective: '提升服务质量', keyResults: ['顾客满意度≥4.5', '投诉率降低20%'] },
    { objective: '优化工作效率', keyResults: ['交易时长缩短至45秒内', '差错率<0.1%'] },
  ]
}

function createTemplate(svc: HrPerformanceService) {
  return svc.createTemplate({
    tenantId: TENANT_ID,
    name: '收银岗考核模板',
    department: '收银岗',
    kpis: makeSampleKpis(),
    okrs: makeSampleOkrs(),
    period: 'monthly',
  })
}

// ═══════════════════════════════════════════════════════════════
// 绩效考核 Service 测试套件
// ═══════════════════════════════════════════════════════════════

describe('HrPerformanceService — 绩效考核服务', () => {
  let svc: HrPerformanceService

  beforeEach(() => {
    svc = new HrPerformanceService()
  })

  // ── 1. 考核模板管理 ─────────────────────────────

  describe('考核模板管理 (createTemplate / findAllTemplates / findTemplateById)', () => {
    it('【正例】createTemplate 创建模板成功', () => {
      const tpl = createTemplate(svc)
      expect(tpl.id).toMatch(/^perf-tpl-/)
      expect(tpl.name).toBe('收银岗考核模板')
      expect(tpl.department).toBe('收银岗')
      expect(tpl.period).toBe('monthly')
      expect(tpl.kpis).toHaveLength(4)
      expect(tpl.okrs).toHaveLength(2)
    })

    it('【正例】findAllTemplates 返回所有模板', () => {
      createTemplate(svc)
      svc.createTemplate({
        tenantId: TENANT_ID,
        name: '导玩员季度考核',
        department: '导玩岗',
        kpis: makeSampleKpis(),
        okrs: makeSampleOkrs(),
        period: 'quarterly',
      })
      const list = svc.findAllTemplates(TENANT_ID)
      expect(list.length).toBeGreaterThanOrEqual(2)
    })

    it('【正例】findTemplateById 返回指定模板', () => {
      const tpl = createTemplate(svc)
      const found = svc.findTemplateById(tpl.id, TENANT_ID)
      expect(found).toBeDefined()
      expect(found!.name).toBe(tpl.name)
    })

    it('【反例】findTemplateById 跨租户返回 undefined', () => {
      const tpl = createTemplate(svc)
      const found = svc.findTemplateById(tpl.id, OTHER_TENANT)
      expect(found).toBeUndefined()
    })

    it('【反例】findTemplateById 不存在的 id 返回 undefined', () => {
      const found = svc.findTemplateById('non-existent', TENANT_ID)
      expect(found).toBeUndefined()
    })

    it('【正例】不同周期的模板均能正常创建', () => {
      const periods = ['monthly', 'quarterly', 'annual'] as const
      for (const period of periods) {
        const tpl = svc.createTemplate({
          tenantId: TENANT_ID,
          name: `考核模板-${period}`,
          department: '测试岗',
          kpis: makeSampleKpis(),
          okrs: makeSampleOkrs(),
          period,
        })
        expect(tpl.period).toBe(period)
      }
    })
  })

  // ── 2. 考核评估管理 ─────────────────────────────

  describe('考核评估管理 (createEvaluation / findEvaluations / updateEvaluation)', () => {
    it('【正例】createEvaluation 创建评估并自动计算总分', () => {
      const tpl = createTemplate(svc)
      const evalRecord = svc.createEvaluation({
        tenantId: TENANT_ID,
        employeeId: 'E001',
        templateId: tpl.id,
        period: '2026-07',
        kpiScores: [
          { kpiName: '收银准确率', score: 95 },
          { kpiName: '服务态度评分', score: 90 },
          { kpiName: '日均交易量', score: 85 },
          { kpiName: '准时出勤率', score: 100 },
        ],
        okrScores: [
          { objective: '提升服务质量', progress: 80 },
        ],
        status: 'self',
      })
      expect(evalRecord.id).toMatch(/^perf-eval-/)
      expect(evalRecord.totalScore).toBeGreaterThan(0)
      expect(evalRecord.totalScore).toBeLessThanOrEqual(100)
      expect(evalRecord.status).toBe('self')
    })

    it('【正例】createEvaluation 自动根据总分确定排名(rank)', () => {
      const tpl = createTemplate(svc)
      const high = svc.createEvaluation({
        tenantId: TENANT_ID, employeeId: 'E001', templateId: tpl.id,
        period: '2026-07',
        kpiScores: [{ kpiName: '收银准确率', score: 98 }, { kpiName: '服务态度评分', score: 95 }, { kpiName: '日均交易量', score: 92 }, { kpiName: '准时出勤率', score: 100 }],
        okrScores: [],
        status: 'done',
      })
      expect(high.totalScore).toBeGreaterThanOrEqual(90)
      expect(high.rank).toBe('top20')

      const mid = svc.createEvaluation({
        tenantId: TENANT_ID, employeeId: 'E002', templateId: tpl.id,
        period: '2026-07',
        kpiScores: [{ kpiName: '收银准确率', score: 75 }, { kpiName: '服务态度评分', score: 78 }, { kpiName: '日均交易量', score: 72 }, { kpiName: '准时出勤率', score: 80 }],
        okrScores: [],
        status: 'done',
      })
      expect(mid.rank).toBe('middle70')

      const low = svc.createEvaluation({
        tenantId: TENANT_ID, employeeId: 'E003', templateId: tpl.id,
        period: '2026-07',
        kpiScores: [{ kpiName: '收银准确率', score: 50 }, { kpiName: '服务态度评分', score: 55 }, { kpiName: '日均交易量', score: 60 }, { kpiName: '准时出勤率', score: 65 }],
        okrScores: [],
        status: 'done',
      })
      expect(low.rank).toBe('bottom10')
    })

    it('【正例】findEvaluations 按员工筛选', () => {
      const tpl = createTemplate(svc)
      svc.createEvaluation({
        tenantId: TENANT_ID, employeeId: 'E001', templateId: tpl.id,
        period: '2026-07', kpiScores: [], okrScores: [], status: 'self',
      })
      const result = svc.findEvaluations(TENANT_ID, { employeeId: 'E001' })
      expect(result.length).toBeGreaterThanOrEqual(1)
      result.forEach(e => expect(e.employeeId).toBe('E001'))
    })

    it('【正例】findEvaluations 按周期筛选', () => {
      const tpl = createTemplate(svc)
      svc.createEvaluation({
        tenantId: TENANT_ID, employeeId: 'E001', templateId: tpl.id,
        period: '2026-07', kpiScores: [], okrScores: [], status: 'self',
      })
      const result = svc.findEvaluations(TENANT_ID, { period: '2026-07' })
      expect(result.length).toBeGreaterThanOrEqual(1)
      result.forEach(e => expect(e.period).toBe('2026-07'))
    })

    it('【正例】findEvaluationById 返回指定评估', () => {
      const tpl = createTemplate(svc)
      const evalRecord = svc.createEvaluation({
        tenantId: TENANT_ID, employeeId: 'E001', templateId: tpl.id,
        period: '2026-07', kpiScores: [], okrScores: [], status: 'self',
      })
      const found = svc.findEvaluationById(evalRecord.id, TENANT_ID)
      expect(found).toBeDefined()
      expect(found!.id).toBe(evalRecord.id)
    })

    it('【反例】findEvaluationById 跨租户返回 undefined', () => {
      const tpl = createTemplate(svc)
      const evalRecord = svc.createEvaluation({
        tenantId: TENANT_ID, employeeId: 'E001', templateId: tpl.id,
        period: '2026-07', kpiScores: [], okrScores: [], status: 'self',
      })
      const found = svc.findEvaluationById(evalRecord.id, OTHER_TENANT)
      expect(found).toBeUndefined()
    })

    it('【正例】updateEvaluation 更新 KPI 分数后重新计算总分', () => {
      const tpl = createTemplate(svc)
      const evalRecord = svc.createEvaluation({
        tenantId: TENANT_ID, employeeId: 'E001', templateId: tpl.id,
        period: '2026-07',
        kpiScores: [
          { kpiName: '收银准确率', score: 95 },
          { kpiName: '服务态度评分', score: 90 },
          { kpiName: '日均交易量', score: 85 },
          { kpiName: '准时出勤率', score: 100 },
        ],
        okrScores: [],
        status: 'self',
      })
      const oldScore = evalRecord.totalScore

      const updated = svc.updateEvaluation(evalRecord.id, TENANT_ID, {
        kpiScores: [
          { kpiName: '收银准确率', score: 100 },
          { kpiName: '服务态度评分', score: 100 },
          { kpiName: '日均交易量', score: 100 },
          { kpiName: '准时出勤率', score: 100 },
        ],
        status: 'manager',
        managerComment: '表现优秀',
      })
      expect(updated.totalScore).toBeGreaterThan(oldScore)
      expect(updated.status).toBe('manager')
      expect(updated.managerComment).toBe('表现优秀')
    })

    it('【正例】updateEvaluation 可以标记完成并设置完成时间', () => {
      const tpl = createTemplate(svc)
      const evalRecord = svc.createEvaluation({
        tenantId: TENANT_ID, employeeId: 'E001', templateId: tpl.id,
        period: '2026-07', kpiScores: [], okrScores: [], status: 'self',
      })
      const completedAt = '2026-07-20T10:00:00Z'
      const updated = svc.updateEvaluation(evalRecord.id, TENANT_ID, {
        status: 'done',
        completedAt,
      })
      expect(updated.status).toBe('done')
      expect(updated.completedAt).toBe(completedAt)
    })

    it('【反例】没有 KPI 分数时总分应为 0', () => {
      const tpl = createTemplate(svc)
      const evalRecord = svc.createEvaluation({
        tenantId: TENANT_ID, employeeId: 'E001', templateId: tpl.id,
        period: '2026-07', kpiScores: [], okrScores: [], status: 'self',
      })
      expect(evalRecord.totalScore).toBe(0)
    })

    it('【边界】单个 KPI 分数为 0 评估仍正常', () => {
      const tpl = createTemplate(svc)
      const evalRecord = svc.createEvaluation({
        tenantId: TENANT_ID, employeeId: 'E001', templateId: tpl.id,
        period: '2026-07',
        kpiScores: [{ kpiName: '收银准确率', score: 0 }],
        okrScores: [],
        status: 'self',
      })
      expect(evalRecord.totalScore).toBe(0)
      expect(evalRecord.rank).toBe('bottom10')
    })
  })

  // ── 3. SBI 面谈管理 ─────────────────────────────

  describe('SBI面谈管理 (createInterview / findInterviews)', () => {
    it('【正例】createInterview 创建面谈记录', () => {
      const interview = svc.createInterview({
        tenantId: TENANT_ID,
        employeeId: 'E001',
        evaluatorId: 'admin-001',
        situation: '客户投诉收银错误',
        behavior: '立即道歉并核对金额',
        impact: '客户情绪平复，问题解决',
        overallFeedback: '处理得当，建议加强核对流程',
        actionPlan: '收银前双人复核',
        interviewDate: '2026-07-15',
      })
      expect(interview.id).toMatch(/^sbi-/)
      expect(interview.situation).toBe('客户投诉收银错误')
      expect(interview.overallFeedback).toBe('处理得当，建议加强核对流程')
    })

    it('【正例】findInterviews 返回所有面谈记录', () => {
      svc.createInterview({
        tenantId: TENANT_ID, employeeId: 'E001', evaluatorId: 'admin-001',
        situation: '表现优秀', behavior: '主动服务', impact: '顾客表扬',
        interviewDate: '2026-07-15',
      })
      const list = svc.findInterviews(TENANT_ID)
      expect(list.length).toBeGreaterThanOrEqual(1)
    })

    it('【正例】findInterviews 按员工筛选', () => {
      svc.createInterview({
        tenantId: TENANT_ID, employeeId: 'E001', evaluatorId: 'admin-001',
        situation: 'S1', behavior: 'B1', impact: 'I1',
        interviewDate: '2026-07-15',
      })
      svc.createInterview({
        tenantId: TENANT_ID, employeeId: 'E002', evaluatorId: 'admin-001',
        situation: 'S2', behavior: 'B2', impact: 'I2',
        interviewDate: '2026-07-16',
      })
      const list = svc.findInterviews(TENANT_ID, 'E001')
      expect(list.length).toBeGreaterThanOrEqual(1)
      list.forEach(i => expect(i.employeeId).toBe('E001'))
    })
  })

  // ── 4. 星级员工管理 ─────────────────────────────

  describe('星级员工管理 (createStarEmployee / findAllStarEmployees)', () => {
    it('【正例】createStarEmployee 创建星级员工', () => {
      const star = svc.createStarEmployee({
        tenantId: TENANT_ID,
        employeeId: 'E001',
        period: '2026-07',
        type: 'monthly',
        achievement: '连续30天零差错',
        reward: '奖金500元',
      })
      expect(star.id).toMatch(/^star-/)
      expect(star.achievement).toBe('连续30天零差错')
      expect(star.reward).toBe('奖金500元')
      expect(star.awardedAt).toBeDefined()
    })

    it('【正例】findAllStarEmployees 返回所有星级员工', () => {
      svc.createStarEmployee({
        tenantId: TENANT_ID, employeeId: 'E001',
        period: '2026-07', type: 'monthly',
        achievement: '优质服务', reward: '奖金500元',
      })
      svc.createStarEmployee({
        tenantId: TENANT_ID, employeeId: 'E002',
        period: '2026-Q2', type: 'quarterly',
        achievement: '技术突破', reward: '奖金1000元',
      })
      const list = svc.findAllStarEmployees(TENANT_ID)
      expect(list.length).toBeGreaterThanOrEqual(2)
    })

    it('【边界】不同周期类型的星级员工都能创建', () => {
      const types = ['monthly', 'quarterly', 'annual'] as const
      for (const type of types) {
        const star = svc.createStarEmployee({
          tenantId: TENANT_ID, employeeId: 'E001',
          period: '2026', type,
          achievement: '优秀', reward: '奖励',
        })
        expect(star.type).toBe(type)
      }
    })
  })

  // ── 5. 绩效统计 ────────────────────────────────

  describe('绩效统计 (getPerformanceStats)', () => {
    it('【正例】getPerformanceStats 返回完整统计信息', () => {
      const stats = svc.getPerformanceStats(TENANT_ID)
      expect(stats).toBeDefined()
      expect(stats).toHaveProperty('totalEvaluations')
      expect(stats).toHaveProperty('averageScore')
      expect(stats).toHaveProperty('scoreDistribution')
      expect(stats).toHaveProperty('rankDistribution')
      expect(stats).toHaveProperty('totalStarEmployees')
    })

    it('【正例】分数分布正确计算 (excellent/good/average/needsImprovement)', () => {
      const tpl = createTemplate(svc)
      // 优秀 >= 90
      svc.createEvaluation({
        tenantId: TENANT_ID, employeeId: 'E001', templateId: tpl.id,
        period: '2026-07',
        kpiScores: [{ kpiName: '收银准确率', score: 95 }, { kpiName: '服务态度评分', score: 95 }, { kpiName: '日均交易量', score: 92 }, { kpiName: '准时出勤率', score: 100 }],
        okrScores: [], status: 'done',
      })
      // 良好 80-89
      svc.createEvaluation({
        tenantId: TENANT_ID, employeeId: 'E002', templateId: tpl.id,
        period: '2026-07',
        kpiScores: [{ kpiName: '收银准确率', score: 85 }, { kpiName: '服务态度评分', score: 82 }, { kpiName: '日均交易量', score: 80 }, { kpiName: '准时出勤率', score: 88 }],
        okrScores: [], status: 'done',
      })
      const stats = svc.getPerformanceStats(TENANT_ID)
      expect(stats.scoreDistribution.excellent).toBeGreaterThanOrEqual(1)
      expect(stats.scoreDistribution.good).toBeGreaterThanOrEqual(1)
    })

    it('【正例】统计包含创建的星级员工数量', () => {
      svc.createStarEmployee({
        tenantId: TENANT_ID, employeeId: 'E001',
        period: '2026-07', type: 'monthly',
        achievement: '卓越', reward: '奖金',
      })
      const stats = svc.getPerformanceStats(TENANT_ID)
      expect(stats.totalStarEmployees).toBeGreaterThanOrEqual(1)
    })

    it('【边界】空租户统计全为零', () => {
      const stats = svc.getPerformanceStats(OTHER_TENANT)
      expect(stats.totalEvaluations).toBe(0)
      expect(stats.averageScore).toBe(0)
      expect(stats.scoreDistribution.excellent).toBe(0)
      expect(stats.totalStarEmployees).toBe(0)
    })

    it('【反例】更新不存在的评估抛异常', () => {
      expect(() => svc.updateEvaluation('non-existent', TENANT_ID, { status: 'done' })).toThrow()
    })

    it('【边界】种子数据存在时统计有值', () => {
      const stats = svc.getPerformanceStats(TENANT_ID)
      expect(stats.totalEvaluations).toBeGreaterThan(0)
      expect(stats.averageScore).toBeGreaterThan(0)
    })
  })
})
