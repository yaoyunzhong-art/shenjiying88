import MarketingDetailClient from './marketing-detail-client'
import { loadMarketingDetailSnapshot } from './marketing-detail-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function MarketingCampaignDetailPage({ params }: PageProps) {
  const { id } = await params
  const snapshot = await loadMarketingDetailSnapshot(id)

  return <MarketingDetailClient snapshot={snapshot} />
}
