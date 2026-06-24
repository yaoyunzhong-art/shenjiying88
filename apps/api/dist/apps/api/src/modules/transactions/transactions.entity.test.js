"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importStar(require("node:test"));
const cashier_entity_1 = require("../cashier/cashier.entity");
const loyalty_entity_1 = require("../loyalty/loyalty.entity");
const transactions_entity_1 = require("./transactions.entity");
(0, node_test_1.describe)('transactions.entity', () => {
    (0, node_test_1.default)('TransactionAggregate contract supports full snapshot shape', () => {
        const aggregate = {
            order: {
                orderId: 'order-1',
                tenantContext: { tenantId: 't-1' },
                memberId: 'mem-1',
                items: [{ skuId: 'sku-1', quantity: 1, price: 50 }],
                currency: 'CNY',
                totalAmount: 50,
                status: cashier_entity_1.CashierOrderStatus.Created,
                closeReason: cashier_entity_1.CashierOrderCloseReason.PaymentTimeout,
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
                status: cashier_entity_1.CashierPaymentStatus.Succeeded,
                createdAt: '2026-06-14T00:00:00.000Z',
                updatedAt: '2026-06-14T00:00:00.000Z'
            },
            settlement: {
                settlementId: 'set-1',
                tenantContext: { tenantId: 't-1' },
                orderId: 'order-1',
                paymentId: 'pay-1',
                memberId: 'mem-1',
                status: loyalty_entity_1.LoyaltySettlementStatus.Succeeded,
                awardedPoints: 50,
                createdAt: '2026-06-14T00:00:00.000Z',
                updatedAt: '2026-06-14T00:00:00.000Z'
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
                    status: transactions_entity_1.TransactionRefundStatus.Completed,
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
        };
        strict_1.default.equal(aggregate.order.orderId, 'order-1');
        strict_1.default.equal(aggregate.pointsLedger.length, 1);
        strict_1.default.equal(aggregate.refunds[0]?.refundAmount, 20);
    });
    (0, node_test_1.default)('MemberTransactionTimelineEntry contract supports sorted timeline entry', () => {
        const entry = {
            orderId: 'order-2',
            memberId: 'mem-2',
            status: cashier_entity_1.CashierOrderStatus.Paid,
            paymentStatus: cashier_entity_1.CashierPaymentStatus.Succeeded,
            totalAmount: 200,
            currency: 'CNY',
            awardedPoints: 20,
            refundedAmount: 50,
            refundStatus: transactions_entity_1.TransactionRefundStatus.Completed,
            couponCode: 'COUPON-1',
            blindboxPlanId: 'bb-plan',
            blindboxStatus: loyalty_entity_1.BlindboxFulfillmentStatus.Revoked,
            closeReason: cashier_entity_1.CashierOrderCloseReason.FullRefund,
            closedBy: 'ops-user',
            closeNote: 'customer-request',
            createdAt: '2026-06-13T00:00:00.000Z',
            updatedAt: '2026-06-14T00:00:00.000Z',
            paidAt: '2026-06-13T12:00:00.000Z',
            closedAt: '2026-06-14T00:00:00.000Z'
        };
        strict_1.default.equal(entry.orderId, 'order-2');
        strict_1.default.equal(entry.totalAmount, 200);
        strict_1.default.equal(entry.couponCode, 'COUPON-1');
        strict_1.default.equal(entry.refundedAmount, 50);
        strict_1.default.equal(entry.blindboxStatus, loyalty_entity_1.BlindboxFulfillmentStatus.Revoked);
        strict_1.default.equal(entry.closeReason, cashier_entity_1.CashierOrderCloseReason.FullRefund);
        strict_1.default.equal(entry.closedBy, 'ops-user');
        strict_1.default.equal(entry.closeNote, 'customer-request');
        strict_1.default.ok(entry.paidAt);
    });
    (0, node_test_1.default)('MemberTransactionTimelineEntry supports minimal shape without coupon/blindbox', () => {
        const entry = {
            orderId: 'order-min',
            memberId: 'mem-min',
            status: cashier_entity_1.CashierOrderStatus.Created,
            totalAmount: 10,
            currency: 'CNY',
            awardedPoints: 0,
            refundedAmount: 0,
            createdAt: '2026-06-14T00:00:00.000Z',
            updatedAt: '2026-06-14T00:00:00.000Z'
        };
        strict_1.default.equal(entry.couponCode, undefined);
        strict_1.default.equal(entry.blindboxPlanId, undefined);
        strict_1.default.equal(entry.blindboxStatus, undefined);
        strict_1.default.equal(entry.paidAt, undefined);
        strict_1.default.equal(entry.closeReason, undefined);
        strict_1.default.equal(entry.closedBy, undefined);
        strict_1.default.equal(entry.closeNote, undefined);
        strict_1.default.equal(entry.closedAt, undefined);
        strict_1.default.equal(entry.refundStatus, undefined);
    });
    (0, node_test_1.default)('TransactionBatchTimeoutCloseResult supports processed and skipped order sets', () => {
        const result = {
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
                        status: cashier_entity_1.CashierOrderStatus.Closed,
                        closeReason: cashier_entity_1.CashierOrderCloseReason.PaymentTimeout,
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
                        status: cashier_entity_1.CashierPaymentStatus.Failed,
                        createdAt: '2026-06-14T00:00:00.000Z',
                        updatedAt: '2026-06-14T00:10:00.000Z'
                    },
                    pointsLedger: [],
                    couponRedemptions: [],
                    blindboxFulfillments: [],
                    refunds: []
                }
            ]
        };
        strict_1.default.equal(result.processedCount, 1);
        strict_1.default.equal(result.skippedCount, 1);
        strict_1.default.equal(result.processedOrderIds[0], 'order-1');
        strict_1.default.equal(result.skippedOrderIds[0], 'order-2');
    });
    (0, node_test_1.default)('TransactionBatchRefundReviewResult supports processed and skipped refund sets', () => {
        const result = {
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
                    status: transactions_entity_1.TransactionRefundStatus.Completed,
                    requestedAt: '2026-06-14T01:00:00.000Z',
                    completedAt: '2026-06-14T01:05:00.000Z',
                    reviewedAt: '2026-06-14T01:05:00.000Z',
                    reviewedBy: 'ops-batch',
                    reviewNote: 'approved'
                }
            ],
            auditSummary: {
                action: transactions_entity_1.TransactionRefundReviewAction.Approve,
                operator: 'ops-batch',
                note: 'approved',
                processedAt: '2026-06-14T01:05:00.000Z'
            }
        };
        strict_1.default.equal(result.processedCount, 1);
        strict_1.default.equal(result.skippedCount, 1);
        strict_1.default.equal(result.processedRefundIds[0], 'refund-1');
        strict_1.default.equal(result.skippedRefundIds[0], 'refund-2');
        strict_1.default.equal(result.refunds[0]?.reviewedBy, 'ops-batch');
        strict_1.default.equal(result.auditSummary.action, transactions_entity_1.TransactionRefundReviewAction.Approve);
        strict_1.default.equal(result.auditSummary.note, 'approved');
    });
    (0, node_test_1.default)('TransactionBatchRefundAssignmentResult supports processed and skipped refund sets', () => {
        const result = {
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
                    status: transactions_entity_1.TransactionRefundStatus.Pending,
                    requestedAt: '2026-06-14T01:00:00.000Z',
                    assignedOwner: 'refund-team-lead',
                    assignedTo: 'ops-owner-a',
                    assignedAt: '2026-06-14T01:05:00.000Z',
                    assignedBy: 'ops-manager',
                    assignmentNote: 'dispatch'
                }
            ],
            assignmentSummary: {
                action: transactions_entity_1.TransactionRefundAssignmentAction.Assign,
                suggestedOwner: 'refund-team-lead',
                assignee: 'ops-owner-a',
                operator: 'ops-manager',
                note: 'dispatch',
                processedAt: '2026-06-14T01:05:00.000Z'
            }
        };
        strict_1.default.equal(result.processedCount, 1);
        strict_1.default.equal(result.refunds[0]?.assignedTo, 'ops-owner-a');
        strict_1.default.equal(result.assignmentSummary.action, transactions_entity_1.TransactionRefundAssignmentAction.Assign);
        strict_1.default.equal(result.assignmentSummary.assignee, 'ops-owner-a');
    });
    (0, node_test_1.default)('TransactionRefundStatus exposes pending, completed and rejected states', () => {
        strict_1.default.equal(transactions_entity_1.TransactionRefundStatus.Pending, 'PENDING');
        strict_1.default.equal(transactions_entity_1.TransactionRefundStatus.Completed, 'COMPLETED');
        strict_1.default.equal(transactions_entity_1.TransactionRefundStatus.Rejected, 'REJECTED');
    });
    (0, node_test_1.default)('TransactionRefundReviewAction exposes approve and reject actions', () => {
        strict_1.default.equal(transactions_entity_1.TransactionRefundReviewAction.Approve, 'APPROVE');
        strict_1.default.equal(transactions_entity_1.TransactionRefundReviewAction.Reject, 'REJECT');
    });
    (0, node_test_1.default)('TransactionRefundDashboard supports summary, pending queue, and recent reviews', () => {
        const dashboard = {
            totalCount: 3,
            totalRequestedAmount: 120,
            totalCompletedAmount: 40,
            totalPendingAmount: 50,
            statusGroups: [
                { status: transactions_entity_1.TransactionRefundStatus.Pending, count: 1, totalAmount: 50 },
                { status: transactions_entity_1.TransactionRefundStatus.Completed, count: 1, totalAmount: 40 },
                { status: transactions_entity_1.TransactionRefundStatus.Rejected, count: 1, totalAmount: 30 }
            ],
            pendingSummary: {
                count: 1,
                totalAmount: 50,
                oldestRequestedAt: '2026-06-14T01:00:00.000Z',
                newestRequestedAt: '2026-06-14T01:00:00.000Z'
            },
            agingBuckets: [
                { bucket: transactions_entity_1.TransactionRefundAgingBucket.Hour4To24, count: 1, totalAmount: 50 }
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
                    agingBucket: transactions_entity_1.TransactionRefundAgingBucket.Hour4To24,
                    riskLevel: transactions_entity_1.TransactionRefundRiskLevel.Medium
                }
            ],
            recentReviews: [
                {
                    refundId: 'refund-1',
                    orderId: 'order-1',
                    memberId: 'mem-1',
                    refundAmount: 40,
                    status: transactions_entity_1.TransactionRefundStatus.Completed,
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
                    escalationLevel: transactions_entity_1.TransactionRefundEscalationLevel.OpsManager,
                    suggestedOwner: 'refund-ops-manager',
                    dispatchReason: transactions_entity_1.TransactionRefundDispatchReason.SlaBreachedOrMediumRisk,
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
                    escalationLevel: transactions_entity_1.TransactionRefundEscalationLevel.OpsManager,
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
                    escalationLevel: transactions_entity_1.TransactionRefundEscalationLevel.OpsManager,
                    suggestedOwner: 'refund-ops-manager',
                    dispatchReason: transactions_entity_1.TransactionRefundDispatchReason.SlaBreachedOrMediumRisk,
                    assignedOwner: 'refund-ops-manager',
                    assignedTo: 'ops-owner-a',
                    assignedAt: '2026-06-14T01:10:00.000Z'
                }
            ]
        };
        strict_1.default.equal(dashboard.totalCount, 3);
        strict_1.default.equal(dashboard.statusGroups[0]?.status, transactions_entity_1.TransactionRefundStatus.Pending);
        strict_1.default.equal(dashboard.pendingSummary.totalAmount, 50);
        strict_1.default.equal(dashboard.agingBuckets[0]?.bucket, transactions_entity_1.TransactionRefundAgingBucket.Hour4To24);
        strict_1.default.equal(dashboard.priorityQueue[0]?.riskLevel, transactions_entity_1.TransactionRefundRiskLevel.Medium);
        strict_1.default.equal(dashboard.recentReviews[0]?.reviewedBy, 'ops-a');
        strict_1.default.equal(dashboard.reviewerSummaries[0]?.reviewCount, 2);
        strict_1.default.equal(dashboard.operatorQuickStats[0]?.operator, 'cashier-1');
        strict_1.default.equal(dashboard.riskSummary.mediumCount, 1);
        strict_1.default.equal(dashboard.escalationSummary.opsManagerCount, 1);
        strict_1.default.equal(dashboard.dispatchQueue[0]?.suggestedOwner, 'refund-ops-manager');
        strict_1.default.equal(dashboard.dispatchQueue[0]?.assignedTo, 'ops-owner-a');
        strict_1.default.equal(dashboard.slaThresholds.opsManagerMinutes, 240);
        strict_1.default.equal(dashboard.ownerSummaries[0]?.pendingCount, 1);
        strict_1.default.equal(dashboard.recentEscalationTrail[0]?.escalationLevel, transactions_entity_1.TransactionRefundEscalationLevel.OpsManager);
    });
});
//# sourceMappingURL=transactions.entity.test.js.map