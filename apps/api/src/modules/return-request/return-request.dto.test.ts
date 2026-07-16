import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [return-request] [D] DTO 测试
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import {
  CreateReturnRequestDto,
  UpdateReturnRequestDto,
  UpdateReturnStatusDto,
  ReturnRequestQueryDto,
} from './return-request.dto'
import { ReturnType, ReturnStatus } from './return-request.entity'

describe('ReturnRequest DTOs', () => {
  describe('CreateReturnRequestDto', () => {
    it('should accept all required fields', () => {
      const dto = Object.assign(new CreateReturnRequestDto(), {
        returnNo: 'RET-2026-0100',
        orderNo: 'ORD-2026-0200',
        itemName: '蓝牙耳机',
        quantity: 1,
        type: ReturnType.QualityIssue,
        reason: '音质问题',
        customerName: '张三',
        amount: 299,
      })

      assert.equal(dto.returnNo, 'RET-2026-0100')
      assert.equal(dto.itemName, '蓝牙耳机')
      assert.equal(dto.type, ReturnType.QualityIssue)
      assert.equal(dto.customerName, '张三')
      assert.equal(dto.amount, 299)
    })

    it('should accept optional fields', () => {
      const dto = Object.assign(new CreateReturnRequestDto(), {
        returnNo: 'RET-2026-0101',
        orderNo: 'ORD-2026-0201',
        itemName: '台灯',
        quantity: 1,
        type: ReturnType.Damage,
        reason: '外壳破损',
        customerName: '李四',
        amount: 199,
        images: ['img/1.jpg', 'img/2.jpg'],
        remark: '需联系物流',
      })

      assert.equal(dto.images?.length, 2)
      assert.equal(dto.remark, '需联系物流')
    })

    it('should be instanceof CreateReturnRequestDto', () => {
      const dto = Object.assign(new CreateReturnRequestDto(), {
        returnNo: 'R1', orderNo: 'O1', itemName: 'I1',
        quantity: 1, type: ReturnType.CustomerRemorse,
        reason: 'R', customerName: 'C', amount: 100,
      })
      assert.ok(dto instanceof CreateReturnRequestDto)
    })
  })

  describe('UpdateReturnRequestDto', () => {
    it('should accept partial data', () => {
      const dto = Object.assign(new UpdateReturnRequestDto(), { reason: '更新原因' })
      assert.equal(dto.reason, '更新原因')
      assert.equal((dto as unknown as Record<string, unknown>).amount, undefined)
    })

    it('should accept empty object', () => {
      const dto = new UpdateReturnRequestDto()
      assert.equal((dto as unknown as Record<string, unknown>).returnNo, undefined)
      assert.equal((dto as unknown as Record<string, unknown>).remark, undefined)
    })
  })

  describe('UpdateReturnStatusDto', () => {
    it('should hold status', () => {
      const dto = Object.assign(new UpdateReturnStatusDto(), { status: ReturnStatus.Approved })
      assert.equal(dto.status, ReturnStatus.Approved)
    })
  })

  describe('ReturnRequestQueryDto', () => {
    it('should hold query filters', () => {
      const dto = Object.assign(new ReturnRequestQueryDto(), {
        status: ReturnStatus.Pending,
        type: ReturnType.QualityIssue,
        search: '耳机',
      })

      assert.equal(dto.status, ReturnStatus.Pending)
      assert.equal(dto.type, ReturnType.QualityIssue)
      assert.equal(dto.search, '耳机')
    })

    it('should accept empty query', () => {
      const dto = new ReturnRequestQueryDto()
      assert.equal(dto.status, undefined)
      assert.equal(dto.type, undefined)
    })
  })
})
