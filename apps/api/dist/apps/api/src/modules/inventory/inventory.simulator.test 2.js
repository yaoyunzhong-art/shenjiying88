"use strict";
/**
 * Inventory Simulator Test
 *
 * 模拟库存管理的场景覆盖：
 * - 商品 CRUD 全流程
 * - 入库/出库/盘点库存操作
 * - 供应商管理
 * - 采购单生命周期
 * - 库存预警
 * - 库存不足检查
 *
 * 8 角色视角覆盖：
 *  👔店长 - 查看门店整体库存状况
 *  🛒前台 - 收银时检查商品库存
 *  👥HR - 检查固定资产库存
 *  🔧安监 - 安全设备库存审计
 *  🎮导玩员 - 盲盒/礼品库存检查
 *  🎯运行专员 - 运维库存监控
 *  🤝团建 - 活动物料库存检查
 *  📢营销 - 营销活动赠品库存检查
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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importStar(require("node:test"));
const node_crypto_1 = require("node:crypto");
const inventory_entity_1 = require("./inventory.entity");
// ─── Simulated in-memory store ───
const simProducts = new Map();
const simStockRecords = new Map();
const simSuppliers = new Map();
const simPurchaseOrders = new Map();
function resetSimState() {
    simProducts.clear();
    simStockRecords.clear();
    simSuppliers.clear();
    simPurchaseOrders.clear();
}
// ─── Simulated helpers ───
const defaultTenant = { tenantId: 't-inv-sim', brandId: 'b-inv-sim', storeId: 's-inv-sim' };
function createSimProduct(overrides = {}) {
    const now = new Date().toISOString();
    const product = {
        id: `sim-prod-${(0, node_crypto_1.randomUUID)().slice(0, 8)}`,
        tenantId: defaultTenant.tenantId,
        brandId: defaultTenant.brandId,
        storeId: defaultTenant.storeId,
        name: '模拟商品',
        sku: `SIM-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        category: '通用',
        unit: '个',
        price: 50,
        cost: 30,
        minStock: 10,
        maxStock: 100,
        currentStock: 50,
        status: inventory_entity_1.ProductStatus.Active,
        createdAt: now,
        updatedAt: now,
        ...overrides,
    };
    simProducts.set(product.id, product);
    return product;
}
function createSimStockRecord(product, type, qty) {
    const before = product.currentStock;
    const after = type === inventory_entity_1.StockRecordType.Inbound ? before + qty : before - qty;
    const now = new Date().toISOString();
    const record = {
        id: `sim-sr-${(0, node_crypto_1.randomUUID)().slice(0, 8)}`,
        productId: product.id,
        storeId: product.storeId,
        type,
        quantity: qty,
        beforeStock: before,
        afterStock: after,
        reason: type === inventory_entity_1.StockRecordType.Inbound ? '模拟入库' : '模拟出库',
        createdAt: now,
    };
    product.currentStock = after;
    product.updatedAt = now;
    simStockRecords.set(record.id, record);
    return record;
}
function createSimSupplier(overrides = {}) {
    const now = new Date().toISOString();
    const supplier = {
        id: `sim-supplier-${(0, node_crypto_1.randomUUID)().slice(0, 8)}`,
        tenantId: defaultTenant.tenantId,
        name: '模拟供应商',
        contactName: '李四',
        phone: '13900139000',
        email: 'lisi@supplier.com',
        address: '上海市徐汇区',
        createdAt: now,
        ...overrides,
    };
    simSuppliers.set(supplier.id, supplier);
    return supplier;
}
function createSimPurchaseOrder(overrides = {}) {
    const now = new Date().toISOString();
    const order = {
        id: `sim-po-${(0, node_crypto_1.randomUUID)().slice(0, 8)}`,
        tenantId: defaultTenant.tenantId,
        storeId: defaultTenant.storeId,
        status: inventory_entity_1.PurchaseOrderStatus.Draft,
        items: [
            {
                productId: 'p1',
                productName: '物料A',
                sku: 'MA-001',
                quantity: 10,
                unitPrice: 30,
                totalPrice: 300,
            },
            {
                productId: 'p2',
                productName: '物料B',
                sku: 'MB-001',
                quantity: 5,
                unitPrice: 50,
                totalPrice: 250,
            },
        ],
        totalAmount: 550,
        createdAt: now,
        ...overrides,
    };
    simPurchaseOrders.set(order.id, order);
    return order;
}
/** 模拟库存不足检查 */
function simulateStockCheck(product, requiredQty) {
    if (product.currentStock >= requiredQty) {
        return { sufficient: true, shortfall: 0 };
    }
    return { sufficient: false, shortfall: requiredQty - product.currentStock };
}
/** 模拟库存预警 */
function simulateStockAlerts(tenantId, threshold) {
    return Array.from(simProducts.values())
        .filter((p) => p.tenantId === tenantId && p.status === inventory_entity_1.ProductStatus.Active)
        .reduce((alerts, product) => {
        const effectiveThreshold = threshold ?? product.minStock;
        if (product.currentStock <= 0) {
            alerts.push({
                product,
                currentStock: product.currentStock,
                minStock: effectiveThreshold,
                maxStock: product.maxStock,
                status: 'out_of_stock',
            });
        }
        else if (product.currentStock <= effectiveThreshold) {
            alerts.push({
                product,
                currentStock: product.currentStock,
                minStock: effectiveThreshold,
                maxStock: product.maxStock,
                status: 'low',
            });
        }
        else if (product.currentStock > product.maxStock) {
            alerts.push({
                product,
                currentStock: product.currentStock,
                minStock: effectiveThreshold,
                maxStock: product.maxStock,
                status: 'overstock',
            });
        }
        return alerts;
    }, []);
}
/** 模拟采购收货（自动入库） */
function simulateReceiveOrder(order) {
    const records = [];
    for (const item of order.items) {
        const product = simProducts.get(item.productId);
        if (product) {
            const record = createSimStockRecord(product, inventory_entity_1.StockRecordType.Inbound, item.quantity);
            records.push(record);
        }
    }
    order.status = inventory_entity_1.PurchaseOrderStatus.Received;
    order.receivedAt = new Date().toISOString();
    simPurchaseOrders.set(order.id, order);
    return { order, records };
}
// ─── Tests ───
node_test_1.default.beforeEach(() => resetSimState());
// ─── Core entity creation ───
(0, node_test_1.describe)('Inventory Simulator - Product', () => {
    (0, node_test_1.default)('should create an active product with default values', () => {
        const product = createSimProduct();
        strict_1.default.equal(product.status, inventory_entity_1.ProductStatus.Active);
        strict_1.default.equal(product.tenantId, defaultTenant.tenantId);
        strict_1.default.ok(product.id.startsWith('sim-prod-'));
        strict_1.default.ok(product.createdAt);
    });
    (0, node_test_1.default)('should create a discontinued product', () => {
        const product = createSimProduct({ status: inventory_entity_1.ProductStatus.Discontinued });
        strict_1.default.equal(product.status, inventory_entity_1.ProductStatus.Discontinued);
    });
    (0, node_test_1.default)('should create product with specific fields', () => {
        const product = createSimProduct({
            name: '特制盲盒',
            sku: 'BLIND-001',
            price: 299,
            cost: 150,
            minStock: 5,
            maxStock: 200,
            currentStock: 80,
        });
        strict_1.default.equal(product.name, '特制盲盒');
        strict_1.default.equal(product.sku, 'BLIND-001');
        strict_1.default.equal(product.price, 299);
        strict_1.default.equal(product.currentStock, 80);
    });
    (0, node_test_1.default)('should create product with zero stock initially', () => {
        const product = createSimProduct({ currentStock: 0 });
        strict_1.default.equal(product.currentStock, 0);
        strict_1.default.equal(product.status, inventory_entity_1.ProductStatus.Active);
    });
    (0, node_test_1.default)('should create product without optional fields', () => {
        const product = createSimProduct({
            category: undefined,
            barcode: undefined,
            imageUrl: undefined,
        });
        strict_1.default.equal(product.category, undefined);
        strict_1.default.equal(product.barcode, undefined);
    });
});
// ─── Stock operations ───
(0, node_test_1.describe)('Inventory Simulator - Stock Operations', () => {
    (0, node_test_1.default)('should stock in and increase product quantity', () => {
        const product = createSimProduct({ currentStock: 50 });
        const record = createSimStockRecord(product, inventory_entity_1.StockRecordType.Inbound, 20);
        strict_1.default.equal(record.type, inventory_entity_1.StockRecordType.Inbound);
        strict_1.default.equal(record.beforeStock, 50);
        strict_1.default.equal(record.afterStock, 70);
        strict_1.default.equal(product.currentStock, 70);
    });
    (0, node_test_1.default)('should stock out and decrease product quantity', () => {
        const product = createSimProduct({ currentStock: 50 });
        const record = createSimStockRecord(product, inventory_entity_1.StockRecordType.Outbound, 15);
        strict_1.default.equal(record.type, inventory_entity_1.StockRecordType.Outbound);
        strict_1.default.equal(record.beforeStock, 50);
        strict_1.default.equal(record.afterStock, 35);
        strict_1.default.equal(product.currentStock, 35);
    });
    (0, node_test_1.default)('should record stock adjustment reason', () => {
        const product = createSimProduct({ currentStock: 30 });
        const record = createSimStockRecord(product, inventory_entity_1.StockRecordType.Adjustment, 5);
        strict_1.default.equal(record.type, inventory_entity_1.StockRecordType.Adjustment);
        strict_1.default.ok(record.reason);
        strict_1.default.equal(record.afterStock, 25);
    });
    (0, node_test_1.default)('should handle stock return correctly', () => {
        const product = createSimProduct({ currentStock: 20 });
        const record = createSimStockRecord(product, inventory_entity_1.StockRecordType.Return, 3);
        strict_1.default.equal(record.type, inventory_entity_1.StockRecordType.Return);
        strict_1.default.equal(record.afterStock, 17);
    });
    (0, node_test_1.default)('should handle multiple stock operations sequentially', () => {
        const product = createSimProduct({ currentStock: 100 });
        createSimStockRecord(product, inventory_entity_1.StockRecordType.Inbound, 50); // 150
        createSimStockRecord(product, inventory_entity_1.StockRecordType.Outbound, 30); // 120
        createSimStockRecord(product, inventory_entity_1.StockRecordType.Inbound, 20); // 140
        createSimStockRecord(product, inventory_entity_1.StockRecordType.Outbound, 60); // 80
        strict_1.default.equal(product.currentStock, 80);
    });
});
// ─── Stock check ───
(0, node_test_1.describe)('Inventory Simulator - Stock Check', () => {
    (0, node_test_1.default)('should confirm sufficient stock', () => {
        const product = createSimProduct({ currentStock: 50 });
        const result = simulateStockCheck(product, 10);
        strict_1.default.equal(result.sufficient, true);
        strict_1.default.equal(result.shortfall, 0);
    });
    (0, node_test_1.default)('should detect insufficient stock', () => {
        const product = createSimProduct({ currentStock: 5 });
        const result = simulateStockCheck(product, 10);
        strict_1.default.equal(result.sufficient, false);
        strict_1.default.equal(result.shortfall, 5);
    });
    (0, node_test_1.default)('should handle exact stock match', () => {
        const product = createSimProduct({ currentStock: 10 });
        const result = simulateStockCheck(product, 10);
        strict_1.default.equal(result.sufficient, true);
    });
    (0, node_test_1.default)('should handle zero stock', () => {
        const product = createSimProduct({ currentStock: 0 });
        const result = simulateStockCheck(product, 1);
        strict_1.default.equal(result.sufficient, false);
        strict_1.default.equal(result.shortfall, 1);
    });
    (0, node_test_1.default)('should handle zero required quantity', () => {
        const product = createSimProduct({ currentStock: 0 });
        const result = simulateStockCheck(product, 0);
        strict_1.default.equal(result.sufficient, true);
    });
});
// ─── Stock alerts ───
(0, node_test_1.describe)('Inventory Simulator - Stock Alerts', () => {
    (0, node_test_1.default)('should detect low stock products', () => {
        createSimProduct({ currentStock: 3, minStock: 10 });
        createSimProduct({ currentStock: 50, minStock: 10 });
        const alerts = simulateStockAlerts(defaultTenant.tenantId);
        const low = alerts.filter((a) => a.status === 'low');
        strict_1.default.equal(low.length, 1);
        strict_1.default.equal(low[0].currentStock, 3);
    });
    (0, node_test_1.default)('should detect out of stock products', () => {
        createSimProduct({ currentStock: 0, minStock: 5 });
        const alerts = simulateStockAlerts(defaultTenant.tenantId);
        const oos = alerts.filter((a) => a.status === 'out_of_stock');
        strict_1.default.equal(oos.length, 1);
        strict_1.default.equal(oos[0].currentStock, 0);
    });
    (0, node_test_1.default)('should detect overstock products', () => {
        createSimProduct({ currentStock: 200, maxStock: 100 });
        const alerts = simulateStockAlerts(defaultTenant.tenantId);
        const over = alerts.filter((a) => a.status === 'overstock');
        strict_1.default.equal(over.length, 1);
        strict_1.default.equal(over[0].currentStock, 200);
    });
    (0, node_test_1.default)('should ignore discontinued products in alerts', () => {
        createSimProduct({ currentStock: 0, status: inventory_entity_1.ProductStatus.Discontinued });
        const alerts = simulateStockAlerts(defaultTenant.tenantId);
        strict_1.default.equal(alerts.length, 0);
    });
    (0, node_test_1.default)('should apply custom threshold for low stock', () => {
        createSimProduct({ currentStock: 15, minStock: 10 });
        const alerts = simulateStockAlerts(defaultTenant.tenantId, 20);
        strict_1.default.ok(alerts.length > 0);
        strict_1.default.ok(alerts.every((a) => a.currentStock <= 20 || a.status === 'overstock'));
    });
});
// ─── Supplier ───
(0, node_test_1.describe)('Inventory Simulator - Supplier', () => {
    (0, node_test_1.default)('should create supplier with all fields', () => {
        const supplier = createSimSupplier();
        strict_1.default.ok(supplier.id.startsWith('sim-supplier-'));
        strict_1.default.equal(supplier.name, '模拟供应商');
        strict_1.default.equal(supplier.phone, '13900139000');
    });
    (0, node_test_1.default)('should create supplier with minimal fields', () => {
        const supplier = createSimSupplier({
            contactName: undefined,
            phone: undefined,
            email: undefined,
            address: undefined,
        });
        strict_1.default.equal(supplier.contactName, undefined);
        strict_1.default.equal(supplier.phone, undefined);
    });
    (0, node_test_1.default)('should create multiple suppliers with different names', () => {
        const s1 = createSimSupplier({ name: '供应商A' });
        const s2 = createSimSupplier({ name: '供应商B' });
        strict_1.default.notEqual(s1.id, s2.id);
        strict_1.default.equal(simSuppliers.size, 2);
    });
});
// ─── Purchase Order Lifecycle ───
(0, node_test_1.describe)('Inventory Simulator - Purchase Order', () => {
    (0, node_test_1.default)('should create purchase order as draft', () => {
        const order = createSimPurchaseOrder();
        strict_1.default.equal(order.status, inventory_entity_1.PurchaseOrderStatus.Draft);
        strict_1.default.equal(order.items.length, 2);
        strict_1.default.equal(order.totalAmount, 550);
    });
    (0, node_test_1.default)('should receive purchase order and auto stock-in', () => {
        const productA = createSimProduct({ id: 'p1', name: '物料A', sku: 'MA-001', currentStock: 0 });
        const productB = createSimProduct({ id: 'p2', name: '物料B', sku: 'MB-001', currentStock: 0 });
        const order = createSimPurchaseOrder({ status: inventory_entity_1.PurchaseOrderStatus.Confirmed });
        const result = simulateReceiveOrder(order);
        strict_1.default.equal(result.order.status, inventory_entity_1.PurchaseOrderStatus.Received);
        strict_1.default.equal(result.records.length, 2);
        strict_1.default.equal(productA.currentStock, 10);
        strict_1.default.equal(productB.currentStock, 5);
    });
    (0, node_test_1.default)('should handle purchase order with zero items', () => {
        const order = createSimPurchaseOrder({ items: [], totalAmount: 0 });
        strict_1.default.equal(order.items.length, 0);
        strict_1.default.equal(order.totalAmount, 0);
    });
    (0, node_test_1.default)('should create purchase order with single item', () => {
        const order = createSimPurchaseOrder({
            items: [
                {
                    productId: 'p1',
                    productName: '单品',
                    sku: 'SINGLE-001',
                    quantity: 1,
                    unitPrice: 100,
                    totalPrice: 100,
                },
            ],
            totalAmount: 100,
        });
        strict_1.default.equal(order.items.length, 1);
        strict_1.default.equal(order.totalAmount, 100);
    });
    (0, node_test_1.default)('should create purchase order without store and supplier', () => {
        const order = createSimPurchaseOrder({ storeId: undefined, supplierId: undefined });
        strict_1.default.equal(order.storeId, undefined);
        strict_1.default.equal(order.supplierId, undefined);
    });
});
// ─── Cross-tenant isolation ───
(0, node_test_1.describe)('Inventory Simulator - Tenant Isolation', () => {
    (0, node_test_1.default)('should not see products from other tenants', () => {
        createSimProduct({ tenantId: 't-a' });
        createSimProduct({ tenantId: 't-b' });
        const tenantAProducts = Array.from(simProducts.values()).filter((p) => p.tenantId === 't-a');
        strict_1.default.equal(tenantAProducts.length, 1);
    });
    (0, node_test_1.default)('stock alerts only cover own tenant', () => {
        createSimProduct({ tenantId: 't-a', currentStock: 2, minStock: 10 });
        createSimProduct({ tenantId: 't-b', currentStock: 2, minStock: 10 });
        const alertsA = simulateStockAlerts('t-a');
        const alertsB = simulateStockAlerts('t-b');
        strict_1.default.equal(alertsA.length, 1);
        strict_1.default.equal(alertsB.length, 1);
    });
    (0, node_test_1.default)('purchase orders isolated by tenant', () => {
        createSimPurchaseOrder({ tenantId: 't-a' });
        createSimPurchaseOrder({ tenantId: 't-b' });
        const ordersA = Array.from(simPurchaseOrders.values()).filter((o) => o.tenantId === 't-a');
        strict_1.default.equal(ordersA.length, 1);
    });
});
// ─── 8-Role scenarios ───
(0, node_test_1.describe)('Inventory Simulator - 8角色场景', () => {
    node_test_1.default.beforeEach(() => resetSimState());
    // 👔店长
    (0, node_test_1.describe)('👔店长 - 库存管理', () => {
        (0, node_test_1.default)('店长查看门店整体库存状况，应看到所有活跃商品及预警', () => {
            createSimProduct({ name: '畅销商品A', currentStock: 50 });
            createSimProduct({ name: '低库存商品B', currentStock: 3, minStock: 20 });
            createSimProduct({ name: '缺货商品C', currentStock: 0, minStock: 10 });
            createSimProduct({ name: '已下架商品D', status: inventory_entity_1.ProductStatus.Discontinued });
            const alerts = simulateStockAlerts(defaultTenant.tenantId);
            const low = alerts.filter((a) => a.status === 'low');
            const oos = alerts.filter((a) => a.status === 'out_of_stock');
            // 店长关注：低库存商品
            strict_1.default.equal(low.length, 1);
            strict_1.default.equal(low[0].product.name, '低库存商品B');
            // 缺货商品
            strict_1.default.equal(oos.length, 1);
            strict_1.default.equal(oos[0].product.name, '缺货商品C');
            // 已下架商品不计入预警
            strict_1.default.equal(alerts.length, 2);
        });
        (0, node_test_1.default)('店长进行入库操作，库存应正确增加', () => {
            const product = createSimProduct({ name: '补货商品', currentStock: 10 });
            createSimStockRecord(product, inventory_entity_1.StockRecordType.Inbound, 100);
            strict_1.default.equal(product.currentStock, 110);
            strict_1.default.equal(simStockRecords.size, 1);
        });
    });
    // 🛒前台
    (0, node_test_1.describe)('🛒前台 - 收银库存检查', () => {
        (0, node_test_1.default)('前台收银检查商品库存是否充足', () => {
            const product = createSimProduct({ name: '收银商品', currentStock: 5 });
            const check = simulateStockCheck(product, 3);
            strict_1.default.equal(check.sufficient, true);
        });
        (0, node_test_1.default)('前台收银发现库存不足时，应提示短少数量', () => {
            const product = createSimProduct({ name: '热销商品', currentStock: 2 });
            const check = simulateStockCheck(product, 5);
            strict_1.default.equal(check.sufficient, false);
            strict_1.default.equal(check.shortfall, 3);
        });
    });
    // 👥HR
    (0, node_test_1.describe)('👥HR - 固定资产库存', () => {
        (0, node_test_1.default)('HR 检查固定资产库存，应能看到所有设备类商品', () => {
            const product = createSimProduct({
                name: '办公电脑',
                category: '固定资产',
                currentStock: 20,
            });
            strict_1.default.equal(product.name, '办公电脑');
            strict_1.default.equal(product.category, '固定资产');
        });
        (0, node_test_1.default)('HR 进行固定资产入库登记', () => {
            const product = createSimProduct({ name: '打印机', category: '固定资产', currentStock: 5 });
            createSimStockRecord(product, inventory_entity_1.StockRecordType.Inbound, 3);
            strict_1.default.equal(product.currentStock, 8);
        });
    });
    // 🔧安监
    (0, node_test_1.describe)('🔧安监 - 安全设备库存审计', () => {
        (0, node_test_1.default)('安监检查消防设备库存，应确保不低于安全阈值', () => {
            const product = createSimProduct({
                name: '灭火器',
                category: '安全设备',
                currentStock: 50,
                minStock: 20,
            });
            const check = simulateStockCheck(product, 20);
            strict_1.default.equal(check.sufficient, true);
        });
        (0, node_test_1.default)('安监发现安全设备库存不足，发布预警', () => {
            createSimProduct({ name: '安全帽', category: '安全设备', currentStock: 3, minStock: 30 });
            const alerts = simulateStockAlerts(defaultTenant.tenantId, 30);
            strict_1.default.ok(alerts.length > 0);
            strict_1.default.ok(alerts.some((a) => a.product.category === '安全设备' && a.status === 'low'));
        });
    });
    // 🎮导玩员
    (0, node_test_1.describe)('🎮导玩员 - 盲盒礼品库存', () => {
        (0, node_test_1.default)('导玩员检查盲盒库存', () => {
            const product = createSimProduct({ name: '限量盲盒', category: '盲盒', currentStock: 200 });
            strict_1.default.equal(product.currentStock, 200);
        });
        (0, node_test_1.default)('导玩员进行盲盒出库（顾客兑换）', () => {
            const product = createSimProduct({ name: '普通盲盒', category: '盲盒', currentStock: 100 });
            createSimStockRecord(product, inventory_entity_1.StockRecordType.Outbound, 1);
            strict_1.default.equal(product.currentStock, 99);
        });
    });
    // 🎯运行专员
    (0, node_test_1.describe)('🎯运行专员 - 运维库存监控', () => {
        (0, node_test_1.default)('运行专员查看所有库存状态，关注异常', () => {
            createSimProduct({ name: '耗材A', currentStock: 500, maxStock: 300 });
            createSimProduct({ name: '耗材B', currentStock: 2, minStock: 50 });
            const alerts = simulateStockAlerts(defaultTenant.tenantId);
            const overstock = alerts.filter((a) => a.status === 'overstock');
            const low = alerts.filter((a) => a.status === 'low');
            strict_1.default.equal(overstock.length, 1);
            strict_1.default.equal(low.length, 1);
        });
        (0, node_test_1.default)('运行专员执行采购收货，库存自动更新', () => {
            const product = createSimProduct({ id: 'p-po-item', name: '补货品', currentStock: 0 });
            const order = createSimPurchaseOrder({
                items: [
                    {
                        productId: 'p-po-item',
                        productName: '补货品',
                        sku: 'RE-001',
                        quantity: 50,
                        unitPrice: 10,
                        totalPrice: 500,
                    },
                ],
                totalAmount: 500,
                status: inventory_entity_1.PurchaseOrderStatus.Confirmed,
            });
            simulateReceiveOrder(order);
            strict_1.default.equal(product.currentStock, 50);
        });
    });
    // 🤝团建
    (0, node_test_1.describe)('🤝团建 - 活动物料库存', () => {
        (0, node_test_1.default)('团建确认活动物料库存充足', () => {
            createSimProduct({ name: '团建T恤', currentStock: 30 });
            createSimProduct({ name: '活动横幅', currentStock: 5 });
            const check = Array.from(simProducts.values()).every((p) => p.currentStock > 0);
            strict_1.default.equal(check, true);
        });
        (0, node_test_1.default)('团建发现物料不足时发起申请采购', () => {
            const product = createSimProduct({ name: '活动礼品', currentStock: 0 });
            const check = simulateStockCheck(product, 50);
            strict_1.default.equal(check.sufficient, false);
            strict_1.default.equal(check.shortfall, 50);
        });
    });
    // 📢营销
    (0, node_test_1.describe)('📢营销 - 营销赠品库存', () => {
        (0, node_test_1.default)('营销检查赠品库存用于活动规划', () => {
            const product = createSimProduct({ name: '促销赠品', currentStock: 200 });
            strict_1.default.ok(product.currentStock >= 100, '赠品库存至少满足百人活动');
        });
        (0, node_test_1.default)('营销查看缺货赠品以便补充', () => {
            createSimProduct({ name: '限量赠品A', currentStock: 0 });
            createSimProduct({ name: '限量赠品B', currentStock: 50 });
            const oos = Array.from(simProducts.values()).filter((p) => p.currentStock === 0);
            strict_1.default.equal(oos.length, 1);
            strict_1.default.equal(oos[0].name, '限量赠品A');
        });
    });
});
// ─── Edge cases ───
(0, node_test_1.describe)('Inventory Simulator - Edge Cases', () => {
    (0, node_test_1.default)('should handle empty product store', () => {
        const alerts = simulateStockAlerts(defaultTenant.tenantId);
        strict_1.default.equal(alerts.length, 0);
    });
    (0, node_test_1.default)('should handle negative current stock', () => {
        const product = createSimProduct({ currentStock: -5 });
        createSimStockRecord(product, inventory_entity_1.StockRecordType.Inbound, 10);
        strict_1.default.equal(product.currentStock, 5);
    });
    (0, node_test_1.default)('should handle large quantity stock operations', () => {
        const product = createSimProduct({ currentStock: 0 });
        createSimStockRecord(product, inventory_entity_1.StockRecordType.Inbound, 999999);
        strict_1.default.equal(product.currentStock, 999999);
    });
    (0, node_test_1.default)('should handle receiving same purchase order twice', () => {
        const product = createSimProduct({ id: 'p-dup', name: '重复收货', currentStock: 0 });
        const order = createSimPurchaseOrder({
            items: [
                {
                    productId: 'p-dup',
                    productName: '重复收货',
                    sku: 'DUP-01',
                    quantity: 10,
                    unitPrice: 10,
                    totalPrice: 100,
                },
            ],
            totalAmount: 100,
            status: inventory_entity_1.PurchaseOrderStatus.Confirmed,
        });
        simulateReceiveOrder(order);
        // Second receive - order already received, should still process
        const second = simulateReceiveOrder(order);
        strict_1.default.equal(product.currentStock, 20);
    });
});
//# sourceMappingURL=inventory.simulator.test%202.js.map