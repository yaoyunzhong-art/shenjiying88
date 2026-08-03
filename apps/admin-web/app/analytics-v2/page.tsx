import AnalyticsV2Client from './analytics-v2-client'
import { loadAnalyticsV2Snapshot } from './analytics-v2-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AnalyticsV2Page() {
  const snapshot = await loadAnalyticsV2Snapshot()

  return <AnalyticsV2Client snapshot={snapshot} />
}
