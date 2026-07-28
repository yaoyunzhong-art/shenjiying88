import CompetitorTrackClient from './competitor-track-client'
import { loadCompetitorTrackSnapshot } from './competitor-track-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function CompetitorTrackPage() {
  const snapshot = await loadCompetitorTrackSnapshot()

  return <CompetitorTrackClient snapshot={snapshot} />
}
