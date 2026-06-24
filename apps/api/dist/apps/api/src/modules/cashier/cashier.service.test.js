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
const loyalty_service_1 = require("../loyalty/loyalty.service");
const member_service_1 = require("../member/member.service");
const cashier_entity_1 = require("./cashier.entity");
const cashier_service_1 = require("./cashier.service");
function createContext() {
    return {
        tenantId: 'tenant-cashier',
        brandId: 'brand-cashier',
        storeId: 'store-cashier'
    };
}
(0, node_test_1.describe)('CashierService', () => {
    (0, node_test_1.default)('createOrder creates minimal cashier order for existing member', async () => {
        const memberService = new member_service_1.MemberService();
        memberService.register({
            memberId: 'member-order-1',
            tenantContext: createContext(),
            nickname: 'Cashier User'
        });
        const service = new cashier_service_1.CashierService(memberService);
        const order = await service.createOrder(createContext(), {
            memberId: 'member-order-1',
            items: [
                { skuId: 'sku-1', quantity: 2, price: 30 },
                { skuId: 'sku-2', quantity: 1, price: 40 }
            ],
            currency: 'CNY'
        });
        strict_1.default.equal(order.status, cashier_entity_1.CashierOrderStatus.Created);
        strict_1.default.equal(order.totalAmount, 100);
    });
    (0, node_test_1.default)('createPayment moves order into pending payment state', async () => {
        const memberService = new member_service_1.MemberService();
        memberService.register({
            memberId: 'member-order-2',
            tenantContext: createContext(),
            nickname: 'Pending User'
        });
        const service = new cashier_service_1.CashierService(memberService);
        const order = await service.createOrder(createContext(), {
            memberId: 'member-order-2',
            items: [{ skuId: 'sku-1', quantity: 1, price: 88 }]
        });
        const payment = await service.createPayment(order.orderId, {
            channel: 'wechat-pay'
        });
        const storedOrder = service.getOrder(order.orderId, createContext());
        strict_1.default.equal(payment.status, cashier_entity_1.CashierPaymentStatus.Pending);
        strict_1.default.equal(storedOrder?.status, cashier_entity_1.CashierOrderStatus.PendingPayment);
        strict_1.default.equal(storedOrder?.latestPaymentId, payment.paymentId);
    });
    (0, node_test_1.default)('applyPaymentCallback marks payment succeeded and order paid', async () => {
        const memberService = new member_service_1.MemberService();
        memberService.register({
            memberId: 'member-order-3',
            tenantContext: createContext(),
            nickname: 'Paid User'
        });
        const loyaltyService = new loyalty_service_1.LoyaltyService(memberService);
        const service = new cashier_service_1.CashierService(memberService, loyaltyService);
        const order = await service.createOrder(createContext(), {
            memberId: 'member-order-3',
            items: [{ skuId: 'sku-1', quantity: 1, price: 66 }],
            couponCode: 'COUPON-66',
            blindboxPlanId: 'blindbox-pro',
            blindboxQuantity: 1
        });
        const payment = await service.createPayment(order.orderId, {
            channel: 'alipay',
            externalPaymentId: 'ext-paid-1'
        });
        const result = await service.applyPaymentCallback({
            standardizedEventName: 'cashier.payment-succeeded',
            aggregateId: 'agg-1',
            orderId: order.orderId,
            tenantId: createContext().tenantId,
            externalPaymentId: 'ext-paid-1',
            transactionNo: 'txn-1'
        });
        strict_1.default.equal(result.payment.paymentId, payment.paymentId);
        strict_1.default.equal(result.payment.status, cashier_entity_1.CashierPaymentStatus.Succeeded);
        strict_1.default.equal(result.order.status, cashier_entity_1.CashierOrderStatus.Paid);
        strict_1.default.equal(result.order.paidAt !== undefined, true);
        strict_1.default.equal(loyaltyService.listPointsLedger(createContext().tenantId).slice(-1)[0]?.points, 66);
        strict_1.default.equal(loyaltyService.listCouponRedemptions(createContext().tenantId).slice(-1)[0]?.couponCode, 'COUPON-66');
        strict_1.default.equal(loyaltyService.listBlindboxFulfillments(createContext().tenantId).slice(-1)[0]?.blindboxPlanId, 'blindbox-pro');
    });
    (0, node_test_1.default)('applyPaymentCallback can synthesize failed payment writeback', async () => {
        const memberService = new member_service_1.MemberService();
        memberService.register({
            memberId: 'member-order-4',
            tenantContext: createContext(),
            nickname: 'Failed User'
        });
        const loyaltyService = new loyalty_service_1.LoyaltyService(memberService);
        const service = new cashier_service_1.CashierService(memberService, loyaltyService);
        const order = await service.createOrder(createContext(), {
            memberId: 'member-order-4',
            items: [{ skuId: 'sku-1', quantity: 1, price: 120 }],
            couponCode: 'COUPON-FAIL'
        });
        const result = await service.applyPaymentCallback({
            standardizedEventName: 'cashier.payment-failed',
            aggregateId: 'agg-2',
            orderId: order.orderId,
            tenantId: createContext().tenantId,
            channel: 'mock-gateway',
            amount: 120
        });
        strict_1.default.equal(result.payment.status, cashier_entity_1.CashierPaymentStatus.Failed);
        strict_1.default.equal(result.order.status, cashier_entity_1.CashierOrderStatus.PaymentFailed);
        strict_1.default.equal(loyaltyService.listCouponRedemptions(createContext().tenantId).slice(-1)[0]?.couponCode, 'COUPON-FAIL');
    });
    (0, node_test_1.default)('closeTimedOutOrder closes pending payment order and releases coupon', async () => {
        const memberService = new member_service_1.MemberService();
        memberService.register({
            memberId: 'member-order-timeout-1',
            tenantContext: createContext(),
            nickname: 'Timeout User'
        });
        const loyaltyService = new loyalty_service_1.LoyaltyService(memberService);
        const service = new cashier_service_1.CashierService(memberService, loyaltyService);
        const order = await service.createOrder(createContext(), {
            memberId: 'member-order-timeout-1',
            items: [{ skuId: 'sku-1', quantity: 1, price: 45 }],
            couponCode: 'COUPON-TIMEOUT'
        });
        const payment = await service.createPayment(order.orderId, {
            channel: 'wechat-pay'
        });
        const result = await service.closeTimedOutOrder(order.orderId, createContext());
        strict_1.default.equal(result.order.status, cashier_entity_1.CashierOrderStatus.Closed);
        strict_1.default.equal(result.order.closeReason, cashier_entity_1.CashierOrderCloseReason.PaymentTimeout);
        strict_1.default.ok(result.order.closedAt);
        strict_1.default.equal(result.payment?.paymentId, payment.paymentId);
        strict_1.default.equal(result.payment?.status, cashier_entity_1.CashierPaymentStatus.Failed);
        strict_1.default.equal(result.payment?.failureReason, 'Payment timed out');
        strict_1.default.equal(loyaltyService.listCouponRedemptions(createContext().tenantId).slice(-1)[0]?.status, 'RELEASED');
    });
    (0, node_test_1.default)('closeTimedOutOrder rejects paid order', async () => {
        const memberService = new member_service_1.MemberService();
        memberService.register({
            memberId: 'member-order-timeout-2',
            tenantContext: createContext(),
            nickname: 'Timeout Reject User'
        });
        const loyaltyService = new loyalty_service_1.LoyaltyService(memberService);
        const service = new cashier_service_1.CashierService(memberService, loyaltyService);
        const order = await service.createOrder(createContext(), {
            memberId: 'member-order-timeout-2',
            items: [{ skuId: 'sku-2', quantity: 1, price: 88 }]
        });
        await service.createPayment(order.orderId, {
            channel: 'alipay',
            externalPaymentId: 'timeout-paid'
        });
        await service.applyPaymentCallback({
            standardizedEventName: 'cashier.payment-succeeded',
            aggregateId: order.orderId,
            orderId: order.orderId,
            tenantId: createContext().tenantId,
            externalPaymentId: 'timeout-paid',
            transactionNo: 'txn-timeout-paid'
        });
        await strict_1.default.rejects(() => service.closeTimedOutOrder(order.orderId, createContext()), /cannot be timeout-closed/);
    });
    (0, node_test_1.default)('closeOrder manually closes pending payment order with audit fields', async () => {
        const memberService = new member_service_1.MemberService();
        memberService.register({
            memberId: 'member-order-manual-1',
            tenantContext: createContext(),
            nickname: 'Manual Close User'
        });
        const loyaltyService = new loyalty_service_1.LoyaltyService(memberService);
        const service = new cashier_service_1.CashierService(memberService, loyaltyService);
        const order = await service.createOrder(createContext(), {
            memberId: 'member-order-manual-1',
            items: [{ skuId: 'sku-manual-1', quantity: 1, price: 77 }],
            couponCode: 'COUPON-MANUAL'
        });
        const payment = await service.createPayment(order.orderId, {
            channel: 'wechat-pay'
        });
        const result = await service.closeOrder(order.orderId, createContext(), {
            operator: 'ops-a',
            reason: 'customer-cancelled'
        });
        strict_1.default.equal(result.order.status, cashier_entity_1.CashierOrderStatus.Closed);
        strict_1.default.equal(result.order.closeReason, cashier_entity_1.CashierOrderCloseReason.ManualCancel);
        strict_1.default.equal(result.order.closedBy, 'ops-a');
        strict_1.default.equal(result.order.closeNote, 'customer-cancelled');
        strict_1.default.ok(result.order.closedAt);
        strict_1.default.equal(result.payment?.paymentId, payment.paymentId);
        strict_1.default.equal(result.payment?.status, cashier_entity_1.CashierPaymentStatus.Failed);
        strict_1.default.equal(result.payment?.failureReason, 'Order manually closed');
        strict_1.default.equal(loyaltyService.listCouponRedemptions(createContext().tenantId).slice(-1)[0]?.status, 'RELEASED');
    });
    (0, node_test_1.default)('closeOrder manually closes created order without payment', async () => {
        const memberService = new member_service_1.MemberService();
        memberService.register({
            memberId: 'member-order-manual-2',
            tenantContext: createContext(),
            nickname: 'Manual Created User'
        });
        const loyaltyService = new loyalty_service_1.LoyaltyService(memberService);
        const service = new cashier_service_1.CashierService(memberService, loyaltyService);
        const order = await service.createOrder(createContext(), {
            memberId: 'member-order-manual-2',
            items: [{ skuId: 'sku-manual-2', quantity: 1, price: 33 }]
        });
        const result = await service.closeOrder(order.orderId, createContext(), {
            operator: 'ops-b',
            reason: 'inventory-blocked'
        });
        strict_1.default.equal(result.order.status, cashier_entity_1.CashierOrderStatus.Closed);
        strict_1.default.equal(result.order.closeReason, cashier_entity_1.CashierOrderCloseReason.ManualCancel);
        strict_1.default.equal(result.order.closedBy, 'ops-b');
        strict_1.default.equal(result.order.closeNote, 'inventory-blocked');
        strict_1.default.equal(result.payment, undefined);
    });
    (0, node_test_1.default)('closeOrder rejects paid order', async () => {
        const memberService = new member_service_1.MemberService();
        memberService.register({
            memberId: 'member-order-manual-3',
            tenantContext: createContext(),
            nickname: 'Manual Reject User'
        });
        const loyaltyService = new loyalty_service_1.LoyaltyService(memberService);
        const service = new cashier_service_1.CashierService(memberService, loyaltyService);
        const order = await service.createOrder(createContext(), {
            memberId: 'member-order-manual-3',
            items: [{ skuId: 'sku-manual-3', quantity: 1, price: 55 }]
        });
        await service.createPayment(order.orderId, {
            channel: 'alipay',
            externalPaymentId: 'manual-paid'
        });
        await service.applyPaymentCallback({
            standardizedEventName: 'cashier.payment-succeeded',
            aggregateId: order.orderId,
            orderId: order.orderId,
            tenantId: createContext().tenantId,
            externalPaymentId: 'manual-paid',
            transactionNo: 'txn-manual-paid'
        });
        await strict_1.default.rejects(() => service.closeOrder(order.orderId, createContext(), {
            operator: 'ops-c'
        }), /cannot be manually closed/);
    });
    (0, node_test_1.default)('applyPaymentCallback rejects already closed order', async () => {
        const memberService = new member_service_1.MemberService();
        memberService.register({
            memberId: 'member-order-timeout-3',
            tenantContext: createContext(),
            nickname: 'Closed Order User'
        });
        const loyaltyService = new loyalty_service_1.LoyaltyService(memberService);
        const service = new cashier_service_1.CashierService(memberService, loyaltyService);
        const order = await service.createOrder(createContext(), {
            memberId: 'member-order-timeout-3',
            items: [{ skuId: 'sku-3', quantity: 1, price: 99 }]
        });
        await service.createPayment(order.orderId, {
            channel: 'wechat-pay',
            externalPaymentId: 'timeout-close-late'
        });
        await service.closeTimedOutOrder(order.orderId, createContext());
        await strict_1.default.rejects(() => service.applyPaymentCallback({
            standardizedEventName: 'cashier.payment-succeeded',
            aggregateId: order.orderId,
            orderId: order.orderId,
            tenantId: createContext().tenantId,
            externalPaymentId: 'timeout-close-late',
            transactionNo: 'txn-late'
        }), /already closed/);
    });
});
//# sourceMappingURL=cashier.service.test.js.map