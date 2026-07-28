import HealthScoreClient from './health-score-client'
import { loadHealthScoreSnapshot } from './health-score-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function HealthScorePage({ params }: PageProps) {
  const { id } = await params
  const snapshot = await loadHealthScoreSnapshot(id)

  return <HealthScoreClient snapshot={snapshot} />
}
