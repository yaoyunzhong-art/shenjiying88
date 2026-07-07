import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import {
  type Payment,
  type Refund,
  type PaymentAuditEntry,
  type RefundAuditEntry,
  type CreatePaymentInput,
  type UpdatePaymentInput,
  type CreateRefundInput,
  type PaymentStatus,
  type RefundStatus
} from './finance-payment.entity'

/**
 * Phase-38 T168: FinancePaymentService
 *
 * 反模式库 v4 命中:
 *  - idempotency-key-pattern: (tenantId, idempotencyKey) 唯一, 复用返回原 Payment
 *  - optimistic-lock-pattern: version 字段
 *  - state-machine-pattern: 跳级防御
 *  - async-try-catch: 异常隔离
 *  - cross-tenant-data-leak: tenantId 强制
 *
 * 联动:
 *  - Payment.SUCCESS → Ledger.REVENUE 流水 (通过注入 callback)
 *  - Refund.COMPLETED → Ledger.REFUND 流水 + Payment.status=REFUNDED
 */

export interface ListPaymentFilter {
  tenantId: string
  status?: PaymentStatus
  method?: Payment['method']
  orderId?: string
  limit?: number
  offset?: number
}

export interface ListRefundFilter {
  tenantId: string
  paymentId?: string
  orderId?: string
  status?: RefundStatus
  limit?: number
  offset?: number
}

/** Ledger 联动回调 (避免直接依赖 finance.service.ts) */
export type LedgerCallback = (entry: {
  tenantId: string
  type: 'REVENUE' | 'REFUND'
  amount: number
  orderId: string
  transactionId?: string
  description: string
}) => void

@Injectable()
export class FinancePaymentService {
  private payments = new Map<string, Payment>()
  private refunds = new Map<string, Refund>()
  /** 幂等键索引: ${tenantId}:${idempotencyKey} → paymentId */
  private idempotencyIndex = new Map<string, string>()
  /** Payment 审计 */
  private paymentAudit = new Map<string, PaymentAuditEntry[]>()
  /** Refund 审计 */
  private refundAudit = new Map<string, RefundAuditEntry[]>()
  /** 订单→支付映射 (orderId → paymentIds[]) */
  private orderIndex = new Map<string, string[]>()
  /** Ledger 联动回调 */
  private ledgerCallback: LedgerCallback | null = null

  // ============================================================
  // Payment CRUD
  // ============================================================

  create(input: CreatePaymentInput): Payment {
    if (input.amountCents <= 0) {
      throw new BadRequestException(`amountCents must be > 0, got ${input.amountCents}`)
    }
    if (!input.idempotencyKey || input.idempotencyKey.length < 8) {
      throw new BadRequestException(`idempotencyKey required (min 8 chars)`)
    }
    const indexKey = `${input.tenantId}:${input.idempotencyKey}`
    // 幂等: 同 (tenantId, idempotencyKey) 已存在 → 返回原 Payment
    const existingId = this.idempotencyIndex.get(indexKey)
    if (existingId) {
      const existing = this.payments.get(existingId)!
      this.writePaymentAudit(existingId, input.tenantId, 'IDEMPOTENT_REUSE', existing.status, existing.status, 'system', `reuse idempotency key ${input.idempotencyKey}`)
      return { ...existing }
    }
    const now = new Date().toISOString()
    const payment: Payment = {
      id: `pay-${randomUUID()}`,
      tenantId: input.tenantId,
      orderId: input.orderId,
      amountCents: input.amountCents,
      currency: input.currency ?? 'CNY',
      method: input.method,
      status: 'PENDING',
      idempotencyKey: input.idempotencyKey,
      version: 1,
      metadata: input.metadata,
      createdAt: now,
      updatedAt: now
    }
    this.payments.set(payment.id, payment)
    this.idempotencyIndex.set(indexKey, payment.id)
    this.addToOrderIndex(input.tenantId, input.orderId, payment.id)
    this.writePaymentAudit(payment.id, input.tenantId, 'CREATE', undefined, 'PENDING', 'system', `payment created for order ${input.orderId}`)
    return { ...payment }
  }

  getById(id: string, tenantId: string): Payment | null {
    const p = this.payments.get(id)
    if (!p || p.tenantId !== tenantId) return null
    return { ...p }
  }

  list(filter: ListPaymentFilter): { items: Payment[]; total: number } {
    let all = Array.from(this.payments.values()).filter(p => p.tenantId === filter.tenantId)
    if (filter.status) all = all.filter(p => p.status === filter.status)
    if (filter.method) all = all.filter(p => p.method === filter.method)
    if (filter.orderId) all = all.filter(p => p.orderId === filter.orderId)
    all.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    const total = all.length
    const offset = filter.offset ?? 0
    const limit = filter.limit ?? 50
    return { items: all.slice(offset, offset + limit).map(p => ({ ...p })), total }
  }

  update(id: string, tenantId: string, version: number, patch: UpdatePaymentInput): Payment {
    const p = this.payments.get(id)
    if (!p || p.tenantId !== tenantId) throw new NotFoundException(`payment ${id} not found`)
    if (p.version !== version) throw new ConflictException(`version mismatch: expected ${p.version}, got ${version}`)
    if (patch.transactionId !== undefined) p.transactionId = patch.transactionId
    if (patch.failureReason !== undefined) p.failureReason = patch.failureReason
    if (patch.metadata !== undefined) p.metadata = patch.metadata
    p.version++
    p.updatedAt = new Date().toISOString()
    this.writePaymentAudit(id, tenantId, 'UPDATE', p.status, p.status, 'system', 'updated')
    return { ...p }
  }

  // ============================================================
  // 状态机 (反模式 v4 state-machine-pattern)
  // ============================================================

  markSuccess(id: string, tenantId: string, transactionId?: string): Payment {
    const p = this.requirePayment(id, tenantId)
    if (p.status !== 'PENDING') {
      throw new ConflictException(`payment ${id} status is ${p.status}, cannot mark SUCCESS`)
    }
    const now = new Date().toISOString()
    p.status = 'SUCCESS'
    p.transactionId = transactionId
    p.successAt = now
    p.version++
    p.updatedAt = now
    this.writePaymentAudit(id, tenantId, 'MARK_SUCCESS', 'PENDING', 'SUCCESS', 'system', transactionId ?? 'marked success')
    // 联动 Ledger.REVENUE
    if (this.ledgerCallback) {
      this.ledgerCallback({
        tenantId,
        type: 'REVENUE',
        amount: p.amountCents,
        orderId: p.orderId,
        transactionId,
        description: `payment ${id} success`
      })
    }
    return { ...p }
  }

  markFailed(id: string, tenantId: string, reason?: string): Payment {
    const p = this.requirePayment(id, tenantId)
    if (p.status !== 'PENDING') {
      throw new ConflictException(`payment ${id} status is ${p.status}, cannot mark FAILED`)
    }
    const now = new Date().toISOString()
    p.status = 'FAILED'
    p.failureReason = reason ?? 'unknown'
    p.failedAt = now
    p.version++
    p.updatedAt = now
    this.writePaymentAudit(id, tenantId, 'MARK_FAILED', 'PENDING', 'FAILED', 'system', reason ?? 'marked failed')
    return { ...p }
  }

  /** Cron: 超时清理 */
  markTimeout(id: string, tenantId: string): Payment {
    const p = this.requirePayment(id, tenantId)
    if (p.status !== 'PENDING') return { ...p }
    const now = new Date().toISOString()
    p.status = 'FAILED'
    p.failureReason = 'timeout by cron'
    p.failedAt = now
    p.version++
    p.updatedAt = now
    this.writePaymentAudit(id, tenantId, 'TIMEOUT', 'PENDING', 'FAILED', 'cron', 'sweep expired PENDING payment')
    return { ...p }
  }

  /** Refund.COMPLETED 触发 */
  private markRefunded(id: string, tenantId: string): Payment {
    const p = this.requirePayment(id, tenantId)
    if (p.status !== 'SUCCESS') {
      throw new ConflictException(`payment ${id} status is ${p.status}, cannot mark REFUNDED`)
    }
    const now = new Date().toISOString()
    p.status = 'REFUNDED'
    p.refundedAt = now
    p.version++
    p.updatedAt = now
    this.writePaymentAudit(id, tenantId, 'MARK_REFUNDED', 'SUCCESS', 'REFUNDED', 'system', 'payment refunded')
    return { ...p }
  }

  // ============================================================
  // Refund CRUD + 状态机
  // ============================================================

  requestRefund(input: CreateRefundInput): Refund {
    if (input.amountCents <= 0) {
      throw new BadRequestException(`amountCents must be > 0, got ${input.amountCents}`)
    }
    const payment = this.payments.get(input.paymentId)
    if (!payment || payment.tenantId !== input.tenantId) {
      throw new NotFoundException(`payment ${input.paymentId} not found`)
    }
    if (payment.status !== 'SUCCESS') {
      throw new ConflictException(`payment status is ${payment.status}, cannot refund (must be SUCCESS)`)
    }
    const now = new Date().toISOString()
    const refund: Refund = {
      id: `ref-${randomUUID()}`,
      tenantId: input.tenantId,
      paymentId: input.paymentId,
      orderId: input.orderId,
      amountCents: input.amountCents,
      reason: input.reason,
      status: 'REQUESTED',
      version: 1,
      requestedBy: input.requestedBy,
      createdAt: now,
      updatedAt: now,
      requestedAt: now
    }
    this.refunds.set(refund.id, refund)
    this.writeRefundAudit(refund.id, input.paymentId, input.tenantId, 'REQUEST', undefined, 'REQUESTED', input.requestedBy, `refund requested: ${input.reason}`)
    return { ...refund }
  }

  approveRefund(id: string, tenantId: string, approver: string): Refund {
    const r = this.requireRefund(id, tenantId)
    if (r.status !== 'REQUESTED') {
      throw new ConflictException(`refund ${id} status is ${r.status}, cannot APPROVE`)
    }
    const now = new Date().toISOString()
    r.status = 'APPROVED'
    r.approvedBy = approver
    r.approvedAt = now
    r.version++
    r.updatedAt = now
    this.writeRefundAudit(id, r.paymentId, tenantId, 'APPROVE', 'REQUESTED', 'APPROVED', approver, 'refund approved')
    return { ...r }
  }

  rejectRefund(id: string, tenantId: string, reason: string, rejecter: string): Refund {
    const r = this.requireRefund(id, tenantId)
    if (r.status !== 'REQUESTED') {
      throw new ConflictException(`refund ${id} status is ${r.status}, cannot REJECT`)
    }
    const now = new Date().toISOString()
    r.status = 'REJECTED'
    r.rejectedBy = rejecter
    r.rejectionReason = reason
    r.rejectedAt = now
    r.version++
    r.updatedAt = now
    this.writeRefundAudit(id, r.paymentId, tenantId, 'REJECT', 'REQUESTED', 'REJECTED', rejecter, reason)
    return { ...r }
  }

  completeRefund(id: string, tenantId: string, refundTransactionId?: string): Refund {
    const r = this.requireRefund(id, tenantId)
    if (r.status !== 'APPROVED') {
      throw new ConflictException(`refund ${id} status is ${r.status}, cannot COMPLETE`)
    }
    const now = new Date().toISOString()
    r.status = 'COMPLETED'
    r.refundTransactionId = refundTransactionId
    r.completedAt = now
    r.version++
    r.updatedAt = now
    this.writeRefundAudit(id, r.paymentId, tenantId, 'COMPLETE', 'APPROVED', 'COMPLETED', 'system', refundTransactionId ?? 'refund completed')
    // 联动 Payment.status = REFUNDED + Ledger.REFUND
    try {
      this.markRefunded(r.paymentId, tenantId)
      if (this.ledgerCallback) {
        this.ledgerCallback({
          tenantId,
          type: 'REFUND',
          amount: r.amountCents,
          orderId: r.orderId,
          transactionId: refundTransactionId,
          description: `refund ${id} completed`
        })
      }
    } catch (err) {
      // 反模式 v4 async-try-catch: 退款已完成, 但联动失败不回滚 (审计可追溯)
      console.error(`[refund-completion] failed to mark Payment REFUNDED for refund ${id}: ${(err as Error).message}`)
    }
    return { ...r }
  }

  getRefundById(id: string, tenantId: string): Refund | null {
    const r = this.refunds.get(id)
    if (!r || r.tenantId !== tenantId) return null
    return { ...r }
  }

  listRefunds(filter: ListRefundFilter): { items: Refund[]; total: number } {
    let all = Array.from(this.refunds.values()).filter(r => r.tenantId === filter.tenantId)
    if (filter.paymentId) all = all.filter(r => r.paymentId === filter.paymentId)
    if (filter.orderId) all = all.filter(r => r.orderId === filter.orderId)
    if (filter.status) all = all.filter(r => r.status === filter.status)
    all.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    const total = all.length
    const offset = filter.offset ?? 0
    const limit = filter.limit ?? 50
    return { items: all.slice(offset, offset + limit).map(r => ({ ...r })), total }
  }

  // ============================================================
  // Cron
  // ============================================================

  scanExpiredPayments(now: Date = new Date(), timeoutMs: number = 15 * 60 * 1000): Payment[] {
    const expired: Payment[] = []
    const cutoff = new Date(now.getTime() - timeoutMs).toISOString()
    for (const p of this.payments.values()) {
      if (p.status === 'PENDING' && p.createdAt < cutoff) {
        const updated = this.markTimeout(p.id, p.tenantId)
        expired.push(updated)
      }
    }
    return expired
  }

  // ============================================================
  // 审计
  // ============================================================

  getPaymentAudit(paymentId: string, tenantId: string): PaymentAuditEntry[] {
    const p = this.payments.get(paymentId)
    if (!p || p.tenantId !== tenantId) return []
    return [...(this.paymentAudit.get(paymentId) ?? [])]
  }

  getRefundAudit(refundId: string, tenantId: string): RefundAuditEntry[] {
    const r = this.refunds.get(refundId)
    if (!r || r.tenantId !== tenantId) return []
    return [...(this.refundAudit.get(refundId) ?? [])]
  }

  // ============================================================
  // 联动回调 (DI)
  // ============================================================

  setLedgerCallback(cb: LedgerCallback): void {
    this.ledgerCallback = cb
  }

  // ============================================================
  // 内部辅助
  // ============================================================

  private requirePayment(id: string, tenantId: string): Payment {
    const p = this.payments.get(id)
    if (!p || p.tenantId !== tenantId) throw new NotFoundException(`payment ${id} not found`)
    return p
  }

  private requireRefund(id: string, tenantId: string): Refund {
    const r = this.refunds.get(id)
    if (!r || r.tenantId !== tenantId) throw new NotFoundException(`refund ${id} not found`)
    return r
  }

  private addToOrderIndex(tenantId: string, orderId: string, paymentId: string): void {
    const key = `${tenantId}:${orderId}`
    const arr = this.orderIndex.get(key) ?? []
    arr.push(paymentId)
    this.orderIndex.set(key, arr)
  }

  private writePaymentAudit(
    paymentId: string,
    tenantId: string,
    action: PaymentAuditEntry['action'],
    fromStatus: PaymentStatus | undefined,
    toStatus: PaymentStatus,
    actor: string,
    detail?: string
  ): void {
    const entry: PaymentAuditEntry = {
      id: `pay-audit-${randomUUID()}`,
      paymentId,
      tenantId,
      action,
      fromStatus,
      toStatus,
      actor,
      detail,
      at: new Date().toISOString()
    }
    const log = this.paymentAudit.get(paymentId) ?? []
    log.push(entry)
    this.paymentAudit.set(paymentId, log)
  }

  private writeRefundAudit(
    refundId: string,
    paymentId: string,
    tenantId: string,
    action: RefundAuditEntry['action'],
    fromStatus: RefundStatus | undefined,
    toStatus: RefundStatus,
    actor: string,
    detail?: string
  ): void {
    const entry: RefundAuditEntry = {
      id: `ref-audit-${randomUUID()}`,
      refundId,
      paymentId,
      tenantId,
      action,
      fromStatus,
      toStatus,
      actor,
      detail,
      at: new Date().toISOString()
    }
    const log = this.refundAudit.get(refundId) ?? []
    log.push(entry)
    this.refundAudit.set(refundId, log)
  }

  /** 测试/重置 */
  reset(): void {
    this.payments.clear()
    this.refunds.clear()
    this.idempotencyIndex.clear()
    this.paymentAudit.clear()
    this.refundAudit.clear()
    this.orderIndex.clear()
    this.ledgerCallback = null
  }
}
