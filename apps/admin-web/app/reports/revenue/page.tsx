import RevenueClient from './revenue-client'
import { loadRevenueSnapshot } from './revenue-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function RevenuePage() {
  const snapshot = await loadRevenueSnapshot()

  return <RevenueClient snapshot={snapshot} />
}
