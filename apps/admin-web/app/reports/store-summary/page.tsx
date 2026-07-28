import StoreSummaryClient from './store-summary-client'
import { loadStoreSummarySnapshot } from './store-summary-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function StoreSummaryPage() {
  const snapshot = await loadStoreSummarySnapshot()

  return <StoreSummaryClient snapshot={snapshot} />
}
