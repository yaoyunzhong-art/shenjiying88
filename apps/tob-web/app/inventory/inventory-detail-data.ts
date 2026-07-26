import {
  MOCK_PURCHASE_ORDERS,
  MOCK_INVENTORY_CHECKS,
  MOCK_TRANSFERS,
  getProductById,
  getSKUsByProductId,
  type Product,
  type SKU,
  type PurchaseOrder,
  type InventoryCheck,
  type CrossStoreTransfer,
} from './inventory-data';

export interface InventoryDetailSnapshot {
  deliveryMode: 'fallback';
  productId: string;
  generatedAt: string;
  product: Product | null;
  skus: SKU[];
  relatedPOs: PurchaseOrder[];
  relatedChecks: InventoryCheck[];
  relatedTransfers: CrossStoreTransfer[];
  error?: string;
}

function cloneValue<T>(value: T): T {
  return structuredClone(value);
}

export async function loadInventoryDetailSnapshot(productId: string): Promise<InventoryDetailSnapshot> {
  const product = getProductById(productId);
  const skus = getSKUsByProductId(productId);
  const skuIds = new Set(skus.map((sku) => sku.skuId));

  return {
    deliveryMode: 'fallback',
    productId,
    generatedAt: new Date().toISOString(),
    product: product ? cloneValue(product) : null,
    skus: cloneValue(skus),
    relatedPOs: cloneValue(
      MOCK_PURCHASE_ORDERS.filter((order) => order.items.some((item) => skuIds.has(item.skuId))),
    ),
    relatedChecks: cloneValue(
      MOCK_INVENTORY_CHECKS.filter((check) => check.items.some((item) => skuIds.has(item.skuId))),
    ),
    relatedTransfers: cloneValue(
      MOCK_TRANSFERS.filter((transfer) => transfer.items.some((item) => skuIds.has(item.skuId))),
    ),
    error: product
      ? '当前详情页使用本地库存样本快照，数据仅用于结构验收。'
      : `产品ID ${productId} 未命中本地库存样本。`,
  };
}
