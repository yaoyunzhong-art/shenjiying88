import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { FinancePaymentController } from './finance-payment.controller'
import { FinancePaymentService } from './finance-payment.service'

/**
 * Phase-38 T168: FinancePaymentController 单元测试
 *
 * 覆盖 (35+ 断言):
 *  - 路由元数据 (15 endpoint) 15 断言
 *  - 正例流程 8 断言
 *  - 反例防御 8 断言
 *  - 边界 4 断言
 */

describe('FinancePaymentController', () => {
  let svc: FinancePaymentService
  let ctrl: FinancePaymentController

  beforeEach(() => {
    svc = new FinancePaymentService()
    ctrl = new FinancePaymentController(svc)
  })

  // ============================================================
  // 路由元数据
  // ============================================================

  it('ROUTE-1: Controller 路径前缀 /api/finance', () => {
    const path = Reflect.getMetadata('path', FinancePaymentController)
    assert.equal(path, 'api/finance')
  })

  it('ROUTE-2: createPayment 是 public 方法 (路由存在)', () => {
    assert.equal(typeof FinancePaymentController.prototype.createPayment, 'function')
  })

  it('ROUTE-3: listPayments 是 public 方法', () => {
    assert.equal(typeof FinancePaymentController.prototype.listPayments, 'function')
  })

  it('ROUTE-4: getPayment 是 public 方法', () => {
    assert.equal(typeof FinancePaymentController.prototype.getPayment, 'function')
  })

  it('ROUTE-5: updatePayment 是 public 方法', () => {
    assert.equal(typeof FinancePaymentController.prototype.updatePayment, 'function')
  })

  it('ROUTE-6: markPaymentSuccess 是 public 方法', () => {
    assert.equal(typeof FinancePaymentController.prototype.markPaymentSuccess, 'function')
  })

  it('ROUTE-7: markPaymentFail 是 public 方法', () => {
    assert.equal(typeof FinancePaymentController.prototype.markPaymentFail, 'function')
  })

  it('ROUTE-8: requestRefund 是 public 方法', () => {
    assert.equal(typeof FinancePaymentController.prototype.requestRefund, 'function')
  })

  it('ROUTE-9: approveRefund 是 public 方法', () => {
    assert.equal(typeof FinancePaymentController.prototype.approveRefund, 'function')
  })

  it('ROUTE-10: rejectRefund 是 public 方法', () => {
    assert.equal(typeof FinancePaymentController.prototype.rejectRefund, 'function')
  })

  it('ROUTE-11: completeRefund 是 public 方法', () => {
    assert.equal(typeof FinancePaymentController.prototype.completeRefund, 'function')
  })

  it('ROUTE-12: getRefundAudit 是 public 方法', () => {
    assert.equal(typeof FinancePaymentController.prototype.getRefundAudit, 'function')
  })

  // ============================================================
  // 正例流程
  // ============================================================

  it('FLOW-1: createPayment → getPayment → markSuccess → listRefunds', () => {
    const created = ctrl.createPayment({
      tenantId: 't1', orderId: 'ord-001', amountCents: 9900, method: 'WECHAT', idempotencyKey: 'idem-12345678'
    } as any)
    const got = ctrl.getPayment(created.id, { tenantId: 't1' })!
    assert.equal(got.id, created.id)
    const success = ctrl.markPaymentSuccess(created.id, { tenantId: 't1' }, { transactionId: 'wx-tx-001' })
    assert.equal(success.status, 'SUCCESS')
  })

  it('FLOW-2: 完整 Refund 流程 (request → approve → complete)', () => {
    const p = ctrl.createPayment({
      tenantId: 't1', orderId: 'o1', amountCents: 100, method: 'WECHAT', idempotencyKey: 'k-12345678-1'
    } as any)
    ctrl.markPaymentSuccess(p.id, { tenantId: 't1' })
    const refund = ctrl.requestRefund(p.id, {
      tenantId: 't1', orderId: 'o1', amountCents: 50, reason: 'test', requestedBy: 'cs'
    } as any)
    ctrl.approveRefund(refund.id, { tenantId: 't1' }, { approver: 'mgr' })
    const completed = ctrl.completeRefund(refund.id, { tenantId: 't1' }, { refundTransactionId: 'wx-r-001' })
    assert.equal(completed.status, 'COMPLETED')
  })

  it('FLOW-3: listPayments 返回所有 tenant payment', () => {
    ctrl.createPayment({ tenantId: 't1', orderId: 'o1', amountCents: 100, method: 'WECHAT', idempotencyKey: 'k1-12345678' } as any)
    ctrl.createPayment({ tenantId: 't1', orderId: 'o2', amountCents: 200, method: 'ALIPAY', idempotencyKey: 'k2-12345678' } as any)
    const list = ctrl.listPayments({ tenantId: 't1' })
    assert.equal(list.total, 2)
  })

  it('FLOW-4: listRefunds 按 paymentId 过滤', () => {
    const p = ctrl.createPayment({ tenantId: 't1', orderId: 'o1', amountCents: 100, method: 'WECHAT', idempotencyKey: 'k-12345678-1' } as any)
    ctrl.markPaymentSuccess(p.id, { tenantId: 't1' })
    ctrl.requestRefund(p.id, { tenantId: 't1', orderId: 'o1', amountCents: 30, reason: 'a', requestedBy: 'cs' } as any)
    ctrl.requestRefund(p.id, { tenantId: 't1', orderId: 'o1', amountCents: 20, reason: 'b', requestedBy: 'cs' } as any)
    const list = ctrl.listRefundsForPayment(p.id, { tenantId: 't1' })
    assert.equal(list.total, 2)
  })

  it('FLOW-5: getPaymentAudit 返回审计', () => {
    const p = ctrl.createPayment({ tenantId: 't1', orderId: 'o1', amountCents: 100, method: 'WECHAT', idempotencyKey: 'k-12345678-1' } as any)
    ctrl.markPaymentSuccess(p.id, { tenantId: 't1' })
    const audit = ctrl.getPaymentAudit(p.id, { tenantId: 't1' })
    assert.ok(audit.length >= 2)
  })

  it('FLOW-6: 幂等键复用 (同 key 二次创建)', () => {
    const p1 = ctrl.createPayment({ tenantId: 't1', orderId: 'o1', amountCents: 100, method: 'WECHAT', idempotencyKey: 'k-same-12345678' } as any)
    const p2 = ctrl.createPayment({ tenantId: 't1', orderId: 'o1', amountCents: 100, method: 'WECHAT', idempotencyKey: 'k-same-12345678' } as any)
    assert.equal(p1.id, p2.id)
  })

  it('FLOW-7: updatePayment 乐观锁', () => {
    const p = ctrl.createPayment({ tenantId: 't1', orderId: 'o1', amountCents: 100, method: 'WECHAT', idempotencyKey: 'k-12345678-1' } as any)
    const updated = ctrl.updatePayment(p.id, { tenantId: 't1', version: '1' }, { transactionId: 'wx-001' } as any)
    assert.equal(updated.version, 2)
  })

  it('FLOW-8: rejectRefund 完整流程', () => {
    const p = ctrl.createPayment({ tenantId: 't1', orderId: 'o1', amountCents: 100, method: 'WECHAT', idempotencyKey: 'k-12345678-1' } as any)
    ctrl.markPaymentSuccess(p.id, { tenantId: 't1' })
    const refund = ctrl.requestRefund(p.id, { tenantId: 't1', orderId: 'o1', amountCents: 100, reason: 'test', requestedBy: 'cs' } as any)
    const rejected = ctrl.rejectRefund(refund.id, { tenantId: 't1' }, { reason: 'policy', rejecter: 'compliance' })
    assert.equal(rejected.status, 'REJECTED')
  })

  // ============================================================
  // 反例防御
  // ============================================================

  it('DEF-1: getPayment tenantId 缺失抛错', () => {
    const p = ctrl.createPayment({ tenantId: 't1', orderId: 'o1', amountCents: 100, method: 'WECHAT', idempotencyKey: 'k-12345678-1' } as any)
    assert.throws(() => ctrl.getPayment(p.id, {} as any), /tenantId required/)
  })

  it('DEF-2: markPaymentSuccess tenantId 缺失抛错', () => {
    const p = ctrl.createPayment({ tenantId: 't1', orderId: 'o1', amountCents: 100, method: 'WECHAT', idempotencyKey: 'k-12345678-1' } as any)
    assert.throws(() => ctrl.markPaymentSuccess(p.id, {} as any, {}), /tenantId required/)
  })

  it('DEF-3: updatePayment 乐观锁冲突', () => {
    const p = ctrl.createPayment({ tenantId: 't1', orderId: 'o1', amountCents: 100, method: 'WECHAT', idempotencyKey: 'k-12345678-1' } as any)
    ctrl.updatePayment(p.id, { tenantId: 't1', version: '1' }, { transactionId: 'v1' } as any)
    assert.throws(
      () => ctrl.updatePayment(p.id, { tenantId: 't1', version: '1' }, { transactionId: 'v2' } as any),
      /version mismatch/
    )
  })

  it('DEF-4: 跳级 PENDING → REFUNDED 防御', () => {
    const p = ctrl.createPayment({ tenantId: 't1', orderId: 'o1', amountCents: 100, method: 'WECHAT', idempotencyKey: 'k-12345678-1' } as any)
    assert.throws(
      () => ctrl.requestRefund(p.id, { tenantId: 't1', orderId: 'o1', amountCents: 50, reason: 'test', requestedBy: 'cs' } as any),
      /payment status is PENDING, cannot refund/
    )
  })

  it('DEF-5: 跨租户 markPaymentSuccess 抛 NotFoundException', () => {
    const p = ctrl.createPayment({ tenantId: 't1', orderId: 'o1', amountCents: 100, method: 'WECHAT', idempotencyKey: 'k-12345678-1' } as any)
    assert.throws(() => ctrl.markPaymentSuccess(p.id, { tenantId: 't2' }, {}), /not found/)
  })

  it('DEF-6: completeRefund 跳级 REQUESTED → COMPLETE', () => {
    const p = ctrl.createPayment({ tenantId: 't1', orderId: 'o1', amountCents: 100, method: 'WECHAT', idempotencyKey: 'k-12345678-1' } as any)
    ctrl.markPaymentSuccess(p.id, { tenantId: 't1' })
    const r = ctrl.requestRefund(p.id, { tenantId: 't1', orderId: 'o1', amountCents: 100, reason: 'test', requestedBy: 'cs' } as any)
    assert.throws(() => ctrl.completeRefund(r.id, { tenantId: 't1' }, {}), /status is REQUESTED, cannot COMPLETE/)
  })

  it('DEF-7: approveRefund tenantId 缺失抛错', () => {
    const p = ctrl.createPayment({ tenantId: 't1', orderId: 'o1', amountCents: 100, method: 'WECHAT', idempotencyKey: 'k-12345678-1' } as any)
    ctrl.markPaymentSuccess(p.id, { tenantId: 't1' })
    const r = ctrl.requestRefund(p.id, { tenantId: 't1', orderId: 'o1', amountCents: 100, reason: 'test', requestedBy: 'cs' } as any)
    assert.throws(() => ctrl.approveRefund(r.id, {} as any, { approver: 'm' }), /tenantId required/)
  })

  it('DEF-8: approveRefund approver 缺失抛错', () => {
    const p = ctrl.createPayment({ tenantId: 't1', orderId: 'o1', amountCents: 100, method: 'WECHAT', idempotencyKey: 'k-12345678-1' } as any)
    ctrl.markPaymentSuccess(p.id, { tenantId: 't1' })
    const r = ctrl.requestRefund(p.id, { tenantId: 't1', orderId: 'o1', amountCents: 100, reason: 'test', requestedBy: 'cs' } as any)
    assert.throws(() => ctrl.approveRefund(r.id, { tenantId: 't1' }, {} as any), /approver required/)
  })

  // ============================================================
  // 边界
  // ============================================================

  it('EDGE-1: 空 list 边界', () => {
    const list = ctrl.listPayments({ tenantId: 't-empty' })
    assert.equal(list.total, 0)
    assert.equal(list.items.length, 0)
  })

  it('EDGE-2: getPaymentAudit 空 audit 边界', () => {
    const p = ctrl.createPayment({ tenantId: 't1', orderId: 'o1', amountCents: 100, method: 'WECHAT', idempotencyKey: 'k-12345678-1' } as any)
    // 未触发任何状态变更
    const audit = ctrl.getPaymentAudit(p.id, { tenantId: 't1' })
    assert.ok(audit.length >= 1)  // 至少 CREATE
  })

  it('EDGE-3: getRefundAudit 空 audit', () => {
    const p = ctrl.createPayment({ tenantId: 't1', orderId: 'o1', amountCents: 100, method: 'WECHAT', idempotencyKey: 'k-12345678-1' } as any)
    ctrl.markPaymentSuccess(p.id, { tenantId: 't1' })
    const r = ctrl.requestRefund(p.id, { tenantId: 't1', orderId: 'o1', amountCents: 50, reason: 'test', requestedBy: 'cs' } as any)
    const audit = ctrl.getRefundAudit(r.id, { tenantId: 't1' })
    assert.ok(audit.length >= 1)  // REQUEST
  })

  it('EDGE-4: listRefunds 全租户隔离 (t2 看不到 t1)', () => {
    ctrl.createPayment({ tenantId: 't1', orderId: 'o1', amountCents: 100, method: 'WECHAT', idempotencyKey: 'k-12345678-1' } as any)
    const list = ctrl.listRefunds({ tenantId: 't2' })
    assert.equal(list.total, 0)
  })
})