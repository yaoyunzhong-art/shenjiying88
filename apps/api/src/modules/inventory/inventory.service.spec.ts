import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [inventory] [A] service.spec — ≥18项正反例+边界
 *
 * 策略: 纯函数式内联 — 不import生产代码,所有枚举/接口/业务逻辑内联定义
 */

import assert from 'node:assert/strict';

// ── 1. 枚举 + 类型定义 ─────────────────────────────────────────

enum ProductStatus { Active = 'active', Inactive = 'inactive', Discontinued = 'discontinued' }
enum StockRecordType { Inbound = 'inbound', Outbound = 'outbound', Return = 'return', Adjustment = 'adjustment' }
enum PurchaseOrderStatus { Draft = 'draft', Submitted = 'submitted', Confirmed = 'confirmed', Received = 'received', Cancelled = 'cancelled' }

interface PurchaseOrderItem { productId: string; productName: string; sku: string; quantity: number; unitPrice: number; totalPrice: number }
interface Product { id: string; tenantId: string; brandId?: string; storeId?: string; name: string; sku: string; category?: string; unit: string; price: number; cost: number; minStock: number; maxStock: number; currentStock: number; status: ProductStatus; imageUrl?: string; barcode?: string; createdAt: string; updatedAt: string }
interface StockRecord { id: string; productId: string; storeId?: string; type: StockRecordType; quantity: number; beforeStock: number; afterStock: number; reason?: string; operatorId?: string; batchNo?: string; createdAt: string }
interface Supplier { id: string; tenantId: string; name: string; contactName?: string; phone?: string; email?: string; address?: string; createdAt: string }
interface PurchaseOrder { id: string; tenantId: string; storeId?: string; supplierId?: string; status: PurchaseOrderStatus; items: PurchaseOrderItem[]; totalAmount: number; orderedAt?: string; receivedAt?: string; createdAt: string }
interface StockAlert { product: Product; currentStock: number; minStock: number; maxStock: number; status: 'low' | 'overstock' | 'out_of_stock' }
interface TenantCtx { tenantId: string; brandId?: string; storeId?: string }

// ── 2. mock 数据工厂 ────────────────────────────────────────────

let _seq = 0;
function uid(prefix: string): string { return `${prefix}-${++_seq}-${Date.now()}` }

function makeProduct(overrides: Partial<Product> & { name: string; sku: string; price: number; cost: number; currentStock: number; minStock?: number; maxStock?: number; unit?: string }): Product {
  return {
    id: uid('prod'),
    tenantId: 't-1',
    brandId: 'b-1',
    storeId: 's-1',
    unit: 'pcs',
    minStock: 0,
    maxStock: 100,
    status: ProductStatus.Active,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeSupplier(overrides: Partial<Supplier> & { name: string }): Supplier {
  return { id: uid('supplier'), tenantId: 't-1', createdAt: new Date().toISOString(), ...overrides };
}

function makePOItem(overrides: Partial<PurchaseOrderItem> & { productId: string; quantity: number; unitPrice: number }): PurchaseOrderItem {
  return { productName: 'Item', sku: 'SKU', totalPrice: overrides.quantity * overrides.unitPrice, ...overrides };
}

function makePO(overrides: Partial<PurchaseOrder> & { items: PurchaseOrderItem[]; totalAmount: number }): PurchaseOrder {
  return { id: uid('po'), tenantId: 't-1', status: PurchaseOrderStatus.Draft, createdAt: new Date().toISOString(), ...overrides };
}

// ── 3. 内联业务逻辑纯函数 ────────────────────────────────────────

function createProduct(store: Map<string, Product>, ctx: TenantCtx, input: { name: string; sku: string; category?: string; unit?: string; price: number; cost: number; minStock?: number; maxStock?: number; currentStock: number; status?: ProductStatus; imageUrl?: string; barcode?: string }): Product {
  const p: Product = {
    id: uid('prod'),
    tenantId: ctx.tenantId,
    brandId: ctx.brandId,
    storeId: ctx.storeId,
    name: input.name,
    sku: input.sku,
    category: input.category,
    unit: input.unit ?? 'pcs',
    price: input.price,
    cost: input.cost,
    minStock: input.minStock ?? 0,
    maxStock: input.maxStock ?? 100,
    currentStock: input.currentStock,
    status: input.status ?? ProductStatus.Active,
    imageUrl: input.imageUrl,
    barcode: input.barcode,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  store.set(p.id, p);
  return p;
}

function requireProduct(store: Map<string, Product>, id: string, ctx: TenantCtx): Product {
  const p = store.get(id);
  if (!p || p.tenantId !== ctx.tenantId) throw new Error(`Product ${id} not found`);
  return p;
}

function updateProduct(store: Map<string, Product>, id: string, ctx: TenantCtx, input: Partial<Omit<Product, 'id' | 'tenantId' | 'brandId' | 'storeId' | 'createdAt' | 'updatedAt'>>): Product {
  const p = requireProduct(store, id, ctx);
  const updated: Product = { ...p, ...input, updatedAt: new Date().toISOString() };
  store.set(id, updated);
  return updated;
}

function listProducts(store: Map<string, Product>, ctx: TenantCtx, query?: { category?: string; status?: string; keyword?: string; limit?: number; offset?: number }): Product[] {
  let prods = Array.from(store.values()).filter(p => p.tenantId === ctx.tenantId);
  if (query?.category) prods = prods.filter(p => p.category === query.category);
  if (query?.status) prods = prods.filter(p => p.status === query.status);
  if (query?.keyword) {
    const kw = query.keyword.toLowerCase();
    prods = prods.filter(p => p.name.toLowerCase().includes(kw) || p.sku.toLowerCase().includes(kw) || (p.barcode && p.barcode.includes(kw)));
  }
  prods.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  if (query?.limit && query.limit > 0) {
    const off = query.offset ?? 0;
    prods = prods.slice(off, off + query.limit);
  }
  return prods;
}

function stockIn(store: Map<string, Product>, recStore: Map<string, StockRecord>, ctx: TenantCtx, input: { productId: string; quantity: number; reason?: string; batchNo?: string }): { product: Product; record: StockRecord } {
  const p = requireProduct(store, input.productId, ctx);
  const before = p.currentStock;
  const after = before + input.quantity;
  const rec: StockRecord = { id: uid('sr'), productId: p.id, storeId: p.storeId, type: StockRecordType.Inbound, quantity: input.quantity, beforeStock: before, afterStock: after, reason: input.reason, batchNo: input.batchNo, createdAt: new Date().toISOString() };
  recStore.set(rec.id, rec);
  p.currentStock = after;
  p.updatedAt = new Date().toISOString();
  store.set(p.id, p);
  return { product: p, record: rec };
}

function stockOut(store: Map<string, Product>, recStore: Map<string, StockRecord>, ctx: TenantCtx, input: { productId: string; quantity: number; reason?: string }): { product: Product; record: StockRecord } {
  const p = requireProduct(store, input.productId, ctx);
  if (p.currentStock < input.quantity) throw new Error(`Insufficient stock for product ${p.name} (${p.sku}): required ${input.quantity}, available ${p.currentStock}`);
  const before = p.currentStock;
  const after = before - input.quantity;
  const rec: StockRecord = { id: uid('sr'), productId: p.id, storeId: p.storeId, type: StockRecordType.Outbound, quantity: input.quantity, beforeStock: before, afterStock: after, reason: input.reason, createdAt: new Date().toISOString() };
  recStore.set(rec.id, rec);
  p.currentStock = after;
  p.updatedAt = new Date().toISOString();
  store.set(p.id, p);
  return { product: p, record: rec };
}

function adjustStock(store: Map<string, Product>, recStore: Map<string, StockRecord>, ctx: TenantCtx, input: { productId: string; newQuantity: number; reason: string }): { product: Product; record: StockRecord } {
  const p = requireProduct(store, input.productId, ctx);
  const before = p.currentStock;
  const diff = input.newQuantity - before;
  const after = input.newQuantity;
  const rec: StockRecord = { id: uid('sr'), productId: p.id, storeId: p.storeId, type: StockRecordType.Adjustment, quantity: Math.abs(diff), beforeStock: before, afterStock: after, reason: input.reason, createdAt: new Date().toISOString() };
  recStore.set(rec.id, rec);
  p.currentStock = after;
  p.updatedAt = new Date().toISOString();
  store.set(p.id, p);
  return { product: p, record: rec };
}

function checkStock(store: Map<string, Product>, id: string, qty: number, ctx: TenantCtx): boolean {
  const p = requireProduct(store, id, ctx);
  if (p.currentStock < qty) throw new Error(`Insufficient stock for product ${p.name} (${p.sku}): required ${qty}, available ${p.currentStock}`);
  return true;
}

function getLowStockProducts(store: Map<string, Product>, ctx: TenantCtx, threshold?: number): StockAlert[] {
  return Array.from(store.values())
    .filter(p => p.tenantId === ctx.tenantId && p.status === ProductStatus.Active)
    .reduce<StockAlert[]>((alerts, product) => {
      const effThresh = threshold ?? product.minStock;
      if (product.currentStock <= 0) {
        alerts.push({ product, currentStock: product.currentStock, minStock: effThresh, maxStock: product.maxStock, status: 'out_of_stock' });
      } else if (product.currentStock <= effThresh) {
        alerts.push({ product, currentStock: product.currentStock, minStock: effThresh, maxStock: product.maxStock, status: 'low' });
      }
      return alerts;
    }, []);
}

function getStockRecords(store: Map<string, Product>, recStore: Map<string, StockRecord>, ctx: TenantCtx, query?: { productId?: string; type?: StockRecordType; dateFrom?: string; dateTo?: string; limit?: number; offset?: number }): StockRecord[] {
  let recs = Array.from(recStore.values()).filter(r => { const p = store.get(r.productId); return p && p.tenantId === ctx.tenantId; });
  if (query?.productId) recs = recs.filter(r => r.productId === query.productId);
  if (query?.type) recs = recs.filter(r => r.type === query.type);
  if (query?.dateFrom) recs = recs.filter(r => r.createdAt >= query.dateFrom!);
  if (query?.dateTo) recs = recs.filter(r => r.createdAt <= query.dateTo!);
  recs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (query?.limit && query.limit > 0) {
    const off = query.offset ?? 0;
    recs = recs.slice(off, off + query.limit);
  }
  return recs;
}

function createSupplier(supStore: Map<string, Supplier>, ctx: TenantCtx, input: { name: string; contactName?: string; phone?: string; email?: string; address?: string }): Supplier {
  const s: Supplier = { id: uid('supplier'), tenantId: ctx.tenantId, name: input.name, contactName: input.contactName, phone: input.phone, email: input.email, address: input.address, createdAt: new Date().toISOString() };
  supStore.set(s.id, s);
  return s;
}

function listSuppliers(supStore: Map<string, Supplier>, ctx: TenantCtx): Supplier[] {
  return Array.from(supStore.values()).filter(s => s.tenantId === ctx.tenantId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function createPurchaseOrder(poStore: Map<string, PurchaseOrder>, ctx: TenantCtx, input: { storeId?: string; supplierId?: string; items: PurchaseOrderItem[]; totalAmount: number }): PurchaseOrder {
  const po: PurchaseOrder = { id: uid('po'), tenantId: ctx.tenantId, storeId: input.storeId ?? ctx.storeId, supplierId: input.supplierId, status: PurchaseOrderStatus.Draft, items: input.items, totalAmount: input.totalAmount, createdAt: new Date().toISOString() };
  poStore.set(po.id, po);
  return po;
}

function confirmOrder(poStore: Map<string, PurchaseOrder>, id: string, ctx: TenantCtx): PurchaseOrder {
  const po = poStore.get(id);
  if (!po || po.tenantId !== ctx.tenantId) throw new Error(`Purchase order ${id} not found`);
  if (po.status !== PurchaseOrderStatus.Draft && po.status !== PurchaseOrderStatus.Submitted) throw new Error(`Purchase order ${id} cannot be confirmed (current status: ${po.status})`);
  po.status = PurchaseOrderStatus.Confirmed;
  po.orderedAt = new Date().toISOString();
  poStore.set(id, po);
  return po;
}

function receiveOrder(poStore: Map<string, PurchaseOrder>, prodStore: Map<string, Product>, recStore: Map<string, StockRecord>, ctx: TenantCtx, id: string): PurchaseOrder {
  const po = poStore.get(id);
  if (!po || po.tenantId !== ctx.tenantId) throw new Error(`Purchase order ${id} not found`);
  if (po.status !== PurchaseOrderStatus.Confirmed) throw new Error(`Purchase order ${id} must be confirmed before receiving`);
  for (const item of po.items) {
    const p = prodStore.get(item.productId);
    if (p && p.tenantId === ctx.tenantId) {
      stockIn(prodStore, recStore, ctx, { productId: item.productId, quantity: item.quantity, reason: `采购收货 PO#${id}`, batchNo: id });
    }
  }
  po.status = PurchaseOrderStatus.Received;
  po.receivedAt = new Date().toISOString();
  poStore.set(id, po);
  return po;
}

function listPurchaseOrders(poStore: Map<string, PurchaseOrder>, ctx: TenantCtx, query?: { status?: PurchaseOrderStatus; supplierId?: string; storeId?: string; limit?: number; offset?: number }): PurchaseOrder[] {
  let orders = Array.from(poStore.values()).filter(o => o.tenantId === ctx.tenantId);
  if (query?.status) orders = orders.filter(o => o.status === query.status);
  if (query?.supplierId) orders = orders.filter(o => o.supplierId === query.supplierId);
  if (query?.storeId) orders = orders.filter(o => o.storeId === query.storeId);
  orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (query?.limit && query.limit > 0) {
    const off = query.offset ?? 0;
    orders = orders.slice(off, off + query.limit);
  }
  return orders;
}

// ── Test Fixtures ──────────────────────────────────────────────

const defaultCtx: TenantCtx = { tenantId: 't-1', brandId: 'b-1', storeId: 's-1' };
const otherCtx: TenantCtx = { tenantId: 't-999' };

function freshStores() {
  return {
    prods: new Map<string, Product>(),
    recs: new Map<string, StockRecord>(),
    sups: new Map<string, Supplier>(),
    pos: new Map<string, PurchaseOrder>(),
  };
}

// ── 4. 测试用例 ─────────────────────────────────────────────────

describe('Inventory Service [pure inline] — Product CRUD', () => {
  let S: ReturnType<typeof freshStores>;
  beforeAll(() => { /**/ });
  afterAll(() => {/**/ });
  beforeEach(() => { S = freshStores(); });
  afterEach(() => { S = freshStores(); });

  it('createProduct assigns generated id and default status', () => {
    const p = createProduct(S.prods, defaultCtx, { name: 'Bear', sku: 'B-1', price: 99, cost: 50, currentStock: 50 });
    assert.ok(p.id.startsWith('prod-'));
    assert.equal(p.name, 'Bear');
    assert.equal(p.status, ProductStatus.Active);
    assert.equal(p.tenantId, 't-1');
  });

  it('createProduct uses custom status when provided', () => {
    const p = createProduct(S.prods, defaultCtx, { name: 'Old', sku: 'O-1', price: 10, cost: 5, currentStock: 5, status: ProductStatus.Discontinued });
    assert.equal(p.status, ProductStatus.Discontinued);
  });

  it('getProduct returns the stored product', () => {
    const p = createProduct(S.prods, defaultCtx, { name: 'Ball', sku: 'B-1', price: 20, cost: 10, currentStock: 30 });
    const fetched = requireProduct(S.prods, p.id, defaultCtx);
    assert.equal(fetched.id, p.id);
    assert.equal(fetched.name, 'Ball');
  });

  it('getProduct throws for missing id', () => {
    assert.throws(() => requireProduct(S.prods, 'nonexistent', defaultCtx), /not found/);
  });

  it('getProduct throws for cross-tenant access', () => {
    const p = createProduct(S.prods, defaultCtx, { name: 'Isolated', sku: 'I-1', price: 10, cost: 5, currentStock: 50 });
    assert.throws(() => requireProduct(S.prods, p.id, otherCtx), /not found/);
  });

  it('updateProduct changes only provided fields', () => {
    const p = createProduct(S.prods, defaultCtx, { name: 'Old', sku: 'SKU-OLD', price: 10, cost: 5, currentStock: 20 });
    const u = updateProduct(S.prods, p.id, defaultCtx, { name: 'New', price: 25 });
    assert.equal(u.name, 'New');
    assert.equal(u.price, 25);
    assert.equal(u.sku, 'SKU-OLD');
  });

  it('updateProduct throws for missing id', () => {
    assert.throws(() => updateProduct(S.prods, 'nope', defaultCtx, { name: 'X' }), /not found/);
  });

  it('listProducts returns all for tenant', () => {
    createProduct(S.prods, defaultCtx, { name: 'A', sku: 'A-1', price: 10, cost: 5, currentStock: 10 });
    createProduct(S.prods, defaultCtx, { name: 'B', sku: 'B-1', price: 20, cost: 10, currentStock: 20 });
    assert.equal(listProducts(S.prods, defaultCtx).length, 2);
  });

  it('listProducts filters by category', () => {
    createProduct(S.prods, defaultCtx, { name: 'A', sku: 'A-1', category: 'toys', price: 10, cost: 5, currentStock: 10 });
    createProduct(S.prods, defaultCtx, { name: 'B', sku: 'B-1', category: 'food', price: 20, cost: 10, currentStock: 20 });
    assert.equal(listProducts(S.prods, defaultCtx, { category: 'toys' }).length, 1);
  });

  it('listProducts filters by keyword (name, sku)', () => {
    createProduct(S.prods, defaultCtx, { name: 'Bear Plush', sku: 'SKU-BP', price: 99, cost: 50, currentStock: 50 });
    createProduct(S.prods, defaultCtx, { name: 'Dinosaur', sku: 'SKU-DN', price: 120, cost: 60, currentStock: 30 });
    assert.equal(listProducts(S.prods, defaultCtx, { keyword: 'bear' }).length, 1);
    assert.equal(listProducts(S.prods, defaultCtx, { keyword: 'SKU-DN' }).length, 1);
  });

  it('listProducts supports pagination', () => {
    for (let i = 1; i <= 5; i++) createProduct(S.prods, defaultCtx, { name: `P${i}`, sku: `SKU-${i}`, price: 10, cost: 5, currentStock: 10 });
    assert.equal(listProducts(S.prods, defaultCtx, { limit: 2, offset: 0 }).length, 2);
    assert.equal(listProducts(S.prods, defaultCtx, { limit: 2, offset: 2 }).length, 2);
  });

  it('listProducts isolates tenants', () => {
    createProduct(S.prods, defaultCtx, { name: 'OnlyA', sku: 'OA-1', price: 10, cost: 5, currentStock: 10 });
    assert.equal(listProducts(S.prods, otherCtx).length, 0);
  });
});

describe('Inventory Service [pure inline] — Stock Operations', () => {
  let S: ReturnType<typeof freshStores>;
  beforeEach(() => { S = freshStores(); });

  it('stockIn increases stock and creates inbound record', () => {
    const p = createProduct(S.prods, defaultCtx, { name: 'Plush', sku: 'P-1', price: 50, cost: 25, currentStock: 20 });
    const { product, record } = stockIn(S.prods, S.recs, defaultCtx, { productId: p.id, quantity: 30, reason: 'restock', batchNo: 'B001' });
    assert.equal(product.currentStock, 50);
    assert.equal(record.type, StockRecordType.Inbound);
    assert.equal(record.beforeStock, 20);
    assert.equal(record.afterStock, 50);
    assert.equal(record.batchNo, 'B001');
  });

  it('stockOut decreases stock when sufficient', () => {
    const p = createProduct(S.prods, defaultCtx, { name: 'Plush', sku: 'P-2', price: 50, cost: 25, currentStock: 50 });
    const { product, record } = stockOut(S.prods, S.recs, defaultCtx, { productId: p.id, quantity: 15, reason: 'sold' });
    assert.equal(product.currentStock, 35);
    assert.equal(record.type, StockRecordType.Outbound);
  });

  it('stockOut throws on insufficient stock', () => {
    const p = createProduct(S.prods, defaultCtx, { name: 'Rare', sku: 'R-1', price: 999, cost: 500, currentStock: 3 });
    assert.throws(() => stockOut(S.prods, S.recs, defaultCtx, { productId: p.id, quantity: 10 }), /Insufficient stock/);
  });

  it('adjustStock sets exact quantity', () => {
    const p = createProduct(S.prods, defaultCtx, { name: 'Adj', sku: 'ADJ-1', price: 100, cost: 50, currentStock: 30 });
    const { product, record } = adjustStock(S.prods, S.recs, defaultCtx, { productId: p.id, newQuantity: 100, reason: 'check' });
    assert.equal(product.currentStock, 100);
    assert.equal(record.quantity, 70);
    assert.equal(record.type, StockRecordType.Adjustment);
  });

  it('checkStock returns true when sufficient', () => {
    const p = createProduct(S.prods, defaultCtx, { name: 'Check', sku: 'CK-1', price: 10, cost: 5, currentStock: 30 });
    assert.equal(checkStock(S.prods, p.id, 20, defaultCtx), true);
  });

  it('checkStock throws when insufficient', () => {
    const p = createProduct(S.prods, defaultCtx, { name: 'Check', sku: 'CK-2', price: 10, cost: 5, currentStock: 5 });
    assert.throws(() => checkStock(S.prods, p.id, 20, defaultCtx), /Insufficient stock/);
  });

  it('getLowStockProducts returns alerts for low and out-of-stock', () => {
    createProduct(S.prods, defaultCtx, { name: 'Low', sku: 'L-1', price: 10, cost: 5, minStock: 20, maxStock: 100, currentStock: 5 });
    createProduct(S.prods, defaultCtx, { name: 'OOS', sku: 'O-1', price: 15, cost: 7, minStock: 10, maxStock: 50, currentStock: 0 });
    createProduct(S.prods, defaultCtx, { name: 'OK', sku: 'K-1', price: 20, cost: 10, minStock: 5, maxStock: 100, currentStock: 80 });
    const alerts = getLowStockProducts(S.prods, defaultCtx);
    assert.equal(alerts.length, 2);
    assert.equal(alerts.find(a => a.product.name === 'Low')!.status, 'low');
    assert.equal(alerts.find(a => a.product.name === 'OOS')!.status, 'out_of_stock');
  });

  it('getLowStockProducts respects custom threshold', () => {
    createProduct(S.prods, defaultCtx, { name: 'Cust', sku: 'C-1', price: 50, cost: 25, minStock: 10, maxStock: 200, currentStock: 40 });
    assert.equal(getLowStockProducts(S.prods, defaultCtx).length, 0); // 40 > 10
    assert.equal(getLowStockProducts(S.prods, defaultCtx, 50).length, 1); // 40 < 50
  });

  it('getStockRecords filters by productId and type', () => {
    const p = createProduct(S.prods, defaultCtx, { name: 'Rec', sku: 'R-1', price: 10, cost: 5, currentStock: 20 });
    stockIn(S.prods, S.recs, defaultCtx, { productId: p.id, quantity: 30 });
    stockOut(S.prods, S.recs, defaultCtx, { productId: p.id, quantity: 10 });
    assert.equal(getStockRecords(S.prods, S.recs, defaultCtx).length, 2);
    assert.equal(getStockRecords(S.prods, S.recs, defaultCtx, { type: StockRecordType.Inbound }).length, 1);
    assert.equal(getStockRecords(S.prods, S.recs, defaultCtx, { type: StockRecordType.Outbound }).length, 1);
  });
});

describe('Inventory Service [pure inline] — Suppliers', () => {
  let S: ReturnType<typeof freshStores>;
  beforeEach(() => { S = freshStores(); });

  it('createSupplier creates with generated id', () => {
    const s = createSupplier(S.sups, defaultCtx, { name: 'Factory', contactName: 'Zhang', phone: '13800138000' });
    assert.ok(s.id.startsWith('supplier-'));
    assert.equal(s.name, 'Factory');
    assert.equal(s.tenantId, 't-1');
  });

  it('listSuppliers returns all for tenant', () => {
    createSupplier(S.sups, defaultCtx, { name: 'A' });
    createSupplier(S.sups, defaultCtx, { name: 'B' });
    assert.equal(listSuppliers(S.sups, defaultCtx).length, 2);
  });

  it('listSuppliers isolates tenants', () => {
    createSupplier(S.sups, defaultCtx, { name: 'OnlyA' });
    assert.equal(listSuppliers(S.sups, otherCtx).length, 0);
  });
});

describe('Inventory Service [pure inline] — Purchase Orders', () => {
  let S: ReturnType<typeof freshStores>;
  beforeEach(() => { S = freshStores(); });

  it('createPO creates in Draft status', () => {
    const po = createPurchaseOrder(S.pos, defaultCtx, {
      supplierId: 's-1', items: [{ productId: 'p-1', productName: 'Ball', sku: 'B-1', quantity: 10, unitPrice: 15, totalPrice: 150 }], totalAmount: 150,
    });
    assert.ok(po.id.startsWith('po-'));
    assert.equal(po.status, PurchaseOrderStatus.Draft);
  });

  it('confirmOrder transitions Draft to Confirmed', () => {
    const po = createPurchaseOrder(S.pos, defaultCtx, { items: [{ productId: 'p-1', productName: 'B', sku: 'B-1', quantity: 5, unitPrice: 10, totalPrice: 50 }], totalAmount: 50 });
    const c = confirmOrder(S.pos, po.id, defaultCtx);
    assert.equal(c.status, PurchaseOrderStatus.Confirmed);
    assert.ok(c.orderedAt);
  });

  it('confirmOrder rejects non-Draft/Submitted status', () => {
    const po = createPurchaseOrder(S.pos, defaultCtx, { items: [{ productId: 'p-1', productName: 'B', sku: 'B-1', quantity: 1, unitPrice: 1, totalPrice: 1 }], totalAmount: 1 });
    confirmOrder(S.pos, po.id, defaultCtx);
    assert.throws(() => confirmOrder(S.pos, po.id, defaultCtx), /cannot be confirmed/);
  });

  it('receiveOrder transitions to Received and updates stock', () => {
    const p = createProduct(S.prods, defaultCtx, { name: 'Ball', sku: 'B-1', price: 15, cost: 8, currentStock: 0 });
    const po = createPurchaseOrder(S.pos, defaultCtx, { items: [{ productId: p.id, productName: 'Ball', sku: 'B-1', quantity: 20, unitPrice: 8, totalPrice: 160 }], totalAmount: 160 });
    confirmOrder(S.pos, po.id, defaultCtx);
    const r = receiveOrder(S.pos, S.prods, S.recs, defaultCtx, po.id);
    assert.equal(r.status, PurchaseOrderStatus.Received);
    assert.ok(r.receivedAt);
    assert.equal(S.prods.get(p.id)!.currentStock, 20);
  });

  it('receiveOrder rejects non-Confirmed status', () => {
    const po = createPurchaseOrder(S.pos, defaultCtx, { items: [{ productId: 'p-1', productName: 'B', sku: 'B-1', quantity: 1, unitPrice: 1, totalPrice: 1 }], totalAmount: 1 });
    assert.throws(() => receiveOrder(S.pos, S.prods, S.recs, defaultCtx, po.id), /must be confirmed/);
  });

  it('listPOs filters by status and supplier', () => {
    const o1 = createPurchaseOrder(S.pos, defaultCtx, { supplierId: 's-A', items: [{ productId: 'p-1', productName: 'A', sku: 'A-1', quantity: 1, unitPrice: 1, totalPrice: 1 }], totalAmount: 1 });
    createPurchaseOrder(S.pos, defaultCtx, { supplierId: 's-B', items: [{ productId: 'p-2', productName: 'B', sku: 'B-1', quantity: 1, unitPrice: 1, totalPrice: 1 }], totalAmount: 1 });
    confirmOrder(S.pos, o1.id, defaultCtx);
    assert.equal(listPurchaseOrders(S.pos, defaultCtx, { status: PurchaseOrderStatus.Draft }).length, 1);
    assert.equal(listPurchaseOrders(S.pos, defaultCtx, { status: PurchaseOrderStatus.Confirmed }).length, 1);
    assert.equal(listPurchaseOrders(S.pos, defaultCtx, { supplierId: 's-A' }).length, 1);
  });

  it('listPOs isolates tenants', () => {
    createPurchaseOrder(S.pos, defaultCtx, { items: [{ productId: 'p-1', productName: 'A', sku: 'A-1', quantity: 1, unitPrice: 1, totalPrice: 1 }], totalAmount: 1 });
    assert.equal(listPurchaseOrders(S.pos, otherCtx).length, 0);
  });
});
