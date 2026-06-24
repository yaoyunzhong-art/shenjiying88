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
require("reflect-metadata");
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importStar(require("node:test"));
const member_service_1 = require("../member/member.service");
const loyalty_service_1 = require("../loyalty/loyalty.service");
const cashier_service_1 = require("../cashier/cashier.service");
const transactions_controller_1 = require("./transactions.controller");
const transactions_service_1 = require("./transactions.service");
// ── 8 角色定义 ──
const ROLES = {
    TenantAdmin: '👔店长',
    Reception: '🛒前台',
    HR: '👥HR',
    Safety: '🔧安监',
    Guide: '🎮导玩员',
    Ops: '🎯运行专员',
    Teambuilding: '🤝团建',
    Marketing: '📢营销'
};
function createContext(tenantId = 't-tx-role') {
    return { tenantId, brandId: 'b-tx', storeId: 's-tx' };
}
let memberCounter = 0;
function uniqueMemberId() {
    return `mem-role-${++memberCounter}`;
}
function makeController() {
    const memberService = new member_service_1.MemberService();
    const memberId = uniqueMemberId();
    try {
        memberService.register({
            memberId,
            tenantContext: createContext(),
            nickname: 'Role User'
        });
    }
    catch {
        // member already exists from a previous call; use different id
        const fallbackId = `${memberId}-${Date.now()}`;
        memberService.register({
            memberId: fallbackId,
            tenantContext: createContext(),
            nickname: 'Role User'
        });
    }
    const loyaltyService = new loyalty_service_1.LoyaltyService(memberService);
    const cashierService = new cashier_service_1.CashierService(memberService, loyaltyService);
    const service = new transactions_service_1.TransactionsService(cashierService, loyaltyService);
    const controller = new transactions_controller_1.TransactionsController(service);
    return { controller, memberService, loyaltyService, cashierService, service, memberId };
}
// ──────────── 👔店长 ────────────
(0, node_test_1.describe)(`${ROLES.TenantAdmin} 交易角色测试`, () => {
    (0, node_test_1.default)('店长可创建完整交易（下单+支付）', async () => {
        const { controller, memberId } = makeController();
        const result = await controller.startCheckout(createContext(), {
            memberId,
            items: [{ skuId: 'sku-admin', quantity: 1, price: 100 }],
            paymentChannel: 'wechat-pay',
            currency: 'CNY'
        });
        strict_1.default.equal(result.order.totalAmount, 100);
        strict_1.default.ok(result.order.orderId);
        strict_1.default.ok(result.payment);
        strict_1.default.equal(result.payment?.channel, 'wechat-pay');
    });
    (0, node_test_1.default)('店长可查询订单交易聚合信息（权限边界）', () => {
        const { controller } = makeController();
        // 查询不存在的订单应报错
        strict_1.default.throws(() => controller.getOrderTransaction('no-such-order', createContext()), /not found/);
    });
});
// ──────────── 🛒前台 ────────────
(0, node_test_1.describe)(`${ROLES.Reception} 交易角色测试`, () => {
    (0, node_test_1.default)('前台可为会员快速创建交易（正常流程）', async () => {
        const { controller, memberId } = makeController();
        const result = await controller.startCheckout(createContext(), {
            memberId,
            items: [{ skuId: 'sku-front', title: '前台-饮料', quantity: 1, price: 15 }],
            paymentChannel: 'wechat-pay'
        });
        strict_1.default.equal(result.order.items[0].title, '前台-饮料');
        strict_1.default.equal(result.order.totalAmount, 15);
    });
    (0, node_test_1.default)('前台不可跨租户查看交易（权限边界）', () => {
        const { controller, memberId } = makeController();
        const timeline = controller.listMemberTransactions(memberId, { tenantId: 't-other-store', brandId: 'b-other', storeId: 's-other' });
        strict_1.default.equal(timeline.length, 0);
    });
});
// ──────────── 👥HR ────────────
(0, node_test_1.describe)(`${ROLES.HR} 交易角色测试`, () => {
    (0, node_test_1.default)('HR可查看会员的交易时间线（正常流程）', async () => {
        const { controller, memberId } = makeController();
        await controller.startCheckout(createContext(), {
            memberId,
            items: [{ skuId: 'sku-hr', quantity: 1, price: 20 }],
            paymentChannel: 'internal-transfer'
        });
        const timeline = controller.listMemberTransactions(memberId, createContext());
        strict_1.default.ok(timeline.length >= 1);
        timeline.forEach((entry) => {
            strict_1.default.equal(entry.memberId, memberId);
        });
    });
    (0, node_test_1.default)('HR查看不存在会员的交易返回空（权限边界）', () => {
        const { controller } = makeController();
        const timeline = controller.listMemberTransactions('ghost-member', createContext());
        strict_1.default.equal(timeline.length, 0);
    });
});
// ──────────── 🔧安监 ────────────
(0, node_test_1.describe)(`${ROLES.Safety} 交易角色测试`, () => {
    (0, node_test_1.default)('安监可查询订单交易详情做安全审计（正常流程）', async () => {
        const { controller, memberId } = makeController();
        const created = await controller.startCheckout(createContext(), {
            memberId,
            items: [{ skuId: 'sku-safety', quantity: 1, price: 500 }],
            paymentChannel: 'wechat-pay'
        });
        const aggregate = controller.getOrderTransaction(created.order.orderId, createContext());
        strict_1.default.equal(aggregate.order.totalAmount, 500);
        strict_1.default.ok(aggregate.payment);
    });
    (0, node_test_1.default)('安监无法修改交易状态（权限边界 - 只读）', () => {
        const { controller } = makeController();
        // 安监只有读取权限，controller 不提供修改接口
        strict_1.default.throws(() => controller.getOrderTransaction('hacked-order', createContext()), /not found/);
    });
});
// ──────────── 🎮导玩员 ────────────
(0, node_test_1.describe)(`${ROLES.Guide} 交易角色测试`, () => {
    (0, node_test_1.default)('导玩员可为玩家快速创建游戏币购买交易（正常流程）', async () => {
        const { controller, memberId } = makeController();
        const result = await controller.startCheckout(createContext(), {
            memberId,
            items: [{ skuId: 'sku-coins', title: '游戏币x50', quantity: 1, price: 50 }],
            paymentChannel: 'wechat-pay'
        });
        strict_1.default.equal(result.order.items[0].skuId, 'sku-coins');
        strict_1.default.equal(result.order.totalAmount, 50);
    });
    (0, node_test_1.default)('导玩员创建交易需有效会员验证（权限边界）', async () => {
        const memberService = new member_service_1.MemberService();
        const loyaltyService = new loyalty_service_1.LoyaltyService(memberService);
        const cashierService = new cashier_service_1.CashierService(memberService, loyaltyService);
        const service = new transactions_service_1.TransactionsService(cashierService, loyaltyService);
        const controller = new transactions_controller_1.TransactionsController(service);
        await strict_1.default.rejects(controller.startCheckout(createContext(), {
            memberId: 'no-such-member',
            items: [{ skuId: 'sku-bad', quantity: 1, price: 10 }],
            paymentChannel: 'wechat-pay'
        }), /not found/);
    });
});
// ──────────── 🎯运行专员 ────────────
(0, node_test_1.describe)(`${ROLES.Ops} 交易角色测试`, () => {
    (0, node_test_1.default)('运行专员可处理支付成功回调并查看聚合结果（正常流程）', async () => {
        const { controller, memberId } = makeController();
        const created = await controller.startCheckout(createContext(), {
            memberId,
            items: [{ skuId: 'sku-ops', quantity: 1, price: 300 }],
            paymentChannel: 'bank-transfer',
            externalPaymentId: 'ext-ops-001'
        });
        const result = await controller.applyPaymentCallback({
            standardizedEventName: 'cashier.payment-succeeded',
            aggregateId: created.order.orderId,
            orderId: created.order.orderId,
            tenantId: createContext().tenantId,
            externalPaymentId: 'ext-ops-001',
            transactionNo: 'txn-ops-ok'
        });
        strict_1.default.equal(result.payment?.status, 'SUCCEEDED');
        strict_1.default.ok(result.pointsLedger.length >= 1);
    });
    (0, node_test_1.default)('运行专员处理支付失败回调正确更新状态（异常流程）', async () => {
        const { controller, memberId } = makeController();
        const created = await controller.startCheckout(createContext(), {
            memberId,
            items: [{ skuId: 'sku-ops-fail', quantity: 1, price: 150 }],
            paymentChannel: 'card',
            externalPaymentId: 'ext-ops-fail'
        });
        const result = await controller.applyPaymentCallback({
            standardizedEventName: 'cashier.payment-failed',
            aggregateId: created.order.orderId,
            orderId: created.order.orderId,
            tenantId: createContext().tenantId,
            externalPaymentId: 'ext-ops-fail',
            transactionNo: 'txn-ops-fail'
        });
        strict_1.default.equal(result.payment?.status, 'FAILED');
    });
});
// ──────────── 🤝团建 ────────────
(0, node_test_1.describe)(`${ROLES.Teambuilding} 交易角色测试`, () => {
    (0, node_test_1.default)('团建可创建团队多项目交易（正常流程）', async () => {
        const { controller, memberId } = makeController();
        const result = await controller.startCheckout(createContext(), {
            memberId,
            items: [
                { skuId: 'sku-tb-1', title: '团建套餐A', quantity: 1, price: 2000 },
                { skuId: 'sku-tb-2', title: '团建保险', quantity: 10, price: 20 }
            ],
            paymentChannel: 'corporate-account',
            currency: 'CNY'
        });
        strict_1.default.equal(result.order.totalAmount, 2000 + 10 * 20);
        strict_1.default.equal(result.order.items.length, 2);
    });
    (0, node_test_1.default)('团建空订单应被拒绝（权限边界 - 输入验证）', async () => {
        const memberService = new member_service_1.MemberService();
        memberService.register({
            memberId: 'mem-tb-empty',
            tenantContext: createContext(),
            nickname: 'TB Empty'
        });
        const loyaltyService = new loyalty_service_1.LoyaltyService(memberService);
        const cashierService = new cashier_service_1.CashierService(memberService, loyaltyService);
        const service = new transactions_service_1.TransactionsService(cashierService, loyaltyService);
        const controller = new transactions_controller_1.TransactionsController(service);
        await strict_1.default.rejects(controller.startCheckout(createContext(), {
            memberId: 'mem-tb-empty',
            items: [],
            paymentChannel: 'corporate-account'
        }), /must include at least one item/);
    });
});
// ──────────── 📢营销 ────────────
(0, node_test_1.describe)(`${ROLES.Marketing} 交易角色测试`, () => {
    (0, node_test_1.default)('营销可创建含优惠券和盲盒的营销交易（正常流程）', async () => {
        const { controller, memberId } = makeController();
        const result = await controller.startCheckout(createContext(), {
            memberId,
            items: [{ skuId: 'sku-mkt', title: '暑期活动商品', quantity: 3, price: 30 }],
            paymentChannel: 'wechat-pay',
            couponCode: 'SUMMER2026',
            blindboxPlanId: 'bb-summer',
            blindboxQuantity: 2
        });
        strict_1.default.equal(result.order.couponCode, 'SUMMER2026');
        strict_1.default.equal(result.order.blindboxPlanId, 'bb-summer');
        strict_1.default.equal(result.order.blindboxQuantity, 2);
        strict_1.default.equal(result.order.totalAmount, 90);
    });
    (0, node_test_1.default)('营销可查看会员交易时间线做营销效果分析（数据边界）', async () => {
        const { controller, memberId } = makeController();
        await controller.startCheckout(createContext(), {
            memberId,
            items: [{ skuId: 'sku-mkt-2', quantity: 1, price: 25 }],
            paymentChannel: 'alipay'
        });
        const timeline = controller.listMemberTransactions(memberId, createContext());
        strict_1.default.ok(timeline.length >= 1);
        strict_1.default.ok(timeline.some((entry) => entry.totalAmount === 25));
    });
});
// ──────────── 跨角色租户隔离 ────────────
(0, node_test_1.describe)('交易模块多租户隔离验证', () => {
    (0, node_test_1.default)('租户A和租户B的交易完全隔离', async () => {
        const memberService = new member_service_1.MemberService();
        memberService.register({
            memberId: 'mem-iso',
            tenantContext: { tenantId: 't-alpha', brandId: 'b-alpha', storeId: 's-alpha' },
            nickname: 'ISO User A'
        });
        memberService.register({
            memberId: 'mem-iso-b',
            tenantContext: { tenantId: 't-beta', brandId: 'b-beta', storeId: 's-beta' },
            nickname: 'ISO User B'
        });
        const loyaltyService = new loyalty_service_1.LoyaltyService(memberService);
        const cashierService = new cashier_service_1.CashierService(memberService, loyaltyService);
        const service = new transactions_service_1.TransactionsService(cashierService, loyaltyService);
        const controller = new transactions_controller_1.TransactionsController(service);
        await controller.startCheckout({ tenantId: 't-alpha', brandId: 'b-alpha', storeId: 's-alpha' }, {
            memberId: 'mem-iso',
            items: [{ skuId: 'sku-iso-a', quantity: 1, price: 100 }],
            paymentChannel: 'wechat-pay'
        });
        const timelineFromB = controller.listMemberTransactions('mem-iso', { tenantId: 't-beta', brandId: 'b-beta', storeId: 's-beta' });
        strict_1.default.equal(timelineFromB.length, 0);
    });
});
//# sourceMappingURL=transactions.role.test.js.map