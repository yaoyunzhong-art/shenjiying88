import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [return-request] [D] entity 测试
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import {
  ReturnType,
  ReturnStatus,
  type ReturnRequest,
} from './return-request.entity'

describe('ReturnRequest Entity', () => {
  describe('enums', () => {
    it('ReturnType should have correct values', () => {
      assert.equal(ReturnType.QualityIssue, 'QUALITY_ISSUE')
      assert.equal(ReturnType.WrongItem, 'WRONG_ITEM')
      assert.equal(ReturnType.CustomerRemorse, 'CUSTOMER_REMORSE')
      assert.equal(ReturnType.Damage, 'DAMAGE')
    })

    it('ReturnStatus should have correct values', () => {
      assert.equal(ReturnStatus.Pending, 'PENDING')
      assert.equal(ReturnStatus.Inspecting, 'INSPECTING')
      assert.equal(ReturnStatus.Approved, 'APPROVED')
      assert.equal(ReturnStatus.Rejected, 'REJECTED')
      assert.equal(ReturnStatus.Refunded, 'REFUNDED')
    })
  })

  describe('ReturnRequest interface shape', () => {
    it('should create a valid return request with images', () => {
      const ret: ReturnRequest = {
        id: 'return-001',
        returnNo: 'RET-2026-0001',
        orderNo: 'ORD-2026-0101',
        itemName: '无线蓝牙耳机',
        quantity: 1,
        type: ReturnType.QualityIssue,
        reason: '左耳无声',
        status: ReturnStatus.Pending,
        customerName: '张小明',
        amount: 299,
        images: ['img/defect-1.jpg'],
        createdAt: '2026-07-01T00:00:00.000Z',
        tenantId: 'tenant-001',
      }

      assert.equal(ret.returnNo, 'RET-2026-0001')
      assert.equal(ret.itemName, '无线蓝牙耳机')
      assert.equal(ret.type, ReturnType.QualityIssue)
      assert.equal(ret.status, ReturnStatus.Pending)
      assert.equal(ret.customerName, '张小明')
      assert.equal(ret.amount, 299)
      assert.ok(ret.images)
      assert.equal(ret.images?.length, 1)
    })

    it('should support return without images and with resolvedAt', () => {
      const ret: ReturnRequest = {
        id: 'return-002',
        returnNo: 'RET-2026-0002',
        orderNo: 'ORD-2026-0102',
        itemName: '运动鞋',
        quantity: 1,
        type: ReturnType.CustomerRemorse,
        reason: '不想要了',
        status: ReturnStatus.Refunded,
        customerName: '李华',
        amount: 389,
        createdAt: '2026-07-02T00:00:00.000Z',
        resolvedAt: '2026-07-04T00:00:00.000Z',
        tenantId: 'tenant-001',
      }

      assert.equal(ret.images, undefined)
      assert.equal(ret.resolvedAt, '2026-07-04T00:00:00.000Z')
      assert.equal(ret.remark, undefined)
    })
  })
})
