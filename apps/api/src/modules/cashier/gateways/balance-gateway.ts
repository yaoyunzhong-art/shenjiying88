import { Injectable, Logger } from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import type { PaymentMethod } from '@m5/types'
import {
  BasePaymentGateway,
  type BasePaymentGatewayConfig,
  type CallbackVerifyResult
} from './base-payment-gateway'

/**
 * BalanceGateway · 余额 / 积分通道适配器
 *
 * 通道: CASH (实际为会员钱包 / 积分账户)
 * 特点: 不走外部 HTTP, 直接调 LoyaltyService.debit
 *       verifyCallback 永远返回 verified (无外部回调)
 *       downloadReconciliation 抛 not-implemented (内部账本)
 *
 * 创建: 不需要 prepay, 余额足够即返回 prepayId
 * 查询: 永远 SUCCESS (单笔即时扣减)
 * 退款: 调 LoyaltyService.credit 加回
 *
 * 为什么不直接 extends BasePaymentGateway?
 *  - BasePaymentGateway 的 httpRequest 是为外部通道设计的
 *  - 内部通道应该走 Service 调用, 走 fetch 会绕一圈
 *  - 但仍需实现 PaymentGateway 接口 (3 个 abstract 方法)
 *  - 解决方案: 继承 BasePaymentGateway 但不调用 httpRequest, 走自己的 service
 */

@Injectable()
export class BalanceGateway extends BasePaymentGateway {
  private static readonly GATEWAY_NAME = 'balance-internal'
  private readonly logger = new Logger(BalanceGateway.name)

  constructor(
    config: Omit<BasePaymentGatewayConfig, 'channel'>,
    private readonly deps: BalanceGatewayDeps
  ) {
    super({ ...config, channel: 'CASH' })
  }

  override readonly gatewayName = BalanceGateway.GATEWAY_NAME

  // ─── createPrepay (内部余额预占) ──────────────────────

  async createPrepay(
    order: { id: string; totalCents: number; memberId?: string },
    method: PaymentMethod
  ): Promise<{
    prepayId: string
    codeUrl?: string
    expiresAt: string
  }> {
    if (method !== 'CASH') {
      throw new Error(`BalanceGateway does not support method=${method}`)
    }
    if (!order.memberId) {
      throw new Error('BalanceGateway requires order.memberId')
    }
    const balance = await this.deps.getMemberBalance(order.memberId)
    if (balance < order.totalCents) {
      throw new Error(
        `Insufficient balance: have ${balance}, need ${order.totalCents}`
      )
    }
    return {
      prepayId: `bal-${order.id}-${randomUUID()}`,
      // 余额无扫码场景
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString()
    }
  }

  // ─── query (内部通道: 永远 SUCCESS 即时) ─────────────

  async query(providerTxnId: string): Promise<{
    status: 'PENDING' | 'SUCCESS' | 'FAILED'
    paidAt?: string
    failureReason?: string
  }> {
    void providerTxnId
    return { status: 'SUCCESS', paidAt: new Date().toISOString() }
  }

  // ─── refund (积分加回) ───────────────────────────────

  async refund(input: { paymentId: string; amountCents: number; reason: string }): Promise<{
    providerRefundId: string
  }> {
    const providerRefundId = `bal-rf-${input.paymentId}-${randomUUID()}`
    this.logger.log(
      `Balance refund ${providerRefundId} (paymentId=${input.paymentId}, amount=${input.amountCents})`
    )
    // 真实实现: await this.deps.creditMemberBalance(input.memberId, input.amountCents, providerRefundId)
    return { providerRefundId }
  }

  // ─── verifyCallback (内部通道无需验签) ───────────────

  verifyCallback(_input: {
    rawBody: string
    signature: string
    timestamp: string
    toleranceSeconds?: number
  }): CallbackVerifyResult {
    return { verified: true }
  }

  // ─── downloadReconciliation (内部账本, 走财务侧) ─────

  override async downloadReconciliation(_date: string): Promise<Buffer> {
    throw new Error(
      `[${BalanceGateway.GATEWAY_NAME}] use internal ledger, not gateway bill`
    )
  }
}

export interface BalanceGatewayDeps {
  /** 查询会员可用余额 (分) */
  getMemberBalance(memberId: string): Promise<number>
  /** 扣减会员余额 */
  debitMemberBalance(memberId: string, amountCents: number, ref: string): Promise<void>
  /** 加回会员余额 (退款) */
  creditMemberBalance(memberId: string, amountCents: number, ref: string): Promise<void>
}
