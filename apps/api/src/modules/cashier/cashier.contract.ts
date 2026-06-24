import type {
  CashierOrder,
  CashierPayment,
  CashierOrderItem,
  CashierOrderStatus,
  CashierPaymentStatus,
  CashierOrderCloseReason,
} from './cashier.entity'

/**
 * Contract types for cashier module cross-boundary communication.
 * These are the stable surface that other modules consume.
 */

/** External contract for cashier order (cross-module safe subset) */
export interface CashierOrderContract {
  orderId: string
  tenantId: string
  memberId: string
  items: CashierOrderItemContract[]
  currency: string
  totalAmount: number
  couponCode?: string
  blindboxPlanId?: string
  blindboxQuantity?: number
  status: CashierOrderStatus
  latestPaymentId?: string
  createdAt: string
  updatedAt: string
  paidAt?: string
  closedAt?: string
  closeReason?: CashierOrderCloseReason
  closedBy?: string
  closeNote?: string
  source: string
}

/** External contract for cashier order item */
export interface CashierOrderItemContract {
  skuId: string
  title?: string
  quantity: number
  price: number
}

/** External contract for cashier payment */
export interface CashierPaymentContract {
  paymentId: string
  orderId: string
  externalPaymentId?: string
  channel: string
  amount: number
  status: CashierPaymentStatus
  transactionNo?: string
  sourceEventName?: string
  failureReason?: string
  createdAt: string
  updatedAt: string
  completedAt?: string
}

/** Convert internal CashierOrder to cross-module contract */
export function toCashierOrderContract(order: CashierOrder): CashierOrderContract {
  return {
    orderId: order.orderId,
    tenantId: order.tenantContext.tenantId,
    memberId: order.memberId,
    items: order.items.map(toCashierOrderItemContract),
    currency: order.currency,
    totalAmount: order.totalAmount,
    couponCode: order.couponCode,
    blindboxPlanId: order.blindboxPlanId,
    blindboxQuantity: order.blindboxQuantity,
    status: order.status,
    latestPaymentId: order.latestPaymentId,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    paidAt: order.paidAt,
    closedAt: order.closedAt,
    closeReason: order.closeReason,
    closedBy: order.closedBy,
    closeNote: order.closeNote,
    source: order.source,
  }
}

/** Convert internal CashierOrderItem to cross-module contract */
export function toCashierOrderItemContract(item: CashierOrderItem): CashierOrderItemContract {
  return {
    skuId: item.skuId,
    title: item.title,
    quantity: item.quantity,
    price: item.price,
  }
}

/** Convert internal CashierPayment to cross-module contract */
export function toCashierPaymentContract(payment: CashierPayment): CashierPaymentContract {
  return {
    paymentId: payment.paymentId,
    orderId: payment.orderId,
    externalPaymentId: payment.externalPaymentId,
    channel: payment.channel,
    amount: payment.amount,
    status: payment.status,
    transactionNo: payment.transactionNo,
    sourceEventName: payment.sourceEventName,
    failureReason: payment.failureReason,
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt,
    completedAt: payment.completedAt,
  }
}
