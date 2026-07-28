/**
 * team-building.service.spec.ts — 团建模块 Service 单元测试
 *
 * 覆盖: CRUD / 方案推荐 / 设备校验 / 活动管理 / 报告生成 / CRM同步 / 看板
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { TeamBuildingService, type TeamBuildingPlan } from './team-building.service'
import { NotFoundException, BadRequestException } from '@nestjs/common'

describe('TeamBuildingService — CRUD', () => {
  let svc: TeamBuildingService
  const tenantId = 'tenant-001'

  beforeEach(() => {
    svc = new TeamBuildingService()
  })

  it('create 创建方案成功', () => {
    const plan = svc.create({
      tenantId,
      name: '测试团建方案',
      type: 'outdoor',
      location: '测试地点',
      budget: 1000000,
      expectedParticipants: 20,
      description: '测试描述',
      recommendedSeason: '秋季',
      remark: '测试备注',
    })
    expect(plan.id).toMatch(/^tb-/)
    expect(plan.name).toBe('测试团建方案')
    expect(plan.budget).toBe(1000000)
  })

  it('findById 返回指定方案', () => {
    const plan = svc.create({
      tenantId, name: '查询方案', type: 'dinner',
      location: '餐厅', budget: 500000,
      expectedParticipants: 10, description: '查询测试',
    })
    const found = svc.findById(plan.id, tenantId)
    expect(found).toBeDefined()
    expect(found!.name).toBe('查询方案')
  })

  it('findById 返回 undefined 当方案不存在', () => {
    expect(svc.findById('fake-id', tenantId)).toBeUndefined()
  })

  it('findAll 返回所有方案（种子）', () => {
    const plans = svc.findAll(tenantId)
    expect(plans.length).toBeGreaterThan(0)
  })

  it('findAll 支持按类型筛选', () => {
    const outdoor = svc.findAll(tenantId, { type: 'outdoor' })
    outdoor.forEach((p) => expect(p.type).toBe('outdoor'))
  })

  it('findAll 支持搜索', () => {
    const items = svc.findAll(tenantId, { search: '密室' })
    items.forEach((p) => {
      const q = '密室'
      const match = p.name.includes(q) || p.location.includes(q) || p.description.includes(q)
      expect(match).toBeTruthy()
    })
  })

  it('update 更新方案字段', () => {
    const plan = svc.create({
      tenantId, name: '旧方案', type: 'ktv',
      location: '老地方', budget: 100000,
      expectedParticipants: 5, description: '旧描述',
    })
    const updated = svc.update(plan.id, tenantId, {
      name: '新方案',
      budget: 200000,
      description: '新描述',
    })
    expect(updated.name).toBe('新方案')
    expect(updated.budget).toBe(200000)
  })

  it('delete 删除成功', () => {
    const plan = svc.create({
      tenantId, name: '删除方案', type: 'sports',
      location: '体育馆', budget: 100000,
      expectedParticipants: 10, description: '删除',
    })
    svc.delete(plan.id, tenantId)
    expect(svc.findById(plan.id, tenantId)).toBeUndefined()
  })

  it('delete 不存在的方案抛 NotFoundException', () => {
    expect(() => svc.delete('fake-id', tenantId)).toThrow(NotFoundException)
  })
})

describe('TeamBuildingService — 统计', () => {
  let svc: TeamBuildingService
  const tenantId = 'tenant-001'

  beforeEach(() => {
    svc = new TeamBuildingService()
  })

  it('getStats 返回统计信息', () => {
    const stats = svc.getStats(tenantId)
    expect(stats.totalPlans).toBeGreaterThan(0)
    expect(stats.avgBudget).toBeGreaterThan(0)
    expect(stats.minBudget).toBeLessThanOrEqual(stats.maxBudget)
    expect(stats.byType.outdoor).toBeGreaterThan(0)
  })

  it('getTypeLabels 返回中文标签', () => {
    const labels = svc.getTypeLabels()
    expect(labels.outdoor).toBe('户外拓展')
    expect(labels['escape-room']).toBe('密室逃脱')
  })
})

describe('TeamBuildingService — 方案推荐', () => {
  let svc: TeamBuildingService
  const tenantId = 'tenant-001'

  beforeEach(() => {
    svc = new TeamBuildingService()
  })

  it('recommendPlans 返回推荐结果', () => {
    const results = svc.recommendPlans(tenantId, {
      tenantId,
      participants: 20,
      budget: 500000,
      ageGroup: 'adult',
    })
    expect(results.length).toBeGreaterThan(0)
    results.forEach((r) => {
      expect(r.planId).toBeDefined()
      expect(r.score).toBeGreaterThanOrEqual(0)
      expect(r.score).toBeLessThanOrEqual(100)
      expect(typeof r.recommended).toBe('boolean')
      expect(r.aiSuggestion).toBeDefined()
    })
  })

  it('recommendPlans 带类型偏好', () => {
    const results = svc.recommendPlans(tenantId, {
      tenantId,
      participants: 30,
      budget: 2000000,
      preferredType: 'outdoor',
      ageGroup: 'mixed',
    })
    const outdoorResults = results.filter((r) => r.type === 'outdoor')
    expect(outdoorResults.length).toBeGreaterThan(0)
  })

  it('recommendPlans 空方案返回空', () => {
    const svc2 = new TeamBuildingService()
    const results = svc2.recommendPlans('nonexistent-tenant', {
      tenantId: 'nonexistent-tenant',
      participants: 10, budget: 100000,
      ageGroup: 'youth',
    })
    expect(results).toEqual([])
  })
})

describe('TeamBuildingService — 活动管理', () => {
  let svc: TeamBuildingService
  const tenantId = 'tenant-001'

  beforeEach(() => {
    svc = new TeamBuildingService()
  })

  it('createEvent 创建活动成功', () => {
    const event = svc.createEvent({
      tenantId, planId: 'tb-plan-001', name: '测试活动',
      eventDate: '2026-08-15', participants: 20,
      participantMemberIds: ['mem-001', 'mem-002'],
    })
    expect(event.id).toMatch(/^evt-/)
    expect(event.status).toBe('scheduled')
    expect(event.participantMemberIds).toHaveLength(2)
  })

  it('getEvents 按日期范围筛选', () => {
    svc.createEvent({
      tenantId, planId: 'p1', name: '活动1',
      eventDate: '2026-08-01', participants: 10,
    })
    svc.createEvent({
      tenantId, planId: 'p2', name: '活动2',
      eventDate: '2026-09-01', participants: 15,
    })
    const events = svc.getEvents(tenantId, { fromDate: '2026-08-01', toDate: '2026-08-31' })
    events.forEach((e) => {
      expect(e.eventDate >= '2026-08-01').toBeTruthy()
      expect(e.eventDate <= '2026-08-31').toBeTruthy()
    })
  })

  it('updateEvent 更新活动信息', () => {
    const event = svc.createEvent({
      tenantId, planId: 'p1', name: '旧名',
      eventDate: '2026-08-10', participants: 10,
    })
    const updated = svc.updateEvent(event.id, tenantId, {
      name: '新活动名',
      participants: 20,
      status: 'cancelled',
    })
    expect(updated.name).toBe('新活动名')
    expect(updated.participants).toBe(20)
    expect(updated.status).toBe('cancelled')
  })

  it('completeEvent 完成活动', () => {
    const event = svc.createEvent({
      tenantId, planId: 'p1', name: '待完成',
      eventDate: '2026-08-10', participants: 15,
    })
    const completed = svc.completeEvent(event.id, tenantId, {
      actualParticipants: 14,
      totalSpend: 300000,
      avgSatisfaction: 4.5,
    })
    expect(completed.status).toBe('completed')
    expect(completed.actualParticipants).toBe(14)
    expect(completed.totalSpend).toBe(300000)
    expect(completed.avgSatisfaction).toBe(4.5)
  })

  it('completeEvent 重复完成抛 BadRequestException', () => {
    const event = svc.createEvent({
      tenantId, planId: 'p1', name: '已完成的',
      eventDate: '2026-08-10', participants: 10,
    })
    svc.completeEvent(event.id, tenantId, {
      actualParticipants: 10, totalSpend: 100000, avgSatisfaction: 4,
    })
    expect(() => svc.completeEvent(event.id, tenantId, {
      actualParticipants: 10, totalSpend: 100000, avgSatisfaction: 4,
    })).toThrow(BadRequestException)
  })
})

describe('TeamBuildingService — 报告生成', () => {
  let svc: TeamBuildingService
  const tenantId = 'tenant-001'

  beforeEach(() => {
    svc = new TeamBuildingService()
  })

  it('generateReport 成功生成报告', () => {
    const event = svc.createEvent({
      tenantId, planId: 'p1', name: '团建活动',
      eventDate: '2026-08-10', participants: 20,
    })
    svc.completeEvent(event.id, tenantId, {
      actualParticipants: 18, totalSpend: 500000, avgSatisfaction: 4.2,
    })
    const report = svc.generateReport(event.id, tenantId)
    expect(report.id).toMatch(/^rpt-/)
    expect(report.participantCount).toBe(18)
    expect(report.totalSpend).toBe(500000)
    expect(report.avgSatisfaction).toBe(4.2)
    expect(report.avgSpend).toBeGreaterThan(0)
    expect(report.satisfactionBreakdown).toBeDefined()
  })

  it('generateReport 未完成的活动抛 BadRequestException', () => {
    const event = svc.createEvent({
      tenantId, planId: 'p1', name: '未完成',
      eventDate: '2026-08-10', participants: 10,
    })
    expect(() => svc.generateReport(event.id, tenantId)).toThrow(BadRequestException)
  })

  it('getReport 返回指定报告', () => {
    const event = svc.createEvent({
      tenantId, planId: 'p1', name: '报告测试',
      eventDate: '2026-08-10', participants: 10,
    })
    svc.completeEvent(event.id, tenantId, {
      actualParticipants: 10, totalSpend: 200000, avgSatisfaction: 4.0,
    })
    const report = svc.generateReport(event.id, tenantId)
    const found = svc.getReport(report.id, tenantId)
    expect(found.eventId).toBe(event.id)
  })

  it('getReport 不存在的报告抛 NotFoundException', () => {
    expect(() => svc.getReport('fake-id', tenantId)).toThrow(NotFoundException)
  })
})

describe('TeamBuildingService — CRM同步', () => {
  let svc: TeamBuildingService
  const tenantId = 'tenant-001'

  beforeEach(() => {
    svc = new TeamBuildingService()
  })

  it('syncToCrm 同步成功', () => {
    const event = svc.createEvent({
      tenantId, planId: 'p1', name: 'CRM同步测试',
      eventDate: '2026-08-10', participants: 5,
      participantMemberIds: ['mem-01', 'mem-02'],
    })
    svc.completeEvent(event.id, tenantId, {
      actualParticipants: 5, totalSpend: 50000, avgSatisfaction: 5,
    })
    const sync = svc.syncToCrm(event.id, tenantId)
    expect(sync.syncStatus).toBe('synced')
    expect(sync.eventId).toBe(event.id)
  })

  it('syncToCrm 未完成的活动抛 BadRequestException', () => {
    const event = svc.createEvent({
      tenantId, planId: 'p1', name: '未完成',
      eventDate: '2026-08-10', participants: 5,
    })
    expect(() => svc.syncToCrm(event.id, tenantId)).toThrow(BadRequestException)
  })

  it('syncToCrm 重复同步抛 BadRequestException', () => {
    const event = svc.createEvent({
      tenantId, planId: 'p1', name: '重复同步',
      eventDate: '2026-08-10', participants: 5,
    })
    svc.completeEvent(event.id, tenantId, {
      actualParticipants: 5, totalSpend: 50000, avgSatisfaction: 5,
    })
    svc.syncToCrm(event.id, tenantId)
    expect(() => svc.syncToCrm(event.id, tenantId)).toThrow(/已同步/)
  })

  it('getSyncStatus 返回同步状态', () => {
    const event = svc.createEvent({
      tenantId, planId: 'p1', name: '同步状态',
      eventDate: '2026-08-10', participants: 5,
    })
    const status = svc.getSyncStatus(event.id, tenantId)
    expect(status).toBeNull()
  })
})

describe('TeamBuildingService — 看板', () => {
  let svc: TeamBuildingService
  const tenantId = 'tenant-001'

  beforeEach(() => {
    svc = new TeamBuildingService()
  })

  it('getDashboard 返回看板数据', () => {
    const db = svc.getDashboard(tenantId)
    expect(db.month).toBeDefined()
    expect(typeof db.totalEvents).toBe('number')
    expect(typeof db.totalParticipants).toBe('number')
    expect(typeof db.totalSpend).toBe('number')
    expect(db.byType).toBeDefined()
    expect(db.monthlyTrend).toBeDefined()
    expect(db.topPlans).toBeDefined()
  })

  it('getDashboard 指定月份', () => {
    const db = svc.getDashboard(tenantId, '2026-07')
    expect(db.month).toBe('2026-07')
  })
})
