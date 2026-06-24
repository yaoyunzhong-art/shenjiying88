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
const cashier_dto_1 = require("../cashier/cashier.dto");
const transactions_dto_1 = require("./transactions.dto");
(0, node_test_1.describe)('transactions.dto', () => {
    (0, node_test_1.default)('CreateTransactionCheckoutDto accepts member, items, and payment channel', () => {
        const dto = new transactions_dto_1.CreateTransactionCheckoutDto();
        dto.memberId = 'mem-1';
        dto.paymentChannel = 'wechat-pay';
        dto.currency = 'CNY';
        dto.couponCode = 'COUPON-2026';
        dto.items = [
            Object.assign(new cashier_dto_1.CashierOrderItemDto(), { skuId: 'sku-1', quantity: 2, price: 50 })
        ];
        strict_1.default.equal(dto.memberId, 'mem-1');
        strict_1.default.equal(dto.paymentChannel, 'wechat-pay');
        strict_1.default.equal(dto.items[0].skuId, 'sku-1');
        strict_1.default.equal(dto.items[0].quantity, 2);
    });
    (0, node_test_1.default)('CreateTransactionCheckoutDto supports optional blindbox fields', () => {
        const dto = new transactions_dto_1.CreateTransactionCheckoutDto();
        dto.memberId = 'mem-2';
        dto.paymentChannel = 'alipay';
        dto.blindboxPlanId = 'bb-premium';
        dto.blindboxQuantity = 5;
        dto.items = [];
        strict_1.default.equal(dto.blindboxPlanId, 'bb-premium');
        strict_1.default.equal(dto.blindboxQuantity, 5);
    });
    (0, node_test_1.default)('CreateTransactionCheckoutDto supports optional amount and externalPaymentId', () => {
        const dto = new transactions_dto_1.CreateTransactionCheckoutDto();
        dto.memberId = 'mem-3';
        dto.paymentChannel = 'bank-transfer';
        dto.amount = 1000;
        dto.externalPaymentId = 'ext-tx-001';
        dto.items = [];
        strict_1.default.equal(dto.amount, 1000);
        strict_1.default.equal(dto.externalPaymentId, 'ext-tx-001');
    });
    (0, node_test_1.default)('CreateTransactionCheckoutDto is a class instance', () => {
        const dto = new transactions_dto_1.CreateTransactionCheckoutDto();
        strict_1.default.ok(dto instanceof transactions_dto_1.CreateTransactionCheckoutDto);
    });
    (0, node_test_1.default)('RequestTransactionRefundDto supports optional amount and operator', () => {
        const dto = new transactions_dto_1.RequestTransactionRefundDto();
        dto.reason = 'customer-request';
        dto.refundAmount = 88;
        dto.operator = 'cashier-1';
        strict_1.default.equal(dto.reason, 'customer-request');
        strict_1.default.equal(dto.refundAmount, 88);
        strict_1.default.equal(dto.operator, 'cashier-1');
    });
    (0, node_test_1.default)('ReviewTransactionRefundDto supports optional operator and note', () => {
        const dto = new transactions_dto_1.ReviewTransactionRefundDto();
        dto.operator = 'ops-reviewer';
        dto.note = 'risk-cleared';
        strict_1.default.equal(dto.operator, 'ops-reviewer');
        strict_1.default.equal(dto.note, 'risk-cleared');
    });
    (0, node_test_1.default)('BatchReviewTransactionRefundsDto supports refundIds plus review fields', () => {
        const dto = new transactions_dto_1.BatchReviewTransactionRefundsDto();
        dto.refundIds = ['refund-1', 'refund-2'];
        dto.operator = 'ops-batch';
        dto.note = 'batched';
        strict_1.default.equal(dto.refundIds?.length, 2);
        strict_1.default.equal(dto.refundIds?.[0], 'refund-1');
        strict_1.default.equal(dto.operator, 'ops-batch');
        strict_1.default.equal(dto.note, 'batched');
    });
    (0, node_test_1.default)('BatchAssignTransactionRefundsDto supports suggestedOwner, assignee, and filters', () => {
        const dto = new transactions_dto_1.BatchAssignTransactionRefundsDto();
        dto.refundIds = ['refund-10'];
        dto.suggestedOwner = 'refund-ops-manager';
        dto.assignee = 'ops-owner-a';
        dto.operator = 'ops-manager';
        dto.note = 'manual-assign';
        dto.dispatchQueueLimit = 5;
        strict_1.default.equal(dto.refundIds?.[0], 'refund-10');
        strict_1.default.equal(dto.suggestedOwner, 'refund-ops-manager');
        strict_1.default.equal(dto.assignee, 'ops-owner-a');
        strict_1.default.equal(dto.operator, 'ops-manager');
        strict_1.default.equal(dto.note, 'manual-assign');
        strict_1.default.equal(dto.dispatchQueueLimit, 5);
    });
    (0, node_test_1.default)('BatchClaimTransactionRefundsDto supports suggestedOwner and operator', () => {
        const dto = new transactions_dto_1.BatchClaimTransactionRefundsDto();
        dto.suggestedOwner = 'refund-team-lead';
        dto.operator = 'ops-claimer';
        dto.note = 'claim-self';
        dto.limit = 2;
        strict_1.default.equal(dto.suggestedOwner, 'refund-team-lead');
        strict_1.default.equal(dto.operator, 'ops-claimer');
        strict_1.default.equal(dto.note, 'claim-self');
        strict_1.default.equal(dto.limit, 2);
    });
    (0, node_test_1.default)('RequestTransactionTimeoutCloseDto supports optional reason and operator', () => {
        const dto = new transactions_dto_1.RequestTransactionTimeoutCloseDto();
        dto.reason = 'payment-timeout';
        dto.operator = 'system-cron';
        strict_1.default.equal(dto.reason, 'payment-timeout');
        strict_1.default.equal(dto.operator, 'system-cron');
    });
    (0, node_test_1.default)('RequestTransactionManualCloseDto supports optional reason and operator', () => {
        const dto = new transactions_dto_1.RequestTransactionManualCloseDto();
        dto.reason = 'customer-cancelled';
        dto.operator = 'ops-a';
        strict_1.default.equal(dto.reason, 'customer-cancelled');
        strict_1.default.equal(dto.operator, 'ops-a');
    });
    (0, node_test_1.default)('ListTransactionOrdersQueryDto supports filter fields', () => {
        const dto = new transactions_dto_1.ListTransactionOrdersQueryDto();
        dto.memberId = 'mem-1';
        dto.status = 'CLOSED';
        dto.paymentStatus = 'FAILED';
        dto.closeReason = 'PAYMENT_TIMEOUT';
        dto.hasRefund = false;
        dto.limit = 20;
        strict_1.default.equal(dto.memberId, 'mem-1');
        strict_1.default.equal(dto.status, 'CLOSED');
        strict_1.default.equal(dto.paymentStatus, 'FAILED');
        strict_1.default.equal(dto.closeReason, 'PAYMENT_TIMEOUT');
        strict_1.default.equal(dto.hasRefund, false);
        strict_1.default.equal(dto.limit, 20);
    });
    (0, node_test_1.default)('ListTransactionRefundsQueryDto supports refund filter fields', () => {
        const dto = new transactions_dto_1.ListTransactionRefundsQueryDto();
        dto.memberId = 'mem-9';
        dto.orderId = 'order-9';
        dto.operator = 'ops-9';
        dto.reviewedBy = 'reviewer-9';
        dto.requestedAfter = '2026-06-14T00:00:00.000Z';
        dto.requestedBefore = '2026-06-14T23:59:59.000Z';
        dto.reviewedAfter = '2026-06-15T00:00:00.000Z';
        dto.reviewedBefore = '2026-06-15T23:59:59.000Z';
        dto.status = 'COMPLETED';
        dto.limit = 5;
        strict_1.default.equal(dto.memberId, 'mem-9');
        strict_1.default.equal(dto.orderId, 'order-9');
        strict_1.default.equal(dto.operator, 'ops-9');
        strict_1.default.equal(dto.reviewedBy, 'reviewer-9');
        strict_1.default.equal(dto.requestedAfter, '2026-06-14T00:00:00.000Z');
        strict_1.default.equal(dto.requestedBefore, '2026-06-14T23:59:59.000Z');
        strict_1.default.equal(dto.reviewedAfter, '2026-06-15T00:00:00.000Z');
        strict_1.default.equal(dto.reviewedBefore, '2026-06-15T23:59:59.000Z');
        strict_1.default.equal(dto.status, 'COMPLETED');
        strict_1.default.equal(dto.limit, 5);
    });
    (0, node_test_1.default)('GetTransactionRefundDashboardQueryDto supports refund filters and recentReviewLimit', () => {
        const dto = new transactions_dto_1.GetTransactionRefundDashboardQueryDto();
        dto.status = 'PENDING';
        dto.reviewedBy = 'ops-1';
        dto.recentReviewLimit = 8;
        dto.priorityQueueLimit = 3;
        dto.dispatchQueueLimit = 6;
        dto.recentEscalationLimit = 4;
        dto.teamLeadThresholdMinutes = 30;
        dto.opsManagerThresholdMinutes = 90;
        dto.financeThresholdMinutes = 360;
        dto.asOfTime = '2026-06-16T00:00:00.000Z';
        strict_1.default.equal(dto.status, 'PENDING');
        strict_1.default.equal(dto.reviewedBy, 'ops-1');
        strict_1.default.equal(dto.recentReviewLimit, 8);
        strict_1.default.equal(dto.priorityQueueLimit, 3);
        strict_1.default.equal(dto.dispatchQueueLimit, 6);
        strict_1.default.equal(dto.recentEscalationLimit, 4);
        strict_1.default.equal(dto.teamLeadThresholdMinutes, 30);
        strict_1.default.equal(dto.opsManagerThresholdMinutes, 90);
        strict_1.default.equal(dto.financeThresholdMinutes, 360);
        strict_1.default.equal(dto.asOfTime, '2026-06-16T00:00:00.000Z');
    });
    (0, node_test_1.default)('BatchTimeoutCloseOrdersDto supports batch selectors', () => {
        const dto = new transactions_dto_1.BatchTimeoutCloseOrdersDto();
        dto.orderIds = ['order-1', 'order-2'];
        dto.memberId = 'mem-2';
        dto.beforeTime = '2026-06-14T00:00:00.000Z';
        dto.limit = 2;
        strict_1.default.equal(dto.orderIds?.length, 2);
        strict_1.default.equal(dto.memberId, 'mem-2');
        strict_1.default.equal(dto.beforeTime, '2026-06-14T00:00:00.000Z');
        strict_1.default.equal(dto.limit, 2);
    });
});
//# sourceMappingURL=transactions.dto.test.js.map