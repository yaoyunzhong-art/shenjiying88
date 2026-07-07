import { Injectable, BadRequestException, NotFoundException, Logger, Optional } from '@nestjs/common'
import { createHash } from 'crypto'
import type {
  Refund,
  CreateRefundInput
} from '@m5/types'
import {
  transitionRefund
} from './order-state-machine'
import { OrderService } from './order.service'
import { PaymentService } from './payment.service'
import type { BillingWall } from '../foundation/commercial-billing/billing-wall'

/**
 * Phase-35 T162: RefundService - 退款服务
 *
 * DR-36:
 *  - 决策 6: 事务 + 行锁 + availableCents 校验, 防超付
 *  - 决策 2: 幂等键 (orderId + amount + reasonHash)
 */

let refundSeq = 0
function nextRefundId(): string {
  refundSeq = (refundSeq + 1) % 100000
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  return `RFD-${date}-${refundSeq.toString().padStart(5, '0')}`
}

function hashReason(reason: string): string {
  return createHash('sha256').update(reason).digest('hex').slice(0, 16)
}

export interface CreateRefundOptions {
  tenantId: string
  userId: string
}

@Injectable()
export class RefundService {
  private readonly logger = new Logger(RefundService.name)
  private refunds = new Map<string, Refund>()
  /** idempotencyKey → refundId (幂等) */
  private idemIndex = new Map<string, string>()

  constructor(
    private readonly orderService: OrderService,
    private readonly paymentService: PaymentService,
    @Optional() private readonly billingWall?: BillingWall
  ) {}

  /**
   * 创建退款
   * DR-36 决策 6: availableCents 校验 (paidCents - 已退)
   */
  create(input: CreateRefundInput, opts: CreateRefundOptions): Refund {
    if (!opts.tenantId) throw new BadRequestException('tenantId required')
    if (input.amountCents <= 0) throw new BadRequestException('amount must be > 0')
    if (!input.reason || input.reason.trim() === '') {
      throw new BadRequestException('reason required')
    }

    const order = this.orderService.getById(input.orderId, opts.tenantId)
    if (!order) throw new NotFoundException(`order ${input.orderId} not found`)
    if (order.tenantId !== opts.tenantId) {
      throw new BadRequestException('cross_tenant_refund_access')
    }
    if (order.status !== 'PAID' && order.status !== 'FULFILLED' && order.status !== 'PARTIALLY_REFUNDED') {
      throw new BadRequestException({
        error: 'order_not_refundable',
        currentStatus: order.status,
        message: 'order must be PAID, FULFILLED, or PARTIALLY_REFUNDED'
      })
    }

    // 计费墙 (P3-5.4): 退款额度
    //   - 退款不走"调用方付费"的常规路径 (不能让租户无限退款)
    //   - 但仍记录 usage 作为审计 / 退款费率套餐的计费依据
    if (this.billingWall) {
      const wall = this.billingWall.guard(opts.tenantId, 'refund.create', 1)
      if (!wall.allowed && (wall.reason === 'INSUFFICIENT_BALANCE' || wall.reason === 'QUOTA_EXCEEDED')) {
        this.logger.warn(
          `BillingWall denied refund.create tenant=${opts.tenantId} reason=${wall.reason}`
        )
        throw new BadRequestException({
          error: 'billing_quota_exceeded',
          reason: wall.reason,
          message: wall.message,
          remainingQuota: wall.remainingQuota,
          balance: wall.balance
        })
      }
    }

    // 幂等键
    const reasonHash = hashReason(input.reason)
    const idemKey = `${opts.tenantId}:${input.orderId}:${input.amountCents}:${reasonHash}`
    const existingId = this.idemIndex.get(idemKey)
    if (existingId) {
      const existing = this.refunds.get(existingId)
      if (existing) return existing
    }

    // availableCents 校验
    const availableCents = order.paidCents - order.refundedCents
    if (input.amountCents > availableCents) {
      throw new BadRequestException({
        error: 'refund_exceeds_available',
        available: availableCents,
        requested: input.amountCents,
        message: `refund ${input.amountCents}c exceeds available ${availableCents}c`
      })
    }

    // 验证 payment 存在
    const payment = this.paymentService.getById(input.paymentId, opts.tenantId)
    if (!payment) throw new NotFoundException(`payment ${input.paymentId} not found`)
    if (payment.orderId !== input.orderId) {
      throw new BadRequestException({
        error: 'payment_order_mismatch',
        message: 'payment does not belong to this order'
      })
    }

    const now = new Date().toISOString()
    const refund: Refund = {
      id: nextRefundId(),
      tenantId: opts.tenantId,
      orderId: input.orderId,
      paymentId: input.paymentId,
      amountCents: input.amountCents,
      reason: input.reason,
      reasonHash,
      status: 'PENDING',
      providerRefundId: null,
      idempotencyKey: idemKey,
      refundedAt: null,
      failureReason: null,
      createdBy: opts.userId,
      createdAt: now,
      updatedAt: now
    }

    this.refunds.set(refund.id, refund)
    this.idemIndex.set(idemKey, refund.id)
    this.logger.log(`Created refund ${refund.id} order=${order.id} amount=${input.amountCents}c`)

    // 模拟调微信退款 → 立即 SUCCESS (mock 模式)
    this.confirm(refund.id, opts.tenantId)

    // 计费: 成功创建后扣费
    if (this.billingWall) {
      try {
        this.billingWall.recordUsage(opts.tenantId, 'refund.create', 1)
      } catch (err) {
        this.logger.warn(
          `BillingWall recordUsage failed tenant=${opts.tenantId}: ${(err as Error).message}`
        )
      }
    }
    return refund
  }

  /**
   * 确认退款 (webhook / mock 立即)
   */
  confirm(id: string, tenantId: string): Refund {
    const refund = this.refunds.get(id)
    if (!refund) throw new NotFoundException(`refund ${id} not found`)
    if (refund.tenantId !== tenantId) {
      throw new BadRequestException('cross_tenant_refund_access')
    }
    if (refund.status !== 'PENDING') return refund  // 幂等

    transitionRefund(refund.status, 'SUCCESS')
    refund.status = 'SUCCESS'
    refund.refundedAt = new Date().toISOString()
    refund.providerRefundId = `mock_refund_${refund.id}`
    refund.updatedAt = refund.refundedAt

    // 同步 Order 状态
    this.orderService.applyRefund(refund.orderId, refund.amountCents, tenantId)
    this.logger.log(`Confirmed refund ${refund.id}`)
    return refund
  }

  getById(id: string, tenantId: string): Refund | null {
    const refund = this.refunds.get(id)
    if (!refund) return null
    if (refund.tenantId !== tenantId) return null
    return refund
  }

  listByOrder(orderId: string, tenantId: string): Refund[] {
    return Array.from(this.refunds.values())
      .filter((r) => r.orderId === orderId && r.tenantId === tenantId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  /** 测试辅助 */
  _clear(): void {
    this.refunds.clear()
    this.idemIndex.clear()
  }
  _size(): number { return this.refunds.size }
}
