import { randomUUID } from 'node:crypto'
import { Injectable } from '@nestjs/common'
import type { RequestTenantContext } from '../tenant/tenant.types'
import { EmployeeRole, type EmployeePerformance } from './employee-performance-review.entity'
import type { EmployeePerformanceQueryDto, CreateEmployeePerformanceDto } from './employee-performance-review.dto'

const performanceStore = new Map<string, EmployeePerformance>()

function seedMockData() {
  if (performanceStore.size > 0) return

  const tenantId = 'default'
  const now = new Date().toISOString()

  const mockData: EmployeePerformance[] = [
    {
      id: 'perf-001', tenantId, employeeId: 'emp-001', name: '张伟',
      role: EmployeeRole.Manager, storeId: 'store-001',
      score: 92, completedTasks: 156, customerRating: 4.8,
      attendanceRate: 98.5, revenueContribution: 450000, month: '2026-07', createdAt: now,
    },
    {
      id: 'perf-002', tenantId, employeeId: 'emp-002', name: '李娜',
      role: EmployeeRole.Staff, storeId: 'store-001',
      score: 85, completedTasks: 128, customerRating: 4.5,
      attendanceRate: 96.2, revenueContribution: 280000, month: '2026-07', createdAt: now,
    },
    {
      id: 'perf-003', tenantId, employeeId: 'emp-003', name: '王强',
      role: EmployeeRole.Technician, storeId: 'store-001',
      score: 88, completedTasks: 98, customerRating: 4.7,
      attendanceRate: 97.1, revenueContribution: 320000, month: '2026-07', createdAt: now,
    },
    {
      id: 'perf-004', tenantId, employeeId: 'emp-004', name: '赵敏',
      role: EmployeeRole.Staff, storeId: 'store-002',
      score: 79, completedTasks: 112, customerRating: 4.2,
      attendanceRate: 93.8, revenueContribution: 195000, month: '2026-07', createdAt: now,
    },
    {
      id: 'perf-005', tenantId, employeeId: 'emp-005', name: '刘洋',
      role: EmployeeRole.Manager, storeId: 'store-002',
      score: 90, completedTasks: 142, customerRating: 4.6,
      attendanceRate: 99.0, revenueContribution: 380000, month: '2026-07', createdAt: now,
    },
    {
      id: 'perf-006', tenantId, employeeId: 'emp-006', name: '陈雪',
      role: EmployeeRole.Trainee, storeId: 'store-003',
      score: 72, completedTasks: 65, customerRating: 4.0,
      attendanceRate: 95.5, revenueContribution: 85000, month: '2026-07', createdAt: now,
    },
    {
      id: 'perf-007', tenantId, employeeId: 'emp-007', name: '杨帆',
      role: EmployeeRole.Technician, storeId: 'store-003',
      score: 87, completedTasks: 105, customerRating: 4.8,
      attendanceRate: 97.8, revenueContribution: 295000, month: '2026-07', createdAt: now,
    },
    {
      id: 'perf-008', tenantId, employeeId: 'emp-008', name: '周杰',
      role: EmployeeRole.Staff, storeId: 'store-003',
      score: 81, completedTasks: 95, customerRating: 4.3,
      attendanceRate: 94.2, revenueContribution: 175000, month: '2026-07', createdAt: now,
    },
  ]

  for (const item of mockData) {
    performanceStore.set(item.id, item)
  }
}

@Injectable()
export class EmployeePerformanceReviewService {
  constructor() {
    seedMockData()
  }

  /**
   * 测试辅助：重置内部状态，清空所有种子数据
   */
  static resetTestState(): void {
    performanceStore.clear()
  }

  /**
   * 测试辅助：重新注入种子数据
   */
  static seedTestData(): void {
    seedMockData()
  }

  list(
    tenantContext: RequestTenantContext,
    query?: EmployeePerformanceQueryDto,
  ): { items: EmployeePerformance[]; total: number } {
    let items = Array.from(performanceStore.values())
      .filter((r) => r.tenantId === tenantContext.tenantId)

    if (query?.storeId) {
      items = items.filter((r) => r.storeId === query.storeId)
    }
    if (query?.role) {
      items = items.filter((r) => r.role === query.role)
    }
    if (query?.month) {
      items = items.filter((r) => r.month === query.month)
    }

    // Sort
    if (query?.sortBy === 'score') {
      items.sort((a, b) => b.score - a.score)
    } else if (query?.sortBy === 'completedTasks') {
      items.sort((a, b) => b.completedTasks - a.completedTasks)
    } else if (query?.sortBy === 'customerRating') {
      items.sort((a, b) => b.customerRating - a.customerRating)
    } else if (query?.sortBy === 'revenueContribution') {
      items.sort((a, b) => b.revenueContribution - a.revenueContribution)
    } else {
      items.sort((a, b) => b.score - a.score)
    }

    return { items, total: items.length }
  }

  getById(id: string, tenantContext: RequestTenantContext): EmployeePerformance {
    const record = performanceStore.get(id)
    if (!record || record.tenantId !== tenantContext.tenantId) {
      throw new Error(`Employee performance ${id} not found`)
    }
    return record
  }

  getSummary(tenantContext: RequestTenantContext) {
    const items = Array.from(performanceStore.values())
      .filter((r) => r.tenantId === tenantContext.tenantId)

    if (items.length === 0) {
      return {
        totalEmployees: 0,
        avgScore: 0,
        topPerformer: '',
        lowestArea: '',
        teamAverage: 0,
      }
    }

    const totalEmployees = items.length
    const avgScore = Number((items.reduce((s, r) => s + r.score, 0) / totalEmployees).toFixed(1))
    const teamAverage = Number((items.reduce((s, r) => s + r.customerRating, 0) / totalEmployees).toFixed(1))

    // Top performer
    const topPerformerItem = items.reduce((max, curr) =>
      curr.score > max.score ? curr : max,
    )

    // Lowest area (find the role with lowest avg score)
    const byRole: Record<string, { count: number; totalScore: number }> = {}
    for (const item of items) {
      if (!byRole[item.role]) byRole[item.role] = { count: 0, totalScore: 0 }
      byRole[item.role].count++
      byRole[item.role].totalScore += item.score
    }
    let lowestArea = ''
    let lowestAvg = Infinity
    for (const [role, data] of Object.entries(byRole)) {
      const avg = data.totalScore / data.count
      if (avg < lowestAvg) {
        lowestAvg = avg
        lowestArea = role
      }
    }

    return {
      totalEmployees,
      avgScore,
      topPerformer: topPerformerItem.name,
      lowestArea,
      teamAverage,
    }
  }

  create(
    tenantContext: RequestTenantContext,
    input: CreateEmployeePerformanceDto,
  ): EmployeePerformance {
    const now = new Date().toISOString()
    const record: EmployeePerformance = {
      id: `perf-${randomUUID()}`,
      tenantId: tenantContext.tenantId,
      employeeId: input.employeeId,
      name: input.name,
      role: input.role,
      storeId: input.storeId,
      score: input.score,
      completedTasks: input.completedTasks,
      customerRating: input.customerRating,
      attendanceRate: input.attendanceRate,
      revenueContribution: input.revenueContribution,
      month: input.month,
      createdAt: now,
    }
    performanceStore.set(record.id, record)
    return record
  }

  delete(id: string, tenantContext: RequestTenantContext): void {
    const record = performanceStore.get(id)
    if (!record || record.tenantId !== tenantContext.tenantId) {
      throw new Error(`Employee performance ${id} not found`)
    }
    performanceStore.delete(id)
  }
}
