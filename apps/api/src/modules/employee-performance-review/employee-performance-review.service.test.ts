/**
 * 🧪 员工绩效考评 Service 单元测试
 *
 * 覆盖: list / getById / getSummary / create / delete
 * 原则: 正例 + 反例 + 边界 三件套
 */
import { describe, it, expect, beforeEach } from 'vitest'
import {
  EmployeePerformanceReviewService,
} from './employee-performance-review.service'
import { EmployeeRole } from './employee-performance-review.entity'

// ── 帮助函数 ──
const defaultTenant = (): Parameters<typeof svc.list>[0] => ({
  tenantId: 'default',
})

const otherTenant = (): Parameters<typeof svc.list>[0] => ({
  tenantId: 'other-tenant',
})

let svc: EmployeePerformanceReviewService

beforeEach(() => {
  EmployeePerformanceReviewService.resetTestState()
  EmployeePerformanceReviewService.seedTestData()
  svc = new EmployeePerformanceReviewService()
})

// ════════════════════════════════════════════════
//  list 方法
// ════════════════════════════════════════════════
describe('list()', () => {
  it('默认返回所有8条seed数据', () => {
    const result = svc.list(defaultTenant())
    expect(result.total).toBe(8)
    expect(result.items).toHaveLength(8)
  })

  it('按 storeId 筛选', () => {
    const r1 = svc.list(defaultTenant(), { storeId: 'store-001' })
    expect(r1.total).toBe(3) // 张伟(manager) + 李娜(staff) + 王强(technician)
    expect(r1.items.every((i) => i.storeId === 'store-001')).toBe(true)

    const r2 = svc.list(defaultTenant(), { storeId: 'store-002' })
    expect(r2.total).toBe(2) // 赵敏(staff) + 刘洋(manager)

    const r3 = svc.list(defaultTenant(), { storeId: 'store-003' })
    expect(r3.total).toBe(3) // 陈雪(trainee) + 杨帆(technician) + 周杰(staff)
  })

  it('按 role 筛选', () => {
    const managers = svc.list(defaultTenant(), { role: EmployeeRole.Manager })
    expect(managers.total).toBe(2) // 张伟 + 刘洋
    expect(managers.items.every((i) => i.role === EmployeeRole.Manager)).toBe(true)

    const trainees = svc.list(defaultTenant(), { role: EmployeeRole.Trainee })
    expect(trainees.total).toBe(1) // 陈雪
  })

  it('按 month 筛选', () => {
    const result = svc.list(defaultTenant(), { month: '2026-07' })
    expect(result.total).toBe(8) // 全部是 2026-07

    const empty = svc.list(defaultTenant(), { month: '2025-01' })
    expect(empty.total).toBe(0)
  })

  it('按 score 排序（降序）', () => {
    const result = svc.list(defaultTenant(), { sortBy: 'score' })
    const scores = result.items.map((i) => i.score)
    expect(scores).toEqual([...scores].sort((a, b) => b - a))
    expect(result.items[0].name).toBe('张伟') // 92
    expect(result.items[7].name).toBe('陈雪') // 72
  })

  it('按 completedTasks 排序（降序）', () => {
    const result = svc.list(defaultTenant(), { sortBy: 'completedTasks' })
    const tasks = result.items.map((i) => i.completedTasks)
    expect(tasks).toEqual([...tasks].sort((a, b) => b - a))
    expect(result.items[0].completedTasks).toBe(156) // 张伟
    expect(result.items[7].completedTasks).toBe(65) // 陈雪
  })

  it('按 customerRating 排序（降序）', () => {
    const result = svc.list(defaultTenant(), { sortBy: 'customerRating' })
    const ratings = result.items.map((i) => i.customerRating)
    expect(ratings).toEqual([...ratings].sort((a, b) => b - a))
    // 张伟 4.8 和 杨帆 4.8 并列第一
    expect(result.items[0].customerRating).toBe(4.8)
    expect(result.items[7].customerRating).toBe(4.0) // 陈雪
  })

  it('按 revenueContribution 排序（降序）', () => {
    const result = svc.list(defaultTenant(), { sortBy: 'revenueContribution' })
    const revs = result.items.map((i) => i.revenueContribution)
    expect(revs).toEqual([...revs].sort((a, b) => b - a))
    expect(result.items[0].revenueContribution).toBe(450000) // 张伟
    expect(result.items[7].revenueContribution).toBe(85000) // 陈雪
  })

  it('不存在的 tenantId 返回空', () => {
    const result = svc.list(otherTenant())
    expect(result.total).toBe(0)
    expect(result.items).toHaveLength(0)
  })

  it('空查询对象与 undefined 行为一致', () => {
    const withEmpty = svc.list(defaultTenant(), {})
    const withUndefined = svc.list(defaultTenant())
    expect(withEmpty.total).toBe(withUndefined.total)
    expect(withEmpty.items).toHaveLength(withUndefined.items.length)
  })

  it('未指定 sortBy 时默认按 score 降序', () => {
    const defaultSorted = svc.list(defaultTenant())
    const scoreSorted = svc.list(defaultTenant(), { sortBy: 'score' })
    expect(defaultSorted.items.map((i) => i.id)).toEqual(
      scoreSorted.items.map((i) => i.id),
    )
  })
})

// ════════════════════════════════════════════════
//  getById 方法
// ════════════════════════════════════════════════
describe('getById()', () => {
  it('返回正确记录', () => {
    const record = svc.getById('perf-001', defaultTenant())
    expect(record).toBeDefined()
    expect(record.name).toBe('张伟')
    expect(record.score).toBe(92)
  })

  it('返回记录的 tenantId 匹配', () => {
    const record = svc.getById('perf-005', defaultTenant())
    expect(record.tenantId).toBe('default')
  })

  it('不存在的 id 抛 Error', () => {
    expect(() => svc.getById('non-existent-id', defaultTenant())).toThrow(
      /Employee performance .+ not found/,
    )
  })

  it('跨租户访问抛出 Error', () => {
    // perf-001 属于 default tenant，用 other-tenant 访问应抛异常
    expect(() => svc.getById('perf-001', otherTenant())).toThrow(
      /Employee performance .+ not found/,
    )
  })
})

// ════════════════════════════════════════════════
//  getSummary 方法
// ════════════════════════════════════════════════
describe('getById() - 额外边缘场景', () => {
  it('getById 返回的记录字段完整', () => {
    const record = svc.getById('perf-004', defaultTenant())
    expect(record).toHaveProperty('id')
    expect(record).toHaveProperty('tenantId')
    expect(record).toHaveProperty('storeId')
    expect(record).toHaveProperty('month')
    expect(record).toHaveProperty('createdAt')
    expect(record.employeeId).toBe('emp-004')
    expect(record.name).toBe('赵敏')
  })

  it('多个getById调用返回一致结果', () => {
    const r1 = svc.getById('perf-006', defaultTenant())
    const r2 = svc.getById('perf-006', defaultTenant())
    expect(r1).toEqual(r2)
  })
})

describe('getSummary()', () => {
  it('totalEmployees = 8', () => {
    const summary = svc.getSummary(defaultTenant())
    expect(summary.totalEmployees).toBe(8)
  })

  it('avgScore = 84.3（8条数据的平均分，JS toFixed 对 .25 进位）', () => {
    const summary = svc.getSummary(defaultTenant())
    // (92+85+88+79+90+72+87+81) / 8 = 674 / 8 = 84.25
    // JavaScript toFixed(1) 对 .25 进一位 → 84.3
    expect(summary.avgScore).toBe(84.3)
  })

  it('topPerformer = "张伟"（score 92 最高）', () => {
    const summary = svc.getSummary(defaultTenant())
    expect(summary.topPerformer).toBe('张伟')
  })

  it('lowestArea 是 trainee（陈雪 score 72，trainee 唯一）', () => {
    const summary = svc.getSummary(defaultTenant())
    expect(summary.lowestArea).toBe(EmployeeRole.Trainee)
  })

  it('teamAverage 等于 customerRating 的平均值', () => {
    const summary = svc.getSummary(defaultTenant())
    const ratings = [4.8, 4.5, 4.7, 4.2, 4.6, 4.0, 4.8, 4.3]
    const expectedAvg = Number(
      (ratings.reduce((s, r) => s + r, 0) / ratings.length).toFixed(1),
    )
    expect(summary.teamAverage).toBe(expectedAvg)
  })

  it('空租户返回全0', () => {
    const summary = svc.getSummary(otherTenant())
    expect(summary).toEqual({
      totalEmployees: 0,
      avgScore: 0,
      topPerformer: '',
      lowestArea: '',
      teamAverage: 0,
    })
  })
})

// ════════════════════════════════════════════════
//  create 方法
// ════════════════════════════════════════════════
describe('create()', () => {
  const sampleInput = {
    employeeId: 'emp-new',
    name: '新员工',
    role: EmployeeRole.Staff,
    storeId: 'store-001',
    score: 80,
    completedTasks: 100,
    customerRating: 4.0,
    attendanceRate: 95.0,
    revenueContribution: 150000,
    month: '2026-07',
  }

  it('创建成功，总数+1', () => {
    const before = svc.list(defaultTenant()).total
    svc.create(defaultTenant(), sampleInput)
    const after = svc.list(defaultTenant()).total
    expect(after).toBe(before + 1)
  })

  it('创建后 list 包含新记录', () => {
    const created = svc.create(defaultTenant(), sampleInput)
    const result = svc.list(defaultTenant())
    expect(result.items.some((i) => i.id === created.id)).toBe(true)
    const found = result.items.find((i) => i.id === created.id)
    expect(found?.name).toBe('新员工')
  })

  it('创建记录有 id 和 createdAt', () => {
    const created = svc.create(defaultTenant(), sampleInput)
    expect(created.id).toBeTruthy()
    expect(created.id).toMatch(/^perf-/)
    expect(created.createdAt).toBeTruthy()
    expect(() => new Date(created.createdAt)).not.toThrow()
  })

  it('不同租户创建互不干扰', () => {
    svc.create(defaultTenant(), sampleInput)
    const otherResult = svc.list(otherTenant())
    expect(otherResult.total).toBe(0)
  })
})

// ════════════════════════════════════════════════
//  delete 方法
// ════════════════════════════════════════════════
describe('delete()', () => {
  it('删除成功，总数-1', () => {
    const before = svc.list(defaultTenant()).total
    svc.delete('perf-001', defaultTenant())
    const after = svc.list(defaultTenant()).total
    expect(after).toBe(before - 1)
  })

  it('删除后 getById 抛异常', () => {
    svc.delete('perf-002', defaultTenant())
    expect(() => svc.getById('perf-002', defaultTenant())).toThrow(
      /Employee performance .+ not found/,
    )
  })

  it('删除不存在的 id 抛异常', () => {
    expect(() => svc.delete('non-existent', defaultTenant())).toThrow(
      /Employee performance .+ not found/,
    )
  })

  it('跨租户删除抛异常', () => {
    expect(() => svc.delete('perf-003', otherTenant())).toThrow(
      /Employee performance .+ not found/,
    )
  })
})
