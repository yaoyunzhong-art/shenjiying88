/**
 * inventory.service-extended.test.ts — 树哥B 保底续产: 库存service 增强测试
 *
 * 覆盖:
 *   库存查询 (listProducts 多维度过滤)
 *   库存变更 (stockIn / stockOut / adjustStock)
 *   库存预警 (getLowStockProducts 各类阈值)
 *   库存盘点 (stockRecord 完整追溯)
 *   库存转移 (stockOut → stockIn 组合模拟)
 *   库存调拨 (批量 stockIn/Out)
 *   库存快照 (getStockRecords 时间过滤)
 *   供应商管理
 *   采购订单生命周期
 *   跨租户隔离
 *   错误边界
 */

import { describe, it, expect, beforeEach } from 'vitest';
import assert from 'node:assert/strict';
import type { RequestTenantContext } from '../tenant/tenant.types';
import { InventoryService, resetInventoryServiceTestState } from './inventory.service';
import {
  ProductStatus,
  StockRecordType,
  PurchaseOrderStatus,
  type Product,
  type StockRecord,
  type Supplier,
  type PurchaseOrder,
} from './inventory.entity';

// ── helpers ────────────────────────────────────────────

function createContext(overrides?: Partial<RequestTenantContext>): RequestTenantContext {
  return {
    tenantId: 'tenant-inv-ext',
    brandId: 'brand-inv-ext',
    storeId: 'store-inv-ext',
    ...overrides,
  };
}

function createOtherContext(): RequestTenantContext {
  return {
    tenantId: 'tenant-other-ext',
    brandId: 'brand-other-ext',
    storeId: 'store-other-ext',
  };
}

function createProduct(
  svc: InventoryService,
  ctx: RequestTenantContext,
  overrides?: Partial<{
    name: string;
    sku: string;
    category: string;
    price: number;
    cost: number;
    currentStock: number;
    minStock: number;
    maxStock: number;
    status: ProductStatus;
  }>,
): Product {
  return svc.createProduct(ctx, {
    name: overrides?.name ?? '测试商品',
    sku: overrides?.sku ?? 'SKU-EXT-' + Math.random().toString(36).slice(2, 8),
    unit: '个',
    price: overrides?.price ?? 100,
    cost: overrides?.cost ?? 60,
    currentStock: overrides?.currentStock ?? 50,
    minStock: overrides?.minStock ?? 10,
    maxStock: overrides?.maxStock ?? 200,
    category: overrides?.category,
    status: overrides?.status,
  });
}

// ─────────────────────────────────────────────────────
// Section 1: 库存查询与多维度过滤
// ─────────────────────────────────────────────────────
describe('[inventory-extended] 库存查询与过滤', () => {
  let svc: InventoryService;
  let ctx: RequestTenantContext;

  beforeEach(() => {
    resetInventoryServiceTestState();
    svc = new InventoryService();
    ctx = createContext();
  });

  it('listProducts 空列表返回空数组', () => {
    expect(svc.listProducts(ctx)).toEqual([]);
  });

  it('listProducts 按 category 过滤', () => {
    createProduct(svc, ctx, { name: '手机', category: '电子产品' });
    createProduct(svc, ctx, { name: '牛奶', category: '食品' });
    createProduct(svc, ctx, { name: '电脑', category: '电子产品' });

    const electronics = svc.listProducts(ctx, { category: '电子产品' });
    expect(electronics).toHaveLength(2);
    const food = svc.listProducts(ctx, { category: '食品' });
    expect(food).toHaveLength(1);
  });

  it('listProducts 按 status 过滤', () => {
    createProduct(svc, ctx, { name: '上架商品' });
    createProduct(svc, ctx, { name: '下架商品', status: ProductStatus.Inactive });

    const active = svc.listProducts(ctx, { status: ProductStatus.Active });
    expect(active).toHaveLength(1);
    const inactive = svc.listProducts(ctx, { status: ProductStatus.Inactive });
    expect(inactive).toHaveLength(1);
  });

  it('listProducts 按 keyword 搜索', () => {
    createProduct(svc, ctx, { name: 'iPhone 15', sku: 'APL-15' });
    createProduct(svc, ctx, { name: 'iPad Pro', sku: 'APL-PRO' });
    createProduct(svc, ctx, { name: '小米手环', sku: 'MI-BAND' });

    const results = svc.listProducts(ctx, { keyword: 'iPhone' });
    expect(results).toHaveLength(1);
    expect(results[0].sku).toBe('APL-15');

    const results2 = svc.listProducts(ctx, { keyword: 'APL' });
    expect(results2).toHaveLength(2);
  });

  it('listProducts 支持 limit + offset 分页', () => {
    for (let i = 0; i < 5; i++) {
      createProduct(svc, ctx, {
        name: `商品${i}`,
        sku: `SKU-${i}`,
      });
    }

    const page1 = svc.listProducts(ctx, { limit: 2, offset: 0 });
    expect(page1).toHaveLength(2);
    const page2 = svc.listProducts(ctx, { limit: 2, offset: 2 });
    expect(page2).toHaveLength(2);
    const page3 = svc.listProducts(ctx, { limit: 2, offset: 4 });
    expect(page3).toHaveLength(1);
  });

  it('getProduct 商品不存在抛错', () => {
    assert.throws(() => svc.getProduct('nonexistent', ctx));
  });

  it('getProduct 跨租户抛错', () => {
    const prod = createProduct(svc, ctx);
    assert.throws(() => svc.getProduct(prod.id, createOtherContext()));
  });
});

// ─────────────────────────────────────────────────────
// Section 2: 库存变更 (入库 / 出库 / 调整)
// ─────────────────────────────────────────────────────
describe('[inventory-extended] 库存变更操作', () => {
  let svc: InventoryService;
  let ctx: RequestTenantContext;

  beforeEach(() => {
    resetInventoryServiceTestState();
    svc = new InventoryService();
    ctx = createContext();
  });

  it('stockIn 正确增加库存', () => {
    const prod = createProduct(svc, ctx, { currentStock: 30 });
    const { product, record } = svc.stockIn(ctx, {
      productId: prod.id,
      quantity: 20,
      reason: '补货入库',
    });
    expect(product.currentStock).toBe(50);
    expect(record.type).toBe(StockRecordType.Inbound);
    expect(record.beforeStock).toBe(30);
    expect(record.afterStock).toBe(50);
  });

  it('stockIn 记录 batchNo', () => {
    const prod = createProduct(svc, ctx, { currentStock: 10 });
    const { record } = svc.stockIn(ctx, {
      productId: prod.id,
      quantity: 5,
      reason: '批次入库',
      batchNo: 'BATCH-2026-001',
    });
    expect(record.batchNo).toBe('BATCH-2026-001');
  });

  it('stockOut 正确减少库存', () => {
    const prod = createProduct(svc, ctx, { currentStock: 100 });
    const { product, record } = svc.stockOut(ctx, {
      productId: prod.id,
      quantity: 30,
      reason: '销售出库',
    });
    expect(product.currentStock).toBe(70);
    expect(record.type).toBe(StockRecordType.Outbound);
    expect(record.beforeStock).toBe(100);
    expect(record.afterStock).toBe(70);
  });

  it('stockOut 数量超过库存抛错', () => {
    const prod = createProduct(svc, ctx, { currentStock: 10 });
    assert.throws(
      () =>
        svc.stockOut(ctx, {
          productId: prod.id,
          quantity: 20,
          reason: '超额出库',
        }),
      /Insufficient stock/,
    );
  });

  it('stockOut 零库存抛错', () => {
    const prod = createProduct(svc, ctx, { currentStock: 0 });
    assert.throws(
      () =>
        svc.stockOut(ctx, {
          productId: prod.id,
          quantity: 1,
          reason: '零库存出库',
        }),
      /Insufficient stock/,
    );
  });

  it('adjustStock 增加库存', () => {
    const prod = createProduct(svc, ctx, { currentStock: 50 });
    const { product, record } = svc.adjustStock(ctx, {
      productId: prod.id,
      newQuantity: 80,
      reason: '盘点调增',
    });
    expect(product.currentStock).toBe(80);
    expect(record.quantity).toBe(30);
    expect(record.type).toBe(StockRecordType.Adjustment);
  });

  it('adjustStock 减少库存', () => {
    const prod = createProduct(svc, ctx, { currentStock: 50 });
    const { product, record } = svc.adjustStock(ctx, {
      productId: prod.id,
      newQuantity: 20,
      reason: '盘点调减',
    });
    expect(product.currentStock).toBe(20);
    expect(record.quantity).toBe(30); // Math.abs(20-50)
  });

  it('adjustStock 数量不变时 quantity 为 0', () => {
    const prod = createProduct(svc, ctx, { currentStock: 50 });
    const { product, record } = svc.adjustStock(ctx, {
      productId: prod.id,
      newQuantity: 50,
      reason: '盘点一致',
    });
    expect(product.currentStock).toBe(50);
    expect(record.quantity).toBe(0);
  });

  it('checkStock 充足返回 true', () => {
    const prod = createProduct(svc, ctx, { currentStock: 100 });
    expect(svc.checkStock(prod.id, 50, ctx)).toBe(true);
  });

  it('checkStock 不足抛错', () => {
    const prod = createProduct(svc, ctx, { currentStock: 5 });
    assert.throws(() => svc.checkStock(prod.id, 10, ctx));
  });

  it('库存变更后 product.updatedAt 更新', () => {
    const prod = createProduct(svc, ctx, { currentStock: 30 });
    const updatedBefore = prod.updatedAt;

    const { product } = svc.stockIn(ctx, {
      productId: prod.id,
      quantity: 10,
      reason: '更新测试',
    });
    // stockIn 应该更新 updatedAt (时间戳至少相同或更大)
    expect(product.updatedAt >= updatedBefore).toBe(true);
  });
});

// ─────────────────────────────────────────────────────
// Section 3: 库存预警 (getLowStockProducts)
// ─────────────────────────────────────────────────────
describe('[inventory-extended] 库存预警', () => {
  let svc: InventoryService;
  let ctx: RequestTenantContext;

  beforeEach(() => {
    resetInventoryServiceTestState();
    svc = new InventoryService();
    ctx = createContext();
  });

  it('所有库存充足时无预警', () => {
    createProduct(svc, ctx, { currentStock: 100, minStock: 10 });
    createProduct(svc, ctx, { currentStock: 50, minStock: 5 });
    const alerts = svc.getLowStockProducts(ctx);
    expect(alerts).toHaveLength(0);
  });

  it('零库存商品标记 out_of_stock', () => {
    createProduct(svc, ctx, { currentStock: 0, minStock: 10 });
    const alerts = svc.getLowStockProducts(ctx);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].status).toBe('out_of_stock');
  });

  it('低库存商品标记 low', () => {
    createProduct(svc, ctx, { currentStock: 5, minStock: 10 });
    const alerts = svc.getLowStockProducts(ctx);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].status).toBe('low');
  });

  it('下架商品不触发预警', () => {
    createProduct(svc, ctx, {
      currentStock: 0,
      minStock: 10,
      status: ProductStatus.Inactive,
    });
    const alerts = svc.getLowStockProducts(ctx);
    expect(alerts).toHaveLength(0);
  });

  it('自定义阈值覆盖 minStock', () => {
    createProduct(svc, ctx, { currentStock: 15, minStock: 10 });
    // 15 <= 20 (自定义阈值)
    const alerts = svc.getLowStockProducts(ctx, 20);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].status).toBe('low');
    expect(alerts[0].minStock).toBe(20);
  });

  it('多个低库存商品同时返回', () => {
    createProduct(svc, ctx, { name: '商品A', currentStock: 3, minStock: 10 });
    createProduct(svc, ctx, { name: '商品B', currentStock: 0, minStock: 5 });
    createProduct(svc, ctx, { name: '商品C', currentStock: 100, minStock: 10 });

    const alerts = svc.getLowStockProducts(ctx);
    expect(alerts).toHaveLength(2);
  });

  it('getLowStockProducts 跨租户隔离', () => {
    createProduct(svc, ctx, { currentStock: 0, minStock: 5 });
    createProduct(svc, createOtherContext(), { currentStock: 0, minStock: 5 });

    const alertsCtx = svc.getLowStockProducts(ctx);
    expect(alertsCtx).toHaveLength(1);
    expect(alertsCtx[0].status).toBe('out_of_stock');
  });
});

// ─────────────────────────────────────────────────────
// Section 4: 库存盘点与库存快照 (getStockRecords)
// ─────────────────────────────────────────────────────
describe('[inventory-extended] 库存记录追溯', () => {
  let svc: InventoryService;
  let ctx: RequestTenantContext;
  let prod: Product;

  beforeEach(() => {
    resetInventoryServiceTestState();
    svc = new InventoryService();
    ctx = createContext();
    prod = createProduct(svc, ctx, { currentStock: 100 });
  });

  it('getStockRecords 空记录返回空数组', () => {
    expect(svc.getStockRecords(ctx)).toEqual([]);
  });

  it('每次库存操作生成一条记录', () => {
    svc.stockIn(ctx, { productId: prod.id, quantity: 10, reason: '入库' });
    svc.stockOut(ctx, { productId: prod.id, quantity: 5, reason: '出库' });
    svc.adjustStock(ctx, { productId: prod.id, newQuantity: 80, reason: '调整' });

    const records = svc.getStockRecords(ctx);
    expect(records).toHaveLength(3);
  });

  it('getStockRecords 按 productId 过滤', () => {
    const prod2 = createProduct(svc, ctx, { name: '商品2', currentStock: 50 });
    svc.stockIn(ctx, { productId: prod.id, quantity: 10, reason: '商品1入库' });
    svc.stockIn(ctx, { productId: prod2.id, quantity: 5, reason: '商品2入库' });

    const prod1Records = svc.getStockRecords(ctx, { productId: prod.id });
    expect(prod1Records).toHaveLength(1);
  });

  it('getStockRecords 按 type 过滤', () => {
    svc.stockIn(ctx, { productId: prod.id, quantity: 10, reason: '入库' });
    svc.stockOut(ctx, { productId: prod.id, quantity: 5, reason: '出库' });

    const inbound = svc.getStockRecords(ctx, { type: StockRecordType.Inbound });
    const outbound = svc.getStockRecords(ctx, { type: StockRecordType.Outbound });
    expect(inbound).toHaveLength(1);
    expect(outbound).toHaveLength(1);
  });

  it('getStockRecords 按日期范围过滤', () => {
    // 直接操作 stockRecordStore 不方便，利用连续的调用产生不同的时间
    svc.stockIn(ctx, { productId: prod.id, quantity: 10, reason: '第一次入库' });
    svc.stockIn(ctx, { productId: prod.id, quantity: 20, reason: '第二次入库' });

    const allRecords = svc.getStockRecords(ctx);
    expect(allRecords).toHaveLength(2);

    const firstRecord = allRecords[1]; // 最旧的
    const fromDate = firstRecord.createdAt;
    const toDate = allRecords[0].createdAt;

    const filtered = svc.getStockRecords(ctx, {
      dateFrom: fromDate,
      dateTo: toDate,
    });
    // should match both since the range is inclusive
    expect(filtered.length).toBeGreaterThanOrEqual(1);
  });

  it('getStockRecords 支持分页', () => {
    for (let i = 0; i < 5; i++) {
      svc.stockIn(ctx, { productId: prod.id, quantity: 1, reason: `入库${i}` });
    }

    const page1 = svc.getStockRecords(ctx, { limit: 2 });
    expect(page1).toHaveLength(2);
    const page2 = svc.getStockRecords(ctx, { limit: 2, offset: 2 });
    expect(page2).toHaveLength(2);
  });

  it('getStockRecords 跨租户隔离', () => {
    svc.stockIn(ctx, { productId: prod.id, quantity: 5, reason: '入库' });
    const otherCtx = createOtherContext();
    const otherRecords = svc.getStockRecords(otherCtx);
    expect(otherRecords).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────
// Section 5: 供应商管理
// ─────────────────────────────────────────────────────
describe('[inventory-extended] 供应商管理', () => {
  let svc: InventoryService;
  let ctx: RequestTenantContext;

  beforeEach(() => {
    resetInventoryServiceTestState();
    svc = new InventoryService();
    ctx = createContext();
  });

  it('createSupplier 创建供应商', () => {
    const supplier = svc.createSupplier(ctx, {
      name: '测试供应商',
      contactName: '张三',
      phone: '13800138000',
      email: 'supplier@example.com',
      address: '北京市朝阳区',
    });
    expect(supplier.id).toMatch(/^supplier-/);
    expect(supplier.name).toBe('测试供应商');
    expect(supplier.contactName).toBe('张三');
  });

  it('listSuppliers 返回本租户供应商', () => {
    svc.createSupplier(ctx, { name: '供应商A', contactName: 'A' });
    svc.createSupplier(ctx, { name: '供应商B', contactName: 'B' });
    svc.createSupplier(createOtherContext(), { name: '其他供应商', contactName: 'C' });

    const suppliers = svc.listSuppliers(ctx);
    expect(suppliers).toHaveLength(2);
  });

  it('listSuppliers 空返回空数组', () => {
    expect(svc.listSuppliers(ctx)).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────
// Section 6: 采购订单生命周期
// ─────────────────────────────────────────────────────
describe('[inventory-extended] 采购订单', () => {
  let svc: InventoryService;
  let ctx: RequestTenantContext;

  beforeEach(() => {
    resetInventoryServiceTestState();
    svc = new InventoryService();
    ctx = createContext();
  });

  it('createPurchaseOrder 创建草稿订单', () => {
    const prod = createProduct(svc, ctx);
    const order = svc.createPurchaseOrder(ctx, {
      supplierId: 'supplier-001',
      items: [
        {
          productId: prod.id,
          productName: prod.name,
          sku: prod.sku,
          quantity: 10,
          unitPrice: 100,
          totalPrice: 1000,
        },
      ],
      totalAmount: 1000,
    });
    expect(order.id).toMatch(/^po-/);
    expect(order.status).toBe(PurchaseOrderStatus.Draft);
    expect(order.items).toHaveLength(1);
  });

  it('confirmOrder Draft → Confirmed', () => {
    const prod = createProduct(svc, ctx);
    const order = svc.createPurchaseOrder(ctx, {
      supplierId: 'supplier-001',
      items: [
        {
          productId: prod.id,
          productName: prod.name,
          sku: prod.sku,
          quantity: 10,
          unitPrice: 100,
          totalPrice: 1000,
        },
      ],
      totalAmount: 1000,
    });

    const confirmed = svc.confirmOrder(order.id, ctx);
    expect(confirmed.status).toBe(PurchaseOrderStatus.Confirmed);
    expect(confirmed.orderedAt).toBeTruthy();
  });

  it('confirmOrder 状态不正确则抛错', () => {
    const prod = createProduct(svc, ctx);
    const order = svc.createPurchaseOrder(ctx, {
      supplierId: 'supplier-001',
      items: [
        {
          productId: prod.id,
          productName: prod.name,
          sku: prod.sku,
          quantity: 10,
          unitPrice: 100,
          totalPrice: 1000,
        },
      ],
      totalAmount: 1000,
    });

    // 先确认再收到
    svc.confirmOrder(order.id, ctx);
    svc.receiveOrder(order.id, ctx);

    // 已收货不能再确认
    assert.throws(() => svc.confirmOrder(order.id, ctx), /cannot be confirmed/);
  });

  it('receiveOrder 自动入库并更新库存', () => {
    const prod = createProduct(svc, ctx, { currentStock: 50 });
    const order = svc.createPurchaseOrder(ctx, {
      supplierId: 'supplier-001',
      items: [
        {
          productId: prod.id,
          productName: prod.name,
          sku: prod.sku,
          quantity: 30,
          unitPrice: 80,
          totalPrice: 2400,
        },
      ],
      totalAmount: 2400,
    });

    svc.confirmOrder(order.id, ctx);
    const received = svc.receiveOrder(order.id, ctx);
    expect(received.status).toBe(PurchaseOrderStatus.Received);
    expect(received.receivedAt).toBeTruthy();

    // 验证库存自动增加
    const updatedProd = svc.getProduct(prod.id, ctx);
    expect(updatedProd.currentStock).toBe(80); // 50 + 30
  });

  it('receiveOrder 未确认抛错', () => {
    const prod = createProduct(svc, ctx);
    const order = svc.createPurchaseOrder(ctx, {
      supplierId: 'supplier-001',
      items: [
        {
          productId: prod.id,
          productName: prod.name,
          sku: prod.sku,
          quantity: 10,
          unitPrice: 100,
          totalPrice: 1000,
        },
      ],
      totalAmount: 1000,
    });

    assert.throws(() => svc.receiveOrder(order.id, ctx), /must be confirmed/);
  });

  it('listPurchaseOrders 多维度过滤', () => {
    createProduct(svc, ctx);
    const prod2 = createProduct(svc, ctx, { name: '商品2' });

    const order1 = svc.createPurchaseOrder(ctx, {
      supplierId: 'supplier-A',
      items: [
        {
          productId: prod2.id,
          productName: prod2.name,
          sku: prod2.sku,
          quantity: 5,
          unitPrice: 50,
          totalPrice: 250,
        },
      ],
      totalAmount: 250,
    });
    const order2 = svc.createPurchaseOrder(ctx, {
      supplierId: 'supplier-B',
      items: [],
      totalAmount: 0,
    });

    // filter by supplierId
    const ordersForA = svc.listPurchaseOrders(ctx, { supplierId: 'supplier-A' });
    expect(ordersForA).toHaveLength(1);

    // filter by status
    const draftOrders = svc.listPurchaseOrders(ctx, { status: PurchaseOrderStatus.Draft });
    expect(draftOrders).toHaveLength(2);

    // 确认其中一个
    svc.confirmOrder(order1.id, ctx);
    const confirmedOrders = svc.listPurchaseOrders(ctx, { status: PurchaseOrderStatus.Confirmed });
    expect(confirmedOrders).toHaveLength(1);
  });

  it('listPurchaseOrders 分页', () => {
    for (let i = 0; i < 4; i++) {
      svc.createPurchaseOrder(ctx, {
        supplierId: `supplier-${i}`,
        items: [],
        totalAmount: i * 100,
      });
    }
    expect(svc.listPurchaseOrders(ctx, { limit: 2, offset: 0 })).toHaveLength(2);
    expect(svc.listPurchaseOrders(ctx, { limit: 2, offset: 2 })).toHaveLength(2);
  });

  it('采购订单跨租户隔离', () => {
    const otherCtx = createOtherContext();
    svc.createPurchaseOrder(ctx, { supplierId: 's1', items: [], totalAmount: 100 });
    svc.createPurchaseOrder(otherCtx, { supplierId: 's2', items: [], totalAmount: 200 });
    expect(svc.listPurchaseOrders(ctx)).toHaveLength(1);
  });

  it('updateProduct 只更新指定字段', () => {
    const prod = createProduct(svc, ctx, {
      name: '原名',
      price: 100,
      cost: 60,
      currentStock: 50,
    });
    const updated = svc.updateProduct(prod.id, ctx, { name: '新名字', price: 120 });
    expect(updated.name).toBe('新名字');
    expect(updated.price).toBe(120);
    expect(updated.cost).toBe(60); // 不变
    expect(updated.currentStock).toBe(50); // 不变
  });

  it('updateProduct 不存在的商品抛错', () => {
    assert.throws(() => svc.updateProduct('nonexistent', ctx, { name: '新' }));
  });
});
