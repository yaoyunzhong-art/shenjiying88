import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [return-request] [D] service 测试
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { ReturnRequestService } from './return-request.service'
import {
  ReturnType,
  ReturnStatus,
  type ReturnRequest,
} from './return-request.entity'

describe('ReturnRequestService', () => {
  let service: ReturnRequestService

  const TENANT = 'tenant-001'

  beforeEach(() => {
    service = new ReturnRequestService()
  })

  afterEach(() => {
    service.resetReturnStoresForTests()
  })

  function createTestReturn(overrides?: Partial<Parameters<ReturnRequestService['createReturn']>[0]>): ReturnRequest {
    return service.createReturn({
      tenantId: TENANT,
      returnNo: 'RET-TEST-001',
      orderNo: 'ORD-TEST-001',
      itemName: '测试商品',
      quantity: 1,
      type: ReturnType.QualityIssue,
      reason: '质量问题测试',
      customerName: '测试客户',
      amount: 299,
      ...overrides,
    })
  }

  // ── CRUD ──

  describe('createReturn', () => {
    it('should create a return with PENDING status', () => {
      const r = createTestReturn()

      assert.equal(r.returnNo, 'RET-TEST-001')
      assert.equal(r.itemName, '测试商品')
      assert.equal(r.type, ReturnType.QualityIssue)
      assert.equal(r.status, ReturnStatus.Pending)
      assert.equal(r.tenantId, TENANT)
      assert.equal(r.customerName, '测试客户')
      assert.equal(r.amount, 299)
      assert.ok(r.id.startsWith('return-'))
      assert.ok(r.createdAt)
      assert.equal(r.resolvedAt, undefined)
    })

    it('should create return with images', () => {
      const r = createTestReturn({
        returnNo: 'RET-IMG',
        images: ['img/1.jpg', 'img/2.jpg'],
        remark: '有图片附件',
      })

      assert.equal(r.images?.length, 2)
      assert.equal(r.remark, '有图片附件')
    })
  })

  describe('getReturn', () => {
    it('should return return by id', () => {
      const r = createTestReturn()
      const found = service.getReturn(r.id, TENANT)
      assert.ok(found)
      assert.equal(found?.id, r.id)
    })

    it('should return undefined for non-existent return', () => {
      const found = service.getReturn('nonexistent', TENANT)
      assert.equal(found, undefined)
    })

    it('should return undefined for wrong tenant', () => {
      const r = createTestReturn()
      const found = service.getReturn(r.id, 'wrong-tenant')
      assert.equal(found, undefined)
    })
  })

  describe('listReturns', () => {
    it('should list all returns for tenant', () => {
      createTestReturn({ returnNo: 'RET-1' })
      createTestReturn({ returnNo: 'RET-2' })

      const list = service.listReturns(TENANT)
      assert.equal(list.length, 2)
    })

    it('should filter by status', () => {
      const r = createTestReturn({ returnNo: 'RET-APP' })
      service.updateReturnStatus(r.id, ReturnStatus.Approved, TENANT)

      const approved = service.listReturns(TENANT, { status: ReturnStatus.Approved })
      assert.equal(approved.length, 1)
    })

    it('should filter by type', () => {
      createTestReturn({ returnNo: 'RET-Q', type: ReturnType.QualityIssue })
      createTestReturn({ returnNo: 'RET-D', type: ReturnType.Damage })

      const damage = service.listReturns(TENANT, { type: ReturnType.Damage })
      assert.equal(damage.length, 1)
    })
  })

  describe('updateReturn', () => {
    it('should update return fields', () => {
      const r = createTestReturn()
      const updated = service.updateReturn(r.id, TENANT, { reason: '更新原因' })
      assert.equal(updated.reason, '更新原因')
    })

    it('should throw for non-existent return', () => {
      assert.throws(
        () => service.updateReturn('nonexistent', TENANT, { reason: 'X' }),
        /Return request not found/
      )
    })
  })

  describe('deleteReturn', () => {
    it('should delete a return', () => {
      const r = createTestReturn()
      service.deleteReturn(r.id, TENANT)

      const found = service.getReturn(r.id, TENANT)
      assert.equal(found, undefined)
    })

    it('should throw for non-existent return', () => {
      assert.throws(
        () => service.deleteReturn('nonexistent', TENANT),
        /Return request not found/
      )
    })
  })

  // ── Workflow status transitions ──

  describe('updateReturnStatus', () => {
    it('should transition Pending → Inspecting', () => {
      const r = createTestReturn()
      const updated = service.updateReturnStatus(r.id, ReturnStatus.Inspecting, TENANT)
      assert.equal(updated.status, ReturnStatus.Inspecting)
    })

    it('should transition Pending → Approved', () => {
      const r = createTestReturn()
      const updated = service.updateReturnStatus(r.id, ReturnStatus.Approved, TENANT)
      assert.equal(updated.status, ReturnStatus.Approved)
    })

    it('should transition Pending → Rejected', () => {
      const r = createTestReturn()
      const updated = service.updateReturnStatus(r.id, ReturnStatus.Rejected, TENANT)
      assert.equal(updated.status, ReturnStatus.Rejected)
      assert.ok(updated.resolvedAt)
    })

    it('should transition Inspecting → Approved', () => {
      const r = createTestReturn()
      service.updateReturnStatus(r.id, ReturnStatus.Inspecting, TENANT)
      const updated = service.updateReturnStatus(r.id, ReturnStatus.Approved, TENANT)
      assert.equal(updated.status, ReturnStatus.Approved)
    })

    it('should transition Inspecting → Rejected', () => {
      const r = createTestReturn()
      service.updateReturnStatus(r.id, ReturnStatus.Inspecting, TENANT)
      const updated = service.updateReturnStatus(r.id, ReturnStatus.Rejected, TENANT)
      assert.equal(updated.status, ReturnStatus.Rejected)
      assert.ok(updated.resolvedAt)
    })

    it('should transition Approved → Refunded', () => {
      const r = createTestReturn()
      service.updateReturnStatus(r.id, ReturnStatus.Approved, TENANT)
      const updated = service.updateReturnStatus(r.id, ReturnStatus.Refunded, TENANT)
      assert.equal(updated.status, ReturnStatus.Refunded)
      assert.ok(updated.resolvedAt)
    })

    it('should transition Rejected → Pending (reopen)', () => {
      const r = createTestReturn()
      service.updateReturnStatus(r.id, ReturnStatus.Rejected, TENANT)
      const updated = service.updateReturnStatus(r.id, ReturnStatus.Pending, TENANT)
      assert.equal(updated.status, ReturnStatus.Pending)
    })

    it('should reject invalid: Pending → Refunded', () => {
      const r = createTestReturn()
      assert.throws(
        () => service.updateReturnStatus(r.id, ReturnStatus.Refunded, TENANT),
        /Invalid return status transition/
      )
    })

    it('should reject invalid: Refunded → Pending', () => {
      const r = createTestReturn()
      service.updateReturnStatus(r.id, ReturnStatus.Approved, TENANT)
      service.updateReturnStatus(r.id, ReturnStatus.Refunded, TENANT)
      assert.throws(
        () => service.updateReturnStatus(r.id, ReturnStatus.Pending, TENANT),
        /Invalid return status transition/
      )
    })
  })

  // ── Query helpers ──

  describe('getReturnsByCustomer', () => {
    it('should return returns for a customer', () => {
      createTestReturn({ returnNo: 'R1', customerName: '张三' })
      createTestReturn({ returnNo: 'R2', customerName: '张三' })
      createTestReturn({ returnNo: 'R3', customerName: '李四' })

      const list = service.getReturnsByCustomer('张三', TENANT)
      assert.equal(list.length, 2)
    })

    it('should return empty for unknown customer', () => {
      const list = service.getReturnsByCustomer('不存在', TENANT)
      assert.equal(list.length, 0)
    })
  })

  describe('getPendingReturns', () => {
    it('should return pending returns', () => {
      createTestReturn({ returnNo: 'R1' })
      const r2 = createTestReturn({ returnNo: 'R2' })
      service.updateReturnStatus(r2.id, ReturnStatus.Approved, TENANT)

      const pending = service.getPendingReturns(TENANT)
      assert.equal(pending.length, 1)
      assert.equal(pending[0].returnNo, 'R1')
    })
  })
})
