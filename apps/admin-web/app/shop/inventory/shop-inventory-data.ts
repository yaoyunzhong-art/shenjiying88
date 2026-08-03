export type ShopInventoryStatus = 'healthy' | 'low' | 'out'

export interface ShopInventoryItem {
  id: string
  sku: string
  name: string
  category: string
  availableQty: number
  threshold: number
  status: ShopInventoryStatus
  updatedAt: string
}

export interface ShopInventorySnapshot {
  deliveryMode: 'fallback'
  sourceLabel: 'local-shop-inventory-snapshot'
  items: ShopInventoryItem[]
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
}

export const SHOP_INVENTORY_ITEMS: ShopInventoryItem[] = [
  { id: 'inv-201', sku: 'SKU-201', name: '游戏币 100 枚', category: '票券', availableQty: 420, threshold: 120, status: 'healthy', updatedAt: '2026-07-27 09:00' },
  { id: 'inv-202', sku: 'SKU-202', name: '扭蛋盲盒', category: '玩具', availableQty: 54, threshold: 60, status: 'low', updatedAt: '2026-07-27 08:50' },
  { id: 'inv-203', sku: 'SKU-203', name: '限定手办', category: '周边', availableQty: 0, threshold: 20, status: 'out', updatedAt: '2026-07-27 08:10' },
  { id: 'inv-204', sku: 'SKU-204', name: '会员月卡', category: '票券', availableQty: 180, threshold: 50, status: 'healthy', updatedAt: '2026-07-27 07:40' },
]

export async function loadShopInventorySnapshot(): Promise<ShopInventorySnapshot> {
  return {
    deliveryMode: 'fallback',
    sourceLabel: 'local-shop-inventory-snapshot',
    items: SHOP_INVENTORY_ITEMS,
    generatedAt: '2026-07-27T09:50:00.000Z',
    controlPlaneSource: 'loadShopInventorySnapshot -> SHOP_INVENTORY_ITEMS',
    businessDataSource: 'local shop inventory sample records',
    refreshPath: 'ShopInventoryPage -> loadShopInventorySnapshot',
    note: '当前页面消费本地店铺库存快照，适用于结构固证与预警交互演示。',
  }
}
