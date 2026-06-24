"use strict";
/**
 * 🐜 自动: [transactions] [D] controller spec 补全
 *
 * 覆盖：startCheckout / applyPaymentCallback / getOrderTransaction / listOrderTransactions
 *       requestRefund / approveRefund / rejectRefund / listRefunds / getRefund
 *       batchApproveRefunds / batchRejectRefunds / batchAssignRefunds / batchClaimRefunds
 *       timeoutCloseOrder / batchTimeoutCloseOrders / manualCloseOrder
 *       getRefundDashboard / listPendingRefunds / listMemberTransactions
 *       snapshot 路由 (lyt)
 *
 * 正例 + 反例 + 边界
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
require("reflect-metadata");
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importStar(require("node:test"));
const transactions_service_1 = require("./transactions.service");
const transactions_controller_1 = require("./transactions.controller");
const transactions_service_2 = require("./transactions.service");
const cashier_service_1 = require("../cashier/cashier.service");
const loyalty_service_1 = require("../loyalty/loyalty.service");
const member_service_1 = require("../member/member.service");
const cashier_entity_1 = require("../cashier/cashier.entity");
const transactions_entity_1 = require("./transactions.entity");
const CTX = {
    tenantId: 'tenant-a',
    brandId: 'brand-a',
    storeId: 'store-a',
    marketCode: 'cn-mainland'
};
let memberService;
let controller;
function buildServices() {
    memberService = new member_service_1.MemberService();
    const loyaltyService = new loyalty_service_1.LoyaltyService(memberService);
    const cashierService = new cashier_service_1.CashierService(memberService, loyaltyService);
    controller = new transactions_controller_1.TransactionsController(new transactions_service_2.TransactionsService(cashierService, loyaltyService));
}
function reg(memberId) {
    memberService.register({ memberId, tenantContext: CTX, nickname: `Test-${memberId}` });
}
async function checkoutAndPay(memberId, amount, extPayId) {
    reg(memberId);
    const dto = {
        memberId,
        items: [{ skuId: `it-${memberId}`, quantity: 1, price: amount }],
        paymentChannel: 'wechat',
        amount,
        externalPaymentId: extPayId
    };
    const created = await controller.startCheckout(CTX, dto);
    await controller.applyPaymentCallback({
        orderId: created.order.orderId,
        paymentId: created.payment.paymentId,
        tenantId: CTX.tenantId,
        standardizedEventName: 'cashier.payment-succeeded',
        status: cashier_entity_1.CashierPaymentStatus.Succeeded,
        amount,
        externalPaymentId: extPayId,
        paidAt: new Date().toISOString()
    });
    // Re-fetch to get updated aggregate with latest status
    return controller.getOrderTransaction(created.order.orderId, CTX);
}
async function checkoutOnly(memberId, amount, extPayId) {
    reg(memberId);
    return controller.startCheckout(CTX, {
        memberId,
        items: [{ skuId: `it-${memberId}`, quantity: 1, price: amount }],
        paymentChannel: 'wechat',
        amount,
        externalPaymentId: extPayId
    });
}
(0, node_test_1.beforeEach)(() => { buildServices(); });
(0, node_test_1.afterEach)(() => { (0, transactions_service_1.resetTransactionsServiceTestState)(); });
(0, node_test_1.describe)('transactions controller', () => {
    (0, node_test_1.describe)('startCheckout', () => {
        (0, node_test_1.default)('should create checkout and return aggregate', async () => {
            reg('m-1');
            const result = await controller.startCheckout(CTX, {
                memberId: 'm-1',
                items: [{ skuId: 'a', quantity: 2, price: 29.9 }],
                paymentChannel: 'wechat',
                amount: 59.8
            });
            strict_1.default.equal(result.order.memberId, 'm-1');
            strict_1.default.ok(result.payment);
            strict_1.default.equal(result.payment.amount, 59.8);
        });
        (0, node_test_1.default)('should throw when items is empty (boundary)', async () => {
            reg('m-1b');
            await strict_1.default.rejects(() => controller.startCheckout(CTX, { memberId: 'm-1b', items: [], paymentChannel: 'wechat' }), /at least one item/);
        });
        (0, node_test_1.default)('should throw when member not found (negative)', async () => {
            await strict_1.default.rejects(() => controller.startCheckout(CTX, { memberId: 'ghost', items: [{ skuId: 'x', quantity: 1, price: 10 }], paymentChannel: 'wechat' }), /not found/);
        });
    });
    (0, node_test_1.describe)('applyPaymentCallback', () => {
        (0, node_test_1.default)('should apply payment callback (positive)', async () => {
            const initial = await checkoutOnly('m-2', 30, 'ep-2');
            const result = await controller.applyPaymentCallback({
                orderId: initial.order.orderId,
                paymentId: initial.payment.paymentId,
                tenantId: CTX.tenantId,
                standardizedEventName: 'cashier.payment-succeeded',
                status: cashier_entity_1.CashierPaymentStatus.Succeeded,
                amount: 30,
                externalPaymentId: 'ep-2',
                paidAt: new Date().toISOString()
            });
            strict_1.default.equal(result.order.status, cashier_entity_1.CashierOrderStatus.Paid);
        });
        (0, node_test_1.default)('should throw for unknown order (negative)', async () => {
            await strict_1.default.rejects(() => controller.applyPaymentCallback({
                orderId: 'ghost', paymentId: 'ghost-pay', tenantId: CTX.tenantId, status: cashier_entity_1.CashierPaymentStatus.Succeeded, amount: 10
            }), /not found|unknown/i);
        });
    });
    (0, node_test_1.describe)('getOrderTransaction', () => {
        (0, node_test_1.default)('should return aggregate for existing order', async () => {
            const created = await checkoutAndPay('m-3', 50, 'ep-3');
            const result = controller.getOrderTransaction(created.order.orderId, CTX);
            strict_1.default.equal(result.order.memberId, 'm-3');
            strict_1.default.ok(result.payment);
        });
        (0, node_test_1.default)('should throw for non-existing order (negative)', () => {
            strict_1.default.throws(() => controller.getOrderTransaction('ghost', CTX), /not found/);
        });
    });
    (0, node_test_1.describe)('listOrderTransactions', () => {
        (0, node_test_1.default)('should list all orders for tenant', async () => {
            await checkoutAndPay('m-4', 10, 'ep-4');
            const result = controller.listOrderTransactions(CTX);
            strict_1.default.ok(result.length >= 1);
        });
        (0, node_test_1.default)('should filter by memberId', async () => {
            await checkoutAndPay('m-5', 20, 'ep-5');
            const result = controller.listOrderTransactions(CTX, { memberId: 'm-5' });
            result.forEach(r => strict_1.default.equal(r.order.memberId, 'm-5'));
        });
        (0, node_test_1.default)('should filter by hasRefund=true (boundary)', async () => {
            const created = await checkoutAndPay('m-rf', 100, 'ep-rf');
            await controller.requestRefund(created.order.orderId, CTX, { reason: 'test', refundAmount: 50 });
            const result = controller.listOrderTransactions(CTX, { hasRefund: true });
            strict_1.default.ok(result.some(r => r.order.orderId === created.order.orderId));
        });
    });
    (0, node_test_1.describe)('requestRefund', () => {
        (0, node_test_1.default)('should create pending refund for paid order', async () => {
            const created = await checkoutAndPay('m-6', 80, 'ep-6');
            const result = await controller.requestRefund(created.order.orderId, CTX, { reason: 'quality', refundAmount: 30, operator: 'ops' });
            const refund = result.refunds.find(r => r.status === transactions_entity_1.TransactionRefundStatus.Pending);
            strict_1.default.ok(refund);
            strict_1.default.equal(refund.refundAmount, 30);
            strict_1.default.equal(refund.operator, 'ops');
        });
        (0, node_test_1.default)('should throw when refund exceeds payment (negative)', async () => {
            const created = await checkoutAndPay('m-7', 50, 'ep-7');
            await strict_1.default.rejects(() => controller.requestRefund(created.order.orderId, CTX, { reason: 'too much', refundAmount: 999 }), /exceeds refundable/);
        });
        (0, node_test_1.default)('should throw when order is not paid (boundary)', async () => {
            const created = await checkoutOnly('m-8', 30, 'ep-8');
            await strict_1.default.rejects(() => controller.requestRefund(created.order.orderId, CTX, { reason: 'premature', refundAmount: 10 }), /not eligible/);
        });
    });
    (0, node_test_1.describe)('approveRefund / rejectRefund', () => {
        (0, node_test_1.default)('should approve a pending refund', async () => {
            const created = await checkoutAndPay('m-9', 60, 'ep-9');
            const withRefund = await controller.requestRefund(created.order.orderId, CTX, { reason: 'ok', refundAmount: 20 });
            const refundId = withRefund.refunds[0].refundId;
            const approved = await controller.approveRefund(refundId, CTX, { operator: 'r', note: 'ok' });
            const found = approved.refunds.find(r => r.refundId === refundId);
            strict_1.default.equal(found?.status, transactions_entity_1.TransactionRefundStatus.Completed);
        });
        (0, node_test_1.default)('should reject a pending refund', async () => {
            const created = await checkoutAndPay('m-10', 40, 'ep-10');
            const withRefund = await controller.requestRefund(created.order.orderId, CTX, { reason: 'no', refundAmount: 10 });
            const refundId = withRefund.refunds[0].refundId;
            const rejected = await controller.rejectRefund(refundId, CTX, { operator: 'r2', note: 'no' });
            strict_1.default.equal(rejected.refunds.find(r => r.refundId === refundId)?.status, transactions_entity_1.TransactionRefundStatus.Rejected);
        });
        (0, node_test_1.default)('should throw when approving already handled refund (negative)', async () => {
            const created = await checkoutAndPay('m-11', 70, 'ep-11');
            const withRefund = await controller.requestRefund(created.order.orderId, CTX, { reason: 'x', refundAmount: 10 });
            const refundId = withRefund.refunds[0].refundId;
            await controller.approveRefund(refundId, CTX, {});
            await strict_1.default.rejects(() => controller.approveRefund(refundId, CTX, {}), /not pending/);
        });
    });
    (0, node_test_1.describe)('listRefunds / getRefund / listOrderRefunds', () => {
        (0, node_test_1.default)('should list refunds for tenant', async () => {
            const created = await checkoutAndPay('m-12', 100, 'ep-12');
            await controller.requestRefund(created.order.orderId, CTX, { reason: 'list', refundAmount: 25 });
            strict_1.default.ok(controller.listRefunds(CTX).length >= 1);
        });
        (0, node_test_1.default)('should get single refund by id', async () => {
            const created = await checkoutAndPay('m-13', 90, 'ep-13');
            const withRefund = await controller.requestRefund(created.order.orderId, CTX, { reason: 'get', refundAmount: 15 });
            const refundId = withRefund.refunds[0].refundId;
            const refund = controller.getRefund(refundId, CTX);
            strict_1.default.equal(refund.refundId, refundId);
            strict_1.default.equal(refund.refundAmount, 15);
        });
        (0, node_test_1.default)('should throw for unknown refund id (negative)', () => {
            strict_1.default.throws(() => controller.getRefund('not-exist', CTX), /not found/);
        });
        (0, node_test_1.default)('should list refunds for specific order', async () => {
            const created = await checkoutAndPay('m-14', 120, 'ep-14');
            await controller.requestRefund(created.order.orderId, CTX, { reason: 'order', refundAmount: 20 });
            strict_1.default.ok(controller.listOrderRefunds(created.order.orderId, CTX).length >= 1);
        });
    });
    (0, node_test_1.describe)('listPendingRefunds', () => {
        (0, node_test_1.default)('should return only pending refunds', async () => {
            const created = await checkoutAndPay('m-15', 200, 'ep-15');
            await controller.requestRefund(created.order.orderId, CTX, { reason: 'pending', refundAmount: 50 });
            const pending = controller.listPendingRefunds(CTX);
            strict_1.default.ok(pending.length >= 1);
            pending.forEach(r => strict_1.default.equal(r.status, transactions_entity_1.TransactionRefundStatus.Pending));
        });
    });
    (0, node_test_1.describe)('batchApproveRefunds / batchRejectRefunds', () => {
        (0, node_test_1.default)('should batch approve refunds', async () => {
            const created = await checkoutAndPay('m-16', 300, 'ep-16');
            const withRefund = await controller.requestRefund(created.order.orderId, CTX, { reason: 'batch', refundAmount: 30 });
            const refundId = withRefund.refunds[0].refundId;
            const dto = { refundIds: [refundId], operator: 'approver' };
            const result = await controller.batchApproveRefunds(CTX, dto);
            strict_1.default.equal(result.processedCount, 1);
            strict_1.default.equal(result.refunds[0].status, transactions_entity_1.TransactionRefundStatus.Completed);
        });
        (0, node_test_1.default)('should batch reject refunds', async () => {
            const created = await checkoutAndPay('m-17', 150, 'ep-17');
            const withRefund = await controller.requestRefund(created.order.orderId, CTX, { reason: 'batch', refundAmount: 10 });
            const refundId = withRefund.refunds[0].refundId;
            const dto = { refundIds: [refundId], operator: 'rejecter' };
            const result = await controller.batchRejectRefunds(CTX, dto);
            strict_1.default.equal(result.processedCount, 1);
            strict_1.default.equal(result.refunds[0].status, transactions_entity_1.TransactionRefundStatus.Rejected);
        });
        (0, node_test_1.default)('should skip non-existent refund ids (boundary)', async () => {
            const result = await controller.batchApproveRefunds(CTX, { refundIds: ['ghost-refund'], operator: 'ghost' });
            strict_1.default.equal(result.skippedCount, 1);
        });
    });
    (0, node_test_1.describe)('batchAssignRefunds / batchClaimRefunds', () => {
        (0, node_test_1.default)('should batch assign refunds', async () => {
            const created = await checkoutAndPay('m-18', 80, 'ep-18');
            const withRefund = await controller.requestRefund(created.order.orderId, CTX, { reason: 'assign', refundAmount: 20 });
            const dto = {
                refundIds: [withRefund.refunds[0].refundId],
                assignee: 'assigned-user',
                operator: 'admin'
            };
            const result = await controller.batchAssignRefunds(CTX, dto);
            strict_1.default.equal(result.processedCount, 1);
            strict_1.default.equal(result.refunds[0].assignedTo, 'assigned-user');
        });
        (0, node_test_1.default)('should batch claim refunds', async () => {
            const created = await checkoutAndPay('m-19', 60, 'ep-19');
            const withRefund = await controller.requestRefund(created.order.orderId, CTX, { reason: 'claim', refundAmount: 10 });
            const dto = {
                refundIds: [withRefund.refunds[0].refundId],
                operator: 'self-claimer'
            };
            const result = await controller.batchClaimRefunds(CTX, dto);
            strict_1.default.equal(result.processedCount, 1);
            strict_1.default.equal(result.refunds[0].assignedTo, 'self-claimer');
        });
    });
    (0, node_test_1.describe)('timeoutCloseOrder / batchTimeoutCloseOrders / manualCloseOrder', () => {
        (0, node_test_1.default)('should timeout close a stale order', async () => {
            const created = await checkoutOnly('m-20', 40, 'ep-20');
            const result = await controller.timeoutCloseOrder(created.order.orderId, CTX, { reason: 'timeout', operator: 'sys' });
            strict_1.default.equal(result.order.closeReason, 'PAYMENT_TIMEOUT');
        });
        (0, node_test_1.default)('should batch timeout close orders', async () => {
            await checkoutOnly('m-21', 25, 'ep-21');
            const result = await controller.batchTimeoutCloseOrders(CTX, { memberId: 'm-21', limit: 10 });
            strict_1.default.ok(result.processedCount >= 1);
        });
        (0, node_test_1.default)('should manual close an order', async () => {
            const created = await checkoutOnly('m-22', 35, 'ep-22');
            const result = await controller.manualCloseOrder(created.order.orderId, CTX, { reason: 'cancel', operator: 'admin' });
            strict_1.default.equal(result.order.status, cashier_entity_1.CashierOrderStatus.Closed);
        });
        (0, node_test_1.default)('should throw when closing non-existent order (negative)', async () => {
            await strict_1.default.rejects(() => controller.timeoutCloseOrder('ghost', CTX, { reason: 'nope', operator: 'sys' }), /not found/);
        });
    });
    (0, node_test_1.describe)('getRefundDashboard', () => {
        (0, node_test_1.default)('should return dashboard with status groups and aging', async () => {
            const created = await checkoutAndPay('m-23', 500, 'ep-23');
            await controller.requestRefund(created.order.orderId, CTX, { reason: 'dash', refundAmount: 100 });
            const dashboard = controller.getRefundDashboard(CTX);
            strict_1.default.ok(dashboard.totalCount >= 1);
            strict_1.default.ok(dashboard.statusGroups.length >= 1);
            strict_1.default.ok(dashboard.agingBuckets.length >= 1);
            strict_1.default.ok(dashboard.slaThresholds.teamLeadMinutes > 0);
        });
        (0, node_test_1.default)('should respect query limits (boundary)', () => {
            const dashboard = controller.getRefundDashboard(CTX, { priorityQueueLimit: 1, recentReviewLimit: 1, dispatchQueueLimit: 2 });
            strict_1.default.ok(dashboard.priorityQueue.length <= 1);
            strict_1.default.ok(dashboard.recentReviews.length <= 1);
            strict_1.default.ok(dashboard.dispatchQueue.length <= 2);
        });
    });
    (0, node_test_1.describe)('lyt snapshots', () => {
        (0, node_test_1.default)('should list lyt order snapshots', () => {
            const result = controller.listLytOrderSnapshots(CTX);
            strict_1.default.ok(result instanceof Promise || Array.isArray(result));
        });
        (0, node_test_1.default)('should list lyt payment snapshots', () => {
            const result = controller.listLytPaymentSnapshots(CTX);
            strict_1.default.ok(result instanceof Promise || Array.isArray(result));
        });
        (0, node_test_1.default)('should return undefined for unknown lyt order snapshot', async () => {
            strict_1.default.equal(await controller.getLytOrderSnapshot('no-such', CTX), undefined);
        });
        (0, node_test_1.default)('should return undefined for unknown lyt payment snapshot', async () => {
            strict_1.default.equal(await controller.getLytPaymentSnapshot('no-such', CTX), undefined);
        });
    });
    (0, node_test_1.describe)('listMemberTransactions', () => {
        (0, node_test_1.default)('should return member timeline', async () => {
            await checkoutAndPay('m-24', 10, 'ep-24');
            const timeline = controller.listMemberTransactions('m-24', CTX);
            strict_1.default.ok(Array.isArray(timeline));
            strict_1.default.ok(timeline.length >= 1);
            timeline.forEach(e => strict_1.default.equal(e.memberId, 'm-24'));
        });
        (0, node_test_1.default)('should return empty for unknown member (boundary)', () => {
            const timeline = controller.listMemberTransactions('unknown', CTX);
            strict_1.default.ok(Array.isArray(timeline));
            strict_1.default.equal(timeline.length, 0);
        });
    });
});
//# sourceMappingURL=transactions.controller.test.js.map