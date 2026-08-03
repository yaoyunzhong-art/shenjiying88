import RecommendationsClient from './recommendations-client'
import { loadRecommendationsSnapshot } from './recommendations-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function RecommendationsPage() {
  const snapshot = await loadRecommendationsSnapshot()
  return <RecommendationsClient snapshot={snapshot} />
}
