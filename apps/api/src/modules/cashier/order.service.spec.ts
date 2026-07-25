/**
 * order.service.spec.ts — T6 OrderService 完整测试
 *
 * 覆盖 30+ 测试用例:
 *  - 创建订单 (正常/幂等/参数校验)
 *  - 状态流转 (DRAFT→PENDING→PAID→FULFILLED→REFUNDED)
 *  - 乐观锁 (版本冲突)
 *  - 租户隔离 (跨租户拒绝/列表过滤/查询隔离)
 *  - 错误处理 (非法转移/不存在/缺少参数)
 *  - 列表查询 (分页/过滤/排序)
 *  - 退款 (全额/部分/累计)
 *  - SSE 事件 (created/submitted/paid/fulfilled/canceled/refunded/partially_refunded)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { OrderService } from './order.service'
import { CashierEventEmitter } from './cashier.events'
import type { CreateOrderInput } from '@m5/types'

// ─── 辅助工厂 ─────────────────────────────────────────────────
const TENANT_A = 'tenant-a'
const TENANT_B = 'tenant-b'
const USER_1 = 'user-001'

function makeInput(overrides?: Partial<CreateOrderInput>): CreateOrderInput {
  return {
    clientOrderId: `cl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    items: [{ productId: 'prod-1', quantity: 2, unitPriceCents: 5000 }],
    ...overrides,
  }
}

// ─── 测试 ─────────────────────────────────────────────────────

describe('OrderService', () => {
  let service: OrderService
  let emitter: CashierEventEmitter

  beforeEach(() => {
    emitter = new CashierEventEmitter()
    service = new OrderService(emitter)
  })

  // ═════════════════════════════════════════════════════════════
  // 1. 创建订单
  // ═════════════════════════════════════════════════════════════

  describe('create', () => {
    it('should create a DRAFT order with correct structure', () => {
      const input = makeInput()
      const order = service.create(input, { tenantId: TENANT_A, userId: USER_1 })

      expect(order.id).toMatch(/^ORD-\d{8}-\d{5}$/)
      expect(order.status).toBe('DRAFT')
      expect(order.tenantId).toBe(TENANT_A)
      expect(order.createdBy).toBe(USER_1)
      expect(order.clientOrderId).toBe(input.clientOrderId)
      expect(order.version).toBe(1)
      expect(order.paidCents).toBe(0)
      expect(order.refundedCents).toBe(0)
      expect(order.paidAt).toBeNull()
      expect(order.closedAt).toBeNull()
    })

    it('should calculate totalCents = subtotal - discount + tax', () => {
      const input = makeInput({
        items: [{ productId: 'p1', quantity: 3, unitPriceCents: 1000 }],
        discountCents: 200,
        taxCents: 100,
      })

      const order = service.create(input, { tenantId: TENANT_A, userId: USER_1 })

      // subtotal = 3 * 1000 = 3000, total = 3000 - 200 + 100 = 2900
      expect(order.subtotalCents).toBe(3000)
      expect(order.discountCents).toBe(200)
      expect(order.taxCents).toBe(100)
      expect(order.totalCents).toBe(2900)
    })

    it('should store order items with computed subtotal', () => {
      const input = makeInput({
        items: [
          { productId: 'a', quantity: 2, unitPriceCents: 1500, discountCents: 100 },
          { productId: 'b', quantity: 1, unitPriceCents: 3000 },
        ],
      })

      const order = service.create(input, { tenantId: TENANT_A, userId: USER_1 })
      const items = service.getItems(order.id, TENANT_A)

      expect(items).toHaveLength(2)
      expect(items[0].subtotalCents).toBe(3000)  // 2 * 1500
      expect(items[0].discountCents).toBe(100)
      expect(items[1].subtotalCents).toBe(3000)  // 1 * 3000
    })

    // ── 幂等 ──

    it('should be idempotent: same clientOrderId returns same order', () => {
      const input = makeInput()
      const o1 = service.create(input, { tenantId: TENANT_A, userId: USER_1 })
      const o2 = service.create(input, { tenantId: TENANT_A, userId: USER_1 })

      expect(o2.id).toBe(o1.id)
      expect(o2.status).toBe('DRAFT')
    })

    it('should allow same clientOrderId across different tenants', () => {
      const input = makeInput()
      const oa = service.create(input, { tenantId: TENANT_A, userId: USER_1 })
      const ob = service.create(input, { tenantId: TENANT_B, userId: USER_1 })

      expect(oa.id).not.toBe(ob.id)
      expect(oa.tenantId).toBe(TENANT_A)
      expect(ob.tenantId).toBe(TENANT_B)
    })

    // ── 参数校验 ──

    it('should throw if tenantId is missing', () => {
      expect(() => service.create(makeInput(), { tenantId: '', userId: USER_1 }))
        .toThrow(BadRequestException)
    })

    it('should throw if clientOrderId is missing', () => {
      expect(() => service.create(makeInput({ clientOrderId: '' }), { tenantId: TENANT_A, userId: USER_1 }))
        .toThrow(BadRequestException)
    })

    it('should throw if items array is empty', () => {
      expect(() => service.create(makeInput({ items: [] }), { tenantId: TENANT_A, userId: USER_1 }))
        .toThrow(BadRequestException)
    })

    it('should throw if totalCents would be negative', () => {
      const input = makeInput({
        items: [{ productId: 'x', quantity: 1, unitPriceCents: 100 }],
        discountCents: 500,  // discount > subtotal
      })
      expect(() => service.create(input, { tenantId: TENANT_A, userId: USER_1 }))
        .toThrow(BadRequestException)
    })

    // ── memberId ──

    it('should set memberId to null when not provided', () => {
      const order = service.create(makeInput(), { tenantId: TENANT_A, userId: USER_1 })
      expect(order.memberId).toBeNull()
    })

    it('should accept memberId when provided', () => {
      const order = service.create(makeInput({ memberId: 'mem-123' }), { tenantId: TENANT_A, userId: USER_1 })
      expect(order.memberId).toBe('mem-123')
    })

    // ── metadata ──

    it('should store metadata', () => {
      const input = makeInput({ metadata: { table: 'A3', notes: 'no onion' } })
      const order = service.create(input, { tenantId: TENANT_A, userId: USER_1 })
      expect(order.metadata).toEqual({ table: 'A3', notes: 'no onion' })
    })

    // ── SSE event ──

    it('should emit order.created event', () => {
      const spy = vi.spyOn(emitter, 'emit')
      const order = service.create(makeInput(), { tenantId: TENANT_A, userId: USER_1 })

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'order.created',
          tenantId: TENANT_A,
          orderId: order.id,
          amount: order.totalCents,
        })
      )
    })
  })

  // ═════════════════════════════════════════════════════════════
  // 2. 状态流转
  // ═════════════════════════════════════════════════════════════

  describe('state transitions', () => {
    it('should submit DRAFT → PENDING', () => {
      const order = service.create(makeInput(), { tenantId: TENANT_A, userId: USER_1 })
      const submitted = service.submit(order.id, TENANT_A)

      expect(submitted.status).toBe('PENDING')
    })

    it('should pay PENDING → PAID', () => {
      const order = service.create(makeInput(), { tenantId: TENANT_A, userId: USER_1 })
      service.submit(order.id, TENANT_A)
      const paid = service.markPaid(order.id, order.totalCents, 'WECHAT', TENANT_A)

      expect(paid.status).toBe('PAID')
      expect(paid.paidCents).toBe(order.totalCents)
      expect(paid.paymentMethod).toBe('WECHAT')
      expect(paid.paidAt).not.toBeNull()
    })

    it('should fulfill PAID → FULFILLED', () => {
      const order = service.create(makeInput(), { tenantId: TENANT_A, userId: USER_1 })
      service.submit(order.id, TENANT_A)
      service.markPaid(order.id, order.totalCents, 'CASH', TENANT_A)
      const fulfilled = service.fulfill(order.id, TENANT_A)

      expect(fulfilled.status).toBe('FULFILLED')
      expect(fulfilled.closedAt).not.toBeNull()
    })

    it('should cancel DRAFT → CANCELED', () => {
      const order = service.create(makeInput(), { tenantId: TENANT_A, userId: USER_1 })
      const canceled = service.cancel(order.id, TENANT_A, 'customer request')

      expect(canceled.status).toBe('CANCELED')
      expect(canceled.closedAt).not.toBeNull()
      expect(canceled.metadata.cancelReason).toBe('customer request')
    })

    it('should fully refund PAID → REFUNDED', () => {
      const order = service.create(makeInput(), { tenantId: TENANT_A, userId: USER_1 })
      service.submit(order.id, TENANT_A)
      service.markPaid(order.id, order.totalCents, 'ALIPAY', TENANT_A)
      const refunded = service.applyRefund(order.id, order.totalCents, TENANT_A)

      expect(refunded.status).toBe('REFUNDED')
      expect(refunded.refundedCents).toBe(order.totalCents)
      expect(refunded.closedAt).not.toBeNull()
    })

    it('should partially refund → PARTIALLY_REFUNDED', () => {
      const order = service.create(makeInput(), { tenantId: TENANT_A, userId: USER_1 })
      service.submit(order.id, TENANT_A)
      service.markPaid(order.id, order.totalCents, 'CARD', TENANT_A)

      const half = Math.floor(order.totalCents / 2)
      const partial = service.applyRefund(order.id, half, TENANT_A)

      expect(partial.status).toBe('PARTIALLY_REFUNDED')
      expect(partial.refundedCents).toBe(half)
    })

    it('should accumulate refunds and transition to REFUNDED when full', () => {
      const order = service.create(makeInput(), { tenantId: TENANT_A, userId: USER_1 })
      service.submit(order.id, TENANT_A)
      service.markPaid(order.id, order.totalCents, 'CASH', TENANT_A)

      const half = Math.floor(order.totalCents / 2)
      service.applyRefund(order.id, half, TENANT_A)
      const final = service.applyRefund(order.id, order.totalCents - half, TENANT_A)

      expect(final.status).toBe('REFUNDED')
      expect(final.refundedCents).toBe(order.totalCents)
    })

    // ── 非法转移 ──

    it('should throw on DRAFT → PAID (skip PENDING)', () => {
      const order = service.create(makeInput(), { tenantId: TENANT_A, userId: USER_1 })
      expect(() => service.markPaid(order.id, order.totalCents, 'CASH', TENANT_A))
        .toThrow(BadRequestException)
    })

    it('should throw on PENDING → FULFILLED (skip PAID)', () => {
      const order = service.create(makeInput(), { tenantId: TENANT_A, userId: USER_1 })
      service.submit(order.id, TENANT_A)
      expect(() => service.fulfill(order.id, TENANT_A)).toThrow(BadRequestException)
    })

    it('should throw on CANCELED → any', () => {
      const order = service.create(makeInput(), { tenantId: TENANT_A, userId: USER_1 })
      service.cancel(order.id, TENANT_A, 'test')
      expect(() => service.submit(order.id, TENANT_A)).toThrow(BadRequestException)
    })

    // ── markPaid 幂等 ──

    it('should be idempotent on markPaid when already PAID', () => {
      const order = service.create(makeInput(), { tenantId: TENANT_A, userId: USER_1 })
      service.submit(order.id, TENANT_A)
      service.markPaid(order.id, order.totalCents, 'WECHAT', TENANT_A)

      // 第二次 markPaid (不同通道) 应幂等
      const retry = service.markPaid(order.id, order.totalCents, 'ALIPAY', TENANT_A)
      expect(retry.status).toBe('PAID')
      expect(retry.paymentMethod).toBe('WECHAT') // 保持第一次
    })

    it('should be idempotent on markPaid when FULFILLED', () => {
      const order = service.create(makeInput(), { tenantId: TENANT_A, userId: USER_1 })
      service.submit(order.id, TENANT_A)
      service.markPaid(order.id, order.totalCents, 'CASH', TENANT_A)
      service.fulfill(order.id, TENANT_A)

      const retry = service.markPaid(order.id, 999, 'ALIPAY', TENANT_A)
      expect(retry.status).toBe('FULFILLED')
    })
  })

  // ═════════════════════════════════════════════════════════════
  // 3. SSE 事件
  // ═════════════════════════════════════════════════════════════

  describe('SSE events', () => {
    it('should emit order.submitted on submit', () => {
      const spy = vi.spyOn(emitter, 'emit')
      const order = service.create(makeInput(), { tenantId: TENANT_A, userId: USER_1 })
      service.submit(order.id, TENANT_A)

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'order.submitted', orderId: order.id })
      )
    })

    it('should emit order.paid on markPaid', () => {
      const spy = vi.spyOn(emitter, 'emit')
      const order = service.create(makeInput(), { tenantId: TENANT_A, userId: USER_1 })
      service.submit(order.id, TENANT_A)
      service.markPaid(order.id, order.totalCents, 'WECHAT', TENANT_A)

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'order.paid', orderId: order.id })
      )
    })

    it('should emit order.fulfilled on fulfill', () => {
      const spy = vi.spyOn(emitter, 'emit')
      const order = service.create(makeInput(), { tenantId: TENANT_A, userId: USER_1 })
      service.submit(order.id, TENANT_A)
      service.markPaid(order.id, order.totalCents, 'CASH', TENANT_A)
      service.fulfill(order.id, TENANT_A)

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'order.fulfilled', orderId: order.id })
      )
    })

    it('should emit order.canceled on cancel', () => {
      const spy = vi.spyOn(emitter, 'emit')
      const order = service.create(makeInput(), { tenantId: TENANT_A, userId: USER_1 })
      service.cancel(order.id, TENANT_A, 'test reason')

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'order.canceled', orderId: order.id, reason: 'test reason' })
      )
    })

    it('should emit order.refunded on full refund', () => {
      const spy = vi.spyOn(emitter, 'emit')
      const order = service.create(makeInput(), { tenantId: TENANT_A, userId: USER_1 })
      service.submit(order.id, TENANT_A)
      service.markPaid(order.id, order.totalCents, 'CASH', TENANT_A)
      service.applyRefund(order.id, order.totalCents, TENANT_A)

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'order.refunded', orderId: order.id })
      )
    })

    it('should emit order.partially_refunded on partial refund', () => {
      const spy = vi.spyOn(emitter, 'emit')
      const order = service.create(makeInput(), { tenantId: TENANT_A, userId: USER_1 })
      service.submit(order.id, TENANT_A)
      service.markPaid(order.id, order.totalCents, 'CASH', TENANT_A)
      service.applyRefund(order.id, Math.floor(order.totalCents / 2), TENANT_A)

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'order.partially_refunded', orderId: order.id })
      )
    })

    it('should not throw when emitter is not provided', () => {
      const svc = new OrderService() // no emitter
      expect(() => svc.create(makeInput(), { tenantId: TENANT_A, userId: USER_1 })).not.toThrow()
    })
  })

  // ═════════════════════════════════════════════════════════════
  // 4. 乐观锁
  // ═════════════════════════════════════════════════════════════

  describe('optimistic locking (version)', () => {
    it('should update when version matches', () => {
      const order = service.create(makeInput(), { tenantId: TENANT_A, userId: USER_1 })
      const updated = service.updateWithVersion(order.id, TENANT_A, 1, {
        metadata: { table: 'B5' },
      })
      expect(updated.version).toBe(2)
      expect(updated.metadata).toEqual({ table: 'B5' })
    })

    it('should throw BadRequestException on version conflict', () => {
      const order = service.create(makeInput(), { tenantId: TENANT_A, userId: USER_1 })
      expect(() =>
        service.updateWithVersion(order.id, TENANT_A, 2, { metadata: {} })
      ).toThrow(BadRequestException)
    })

    it('should include current/provided versions in error', () => {
      const order = service.create(makeInput(), { tenantId: TENANT_A, userId: USER_1 })
      try {
        service.updateWithVersion(order.id, TENANT_A, 99, {})
        expect.fail('should have thrown')
      } catch (err: any) {
        expect(err.response.error).toBe('order_version_conflict')
        expect(err.response.current).toBe(1)
        expect(err.response.provided).toBe(99)
      }
    })
  })

  // ═════════════════════════════════════════════════════════════
  // 5. 租户隔离
  // ═════════════════════════════════════════════════════════════

  describe('tenant isolation', () => {
    it('should return null when querying order from different tenant', () => {
      const order = service.create(makeInput(), { tenantId: TENANT_A, userId: USER_1 })
      const result = service.getById(order.id, TENANT_B)
      expect(result).toBeNull()
    })

    it('should return empty items for cross-tenant query', () => {
      const input = makeInput({
        items: [{ productId: 'p1', quantity: 1, unitPriceCents: 1000 }],
      })
      const order = service.create(input, { tenantId: TENANT_A, userId: USER_1 })
      const items = service.getItems(order.id, TENANT_B)
      expect(items).toEqual([])
    })

    it('should throw on submit from wrong tenant', () => {
      const order = service.create(makeInput(), { tenantId: TENANT_A, userId: USER_1 })
      expect(() => service.submit(order.id, TENANT_B)).toThrow(BadRequestException)
    })

    it('should throw on cancel from wrong tenant', () => {
      const order = service.create(makeInput(), { tenantId: TENANT_A, userId: USER_1 })
      expect(() => service.cancel(order.id, TENANT_B, 'x')).toThrow(BadRequestException)
    })

    it('should throw on markPaid from wrong tenant', () => {
      const order = service.create(makeInput(), { tenantId: TENANT_A, userId: USER_1 })
      expect(() => service.markPaid(order.id, order.totalCents, 'CASH', TENANT_B))
        .toThrow(BadRequestException)
    })

    it('should throw on fulfill from wrong tenant', () => {
      const order = service.create(makeInput(), { tenantId: TENANT_A, userId: USER_1 })
      expect(() => service.fulfill(order.id, TENANT_B)).toThrow(BadRequestException)
    })

    it('should throw NotFoundException for nonexistent order', () => {
      expect(() => service.submit('ORD-99999999-00001', TENANT_A)).toThrow(NotFoundException)
    })
  })

  // ═════════════════════════════════════════════════════════════
  // 6. 列表查询 & 分页
  // ═════════════════════════════════════════════════════════════

  describe('list (query + pagination)', () => {
    it('should return all orders for a tenant', () => {
      service.create(makeInput(), { tenantId: TENANT_A, userId: USER_1 })
      service.create(makeInput(), { tenantId: TENANT_A, userId: USER_1 })
      service.create(makeInput(), { tenantId: TENANT_B, userId: USER_1 })

      const result = service.list({}, TENANT_A)
      expect(result.total).toBe(2)
      expect(result.items).toHaveLength(2)
    })

    it('should filter by status', () => {
      const o1 = service.create(makeInput(), { tenantId: TENANT_A, userId: USER_1 })
      service.create(makeInput(), { tenantId: TENANT_A, userId: USER_1 })
      service.cancel(o1.id, TENANT_A, 'test')

      const result = service.list({ status: 'CANCELED' }, TENANT_A)
      expect(result.total).toBe(1)
      expect(result.items[0].status).toBe('CANCELED')
    })

    it('should filter by memberId', () => {
      service.create(makeInput({ memberId: 'mem-a' }), { tenantId: TENANT_A, userId: USER_1 })
      service.create(makeInput({ memberId: 'mem-b' }), { tenantId: TENANT_A, userId: USER_1 })
      service.create(makeInput(), { tenantId: TENANT_A, userId: USER_1 }) // null member

      const result = service.list({ memberId: 'mem-a' }, TENANT_A)
      expect(result.total).toBe(1)
      expect(result.items[0].memberId).toBe('mem-a')
    })

    it('should paginate correctly', () => {
      for (let i = 0; i < 25; i++) {
        service.create(makeInput(), { tenantId: TENANT_A, userId: USER_1 })
      }

      const page1 = service.list({ page: 1, pageSize: 10 }, TENANT_A)
      expect(page1.items).toHaveLength(10)
      expect(page1.total).toBe(25)

      const page2 = service.list({ page: 2, pageSize: 10 }, TENANT_A)
      expect(page2.items).toHaveLength(10)

      const page3 = service.list({ page: 3, pageSize: 10 }, TENANT_A)
      expect(page3.items).toHaveLength(5)
    })

    it('should sort by createdAt descending (newest first)', () => {
      const tenant = 'tenant-sort-test'
      const o1 = service.create(makeInput(), { tenantId: tenant, userId: USER_1 })
      const o2 = service.create(makeInput(), { tenantId: tenant, userId: USER_1 })

      const result = service.list({}, tenant)
      expect(result.items).toHaveLength(2)
      // descending: o2 (newer) ≥ o1 (older) by createdAt
      expect(result.items[0].createdAt >= result.items[1].createdAt).toBe(true)
    })

    it('should return empty for tenant with no orders', () => {
      const result = service.list({}, 'empty-tenant')
      expect(result.total).toBe(0)
      expect(result.items).toEqual([])
    })

    it('should filter by date range', () => {
      const o1 = service.create(makeInput(), { tenantId: TENANT_A, userId: USER_1 })
      const o2 = service.create(makeInput(), { tenantId: TENANT_A, userId: USER_1 })

      const yesterday = new Date(Date.now() - 86400000).toISOString()
      const tomorrow = new Date(Date.now() + 86400000).toISOString()

      const result = service.list({ fromDate: yesterday, toDate: tomorrow }, TENANT_A)
      expect(result.total).toBe(2)
    })
  })

  // ═════════════════════════════════════════════════════════════
  // 7. 错误/边界
  // ═════════════════════════════════════════════════════════════

  describe('error handling & edge cases', () => {
    it('should throw on DRAFT → FULFILLED (skip PENDING+PAID)', () => {
      const order = service.create(makeInput(), { tenantId: TENANT_A, userId: USER_1 })
      expect(() => service.fulfill(order.id, TENANT_A)).toThrow(BadRequestException)
    })

    it('should throw on DRAFT → REFUNDED (skip all)', () => {
      const order = service.create(makeInput(), { tenantId: TENANT_A, userId: USER_1 })
      expect(() => service.applyRefund(order.id, 100, TENANT_A)).toThrow(BadRequestException)
    })

    it('should throw on nonexistent order for cancel', () => {
      expect(() => service.cancel('ORD-fake-99999', TENANT_A, 'test'))
        .toThrow(NotFoundException)
    })

    it('should throw on nonexistent order for fulfill', () => {
      expect(() => service.fulfill('ORD-fake-99999', TENANT_A)).toThrow(NotFoundException)
    })

    it('should throw on nonexistent order for markPaid', () => {
      expect(() => service.markPaid('ORD-fake-99999', 5000, 'CASH', TENANT_A))
        .toThrow(NotFoundException)
    })

    it('should throw on DRAFT → submit for nonexistent', () => {
      expect(() => service.submit('ORD-fake-99999', TENANT_A)).toThrow(NotFoundException)
    })

    it('should keep correct schedule: FULFILLED → cannot cancel', () => {
      const order = service.create(makeInput(), { tenantId: TENANT_A, userId: USER_1 })
      service.submit(order.id, TENANT_A)
      service.markPaid(order.id, order.totalCents, 'CASH', TENANT_A)
      service.fulfill(order.id, TENANT_A)
      expect(() => service.cancel(order.id, TENANT_A, 'late')).toThrow(BadRequestException)
    })

    it('should handle zero-quantity items gracefully via totalCents', () => {
      const input = makeInput({
        items: [{ productId: 'x', quantity: 0, unitPriceCents: 500 }],
      })
      const order = service.create(input, { tenantId: TENANT_A, userId: USER_1 })
      // subtotal = 0 * 500 = 0, total = 0
      expect(order.totalCents).toBe(0)
      expect(order.subtotalCents).toBe(0)
    })

    it('should throw when DRAFT order is submitted from another tenant', () => {
      const order = service.create(makeInput(), { tenantId: TENANT_A, userId: USER_1 })
      expect(() => service.submit(order.id, TENANT_B)).toThrow(BadRequestException)
    })

    it('should throw when PENDING order is canceled from another tenant', () => {
      const order = service.create(makeInput(), { tenantId: TENANT_A, userId: USER_1 })
      service.submit(order.id, TENANT_A)
      expect(() => service.cancel(order.id, TENANT_B, 'bad actor'))
        .toThrow(BadRequestException)
    })

    it('should return empty items when order not found', () => {
      const items = service.getItems('ORD-fake-99999', TENANT_A)
      expect(items).toEqual([])
    })

    it('should throw on refund without being paid first', () => {
      const order = service.create(makeInput(), { tenantId: TENANT_A, userId: USER_1 })
      service.submit(order.id, TENANT_A)
      // not paid yet — FULFILLED is also blocked, and REFUNDED is not in PENDING's allowed transitions
      expect(() => service.applyRefund(order.id, 100, TENANT_A)).toThrow(BadRequestException)
    })

    it('should keep _clear and _size helpers working', () => {
      service.create(makeInput(), { tenantId: TENANT_A, userId: USER_1 })
      service.create(makeInput(), { tenantId: TENANT_A, userId: USER_1 })
      expect(service._size()).toBe(2)
      service._clear()
      expect(service._size()).toBe(0)
    })

    it('should expose idempotency via repeated creates with same clientOrderId different users', () => {
      const input = makeInput()
      const o1 = service.create(input, { tenantId: TENANT_A, userId: 'user-a' })
      const o2 = service.create(input, { tenantId: TENANT_A, userId: 'user-b' })
      expect(o2.id).toBe(o1.id)
      // createdBy stays from first creation
      expect(o2.createdBy).toBe('user-a')
    })

    it('should have discountCents default to 0 in order items', () => {
      const input = makeInput({
        items: [{ productId: 'x', quantity: 1, unitPriceCents: 1000 }],
      })
      const order = service.create(input, { tenantId: TENANT_A, userId: USER_1 })
      const items = service.getItems(order.id, TENANT_A)
      expect(items[0].discountCents).toBe(0)
    })

    it('should include taxCents defaulted to 0 when not provided', () => {
      const input = makeInput({ items: [{ productId: 'taxed', quantity: 1, unitPriceCents: 1000 }] })
      const order = service.create(input, { tenantId: TENANT_A, userId: USER_1 })
      expect(order.taxCents).toBe(0)
      expect(order.totalCents).toBe(1000)
    })

    it('should apply discount on totalCents correctly', () => {
      const input = makeInput({
        items: [{ productId: 'd1', quantity: 2, unitPriceCents: 1500 }],
        discountCents: 1500,
        taxCents: 300,
      })
      // subtotal = 3000, total = 3000 - 1500 + 300 = 1800
      const order = service.create(input, { tenantId: TENANT_A, userId: USER_1 })
      expect(order.totalCents).toBe(1800)
    })

    it('should generate unique order IDs sequentially', () => {
      const o1 = service.create(makeInput(), { tenantId: TENANT_A, userId: USER_1 })
      const o2 = service.create(makeInput(), { tenantId: TENANT_A, userId: USER_1 })
      expect(o1.id).not.toBe(o2.id)
      expect(o1.id).toMatch(/^ORD-\d{8}-\d{5}$/)
    })
  })

  // ═════════════════════════════════════════════════════════════
  // 8. 完整生命周期
  // ═════════════════════════════════════════════════════════════

  describe('full lifecycle (happy path)', () => {
    it('should complete DRAFT→PENDING→PAID→FULFILLED→REFUNDED', () => {
      const input = makeInput({
        items: [
          { productId: 'coffee', quantity: 2, unitPriceCents: 2500 },
        ],
        memberId: 'member-42',
        metadata: { table: 'A1' },
      })

      // 1. Create
      const order = service.create(input, { tenantId: TENANT_A, userId: USER_1 })
      expect(order.status).toBe('DRAFT')
      expect(order.totalCents).toBe(5000)

      // 2. Submit
      const submitted = service.submit(order.id, TENANT_A)
      expect(submitted.status).toBe('PENDING')

      // 3. Pay
      const paid = service.markPaid(order.id, order.totalCents, 'WECHAT', TENANT_A)
      expect(paid.status).toBe('PAID')
      expect(paid.paymentMethod).toBe('WECHAT')

      // 4. Fulfill
      const fulfilled = service.fulfill(order.id, TENANT_A)
      expect(fulfilled.status).toBe('FULFILLED')

      // 5. Refund
      const refunded = service.applyRefund(order.id, order.totalCents, TENANT_A)
      expect(refunded.status).toBe('REFUNDED')
      expect(refunded.refundedCents).toBe(5000)
    })
  })
})
