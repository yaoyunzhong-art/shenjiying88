import { describe, it, beforeEach, afterEach } from 'vitest'
/**
 * 🐜 自动: [delivery-tracking] controller 测试
 */
import assert from 'node:assert/strict'
import { DeliveryTrackingController } from './delivery-tracking.controller'
import { DeliveryTrackingService } from './delivery-tracking.service'
import { DeliveryMethod, DeliveryStatus } from './delivery-tracking.entity'

describe('DeliveryTrackingController', () => {
  let controller: InstanceType<typeof DeliveryTrackingController>
  let service: InstanceType<typeof DeliveryTrackingService>

  const TENANT = { tenantId: 'tenant-001' }

  beforeEach(() => {
    service = new DeliveryTrackingService()
    controller = new DeliveryTrackingController(service)
  })

  afterEach(() => {
    service.resetDeliveryStoresForTests()
  })

  // ── Controller Logic ──

  describe('createDelivery', () => {
    it('should create delivery via controller', () => {
      const d = controller.createDelivery(TENANT, {
        orderNo: 'ORD-TEST-001',
        method: DeliveryMethod.Courier,
        carrier: '顺丰速运',
        trackingNo: 'SF001',
        sender: '仓库',
        receiver: '张三',
        receiverPhone: '13800138001',
        receiverAddress: '测试地址',
        estimatedAt: '2026-07-20T12:00:00.000Z',
      })

      assert.equal(d.orderNo, 'ORD-TEST-001')
      assert.equal(d.status, DeliveryStatus.Pending)
    })
  })

  describe('listDeliveries', () => {
    it('should list deliveries', () => {
      controller.createDelivery(TENANT, {
        orderNo: 'ORD-001',
        method: DeliveryMethod.Courier,
        carrier: 'C',
        trackingNo: 'T1',
        sender: 'S',
        receiver: 'R',
        receiverPhone: '13800138001',
        receiverAddress: 'A',
        estimatedAt: '2026-07-20T12:00:00.000Z',
      })
      controller.createDelivery(TENANT, {
        orderNo: 'ORD-002',
        method: DeliveryMethod.Express,
        carrier: 'C',
        trackingNo: 'T2',
        sender: 'S',
        receiver: 'R',
        receiverPhone: '13800138002',
        receiverAddress: 'A',
        estimatedAt: '2026-07-20T12:00:00.000Z',
      })

      const list = controller.listDeliveries(TENANT, {})
      assert.equal(list.length, 2)
    })
  })

  describe('getDelivery', () => {
    it('should get delivery by id', () => {
      const d = controller.createDelivery(TENANT, {
        orderNo: 'ORD-TEST',
        method: DeliveryMethod.Courier,
        carrier: 'C',
        trackingNo: 'T',
        sender: 'S',
        receiver: 'R',
        receiverPhone: '13800138001',
        receiverAddress: 'A',
        estimatedAt: '2026-07-20T12:00:00.000Z',
      })

      const found = controller.getDelivery(TENANT, d.id)
      assert.equal(found.id, d.id)
    })

    it('should throw on non-existent delivery', () => {
      assert.throws(() => {
        controller.getDelivery(TENANT, 'nonexistent')
      }, /Delivery not found/)
    })
  })

  describe('updateDelivery', () => {
    it('should update delivery fields', () => {
      const d = controller.createDelivery(TENANT, {
        orderNo: 'ORD-TEST',
        method: DeliveryMethod.Courier,
        carrier: '原物流',
        trackingNo: 'T',
        sender: 'S',
        receiver: 'R',
        receiverPhone: '13800138001',
        receiverAddress: 'A',
        estimatedAt: '2026-07-20T12:00:00.000Z',
      })

      const updated = controller.updateDelivery(TENANT, d.id, { carrier: '新物流' })
      assert.equal(updated.carrier, '新物流')
    })
  })

  describe('updateDeliveryStatus', () => {
    it('should update delivery status', () => {
      const d = controller.createDelivery(TENANT, {
        orderNo: 'ORD-TEST',
        method: DeliveryMethod.Courier,
        carrier: 'C',
        trackingNo: 'T',
        sender: 'S',
        receiver: 'R',
        receiverPhone: '13800138001',
        receiverAddress: 'A',
        estimatedAt: '2026-07-20T12:00:00.000Z',
      })

      const updated = controller.updateDeliveryStatus(TENANT, d.id, {
        status: DeliveryStatus.InTransit,
      })
      assert.equal(updated.status, DeliveryStatus.InTransit)
    })
  })

  describe('addDeliveryEvent / getTrackingTimeline', () => {
    it('should add event and get timeline', () => {
      const d = controller.createDelivery(TENANT, {
        orderNo: 'ORD-TEST',
        method: DeliveryMethod.Courier,
        carrier: 'C',
        trackingNo: 'T',
        sender: 'S',
        receiver: 'R',
        receiverPhone: '13800138001',
        receiverAddress: 'A',
        estimatedAt: '2026-07-20T12:00:00.000Z',
      })

      controller.addDeliveryEvent(TENANT, d.id, {
        status: DeliveryStatus.PickedUp,
        location: '仓库',
        description: '已取件',
        timestamp: '2026-07-16T10:00:00.000Z',
      })

      const timeline = controller.getTrackingTimeline(TENANT, d.id)
      assert.equal(timeline.length, 1)
      assert.equal(timeline[0].status, DeliveryStatus.PickedUp)
    })

    it('should throw on non-existent delivery for adding event', () => {
      assert.throws(() => {
        controller.addDeliveryEvent(TENANT, 'nonexistent', {
          status: DeliveryStatus.PickedUp,
          location: '仓库',
          description: '已取件',
          timestamp: '2026-07-16T10:00:00.000Z',
        })
      }, /Delivery not found/)
    })
  })

  describe('seedMockData', () => {
    it('should seed mock data', () => {
      const result = controller.seedMockData(TENANT)
      assert.deepStrictEqual(result, { message: 'Mock delivery data seeded' })

      const list = controller.listDeliveries(TENANT, {})
      assert.equal(list.length, 22)
    })
  })
})
