import RepairDetailClient from './repair-detail-client'
import { loadRepairDetailSnapshot } from './repair-detail-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function LogisticsRepairDetailPage({ params }: PageProps) {
  const { id } = await params
  const snapshot = await loadRepairDetailSnapshot(id)

  return <RepairDetailClient snapshot={snapshot} />
}
