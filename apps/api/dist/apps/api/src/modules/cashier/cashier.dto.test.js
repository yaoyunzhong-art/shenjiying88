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
const cashier_dto_1 = require("./cashier.dto");
// ──────────── CashierOrderItemDto ────────────
(0, node_test_1.describe)('CashierOrderItemDto', () => {
    (0, node_test_1.default)('构造单个订单项，所有必填字段可赋值', () => {
        const item = Object.assign(new cashier_dto_1.CashierOrderItemDto(), {
            skuId: 'SKU-A001',
            quantity: 3,
            price: 49.9,
            title: '台球1小时'
        });
        strict_1.default.equal(item.skuId, 'SKU-A001');
        strict_1.default.equal(item.quantity, 3);
        strict_1.default.equal(item.price, 49.9);
        strict_1.default.equal(item.title, '台球1小时');
    });
    (0, node_test_1.default)('订单项 title 为可选字段，省略也不抛错', () => {
        const item = Object.assign(new cashier_dto_1.CashierOrderItemDto(), {
            skuId: 'SKU-B002',
            quantity: 1,
            price: 10
        });
        strict_1.default.equal(item.skuId, 'SKU-B002');
        strict_1.default.equal(item.title, undefined);
    });
    (0, node_test_1.default)('quantity 为 0 时的订单项（边界：白送商品/赠品）', () => {
        const item = Object.assign(new cashier_dto_1.CashierOrderItemDto(), {
            skuId: 'SKU-FREE',
            quantity: 0,
            price: 0,
            title: '赠品'
        });
        strict_1.default.equal(item.quantity, 0);
        strict_1.default.equal(item.price, 0);
        strict_1.default.equal(item.skuId, 'SKU-FREE');
    });
    (0, node_test_1.default)('price 为负数时 DTO 仍然接受（由 service 层做业务校验）', () => {
        const item = Object.assign(new cashier_dto_1.CashierOrderItemDto(), {
            skuId: 'SKU-REFUND',
            quantity: 1,
            price: -99,
            title: '退款抵扣'
        });
        strict_1.default.equal(item.price, -99);
        // DTO 层仅做数据承载，不做业务规则校验
    });
});
// ──────────── CreateCashierOrderDto ────────────
(0, node_test_1.describe)('CreateCashierOrderDto', () => {
    (0, node_test_1.default)('标准创单 DTO：必填 memberId + items', () => {
        const dto = Object.assign(new cashier_dto_1.CreateCashierOrderDto(), {
            memberId: 'member-1',
            items: [
                Object.assign(new cashier_dto_1.CashierOrderItemDto(), { skuId: 'sku-1', quantity: 1, price: 99 })
            ]
        });
        strict_1.default.equal(dto.memberId, 'member-1');
        strict_1.default.equal(dto.items.length, 1);
        strict_1.default.equal(dto.items[0].skuId, 'sku-1');
    });
    (0, node_test_1.default)('创单 DTO 接受可选货币参数', () => {
        const dto = Object.assign(new cashier_dto_1.CreateCashierOrderDto(), {
            memberId: 'member-2',
            items: [
                Object.assign(new cashier_dto_1.CashierOrderItemDto(), { skuId: 'sku-2', quantity: 1, price: 50 })
            ],
            currency: 'HKD'
        });
        strict_1.default.equal(dto.currency, 'HKD');
    });
    (0, node_test_1.default)('创单 DTO 带优惠券码 couponCode', () => {
        const dto = Object.assign(new cashier_dto_1.CreateCashierOrderDto(), {
            memberId: 'member-3',
            items: [
                Object.assign(new cashier_dto_1.CashierOrderItemDto(), { skuId: 'sku-3', quantity: 1, price: 200 })
            ],
            couponCode: 'SUMMER2026'
        });
        strict_1.default.equal(dto.couponCode, 'SUMMER2026');
    });
    (0, node_test_1.default)('创单 DTO 带盲盒参数 blindboxPlanId + blindboxQuantity', () => {
        const dto = Object.assign(new cashier_dto_1.CreateCashierOrderDto(), {
            memberId: 'member-4',
            items: [
                Object.assign(new cashier_dto_1.CashierOrderItemDto(), { skuId: 'sku-blindbox', quantity: 1, price: 30 })
            ],
            blindboxPlanId: 'bb-bronze',
            blindboxQuantity: 3
        });
        strict_1.default.equal(dto.blindboxPlanId, 'bb-bronze');
        strict_1.default.equal(dto.blindboxQuantity, 3);
    });
    (0, node_test_1.default)('创单 DTO items 为空数组时的边界（service 层应拒单）', () => {
        const dto = Object.assign(new cashier_dto_1.CreateCashierOrderDto(), {
            memberId: 'member-5',
            items: []
        });
        strict_1.default.equal(dto.items.length, 0);
        // DTO 不做业务校验，service 层负责拒绝空订单
    });
    (0, node_test_1.default)('创单 DTO 多件商品 item 计算小计字段完整性', () => {
        const items = [
            Object.assign(new cashier_dto_1.CashierOrderItemDto(), { skuId: 'sku-a', quantity: 2, price: 50 }),
            Object.assign(new cashier_dto_1.CashierOrderItemDto(), { skuId: 'sku-b', quantity: 1, price: 200 }),
            Object.assign(new cashier_dto_1.CashierOrderItemDto(), { skuId: 'sku-c', quantity: 5, price: 20 })
        ];
        const dto = Object.assign(new cashier_dto_1.CreateCashierOrderDto(), {
            memberId: 'member-6',
            items
        });
        strict_1.default.equal(dto.items.length, 3);
        const computedTotal = items.reduce((sum, i) => sum + i.quantity * i.price, 0);
        strict_1.default.equal(computedTotal, 2 * 50 + 1 * 200 + 5 * 20);
    });
});
// ──────────── CreateCashierPaymentDto ────────────
(0, node_test_1.describe)('CreateCashierPaymentDto', () => {
    (0, node_test_1.default)('创建支付 DTO：必填 channel', () => {
        const dto = Object.assign(new cashier_dto_1.CreateCashierPaymentDto(), {
            channel: 'wechat-pay'
        });
        strict_1.default.equal(dto.channel, 'wechat-pay');
    });
    (0, node_test_1.default)('创建支付 DTO 带 externalPaymentId', () => {
        const dto = Object.assign(new cashier_dto_1.CreateCashierPaymentDto(), {
            channel: 'alipay',
            externalPaymentId: 'ext-alipay-001'
        });
        strict_1.default.equal(dto.externalPaymentId, 'ext-alipay-001');
    });
    (0, node_test_1.default)('创建支付 DTO 指定 amount 覆盖 order total', () => {
        const dto = Object.assign(new cashier_dto_1.CreateCashierPaymentDto(), {
            channel: 'bank-transfer',
            amount: 499.99
        });
        strict_1.default.equal(dto.amount, 499.99);
    });
    (0, node_test_1.default)('创建支付 DTO 仅 channel 不填 amount（由 service 取 order total）', () => {
        const dto = Object.assign(new cashier_dto_1.CreateCashierPaymentDto(), {
            channel: 'card'
        });
        strict_1.default.equal(dto.channel, 'card');
        strict_1.default.equal(dto.amount, undefined);
        strict_1.default.equal(dto.externalPaymentId, undefined);
    });
    (0, node_test_1.default)('创建支付 DTO channel 为自定义内部支付方式', () => {
        const dto = Object.assign(new cashier_dto_1.CreateCashierPaymentDto(), {
            channel: 'internal-transfer',
            amount: 0
        });
        strict_1.default.equal(dto.channel, 'internal-transfer');
        strict_1.default.equal(dto.amount, 0);
    });
});
// ──────────── CashierPaymentCallbackDto ────────────
(0, node_test_1.describe)('CashierPaymentCallbackDto', () => {
    (0, node_test_1.default)('支付成功回调 DTO', () => {
        const dto = Object.assign(new cashier_dto_1.CashierPaymentCallbackDto(), {
            standardizedEventName: 'cashier.payment-succeeded',
            aggregateId: 'agg-order-1',
            orderId: 'order-1',
            tenantId: 'tenant-1',
            externalPaymentId: 'ext-wx-123',
            transactionNo: 'txn-45678',
            channel: 'wechat-pay',
            amount: 100
        });
        strict_1.default.equal(dto.standardizedEventName, 'cashier.payment-succeeded');
        strict_1.default.equal(dto.aggregateId, 'agg-order-1');
        strict_1.default.equal(dto.orderId, 'order-1');
        strict_1.default.equal(dto.tenantId, 'tenant-1');
        strict_1.default.equal(dto.externalPaymentId, 'ext-wx-123');
        strict_1.default.equal(dto.transactionNo, 'txn-45678');
        strict_1.default.equal(dto.channel, 'wechat-pay');
        strict_1.default.equal(dto.amount, 100);
    });
    (0, node_test_1.default)('支付失败回调 DTO', () => {
        const dto = Object.assign(new cashier_dto_1.CashierPaymentCallbackDto(), {
            standardizedEventName: 'cashier.payment-failed',
            aggregateId: 'agg-order-2',
            orderId: 'order-2',
            tenantId: 'tenant-1',
            externalPaymentId: 'ext-wx-fail',
            transactionNo: 'txn-fail-001'
        });
        strict_1.default.equal(dto.standardizedEventName, 'cashier.payment-failed');
        strict_1.default.equal(dto.orderId, 'order-2');
    });
    (0, node_test_1.default)('支付回调 DTO 必填字段校验：无 tenantId 也能创建 DTO（由 service 做校验）', () => {
        const dto = Object.assign(new cashier_dto_1.CashierPaymentCallbackDto(), {
            standardizedEventName: 'cashier.payment-succeeded',
            aggregateId: 'agg-3',
            orderId: 'order-3',
            tenantId: ''
        });
        strict_1.default.equal(dto.tenantId, '');
        strict_1.default.equal(dto.standardizedEventName, 'cashier.payment-succeeded');
    });
    (0, node_test_1.default)('支付回调 DTO 带扩展 payload', () => {
        const payload = { remark: '用户备注', discountApplied: true, couponId: 'CPN-001' };
        const dto = Object.assign(new cashier_dto_1.CashierPaymentCallbackDto(), {
            standardizedEventName: 'cashier.payment-succeeded',
            aggregateId: 'agg-4',
            orderId: 'order-4',
            tenantId: 'tenant-1',
            payload
        });
        strict_1.default.deepEqual(dto.payload, payload);
        strict_1.default.equal(dto.payload?.couponId, 'CPN-001');
    });
    (0, node_test_1.default)('支付回调 DTO 事件名只能为 payment-succeeded 或 payment-failed', () => {
        // DTO 类型约束了 standardizedEventName 只能是两个值之一
        const successDto = Object.assign(new cashier_dto_1.CashierPaymentCallbackDto(), {
            standardizedEventName: 'cashier.payment-succeeded',
            aggregateId: 'agg-5',
            orderId: 'order-5',
            tenantId: 'tenant-1'
        });
        const failDto = Object.assign(new cashier_dto_1.CashierPaymentCallbackDto(), {
            standardizedEventName: 'cashier.payment-failed',
            aggregateId: 'agg-6',
            orderId: 'order-6',
            tenantId: 'tenant-1'
        });
        strict_1.default.equal(successDto.standardizedEventName, 'cashier.payment-succeeded');
        strict_1.default.equal(failDto.standardizedEventName, 'cashier.payment-failed');
        strict_1.default.notEqual(successDto.standardizedEventName, failDto.standardizedEventName);
    });
});
//# sourceMappingURL=cashier.dto.test.js.map