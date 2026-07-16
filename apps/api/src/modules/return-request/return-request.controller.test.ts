import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [return-request] [D] controller 测试
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { ReturnRequestController } from './return-request.controller'
import { ReturnRequestService } from './return-request.service'
import {
  ReturnType,
  ReturnStatus,
} from './return-request.entity'

describe('ReturnRequestController', () => {
  let controller: InstanceType<typeof ReturnRequestController>
  let service: InstanceType<typeof ReturnRequestService>

  const TENANT = { tenantId: 'tenant-001', brandId: 'brand-1', storeId: 'store-001' }

  beforeEach(() => {
    service = new ReturnRequestService()
    controller = new ReturnRequestController(service)
  })

  afterEach(() => {
    service.resetReturnStoresForTests()
  })

  // ── Route metadata ──

  describe('route metadata', () => {
    it('controller path should be return-requests', () => {
      const path = Reflect.getMetadata('path', ReturnRequestController)
      assert.equal(path, 'return-requests')
    })

    it('createReturn should be POST /', () => {
      const method = Reflect.getMetadata('method', ReturnRequestController.prototype.createReturn)
      const path = Reflect.getMetadata('path', ReturnRequestController.prototype.createReturn)
      assert.equal(method, 1)
      assert.equal(path, '/')
    })

    it('listReturns should be GET /', () => {
      const method = Reflect.getMetadata('method', ReturnRequestController.prototype.listReturns)
      const path = Reflect.getMetadata('path', ReturnRequestController.prototype.listReturns)
      assert.equal(method, 0)
      assert.equal(path, '/')
    })

    it('getReturn should be GET /:returnId', () => {
      const method = Reflect.getMetadata('method', ReturnRequestController.prototype.getReturn)
      const path = Reflect.getMetadata('path', ReturnRequestController.prototype.getReturn)
      assert.equal(method, 0)
      assert.equal(path, ':returnId')
    })

    it('updateReturn should be PATCH /:returnId', () => {
      const method = Reflect.getMetadata('method', ReturnRequestController.prototype.updateReturn)
      const path = Reflect.getMetadata('path', ReturnRequestController.prototype.updateReturn)
      assert.equal(method, 4)
      assert.equal(path, ':returnId')
    })

    it('deleteReturn should be DELETE /:returnId', () => {
      const method = Reflect.getMetadata('method', ReturnRequestController.prototype.deleteReturn)
      const path = Reflect.getMetadata('path', ReturnRequestController.prototype.deleteReturn)
      assert.equal(method, 5)
      assert.equal(path, ':returnId')
    })

    it('updateReturnStatus should be PATCH /:returnId/status', () => {
      const method = Reflect.getMetadata('method', ReturnRequestController.prototype.updateReturnStatus)
      const path = Reflect.getMetadata('path', ReturnRequestController.prototype.updateReturnStatus)
      assert.equal(method, 4)
      assert.equal(path, ':returnId/status')
    })

    it('getPendingReturns should be GET /views/pending', () => {
      const method = Reflect.getMetadata('method', ReturnRequestController.prototype.getPendingReturns)
      const path = Reflect.getMetadata('path', ReturnRequestController.prototype.getPendingReturns)
      assert.equal(method, 0)
      assert.equal(path, 'views/pending')
    })

    it('getReturnsByCustomer should be GET /customer/:customerName', () => {
      const method = Reflect.getMetadata('method', ReturnRequestController.prototype.getReturnsByCustomer)
      const path = Reflect.getMetadata('path', ReturnRequestController.prototype.getReturnsByCustomer)
      assert.equal(method, 0)
      assert.equal(path, 'customer/:customerName')
    })
  })

  // ── CRUD via controller ──

  describe('POST /return-requests', () => {
    it('should create a return', () => {
      const result = controller.createReturn(TENANT, {
        returnNo: 'RET-001',
        orderNo: 'ORD-001',
        itemName: '测试商品',
        quantity: 1,
        type: ReturnType.QualityIssue,
        reason: '质量问题',
        customerName: '张三',
        amount: 299,
      })

      assert.equal(result.returnNo, 'RET-001')
      assert.equal(result.status, ReturnStatus.Pending)
      assert.ok(result.id.startsWith('return-'))
    })
  })

  describe('GET /return-requests', () => {
    it('should list returns', () => {
      controller.createReturn(TENANT, {
        returnNo: 'RET-001', orderNo: 'O1', itemName: 'I1',
        quantity: 1, type: ReturnType.Damage, reason: '破损',
        customerName: '张三', amount: 199,
      })

      const list = controller.listReturns(TENANT, {})
      assert.equal(list.length, 1)
    })
  })

  describe('GET /return-requests/:returnId', () => {
    it('should get return', () => {
      const created = controller.createReturn(TENANT, {
        returnNo: 'RET-GET', orderNo: 'O1', itemName: 'I1',
        quantity: 1, type: ReturnType.QualityIssue, reason: '问题',
        customerName: '张三', amount: 299,
      })

      const found = controller.getReturn(TENANT, created.id)
      assert.ok(found)
      assert.equal(found.returnNo, 'RET-GET')
    })
  })

  describe('PATCH /return-requests/:returnId', () => {
    it('should update return', () => {
      const created = controller.createReturn(TENANT, {
        returnNo: 'RET-OLD', orderNo: 'O1', itemName: 'I1',
        quantity: 1, type: ReturnType.Damage, reason: '破损',
        customerName: '张三', amount: 199,
      })

      const updated = controller.updateReturn(TENANT, created.id, { reason: '更新原因' })
      assert.equal(updated.reason, '更新原因')
    })
  })

  describe('DELETE /return-requests/:returnId', () => {
    it('should delete return', () => {
      const created = controller.createReturn(TENANT, {
        returnNo: 'RET-DEL', orderNo: 'O1', itemName: 'I1',
        quantity: 1, type: ReturnType.QualityIssue, reason: '问题',
        customerName: '张三', amount: 299,
      })

      const result = controller.deleteReturn(TENANT, created.id)
      assert.deepStrictEqual(result, { success: true })
    })
  })

  // ── Status management via controller ──

  describe('PATCH /return-requests/:returnId/status', () => {
    it('should update status', () => {
      const created = controller.createReturn(TENANT, {
        returnNo: 'RET-STATUS', orderNo: 'O1', itemName: 'I1',
        quantity: 1, type: ReturnType.QualityIssue, reason: '问题',
        customerName: '张三', amount: 299,
      })

      const updated = controller.updateReturnStatus(TENANT, created.id, {
        status: ReturnStatus.Inspecting,
      })
      assert.equal(updated.status, ReturnStatus.Inspecting)
    })
  })

  // ── Error handling ──

  describe('error propagation from service', () => {
    it('should propagate return not found', () => {
      assert.throws(
        () => controller.getReturn(TENANT, 'nonexistent'),
        /Return request not found/
      )
    })
  })
})
