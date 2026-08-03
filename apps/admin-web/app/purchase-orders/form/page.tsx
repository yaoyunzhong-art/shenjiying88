import PurchaseOrderFormClient from './purchase-order-form-client'
import { loadPurchaseOrderFormSnapshot } from './purchase-order-form-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function PurchaseOrderFormPage() {
  const snapshot = await loadPurchaseOrderFormSnapshot()
  return <PurchaseOrderFormClient snapshot={snapshot} />
}
