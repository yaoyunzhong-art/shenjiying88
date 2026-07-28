import PurchasingClient from './purchasing-client'
import { loadPurchasingSnapshot } from './purchasing-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function PurchasingPage() {
  const snapshot = await loadPurchasingSnapshot()
  return <PurchasingClient snapshot={snapshot} />
}
