import { describe, it, beforeEach, afterEach } from 'vitest'
/**
 * 🐜 自动: [maintenance-plan] service 测试
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { MaintenancePlanService } from './maintenance-plan.service'
import {
  MaintenanceType,
  MaintenanceStatus,
  Priority,
} from './maintenance-plan.entity'

describe('MaintenancePlanService', () => {
  let service: MaintenancePlanService

  const TENANT = 'tenant-001'

  beforeEach(() => {
    service = new MaintenancePlanService()
  })

  afterEach(() => {
    service.resetPlanStoresForTests()
  })

  function createTestPlan(overrides?: Partial<Parameters<MaintenancePlanService['createPlan']>[0]>) {
    return service.createPlan({
      tenantId: TENANT,
      title: '测试维护计划',
      type: MaintenanceType.Routine,
      priority: Priority.Medium,
      deviceName: '测试设备',
      deviceId: 'DEV-TEST',
      assignedTo: '张工',
      scheduledAt: '2026-07-20T10:00:00.000Z',
      description: '测试描述',
      ...overrides,
    })
  }

  // ── CRUD ──

  describe('createPlan', () => {
    it('should create a plan with SCHEDULED status', () => {
      const p = createTestPlan()
      assert.equal(p.title, '测试维护计划')
      assert.equal(p.status, MaintenanceStatus.Scheduled)
      assert.equal(p.type, MaintenanceType.Routine)
      assert.equal(p.priority, Priority.Medium)
      assert.ok(p.id.startsWith('plan-'))
      assert.ok(p.planNo.startsWith('MP'))
    })
  })

  describe('getPlan', () => {
    it('should return plan by id', () => {
      const p = createTestPlan()
      const found = service.getPlan(p.id, TENANT)
      assert.ok(found)
      assert.equal(found?.id, p.id)
    })

    it('should return undefined for non-existent plan', () => {
      assert.equal(service.getPlan('nonexistent', TENANT), undefined)
    })

    it('should return undefined for wrong tenant', () => {
      const p = createTestPlan()
      assert.equal(service.getPlan(p.id, 'other-tenant'), undefined)
    })
  })

  describe('listPlans', () => {
    it('should list all plans for tenant', () => {
      createTestPlan({ title: '计划一' })
      createTestPlan({ title: '计划二' })
      assert.equal(service.listPlans(TENANT).length, 2)
    })

    it('should filter by status', () => {
      const p1 = createTestPlan({ title: '进行中' })
      service.updatePlanStatus(p1.id, MaintenanceStatus.InProgress, TENANT)
      createTestPlan({ title: '已排程' })

      const inProgress = service.listPlans(TENANT, { status: MaintenanceStatus.InProgress })
      assert.equal(inProgress.length, 1)
    })

    it('should filter by type and priority', () => {
      createTestPlan({ title: '紧急', type: MaintenanceType.Emergency, priority: Priority.Urgent })
      createTestPlan({ title: '常规', type: MaintenanceType.Routine, priority: Priority.Low })

      assert.equal(service.listPlans(TENANT, { type: MaintenanceType.Emergency }).length, 1)
      assert.equal(service.listPlans(TENANT, { priority: Priority.Low }).length, 1)
    })

    it('should filter by deviceName', () => {
      createTestPlan({ title: '无人机', deviceName: '大疆无人机-1号' })
      createTestPlan({ title: '空调', deviceName: '中央空调' })

      const found = service.listPlans(TENANT, { deviceName: '无人机' })
      assert.equal(found.length, 1)
    })
  })

  describe('updatePlan', () => {
    it('should update plan fields', () => {
      const p = createTestPlan()
      const updated = service.updatePlan(p.id, TENANT, {
        title: '更新标题',
        priority: Priority.High,
      })
      assert.equal(updated.title, '更新标题')
      assert.equal(updated.priority, Priority.High)
    })

    it('should throw on non-existent plan', () => {
      assert.throws(() => {
        service.updatePlan('nonexistent', TENANT, { title: 'test' })
      }, /Maintenance plan not found/)
    })
  })

  describe('updatePlanStatus', () => {
    it('should update status and set completedAt', () => {
      const p = createTestPlan()
      const updated = service.updatePlanStatus(p.id, MaintenanceStatus.Completed, TENANT)
      assert.equal(updated.status, MaintenanceStatus.Completed)
      assert.ok(updated.completedAt)
    })

    it('should update status with result and cost', () => {
      const p = createTestPlan()
      const updated = service.updatePlanStatus(p.id, MaintenanceStatus.Completed, TENANT, '一切正常', 500)
      assert.equal(updated.result, '一切正常')
      assert.equal(updated.cost, 500)
    })

    it('should set completedAt on cancelled status', () => {
      const p = createTestPlan()
      const updated = service.updatePlanStatus(p.id, MaintenanceStatus.Cancelled, TENANT)
      assert.ok(updated.completedAt)
    })
  })

  describe('getScheduledPlans', () => {
    it('should return scheduled and in-progress plans', () => {
      createTestPlan({ title: '已排程', scheduledAt: '2026-07-20T10:00:00.000Z' })
      const p2 = createTestPlan({ title: '进行中', scheduledAt: '2026-07-18T10:00:00.000Z' })
      service.updatePlanStatus(p2.id, MaintenanceStatus.InProgress, TENANT)
      const p3 = createTestPlan({ title: '已完成', scheduledAt: '2026-07-15T10:00:00.000Z' })
      service.updatePlanStatus(p3.id, MaintenanceStatus.Completed, TENANT)

      const scheduled = service.getScheduledPlans(TENANT)
      assert.equal(scheduled.length, 2)
    })

    it('should filter by date range', () => {
      createTestPlan({ title: '下周', scheduledAt: '2026-07-25T10:00:00.000Z' })
      createTestPlan({ title: '本月', scheduledAt: '2026-07-15T10:00:00.000Z' })

      const found = service.getScheduledPlans(TENANT, '2026-07-01T00:00:00.000Z', '2026-07-20T23:59:59.000Z')
      assert.equal(found.length, 1)
    })
  })

  // ── Seed ──

  describe('seedMockData', () => {
    it('should seed 20 plans with various statuses', () => {
      service.seedMockData(TENANT)
      const plans = service.listPlans(TENANT)
      assert.equal(plans.length, 20)

      const scheduled = service.getScheduledPlans(TENANT)
      assert.ok(scheduled.length > 0)

      const completed = service.listPlans(TENANT, { status: MaintenanceStatus.Completed })
      assert.ok(completed.length > 0)
    })
  })
})
