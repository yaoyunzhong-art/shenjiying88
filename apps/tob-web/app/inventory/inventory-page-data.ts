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
} from './inventory-data';

export interface InventoryPageSnapshot {
  deliveryMode: 'fallback';
  generatedAt: string;
  products: Product[];
  skuMap: Record<string, SKU[]>;
  purchaseOrders: PurchaseOrder[];
  inventoryChecks: InventoryCheck[];
  transfers: CrossStoreTransfer[];
  storeStats: StoreStats[];
  error: string;
}

function cloneValue<T>(value: T): T {
  return structuredClone(value);
}

export async function loadInventorySnapshot(): Promise<InventoryPageSnapshot> {
  const products = cloneValue(MOCK_PRODUCTS);
  const skuMap = Object.fromEntries(
    products.map((product) => [
      product.productId,
      cloneValue(MOCK_SKUS.filter((sku) => sku.productId === product.productId)),
    ]),
  );

  return {
    deliveryMode: 'fallback',
    generatedAt: new Date().toISOString(),
    products,
    skuMap,
    purchaseOrders: cloneValue(MOCK_PURCHASE_ORDERS),
    inventoryChecks: cloneValue(MOCK_INVENTORY_CHECKS),
    transfers: cloneValue(MOCK_TRANSFERS),
    storeStats: cloneValue(MOCK_STORE_STATS),
    error: '当前页面使用本地进销存样本快照，来源态仅可用于结构验收，不可作为闭环复签证据。',
  };
}
