"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const cashier_entity_1 = require("./cashier.entity");
const cashier_contract_1 = require("./cashier.contract");
const tenantCtx = { tenantId: 'tenant-demo', branchId: 'branch-demo', operatorId: 'op-1' };
(0, node_test_1.default)('toCashierOrderContract maps order including single item and status', () => {
    const order = {
        orderId: 'order-1',
        tenantContext: tenantCtx,
        memberId: 'member-1',
        items: [{ skuId: 'sku-1', title: '盲盒 A', quantity: 2, price: 49.9 }],
        currency: 'CNY',
        totalAmount: 99.8,
        couponCode: 'COUPON10',
        blindboxPlanId: 'plan-1',
        blindboxQuantity: 3,
        status: cashier_entity_1.CashierOrderStatus.Paid,
        latestPaymentId: 'payment-1',
        createdAt: '2026-06-23T06:00:00.000Z',
        updatedAt: '2026-06-23T06:05:00.000Z',
        paidAt: '2026-06-23T06:03:00.000Z',
        closedAt: undefined,
        closeReason: undefined,
        closedBy: undefined,
        closeNote: undefined,
        source: 'memory',
    };
    const contract = (0, cashier_contract_1.toCashierOrderContract)(order);
    strict_1.default.equal(contract.orderId, 'order-1');
    strict_1.default.equal(contract.tenantId, 'tenant-demo');
    strict_1.default.equal(contract.memberId, 'member-1');
    strict_1.default.equal(contract.currency, 'CNY');
    strict_1.default.equal(contract.totalAmount, 99.8);
    strict_1.default.equal(contract.couponCode, 'COUPON10');
    strict_1.default.equal(contract.blindboxPlanId, 'plan-1');
    strict_1.default.equal(contract.blindboxQuantity, 3);
    strict_1.default.equal(contract.status, cashier_entity_1.CashierOrderStatus.Paid);
    strict_1.default.equal(contract.latestPaymentId, 'payment-1');
    strict_1.default.equal(contract.paidAt, '2026-06-23T06:03:00.000Z');
    strict_1.default.equal(contract.source, 'memory');
    // items mapped
    strict_1.default.equal(contract.items.length, 1);
    strict_1.default.equal(contract.items[0].skuId, 'sku-1');
    strict_1.default.equal(contract.items[0].title, '盲盒 A');
    strict_1.default.equal(contract.items[0].quantity, 2);
    strict_1.default.equal(contract.items[0].price, 49.9);
    // optional undefined fields
    strict_1.default.equal(contract.closedAt, undefined);
    strict_1.default.equal(contract.closeReason, undefined);
    strict_1.default.equal(contract.closedBy, undefined);
    strict_1.default.equal(contract.closeNote, undefined);
});
(0, node_test_1.default)('toCashierOrderContract maps closed order with close details', () => {
    const order = {
        orderId: 'order-2',
        tenantContext: tenantCtx,
        memberId: 'member-2',
        items: [{ skuId: 'sku-2', title: '手办', quantity: 1, price: 150 }],
        currency: 'CNY',
        totalAmount: 150,
        couponCode: undefined,
        blindboxPlanId: undefined,
        blindboxQuantity: undefined,
        status: cashier_entity_1.CashierOrderStatus.Closed,
        latestPaymentId: 'payment-2',
        createdAt: '2026-06-22T10:00:00.000Z',
        updatedAt: '2026-06-22T11:00:00.000Z',
        paidAt: undefined,
        closedAt: '2026-06-22T11:00:00.000Z',
        closeReason: cashier_entity_1.CashierOrderCloseReason.PaymentTimeout,
        closedBy: 'system',
        closeNote: '超时自动关闭',
        source: 'memory',
    };
    const contract = (0, cashier_contract_1.toCashierOrderContract)(order);
    strict_1.default.equal(contract.orderId, 'order-2');
    strict_1.default.equal(contract.status, cashier_entity_1.CashierOrderStatus.Closed);
    strict_1.default.equal(contract.closedAt, '2026-06-22T11:00:00.000Z');
    strict_1.default.equal(contract.closeReason, cashier_entity_1.CashierOrderCloseReason.PaymentTimeout);
    strict_1.default.equal(contract.closedBy, 'system');
    strict_1.default.equal(contract.closeNote, '超时自动关闭');
    strict_1.default.equal(contract.paidAt, undefined);
    strict_1.default.equal(contract.items.length, 1);
    strict_1.default.equal(contract.items[0].skuId, 'sku-2');
    strict_1.default.equal(contract.items[0].price, 150);
});
(0, node_test_1.default)('toCashierOrderItemContract maps single item', () => {
    const item = { skuId: 'sku-x', title: 'T恤', quantity: 3, price: 99 };
    const contract = (0, cashier_contract_1.toCashierOrderItemContract)(item);
    strict_1.default.equal(contract.skuId, 'sku-x');
    strict_1.default.equal(contract.title, 'T恤');
    strict_1.default.equal(contract.quantity, 3);
    strict_1.default.equal(contract.price, 99);
});
(0, node_test_1.default)('toCashierOrderItemContract omits title when undefined', () => {
    const item = { skuId: 'sku-y', quantity: 1, price: 25 };
    const contract = (0, cashier_contract_1.toCashierOrderItemContract)(item);
    strict_1.default.equal(contract.skuId, 'sku-y');
    strict_1.default.equal(contract.title, undefined);
    strict_1.default.equal(contract.quantity, 1);
    strict_1.default.equal(contract.price, 25);
});
(0, node_test_1.default)('toCashierPaymentContract maps succeeded payment', () => {
    const payment = {
        paymentId: 'payment-1',
        orderId: 'order-1',
        externalPaymentId: 'ext-abc',
        channel: 'wechat',
        amount: 99.8,
        status: cashier_entity_1.CashierPaymentStatus.Succeeded,
        transactionNo: 'txn-001',
        sourceEventName: 'cashier.payment-succeeded',
        failureReason: undefined,
        createdAt: '2026-06-23T06:02:00.000Z',
        updatedAt: '2026-06-23T06:03:00.000Z',
        completedAt: '2026-06-23T06:03:00.000Z',
    };
    const contract = (0, cashier_contract_1.toCashierPaymentContract)(payment);
    strict_1.default.equal(contract.paymentId, 'payment-1');
    strict_1.default.equal(contract.orderId, 'order-1');
    strict_1.default.equal(contract.externalPaymentId, 'ext-abc');
    strict_1.default.equal(contract.channel, 'wechat');
    strict_1.default.equal(contract.amount, 99.8);
    strict_1.default.equal(contract.status, cashier_entity_1.CashierPaymentStatus.Succeeded);
    strict_1.default.equal(contract.transactionNo, 'txn-001');
    strict_1.default.equal(contract.sourceEventName, 'cashier.payment-succeeded');
    strict_1.default.equal(contract.failureReason, undefined);
    strict_1.default.equal(contract.completedAt, '2026-06-23T06:03:00.000Z');
});
(0, node_test_1.default)('toCashierPaymentContract maps failed payment with failure reason', () => {
    const payment = {
        paymentId: 'payment-2',
        orderId: 'order-2',
        externalPaymentId: undefined,
        channel: 'alipay',
        amount: 150,
        status: cashier_entity_1.CashierPaymentStatus.Failed,
        transactionNo: undefined,
        sourceEventName: 'cashier.payment-failed',
        failureReason: '余额不足',
        createdAt: '2026-06-22T10:00:00.000Z',
        updatedAt: '2026-06-22T11:00:00.000Z',
        completedAt: '2026-06-22T11:00:00.000Z',
    };
    const contract = (0, cashier_contract_1.toCashierPaymentContract)(payment);
    strict_1.default.equal(contract.paymentId, 'payment-2');
    strict_1.default.equal(contract.channel, 'alipay');
    strict_1.default.equal(contract.status, cashier_entity_1.CashierPaymentStatus.Failed);
    strict_1.default.equal(contract.failureReason, '余额不足');
    strict_1.default.equal(contract.externalPaymentId, undefined);
    strict_1.default.equal(contract.transactionNo, undefined);
    strict_1.default.equal(contract.sourceEventName, 'cashier.payment-failed');
});
(0, node_test_1.default)('toCashierPaymentContract maps pending payment', () => {
    const payment = {
        paymentId: 'payment-3',
        orderId: 'order-3',
        externalPaymentId: 'ext-pending',
        channel: 'unionpay',
        amount: 50,
        status: cashier_entity_1.CashierPaymentStatus.Pending,
        transactionNo: undefined,
        sourceEventName: undefined,
        failureReason: undefined,
        createdAt: '2026-06-23T07:00:00.000Z',
        updatedAt: '2026-06-23T07:00:00.000Z',
        completedAt: undefined,
    };
    const contract = (0, cashier_contract_1.toCashierPaymentContract)(payment);
    strict_1.default.equal(contract.status, cashier_entity_1.CashierPaymentStatus.Pending);
    strict_1.default.equal(contract.completedAt, undefined);
    strict_1.default.equal(contract.sourceEventName, undefined);
    strict_1.default.equal(contract.failureReason, undefined);
    strict_1.default.equal(contract.transactionNo, undefined);
});
//# sourceMappingURL=cashier.contract.test.js.map