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
const loyalty_entity_1 = require("../loyalty/loyalty.entity");
const loyalty_service_1 = require("../loyalty/loyalty.service");
const member_service_1 = require("../member/member.service");
const cashier_service_1 = require("../cashier/cashier.service");
const transactions_service_1 = require("./transactions.service");
const transactions_entity_1 = require("./transactions.entity");
function createContext() {
    return {
        tenantId: 'tenant-tx',
        brandId: 'brand-tx',
        storeId: 'store-tx'
    };
}
(0, node_test_1.beforeEach)(() => {
    (0, transactions_service_1.resetTransactionsServiceTestState)();
});
(0, node_test_1.describe)('TransactionsService', () => {
    (0, node_test_1.default)('syncLytOrderSnapshot stores standard order snapshot for tenant', async () => {
        const memberService = new member_service_1.MemberService();
        const loyaltyService = new loyalty_service_1.LoyaltyService(memberService);
        const cashierService = new cashier_service_1.CashierService(memberService, loyaltyService);
        const service = new transactions_service_1.TransactionsService(cashierService, loyaltyService);
        const snapshot = await service.syncLytOrderSnapshot({
            tenantContext: createContext(),
            externalOrderId: 'lyt-order-001',
            orderNo: 'NO-001',
            memberId: 'member-001',
            couponCode: 'COUPON-001',
            blindboxPlanId: 'blindbox-001',
            blindboxQuantity: 2,
            amount: 120,
            discountAmount: 20,
            payableAmount: 100,
            currency: 'CNY',
            status: 'PAID',
            paidAt: '2026-06-14T14:20:00.000Z',
            updatedAt: '2026-06-14T14:25:00.000Z'
        });
        strict_1.default.equal(snapshot.externalOrderId, 'lyt-order-001');
        strict_1.default.equal(snapshot.payableAmount, 100);
        strict_1.default.equal(snapshot.status, 'PAID');
        strict_1.default.equal(snapshot.couponCode, 'COUPON-001');
        strict_1.default.equal(snapshot.blindboxPlanId, 'blindbox-001');
        const stored = await service.getLytOrderSnapshot('lyt-order-001', createContext());
        strict_1.default.equal(stored?.orderNo, 'NO-001');
        strict_1.default.equal(stored?.paidAt, '2026-06-14T14:20:00.000Z');
        strict_1.default.equal(stored?.blindboxQuantity, 2);
    });
    (0, node_test_1.default)('syncLytPaymentSnapshot stores standard payment snapshot for tenant', async () => {
        const memberService = new member_service_1.MemberService();
        const loyaltyService = new loyalty_service_1.LoyaltyService(memberService);
        const cashierService = new cashier_service_1.CashierService(memberService, loyaltyService);
        const service = new transactions_service_1.TransactionsService(cashierService, loyaltyService);
        const snapshot = await service.syncLytPaymentSnapshot({
            tenantContext: createContext(),
            externalPaymentId: 'lyt-payment-001',
            externalOrderId: 'lyt-order-001',
            paymentChannel: 'wechat-pay',
            paymentStatus: 'SUCCEEDED',
            amount: 100,
            currency: 'CNY',
            transactionNo: 'txn-lyt-001',
            paidAt: '2026-06-14T14:30:00.000Z',
            updatedAt: '2026-06-14T14:31:00.000Z'
        });
        strict_1.default.equal(snapshot.externalPaymentId, 'lyt-payment-001');
        strict_1.default.equal(snapshot.paymentStatus, 'SUCCEEDED');
        strict_1.default.equal(snapshot.transactionNo, 'txn-lyt-001');
        const stored = await service.getLytPaymentSnapshot('lyt-payment-001', createContext());
        strict_1.default.equal(stored?.externalOrderId, 'lyt-order-001');
        strict_1.default.equal(stored?.paymentChannel, 'wechat-pay');
    });
    (0, node_test_1.default)('startCheckout creates order + payment and returns aggregate', async () => {
        const memberService = new member_service_1.MemberService();
        memberService.register({
            memberId: 'mem-tx-1',
            tenantContext: createContext(),
            nickname: 'Tx User'
        });
        const loyaltyService = new loyalty_service_1.LoyaltyService(memberService);
        const cashierService = new cashier_service_1.CashierService(memberService, loyaltyService);
        const service = new transactions_service_1.TransactionsService(cashierService, loyaltyService);
        const aggregate = await service.startCheckout(createContext(), {
            memberId: 'mem-tx-1',
            items: [{ skuId: 'sku-tx-1', quantity: 2, price: 50 }],
            paymentChannel: 'wechat-pay',
            currency: 'CNY'
        });
        strict_1.default.equal(aggregate.order.memberId, 'mem-tx-1');
        strict_1.default.equal(aggregate.order.totalAmount, 100);
        strict_1.default.ok(aggregate.payment);
        strict_1.default.equal(aggregate.payment?.channel, 'wechat-pay');
    });
    (0, node_test_1.default)('getOrderTransaction returns aggregate for existing order', async () => {
        const memberService = new member_service_1.MemberService();
        memberService.register({
            memberId: 'mem-tx-2',
            tenantContext: createContext(),
            nickname: 'Get Tx User'
        });
        const loyaltyService = new loyalty_service_1.LoyaltyService(memberService);
        const cashierService = new cashier_service_1.CashierService(memberService, loyaltyService);
        const service = new transactions_service_1.TransactionsService(cashierService, loyaltyService);
        const created = await service.startCheckout(createContext(), {
            memberId: 'mem-tx-2',
            items: [{ skuId: 'sku-tx-2', quantity: 1, price: 88 }],
            paymentChannel: 'alipay'
        });
        const aggregate = service.getOrderTransaction(created.order.orderId, createContext());
        strict_1.default.equal(aggregate.order.orderId, created.order.orderId);
        strict_1.default.equal(aggregate.order.memberId, 'mem-tx-2');
        strict_1.default.ok(aggregate.payment);
    });
    (0, node_test_1.default)('getOrderTransaction throws for non-existent order', () => {
        const memberService = new member_service_1.MemberService();
        const loyaltyService = new loyalty_service_1.LoyaltyService(memberService);
        const cashierService = new cashier_service_1.CashierService(memberService, loyaltyService);
        const service = new transactions_service_1.TransactionsService(cashierService, loyaltyService);
        strict_1.default.throws(() => service.getOrderTransaction('non-existent', createContext()), /Transaction order non-existent not found/);
    });
    (0, node_test_1.default)('listOrderTransactions filters by status, close reason and refund flag', async () => {
        const memberService = new member_service_1.MemberService();
        memberService.register({
            memberId: 'mem-tx-list-1',
            tenantContext: createContext(),
            nickname: 'List User'
        });
        const loyaltyService = new loyalty_service_1.LoyaltyService(memberService);
        const cashierService = new cashier_service_1.CashierService(memberService, loyaltyService);
        const service = new transactions_service_1.TransactionsService(cashierService, loyaltyService);
        const timeoutOrder = await service.startCheckout(createContext(), {
            memberId: 'mem-tx-list-1',
            items: [{ skuId: 'sku-list-timeout', quantity: 1, price: 51 }],
            paymentChannel: 'wechat-pay'
        });
        await service.timeoutCloseOrder(timeoutOrder.order.orderId, createContext(), {});
        const refundOrder = await service.startCheckout(createContext(), {
            memberId: 'mem-tx-list-1',
            items: [{ skuId: 'sku-list-refund', quantity: 1, price: 120 }],
            paymentChannel: 'alipay',
            externalPaymentId: 'ext-list-refund'
        });
        await service.applyPaymentCallback({
            standardizedEventName: 'cashier.payment-succeeded',
            aggregateId: refundOrder.order.orderId,
            orderId: refundOrder.order.orderId,
            tenantId: createContext().tenantId,
            externalPaymentId: 'ext-list-refund',
            transactionNo: 'txn-list-refund'
        });
        await service.requestRefund(refundOrder.order.orderId, createContext(), {
            reason: 'customer-request'
        });
        const closedTimeoutOrders = service.listOrderTransactions(createContext(), {
            status: 'CLOSED',
            closeReason: 'PAYMENT_TIMEOUT'
        });
        strict_1.default.equal(closedTimeoutOrders.length >= 1, true);
        strict_1.default.equal(closedTimeoutOrders[0]?.order.closeReason, 'PAYMENT_TIMEOUT');
        const refundedOrders = service.listOrderTransactions(createContext(), {
            memberId: 'mem-tx-list-1',
            hasRefund: true
        });
        strict_1.default.equal(refundedOrders.length >= 1, true);
        strict_1.default.equal(refundedOrders.some((entry) => entry.refunds.length > 0), true);
    });
    (0, node_test_1.default)('batchTimeoutCloseOrders closes only eligible orders and returns processed ids', async () => {
        const memberService = new member_service_1.MemberService();
        memberService.register({
            memberId: 'mem-tx-batch-1',
            tenantContext: createContext(),
            nickname: 'Batch User'
        });
        const loyaltyService = new loyalty_service_1.LoyaltyService(memberService);
        const cashierService = new cashier_service_1.CashierService(memberService, loyaltyService);
        const service = new transactions_service_1.TransactionsService(cashierService, loyaltyService);
        const first = await service.startCheckout(createContext(), {
            memberId: 'mem-tx-batch-1',
            items: [{ skuId: 'sku-batch-1', quantity: 1, price: 30 }],
            paymentChannel: 'wechat-pay'
        });
        const second = await service.startCheckout(createContext(), {
            memberId: 'mem-tx-batch-1',
            items: [{ skuId: 'sku-batch-2', quantity: 1, price: 40 }],
            paymentChannel: 'alipay'
        });
        const paid = await service.startCheckout(createContext(), {
            memberId: 'mem-tx-batch-1',
            items: [{ skuId: 'sku-batch-3', quantity: 1, price: 50 }],
            paymentChannel: 'wechat-pay',
            externalPaymentId: 'ext-batch-paid'
        });
        await service.applyPaymentCallback({
            standardizedEventName: 'cashier.payment-succeeded',
            aggregateId: paid.order.orderId,
            orderId: paid.order.orderId,
            tenantId: createContext().tenantId,
            externalPaymentId: 'ext-batch-paid',
            transactionNo: 'txn-batch-paid'
        });
        const result = await service.batchTimeoutCloseOrders(createContext(), {
            memberId: 'mem-tx-batch-1',
            orderIds: [first.order.orderId, second.order.orderId, paid.order.orderId]
        });
        strict_1.default.equal(result.processedCount, 2);
        strict_1.default.equal(result.processedOrderIds.includes(first.order.orderId), true);
        strict_1.default.equal(result.processedOrderIds.includes(second.order.orderId), true);
        strict_1.default.equal(result.processedOrderIds.includes(paid.order.orderId), false);
        strict_1.default.equal(result.orders.every((entry) => entry.order.closeReason === 'PAYMENT_TIMEOUT'), true);
    });
    (0, node_test_1.default)('timeoutCloseOrder closes pending payment order and updates timeline close reason', async () => {
        const memberService = new member_service_1.MemberService();
        memberService.register({
            memberId: 'mem-tx-timeout-1',
            tenantContext: createContext(),
            nickname: 'Timeout Tx User'
        });
        const loyaltyService = new loyalty_service_1.LoyaltyService(memberService);
        const cashierService = new cashier_service_1.CashierService(memberService, loyaltyService);
        const service = new transactions_service_1.TransactionsService(cashierService, loyaltyService);
        const created = await service.startCheckout(createContext(), {
            memberId: 'mem-tx-timeout-1',
            items: [{ skuId: 'sku-timeout', quantity: 1, price: 58 }],
            paymentChannel: 'wechat-pay',
            couponCode: 'COUPON-TIMEOUT-TX'
        });
        const closed = await service.timeoutCloseOrder(created.order.orderId, createContext(), {});
        strict_1.default.equal(closed.order.status, 'CLOSED');
        strict_1.default.equal(closed.order.closeReason, 'PAYMENT_TIMEOUT');
        strict_1.default.ok(closed.order.closedAt);
        strict_1.default.equal(closed.payment?.status, 'FAILED');
        strict_1.default.equal(closed.couponRedemptions.slice(-1)[0]?.status, 'RELEASED');
        const timeline = service.listMemberTransactions('mem-tx-timeout-1', createContext());
        strict_1.default.equal(timeline[0]?.status, 'CLOSED');
        strict_1.default.equal(timeline[0]?.closeReason, 'PAYMENT_TIMEOUT');
        strict_1.default.ok(timeline[0]?.closedAt);
    });
    (0, node_test_1.default)('timeoutCloseOrder rejects paid order', async () => {
        const memberService = new member_service_1.MemberService();
        memberService.register({
            memberId: 'mem-tx-timeout-2',
            tenantContext: createContext(),
            nickname: 'Timeout Paid User'
        });
        const loyaltyService = new loyalty_service_1.LoyaltyService(memberService);
        const cashierService = new cashier_service_1.CashierService(memberService, loyaltyService);
        const service = new transactions_service_1.TransactionsService(cashierService, loyaltyService);
        const created = await service.startCheckout(createContext(), {
            memberId: 'mem-tx-timeout-2',
            items: [{ skuId: 'sku-timeout-paid', quantity: 1, price: 80 }],
            paymentChannel: 'alipay',
            externalPaymentId: 'tx-timeout-paid'
        });
        await service.applyPaymentCallback({
            standardizedEventName: 'cashier.payment-succeeded',
            aggregateId: created.order.orderId,
            orderId: created.order.orderId,
            tenantId: createContext().tenantId,
            externalPaymentId: 'tx-timeout-paid',
            transactionNo: 'txn-timeout-paid'
        });
        await strict_1.default.rejects(() => service.timeoutCloseOrder(created.order.orderId, createContext(), {}), /cannot be timeout-closed/);
    });
    (0, node_test_1.default)('manualCloseOrder closes pending payment order and exposes audit fields in timeline', async () => {
        const memberService = new member_service_1.MemberService();
        memberService.register({
            memberId: 'mem-tx-manual-1',
            tenantContext: createContext(),
            nickname: 'Manual Tx User'
        });
        const loyaltyService = new loyalty_service_1.LoyaltyService(memberService);
        const cashierService = new cashier_service_1.CashierService(memberService, loyaltyService);
        const service = new transactions_service_1.TransactionsService(cashierService, loyaltyService);
        const created = await service.startCheckout(createContext(), {
            memberId: 'mem-tx-manual-1',
            items: [{ skuId: 'sku-manual', quantity: 1, price: 68 }],
            paymentChannel: 'wechat-pay',
            couponCode: 'COUPON-MANUAL-TX'
        });
        const closed = await service.manualCloseOrder(created.order.orderId, createContext(), {
            operator: 'ops-a',
            reason: 'customer-cancelled'
        });
        strict_1.default.equal(closed.order.status, 'CLOSED');
        strict_1.default.equal(closed.order.closeReason, 'MANUAL_CANCEL');
        strict_1.default.equal(closed.order.closedBy, 'ops-a');
        strict_1.default.equal(closed.order.closeNote, 'customer-cancelled');
        strict_1.default.ok(closed.order.closedAt);
        strict_1.default.equal(closed.payment?.status, 'FAILED');
        strict_1.default.equal(closed.couponRedemptions.slice(-1)[0]?.status, 'RELEASED');
        const timeline = service.listMemberTransactions('mem-tx-manual-1', createContext());
        strict_1.default.equal(timeline[0]?.status, 'CLOSED');
        strict_1.default.equal(timeline[0]?.closeReason, 'MANUAL_CANCEL');
        strict_1.default.equal(timeline[0]?.closedBy, 'ops-a');
        strict_1.default.equal(timeline[0]?.closeNote, 'customer-cancelled');
    });
    (0, node_test_1.default)('manualCloseOrder rejects paid order', async () => {
        const memberService = new member_service_1.MemberService();
        memberService.register({
            memberId: 'mem-tx-manual-2',
            tenantContext: createContext(),
            nickname: 'Manual Paid User'
        });
        const loyaltyService = new loyalty_service_1.LoyaltyService(memberService);
        const cashierService = new cashier_service_1.CashierService(memberService, loyaltyService);
        const service = new transactions_service_1.TransactionsService(cashierService, loyaltyService);
        const created = await service.startCheckout(createContext(), {
            memberId: 'mem-tx-manual-2',
            items: [{ skuId: 'sku-manual-paid', quantity: 1, price: 98 }],
            paymentChannel: 'alipay',
            externalPaymentId: 'tx-manual-paid'
        });
        await service.applyPaymentCallback({
            standardizedEventName: 'cashier.payment-succeeded',
            aggregateId: created.order.orderId,
            orderId: created.order.orderId,
            tenantId: createContext().tenantId,
            externalPaymentId: 'tx-manual-paid',
            transactionNo: 'txn-manual-paid'
        });
        await strict_1.default.rejects(() => service.manualCloseOrder(created.order.orderId, createContext(), {
            operator: 'ops-b'
        }), /cannot be manually closed/);
    });
    (0, node_test_1.default)('applyPaymentCallback updates order and returns aggregate', async () => {
        const memberService = new member_service_1.MemberService();
        memberService.register({
            memberId: 'mem-tx-3',
            tenantContext: createContext(),
            nickname: 'Callback Tx User'
        });
        const loyaltyService = new loyalty_service_1.LoyaltyService(memberService);
        const cashierService = new cashier_service_1.CashierService(memberService, loyaltyService);
        const service = new transactions_service_1.TransactionsService(cashierService, loyaltyService);
        const created = await service.startCheckout(createContext(), {
            memberId: 'mem-tx-3',
            items: [{ skuId: 'sku-tx-3', quantity: 1, price: 120 }],
            paymentChannel: 'wechat-pay',
            externalPaymentId: 'ext-tx-cb'
        });
        const result = await service.applyPaymentCallback({
            standardizedEventName: 'cashier.payment-succeeded',
            aggregateId: created.order.orderId,
            orderId: created.order.orderId,
            tenantId: createContext().tenantId,
            externalPaymentId: 'ext-tx-cb',
            transactionNo: 'txn-tx-cb'
        });
        strict_1.default.equal(result.payment?.status, 'SUCCEEDED');
        strict_1.default.equal(result.payment?.transactionNo, 'txn-tx-cb');
        // Points ledger should have an entry from settlement
        strict_1.default.ok(result.pointsLedger.length >= 1);
    });
    (0, node_test_1.default)('listMemberTransactions returns sorted timeline for member', async () => {
        const memberService = new member_service_1.MemberService();
        memberService.register({
            memberId: 'mem-tx-4',
            tenantContext: createContext(),
            nickname: 'Timeline User'
        });
        const loyaltyService = new loyalty_service_1.LoyaltyService(memberService);
        const cashierService = new cashier_service_1.CashierService(memberService, loyaltyService);
        const service = new transactions_service_1.TransactionsService(cashierService, loyaltyService);
        // Create two orders for same member
        await service.startCheckout(createContext(), {
            memberId: 'mem-tx-4',
            items: [{ skuId: 'sku-tx-a', quantity: 1, price: 10 }],
            paymentChannel: 'wechat-pay'
        });
        await service.startCheckout(createContext(), {
            memberId: 'mem-tx-4',
            items: [{ skuId: 'sku-tx-b', quantity: 1, price: 20 }],
            paymentChannel: 'alipay'
        });
        const timeline = service.listMemberTransactions('mem-tx-4', createContext());
        strict_1.default.ok(timeline.length >= 2);
        // Should be sorted by updatedAt descending (latest first)
        const updatedAts = timeline.map((t) => t.updatedAt);
        for (let i = 0; i < updatedAts.length - 1; i++) {
            strict_1.default.ok(updatedAts[i].localeCompare(updatedAts[i + 1]) >= 0);
        }
    });
    (0, node_test_1.default)('listMemberTransactions returns empty for member with no orders', () => {
        const memberService = new member_service_1.MemberService();
        const loyaltyService = new loyalty_service_1.LoyaltyService(memberService);
        const cashierService = new cashier_service_1.CashierService(memberService, loyaltyService);
        const service = new transactions_service_1.TransactionsService(cashierService, loyaltyService);
        const timeline = service.listMemberTransactions('mem-no-orders', createContext());
        strict_1.default.equal(timeline.length, 0);
    });
    (0, node_test_1.default)('requestRefund creates pending refund and keeps paid order unchanged before review', async () => {
        const memberService = new member_service_1.MemberService();
        memberService.register({
            memberId: 'mem-tx-refund-1',
            tenantContext: createContext(),
            nickname: 'Refund User'
        });
        const loyaltyService = new loyalty_service_1.LoyaltyService(memberService);
        const cashierService = new cashier_service_1.CashierService(memberService, loyaltyService);
        const service = new transactions_service_1.TransactionsService(cashierService, loyaltyService);
        const created = await service.startCheckout(createContext(), {
            memberId: 'mem-tx-refund-1',
            items: [{ skuId: 'sku-refund', quantity: 1, price: 120 }],
            paymentChannel: 'wechat-pay',
            couponCode: 'COUPON-REFUND-1',
            blindboxPlanId: 'blindbox-refund-1',
            blindboxQuantity: 1,
            externalPaymentId: 'ext-refund-1'
        });
        await service.applyPaymentCallback({
            standardizedEventName: 'cashier.payment-succeeded',
            aggregateId: created.order.orderId,
            orderId: created.order.orderId,
            tenantId: createContext().tenantId,
            externalPaymentId: 'ext-refund-1',
            transactionNo: 'txn-refund-1'
        });
        const refunded = await service.requestRefund(created.order.orderId, createContext(), {
            reason: 'customer-request'
        });
        strict_1.default.equal(refunded.refunds.length, 1);
        strict_1.default.equal(refunded.refunds[0]?.refundAmount, 120);
        strict_1.default.equal(refunded.refunds[0]?.status, transactions_entity_1.TransactionRefundStatus.Pending);
        strict_1.default.equal(refunded.order.status, 'PAID');
        strict_1.default.equal(refunded.order.closeReason, undefined);
        strict_1.default.equal(refunded.order.closedAt, undefined);
        strict_1.default.equal(refunded.couponRedemptions.slice(-1)[0]?.status, 'REDEEMED');
        strict_1.default.equal(refunded.pointsLedger.reduce((sum, entry) => sum + entry.points, 0), 120);
        strict_1.default.equal(refunded.blindboxFulfillments.length, 1);
        strict_1.default.equal(refunded.blindboxFulfillments.slice(-1)[0]?.status, loyalty_entity_1.BlindboxFulfillmentStatus.Fulfilled);
        const timeline = service.listMemberTransactions('mem-tx-refund-1', createContext());
        strict_1.default.equal(timeline[0]?.refundedAmount, 0);
        strict_1.default.equal(timeline[0]?.refundStatus, transactions_entity_1.TransactionRefundStatus.Pending);
        strict_1.default.equal(timeline[0]?.blindboxStatus, loyalty_entity_1.BlindboxFulfillmentStatus.Fulfilled);
    });
    (0, node_test_1.default)('approveRefund completes full refund and closes paid order', async () => {
        const memberService = new member_service_1.MemberService();
        memberService.register({
            memberId: 'mem-tx-refund-approve-1',
            tenantContext: createContext(),
            nickname: 'Refund Approval User'
        });
        const loyaltyService = new loyalty_service_1.LoyaltyService(memberService);
        const cashierService = new cashier_service_1.CashierService(memberService, loyaltyService);
        const service = new transactions_service_1.TransactionsService(cashierService, loyaltyService);
        const created = await service.startCheckout(createContext(), {
            memberId: 'mem-tx-refund-approve-1',
            items: [{ skuId: 'sku-refund-approve', quantity: 1, price: 120 }],
            paymentChannel: 'wechat-pay',
            couponCode: 'COUPON-REFUND-APPROVE',
            blindboxPlanId: 'blindbox-refund-approve',
            blindboxQuantity: 1,
            externalPaymentId: 'ext-refund-approve-1'
        });
        await service.applyPaymentCallback({
            standardizedEventName: 'cashier.payment-succeeded',
            aggregateId: created.order.orderId,
            orderId: created.order.orderId,
            tenantId: createContext().tenantId,
            externalPaymentId: 'ext-refund-approve-1',
            transactionNo: 'txn-refund-approve-1'
        });
        const requested = await service.requestRefund(created.order.orderId, createContext(), {
            reason: 'customer-request',
            operator: 'cashier-review-input'
        });
        const approved = await service.approveRefund(requested.refunds[0].refundId, createContext(), {
            operator: 'ops-reviewer',
            note: 'risk-cleared'
        });
        strict_1.default.equal(approved.refunds.length, 1);
        strict_1.default.equal(approved.refunds[0]?.status, transactions_entity_1.TransactionRefundStatus.Completed);
        strict_1.default.equal(approved.refunds[0]?.reviewedBy, 'ops-reviewer');
        strict_1.default.equal(approved.refunds[0]?.reviewNote, 'risk-cleared');
        strict_1.default.ok(approved.refunds[0]?.completedAt);
        strict_1.default.equal(approved.order.status, 'CLOSED');
        strict_1.default.equal(approved.order.closeReason, 'FULL_REFUND');
        strict_1.default.ok(approved.order.closedAt);
        strict_1.default.equal(approved.couponRedemptions.slice(-1)[0]?.status, 'RELEASED');
        strict_1.default.equal(approved.pointsLedger.reduce((sum, entry) => sum + entry.points, 0), 0);
        strict_1.default.equal(approved.blindboxFulfillments.length, 2);
        strict_1.default.equal(approved.blindboxFulfillments.slice(-1)[0]?.status, loyalty_entity_1.BlindboxFulfillmentStatus.Revoked);
        const fetched = service.getRefund(requested.refunds[0].refundId, createContext());
        strict_1.default.equal(fetched.status, transactions_entity_1.TransactionRefundStatus.Completed);
        strict_1.default.equal(fetched.reviewedBy, 'ops-reviewer');
        const timeline = service.listMemberTransactions('mem-tx-refund-approve-1', createContext());
        strict_1.default.equal(timeline[0]?.refundedAmount, 120);
        strict_1.default.equal(timeline[0]?.refundStatus, transactions_entity_1.TransactionRefundStatus.Completed);
        strict_1.default.equal(timeline[0]?.blindboxStatus, loyalty_entity_1.BlindboxFulfillmentStatus.Revoked);
    });
    (0, node_test_1.default)('approveRefund supports partial refund and keeps order paid', async () => {
        const memberService = new member_service_1.MemberService();
        memberService.register({
            memberId: 'mem-tx-refund-2',
            tenantContext: createContext(),
            nickname: 'Partial Refund User'
        });
        const loyaltyService = new loyalty_service_1.LoyaltyService(memberService);
        const cashierService = new cashier_service_1.CashierService(memberService, loyaltyService);
        const service = new transactions_service_1.TransactionsService(cashierService, loyaltyService);
        const created = await service.startCheckout(createContext(), {
            memberId: 'mem-tx-refund-2',
            items: [{ skuId: 'sku-refund-2', quantity: 1, price: 200 }],
            paymentChannel: 'alipay',
            couponCode: 'COUPON-REFUND-2',
            blindboxPlanId: 'blindbox-refund-2',
            externalPaymentId: 'ext-refund-2'
        });
        await service.applyPaymentCallback({
            standardizedEventName: 'cashier.payment-succeeded',
            aggregateId: created.order.orderId,
            orderId: created.order.orderId,
            tenantId: createContext().tenantId,
            externalPaymentId: 'ext-refund-2',
            transactionNo: 'txn-refund-2'
        });
        const requested = await service.requestRefund(created.order.orderId, createContext(), {
            reason: 'partial-return',
            refundAmount: 80,
            operator: 'cashier-a'
        });
        const approved = await service.approveRefund(requested.refunds[0].refundId, createContext(), {
            operator: 'ops-partial',
            note: 'partial-approved'
        });
        strict_1.default.equal(approved.refunds[0]?.refundAmount, 80);
        strict_1.default.equal(approved.refunds[0]?.operator, 'cashier-a');
        strict_1.default.equal(approved.refunds[0]?.status, transactions_entity_1.TransactionRefundStatus.Completed);
        strict_1.default.equal(approved.refunds[0]?.reviewedBy, 'ops-partial');
        strict_1.default.equal(approved.order.status, 'PAID');
        const timeline = service.listMemberTransactions('mem-tx-refund-2', createContext());
        strict_1.default.equal(timeline[0]?.refundedAmount, 80);
        strict_1.default.equal(timeline[0]?.refundStatus, transactions_entity_1.TransactionRefundStatus.Completed);
        strict_1.default.equal(timeline[0]?.awardedPoints, 120);
        strict_1.default.equal(timeline[0]?.blindboxStatus, loyalty_entity_1.BlindboxFulfillmentStatus.Fulfilled);
        strict_1.default.equal(approved.couponRedemptions.slice(-1)[0]?.status, 'RELEASED');
        strict_1.default.equal(approved.blindboxFulfillments.slice(-1)[0]?.status, loyalty_entity_1.BlindboxFulfillmentStatus.Fulfilled);
    });
    (0, node_test_1.default)('rejectRefund marks pending refund as rejected without loyalty rollback', async () => {
        const memberService = new member_service_1.MemberService();
        memberService.register({
            memberId: 'mem-tx-refund-reject-1',
            tenantContext: createContext(),
            nickname: 'Rejected Refund User'
        });
        const loyaltyService = new loyalty_service_1.LoyaltyService(memberService);
        const cashierService = new cashier_service_1.CashierService(memberService, loyaltyService);
        const service = new transactions_service_1.TransactionsService(cashierService, loyaltyService);
        const created = await service.startCheckout(createContext(), {
            memberId: 'mem-tx-refund-reject-1',
            items: [{ skuId: 'sku-refund-reject', quantity: 1, price: 90 }],
            paymentChannel: 'wechat-pay',
            couponCode: 'COUPON-REFUND-REJECT',
            externalPaymentId: 'ext-refund-reject-1'
        });
        await service.applyPaymentCallback({
            standardizedEventName: 'cashier.payment-succeeded',
            aggregateId: created.order.orderId,
            orderId: created.order.orderId,
            tenantId: createContext().tenantId,
            externalPaymentId: 'ext-refund-reject-1',
            transactionNo: 'txn-refund-reject-1'
        });
        const requested = await service.requestRefund(created.order.orderId, createContext(), {
            reason: 'duplicate-request',
            refundAmount: 30,
            operator: 'cashier-b'
        });
        const rejected = service.rejectRefund(requested.refunds[0].refundId, createContext(), {
            operator: 'ops-reviewer',
            note: 'duplicate-request'
        });
        strict_1.default.equal(rejected.refunds[0]?.status, transactions_entity_1.TransactionRefundStatus.Rejected);
        strict_1.default.equal(rejected.refunds[0]?.reviewedBy, 'ops-reviewer');
        strict_1.default.equal(rejected.refunds[0]?.reviewNote, 'duplicate-request');
        strict_1.default.equal(rejected.order.status, 'PAID');
        strict_1.default.equal(rejected.pointsLedger.reduce((sum, entry) => sum + entry.points, 0), 90);
        strict_1.default.equal(rejected.couponRedemptions.slice(-1)[0]?.status, 'REDEEMED');
        const timeline = service.listMemberTransactions('mem-tx-refund-reject-1', createContext());
        strict_1.default.equal(timeline[0]?.refundedAmount, 0);
        strict_1.default.equal(timeline[0]?.refundStatus, transactions_entity_1.TransactionRefundStatus.Rejected);
    });
    (0, node_test_1.default)('requestRefund rejects over-refund amount', async () => {
        const memberService = new member_service_1.MemberService();
        memberService.register({
            memberId: 'mem-tx-refund-3',
            tenantContext: createContext(),
            nickname: 'Over Refund User'
        });
        const loyaltyService = new loyalty_service_1.LoyaltyService(memberService);
        const cashierService = new cashier_service_1.CashierService(memberService, loyaltyService);
        const service = new transactions_service_1.TransactionsService(cashierService, loyaltyService);
        const created = await service.startCheckout(createContext(), {
            memberId: 'mem-tx-refund-3',
            items: [{ skuId: 'sku-refund-3', quantity: 1, price: 60 }],
            paymentChannel: 'wechat-pay',
            externalPaymentId: 'ext-refund-3'
        });
        await service.applyPaymentCallback({
            standardizedEventName: 'cashier.payment-succeeded',
            aggregateId: created.order.orderId,
            orderId: created.order.orderId,
            tenantId: createContext().tenantId,
            externalPaymentId: 'ext-refund-3',
            transactionNo: 'txn-refund-3'
        });
        await strict_1.default.rejects(() => service.requestRefund(created.order.orderId, createContext(), {
            reason: 'invalid',
            refundAmount: 100
        }), /exceeds refundable amount/);
    });
    (0, node_test_1.default)('listRefunds filters by member, operator and status', async () => {
        const memberService = new member_service_1.MemberService();
        memberService.register({
            memberId: 'mem-tx-refund-list-1',
            tenantContext: createContext(),
            nickname: 'Refund List User A'
        });
        memberService.register({
            memberId: 'mem-tx-refund-list-2',
            tenantContext: createContext(),
            nickname: 'Refund List User B'
        });
        const loyaltyService = new loyalty_service_1.LoyaltyService(memberService);
        const cashierService = new cashier_service_1.CashierService(memberService, loyaltyService);
        const service = new transactions_service_1.TransactionsService(cashierService, loyaltyService);
        const first = await service.startCheckout(createContext(), {
            memberId: 'mem-tx-refund-list-1',
            items: [{ skuId: 'sku-r1', quantity: 1, price: 80 }],
            paymentChannel: 'wechat-pay',
            externalPaymentId: 'ext-refund-list-1'
        });
        await service.applyPaymentCallback({
            tenantId: createContext().tenantId,
            aggregateId: first.order.orderId,
            orderId: first.order.orderId,
            standardizedEventName: 'cashier.payment-succeeded'
        });
        await service.requestRefund(first.order.orderId, createContext(), {
            refundAmount: 30,
            reason: 'member-filter',
            operator: 'ops-a'
        });
        const second = await service.startCheckout(createContext(), {
            memberId: 'mem-tx-refund-list-2',
            items: [{ skuId: 'sku-r2', quantity: 1, price: 120 }],
            paymentChannel: 'alipay',
            externalPaymentId: 'ext-refund-list-2'
        });
        await service.applyPaymentCallback({
            tenantId: createContext().tenantId,
            aggregateId: second.order.orderId,
            orderId: second.order.orderId,
            standardizedEventName: 'cashier.payment-succeeded'
        });
        await service.requestRefund(second.order.orderId, createContext(), {
            refundAmount: 40,
            reason: 'operator-filter',
            operator: 'ops-b'
        });
        const filtered = service.listRefunds(createContext(), {
            memberId: 'mem-tx-refund-list-2',
            operator: 'ops-b',
            status: 'PENDING'
        });
        strict_1.default.equal(filtered.length, 1);
        strict_1.default.equal(filtered[0]?.orderId, second.order.orderId);
        strict_1.default.equal(filtered[0]?.memberId, 'mem-tx-refund-list-2');
        strict_1.default.equal(filtered[0]?.operator, 'ops-b');
        strict_1.default.equal(filtered[0]?.status, transactions_entity_1.TransactionRefundStatus.Pending);
    });
    (0, node_test_1.default)('listRefunds filters by reviewedBy after approval', async () => {
        const memberService = new member_service_1.MemberService();
        memberService.register({
            memberId: 'mem-tx-refund-reviewed-1',
            tenantContext: createContext(),
            nickname: 'Reviewed Refund User'
        });
        const loyaltyService = new loyalty_service_1.LoyaltyService(memberService);
        const cashierService = new cashier_service_1.CashierService(memberService, loyaltyService);
        const service = new transactions_service_1.TransactionsService(cashierService, loyaltyService);
        const created = await service.startCheckout(createContext(), {
            memberId: 'mem-tx-refund-reviewed-1',
            items: [{ skuId: 'sku-reviewed', quantity: 1, price: 110 }],
            paymentChannel: 'wechat-pay',
            externalPaymentId: 'ext-reviewed-1'
        });
        await service.applyPaymentCallback({
            tenantId: createContext().tenantId,
            aggregateId: created.order.orderId,
            orderId: created.order.orderId,
            standardizedEventName: 'cashier.payment-succeeded'
        });
        const requested = await service.requestRefund(created.order.orderId, createContext(), {
            refundAmount: 50,
            reason: 'review-filter',
            operator: 'cashier-review'
        });
        await service.approveRefund(requested.refunds[0].refundId, createContext(), {
            operator: 'ops-reviewer-a',
            note: 'approved-by-a'
        });
        const filtered = service.listRefunds(createContext(), {
            reviewedBy: 'ops-reviewer-a',
            status: transactions_entity_1.TransactionRefundStatus.Completed
        });
        strict_1.default.equal(filtered.length, 1);
        strict_1.default.equal(filtered[0]?.refundId, requested.refunds[0]?.refundId);
        strict_1.default.equal(filtered[0]?.reviewedBy, 'ops-reviewer-a');
    });
    (0, node_test_1.default)('listPendingRefunds returns pending queue sorted by requestedAt asc', async () => {
        const memberService = new member_service_1.MemberService();
        memberService.register({
            memberId: 'mem-tx-pending-queue-1',
            tenantContext: createContext(),
            nickname: 'Pending Queue User'
        });
        const loyaltyService = new loyalty_service_1.LoyaltyService(memberService);
        const cashierService = new cashier_service_1.CashierService(memberService, loyaltyService);
        const service = new transactions_service_1.TransactionsService(cashierService, loyaltyService);
        const first = await service.startCheckout(createContext(), {
            memberId: 'mem-tx-pending-queue-1',
            items: [{ skuId: 'sku-pending-1', quantity: 1, price: 45 }],
            paymentChannel: 'wechat-pay',
            externalPaymentId: 'ext-pending-1'
        });
        const second = await service.startCheckout(createContext(), {
            memberId: 'mem-tx-pending-queue-1',
            items: [{ skuId: 'sku-pending-2', quantity: 1, price: 55 }],
            paymentChannel: 'alipay',
            externalPaymentId: 'ext-pending-2'
        });
        await service.applyPaymentCallback({
            tenantId: createContext().tenantId,
            aggregateId: first.order.orderId,
            orderId: first.order.orderId,
            standardizedEventName: 'cashier.payment-succeeded'
        });
        await service.applyPaymentCallback({
            tenantId: createContext().tenantId,
            aggregateId: second.order.orderId,
            orderId: second.order.orderId,
            standardizedEventName: 'cashier.payment-succeeded'
        });
        const requestedFirst = await service.requestRefund(first.order.orderId, createContext(), {
            refundAmount: 10,
            reason: 'queue-first',
            operator: 'cashier-1'
        });
        const requestedSecond = await service.requestRefund(second.order.orderId, createContext(), {
            refundAmount: 20,
            reason: 'queue-second',
            operator: 'cashier-2'
        });
        requestedFirst.refunds[0].requestedAt = '2026-06-14T01:00:00.000Z';
        requestedSecond.refunds[0].requestedAt = '2026-06-14T02:00:00.000Z';
        const queue = service.listPendingRefunds(createContext(), {
            memberId: 'mem-tx-pending-queue-1'
        });
        const pendingIds = queue.map((entry) => entry.refundId);
        const firstIndex = pendingIds.indexOf(requestedFirst.refunds[0].refundId);
        const secondIndex = pendingIds.indexOf(requestedSecond.refunds[0].refundId);
        strict_1.default.notEqual(firstIndex, -1);
        strict_1.default.notEqual(secondIndex, -1);
        strict_1.default.ok(firstIndex < secondIndex);
    });
    (0, node_test_1.default)('listRefunds filters by requestedAt and reviewedAt windows', async () => {
        const memberService = new member_service_1.MemberService();
        memberService.register({
            memberId: 'mem-tx-refund-window-1',
            tenantContext: createContext(),
            nickname: 'Refund Window User'
        });
        const loyaltyService = new loyalty_service_1.LoyaltyService(memberService);
        const cashierService = new cashier_service_1.CashierService(memberService, loyaltyService);
        const service = new transactions_service_1.TransactionsService(cashierService, loyaltyService);
        const created = await service.startCheckout(createContext(), {
            memberId: 'mem-tx-refund-window-1',
            items: [{ skuId: 'sku-window-1', quantity: 1, price: 130 }],
            paymentChannel: 'wechat-pay',
            externalPaymentId: 'ext-window-1'
        });
        await service.applyPaymentCallback({
            tenantId: createContext().tenantId,
            aggregateId: created.order.orderId,
            orderId: created.order.orderId,
            standardizedEventName: 'cashier.payment-succeeded'
        });
        const requested = await service.requestRefund(created.order.orderId, createContext(), {
            refundAmount: 35,
            reason: 'window-filter',
            operator: 'cashier-window'
        });
        requested.refunds[0].requestedAt = '2026-06-14T10:00:00.000Z';
        await service.approveRefund(requested.refunds[0].refundId, createContext(), {
            operator: 'ops-window',
            note: 'window-approved'
        });
        const refund = service.getRefund(requested.refunds[0].refundId, createContext());
        refund.reviewedAt = '2026-06-15T10:00:00.000Z';
        const requestedWindow = service.listRefunds(createContext(), {
            requestedAfter: '2026-06-14T09:00:00.000Z',
            requestedBefore: '2026-06-14T11:00:00.000Z'
        });
        const reviewedWindow = service.listRefunds(createContext(), {
            reviewedAfter: '2026-06-15T09:00:00.000Z',
            reviewedBefore: '2026-06-15T11:00:00.000Z',
            status: transactions_entity_1.TransactionRefundStatus.Completed
        });
        strict_1.default.equal(requestedWindow.some((entry) => entry.refundId === refund.refundId), true);
        strict_1.default.equal(reviewedWindow.some((entry) => entry.refundId === refund.refundId), true);
    });
    (0, node_test_1.default)('batchApproveRefunds processes pending refunds and skips invalid targets', async () => {
        const memberService = new member_service_1.MemberService();
        memberService.register({
            memberId: 'mem-tx-refund-batch-approve-1',
            tenantContext: createContext(),
            nickname: 'Batch Approve User'
        });
        const loyaltyService = new loyalty_service_1.LoyaltyService(memberService);
        const cashierService = new cashier_service_1.CashierService(memberService, loyaltyService);
        const service = new transactions_service_1.TransactionsService(cashierService, loyaltyService);
        const first = await service.startCheckout(createContext(), {
            memberId: 'mem-tx-refund-batch-approve-1',
            items: [{ skuId: 'sku-batch-approve-1', quantity: 1, price: 70 }],
            paymentChannel: 'wechat-pay',
            externalPaymentId: 'ext-batch-approve-1'
        });
        const second = await service.startCheckout(createContext(), {
            memberId: 'mem-tx-refund-batch-approve-1',
            items: [{ skuId: 'sku-batch-approve-2', quantity: 1, price: 90 }],
            paymentChannel: 'alipay',
            externalPaymentId: 'ext-batch-approve-2'
        });
        await service.applyPaymentCallback({
            tenantId: createContext().tenantId,
            aggregateId: first.order.orderId,
            orderId: first.order.orderId,
            standardizedEventName: 'cashier.payment-succeeded'
        });
        await service.applyPaymentCallback({
            tenantId: createContext().tenantId,
            aggregateId: second.order.orderId,
            orderId: second.order.orderId,
            standardizedEventName: 'cashier.payment-succeeded'
        });
        const requestedFirst = await service.requestRefund(first.order.orderId, createContext(), {
            refundAmount: 20,
            reason: 'batch-approve-1',
            operator: 'cashier-a'
        });
        const requestedSecond = await service.requestRefund(second.order.orderId, createContext(), {
            refundAmount: 30,
            reason: 'batch-approve-2',
            operator: 'cashier-b'
        });
        const result = await service.batchApproveRefunds(createContext(), {
            refundIds: [
                requestedFirst.refunds[0].refundId,
                requestedSecond.refunds[0].refundId,
                'refund-missing'
            ],
            operator: 'ops-batch-approve',
            note: 'batch-approved'
        });
        strict_1.default.equal(result.processedCount, 2);
        strict_1.default.equal(result.skippedCount, 1);
        strict_1.default.equal(result.processedRefundIds.includes(requestedFirst.refunds[0].refundId), true);
        strict_1.default.equal(result.processedRefundIds.includes(requestedSecond.refunds[0].refundId), true);
        strict_1.default.equal(result.skippedRefundIds[0], 'refund-missing');
        strict_1.default.equal(result.refunds.every((refund) => refund.status === transactions_entity_1.TransactionRefundStatus.Completed), true);
        strict_1.default.equal(result.refunds.every((refund) => refund.reviewedBy === 'ops-batch-approve'), true);
        strict_1.default.equal(result.auditSummary.action, 'APPROVE');
        strict_1.default.equal(result.auditSummary.operator, 'ops-batch-approve');
        strict_1.default.equal(result.auditSummary.note, 'batch-approved');
        strict_1.default.ok(result.auditSummary.processedAt);
    });
    (0, node_test_1.default)('batchRejectRefunds processes pending refunds and skips already reviewed ones', async () => {
        const memberService = new member_service_1.MemberService();
        memberService.register({
            memberId: 'mem-tx-refund-batch-reject-1',
            tenantContext: createContext(),
            nickname: 'Batch Reject User'
        });
        const loyaltyService = new loyalty_service_1.LoyaltyService(memberService);
        const cashierService = new cashier_service_1.CashierService(memberService, loyaltyService);
        const service = new transactions_service_1.TransactionsService(cashierService, loyaltyService);
        const first = await service.startCheckout(createContext(), {
            memberId: 'mem-tx-refund-batch-reject-1',
            items: [{ skuId: 'sku-batch-reject-1', quantity: 1, price: 95 }],
            paymentChannel: 'wechat-pay',
            externalPaymentId: 'ext-batch-reject-1'
        });
        const second = await service.startCheckout(createContext(), {
            memberId: 'mem-tx-refund-batch-reject-1',
            items: [{ skuId: 'sku-batch-reject-2', quantity: 1, price: 85 }],
            paymentChannel: 'alipay',
            externalPaymentId: 'ext-batch-reject-2'
        });
        await service.applyPaymentCallback({
            tenantId: createContext().tenantId,
            aggregateId: first.order.orderId,
            orderId: first.order.orderId,
            standardizedEventName: 'cashier.payment-succeeded'
        });
        await service.applyPaymentCallback({
            tenantId: createContext().tenantId,
            aggregateId: second.order.orderId,
            orderId: second.order.orderId,
            standardizedEventName: 'cashier.payment-succeeded'
        });
        const requestedFirst = await service.requestRefund(first.order.orderId, createContext(), {
            refundAmount: 10,
            reason: 'batch-reject-1',
            operator: 'cashier-a'
        });
        const requestedSecond = await service.requestRefund(second.order.orderId, createContext(), {
            refundAmount: 15,
            reason: 'batch-reject-2',
            operator: 'cashier-b'
        });
        await service.approveRefund(requestedSecond.refunds[0].refundId, createContext(), {
            operator: 'ops-reviewed',
            note: 'already-approved'
        });
        const result = service.batchRejectRefunds(createContext(), {
            refundIds: [
                requestedFirst.refunds[0].refundId,
                requestedSecond.refunds[0].refundId
            ],
            operator: 'ops-batch-reject',
            note: 'batch-rejected'
        });
        strict_1.default.equal(result.processedCount, 1);
        strict_1.default.equal(result.skippedCount, 1);
        strict_1.default.equal(result.processedRefundIds[0], requestedFirst.refunds[0].refundId);
        strict_1.default.equal(result.skippedRefundIds[0], requestedSecond.refunds[0].refundId);
        strict_1.default.equal(result.refunds[0]?.status, transactions_entity_1.TransactionRefundStatus.Rejected);
        strict_1.default.equal(result.refunds[0]?.reviewedBy, 'ops-batch-reject');
        strict_1.default.equal(result.auditSummary.action, 'REJECT');
        strict_1.default.equal(result.auditSummary.operator, 'ops-batch-reject');
        strict_1.default.equal(result.auditSummary.note, 'batch-rejected');
        strict_1.default.ok(result.auditSummary.processedAt);
    });
    (0, node_test_1.default)('getRefundDashboard summarizes statuses, pending queue, and recent reviewers', async () => {
        const memberService = new member_service_1.MemberService();
        memberService.register({
            memberId: 'mem-tx-refund-dashboard-1',
            tenantContext: createContext(),
            nickname: 'Refund Dashboard User'
        });
        const loyaltyService = new loyalty_service_1.LoyaltyService(memberService);
        const cashierService = new cashier_service_1.CashierService(memberService, loyaltyService);
        const service = new transactions_service_1.TransactionsService(cashierService, loyaltyService);
        const first = await service.startCheckout(createContext(), {
            memberId: 'mem-tx-refund-dashboard-1',
            items: [{ skuId: 'sku-dashboard-1', quantity: 1, price: 100 }],
            paymentChannel: 'wechat-pay',
            externalPaymentId: 'ext-dashboard-1'
        });
        const second = await service.startCheckout(createContext(), {
            memberId: 'mem-tx-refund-dashboard-1',
            items: [{ skuId: 'sku-dashboard-2', quantity: 1, price: 90 }],
            paymentChannel: 'alipay',
            externalPaymentId: 'ext-dashboard-2'
        });
        const third = await service.startCheckout(createContext(), {
            memberId: 'mem-tx-refund-dashboard-1',
            items: [{ skuId: 'sku-dashboard-3', quantity: 1, price: 80 }],
            paymentChannel: 'wechat-pay',
            externalPaymentId: 'ext-dashboard-3'
        });
        for (const orderId of [first.order.orderId, second.order.orderId, third.order.orderId]) {
            await service.applyPaymentCallback({
                tenantId: createContext().tenantId,
                aggregateId: orderId,
                orderId,
                standardizedEventName: 'cashier.payment-succeeded'
            });
        }
        const pendingAggregate = await service.requestRefund(first.order.orderId, createContext(), {
            refundAmount: 25,
            reason: 'dashboard-pending',
            operator: 'cashier-pending'
        });
        const completedAggregate = await service.requestRefund(second.order.orderId, createContext(), {
            refundAmount: 30,
            reason: 'dashboard-completed',
            operator: 'cashier-completed'
        });
        const rejectedAggregate = await service.requestRefund(third.order.orderId, createContext(), {
            refundAmount: 15,
            reason: 'dashboard-rejected',
            operator: 'cashier-rejected'
        });
        pendingAggregate.refunds[0].requestedAt = '2026-06-14T01:00:00.000Z';
        completedAggregate.refunds[0].requestedAt = '2026-06-14T02:00:00.000Z';
        rejectedAggregate.refunds[0].requestedAt = '2026-06-14T03:00:00.000Z';
        await service.approveRefund(completedAggregate.refunds[0].refundId, createContext(), {
            operator: 'ops-reviewer-a',
            note: 'dashboard-approved'
        });
        service.getRefund(completedAggregate.refunds[0].refundId, createContext()).reviewedAt =
            '2026-06-15T10:00:00.000Z';
        service.rejectRefund(rejectedAggregate.refunds[0].refundId, createContext(), {
            operator: 'ops-reviewer-b',
            note: 'dashboard-rejected-note'
        });
        service.getRefund(rejectedAggregate.refunds[0].refundId, createContext()).reviewedAt =
            '2026-06-15T11:00:00.000Z';
        const dashboard = service.getRefundDashboard(createContext(), {
            memberId: 'mem-tx-refund-dashboard-1',
            recentReviewLimit: 2,
            asOfTime: '2026-06-14T01:30:00.000Z'
        });
        strict_1.default.equal(dashboard.totalCount, 3);
        strict_1.default.equal(dashboard.totalRequestedAmount, 70);
        strict_1.default.equal(dashboard.totalCompletedAmount, 30);
        strict_1.default.equal(dashboard.totalPendingAmount, 25);
        strict_1.default.equal(dashboard.statusGroups.find((group) => group.status === transactions_entity_1.TransactionRefundStatus.Pending)?.count, 1);
        strict_1.default.equal(dashboard.pendingSummary.count, 1);
        strict_1.default.equal(dashboard.pendingSummary.oldestRequestedAt, '2026-06-14T01:00:00.000Z');
        strict_1.default.equal(dashboard.recentReviews.length, 2);
        strict_1.default.equal(dashboard.recentReviews[0]?.refundId, rejectedAggregate.refunds[0].refundId);
        strict_1.default.equal(dashboard.recentReviews[0]?.status, transactions_entity_1.TransactionRefundStatus.Rejected);
        strict_1.default.equal(dashboard.recentReviews[1]?.refundId, completedAggregate.refunds[0].refundId);
        strict_1.default.equal(dashboard.reviewerSummaries[0]?.reviewCount, 1);
        strict_1.default.equal(dashboard.reviewerSummaries.length, 2);
        const pendingOperatorStat = dashboard.operatorQuickStats.find((entry) => entry.operator === 'cashier-pending');
        strict_1.default.equal(pendingOperatorStat?.count, 1);
        strict_1.default.equal(pendingOperatorStat?.totalAmount, 25);
        strict_1.default.equal(dashboard.riskSummary.lowCount, 1);
    });
    (0, node_test_1.default)('getRefundDashboard builds aging buckets and priority queue risk order', async () => {
        const memberService = new member_service_1.MemberService();
        memberService.register({
            memberId: 'mem-tx-refund-priority-1',
            tenantContext: createContext(),
            nickname: 'Refund Priority User'
        });
        const loyaltyService = new loyalty_service_1.LoyaltyService(memberService);
        const cashierService = new cashier_service_1.CashierService(memberService, loyaltyService);
        const service = new transactions_service_1.TransactionsService(cashierService, loyaltyService);
        const orders = await Promise.all([
            service.startCheckout(createContext(), {
                memberId: 'mem-tx-refund-priority-1',
                items: [{ skuId: 'sku-priority-1', quantity: 1, price: 120 }],
                paymentChannel: 'wechat-pay',
                externalPaymentId: 'ext-priority-1'
            }),
            service.startCheckout(createContext(), {
                memberId: 'mem-tx-refund-priority-1',
                items: [{ skuId: 'sku-priority-2', quantity: 1, price: 90 }],
                paymentChannel: 'wechat-pay',
                externalPaymentId: 'ext-priority-2'
            }),
            service.startCheckout(createContext(), {
                memberId: 'mem-tx-refund-priority-1',
                items: [{ skuId: 'sku-priority-3', quantity: 1, price: 40 }],
                paymentChannel: 'wechat-pay',
                externalPaymentId: 'ext-priority-3'
            })
        ]);
        for (const entry of orders) {
            await service.applyPaymentCallback({
                tenantId: createContext().tenantId,
                aggregateId: entry.order.orderId,
                orderId: entry.order.orderId,
                standardizedEventName: 'cashier.payment-succeeded'
            });
        }
        const highRisk = await service.requestRefund(orders[0].order.orderId, createContext(), {
            refundAmount: 120,
            reason: 'high-risk',
            operator: 'cashier-high'
        });
        const mediumRisk = await service.requestRefund(orders[1].order.orderId, createContext(), {
            refundAmount: 60,
            reason: 'medium-risk',
            operator: 'cashier-medium'
        });
        const lowRisk = await service.requestRefund(orders[2].order.orderId, createContext(), {
            refundAmount: 20,
            reason: 'low-risk',
            operator: 'cashier-low'
        });
        highRisk.refunds[0].requestedAt = '2026-06-14T00:00:00.000Z';
        mediumRisk.refunds[0].requestedAt = '2026-06-15T18:00:00.000Z';
        lowRisk.refunds[0].requestedAt = '2026-06-15T23:30:00.000Z';
        const dashboard = service.getRefundDashboard(createContext(), {
            memberId: 'mem-tx-refund-priority-1',
            asOfTime: '2026-06-16T00:00:00.000Z',
            priorityQueueLimit: 3
        });
        strict_1.default.equal(dashboard.agingBuckets.find((bucket) => bucket.bucket === 'GTE_24H')?.count, 1);
        strict_1.default.equal(dashboard.agingBuckets.find((bucket) => bucket.bucket === 'H4_TO_H24')?.count, 1);
        strict_1.default.equal(dashboard.agingBuckets.find((bucket) => bucket.bucket === 'UNDER_1H')?.count, 1);
        strict_1.default.equal(dashboard.priorityQueue.length, 3);
        strict_1.default.equal(dashboard.priorityQueue[0]?.refundId, highRisk.refunds[0].refundId);
        strict_1.default.equal(dashboard.priorityQueue[0]?.riskLevel, 'HIGH');
        strict_1.default.equal(dashboard.priorityQueue[1]?.refundId, mediumRisk.refunds[0].refundId);
        strict_1.default.equal(dashboard.priorityQueue[1]?.riskLevel, 'MEDIUM');
        strict_1.default.equal(dashboard.priorityQueue[2]?.refundId, lowRisk.refunds[0].refundId);
        strict_1.default.equal(dashboard.priorityQueue[2]?.riskLevel, 'LOW');
        strict_1.default.equal(dashboard.riskSummary.highCount, 1);
        strict_1.default.equal(dashboard.riskSummary.mediumCount, 1);
        strict_1.default.equal(dashboard.riskSummary.lowCount, 1);
    });
    (0, node_test_1.default)('getRefundDashboard builds escalation summary and dispatch queue', async () => {
        const memberService = new member_service_1.MemberService();
        memberService.register({
            memberId: 'mem-tx-refund-dispatch-1',
            tenantContext: createContext(),
            nickname: 'Refund Dispatch User'
        });
        const loyaltyService = new loyalty_service_1.LoyaltyService(memberService);
        const cashierService = new cashier_service_1.CashierService(memberService, loyaltyService);
        const service = new transactions_service_1.TransactionsService(cashierService, loyaltyService);
        const orders = await Promise.all([
            service.startCheckout(createContext(), {
                memberId: 'mem-tx-refund-dispatch-1',
                items: [{ skuId: 'sku-dispatch-1', quantity: 1, price: 160 }],
                paymentChannel: 'wechat-pay',
                externalPaymentId: 'ext-dispatch-1'
            }),
            service.startCheckout(createContext(), {
                memberId: 'mem-tx-refund-dispatch-1',
                items: [{ skuId: 'sku-dispatch-2', quantity: 1, price: 80 }],
                paymentChannel: 'wechat-pay',
                externalPaymentId: 'ext-dispatch-2'
            }),
            service.startCheckout(createContext(), {
                memberId: 'mem-tx-refund-dispatch-1',
                items: [{ skuId: 'sku-dispatch-3', quantity: 1, price: 45 }],
                paymentChannel: 'wechat-pay',
                externalPaymentId: 'ext-dispatch-3'
            }),
            service.startCheckout(createContext(), {
                memberId: 'mem-tx-refund-dispatch-1',
                items: [{ skuId: 'sku-dispatch-4', quantity: 1, price: 20 }],
                paymentChannel: 'wechat-pay',
                externalPaymentId: 'ext-dispatch-4'
            })
        ]);
        for (const entry of orders) {
            await service.applyPaymentCallback({
                tenantId: createContext().tenantId,
                aggregateId: entry.order.orderId,
                orderId: entry.order.orderId,
                standardizedEventName: 'cashier.payment-succeeded'
            });
        }
        const financeRefund = await service.requestRefund(orders[0].order.orderId, createContext(), {
            refundAmount: 120,
            reason: 'dispatch-finance',
            operator: 'cashier-finance'
        });
        const managerRefund = await service.requestRefund(orders[1].order.orderId, createContext(), {
            refundAmount: 60,
            reason: 'dispatch-manager',
            operator: 'cashier-manager'
        });
        const leadRefund = await service.requestRefund(orders[2].order.orderId, createContext(), {
            refundAmount: 30,
            reason: 'dispatch-lead',
            operator: 'cashier-lead'
        });
        const noneRefund = await service.requestRefund(orders[3].order.orderId, createContext(), {
            refundAmount: 10,
            reason: 'dispatch-none',
            operator: 'cashier-queue'
        });
        financeRefund.refunds[0].requestedAt = '2026-06-14T00:00:00.000Z';
        managerRefund.refunds[0].requestedAt = '2026-06-15T16:00:00.000Z';
        leadRefund.refunds[0].requestedAt = '2026-06-15T22:00:00.000Z';
        noneRefund.refunds[0].requestedAt = '2026-06-15T23:40:00.000Z';
        const dashboard = service.getRefundDashboard(createContext(), {
            memberId: 'mem-tx-refund-dispatch-1',
            asOfTime: '2026-06-16T00:00:00.000Z',
            dispatchQueueLimit: 4
        });
        strict_1.default.equal(dashboard.dispatchQueue.length, 4);
        strict_1.default.equal(dashboard.dispatchQueue[0]?.refundId, financeRefund.refunds[0].refundId);
        strict_1.default.equal(dashboard.dispatchQueue[0]?.escalationLevel, 'FINANCE');
        strict_1.default.equal(dashboard.dispatchQueue[0]?.suggestedOwner, 'refund-finance-review');
        strict_1.default.equal(dashboard.dispatchQueue[1]?.refundId, managerRefund.refunds[0].refundId);
        strict_1.default.equal(dashboard.dispatchQueue[1]?.escalationLevel, 'OPS_MANAGER');
        strict_1.default.equal(dashboard.dispatchQueue[2]?.escalationLevel, 'TEAM_LEAD');
        strict_1.default.equal(dashboard.dispatchQueue[2]?.dispatchReason, transactions_entity_1.TransactionRefundDispatchReason.ApproachingSlaBreach);
        strict_1.default.equal(dashboard.dispatchQueue[3]?.escalationLevel, 'NONE');
        strict_1.default.equal(dashboard.dispatchQueue[3]?.suggestedOwner, 'refund-ops-queue');
        strict_1.default.equal(dashboard.escalationSummary.financeCount, 1);
        strict_1.default.equal(dashboard.escalationSummary.opsManagerCount, 1);
        strict_1.default.equal(dashboard.escalationSummary.teamLeadCount, 1);
        strict_1.default.equal(dashboard.escalationSummary.noneCount, 1);
    });
    (0, node_test_1.default)('getRefundDashboard supports configurable SLA thresholds, owner summaries, and escalation trail', async () => {
        const memberService = new member_service_1.MemberService();
        memberService.register({
            memberId: 'mem-tx-refund-sla-1',
            tenantContext: createContext(),
            nickname: 'Refund SLA User'
        });
        const loyaltyService = new loyalty_service_1.LoyaltyService(memberService);
        const cashierService = new cashier_service_1.CashierService(memberService, loyaltyService);
        const service = new transactions_service_1.TransactionsService(cashierService, loyaltyService);
        const orders = await Promise.all([
            service.startCheckout(createContext(), {
                memberId: 'mem-tx-refund-sla-1',
                items: [{ skuId: 'sku-sla-1', quantity: 1, price: 80 }],
                paymentChannel: 'wechat-pay',
                externalPaymentId: 'ext-sla-1'
            }),
            service.startCheckout(createContext(), {
                memberId: 'mem-tx-refund-sla-1',
                items: [{ skuId: 'sku-sla-2', quantity: 1, price: 70 }],
                paymentChannel: 'wechat-pay',
                externalPaymentId: 'ext-sla-2'
            }),
            service.startCheckout(createContext(), {
                memberId: 'mem-tx-refund-sla-1',
                items: [{ skuId: 'sku-sla-3', quantity: 1, price: 30 }],
                paymentChannel: 'wechat-pay',
                externalPaymentId: 'ext-sla-3'
            })
        ]);
        for (const entry of orders) {
            await service.applyPaymentCallback({
                tenantId: createContext().tenantId,
                aggregateId: entry.order.orderId,
                orderId: entry.order.orderId,
                standardizedEventName: 'cashier.payment-succeeded'
            });
        }
        const managerRefund = await service.requestRefund(orders[0].order.orderId, createContext(), {
            refundAmount: 40,
            reason: 'sla-manager',
            operator: 'cashier-sla-a'
        });
        const leadRefund = await service.requestRefund(orders[1].order.orderId, createContext(), {
            refundAmount: 20,
            reason: 'sla-lead',
            operator: 'cashier-sla-b'
        });
        const noneRefund = await service.requestRefund(orders[2].order.orderId, createContext(), {
            refundAmount: 10,
            reason: 'sla-none',
            operator: 'cashier-sla-c'
        });
        managerRefund.refunds[0].requestedAt = '2026-06-15T21:00:00.000Z';
        leadRefund.refunds[0].requestedAt = '2026-06-15T23:00:00.000Z';
        noneRefund.refunds[0].requestedAt = '2026-06-15T23:50:00.000Z';
        const dashboard = service.getRefundDashboard(createContext(), {
            memberId: 'mem-tx-refund-sla-1',
            asOfTime: '2026-06-16T00:00:00.000Z',
            teamLeadThresholdMinutes: 15,
            opsManagerThresholdMinutes: 120,
            financeThresholdMinutes: 300,
            dispatchQueueLimit: 3,
            recentEscalationLimit: 2
        });
        strict_1.default.equal(dashboard.slaThresholds.teamLeadMinutes, 15);
        strict_1.default.equal(dashboard.slaThresholds.opsManagerMinutes, 120);
        strict_1.default.equal(dashboard.slaThresholds.financeMinutes, 300);
        strict_1.default.equal(dashboard.dispatchQueue[0]?.refundId, managerRefund.refunds[0].refundId);
        strict_1.default.equal(dashboard.dispatchQueue[0]?.escalationLevel, 'OPS_MANAGER');
        strict_1.default.equal(dashboard.dispatchQueue[1]?.refundId, leadRefund.refunds[0].refundId);
        strict_1.default.equal(dashboard.dispatchQueue[1]?.escalationLevel, 'TEAM_LEAD');
        strict_1.default.equal(dashboard.dispatchQueue[2]?.refundId, noneRefund.refunds[0].refundId);
        strict_1.default.equal(dashboard.dispatchQueue[2]?.escalationLevel, 'NONE');
        strict_1.default.equal(dashboard.ownerSummaries.length, 3);
        strict_1.default.equal(dashboard.ownerSummaries.find((entry) => entry.suggestedOwner === 'refund-ops-manager')?.pendingCount, 1);
        strict_1.default.equal(dashboard.ownerSummaries.find((entry) => entry.suggestedOwner === 'refund-team-lead')?.pendingCount, 1);
        strict_1.default.equal(dashboard.recentEscalationTrail.length, 2);
        strict_1.default.equal(dashboard.recentEscalationTrail[0]?.refundId, managerRefund.refunds[0].refundId);
        strict_1.default.equal(dashboard.recentEscalationTrail[1]?.refundId, leadRefund.refunds[0].refundId);
    });
    (0, node_test_1.default)('batchAssignRefunds assigns pending refunds by suggested owner', async () => {
        const memberService = new member_service_1.MemberService();
        memberService.register({
            memberId: 'mem-tx-refund-assign-1',
            tenantContext: createContext(),
            nickname: 'Refund Assign User'
        });
        const loyaltyService = new loyalty_service_1.LoyaltyService(memberService);
        const cashierService = new cashier_service_1.CashierService(memberService, loyaltyService);
        const service = new transactions_service_1.TransactionsService(cashierService, loyaltyService);
        const orders = await Promise.all([
            service.startCheckout(createContext(), {
                memberId: 'mem-tx-refund-assign-1',
                items: [{ skuId: 'sku-assign-1', quantity: 1, price: 80 }],
                paymentChannel: 'wechat-pay',
                externalPaymentId: 'ext-assign-1'
            }),
            service.startCheckout(createContext(), {
                memberId: 'mem-tx-refund-assign-1',
                items: [{ skuId: 'sku-assign-2', quantity: 1, price: 90 }],
                paymentChannel: 'wechat-pay',
                externalPaymentId: 'ext-assign-2'
            })
        ]);
        for (const entry of orders) {
            await service.applyPaymentCallback({
                tenantId: createContext().tenantId,
                aggregateId: entry.order.orderId,
                orderId: entry.order.orderId,
                standardizedEventName: 'cashier.payment-succeeded'
            });
        }
        const firstRefund = await service.requestRefund(orders[0].order.orderId, createContext(), {
            refundAmount: 60,
            reason: 'assign-manager',
            operator: 'cashier-a'
        });
        const secondRefund = await service.requestRefund(orders[1].order.orderId, createContext(), {
            refundAmount: 55,
            reason: 'assign-manager-2',
            operator: 'cashier-b'
        });
        firstRefund.refunds[0].requestedAt = '2026-06-15T18:00:00.000Z';
        secondRefund.refunds[0].requestedAt = '2026-06-15T19:00:00.000Z';
        const result = service.batchAssignRefunds(createContext(), {
            memberId: 'mem-tx-refund-assign-1',
            suggestedOwner: 'refund-ops-manager',
            assignee: 'ops-owner-a',
            operator: 'ops-manager',
            note: 'manual-assign',
            asOfTime: '2026-06-16T00:00:00.000Z',
            limit: 1
        });
        strict_1.default.equal(result.processedCount, 1);
        strict_1.default.equal(result.skippedCount, 0);
        strict_1.default.equal(result.assignmentSummary.action, transactions_entity_1.TransactionRefundAssignmentAction.Assign);
        strict_1.default.equal(result.refunds[0]?.assignedOwner, 'refund-ops-manager');
        strict_1.default.equal(result.refunds[0]?.assignedTo, 'ops-owner-a');
        strict_1.default.equal(result.refunds[0]?.assignedBy, 'ops-manager');
        strict_1.default.equal(result.refunds[0]?.assignmentNote, 'manual-assign');
        strict_1.default.equal(result.processedRefundIds.length, 1);
        const dashboard = service.getRefundDashboard(createContext(), {
            memberId: 'mem-tx-refund-assign-1',
            asOfTime: '2026-06-16T00:00:00.000Z',
            dispatchQueueLimit: 2
        });
        const assignedItem = dashboard.dispatchQueue.find((item) => item.refundId === result.processedRefundIds[0]);
        strict_1.default.equal(assignedItem?.assignedOwner, 'refund-ops-manager');
        strict_1.default.equal(assignedItem?.assignedTo, 'ops-owner-a');
        strict_1.default.equal(assignedItem?.dispatchReason, transactions_entity_1.TransactionRefundDispatchReason.SlaBreachedOrMediumRisk);
    });
    (0, node_test_1.default)('batchClaimRefunds claims pending refunds by suggested owner', async () => {
        const memberService = new member_service_1.MemberService();
        memberService.register({
            memberId: 'mem-tx-refund-claim-1',
            tenantContext: createContext(),
            nickname: 'Refund Claim User'
        });
        const loyaltyService = new loyalty_service_1.LoyaltyService(memberService);
        const cashierService = new cashier_service_1.CashierService(memberService, loyaltyService);
        const service = new transactions_service_1.TransactionsService(cashierService, loyaltyService);
        const created = await service.startCheckout(createContext(), {
            memberId: 'mem-tx-refund-claim-1',
            items: [{ skuId: 'sku-claim-1', quantity: 1, price: 30 }],
            paymentChannel: 'wechat-pay',
            externalPaymentId: 'ext-claim-1'
        });
        await service.applyPaymentCallback({
            tenantId: createContext().tenantId,
            aggregateId: created.order.orderId,
            orderId: created.order.orderId,
            standardizedEventName: 'cashier.payment-succeeded'
        });
        const claimedRefund = await service.requestRefund(created.order.orderId, createContext(), {
            refundAmount: 15,
            reason: 'claim-team-lead',
            operator: 'cashier-claim'
        });
        claimedRefund.refunds[0].requestedAt = '2026-06-15T22:00:00.000Z';
        const result = service.batchClaimRefunds(createContext(), {
            memberId: 'mem-tx-refund-claim-1',
            suggestedOwner: 'refund-team-lead',
            operator: 'ops-claimer',
            note: 'claim-self',
            asOfTime: '2026-06-16T00:00:00.000Z'
        });
        strict_1.default.equal(result.processedCount, 1);
        strict_1.default.equal(result.assignmentSummary.action, transactions_entity_1.TransactionRefundAssignmentAction.Claim);
        strict_1.default.equal(result.refunds[0]?.assignedOwner, 'refund-team-lead');
        strict_1.default.equal(result.refunds[0]?.assignedTo, 'ops-claimer');
        strict_1.default.equal(result.refunds[0]?.assignedBy, 'ops-claimer');
        strict_1.default.equal(result.refunds[0]?.assignmentNote, 'claim-self');
        strict_1.default.equal(result.assignmentSummary.assignee, 'ops-claimer');
    });
    (0, node_test_1.default)('listRefunds respects orderId and limit', async () => {
        const memberService = new member_service_1.MemberService();
        memberService.register({
            memberId: 'mem-tx-refund-list-3',
            tenantContext: createContext(),
            nickname: 'Refund Limit User'
        });
        const loyaltyService = new loyalty_service_1.LoyaltyService(memberService);
        const cashierService = new cashier_service_1.CashierService(memberService, loyaltyService);
        const service = new transactions_service_1.TransactionsService(cashierService, loyaltyService);
        const created = await service.startCheckout(createContext(), {
            memberId: 'mem-tx-refund-list-3',
            items: [{ skuId: 'sku-r3', quantity: 1, price: 150 }],
            paymentChannel: 'wechat-pay',
            externalPaymentId: 'ext-refund-list-3'
        });
        await service.applyPaymentCallback({
            tenantId: createContext().tenantId,
            aggregateId: created.order.orderId,
            orderId: created.order.orderId,
            standardizedEventName: 'cashier.payment-succeeded'
        });
        await service.requestRefund(created.order.orderId, createContext(), {
            refundAmount: 30,
            reason: 'limit-first',
            operator: 'ops-limit'
        });
        await service.requestRefund(created.order.orderId, createContext(), {
            refundAmount: 20,
            reason: 'limit-second',
            operator: 'ops-limit'
        });
        const refunds = service.listRefunds(createContext(), {
            orderId: created.order.orderId,
            operator: 'ops-limit',
            limit: 1
        });
        strict_1.default.equal(refunds.length, 1);
        strict_1.default.equal(refunds[0]?.orderId, created.order.orderId);
        strict_1.default.equal(refunds[0]?.operator, 'ops-limit');
    });
    (0, node_test_1.default)('startCheckout with coupon and blindbox includes them in aggregate', async () => {
        const memberService = new member_service_1.MemberService();
        memberService.register({
            memberId: 'mem-tx-5',
            tenantContext: createContext(),
            nickname: 'Coupon User'
        });
        const loyaltyService = new loyalty_service_1.LoyaltyService(memberService);
        const cashierService = new cashier_service_1.CashierService(memberService, loyaltyService);
        const service = new transactions_service_1.TransactionsService(cashierService, loyaltyService);
        const aggregate = await service.startCheckout(createContext(), {
            memberId: 'mem-tx-5',
            items: [{ skuId: 'sku-tx-5', quantity: 1, price: 99 }],
            paymentChannel: 'wechat-pay',
            couponCode: 'COUPON-TX',
            blindboxPlanId: 'bb-tx-plan',
            blindboxQuantity: 3
        });
        strict_1.default.equal(aggregate.order.couponCode, 'COUPON-TX');
        strict_1.default.equal(aggregate.order.blindboxPlanId, 'bb-tx-plan');
        strict_1.default.equal(aggregate.order.blindboxQuantity, 3);
    });
});
//# sourceMappingURL=transactions.service.test.js.map