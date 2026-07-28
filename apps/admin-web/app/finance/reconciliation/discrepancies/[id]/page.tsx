import DiscrepancyDetailClient from './discrepancy-detail-client'
import { loadDiscrepancyDetailSnapshot } from './discrepancy-detail-data'

interface PageProps {
  params: Promise<{ id: string }>
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function DiscrepancyDetailPage({ params }: PageProps) {
  const { id } = await params
  const snapshot = await loadDiscrepancyDetailSnapshot(id)
  return <DiscrepancyDetailClient snapshot={snapshot} />
}
