/**
 * maintenance-plan.service.spec.ts — 维保计划 Service 单元测试 (V23)
 *
 * 覆盖: createPlan / getPlan / listPlans / updatePlan / updatePlanStatus / getScheduledPlans
 * 规则: 无 describe.skip · 无 it.only · beforeEach 隔离
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { MaintenancePlanService } from './maintenance-plan.service'
import { MaintenanceType, MaintenanceStatus, Priority } from './maintenance-plan.entity'

const TENANT_ID = 'tenant-test'

describe('MaintenancePlanService', () => {
  let service: MaintenancePlanService

  beforeEach(() => {
    service = new MaintenancePlanService()
    service.resetPlanStoresForTests()
    service.seedMockData(TENANT_ID)
  })

  // ════════════════════════════════════════════
  // createPlan
  // ════════════════════════════════════════════

  describe('createPlan', () => {
    it('正例: 创建维保计划', () => {
      const plan = service.createPlan({
        tenantId: TENANT_ID,
        title: '测试维保计划',
        type: MaintenanceType.Routine,
        priority: Priority.Medium,
        deviceName: '测试设备',
        deviceId: 'DEV-TEST',
        assignedTo: '张工',
        scheduledAt: new Date().toISOString(),
        description: '例行检查',
      })
      expect(plan.id).toBeTruthy()
      expect(plan.planNo).toMatch(/^MP\d{8}\d{4}$/)
      expect(plan.status).toBe(MaintenanceStatus.Scheduled)
    })

    it('正例: 创建紧急维修计划', () => {
      const plan = service.createPlan({
        tenantId: TENANT_ID,
        title: '紧急维修',
        type: MaintenanceType.Emergency,
        priority: Priority.Urgent,
        deviceName: '核心交换机',
        deviceId: 'NET-CORE',
        assignedTo: '王工',
        scheduledAt: new Date().toISOString(),
        description: '网络故障',
      })
      expect(plan.type).toBe(MaintenanceType.Emergency)
      expect(plan.priority).toBe(Priority.Urgent)
    })

    it('正例: 带result和cost创建', () => {
      const plan = service.createPlan({
        tenantId: TENANT_ID,
        title: '已完成维保',
        type: MaintenanceType.Upgrade,
        priority: Priority.High,
        deviceName: '服务器',
        deviceId: 'SRV-01',
        assignedTo: '李工',
        scheduledAt: new Date().toISOString(),
        description: '升级系统',
        result: '升级成功',
        cost: 5000,
      })
      expect(plan.result).toBe('升级成功')
      expect(plan.cost).toBe(5000)
    })
  })

  // ════════════════════════════════════════════
  // getPlan / listPlans
  // ════════════════════════════════════════════

  describe('getPlan', () => {
    it('正例: 获取种子数据中的计划', () => {
      const plans = service.listPlans(TENANT_ID)
      const first = service.getPlan(plans[0].id, TENANT_ID)
      expect(first).toBeDefined()
    })

    it('反例: 不同tenant返回undefined', () => {
      const plans = service.listPlans(TENANT_ID)
      expect(service.getPlan(plans[0].id, 'other-tenant')).toBeUndefined()
    })
  })

  describe('listPlans', () => {
    it('正例: 列出所有计划', () => {
      const plans = service.listPlans(TENANT_ID)
      expect(plans.length).toBeGreaterThan(15)
    })

    it('正例: 按状态筛选', () => {
      const completed = service.listPlans(TENANT_ID, { status: MaintenanceStatus.Completed })
      expect(completed.every(p => p.status === MaintenanceStatus.Completed)).toBe(true)
    })

    it('正例: 按类型筛选', () => {
      const emergencies = service.listPlans(TENANT_ID, { type: MaintenanceType.Emergency })
      expect(emergencies.every(p => p.type === MaintenanceType.Emergency)).toBe(true)
    })

    it('正例: 按优先级筛选', () => {
      const urgent = service.listPlans(TENANT_ID, { priority: Priority.Urgent })
      expect(urgent.every(p => p.priority === Priority.Urgent)).toBe(true)
    })
  })

  // ════════════════════════════════════════════
  // updatePlan
  // ════════════════════════════════════════════

  describe('updatePlan', () => {
    it('正例: 更新计划标题', () => {
      const plans = service.listPlans(TENANT_ID)
      const updated = service.updatePlan(plans[0].id, TENANT_ID, { title: '更新后的标题' })
      expect(updated.title).toBe('更新后的标题')
    })

    it('反例: 不存在的计划抛异常', () => {
      expect(() => service.updatePlan('nonexist', TENANT_ID, { title: 'test' }))
        .toThrow('not found')
    })
  })

  // ════════════════════════════════════════════
  // updatePlanStatus
  // ════════════════════════════════════════════

  describe('updatePlanStatus', () => {
    it('正例: 将计划标记为完成', () => {
      const plans = service.listPlans(TENANT_ID, { status: MaintenanceStatus.Scheduled })
      const target = plans[0]
      const completed = service.updatePlanStatus(target.id, MaintenanceStatus.Completed, TENANT_ID, '完成', 0)
      expect(completed.status).toBe(MaintenanceStatus.Completed)
      expect(completed.completedAt).toBeTruthy()
    })

    it('正例: 取消计划', () => {
      const plans = service.listPlans(TENANT_ID, { status: MaintenanceStatus.Scheduled })
      const cancelled = service.updatePlanStatus(plans[0].id, MaintenanceStatus.Cancelled, TENANT_ID)
      expect(cancelled.status).toBe(MaintenanceStatus.Cancelled)
    })
  })

  // ════════════════════════════════════════════
  // getScheduledPlans
  // ════════════════════════════════════════════

  describe('getScheduledPlans', () => {
    it('正例: 获取排期内计划', () => {
      const now = new Date().toISOString()
      const future = new Date(Date.now() + 365 * 86400000).toISOString()
      const scheduled = service.getScheduledPlans(TENANT_ID, now, future)
      expect(scheduled.every(p => p.status === MaintenanceStatus.Scheduled || p.status === MaintenanceStatus.InProgress)).toBe(true)
    })

    it('边界: 过去时间范围返回空', () => {
      const past = new Date(Date.now() - 365 * 86400000).toISOString()
      const now = new Date(Date.now() - 180 * 86400000).toISOString()
      const scheduled = service.getScheduledPlans(TENANT_ID, past, now)
      expect(scheduled.length).toBe(0)
    })
  })
})
