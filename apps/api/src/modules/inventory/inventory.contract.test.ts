import assert from 'node:assert/strict';
import test from 'node:test';
import {
  toProductContract,
  toStockRecordContract,
  toSupplierContract,
  toPurchaseOrderContract,
  toStockAlertContract,
  isStockSufficient,
} from './inventory.contract';
import { ProductStatus, StockRecordType, PurchaseOrderStatus } from './inventory.entity';

/* ------------------------------------------------------------------ */
/*  toProductContract                                                  */
/* ------------------------------------------------------------------ */

test('toProductContract maps full product correctly', () => {
  const product = {
    id: 'prod-123',
    tenantId: 't-1',
    brandId: 'b-1',
    storeId: 's-1',
    name: 'Test Product',
    sku: 'TP-001',
    category: 'Electronics',
    unit: 'pcs',
    price: 99.99,
    cost: 50.0,
    minStock: 10,
    maxStock: 100,
    currentStock: 50,
    status: ProductStatus.Active,
    imageUrl: 'https://example.com/img.jpg',
    barcode: '123456789',
    createdAt: '2026-06-23T08:00:00.000Z',
    updatedAt: '2026-06-23T08:30:00.000Z',
  };

  const contract = toProductContract(product);

  assert.equal(contract.id, 'prod-123');
  assert.equal(contract.tenantId, 't-1');
  assert.equal(contract.name, 'Test Product');
  assert.equal(contract.sku, 'TP-001');
  assert.equal(contract.category, 'Electronics');
  assert.equal(contract.price, 99.99);
  assert.equal(contract.currentStock, 50);
  assert.equal(contract.status, ProductStatus.Active);
  assert.equal(contract.createdAt, '2026-06-23T08:00:00.000Z');
});

test('toProductContract maps product with minimal fields', () => {
  const product = {
    id: 'prod-456',
    tenantId: 't-2',
    name: 'Minimal Product',
    sku: 'MP-001',
    unit: 'kg',
    price: 10,
    cost: 5,
    minStock: 1,
    maxStock: 50,
    currentStock: 25,
    status: ProductStatus.Active,
    createdAt: '2026-06-23T08:00:00.000Z',
    updatedAt: '2026-06-23T08:00:00.000Z',
  };

  const contract = toProductContract(product);

  assert.equal(contract.id, 'prod-456');
  assert.equal(contract.tenantId, 't-2');
  assert.equal(contract.brandId, undefined);
  assert.equal(contract.storeId, undefined);
  assert.equal(contract.category, undefined);
});

test('toProductContract maps discontinued status correctly', () => {
  const product = {
    id: 'prod-789',
    tenantId: 't-1',
    name: 'Discontinued Product',
    sku: 'DP-001',
    unit: 'box',
    price: 0,
    cost: 0,
    minStock: 0,
    maxStock: 0,
    currentStock: 0,
    status: ProductStatus.Discontinued,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-06-01T00:00:00.000Z',
  };

  const contract = toProductContract(product);

  assert.equal(contract.status, ProductStatus.Discontinued);
  assert.equal(contract.currentStock, 0);
});

/* ------------------------------------------------------------------ */
/*  toStockRecordContract                                              */
/* ------------------------------------------------------------------ */

test('toStockRecordContract maps inbound record correctly', () => {
  const record = {
    id: 'sr-001',
    productId: 'prod-123',
    storeId: 's-1',
    type: StockRecordType.Inbound,
    quantity: 10,
    beforeStock: 40,
    afterStock: 50,
    reason: '进货补货',
    operatorId: 'op-1',
    batchNo: 'BATCH-001',
    createdAt: '2026-06-23T08:00:00.000Z',
  };

  const contract = toStockRecordContract(record);

  assert.equal(contract.id, 'sr-001');
  assert.equal(contract.productId, 'prod-123');
  assert.equal(contract.type, StockRecordType.Inbound);
  assert.equal(contract.quantity, 10);
  assert.equal(contract.beforeStock, 40);
  assert.equal(contract.afterStock, 50);
  assert.equal(contract.reason, '进货补货');
  assert.equal(contract.createdAt, '2026-06-23T08:00:00.000Z');
});

test('toStockRecordContract maps outbound record correctly', () => {
  const record = {
    id: 'sr-002',
    productId: 'prod-123',
    storeId: 's-1',
    type: StockRecordType.Outbound,
    quantity: 5,
    beforeStock: 50,
    afterStock: 45,
    createdAt: '2026-06-23T09:00:00.000Z',
  };

  const contract = toStockRecordContract(record);

  assert.equal(contract.type, StockRecordType.Outbound);
  assert.equal(contract.quantity, 5);
  assert.equal(contract.reason, undefined);
});

test('toStockRecordContract maps adjustment record correctly', () => {
  const record = {
    id: 'sr-003',
    productId: 'prod-456',
    type: StockRecordType.Adjustment,
    quantity: 10,
    beforeStock: 35,
    afterStock: 25,
    reason: '盘点调整',
    createdAt: '2026-06-23T10:00:00.000Z',
  };

  const contract = toStockRecordContract(record);

  assert.equal(contract.type, StockRecordType.Adjustment);
  assert.equal(contract.quantity, 10);
  assert.equal(contract.beforeStock, 35);
  assert.equal(contract.afterStock, 25);
});

test('toStockRecordContract maps return record correctly', () => {
  const record = {
    id: 'sr-004',
    productId: 'prod-789',
    type: StockRecordType.Return,
    quantity: 2,
    beforeStock: 10,
    afterStock: 12,
    reason: '退货入库',
    createdAt: '2026-06-23T11:00:00.000Z',
  };

  const contract = toStockRecordContract(record);

  assert.equal(contract.type, StockRecordType.Return);
  assert.equal(contract.quantity, 2);
});

/* ------------------------------------------------------------------ */
/*  toSupplierContract                                                 */
/* ------------------------------------------------------------------ */

test('toSupplierContract maps full supplier correctly', () => {
  const supplier = {
    id: 'supplier-001',
    tenantId: 't-1',
    name: 'Test Supplier Co.',
    contactName: '张三',
    phone: '13800138000',
    email: 'zhangsan@supplier.com',
    address: '北京市朝阳区',
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  const contract = toSupplierContract(supplier);

  assert.equal(contract.id, 'supplier-001');
  assert.equal(contract.name, 'Test Supplier Co.');
  assert.equal(contract.contactName, '张三');
  assert.equal(contract.phone, '13800138000');
  assert.equal(contract.email, 'zhangsan@supplier.com');
});

test('toSupplierContract maps minimal supplier correctly', () => {
  const supplier = {
    id: 'supplier-002',
    tenantId: 't-2',
    name: 'Minimal Supplier',
    createdAt: '2026-02-01T00:00:00.000Z',
  };

  const contract = toSupplierContract(supplier);

  assert.equal(contract.name, 'Minimal Supplier');
  assert.equal(contract.contactName, undefined);
  assert.equal(contract.phone, undefined);
  assert.equal(contract.email, undefined);
});

/* ------------------------------------------------------------------ */
/*  toPurchaseOrderContract                                            */
/* ------------------------------------------------------------------ */

test('toPurchaseOrderContract maps draft order correctly', () => {
  const order = {
    id: 'po-001',
    tenantId: 't-1',
    storeId: 's-1',
    supplierId: 'supplier-001',
    status: PurchaseOrderStatus.Draft,
    items: [
      {
        productId: 'prod-1',
        productName: 'Item A',
        sku: 'A-001',
        quantity: 10,
        unitPrice: 50,
        totalPrice: 500,
      },
      {
        productId: 'prod-2',
        productName: 'Item B',
        sku: 'B-001',
        quantity: 5,
        unitPrice: 100,
        totalPrice: 500,
      },
    ],
    totalAmount: 1000,
    createdAt: '2026-06-23T08:00:00.000Z',
  };

  const contract = toPurchaseOrderContract(order);

  assert.equal(contract.id, 'po-001');
  assert.equal(contract.status, PurchaseOrderStatus.Draft);
  assert.equal(contract.itemCount, 2);
  assert.equal(contract.totalAmount, 1000);
  assert.equal(contract.receivedAt, undefined);
});

test('toPurchaseOrderContract maps received order with receivedAt', () => {
  const order = {
    id: 'po-002',
    tenantId: 't-1',
    storeId: 's-1',
    supplierId: 'supplier-001',
    status: PurchaseOrderStatus.Received,
    items: [
      {
        productId: 'prod-1',
        productName: 'Item A',
        sku: 'A-001',
        quantity: 10,
        unitPrice: 50,
        totalPrice: 500,
      },
    ],
    totalAmount: 500,
    createdAt: '2026-06-22T08:00:00.000Z',
    receivedAt: '2026-06-23T08:00:00.000Z',
  };

  const contract = toPurchaseOrderContract(order);

  assert.equal(contract.status, PurchaseOrderStatus.Received);
  assert.equal(contract.itemCount, 1);
  assert.equal(contract.receivedAt, '2026-06-23T08:00:00.000Z');
});

test('toPurchaseOrderContract maps cancelled order', () => {
  const order = {
    id: 'po-003',
    tenantId: 't-1',
    status: PurchaseOrderStatus.Cancelled,
    items: [],
    totalAmount: 0,
    createdAt: '2026-06-20T00:00:00.000Z',
  };

  const contract = toPurchaseOrderContract(order);

  assert.equal(contract.status, PurchaseOrderStatus.Cancelled);
  assert.equal(contract.itemCount, 0);
  assert.equal(contract.totalAmount, 0);
});

/* ------------------------------------------------------------------ */
/*  toStockAlertContract                                               */
/* ------------------------------------------------------------------ */

test('toStockAlertContract maps low stock alert correctly', () => {
  const product = {
    id: 'prod-123',
    tenantId: 't-1',
    name: 'Low Stock Item',
    sku: 'LS-001',
    unit: 'pcs',
    price: 20,
    cost: 10,
    minStock: 10,
    maxStock: 100,
    currentStock: 3,
    status: ProductStatus.Active,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-06-23T00:00:00.000Z',
  };

  const alert = {
    product,
    currentStock: 3,
    minStock: 10,
    maxStock: 100,
    status: 'low' as const,
  };

  const contract = toStockAlertContract(alert);

  assert.equal(contract.productId, 'prod-123');
  assert.equal(contract.productName, 'Low Stock Item');
  assert.equal(contract.sku, 'LS-001');
  assert.equal(contract.currentStock, 3);
  assert.equal(contract.minStock, 10);
  assert.equal(contract.status, 'low');
});

test('toStockAlertContract maps out of stock alert correctly', () => {
  const product = {
    id: 'prod-456',
    tenantId: 't-1',
    name: 'Out of Stock Item',
    sku: 'OS-001',
    unit: 'pcs',
    price: 15,
    cost: 8,
    minStock: 5,
    maxStock: 50,
    currentStock: 0,
    status: ProductStatus.Active,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-06-23T00:00:00.000Z',
  };

  const alert = {
    product,
    currentStock: 0,
    minStock: 5,
    maxStock: 50,
    status: 'out_of_stock' as const,
  };

  const contract = toStockAlertContract(alert);

  assert.equal(contract.currentStock, 0);
  assert.equal(contract.status, 'out_of_stock');
});

test('toStockAlertContract maps overstock alert correctly', () => {
  const product = {
    id: 'prod-789',
    tenantId: 't-1',
    name: 'Overstock Item',
    sku: 'OS-002',
    unit: 'pcs',
    price: 30,
    cost: 15,
    minStock: 10,
    maxStock: 50,
    currentStock: 120,
    status: ProductStatus.Active,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-06-23T00:00:00.000Z',
  };

  const alert = {
    product,
    currentStock: 120,
    minStock: 10,
    maxStock: 50,
    status: 'overstock' as const,
  };

  const contract = toStockAlertContract(alert);

  assert.equal(contract.currentStock, 120);
  assert.equal(contract.maxStock, 50);
  assert.equal(contract.status, 'overstock');
});

/* ------------------------------------------------------------------ */
/*  isStockSufficient                                                  */
/* ------------------------------------------------------------------ */

test('isStockSufficient returns true when stock >= required', () => {
  assert.equal(isStockSufficient(50, 10), true);
  assert.equal(isStockSufficient(10, 10), true);
  assert.equal(isStockSufficient(100, 0), true);
});

test('isStockSufficient returns false when stock < required', () => {
  assert.equal(isStockSufficient(5, 10), false);
  assert.equal(isStockSufficient(0, 1), false);
});

test('isStockSufficient handles boundary values', () => {
  assert.equal(isStockSufficient(0, 0), true);
  assert.equal(isStockSufficient(1, 1), true);
  assert.equal(isStockSufficient(100, 101), false);
});
