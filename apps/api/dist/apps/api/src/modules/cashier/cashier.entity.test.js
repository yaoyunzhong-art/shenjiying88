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
const cashier_entity_1 = require("./cashier.entity");
(0, node_test_1.describe)('cashier.entity', () => {
    (0, node_test_1.default)('computeCashierOrderTotal sums item price x quantity', () => {
        const total = (0, cashier_entity_1.computeCashierOrderTotal)([
            { skuId: 'sku-1', quantity: 2, price: 30 },
            { skuId: 'sku-2', quantity: 1, price: 40 }
        ]);
        strict_1.default.equal(total, 100);
    });
    (0, node_test_1.default)('CashierOrder contract supports pending payment shape', () => {
        const order = {
            orderId: 'order-1',
            tenantContext: { tenantId: 'tenant-1' },
            memberId: 'member-1',
            items: [{ skuId: 'sku-1', quantity: 1, price: 50 }],
            currency: 'CNY',
            totalAmount: 50,
            couponCode: 'COUPON-1',
            blindboxPlanId: 'blindbox-basic',
            blindboxQuantity: 1,
            status: cashier_entity_1.CashierOrderStatus.PendingPayment,
            createdAt: '2026-06-14T00:00:00.000Z',
            updatedAt: '2026-06-14T00:00:00.000Z',
            closeReason: cashier_entity_1.CashierOrderCloseReason.PaymentTimeout,
            closedBy: 'ops-user',
            closeNote: 'manual review',
            source: 'memory'
        };
        strict_1.default.equal(order.status, cashier_entity_1.CashierOrderStatus.PendingPayment);
        strict_1.default.equal(order.couponCode, 'COUPON-1');
        strict_1.default.equal(order.closeReason, cashier_entity_1.CashierOrderCloseReason.PaymentTimeout);
        strict_1.default.equal(order.closedBy, 'ops-user');
        strict_1.default.equal(order.closeNote, 'manual review');
    });
    (0, node_test_1.default)('CashierPayment contract supports succeeded shape', () => {
        const payment = {
            paymentId: 'payment-1',
            orderId: 'order-1',
            channel: 'wechat-pay',
            amount: 50,
            status: cashier_entity_1.CashierPaymentStatus.Succeeded,
            createdAt: '2026-06-14T00:00:00.000Z',
            updatedAt: '2026-06-14T00:00:00.000Z'
        };
        strict_1.default.equal(payment.status, cashier_entity_1.CashierPaymentStatus.Succeeded);
    });
});
//# sourceMappingURL=cashier.entity.test.js.map