"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const transactions_entity_1 = require("./transactions.entity");
const cashier_entity_1 = require("../cashier/cashier.entity");
const loyalty_entity_1 = require("../loyalty/loyalty.entity");
const transactions_contract_1 = require("./transactions.contract");
const tenantCtx = { tenantId: 'tenant-demo', brandId: 'brand-demo', storeId: 'store-demo' };
// ---------------------------------------------------------------------------
// toTransactionRefundContract
// ---------------------------------------------------------------------------
(0, node_test_1.default)('toTransactionRefundContract maps pending refund', () => {
    const refund = {
        refundId: 'refund-1',
        tenantContext: tenantCtx,
        orderId: 'order-1',
        paymentId: 'payment-1',
        memberId: 'member-1',
        refundAmount: 99.8,
        reason: '客户不满意',
        operator: 'op-zhang',
        status: transactions_entity_1.TransactionRefundStatus.Pending,
        requestedAt: '2026-06-23T08:00:00.000Z',
    };
    const contract = (0, transactions_contract_1.toTransactionRefundContract)(refund);
    strict_1.default.equal(contract.refundId, 'refund-1');
    strict_1.default.equal(contract.tenantId, 'tenant-demo');
    strict_1.default.equal(contract.orderId, 'order-1');
    strict_1.default.equal(contract.paymentId, 'payment-1');
    strict_1.default.equal(contract.memberId, 'member-1');
    strict_1.default.equal(contract.refundAmount, 99.8);
    strict_1.default.equal(contract.reason, '客户不满意');
    strict_1.default.equal(contract.operator, 'op-zhang');
    strict_1.default.equal(contract.status, transactions_entity_1.TransactionRefundStatus.Pending);
    strict_1.default.equal(contract.requestedAt, '2026-06-23T08:00:00.000Z');
    strict_1.default.equal(contract.completedAt, undefined);
    strict_1.default.equal(contract.reviewedAt, undefined);
    strict_1.default.equal(contract.reviewedBy, undefined);
    strict_1.default.equal(contract.reviewNote, undefined);
});
(0, node_test_1.default)('toTransactionRefundContract maps completed refund with review info', () => {
    const refund = {
        refundId: 'refund-2',
        tenantContext: tenantCtx,
        orderId: 'order-2',
        paymentId: 'payment-2',
        memberId: 'member-2',
        refundAmount: 50,
        reason: '价格错误',
        operator: 'op-li',
        status: transactions_entity_1.TransactionRefundStatus.Completed,
        requestedAt: '2026-06-22T10:00:00.000Z',
        completedAt: '2026-06-22T10:30:00.000Z',
        reviewedAt: '2026-06-22T10:15:00.000Z',
        reviewedBy: 'admin-wang',
        reviewNote: '同意退款',
    };
    const contract = (0, transactions_contract_1.toTransactionRefundContract)(refund);
    strict_1.default.equal(contract.status, transactions_entity_1.TransactionRefundStatus.Completed);
    strict_1.default.equal(contract.completedAt, '2026-06-22T10:30:00.000Z');
    strict_1.default.equal(contract.reviewedAt, '2026-06-22T10:15:00.000Z');
    strict_1.default.equal(contract.reviewedBy, 'admin-wang');
    strict_1.default.equal(contract.reviewNote, '同意退款');
});
(0, node_test_1.default)('toTransactionRefundContract maps rejected refund', () => {
    const refund = {
        refundId: 'refund-3',
        tenantContext: tenantCtx,
        orderId: 'order-3',
        paymentId: 'payment-3',
        memberId: 'member-3',
        refundAmount: 200,
        reason: '重复购买',
        operator: undefined,
        status: transactions_entity_1.TransactionRefundStatus.Rejected,
        requestedAt: '2026-06-21T12:00:00.000Z',
        reviewedAt: '2026-06-21T13:00:00.000Z',
        reviewedBy: 'admin-zhao',
        reviewNote: '不符合退款条件',
    };
    const contract = (0, transactions_contract_1.toTransactionRefundContract)(refund);
    strict_1.default.equal(contract.status, transactions_entity_1.TransactionRefundStatus.Rejected);
    strict_1.default.equal(contract.operator, undefined);
    strict_1.default.equal(contract.reviewNote, '不符合退款条件');
});
// ---------------------------------------------------------------------------
// toTransactionAggregateContract
// ---------------------------------------------------------------------------
(0, node_test_1.default)('toTransactionAggregateContract maps paid order without refunds', () => {
    const order = {
        orderId: 'order-1',
        tenantContext: tenantCtx,
        memberId: 'member-1',
        items: [{ skuId: 'sku-1', quantity: 1, price: 99 }],
        currency: 'CNY',
        totalAmount: 99,
        couponCode: 'COUPON10',
        blindboxPlanId: undefined,
        blindboxQuantity: undefined,
        status: 'PAID',
        latestPaymentId: 'payment-1',
        createdAt: '2026-06-23T08:00:00.000Z',
        updatedAt: '2026-06-23T08:05:00.000Z',
        paidAt: '2026-06-23T08:03:00.000Z',
        source: 'memory',
    };
    const payment = {
        paymentId: 'payment-1',
        orderId: 'order-1',
        channel: 'wechat',
        amount: 99,
        status: 'SUCCEEDED',
        createdAt: '2026-06-23T08:02:00.000Z',
        updatedAt: '2026-06-23T08:03:00.000Z',
    };
    const aggregate = {
        order: order,
        payment: payment,
        settlement: undefined,
        pointsLedger: [],
        couponRedemptions: [],
        blindboxFulfillments: [],
        refunds: [],
    };
    const contract = (0, transactions_contract_1.toTransactionAggregateContract)(aggregate);
    strict_1.default.equal(contract.orderId, 'order-1');
    strict_1.default.equal(contract.tenantId, 'tenant-demo');
    strict_1.default.equal(contract.memberId, 'member-1');
    strict_1.default.equal(contract.orderStatus, 'PAID');
    strict_1.default.equal(contract.paymentStatus, 'SUCCEEDED');
    strict_1.default.equal(contract.totalAmount, 99);
    strict_1.default.equal(contract.currency, 'CNY');
    strict_1.default.equal(contract.paidAmount, 99);
    strict_1.default.equal(contract.refundedAmount, 0);
    strict_1.default.equal(contract.refundStatus, undefined);
    strict_1.default.equal(contract.refundCount, 0);
    strict_1.default.equal(contract.couponCode, 'COUPON10');
    strict_1.default.equal(contract.blindboxPlanId, undefined);
});
(0, node_test_1.default)('toTransactionAggregateContract maps order with completed refund', () => {
    const order = {
        orderId: 'order-2',
        tenantContext: tenantCtx,
        memberId: 'member-2',
        items: [{ skuId: 'sku-2', quantity: 2, price: 50 }],
        currency: 'CNY',
        totalAmount: 100,
        couponCode: undefined,
        blindboxPlanId: 'plan-1',
        blindboxQuantity: 2,
        status: 'CLOSED',
        latestPaymentId: 'payment-2',
        createdAt: '2026-06-22T10:00:00.000Z',
        updatedAt: '2026-06-22T11:00:00.000Z',
        paidAt: '2026-06-22T10:30:00.000Z',
        source: 'memory',
    };
    const payment = {
        paymentId: 'payment-2',
        orderId: 'order-2',
        channel: 'alipay',
        amount: 100,
        status: 'SUCCEEDED',
        createdAt: '2026-06-22T10:25:00.000Z',
        updatedAt: '2026-06-22T10:30:00.000Z',
    };
    const refund = {
        refundId: 'refund-1',
        tenantContext: tenantCtx,
        orderId: 'order-2',
        paymentId: 'payment-2',
        memberId: 'member-2',
        refundAmount: 100,
        reason: '质量问题',
        status: transactions_entity_1.TransactionRefundStatus.Completed,
        requestedAt: '2026-06-22T10:35:00.000Z',
    };
    const aggregate = {
        order: order,
        payment: payment,
        settlement: undefined,
        pointsLedger: [],
        couponRedemptions: [],
        blindboxFulfillments: [],
        refunds: [refund],
    };
    const contract = (0, transactions_contract_1.toTransactionAggregateContract)(aggregate);
    strict_1.default.equal(contract.orderId, 'order-2');
    strict_1.default.equal(contract.orderStatus, 'CLOSED');
    strict_1.default.equal(contract.totalAmount, 100);
    strict_1.default.equal(contract.paidAmount, 100);
    strict_1.default.equal(contract.refundedAmount, 100);
    strict_1.default.equal(contract.refundStatus, transactions_entity_1.TransactionRefundStatus.Completed);
    strict_1.default.equal(contract.refundCount, 1);
    strict_1.default.equal(contract.blindboxPlanId, 'plan-1');
    strict_1.default.equal(contract.couponCode, undefined);
});
(0, node_test_1.default)('toTransactionAggregateContract maps pending refund not counted in refundedAmount', () => {
    const order = {
        orderId: 'order-3',
        tenantContext: tenantCtx,
        memberId: 'member-3',
        items: [{ skuId: 'sku-3', quantity: 1, price: 30 }],
        currency: 'CNY',
        totalAmount: 30,
        couponCode: undefined,
        blindboxPlanId: undefined,
        blindboxQuantity: undefined,
        status: 'PAID',
        latestPaymentId: 'payment-3',
        createdAt: '2026-06-23T09:00:00.000Z',
        updatedAt: '2026-06-23T09:05:00.000Z',
        paidAt: '2026-06-23T09:03:00.000Z',
        source: 'memory',
    };
    const payment = {
        paymentId: 'payment-3',
        orderId: 'order-3',
        channel: 'unionpay',
        amount: 30,
        status: 'SUCCEEDED',
        createdAt: '2026-06-23T09:02:00.000Z',
        updatedAt: '2026-06-23T09:03:00.000Z',
    };
    const refund = {
        refundId: 'refund-pending',
        tenantContext: tenantCtx,
        orderId: 'order-3',
        paymentId: 'payment-3',
        memberId: 'member-3',
        refundAmount: 30,
        reason: '测试退款',
        status: transactions_entity_1.TransactionRefundStatus.Pending,
        requestedAt: '2026-06-23T09:10:00.000Z',
    };
    const aggregate = {
        order: order,
        payment: payment,
        settlement: undefined,
        pointsLedger: [],
        couponRedemptions: [],
        blindboxFulfillments: [],
        refunds: [refund],
    };
    const contract = (0, transactions_contract_1.toTransactionAggregateContract)(aggregate);
    // Pending refunds are NOT counted as refunded
    strict_1.default.equal(contract.refundedAmount, 0);
    strict_1.default.equal(contract.refundStatus, transactions_entity_1.TransactionRefundStatus.Pending);
    strict_1.default.equal(contract.refundCount, 1);
    strict_1.default.equal(contract.orderStatus, 'PAID');
});
(0, node_test_1.default)('toTransactionAggregateContract handles missing payment', () => {
    const order = {
        orderId: 'order-4',
        tenantContext: tenantCtx,
        memberId: 'member-4',
        items: [{ skuId: 'sku-4', quantity: 1, price: 50 }],
        currency: 'CNY',
        totalAmount: 50,
        couponCode: undefined,
        blindboxPlanId: undefined,
        blindboxQuantity: undefined,
        status: 'CREATED',
        latestPaymentId: undefined,
        createdAt: '2026-06-23T10:00:00.000Z',
        updatedAt: '2026-06-23T10:00:00.000Z',
        paidAt: undefined,
        source: 'memory',
    };
    const aggregate = {
        order: order,
        payment: undefined,
        settlement: undefined,
        pointsLedger: [],
        couponRedemptions: [],
        blindboxFulfillments: [],
        refunds: [],
    };
    const contract = (0, transactions_contract_1.toTransactionAggregateContract)(aggregate);
    strict_1.default.equal(contract.orderId, 'order-4');
    strict_1.default.equal(contract.paymentStatus, undefined);
    strict_1.default.equal(contract.paidAmount, undefined);
    strict_1.default.equal(contract.refundedAmount, 0);
    strict_1.default.equal(contract.refundCount, 0);
});
// ---------------------------------------------------------------------------
// toLytOrderSnapshotContract
// ---------------------------------------------------------------------------
(0, node_test_1.default)('toLytOrderSnapshotContract maps snapshot from memory source', () => {
    const snapshot = {
        snapshotId: 'snap-order-1',
        tenantContext: tenantCtx,
        externalOrderId: 'ext-order-1',
        orderNo: 'NO20260623001',
        memberId: 'member-1',
        couponCode: 'CP10',
        amount: 100,
        discountAmount: 10,
        payableAmount: 90,
        currency: 'CNY',
        status: 'PAID',
        paidAt: '2026-06-23T08:00:00.000Z',
        updatedAtFromSource: '2026-06-23T08:05:00.000Z',
        source: 'memory',
    };
    const contract = (0, transactions_contract_1.toLytOrderSnapshotContract)(snapshot);
    strict_1.default.equal(contract.snapshotId, 'snap-order-1');
    strict_1.default.equal(contract.tenantId, 'tenant-demo');
    strict_1.default.equal(contract.externalOrderId, 'ext-order-1');
    strict_1.default.equal(contract.orderNo, 'NO20260623001');
    strict_1.default.equal(contract.memberId, 'member-1');
    strict_1.default.equal(contract.couponCode, 'CP10');
    strict_1.default.equal(contract.amount, 100);
    strict_1.default.equal(contract.discountAmount, 10);
    strict_1.default.equal(contract.payableAmount, 90);
    strict_1.default.equal(contract.currency, 'CNY');
    strict_1.default.equal(contract.status, 'PAID');
    strict_1.default.equal(contract.paidAt, '2026-06-23T08:00:00.000Z');
    strict_1.default.equal(contract.source, 'memory');
});
(0, node_test_1.default)('toLytOrderSnapshotContract maps snapshot from prisma source with optional fields omitted', () => {
    const snapshot = {
        snapshotId: 'snap-order-2',
        tenantContext: tenantCtx,
        externalOrderId: 'ext-order-2',
        orderNo: undefined,
        memberId: undefined,
        couponCode: undefined,
        amount: 50,
        discountAmount: 0,
        payableAmount: 50,
        currency: 'CNY',
        status: 'UPDATED',
        paidAt: undefined,
        updatedAtFromSource: '2026-06-22T12:00:00.000Z',
        source: 'prisma',
    };
    const contract = (0, transactions_contract_1.toLytOrderSnapshotContract)(snapshot);
    strict_1.default.equal(contract.snapshotId, 'snap-order-2');
    strict_1.default.equal(contract.orderNo, undefined);
    strict_1.default.equal(contract.memberId, undefined);
    strict_1.default.equal(contract.couponCode, undefined);
    strict_1.default.equal(contract.paidAt, undefined);
    strict_1.default.equal(contract.source, 'prisma');
    strict_1.default.equal(contract.payableAmount, 50);
});
(0, node_test_1.default)('toLytOrderSnapshotContract source defaults to memory when undefined', () => {
    const snapshot = {
        snapshotId: 'snap-order-3',
        tenantContext: tenantCtx,
        externalOrderId: 'ext-order-3',
        amount: 200,
        discountAmount: 20,
        payableAmount: 180,
        currency: 'CNY',
        status: 'PAID',
        updatedAtFromSource: '2026-06-23T09:00:00.000Z',
        source: undefined,
    };
    const contract = (0, transactions_contract_1.toLytOrderSnapshotContract)(snapshot);
    strict_1.default.equal(contract.source, 'memory');
});
// ---------------------------------------------------------------------------
// toLytPaymentSnapshotContract
// ---------------------------------------------------------------------------
(0, node_test_1.default)('toLytPaymentSnapshotContract maps succeeded payment snapshot', () => {
    const snapshot = {
        snapshotId: 'snap-pay-1',
        tenantContext: tenantCtx,
        externalPaymentId: 'ext-pay-1',
        externalOrderId: 'ext-order-1',
        paymentChannel: 'wechat',
        paymentStatus: 'SUCCEEDED',
        amount: 99.8,
        currency: 'CNY',
        transactionNo: 'txn-001',
        paidAt: '2026-06-23T08:03:00.000Z',
        updatedAtFromSource: '2026-06-23T08:03:00.000Z',
        source: 'memory',
    };
    const contract = (0, transactions_contract_1.toLytPaymentSnapshotContract)(snapshot);
    strict_1.default.equal(contract.snapshotId, 'snap-pay-1');
    strict_1.default.equal(contract.tenantId, 'tenant-demo');
    strict_1.default.equal(contract.externalPaymentId, 'ext-pay-1');
    strict_1.default.equal(contract.externalOrderId, 'ext-order-1');
    strict_1.default.equal(contract.paymentChannel, 'wechat');
    strict_1.default.equal(contract.paymentStatus, 'SUCCEEDED');
    strict_1.default.equal(contract.amount, 99.8);
    strict_1.default.equal(contract.currency, 'CNY');
    strict_1.default.equal(contract.transactionNo, 'txn-001');
    strict_1.default.equal(contract.paidAt, '2026-06-23T08:03:00.000Z');
    strict_1.default.equal(contract.source, 'memory');
});
(0, node_test_1.default)('toLytPaymentSnapshotContract maps pending payment snapshot', () => {
    const snapshot = {
        snapshotId: 'snap-pay-2',
        tenantContext: tenantCtx,
        externalPaymentId: 'ext-pay-2',
        externalOrderId: 'ext-order-2',
        paymentChannel: undefined,
        paymentStatus: 'PENDING',
        amount: 150,
        currency: 'CNY',
        transactionNo: undefined,
        paidAt: undefined,
        updatedAtFromSource: '2026-06-23T10:00:00.000Z',
        source: 'prisma',
    };
    const contract = (0, transactions_contract_1.toLytPaymentSnapshotContract)(snapshot);
    strict_1.default.equal(contract.paymentStatus, 'PENDING');
    strict_1.default.equal(contract.paymentChannel, undefined);
    strict_1.default.equal(contract.transactionNo, undefined);
    strict_1.default.equal(contract.paidAt, undefined);
    strict_1.default.equal(contract.source, 'prisma');
});
// ---------------------------------------------------------------------------
// toMemberTransactionTimelineContract
// ---------------------------------------------------------------------------
(0, node_test_1.default)('toMemberTransactionTimelineContract maps paid entry with points and refund', () => {
    const entry = {
        orderId: 'order-1',
        memberId: 'member-1',
        status: cashier_entity_1.CashierOrderStatus.Paid,
        paymentStatus: cashier_entity_1.CashierPaymentStatus.Succeeded,
        totalAmount: 99.8,
        currency: 'CNY',
        awardedPoints: 99,
        refundedAmount: 0,
        refundStatus: undefined,
        couponCode: 'COUPON10',
        blindboxPlanId: 'plan-1',
        blindboxStatus: loyalty_entity_1.BlindboxFulfillmentStatus.Fulfilled,
        closeReason: undefined,
        closedBy: undefined,
        closeNote: undefined,
        createdAt: '2026-06-23T08:00:00.000Z',
        updatedAt: '2026-06-23T08:05:00.000Z',
        paidAt: '2026-06-23T08:03:00.000Z',
        closedAt: undefined,
    };
    const contract = (0, transactions_contract_1.toMemberTransactionTimelineContract)(entry);
    strict_1.default.equal(contract.orderId, 'order-1');
    strict_1.default.equal(contract.memberId, 'member-1');
    strict_1.default.equal(contract.status, 'PAID');
    strict_1.default.equal(contract.paymentStatus, 'SUCCEEDED');
    strict_1.default.equal(contract.totalAmount, 99.8);
    strict_1.default.equal(contract.currency, 'CNY');
    strict_1.default.equal(contract.awardedPoints, 99);
    strict_1.default.equal(contract.refundedAmount, 0);
    strict_1.default.equal(contract.refundStatus, undefined);
    strict_1.default.equal(contract.couponCode, 'COUPON10');
    strict_1.default.equal(contract.blindboxPlanId, 'plan-1');
    strict_1.default.equal(contract.blindboxStatus, 'FULFILLED');
    strict_1.default.equal(contract.paidAt, '2026-06-23T08:03:00.000Z');
    strict_1.default.equal(contract.closedAt, undefined);
});
(0, node_test_1.default)('toMemberTransactionTimelineContract maps closed entry with full refund', () => {
    const entry = {
        orderId: 'order-2',
        memberId: 'member-2',
        status: cashier_entity_1.CashierOrderStatus.Closed,
        paymentStatus: cashier_entity_1.CashierPaymentStatus.Succeeded,
        totalAmount: 200,
        currency: 'CNY',
        awardedPoints: 0,
        refundedAmount: 200,
        refundStatus: transactions_entity_1.TransactionRefundStatus.Completed,
        couponCode: undefined,
        blindboxPlanId: undefined,
        blindboxStatus: undefined,
        closeReason: cashier_entity_1.CashierOrderCloseReason.FullRefund,
        closedBy: 'system',
        closeNote: '全额退款自动关闭',
        createdAt: '2026-06-22T10:00:00.000Z',
        updatedAt: '2026-06-22T11:00:00.000Z',
        paidAt: '2026-06-22T10:30:00.000Z',
        closedAt: '2026-06-22T11:00:00.000Z',
    };
    const contract = (0, transactions_contract_1.toMemberTransactionTimelineContract)(entry);
    strict_1.default.equal(contract.orderId, 'order-2');
    strict_1.default.equal(contract.status, 'CLOSED');
    strict_1.default.equal(contract.awardedPoints, 0);
    strict_1.default.equal(contract.refundedAmount, 200);
    strict_1.default.equal(contract.refundStatus, transactions_entity_1.TransactionRefundStatus.Completed);
    strict_1.default.equal(contract.couponCode, undefined);
    strict_1.default.equal(contract.blindboxPlanId, undefined);
    strict_1.default.equal(contract.blindboxStatus, undefined);
    strict_1.default.equal(contract.closeReason, 'FULL_REFUND');
    strict_1.default.equal(contract.closedBy, 'system');
    strict_1.default.equal(contract.closeNote, '全额退款自动关闭');
    strict_1.default.equal(contract.closedAt, '2026-06-22T11:00:00.000Z');
});
(0, node_test_1.default)('toMemberTransactionTimelineContract maps entry with rejected refund', () => {
    const entry = {
        orderId: 'order-3',
        memberId: 'member-3',
        status: cashier_entity_1.CashierOrderStatus.Paid,
        paymentStatus: cashier_entity_1.CashierPaymentStatus.Succeeded,
        totalAmount: 50,
        currency: 'CNY',
        awardedPoints: 50,
        refundedAmount: 0,
        refundStatus: transactions_entity_1.TransactionRefundStatus.Rejected,
        couponCode: undefined,
        blindboxPlanId: undefined,
        blindboxStatus: undefined,
        closeReason: undefined,
        closedBy: undefined,
        closeNote: undefined,
        createdAt: '2026-06-23T09:00:00.000Z',
        updatedAt: '2026-06-23T09:10:00.000Z',
        paidAt: '2026-06-23T09:05:00.000Z',
        closedAt: undefined,
    };
    const contract = (0, transactions_contract_1.toMemberTransactionTimelineContract)(entry);
    strict_1.default.equal(contract.orderId, 'order-3');
    strict_1.default.equal(contract.status, 'PAID');
    strict_1.default.equal(contract.awardedPoints, 50);
    strict_1.default.equal(contract.refundedAmount, 0);
    strict_1.default.equal(contract.refundStatus, transactions_entity_1.TransactionRefundStatus.Rejected);
    strict_1.default.equal(contract.closeReason, undefined);
    strict_1.default.equal(contract.closedBy, undefined);
});
(0, node_test_1.default)('toMemberTransactionTimelineContract maps entry without payment', () => {
    const entry = {
        orderId: 'order-4',
        memberId: 'member-4',
        status: cashier_entity_1.CashierOrderStatus.Created,
        paymentStatus: undefined,
        totalAmount: 30,
        currency: 'CNY',
        awardedPoints: 0,
        refundedAmount: 0,
        refundStatus: undefined,
        couponCode: undefined,
        blindboxPlanId: undefined,
        blindboxStatus: undefined,
        closeReason: undefined,
        closedBy: undefined,
        closeNote: undefined,
        createdAt: '2026-06-23T10:00:00.000Z',
        updatedAt: '2026-06-23T10:00:00.000Z',
        paidAt: undefined,
        closedAt: undefined,
    };
    const contract = (0, transactions_contract_1.toMemberTransactionTimelineContract)(entry);
    strict_1.default.equal(contract.status, 'CREATED');
    strict_1.default.equal(contract.paymentStatus, undefined);
    strict_1.default.equal(contract.awardedPoints, 0);
    strict_1.default.equal(contract.paidAt, undefined);
});
//# sourceMappingURL=transactions.contract.test.js.map