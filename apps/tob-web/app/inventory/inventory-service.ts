/**
 * inventory-service.ts — 进销存 API 服务层
 */
import {
  MOCK_PRODUCTS,
  MOCK_SKUS,
  MOCK_PURCHASE_ORDERS,
  MOCK_INVENTORY_CHECKS,
  MOCK_TRANSFERS,
  MOCK_STORE_STATS,
  type Product,
  type SKU,
  type PurchaseOrder,
  type InventoryCheck,
  type CrossStoreTransfer,
  type StoreStats,
  type POStatus,
  type TransferStatus,
} from './inventory-data';

const TENANT = 'demo-tenant';

function buildHeaders(): HeadersInit {
  return {
    'x-tenant-id': TENANT
  };
}

async function requestJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      ...buildHeaders(),
      ...(init.headers ?? {})
    },
    cache: 'no-store'
  });
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  return (await response.json()) as T;
}

// ===================== 商品管理 =====================

/**
 * 获取所有商品
 */
export async function getProducts(): Promise<Product[]> {
  try {
    return await requestJson<Product[]>('/api/inventory/products');
  } catch {
    return [...MOCK_PRODUCTS];
  }
}

/**
 * 获取单个商品
 */
export async function getProduct(id: string): Promise<Product | null> {
  try {
    return await requestJson<Product>(`/api/inventory/products/${id}`);
  } catch {
    return MOCK_PRODUCTS.find(p => p.productId === id) ?? null;
  }
}

interface CreateProductData {
  name: string;
  category: string;
  brand: string;
  unit: string;
}

/**
 * 创建商品
 */
export async function createProduct(data: CreateProductData): Promise<Product> {
  try {
    return await requestJson<Product>('/api/inventory/products', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(data)
    });
  } catch {
    const newProduct: Product = {
      productId: `P${Date.now()}`,
      ...data,
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    MOCK_PRODUCTS.push(newProduct);
    return newProduct;
  }
}

interface UpdateProductData {
  name?: string;
  category?: string;
  brand?: string;
  unit?: string;
  status?: 'active' | 'inactive';
}

/**
 * 更新商品
 */
export async function updateProduct(id: string, data: UpdateProductData): Promise<Product | null> {
  try {
    return await requestJson<Product>(`/api/inventory/products/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(data)
    });
  } catch {
    const idx = MOCK_PRODUCTS.findIndex(p => p.productId === id);
    if (idx === -1) return null;
    const existing = MOCK_PRODUCTS[idx]!;
    MOCK_PRODUCTS[idx] = { ...existing, ...data };
    return MOCK_PRODUCTS[idx];
  }
}

// ===================== SKU 管理 =====================

/**
 * 获取商品的 SKU 列表
 */
export async function getSKUs(productId: string): Promise<SKU[]> {
  try {
    return await requestJson<SKU[]>(`/api/inventory/products/${productId}/skus`);
  } catch {
    return MOCK_SKUS.filter(s => s.productId === productId);
  }
}

/**
 * 更新 SKU 库存（增量）
 */
export async function updateSKUStock(skuId: string, delta: number): Promise<SKU | null> {
  try {
    return await requestJson<SKU>(`/api/inventory/skus/${skuId}/stock`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ delta })
    });
  } catch {
    const idx = MOCK_SKUS.findIndex(s => s.skuId === skuId);
    if (idx === -1) return null;
    const sku = MOCK_SKUS[idx]!;
    sku.stock = Math.max(0, sku.stock + delta);
    return sku;
  }
}

// ===================== 采购订单 =====================

/**
 * 获取采购订单列表
 */
export async function getPurchaseOrders(status?: POStatus): Promise<PurchaseOrder[]> {
  try {
    const query = status ? `?status=${status}` : '';
    return await requestJson<PurchaseOrder[]>(`/api/inventory/purchase-orders${query}`);
  } catch {
    if (status) {
      return MOCK_PURCHASE_ORDERS.filter(po => po.status === status);
    }
    return [...MOCK_PURCHASE_ORDERS];
  }
}

interface ReceivePOItem {
  skuId: string;
  quantity: number;
}

/**
 * 采购单收货确认
 */
export async function receivePO(poId: string, items: ReceivePOItem[]): Promise<PurchaseOrder | null> {
  try {
    return await requestJson<PurchaseOrder>(`/api/inventory/purchase-orders/${poId}/receive`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ items })
    });
  } catch {
    const idx = MOCK_PURCHASE_ORDERS.findIndex(po => po.poId === poId);
    if (idx === -1) return null;
    const order = MOCK_PURCHASE_ORDERS[idx]!;
    for (const item of items) {
      const poItem = order.items.find(i => i.skuId === item.skuId);
      if (poItem) {
        poItem.receivedQuantity += item.quantity;
      }
      const sku = MOCK_SKUS.find(s => s.skuId === item.skuId);
      if (sku) {
        sku.stock += item.quantity;
      }
    }
    if (order.items.every(i => i.receivedQuantity >= i.quantity)) {
      order.status = 'received';
      order.receivedAt = new Date().toISOString();
    }
    return order;
  }
}

// ===================== 库存盘点 =====================

/**
 * 获取盘点单列表
 */
export async function getInventoryChecks(storeId?: string): Promise<InventoryCheck[]> {
  try {
    const query = storeId ? `?storeId=${storeId}` : '';
    return await requestJson<InventoryCheck[]>(`/api/inventory/checks${query}`);
  } catch {
    if (storeId) {
      return MOCK_INVENTORY_CHECKS.filter(c => c.storeId === storeId);
    }
    return [...MOCK_INVENTORY_CHECKS];
  }
}

// ===================== 跨店调拨 =====================

/**
 * 获取调拨单列表
 */
export async function getTransfers(status?: TransferStatus): Promise<CrossStoreTransfer[]> {
  try {
    const query = status ? `?status=${status}` : '';
    return await requestJson<CrossStoreTransfer[]>(`/api/inventory/transfers${query}`);
  } catch {
    if (status) {
      return MOCK_TRANSFERS.filter(t => t.status === status);
    }
    return [...MOCK_TRANSFERS];
  }
}

/**
 * 审批调拨单
 */
export async function approveTransfer(id: string): Promise<CrossStoreTransfer | null> {
  try {
    return await requestJson<CrossStoreTransfer>(`/api/inventory/transfers/${id}/approve`, {
      method: 'POST'
    });
  } catch {
    const idx = MOCK_TRANSFERS.findIndex(t => t.transferId === id);
    if (idx === -1) return null;
    const transfer = MOCK_TRANSFERS[idx]!;
    transfer.status = 'approved';
    transfer.approvedAt = new Date().toISOString();
    transfer.approver = '陈主管';
    return transfer;
  }
}

/**
 * 执行调拨单
 */
export async function executeTransfer(id: string): Promise<CrossStoreTransfer | null> {
  try {
    return await requestJson<CrossStoreTransfer>(`/api/inventory/transfers/${id}/execute`, {
      method: 'POST'
    });
  } catch {
    const idx = MOCK_TRANSFERS.findIndex(t => t.transferId === id);
    if (idx === -1) return null;
    const transfer = MOCK_TRANSFERS[idx]!;
    transfer.status = 'in_transit';
    transfer.executedAt = new Date().toISOString();
    return transfer;
  }
}

/**
 * 接收调拨单
 */
export async function receiveTransfer(id: string): Promise<CrossStoreTransfer | null> {
  try {
    return await requestJson<CrossStoreTransfer>(`/api/inventory/transfers/${id}/receive`, {
      method: 'POST'
    });
  } catch {
    const idx = MOCK_TRANSFERS.findIndex(t => t.transferId === id);
    if (idx === -1) return null;
    const transfer = MOCK_TRANSFERS[idx]!;
    transfer.status = 'completed';
    transfer.receivedAt = new Date().toISOString();
    // 更新目标门店库存
    for (const item of transfer.items) {
      const sku = MOCK_SKUS.find(s => s.skuId === item.skuId);
      if (sku) {
        sku.stock += item.quantity;
      }
    }
    return transfer;
  }
}

// ===================== 门店库存统计 =====================

/**
 * 获取门店库存统计
 */
export async function getStoreStats(): Promise<StoreStats[]> {
  try {
    return await requestJson<StoreStats[]>('/api/inventory/store-stats');
  } catch {
    return [...MOCK_STORE_STATS];
  }
}
