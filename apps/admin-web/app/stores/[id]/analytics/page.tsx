import AnalyticsClient from './analytics-client'
import { loadAnalyticsSnapshot } from './analytics-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function AnalyticsPage({ params }: PageProps) {
  const { id } = await params
  const snapshot = await loadAnalyticsSnapshot(id)

  return <AnalyticsClient snapshot={snapshot} />
}
