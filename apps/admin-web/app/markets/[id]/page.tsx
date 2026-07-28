import MarketDetailClient from './market-detail-client'
import { loadMarketDetailSnapshot } from './market-detail-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function MarketDetailPage({ params }: PageProps) {
  const { id } = await params
  const snapshot = await loadMarketDetailSnapshot(id)

  return <MarketDetailClient snapshot={snapshot} />
}
