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
// 用 require 动态加载绕过 esbuild decorator 限制
const { CashierController } = require('./cashier.controller');
const { CashierOrderStatus, CashierPaymentStatus } = require('./cashier.entity');
// ── 辅助工厂 ──
function createContext(tenantId = 'tenant-cashier', brandId = 'brand-cashier') {
    return { tenantId, brandId };
}
function makeController(overrides = {}) {
    const service = {
        listOrders: overrides.listOrders ?? (() => []),
        getOrder: overrides.getOrder ?? (() => undefined),
        createOrder: overrides.createOrder ?? (async () => ({})),
        createPayment: overrides.createPayment ?? (async () => ({})),
        listPayments: overrides.listPayments ?? (() => []),
        applyPaymentCallback: overrides.applyPaymentCallback ??
            (async () => ({ order: {}, payment: {} }))
    };
    return new CashierController(service);
}
// ── 路由元数据 ──
(0, node_test_1.describe)('CashierController 路由元数据', () => {
    (0, node_test_1.default)('controller metadata path is cashier', () => {
        const path = Reflect.getMetadata('path', CashierController);
        strict_1.default.equal(path, 'cashier');
    });
    (0, node_test_1.default)('listOrders GET orders', () => {
        const method = Reflect.getMetadata('method', CashierController.prototype.listOrders);
        const path = Reflect.getMetadata('path', CashierController.prototype.listOrders);
        strict_1.default.equal(method, 0);
        strict_1.default.equal(path, 'orders');
    });
    (0, node_test_1.default)('getOrder GET orders/:orderId', () => {
        const method = Reflect.getMetadata('method', CashierController.prototype.getOrder);
        const path = Reflect.getMetadata('path', CashierController.prototype.getOrder);
        strict_1.default.equal(method, 0);
        strict_1.default.equal(path, 'orders/:orderId');
    });
    (0, node_test_1.default)('createOrder POST orders', () => {
        const method = Reflect.getMetadata('method', CashierController.prototype.createOrder);
        const path = Reflect.getMetadata('path', CashierController.prototype.createOrder);
        strict_1.default.equal(method, 1);
        strict_1.default.equal(path, 'orders');
    });
    (0, node_test_1.default)('createPayment POST orders/:orderId/payments', () => {
        const method = Reflect.getMetadata('method', CashierController.prototype.createPayment);
        const path = Reflect.getMetadata('path', CashierController.prototype.createPayment);
        strict_1.default.equal(method, 1);
        strict_1.default.equal(path, 'orders/:orderId/payments');
    });
    (0, node_test_1.default)('listPayments GET payments', () => {
        const method = Reflect.getMetadata('method', CashierController.prototype.listPayments);
        const path = Reflect.getMetadata('path', CashierController.prototype.listPayments);
        strict_1.default.equal(method, 0);
        strict_1.default.equal(path, 'payments');
    });
    (0, node_test_1.default)('applyPaymentCallback POST payments/standardized-callback', () => {
        const method = Reflect.getMetadata('method', CashierController.prototype.applyPaymentCallback);
        const path = Reflect.getMetadata('path', CashierController.prototype.applyPaymentCallback);
        strict_1.default.equal(method, 1);
        strict_1.default.equal(path, 'payments/standardized-callback');
    });
});
// ── 正例测试 ──
(0, node_test_1.describe)('CashierController 正例', () => {
    (0, node_test_1.default)('createOrder 委托 service 并返回订单', async () => {
        const orderId = 'order-1';
        const controller = makeController({
            createOrder: async () => ({
                orderId,
                memberId: 'm-01',
                items: [{ skuId: 'sku-1', title: '台球', quantity: 1, price: 50 }],
                totalAmount: 50,
                currency: 'CNY',
                status: CashierOrderStatus.Created,
                tenantContext: createContext(),
                source: 'memory'
            })
        });
        const result = await controller.createOrder(createContext(), {
            memberId: 'm-01',
            items: [{ skuId: 'sku-1', title: '台球', quantity: 1, price: 50 }]
        });
        strict_1.default.equal(result.orderId, orderId);
        strict_1.default.equal(result.memberId, 'm-01');
        strict_1.default.equal(result.status, CashierOrderStatus.Created);
        strict_1.default.equal(result.totalAmount, 50);
        strict_1.default.equal(result.currency, 'CNY');
        strict_1.default.equal(result.items.length, 1);
    });
    (0, node_test_1.default)('listOrders 委托 service 返回订单列表', () => {
        const mockOrders = [
            {
                orderId: 'o-1',
                memberId: 'm-01',
                items: [],
                totalAmount: 0,
                currency: 'CNY',
                status: CashierOrderStatus.Created,
                tenantContext: createContext(),
                source: 'memory',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                orderId: 'o-2',
                memberId: 'm-02',
                items: [],
                totalAmount: 100,
                currency: 'CNY',
                status: CashierOrderStatus.Paid,
                tenantContext: createContext(),
                source: 'memory',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        ];
        const controller = makeController({ listOrders: () => mockOrders });
        const result = controller.listOrders(createContext());
        strict_1.default.equal(result.length, 2);
        strict_1.default.equal(result[0].orderId, 'o-1');
        strict_1.default.equal(result[1].orderId, 'o-2');
    });
    (0, node_test_1.default)('getOrder 找到有效订单返回', () => {
        const mockOrder = {
            orderId: 'o-3',
            memberId: 'm-03',
            items: [{ skuId: 'sku-3', title: '饮料', quantity: 2, price: 15 }],
            totalAmount: 30,
            currency: 'CNY',
            status: CashierOrderStatus.PendingPayment,
            tenantContext: createContext(),
            source: 'memory',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        const controller = makeController({ getOrder: () => mockOrder });
        const result = controller.getOrder('o-3', createContext());
        strict_1.default.ok(result);
        strict_1.default.equal(result.orderId, 'o-3');
        strict_1.default.equal(result.totalAmount, 30);
    });
    (0, node_test_1.default)('createPayment 委托 service 创建支付', async () => {
        const payment = {
            paymentId: 'pay-1',
            orderId: 'o-1',
            channel: 'wechat-pay',
            amount: 50,
            status: CashierPaymentStatus.Pending,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        const controller = makeController({ createPayment: async () => payment });
        const result = await controller.createPayment('o-1', {
            channel: 'wechat-pay',
            amount: 50
        });
        strict_1.default.equal(result.paymentId, 'pay-1');
        strict_1.default.equal(result.channel, 'wechat-pay');
        strict_1.default.equal(result.status, CashierPaymentStatus.Pending);
    });
    (0, node_test_1.default)('listPayments 委托 service 返回支付列表', () => {
        const mockPayments = [
            {
                paymentId: 'p-1',
                orderId: 'o-1',
                channel: 'wechat-pay',
                amount: 50,
                status: CashierPaymentStatus.Pending,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                paymentId: 'p-2',
                orderId: 'o-2',
                channel: 'alipay',
                amount: 100,
                status: CashierPaymentStatus.Succeeded,
                transactionNo: 'txn-001',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        ];
        const controller = makeController({ listPayments: () => mockPayments });
        const result = controller.listPayments(createContext());
        strict_1.default.equal(result.length, 2);
        strict_1.default.equal(result[0].paymentId, 'p-1');
        strict_1.default.equal(result[1].status, CashierPaymentStatus.Succeeded);
    });
    (0, node_test_1.default)('applyPaymentCallback 支付成功回调更新订单和支付状态', async () => {
        const paidOrder = {
            orderId: 'o-4',
            memberId: 'm-01',
            items: [],
            totalAmount: 200,
            currency: 'CNY',
            status: CashierOrderStatus.Paid,
            tenantContext: createContext(),
            source: 'memory',
            paidAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        const successPayment = {
            paymentId: 'p-3',
            orderId: 'o-4',
            channel: 'wechat-pay',
            amount: 200,
            status: CashierPaymentStatus.Succeeded,
            transactionNo: 'txn-success',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            completedAt: new Date().toISOString()
        };
        const controller = makeController({
            applyPaymentCallback: async () => ({ order: paidOrder, payment: successPayment })
        });
        const result = await controller.applyPaymentCallback({
            standardizedEventName: 'cashier.payment-succeeded',
            aggregateId: 'o-4',
            orderId: 'o-4',
            tenantId: 'tenant-cashier',
            externalPaymentId: 'ext-ok'
        });
        strict_1.default.equal(result.order.status, CashierOrderStatus.Paid);
        strict_1.default.equal(result.payment.status, CashierPaymentStatus.Succeeded);
        strict_1.default.equal(result.payment.transactionNo, 'txn-success');
    });
});
// ── 反例测试 ──
(0, node_test_1.describe)('CashierController 反例', () => {
    (0, node_test_1.default)('getOrder 找不到订单抛出错误', () => {
        const controller = makeController();
        strict_1.default.throws(() => controller.getOrder('nonexistent', createContext()), /Cashier order nonexistent not found/);
    });
    (0, node_test_1.default)('getOrder 找不到订单，service 返回 undefined', () => {
        const controller = makeController({ getOrder: () => undefined });
        strict_1.default.throws(() => controller.getOrder('ghost-order', createContext()), /Cashier order ghost-order not found/);
    });
});
// ── 边界值测试 ──
(0, node_test_1.describe)('CashierController 边界值', () => {
    (0, node_test_1.default)('listOrders 空列表返回空数组', () => {
        const controller = makeController({ listOrders: () => [] });
        const result = controller.listOrders(createContext());
        strict_1.default.ok(Array.isArray(result));
        strict_1.default.equal(result.length, 0);
    });
    (0, node_test_1.default)('listPayments 空列表返回空数组', () => {
        const controller = makeController({ listPayments: () => [] });
        const result = controller.listPayments(createContext());
        strict_1.default.ok(Array.isArray(result));
        strict_1.default.equal(result.length, 0);
    });
    (0, node_test_1.default)('createOrder 传入多商品订单正常', async () => {
        const itemsCount = 10;
        const items = Array.from({ length: itemsCount }, (_, i) => ({
            skuId: `sku-${i}`,
            title: `商品${i}`,
            quantity: 1,
            price: 10
        }));
        let capturedItems;
        const controller = makeController({
            createOrder: async (_ctx, body) => {
                capturedItems = body.items;
                return {
                    orderId: 'o-bulk',
                    memberId: 'm-bulk',
                    items: body.items,
                    totalAmount: body.items.reduce((s, it) => s + it.price, 0),
                    currency: 'CNY',
                    status: CashierOrderStatus.Created,
                    tenantContext: createContext(),
                    source: 'memory'
                };
            }
        });
        const result = await controller.createOrder(createContext(), {
            memberId: 'm-bulk',
            items
        });
        strict_1.default.equal(result.items.length, itemsCount);
        strict_1.default.equal(result.totalAmount, itemsCount * 10);
        strict_1.default.ok(capturedItems);
        strict_1.default.equal(capturedItems.length, itemsCount);
    });
    (0, node_test_1.default)('createPayment 金额为 0 的支付正常创建', async () => {
        const controller = makeController({
            createPayment: async (_oid, body) => ({
                paymentId: 'pay-zero',
                orderId: 'o-zero',
                channel: body.channel,
                amount: body.amount,
                status: CashierPaymentStatus.Pending,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            })
        });
        const result = await controller.createPayment('o-zero', {
            channel: 'internal-transfer',
            amount: 0
        });
        strict_1.default.equal(result.amount, 0);
        strict_1.default.equal(result.status, CashierPaymentStatus.Pending);
    });
    (0, node_test_1.default)('createOrder 默认货币为 CNY', async () => {
        let capturedBody;
        const controller = makeController({
            createOrder: async (_ctx, body) => {
                capturedBody = body;
                return {
                    orderId: 'o-cny-default',
                    memberId: body.memberId,
                    items: body.items,
                    totalAmount: 100,
                    currency: 'CNY',
                    status: CashierOrderStatus.Created,
                    tenantContext: createContext(),
                    source: 'memory'
                };
            }
        });
        const result = await controller.createOrder(createContext(), {
            memberId: 'm-test',
            items: [{ skuId: 'sku-1', quantity: 1, price: 100 }]
        });
        strict_1.default.equal(result.currency, 'CNY');
        strict_1.default.ok(capturedBody.items.length > 0);
    });
});
// ── 支付回调边界 ──
(0, node_test_1.describe)('CashierController 支付回调边界', () => {
    (0, node_test_1.default)('applyPaymentCallback 支付失败回调更新支付状态', async () => {
        const failedOrder = {
            orderId: 'o-5',
            memberId: 'm-01',
            items: [],
            totalAmount: 150,
            currency: 'CNY',
            status: CashierOrderStatus.PaymentFailed,
            tenantContext: createContext(),
            source: 'memory',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        const failedPayment = {
            paymentId: 'p-5',
            orderId: 'o-5',
            channel: 'card',
            amount: 150,
            status: CashierPaymentStatus.Failed,
            failureReason: 'Payment callback reported failure',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        const controller = makeController({
            applyPaymentCallback: async () => ({ order: failedOrder, payment: failedPayment })
        });
        const result = await controller.applyPaymentCallback({
            standardizedEventName: 'cashier.payment-failed',
            aggregateId: 'o-5',
            orderId: 'o-5',
            tenantId: 'tenant-cashier',
            externalPaymentId: 'ext-fail'
        });
        strict_1.default.equal(result.order.status, CashierOrderStatus.PaymentFailed);
        strict_1.default.equal(result.payment.status, CashierPaymentStatus.Failed);
        strict_1.default.ok(result.payment.failureReason);
    });
});
//# sourceMappingURL=cashier.controller.test.js.map