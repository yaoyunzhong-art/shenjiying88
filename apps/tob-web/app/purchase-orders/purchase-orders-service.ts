/**
 * purchase-orders-service.ts — 采购订单 API 服务层
 */
import {
  MOCK_PURCHASE_ORDERS,
  MOCK_SKUS,
  type PurchaseOrder,
  type PurchaseOrderItem,
  type POStatus,
} from '../inventory/inventory-data';
import type { CreatePOFormValues } from './purchase-orders-data';

const TENANT = 'demo-tenant';

function buildHeaders(): HeadersInit {
  return { 'x-tenant-id': TENANT };
}

async function requestJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { ...buildHeaders(), ...(init.headers ?? {}) },
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
  return (await response.json()) as T;
}

/**
 * 获取采购订单列表
 */
export async function getPurchaseOrders(status?: POStatus): Promise<PurchaseOrder[]> {
  try {
    const qs = status ? `?status=${status}` : '';
    return await requestJson<PurchaseOrder[]>(`/api/inventory/purchase-orders${qs}`);
  } catch {
    if (status) return MOCK_PURCHASE_ORDERS.filter((o) => o.status === status);
    return [...MOCK_PURCHASE_ORDERS];
  }
}

/**
 * 获取单个采购订单
 */
export async function getPurchaseOrder(id: string): Promise<PurchaseOrder | null> {
  try {
    return await requestJson<PurchaseOrder>(`/api/inventory/purchase-orders/${id}`);
  } catch {
    return MOCK_PURCHASE_ORDERS.find((o) => o.poId === id) ?? null;
  }
}

/**
 * 创建采购订单（模拟 + 兜底 mock）
 */
export async function createPurchaseOrder(data: CreatePOFormValues): Promise<PurchaseOrder> {
  const body = {
    supplierId: data.supplierId,
    items: data.items.map((it) => ({ skuId: it.skuId, quantity: it.quantity, unitCost: it.unitCost })),
  };
  try {
    return await requestJson<PurchaseOrder>('/api/inventory/purchase-orders', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    const items: PurchaseOrderItem[] = data.items.map((it, i) => ({
      itemId: `POI-${Date.now()}-${i}`,
      skuId: it.skuId,
      skuName: it.skuName,
      quantity: it.quantity,
      receivedQuantity: 0,
      unitCost: it.unitCost,
    }));
    const totalAmount = items.reduce((s, i) => s + i.quantity * i.unitCost, 0);
    const order: PurchaseOrder = {
      poId: `PO${Date.now()}`,
      poNo: `PO-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(MOCK_PURCHASE_ORDERS.length + 1).padStart(3, '0')}`,
      supplierId: data.supplierId,
      supplierName: data.supplierName,
      status: 'draft',
      items,
      totalAmount,
      appliedAt: new Date().toISOString(),
      approvedAt: null,
      receivedAt: null,
    };
    MOCK_PURCHASE_ORDERS.unshift(order);
    // 同步 Mock_SKUS 的成本价
    for (const it of data.items) {
      const sku = MOCK_SKUS.find((s) => s.skuId === it.skuId);
      if (sku) sku.costPrice = it.unitCost;
    }
    return order;
  }
}

/**
 * 获取所有采购订单（给列表页用）
 */
export async function getAllPurchaseOrders(): Promise<PurchaseOrder[]> {
  return getPurchaseOrders();
}
