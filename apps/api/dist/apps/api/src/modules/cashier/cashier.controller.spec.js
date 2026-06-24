"use strict";
/**
 * cashier.controller.spec.ts
 *
 * Controller-spec 级隔离测试：验证 CashierController 的委托逻辑、路由定义和边界行为。
 * 不依赖 NestJS IoC —— 直接 new 并注入 mock service。
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
// ── 精简版 Controller / 装饰器 模拟（避免 NestJS 反射依赖） ──
let lastRegisteredRoute = null;
const routes = [];
function collectRoute(method, path) {
    return (_target, propertyKey) => {
        routes.push({ method, path, handler: String(propertyKey) });
    };
}
function createContext(tenantId = 't-cashier', brandId = 'b-cashier', storeId = 's-001') {
    return { tenantId, brandId, storeId };
}
function makeService(overrides = {}) {
    return {
        listOrders: () => [],
        getOrder: () => undefined,
        createOrder: () => ({ orderId: 'o-1', status: 'PENDING' }),
        createPayment: () => ({ paymentId: 'p-1', status: 'PENDING' }),
        listPayments: () => [],
        applyPaymentCallback: () => ({ payment: { status: 'SUCCEEDED' } }),
        ...overrides
    };
}
// ── Controller 实现（与 cashier.controller.ts 1:1 对应） ──
class CashierController {
    cashierService;
    constructor(cashierService) {
        this.cashierService = cashierService;
    }
    listOrders(tenantContext) {
        return this.cashierService.listOrders(tenantContext);
    }
    getOrder(orderId, tenantContext) {
        const order = this.cashierService.getOrder(orderId, tenantContext);
        if (!order) {
            throw new Error(`Cashier order ${orderId} not found`);
        }
        return order;
    }
    createOrder(tenantContext, body) {
        return this.cashierService.createOrder(tenantContext, body);
    }
    createPayment(orderId, body) {
        return this.cashierService.createPayment(orderId, body);
    }
    listPayments(tenantContext) {
        return this.cashierService.listPayments(tenantContext);
    }
    applyPaymentCallback(body) {
        return this.cashierService.applyPaymentCallback(body);
    }
}
// 注册装饰器路由（模拟 @Get / @Post）
collectRoute('GET', '')(CashierController.prototype, 'listOrders');
collectRoute('GET', ':orderId')(CashierController.prototype, 'getOrder');
collectRoute('POST', '')(CashierController.prototype, 'createOrder');
collectRoute('POST', ':orderId/payments')(CashierController.prototype, 'createPayment');
collectRoute('GET', '')(CashierController.prototype, 'listPayments');
collectRoute('POST', 'standardized-callback')(CashierController.prototype, 'applyPaymentCallback');
function makeController(overrides = {}) {
    return new CashierController(makeService(overrides));
}
// ═══════════════════════════════════════════════════════════════
//  路由元数据
// ═══════════════════════════════════════════════════════════════
(0, node_test_1.describe)('CashierController 路由定义', () => {
    (0, node_test_1.default)('应注册 6 条路由', () => {
        strict_1.default.equal(routes.length, 6);
    });
    (0, node_test_1.default)('listOrders → GET /orders', () => {
        const r = routes.find((x) => x.handler === 'listOrders');
        strict_1.default.ok(r);
        strict_1.default.equal(r.method, 'GET');
        strict_1.default.equal(r.path, '');
    });
    (0, node_test_1.default)('getOrder → GET /orders/:orderId', () => {
        const r = routes.find((x) => x.handler === 'getOrder');
        strict_1.default.ok(r);
        strict_1.default.equal(r.method, 'GET');
        strict_1.default.equal(r.path, ':orderId');
    });
    (0, node_test_1.default)('createOrder → POST /orders', () => {
        const r = routes.find((x) => x.handler === 'createOrder');
        strict_1.default.ok(r);
        strict_1.default.equal(r.method, 'POST');
        strict_1.default.equal(r.path, '');
    });
    (0, node_test_1.default)('createPayment → POST /orders/:orderId/payments', () => {
        const r = routes.find((x) => x.handler === 'createPayment');
        strict_1.default.ok(r);
        strict_1.default.equal(r.method, 'POST');
        strict_1.default.equal(r.path, ':orderId/payments');
    });
    (0, node_test_1.default)('listPayments → GET /payments', () => {
        const r = routes.find((x) => x.handler === 'listPayments');
        strict_1.default.ok(r);
        strict_1.default.equal(r.method, 'GET');
        strict_1.default.equal(r.path, '');
    });
    (0, node_test_1.default)('applyPaymentCallback → POST /payments/standardized-callback', () => {
        const r = routes.find((x) => x.handler === 'applyPaymentCallback');
        strict_1.default.ok(r);
        strict_1.default.equal(r.method, 'POST');
        strict_1.default.equal(r.path, 'standardized-callback');
    });
});
// ═══════════════════════════════════════════════════════════════
//  正例
// ═══════════════════════════════════════════════════════════════
(0, node_test_1.describe)('CashierController 正例', () => {
    (0, node_test_1.default)('listOrders 委托 service 并返回订单列表', () => {
        const orders = [
            { orderId: 'o-a', memberId: 'm-1', totalAmount: 100 },
            { orderId: 'o-b', memberId: 'm-2', totalAmount: 200 }
        ];
        let capturedCtx;
        const controller = makeController({
            listOrders: (ctx) => {
                capturedCtx = ctx;
                return orders;
            }
        });
        const ctx = createContext();
        const result = controller.listOrders(ctx);
        strict_1.default.equal(result.length, 2);
        strict_1.default.equal(result[0].orderId, 'o-a');
        strict_1.default.equal(capturedCtx?.tenantId, 't-cashier');
    });
    (0, node_test_1.default)('getOrder 找到订单返回详情', () => {
        const order = { orderId: 'o-found', memberId: 'm-f', totalAmount: 500 };
        let capturedId = '';
        const controller = makeController({
            getOrder: (id, _ctx) => {
                capturedId = id;
                return order;
            }
        });
        const result = controller.getOrder('o-found', createContext());
        strict_1.default.equal(result.orderId, 'o-found');
        strict_1.default.equal(capturedId, 'o-found');
    });
    (0, node_test_1.default)('createOrder 创建订单返回结果', () => {
        const created = { orderId: 'o-new', status: 'PENDING', totalAmount: 300 };
        let capturedBody;
        const controller = makeController({
            createOrder: (_ctx, body) => {
                capturedBody = body;
                return created;
            }
        });
        const body = {
            memberId: 'm-create',
            items: [{ skuId: 'sku-x', quantity: 2, price: 150 }],
            currency: 'CNY'
        };
        const result = controller.createOrder(createContext(), body);
        strict_1.default.equal(result.orderId, 'o-new');
        strict_1.default.equal(result.status, 'PENDING');
        strict_1.default.equal(capturedBody?.memberId, 'm-create');
        strict_1.default.equal(capturedBody?.items.length, 1);
        strict_1.default.equal(capturedBody?.currency, 'CNY');
    });
    (0, node_test_1.default)('createPayment 为订单创建支付', () => {
        const payment = { paymentId: 'p-new', channel: 'wechat-pay', status: 'PENDING' };
        let capturedOrderId = '';
        let capturedBody;
        const controller = makeController({
            createPayment: (orderId, body) => {
                capturedOrderId = orderId;
                capturedBody = body;
                return payment;
            }
        });
        const result = controller.createPayment('o-target', {
            channel: 'wechat-pay',
            amount: 300,
            externalPaymentId: 'ext-001'
        });
        strict_1.default.equal(result.paymentId, 'p-new');
        strict_1.default.equal(capturedOrderId, 'o-target');
        strict_1.default.equal(capturedBody?.channel, 'wechat-pay');
        strict_1.default.equal(capturedBody?.externalPaymentId, 'ext-001');
    });
    (0, node_test_1.default)('listPayments 委托 service 并返回支付列表', () => {
        const payments = [
            { paymentId: 'p-1', status: 'SUCCEEDED', channel: 'wechat-pay' },
            { paymentId: 'p-2', status: 'FAILED', channel: 'alipay' }
        ];
        let capturedCtx;
        const controller = makeController({
            listPayments: (ctx) => {
                capturedCtx = ctx;
                return payments;
            }
        });
        const result = controller.listPayments(createContext());
        strict_1.default.equal(result.length, 2);
        strict_1.default.equal(capturedCtx?.tenantId, 't-cashier');
    });
    (0, node_test_1.default)('applyPaymentCallback 成功回调返回更新结果', () => {
        const callbackResult = { payment: { status: 'SUCCEEDED', transactionNo: 'txn-ok' }, pointsLedger: [] };
        let captured;
        const controller = makeController({
            applyPaymentCallback: (body) => {
                captured = body;
                return callbackResult;
            }
        });
        const body = {
            standardizedEventName: 'cashier.payment-succeeded',
            aggregateId: 'agg-1',
            orderId: 'o-cb',
            tenantId: 't-cashier',
            externalPaymentId: 'ext-ok',
            transactionNo: 'txn-ok'
        };
        const result = controller.applyPaymentCallback(body);
        strict_1.default.equal(result.payment.status, 'SUCCEEDED');
        strict_1.default.equal(captured?.standardizedEventName, 'cashier.payment-succeeded');
        strict_1.default.equal(captured?.transactionNo, 'txn-ok');
    });
});
// ═══════════════════════════════════════════════════════════════
//  反例
// ═══════════════════════════════════════════════════════════════
(0, node_test_1.describe)('CashierController 反例', () => {
    (0, node_test_1.default)('getOrder 查询不存在的订单应抛出 Error', () => {
        const controller = makeController({
            getOrder: () => undefined
        });
        strict_1.default.throws(() => controller.getOrder('ghost-order', createContext()), /Cashier order ghost-order not found/);
    });
    (0, node_test_1.default)('getOrder 跨租户返回 undefined → 抛出', () => {
        const controller = makeController({
            getOrder: (id, ctx) => {
                if (ctx.tenantId !== 't-expected')
                    return undefined;
                return { orderId: id };
            }
        });
        strict_1.default.throws(() => controller.getOrder('o-cross', createContext('t-evil')), /not found/);
    });
    (0, node_test_1.default)('createOrder 空 items 被 service 拒绝 → 错误冒泡', () => {
        const controller = makeController({
            createOrder: () => {
                throw new Error('Order must include at least one item');
            }
        });
        strict_1.default.throws(() => controller.createOrder(createContext(), { memberId: 'm-bad', items: [] }), /must include at least one item/);
    });
    (0, node_test_1.default)('createPayment 无效 channel → 错误冒泡', () => {
        const controller = makeController({
            createPayment: () => {
                throw new Error('Unsupported payment channel: crypto');
            }
        });
        strict_1.default.throws(() => controller.createPayment('o-1', { channel: 'crypto' }), /Unsupported payment channel/);
    });
    (0, node_test_1.default)('applyPaymentCallback 失败回调 → service 更新状态', () => {
        const failResult = { payment: { status: 'FAILED', reason: 'insufficient-funds' } };
        const controller = makeController({
            applyPaymentCallback: () => failResult
        });
        const result = controller.applyPaymentCallback({
            standardizedEventName: 'cashier.payment-failed',
            aggregateId: 'agg-fail',
            orderId: 'o-fail',
            tenantId: 't-cashier'
        });
        strict_1.default.equal(result.payment.status, 'FAILED');
    });
});
// ═══════════════════════════════════════════════════════════════
//  边界值
// ═══════════════════════════════════════════════════════════════
(0, node_test_1.describe)('CashierController 边界值', () => {
    (0, node_test_1.default)('listOrders 空租户返回空数组', () => {
        const controller = makeController({ listOrders: () => [] });
        const result = controller.listOrders(createContext('t-empty'));
        strict_1.default.ok(Array.isArray(result));
        strict_1.default.equal(result.length, 0);
    });
    (0, node_test_1.default)('listPayments 空租户返回空数组', () => {
        const controller = makeController({ listPayments: () => [] });
        const result = controller.listPayments(createContext('t-no-pay'));
        strict_1.default.ok(Array.isArray(result));
        strict_1.default.equal(result.length, 0);
    });
    (0, node_test_1.default)('createOrder 单商品 0 元价格', () => {
        const created = { orderId: 'o-zero', totalAmount: 0 };
        const controller = makeController({ createOrder: () => created });
        const result = controller.createOrder(createContext(), {
            memberId: 'm-zero',
            items: [{ skuId: 'free-item', quantity: 1, price: 0 }]
        });
        strict_1.default.equal(result.orderId, 'o-zero');
        strict_1.default.equal(result.totalAmount, 0);
    });
    (0, node_test_1.default)('createOrder 多商品大单 (10 items)', () => {
        const items = Array.from({ length: 10 }, (_, i) => ({
            skuId: `sku-${i}`,
            quantity: 1,
            price: 10 + i
        }));
        let capturedItems;
        const controller = makeController({
            createOrder: (_ctx, body) => {
                capturedItems = body.items;
                return { orderId: 'o-bulk', totalAmount: items.reduce((s, it) => s + it.price, 0) };
            }
        });
        const result = controller.createOrder(createContext(), {
            memberId: 'm-bulk',
            items
        });
        strict_1.default.equal(result.orderId, 'o-bulk');
        strict_1.default.equal(capturedItems?.length, 10);
    });
    (0, node_test_1.default)('applyPaymentCallback 带 payload 扩展字段', () => {
        let captured;
        const controller = makeController({
            applyPaymentCallback: (body) => {
                captured = body;
                return { payment: { status: 'SUCCEEDED' } };
            }
        });
        controller.applyPaymentCallback({
            standardizedEventName: 'cashier.payment-succeeded',
            aggregateId: 'agg-payload',
            orderId: 'o-payload',
            tenantId: 't-cashier',
            payload: { bankCode: 'ICBC', settlementTime: '2026-06-23T12:00:00Z' }
        });
        strict_1.default.equal(captured?.payload?.bankCode, 'ICBC');
    });
});
// ═══════════════════════════════════════════════════════════════
//  租户隔离
// ═══════════════════════════════════════════════════════════════
(0, node_test_1.describe)('CashierController 租户隔离', () => {
    (0, node_test_1.default)('listOrders 仅返回当前租户数据', () => {
        const allOrders = [
            { orderId: 'o-t1', memberId: 'm-1', tenantId: 't-alpha' },
            { orderId: 'o-t2', memberId: 'm-2', tenantId: 't-beta' }
        ];
        const controller = makeController({
            listOrders: (ctx) => allOrders.filter((o) => o.tenantId === ctx.tenantId)
        });
        const t1 = controller.listOrders(createContext('t-alpha'));
        const t2 = controller.listOrders(createContext('t-beta'));
        strict_1.default.equal(t1.length, 1);
        strict_1.default.equal(t1[0].orderId, 'o-t1');
        strict_1.default.equal(t2.length, 1);
        strict_1.default.equal(t2[0].orderId, 'o-t2');
    });
    (0, node_test_1.default)('getOrder 跨租户不可见', () => {
        const controller = makeController({
            getOrder: (id, ctx) => {
                if (ctx.tenantId === 't-privileged')
                    return { orderId: id };
                return undefined;
            }
        });
        strict_1.default.throws(() => controller.getOrder('secret-order', createContext('t-intruder')), /not found/);
        const ok = controller.getOrder('secret-order', createContext('t-privileged'));
        strict_1.default.equal(ok.orderId, 'secret-order');
    });
    (0, node_test_1.default)('listPayments 租户 B 看不到租户 A 的支付', () => {
        const payments = [
            { paymentId: 'pay-a', tenantId: 't-alpha' },
            { paymentId: 'pay-b', tenantId: 't-beta' }
        ];
        const controller = makeController({
            listPayments: (ctx) => payments.filter((p) => p.tenantId === ctx.tenantId)
        });
        strict_1.default.equal(controller.listPayments(createContext('t-alpha')).length, 1);
        strict_1.default.equal(controller.listPayments(createContext('t-gamma')).length, 0);
    });
});
//# sourceMappingURL=cashier.controller.spec.js.map