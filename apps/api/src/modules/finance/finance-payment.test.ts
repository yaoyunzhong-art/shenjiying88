import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import assert from 'node:assert/strict'
import { FinancePaymentService } from './finance-payment.service'

/**
 * Phase-38 T168: FinancePaymentService 单元测试
 *
 * 覆盖 (≥ 19 断言):
 *  - AC-3: Payment CRUD (create/getById/list/update) 4 断言
 *  - AC-4: Payment 状态机 (PENDING→SUCCESS/FAILED, 跳级防御) 4 断言
 *  - AC-6: 幂等键 (同 key 复用) 2 断言
 *  - AC-5: 乐观锁 (version 冲突) 1 断言
 *  - AC-7: Refund 状态机 (REQUEST/APPROVE/REJECT/COMPLETE) 4 断言
 *  - AC-8: 跨租户防御 1 断言
 *  - AC-9: Cron 超时清理 1 断言
 *  - AC-10: 联动 Ledger callback 1 断言
 *  - AC-11: 审计日志 1 断言
 */

describe('FinancePaymentService', () => {
  let svc: FinancePaymentService

  beforeEach(() => {
    svc = new FinancePaymentService()
  })

  // ============================================================
  // AC-3: Payment CRUD
  // ============================================================

  it('PAY-1: create 初始化 PENDING + version=1 + 写审计', () => {
    const p = svc.create({
      tenantId: 't1',
      orderId: 'ord-001',
      amountCents: 9900,
      currency: 'CNY',
      method: 'WECHAT',
      idempotencyKey: 'idem-key-12345678'
    })
    assert.equal(p.status, 'PENDING')
    assert.equal(p.version, 1)
    assert.equal(p.amountCents, 9900)
    assert.equal(p.idempotencyKey, 'idem-key-12345678')

    const audit = svc.getPaymentAudit(p.id, 't1')
    assert.equal(audit.length, 1)
    assert.equal(audit[0].action, 'CREATE')
    assert.equal(audit[0].toStatus, 'PENDING')
  })

  it('PAY-2: amountCents <= 0 抛 BadRequestException', () => {
    assert.throws(
      () => svc.create({ tenantId: 't1', orderId: 'o1', amountCents: 0, method: 'WECHAT', idempotencyKey: 'k12345678' }),
      /amountCents must be > 0/
    )
    assert.throws(
      () => svc.create({ tenantId: 't1', orderId: 'o1', amountCents: -100, method: 'WECHAT', idempotencyKey: 'k12345678' }),
      /amountCents must be > 0/
    )
  })

  it('PAY-3: getById 跨租户返回 null', () => {
    const p = svc.create({ tenantId: 't1', orderId: 'o1', amountCents: 100, method: 'CASH', idempotencyKey: 'k-12345678-1' })
    assert.ok(svc.getById(p.id, 't1'))
    assert.equal(svc.getById(p.id, 't2'), null)
    assert.equal(svc.getById('not-exist', 't1'), null)
  })

  it('PAY-4: list 按 tenantId + status + method 过滤', () => {
    svc.create({ tenantId: 't1', orderId: 'o1', amountCents: 100, method: 'WECHAT', idempotencyKey: 'k1-12345678' })
    svc.create({ tenantId: 't1', orderId: 'o2', amountCents: 200, method: 'ALIPAY', idempotencyKey: 'k2-12345678' })
    svc.create({ tenantId: 't2', orderId: 'o3', amountCents: 300, method: 'WECHAT', idempotencyKey: 'k3-12345678' })

    const t1All = svc.list({ tenantId: 't1' })
    assert.equal(t1All.total, 2)
    const t1Wechat = svc.list({ tenantId: 't1', method: 'WECHAT' })
    assert.equal(t1Wechat.total, 1)
  })

  it('PAY-5: update 乐观锁 version 冲突抛 ConflictException', () => {
    const p = svc.create({ tenantId: 't1', orderId: 'o1', amountCents: 100, method: 'WECHAT', idempotencyKey: 'k-12345678-1' })
    const ok = svc.update(p.id, 't1', 1, { transactionId: 'wx-001' })
    assert.equal(ok.version, 2)
    assert.equal(ok.transactionId, 'wx-001')
    // 用旧 version 再更新应抛错
    assert.throws(
      () => svc.update(p.id, 't1', 1, { transactionId: 'wx-002' }),
      /version mismatch/
    )
  })

  // ============================================================
  // AC-4: Payment 状态机
  // ============================================================

  it('STATE-1: PENDING → SUCCESS 合法', () => {
    const p = svc.create({ tenantId: 't1', orderId: 'o1', amountCents: 100, method: 'WECHAT', idempotencyKey: 'k-12345678-1' })
    const success = svc.markSuccess(p.id, 't1', 'wx-tx-001')
    assert.equal(success.status, 'SUCCESS')
    assert.equal(success.transactionId, 'wx-tx-001')
    assert.ok(success.successAt)
    assert.equal(success.version, 2)
  })

  it('STATE-2: PENDING → FAILED 合法', () => {
    const p = svc.create({ tenantId: 't1', orderId: 'o1', amountCents: 100, method: 'WECHAT', idempotencyKey: 'k-12345678-1' })
    const failed = svc.markFailed(p.id, 't1', 'network error')
    assert.equal(failed.status, 'FAILED')
    assert.equal(failed.failureReason, 'network error')
  })

  it('STATE-3: 跳级 PENDING → REFUNDED 防御 (非 SUCCESS 不可 refund)', () => {
    const p = svc.create({ tenantId: 't1', orderId: 'o1', amountCents: 100, method: 'WECHAT', idempotencyKey: 'k-12345678-1' })
    // PENDING 直接 requestRefund 应抛 ConflictException
    assert.throws(
      () => svc.requestRefund({ tenantId: 't1', paymentId: p.id, orderId: 'o1', amountCents: 50, reason: 'test', requestedBy: 'admin' }),
      /payment status is PENDING, cannot refund/
    )
  })

  it('STATE-4: SUCCESS → REFUNDED 通过 completeRefund 触发', () => {
    const p = svc.create({ tenantId: 't1', orderId: 'o1', amountCents: 100, method: 'WECHAT', idempotencyKey: 'k-12345678-1' })
    svc.markSuccess(p.id, 't1', 'wx-tx-001')
    const refund = svc.requestRefund({ tenantId: 't1', paymentId: p.id, orderId: 'o1', amountCents: 50, reason: 'partial refund', requestedBy: 'admin' })
    svc.approveRefund(refund.id, 't1', 'manager')
    svc.completeRefund(refund.id, 't1', 'wx-refund-001')

    const finalPayment = svc.getById(p.id, 't1')!
    assert.equal(finalPayment.status, 'REFUNDED')

    const finalRefund = svc.getRefundById(refund.id, 't1')!
    assert.equal(finalRefund.status, 'COMPLETED')
    assert.equal(finalRefund.refundTransactionId, 'wx-refund-001')
  })

  // ============================================================
  // AC-6: 幂等键
  // ============================================================

  it('IDEM-1: 同 (tenantId, idempotencyKey) 重复创建 → 返回原 Payment', () => {
    const p1 = svc.create({ tenantId: 't1', orderId: 'o1', amountCents: 100, method: 'WECHAT', idempotencyKey: 'k-same-12345678' })
    const p2 = svc.create({ tenantId: 't1', orderId: 'o1', amountCents: 100, method: 'WECHAT', idempotencyKey: 'k-same-12345678' })
    assert.equal(p1.id, p2.id, 'should return same Payment')
    // 不应重复创建 → list.total = 1
    assert.equal(svc.list({ tenantId: 't1' }).total, 1)
  })

  it('IDEM-2: 不同 idempotencyKey 创建独立 Payment', () => {
    svc.create({ tenantId: 't1', orderId: 'o1', amountCents: 100, method: 'WECHAT', idempotencyKey: 'k-diff-a-1234567' })
    svc.create({ tenantId: 't1', orderId: 'o1', amountCents: 100, method: 'WECHAT', idempotencyKey: 'k-diff-b-1234567' })
    assert.equal(svc.list({ tenantId: 't1' }).total, 2)
  })

  it('IDEM-3: 幂等键长度 < 8 抛 BadRequestException', () => {
    assert.throws(
      () => svc.create({ tenantId: 't1', orderId: 'o1', amountCents: 100, method: 'WECHAT', idempotencyKey: 'short' }),
      /idempotencyKey required/
    )
  })

  // ============================================================
  // AC-7: Refund 状态机
  // ============================================================

  it('REFUND-1: requestRefund 创建 REQUESTED', () => {
    const p = svc.create({ tenantId: 't1', orderId: 'o1', amountCents: 100, method: 'WECHAT', idempotencyKey: 'k-12345678-1' })
    svc.markSuccess(p.id, 't1')
    const r = svc.requestRefund({ tenantId: 't1', paymentId: p.id, orderId: 'o1', amountCents: 100, reason: 'customer request', requestedBy: 'cs' })
    assert.equal(r.status, 'REQUESTED')
    assert.equal(r.requestedBy, 'cs')
  })

  it('REFUND-2: REQUESTED → APPROVED → COMPLETED 流程', () => {
    const p = svc.create({ tenantId: 't1', orderId: 'o1', amountCents: 100, method: 'WECHAT', idempotencyKey: 'k-12345678-1' })
    svc.markSuccess(p.id, 't1')
    const r = svc.requestRefund({ tenantId: 't1', paymentId: p.id, orderId: 'o1', amountCents: 100, reason: 'test', requestedBy: 'cs' })
    svc.approveRefund(r.id, 't1', 'manager')
    assert.equal(svc.getRefundById(r.id, 't1')!.status, 'APPROVED')
    svc.completeRefund(r.id, 't1', 'wx-refund-001')
    assert.equal(svc.getRefundById(r.id, 't1')!.status, 'COMPLETED')
  })

  it('REFUND-3: REQUESTED → REJECTED 流程', () => {
    const p = svc.create({ tenantId: 't1', orderId: 'o1', amountCents: 100, method: 'WECHAT', idempotencyKey: 'k-12345678-1' })
    svc.markSuccess(p.id, 't1')
    const r = svc.requestRefund({ tenantId: 't1', paymentId: p.id, orderId: 'o1', amountCents: 100, reason: 'test', requestedBy: 'cs' })
    svc.rejectRefund(r.id, 't1', 'policy violation', 'compliance')
    const final = svc.getRefundById(r.id, 't1')!
    assert.equal(final.status, 'REJECTED')
    assert.equal(final.rejectionReason, 'policy violation')
  })

  it('REFUND-4: Refund 跳级防御 (REQUESTED → COMPLETE 不可跳)', () => {
    const p = svc.create({ tenantId: 't1', orderId: 'o1', amountCents: 100, method: 'WECHAT', idempotencyKey: 'k-12345678-1' })
    svc.markSuccess(p.id, 't1')
    const r = svc.requestRefund({ tenantId: 't1', paymentId: p.id, orderId: 'o1', amountCents: 100, reason: 'test', requestedBy: 'cs' })
    assert.throws(() => svc.completeRefund(r.id, 't1'), /status is REQUESTED, cannot COMPLETE/)
  })

  // ============================================================
  // AC-8: 跨租户防御
  // ============================================================

  it('CROSS-1: 跨租户 markSuccess 抛 NotFoundException', () => {
    const p = svc.create({ tenantId: 't1', orderId: 'o1', amountCents: 100, method: 'WECHAT', idempotencyKey: 'k-12345678-1' })
    assert.throws(() => svc.markSuccess(p.id, 't2'), /not found/)
  })

  // ============================================================
  // AC-9: Cron 超时清理
  // ============================================================

  it('CRON-1: scanExpiredPayments 检测 PENDING > 15min 自动 FAILED', () => {
    const p = svc.create({ tenantId: 't1', orderId: 'o1', amountCents: 100, method: 'WECHAT', idempotencyKey: 'k-12345678-1' })
    // 设置 createdAt 为 20 分钟前 (通过重置 + 内部时间戳)
    const internal = svc as any
    internal.payments.get(p.id)!.createdAt = new Date(Date.now() - 20 * 60 * 1000).toISOString()

    const expired = svc.scanExpiredPayments()
    assert.ok(expired.length >= 1)
    const final = svc.getById(p.id, 't1')!
    assert.equal(final.status, 'FAILED')
    assert.equal(final.failureReason, 'timeout by cron')
  })

  // ============================================================
  // AC-10: 联动 Ledger
  // ============================================================

  it('LEDGER-1: Payment.SUCCESS 触发 Ledger.REVENUE 回调', () => {
    const ledgerEntries: any[] = []
    svc.setLedgerCallback((entry) => ledgerEntries.push(entry))

    const p = svc.create({ tenantId: 't1', orderId: 'o1', amountCents: 9900, method: 'WECHAT', idempotencyKey: 'k-12345678-1' })
    svc.markSuccess(p.id, 't1', 'wx-tx-001')
    assert.equal(ledgerEntries.length, 1)
    assert.equal(ledgerEntries[0].type, 'REVENUE')
    assert.equal(ledgerEntries[0].amount, 9900)
    assert.equal(ledgerEntries[0].orderId, 'o1')
  })

  it('LEDGER-2: Refund.COMPLETED 触发 Ledger.REFUND 回调', () => {
    const ledgerEntries: any[] = []
    svc.setLedgerCallback((entry) => ledgerEntries.push(entry))

    const p = svc.create({ tenantId: 't1', orderId: 'o1', amountCents: 9900, method: 'WECHAT', idempotencyKey: 'k-12345678-1' })
    svc.markSuccess(p.id, 't1', 'wx-tx-001')
    ledgerEntries.length = 0  // 清空 REVENUE
    const r = svc.requestRefund({ tenantId: 't1', paymentId: p.id, orderId: 'o1', amountCents: 5000, reason: 'partial', requestedBy: 'cs' })
    svc.approveRefund(r.id, 't1', 'mgr')
    svc.completeRefund(r.id, 't1', 'wx-refund-001')
    assert.ok(ledgerEntries.some(e => e.type === 'REFUND' && e.amount === 5000))
  })

  // ============================================================
  // AC-11: 审计日志
  // ============================================================

  it('AUDIT-1: 每次状态变更写入 audit entry', () => {
    const p = svc.create({ tenantId: 't1', orderId: 'o1', amountCents: 100, method: 'WECHAT', idempotencyKey: 'k-12345678-1' })
    svc.markSuccess(p.id, 't1', 'wx-tx-001')

    const audit = svc.getPaymentAudit(p.id, 't1')
    assert.ok(audit.length >= 2)
    assert.equal(audit[0].action, 'CREATE')
    assert.equal(audit[1].action, 'MARK_SUCCESS')
    assert.equal(audit[1].fromStatus, 'PENDING')
    assert.equal(audit[1].toStatus, 'SUCCESS')
  })

  it('AUDIT-2: getPaymentAudit 跨租户返回空数组', () => {
    const p = svc.create({ tenantId: 't1', orderId: 'o1', amountCents: 100, method: 'WECHAT', idempotencyKey: 'k-12345678-1' })
    assert.equal(svc.getPaymentAudit(p.id, 't2').length, 0)
  })
})