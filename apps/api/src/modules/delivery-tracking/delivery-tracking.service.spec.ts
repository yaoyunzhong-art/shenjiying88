/**
 * delivery-tracking.service.spec.ts — 配送追踪服务全覆盖测试 V24
 *
 * 覆盖:
 *   - createDelivery（正常/边界/多种配送方式）
 *   - getDelivery（正常/不存在/跨租户）
 *   - listDeliveries（空/多条件筛选/租户隔离）
 *   - updateDelivery（部分更新所有字段）
 *   - updateDeliveryStatus（全状态可达/送达失败标记时间）
 *   - addEvent / getTrackingTimeline（事件排序/跨租户）
 *   - seedMockData（填充后可查询）
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { DeliveryTrackingService } from './delivery-tracking.service'
import { DeliveryMethod, DeliveryStatus } from './delivery-tracking.entity'

describe('DeliveryTrackingService', () => {
  let service: DeliveryTrackingService

  beforeEach(() => {
    service = new DeliveryTrackingService()
    service.resetDeliveryStoresForTests()
  })

  const baseInput = () => ({
    tenantId: 't1',
    orderNo: 'ORD-001',
    method: DeliveryMethod.Courier,
    carrier: '顺丰速运',
    trackingNo: 'SF123456',
    sender: '上海仓库',
    receiver: '张三',
    receiverPhone: '13800138001',
    receiverAddress: '北京市朝阳区',
    estimatedAt: '2026-08-01T12:00:00.000Z',
  })

  // ── Delivery CRUD ────────────────────────────────────────────────────────

  describe('Delivery CRUD', () => {
    it('正例: createDelivery 创建配送记录', () => {
      const d = service.createDelivery(baseInput())
      expect(d.id).toMatch(/^delivery-/)
      expect(d.deliveryNo).toMatch(/^DL/)
      expect(d.orderNo).toBe('ORD-001')
      expect(d.status).toBe(DeliveryStatus.Pending)
    })

    it('正例: createDelivery 支持所有配送方式', () => {
      for (const method of Object.values(DeliveryMethod)) {
        const d = service.createDelivery({ ...baseInput(), method })
        expect(d.method).toBe(method)
      }
    })

    it('正例: createDelivery 支持备注字段', () => {
      const d = service.createDelivery({ ...baseInput(), remark: '易碎品，轻拿轻放' })
      expect(d.remark).toBe('易碎品，轻拿轻放')
    })

    it('正例: createDelivery 不含备注不报错', () => {
      const d = service.createDelivery({ ...baseInput(), remark: undefined })
      expect(d.remark).toBeUndefined()
    })

    it('正例: getDelivery 返回配送记录', () => {
      const d = service.createDelivery(baseInput())
      const got = service.getDelivery(d.id, 't1')
      expect(got).toBeTruthy()
      expect(got!.receiver).toBe('张三')
      expect(got!.carrier).toBe('顺丰速运')
    })

    it('异常: getDelivery 不存在的 ID 返回 undefined', () => {
      expect(service.getDelivery('nonexistent', 't1')).toBeUndefined()
    })

    it('异常: getDelivery 跨租户返回 undefined', () => {
      const d = service.createDelivery(baseInput())
      expect(service.getDelivery(d.id, 't2')).toBeUndefined()
    })

    it('正例: getDelivery 自己租户可见', () => {
      const d = service.createDelivery(baseInput())
      expect(service.getDelivery(d.id, 't1')).toBeDefined()
    })

    it('正例: listDeliveries 返回所有', () => {
      service.createDelivery(baseInput())
      service.createDelivery({ ...baseInput(), orderNo: 'ORD-002' })
      expect(service.listDeliveries('t1')).toHaveLength(2)
    })

    it('正例: listDeliveries 空时返回空', () => {
      expect(service.listDeliveries('t1')).toEqual([])
    })

    it('正例: listDeliveries 支持按状态筛选', () => {
      service.createDelivery(baseInput())
      service.createDelivery({ ...baseInput(), orderNo: 'ORD-002' })
      // Both are Pending
      const pendings = service.listDeliveries('t1', { status: DeliveryStatus.Pending })
      expect(pendings).toHaveLength(2)
      const inTransits = service.listDeliveries('t1', { status: DeliveryStatus.InTransit })
      expect(inTransits).toHaveLength(0)
    })

    it('正例: listDeliveries 支持按配送方式筛选', () => {
      service.createDelivery(baseInput())
      service.createDelivery({ ...baseInput(), orderNo: 'ORD-002', method: DeliveryMethod.Express })
      const couriers = service.listDeliveries('t1', { method: DeliveryMethod.Courier })
      expect(couriers).toHaveLength(1)
    })

    it('正例: listDeliveries 支持按订单号筛选', () => {
      service.createDelivery(baseInput())
      service.createDelivery({ ...baseInput(), orderNo: 'ORD-999' })
      const found = service.listDeliveries('t1', { orderNo: 'ORD-999' })
      expect(found).toHaveLength(1)
    })

    it('正例: listDeliveries 筛选无结果返回空', () => {
      service.createDelivery(baseInput())
      expect(service.listDeliveries('t1', { orderNo: 'NONEXISTENT' })).toEqual([])
    })

    it('正例: listDeliveries 租户隔离', () => {
      service.createDelivery(baseInput())
      expect(service.listDeliveries('t2')).toHaveLength(0)
    })

    it('正例: updateDelivery 更新承运商和收件人', () => {
      const d = service.createDelivery(baseInput())
      const u = service.updateDelivery(d.id, 't1', { carrier: '京东物流', receiver: '李四' })
      expect(u.carrier).toBe('京东物流')
      expect(u.receiver).toBe('李四')
    })

    it('正例: updateDelivery 更新备注', () => {
      const d = service.createDelivery(baseInput())
      const u = service.updateDelivery(d.id, 't1', { remark: '加急' })
      expect(u.remark).toBe('加急')
    })

    it('正例: updateDelivery 更新配送地址', () => {
      const d = service.createDelivery(baseInput())
      const u = service.updateDelivery(d.id, 't1', { receiverAddress: '上海市浦东新区', receiverPhone: '13900000001' })
      expect(u.receiverAddress).toBe('上海市浦东新区')
      expect(u.receiverPhone).toBe('13900000001')
    })

    it('正例: updateDelivery 更新预计送达时间', () => {
      const d = service.createDelivery(baseInput())
      const u = service.updateDelivery(d.id, 't1', { estimatedAt: '2026-08-05T12:00:00.000Z' })
      expect(u.estimatedAt).toBe('2026-08-05T12:00:00.000Z')
    })

    it('异常: updateDelivery 不存在抛错', () => {
      expect(() => service.updateDelivery('nonexistent', 't1', { carrier: 'x' })).toThrow()
    })

    it('异常: updateDelivery 跨租户抛错', () => {
      const d = service.createDelivery(baseInput())
      expect(() => service.updateDelivery(d.id, 't2', { carrier: 'x' })).toThrow()
    })
  })

  // ── Status Transitions ───────────────────────────────────────────────────

  describe('updateDeliveryStatus', () => {
    it('正例: 更新为 InTransit', () => {
      const d = service.createDelivery(baseInput())
      const u = service.updateDeliveryStatus(d.id, DeliveryStatus.InTransit, 't1')
      expect(u.status).toBe(DeliveryStatus.InTransit)
    })

    it('正例: 更新为 Delivered 记录送达时间', () => {
      const d = service.createDelivery(baseInput())
      const u = service.updateDeliveryStatus(d.id, DeliveryStatus.Delivered, 't1')
      expect(u.status).toBe(DeliveryStatus.Delivered)
      expect(u.deliveredAt).toBeTruthy()
    })

    it('正例: 更新为 Failed 也记录送达时间', () => {
      const d = service.createDelivery(baseInput())
      const u = service.updateDeliveryStatus(d.id, DeliveryStatus.Failed, 't1')
      expect(u.status).toBe(DeliveryStatus.Failed)
      expect(u.deliveredAt).toBeTruthy()
    })

    it('正例: 更新状态带备注', () => {
      const d = service.createDelivery(baseInput())
      const u = service.updateDeliveryStatus(d.id, DeliveryStatus.InTransit, 't1', '已出库')
      expect(u.remark).toBe('已出库')
    })

    it('异常: 更新不存在的配送抛错', () => {
      expect(() => service.updateDeliveryStatus('nonexistent', DeliveryStatus.Delivered, 't1')).toThrow()
    })

    it('异常: 跨租户更新抛错', () => {
      const d = service.createDelivery(baseInput())
      expect(() => service.updateDeliveryStatus(d.id, DeliveryStatus.Delivered, 't2')).toThrow()
    })
  })

  // ── Events ───────────────────────────────────────────────────────────────

  describe('Events', () => {
    it('正例: addEvent 添加配送事件', () => {
      const d = service.createDelivery(baseInput())
      const evt = service.addEvent({
        deliveryId: d.id,
        status: DeliveryStatus.Pending,
        location: '上海仓库',
        description: '订单创建',
        timestamp: new Date().toISOString(),
      })
      expect(evt.id).toMatch(/^event-/)
      expect(evt.deliveryId).toBe(d.id)
      expect(evt.description).toBe('订单创建')
    })

    it('正例: getTrackingTimeline 按时间升序', () => {
      const d = service.createDelivery(baseInput())
      service.addEvent({ deliveryId: d.id, status: DeliveryStatus.Pending, location: '上海', description: '创建', timestamp: '2026-08-01T08:00:00Z' })
      service.addEvent({ deliveryId: d.id, status: DeliveryStatus.InTransit, location: '中转', description: '转运', timestamp: '2026-08-01T10:00:00Z' })
      const tl = service.getTrackingTimeline(d.id, 't1')
      expect(tl).toHaveLength(2)
      expect(tl[0].timestamp).toBe('2026-08-01T08:00:00Z')
      expect(tl[1].timestamp).toBe('2026-08-01T10:00:00Z')
    })

    it('边缘: getTrackingTimeline 跨租户返回空', () => {
      const d = service.createDelivery(baseInput())
      const tl = service.getTrackingTimeline(d.id, 't2')
      expect(tl).toEqual([])
    })

    it('边缘: getTrackingTimeline 不存在的配送返回空', () => {
      expect(service.getTrackingTimeline('nonexistent', 't1')).toEqual([])
    })

    it('正例: 同一配送多条事件按时间排序', () => {
      const d = service.createDelivery(baseInput())
      service.addEvent({ deliveryId: d.id, status: DeliveryStatus.Pending, location: 'A', description: 'a', timestamp: '2026-08-01T09:00:00Z' })
      service.addEvent({ deliveryId: d.id, status: DeliveryStatus.InTransit, location: 'B', description: 'b', timestamp: '2026-08-01T07:00:00Z' })
      service.addEvent({ deliveryId: d.id, status: DeliveryStatus.Arrived, location: 'C', description: 'c', timestamp: '2026-08-01T08:00:00Z' })
      const tl = service.getTrackingTimeline(d.id, 't1')
      expect(tl[0].timestamp).toBe('2026-08-01T07:00:00Z')
      expect(tl[1].timestamp).toBe('2026-08-01T08:00:00Z')
      expect(tl[2].timestamp).toBe('2026-08-01T09:00:00Z')
    })
  })

  // ── Mock Data ────────────────────────────────────────────────────────────

  describe('seedMockData', () => {
    it('正例: seedMockData 填充多条配送数据', () => {
      service.seedMockData('t1')
      const list = service.listDeliveries('t1')
      expect(list.length).toBeGreaterThan(0)
    })

    it('正例: 种子数据包含各种状态', () => {
      service.seedMockData('t1')
      const list = service.listDeliveries('t1')
      const statuses = new Set(list.map((d) => d.status))
      expect(statuses.has(DeliveryStatus.Pending)).toBe(true)
      expect(statuses.has(DeliveryStatus.InTransit)).toBe(true)
      expect(statuses.has(DeliveryStatus.Delivered)).toBe(true)
    })

    it('正例: 种子数据的配送有事件', () => {
      service.seedMockData('t1')
      const list = service.listDeliveries('t1')
      const tl = service.getTrackingTimeline(list[0].id, 't1')
      expect(tl.length).toBeGreaterThan(0)
    })

    it('正例: seedMockData 租户隔离', () => {
      service.seedMockData('t1')
      expect(service.listDeliveries('t2')).toHaveLength(0)
    })
  })
})
