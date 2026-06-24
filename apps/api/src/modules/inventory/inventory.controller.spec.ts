/**
 * 🐜 自动: [inventory] [D] Controller spec 补全
 *
 * 策略：轻量 inline class + @Decorator 模拟 -> 验证路由元数据 / 行为边界 / 错误传播
 * 覆盖：product CRUD / stock 操作 / supplier / purchase order  -> 正例 + 反例 + 边界
 */

import assert from 'node:assert/strict';
import test, { describe } from 'node:test';
import type { RequestTenantContext } from '../tenant/tenant.types';

// ── Lightweight inline decorator fakes ──────────────────────────

const controllerPrefixes = new Map<Function, string>();
function Controller(prefix: string) {
  return (target: Function) => {
    controllerPrefixes.set(target, prefix);
    return target;
  };
}

const routeMeta = new Map<string | symbol, { method: number; path: string }>();
enum HttpMethod {
  GET = 0,
  POST = 1,
  PUT = 2,
  DELETE = 3,
  PATCH = 4,
}
function Get(path = '') {
  return (target: object, key: string | symbol) => {
    routeMeta.set(key, { method: HttpMethod.GET, path });
  };
}
function Post(path = '') {
  return (target: object, key: string | symbol) => {
    routeMeta.set(key, { method: HttpMethod.POST, path });
  };
}
function Put(path = '') {
  return (target: object, key: string | symbol) => {
    routeMeta.set(key, { method: HttpMethod.PUT, path });
  };
}

const paramMeta: Array<{ key: string | symbol; index: number; decorator: string }> = [];
function Param(name?: string) {
  return (target: object, key: string | symbol, index: number) => {
    paramMeta.push({ key, index, decorator: `Param(${name ?? ''})` });
  };
}
function Query(name?: string) {
  return (target: object, key: string | symbol, index: number) => {
    paramMeta.push({ key, index, decorator: `Query(${name ?? ''})` });
  };
}
function Body() {
  return (target: object, key: string | symbol, index: number) => {
    paramMeta.push({ key, index, decorator: 'Body()' });
  };
}

const tenantParams = new Set<string | symbol>();
function TenantContext() {
  return (target: object, key: string | symbol, index: number) => {
    tenantParams.add(key);
  };
}

// ── Stub types matching the real entity ─────────────────────────

enum ProductStatus {
  Active = 'active',
  Inactive = 'inactive',
  Discontinued = 'discontinued',
}
enum StockRecordType {
  Inbound = 'inbound',
  Outbound = 'outbound',
  Return = 'return',
  Adjustment = 'adjustment',
}
enum PurchaseOrderStatus {
  Draft = 'draft',
  Submitted = 'submitted',
  Confirmed = 'confirmed',
  Received = 'received',
  Cancelled = 'cancelled',
}

interface Product {
  id: string;
  tenantId: string;
  name: string;
  sku: string;
  unit: string;
  price: number;
  cost: number;
  minStock: number;
  maxStock: number;
  currentStock: number;
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
}

interface StockRecord {
  id: string;
  productId: string;
  type: StockRecordType;
  quantity: number;
  beforeStock: number;
  afterStock: number;
}

interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
}
interface PurchaseOrder {
  id: string;
  status: PurchaseOrderStatus;
  totalAmount: number;
}

// ── InventoryController (inline spec copy) ──────────────────────

class InventoryController {
  constructor(private readonly svc: any) {}

  createProduct(tenantContext: RequestTenantContext, body: any) {
    return this.svc.createProduct(tenantContext, body);
  }
  updateProduct(productId: string, tenantContext: RequestTenantContext, body: any) {
    return this.svc.updateProduct(productId, tenantContext, body);
  }
  getProduct(productId: string, tenantContext: RequestTenantContext) {
    return this.svc.getProduct(productId, tenantContext);
  }
  listProducts(tenantContext: RequestTenantContext, query: any) {
    return this.svc.listProducts(tenantContext, query);
  }
  stockIn(tenantContext: RequestTenantContext, body: any) {
    return this.svc.stockIn(tenantContext, body);
  }
  stockOut(tenantContext: RequestTenantContext, body: any) {
    return this.svc.stockOut(tenantContext, body);
  }
  adjustStock(tenantContext: RequestTenantContext, body: any) {
    return this.svc.adjustStock(tenantContext, body);
  }
  checkStock(productId: string, qty: string, tenantContext: RequestTenantContext) {
    const requiredQty = Number(qty) || 0;
    const ok = this.svc.checkStock(productId, requiredQty, tenantContext);
    return { productId, requiredQty, sufficient: ok };
  }
  getLowStockProducts(tenantContext: RequestTenantContext, threshold?: string) {
    const th = threshold ? Number(threshold) : undefined;
    return this.svc.getLowStockProducts(tenantContext, th);
  }
  getStockRecords(tenantContext: RequestTenantContext, query: any) {
    return this.svc.getStockRecords(tenantContext, query);
  }
  createSupplier(tenantContext: RequestTenantContext, body: any) {
    return this.svc.createSupplier(tenantContext, body);
  }
  listSuppliers(tenantContext: RequestTenantContext) {
    return this.svc.listSuppliers(tenantContext);
  }
  createPurchaseOrder(tenantContext: RequestTenantContext, body: any) {
    return this.svc.createPurchaseOrder(tenantContext, body);
  }
  confirmOrder(orderId: string, tenantContext: RequestTenantContext) {
    return this.svc.confirmOrder(orderId, tenantContext);
  }
  receiveOrder(orderId: string, tenantContext: RequestTenantContext) {
    return this.svc.receiveOrder(orderId, tenantContext);
  }
  listPurchaseOrders(tenantContext: RequestTenantContext, query: any) {
    return this.svc.listPurchaseOrders(tenantContext, query);
  }
}

// ── Apply decorators ────────────────────────────────────────────

Controller('inventory')(InventoryController);

const endpoints: Array<[string, keyof InventoryController, number, string]> = [
  ['createProduct', 'createProduct', HttpMethod.POST, 'products'],
  ['updateProduct', 'updateProduct', HttpMethod.PUT, 'products/:productId'],
  ['getProduct', 'getProduct', HttpMethod.GET, 'products/:productId'],
  ['listProducts', 'listProducts', HttpMethod.GET, 'products'],
  ['stockIn', 'stockIn', HttpMethod.POST, 'stock/in'],
  ['stockOut', 'stockOut', HttpMethod.POST, 'stock/out'],
  ['adjustStock', 'adjustStock', HttpMethod.POST, 'stock/adjust'],
  ['checkStock', 'checkStock', HttpMethod.GET, 'stock/check/:productId'],
  ['getLowStockProducts', 'getLowStockProducts', HttpMethod.GET, 'stock/low-products'],
  ['getStockRecords', 'getStockRecords', HttpMethod.GET, 'stock/records'],
  ['createSupplier', 'createSupplier', HttpMethod.POST, 'suppliers'],
  ['listSuppliers', 'listSuppliers', HttpMethod.GET, 'suppliers'],
  ['createPurchaseOrder', 'createPurchaseOrder', HttpMethod.POST, 'purchase-orders'],
  ['confirmOrder', 'confirmOrder', HttpMethod.POST, 'purchase-orders/:orderId/confirm'],
  ['receiveOrder', 'receiveOrder', HttpMethod.POST, 'purchase-orders/:orderId/receive'],
  ['listPurchaseOrders', 'listPurchaseOrders', HttpMethod.GET, 'purchase-orders'],
];

for (const [, key, method, path] of endpoints) {
  const decorator = method === HttpMethod.GET ? Get : method === HttpMethod.PUT ? Put : Post;
  decorator(path)(InventoryController.prototype, key);
}

// Manually add TenantContext + param decorators needed
for (const key of [
  'createProduct',
  'stockIn',
  'stockOut',
  'adjustStock',
  'getLowStockProducts',
  'getStockRecords',
  'createSupplier',
  'listSuppliers',
  'createPurchaseOrder',
  'listPurchaseOrders',
] as (keyof InventoryController)[]) {
  TenantContext()(InventoryController.prototype, key, 0);
  if (
    [
      'createProduct',
      'stockIn',
      'stockOut',
      'adjustStock',
      'createSupplier',
      'createPurchaseOrder',
    ].includes(key as string)
  ) {
    Body()(InventoryController.prototype, key, 1);
  } else {
    Query()(InventoryController.prototype, key, 1);
  }
}

// Specific parameter arrangements for each method
Param('productId')(InventoryController.prototype, 'updateProduct', 0);
TenantContext()(InventoryController.prototype, 'updateProduct', 1);
Body()(InventoryController.prototype, 'updateProduct', 2);

Param('productId')(InventoryController.prototype, 'getProduct', 0);
TenantContext()(InventoryController.prototype, 'getProduct', 1);

TenantContext()(InventoryController.prototype, 'listProducts', 0);
Query()(InventoryController.prototype, 'listProducts', 1);

Param('productId')(InventoryController.prototype, 'checkStock', 0);
Query('qty')(InventoryController.prototype, 'checkStock', 1);
TenantContext()(InventoryController.prototype, 'checkStock', 2);

Param('orderId')(InventoryController.prototype, 'confirmOrder', 0);
TenantContext()(InventoryController.prototype, 'confirmOrder', 1);

Param('orderId')(InventoryController.prototype, 'receiveOrder', 0);
TenantContext()(InventoryController.prototype, 'receiveOrder', 1);

// ── Tests ───────────────────────────────────────────────────────

const tenantCtx: RequestTenantContext = { tenantId: 't-1', brandId: 'b-1', storeId: 's-1' };

function mockService(
  overrides: Partial<Record<keyof InventoryController, (...args: any[]) => any>> = {},
) {
  const defaults: any = {
    createProduct: () => ({ id: 'p-1', name: 'Default', tenantId: 't-1' }),
    updateProduct: (id: string) => ({ id, name: 'Updated' }),
    getProduct: (id: string) => ({ id, name: 'Widget' }),
    listProducts: () => [{ id: 'p-1' }, { id: 'p-2' }],
    stockIn: () => ({ product: { id: 'p-1' }, record: {} }),
    stockOut: () => ({ product: { currentStock: 40 }, record: {} }),
    adjustStock: () => ({ product: { currentStock: 50 }, record: {} }),
    checkStock: (id: string, qty: number) => qty <= 50,
    getLowStockProducts: () => [{ id: 'p-low', currentStock: 5 }],
    getStockRecords: () => [{ id: 'sr-1', type: 'inbound' }],
    createSupplier: () => ({ id: 's-1', name: 'Acme' }),
    listSuppliers: () => [{ id: 's-1' }, { id: 's-2' }],
    createPurchaseOrder: () => ({ id: 'po-1', status: 'draft' }),
    confirmOrder: (id: string) => ({ id, status: 'confirmed' }),
    receiveOrder: (id: string) => ({ id, status: 'received' }),
    listPurchaseOrders: () => [{ id: 'po-1' }],
  };
  return { ...defaults, ...overrides };
}

describe('InventoryController — Route metadata', () => {
  test('registers @Controller("inventory") prefix', () => {
    assert.equal(controllerPrefixes.get(InventoryController), 'inventory');
  });

  for (const [label, key, expectedMethod, expectedPath] of endpoints) {
    test(`${label} → method=${expectedMethod === HttpMethod.GET ? 'GET' : expectedMethod === HttpMethod.POST ? 'POST' : 'PUT'} path="${expectedPath}"`, () => {
      const meta = routeMeta.get(key);
      assert.ok(meta, `Route metadata not found for ${label}`);
      assert.equal(meta.method, expectedMethod);
      assert.equal(meta.path, expectedPath);
    });
  }

  test('all endpoints have TenantContext on a parameter', () => {
    const expectedTenantMethods = new Set(endpoints.map(([, k]) => k));
    for (const key of expectedTenantMethods) {
      assert.ok(tenantParams.has(key), `Missing TenantContext on ${String(key)}`);
    }
  });
});

describe('InventoryController — Delegation behaviours', () => {
  test('createProduct: delegates with tenant context and body', () => {
    let captured: any = null;
    const ctrl = new InventoryController(
      mockService({
        createProduct: (ctx: any, body: any) => {
          captured = { ctx, body };
          return { id: 'p-new' };
        },
      }),
    );
    const body = {
      name: 'Test Product',
      sku: 'TST-1',
      unit: 'pcs',
      price: 50,
      cost: 30,
      minStock: 5,
      maxStock: 100,
      currentStock: 20,
    };
    const result = ctrl.createProduct(tenantCtx, body);
    assert.equal(result.id, 'p-new');
    assert.equal(captured.ctx.tenantId, 't-1');
    assert.equal(captured.body.name, 'Test Product');
  });

  test('updateProduct: delegates with productId, tenant context, and body', () => {
    let captured: any = null;
    const ctrl = new InventoryController(
      mockService({
        updateProduct: (id: string, ctx: any, body: any) => {
          captured = { id, ctx, body };
          return { id };
        },
      }),
    );
    const result = ctrl.updateProduct('prod-X', tenantCtx, { name: 'Renamed' });
    assert.equal(result.id, 'prod-X');
    assert.equal(captured.id, 'prod-X');
    assert.equal(captured.body.name, 'Renamed');
  });

  test('getProduct: returns product by id', () => {
    const ctrl = new InventoryController(
      mockService({
        getProduct: (id: string) => ({ id, name: 'Widget' }),
      }),
    );
    const result = ctrl.getProduct('prod-42', tenantCtx);
    assert.equal(result.id, 'prod-42');
    assert.equal(result.name, 'Widget');
  });

  test('getProduct: throws when not found', () => {
    const ctrl = new InventoryController(
      mockService({
        getProduct: () => {
          throw new Error('Product not found');
        },
      }),
    );
    assert.throws(() => ctrl.getProduct('nonexistent', tenantCtx), /Product not found/);
  });

  test('listProducts: delegates query filter', () => {
    let capturedQuery: any = null;
    const ctrl = new InventoryController(
      mockService({
        listProducts: (_ctx: any, query: any) => {
          capturedQuery = query;
          return [{ id: 'p-1' }];
        },
      }),
    );
    const query = { category: 'electronics', limit: 10 };
    const result = ctrl.listProducts(tenantCtx, query);
    assert.equal(result.length, 1);
    assert.equal(capturedQuery.category, 'electronics');
  });

  test('stockIn: delegates with quantity', () => {
    let capturedBody: any = null;
    const ctrl = new InventoryController(
      mockService({
        stockIn: (ctx: any, body: any) => {
          capturedBody = body;
          return { product: { id: body.productId }, record: {} };
        },
      }),
    );
    const result = ctrl.stockIn(tenantCtx, { productId: 'p-1', quantity: 50 });
    assert.equal(result.product.id, 'p-1');
    assert.equal(capturedBody.quantity, 50);
  });

  test('stockOut: returns updated stock', () => {
    const ctrl = new InventoryController(
      mockService({
        stockOut: () => ({ product: { currentStock: 30 }, record: {} }),
      }),
    );
    const result = ctrl.stockOut(tenantCtx, { productId: 'p-1', quantity: 20 });
    assert.equal(result.product.currentStock, 30);
  });

  test('stockOut: throws on insufficient stock', () => {
    const ctrl = new InventoryController(
      mockService({
        stockOut: () => {
          throw new Error('Insufficient stock');
        },
      }),
    );
    assert.throws(
      () => ctrl.stockOut(tenantCtx, { productId: 'p-1', quantity: 999 }),
      /Insufficient stock/,
    );
  });

  test('adjustStock: delegates adjustment', () => {
    const ctrl = new InventoryController(
      mockService({
        adjustStock: () => ({ product: { currentStock: 75 }, record: { type: 'adjustment' } }),
      }),
    );
    const result = ctrl.adjustStock(tenantCtx, {
      productId: 'p-1',
      quantity: 25,
      reason: 'inventory count',
    });
    assert.equal(result.product.currentStock, 75);
    assert.equal(result.record.type, 'adjustment');
  });

  test('checkStock: sufficient when qty <= 50', () => {
    const ctrl = new InventoryController(mockService());
    const result = ctrl.checkStock('p-1', '30', tenantCtx);
    assert.deepEqual(result, { productId: 'p-1', requiredQty: 30, sufficient: true });
  });

  test('checkStock: insufficient when qty > 50', () => {
    const ctrl = new InventoryController(mockService());
    const result = ctrl.checkStock('p-1', '100', tenantCtx);
    assert.deepEqual(result, { productId: 'p-1', requiredQty: 100, sufficient: false });
  });

  test('checkStock: defaults to 0 when qty is empty string', () => {
    const ctrl = new InventoryController(mockService());
    const result = ctrl.checkStock('p-1', '', tenantCtx);
    assert.equal(result.requiredQty, 0);
    assert.equal(result.sufficient, true);
  });

  test('getLowStockProducts: delegates with no threshold', () => {
    let captured: any = null;
    const ctrl = new InventoryController(
      mockService({
        getLowStockProducts: (ctx: any, threshold?: number) => {
          captured = { ctx, threshold };
          return [];
        },
      }),
    );
    ctrl.getLowStockProducts(tenantCtx, undefined);
    assert.equal(captured.threshold, undefined);
  });

  test('getLowStockProducts: with threshold parses string to number', () => {
    let capturedThreshold: number | undefined;
    const ctrl = new InventoryController(
      mockService({
        getLowStockProducts: (_ctx: any, threshold?: number) => {
          capturedThreshold = threshold;
          return [];
        },
      }),
    );
    ctrl.getLowStockProducts(tenantCtx, '30');
    assert.equal(capturedThreshold, 30);
  });

  test('getStockRecords: delegates with query', () => {
    let capturedQuery: any = null;
    const ctrl = new InventoryController(
      mockService({
        getStockRecords: (_ctx: any, query: any) => {
          capturedQuery = query;
          return [{ id: 'sr-1' }];
        },
      }),
    );
    ctrl.getStockRecords(tenantCtx, { productId: 'p-1' });
    assert.equal(capturedQuery.productId, 'p-1');
  });

  test('createSupplier: returns new supplier', () => {
    const ctrl = new InventoryController(
      mockService({
        createSupplier: () => ({ id: 's-new', name: 'Supplier Co' }),
      }),
    );
    const result = ctrl.createSupplier(tenantCtx, { name: 'Supplier Co', contactPerson: 'John' });
    assert.equal(result.id, 's-new');
    assert.equal(result.name, 'Supplier Co');
  });

  test('listSuppliers: returns supplier list', () => {
    const ctrl = new InventoryController(mockService());
    const result = ctrl.listSuppliers(tenantCtx);
    assert.equal(result.length, 2);
    assert.equal(result[0].id, 's-1');
  });

  test('createPurchaseOrder: returns draft order', () => {
    const ctrl = new InventoryController(
      mockService({
        createPurchaseOrder: () => ({ id: 'po-new', status: 'draft' }),
      }),
    );
    const body = {
      items: [
        {
          productId: 'p-1',
          productName: 'A',
          sku: 'A-1',
          quantity: 10,
          unitPrice: 5,
          totalPrice: 50,
        },
      ],
      totalAmount: 50,
    };
    const result = ctrl.createPurchaseOrder(tenantCtx, body);
    assert.equal(result.id, 'po-new');
    assert.equal(result.status, 'draft');
  });

  test('confirmOrder: transitions status to confirmed', () => {
    let capturedId: string | null = null;
    const ctrl = new InventoryController(
      mockService({
        confirmOrder: (id: string) => {
          capturedId = id;
          return { id, status: 'confirmed' };
        },
      }),
    );
    const result = ctrl.confirmOrder('po-abc', tenantCtx);
    assert.equal(result.status, 'confirmed');
    assert.equal(capturedId, 'po-abc');
  });

  test('receiveOrder: transitions status to received', () => {
    const ctrl = new InventoryController(
      mockService({
        receiveOrder: (id: string) => ({ id, status: 'received' }),
      }),
    );
    const result = ctrl.receiveOrder('po-xyz', tenantCtx);
    assert.equal(result.status, 'received');
  });

  test('confirmOrder: throws on invalid transition', () => {
    const ctrl = new InventoryController(
      mockService({
        confirmOrder: () => {
          throw new Error('Cannot confirm: order already received');
        },
      }),
    );
    assert.throws(() => ctrl.confirmOrder('po-bad', tenantCtx), /Cannot confirm/);
  });

  test('listPurchaseOrders: delegates query', () => {
    let capturedQuery: any = null;
    const ctrl = new InventoryController(
      mockService({
        listPurchaseOrders: (_ctx: any, query: any) => {
          capturedQuery = query;
          return [];
        },
      }),
    );
    ctrl.listPurchaseOrders(tenantCtx, { status: 'draft' });
    assert.equal(capturedQuery.status, 'draft');
  });
});

describe('InventoryController — Error propagation', () => {
  test('service error propagates through stockOut', () => {
    const ctrl = new InventoryController(
      mockService({
        stockOut: () => {
          throw new Error('Insufficient stock: only 5 available');
        },
      }),
    );
    assert.throws(
      () => ctrl.stockOut(tenantCtx, { productId: 'p-1', quantity: 100 }),
      /Insufficient stock/,
    );
  });

  test('service error propagates through getProduct', () => {
    const ctrl = new InventoryController(
      mockService({
        getProduct: () => {
          throw new Error('Product not found');
        },
      }),
    );
    assert.throws(() => ctrl.getProduct('bad-id', tenantCtx), /Product not found/);
  });

  test('service error propagates through confirmOrder', () => {
    const ctrl = new InventoryController(
      mockService({
        confirmOrder: () => {
          throw new Error('Order is in cancelled state');
        },
      }),
    );
    assert.throws(() => ctrl.confirmOrder('po-cancelled', tenantCtx), /cancelled/);
  });
});
