import LogisticsClient from './logistics-client'
import { loadLogisticsSnapshot } from './logistics-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function LogisticsPage() {
  const snapshot = await loadLogisticsSnapshot()

  return <LogisticsClient snapshot={snapshot} />
}
