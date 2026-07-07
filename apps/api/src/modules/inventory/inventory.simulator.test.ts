import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
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

import 'reflect-metadata';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import {
  ProductStatus,
  StockRecordType,
  PurchaseOrderStatus,
  type Product,
  type StockRecord,
  type Supplier,
  type PurchaseOrder,
  type StockAlert,
} from './inventory.entity';

// ─── Simulated in-memory store ───

const simProducts = new Map<string, Product>();
const simStockRecords = new Map<string, StockRecord>();
const simSuppliers = new Map<string, Supplier>();
const simPurchaseOrders = new Map<string, PurchaseOrder>();

function resetSimState() {
  simProducts.clear();
  simStockRecords.clear();
  simSuppliers.clear();
  simPurchaseOrders.clear();
}

// ─── Simulated helpers ───

const defaultTenant = { tenantId: 't-inv-sim', brandId: 'b-inv-sim', storeId: 's-inv-sim' };

function createSimProduct(overrides: Partial<Product> = {}): Product {
  const now = new Date().toISOString();
  const product: Product = {
    id: `sim-prod-${randomUUID().slice(0, 8)}`,
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
    status: ProductStatus.Active,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
  simProducts.set(product.id, product);
  return product;
}

function createSimStockRecord(product: Product, type: StockRecordType, qty: number): StockRecord {
  const before = product.currentStock;
  const after = type === StockRecordType.Inbound ? before + qty : before - qty;
  const now = new Date().toISOString();
  const record: StockRecord = {
    id: `sim-sr-${randomUUID().slice(0, 8)}`,
    productId: product.id,
    storeId: product.storeId,
    type,
    quantity: qty,
    beforeStock: before,
    afterStock: after,
    reason: type === StockRecordType.Inbound ? '模拟入库' : '模拟出库',
    createdAt: now,
  };
  product.currentStock = after;
  product.updatedAt = now;
  simStockRecords.set(record.id, record);
  return record;
}

function createSimSupplier(overrides: Partial<Supplier> = {}): Supplier {
  const now = new Date().toISOString();
  const supplier: Supplier = {
    id: `sim-supplier-${randomUUID().slice(0, 8)}`,
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

function createSimPurchaseOrder(overrides: Partial<PurchaseOrder> = {}): PurchaseOrder {
  const now = new Date().toISOString();
  const order: PurchaseOrder = {
    id: `sim-po-${randomUUID().slice(0, 8)}`,
    tenantId: defaultTenant.tenantId,
    storeId: defaultTenant.storeId,
    status: PurchaseOrderStatus.Draft,
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
function simulateStockCheck(
  product: Product,
  requiredQty: number,
): { sufficient: boolean; shortfall: number } {
  if (product.currentStock >= requiredQty) {
    return { sufficient: true, shortfall: 0 };
  }
  return { sufficient: false, shortfall: requiredQty - product.currentStock };
}

/** 模拟库存预警 */
function simulateStockAlerts(tenantId: string, threshold?: number): StockAlert[] {
  return Array.from(simProducts.values())
    .filter((p) => p.tenantId === tenantId && p.status === ProductStatus.Active)
    .reduce<StockAlert[]>((alerts, product) => {
      const effectiveThreshold = threshold ?? product.minStock;
      if (product.currentStock <= 0) {
        alerts.push({
          product,
          currentStock: product.currentStock,
          minStock: effectiveThreshold,
          maxStock: product.maxStock,
          status: 'out_of_stock',
        });
      } else if (product.currentStock <= effectiveThreshold) {
        alerts.push({
          product,
          currentStock: product.currentStock,
          minStock: effectiveThreshold,
          maxStock: product.maxStock,
          status: 'low',
        });
      } else if (product.currentStock > product.maxStock) {
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
function simulateReceiveOrder(order: PurchaseOrder): {
  order: PurchaseOrder;
  records: StockRecord[];
} {
  const records: StockRecord[] = [];
  for (const item of order.items) {
    const product = simProducts.get(item.productId);
    if (product) {
      const record = createSimStockRecord(product, StockRecordType.Inbound, item.quantity);
      records.push(record);
    }
  }
  order.status = PurchaseOrderStatus.Received;
  order.receivedAt = new Date().toISOString();
  simPurchaseOrders.set(order.id, order);
  return { order, records };
}

// ─── Tests ───

beforeEach(() => resetSimState());

// ─── Core entity creation ───

describe('Inventory Simulator - Product', () => {
  it('should create an active product with default values', () => {
    const product = createSimProduct();
    assert.equal(product.status, ProductStatus.Active);
    assert.equal(product.tenantId, defaultTenant.tenantId);
    assert.ok(product.id.startsWith('sim-prod-'));
    assert.ok(product.createdAt);
  });

  it('should create a discontinued product', () => {
    const product = createSimProduct({ status: ProductStatus.Discontinued });
    assert.equal(product.status, ProductStatus.Discontinued);
  });

  it('should create product with specific fields', () => {
    const product = createSimProduct({
      name: '特制盲盒',
      sku: 'BLIND-001',
      price: 299,
      cost: 150,
      minStock: 5,
      maxStock: 200,
      currentStock: 80,
    });
    assert.equal(product.name, '特制盲盒');
    assert.equal(product.sku, 'BLIND-001');
    assert.equal(product.price, 299);
    assert.equal(product.currentStock, 80);
  });

  it('should create product with zero stock initially', () => {
    const product = createSimProduct({ currentStock: 0 });
    assert.equal(product.currentStock, 0);
    assert.equal(product.status, ProductStatus.Active);
  });

  it('should create product without optional fields', () => {
    const product = createSimProduct({
      category: undefined,
      barcode: undefined,
      imageUrl: undefined,
    });
    assert.equal(product.category, undefined);
    assert.equal(product.barcode, undefined);
  });
});

// ─── Stock operations ───

describe('Inventory Simulator - Stock Operations', () => {
  it('should stock in and increase product quantity', () => {
    const product = createSimProduct({ currentStock: 50 });
    const record = createSimStockRecord(product, StockRecordType.Inbound, 20);
    assert.equal(record.type, StockRecordType.Inbound);
    assert.equal(record.beforeStock, 50);
    assert.equal(record.afterStock, 70);
    assert.equal(product.currentStock, 70);
  });

  it('should stock out and decrease product quantity', () => {
    const product = createSimProduct({ currentStock: 50 });
    const record = createSimStockRecord(product, StockRecordType.Outbound, 15);
    assert.equal(record.type, StockRecordType.Outbound);
    assert.equal(record.beforeStock, 50);
    assert.equal(record.afterStock, 35);
    assert.equal(product.currentStock, 35);
  });

  it('should record stock adjustment reason', () => {
    const product = createSimProduct({ currentStock: 30 });
    const record = createSimStockRecord(product, StockRecordType.Adjustment, 5);
    assert.equal(record.type, StockRecordType.Adjustment);
    assert.ok(record.reason);
    assert.equal(record.afterStock, 25);
  });

  it('should handle stock return correctly', () => {
    const product = createSimProduct({ currentStock: 20 });
    const record = createSimStockRecord(product, StockRecordType.Return, 3);
    assert.equal(record.type, StockRecordType.Return);
    assert.equal(record.afterStock, 17);
  });

  it('should handle multiple stock operations sequentially', () => {
    const product = createSimProduct({ currentStock: 100 });
    createSimStockRecord(product, StockRecordType.Inbound, 50); // 150
    createSimStockRecord(product, StockRecordType.Outbound, 30); // 120
    createSimStockRecord(product, StockRecordType.Inbound, 20); // 140
    createSimStockRecord(product, StockRecordType.Outbound, 60); // 80
    assert.equal(product.currentStock, 80);
  });
});

// ─── Stock check ───

describe('Inventory Simulator - Stock Check', () => {
  it('should confirm sufficient stock', () => {
    const product = createSimProduct({ currentStock: 50 });
    const result = simulateStockCheck(product, 10);
    assert.equal(result.sufficient, true);
    assert.equal(result.shortfall, 0);
  });

  it('should detect insufficient stock', () => {
    const product = createSimProduct({ currentStock: 5 });
    const result = simulateStockCheck(product, 10);
    assert.equal(result.sufficient, false);
    assert.equal(result.shortfall, 5);
  });

  it('should handle exact stock match', () => {
    const product = createSimProduct({ currentStock: 10 });
    const result = simulateStockCheck(product, 10);
    assert.equal(result.sufficient, true);
  });

  it('should handle zero stock', () => {
    const product = createSimProduct({ currentStock: 0 });
    const result = simulateStockCheck(product, 1);
    assert.equal(result.sufficient, false);
    assert.equal(result.shortfall, 1);
  });

  it('should handle zero required quantity', () => {
    const product = createSimProduct({ currentStock: 0 });
    const result = simulateStockCheck(product, 0);
    assert.equal(result.sufficient, true);
  });
});

// ─── Stock alerts ───

describe('Inventory Simulator - Stock Alerts', () => {
  it('should detect low stock products', () => {
    createSimProduct({ currentStock: 3, minStock: 10 });
    createSimProduct({ currentStock: 50, minStock: 10 });
    const alerts = simulateStockAlerts(defaultTenant.tenantId);
    const low = alerts.filter((a) => a.status === 'low');
    assert.equal(low.length, 1);
    assert.equal(low[0].currentStock, 3);
  });

  it('should detect out of stock products', () => {
    createSimProduct({ currentStock: 0, minStock: 5 });
    const alerts = simulateStockAlerts(defaultTenant.tenantId);
    const oos = alerts.filter((a) => a.status === 'out_of_stock');
    assert.equal(oos.length, 1);
    assert.equal(oos[0].currentStock, 0);
  });

  it('should detect overstock products', () => {
    createSimProduct({ currentStock: 200, maxStock: 100 });
    const alerts = simulateStockAlerts(defaultTenant.tenantId);
    const over = alerts.filter((a) => a.status === 'overstock');
    assert.equal(over.length, 1);
    assert.equal(over[0].currentStock, 200);
  });

  it('should ignore discontinued products in alerts', () => {
    createSimProduct({ currentStock: 0, status: ProductStatus.Discontinued });
    const alerts = simulateStockAlerts(defaultTenant.tenantId);
    assert.equal(alerts.length, 0);
  });

  it('should apply custom threshold for low stock', () => {
    createSimProduct({ currentStock: 15, minStock: 10 });
    const alerts = simulateStockAlerts(defaultTenant.tenantId, 20);
    assert.ok(alerts.length > 0);
    assert.ok(alerts.every((a) => a.currentStock <= 20 || a.status === 'overstock'));
  });
});

// ─── Supplier ───

describe('Inventory Simulator - Supplier', () => {
  it('should create supplier with all fields', () => {
    const supplier = createSimSupplier();
    assert.ok(supplier.id.startsWith('sim-supplier-'));
    assert.equal(supplier.name, '模拟供应商');
    assert.equal(supplier.phone, '13900139000');
  });

  it('should create supplier with minimal fields', () => {
    const supplier = createSimSupplier({
      contactName: undefined,
      phone: undefined,
      email: undefined,
      address: undefined,
    });
    assert.equal(supplier.contactName, undefined);
    assert.equal(supplier.phone, undefined);
  });

  it('should create multiple suppliers with different names', () => {
    const s1 = createSimSupplier({ name: '供应商A' });
    const s2 = createSimSupplier({ name: '供应商B' });
    assert.notEqual(s1.id, s2.id);
    assert.equal(simSuppliers.size, 2);
  });
});

// ─── Purchase Order Lifecycle ───

describe('Inventory Simulator - Purchase Order', () => {
  it('should create purchase order as draft', () => {
    const order = createSimPurchaseOrder();
    assert.equal(order.status, PurchaseOrderStatus.Draft);
    assert.equal(order.items.length, 2);
    assert.equal(order.totalAmount, 550);
  });

  it('should receive purchase order and auto stock-in', () => {
    const productA = createSimProduct({ id: 'p1', name: '物料A', sku: 'MA-001', currentStock: 0 });
    const productB = createSimProduct({ id: 'p2', name: '物料B', sku: 'MB-001', currentStock: 0 });
    const order = createSimPurchaseOrder({ status: PurchaseOrderStatus.Confirmed });
    const result = simulateReceiveOrder(order);
    assert.equal(result.order.status, PurchaseOrderStatus.Received);
    assert.equal(result.records.length, 2);
    assert.equal(productA.currentStock, 10);
    assert.equal(productB.currentStock, 5);
  });

  it('should handle purchase order with zero items', () => {
    const order = createSimPurchaseOrder({ items: [], totalAmount: 0 });
    assert.equal(order.items.length, 0);
    assert.equal(order.totalAmount, 0);
  });

  it('should create purchase order with single item', () => {
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
    assert.equal(order.items.length, 1);
    assert.equal(order.totalAmount, 100);
  });

  it('should create purchase order without store and supplier', () => {
    const order = createSimPurchaseOrder({ storeId: undefined, supplierId: undefined });
    assert.equal(order.storeId, undefined);
    assert.equal(order.supplierId, undefined);
  });
});

// ─── Cross-tenant isolation ───

describe('Inventory Simulator - Tenant Isolation', () => {
  it('should not see products from other tenants', () => {
    createSimProduct({ tenantId: 't-a' });
    createSimProduct({ tenantId: 't-b' });
    const tenantAProducts = Array.from(simProducts.values()).filter((p) => p.tenantId === 't-a');
    assert.equal(tenantAProducts.length, 1);
  });

  it('stock alerts only cover own tenant', () => {
    createSimProduct({ tenantId: 't-a', currentStock: 2, minStock: 10 });
    createSimProduct({ tenantId: 't-b', currentStock: 2, minStock: 10 });
    const alertsA = simulateStockAlerts('t-a');
    const alertsB = simulateStockAlerts('t-b');
    assert.equal(alertsA.length, 1);
    assert.equal(alertsB.length, 1);
  });

  it('purchase orders isolated by tenant', () => {
    createSimPurchaseOrder({ tenantId: 't-a' });
    createSimPurchaseOrder({ tenantId: 't-b' });
    const ordersA = Array.from(simPurchaseOrders.values()).filter((o) => o.tenantId === 't-a');
    assert.equal(ordersA.length, 1);
  });
});

// ─── 8-Role scenarios ───

describe('Inventory Simulator - 8角色场景', () => {
  beforeEach(() => resetSimState());

  // 👔店长
  describe('👔店长 - 库存管理', () => {
    it('店长查看门店整体库存状况，应看到所有活跃商品及预警', () => {
      createSimProduct({ name: '畅销商品A', currentStock: 50 });
      createSimProduct({ name: '低库存商品B', currentStock: 3, minStock: 20 });
      createSimProduct({ name: '缺货商品C', currentStock: 0, minStock: 10 });
      createSimProduct({ name: '已下架商品D', status: ProductStatus.Discontinued });

      const alerts = simulateStockAlerts(defaultTenant.tenantId);
      const low = alerts.filter((a) => a.status === 'low');
      const oos = alerts.filter((a) => a.status === 'out_of_stock');

      // 店长关注：低库存商品
      assert.equal(low.length, 1);
      assert.equal(low[0].product.name, '低库存商品B');
      // 缺货商品
      assert.equal(oos.length, 1);
      assert.equal(oos[0].product.name, '缺货商品C');
      // 已下架商品不计入预警
      assert.equal(alerts.length, 2);
    });

    it('店长进行入库操作，库存应正确增加', () => {
      const product = createSimProduct({ name: '补货商品', currentStock: 10 });
      createSimStockRecord(product, StockRecordType.Inbound, 100);
      assert.equal(product.currentStock, 110);
      assert.equal(simStockRecords.size, 1);
    });
  });

  // 🛒前台
  describe('🛒前台 - 收银库存检查', () => {
    it('前台收银检查商品库存是否充足', () => {
      const product = createSimProduct({ name: '收银商品', currentStock: 5 });
      const check = simulateStockCheck(product, 3);
      assert.equal(check.sufficient, true);
    });

    it('前台收银发现库存不足时，应提示短少数量', () => {
      const product = createSimProduct({ name: '热销商品', currentStock: 2 });
      const check = simulateStockCheck(product, 5);
      assert.equal(check.sufficient, false);
      assert.equal(check.shortfall, 3);
    });
  });

  // 👥HR
  describe('👥HR - 固定资产库存', () => {
    it('HR 检查固定资产库存，应能看到所有设备类商品', () => {
      const product = createSimProduct({
        name: '办公电脑',
        category: '固定资产',
        currentStock: 20,
      });
      assert.equal(product.name, '办公电脑');
      assert.equal(product.category, '固定资产');
    });

    it('HR 进行固定资产入库登记', () => {
      const product = createSimProduct({ name: '打印机', category: '固定资产', currentStock: 5 });
      createSimStockRecord(product, StockRecordType.Inbound, 3);
      assert.equal(product.currentStock, 8);
    });
  });

  // 🔧安监
  describe('🔧安监 - 安全设备库存审计', () => {
    it('安监检查消防设备库存，应确保不低于安全阈值', () => {
      const product = createSimProduct({
        name: '灭火器',
        category: '安全设备',
        currentStock: 50,
        minStock: 20,
      });
      const check = simulateStockCheck(product, 20);
      assert.equal(check.sufficient, true);
    });

    it('安监发现安全设备库存不足，发布预警', () => {
      createSimProduct({ name: '安全帽', category: '安全设备', currentStock: 3, minStock: 30 });
      const alerts = simulateStockAlerts(defaultTenant.tenantId, 30);
      assert.ok(alerts.length > 0);
      assert.ok(alerts.some((a) => a.product.category === '安全设备' && a.status === 'low'));
    });
  });

  // 🎮导玩员
  describe('🎮导玩员 - 盲盒礼品库存', () => {
    it('导玩员检查盲盒库存', () => {
      const product = createSimProduct({ name: '限量盲盒', category: '盲盒', currentStock: 200 });
      assert.equal(product.currentStock, 200);
    });

    it('导玩员进行盲盒出库（顾客兑换）', () => {
      const product = createSimProduct({ name: '普通盲盒', category: '盲盒', currentStock: 100 });
      createSimStockRecord(product, StockRecordType.Outbound, 1);
      assert.equal(product.currentStock, 99);
    });
  });

  // 🎯运行专员
  describe('🎯运行专员 - 运维库存监控', () => {
    it('运行专员查看所有库存状态，关注异常', () => {
      createSimProduct({ name: '耗材A', currentStock: 500, maxStock: 300 });
      createSimProduct({ name: '耗材B', currentStock: 2, minStock: 50 });
      const alerts = simulateStockAlerts(defaultTenant.tenantId);
      const overstock = alerts.filter((a) => a.status === 'overstock');
      const low = alerts.filter((a) => a.status === 'low');
      assert.equal(overstock.length, 1);
      assert.equal(low.length, 1);
    });

    it('运行专员执行采购收货，库存自动更新', () => {
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
        status: PurchaseOrderStatus.Confirmed,
      });
      simulateReceiveOrder(order);
      assert.equal(product.currentStock, 50);
    });
  });

  // 🤝团建
  describe('🤝团建 - 活动物料库存', () => {
    it('团建确认活动物料库存充足', () => {
      createSimProduct({ name: '团建T恤', currentStock: 30 });
      createSimProduct({ name: '活动横幅', currentStock: 5 });
      const check = Array.from(simProducts.values()).every((p) => p.currentStock > 0);
      assert.equal(check, true);
    });

    it('团建发现物料不足时发起申请采购', () => {
      const product = createSimProduct({ name: '活动礼品', currentStock: 0 });
      const check = simulateStockCheck(product, 50);
      assert.equal(check.sufficient, false);
      assert.equal(check.shortfall, 50);
    });
  });

  // 📢营销
  describe('📢营销 - 营销赠品库存', () => {
    it('营销检查赠品库存用于活动规划', () => {
      const product = createSimProduct({ name: '促销赠品', currentStock: 200 });
      assert.ok(product.currentStock >= 100, '赠品库存至少满足百人活动');
    });

    it('营销查看缺货赠品以便补充', () => {
      createSimProduct({ name: '限量赠品A', currentStock: 0 });
      createSimProduct({ name: '限量赠品B', currentStock: 50 });
      const oos = Array.from(simProducts.values()).filter((p) => p.currentStock === 0);
      assert.equal(oos.length, 1);
      assert.equal(oos[0].name, '限量赠品A');
    });
  });
});

// ─── Edge cases ───

describe('Inventory Simulator - Edge Cases', () => {
  it('should handle empty product store', () => {
    const alerts = simulateStockAlerts(defaultTenant.tenantId);
    assert.equal(alerts.length, 0);
  });

  it('should handle negative current stock', () => {
    const product = createSimProduct({ currentStock: -5 });
    createSimStockRecord(product, StockRecordType.Inbound, 10);
    assert.equal(product.currentStock, 5);
  });

  it('should handle large quantity stock operations', () => {
    const product = createSimProduct({ currentStock: 0 });
    createSimStockRecord(product, StockRecordType.Inbound, 999999);
    assert.equal(product.currentStock, 999999);
  });

  it('should handle receiving same purchase order twice', () => {
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
      status: PurchaseOrderStatus.Confirmed,
    });
    simulateReceiveOrder(order);
    // Second receive - order already received, should still process
    const second = simulateReceiveOrder(order);
    assert.equal(product.currentStock, 20);
  });
});
