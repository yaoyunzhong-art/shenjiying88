import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import assert from 'node:assert/strict'
import {
  CashierOrderCloseReason,
  CashierOrderStatus,
  CashierPaymentStatus
} from '../cashier/cashier.entity'
import { BlindboxFulfillmentStatus, LoyaltySettlementStatus } from '../loyalty/loyalty.entity'
import {
  TransactionRefundAgingBucket,
  TransactionRefundAssignmentAction,
  TransactionRefundDispatchReason,
  TransactionRefundEscalationLevel,
  TransactionRefundRiskLevel,
  TransactionRefundReviewAction,
  TransactionRefundStatus,
  type TransactionBatchRefundAssignmentResult,
  type TransactionBatchRefundReviewResult,
  type TransactionBatchTimeoutCloseResult,
  type TransactionRefundDashboard,
  type TransactionAggregate,
  type MemberTransactionTimelineEntry
} from './transactions.entity'

describe('transactions.entity', () => {
  it('TransactionAggregate contract supports full snapshot shape', () => {
    const aggregate: TransactionAggregate = {
      order: {
        orderId: 'order-1',
        tenantContext: { tenantId: 't-1' },
        memberId: 'mem-1',
        items: [{ skuId: 'sku-1', quantity: 1, price: 50 }],
        currency: 'CNY',
        totalAmount: 50,
        status: CashierOrderStatus.Created as CashierOrderStatus,
        closeReason: CashierOrderCloseReason.PaymentTimeout,
        closedBy: 'ops-user',
        closeNote: 'risk-review',
        createdAt: '2026-06-14T00:00:00.000Z',
        updatedAt: '2026-06-14T00:00:00.000Z',
        source: 'memory'
      },
      payment: {
        paymentId: 'pay-1',
        orderId: 'order-1',
        channel: 'wechat-pay',
        amount: 50,
        status: CashierPaymentStatus.Succeeded as CashierPaymentStatus,
        createdAt: '2026-06-14T00:00:00.000Z',
        updatedAt: '2026-06-14T00:00:00.000Z'
      },
      settlement: {
        settlementId: 'set-1',
        pointsEarned: 50,
      },
      pointsLedger: [
        {
          entryId: 'entry-1',
          tenantContext: { tenantId: 't-1' },
          memberId: 'mem-1',
          orderId: 'order-1',
          paymentId: 'pay-1',
          points: 50,
          reason: 'order-settlement',
          createdAt: '2026-06-14T00:00:00.000Z'
        }
      ],
      couponRedemptions: [],
      blindboxFulfillments: [],
      refunds: [
        {
          refundId: 'refund-1',
          tenantContext: { tenantId: 't-1' },
          orderId: 'order-1',
          paymentId: 'pay-1',
          memberId: 'mem-1',
          refundAmount: 20,
          reason: 'customer-request',
          status: TransactionRefundStatus.Completed,
          requestedAt: '2026-06-14T01:00:00.000Z',
          completedAt: '2026-06-14T01:00:00.000Z',
          reviewedAt: '2026-06-14T01:00:00.000Z',
          reviewedBy: 'ops-reviewer',
          reviewNote: 'approved',
          assignedOwner: 'refund-ops-manager',
          assignedTo: 'ops-owner-a',
          assignedAt: '2026-06-14T00:30:00.000Z'
        }
      ]
    }

    assert.equal(aggregate.order.orderId, 'order-1')
    assert.equal(aggregate.pointsLedger.length, 1)
    assert.equal(aggregate.refunds[0]?.refundAmount, 20)
  })

  it('MemberTransactionTimelineEntry contract supports sorted timeline entry', () => {
    const entry: MemberTransactionTimelineEntry = {
      orderId: 'order-2',
      memberId: 'mem-2',
      status: CashierOrderStatus.Paid as CashierOrderStatus,
      paymentStatus: CashierPaymentStatus.Succeeded as CashierPaymentStatus,
      totalAmount: 200,
      currency: 'CNY',
      awardedPoints: 20,
      refundedAmount: 50,
      refundStatus: TransactionRefundStatus.Completed,
      couponCode: 'COUPON-1',
      blindboxPlanId: 'bb-plan',
      blindboxStatus: BlindboxFulfillmentStatus.Revoked,
      closeReason: CashierOrderCloseReason.FullRefund,
      closedBy: 'ops-user',
      closeNote: 'customer-request',
      createdAt: '2026-06-13T00:00:00.000Z',
      updatedAt: '2026-06-14T00:00:00.000Z',
      paidAt: '2026-06-13T12:00:00.000Z',
      closedAt: '2026-06-14T00:00:00.000Z'
    }

    assert.equal(entry.orderId, 'order-2')
    assert.equal(entry.totalAmount, 200)
    assert.equal(entry.couponCode, 'COUPON-1')
    assert.equal(entry.refundedAmount, 50)
    assert.equal(entry.blindboxStatus, BlindboxFulfillmentStatus.Revoked)
    assert.equal(entry.closeReason, CashierOrderCloseReason.FullRefund)
    assert.equal(entry.closedBy, 'ops-user')
    assert.equal(entry.closeNote, 'customer-request')
    assert.ok(entry.paidAt)
  })

  it('MemberTransactionTimelineEntry supports minimal shape without coupon/blindbox', () => {
    const entry: MemberTransactionTimelineEntry = {
      orderId: 'order-min',
      memberId: 'mem-min',
      status: CashierOrderStatus.Created as CashierOrderStatus,
      totalAmount: 10,
      currency: 'CNY',
      awardedPoints: 0,
      refundedAmount: 0,
      createdAt: '2026-06-14T00:00:00.000Z',
      updatedAt: '2026-06-14T00:00:00.000Z'
    }

    assert.equal(entry.couponCode, undefined)
    assert.equal(entry.blindboxPlanId, undefined)
    assert.equal(entry.blindboxStatus, undefined)
    assert.equal(entry.paidAt, undefined)
    assert.equal(entry.closeReason, undefined)
    assert.equal(entry.closedBy, undefined)
    assert.equal(entry.closeNote, undefined)
    assert.equal(entry.closedAt, undefined)
    assert.equal(entry.refundStatus, undefined)
  })

  it('TransactionBatchTimeoutCloseResult supports processed and skipped order sets', () => {
    const result: TransactionBatchTimeoutCloseResult = {
      processedCount: 1,
      skippedCount: 1,
      processedOrderIds: ['order-1'],
      skippedOrderIds: ['order-2'],
      orders: [
        {
          order: {
            orderId: 'order-1',
            tenantContext: { tenantId: 't-1' },
            memberId: 'mem-1',
            items: [{ skuId: 'sku-1', quantity: 1, price: 10 }],
            currency: 'CNY',
            totalAmount: 10,
            status: CashierOrderStatus.Closed,
            closeReason: CashierOrderCloseReason.PaymentTimeout,
            createdAt: '2026-06-14T00:00:00.000Z',
            updatedAt: '2026-06-14T00:10:00.000Z',
            closedAt: '2026-06-14T00:10:00.000Z',
            source: 'memory'
          },
          payment: {
            paymentId: 'pay-1',
            orderId: 'order-1',
            channel: 'wechat-pay',
            amount: 10,
            status: CashierPaymentStatus.Failed,
            createdAt: '2026-06-14T00:00:00.000Z',
            updatedAt: '2026-06-14T00:10:00.000Z'
          },
          pointsLedger: [],
          couponRedemptions: [],
          blindboxFulfillments: [],
          refunds: []
        }
      ]
    }

    assert.equal(result.processedCount, 1)
    assert.equal(result.skippedCount, 1)
    assert.equal(result.processedOrderIds[0], 'order-1')
    assert.equal(result.skippedOrderIds[0], 'order-2')
  })

  it('TransactionBatchRefundReviewResult supports processed and skipped refund sets', () => {
    const result: TransactionBatchRefundReviewResult = {
      processedCount: 1,
      skippedCount: 1,
      processedRefundIds: ['refund-1'],
      skippedRefundIds: ['refund-2'],
      refunds: [
        {
          refundId: 'refund-1',
          tenantContext: { tenantId: 't-1' },
          orderId: 'order-1',
          paymentId: 'pay-1',
          memberId: 'mem-1',
          refundAmount: 20,
          reason: 'customer-request',
          status: TransactionRefundStatus.Completed,
          requestedAt: '2026-06-14T01:00:00.000Z',
          completedAt: '2026-06-14T01:05:00.000Z',
          reviewedAt: '2026-06-14T01:05:00.000Z',
          reviewedBy: 'ops-batch',
          reviewNote: 'approved'
        }
      ],
      auditSummary: {
        action: TransactionRefundReviewAction.Approve,
        operator: 'ops-batch',
        note: 'approved',
        processedAt: '2026-06-14T01:05:00.000Z'
      }
    }

    assert.equal(result.processedCount, 1)
    assert.equal(result.skippedCount, 1)
    assert.equal(result.processedRefundIds[0], 'refund-1')
    assert.equal(result.skippedRefundIds[0], 'refund-2')
    assert.equal(result.refunds[0]?.reviewedBy, 'ops-batch')
    assert.equal(result.auditSummary.action, TransactionRefundReviewAction.Approve)
    assert.equal(result.auditSummary.note, 'approved')
  })

  it('TransactionBatchRefundAssignmentResult supports processed and skipped refund sets', () => {
    const result: TransactionBatchRefundAssignmentResult = {
      processedCount: 1,
      skippedCount: 1,
      processedRefundIds: ['refund-1'],
      skippedRefundIds: ['refund-2'],
      refunds: [
        {
          refundId: 'refund-1',
          tenantContext: { tenantId: 't-1' },
          orderId: 'order-1',
          paymentId: 'pay-1',
          memberId: 'mem-1',
          refundAmount: 20,
          reason: 'customer-request',
          status: TransactionRefundStatus.Pending,
          requestedAt: '2026-06-14T01:00:00.000Z',
          assignedOwner: 'refund-team-lead',
          assignedTo: 'ops-owner-a',
          assignedAt: '2026-06-14T01:05:00.000Z',
          assignedBy: 'ops-manager',
          assignmentNote: 'dispatch'
        }
      ],
      assignmentSummary: {
        action: TransactionRefundAssignmentAction.Assign,
        suggestedOwner: 'refund-team-lead',
        assignee: 'ops-owner-a',
        operator: 'ops-manager',
        note: 'dispatch',
        processedAt: '2026-06-14T01:05:00.000Z'
      }
    }

    assert.equal(result.processedCount, 1)
    assert.equal(result.refunds[0]?.assignedTo, 'ops-owner-a')
    assert.equal(result.assignmentSummary.action, TransactionRefundAssignmentAction.Assign)
    assert.equal(result.assignmentSummary.assignee, 'ops-owner-a')
  })

  it('TransactionRefundStatus exposes pending, completed and rejected states', () => {
    assert.equal(TransactionRefundStatus.Pending, 'PENDING')
    assert.equal(TransactionRefundStatus.Completed, 'COMPLETED')
    assert.equal(TransactionRefundStatus.Rejected, 'REJECTED')
  })

  it('TransactionRefundReviewAction exposes approve and reject actions', () => {
    assert.equal(TransactionRefundReviewAction.Approve, 'APPROVE')
    assert.equal(TransactionRefundReviewAction.Reject, 'REJECT')
  })

  it('TransactionRefundDashboard supports summary, pending queue, and recent reviews', () => {
    const dashboard: TransactionRefundDashboard = {
      totalCount: 3,
      totalRequestedAmount: 120,
      totalCompletedAmount: 40,
      totalPendingAmount: 50,
      statusGroups: [
        { status: TransactionRefundStatus.Pending, count: 1, totalAmount: 50 },
        { status: TransactionRefundStatus.Completed, count: 1, totalAmount: 40 },
        { status: TransactionRefundStatus.Rejected, count: 1, totalAmount: 30 }
      ],
      pendingSummary: {
        count: 1,
        totalAmount: 50,
        oldestRequestedAt: '2026-06-14T01:00:00.000Z',
        newestRequestedAt: '2026-06-14T01:00:00.000Z'
      },
      agingBuckets: [
        { bucket: TransactionRefundAgingBucket.Hour4To24, count: 1, totalAmount: 50 }
      ],
      priorityQueue: [
        {
          refundId: 'refund-pending-1',
          orderId: 'order-pending-1',
          memberId: 'mem-pending-1',
          refundAmount: 50,
          operator: 'cashier-1',
          requestedAt: '2026-06-14T01:00:00.000Z',
          waitingMinutes: 360,
          agingBucket: TransactionRefundAgingBucket.Hour4To24,
          riskLevel: TransactionRefundRiskLevel.Medium
        }
      ],
      recentReviews: [
        {
          refundId: 'refund-1',
          orderId: 'order-1',
          memberId: 'mem-1',
          refundAmount: 40,
          status: TransactionRefundStatus.Completed,
          reviewedAt: '2026-06-15T01:00:00.000Z',
          reviewedBy: 'ops-a',
          reviewNote: 'approved'
        }
      ],
      reviewerSummaries: [
        {
          reviewedBy: 'ops-a',
          reviewCount: 2,
          lastReviewedAt: '2026-06-15T01:00:00.000Z'
        }
      ],
      operatorQuickStats: [
        {
          operator: 'cashier-1',
          count: 2,
          totalAmount: 70
        }
      ],
      riskSummary: {
        lowCount: 0,
        mediumCount: 1,
        highCount: 0
      },
      escalationSummary: {
        noneCount: 0,
        teamLeadCount: 0,
        opsManagerCount: 1,
        financeCount: 0
      },
      dispatchQueue: [
        {
          refundId: 'refund-pending-1',
          orderId: 'order-pending-1',
          memberId: 'mem-pending-1',
          refundAmount: 50,
          operator: 'cashier-1',
          requestedAt: '2026-06-14T01:00:00.000Z',
          waitingMinutes: 360,
          escalationLevel: TransactionRefundEscalationLevel.OpsManager,
          suggestedOwner: 'refund-ops-manager',
          dispatchReason: TransactionRefundDispatchReason.SlaBreachedOrMediumRisk,
          assignedOwner: 'refund-ops-manager',
          assignedTo: 'ops-owner-a',
          assignedAt: '2026-06-14T01:10:00.000Z'
        }
      ],
      slaThresholds: {
        teamLeadMinutes: 60,
        opsManagerMinutes: 240,
        financeMinutes: 1440
      },
      ownerSummaries: [
        {
          suggestedOwner: 'refund-ops-manager',
          escalationLevel: TransactionRefundEscalationLevel.OpsManager,
          pendingCount: 1,
          totalAmount: 50
        }
      ],
      recentEscalationTrail: [
        {
          refundId: 'refund-pending-1',
          orderId: 'order-pending-1',
          memberId: 'mem-pending-1',
          refundAmount: 50,
          requestedAt: '2026-06-14T01:00:00.000Z',
          waitingMinutes: 360,
          escalationLevel: TransactionRefundEscalationLevel.OpsManager,
          suggestedOwner: 'refund-ops-manager',
          dispatchReason: TransactionRefundDispatchReason.SlaBreachedOrMediumRisk,
          assignedOwner: 'refund-ops-manager',
          assignedTo: 'ops-owner-a',
          assignedAt: '2026-06-14T01:10:00.000Z'
        }
      ]
    }

    assert.equal(dashboard.totalCount, 3)
    assert.equal(dashboard.statusGroups[0]?.status, TransactionRefundStatus.Pending)
    assert.equal(dashboard.pendingSummary.totalAmount, 50)
    assert.equal(dashboard.agingBuckets[0]?.bucket, TransactionRefundAgingBucket.Hour4To24)
    assert.equal(dashboard.priorityQueue[0]?.riskLevel, TransactionRefundRiskLevel.Medium)
    assert.equal(dashboard.recentReviews[0]?.reviewedBy, 'ops-a')
    assert.equal(dashboard.reviewerSummaries[0]?.reviewCount, 2)
    assert.equal(dashboard.operatorQuickStats[0]?.operator, 'cashier-1')
    assert.equal(dashboard.riskSummary.mediumCount, 1)
    assert.equal(dashboard.escalationSummary.opsManagerCount, 1)
    assert.equal(dashboard.dispatchQueue[0]?.suggestedOwner, 'refund-ops-manager')
    assert.equal(dashboard.dispatchQueue[0]?.assignedTo, 'ops-owner-a')
    assert.equal(dashboard.slaThresholds.opsManagerMinutes, 240)
    assert.equal(dashboard.ownerSummaries[0]?.pendingCount, 1)
    assert.equal(dashboard.recentEscalationTrail[0]?.escalationLevel, TransactionRefundEscalationLevel.OpsManager)
  })
})
