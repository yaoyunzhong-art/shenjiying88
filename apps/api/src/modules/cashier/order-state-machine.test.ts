import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import assert from 'node:assert/strict'
import {
  ORDER_TRANSITIONS,
  PAYMENT_TRANSITIONS,
  REFUND_TRANSITIONS,
  transitionOrder,
  transitionPayment,
  transitionRefund,
  isOrderTerminal,
  isPaymentTerminal,
  isRefundTerminal,
  decideOrderStatusAfterRefund
} from './order-state-machine'
import type {
  OrderStatus,
  PaymentStatus,
  RefundStatus
} from '@m5/types'
/**
 * Phase-35 T159: 状态机 8 态全覆盖测试
 *
 * DR-36 决策 1: 显式状态转移表 + 非法抛 400
 * 防御: 状态转移表锁死,绝不允许绕过
 */
describe('order-state-machine', () => {
  describe('OrderStatus 8 态', () => {
    it('DRAFT 只能转移到 PENDING 或 CANCELED', () => {
      assert.deepEqual(ORDER_TRANSITIONS.DRAFT, ['PENDING', 'CANCELED'])
    })
    it('PENDING 只能转移到 PAID / CANCELED / TIMEOUT', () => {
      assert.deepEqual(ORDER_TRANSITIONS.PENDING, ['PAID', 'CANCELED', 'TIMEOUT'])
    })
    it('PAID 只能转移到 FULFILLED / PARTIALLY_REFUNDED / REFUNDED', () => {
      assert.deepEqual(ORDER_TRANSITIONS.PAID, ['FULFILLED', 'PARTIALLY_REFUNDED', 'REFUNDED'])
    })
    it('FULFILLED 只能转移到 PARTIALLY_REFUNDED / REFUNDED', () => {
      assert.deepEqual(ORDER_TRANSITIONS.FULFILLED, ['PARTIALLY_REFUNDED', 'REFUNDED'])
    })
    it('PARTIALLY_REFUNDED 还能继续退款', () => {
      assert.deepEqual(ORDER_TRANSITIONS.PARTIALLY_REFUNDED, ['PARTIALLY_REFUNDED', 'REFUNDED'])
    })
    it('REFUNDED 是终态 (空数组)', () => {
      assert.deepEqual(ORDER_TRANSITIONS.REFUNDED, [])
      assert.ok(isOrderTerminal('REFUNDED'))
    })
    it('CANCELED 是终态 (空数组)', () => {
      assert.deepEqual(ORDER_TRANSITIONS.CANCELED, [])
      assert.ok(isOrderTerminal('CANCELED'))
    })
    it('TIMEOUT 是终态 (空数组)', () => {
      assert.deepEqual(ORDER_TRANSITIONS.TIMEOUT, [])
      assert.ok(isOrderTerminal('TIMEOUT'))
    })
    it('DRAFT / PENDING / PAID / FULFILLED / PARTIALLY_REFUNDED 不是终态', () => {
      const nonTerminal: OrderStatus[] = ['DRAFT', 'PENDING', 'PAID', 'FULFILLED', 'PARTIALLY_REFUNDED']
      for (const status of nonTerminal) {
        assert.ok(!isOrderTerminal(status), `${status} 不应该是终态`)
      }
    })
  })
  describe('transitionOrder 非法转移抛 400', () => {
    it('DRAFT → PAID 非法 (必须先到 PENDING)', () => {
      assert.throws(
        () => transitionOrder('DRAFT', 'PAID'),
        (err: any) => {
          assert.equal(err.response.error, 'invalid_order_state_transition')
          assert.equal(err.response.from, 'DRAFT')
          assert.equal(err.response.to, 'PAID')
          return true
        }
      )
    })
    it('PENDING → FULFILLED 非法 (必须先 PAID)', () => {
      assert.throws(
        () => transitionOrder('PENDING', 'FULFILLED'),
        (err: any) => err.response.error === 'invalid_order_state_transition'
      )
    })
    it('REFUNDED → PAID 非法 (终态不能转移)', () => {
      assert.throws(
        () => transitionOrder('REFUNDED', 'PAID'),
        (err: any) => err.response.error === 'invalid_order_state_transition'
      )
    })
    it('CANCELED → PENDING 非法', () => {
      assert.throws(() => transitionOrder('CANCELED', 'PENDING'))
    })
    it('TIMEOUT → PAID 非法', () => {
      assert.throws(() => transitionOrder('TIMEOUT', 'PAID'))
    })
    it('合法转移不抛 (DRAFT → PENDING)', () => {
      assert.doesNotThrow(() => transitionOrder('DRAFT', 'PENDING'))
    })
    it('合法转移不抛 (PENDING → PAID)', () => {
      assert.doesNotThrow(() => transitionOrder('PENDING', 'PAID'))
    })
    it('合法转移不抛 (PAID → FULFILLED)', () => {
      assert.doesNotThrow(() => transitionOrder('PAID', 'FULFILLED'))
    })
    it('合法转移不抛 (PAID → REFUNDED)', () => {
      assert.doesNotThrow(() => transitionOrder('PAID', 'REFUNDED'))
    })
    it('合法转移不抛 (FULFILLED → PARTIALLY_REFUNDED)', () => {
      assert.doesNotThrow(() => transitionOrder('FULFILLED', 'PARTIALLY_REFUNDED'))
    })
    it('合法转移不抛 (PARTIALLY_REFUNDED → REFUNDED)', () => {
      assert.doesNotThrow(() => transitionOrder('PARTIALLY_REFUNDED', 'REFUNDED'))
    })
  })
  describe('PaymentStatus 状态机', () => {
    it('PENDING → SUCCESS / FAILED', () => {
      assert.deepEqual(PAYMENT_TRANSITIONS.PENDING, ['SUCCESS', 'FAILED'])
    })
    it('SUCCESS → REFUNDED (全部退完)', () => {
      assert.deepEqual(PAYMENT_TRANSITIONS.SUCCESS, ['REFUNDED'])
    })
    it('FAILED 是终态', () => {
      assert.deepEqual(PAYMENT_TRANSITIONS.FAILED, [])
      assert.ok(isPaymentTerminal('FAILED'))
    })
    it('REFUNDED 是终态', () => {
      assert.deepEqual(PAYMENT_TRANSITIONS.REFUNDED, [])
      assert.ok(isPaymentTerminal('REFUNDED'))
    })
    it('非法转移抛 400', () => {
      assert.throws(() => transitionPayment('PENDING', 'REFUNDED'))
    })
    it('合法转移不抛', () => {
      assert.doesNotThrow(() => transitionPayment('PENDING', 'SUCCESS'))
      assert.doesNotThrow(() => transitionPayment('SUCCESS', 'REFUNDED'))
    })
  })
  describe('RefundStatus 状态机', () => {
    it('PENDING → SUCCESS / FAILED', () => {
      assert.deepEqual(REFUND_TRANSITIONS.PENDING, ['SUCCESS', 'FAILED'])
    })
    it('SUCCESS 是终态', () => {
      assert.deepEqual(REFUND_TRANSITIONS.SUCCESS, [])
      assert.ok(isRefundTerminal('SUCCESS'))
    })
    it('FAILED 是终态', () => {
      assert.deepEqual(REFUND_TRANSITIONS.FAILED, [])
      assert.ok(isRefundTerminal('FAILED'))
    })
    it('非法转移抛 400', () => {
      assert.throws(() => transitionRefund('SUCCESS', 'PENDING'))
    })
    it('合法转移不抛', () => {
      assert.doesNotThrow(() => transitionRefund('PENDING', 'SUCCESS'))
      assert.doesNotThrow(() => transitionRefund('PENDING', 'FAILED'))
    })
  })
  describe('decideOrderStatusAfterRefund 决策函数', () => {
    it('累计退款 = 总金额 → REFUNDED', () => {
      assert.equal(decideOrderStatusAfterRefund(10000, 10000), 'REFUNDED')
    })
    it('累计退款 > 总金额 → REFUNDED (异常边界)', () => {
      assert.equal(decideOrderStatusAfterRefund(11000, 10000), 'REFUNDED')
    })
    it('累计退款 < 总金额 → PARTIALLY_REFUNDED', () => {
      assert.equal(decideOrderStatusAfterRefund(5000, 10000), 'PARTIALLY_REFUNDED')
    })
    it('累计退款 = 0 → PARTIALLY_REFUNDED (边界值)', () => {
      assert.equal(decideOrderStatusAfterRefund(0, 10000), 'PARTIALLY_REFUNDED')
    })
  })
})