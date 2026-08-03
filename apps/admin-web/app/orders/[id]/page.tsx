import OrderDetailClient from './order-detail-client'
import { loadOrderDetailSnapshot } from './order-detail-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function OrderDetailPage({ params }: PageProps) {
  const { id } = await params
  const snapshot = await loadOrderDetailSnapshot(id)

  return <OrderDetailClient snapshot={snapshot} />
}
