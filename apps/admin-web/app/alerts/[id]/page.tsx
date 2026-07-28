import AlertDetailClient from './alert-detail-client'
import { loadAlertDetailSnapshot } from './alert-detail-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function AlertDetailPage({ params }: PageProps) {
  const { id } = await params
  const snapshot = await loadAlertDetailSnapshot(id)

  return <AlertDetailClient snapshot={snapshot} />
}
