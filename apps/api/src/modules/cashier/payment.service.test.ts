import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import type { Order, Payment, CreatePaymentInput, CreateOrderInput } from '@m5/types'
import { PaymentService, MockPaymentGateway } from './payment.service'
import { OrderService } from './order.service'
/**
 * Phase-35 T161: PaymentService 单元测试
 *
 * 本测试重点:
 *  - confirm 必须按 paymentId 精确确认
 *  - 跨租户访问拒绝
 *  - providerTxnId 归属错配拒绝
 *  - 幂等返回 (同 paymentId + 同 providerTxnId)
 */
// ── helpers ──
function makeBaseOrder(): Order {
  return {
    id: 'ORD-20260627-00001', tenantId: '', memberId: null,
    status: 'DRAFT', subtotalCents: 0, discountCents: 0, taxCents: 0,
    totalCents: 0, paidCents: 0, refundedCents: 0,
    paymentMethod: null, createdBy: '', clientOrderId: '',
    version: 1, metadata: {},
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    paidAt: null, closedAt: null
  }
}
function makeBasePayment(): Payment {
  return {
    id: 'PAY-20260627-00001', tenantId: '', orderId: '',
    method: 'WECHAT', amountCents: 0, status: 'PENDING',
    providerTxnId: null, idempotencyKey: '',
    paidAt: null, failureReason: null,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
  }
}
function setupOrderService(): OrderService {
  const svc = new OrderService()
  return svc
}
function setupPaymentService(orderService?: OrderService) {
  const os = orderService ?? setupOrderService()
  const gw = new MockPaymentGateway()
  const ps = new PaymentService(os, gw)
  return { os, gw, ps }
}
function createPendingPayment(
  ps: PaymentService,
  orderService: OrderService,
  tenantId: string,
  orderId: string,
  amountCents: number
): Payment {
  // 直接写一笔 PENDING 支付 (绕过 create 的金额校验)
  const payment: Payment = {
    ...makeBasePayment(),
    id: `PAY-test-${Math.random().toString(36).slice(2, 8)}`,
    tenantId,
    orderId,
    method: 'WECHAT',
    amountCents,
    status: 'PENDING',
    idempotencyKey: `${orderId}-WECHAT-${tenantId}-${Date.now()}-${Math.random()}`
  }
  // 通过 mock create 注入
  ;(ps as unknown as { payments: Map<string, Payment> }).payments.set(payment.id, payment)
  ;(ps as unknown as { activeIndex: Map<string, string> }).activeIndex.set(payment.idempotencyKey, payment.id)
  // 同时建一个最小 order (供 markPaid 内部查找)
  if (!orderService.getById(orderId, tenantId)) {
    const order: Order = {
      ...makeBaseOrder(),
      id: orderId,
      tenantId,
      status: 'PENDING',
      totalCents: amountCents
    }
    ;(orderService as unknown as { orders: Map<string, Order> }).orders.set(orderId, order)
  }
  return payment
}
// ═══════════════════════════════════════════════════════════════
//  confirm — 按 paymentId 精确确认
// ═══════════════════════════════════════════════════════════════
describe('PaymentService.confirm 精确确认', () => {
  it('confirm — 单一 PENDING 支付可正常确认', async () => {
    const { ps, os } = setupPaymentService()
    const p1 = createPendingPayment(ps, os, 't-A', 'ord-1', 1000)
    const result = ps.confirm(p1.id, 'txn-001', 't-A')
    assert.equal(result.id, p1.id)
    assert.equal(result.status, 'SUCCESS')
    assert.equal(result.providerTxnId, 'txn-001')
    assert.ok(result.paidAt)
  })
  it('confirm — 多笔 PENDING 时, 按 paymentId 只命中目标, 不影响其他支付', async () => {
    const { ps, os } = setupPaymentService()
    const p1 = createPendingPayment(ps, os, 't-A', 'ord-1', 1000)
    const p2 = createPendingPayment(ps, os, 't-A', 'ord-2', 2000)
    // 网关回调 pay-B (p2)
    const result = ps.confirm(p2.id, 'txn-002', 't-A')
    assert.equal(result.id, p2.id, '确认的是 p2, 不是 p1')
    assert.equal(result.status, 'SUCCESS')
    // pay-A 必须保持 PENDING
    const p1After = ps.getById(p1.id, 't-A')
    assert.ok(p1After)
    assert.equal(p1After?.status, 'PENDING', 'p1 不应被错误推进')
    assert.equal(p1After?.providerTxnId, null, 'p1 不应被绑定流水号')
  })
  it('confirm — 同 providerTxnId 重复回调同一 paymentId, 幂等返回', () => {
    const { ps, os } = setupPaymentService()
    const p1 = createPendingPayment(ps, os, 't-A', 'ord-1', 1000)
    const first = ps.confirm(p1.id, 'txn-001', 't-A')
    const second = ps.confirm(p1.id, 'txn-001', 't-A')
    assert.equal(first.status, 'SUCCESS')
    assert.equal(second.status, 'SUCCESS')
    assert.equal(second.paidAt, first.paidAt, '幂等返回, paidAt 不变')
  })
  it('confirm — providerTxnId 错配 (打到错误 paymentId) 抛 payment_callback_mismatch', () => {
    const { ps, os } = setupPaymentService()
    const p1 = createPendingPayment(ps, os, 't-A', 'ord-1', 1000)
    // 先把 p1 绑定到 txn-001
    ps.confirm(p1.id, 'txn-001', 't-A')
    // 用 txn-001 再去 "打" p2 (错配)
    const p2 = createPendingPayment(ps, os, 't-A', 'ord-2', 2000)
    assert.throws(
      () => ps.confirm(p2.id, 'txn-001', 't-A'),
      (err: Error) => {
        // 接受两种 message 形式 (错配来源不同)
        return /payment_callback_mismatch|already bound to a different payment|does not match/.test(err.message)
      }
    )
    // p2 必须保持 PENDING
    const p2After = ps.getById(p2.id, 't-A')
    assert.equal(p2After?.status, 'PENDING')
  })
  it('confirm — 不存在的 paymentId 抛 NotFound', () => {
    const { ps } = setupPaymentService()
    assert.throws(
      () => ps.confirm('pay-ghost', 'txn-001', 't-A'),
      /not found/
    )
  })
  it('confirm — 跨租户访问抛 cross_tenant_payment_access', () => {
    const { ps, os } = setupPaymentService()
    const p1 = createPendingPayment(ps, os, 't-A', 'ord-1', 1000)
    assert.throws(
      () => ps.confirm(p1.id, 'txn-001', 't-B'),
      /cross_tenant_payment_access/
    )
  })
  it('confirm — 缺少 paymentId 抛 BadRequest', () => {
    const { ps } = setupPaymentService()
    assert.throws(
      () => ps.confirm('', 'txn-001', 't-A'),
      /paymentId/
    )
  })
  it('confirm — 缺少 providerTxnId 抛 BadRequest', () => {
    const { ps } = setupPaymentService()
    assert.throws(
      () => ps.confirm('pay-1', '', 't-A'),
      /providerTxnId/
    )
  })
  it('confirm — 确认后必须联动 Order 进入 PAID', () => {
    const { ps, os } = setupPaymentService()
    const p1 = createPendingPayment(ps, os, 't-A', 'ord-1', 1000)
    ps.confirm(p1.id, 'txn-001', 't-A')
    const order = os.getById('ord-1', 't-A')
    assert.ok(order)
    assert.equal(order?.status, 'PAID', '订单必须联动进入 PAID')
    assert.equal(order?.paidCents, 1000)
  })
})
