import MarketingClient from './marketing-client'
import { loadMarketingSnapshot } from './marketing-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function MarketingPage({ params }: PageProps) {
  const { id } = await params
  const snapshot = await loadMarketingSnapshot(id)

  return <MarketingClient snapshot={snapshot} />
}
