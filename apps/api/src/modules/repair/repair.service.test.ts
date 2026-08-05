/**
 * repair.service.spec.ts — 报修 Service 测试
 *
 * 覆盖:
 *   - CRUD / 状态流转（dispatch→start→complete→cancel）
 *   - 边界条件 / 异常路径 / 空值处理 / 多租户隔离
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { RepairService } from './repair.service'
import { RepairStatus, RepairCategory, UrgencyLevel } from './repair.entity'

describe('RepairService', () => {
  let service: RepairService
  const tenantA = 'tenant-a'
  const tenantB = 'tenant-b'

  const validInput = (overrides?: Record<string, unknown>) => ({
    tenantId: tenantA,
    title: '屏幕闪烁',
    description: '显示屏出现不规则闪烁',
    category: RepairCategory.Electronic,
    urgency: UrgencyLevel.High,
    reporterName: '李华',
    reporterPhone: '13800138001',
    location: 'A区-VR体验区',
    deviceName: 'VR-01',
    deviceId: 'VR-001',
    ...overrides,
  })

  beforeEach(() => {
    service = new RepairService()
    service.resetRepairStoresForTests()
  })

  // ═══════════════════════════════════════════════════════════
  // createRequest
  // ═══════════════════════════════════════════════════════════

  describe('createRequest', () => {
    it('应成功创建 PENDING 状态的报修单', () => {
      const req = service.createRequest(validInput())
      expect(req.id).toBeTruthy()
      expect(req.requestNo).toMatch(/^RR\d{10}\d{4}$/)
      expect(req.status).toBe(RepairStatus.Pending)
      expect(req.title).toBe('屏幕闪烁')
    })

    it('报修单号应唯一', () => {
      const r1 = service.createRequest(validInput())
      const r2 = service.createRequest(validInput())
      expect(r1.requestNo).not.toBe(r2.requestNo)
    })

    it('deviceName 和 deviceId 可选', () => {
      const req = service.createRequest(validInput({ deviceName: undefined, deviceId: undefined }))
      expect(req.deviceName).toBeUndefined()
      expect(req.deviceId).toBeUndefined()
    })

    it('remark 可选', () => {
      const withRemark = service.createRequest(validInput({ remark: '紧急处理' }))
      expect(withRemark.remark).toBe('紧急处理')
      const withoutRemark = service.createRequest(validInput({ remark: undefined }))
      // remark may be undefined but construction default...
      // Actually the service does not default, so we check it's undefined if not passed
      expect(withoutRemark.remark).toBeUndefined()
    })

    it('不同租户可创建相同标题的报修', () => {
      const r1 = service.createRequest(validInput({ tenantId: tenantA, deviceId: 'D-1' }))
      const r2 = service.createRequest(validInput({ tenantId: tenantB, deviceId: 'D-2' }))
      expect(r1.id).not.toBe(r2.id)
      expect(r1.tenantId).toBe(tenantA)
      expect(r2.tenantId).toBe(tenantB)
    })
  })

  // ═══════════════════════════════════════════════════════════
  // getRequest
  // ═══════════════════════════════════════════════════════════

  describe('getRequest', () => {
    it('应返回同一租户的报修单', () => {
      const req = service.createRequest(validInput())
      const found = service.getRequest(req.id, tenantA)
      expect(found).toBeTruthy()
      expect(found!.id).toBe(req.id)
    })

    it('跨租户查询应返回 undefined（多租户隔离）', () => {
      const req = service.createRequest(validInput())
      const found = service.getRequest(req.id, tenantB)
      expect(found).toBeUndefined()
    })

    it('不存在的 id 应返回 undefined', () => {
      const found = service.getRequest('nonexistent', tenantA)
      expect(found).toBeUndefined()
    })
  })

  // ═══════════════════════════════════════════════════════════
  // listRequests
  // ═══════════════════════════════════════════════════════════

  describe('listRequests', () => {
    it('应返回租户的所有报修单', () => {
      service.createRequest(validInput())
      service.createRequest(validInput({ title: '空调不制冷' }))
      expect(service.listRequests(tenantA)).toHaveLength(2)
    })

    it('跨租户不应看到对方的报修单', () => {
      service.createRequest(validInput())
      service.createRequest(validInput({ tenantId: tenantB }))
      expect(service.listRequests(tenantA)).toHaveLength(1)
      expect(service.listRequests(tenantB)).toHaveLength(1)
    })

    it('应支持按 status 过滤', () => {
      service.createRequest(validInput())
      expect(service.listRequests(tenantA, { status: RepairStatus.Completed })).toHaveLength(0)
    })

    it('应支持按 category 过滤', () => {
      service.createRequest(validInput())
      expect(service.listRequests(tenantA, { category: RepairCategory.Mechanical })).toHaveLength(0)
      expect(service.listRequests(tenantA, { category: RepairCategory.Electronic })).toHaveLength(1)
    })

    it('应支持按 urgency 过滤', () => {
      service.createRequest(validInput())
      expect(service.listRequests(tenantA, { urgency: UrgencyLevel.Urgent })).toHaveLength(0)
    })

    it('应支持按 reporterName 模糊匹配', () => {
      service.createRequest(validInput())
      expect(service.listRequests(tenantA, { reporterName: '李华' })).toHaveLength(1)
      expect(service.listRequests(tenantA, { reporterName: '王' })).toHaveLength(0)
    })

    it('应支持按 location 模糊匹配', () => {
      service.createRequest(validInput())
      expect(service.listRequests(tenantA, { location: 'VR体验' })).toHaveLength(1)
    })

    it('应支持按 assignedTo 模糊匹配', () => {
      service.createRequest(validInput())
      // assignedTo will be undefined for new requests
      expect(service.listRequests(tenantA, { assignedTo: '陈工' })).toHaveLength(0)
    })

    it('无匹配时应返回空数组', () => {
      expect(service.listRequests(tenantA)).toEqual([])
    })
  })

  // ═══════════════════════════════════════════════════════════
  // updateRequest
  // ═══════════════════════════════════════════════════════════

  describe('updateRequest', () => {
    it('应更新报修单字段', () => {
      const req = service.createRequest(validInput())
      const updated = service.updateRequest(req.id, tenantA, { title: '更新标题' })
      expect(updated.title).toBe('更新标题')
      expect(updated.updatedAt).not.toBe(req.updatedAt)
    })

    it('不存在的报修单应抛出错误', () => {
      expect(() => service.updateRequest('NONEXISTENT', tenantA, { title: '更新' })).toThrow('not found')
    })

    it('跨租户更新应抛出错误', () => {
      const req = service.createRequest(validInput())
      expect(() => service.updateRequest(req.id, tenantB, { title: 'hack' })).toThrow('not found')
    })
  })

  // ═══════════════════════════════════════════════════════════
  // dispatchRepair
  // ═══════════════════════════════════════════════════════════

  describe('dispatchRepair', () => {
    it('应成功分派 PENDING 报修单', () => {
      const req = service.createRequest(validInput())
      const dispatched = service.dispatchRepair(req.id, tenantA, {
        status: RepairStatus.Accepted,
        assignedTo: '陈工',
        estimatedCost: 500,
      })
      expect(dispatched.status).toBe(RepairStatus.Accepted)
      expect(dispatched.assignedTo).toBe('陈工')
      expect(dispatched.estimatedCost).toBe(500)
    })

    it('非 PENDING 状态报修单不允许分派', () => {
      const req = service.createRequest(validInput())
      service.dispatchRepair(req.id, tenantA, { status: RepairStatus.Accepted, assignedTo: '陈工' })
      expect(() =>
        service.dispatchRepair(req.id, tenantA, { status: RepairStatus.Accepted, assignedTo: '张工' }),
      ).toThrow('Cannot dispatch')
    })

    it('不存在的报修单应抛出错误', () => {
      expect(() =>
        service.dispatchRepair('NONEXISTENT', tenantA, { status: RepairStatus.Accepted, assignedTo: '陈工' }),
      ).toThrow('not found')
    })
  })

  // ═══════════════════════════════════════════════════════════
  // startRepair
  // ═══════════════════════════════════════════════════════════

  describe('startRepair', () => {
    it('应成功开始维修（ACCEPTED → IN_PROGRESS）', () => {
      const req = service.createRequest(validInput())
      service.dispatchRepair(req.id, tenantA, { status: RepairStatus.Accepted, assignedTo: '陈工' })
      const started = service.startRepair(req.id, tenantA)
      expect(started.status).toBe(RepairStatus.InProgress)
    })

    it('PENDING 状态不允许开始维修', () => {
      const req = service.createRequest(validInput())
      expect(() => service.startRepair(req.id, tenantA)).toThrow('Cannot start')
    })

    it('COMPLETED 状态不允许开始维修', () => {
      const req = service.createRequest(validInput())
      service.dispatchRepair(req.id, tenantA, { status: RepairStatus.Accepted, assignedTo: '陈工' })
      service.startRepair(req.id, tenantA)
      service.completeRepair(req.id, tenantA, { status: RepairStatus.Completed })
      expect(() => service.startRepair(req.id, tenantA)).toThrow('Cannot start')
    })
  })

  // ═══════════════════════════════════════════════════════════
  // completeRepair
  // ═══════════════════════════════════════════════════════════

  describe('completeRepair', () => {
    it('应成功完成维修（IN_PROGRESS → COMPLETED）', () => {
      const req = service.createRequest(validInput())
      service.dispatchRepair(req.id, tenantA, { status: RepairStatus.Accepted, assignedTo: '陈工' })
      service.startRepair(req.id, tenantA)
      const completed = service.completeRepair(req.id, tenantA, { status: RepairStatus.Completed, result: '修复完成', actualCost: 300 })
      expect(completed.status).toBe(RepairStatus.Completed)
      expect(completed.completedAt).toBeTruthy()
      expect(completed.actualCost).toBe(300)
    })

    it('IN_PROGRESS 之前的状态不允许完成', () => {
      const req = service.createRequest(validInput())
      expect(() => service.completeRepair(req.id, tenantA, { status: RepairStatus.Completed })).toThrow(
        'Cannot complete',
      )
    })

    it('CANCELLED 状态不允许完成', () => {
      const req = service.createRequest(validInput())
      service.cancelRepair(req.id, tenantA)
      expect(() => service.completeRepair(req.id, tenantA, { status: RepairStatus.Completed })).toThrow(
        'Cannot complete',
      )
    })
  })

  // ═══════════════════════════════════════════════════════════
  // cancelRepair
  // ═══════════════════════════════════════════════════════════

  describe('cancelRepair', () => {
    it('应成功取消 PENDING 报修单', () => {
      const req = service.createRequest(validInput())
      const cancelled = service.cancelRepair(req.id, tenantA, '不再需要')
      expect(cancelled.status).toBe(RepairStatus.Cancelled)
      expect(cancelled.completedAt).toBeTruthy()
    })

    it('应成功取消 IN_PROGRESS 报修单', () => {
      const req = service.createRequest(validInput())
      service.dispatchRepair(req.id, tenantA, { status: RepairStatus.Accepted, assignedTo: '陈工' })
      service.startRepair(req.id, tenantA)
      const result = service.cancelRepair(req.id, tenantA)
      expect(result.status).toBe(RepairStatus.Cancelled)
    })

    it('COMPLETED 状态不允许取消', () => {
      const req = service.createRequest(validInput())
      service.dispatchRepair(req.id, tenantA, { status: RepairStatus.Accepted, assignedTo: '陈工' })
      service.startRepair(req.id, tenantA)
      service.completeRepair(req.id, tenantA, { status: RepairStatus.Completed })
      expect(() => service.cancelRepair(req.id, tenantA)).toThrow('Cannot cancel')
    })

    it('CANCELLED 状态不允许再次取消', () => {
      const req = service.createRequest(validInput())
      service.cancelRepair(req.id, tenantA)
      expect(() => service.cancelRepair(req.id, tenantA)).toThrow('Cannot cancel')
    })
  })

  // ═══════════════════════════════════════════════════════════
  // getStats
  // ═══════════════════════════════════════════════════════════

  describe('getStats', () => {
    it('空租户返回全零统计', () => {
      const stats = service.getStats(tenantA)
      expect(stats.total).toBe(0)
      expect(stats.byStatus.PENDING).toBe(0)
    })

    it('应正确按状态统计', () => {
      const r1 = service.createRequest(validInput())
      const r2 = service.createRequest(validInput({ title: '修空调', deviceId: 'AC-01' }))
      service.dispatchRepair(r1.id, tenantA, { status: RepairStatus.Accepted, assignedTo: '陈工' })
      service.startRepair(r1.id, tenantA)
      service.completeRepair(r1.id, tenantA, { status: RepairStatus.Completed, actualCost: 500 })
      service.cancelRepair(r2.id, tenantA)

      const stats = service.getStats(tenantA)
      expect(stats.total).toBe(2)
      expect(stats.byStatus.COMPLETED).toBe(1)
      expect(stats.byStatus.CANCELLED).toBe(1)
    })

    it('应正确按 category 统计', () => {
      service.createRequest(validInput())
      service.createRequest(validInput({ title: '水管漏水', category: RepairCategory.Plumbing, deviceId: 'P-01' }))
      const stats = service.getStats(tenantA)
      expect(stats.byCategory.ELECTRONIC).toBe(1)
      expect(stats.byCategory.PLUMBING).toBe(1)
    })

    it('应正确计算 avgCost 和 totalCost', () => {
      const r1 = service.createRequest(validInput())
      service.dispatchRepair(r1.id, tenantA, { status: RepairStatus.Accepted, assignedTo: '陈工' })
      service.startRepair(r1.id, tenantA)
      service.completeRepair(r1.id, tenantA, { status: RepairStatus.Completed, actualCost: 500 })

      const r2 = service.createRequest(validInput({ title: '修灯', deviceId: 'L-01' }))
      service.dispatchRepair(r2.id, tenantA, { status: RepairStatus.Accepted, assignedTo: '陈工' })
      service.startRepair(r2.id, tenantA)
      service.completeRepair(r2.id, tenantA, { status: RepairStatus.Completed, actualCost: 1500 })

      const stats = service.getStats(tenantA)
      expect(stats.totalCost).toBe(2000)
      expect(stats.avgCost).toBe(1000)
    })

    it('应支持日期范围过滤', () => {
      service.createRequest(validInput())
      const statsAfter = service.getStats(tenantA, '2099-01-01T00:00:00Z')
      expect(statsAfter.total).toBe(0)

      const statsBefore = service.getStats(tenantA, undefined, '2099-01-01T00:00:00Z')
      expect(statsBefore.total).toBe(1)
    })
  })

  // ═══════════════════════════════════════════════════════════
  // 完整状态流转
  // ═══════════════════════════════════════════════════════════

  describe('完整状态流转', () => {
    it('Pending → Accepted → InProgress → Completed', () => {
      const req = service.createRequest(validInput({ urgency: UrgencyLevel.Urgent }))
      expect(req.status).toBe(RepairStatus.Pending)

      const dispatched = service.dispatchRepair(req.id, tenantA, {
        status: RepairStatus.Accepted,
        assignedTo: '李工',
        estimatedCost: 1000,
      })
      expect(dispatched.status).toBe(RepairStatus.Accepted)

      const started = service.startRepair(req.id, tenantA)
      expect(started.status).toBe(RepairStatus.InProgress)

      const completed = service.completeRepair(req.id, tenantA, {
        status: RepairStatus.Completed,
        result: '更换零件',
        actualCost: 800,
      })
      expect(completed.status).toBe(RepairStatus.Completed)
      expect(completed.result).toBe('更换零件')
      expect(completed.actualCost).toBe(800)
    })

    it('Pending → Cancelled', () => {
      const req = service.createRequest(validInput())
      const cancelled = service.cancelRepair(req.id, tenantA, '自行解决')
      expect(cancelled.status).toBe(RepairStatus.Cancelled)
    })
  })

  // ═══════════════════════════════════════════════════════════
  // seedMockData
  // ═══════════════════════════════════════════════════════════

  describe('seedMockData', () => {
    it('应生成15条模拟数据', () => {
      service.seedMockData(tenantA)
      const all = service.listRequests(tenantA)
      expect(all.length).toBe(15)
    })

    it('不同租户的 mock 数据隔离', () => {
      service.seedMockData(tenantA)
      service.seedMockData(tenantB)
      expect(service.listRequests(tenantA)).toHaveLength(15)
      expect(service.listRequests(tenantB)).toHaveLength(15)
    })
  })

  // ═══════════════════════════════════════════════════════════
  // 边界条件
  // ═══════════════════════════════════════════════════════════

  describe('边界条件', () => {
    it('大量报单创建不报错', () => {
      for (let i = 0; i < 100; i++) {
        service.createRequest(validInput({ deviceId: `D-${i}`, title: `故障${i}` }))
      }
      expect(service.listRequests(tenantA)).toHaveLength(100)
    })

    it('列表空过滤条件', () => {
      service.createRequest(validInput())
      const result = service.listRequests(tenantA, {}) as any
      expect(result).toHaveLength(1)
    })

    it('estimatedCost 为 0 可接受', () => {
      const req = service.createRequest(validInput())
      const dispatched = service.dispatchRepair(req.id, tenantA, {
        status: RepairStatus.Accepted,
        assignedTo: '陈工',
        estimatedCost: 0,
      })
      expect(dispatched.estimatedCost).toBe(0)
    })
  })
})
