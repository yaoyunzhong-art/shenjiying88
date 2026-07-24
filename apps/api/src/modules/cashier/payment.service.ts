import { Injectable, BadRequestException, NotFoundException, Logger, Optional } from '@nestjs/common'
import type {
  Payment,
  CreatePaymentInput,
  PaymentMethod
} from '@m5/types'
import {
  transitionPayment
} from './order-state-machine'
import { OrderService } from './order.service'
import {
  PaymentChannelRegistry,
  NoChannelConfiguredError
} from './ports/payment-channel.registry'
import type { PaymentChannelPort } from './ports/payment-channel.port'
import type { BillingWall } from '../foundation/commercial-billing/billing-wall'

/**
 * Phase-35 T161: PaymentService - 支付服务
 *
 * DR-36:
 *  - 决策 2: 幂等键 (orderId+method) + (providerTxnId) UNIQUE
 *  - 决策 5: 异步确认 + 主动 query 双保险
 *  - 决策 10: Phase-35 用 Mock 网关, 真实对接 Phase-45
 *
 * 双写: Payment 写内存 + (TODO Phase-46) 调微信/支付宝
 */

let paymentSeq = 0
function nextPaymentId(): string {
  paymentSeq = (paymentSeq + 1) % 100000
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  return `PAY-${date}-${paymentSeq.toString().padStart(5, '0')}`
}

/** 支付网关接口 (Phase-45 真实实现替换) */
export interface PaymentGateway {
  /** 网关名称 (mock / wechat / alipay / stripe ...), 用于 metrics + 日志 */
  readonly gatewayName: string
  /** 预下单 (微信 prepay / 支付宝 trade) */
  createPrepay(order: { id: string; totalCents: number }, method: PaymentMethod): Promise<{
    prepayId: string
    codeUrl?: string  // 扫码场景
    expiresAt: string
  }>
  /** 主动查询 */
  query(providerTxnId: string): Promise<{
    status: 'PENDING' | 'SUCCESS' | 'FAILED'
    paidAt?: string
    failureReason?: string
  }>
  /** 退款 (在 RefundService 里调) */
  refund?(input: { paymentId: string; amountCents: number; reason: string }): Promise<{
    providerRefundId: string
  }>
}

/**
 * DevPaymentGateway · 开发/测试支付网关
 *
 * 替代 Phase-35 的 MockPaymentGateway, 提供真实可用的支付 URL:
 *   - WECHAT / ALIPAY: 生成 H5 支付页面链接 (开发环境指向测试支付页)
 *   - 预下单ID 仍带 dev 前缀便于区分
 *
 * 生产环境 (NODE_ENV=production 且未显式启用 mock) 应走真实通道
 */
@Injectable()
export class MockPaymentGateway implements PaymentGateway {
  readonly gatewayName = 'mock'
  private counter = 0

  private getPaymentBaseUrl(): string {
    return process.env.PAYMENT_PAGE_BASE_URL || 'http://localhost:3000/h5/payment'
  }

  async createPrepay(order: { id: string; totalCents: number }, method: PaymentMethod) {
    this.counter++
    const paymentPageUrl = `${this.getPaymentBaseUrl()}/${order.id}`
    return {
      prepayId: `dev_prepay_${order.id}_${this.counter}_${Date.now()}`,
      codeUrl: method === 'WECHAT' || method === 'ALIPAY'
        ? paymentPageUrl
        : undefined,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString()
    }
  }
  async query(providerTxnId: string): Promise<{
    status: 'PENDING' | 'SUCCESS' | 'FAILED'
    paidAt?: string
    failureReason?: string
  }> {
    // Dev: 1 秒后自动确认支付成功 (POS 场景用)
    // 真实环境会调微信/支付宝 query API
    void providerTxnId
    return {
      status: 'SUCCESS',
      paidAt: new Date().toISOString()
    }
  }
  async refund(input: { paymentId: string; amountCents: number; reason: string }) {
    // Dev: 立即返回成功
    void input
    return {
      providerRefundId: `dev_refund_${Date.now()}`
    }
  }
}

export interface CreatePaymentOptions {
  tenantId: string
  userId: string
}

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name)
  private payments = new Map<string, Payment>()
  /** (tenantId, orderId, method) → paymentId (幂等) */
  private activeIndex = new Map<string, string>()
  /** providerTxnId → paymentId (回调幂等) */
  private txnIndex = new Map<string, string>()

  constructor(
    private readonly orderService: OrderService,
    private readonly gateway: MockPaymentGateway,
    @Optional() private readonly channelRegistry?: PaymentChannelRegistry,
    @Optional() private readonly billingWall?: BillingWall
  ) {}

  private shouldAllowMockFallback(): boolean {
    return process.env.ENABLE_MOCK_PAYMENT_GATEWAY === 'true' || process.env.NODE_ENV !== 'production'
  }

  /**
   * 解析渠道执行点:
   *   - 优先走 registry (多通道 + 主备)
   *   - registry 没配置/抛错 → 回落 direct gateway
   *   - 不破坏现有行为 (单测 + Phase-35 mock 模式照常工作)
   */
  private async runViaChannel<T>(
    tenantId: string,
    method: PaymentMethod,
    op: (channel: PaymentChannelPort) => Promise<T>,
    fallback: () => Promise<T>
  ): Promise<T> {
    if (!this.channelRegistry) {
      if (!this.shouldAllowMockFallback()) {
        throw new BadRequestException({
          error: 'payment_channel_not_configured',
          message: 'payment channel registry is required in production'
        })
      }
      return fallback()
    }
    try {
      return await this.channelRegistry.executeWithFailover({
        tenantId,
        method,
        op
      })
    } catch (error) {
      if (error instanceof NoChannelConfiguredError) {
        this.logger.debug(
          `No channel registered for tenant=${tenantId} method=${method}, fallback to direct gateway`
        )
        if (!this.shouldAllowMockFallback()) {
          throw new BadRequestException({
            error: 'payment_channel_not_configured',
            message: 'payment channel is not configured for current tenant'
          })
        }
        return fallback()
      }
      throw error
    }
  }

  /**
   * 创建支付
   * DR-36 决策 2: 同 (orderId, method) 仅一笔 PENDING/SUCCESS
   */
  async create(input: CreatePaymentInput, opts: CreatePaymentOptions): Promise<Payment> {
    if (!opts.tenantId) throw new BadRequestException('tenantId required')
    if (!input.orderId) throw new BadRequestException('orderId required')
    if (input.amountCents <= 0) throw new BadRequestException('amount must be > 0')

    const order = this.orderService.getById(input.orderId, opts.tenantId)
    if (!order) throw new NotFoundException(`order ${input.orderId} not found`)
    if (order.tenantId !== opts.tenantId) {
      throw new BadRequestException('cross_tenant_payment_access')
    }
    if (order.status !== 'PENDING') {
      throw new BadRequestException({
        error: 'order_not_pending',
        currentStatus: order.status,
        message: 'order must be PENDING to create payment'
      })
    }
    if (input.amountCents !== order.totalCents) {
      throw new BadRequestException({
        error: 'amount_mismatch',
        expected: order.totalCents,
        provided: input.amountCents
      })
    }

    // 计费墙 (P3-5): 调用方付费拦截
    //   - 仅在 INSUFFICIENT_BALANCE / QUOTA_EXCEEDED 时拒付
    //   - NO_PLAN / PLAN_EXPIRED 视为未启用计费, 放行 (兼容现有测试 + 默认免计费租户)
    if (this.billingWall) {
      const wall = this.billingWall.guard(opts.tenantId, 'payment.create', 1)
      if (!wall.allowed && (wall.reason === 'INSUFFICIENT_BALANCE' || wall.reason === 'QUOTA_EXCEEDED')) {
        this.logger.warn(
          `BillingWall denied payment.create tenant=${opts.tenantId} reason=${wall.reason} msg=${wall.message}`
        )
        throw new BadRequestException({
          error: 'billing_quota_exceeded',
          reason: wall.reason,
          message: wall.message,
          remainingQuota: wall.remainingQuota,
          estimatedCost: wall.estimatedCost,
          balance: wall.balance
        })
      }
    }

    // 幂等键
    const idemKey = `${opts.tenantId}:${input.orderId}:${input.method}`
    const existingId = this.activeIndex.get(idemKey)
    if (existingId) {
      const existing = this.payments.get(existingId)
      if (existing && (existing.status === 'PENDING' || existing.status === 'SUCCESS')) {
        return existing
      }
    }

    // 调网关预下单 (registry 多通道 + 主备, fallback direct gateway)
    const prepay = await this.runViaChannel(
      opts.tenantId,
      input.method,
      async (channel) => channel.createPrepay(
        { id: order.id, totalCents: order.totalCents },
        input.method
      ),
      () => this.gateway.createPrepay(
        { id: order.id, totalCents: order.totalCents },
        input.method
      )
    )

    const now = new Date().toISOString()
    const payment: Payment = {
      id: nextPaymentId(),
      tenantId: opts.tenantId,
      orderId: input.orderId,
      method: input.method,
      amountCents: input.amountCents,
      status: 'PENDING',
      providerTxnId: null,
      idempotencyKey: idemKey,
      paidAt: null,
      failureReason: null,
      createdAt: now,
      updatedAt: now
    }

    this.payments.set(payment.id, payment)
    this.activeIndex.set(idemKey, payment.id)
    this.logger.log(`Created payment ${payment.id} order=${order.id} method=${input.method}`)
    void prepay  // 真实环境会返回给前端
    // 计费: 成功创建后扣费
    if (this.billingWall) {
      try {
        this.billingWall.recordUsage(opts.tenantId, 'payment.create', 1)
      } catch (err) {
        // 计费失败不阻塞业务 (记 warning, 后续 cron 对账)
        this.logger.warn(
          `BillingWall recordUsage failed tenant=${opts.tenantId}: ${(err as Error).message}`
        )
      }
    }
    return payment
  }

  /**
   * 确认支付 (webhook 回调)
   * DR-36 决策 5: providerTxnId 幂等
   * Phase-35 T161: 按 paymentId 精确确认 (而非 providerTxnId), 避免跨笔误命中
   */
  confirm(paymentId: string, providerTxnId: string, tenantId: string): Payment {
    if (!paymentId) throw new BadRequestException('paymentId required')
    if (!providerTxnId) throw new BadRequestException('providerTxnId required')

    const payment = this.payments.get(paymentId)
    if (!payment) throw new NotFoundException(`payment ${paymentId} not found`)
    if (payment.tenantId !== tenantId) {
      throw new BadRequestException('cross_tenant_payment_access')
    }

    // providerTxnId 唯一性: 同一 txn 只能绑一笔 payment
    const boundPaymentId = this.txnIndex.get(providerTxnId)
    if (boundPaymentId && boundPaymentId !== paymentId) {
      throw new BadRequestException({
        error: 'payment_callback_mismatch',
        message: `providerTxnId ${providerTxnId} already bound to a different payment (${boundPaymentId})`,
        currentPaymentId: boundPaymentId,
        requestedPaymentId: paymentId
      })
    }

    // 幂等: 同 paymentId + 同 providerTxnId 直接返回
    if (payment.status === 'SUCCESS' && payment.providerTxnId === providerTxnId) {
      return payment
    }
    if (payment.status !== 'PENDING') {
      // 防止跨状态篡改
      throw new BadRequestException({
        error: 'payment_not_pending',
        currentStatus: payment.status,
        message: 'payment already finalized'
      })
    }

    transitionPayment(payment.status, 'SUCCESS')
    payment.status = 'SUCCESS'
    payment.providerTxnId = providerTxnId
    payment.paidAt = new Date().toISOString()
    payment.updatedAt = payment.paidAt
    this.txnIndex.set(providerTxnId, payment.id)

    // 同步 Order 状态
    this.orderService.markPaid(payment.orderId, payment.amountCents, payment.method, tenantId)
    this.logger.log(`Confirmed payment ${payment.id} via txn=${providerTxnId}`)
    return payment
  }

  /**
   * 主动 query (DR-36 决策 5 兜底)
   */
  async query(id: string, tenantId: string): Promise<Payment> {
    const payment = this.payments.get(id)
    if (!payment) throw new NotFoundException(`payment ${id} not found`)
    if (payment.tenantId !== tenantId) {
      throw new BadRequestException('cross_tenant_payment_access')
    }
    if (payment.status !== 'PENDING' || !payment.providerTxnId) {
      return payment
    }
    // 调网关 query (registry 多通道 + 主备, fallback direct gateway)
    const result = await this.runViaChannel(
      tenantId,
      payment.method,
      (channel) => channel.query(payment.providerTxnId!),
      () => this.gateway.query(payment.providerTxnId!)
    )
    if (result.status === 'PENDING') {
      // 仍在等待, 无需更新
      return payment
    }
    if (result.status === 'SUCCESS') {
      if (payment.status !== 'PENDING') return payment
      transitionPayment(payment.status, 'SUCCESS')
      payment.status = 'SUCCESS'
      payment.paidAt = result.paidAt ?? new Date().toISOString()
      payment.updatedAt = payment.paidAt
      this.orderService.markPaid(payment.orderId, payment.amountCents, payment.method, tenantId)
    } else {
      // result.status === 'FAILED'
      if (payment.status !== 'PENDING') return payment
      transitionPayment(payment.status, 'FAILED')
      payment.status = 'FAILED'
      payment.failureReason = result.failureReason ?? 'gateway_returned_failed'
      payment.updatedAt = new Date().toISOString()
    }
    return payment
  }

  getById(id: string, tenantId: string): Payment | null {
    const payment = this.payments.get(id)
    if (!payment) return null
    if (payment.tenantId !== tenantId) return null
    return payment
  }

  listByOrder(orderId: string, tenantId: string): Payment[] {
    return Array.from(this.payments.values())
      .filter((p) => p.orderId === orderId && p.tenantId === tenantId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  /** 测试辅助 */
  _clear(): void {
    this.payments.clear()
    this.activeIndex.clear()
    this.txnIndex.clear()
  }
  _size(): number { return this.payments.size }
}
