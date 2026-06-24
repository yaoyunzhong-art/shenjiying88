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
const inventory_entity_1 = require("./inventory.entity");
(0, node_test_1.describe)('Inventory Entity — Enums', () => {
    (0, node_test_1.default)('ProductStatus has correct values', () => {
        strict_1.default.equal(inventory_entity_1.ProductStatus.Active, 'active');
        strict_1.default.equal(inventory_entity_1.ProductStatus.Inactive, 'inactive');
        strict_1.default.equal(inventory_entity_1.ProductStatus.Discontinued, 'discontinued');
    });
    (0, node_test_1.default)('StockRecordType has all expected values', () => {
        strict_1.default.equal(inventory_entity_1.StockRecordType.Inbound, 'inbound');
        strict_1.default.equal(inventory_entity_1.StockRecordType.Outbound, 'outbound');
        strict_1.default.equal(inventory_entity_1.StockRecordType.Return, 'return');
        strict_1.default.equal(inventory_entity_1.StockRecordType.Adjustment, 'adjustment');
    });
    (0, node_test_1.default)('PurchaseOrderStatus has all expected values', () => {
        strict_1.default.equal(inventory_entity_1.PurchaseOrderStatus.Draft, 'draft');
        strict_1.default.equal(inventory_entity_1.PurchaseOrderStatus.Submitted, 'submitted');
        strict_1.default.equal(inventory_entity_1.PurchaseOrderStatus.Confirmed, 'confirmed');
        strict_1.default.equal(inventory_entity_1.PurchaseOrderStatus.Received, 'received');
        strict_1.default.equal(inventory_entity_1.PurchaseOrderStatus.Cancelled, 'cancelled');
    });
});
(0, node_test_1.describe)('Inventory Entity — Type shapes', () => {
    (0, node_test_1.default)('Product interface can be constructed', () => {
        const product = {
            id: 'prod-1',
            tenantId: 't-1',
            name: 'Bear Plush',
            sku: 'SKU-BP-001',
            category: 'toys',
            unit: 'pcs',
            price: 99,
            cost: 50,
            minStock: 10,
            maxStock: 100,
            currentStock: 50,
            status: inventory_entity_1.ProductStatus.Active,
            barcode: '123456',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        strict_1.default.equal(product.id, 'prod-1');
        strict_1.default.equal(product.price, 99);
    });
    (0, node_test_1.default)('StockRecord interface can be constructed', () => {
        const record = {
            id: 'sr-1',
            productId: 'prod-1',
            type: inventory_entity_1.StockRecordType.Inbound,
            quantity: 10,
            beforeStock: 50,
            afterStock: 60,
            reason: 'restock',
            operatorId: 'op-1',
            batchNo: 'B-001',
            createdAt: new Date().toISOString()
        };
        strict_1.default.equal(record.type, inventory_entity_1.StockRecordType.Inbound);
        strict_1.default.equal(record.afterStock, 60);
    });
    (0, node_test_1.default)('Supplier interface can be constructed', () => {
        const supplier = {
            id: 's-1',
            tenantId: 't-1',
            name: 'Toy Factory',
            contactName: 'Zhang San',
            phone: '13800138000',
            email: 'zhang@toy.com',
            address: 'Shanghai',
            createdAt: new Date().toISOString()
        };
        strict_1.default.equal(supplier.name, 'Toy Factory');
    });
    (0, node_test_1.default)('PurchaseOrder interface can be constructed', () => {
        const order = {
            id: 'po-1',
            tenantId: 't-1',
            status: inventory_entity_1.PurchaseOrderStatus.Draft,
            items: [{
                    productId: 'p-1',
                    productName: 'Ball',
                    sku: 'SKU-B-001',
                    quantity: 5,
                    unitPrice: 10,
                    totalPrice: 50
                }],
            totalAmount: 50,
            createdAt: new Date().toISOString()
        };
        strict_1.default.equal(order.status, inventory_entity_1.PurchaseOrderStatus.Draft);
        strict_1.default.equal(order.items.length, 1);
        strict_1.default.equal(order.items[0]?.totalPrice, 50);
    });
    (0, node_test_1.default)('StockAlert interface can be constructed', () => {
        const product = {
            id: 'p-1', tenantId: 't-1', name: 'Low', sku: 'L-1',
            unit: 'pcs', price: 10, cost: 5, minStock: 20, maxStock: 100,
            currentStock: 5, status: inventory_entity_1.ProductStatus.Active,
            createdAt: '', updatedAt: ''
        };
        const alert = {
            product,
            currentStock: 5,
            minStock: 20,
            maxStock: 100,
            status: 'low'
        };
        strict_1.default.equal(alert.status, 'low');
        strict_1.default.equal(alert.currentStock, 5);
    });
});
//# sourceMappingURL=inventory.entity.test.js.map