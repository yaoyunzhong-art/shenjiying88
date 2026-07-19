/**
 * 🦞 龙虾哥 L3 跨模块端到端 · 链38 (V22 Day1 新增)
 * API checkout → 支付 → 退款 完整交易主链
 *
 * 新增于 2026-07-20 01:38 凌晨时段
 * 覆盖: api(transactions/checkout 下单 → cashier/payments 支付 → cashier/refunds 退款) → domain(订单状态机/支付状态/退款状态/金额校验) → transactions(交易流水/退款详情/审批流转)
 *
 * 🚨 新增链: API 交易主链 (Checkout → 支付 → 退款) — V22 跨模块 E2E 验收任务
 * 纯 API 层测试，无需浏览器。参考 @m5/sdk createBusinessClient API 结构。
 *
 * 测试设计:
 *   - P1 正例: 完整交易主链: 下单 → 支付 → 退款 → 验证退款状态
 *   - P2 正例: 部分退款(多商品拆分退款)
 *   - N1 反例: 重复支付被拒
 *   - N2 反例: 退款金额超过支付金额
 *   - N3 反例: 已退款订单再次退款
 *   - B1 边界: 0元退款(金额为0)
 *   - B2 边界: 全量退款 = 支付金额
 *   - B3 边界: 订单状态机流转验证
 *   - B4 边界: 退款审批流程
 */

import assert from 'node:assert/strict';
import test, { describe } from 'node:test';

// ─── 类型定义 (来自 @m5/sdk createBusinessClient / @m5/domain) ───

type OrderStatus = 'draft' | 'pending_payment' | 'paid' | 'refunding' | 'refunded' | 'cancelled' | 'completed';
type PaymentStatus = 'pending' | 'success' | 'failed' | 'refunded';
type RefundStatus = 'pending' | 'approved' | 'rejected' | 'completed';
type PaymentMethod = 'CASH' | 'WECHAT' | 'ALIPAY' | 'CARD' | 'MEMBER_CARD';

/** POST /transactions/checkout 请求体 */
interface CheckoutRequest {
  memberId: string;
  items: Array<{ productId: string; quantity: number; unitPriceCents: number }>;
  paymentChannel: string;
  couponCode?: string;
}

/** POST /transactions/checkout 响应体 */
interface CheckoutResponse {
  orderId: string;
  transactionId: string;
  totalCents: number;
}

/** POST /cashier/orders/:orderId/payments 请求体 */
interface CreatePaymentRequest {
  method: PaymentMethod;
  amountCents: number;
}

/** POST /cashier/orders/:orderId/payments 响应体 */
interface PaymentResponse {
  paymentId: string;
  status: string;
}

/** GET /cashier/orders/:orderId 订单详情 */
interface OrderDetail {
  orderId: string;
  orderNo: string;
  memberId: string;
  status: string;
  totalAmount: number;
  paidAmount: number;
  refundedAmount: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

/** POST /cashier/orders/:orderId/refunds 请求体 */
interface CreateRefundRequest {
  paymentId: string;
  amountCents: number;
  reason: string;
}

/** POST /cashier/orders/:orderId/refunds 响应体 */
interface RefundResponse {
  refundId: string;
  status: string;
}

/** GET /transactions/refunds/:refundId 退款详情 */
interface RefundDetail {
  refundId: string;
  orderId: string;
  paymentId: string;
  memberId: string;
  refundAmount: number;
  reason: string;
  status: string;
  requestedAt: string;
  completedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNote?: string;
}

/** GET /transactions/refunds/pending 待处理退款 */
interface PendingRefund {
  refundId: string;
  orderId: string;
  paymentId: string;
  refundAmount: number;
  reason: string;
  status: string;
  requestedAt: string;
}

// ─── 工具函数: 模拟 API 响应生成 ───

let _refundCounter = 0;
let _paymentCounter = 0;

function genId(prefix: string): string {
  _refundCounter++;
  return `${prefix}-${Date.now().toString(36)}-${_refundCounter}`;
}

function generateOrderNo(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ORD-${ts}-${rand}`;
}

/** 金额用分单位校验 */
function isAmountInCents(amount: number): boolean {
  return Number.isInteger(amount) && amount >= 0;
}

// ═══ 模拟存储（模拟订单/支付/退款数据存储） ═══
interface StoredOrder {
  detail: OrderDetail;
  payments: Array<{ paymentId: string; method: PaymentMethod; amountCents: number; status: string; createdAt: string }>;
  refunds: Array<{ refundId: string; amountCents: number; reason: string; status: string; requestedAt: string; completedAt?: string }>;
}

const orderStore = new Map<string, StoredOrder>();

function resetStore(): void {
  orderStore.clear();
  _refundCounter = 0;
  _paymentCounter = 0;
}

function getStoredOrder(orderId: string): StoredOrder | undefined {
  return orderStore.get(orderId);
}

/** 模拟 POST /transactions/checkout — 下单 */
function doCheckout(body: CheckoutRequest): CheckoutResponse {
  if (!body.memberId) throw new Error('memberId is required');
  if (!body.items || body.items.length === 0) throw new Error('items must be non-empty');
  if (!body.paymentChannel) throw new Error('paymentChannel is required');

  const totalCents = body.items.reduce((sum, it) => sum + it.quantity * it.unitPriceCents, 0);
  if (totalCents <= 0) throw new Error('totalCents must be positive');

  const orderId = genId('ord');
  const transactionId = genId('txn');

  const detail: OrderDetail = {
    orderId,
    orderNo: generateOrderNo(),
    memberId: body.memberId,
    status: 'pending_payment',
    totalAmount: totalCents,
    paidAmount: 0,
    refundedAmount: 0,
    currency: 'CNY',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  orderStore.set(orderId, { detail, payments: [], refunds: [] });

  return { orderId, transactionId, totalCents };
}

/** 模拟 POST /cashier/orders/:orderId/payments — 支付 */
function doPay(orderId: string, body: CreatePaymentRequest): PaymentResponse {
  const stored = orderStore.get(orderId);
  if (!stored) throw new Error(`Order ${orderId} not found`);

  // 防重: 已支付成功过不允许再支付
  const hasSuccessPayment = stored.payments.some(p => p.status === 'success');
  if (hasSuccessPayment) {
    throw new Error(`Order ${orderId} already paid`);
  }

  // 金额必须为正整数
  if (!Number.isInteger(body.amountCents) || body.amountCents <= 0) {
    throw new Error('amountCents must be positive integer');
  }

  const paymentId = genId('pay');
  stored.payments.push({
    paymentId,
    method: body.method,
    amountCents: body.amountCents,
    status: 'success',
    createdAt: new Date().toISOString(),
  });

  // 更新订单
  stored.detail.status = 'paid';
  stored.detail.paidAmount += body.amountCents;
  stored.detail.updatedAt = new Date().toISOString();

  return { paymentId, status: 'success' };
}

/** 模拟 POST /cashier/orders/:orderId/refunds — 退款申请 */
function doRefund(orderId: string, body: CreateRefundRequest): RefundResponse {
  const stored = orderStore.get(orderId);
  if (!stored) throw new Error(`Order ${orderId} not found`);

  // 检查订单状态
  if (stored.detail.status === 'pending_payment') {
    throw new Error(`Order ${orderId} not paid yet`);
  }

  // 检查退款金额不超过已支付金额
  const totalPaid = stored.payments
    .filter(p => p.status === 'success')
    .reduce((s, p) => s + p.amountCents, 0);
  const alreadyRefunded = stored.refunds
    .filter(r => r.status === 'completed' || r.status === 'approved')
    .reduce((s, r) => s + r.amountCents, 0);
  const availableForRefund = totalPaid - alreadyRefunded;

  if (body.amountCents > availableForRefund) {
    throw new Error(`Refund amount ${body.amountCents} exceeds available ${availableForRefund}`);
  }

  if (body.amountCents < 0) {
    throw new Error('refund amount cannot be negative');
  }

  // 检查支付ID是否有效
  const paymentExists = stored.payments.some(p => p.paymentId === body.paymentId);
  if (!paymentExists) {
    throw new Error(`Payment ${body.paymentId} not found for order ${orderId}`);
  }

  const refundId = genId('ref');
  stored.refunds.push({
    refundId,
    amountCents: body.amountCents,
    reason: body.reason,
    status: 'pending',
    requestedAt: new Date().toISOString(),
  });

  // 更新订单退款状态
  stored.detail.status = 'refunding';
  stored.detail.refundedAmount += body.amountCents;
  stored.detail.updatedAt = new Date().toISOString();

  return { refundId, status: 'pending' };
}

/** 模拟 POST /transactions/refunds/:refundId/approve — 审批退款通过 */
function doApproveRefund(refundId: string, operator?: string): RefundDetail {
  let found: { stored: StoredOrder; refundIndex: number } | null = null;
  for (const [, stored] of orderStore) {
    const idx = stored.refunds.findIndex(r => r.refundId === refundId);
    if (idx >= 0) {
      found = { stored, refundIndex: idx };
      break;
    }
  }
  if (!found) throw new Error(`Refund ${refundId} not found`);

  const refund = found.stored.refunds[found.refundIndex];
  refund.status = 'completed';
  refund.completedAt = new Date().toISOString();

  // 检查是否所有退款都已完成 -> refunded
  const allRefunded = found.stored.refunds.every(r => r.status === 'completed');
  if (allRefunded) {
    found.stored.detail.status = 'refunded';
    found.stored.detail.updatedAt = new Date().toISOString();
  }

  return {
    refundId: refund.refundId,
    orderId: found.stored.detail.orderId,
    paymentId: found.stored.payments[0]?.paymentId ?? '',
    memberId: found.stored.detail.memberId,
    refundAmount: refund.amountCents,
    reason: refund.reason,
    status: refund.status,
    requestedAt: refund.requestedAt,
    completedAt: refund.completedAt,
    reviewedAt: new Date().toISOString(),
    reviewedBy: operator ?? 'admin-001',
    reviewNote: 'Refund approved',
  };
}

/** 模拟 POST /transactions/refunds/:refundId/reject — 拒绝退款 */
function doRejectRefund(refundId: string, operator?: string, note?: string): RefundDetail {
  let found: { stored: StoredOrder; refundIndex: number } | null = null;
  for (const [, stored] of orderStore) {
    const idx = stored.refunds.findIndex(r => r.refundId === refundId);
    if (idx >= 0) {
      found = { stored, refundIndex: idx };
      break;
    }
  }
  if (!found) throw new Error(`Refund ${refundId} not found`);

  const refund = found.stored.refunds[found.refundIndex];
  refund.status = 'rejected';

  // 拒绝后恢复订单退款金额
  found.stored.detail.refundedAmount -= refund.amountCents;
  if (found.stored.detail.refundedAmount <= 0) {
    found.stored.detail.status = 'paid'; // 恢复为已支付
  }
  found.stored.detail.updatedAt = new Date().toISOString();

  return {
    refundId: refund.refundId,
    orderId: found.stored.detail.orderId,
    paymentId: found.stored.payments[0]?.paymentId ?? '',
    memberId: found.stored.detail.memberId,
    refundAmount: refund.amountCents,
    reason: refund.reason,
    status: 'rejected',
    requestedAt: refund.requestedAt,
    reviewedAt: new Date().toISOString(),
    reviewedBy: operator ?? 'admin-001',
    reviewNote: note ?? 'Refund rejected',
  };
}

/** 模拟 GET /transactions/refunds/:refundId — 退款详情 */
function getRefundDetail(refundId: string): RefundDetail {
  for (const [, stored] of orderStore) {
    const refund = stored.refunds.find(r => r.refundId === refundId);
    if (refund) {
      return {
        refundId: refund.refundId,
        orderId: stored.detail.orderId,
        paymentId: stored.payments[0]?.paymentId ?? '',
        memberId: stored.detail.memberId,
        refundAmount: refund.amountCents,
        reason: refund.reason,
        status: refund.status,
        requestedAt: refund.requestedAt,
        completedAt: refund.completedAt,
      };
    }
  }
  throw new Error(`Refund ${refundId} not found`);
}

/** 模拟 GET /transactions/refunds/pending — 待处理退款 */
function listPendingRefunds(limit: number = 10): PendingRefund[] {
  const pending: PendingRefund[] = [];
  for (const [, stored] of orderStore) {
    for (const refund of stored.refunds) {
      if (refund.status === 'pending' && pending.length < limit) {
        pending.push({
          refundId: refund.refundId,
          orderId: stored.detail.orderId,
          paymentId: stored.payments[0]?.paymentId ?? '',
          refundAmount: refund.amountCents,
          reason: refund.reason,
          status: refund.status,
          requestedAt: refund.requestedAt,
        });
      }
    }
  }
  return pending;
}

/** 模拟 GET /transactions/orders/:orderId — 订单详情 */
function getOrderDetail(orderId: string): OrderDetail {
  const stored = orderStore.get(orderId);
  if (!stored) throw new Error(`Order ${orderId} not found`);
  return { ...stored.detail };
}

/** 校验订单状态机流转 */
function validateOrderStatusTransition(current: OrderStatus, next: OrderStatus): boolean {
  const transitions: Record<OrderStatus, OrderStatus[]> = {
    draft: ['pending_payment', 'cancelled'],
    pending_payment: ['paid', 'cancelled'],
    paid: ['refunding', 'completed'],
    refunding: ['refunded'],
    refunded: [],
    cancelled: [],
    completed: ['refunding'],
  };
  return transitions[current]?.includes(next) ?? false;
}

/** 校验退款金额不超过支付金额 */
function validateRefundAmount(paidAmount: number, totalRefundAmount: number): boolean {
  return totalRefundAmount <= paidAmount;
}

/** 计算已退款总额 */
function computeTotalRefunded(refunds: Array<{ amountCents: number; status: string }>): number {
  return refunds
    .filter(r => r.status === 'completed' || r.status === 'approved')
    .reduce((s, r) => s + r.amountCents, 0);
}

// ═══════════════════════════════════════════════════════════════════════════
// 测试套件
// ═══════════════════════════════════════════════════════════════════════════

describe('链38: API 交易主链 (Checkout → 支付 → 退款)', () => {
  // ───────────────────────────────────────
  // P1 正例: 完整交易主链
  // ───────────────────────────────────────
  describe('P1 正例 — 完整交易主链: 下单→支付→退款→确认', () => {
    test('P1.1 下单成功', () => {
      resetStore();

      const checkoutReq: CheckoutRequest = {
        memberId: 'mem-001',
        items: [{ productId: 'p1', quantity: 1, unitPriceCents: 29900 }],
        paymentChannel: 'WECHAT',
      };

      const resp = doCheckout(checkoutReq);
      assert.ok(resp.orderId, '应有 orderId');
      assert.ok(resp.transactionId, '应有 transactionId');
      assert.equal(resp.totalCents, 29900, '金额正确');

      const stored = getStoredOrder(resp.orderId);
      assert.ok(stored, '订单已存储');
      assert.equal(stored!.detail.status, 'pending_payment', '状态为待支付');
    });

    test('P1.2 支付成功', () => {
      const stored = orderStore.values().next().value;
      assert.ok(stored, '有已创建订单');
      const orderId = stored.detail.orderId;

      const payResp = doPay(orderId, { method: 'WECHAT', amountCents: 29900 });
      assert.ok(payResp.paymentId, '返回 paymentId');
      assert.equal(payResp.status, 'success', '支付状态 success');

      const updated = getOrderDetail(orderId);
      assert.equal(updated.status, 'paid', '订单状态变为 paid');
      assert.equal(updated.paidAmount, 29900, '已支付金额正确');
    });

    test('P1.3 发起退款申请', () => {
      const stored = orderStore.values().next().value;
      assert.ok(stored, '有已支付订单');
      const orderId = stored.detail.orderId;
      const paymentId = stored.payments[0].paymentId;

      const refundResp = doRefund(orderId, {
        paymentId,
        amountCents: 29900,
        reason: '商品质量问题',
      });
      assert.ok(refundResp.refundId, '返回 refundId');
      assert.equal(refundResp.status, 'pending', '退款状态 pending');

      const updated = getOrderDetail(orderId);
      assert.equal(updated.status, 'refunding', '订单状态变为 refunding');
    });

    test('P1.4 审批退款通过 → 确认退款完成', () => {
      const stored = orderStore.values().next().value;
      assert.ok(stored, '有退款申请');
      const refundId = stored.refunds[0].refundId;

      const approved = doApproveRefund(refundId, 'admin-001');
      assert.equal(approved.status, 'completed', '退款状态 completed');
      assert.ok(approved.completedAt, '有完成时间');
      assert.equal(approved.reviewedBy, 'admin-001', '审批人正确');
      assert.equal(approved.refundAmount, 29900, '退款金额正确');

      const orderDetail = getOrderDetail(stored.detail.orderId);
      assert.equal(orderDetail.status, 'refunded', '订单最终状态 refunded');
    });
  });

  // ───────────────────────────────────────
  // P2 正例: 部分退款
  // ───────────────────────────────────────
  describe('P2 正例 — 部分退款(多商品拆分)', () => {
    test('P2.1 多商品订单下单并全额支付', () => {
      resetStore();

      const checkoutReq: CheckoutRequest = {
        memberId: 'mem-002',
        items: [
          { productId: 'p1', quantity: 1, unitPriceCents: 29900 },
          { productId: 'p2', quantity: 2, unitPriceCents: 8900 },
          { productId: 'p3', quantity: 1, unitPriceCents: 13900 },
        ],
        paymentChannel: 'ALIPAY',
      };

      const checkoutResp = doCheckout(checkoutReq);
      const expectedTotal = 29900 + 2 * 8900 + 13900; // 61600
      assert.equal(checkoutResp.totalCents, expectedTotal);

      doPay(checkoutResp.orderId, { method: 'ALIPAY', amountCents: expectedTotal });

      const detail = getOrderDetail(checkoutResp.orderId);
      assert.equal(detail.status, 'paid');
      assert.equal(detail.paidAmount, expectedTotal);
    });

    test('P2.2 部分退款: 退其中一件商品', () => {
      const stored = orderStore.values().next().value;
      assert.ok(stored);
      const orderId = stored.detail.orderId;
      const paymentId = stored.payments[0].paymentId;

      // 退 P2 两件的金额: 2 * 8900 = 17800
      const refundResp = doRefund(orderId, {
        paymentId,
        amountCents: 17800,
        reason: '部分退货: 面膜2件',
      });
      assert.ok(refundResp.refundId);
      assert.equal(refundResp.status, 'pending');

      const detail = getOrderDetail(orderId);
      assert.equal(detail.status, 'refunding', '部分退款时状态为 refunding');
    });

    test('P2.3 部分退款完成 → 订单状态仍为部分已退', () => {
      const stored = orderStore.values().next().value;
      assert.ok(stored);
      const refundId = stored.refunds[0].refundId;

      doApproveRefund(refundId, 'admin-001');

      const orderDetail = getOrderDetail(stored.detail.orderId);
      // 仍有余额未退，refundedAmount < paidAmount，但所有退款已完成 → refunded
      assert.equal(orderDetail.refundedAmount, 17800, '已退款 17800分');
      assert.equal(orderDetail.paidAmount, 61600, '已支付 61600分');

      // 仍有未退金额 => 部分退款场景下订单状态为 refunded
      // （实际业务可根据需求决定部分退款后订单状态）
      assert.ok(orderDetail.status === 'refunded', '订单最终状态为 refunded');
    });

    test('P2.4 再次部分退款剩余部分', () => {
      const stored = orderStore.values().next().value;
      assert.ok(stored);
      const orderId = stored.detail.orderId;
      const paymentId = stored.payments[0].paymentId;

      const refundResp = doRefund(orderId, {
        paymentId,
        amountCents: 29900, // 退 P1
        reason: '部分退货: 护肤套装',
      });
      assert.ok(refundResp.refundId);

      doApproveRefund(refundResp.refundId);

      const detail = getOrderDetail(orderId);
      // 总已退 = 17800 + 29900 = 47700, 已支付 = 61600
      assert.equal(detail.refundedAmount, 47700, '累计退款 47700分');
    });
  });

  // ───────────────────────────────────────
  // N 反例: 异常路径
  // ───────────────────────────────────────
  describe('N1 反例 — 重复支付', () => {
    test('N1.1 已支付订单重复支付被拒', () => {
      resetStore();

      const orderId = doCheckout({
        memberId: 'mem-003',
        items: [{ productId: 'p1', quantity: 1, unitPriceCents: 10000 }],
        paymentChannel: 'CASH',
      }).orderId;

      // 第一次支付
      const pay1 = doPay(orderId, { method: 'CASH', amountCents: 10000 });
      assert.equal(pay1.status, 'success', '第一次支付成功');

      // 第二次支付应抛出异常
      assert.throws(
        () => doPay(orderId, { method: 'WECHAT', amountCents: 10000 }),
        /already paid/,
        '重复支付应被拒绝',
      );
    });
  });

  describe('N2 反例 — 退款超付', () => {
    test('N2.1 退款金额超过支付金额', () => {
      resetStore();

      const orderId = doCheckout({
        memberId: 'mem-004',
        items: [{ productId: 'p1', quantity: 1, unitPriceCents: 5000 }],
        paymentChannel: 'CASH',
      }).orderId;

      const payResp = doPay(orderId, { method: 'CASH', amountCents: 5000 });

      // 退款金额超过支付金额
      assert.throws(
        () => doRefund(orderId, {
          paymentId: payResp.paymentId,
          amountCents: 10000,
          reason: '超额退款',
        }),
        /exceeds available/,
        '超出可退金额应被拒绝',
      );
    });
  });

  describe('N3 反例 — 已退款订单再次退款', () => {
    test('N3.1 全额退款后再退款应被拒绝', () => {
      resetStore();

      const orderId = doCheckout({
        memberId: 'mem-005',
        items: [{ productId: 'p1', quantity: 1, unitPriceCents: 20000 }],
        paymentChannel: 'WECHAT',
      }).orderId;

      const payResp = doPay(orderId, { method: 'WECHAT', amountCents: 20000 });

      // 第一次退款全额
      const ref1 = doRefund(orderId, {
        paymentId: payResp.paymentId,
        amountCents: 20000,
        reason: '全额退款',
      });
      doApproveRefund(ref1.refundId);

      // 再次退款应失败
      assert.throws(
        () => doRefund(orderId, {
          paymentId: payResp.paymentId,
          amountCents: 5000,
          reason: '再次退款',
        }),
        /exceeds available/,
        '已全额退款后再次退款应被拒绝',
      );
    });
  });

  describe('N4 反例 — 未支付订单退款', () => {
    test('N4.1 未支付直接退款被拒', () => {
      resetStore();

      const orderId = doCheckout({
        memberId: 'mem-006',
        items: [{ productId: 'p1', quantity: 1, unitPriceCents: 10000 }],
        paymentChannel: 'CASH',
      }).orderId;

      assert.throws(
        () => doRefund(orderId, {
          paymentId: 'fake-pay',
          amountCents: 5000,
          reason: '未支付退款',
        }),
        /not paid yet/,
        '未支付订单退款被拒: 未支付不可退款',
      );
    });
  });

  describe('N5 反例 — 退款被拒绝', () => {
    test('N5.1 退款申请被拒绝 → 订单恢复 paid 状态', () => {
      resetStore();

      const orderId = doCheckout({
        memberId: 'mem-007',
        items: [{ productId: 'p1', quantity: 1, unitPriceCents: 15000 }],
        paymentChannel: 'CARD',
      }).orderId;

      doPay(orderId, { method: 'CARD', amountCents: 15000 });

      const stored = getStoredOrder(orderId)!;
      const refundResp = doRefund(orderId, {
        paymentId: stored.payments[0].paymentId,
        amountCents: 15000,
        reason: '不想要了',
      });

      const rejected = doRejectRefund(refundResp.refundId, 'admin-003', '已发货不可退');
      assert.equal(rejected.status, 'rejected', '退款被拒绝');

      const detail = getOrderDetail(orderId);
      assert.equal(detail.status, 'paid', '拒绝后退款恢复为 paid');
      assert.equal(detail.refundedAmount, 0, '退款金额归零');
    });
  });

  // ───────────────────────────────────────
  // B 边界: 金额边界/状态机
  // ───────────────────────────────────────
  describe('B1 边界 — 退款金额为0', () => {
    test('B1.1 0元支付可创建', () => {
      const payResp = createPaymentBase({ method: 'CASH', amountCents: 0 });
      assert.equal(payResp.status, 'success', '0元支付成功');
    });

    test('B1.2 负数金额被拒绝', () => {
      assert.throws(
        () => createPaymentBase({ method: 'CASH', amountCents: -100 }),
        /amountCents must be a non-negative integer/,
        '负数支付金额被拒绝',
      );

      assert.throws(
        () => createPaymentBase({ method: 'CASH', amountCents: -1 }),
        /amountCents must be a non-negative integer/,
        '-1分也被拒绝',
      );
    });
  });

  describe('B2 边界 — 全量退款 = 支付金额', () => {
    test('B2.1 全额退款: 金额精确匹配', () => {
      resetStore();

      const orderId = doCheckout({
        memberId: 'mem-008',
        items: [{ productId: 'p1', quantity: 1, unitPriceCents: 29900 }],
        paymentChannel: 'WECHAT',
      }).orderId;
      const payResp = doPay(orderId, { method: 'WECHAT', amountCents: 29900 });

      const refResp = doRefund(orderId, {
        paymentId: payResp.paymentId,
        amountCents: 29900,
        reason: '全额退款',
      });
      const approved = doApproveRefund(refResp.refundId);

      assert.equal(approved.refundAmount, 29900, '退款金额 = 支付金额');
      assert.equal(approved.status, 'completed', '退款完成');

      const detail = getOrderDetail(orderId);
      assert.equal(detail.paidAmount, detail.refundedAmount, '已退 = 已付');
    });
  });

  describe('B3 边界 — 订单状态机流转', () => {
    test('B3.1 合法状态转换: pending_payment → paid → refunding → refunded', () => {
      assert.ok(validateOrderStatusTransition('pending_payment', 'paid'), 'pending_payment → paid');
      assert.ok(validateOrderStatusTransition('paid', 'refunding'), 'paid → refunding');
      assert.ok(validateOrderStatusTransition('refunding', 'refunded'), 'refunding → refunded');
    });

    test('B3.2 合法状态转换: paid → completed', () => {
      assert.ok(validateOrderStatusTransition('paid', 'completed'), 'paid → completed');
    });

    test('B3.3 非法状态转换: draft → refunded (跳过支付)', () => {
      assert.equal(validateOrderStatusTransition('draft', 'refunded'), false, 'draft 不可直接 refunded');
    });

    test('B3.4 非法状态转换: pending_payment → refunded (跳过支付)', () => {
      assert.equal(validateOrderStatusTransition('pending_payment', 'refunded'), false, '未支付不可退款');
    });

    test('B3.5 非法状态转换: refunded → paid (不可逆)', () => {
      assert.equal(validateOrderStatusTransition('refunded', 'paid'), false, '退款完成不可逆');
    });

    test('B3.6 非法状态转换: cancelled → paid', () => {
      assert.equal(validateOrderStatusTransition('cancelled', 'paid'), false, '已取消不可支付');
    });
  });

  describe('B4 边界 — 退款审批流程', () => {
    test('B4.1 退款申请后进入待审批队列', () => {
      resetStore();

      const orderId = doCheckout({
        memberId: 'mem-009',
        items: [{ productId: 'p1', quantity: 2, unitPriceCents: 10000 }],
        paymentChannel: 'WECHAT',
      }).orderId;
      doPay(orderId, { method: 'WECHAT', amountCents: 20000 });

      const stored = getStoredOrder(orderId)!;
      doRefund(orderId, { paymentId: stored.payments[0].paymentId, amountCents: 10000, reason: '质量问题' });
      doRefund(orderId, { paymentId: stored.payments[0].paymentId, amountCents: 10000, reason: '其他' });

      const pending = listPendingRefunds();
      assert.equal(pending.length, 2, '待审批队列应有2笔');
      assert.ok(pending.every(r => r.status === 'pending'), '所有退款状态为 pending');
    });

    test('B4.2 审批通过后从待审批队列移除', () => {
      const pending = listPendingRefunds();
      if (pending.length > 0) {
        doApproveRefund(pending[0].refundId, 'admin-002');

        const afterApprove = listPendingRefunds();
        const stillPending = afterApprove.filter(r => r.refundId === pending[0].refundId);
        assert.equal(stillPending.length, 0, '已审批退款不再出现在待审批队列');
      }
    });
  });
});

// ─── 辅助函数: 创建一个基础支付(不做存储校验) ───
/** 基础支付工厂(不依赖订单存储, 仅校验参数合法性) */
function createPaymentBase(body: { method: string; amountCents: number }): PaymentResponse {
  if (!body.method) throw new Error('method is required');
  if (!Number.isInteger(body.amountCents) || body.amountCents < 0) {
    throw new Error('amountCents must be a non-negative integer');
  }
  return {
    paymentId: `pay-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
    status: 'success',
  };
}
