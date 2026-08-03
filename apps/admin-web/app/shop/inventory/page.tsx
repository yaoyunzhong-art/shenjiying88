import ShopInventoryClient from './shop-inventory-client'
import { loadShopInventorySnapshot } from './shop-inventory-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ShopInventoryPage() {
  const snapshot = await loadShopInventorySnapshot()

  return <ShopInventoryClient snapshot={snapshot} />
}
