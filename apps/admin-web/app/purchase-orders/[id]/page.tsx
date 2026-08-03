import PurchaseOrderDetailClient from './purchase-order-detail-client'
import { loadPurchaseOrderDetailSnapshot } from './purchase-order-detail-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type PageProps = {
  params: Promise<{ id: string }>
}
export default async function PurchaseOrderDetailPage({ params }: PageProps) {
  const { id } = await params
  const snapshot = await loadPurchaseOrderDetailSnapshot(id)
  return <PurchaseOrderDetailClient snapshot={snapshot} />
}
