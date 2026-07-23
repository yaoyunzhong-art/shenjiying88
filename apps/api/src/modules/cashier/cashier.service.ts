import { randomUUID } from 'node:crypto'
import { Inject, Injectable, Optional } from '@nestjs/common'
import type { PaymentMethod } from '@m5/types'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { CACHE_SERVICE, type CacheService } from '../../infrastructure/cache/cache.module'
import { IntegrationOrchestrationService } from '../foundation/integration-orchestration/integration-orchestration.service'
import { LoyaltyService } from '../loyalty/loyalty.service'
import { MemberService } from '../member/member.service'
import type { RequestTenantContext } from '../tenant/tenant.types'
import { seedMembers } from './cashier.seed'
import type { CashierPaymentCallbackDto, CreateCashierOrderDto, CreateCashierPaymentDto } from './cashier.dto'
import { MockPaymentGateway } from './payment.service'
import type { ICashierStore } from './cashier-store.interface'
import { CashierMemoryStore } from './cashier-memory-store'
import {
  CashierOrderCloseReason,
  CashierOrderStatus,
  CashierPaymentStatus,
  computeCashierOrderTotal,
  CashierOrderEntity,
  CashierPaymentEntity,
  type CashierOrder,
  type CashierPayment
} from './cashier.entity'

@Injectable()
export class CashierService {
  private readonly memoryStore: CashierMemoryStore

  constructor(
    @Inject(MemberService) readonly memberService: MemberService,
    @Optional() @Inject(LoyaltyService)
    private readonly loyaltyService?: LoyaltyService,
    @Optional() @Inject(MockPaymentGateway)
    private readonly paymentGateway?: MockPaymentGateway,
    @Optional() @Inject(IntegrationOrchestrationService)
    private readonly integrationOrchestrationService?: IntegrationOrchestrationService,
    @Optional() @Inject(CACHE_SERVICE)
    private readonly cache?: CacheService,
    @Optional() @InjectRepository(CashierOrderEntity)
    private readonly orderRepo?: Repository<CashierOrderEntity>,
    @Optional() @InjectRepository(CashierPaymentEntity)
    private readonly paymentRepo?: Repository<CashierPaymentEntity>,
    @Optional() @Inject('CASHIER_STORE')
    private readonly store?: ICashierStore
  ) {
    this.memoryStore = new CashierMemoryStore()
    this.seedIfNeeded()
  }

  /** 获取存储实现：优先用注入的 store，否则用本地的 MemoryStore */
  private get storeInstance(): ICashierStore {
    return this.store ?? this.memoryStore
  }

    // ── 持久化私有工具 ──────────────────────────────────────────────────

  /**
   * P0-A1/RQ-20260720-011: write-through — 订单写入内存 + Redis + DB
   * 保持内存 Map 作为 L1 缓存，DB 作为 L3 持久化
   */
  private async persistOrderAsync(order: CashierOrder): Promise<void> {
    await this.storeInstance.saveOrder(order)
    this.cache?.set(`cashier:order:${order.orderId}`, order, 3600).catch(() => {
      // Redis 不可用时静默降级,不影响主流程
    })
    await this.persistOrderToDb(order)
  }

  /** 异步 DB 持久化 */
  private async persistOrderToDb(order: CashierOrder): Promise<void> {
    if (!this.orderRepo) return
    try {
      const entity = CashierOrderEntity.fromContract(order)
      await this.orderRepo.upsert(entity, ['orderId'])
    } catch (e) {
      // DB 不可用时静默降级
    }
  }

  /**
   * P0-A1/RQ-20260720-011: write-through — 支付写入内存 + Redis + DB
   */
  private async persistPaymentAsync(payment: CashierPayment): Promise<void> {
    await this.storeInstance.savePayment(payment)
    this.cache?.set(`cashier:payment:${payment.paymentId}`, payment, 3600).catch(() => {})
    await this.persistPaymentToDb(payment)
  }

  /** 异步 DB 持久化 */
  private async persistPaymentToDb(payment: CashierPayment): Promise<void> {
    if (!this.paymentRepo) return
    try {
      const entity = CashierPaymentEntity.fromContract(payment)
      await this.paymentRepo.upsert(entity, ['paymentId'])
    } catch (e) {
      // DB 不可用时静默降级
    }
  }

  /**
   * P0-A1/RQ-20260720-011: cache-aside — 查订单,先内存后 Redis 再 DB
   * L1: Memory → L2: Redis → L3: DB
   */
  private async loadOrder(orderId: string): Promise<CashierOrder | undefined> {
    const fromMemory = await this.storeInstance.getOrder(orderId, '')
    if (fromMemory) return fromMemory

    // 尝试 Redis
    if (this.cache) {
      try {
        const fromRedis = await this.cache.get<CashierOrder>(`cashier:order:${orderId}`)
        if (fromRedis) {
          await this.storeInstance.saveOrder(fromRedis)
          return fromRedis
        }
      } catch {
        // Redis 错误静默降级
      }
    }

    // 尝试 DB
    if (this.orderRepo) {
      try {
        const fromDb = await this.orderRepo.findOne({ where: { orderId } })
        if (fromDb) {
          const contract = fromDb.toContract()
          await this.storeInstance.saveOrder(contract)
          return contract
        }
      } catch {
        // DB 错误静默降级
      }
    }

    return undefined
  }

  /**
   * P0-A1/RQ-20260720-011: cache-aside — 查支付,先内存后 Redis 再 DB
   */
  private async loadPayment(paymentId: string): Promise<CashierPayment | undefined> {
    const fromMemory = this.memoryStore.getPaymentSync(paymentId)
    if (fromMemory) return fromMemory

    if (this.cache) {
      try {
        const fromRedis = await this.cache.get<CashierPayment>(`cashier:payment:${paymentId}`)
        if (fromRedis) {
          await this.storeInstance.savePayment(fromRedis)
          return fromRedis
        }
      } catch {
        // Redis 错误静默降级
      }
    }

    if (this.paymentRepo) {
      try {
        const fromDb = await this.paymentRepo.findOne({ where: { paymentId } })
        if (fromDb) {
          const contract = fromDb.toContract()
          await this.storeInstance.savePayment(contract)
          return contract
        }
      } catch {
        // DB 错误静默降级
      }
    }

    return undefined
  }

  /**
   * 开发模式种子数据
   * 在非生产环境自动填充测试会员到 MemberService
   */
  private seedIfNeeded() {
    const isDev = process.env.NODE_ENV !== 'production'
    if (!isDev) return

    const tenantContext: RequestTenantContext = { tenantId: 'default' }

    for (const s of seedMembers) {
      try {
        const profile = this.memberService.register({
          memberId: s.id,
          tenantContext,
          nickname: s.name,
        })
        // 直接修改内存中的 profile 引用以补全字段
        profile.mobile = s.phone
        profile.points = s.points
        profile.level = s.tier as any
      } catch {
        // 已存在则跳过
      }
    }

    console.log(`[CashierSeed] Loaded ${seedMembers.length} members (NODE_ENV=${process.env.NODE_ENV ?? 'undefined'})`)
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

    try {
      await this.integrationOrchestrationService.publishEvent(eventName, payload, {
        source: 'cashier',
        aggregateId:
          typeof payload.orderId === 'string'
            ? payload.orderId
            : typeof payload.paymentId === 'string'
              ? payload.paymentId
              : undefined
      })
    } catch {
      // Domain-event persistence is non-critical for local smoke flows.
    }
  }

  private createOrderNo(tenantContext: RequestTenantContext, now: string) {
    const datePart = now.slice(0, 10).replaceAll('-', '')
    const currentDayCount = this.memoryStore.listOrdersSync(tenantContext.tenantId).filter(
      (order) =>
        order.createdAt.startsWith(now.slice(0, 10))
    ).length

    return `ORD${datePart}${String(currentDayCount + 1).padStart(3, '0')}`
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
      orderNo: this.createOrderNo(tenantContext, now),
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
    await this.persistOrderAsync(order)

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
    return this.memoryStore.listOrdersSync(tenantContext.tenantId)
  }

  getOrder(orderId: string, tenantContext: RequestTenantContext): CashierOrder | undefined {
    const order = this.memoryStore.getOrderSync(orderId)
    if (!order || order.tenantContext.tenantId !== tenantContext.tenantId) {
      return undefined
    }
    return order
  }

  private normalizePaymentMethod(channel: string): PaymentMethod | undefined {
    const normalized = channel.trim().toUpperCase().replace(/[\s-]+/g, '_')
    if (normalized === 'WECHAT' || normalized === 'WECHAT_PAY') {
      return 'WECHAT'
    }
    if (normalized === 'ALIPAY') {
      return 'ALIPAY'
    }
    if (normalized === 'CARD' || normalized === 'CREDIT_CARD' || normalized === 'BANKCARD') {
      return 'CARD'
    }
    if (normalized === 'CASH') {
      return 'CASH'
    }
    return undefined
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
    const paymentMethod = this.normalizePaymentMethod(input.channel)
    const prepay =
      paymentMethod && this.paymentGateway
        ? await this.paymentGateway.createPrepay(
            {
              id: order.orderId,
              totalCents: Math.round((input.amount ?? order.totalAmount) * 100)
            },
            paymentMethod
          )
        : undefined
    const visiblePrepayUrl =
      prepay?.codeUrl && !prepay.codeUrl.startsWith('mock://')
        ? prepay.codeUrl
        : undefined
    const payment: CashierPayment = {
      paymentId: `payment-${randomUUID()}`,
      orderId,
      externalPaymentId: input.externalPaymentId,
      channel: input.channel,
      amount: input.amount ?? order.totalAmount,
      status: CashierPaymentStatus.Pending,
      qrCodeUrl: visiblePrepayUrl,
      paymentUrl: visiblePrepayUrl,
      expiresAt: visiblePrepayUrl ? prepay?.expiresAt : undefined,
      createdAt: now,
      updatedAt: now
    }
    await this.persistPaymentAsync(payment)
    order.status = CashierOrderStatus.PendingPayment
    order.latestPaymentId = payment.paymentId
    order.updatedAt = now
    await this.persistOrderAsync(order)

    await this.publishEvent('cashier.payment-created', {
      orderId,
      paymentId: payment.paymentId,
      channel: payment.channel,
      amount: payment.amount
    })

    return payment
  }

  listPayments(tenantContext: RequestTenantContext): CashierPayment[] {
    return this.memoryStore.listPaymentsByTenantSync(tenantContext.tenantId)
  }

  listOrderPayments(orderId: string, tenantContext: RequestTenantContext): CashierPayment[] {
    const order = this.memoryStore.getOrderSync(orderId)
    if (!order || order.tenantContext.tenantId !== tenantContext.tenantId) {
      return []
    }

    return this.memoryStore.listPaymentsByOrderSync(orderId)
  }

  getLatestPayment(orderId: string, tenantContext: RequestTenantContext): CashierPayment | undefined {
    const order = this.getOrder(orderId, tenantContext)
    if (!order?.latestPaymentId) {
      return undefined
    }
    return this.memoryStore.getPaymentSync(order.latestPaymentId)
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
      this.memoryStore.listPaymentsByOrderSync(input.orderId).find(
        (payment) =>
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
    await this.persistPaymentAsync(existingPayment)
    await this.persistOrderAsync(order)

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
      await this.persistPaymentAsync(payment)

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
    await this.persistOrderAsync(order)

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
      await this.persistPaymentAsync(payment)

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
    await this.persistOrderAsync(order)

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

  /**
   * 支付渠道统计：按支付渠道聚合今日/当月金额
   * 从 storeInstance 中读取真实数据，无数据时返回空数组
   */
  async getChannelStats(tenantId: string): Promise<{ channel: string; today: number; month: number }[]> {
    const today = new Date().toISOString().slice(0, 10)
    const monthPrefix = today.slice(0, 7)
    const stats = new Map<string, { today: number; month: number }>()

    for (const order of this.memoryStore.allOrdersValuesSync()) {
      if (order.tenantContext.tenantId !== tenantId) continue

      const payment = order.latestPaymentId ? this.memoryStore.getPaymentSync(order.latestPaymentId) : undefined
      const channel = payment?.channel ?? 'CASH'

      if (!stats.has(channel)) stats.set(channel, { today: 0, month: 0 })
      const entry = stats.get(channel)!

      if (order.createdAt.startsWith(today)) {
        entry.today += order.totalAmount
      }
      if (order.createdAt.startsWith(monthPrefix)) {
        entry.month += order.totalAmount
      }
    }

    return Array.from(stats.entries()).map(([channel, amounts]) => ({
      channel,
      today: Math.round(amounts.today * 100) / 100,
      month: Math.round(amounts.month * 100) / 100
    }))
  }

  resetCashierStoresForTests(): void {
    this.memoryStore.resetForTests()
  }

  /**
   * P0-A1: 同时清除 Redis 缓存 (测试用)
   */
  async resetCashierCacheForTests(): Promise<void> {
    await this.memoryStore.resetForTests()
    if (this.cache) {
      await Promise.all([
        this.cache.delByPrefix('cashier:order:'),
        this.cache.delByPrefix('cashier:payment:'),
      ])
    }
  }
}
