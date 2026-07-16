import { describe, it, beforeEach, afterEach } from 'vitest'
/**
 * 🐜 自动: [maintenance-plan] controller 测试
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { MaintenancePlanController } from './maintenance-plan.controller'
import { MaintenancePlanService } from './maintenance-plan.service'
import {
  MaintenanceType,
  MaintenanceStatus,
  Priority,
} from './maintenance-plan.entity'

describe('MaintenancePlanController', () => {
  let controller: InstanceType<typeof MaintenancePlanController>
  let service: InstanceType<typeof MaintenancePlanService>

  const TENANT = { tenantId: 'tenant-001' }

  beforeEach(() => {
    service = new MaintenancePlanService()
    controller = new MaintenancePlanController(service)
  })

  afterEach(() => {
    service.resetPlanStoresForTests()
  })

  // ── Route metadata ──

  describe('route metadata', () => {
    it('controller path should be maintenance-plans', () => {
      const path = Reflect.getMetadata('path', MaintenancePlanController)
      assert.equal(path, 'maintenance-plans')
    })

    it('createPlan should be POST /', () => {
      const method = Reflect.getMetadata('method', MaintenancePlanController.prototype.createPlan)
      const path = Reflect.getMetadata('path', MaintenancePlanController.prototype.createPlan)
      assert.equal(method, 1)
      assert.equal(path, '/')
    })

    it('listPlans should be GET /', () => {
      const method = Reflect.getMetadata('method', MaintenancePlanController.prototype.listPlans)
      const path = Reflect.getMetadata('path', MaintenancePlanController.prototype.listPlans)
      assert.equal(method, 0)
      assert.equal(path, '/')
    })

    it('getPlan should be GET /:planId', () => {
      const method = Reflect.getMetadata('method', MaintenancePlanController.prototype.getPlan)
      const path = Reflect.getMetadata('path', MaintenancePlanController.prototype.getPlan)
      assert.equal(method, 0)
      assert.equal(path, ':planId')
    })

    it('updatePlan should be PATCH /:planId', () => {
      const method = Reflect.getMetadata('method', MaintenancePlanController.prototype.updatePlan)
      const path = Reflect.getMetadata('path', MaintenancePlanController.prototype.updatePlan)
      assert.equal(method, 4)
      assert.equal(path, ':planId')
    })

    it('updatePlanStatus should be PATCH /:planId/status', () => {
      const method = Reflect.getMetadata('method', MaintenancePlanController.prototype.updatePlanStatus)
      const path = Reflect.getMetadata('path', MaintenancePlanController.prototype.updatePlanStatus)
      assert.equal(method, 4)
      assert.equal(path, ':planId/status')
    })

    it('getScheduledPlans should be GET /analysis/scheduled', () => {
      const method = Reflect.getMetadata('method', MaintenancePlanController.prototype.getScheduledPlans)
      const path = Reflect.getMetadata('path', MaintenancePlanController.prototype.getScheduledPlans)
      assert.equal(method, 0)
      assert.equal(path, 'analysis/scheduled')
    })

    it('seedMockData should be POST /seed', () => {
      const method = Reflect.getMetadata('method', MaintenancePlanController.prototype.seedMockData)
      const path = Reflect.getMetadata('path', MaintenancePlanController.prototype.seedMockData)
      assert.equal(method, 1)
      assert.equal(path, 'seed')
    })
  })

  // ── Controller Logic ──

  describe('createPlan', () => {
    it('should create plan via controller', () => {
      const p = controller.createPlan(TENANT, {
        title: '新计划',
        type: MaintenanceType.Routine,
        priority: Priority.Medium,
        deviceName: '设备A',
        deviceId: 'DEV-A',
        assignedTo: '张工',
        scheduledAt: '2026-07-20T10:00:00.000Z',
        description: '描述',
      })
      assert.equal(p.title, '新计划')
      assert.equal(p.status, MaintenanceStatus.Scheduled)
    })
  })

  describe('listPlans', () => {
    it('should list plans', () => {
      controller.createPlan(TENANT, {
        title: 'P1', type: MaintenanceType.Routine, priority: Priority.Low,
        deviceName: 'D1', deviceId: 'D1', assignedTo: 'A',
        scheduledAt: '2026-07-20T10:00:00.000Z', description: 'D',
      })
      controller.createPlan(TENANT, {
        title: 'P2', type: MaintenanceType.Emergency, priority: Priority.Urgent,
        deviceName: 'D2', deviceId: 'D2', assignedTo: 'B',
        scheduledAt: '2026-07-20T10:00:00.000Z', description: 'D',
      })
      assert.equal(controller.listPlans(TENANT, {}).length, 2)
    })
  })

  describe('getPlan', () => {
    it('should get plan by id', () => {
      const p = controller.createPlan(TENANT, {
        title: 'Test', type: MaintenanceType.Routine, priority: Priority.Medium,
        deviceName: 'D', deviceId: 'D', assignedTo: 'A',
        scheduledAt: '2026-07-20T10:00:00.000Z', description: 'D',
      })
      const found = controller.getPlan(TENANT, p.id)
      assert.equal(found.id, p.id)
    })

    it('should throw on non-existent plan', () => {
      assert.throws(() => {
        controller.getPlan(TENANT, 'nonexistent')
      }, /Maintenance plan not found/)
    })
  })

  describe('updatePlan', () => {
    it('should update plan', () => {
      const p = controller.createPlan(TENANT, {
        title: 'Old', type: MaintenanceType.Routine, priority: Priority.Low,
        deviceName: 'D', deviceId: 'D', assignedTo: 'A',
        scheduledAt: '2026-07-20T10:00:00.000Z', description: 'D',
      })
      const updated = controller.updatePlan(TENANT, p.id, { title: 'New' })
      assert.equal(updated.title, 'New')
    })
  })

  describe('updatePlanStatus', () => {
    it('should update status and result', () => {
      const p = controller.createPlan(TENANT, {
        title: 'Test', type: MaintenanceType.Routine, priority: Priority.Medium,
        deviceName: 'D', deviceId: 'D', assignedTo: 'A',
        scheduledAt: '2026-07-20T10:00:00.000Z', description: 'D',
      })
      const updated = controller.updatePlanStatus(TENANT, p.id, {
        status: MaintenanceStatus.Completed,
        result: '完成',
      })
      assert.equal(updated.status, MaintenanceStatus.Completed)
      assert.equal(updated.result, '完成')
    })
  })

  describe('getScheduledPlans', () => {
    it('should return scheduled plans', () => {
      controller.createPlan(TENANT, {
        title: 'Scheduled', type: MaintenanceType.Routine, priority: Priority.Medium,
        deviceName: 'D', deviceId: 'D', assignedTo: 'A',
        scheduledAt: '2026-07-20T10:00:00.000Z', description: 'D',
      })
      const scheduled = controller.getScheduledPlans(TENANT)
      assert.equal(scheduled.length, 1)
    })
  })

  describe('seedMockData', () => {
    it('should seed 20 plans', () => {
      const result = controller.seedMockData(TENANT)
      assert.deepStrictEqual(result, { message: 'Mock maintenance plan data seeded' })
      assert.equal(controller.listPlans(TENANT, {}).length, 20)
    })
  })
})
