import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import { CashierOrderItemDto } from '../cashier/cashier.dto'
import {
  BatchAssignTransactionRefundsDto,
  BatchClaimTransactionRefundsDto,
  BatchReviewTransactionRefundsDto,
  BatchTimeoutCloseOrdersDto,
  CreateTransactionCheckoutDto,
  GetTransactionRefundDashboardQueryDto,
  ListTransactionOrdersQueryDto,
  ListTransactionRefundsQueryDto,
  RequestTransactionManualCloseDto,
  RequestTransactionRefundDto,
  RequestTransactionTimeoutCloseDto,
  ReviewTransactionRefundDto
} from './transactions.dto'

describe('transactions.dto', () => {
  test('CreateTransactionCheckoutDto accepts member, items, and payment channel', () => {
    const dto = new CreateTransactionCheckoutDto()
    dto.memberId = 'mem-1'
    dto.paymentChannel = 'wechat-pay'
    dto.currency = 'CNY'
    dto.couponCode = 'COUPON-2026'
    dto.items = [
      Object.assign(new CashierOrderItemDto(), { skuId: 'sku-1', quantity: 2, price: 50 })
    ]

    assert.equal(dto.memberId, 'mem-1')
    assert.equal(dto.paymentChannel, 'wechat-pay')
    assert.equal(dto.items[0].skuId, 'sku-1')
    assert.equal(dto.items[0].quantity, 2)
  })

  test('CreateTransactionCheckoutDto supports optional blindbox fields', () => {
    const dto = new CreateTransactionCheckoutDto()
    dto.memberId = 'mem-2'
    dto.paymentChannel = 'alipay'
    dto.blindboxPlanId = 'bb-premium'
    dto.blindboxQuantity = 5
    dto.items = []

    assert.equal(dto.blindboxPlanId, 'bb-premium')
    assert.equal(dto.blindboxQuantity, 5)
  })

  test('CreateTransactionCheckoutDto supports optional amount and externalPaymentId', () => {
    const dto = new CreateTransactionCheckoutDto()
    dto.memberId = 'mem-3'
    dto.paymentChannel = 'bank-transfer'
    dto.amount = 1000
    dto.externalPaymentId = 'ext-tx-001'
    dto.items = []

    assert.equal(dto.amount, 1000)
    assert.equal(dto.externalPaymentId, 'ext-tx-001')
  })

  test('CreateTransactionCheckoutDto is a class instance', () => {
    const dto = new CreateTransactionCheckoutDto()
    assert.ok(dto instanceof CreateTransactionCheckoutDto)
  })

  test('RequestTransactionRefundDto supports optional amount and operator', () => {
    const dto = new RequestTransactionRefundDto()
    dto.reason = 'customer-request'
    dto.refundAmount = 88
    dto.operator = 'cashier-1'

    assert.equal(dto.reason, 'customer-request')
    assert.equal(dto.refundAmount, 88)
    assert.equal(dto.operator, 'cashier-1')
  })

  test('ReviewTransactionRefundDto supports optional operator and note', () => {
    const dto = new ReviewTransactionRefundDto()
    dto.operator = 'ops-reviewer'
    dto.note = 'risk-cleared'

    assert.equal(dto.operator, 'ops-reviewer')
    assert.equal(dto.note, 'risk-cleared')
  })

  test('BatchReviewTransactionRefundsDto supports refundIds plus review fields', () => {
    const dto = new BatchReviewTransactionRefundsDto()
    dto.refundIds = ['refund-1', 'refund-2']
    dto.operator = 'ops-batch'
    dto.note = 'batched'

    assert.equal(dto.refundIds?.length, 2)
    assert.equal(dto.refundIds?.[0], 'refund-1')
    assert.equal(dto.operator, 'ops-batch')
    assert.equal(dto.note, 'batched')
  })

  test('BatchAssignTransactionRefundsDto supports suggestedOwner, assignee, and filters', () => {
    const dto = new BatchAssignTransactionRefundsDto()
    dto.refundIds = ['refund-10']
    dto.suggestedOwner = 'refund-ops-manager'
    dto.assignee = 'ops-owner-a'
    dto.operator = 'ops-manager'
    dto.note = 'manual-assign'
    dto.dispatchQueueLimit = 5

    assert.equal(dto.refundIds?.[0], 'refund-10')
    assert.equal(dto.suggestedOwner, 'refund-ops-manager')
    assert.equal(dto.assignee, 'ops-owner-a')
    assert.equal(dto.operator, 'ops-manager')
    assert.equal(dto.note, 'manual-assign')
    assert.equal(dto.dispatchQueueLimit, 5)
  })

  test('BatchClaimTransactionRefundsDto supports suggestedOwner and operator', () => {
    const dto = new BatchClaimTransactionRefundsDto()
    dto.suggestedOwner = 'refund-team-lead'
    dto.operator = 'ops-claimer'
    dto.note = 'claim-self'
    dto.limit = 2

    assert.equal(dto.suggestedOwner, 'refund-team-lead')
    assert.equal(dto.operator, 'ops-claimer')
    assert.equal(dto.note, 'claim-self')
    assert.equal(dto.limit, 2)
  })

  test('RequestTransactionTimeoutCloseDto supports optional reason and operator', () => {
    const dto = new RequestTransactionTimeoutCloseDto()
    dto.reason = 'payment-timeout'
    dto.operator = 'system-cron'

    assert.equal(dto.reason, 'payment-timeout')
    assert.equal(dto.operator, 'system-cron')
  })

  test('RequestTransactionManualCloseDto supports optional reason and operator', () => {
    const dto = new RequestTransactionManualCloseDto()
    dto.reason = 'customer-cancelled'
    dto.operator = 'ops-a'

    assert.equal(dto.reason, 'customer-cancelled')
    assert.equal(dto.operator, 'ops-a')
  })

  test('ListTransactionOrdersQueryDto supports filter fields', () => {
    const dto = new ListTransactionOrdersQueryDto()
    dto.memberId = 'mem-1'
    dto.status = 'CLOSED'
    dto.paymentStatus = 'FAILED'
    dto.closeReason = 'PAYMENT_TIMEOUT'
    dto.hasRefund = false
    dto.limit = 20

    assert.equal(dto.memberId, 'mem-1')
    assert.equal(dto.status, 'CLOSED')
    assert.equal(dto.paymentStatus, 'FAILED')
    assert.equal(dto.closeReason, 'PAYMENT_TIMEOUT')
    assert.equal(dto.hasRefund, false)
    assert.equal(dto.limit, 20)
  })

  test('ListTransactionRefundsQueryDto supports refund filter fields', () => {
    const dto = new ListTransactionRefundsQueryDto()
    dto.memberId = 'mem-9'
    dto.orderId = 'order-9'
    dto.operator = 'ops-9'
    dto.reviewedBy = 'reviewer-9'
    dto.requestedAfter = '2026-06-14T00:00:00.000Z'
    dto.requestedBefore = '2026-06-14T23:59:59.000Z'
    dto.reviewedAfter = '2026-06-15T00:00:00.000Z'
    dto.reviewedBefore = '2026-06-15T23:59:59.000Z'
    dto.status = 'COMPLETED'
    dto.limit = 5

    assert.equal(dto.memberId, 'mem-9')
    assert.equal(dto.orderId, 'order-9')
    assert.equal(dto.operator, 'ops-9')
    assert.equal(dto.reviewedBy, 'reviewer-9')
    assert.equal(dto.requestedAfter, '2026-06-14T00:00:00.000Z')
    assert.equal(dto.requestedBefore, '2026-06-14T23:59:59.000Z')
    assert.equal(dto.reviewedAfter, '2026-06-15T00:00:00.000Z')
    assert.equal(dto.reviewedBefore, '2026-06-15T23:59:59.000Z')
    assert.equal(dto.status, 'COMPLETED')
    assert.equal(dto.limit, 5)
  })

  test('GetTransactionRefundDashboardQueryDto supports refund filters and recentReviewLimit', () => {
    const dto = new GetTransactionRefundDashboardQueryDto()
    dto.status = 'PENDING'
    dto.reviewedBy = 'ops-1'
    dto.recentReviewLimit = 8
    dto.priorityQueueLimit = 3
    dto.dispatchQueueLimit = 6
    dto.recentEscalationLimit = 4
    dto.teamLeadThresholdMinutes = 30
    dto.opsManagerThresholdMinutes = 90
    dto.financeThresholdMinutes = 360
    dto.asOfTime = '2026-06-16T00:00:00.000Z'

    assert.equal(dto.status, 'PENDING')
    assert.equal(dto.reviewedBy, 'ops-1')
    assert.equal(dto.recentReviewLimit, 8)
    assert.equal(dto.priorityQueueLimit, 3)
    assert.equal(dto.dispatchQueueLimit, 6)
    assert.equal(dto.recentEscalationLimit, 4)
    assert.equal(dto.teamLeadThresholdMinutes, 30)
    assert.equal(dto.opsManagerThresholdMinutes, 90)
    assert.equal(dto.financeThresholdMinutes, 360)
    assert.equal(dto.asOfTime, '2026-06-16T00:00:00.000Z')
  })

  test('BatchTimeoutCloseOrdersDto supports batch selectors', () => {
    const dto = new BatchTimeoutCloseOrdersDto()
    dto.orderIds = ['order-1', 'order-2']
    dto.memberId = 'mem-2'
    dto.beforeTime = '2026-06-14T00:00:00.000Z'
    dto.limit = 2

    assert.equal(dto.orderIds?.length, 2)
    assert.equal(dto.memberId, 'mem-2')
    assert.equal(dto.beforeTime, '2026-06-14T00:00:00.000Z')
    assert.equal(dto.limit, 2)
  })
})
