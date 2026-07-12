import { randomUUID } from 'node:crypto'
import { Inject, Injectable, Optional } from '@nestjs/common'
import { CACHE_SERVICE, type CacheService } from '../../infrastructure/cache/cache.module'
import { IntegrationOrchestrationService } from '../foundation/integration-orchestration/integration-orchestration.service'
import { LoyaltyService } from '../loyalty/loyalty.service'
import { MemberService } from '../member/member.service'
import type { RequestTenantContext } from '../tenant/tenant.types'
import type { CashierPaymentCallbackDto, CreateCashierOrderDto, CreateCashierPaymentDto } from './cashier.dto'
import {
  CashierOrderCloseReason,
  CashierOrderStatus,
  CashierPaymentStatus,
  computeCashierOrderTotal,
  type CashierOrder,
  type CashierPayment
} from './cashier.entity'

const orderStore = new Map<string, CashierOrder>()
const paymentStore = new Map<string, CashierPayment>()

@Injectable()
export class CashierService {
  constructor(
    private readonly memberService: MemberService,
    @Optional()
    private readonly loyaltyService?: LoyaltyService,
    @Optional()
    private readonly integrationOrchestrationService?: IntegrationOrchestrationService,
    @Optional() @Inject(CACHE_SERVICE)
    private readonly cache?: CacheService
  ) {}

    // ── 持久化私有工具 ──────────────────────────────────────────────────

  /**
   * P0-A1: write-through — 订单写入 Map + 异步 Redis
   */
  private persistOrder(order: CashierOrder): void {
    orderStore.set(order.orderId, order)
    this.cache?.set(`cashier:order:${order.orderId}`, order, 3600).catch(() => {
      // Redis 不可用时静默降级,不影响主流程
    })
  }

  /**
   * P0-A1: write-through — 支付写入 Map + 异步 Redis
   */
  private persistPayment(payment: CashierPayment): void {
    paymentStore.set(payment.paymentId, payment)
    this.cache?.set(`cashier:payment:${payment.paymentId}`, payment, 3600).catch(() => {})
  }

  /**
   * P0-A1: cache-aside — 查订单,先内存后 Redis
   */
  private async loadOrder(orderId: string): Promise<CashierOrder | undefined> {
    const fromMemory = orderStore.get(orderId)
    if (fromMemory) return fromMemory

    if (!this.cache) return undefined

    try {
      const fromRedis = await this.cache.get<CashierOrder>(`cashier:order:${orderId}`)
      if (fromRedis) {
        // 回填内存
        orderStore.set(orderId, fromRedis)
        return fromRedis
      }
    } catch {
      // Redis 错误静默降级
    }
    return undefined
  }

  /**
   * P0-A1: cache-aside — 查支付,先内存后 Redis
   */
  private async loadPayment(paymentId: string): Promise<CashierPayment | undefined> {
    const fromMemory = paymentStore.get(paymentId)
    if (fromMemory) return fromMemory

    if (!this.cache) return undefined

    try {
      const fromRedis = await this.cache.get<CashierPayment>(`cashier:payment:${paymentId}`)
      if (fromRedis) {
        paymentStore.set(paymentId, fromRedis)
        return fromRedis
      }
    } catch {
      // Redis 错误静默降级
    }
    return undefined
  }

  private async ensureMemberExists(memberId: string, tenantContext: RequestTenantContext) {
    const persisted = await this.memberService.getPersistentProfile(memberId, tenantContext)
    const inMemory = this.memberService.getProfile(memberId)
    const member = persisted ?? inMemory
    if (!member) {
      throw new Error(`Member ${memberId} not found`)
    }
    if (member.tenantContext.tenantId !== tenantContext.tenantId) {
      throw new Error(`Member ${memberId} does not belong to tenant ${tenantContext.tenantId}`)
    }
    return member
  }

  private async publishEvent(eventName: string, payload: Record<string, unknown>) {
    if (!this.integrationOrchestrationService) {
      return
    }

    await this.integrationOrchestrationService.publishEvent(eventName, payload, {
      source: 'cashier',
      aggregateId:
        typeof payload.orderId === 'string'
          ? payload.orderId
          : typeof payload.paymentId === 'string'
            ? payload.paymentId
            : undefined
    })
  }

  async createOrder(
    tenantContext: RequestTenantContext,
    input: CreateCashierOrderDto
  ): Promise<CashierOrder> {
    await this.ensureMemberExists(input.memberId, tenantContext)
    if (!input.items?.length) {
      throw new Error('Cashier order must include at least one item')
    }

    const now = new Date().toISOString()
    const order: CashierOrder = {
      orderId: `order-${randomUUID()}`,
      tenantContext,
      memberId: input.memberId,
      items: input.items.map((item) => ({ ...item })),
      currency: input.currency ?? 'CNY',
      totalAmount: computeCashierOrderTotal(input.items),
      couponCode: input.couponCode,
      blindboxPlanId: input.blindboxPlanId,
      blindboxQuantity: input.blindboxQuantity,
      status: CashierOrderStatus.Created,
      createdAt: now,
      updatedAt: now,
      source: 'memory'
    }
    this.persistOrder(order)

    await this.publishEvent('cashier.order-created', {
      orderId: order.orderId,
      tenantId: tenantContext.tenantId,
      memberId: order.memberId,
      totalAmount: order.totalAmount,
      currency: order.currency
    })

    return order
  }

  listOrders(tenantContext: RequestTenantContext): CashierOrder[] {
    return Array.from(orderStore.values()).filter(
      (order) => order.tenantContext.tenantId === tenantContext.tenantId
    )
  }

  getOrder(orderId: string, tenantContext: RequestTenantContext): CashierOrder | undefined {
    const order = orderStore.get(orderId)
    if (!order || order.tenantContext.tenantId !== tenantContext.tenantId) {
      return undefined
    }
    return order
  }

  /**
   * P0-A1: cache-aside 版本 getter,支持 Redis 恢复。
   * 内部方法 (close/update/... ) 均使用 loadOrder,外部调用保持 sync getOrder。
   */
  async getOrderAsync(orderId: string, tenantContext: RequestTenantContext): Promise<CashierOrder | undefined> {
    const order = await this.loadOrder(orderId)
    if (!order || order.tenantContext.tenantId !== tenantContext.tenantId) {
      return undefined
    }
    return order
  }

  async createPayment(orderId: string, input: CreateCashierPaymentDto): Promise<CashierPayment> {
    const order = await this.loadOrder(orderId)
    if (!order) {
      throw new Error(`Order ${orderId} not found`)
    }

    const now = new Date().toISOString()
    const payment: CashierPayment = {
      paymentId: `payment-${randomUUID()}`,
      orderId,
      externalPaymentId: input.externalPaymentId,
      channel: input.channel,
      amount: input.amount ?? order.totalAmount,
      status: CashierPaymentStatus.Pending,
      createdAt: now,
      updatedAt: now
    }
    this.persistPayment(payment)
    order.status = CashierOrderStatus.PendingPayment
    order.latestPaymentId = payment.paymentId
    order.updatedAt = now
    this.persistOrder(order)

    await this.publishEvent('cashier.payment-created', {
      orderId,
      paymentId: payment.paymentId,
      channel: payment.channel,
      amount: payment.amount
    })

    return payment
  }

  listPayments(tenantContext: RequestTenantContext): CashierPayment[] {
    return Array.from(paymentStore.values()).filter((payment) => {
      const order = orderStore.get(payment.orderId)
      return order?.tenantContext.tenantId === tenantContext.tenantId
    })
  }

  listOrderPayments(orderId: string, tenantContext: RequestTenantContext): CashierPayment[] {
    const order = orderStore.get(orderId)
    if (!order || order.tenantContext.tenantId !== tenantContext.tenantId) {
      return []
    }

    return Array.from(paymentStore.values()).filter((payment) => payment.orderId === orderId)
  }

  getLatestPayment(orderId: string, tenantContext: RequestTenantContext): CashierPayment | undefined {
    const order = this.getOrder(orderId, tenantContext)
    if (!order?.latestPaymentId) {
      return undefined
    }
    return paymentStore.get(order.latestPaymentId)
  }

  /**
   * P0-A1: cache-aside 版本,支持 Redis 恢复
   */
  async getLatestPaymentAsync(orderId: string, tenantContext: RequestTenantContext): Promise<CashierPayment | undefined> {
    const order = await this.getOrderAsync(orderId, tenantContext)
    if (!order?.latestPaymentId) {
      return undefined
    }
    return this.loadPayment(order.latestPaymentId)
  }

  async applyPaymentCallback(
    input: CashierPaymentCallbackDto
  ): Promise<{ order: CashierOrder; payment: CashierPayment }> {
    const order = await this.loadOrder(input.orderId)
    if (!order) {
      throw new Error(`Order ${input.orderId} not found`)
    }
    if (order.tenantContext.tenantId !== input.tenantId) {
      throw new Error(`Order ${input.orderId} does not belong to tenant ${input.tenantId}`)
    }
    if (order.status === CashierOrderStatus.Closed) {
      throw new Error(`Order ${input.orderId} is already closed`)
    }

    const existingPayment =
      Array.from(paymentStore.values()).find(
        (payment) =>
          payment.orderId === input.orderId &&
          (input.externalPaymentId
            ? payment.externalPaymentId === input.externalPaymentId
            : payment.paymentId === order.latestPaymentId)
      ) ??
      await this.createPayment(input.orderId, {
        channel: input.channel ?? 'unknown',
        amount: input.amount,
        externalPaymentId: input.externalPaymentId
      })

    const now = new Date().toISOString()
    existingPayment.externalPaymentId = input.externalPaymentId ?? existingPayment.externalPaymentId
    existingPayment.transactionNo = input.transactionNo
    existingPayment.sourceEventName = input.standardizedEventName
    existingPayment.updatedAt = now
    existingPayment.completedAt = now

    if (input.standardizedEventName === 'cashier.payment-succeeded') {
      existingPayment.status = CashierPaymentStatus.Succeeded
      order.status = CashierOrderStatus.Paid
      order.paidAt = now
      await this.loyaltyService?.settlePaidOrder(order, existingPayment)
    } else {
      existingPayment.status = CashierPaymentStatus.Failed
      existingPayment.failureReason = 'Payment callback reported failure'
      order.status = CashierOrderStatus.PaymentFailed
      await this.loyaltyService?.settleFailedOrder(order, existingPayment)
    }

    order.latestPaymentId = existingPayment.paymentId
    order.updatedAt = now
    this.persistPayment(existingPayment)
    this.persistOrder(order)

    await this.publishEvent(input.standardizedEventName, {
      orderId: order.orderId,
      paymentId: existingPayment.paymentId,
      transactionNo: existingPayment.transactionNo,
      status: existingPayment.status
    })

    return {
      order,
      payment: existingPayment
    }
  }

  async closeTimedOutOrder(
    orderId: string,
    tenantContext: RequestTenantContext,
    reason: CashierOrderCloseReason = CashierOrderCloseReason.PaymentTimeout
  ): Promise<{ order: CashierOrder; payment?: CashierPayment }> {
    const order = await this.loadOrder(orderId)
    if (!order) {
      throw new Error(`Order ${orderId} not found`)
    }
    if (order.tenantContext.tenantId !== tenantContext.tenantId) {
      throw new Error(`Order ${orderId} does not belong to tenant ${tenantContext.tenantId}`)
    }
    if (order.status === CashierOrderStatus.Paid) {
      throw new Error(`Paid order ${orderId} cannot be timeout-closed`)
    }

    const payment = order.latestPaymentId ? await this.loadPayment(order.latestPaymentId) : undefined
    if (order.status === CashierOrderStatus.Closed) {
      return { order, payment }
    }
    if (order.status !== CashierOrderStatus.PendingPayment && order.status !== CashierOrderStatus.Created) {
      throw new Error(`Order ${orderId} is not eligible for timeout close`)
    }

    const now = new Date().toISOString()
    if (payment && payment.status === CashierPaymentStatus.Pending) {
      payment.status = CashierPaymentStatus.Failed
      payment.failureReason = 'Payment timed out'
      payment.sourceEventName = 'cashier.payment-timeout-closed'
      payment.updatedAt = now
      payment.completedAt = now
      this.persistPayment(payment)

      await this.publishEvent('cashier.payment-failed', {
        orderId: order.orderId,
        paymentId: payment.paymentId,
        status: payment.status,
        failureReason: payment.failureReason
      })
    }

    order.status = CashierOrderStatus.Closed
    order.closedAt = now
    order.closeReason = reason
    order.updatedAt = now
    this.persistOrder(order)

    if (payment) {
      await this.loyaltyService?.settleFailedOrder(order, payment)
    }

    await this.publishEvent('cashier.order-closed', {
      orderId: order.orderId,
      tenantId: tenantContext.tenantId,
      closeReason: reason,
      status: order.status
    })

    return { order, payment }
  }

  async closeOrder(
    orderId: string,
    tenantContext: RequestTenantContext,
    input?: {
      reason?: string
      operator?: string
    }
  ): Promise<{ order: CashierOrder; payment?: CashierPayment }> {
    const order = await this.loadOrder(orderId)
    if (!order) {
      throw new Error(`Order ${orderId} not found`)
    }
    if (order.tenantContext.tenantId !== tenantContext.tenantId) {
      throw new Error(`Order ${orderId} does not belong to tenant ${tenantContext.tenantId}`)
    }
    if (order.status === CashierOrderStatus.Paid) {
      throw new Error(`Paid order ${orderId} cannot be manually closed`)
    }

    const payment = order.latestPaymentId ? await this.loadPayment(order.latestPaymentId) : undefined
    if (order.status === CashierOrderStatus.Closed) {
      return { order, payment }
    }
    if (order.status !== CashierOrderStatus.PendingPayment && order.status !== CashierOrderStatus.Created) {
      throw new Error(`Order ${orderId} is not eligible for manual close`)
    }

    const now = new Date().toISOString()
    if (payment && payment.status === CashierPaymentStatus.Pending) {
      payment.status = CashierPaymentStatus.Failed
      payment.failureReason = 'Order manually closed'
      payment.sourceEventName = 'cashier.payment-manual-close'
      payment.updatedAt = now
      payment.completedAt = now
      this.persistPayment(payment)

      await this.publishEvent('cashier.payment-failed', {
        orderId: order.orderId,
        paymentId: payment.paymentId,
        status: payment.status,
        failureReason: payment.failureReason
      })
    }

    order.status = CashierOrderStatus.Closed
    order.closedAt = now
    order.closeReason = CashierOrderCloseReason.ManualCancel
    order.closedBy = input?.operator
    order.closeNote = input?.reason
    order.updatedAt = now
    this.persistOrder(order)

    if (payment) {
      await this.loyaltyService?.settleFailedOrder(order, payment)
    }

    await this.publishEvent('cashier.order-closed', {
      orderId: order.orderId,
      tenantId: tenantContext.tenantId,
      closeReason: CashierOrderCloseReason.ManualCancel,
      closedBy: order.closedBy,
      closeNote: order.closeNote,
      status: order.status
    })

    return { order, payment }
  }

  resetCashierStoresForTests(): void {
    orderStore.clear()
    paymentStore.clear()
  }

  /**
   * P0-A1: 同时清除 Redis 缓存 (测试用)
   */
  async resetCashierCacheForTests(): Promise<void> {
    orderStore.clear()
    paymentStore.clear()
    if (this.cache) {
      await Promise.all([
        this.cache.delByPrefix('cashier:order:'),
        this.cache.delByPrefix('cashier:payment:'),
      ])
    }
  }
}
