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
const member_service_1 = require("../member/member.service");
const cashier_entity_1 = require("../cashier/cashier.entity");
const loyalty_entity_1 = require("./loyalty.entity");
const loyalty_service_1 = require("./loyalty.service");
function createContext() {
    return {
        tenantId: 'tenant-loyalty',
        brandId: 'brand-loyalty',
        storeId: 'store-loyalty'
    };
}
function createOrder(memberId = 'member-loyalty-1', suffix = '1') {
    return {
        orderId: `order-loyalty-${suffix}`,
        tenantContext: createContext(),
        memberId,
        items: [{ skuId: 'sku-1', quantity: 1, price: 88 }],
        currency: 'CNY',
        totalAmount: 88,
        couponCode: 'COUPON-88',
        blindboxPlanId: 'blindbox-basic',
        blindboxQuantity: 1,
        status: cashier_entity_1.CashierOrderStatus.Paid,
        createdAt: '2026-06-14T00:00:00.000Z',
        updatedAt: '2026-06-14T00:00:00.000Z',
        source: 'memory'
    };
}
function createPayment(orderId = 'order-loyalty-1', suffix = '1') {
    return {
        paymentId: `payment-loyalty-${suffix}`,
        orderId,
        channel: 'wechat-pay',
        amount: 88,
        status: cashier_entity_1.CashierPaymentStatus.Succeeded,
        createdAt: '2026-06-14T00:00:00.000Z',
        updatedAt: '2026-06-14T00:00:00.000Z'
    };
}
(0, node_test_1.beforeEach)(() => {
    (0, member_service_1.resetMemberServiceTestState)();
});
(0, node_test_1.describe)('LoyaltyService', () => {
    (0, node_test_1.default)('settlePaidOrder awards points, coupon redemption and blindbox fulfillment', async () => {
        const memberId = 'member-loyalty-paid';
        const order = createOrder(memberId, 'paid');
        const payment = createPayment(order.orderId, 'paid');
        const memberService = new member_service_1.MemberService();
        memberService.register({
            memberId,
            tenantContext: createContext(),
            nickname: 'Loyalty User'
        });
        const service = new loyalty_service_1.LoyaltyService(memberService);
        const settlement = await service.settlePaidOrder(order, payment);
        strict_1.default.equal(settlement.status, loyalty_entity_1.LoyaltySettlementStatus.Succeeded);
        strict_1.default.equal(settlement.awardedPoints, 88);
        strict_1.default.equal(service.listPointsLedger(createContext().tenantId).length >= 1, true);
        strict_1.default.equal(service.listCouponRedemptions(createContext().tenantId)[0]?.status, loyalty_entity_1.CouponRedemptionStatus.Redeemed);
        strict_1.default.equal(service.listBlindboxFulfillments(createContext().tenantId)[0]?.blindboxPlanId, 'blindbox-basic');
        strict_1.default.equal(memberService.getProfile(memberId)?.lifecycleStage, 'newly-paid');
        strict_1.default.ok(memberService.getProfile(memberId)?.tags?.includes('channel-wechat-pay'));
    });
    (0, node_test_1.default)('settleFailedOrder releases coupon and does not award points', async () => {
        const memberId = 'member-loyalty-failed';
        const order = createOrder(memberId, 'failed');
        const memberService = new member_service_1.MemberService();
        memberService.register({
            memberId,
            tenantContext: createContext(),
            nickname: 'Loyalty User'
        });
        const service = new loyalty_service_1.LoyaltyService(memberService);
        const payment = createPayment(order.orderId, 'failed');
        payment.status = cashier_entity_1.CashierPaymentStatus.Failed;
        const settlement = await service.settleFailedOrder(order, payment);
        strict_1.default.equal(settlement.status, loyalty_entity_1.LoyaltySettlementStatus.Failed);
        strict_1.default.equal(settlement.awardedPoints, 0);
        strict_1.default.equal(service.listCouponRedemptions(createContext().tenantId).slice(-1)[0]?.status, loyalty_entity_1.CouponRedemptionStatus.Released);
    });
    (0, node_test_1.default)('applyRefund rolls back points and releases coupon once', async () => {
        const memberId = 'member-loyalty-refund';
        const order = createOrder(memberId, 'refund');
        const payment = createPayment(order.orderId, 'refund');
        const memberService = new member_service_1.MemberService();
        memberService.register({
            memberId,
            tenantContext: createContext(),
            nickname: 'Refund Loyalty User'
        });
        const service = new loyalty_service_1.LoyaltyService(memberService);
        await service.settlePaidOrder(order, payment);
        const result = await service.applyRefund(order, payment, 40, {
            revokeBlindbox: false
        });
        const profile = memberService.getProfile(memberId);
        strict_1.default.equal(result.reversedPoints, 40);
        strict_1.default.equal(result.releasedCoupon, true);
        strict_1.default.equal(result.revokedBlindbox, false);
        strict_1.default.equal(profile?.points, 48);
        strict_1.default.equal(service.listPointsLedger(createContext().tenantId).slice(-1)[0]?.points, -40);
        strict_1.default.equal(service.listCouponRedemptions(createContext().tenantId).slice(-1)[0]?.status, loyalty_entity_1.CouponRedemptionStatus.Released);
        strict_1.default.equal(service.listBlindboxFulfillments(createContext().tenantId).slice(-1)[0]?.status, loyalty_entity_1.BlindboxFulfillmentStatus.Fulfilled);
        const second = await service.applyRefund(order, payment, 48, {
            revokeBlindbox: true
        });
        strict_1.default.equal(second.releasedCoupon, false);
        strict_1.default.equal(second.reversedPoints, 48);
        strict_1.default.equal(second.revokedBlindbox, true);
        strict_1.default.equal(memberService.getProfile(memberId)?.points, 0);
        strict_1.default.equal(service.listBlindboxFulfillments(createContext().tenantId).slice(-1)[0]?.status, loyalty_entity_1.BlindboxFulfillmentStatus.Revoked);
    });
    (0, node_test_1.default)('settlePaidOrderFromSnapshots consumes standard LYT snapshots and enriches profile tags', async () => {
        const memberId = 'member-loyalty-snapshot';
        const memberService = new member_service_1.MemberService();
        memberService.register({
            memberId,
            tenantContext: createContext(),
            nickname: 'Snapshot Loyalty User'
        });
        const service = new loyalty_service_1.LoyaltyService(memberService);
        const orderSnapshot = {
            snapshotId: 'lyt-order-snapshot-1',
            tenantContext: createContext(),
            externalOrderId: 'lyt-order-1',
            orderNo: 'NO-1',
            memberId,
            couponCode: 'COUPON-LYT',
            blindboxPlanId: 'blindbox-pro',
            blindboxQuantity: 2,
            amount: 260,
            discountAmount: 10,
            payableAmount: 250,
            currency: 'CNY',
            status: 'PAID',
            paidAt: '2026-06-14T15:00:00.000Z',
            updatedAtFromSource: '2026-06-14T15:00:00.000Z',
            source: 'memory'
        };
        const paymentSnapshot = {
            snapshotId: 'lyt-payment-snapshot-1',
            tenantContext: createContext(),
            externalPaymentId: 'lyt-payment-1',
            externalOrderId: 'lyt-order-1',
            paymentChannel: 'alipay',
            paymentStatus: 'SUCCEEDED',
            amount: 250,
            currency: 'CNY',
            transactionNo: 'txn-1',
            paidAt: '2026-06-14T15:00:00.000Z',
            updatedAtFromSource: '2026-06-14T15:00:00.000Z',
            source: 'memory'
        };
        const settlement = await service.settlePaidOrderFromSnapshots(orderSnapshot, paymentSnapshot);
        strict_1.default.equal(settlement.status, loyalty_entity_1.LoyaltySettlementStatus.Succeeded);
        strict_1.default.equal(settlement.orderId, 'lyt-order-1');
        strict_1.default.equal(settlement.paymentId, 'lyt-payment-1');
        strict_1.default.equal(service.listCouponRedemptions(createContext().tenantId).slice(-1)[0]?.couponCode, 'COUPON-LYT');
        strict_1.default.equal(service.listBlindboxFulfillments(createContext().tenantId).slice(-1)[0]?.quantity, 2);
        strict_1.default.equal(memberService.getProfile(memberId)?.lifecycleStage, 'repeat-paid');
        strict_1.default.ok(memberService.getProfile(memberId)?.tags?.includes('source-lyt-snapshot'));
        strict_1.default.ok(memberService.getProfile(memberId)?.tags?.includes('channel-alipay'));
    });
});
//# sourceMappingURL=loyalty.service.test.js.map