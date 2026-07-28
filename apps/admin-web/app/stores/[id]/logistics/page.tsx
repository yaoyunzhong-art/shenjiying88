import LogisticsClient from './logistics-client'
import { loadLogisticsSnapshot } from './logistics-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function LogisticsPage({ params }: PageProps) {
  const { id } = await params
  const snapshot = await loadLogisticsSnapshot(id)

  return <LogisticsClient snapshot={snapshot} />
}
