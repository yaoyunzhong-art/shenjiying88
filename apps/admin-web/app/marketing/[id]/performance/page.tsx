import MarketingPerformanceClient from './marketing-performance-client'
import { loadMarketingPerformanceSnapshot } from './marketing-performance-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function CampaignPerformancePage({ params }: PageProps) {
  const { id } = await params
  const snapshot = await loadMarketingPerformanceSnapshot(id)

  return <MarketingPerformanceClient snapshot={snapshot} />
}
