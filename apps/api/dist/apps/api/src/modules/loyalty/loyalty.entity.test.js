"use strict";
/**
 * 🐜 自动: [loyalty] [D] entity spec 补全
 *
 * 补全 loyalty entity 所有接口/枚举测试：
 * PointsLedgerEntry / CouponRedemption / BlindboxFulfillment / LoyaltyOrderSettlement
 * LoyaltySettlementStatus / CouponRedemptionStatus / BlindboxFulfillmentStatus
 */
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
const loyalty_entity_1 = require("./loyalty.entity");
// ── 通用工厂 ──
const tenantCtx = { tenantId: 'tenant-test', brandId: 'brand-test', storeId: 'store-test' };
const nowISO = '2026-06-14T10:00:00.000Z';
// ── LoyaltySettlementStatus 枚举 ──
(0, node_test_1.describe)('LoyaltySettlementStatus enum', () => {
    (0, node_test_1.default)('Succeeded = "SUCCEEDED"', () => {
        strict_1.default.equal(loyalty_entity_1.LoyaltySettlementStatus.Succeeded, 'SUCCEEDED');
    });
    (0, node_test_1.default)('Failed = "FAILED"', () => {
        strict_1.default.equal(loyalty_entity_1.LoyaltySettlementStatus.Failed, 'FAILED');
    });
    (0, node_test_1.default)('only has 2 members', () => {
        const keys = Object.keys(loyalty_entity_1.LoyaltySettlementStatus).filter(k => isNaN(Number(k)));
        strict_1.default.equal(keys.length, 2);
    });
});
// ── CouponRedemptionStatus 枚举 ──
(0, node_test_1.describe)('CouponRedemptionStatus enum', () => {
    (0, node_test_1.default)('Redeemed = "REDEEMED"', () => {
        strict_1.default.equal(loyalty_entity_1.CouponRedemptionStatus.Redeemed, 'REDEEMED');
    });
    (0, node_test_1.default)('Released = "RELEASED"', () => {
        strict_1.default.equal(loyalty_entity_1.CouponRedemptionStatus.Released, 'RELEASED');
    });
    (0, node_test_1.default)('Redeemed and Released are distinct', () => {
        strict_1.default.notEqual(loyalty_entity_1.CouponRedemptionStatus.Redeemed, loyalty_entity_1.CouponRedemptionStatus.Released);
    });
});
// ── BlindboxFulfillmentStatus 枚举 ──
(0, node_test_1.describe)('BlindboxFulfillmentStatus enum', () => {
    (0, node_test_1.default)('Fulfilled = "FULFILLED"', () => {
        strict_1.default.equal(loyalty_entity_1.BlindboxFulfillmentStatus.Fulfilled, 'FULFILLED');
    });
    (0, node_test_1.default)('Skipped = "SKIPPED"', () => {
        strict_1.default.equal(loyalty_entity_1.BlindboxFulfillmentStatus.Skipped, 'SKIPPED');
    });
    (0, node_test_1.default)('Revoked = "REVOKED"', () => {
        strict_1.default.equal(loyalty_entity_1.BlindboxFulfillmentStatus.Revoked, 'REVOKED');
    });
    (0, node_test_1.default)('all 3 values are distinct', () => {
        const vals = [loyalty_entity_1.BlindboxFulfillmentStatus.Fulfilled, loyalty_entity_1.BlindboxFulfillmentStatus.Skipped, loyalty_entity_1.BlindboxFulfillmentStatus.Revoked];
        strict_1.default.equal(new Set(vals).size, 3);
    });
});
// ── PointsLedgerEntry 接口 ──
(0, node_test_1.describe)('PointsLedgerEntry', () => {
    (0, node_test_1.default)('正积分（获赠积分）形状', () => {
        const entry = {
            entryId: 'points-entry-1',
            tenantContext: tenantCtx,
            memberId: 'member-1',
            orderId: 'order-1',
            paymentId: 'payment-1',
            points: 100,
            reason: 'cashier.payment-succeeded',
            createdAt: nowISO
        };
        strict_1.default.equal(entry.entryId, 'points-entry-1');
        strict_1.default.equal(entry.points, 100);
        strict_1.default.equal(entry.reason.includes('payment-succeeded'), true);
        strict_1.default.equal(entry.tenantContext.tenantId, 'tenant-test');
    });
    (0, node_test_1.default)('负积分（退款扣回）形状', () => {
        const entry = {
            entryId: 'points-entry-2',
            tenantContext: tenantCtx,
            memberId: 'member-1',
            orderId: 'order-1',
            paymentId: 'payment-1',
            points: -40,
            reason: 'transaction.refund-completed',
            createdAt: nowISO
        };
        strict_1.default.equal(entry.points, -40);
        strict_1.default.equal(entry.reason, 'transaction.refund-completed');
    });
    (0, node_test_1.default)('字段完备性（共 8 字段）', () => {
        const entry = {
            entryId: 'entry-id',
            tenantContext: tenantCtx,
            memberId: 'm1',
            orderId: 'o1',
            paymentId: 'p1',
            points: 1,
            reason: 'test',
            createdAt: nowISO
        };
        const keys = Object.keys(entry);
        strict_1.default.equal(keys.length, 8);
        strict_1.default.ok(keys.includes('entryId'));
        strict_1.default.ok(keys.includes('points'));
        strict_1.default.ok(keys.includes('reason'));
    });
    (0, node_test_1.default)('不同类型 tenant context 可分配', () => {
        const ctxWithMarket = { ...tenantCtx, marketCode: 'cn-mainland' };
        const entry = {
            entryId: 'entry-with-market',
            tenantContext: ctxWithMarket,
            memberId: 'm1',
            orderId: 'o1',
            paymentId: 'p1',
            points: 50,
            reason: 'promotion',
            createdAt: nowISO
        };
        strict_1.default.equal(entry.tenantContext.marketCode, 'cn-mainland');
    });
});
// ── CouponRedemption 接口 ──
(0, node_test_1.describe)('CouponRedemption', () => {
    (0, node_test_1.default)('REDEEMED 状态', () => {
        const cr = {
            redemptionId: 'coupon-red-1',
            tenantContext: tenantCtx,
            orderId: 'order-1',
            paymentId: 'payment-1',
            memberId: 'member-1',
            couponCode: 'COUPON-2026',
            status: loyalty_entity_1.CouponRedemptionStatus.Redeemed,
            createdAt: nowISO
        };
        strict_1.default.equal(cr.status, 'REDEEMED');
        strict_1.default.equal(cr.couponCode, 'COUPON-2026');
        strict_1.default.equal(cr.memberId, 'member-1');
    });
    (0, node_test_1.default)('RELEASED 状态', () => {
        const cr = {
            redemptionId: 'coupon-red-2',
            tenantContext: tenantCtx,
            orderId: 'order-2',
            paymentId: 'payment-2',
            memberId: 'member-2',
            couponCode: 'COUPON-EXPIRED',
            status: loyalty_entity_1.CouponRedemptionStatus.Released,
            createdAt: nowISO
        };
        strict_1.default.equal(cr.status, 'RELEASED');
        strict_1.default.equal(cr.redemptionId, 'coupon-red-2');
    });
    (0, node_test_1.default)('字段完备性（共 8 字段）', () => {
        const cr = {
            redemptionId: 'id',
            tenantContext: tenantCtx,
            orderId: 'o1',
            paymentId: 'p1',
            memberId: 'm1',
            couponCode: 'C1',
            status: loyalty_entity_1.CouponRedemptionStatus.Redeemed,
            createdAt: nowISO
        };
        strict_1.default.equal(Object.keys(cr).length, 8);
    });
    (0, node_test_1.default)('同 order 可以有多个 coupon（不同 couponCode）', () => {
        const cr1 = {
            redemptionId: 'r1', tenantContext: tenantCtx,
            orderId: 'order-shared', paymentId: 'p1', memberId: 'm1',
            couponCode: 'C-A', status: loyalty_entity_1.CouponRedemptionStatus.Redeemed, createdAt: nowISO
        };
        const cr2 = {
            redemptionId: 'r2', tenantContext: tenantCtx,
            orderId: 'order-shared', paymentId: 'p1', memberId: 'm1',
            couponCode: 'C-B', status: loyalty_entity_1.CouponRedemptionStatus.Released, createdAt: nowISO
        };
        strict_1.default.equal(cr1.orderId, cr2.orderId);
        strict_1.default.notEqual(cr1.couponCode, cr2.couponCode);
        strict_1.default.notEqual(cr1.status, cr2.status);
    });
});
// ── BlindboxFulfillment 接口 ──
(0, node_test_1.describe)('BlindboxFulfillment', () => {
    (0, node_test_1.default)('FULFILLED 状态', () => {
        const bf = {
            fulfillmentId: 'bf-1',
            tenantContext: tenantCtx,
            orderId: 'order-1',
            paymentId: 'payment-1',
            memberId: 'member-1',
            blindboxPlanId: 'blindbox-basic',
            quantity: 1,
            rewardSku: 'blindbox-basic-reward-1',
            status: loyalty_entity_1.BlindboxFulfillmentStatus.Fulfilled,
            createdAt: nowISO
        };
        strict_1.default.equal(bf.status, 'FULFILLED');
        strict_1.default.equal(bf.quantity, 1);
        strict_1.default.equal(bf.blindboxPlanId, 'blindbox-basic');
    });
    (0, node_test_1.default)('SKIPPED 状态', () => {
        const bf = {
            fulfillmentId: 'bf-2',
            tenantContext: tenantCtx,
            orderId: 'order-2',
            paymentId: 'payment-2',
            memberId: 'member-2',
            blindboxPlanId: 'blindbox-premium',
            quantity: 2,
            rewardSku: 'blindbox-premium-reward-2',
            status: loyalty_entity_1.BlindboxFulfillmentStatus.Skipped,
            createdAt: nowISO
        };
        strict_1.default.equal(bf.status, 'SKIPPED');
        strict_1.default.equal(bf.quantity, 2);
    });
    (0, node_test_1.default)('REVOKED 状态（含 relatedFulfillmentId + reason）', () => {
        const bf = {
            fulfillmentId: 'bf-3',
            tenantContext: tenantCtx,
            orderId: 'order-1',
            paymentId: 'payment-1',
            memberId: 'member-1',
            blindboxPlanId: 'blindbox-basic',
            quantity: 1,
            rewardSku: 'blindbox-basic-reward-1',
            status: loyalty_entity_1.BlindboxFulfillmentStatus.Revoked,
            relatedFulfillmentId: 'bf-1',
            reason: 'transaction.full-refund',
            createdAt: nowISO
        };
        strict_1.default.equal(bf.status, 'REVOKED');
        strict_1.default.equal(bf.relatedFulfillmentId, 'bf-1');
        strict_1.default.equal(bf.reason, 'transaction.full-refund');
    });
    (0, node_test_1.default)('可选字段 relatedFulfillmentId / reason 可缺省', () => {
        const bf = {
            fulfillmentId: 'bf-4',
            tenantContext: tenantCtx,
            orderId: 'order-3',
            paymentId: 'payment-3',
            memberId: 'member-3',
            blindboxPlanId: 'bb-solo',
            quantity: 3,
            rewardSku: 'bb-solo-reward-3',
            status: loyalty_entity_1.BlindboxFulfillmentStatus.Fulfilled,
            createdAt: nowISO
        };
        strict_1.default.equal(bf.relatedFulfillmentId, undefined);
        strict_1.default.equal(bf.reason, undefined);
    });
});
// ── LoyaltyOrderSettlement 接口 ──
(0, node_test_1.describe)('LoyaltyOrderSettlement', () => {
    (0, node_test_1.default)('SUCCEEDED 结算', () => {
        const s = {
            settlementId: 'settlement-1',
            tenantContext: tenantCtx,
            orderId: 'order-1',
            paymentId: 'payment-1',
            memberId: 'member-1',
            status: loyalty_entity_1.LoyaltySettlementStatus.Succeeded,
            awardedPoints: 88,
            couponCode: 'COUPON-88',
            blindboxPlanId: 'blindbox-basic',
            createdAt: nowISO,
            updatedAt: nowISO
        };
        strict_1.default.equal(s.status, 'SUCCEEDED');
        strict_1.default.equal(s.awardedPoints, 88);
        strict_1.default.equal(s.createdAt, s.updatedAt);
    });
    (0, node_test_1.default)('FAILED 结算', () => {
        const s = {
            settlementId: 'settlement-2',
            tenantContext: tenantCtx,
            orderId: 'order-2',
            paymentId: 'payment-2',
            memberId: 'member-2',
            status: loyalty_entity_1.LoyaltySettlementStatus.Failed,
            awardedPoints: 0,
            createdAt: nowISO,
            updatedAt: nowISO
        };
        strict_1.default.equal(s.status, 'FAILED');
        strict_1.default.equal(s.awardedPoints, 0);
        strict_1.default.equal(s.couponCode, undefined);
        strict_1.default.equal(s.blindboxPlanId, undefined);
    });
    (0, node_test_1.default)('可选字段 couponCode / blindboxPlanId 可缺省', () => {
        const s = {
            settlementId: 'settlement-3',
            tenantContext: tenantCtx,
            orderId: 'order-3',
            paymentId: 'payment-3',
            memberId: 'member-3',
            status: loyalty_entity_1.LoyaltySettlementStatus.Succeeded,
            awardedPoints: 10,
            createdAt: nowISO,
            updatedAt: nowISO
        };
        strict_1.default.equal(s.couponCode, undefined);
        strict_1.default.equal(s.blindboxPlanId, undefined);
    });
    (0, node_test_1.default)('createdAt / updatedAt 可不同（重结算场景）', () => {
        const s = {
            settlementId: 'settlement-4',
            tenantContext: tenantCtx,
            orderId: 'order-4',
            paymentId: 'payment-4',
            memberId: 'member-4',
            status: loyalty_entity_1.LoyaltySettlementStatus.Succeeded,
            awardedPoints: 50,
            createdAt: '2026-06-14T08:00:00.000Z',
            updatedAt: '2026-06-14T10:00:00.000Z'
        };
        strict_1.default.notEqual(s.createdAt, s.updatedAt);
    });
    (0, node_test_1.default)('字段完备性（最多 11 字段含可选）', () => {
        const s = {
            settlementId: 'sid', tenantContext: tenantCtx,
            orderId: 'oid', paymentId: 'pid', memberId: 'mid',
            status: loyalty_entity_1.LoyaltySettlementStatus.Succeeded,
            awardedPoints: 1, couponCode: 'C', blindboxPlanId: 'B',
            createdAt: nowISO, updatedAt: nowISO
        };
        strict_1.default.equal(Object.keys(s).length, 11);
    });
});
//# sourceMappingURL=loyalty.entity.test.js.map