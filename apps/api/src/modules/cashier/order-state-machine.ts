import { BadRequestException } from '@nestjs/common'
import type {
  OrderStatus,
  PaymentStatus,
  RefundStatus
} from '@m5/types'

/**
 * Phase-35 T159: 订单/支付/退款状态机
 *
 * DR-36 决策 1: 显式状态转移表 + 非法转移抛 400
 * 优点: 集中管理, 易扩展, 编译期类型检查
 */

/** 订单状态转移表 (允许的 from → to) */
export const ORDER_TRANSITIONS: Readonly<Record<OrderStatus, ReadonlyArray<OrderStatus>>> = {
  DRAFT: ['PENDING', 'CANCELED'],
  PENDING: ['PAID', 'CANCELED', 'TIMEOUT'],
  PAID: ['FULFILLED', 'PARTIALLY_REFUNDED', 'REFUNDED'],
  FULFILLED: ['PARTIALLY_REFUNDED', 'REFUNDED'],
  PARTIALLY_REFUNDED: ['PARTIALLY_REFUNDED', 'REFUNDED'],
  REFUNDED: [],        // 终态
  CANCELED: [],        // 终态
  TIMEOUT: []          // 终态
}

/** 支付状态转移表 */
export const PAYMENT_TRANSITIONS: Readonly<Record<PaymentStatus, ReadonlyArray<PaymentStatus>>> = {
  PENDING: ['SUCCESS', 'FAILED'],
  SUCCESS: ['REFUNDED'],   // 全部退完后变成 REFUNDED
  FAILED: [],              // 终态
  REFUNDED: []             // 终态
}

/** 退款状态转移表 */
export const REFUND_TRANSITIONS: Readonly<Record<RefundStatus, ReadonlyArray<RefundStatus>>> = {
  PENDING: ['SUCCESS', 'FAILED'],
  SUCCESS: [],  // 终态
  FAILED: []    // 终态
}

/** 终态集合 */
const ORDER_TERMINAL_STATES = new Set<OrderStatus>(['REFUNDED', 'CANCELED', 'TIMEOUT'])
const PAYMENT_TERMINAL_STATES = new Set<PaymentStatus>(['FAILED', 'REFUNDED'])
const REFUND_TERMINAL_STATES = new Set<RefundStatus>(['SUCCESS', 'FAILED'])

/**
 * 校验并执行状态转移
 * @throws BadRequestException 非法转移时抛出 400
 */
export function transitionOrder(
  current: OrderStatus,
  target: OrderStatus
): void {
  const allowed = ORDER_TRANSITIONS[current]
  if (!allowed.includes(target)) {
    throw new BadRequestException({
      error: 'invalid_order_state_transition',
      from: current,
      to: target,
      allowed: allowed,
      message: `Order cannot transition from ${current} to ${target}`
    })
  }
}

export function transitionPayment(
  current: PaymentStatus,
  target: PaymentStatus
): void {
  const allowed = PAYMENT_TRANSITIONS[current]
  if (!allowed.includes(target)) {
    throw new BadRequestException({
      error: 'invalid_payment_state_transition',
      from: current,
      to: target,
      allowed: allowed,
      message: `Payment cannot transition from ${current} to ${target}`
    })
  }
}

export function transitionRefund(
  current: RefundStatus,
  target: RefundStatus
): void {
  const allowed = REFUND_TRANSITIONS[current]
  if (!allowed.includes(target)) {
    throw new BadRequestException({
      error: 'invalid_refund_state_transition',
      from: current,
      to: target,
      allowed: allowed,
      message: `Refund cannot transition from ${current} to ${target}`
    })
  }
}

/** 判断是否为终态 */
export function isOrderTerminal(status: OrderStatus): boolean {
  return ORDER_TERMINAL_STATES.has(status)
}

export function isPaymentTerminal(status: PaymentStatus): boolean {
  return PAYMENT_TERMINAL_STATES.has(status)
}

export function isRefundTerminal(status: RefundStatus): boolean {
  return REFUND_TERMINAL_STATES.has(status)
}

/**
 * 退款后根据累计退款金额决定 Order 状态
 * @param totalRefunded 累计已退金额 (含本次)
 * @param totalPaid Order 已付金额
 * @returns 新的 Order 状态 (REFUNDED / PARTIALLY_REFUNDED)
 */
export function decideOrderStatusAfterRefund(
  totalRefunded: number,
  totalPaid: number
): 'REFUNDED' | 'PARTIALLY_REFUNDED' {
  if (totalRefunded >= totalPaid) return 'REFUNDED'
  return 'PARTIALLY_REFUNDED'
}
