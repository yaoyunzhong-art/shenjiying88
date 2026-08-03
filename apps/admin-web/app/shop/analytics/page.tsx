import AnalyticsClient from './analytics-client'
import { loadShopAnalyticsSnapshot } from './analytics-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ShopAnalyticsPage() {
  const snapshot = await loadShopAnalyticsSnapshot()

  return <AnalyticsClient snapshot={snapshot} />
}
