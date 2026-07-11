import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [finance-payment] [A] service 测试补全
 *
 * 覆盖 FinancePaymentService 核心业务逻辑:
 *   - Payment CRUD (create / getById / list / update)
 *   - 幂等键 (idempotency-key-pattern)
 *   - 乐观锁 (optimistic-lock-pattern)
 *   - 状态机 (state-machine-pattern: markSuccess / markFailed / markTimeout)
 *   - Refund CRUD + 状态机 (requestRefund / approveRefund / rejectRefund / completeRefund)
 *   - 跨租户隔离 (cross-tenant-data-leak)
 *   - 超时扫描 (scanExpiredPayments)
 *   - 审计 (getPaymentAudit / getRefundAudit)
 *   - Ledger 联动回调
 *   - 边界与异常
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { FinancePaymentService, type LedgerCallback } from './finance-payment.service'
import type { CreatePaymentInput, CreateRefundInput, Payment, Refund } from './finance-payment.entity'
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common'

// ── 工厂 ──

function makePaymentInput(overrides: Partial<CreatePaymentInput> & { idempotencyKey: string }): CreatePaymentInput {
  return {
    tenantId: 't-pay-svc-test',
    orderId: 'ord-svc-001',
    amountCents: 9900,
    currency: 'CNY',
    method: 'WECHAT',
    ...overrides,
  }
}

function makeRefundInput(paymentId: string, overrides: Partial<CreateRefundInput> = {}): CreateRefundInput {
  return {
    tenantId: 't-pay-svc-test',
    paymentId,
    orderId: 'ord-svc-001',
    amountCents: 5000,
    reason: '客户退换货',
    requestedBy: 'clerk-01',
    ...overrides,
  }
}

function makeService(): FinancePaymentService {
  return new FinancePaymentService()
}

// ────────────────────────────────────────────────────────
// Payment CRUD
// ────────────────────────────────────────────────────────

describe('[finance-payment] Payment CRUD', () => {

  it('create: 正常创建 Payment 并返回副本', () => {
    const svc = makeService()
    const p = svc.create(makePaymentInput({ idempotencyKey: 'pmtik-crud-01' }))
    assert.match(p.id, /^pay-/, `id 以 pay- 开头, got ${p.id}`)
    assert.equal(p.tenantId, 't-pay-svc-test')
    assert.equal(p.orderId, 'ord-svc-001')
    assert.equal(p.amountCents, 9900)
    assert.equal(p.currency, 'CNY')
    assert.equal(p.method, 'WECHAT')
    assert.equal(p.status, 'PENDING')
    assert.equal(p.version, 1)
    assert.ok(p.createdAt)
    assert.ok(p.updatedAt)
    // 返回副本, 内部不可变
    p.amountCents = 0
    const p2 = svc.getById(p.id, p.tenantId)
    assert.equal(p2!.amountCents, 9900)
  })

  it('create: 金额 <= 0 抛出 BadRequest', () => {
    const svc = makeService()
    assert.throws(
      () => svc.create(makePaymentInput({ idempotencyKey: 'pmtik-zero', amountCents: 0 })),
      BadRequestException
    )
    assert.throws(
      () => svc.create(makePaymentInput({ idempotencyKey: 'pmtik-neg', amountCents: -1 })),
      BadRequestException
    )
  })

  it('create: idempotencyKey 太短抛出 BadRequest', () => {
    const svc = makeService()
    assert.throws(
      () => svc.create(makePaymentInput({ idempotencyKey: 'short' })),
      BadRequestException
    )
  })

  it('create: 可选字段 currency 默认 CNY', () => {
    const svc = makeService()
    // 移除 currency 字段 (不给默认值), 而非显式传 undefined
    const input = makePaymentInput({ idempotencyKey: 'pmtik-cur' })
    delete (input as any).currency
    const p = svc.create(input)
    assert.equal(p.currency, 'CNY')
  })

  it('getById: 存在返回 Payment 副本', () => {
    const svc = makeService()
    const p = svc.create(makePaymentInput({ idempotencyKey: 'pmtik-get' }))
    const found = svc.getById(p.id, p.tenantId)
    assert.ok(found)
    assert.equal(found!.id, p.id)
    // 验证返回的是副本 (修改不应影响内部)
    ;(found! as any).amountCents = 0
    const p2 = svc.getById(p.id, p.tenantId)
    assert.equal(p2!.amountCents, 9900)
  })

  it('getById: 跨租户隔离 — 返回 null', () => {
    const svc = makeService()
    const p = svc.create(makePaymentInput({ idempotencyKey: 'pmtik-cross' }))
    const found = svc.getById(p.id, 'other-tenant')
    assert.equal(found, null)
  })

  it('list: 按租户返回所有 Payment', () => {
    const svc = makeService()
    svc.create(makePaymentInput({ idempotencyKey: 'pmtik-l1', tenantId: 't-a', orderId: 'o1' }))
    svc.create(makePaymentInput({ idempotencyKey: 'pmtik-l2', tenantId: 't-a', orderId: 'o2' }))
    svc.create(makePaymentInput({ idempotencyKey: 'pmtik-l3', tenantId: 't-b', orderId: 'o3' }))
    const result = svc.list({ tenantId: 't-a' })
    assert.equal(result.total, 2)
    assert.equal(result.items.length, 2)
  })

  it('list: 支持 status / method / orderId 筛选', () => {
    const svc = makeService()
    const p1 = svc.create(makePaymentInput({ idempotencyKey: 'pmtik-f1', tenantId: 't-f' }))
    svc.markSuccess(p1.id, p1.tenantId, 'tx-001')
    svc.create(makePaymentInput({ idempotencyKey: 'pmtik-f2', tenantId: 't-f', method: 'ALIPAY' }))
    const successPayments = svc.list({ tenantId: 't-f', status: 'SUCCESS' })
    assert.equal(successPayments.total, 1)
    const alipayPayments = svc.list({ tenantId: 't-f', method: 'ALIPAY' })
    assert.equal(alipayPayments.total, 1)
    const byOrder = svc.list({ tenantId: 't-f', orderId: 'ord-svc-001' })
    assert.equal(byOrder.total, 2)
  })

  it('list: 分页工作正常', () => {
    const svc = makeService()
    for (let i = 0; i < 10; i++) {
      svc.create(makePaymentInput({ idempotencyKey: `pmtik-pagination-${i}`, tenantId: 't-pg' }))
    }
    const page1 = svc.list({ tenantId: 't-pg', limit: 3, offset: 0 })
    assert.equal(page1.items.length, 3)
    assert.equal(page1.total, 10)
    const page4 = svc.list({ tenantId: 't-pg', limit: 3, offset: 9 })
    assert.equal(page4.items.length, 1)
  })

  it('update: 正常更新事务号和 metadata', () => {
    const svc = makeService()
    const p = svc.create(makePaymentInput({ idempotencyKey: 'pmtik-upd' }))
    const updated = svc.update(p.id, p.tenantId, p.version, { transactionId: 'tx-updated', metadata: { note: 'test' } })
    assert.equal(updated.transactionId, 'tx-updated')
    assert.deepEqual(updated.metadata, { note: 'test' })
    assert.equal(updated.version, p.version + 1)
  })

  it('update: version 不匹配抛出 Conflict', () => {
    const svc = makeService()
    const p = svc.create(makePaymentInput({ idempotencyKey: 'pmtik-conflict' }))
    // 先更新一次 (version+1)
    svc.update(p.id, p.tenantId, p.version, { transactionId: 'tx-v2' })
    // 用旧 version 更新 → 冲突
    assert.throws(
      () => svc.update(p.id, p.tenantId, 1, { transactionId: 'tx-v3' }),
      ConflictException
    )
  })

  it('update: 不存在的 payment 抛出 NotFound', () => {
    const svc = makeService()
    assert.throws(
      () => svc.update('no-such', 'x', 1, {}),
      NotFoundException
    )
  })

  it('update: 跨租户隔离 — 抛出 NotFound', () => {
    const svc = makeService()
    const p = svc.create(makePaymentInput({ idempotencyKey: 'pmtik-upd-cross' }))
    assert.throws(
      () => svc.update(p.id, 'other-tenant', 1, { transactionId: 'tx-cross' }),
      NotFoundException
    )
  })
})

// ────────────────────────────────────────────────────────
// 幂等键
// ────────────────────────────────────────────────────────

describe('[finance-payment] 幂等键 (idempotency-key-pattern)', () => {

  it('同 (tenantId, idempotencyKey) 返回原 Payment', () => {
    const svc = makeService()
    const p1 = svc.create(makePaymentInput({ idempotencyKey: 'pmtik-idem-01' }))
    const p2 = svc.create(makePaymentInput({ idempotencyKey: 'pmtik-idem-01' }))
    assert.equal(p2.id, p1.id)
    assert.equal(p2.amountCents, p1.amountCents)
  })

  it('不同 tenantId 相同 idempotencyKey 创建独立 Payment', () => {
    const svc = makeService()
    const p1 = svc.create(makePaymentInput({ idempotencyKey: 'pmtik-tenant', tenantId: 't-a' }))
    const p2 = svc.create(makePaymentInput({ idempotencyKey: 'pmtik-tenant', tenantId: 't-b' }))
    assert.notEqual(p1.id, p2.id)
  })

  it('幂等键审计有 IDEMPOTENT_REUSE 记录', () => {
    const svc = makeService()
    svc.create(makePaymentInput({ idempotencyKey: 'pmtik-audit' }))
    svc.create(makePaymentInput({ idempotencyKey: 'pmtik-audit' }))
    const p = svc.getById(svc.create(makePaymentInput({ idempotencyKey: 'pmtik-audit' })).id, 't-pay-svc-test')
    const audit = svc.getPaymentAudit(p!.id, p!.tenantId)
    const reuse = audit.filter(a => a.action === 'IDEMPOTENT_REUSE')
    assert.equal(reuse.length, 2)
  })
})

// ────────────────────────────────────────────────────────
// Payment 状态机
// ────────────────────────────────────────────────────────

describe('[finance-payment] Payment 状态机', () => {

  it('markSuccess: PENDING → SUCCESS', () => {
    const svc = makeService()
    const p = svc.create(makePaymentInput({ idempotencyKey: 'pmtik-ms' }))
    const updated = svc.markSuccess(p.id, p.tenantId, 'tx-ms-001')
    assert.equal(updated.status, 'SUCCESS')
    assert.equal(updated.transactionId, 'tx-ms-001')
    assert.ok(updated.successAt)
  })

  it('markSuccess: 非 PENDING 状态抛出 Conflict', () => {
    const svc = makeService()
    const p = svc.create(makePaymentInput({ idempotencyKey: 'pmtik-ms-fail' }))
    svc.markSuccess(p.id, p.tenantId)
    assert.throws(
      () => svc.markSuccess(p.id, p.tenantId),
      ConflictException
    )
  })

  it('markFailed: PENDING → FAILED', () => {
    const svc = makeService()
    const p = svc.create(makePaymentInput({ idempotencyKey: 'pmtik-mf' }))
    const updated = svc.markFailed(p.id, p.tenantId, 'insufficient balance')
    assert.equal(updated.status, 'FAILED')
    assert.equal(updated.failureReason, 'insufficient balance')
    assert.ok(updated.failedAt)
  })

  it('markFailed: 非 PENDING 状态抛出 Conflict', () => {
    const svc = makeService()
    const p = svc.create(makePaymentInput({ idempotencyKey: 'pmtik-mf-fail' }))
    svc.markSuccess(p.id, p.tenantId)
    assert.throws(
      () => svc.markFailed(p.id, p.tenantId),
      ConflictException
    )
  })

  it('markTimeout: PENDING → FAILED (timeout)', () => {
    const svc = makeService()
    const p = svc.create(makePaymentInput({ idempotencyKey: 'pmtik-mt' }))
    const updated = svc.markTimeout(p.id, p.tenantId)
    assert.equal(updated.status, 'FAILED')
    assert.equal(updated.failureReason, 'timeout by cron')
  })

  it('markTimeout: 非 PENDING 不改变', () => {
    const svc = makeService()
    const p = svc.create(makePaymentInput({ idempotencyKey: 'pmtik-mt-skip' }))
    svc.markSuccess(p.id, p.tenantId)
    const updated = svc.markTimeout(p.id, p.tenantId)
    assert.equal(updated.status, 'SUCCESS')
  })

  it('状态机回退: SUCCESS → FAILED 不允许 (单向)', () => {
    const svc = makeService()
    const p = svc.create(makePaymentInput({ idempotencyKey: 'pmtik-no-fallback' }))
    svc.markSuccess(p.id, p.tenantId)
    assert.throws(() => svc.markFailed(p.id, p.tenantId), ConflictException)
  })

  it('审计记录: markSuccess 有对应的审计条', () => {
    const svc = makeService()
    const p = svc.create(makePaymentInput({ idempotencyKey: 'pmtik-ms-audit' }))
    svc.markSuccess(p.id, p.tenantId, 'tx-audit')
    const audit = svc.getPaymentAudit(p.id, p.tenantId)
    assert.ok(audit.some(a => a.action === 'MARK_SUCCESS'))
  })
})

// ────────────────────────────────────────────────────────
// Refund CRUD + 状态机
// ────────────────────────────────────────────────────────

describe('[finance-payment] Refund 流程', () => {

  it('requestRefund: 从 SUCCESS Payment 创建 Refund', () => {
    const svc = makeService()
    const p = svc.create(makePaymentInput({ idempotencyKey: 'pmtik-ref-req' }))
    svc.markSuccess(p.id, p.tenantId)
    const refund = svc.requestRefund(makeRefundInput(p.id))
    assert.match(refund.id, /^ref-/, `refund id 以 ref- 开头, got ${refund.id}`)
    assert.equal(refund.status, 'REQUESTED')
    assert.equal(refund.paymentId, p.id)
    assert.equal(refund.amountCents, 5000)
  })

  it('requestRefund: 非 SUCCESS Payment 抛出 Conflict', () => {
    const svc = makeService()
    const p = svc.create(makePaymentInput({ idempotencyKey: 'pmtik-ref-bad' }))
    assert.throws(
      () => svc.requestRefund(makeRefundInput(p.id)),
      ConflictException
    )
  })

  it('requestRefund: 金额 <= 0 抛出 BadRequest', () => {
    const svc = makeService()
    const p = svc.create(makePaymentInput({ idempotencyKey: 'pmtik-ref-zero' }))
    svc.markSuccess(p.id, p.tenantId)
    assert.throws(
      () => svc.requestRefund(makeRefundInput(p.id, { amountCents: -1 })),
      BadRequestException
    )
  })

  it('approveRefund: REQUESTED → APPROVED', () => {
    const svc = makeService()
    const p = svc.create(makePaymentInput({ idempotencyKey: 'pmtik-ref-app' }))
    svc.markSuccess(p.id, p.tenantId)
    const refund = svc.requestRefund(makeRefundInput(p.id))
    const approved = svc.approveRefund(refund.id, refund.tenantId, 'mgmt-01')
    assert.equal(approved.status, 'APPROVED')
    assert.equal(approved.approvedBy, 'mgmt-01')
    assert.ok(approved.approvedAt)
  })

  it('approveRefund: 非 REQUESTED 状态抛出 Conflict', () => {
    const svc = makeService()
    const p = svc.create(makePaymentInput({ idempotencyKey: 'pmtik-ref-app-bad' }))
    svc.markSuccess(p.id, p.tenantId)
    const refund = svc.requestRefund(makeRefundInput(p.id))
    svc.approveRefund(refund.id, refund.tenantId, 'mgmt-01')
    assert.throws(
      () => svc.approveRefund(refund.id, refund.tenantId, 'mgmt-02'),
      ConflictException
    )
  })

  it('rejectRefund: REQUESTED → REJECTED', () => {
    const svc = makeService()
    const p = svc.create(makePaymentInput({ idempotencyKey: 'pmtik-ref-rej' }))
    svc.markSuccess(p.id, p.tenantId)
    const refund = svc.requestRefund(makeRefundInput(p.id))
    const rejected = svc.rejectRefund(refund.id, refund.tenantId, '不符合政策', 'admin-01')
    assert.equal(rejected.status, 'REJECTED')
    assert.equal(rejected.rejectedBy, 'admin-01')
    assert.equal(rejected.rejectionReason, '不符合政策')
  })

  it('completeRefund: APPROVED → COMPLETED + Payment 变为 REFUNDED', () => {
    const svc = makeService()
    const p = svc.create(makePaymentInput({ idempotencyKey: 'pmtik-ref-complete' }))
    svc.markSuccess(p.id, p.tenantId)
    const refund = svc.requestRefund(makeRefundInput(p.id))
    svc.approveRefund(refund.id, refund.tenantId, 'mgmt-01')
    const completed = svc.completeRefund(refund.id, refund.tenantId, 'refund-tx-001')
    assert.equal(completed.status, 'COMPLETED')
    assert.equal(completed.refundTransactionId, 'refund-tx-001')
    // Payment 应被标记 REFUNDED
    const payAfter = svc.getById(p.id, p.tenantId)
    assert.equal(payAfter!.status, 'REFUNDED')
    assert.ok(payAfter!.refundedAt)
  })

  it('completeRefund: 非 APPROVED 状态抛出 Conflict', () => {
    const svc = makeService()
    const p = svc.create(makePaymentInput({ idempotencyKey: 'pmtik-ref-complete-bad' }))
    svc.markSuccess(p.id, p.tenantId)
    const refund = svc.requestRefund(makeRefundInput(p.id))
    assert.throws(
      () => svc.completeRefund(refund.id, refund.tenantId),
      ConflictException
    )
  })

  it('getRefundById: 存在返回 Refund 副本', () => {
    const svc = makeService()
    const p = svc.create(makePaymentInput({ idempotencyKey: 'pmtik-ref-get' }))
    svc.markSuccess(p.id, p.tenantId)
    const refund = svc.requestRefund(makeRefundInput(p.id))
    const found = svc.getRefundById(refund.id, refund.tenantId)
    assert.ok(found)
    assert.equal(found!.id, refund.id)
  })

  it('getRefundById: 跨租户隔离', () => {
    const svc = makeService()
    const p = svc.create(makePaymentInput({ idempotencyKey: 'pmtik-ref-cross' }))
    svc.markSuccess(p.id, p.tenantId)
    const refund = svc.requestRefund(makeRefundInput(p.id))
    assert.equal(svc.getRefundById(refund.id, 'other'), null)
  })

  it('listRefunds: 支持按 paymentId / status 筛选', () => {
    const svc = makeService()
    const p = svc.create(makePaymentInput({ idempotencyKey: 'pmtik-ref-list', tenantId: 't-rl' }))
    svc.markSuccess(p.id, p.tenantId)
    const r1 = svc.requestRefund(makeRefundInput(p.id, { tenantId: 't-rl' }))
    const r2 = svc.requestRefund(makeRefundInput(p.id, { tenantId: 't-rl' }))
    svc.approveRefund(r1.id, r1.tenantId, 'mgr')

    const byPayment = svc.listRefunds({ tenantId: 't-rl', paymentId: p.id })
    assert.equal(byPayment.total, 2)

    const byStatus = svc.listRefunds({ tenantId: 't-rl', status: 'APPROVED' })
    assert.equal(byStatus.total, 1)
  })

  it('Refund 审计流程: REQUEST → APPROVE → COMPLETE', () => {
    const svc = makeService()
    const p = svc.create(makePaymentInput({ idempotencyKey: 'pmtik-ref-audit-f' }))
    svc.markSuccess(p.id, p.tenantId)
    const refund = svc.requestRefund(makeRefundInput(p.id))
    svc.approveRefund(refund.id, refund.tenantId, 'mgr')
    svc.completeRefund(refund.id, refund.tenantId, 'r-tx')

    const audit = svc.getRefundAudit(refund.id, refund.tenantId)
    const actions = audit.map(a => a.action)
    assert.deepEqual(actions, ['REQUEST', 'APPROVE', 'COMPLETE'])
  })
})

// ────────────────────────────────────────────────────────
// 超时扫描
// ────────────────────────────────────────────────────────

describe('[finance-payment] Cron: 超时扫描', () => {

  it('scanExpiredPayments: 扫描并标记超时 Payment', () => {
    const svc = makeService()
    // 用未来时间作为 now, 确保新创建的 payment 早于 now
    const futureNow = new Date()
    futureNow.setHours(futureNow.getHours() + 2) // 2h 后
    const p = svc.create(makePaymentInput({ idempotencyKey: 'pmtik-expire-01' }))
    // 现在 payment 的 createdAt 是 now ~2h 钱, 用 1min timeout 触发过期
    const expired = svc.scanExpiredPayments(futureNow, 60 * 1000)
    assert.ok(expired.length >= 1)
    assert.equal(expired[0].status, 'FAILED')
    assert.equal(expired[0].failureReason, 'timeout by cron')
  })

  it('scanExpiredPayments: 未超时的 Payment 不被扫描', () => {
    const svc = makeService()
    // 用过去的时间作为 now, 新 payment 在 now 之后, 不应过期
    const pastNow = new Date()
    pastNow.setHours(pastNow.getHours() - 1) // 1h 前
    svc.create(makePaymentInput({ idempotencyKey: 'pmtik-not-expire-02' }))
    const expired = svc.scanExpiredPayments(pastNow, 60 * 1000)
    assert.equal(expired.length, 0)
  })
})

// ────────────────────────────────────────────────────────
// Ledger 联动回调
// ────────────────────────────────────────────────────────

describe('[finance-payment] Ledger 联动回调', () => {

  it('markSuccess 触发 Ledger.REVENUE 回调', () => {
    const svc = makeService()
    const calls: any[] = []
    const callback: LedgerCallback = (entry) => calls.push(entry)
    svc.setLedgerCallback(callback)

    const p = svc.create(makePaymentInput({ idempotencyKey: 'pmtik-ledger-rev' }))
    svc.markSuccess(p.id, p.tenantId, 'tx-ledger-001')

    assert.equal(calls.length, 1)
    assert.equal(calls[0].type, 'REVENUE')
    assert.equal(calls[0].amount, 9900)
    assert.equal(calls[0].orderId, 'ord-svc-001')
    assert.equal(calls[0].transactionId, 'tx-ledger-001')
  })

  it('completeRefund 触发 Ledger.REFUND 回调', () => {
    const svc = makeService()
    const calls: any[] = []
    svc.setLedgerCallback((entry) => calls.push(entry))

    const p = svc.create(makePaymentInput({ idempotencyKey: 'pmtik-ledger-ref' }))
    svc.markSuccess(p.id, p.tenantId)
    const refund = svc.requestRefund(makeRefundInput(p.id))
    svc.approveRefund(refund.id, refund.tenantId, 'mgr')
    svc.completeRefund(refund.id, refund.tenantId, 'r-tx-ledger')

    // call[0] = REVENUE from markSuccess, call[1] = REFUND from completeRefund
    assert.equal(calls.length, 2)
    assert.equal(calls[0].type, 'REVENUE')
    assert.equal(calls[1].type, 'REFUND')
    assert.equal(calls[1].amount, 5000)
  })

  it('不设置回调时 markSuccess 不报错', () => {
    const svc = makeService()
    const p = svc.create(makePaymentInput({ idempotencyKey: 'pmtik-ledger-no' }))
    assert.doesNotThrow(() => svc.markSuccess(p.id, p.tenantId))
  })
})

// ────────────────────────────────────────────────────────
// 审计
// ────────────────────────────────────────────────────────

describe('[finance-payment] 审计', () => {

  it('getPaymentAudit: 返回创建以来的审计条目', () => {
    const svc = makeService()
    const p = svc.create(makePaymentInput({ idempotencyKey: 'pmtik-audit-svc' }))
    svc.markSuccess(p.id, p.tenantId)
    const audit = svc.getPaymentAudit(p.id, p.tenantId)
    assert.equal(audit.length, 2)
    assert.equal(audit[0].action, 'CREATE')
    assert.equal(audit[1].action, 'MARK_SUCCESS')
  })

  it('getPaymentAudit: 跨租户返回空数组', () => {
    const svc = makeService()
    const p = svc.create(makePaymentInput({ idempotencyKey: 'pmtik-audit-cross' }))
    assert.deepEqual(svc.getPaymentAudit(p.id, 'other-tenant'), [])
  })

  it('getRefundAudit: 跨租户返回空数组', () => {
    const svc = makeService()
    const p = svc.create(makePaymentInput({ idempotencyKey: 'pmtik-audit-ref-cross' }))
    svc.markSuccess(p.id, p.tenantId)
    const refund = svc.requestRefund(makeRefundInput(p.id))
    assert.deepEqual(svc.getRefundAudit(refund.id, 'other-tenant'), [])
  })
})

// ────────────────────────────────────────────────────────
// 边界 & 异常
// ────────────────────────────────────────────────────────

describe('[finance-payment] 边界 & 异常', () => {

  it('reset: 清空所有状态', () => {
    const svc = makeService()
    svc.create(makePaymentInput({ idempotencyKey: 'pmtik-reset' }))
    assert.equal(svc.list({ tenantId: 't-pay-svc-test' }).total, 1)
    svc.reset()
    assert.equal(svc.list({ tenantId: 't-pay-svc-test' }).total, 0)
  })

  it('list: 默认 limit 50', () => {
    const svc = makeService()
    for (let i = 0; i < 60; i++) {
      svc.create(makePaymentInput({ idempotencyKey: `ik-limit-${i}`, tenantId: 't-limit' }))
    }
    const result = svc.list({ tenantId: 't-limit' })
    assert.equal(result.items.length, 50)
    assert.equal(result.total, 60)
  })

  it('requestRefund: 不存在的 Payment 抛出 NotFound', () => {
    const svc = makeService()
    assert.throws(
      () => svc.requestRefund(makeRefundInput('no-such-payment')),
      NotFoundException
    )
  })

  it('approveRefund: 不存在的 Refund 抛出 NotFound', () => {
    const svc = makeService()
    assert.throws(
      () => svc.approveRefund('no-such', 'x', 'admin'),
      NotFoundException
    )
  })
})
