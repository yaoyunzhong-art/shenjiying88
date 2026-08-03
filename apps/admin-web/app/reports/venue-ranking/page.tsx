import VenueRankingClient from './venue-ranking-client'
import { loadVenueRankingSnapshot } from './venue-ranking-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function VenueRankingPage() {
  const snapshot = await loadVenueRankingSnapshot()

  return <VenueRankingClient snapshot={snapshot} />
}
