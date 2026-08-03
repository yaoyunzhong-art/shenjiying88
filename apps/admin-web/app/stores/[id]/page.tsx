import StoreDetailClient from './store-detail-client'
import { loadStoreDetailPageSnapshot } from './store-detail-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function StoreDetailPage({ params }: PageProps) {
  const { id } = await params
  const snapshot = await loadStoreDetailPageSnapshot(id)
  return <StoreDetailClient snapshot={snapshot} />
}
