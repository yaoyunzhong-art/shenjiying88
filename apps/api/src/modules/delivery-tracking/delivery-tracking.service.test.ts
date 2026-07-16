import { describe, it, beforeEach, afterEach } from 'vitest'
/**
 * 🐜 自动: [delivery-tracking] service 测试
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { DeliveryTrackingService } from './delivery-tracking.service'
import { DeliveryMethod, DeliveryStatus } from './delivery-tracking.entity'

describe('DeliveryTrackingService', () => {
  let service: DeliveryTrackingService

  const TENANT = 'tenant-001'

  beforeEach(() => {
    service = new DeliveryTrackingService()
  })

  afterEach(() => {
    service.resetDeliveryStoresForTests()
  })

  function createTestDelivery(overrides?: Partial<Parameters<DeliveryTrackingService['createDelivery']>[0]>) {
    return service.createDelivery({
      tenantId: TENANT,
      orderNo: 'ORD-TEST-001',
      method: DeliveryMethod.Courier,
      carrier: '顺丰速运',
      trackingNo: 'SF-TEST-001',
      sender: '测试仓库',
      receiver: '测试接收人',
      receiverPhone: '13800000000',
      receiverAddress: '测试地址',
      estimatedAt: '2026-07-20T12:00:00.000Z',
      ...overrides,
    })
  }

  // ── CRUD ──

  describe('createDelivery', () => {
    it('should create a delivery with PENDING status', () => {
      const d = createTestDelivery()

      assert.equal(d.orderNo, 'ORD-TEST-001')
      assert.equal(d.status, DeliveryStatus.Pending)
      assert.equal(d.method, DeliveryMethod.Courier)
      assert.equal(d.tenantId, TENANT)
      assert.ok(d.id.startsWith('delivery-'))
      assert.ok(d.deliveryNo.startsWith('DL'))
      assert.ok(d.createdAt)
    })

    it('should create delivery with optional remark', () => {
      const d = createTestDelivery({ remark: '请小心轻放' })
      assert.equal(d.remark, '请小心轻放')
    })
  })

  describe('getDelivery', () => {
    it('should return delivery by id', () => {
      const d = createTestDelivery()
      const found = service.getDelivery(d.id, TENANT)
      assert.ok(found)
      assert.equal(found?.id, d.id)
    })

    it('should return undefined for non-existent delivery', () => {
      const found = service.getDelivery('nonexistent', TENANT)
      assert.equal(found, undefined)
    })

    it('should return undefined for wrong tenant', () => {
      const d = createTestDelivery()
      const found = service.getDelivery(d.id, 'other-tenant')
      assert.equal(found, undefined)
    })
  })

  describe('listDeliveries', () => {
    it('should list all deliveries for tenant', () => {
      createTestDelivery({ orderNo: 'ORD-001' })
      createTestDelivery({ orderNo: 'ORD-002' })
      const list = service.listDeliveries(TENANT)
      assert.equal(list.length, 2)
    })

    it('should filter by status', () => {
      createTestDelivery({ orderNo: 'ORD-001' })
      const d2 = createTestDelivery({ orderNo: 'ORD-002' })
      service.updateDeliveryStatus(d2.id, DeliveryStatus.InTransit, TENANT)

      const pending = service.listDeliveries(TENANT, { status: DeliveryStatus.Pending })
      assert.equal(pending.length, 1)
      assert.equal(pending[0].orderNo, 'ORD-001')
    })

    it('should filter by method', () => {
      createTestDelivery({ orderNo: 'ORD-001', method: DeliveryMethod.Courier })
      createTestDelivery({ orderNo: 'ORD-002', method: DeliveryMethod.Express })

      const courier = service.listDeliveries(TENANT, { method: DeliveryMethod.Courier })
      assert.equal(courier.length, 1)
      assert.equal(courier[0].method, DeliveryMethod.Courier)
    })

    it('should filter by orderNo', () => {
      createTestDelivery({ orderNo: 'ORD-001' })
      createTestDelivery({ orderNo: 'ORD-002' })

      const found = service.listDeliveries(TENANT, { orderNo: 'ORD-001' })
      assert.equal(found.length, 1)
    })

    it('should not return deliveries from other tenants', () => {
      createTestDelivery({ tenantId: TENANT })
      createTestDelivery({ tenantId: 'other-tenant' })

      const list = service.listDeliveries(TENANT)
      assert.equal(list.length, 1)
    })
  })

  describe('updateDelivery', () => {
    it('should update delivery fields', () => {
      const d = createTestDelivery()
      const updated = service.updateDelivery(d.id, TENANT, {
        carrier: '京东物流',
        trackingNo: 'JD-NEW-001',
        remark: '已更新',
      })

      assert.equal(updated.carrier, '京东物流')
      assert.equal(updated.trackingNo, 'JD-NEW-001')
      assert.equal(updated.remark, '已更新')
      // Unchanged fields remain
      assert.equal(updated.orderNo, 'ORD-TEST-001')
    })

    it('should throw on non-existent delivery', () => {
      assert.throws(() => {
        service.updateDelivery('nonexistent', TENANT, { carrier: 'test' })
      }, /Delivery not found/)
    })
  })

  describe('updateDeliveryStatus', () => {
    it('should update status', () => {
      const d = createTestDelivery()
      const updated = service.updateDeliveryStatus(d.id, DeliveryStatus.InTransit, TENANT)

      assert.equal(updated.status, DeliveryStatus.InTransit)
    })

    it('should set deliveredAt on DELIVERED status', () => {
      const d = createTestDelivery()
      const updated = service.updateDeliveryStatus(d.id, DeliveryStatus.Delivered, TENANT)

      assert.equal(updated.status, DeliveryStatus.Delivered)
      assert.ok(updated.deliveredAt)
    })

    it('should set deliveredAt on FAILED status', () => {
      const d = createTestDelivery()
      const updated = service.updateDeliveryStatus(d.id, DeliveryStatus.Failed, TENANT, '收件人拒收')

      assert.equal(updated.status, DeliveryStatus.Failed)
      assert.equal(updated.remark, '收件人拒收')
      assert.ok(updated.deliveredAt)
    })

    it('should throw on non-existent delivery', () => {
      assert.throws(() => {
        service.updateDeliveryStatus('nonexistent', DeliveryStatus.Delivered, TENANT)
      }, /Delivery not found/)
    })
  })

  // ── Events ──

  describe('addEvent / getTrackingTimeline', () => {
    it('should add and retrieve events in chronological order', () => {
      const d = createTestDelivery()

      service.addEvent({
        deliveryId: d.id,
        status: DeliveryStatus.PickedUp,
        location: '仓库',
        description: '已取件',
        timestamp: '2026-07-16T10:00:00.000Z',
      })
      service.addEvent({
        deliveryId: d.id,
        status: DeliveryStatus.InTransit,
        location: '中转站',
        description: '已到中转站',
        timestamp: '2026-07-16T12:00:00.000Z',
      })

      const timeline = service.getTrackingTimeline(d.id, TENANT)
      assert.equal(timeline.length, 2)
      assert.equal(timeline[0].status, DeliveryStatus.PickedUp)
      assert.equal(timeline[1].status, DeliveryStatus.InTransit)
    })

    it('should return empty array for non-existent delivery', () => {
      const timeline = service.getTrackingTimeline('nonexistent', TENANT)
      assert.deepStrictEqual(timeline, [])
    })
  })

  // ── Seed ──

  describe('seedMockData', () => {
    it('should seed 22 deliveries with events', () => {
      service.seedMockData(TENANT)
      const deliveries = service.listDeliveries(TENANT)
      assert.equal(deliveries.length, 22)

      // First delivery should have events
      const timeline = service.getTrackingTimeline(deliveries[0].id, TENANT)
      assert.ok(timeline.length > 0)
    })
  })
})
