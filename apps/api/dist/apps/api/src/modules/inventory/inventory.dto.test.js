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
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const inventory_dto_1 = require("./inventory.dto");
const inventory_entity_1 = require("./inventory.entity");
(0, node_test_1.describe)('Inventory DTO — CreateProductDto', () => {
    (0, node_test_1.default)('validates required fields', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(inventory_dto_1.CreateProductDto, {
            name: 'Bear Plush',
            sku: 'SKU-BP-001',
            unit: 'pcs',
            price: 99,
            cost: 50,
            minStock: 10,
            maxStock: 100,
            currentStock: 50
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.equal(errors.length, 0);
    });
    (0, node_test_1.default)('rejects missing required fields', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(inventory_dto_1.CreateProductDto, {});
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.ok(errors.length > 0);
    });
    (0, node_test_1.default)('rejects negative price', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(inventory_dto_1.CreateProductDto, {
            name: 'Test', sku: 'S-1', unit: 'pcs', price: -10, cost: 5,
            minStock: 0, maxStock: 100, currentStock: 20
        });
        const errors = await (0, class_validator_1.validate)(dto);
        const priceErrors = errors.filter((e) => e.property === 'price');
        strict_1.default.ok(priceErrors.length > 0);
    });
    (0, node_test_1.default)('accepts optional status', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(inventory_dto_1.CreateProductDto, {
            name: 'Test', sku: 'S-2', unit: 'pcs', price: 10, cost: 5,
            minStock: 0, maxStock: 100, currentStock: 20,
            status: inventory_entity_1.ProductStatus.Inactive
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.equal(errors.length, 0);
    });
});
(0, node_test_1.describe)('Inventory DTO — UpdateProductDto', () => {
    (0, node_test_1.default)('allows partial update with only name', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(inventory_dto_1.UpdateProductDto, { name: 'New Name' });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.equal(errors.length, 0);
    });
    (0, node_test_1.default)('allows partial update with only price', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(inventory_dto_1.UpdateProductDto, { price: 199 });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.equal(errors.length, 0);
    });
    (0, node_test_1.default)('rejects negative cost', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(inventory_dto_1.UpdateProductDto, { cost: -5 });
        const errors = await (0, class_validator_1.validate)(dto);
        const costErrors = errors.filter((e) => e.property === 'cost');
        strict_1.default.ok(costErrors.length > 0);
    });
});
(0, node_test_1.describe)('Inventory DTO — ProductQueryDto', () => {
    (0, node_test_1.default)('validates optional query fields', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(inventory_dto_1.ProductQueryDto, {
            category: 'toys',
            keyword: 'bear',
            limit: 10,
            offset: 0
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.equal(errors.length, 0);
    });
    (0, node_test_1.default)('allows empty query', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(inventory_dto_1.ProductQueryDto, {});
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.equal(errors.length, 0);
    });
});
(0, node_test_1.describe)('Inventory DTO — StockInDto', () => {
    (0, node_test_1.default)('validates correct stock in', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(inventory_dto_1.StockInDto, {
            productId: 'prod-1',
            quantity: 10,
            reason: 'restock',
            batchNo: 'B-001'
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.equal(errors.length, 0);
    });
    (0, node_test_1.default)('rejects quantity of 0', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(inventory_dto_1.StockInDto, { productId: 'p-1', quantity: 0 });
        const errors = await (0, class_validator_1.validate)(dto);
        const qtyErrors = errors.filter((e) => e.property === 'quantity');
        strict_1.default.ok(qtyErrors.length > 0);
    });
    (0, node_test_1.default)('rejects missing productId', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(inventory_dto_1.StockInDto, { quantity: 5 });
        const errors = await (0, class_validator_1.validate)(dto);
        const idErrors = errors.filter((e) => e.property === 'productId');
        strict_1.default.ok(idErrors.length > 0);
    });
});
(0, node_test_1.describe)('Inventory DTO — StockOutDto', () => {
    (0, node_test_1.default)('validates correct stock out', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(inventory_dto_1.StockOutDto, { productId: 'p-1', quantity: 3 });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.equal(errors.length, 0);
    });
    (0, node_test_1.default)('rejects quantity of 0', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(inventory_dto_1.StockOutDto, { productId: 'p-1', quantity: 0 });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.ok(errors.length > 0);
    });
});
(0, node_test_1.describe)('Inventory DTO — AdjustStockDto', () => {
    (0, node_test_1.default)('validates correct adjustment', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(inventory_dto_1.AdjustStockDto, {
            productId: 'p-1',
            newQuantity: 100,
            reason: 'inventory check'
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.equal(errors.length, 0);
    });
    (0, node_test_1.default)('rejects missing reason', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(inventory_dto_1.AdjustStockDto, { productId: 'p-1', newQuantity: 50 });
        const errors = await (0, class_validator_1.validate)(dto);
        const reasonErrors = errors.filter((e) => e.property === 'reason');
        strict_1.default.ok(reasonErrors.length > 0);
    });
});
(0, node_test_1.describe)('Inventory DTO — StockRecordQueryDto', () => {
    (0, node_test_1.default)('validates query with type filter', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(inventory_dto_1.StockRecordQueryDto, {
            productId: 'p-1',
            type: inventory_entity_1.StockRecordType.Inbound,
            dateFrom: '2026-01-01',
            dateTo: '2026-06-30',
            limit: 20,
            offset: 0
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.equal(errors.length, 0);
    });
    (0, node_test_1.default)('allows empty query', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(inventory_dto_1.StockRecordQueryDto, {});
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.equal(errors.length, 0);
    });
});
(0, node_test_1.describe)('Inventory DTO — CreateSupplierDto', () => {
    (0, node_test_1.default)('validates with required name only', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(inventory_dto_1.CreateSupplierDto, { name: 'Acme Corp' });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.equal(errors.length, 0);
    });
    (0, node_test_1.default)('rejects missing name', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(inventory_dto_1.CreateSupplierDto, { phone: '123456' });
        const errors = await (0, class_validator_1.validate)(dto);
        const nameErrors = errors.filter((e) => e.property === 'name');
        strict_1.default.ok(nameErrors.length > 0);
    });
});
(0, node_test_1.describe)('Inventory DTO — CreatePurchaseOrderDto', () => {
    (0, node_test_1.default)('validates correct purchase order', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(inventory_dto_1.CreatePurchaseOrderDto, {
            storeId: 'store-1',
            supplierId: 'supplier-1',
            items: [{
                    productId: 'p-1', productName: 'Ball', sku: 'B-1',
                    quantity: 10, unitPrice: 15, totalPrice: 150
                }],
            totalAmount: 150
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.equal(errors.length, 0);
    });
    (0, node_test_1.default)('rejects empty items array', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(inventory_dto_1.CreatePurchaseOrderDto, {
            items: [], totalAmount: 0
        });
        const errors = await (0, class_validator_1.validate)(dto);
        const itemsErrors = errors.filter((e) => e.property === 'items');
        strict_1.default.ok(itemsErrors.length > 0);
    });
    (0, node_test_1.default)('rejects negative totalAmount', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(inventory_dto_1.CreatePurchaseOrderDto, {
            items: [{ productId: 'p-1', productName: 'B', sku: 'B-1', quantity: 1, unitPrice: 10, totalPrice: 10 }],
            totalAmount: -1
        });
        const errors = await (0, class_validator_1.validate)(dto);
        const amtErrors = errors.filter((e) => e.property === 'totalAmount');
        strict_1.default.ok(amtErrors.length > 0);
    });
});
(0, node_test_1.describe)('Inventory DTO — CreatePurchaseOrderItemDto', () => {
    (0, node_test_1.default)('validates correct item', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(inventory_dto_1.CreatePurchaseOrderItemDto, {
            productId: 'p-1', productName: 'Ball', sku: 'B-1',
            quantity: 5, unitPrice: 10, totalPrice: 50
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.equal(errors.length, 0);
    });
    (0, node_test_1.default)('rejects quantity 0', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(inventory_dto_1.CreatePurchaseOrderItemDto, {
            productId: 'p-1', productName: 'B', sku: 'B-1',
            quantity: 0, unitPrice: 10, totalPrice: 0
        });
        const errors = await (0, class_validator_1.validate)(dto);
        const qtyErrors = errors.filter((e) => e.property === 'quantity');
        strict_1.default.ok(qtyErrors.length > 0);
    });
});
(0, node_test_1.describe)('Inventory DTO — PurchaseOrderQueryDto', () => {
    (0, node_test_1.default)('validates with status filter', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(inventory_dto_1.PurchaseOrderQueryDto, {
            status: inventory_entity_1.PurchaseOrderStatus.Draft,
            supplierId: 's-1',
            limit: 10
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.equal(errors.length, 0);
    });
    (0, node_test_1.default)('allows empty query', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(inventory_dto_1.PurchaseOrderQueryDto, {});
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.equal(errors.length, 0);
    });
});
//# sourceMappingURL=inventory.dto.test.js.map