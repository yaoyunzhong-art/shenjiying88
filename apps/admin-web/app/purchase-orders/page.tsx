import PurchaseOrdersClient from './purchase-orders-client'
import { loadPurchaseOrdersPageSnapshot } from './purchase-orders-page-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function PurchaseOrdersPage() {
  const snapshot = await loadPurchaseOrdersPageSnapshot()
  return <PurchaseOrdersClient snapshot={snapshot} />
}
