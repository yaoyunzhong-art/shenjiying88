import StoreOrdersClient from './orders-client'
import { loadStoreOrdersSnapshot } from './orders-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function OrdersPage({ params }: PageProps) {
  const { id } = await params
  const snapshot = await loadStoreOrdersSnapshot(id)

  return <StoreOrdersClient snapshot={snapshot} />
}
