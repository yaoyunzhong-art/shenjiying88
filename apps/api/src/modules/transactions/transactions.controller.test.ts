import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [transactions] [D] controller spec 补全
 *
 * 覆盖：startCheckout / applyPaymentCallback / getOrderTransaction / listOrderTransactions
 *       requestRefund / approveRefund / rejectRefund / listRefunds / getRefund
 *       batchApproveRefunds / batchRejectRefunds / batchAssignRefunds / batchClaimRefunds
 *       timeoutCloseOrder / batchTimeoutCloseOrders / manualCloseOrder
 *       getRefundDashboard / listPendingRefunds / listMemberTransactions
 *       snapshot 路由 (lyt)
 *
 * 正例 + 反例 + 边界
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { resetTransactionsServiceTestState } from './transactions.service'
import { TransactionsController } from './transactions.controller'
import { TransactionsService } from './transactions.service'
import { CashierService } from '../cashier/cashier.service'
import { LoyaltyService } from '../loyalty/loyalty.service'
import { MemberService } from '../member/member.service'
import { CashierPaymentStatus, CashierOrderStatus } from '../cashier/cashier.entity'
import type { RequestTenantContext } from '../tenant/tenant.types'
import type { TransactionAggregate } from './transactions.entity'
import { TransactionRefundStatus } from './transactions.entity'
import type {
  CreateTransactionCheckoutDto,
  RequestTransactionRefundDto,
  RequestTransactionTimeoutCloseDto,
  RequestTransactionManualCloseDto,
  BatchReviewTransactionRefundsDto,
  BatchAssignTransactionRefundsDto,
  BatchClaimTransactionRefundsDto
} from './transactions.dto'

const CTX: RequestTenantContext = {
  tenantId: 'tenant-a',
  brandId: 'brand-a',
  storeId: 'store-a',
  marketCode: 'cn-mainland'
}

let memberService: MemberService
let controller: TransactionsController

function buildServices() {
  memberService = new MemberService()
  const loyaltyService = new LoyaltyService(memberService)
  const cashierService = new CashierService(memberService, loyaltyService)
  controller = new TransactionsController(
    new TransactionsService(cashierService, loyaltyService)
  )
}

function reg(memberId: string) {
  memberService.register({ memberId, tenantContext: CTX, nickname: `Test-${memberId}` })
}

async function checkoutAndPay(
  memberId: string,
  amount: number,
  extPayId: string
): Promise<TransactionAggregate> {
  reg(memberId)
  const dto: CreateTransactionCheckoutDto = {
    memberId,
    items: [{ skuId: `it-${memberId}`, quantity: 1, price: amount }],
    paymentChannel: 'wechat',
    amount,
    externalPaymentId: extPayId
  }
  const created = await controller.startCheckout(CTX, dto)
  await controller.applyPaymentCallback({
    orderId: created.order.orderId,
    paymentId: created.payment!.paymentId,
    tenantId: CTX.tenantId,
    standardizedEventName: 'cashier.payment-succeeded',
    status: CashierPaymentStatus.Succeeded,
    amount,
    externalPaymentId: extPayId,
    paidAt: new Date().toISOString()
  } as any)
  // Re-fetch to get updated aggregate with latest status
  return controller.getOrderTransaction(created.order.orderId, CTX)
}

async function checkoutOnly(
  memberId: string,
  amount: number,
  extPayId: string
): Promise<TransactionAggregate> {
  reg(memberId)
  return controller.startCheckout(CTX, {
    memberId,
    items: [{ skuId: `it-${memberId}`, quantity: 1, price: amount }],
    paymentChannel: 'wechat',
    amount,
    externalPaymentId: extPayId
  })
}

beforeEach(() => { buildServices() })
afterEach(() => { resetTransactionsServiceTestState() })

describe('transactions controller', () => {
  describe('startCheckout', () => {
    it('should create checkout and return aggregate', async () => {
      reg('m-1')
      const result = await controller.startCheckout(CTX, {
        memberId: 'm-1',
        items: [{ skuId: 'a', quantity: 2, price: 29.9 }],
        paymentChannel: 'wechat',
        amount: 59.8
      })
      assert.equal(result.order.memberId, 'm-1')
      assert.ok(result.payment)
      assert.equal(result.payment.amount, 59.8)
    })

    it('should throw when items is empty (boundary)', async () => {
      reg('m-1b')
      await assert.rejects(
        () => controller.startCheckout(CTX, { memberId: 'm-1b', items: [], paymentChannel: 'wechat' }),
        /at least one item/
      )
    })

    it('should throw when member not found (negative)', async () => {
      await assert.rejects(
        () => controller.startCheckout(CTX, { memberId: 'ghost', items: [{ skuId: 'x', quantity: 1, price: 10 }], paymentChannel: 'wechat' }),
        /not found/
      )
    })
  })

  describe('applyPaymentCallback', () => {
    it('should apply payment callback (positive)', async () => {
      const initial = await checkoutOnly('m-2', 30, 'ep-2')
      const result = await controller.applyPaymentCallback({
        orderId: initial.order.orderId,
        paymentId: initial.payment!.paymentId,
        tenantId: CTX.tenantId,
        standardizedEventName: 'cashier.payment-succeeded',
        status: CashierPaymentStatus.Succeeded,
        amount: 30,
        externalPaymentId: 'ep-2',
        paidAt: new Date().toISOString()
      } as any)
      assert.equal(result.order.status, CashierOrderStatus.Paid)
    })

    it('should throw for unknown order (negative)', async () => {
      await assert.rejects(
        () => controller.applyPaymentCallback({
          orderId: 'ghost', paymentId: 'ghost-pay', tenantId: CTX.tenantId, status: CashierPaymentStatus.Succeeded, amount: 10
        } as any),
        /not found|unknown/i
      )
    })
  })

  describe('getOrderTransaction', () => {
    it('should return aggregate for existing order', async () => {
      const created = await checkoutAndPay('m-3', 50, 'ep-3')
      const result = controller.getOrderTransaction(created.order.orderId, CTX)
      assert.equal(result.order.memberId, 'm-3')
      assert.ok(result.payment)
    })

    it('should throw for non-existing order (negative)', () => {
      assert.throws(() => controller.getOrderTransaction('ghost', CTX), /not found/)
    })
  })

  describe('listOrderTransactions', () => {
    it('should list all orders for tenant', async () => {
      await checkoutAndPay('m-4', 10, 'ep-4')
      const result = controller.listOrderTransactions(CTX)
      assert.ok(result.length >= 1)
    })

    it('should filter by memberId', async () => {
      await checkoutAndPay('m-5', 20, 'ep-5')
      const result = controller.listOrderTransactions(CTX, { memberId: 'm-5' })
      result.forEach(r => assert.equal(r.order.memberId, 'm-5'))
    })

    it('should filter by hasRefund=true (boundary)', async () => {
      const created = await checkoutAndPay('m-rf', 100, 'ep-rf')
      await controller.requestRefund(created.order.orderId, CTX, { reason: 'test', refundAmount: 50 })
      const result = controller.listOrderTransactions(CTX, { hasRefund: true })
      assert.ok(result.some(r => r.order.orderId === created.order.orderId))
    })
  })

  describe('requestRefund', () => {
    it('should create pending refund for paid order', async () => {
      const created = await checkoutAndPay('m-6', 80, 'ep-6')
      const result = await controller.requestRefund(created.order.orderId, CTX, { reason: 'quality', refundAmount: 30, operator: 'ops' })
      const refund = result.refunds.find(r => r.status === TransactionRefundStatus.Pending)
      assert.ok(refund)
      assert.equal(refund.refundAmount, 30)
      assert.equal(refund.operator, 'ops')
    })

    it('should throw when refund exceeds payment (negative)', async () => {
      const created = await checkoutAndPay('m-7', 50, 'ep-7')
      await assert.rejects(
        () => controller.requestRefund(created.order.orderId, CTX, { reason: 'too much', refundAmount: 999 }),
        /exceeds refundable/
      )
    })

    it('should throw when order is not paid (boundary)', async () => {
      const created = await checkoutOnly('m-8', 30, 'ep-8')
      await assert.rejects(
        () => controller.requestRefund(created.order.orderId, CTX, { reason: 'premature', refundAmount: 10 }),
        /not eligible/
      )
    })
  })

  describe('approveRefund / rejectRefund', () => {
    it('should approve a pending refund', async () => {
      const created = await checkoutAndPay('m-9', 60, 'ep-9')
      const withRefund = await controller.requestRefund(created.order.orderId, CTX, { reason: 'ok', refundAmount: 20 })
      const refundId = withRefund.refunds[0].refundId
      const approved = await controller.approveRefund(refundId, CTX, { operator: 'r', note: 'ok' })
      const found = approved.refunds.find(r => r.refundId === refundId)
      assert.equal(found?.status, TransactionRefundStatus.Completed)
    })

    it('should reject a pending refund', async () => {
      const created = await checkoutAndPay('m-10', 40, 'ep-10')
      const withRefund = await controller.requestRefund(created.order.orderId, CTX, { reason: 'no', refundAmount: 10 })
      const refundId = withRefund.refunds[0].refundId
      const rejected = await controller.rejectRefund(refundId, CTX, { operator: 'r2', note: 'no' })
      assert.equal(rejected.refunds.find(r => r.refundId === refundId)?.status, TransactionRefundStatus.Rejected)
    })

    it('should throw when approving already handled refund (negative)', async () => {
      const created = await checkoutAndPay('m-11', 70, 'ep-11')
      const withRefund = await controller.requestRefund(created.order.orderId, CTX, { reason: 'x', refundAmount: 10 })
      const refundId = withRefund.refunds[0].refundId
      await controller.approveRefund(refundId, CTX, {})
      await assert.rejects(
        () => controller.approveRefund(refundId, CTX, {}),
        /not pending/
      )
    })
  })

  describe('listRefunds / getRefund / listOrderRefunds', () => {
    it('should list refunds for tenant', async () => {
      const created = await checkoutAndPay('m-12', 100, 'ep-12')
      await controller.requestRefund(created.order.orderId, CTX, { reason: 'list', refundAmount: 25 })
      assert.ok(controller.listRefunds(CTX).length >= 1)
    })

    it('should get single refund by id', async () => {
      const created = await checkoutAndPay('m-13', 90, 'ep-13')
      const withRefund = await controller.requestRefund(created.order.orderId, CTX, { reason: 'get', refundAmount: 15 })
      const refundId = withRefund.refunds[0].refundId
      const refund = controller.getRefund(refundId, CTX)
      assert.equal(refund.refundId, refundId)
      assert.equal(refund.refundAmount, 15)
    })

    it('should throw for unknown refund id (negative)', () => {
      assert.throws(() => controller.getRefund('not-exist', CTX), /not found/)
    })

    it('should list refunds for specific order', async () => {
      const created = await checkoutAndPay('m-14', 120, 'ep-14')
      await controller.requestRefund(created.order.orderId, CTX, { reason: 'order', refundAmount: 20 })
      assert.ok(controller.listOrderRefunds(created.order.orderId, CTX).length >= 1)
    })
  })

  describe('listPendingRefunds', () => {
    it('should return only pending refunds', async () => {
      const created = await checkoutAndPay('m-15', 200, 'ep-15')
      await controller.requestRefund(created.order.orderId, CTX, { reason: 'pending', refundAmount: 50 })
      const pending = controller.listPendingRefunds(CTX)
      assert.ok(pending.length >= 1)
      pending.forEach(r => assert.equal(r.status, TransactionRefundStatus.Pending))
    })
  })

  describe('batchApproveRefunds / batchRejectRefunds', () => {
    it('should batch approve refunds', async () => {
      const created = await checkoutAndPay('m-16', 300, 'ep-16')
      const withRefund = await controller.requestRefund(created.order.orderId, CTX, { reason: 'batch', refundAmount: 30 })
      const refundId = withRefund.refunds[0].refundId
      const dto: BatchReviewTransactionRefundsDto = { refundIds: [refundId], operator: 'approver' }
      const result = await controller.batchApproveRefunds(CTX, dto)
      assert.equal(result.processedCount, 1)
      assert.equal(result.refunds[0].status, TransactionRefundStatus.Completed)
    })

    it('should batch reject refunds', async () => {
      const created = await checkoutAndPay('m-17', 150, 'ep-17')
      const withRefund = await controller.requestRefund(created.order.orderId, CTX, { reason: 'batch', refundAmount: 10 })
      const refundId = withRefund.refunds[0].refundId
      const dto: BatchReviewTransactionRefundsDto = { refundIds: [refundId], operator: 'rejecter' }
      const result = await controller.batchRejectRefunds(CTX, dto)
      assert.equal(result.processedCount, 1)
      assert.equal(result.refunds[0].status, TransactionRefundStatus.Rejected)
    })

    it('should skip non-existent refund ids (boundary)', async () => {
      const result = await controller.batchApproveRefunds(CTX, { refundIds: ['ghost-refund'], operator: 'ghost' })
      assert.equal(result.skippedCount, 1)
    })
  })

  describe('batchAssignRefunds / batchClaimRefunds', () => {
    it('should batch assign refunds', async () => {
      const created = await checkoutAndPay('m-18', 80, 'ep-18')
      const withRefund = await controller.requestRefund(created.order.orderId, CTX, { reason: 'assign', refundAmount: 20 })
      const dto: BatchAssignTransactionRefundsDto = {
        refundIds: [withRefund.refunds[0].refundId],
        assignee: 'assigned-user',
        operator: 'admin'
      }
      const result = await controller.batchAssignRefunds(CTX, dto)
      assert.equal(result.processedCount, 1)
      assert.equal(result.refunds[0].assignedTo, 'assigned-user')
    })

    it('should batch claim refunds', async () => {
      const created = await checkoutAndPay('m-19', 60, 'ep-19')
      const withRefund = await controller.requestRefund(created.order.orderId, CTX, { reason: 'claim', refundAmount: 10 })
      const dto: BatchClaimTransactionRefundsDto = {
        refundIds: [withRefund.refunds[0].refundId],
        operator: 'self-claimer'
      }
      const result = await controller.batchClaimRefunds(CTX, dto)
      assert.equal(result.processedCount, 1)
      assert.equal(result.refunds[0].assignedTo, 'self-claimer')
    })
  })

  describe('timeoutCloseOrder / batchTimeoutCloseOrders / manualCloseOrder', () => {
    it('should timeout close a stale order', async () => {
      const created = await checkoutOnly('m-20', 40, 'ep-20')
      const result = await controller.timeoutCloseOrder(created.order.orderId, CTX, { reason: 'timeout', operator: 'sys' })
      assert.equal(result.order.closeReason, 'PAYMENT_TIMEOUT')
    })

    it('should batch timeout close orders', async () => {
      await checkoutOnly('m-21', 25, 'ep-21')
      const result = await controller.batchTimeoutCloseOrders(CTX, { memberId: 'm-21', limit: 10 })
      assert.ok(result.processedCount >= 1)
    })

    it('should manual close an order', async () => {
      const created = await checkoutOnly('m-22', 35, 'ep-22')
      const result = await controller.manualCloseOrder(created.order.orderId, CTX, { reason: 'cancel', operator: 'admin' })
      assert.equal(result.order.status, CashierOrderStatus.Closed)
    })

    it('should throw when closing non-existent order (negative)', async () => {
      await assert.rejects(
        () => controller.timeoutCloseOrder('ghost', CTX, { reason: 'nope', operator: 'sys' }),
        /not found/
      )
    })
  })

  describe('getRefundDashboard', () => {
    it('should return dashboard with status groups and aging', async () => {
      const created = await checkoutAndPay('m-23', 500, 'ep-23')
      await controller.requestRefund(created.order.orderId, CTX, { reason: 'dash', refundAmount: 100 })
      const dashboard = controller.getRefundDashboard(CTX)
      assert.ok(dashboard.totalCount >= 1)
      assert.ok(dashboard.statusGroups.length >= 1)
      assert.ok(dashboard.agingBuckets.length >= 1)
      assert.ok(dashboard.slaThresholds.teamLeadMinutes > 0)
    })

    it('should respect query limits (boundary)', () => {
      const dashboard = controller.getRefundDashboard(CTX, { priorityQueueLimit: 1, recentReviewLimit: 1, dispatchQueueLimit: 2 })
      assert.ok(dashboard.priorityQueue.length <= 1)
      assert.ok(dashboard.recentReviews.length <= 1)
      assert.ok(dashboard.dispatchQueue.length <= 2)
    })
  })

  describe('lyt snapshots', () => {
    it('should list lyt order snapshots', () => {
      const result = controller.listLytOrderSnapshots(CTX)
      assert.ok(result instanceof Promise || Array.isArray(result))
    })

    it('should list lyt payment snapshots', () => {
      const result = controller.listLytPaymentSnapshots(CTX)
      assert.ok(result instanceof Promise || Array.isArray(result))
    })

    it('should return undefined for unknown lyt order snapshot', async () => {
      assert.equal(await controller.getLytOrderSnapshot('no-such', CTX), undefined)
    })

    it('should return undefined for unknown lyt payment snapshot', async () => {
      assert.equal(await controller.getLytPaymentSnapshot('no-such', CTX), undefined)
    })
  })

  describe('listMemberTransactions', () => {
    it('should return member timeline', async () => {
      await checkoutAndPay('m-24', 10, 'ep-24')
      const timeline = controller.listMemberTransactions('m-24', CTX)
      assert.ok(Array.isArray(timeline))
      assert.ok(timeline.length >= 1)
      timeline.forEach(e => assert.equal(e.memberId, 'm-24'))
    })

    it('should return empty for unknown member (boundary)', () => {
      const timeline = controller.listMemberTransactions('unknown', CTX)
      assert.ok(Array.isArray(timeline))
      assert.equal(timeline.length, 0)
    })
  })
})
