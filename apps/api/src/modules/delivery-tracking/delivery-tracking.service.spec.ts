/**
 * delivery-tracking.service.spec.ts — 配送追踪服务 V23 全覆盖测试
 *
 * 覆盖:
 *   - createDelivery / getDelivery / listDeliveries / updateDelivery / updateDeliveryStatus
 *   - addEvent / getTrackingTimeline
 *   - seedMockData
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { DeliveryTrackingService } from './delivery-tracking.service'
import { DeliveryMethod, DeliveryStatus } from './delivery-tracking.entity'

describe('DeliveryTrackingService', () => {
  let service: DeliveryTrackingService

  beforeEach(() => {
    service = new DeliveryTrackingService()
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
    it('正例: createDelivery 应创建配送记录', () => {
      const d = service.createDelivery(baseInput())
      expect(d.id).toMatch(/^delivery-/)
      expect(d.deliveryNo).toMatch(/^DL/)
      expect(d.status).toBe(DeliveryStatus.Pending)
    })

    it('正例: getDelivery 应返回配送记录', () => {
      const d = service.createDelivery(baseInput())
      const got = service.getDelivery(d.id, 't1')
      expect(got).toBeTruthy()
      expect(got!.receiver).toBe('张三')
    })

    it('边缘: getDelivery 跨租户应返回 undefined', () => {
      const d = service.createDelivery(baseInput())
      expect(service.getDelivery(d.id, 't2')).toBeUndefined()
    })

    it('正例: listDeliveries 支持多条件筛选', () => {
      service.createDelivery(baseInput())
      service.createDelivery({ ...baseInput(), orderNo: 'ORD-002', method: DeliveryMethod.Express })
      const couriers = service.listDeliveries('t1', { method: DeliveryMethod.Courier })
      expect(couriers).toHaveLength(1)
    })

    it('正例: updateDelivery 应部分更新', () => {
      const d = service.createDelivery(baseInput())
      const updated = service.updateDelivery(d.id, 't1', { carrier: '京东物流', receiver: '李四' })
      expect(updated.carrier).toBe('京东物流')
      expect(updated.receiver).toBe('李四')
    })

    it('正例: updateDeliveryStatus 应更新状态', () => {
      const d = service.createDelivery(baseInput())
      const inTransit = service.updateDeliveryStatus(d.id, DeliveryStatus.InTransit, 't1')
      expect(inTransit.status).toBe(DeliveryStatus.InTransit)
    })

    it('正例: updateDeliveryStatus Delivered 应记录送达时间', () => {
      const d = service.createDelivery(baseInput())
      const delivered = service.updateDeliveryStatus(d.id, DeliveryStatus.Delivered, 't1')
      expect(delivered.status).toBe(DeliveryStatus.Delivered)
      expect(delivered.deliveredAt).toBeTruthy()
    })

    it('异常: 更新不存配送应抛错', () => {
      expect(() => service.updateDeliveryStatus('nonexistent', DeliveryStatus.Delivered, 't1')).toThrow()
    })
  })

  // ── Events ───────────────────────────────────────────────────────────────

  describe('Events', () => {
    it('正例: addEvent 应添加配送事件', () => {
      const d = service.createDelivery(baseInput())
      const evt = service.addEvent({
        deliveryId: d.id, status: DeliveryStatus.Pending,
        location: '上海仓库', description: '订单创建',
        timestamp: new Date().toISOString(),
      })
      expect(evt.id).toMatch(/^event-/)
    })

    it('正例: getTrackingTimeline 应按时间排序', () => {
      const d = service.createDelivery(baseInput())
      service.addEvent({ deliveryId: d.id, status: DeliveryStatus.Pending, location: '上海', description: '创建', timestamp: '2026-08-01T08:00:00Z' })
      service.addEvent({ deliveryId: d.id, status: DeliveryStatus.InTransit, location: '中转', description: '转运', timestamp: '2026-08-01T10:00:00Z' })
      const timeline = service.getTrackingTimeline(d.id, 't1')
      expect(timeline).toHaveLength(2)
      expect(timeline[0].timestamp <= timeline[1].timestamp).toBe(true)
    })
  })

  // ── Mock Data ────────────────────────────────────────────────────────────

  describe('seedMockData', () => {
    it('正例: seedMockData 应填充配送数据', () => {
      service.seedMockData('t1')
      const list = service.listDeliveries('t1')
      expect(list.length).toBeGreaterThan(0)
    })
  })
})
