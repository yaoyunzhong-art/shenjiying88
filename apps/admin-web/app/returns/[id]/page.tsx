import ReturnDetailClient from './return-detail-client'
import { loadReturnDetailSnapshot } from './return-detail-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function ReturnDetailPage({ params }: PageProps) {
  const { id } = await params
  const snapshot = await loadReturnDetailSnapshot(id)

  return <ReturnDetailClient snapshot={snapshot} />
}
