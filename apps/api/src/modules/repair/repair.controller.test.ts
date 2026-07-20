import { describe, it, beforeEach, afterEach } from 'vitest'
/**
 * 🐜 自动: [repair] controller 测试
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { RepairController } from './repair.controller'
import { RepairService } from './repair.service'
import {
  RepairStatus,
  RepairCategory,
  UrgencyLevel,
} from './repair.entity'

describe('RepairController', () => {
  let controller: InstanceType<typeof RepairController>
  let service: InstanceType<typeof RepairService>

  const TENANT = { tenantId: 'tenant-001' }

  beforeEach(() => {
    service = new RepairService()
    controller = new RepairController(service)
  })

  afterEach(() => {
    service.resetRepairStoresForTests()
  })

  // ── Route metadata ──

  describe('route metadata', () => {
    it('controller path should be repair-requests', () => {
      const path = Reflect.getMetadata('path', RepairController)
      assert.equal(path, 'repair-requests')
    })

    it('submitRepair should be POST /', () => {
      const method = Reflect.getMetadata('method', RepairController.prototype.submitRepair)
      const path = Reflect.getMetadata('path', RepairController.prototype.submitRepair)
      assert.equal(method, 1) // POST
      assert.equal(path, '/')
    })

    it('listRepairs should be GET /', () => {
      const method = Reflect.getMetadata('method', RepairController.prototype.listRepairs)
      const path = Reflect.getMetadata('path', RepairController.prototype.listRepairs)
      assert.equal(method, 0) // GET
      assert.equal(path, '/')
    })

    it('getRepair should be GET /:requestId', () => {
      const method = Reflect.getMetadata('method', RepairController.prototype.getRepair)
      const path = Reflect.getMetadata('path', RepairController.prototype.getRepair)
      assert.equal(method, 0)
      assert.equal(path, ':requestId')
    })

    it('updateRepair should be PATCH /:requestId', () => {
      const method = Reflect.getMetadata('method', RepairController.prototype.updateRepair)
      const path = Reflect.getMetadata('path', RepairController.prototype.updateRepair)
      assert.equal(method, 4) // PATCH
      assert.equal(path, ':requestId')
    })

    it('dispatchRepair should be PATCH /:requestId/dispatch', () => {
      const method = Reflect.getMetadata('method', RepairController.prototype.dispatchRepair)
      const path = Reflect.getMetadata('path', RepairController.prototype.dispatchRepair)
      assert.equal(method, 4)
      assert.equal(path, ':requestId/dispatch')
    })

    it('startRepair should be PATCH /:requestId/start', () => {
      const method = Reflect.getMetadata('method', RepairController.prototype.startRepair)
      const path = Reflect.getMetadata('path', RepairController.prototype.startRepair)
      assert.equal(method, 4)
      assert.equal(path, ':requestId/start')
    })

    it('completeRepair should be PATCH /:requestId/complete', () => {
      const method = Reflect.getMetadata('method', RepairController.prototype.completeRepair)
      const path = Reflect.getMetadata('path', RepairController.prototype.completeRepair)
      assert.equal(method, 4)
      assert.equal(path, ':requestId/complete')
    })

    it('cancelRepair should be PATCH /:requestId/cancel', () => {
      const method = Reflect.getMetadata('method', RepairController.prototype.cancelRepair)
      const path = Reflect.getMetadata('path', RepairController.prototype.cancelRepair)
      assert.equal(method, 4)
      assert.equal(path, ':requestId/cancel')
    })

    it('getStats should be GET /analysis/stats', () => {
      const method = Reflect.getMetadata('method', RepairController.prototype.getStats)
      const path = Reflect.getMetadata('path', RepairController.prototype.getStats)
      assert.equal(method, 0)
      assert.equal(path, 'analysis/stats')
    })

    it('seedMockData should be POST /seed', () => {
      const method = Reflect.getMetadata('method', RepairController.prototype.seedMockData)
      const path = Reflect.getMetadata('path', RepairController.prototype.seedMockData)
      assert.equal(method, 1)
      assert.equal(path, 'seed')
    })
  })

  // ── Controller Logic ──

  describe('submitRepair', () => {
    it('should create a repair request with PENDING status', () => {
      const r = controller.submitRepair(TENANT, {
        title: '电脑蓝屏',
        description: '5号电脑频繁蓝屏重启',
        category: RepairCategory.Electronic,
        urgency: UrgencyLevel.Medium,
        reporterName: '张三',
        reporterPhone: '13800138000',
        location: 'A区-5号机位',
        deviceName: '电脑-5号',
      })
      assert.equal(r.title, '电脑蓝屏')
      assert.equal(r.status, RepairStatus.Pending)
      assert.equal(r.category, RepairCategory.Electronic)
      assert.equal(r.reporterName, '张三')
      assert.ok(r.id.startsWith('repair-'))
      assert.ok(r.requestNo.startsWith('RR'))
    })
  })

  describe('listRepairs', () => {
    it('should list all repair requests', () => {
      controller.submitRepair(TENANT, {
        title: '空调坏', description: '不制冷', category: RepairCategory.Ac,
        urgency: UrgencyLevel.Urgent, reporterName: 'A', reporterPhone: '13800138000',
        location: 'A区',
      })
      controller.submitRepair(TENANT, {
        title: '灯不亮', description: 'LED不亮', category: RepairCategory.Electric,
        urgency: UrgencyLevel.Low, reporterName: 'B', reporterPhone: '13800138001',
        location: 'B区',
      })
      assert.equal(controller.listRepairs(TENANT, {}).length, 2)
    })
  })

  describe('getRepair', () => {
    it('should get a repair request by id', () => {
      const r = controller.submitRepair(TENANT, {
        title: '漏水', description: '水龙头漏水', category: RepairCategory.Plumbing,
        urgency: UrgencyLevel.Medium, reporterName: 'C', reporterPhone: '13800138002',
        location: '卫生间',
      })
      const found = controller.getRepair(TENANT, r.id)
      assert.equal(found.id, r.id)
      assert.equal(found.title, '漏水')
    })

    it('should throw on non-existent request', () => {
      assert.throws(() => {
        controller.getRepair(TENANT, 'nonexistent')
      }, /Repair request not found/)
    })
  })

  describe('updateRepair', () => {
    it('should update a repair request', () => {
      const r = controller.submitRepair(TENANT, {
        title: '旧标题', description: '描述', category: RepairCategory.Other,
        urgency: UrgencyLevel.Low, reporterName: 'D', reporterPhone: '13800138003',
        location: '某处',
      })
      const updated = controller.updateRepair(TENANT, r.id, {
        title: '新标题',
        category: RepairCategory.Electronic,
      })
      assert.equal(updated.title, '新标题')
      assert.equal(updated.category, RepairCategory.Electronic)
    })
  })

  describe('dispatchRepair', () => {
    it('should dispatch a pending repair to a maintainer', () => {
      const r = controller.submitRepair(TENANT, {
        title: '待派单', description: '测试', category: RepairCategory.Mechanical,
        urgency: UrgencyLevel.Medium, reporterName: 'E', reporterPhone: '13800138004',
        location: '车间',
      })
      const dispatched = controller.dispatchRepair(TENANT, r.id, {
        status: RepairStatus.Accepted,
        assignedTo: '王工',
        estimatedCost: 300,
      })
      assert.equal(dispatched.status, RepairStatus.Accepted)
      assert.equal(dispatched.assignedTo, '王工')
      assert.equal(dispatched.estimatedCost, 300)
    })

    it('should throw when dispatching a non-pending repair', () => {
      const r = controller.submitRepair(TENANT, {
        title: '已完成', description: '已完成', category: RepairCategory.Electric,
        urgency: UrgencyLevel.Low, reporterName: 'F', reporterPhone: '13800138005',
        location: '某处',
      })
      controller.dispatchRepair(TENANT, r.id, {
        status: RepairStatus.Accepted, assignedTo: '王工',
      })
      assert.throws(() => {
        controller.dispatchRepair(TENANT, r.id, {
          status: RepairStatus.Accepted, assignedTo: '李工',
        })
      }, /Cannot dispatch repair/)
    })
  })

  describe('startRepair', () => {
    it('should start a repair (Accepted → InProgress)', () => {
      const r = controller.submitRepair(TENANT, {
        title: '待维修', description: '需要修理', category: RepairCategory.Furniture,
        urgency: UrgencyLevel.Medium, reporterName: 'G', reporterPhone: '13800138006',
        location: '3楼',
      })
      controller.dispatchRepair(TENANT, r.id, {
        status: RepairStatus.Accepted, assignedTo: '李工',
      })
      const started = controller.startRepair(TENANT, r.id)
      assert.equal(started.status, RepairStatus.InProgress)
    })

    it('should throw when starting a non-Accepted repair', () => {
      const r = controller.submitRepair(TENANT, {
        title: '直接维修', description: '测试', category: RepairCategory.Other,
        urgency: UrgencyLevel.Low, reporterName: 'H', reporterPhone: '13800138007',
        location: '某处',
      })
      assert.throws(() => {
        controller.startRepair(TENANT, r.id)
      }, /expected ACCEPTED/)
    })
  })

  describe('completeRepair', () => {
    it('should complete an in-progress repair', () => {
      const r = controller.submitRepair(TENANT, {
        title: '已完成维修', description: '测试完成', category: RepairCategory.Electronic,
        urgency: UrgencyLevel.High, reporterName: 'I', reporterPhone: '13800138008',
        location: 'B区',
      })
      controller.dispatchRepair(TENANT, r.id, {
        status: RepairStatus.Accepted, assignedTo: '陈工',
      })
      controller.startRepair(TENANT, r.id)
      const completed = controller.completeRepair(TENANT, r.id, {
        status: RepairStatus.Completed,
        result: '更换主板，电脑恢复正常',
        actualCost: 1500,
      })
      assert.equal(completed.status, RepairStatus.Completed)
      assert.equal(completed.result, '更换主板，电脑恢复正常')
      assert.equal(completed.actualCost, 1500)
      assert.ok(completed.completedAt)
    })

    it('should throw when completing a non-in-progress repair', () => {
      const r = controller.submitRepair(TENANT, {
        title: '未开始', description: '测试', category: RepairCategory.Other,
        urgency: UrgencyLevel.Low, reporterName: 'J', reporterPhone: '13800138009',
        location: '某处',
      })
      assert.throws(() => {
        controller.completeRepair(TENANT, r.id, { status: RepairStatus.Completed })
      }, /expected IN_PROGRESS/)
    })
  })

  describe('cancelRepair', () => {
    it('should cancel a pending repair', () => {
      const r = controller.submitRepair(TENANT, {
        title: '取消测试', description: '取消报销', category: RepairCategory.Other,
        urgency: UrgencyLevel.Low, reporterName: 'K', reporterPhone: '13800138010',
        location: '某处',
      })
      const cancelled = controller.cancelRepair(TENANT, r.id, '自行修复')
      assert.equal(cancelled.status, RepairStatus.Cancelled)
      assert.equal(cancelled.remark, '自行修复')
      assert.ok(cancelled.completedAt)
    })

    it('should throw when cancelling an already completed repair', () => {
      const r = controller.submitRepair(TENANT, {
        title: '已完成的', description: '测试', category: RepairCategory.Other,
        urgency: UrgencyLevel.Low, reporterName: 'L', reporterPhone: '13800138012',
        location: '某处',
      })
      controller.dispatchRepair(TENANT, r.id, {
        status: RepairStatus.Accepted, assignedTo: '王工',
      })
      controller.startRepair(TENANT, r.id)
      controller.completeRepair(TENANT, r.id, { status: RepairStatus.Completed })
      assert.throws(() => {
        controller.cancelRepair(TENANT, r.id)
      }, /already COMPLETED/)
    })
  })

  describe('getStats', () => {
    it('should return statistics', () => {
      controller.submitRepair(TENANT, {
        title: '待处理', description: 'D1', category: RepairCategory.Electronic,
        urgency: UrgencyLevel.Urgent, reporterName: 'M', reporterPhone: '13800138011',
        location: 'A区',
      })
      const r2 = controller.submitRepair(TENANT, {
        title: '已修复', description: 'D2', category: RepairCategory.Plumbing,
        urgency: UrgencyLevel.Medium, reporterName: 'N', reporterPhone: '13800138012',
        location: 'B区',
      })
      controller.dispatchRepair(TENANT, r2.id, {
        status: RepairStatus.Accepted, assignedTo: '李工',
      })
      controller.startRepair(TENANT, r2.id)
      controller.completeRepair(TENANT, r2.id, {
        status: RepairStatus.Completed, result: 'OK', actualCost: 500,
      })
      const stats = controller.getStats(TENANT, {})
      assert.equal(stats.total, 2)
      assert.equal(stats.byStatus.PENDING, 1)
      assert.equal(stats.byStatus.COMPLETED, 1)
      assert.equal(stats.totalCost, 500)
      assert.equal(stats.pendingUrgent, 1)
    })
  })

  describe('seedMockData', () => {
    it('should seed 15 repair requests', () => {
      const result = controller.seedMockData(TENANT)
      assert.deepStrictEqual(result, { message: 'Mock repair request data seeded' })
      assert.equal(controller.listRepairs(TENANT, {}).length, 15)
    })
  })
})
