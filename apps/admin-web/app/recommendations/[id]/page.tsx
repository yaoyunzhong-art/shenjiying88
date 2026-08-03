import RecommendationDetailClient from './recommendation-detail-client'
import { loadRecommendationDetailSnapshot } from './recommendation-detail-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function RecommendationDetailPage({ params }: PageProps) {
  const { id } = await params
  const snapshot = await loadRecommendationDetailSnapshot(id)

  return <RecommendationDetailClient snapshot={snapshot} />
}
