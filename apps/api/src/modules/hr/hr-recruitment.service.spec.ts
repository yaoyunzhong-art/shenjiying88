/**
 * hr-recruitment.service.spec.ts — 招聘模块 Service 单元测试
 *
 * 覆盖内容（≥15个测试用例）：
 * - 职位 CRUD
 * - 候选人管理（创建、查询、状态流转）
 * - 内推管理
 * - 招聘统计
 * - 入职信息查询
 * - 边界值与异常处理
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { HrRecruitmentService } from './hr-recruitment.service'
import type { PositionType, CandidateStage, CandidateSource, PositionStatus } from './hr-recruitment.service'

// ═══════════════════════════════════════════════════════════════
// 辅助: 测试数据工厂
// ═══════════════════════════════════════════════════════════════

const TENANT_ID = 'tenant-001'
const OTHER_TENANT = 'tenant-999'

function createDefaultPosition(svc: HrRecruitmentService) {
  return svc.createPosition({
    tenantId: TENANT_ID,
    title: '导玩员',
    department: '门店运营',
    type: 'full-time',
    slots: 5,
    requirements: ['高中以上学历', '性格开朗'],
    salary: { min: 4500, max: 6000 },
    description: '负责顾客接待和场地维护',
  })
}

function createCandidate(svc: HrRecruitmentService, positionId: string, overrides: Partial<{
  name: string
  phone: string
  source: CandidateSource
  score: number
}> = {}) {
  return svc.createCandidate({
    tenantId: TENANT_ID,
    positionId,
    name: overrides.name ?? '测试候选人',
    phone: overrides.phone ?? '13900001111',
    source: overrides.source ?? 'platform',
    score: overrides.score,
  })
}

// ═══════════════════════════════════════════════════════════════
// 招聘 Service 测试套件
// ═══════════════════════════════════════════════════════════════

describe('HrRecruitmentService — 招聘管理服务', () => {
  let svc: HrRecruitmentService

  beforeEach(() => {
    svc = new HrRecruitmentService()
  })

  // ── 1. 职位管理 ────────────────────────────────

  describe('职位管理 (createPosition / findAllPositions / findPositionById / updatePosition)', () => {
    it('【正例】createPosition 创建职位成功', () => {
      const pos = createDefaultPosition(svc)
      expect(pos.id).toMatch(/^pos-/)
      expect(pos.title).toBe('导玩员')
      expect(pos.status).toBe('open')
      expect(pos.filled).toBe(0)
      expect(pos.slots).toBe(5)
      expect(pos.salary.min).toBe(4500)
      expect(pos.salary.max).toBe(6000)
    })

    it('【正例】findAllPositions 返回所有职位', () => {
      createDefaultPosition(svc)
      svc.createPosition({
        tenantId: TENANT_ID,
        title: '收银员',
        department: '财务部',
        type: 'full-time',
        slots: 3,
        requirements: ['细心'],
        salary: { min: 4200, max: 5500 },
      })
      const list = svc.findAllPositions(TENANT_ID)
      expect(list.length).toBeGreaterThanOrEqual(2)
    })

    it('【正例】findAllPositions 支持按部门筛选', () => {
      createDefaultPosition(svc)
      svc.createPosition({
        tenantId: TENANT_ID, title: '收银员', department: '财务部',
        type: 'full-time', slots: 3, requirements: [], salary: { min: 4000, max: 5000 },
      })
      const financial = svc.findAllPositions(TENANT_ID, { department: '财务部' })
      expect(financial.length).toBeGreaterThanOrEqual(1)
      financial.forEach(p => expect(p.department).toBe('财务部'))
    })

    it('【正例】findAllPositions 支持按状态筛选', () => {
      createDefaultPosition(svc)
      const openList = svc.findAllPositions(TENANT_ID, { status: 'open' })
      expect(openList.length).toBeGreaterThanOrEqual(1)
      openList.forEach(p => expect(p.status).toBe('open'))
    })

    it('【正例】findPositionById 返回指定职位', () => {
      const pos = createDefaultPosition(svc)
      const found = svc.findPositionById(pos.id, TENANT_ID)
      expect(found).toBeDefined()
      expect(found!.title).toBe('导玩员')
    })

    it('【反例】findPositionById 跨租户返回 undefined', () => {
      const pos = createDefaultPosition(svc)
      const found = svc.findPositionById(pos.id, OTHER_TENANT)
      expect(found).toBeUndefined()
    })

    it('【正例】updatePosition 更新职位字段', () => {
      const pos = createDefaultPosition(svc)
      const updated = svc.updatePosition(pos.id, TENANT_ID, {
        title: '高级导玩员',
        salary: { min: 5000, max: 7000 },
        status: 'closed',
      })
      expect(updated.title).toBe('高级导玩员')
      expect(updated.salary.min).toBe(5000)
      expect(updated.salary.max).toBe(7000)
      expect(updated.status).toBe('closed')
    })

    it('【边界】不同职位类型均可创建', () => {
      const types: PositionType[] = ['full-time', 'part-time', 'intern']
      for (const type of types) {
        const pos = svc.createPosition({
          tenantId: TENANT_ID, title: `岗位-${type}`, department: '测试',
          type, slots: 2, requirements: [], salary: { min: 3000, max: 5000 },
        })
        expect(pos.type).toBe(type)
      }
    })
  })

  // ── 2. 候选人管理 ──────────────────────────────

  describe('候选人管理 (createCandidate / findCandidates / updateCandidateStatus)', () => {
    it('【正例】createCandidate 创建候选人成功', () => {
      const pos = createDefaultPosition(svc)
      const cand = createCandidate(svc, pos.id, { name: '陈小明' })
      expect(cand.id).toMatch(/^cand-/)
      expect(cand.name).toBe('陈小明')
      expect(cand.stage).toBe('phone')
      expect(cand.positionId).toBe(pos.id)
    })

    it('【正例】createCandidate 未传 score 时默认为 0', () => {
      const pos = createDefaultPosition(svc)
      const cand = createCandidate(svc, pos.id)
      expect(cand.score).toBe(0)
    })

    it('【正例】createCandidate 支持不同来源', () => {
      const pos = createDefaultPosition(svc)
      const sources: CandidateSource[] = ['platform', 'referral', 'campus', 'community']
      for (const source of sources) {
        const cand = createCandidate(svc, pos.id, { source })
        expect(cand.source).toBe(source)
      }
    })

    it('【正例】findCandidates 按职位筛选', () => {
      const pos = createDefaultPosition(svc)
      createCandidate(svc, pos.id, { name: '候选A' })
      createCandidate(svc, pos.id, { name: '候选B' })
      const list = svc.findCandidates(TENANT_ID, { positionId: pos.id })
      expect(list.length).toBeGreaterThanOrEqual(2)
      list.forEach(c => expect(c.positionId).toBe(pos.id))
    })

    it('【正例】findCandidates 按阶段筛选', () => {
      const pos = createDefaultPosition(svc)
      const cand = createCandidate(svc, pos.id, { name: '面试者' })
      svc.updateCandidateStatus(cand.id, TENANT_ID, { stage: 'interview', score: 75 })
      const interviewList = svc.findCandidates(TENANT_ID, { stage: 'interview' })
      expect(interviewList.length).toBeGreaterThanOrEqual(1)
      interviewList.forEach(c => expect(c.stage).toBe('interview'))
    })

    it('【正例】updateCandidateStatus 流转到 hired 时增加职位 filled 数', () => {
      const pos = createDefaultPosition(svc)
      expect(pos.filled).toBe(0)

      const cand = createCandidate(svc, pos.id, { name: '入职者' })
      svc.updateCandidateStatus(cand.id, TENANT_ID, { stage: 'hired', score: 90 })

      const updatedPos = svc.findPositionById(pos.id, TENANT_ID)
      expect(updatedPos!.filled).toBe(1)
    })

    it('【正例】filled 达到 slots 时自动关闭职位', () => {
      const pos = svc.createPosition({
        tenantId: TENANT_ID, title: '测试岗', department: '测试',
        type: 'full-time', slots: 2, requirements: [], salary: { min: 4000, max: 5000 },
      })
      const c1 = createCandidate(svc, pos.id, { name: '入职者1' })
      const c2 = createCandidate(svc, pos.id, { name: '入职者2' })
      svc.updateCandidateStatus(c1.id, TENANT_ID, { stage: 'hired' })
      svc.updateCandidateStatus(c2.id, TENANT_ID, { stage: 'hired' })
      const updatedPos = svc.findPositionById(pos.id, TENANT_ID)
      expect(updatedPos!.filled).toBe(2)
      expect(updatedPos!.status).toBe('closed')
    })

    it('【正例】候选人可流转到 rejected', () => {
      const pos = createDefaultPosition(svc)
      const cand = createCandidate(svc, pos.id, { name: '淘汰者' })
      const updated = svc.updateCandidateStatus(cand.id, TENANT_ID, {
        stage: 'rejected',
        result: '面试不通过',
        remark: '技术水平不匹配',
      })
      expect(updated.stage).toBe('rejected')
      expect(updated.result).toBe('面试不通过')
    })

    it('【反例】createCandidate 不存在的职位抛异常', () => {
      expect(() => svc.createCandidate({
        tenantId: TENANT_ID, positionId: 'pos-non-existent',
        name: '无效', phone: '13900000000', source: 'platform',
      })).toThrow('Position not found')
    })

    it('【反例】updateCandidateStatus 不存在的候选人抛异常', () => {
      expect(() => svc.updateCandidateStatus('cand-non-existent', TENANT_ID, { stage: 'hired' })).toThrow('Candidate not found')
    })
  })

  // ── 3. 内推管理 ────────────────────────────────

  describe('内推管理 (createReferral)', () => {
    it('【正例】createReferral 创建内推记录', () => {
      const pos = createDefaultPosition(svc)
      const cand = createCandidate(svc, pos.id, { name: '内推人' })
      const ref = svc.createReferral({
        tenantId: TENANT_ID,
        candidateId: cand.id,
        referrerId: 'E001',
        referrerName: '张三',
        reward: 500,
      })
      expect(ref.id).toMatch(/^ref-/)
      expect(ref.referrerName).toBe('张三')
      expect(ref.reward).toBe(500)
      expect(ref.status).toBe('pending')
    })

    it('【反例】createReferral 不存在的候选人抛异常', () => {
      expect(() => svc.createReferral({
        tenantId: TENANT_ID, candidateId: 'cand-non-existent',
        referrerId: 'E001', referrerName: '张三', reward: 500,
      })).toThrow('Candidate not found')
    })
  })

  // ── 4. 招聘统计 ────────────────────────────────

  describe('招聘统计 (getRecruitmentStats / getOnboardingInfo)', () => {
    it('【正例】getRecruitmentStats 返回完整统计', () => {
      const stats = svc.getRecruitmentStats(TENANT_ID)
      expect(stats).toHaveProperty('totalPositions')
      expect(stats).toHaveProperty('openPositions')
      expect(stats).toHaveProperty('closedPositions')
      expect(stats).toHaveProperty('totalCandidates')
      expect(stats).toHaveProperty('stageDistribution')
      expect(stats).toHaveProperty('sourceDistribution')
      expect(stats).toHaveProperty('totalReferrals')
      expect(stats).toHaveProperty('averageScore')
    })

    it('【正例】阶段分布统计正确', () => {
      const pos = createDefaultPosition(svc)
      createCandidate(svc, pos.id, { name: '电话' })
      const cand2 = createCandidate(svc, pos.id, { name: '录用' })
      svc.updateCandidateStatus(cand2.id, TENANT_ID, { stage: 'hired' })
      const stats = svc.getRecruitmentStats(TENANT_ID)
      expect(stats.stageDistribution.phone).toBeGreaterThanOrEqual(1)
      expect(stats.stageDistribution.hired).toBeGreaterThanOrEqual(1)
    })

    it('【正例】getOnboardingInfo 返回入职信息', () => {
      const pos = createDefaultPosition(svc)
      const cand = createCandidate(svc, pos.id, { name: '待入职' })
      const info = svc.getOnboardingInfo(cand.id, TENANT_ID)
      expect(info.candidate).toBeDefined()
      expect(info.position).toBeDefined()
      expect(info.onboardingSteps.length).toBeGreaterThan(0)
      expect(info.onboardingSteps).toContain('签订劳动合同')
    })

    it('【边界】空租户统计全为零', () => {
      const stats = svc.getRecruitmentStats(OTHER_TENANT)
      expect(stats.totalPositions).toBe(0)
      expect(stats.totalCandidates).toBe(0)
      expect(stats.totalReferrals).toBe(0)
      expect(stats.averageScore).toBe(0)
    })

    it('【反例】getOnboardingInfo 不存在的候选人抛异常', () => {
      expect(() => svc.getOnboardingInfo('cand-non-existent', TENANT_ID)).toThrow('Candidate not found')
    })
  })

  // ── 5. 种子数据 ────────────────────────────────

  describe('种子数据验证', () => {
    it('【正例】种子数据提供职位和候选人', () => {
      const positions = svc.findAllPositions(TENANT_ID)
      expect(positions.length).toBeGreaterThanOrEqual(3)
      const candidates = svc.findCandidates(TENANT_ID)
      expect(candidates.length).toBeGreaterThanOrEqual(5)
    })

    it('【正例】种子数据包含内推记录', () => {
      const stats = svc.getRecruitmentStats(TENANT_ID)
      expect(stats.totalReferrals).toBeGreaterThanOrEqual(1)
    })
  })
})
