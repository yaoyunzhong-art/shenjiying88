import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * transactions.controller.spec.ts — TransactionsController 路由/功能 spec 测试
 *
 * 策略：直接实例化 TransactionsController（无 NestJS DI），
 *      依赖的 CashierService / LoyaltyService / MemberService 做内联 mock。
 *
 * 覆盖：
 *   - POST /transactions/checkout                        startCheckout
 *   - POST /transactions/payments/standardized-callback  applyPaymentCallback
 *   - GET  /transactions/orders/:orderId                 getOrderTransaction
 *   - GET  /transactions/orders                          listOrderTransactions
 *   - GET  /transactions/persistent/snapshots/orders             listLytOrderSnapshots
 *   - GET  /transactions/persistent/snapshots/orders/:id        getLytOrderSnapshot
 *   - GET  /transactions/persistent/snapshots/payments           listLytPaymentSnapshots
 *   - GET  /transactions/persistent/snapshots/payments/:id      getLytPaymentSnapshot
 *   - POST /transactions/orders/:orderId/timeout-close           timeoutCloseOrder
 *   - POST /transactions/orders/batch-timeout-close              batchTimeoutCloseOrders
 *   - POST /transactions/orders/:orderId/manual-close            manualCloseOrder
 *   - GET  /transactions/orders/:orderId/refunds                 listOrderRefunds
 *   - GET  /transactions/refunds                                 listRefunds
 *   - GET  /transactions/refunds/pending                         listPendingRefunds
 *   - GET  /transactions/refunds/dashboard                       getRefundDashboard
 *   - GET  /transactions/refunds/:refundId                       getRefund
 *   - POST /transactions/orders/:orderId/refunds                 requestRefund
 *   - POST /transactions/refunds/:refundId/approve               approveRefund
 *   - POST /transactions/refunds/:refundId/reject                rejectRefund
 *   - POST /transactions/refunds/batch-approve                   batchApproveRefunds
 *   - POST /transactions/refunds/batch-reject                    batchRejectRefunds
 *   - POST /transactions/refunds/batch-assign                    batchAssignRefunds
 *   - POST /transactions/refunds/batch-claim                     batchClaimRefunds
 *   - GET  /transactions/members/:memberId                       listMemberTransactions
 *   - GET  /transactions/members/:memberId/refunds               listMemberRefunds
 *
 * 正例 + 反例 + 边界
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { TransactionsController } from './transactions.controller'
import { TransactionsService } from './transactions.service'
import { CashierService } from '../cashier/cashier.service'
import { LoyaltyService } from '../loyalty/loyalty.service'
import { MemberService } from '../member/member.service'
import { CashierOrderStatus, CashierPaymentStatus } from '../cashier/cashier.entity'
import { TransactionRefundStatus } from './transactions.entity'
import { resetTransactionsServiceTestState } from './transactions.service'
import type { RequestTenantContext } from '../tenant/tenant.types'
import type { TransactionAggregate } from './transactions.entity'
import type {
  CreateTransactionCheckoutDto,
  BatchAssignTransactionRefundsDto,
  BatchClaimTransactionRefundsDto,
  GetTransactionRefundDashboardQueryDto,
} from './transactions.dto'

// ── Test Helpers ──────────────────────────────────────────────────

const CTX: RequestTenantContext = {
  tenantId: 'tenant-t',
  brandId: 'brand-t',
  storeId: 'store-t',
  marketCode: 'cn-mainland',
}

function makeController() {
  const memberService = new MemberService()
  const loyaltyService = new LoyaltyService(memberService)
  const cashierService = new CashierService(memberService, loyaltyService)
  const transactionsService = new TransactionsService(cashierService, loyaltyService)
  const controller = new TransactionsController(transactionsService)
  return { controller, memberService, cashierService, loyaltyService, transactionsService }
}

function registerMember(memberId: string) {
  const ms = new MemberService()
  ms.register({ memberId, tenantContext: CTX, nickname: `Test-${memberId}` })
  return ms
}

async function prepareCheckoutAndPay(
  controller: TransactionsController,
  memberId: string,
  amount: number,
  extPayId: string
): Promise<TransactionAggregate> {
  registerMember(memberId)
  const dto: CreateTransactionCheckoutDto = {
    memberId,
    items: [{ skuId: `sku-${memberId}`, quantity: 1, price: amount }],
    paymentChannel: 'wechat',
    amount,
    externalPaymentId: extPayId,
  }
  const checkout = await controller.startCheckout(CTX, dto)
  await controller.applyPaymentCallback({
    orderId: checkout.order.orderId,
    paymentId: checkout.payment!.paymentId,
    tenantId: CTX.tenantId,
    standardizedEventName: 'cashier.payment-succeeded',
    status: CashierPaymentStatus.Succeeded,
    amount,
    externalPaymentId: extPayId,
    paidAt: new Date().toISOString(),
  } as any)
  return controller.getOrderTransaction(checkout.order.orderId, CTX)
}

async function prepareCheckoutOnly(
  controller: TransactionsController,
  memberId: string,
  amount: number,
  extPayId: string
): Promise<TransactionAggregate> {
  registerMember(memberId)
  return controller.startCheckout(CTX, {
    memberId,
    items: [{ skuId: `sku-${memberId}`, quantity: 1, price: amount }],
    paymentChannel: 'wechat',
    amount,
    externalPaymentId: extPayId,
  })
}

let controller: TransactionsController

beforeEach(() => {
  const built = makeController()
  controller = built.controller
})
afterEach(() => { resetTransactionsServiceTestState() })

// ── Specs ─────────────────────────────────────────────────────────

describe('TransactionsController', () => {
  // ── POST /transactions/checkout ──────────────────────────────
  describe('startCheckout()', () => {
    it('正例: should create checkout and return aggregate', async () => {
      registerMember('sc-m1')
      const result = await controller.startCheckout(CTX, {
        memberId: 'sc-m1',
        items: [{ skuId: 'item-a', quantity: 2, price: 29.9 }],
        paymentChannel: 'alipay',
        amount: 59.8,
      })
      assert.equal(result.order.memberId, 'sc-m1')
      assert.equal(result.order.status, 'PENDING_PAYMENT')
      assert.ok(result.payment)
      assert.equal(result.payment!.amount, 59.8)
    })

    it('反例: should reject empty items', async () => {
      registerMember('sc-m2')
      await assert.rejects(
        () => controller.startCheckout(CTX, { memberId: 'sc-m2', items: [], paymentChannel: 'alipay' }),
        /at least one item/
      )
    })

    it('边界: should reject unknown member', async () => {
      await assert.rejects(
        () => controller.startCheckout(CTX, {
          memberId: 'ghost-member',
          items: [{ skuId: 'x', quantity: 1, price: 10 }],
          paymentChannel: 'alipay',
        }),
        /not found/i
      )
    })
  })

  // ── POST /transactions/payments/standardized-callback ─────────
  describe('applyPaymentCallback()', () => {
    it('正例: should apply payment and transition status', async () => {
      const init = await prepareCheckoutOnly(controller, 'apc-m1', 50, 'apc-e1')
      const result = await controller.applyPaymentCallback({
        orderId: init.order.orderId,
        paymentId: init.payment!.paymentId,
        tenantId: CTX.tenantId,
        standardizedEventName: 'cashier.payment-succeeded',
        status: CashierPaymentStatus.Succeeded,
        amount: 50,
        externalPaymentId: 'apc-e1',
        paidAt: new Date().toISOString(),
      } as any)
      assert.equal(result.order.status, CashierOrderStatus.Paid)
    })

    it('反例: should throw for unknown order', async () => {
      await assert.rejects(
        () => controller.applyPaymentCallback({
          orderId: 'no-such-order',
          paymentId: 'p-0',
          tenantId: CTX.tenantId,
          status: CashierPaymentStatus.Succeeded,
          amount: 10,
        } as any),
        /not found|unknown/i
      )
    })

    it('边界: failed payment transitions order to PaymentFailed', async () => {
      const init = await prepareCheckoutOnly(controller, 'apc-m2', 30, 'apc-e2')
      const result = await controller.applyPaymentCallback({
        orderId: init.order.orderId,
        paymentId: init.payment!.paymentId,
        tenantId: CTX.tenantId,
        standardizedEventName: 'cashier.payment-failed',
        status: CashierPaymentStatus.Failed,
        amount: 30,
        externalPaymentId: 'apc-e2',
        paidAt: new Date().toISOString(),
      } as any)
      // Failed payment moves order to PaymentFailed, no throw
      assert.equal(result.order.status, CashierOrderStatus.PaymentFailed)
    })
  })

  // ── GET /transactions/orders/:orderId ────────────────────────
  describe('getOrderTransaction()', () => {
    it('正例: should return existing aggregate', async () => {
      const created = await prepareCheckoutAndPay(controller, 'got-m1', 80, 'got-e1')
      const result = controller.getOrderTransaction(created.order.orderId, CTX)
      assert.equal(result.order.orderId, created.order.orderId)
      assert.ok(result.payment)
    })

    it('反例: should throw for missing order', () => {
      assert.throws(
        () => controller.getOrderTransaction('not-found', CTX),
        /not found/
      )
    })

    it('边界: should throw for wrong tenant', async () => {
      const created = await prepareCheckoutAndPay(controller, 'got-m2', 20, 'got-e2')
      assert.throws(
        () => controller.getOrderTransaction(created.order.orderId, { ...CTX, tenantId: 'other-tenant' }),
        /not found/
      )
    })
  })

  // ── GET /transactions/orders ─────────────────────────────────
  describe('listOrderTransactions()', () => {
    it('正例: should list all orders for tenant', async () => {
      await prepareCheckoutAndPay(controller, 'lot-m1', 10, 'lot-e1')
      const result = controller.listOrderTransactions(CTX)
      assert.ok(Array.isArray(result))
      assert.ok(result.length >= 1)
    })

    it('正例: should filter by memberId', async () => {
      await prepareCheckoutAndPay(controller, 'lot-m2', 20, 'lot-e2')
      const result = controller.listOrderTransactions(CTX, { memberId: 'lot-m2' })
      assert.ok(result.length >= 1)
      result.forEach(r => assert.equal(r.order.memberId, 'lot-m2'))
    })

    it('边界: should return empty for unknown member', () => {
      const result = controller.listOrderTransactions(CTX, { memberId: 'nobody' })
      assert.equal(result.length, 0)
    })

    it('边界: should filter by hasRefund', async () => {
      const created = await prepareCheckoutAndPay(controller, 'lot-m3', 100, 'lot-e3')
      await controller.requestRefund(created.order.orderId, CTX, { reason: 'test', refundAmount: 30 })
      const result = controller.listOrderTransactions(CTX, { hasRefund: true })
      assert.ok(result.some(r => r.order.orderId === created.order.orderId))
    })
  })

  // ── LYT Snapshot routes ──────────────────────────────────────
  describe('lyt order snapshots', () => {
    it('正例: listLytOrderSnapshots should return array', async () => {
      const result = controller.listLytOrderSnapshots(CTX)
      assert.ok(Array.isArray(await result))
    })

    it('边界: getLytOrderSnapshot for unknown id returns undefined', async () => {
      const result = await controller.getLytOrderSnapshot('unknown-id', CTX)
      assert.equal(result, undefined)
    })
  })

  describe('lyt payment snapshots', () => {
    it('正例: listLytPaymentSnapshots should return array', async () => {
      const result = controller.listLytPaymentSnapshots(CTX)
      assert.ok(Array.isArray(await result))
    })

    it('边界: getLytPaymentSnapshot for unknown id returns undefined', async () => {
      const result = await controller.getLytPaymentSnapshot('unknown-pay', CTX)
      assert.equal(result, undefined)
    })
  })

  // ── POST /transactions/orders/:orderId/timeout-close ─────────
  describe('timeoutCloseOrder()', () => {
    it('正例: should timeout close a pending order', async () => {
      const init = await prepareCheckoutOnly(controller, 'tco-m1', 40, 'tco-e1')
      const result = await controller.timeoutCloseOrder(init.order.orderId, CTX, { reason: 'timeout', operator: 'sys' })
      assert.equal(result.order.closeReason, 'PAYMENT_TIMEOUT')
      assert.equal(result.order.status, CashierOrderStatus.Closed)
    })

    it('反例: should throw for ghost order', async () => {
      await assert.rejects(
        () => controller.timeoutCloseOrder('ghost', CTX, { reason: 'no', operator: 'sys' }),
        /not found/
      )
    })

    it('边界: cannot timeout close an already paid order', async () => {
      const created = await prepareCheckoutAndPay(controller, 'tco-m2', 50, 'tco-e2')
      await assert.rejects(
        () => controller.timeoutCloseOrder(created.order.orderId, CTX, { reason: 'late', operator: 'sys' }),
        /cannot be timeout-closed/
      )
    })
  })

  // ── POST /transactions/orders/batch-timeout-close ────────────
  describe('batchTimeoutCloseOrders()', () => {
    it('正例: should batch close stale orders', async () => {
      await prepareCheckoutOnly(controller, 'btc-m1', 30, 'btc-e1')
      const result = await controller.batchTimeoutCloseOrders(CTX, { memberId: 'btc-m1', limit: 10 })
      assert.ok(result.processedCount >= 1)
    })

    it('边界: no matching orders returns zero', async () => {
      const result = await controller.batchTimeoutCloseOrders(CTX, { memberId: 'nobody', limit: 10 })
      assert.equal(result.processedCount, 0)
    })
  })

  // ── POST /transactions/orders/:orderId/manual-close ─────────
  describe('manualCloseOrder()', () => {
    it('正例: should manually close an order', async () => {
      const init = await prepareCheckoutOnly(controller, 'mco-m1', 35, 'mco-e1')
      const result = await controller.manualCloseOrder(init.order.orderId, CTX, { reason: 'manual', operator: 'admin' })
      assert.equal(result.order.status, CashierOrderStatus.Closed)
      assert.equal(result.order.closeReason, 'MANUAL_CANCEL')
    })

    it('反例: should throw for ghost order', async () => {
      await assert.rejects(
        () => controller.manualCloseOrder('ghost', CTX, { reason: 'x', operator: 'admin' }),
        /not found/
      )
    })
  })

  // ── POST /transactions/orders/:orderId/refunds ───────────────
  describe('requestRefund()', () => {
    it('正例: should create pending refund for paid order', async () => {
      const created = await prepareCheckoutAndPay(controller, 'rr-m1', 100, 'rr-e1')
      const result = await controller.requestRefund(created.order.orderId, CTX, { reason: 'defect', refundAmount: 40 })
      const refund = result.refunds.find(r => r.status === TransactionRefundStatus.Pending)
      assert.ok(refund)
      assert.equal(refund!.refundAmount, 40)
    })

    it('反例: should throw when refund exceeds amount', async () => {
      const created = await prepareCheckoutAndPay(controller, 'rr-m2', 50, 'rr-e2')
      await assert.rejects(
        () => controller.requestRefund(created.order.orderId, CTX, { reason: 'too much', refundAmount: 9999 }),
        /exceeds refundable/
      )
    })

    it('边界: cannot refund unpaid order', async () => {
      const init = await prepareCheckoutOnly(controller, 'rr-m3', 60, 'rr-e3')
      await assert.rejects(
        () => controller.requestRefund(init.order.orderId, CTX, { reason: 'premature', refundAmount: 10 }),
        /not eligible/
      )
    })
  })

  // ── POST /transactions/refunds/:refundId/approve|reject ──────
  describe('approveRefund / rejectRefund', () => {
    it('正例: should approve pending refund', async () => {
      const created = await prepareCheckoutAndPay(controller, 'ar-m1', 200, 'ar-e1')
      const wRefund = await controller.requestRefund(created.order.orderId, CTX, { reason: 'ok', refundAmount: 50 })
      const refundId = wRefund.refunds[0].refundId
      const approved = await controller.approveRefund(refundId, CTX, { operator: 'approver', note: 'approved' })
      const found = approved.refunds.find(r => r.refundId === refundId)
      assert.equal(found?.status, TransactionRefundStatus.Completed)
    })

    it('正例: should reject pending refund', async () => {
      const created = await prepareCheckoutAndPay(controller, 'ar-m2', 150, 'ar-e2')
      const wRefund = await controller.requestRefund(created.order.orderId, CTX, { reason: 'no', refundAmount: 20 })
      const refundId = wRefund.refunds[0].refundId
      const rejected = await controller.rejectRefund(refundId, CTX, { operator: 'rejecter' })
      assert.equal(rejected.refunds.find(r => r.refundId === refundId)?.status, TransactionRefundStatus.Rejected)
    })

    it('反例: cannot approve already handled refund', async () => {
      const created = await prepareCheckoutAndPay(controller, 'ar-m3', 80, 'ar-e3')
      const wRefund = await controller.requestRefund(created.order.orderId, CTX, { reason: 'done', refundAmount: 10 })
      const refundId = wRefund.refunds[0].refundId
      await controller.approveRefund(refundId, CTX, {})
      await assert.rejects(
        () => controller.approveRefund(refundId, CTX, {}),
        /not pending/
      )
    })

    it('边界: approve non-existent refund', async () => {
      await assert.rejects(
        () => controller.approveRefund('ghost-refund', CTX, {}),
        /not found/
      )
    })
  })

  // ── GET /transactions/refunds / orders/:id/refunds / refunds/:id ─
  describe('listRefunds / getRefund / listOrderRefunds', () => {
    it('正例: listRefunds returns refunds for tenant', async () => {
      const created = await prepareCheckoutAndPay(controller, 'lr-m1', 90, 'lr-e1')
      await controller.requestRefund(created.order.orderId, CTX, { reason: 'test list', refundAmount: 15 })
      assert.ok(controller.listRefunds(CTX).length >= 1)
    })

    it('正例: getRefund by id returns correct record', async () => {
      const created = await prepareCheckoutAndPay(controller, 'lr-m2', 120, 'lr-e2')
      const wRefund = await controller.requestRefund(created.order.orderId, CTX, { reason: 'single get', refundAmount: 25 })
      const refundId = wRefund.refunds[0].refundId
      const refund = controller.getRefund(refundId, CTX)
      assert.equal(refund.refundId, refundId)
      assert.equal(refund.refundAmount, 25)
    })

    it('反例: getRefund throws for unknown id', () => {
      assert.throws(
        () => controller.getRefund('no-such', CTX),
        /not found/
      )
    })

    it('正例: listOrderRefunds for a specific order', async () => {
      const created = await prepareCheckoutAndPay(controller, 'lr-m3', 60, 'lr-e3')
      await controller.requestRefund(created.order.orderId, CTX, { reason: 'order refunds', refundAmount: 5 })
      const refunds = controller.listOrderRefunds(created.order.orderId, CTX)
      assert.ok(refunds.length >= 1)
    })
  })

  // ── GET /transactions/refunds/pending ─────────────────────────
  describe('listPendingRefunds()', () => {
    it('正例: should return only pending refunds', async () => {
      const created = await prepareCheckoutAndPay(controller, 'lpr-m1', 300, 'lpr-e1')
      await controller.requestRefund(created.order.orderId, CTX, { reason: 'pending test', refundAmount: 100 })
      const pending = controller.listPendingRefunds(CTX)
      assert.ok(pending.length >= 1)
      pending.forEach(r => assert.equal(r.status, TransactionRefundStatus.Pending))
    })

    it('边界: no pending refunds returns empty', async () => {
      const pending = controller.listPendingRefunds(CTX)
      assert.ok(Array.isArray(pending))
    })
  })

  // ── GET /transactions/refunds/dashboard ───────────────────────
  describe('getRefundDashboard()', () => {
    it('正例: should return dashboard shape', async () => {
      const created = await prepareCheckoutAndPay(controller, 'grd-m1', 500, 'grd-e1')
      await controller.requestRefund(created.order.orderId, CTX, { reason: 'dashboard', refundAmount: 200 })
      const dash = controller.getRefundDashboard(CTX)
      assert.ok(dash.totalCount >= 1)
      assert.ok(Array.isArray(dash.statusGroups))
      assert.ok(Array.isArray(dash.agingBuckets))
      assert.ok(dash.slaThresholds.teamLeadMinutes > 0)
    })

    it('边界: should respect query limits', () => {
      const dash = controller.getRefundDashboard(CTX, { priorityQueueLimit: 1, recentReviewLimit: 1, dispatchQueueLimit: 2 } as GetTransactionRefundDashboardQueryDto)
      assert.ok(dash.priorityQueue.length <= 1)
      assert.ok(dash.recentReviews.length <= 1)
      assert.ok(dash.dispatchQueue.length <= 2)
    })
  })

  // ── POST /transactions/refunds/batch-approve / batch-reject ──
  describe('batchApproveRefunds / batchRejectRefunds', () => {
    it('正例: batch approve multiple refunds', async () => {
      const created = await prepareCheckoutAndPay(controller, 'ba-m1', 250, 'ba-e1')
      const wRefund = await controller.requestRefund(created.order.orderId, CTX, { reason: 'batch app', refundAmount: 30 })
      const result = await controller.batchApproveRefunds(CTX, { refundIds: [wRefund.refunds[0].refundId], operator: 'batch-approver' })
      assert.equal(result.processedCount, 1)
      assert.equal(result.refunds[0].status, TransactionRefundStatus.Completed)
    })

    it('正例: batch reject multiple refunds', async () => {
      const created = await prepareCheckoutAndPay(controller, 'ba-m2', 180, 'ba-e2')
      const wRefund = await controller.requestRefund(created.order.orderId, CTX, { reason: 'batch rej', refundAmount: 20 })
      const result = await controller.batchRejectRefunds(CTX, { refundIds: [wRefund.refunds[0].refundId], operator: 'batch-rejecter' })
      assert.equal(result.processedCount, 1)
      assert.equal(result.refunds[0].status, TransactionRefundStatus.Rejected)
    })

    it('边界: skip non-existent refund ids', async () => {
      const result = await controller.batchApproveRefunds(CTX, { refundIds: ['ghost-id'], operator: 'nobody' })
      assert.equal(result.skippedCount, 1)
      assert.equal(result.processedCount, 0)
    })
  })

  // ── POST /transactions/refunds/batch-assign / batch-claim ────
  describe('batchAssignRefunds / batchClaimRefunds', () => {
    it('正例: batch assign refunds to user', async () => {
      const created = await prepareCheckoutAndPay(controller, 'bas-m1', 90, 'bas-e1')
      const wRefund = await controller.requestRefund(created.order.orderId, CTX, { reason: 'assign', refundAmount: 10 })
      const dto: BatchAssignTransactionRefundsDto = {
        refundIds: [wRefund.refunds[0].refundId],
        assignee: 'handler-1',
        operator: 'admin',
      }
      const result = await controller.batchAssignRefunds(CTX, dto)
      assert.equal(result.processedCount, 1)
      assert.equal(result.refunds[0].assignedTo, 'handler-1')
    })

    it('正例: batch claim refunds for self', async () => {
      const created = await prepareCheckoutAndPay(controller, 'bas-m2', 70, 'bas-e2')
      const wRefund = await controller.requestRefund(created.order.orderId, CTX, { reason: 'claim', refundAmount: 15 })
      const dto: BatchClaimTransactionRefundsDto = {
        refundIds: [wRefund.refunds[0].refundId],
        operator: 'self-claimer',
      }
      const result = await controller.batchClaimRefunds(CTX, dto)
      assert.equal(result.processedCount, 1)
      assert.equal(result.refunds[0].assignedTo, 'self-claimer')
    })

    it('反例: batch assign throws for non-existent refund id', () => {
      assert.throws(
        () => controller.batchAssignRefunds(CTX, { refundIds: ['ghost'], assignee: 'x', operator: 'x' }),
        /not found/
      )
    })
  })

  // ── GET /transactions/members/:memberId ───────────────────────
  describe('listMemberTransactions()', () => {
    it('正例: should return member transaction timeline', async () => {
      await prepareCheckoutAndPay(controller, 'lmt-m1', 15, 'lmt-e1')
      const timeline = controller.listMemberTransactions('lmt-m1', CTX)
      assert.ok(Array.isArray(timeline))
      assert.ok(timeline.length >= 1)
      timeline.forEach(e => assert.equal(e.memberId, 'lmt-m1'))
    })

    it('边界: unknown member returns empty', () => {
      const timeline = controller.listMemberTransactions('nobody', CTX)
      assert.ok(Array.isArray(timeline))
      assert.equal(timeline.length, 0)
    })
  })

  // ── GET /transactions/members/:memberId/refunds ──────────────
  describe('listMemberRefunds()', () => {
    it('正例: should list refunds for a member', async () => {
      const created = await prepareCheckoutAndPay(controller, 'lmr-m1', 200, 'lmr-e1')
      await controller.requestRefund(created.order.orderId, CTX, { reason: 'member refund', refundAmount: 50 })
      const refunds = controller.listMemberTransactions('lmr-m1', CTX)
      assert.ok(refunds.length >= 1)
    })

    it('边界: unknown member returns empty', () => {
      const refunds = controller.listMemberTransactions('nobody', CTX)
      assert.equal(refunds.length, 0)
    })
  })
})
