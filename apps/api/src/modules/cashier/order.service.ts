import { Injectable, BadRequestException, NotFoundException, Logger, Optional } from '@nestjs/common'
import type {
  Order,
  OrderItem,
  CreateOrderInput,
  OrderStatus
} from '@m5/types'
import {
  transitionOrder
} from './order-state-machine'
import { CashierEventEmitter } from './cashier.events'

/**
 * Phase-35 T160: OrderService - 订单服务
 *
 * DR-36:
 *  - 决策 1: 状态机 transfer (非法抛 400)
 *  - 决策 3: 编辑用乐观锁 (version 字段)
 *  - 决策 4: 整数分, 绝不用浮点
 *  - 决策 7: 订单号 ORD-YYYYMMDD-XXXXX
 *
 * In-memory 实现 (与 EventStore 一致), 真实 Postgres 可后续替换
 * 集成 ViewModelService 走统一 tenantId 入口
 */

let orderSeq = 0
let orderItemSeq = 0
function nextOrderId(): string {
  orderSeq = (orderSeq + 1) % 100000
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  return `ORD-${date}-${orderSeq.toString().padStart(5, '0')}`
}
function nextOrderItemId(): string {
  orderItemSeq = (orderItemSeq + 1) % 100000
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  return `OIT-${date}-${orderItemSeq.toString().padStart(5, '0')}`
}

export interface CreateOrderOptions {
  tenantId: string
  userId: string
}

export interface ListOrderFilter {
  status?: OrderStatus
  memberId?: string
  fromDate?: string
  toDate?: string
  page?: number
  pageSize?: number
}

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name)
  /** id → Order */
  private orders = new Map<string, Order>()
  /** id → OrderItem[] */
  private orderItems = new Map<string, OrderItem[]>()
  /** (tenantId, clientOrderId) → orderId (幂等) */
  private idempotencyIndex = new Map<string, string>()

  /**
   * Phase-35 T164: SSE 事件总线 (Optional - 测试可空)
   */
  constructor(
    @Optional() private readonly eventEmitter?: CashierEventEmitter
  ) {
    // 防御: emitter 缺失时不抛错 (向后兼容 + 测试 mock 友好)
    if (!eventEmitter) {
      this.logger.warn('CashierEventEmitter not provided, SSE events disabled')
    }
  }

  /**
   * 创建订单 (草稿)
   * DR-36 决策 2: clientOrderId 幂等
   */
  create(input: CreateOrderInput, opts: CreateOrderOptions): Order {
    if (!opts.tenantId) throw new BadRequestException('tenantId required')
    if (!input.clientOrderId) throw new BadRequestException('clientOrderId required')
    if (!input.items || input.items.length === 0) {
      throw new BadRequestException('items required')
    }

    // 幂等: 同一 (tenant, clientOrderId) 返回同一 order
    const idemKey = `${opts.tenantId}:${input.clientOrderId}`
    const existingId = this.idempotencyIndex.get(idemKey)
    if (existingId) {
      const existing = this.orders.get(existingId)
      if (existing) return existing
    }

    const now = new Date().toISOString()
    const orderId = nextOrderId()

    // 计算金额
    let subtotalCents = 0
    const items: OrderItem[] = input.items.map((it) => {
      const itemSubtotal = it.unitPriceCents * it.quantity
      subtotalCents += itemSubtotal
      return {
        id: nextOrderItemId(),
        orderId,
        tenantId: opts.tenantId,
        productId: it.productId,
        productName: `(商品 ${it.productId})`,  // 真实环境应 JOIN
        unitPriceCents: it.unitPriceCents,
        quantity: it.quantity,
        subtotalCents: itemSubtotal,
        discountCents: it.discountCents ?? 0,
        createdAt: now
      }
    })

    const discountCents = input.discountCents ?? 0
    const taxCents = input.taxCents ?? 0
    const totalCents = subtotalCents - discountCents + taxCents

    if (totalCents < 0) {
      throw new BadRequestException('total_cents cannot be negative')
    }

    const order: Order = {
      id: orderId,
      tenantId: opts.tenantId,
      memberId: input.memberId ?? null,
      status: 'DRAFT',
      subtotalCents,
      discountCents,
      taxCents,
      totalCents,
      paidCents: 0,
      refundedCents: 0,
      paymentMethod: null,
      createdBy: opts.userId,
      clientOrderId: input.clientOrderId,
      version: 1,
      metadata: input.metadata ?? {},
      createdAt: now,
      updatedAt: now,
      paidAt: null,
      closedAt: null
    }

    this.orders.set(orderId, order)
    this.orderItems.set(orderId, items)
    this.idempotencyIndex.set(idemKey, orderId)
    this.logger.log(`Created order ${orderId} tenant=${opts.tenantId} total=${totalCents}c`)

    // Phase-35 T164: SSE event
    this.eventEmitter?.emit({
      type: 'order.created',
      tenantId: order.tenantId,
      orderId: order.id,
      amount: order.totalCents,
      createdAt: order.createdAt
    })

    return order
  }

  /**
   * 提交订单 DRAFT → PENDING
   */
  submit(id: string, tenantId: string): Order {
    const order = this.getByIdInternal(id, tenantId)
    transitionOrder(order.status, 'PENDING')
    order.status = 'PENDING'
    order.updatedAt = new Date().toISOString()

    // Phase-35 T164: SSE event
    this.eventEmitter?.emit({
      type: 'order.submitted',
      tenantId: order.tenantId,
      orderId: order.id,
      submittedAt: order.updatedAt
    })

    return order
  }

  /**
   * 取消订单
   */
  cancel(id: string, tenantId: string, reason: string): Order {
    const order = this.getByIdInternal(id, tenantId)
    transitionOrder(order.status, 'CANCELED')
    order.status = 'CANCELED'
    order.closedAt = new Date().toISOString()
    order.updatedAt = order.closedAt
    order.metadata = { ...order.metadata, cancelReason: reason }
    this.logger.log(`Canceled order ${id} reason=${reason}`)

    // Phase-35 T164: SSE event
    this.eventEmitter?.emit({
      type: 'order.canceled',
      tenantId: order.tenantId,
      orderId: order.id,
      canceledAt: order.closedAt,
      reason
    })

    return order
  }

  /**
   * 内部: 标记为已支付 (PaymentService.confirm 调用)
   * 不会校验 tenantId, 因为 PaymentService 已校验
   * 已 PAID 状态: 幂等返回 (多个支付通道都 confirm 时)
   */
  markPaid(id: string, amountCents: number, method: string, tenantId: string): Order {
    const order = this.getByIdInternal(id, tenantId)
    if (order.status === 'PAID' || order.status === 'FULFILLED' || order.status === 'PARTIALLY_REFUNDED' || order.status === 'REFUNDED') {
      // 幂等: 已是支付/履约/退款状态, 不再 markPaid
      this.logger.debug(`Order ${id} already in ${order.status}, skip markPaid`)
      return order
    }
    transitionOrder(order.status, 'PAID')
    order.status = 'PAID'
    order.paidCents = amountCents
    order.paymentMethod = method as Order['paymentMethod']
    order.paidAt = new Date().toISOString()
    order.updatedAt = order.paidAt

    // Phase-35 T164: SSE event
    this.eventEmitter?.emit({
      type: 'order.paid',
      tenantId: order.tenantId,
      orderId: order.id,
      paidAt: order.paidAt,
      paymentId: `pay-${order.id}-${Date.now()}`
    })

    return order
  }

  /**
   * 履约 PAID → FULFILLED
   */
  fulfill(id: string, tenantId: string): Order {
    const order = this.getByIdInternal(id, tenantId)
    transitionOrder(order.status, 'FULFILLED')
    order.status = 'FULFILLED'
    order.closedAt = new Date().toISOString()
    order.updatedAt = order.closedAt

    // Phase-35 T164: SSE event
    this.eventEmitter?.emit({
      type: 'order.fulfilled',
      tenantId: order.tenantId,
      orderId: order.id,
      fulfilledAt: order.closedAt
    })

    return order
  }

  /**
   * 部分退款后状态推进
   */
  applyRefund(id: string, refundAmountCents: number, tenantId: string): Order {
    const order = this.getByIdInternal(id, tenantId)
    order.refundedCents += refundAmountCents
    const refundId = `ref-${order.id}-${Date.now()}`
    if (order.refundedCents >= order.paidCents) {
      transitionOrder(order.status, 'REFUNDED')
      order.status = 'REFUNDED'
      order.closedAt = new Date().toISOString()

      // Phase-35 T164: SSE event (full refund)
      this.eventEmitter?.emit({
        type: 'order.refunded',
        tenantId: order.tenantId,
        orderId: order.id,
        refundedAt: order.closedAt,
        amount: order.refundedCents,
        refundId
      })
    } else {
      transitionOrder(order.status, 'PARTIALLY_REFUNDED')
      order.status = 'PARTIALLY_REFUNDED'

      // Phase-35 T164: SSE event (partial refund)
      this.eventEmitter?.emit({
        type: 'order.partially_refunded',
        tenantId: order.tenantId,
        orderId: order.id,
        refundedCents: order.refundedCents,
        remainingCents: order.paidCents - order.refundedCents,
        refundId
      })
    }
    order.updatedAt = new Date().toISOString()
    return order
  }

  /**
   * 内部: 乐观锁更新
   */
  updateWithVersion(id: string, tenantId: string, version: number, patch: Partial<Order>): Order {
    const order = this.getByIdInternal(id, tenantId)
    if (order.version !== version) {
      throw new BadRequestException({
        error: 'order_version_conflict',
        current: order.version,
        provided: version
      })
    }
    Object.assign(order, patch, { version: version + 1, updatedAt: new Date().toISOString() })
    return order
  }

  /**
   * 公开查询 (强制 tenantId)
   */
  getById(id: string, tenantId: string): Order | null {
    const order = this.orders.get(id)
    if (!order) return null
    if (order.tenantId !== tenantId) return null  // 跨租户返回 null (由 ViewModel 转 403)
    return order
  }

  getItems(orderId: string, tenantId: string): OrderItem[] {
    const order = this.orders.get(orderId)
    if (!order || order.tenantId !== tenantId) return []
    return this.orderItems.get(orderId) ?? []
  }

  list(filter: ListOrderFilter, tenantId: string): { items: Order[]; total: number } {
    let items = Array.from(this.orders.values()).filter((o) => o.tenantId === tenantId)
    if (filter.status) items = items.filter((o) => o.status === filter.status)
    if (filter.memberId) items = items.filter((o) => o.memberId === filter.memberId)
    if (filter.fromDate) items = items.filter((o) => o.createdAt >= filter.fromDate!)
    if (filter.toDate) items = items.filter((o) => o.createdAt <= filter.toDate!)

    items.sort((a, b) => b.createdAt.localeCompare(a.createdAt))

    const page = filter.page ?? 1
    const pageSize = filter.pageSize ?? 20
    const start = (page - 1) * pageSize
    const paged = items.slice(start, start + pageSize)

    return { items: paged, total: items.length }
  }

  /** 测试辅助 */
  _clear(): void {
    this.orders.clear()
    this.orderItems.clear()
    this.idempotencyIndex.clear()
  }
  _size(): number { return this.orders.size }

  /** 内部 getById (不校验 tenant, 仅供 service 内部) */
  private getByIdInternal(id: string, tenantId: string): Order {
    const order = this.orders.get(id)
    if (!order) throw new NotFoundException(`order ${id} not found`)
    if (order.tenantId !== tenantId) {
      throw new BadRequestException({
        error: 'cross_tenant_order_access',
        message: 'order belongs to a different tenant'
      })
    }
    return order
  }
}
