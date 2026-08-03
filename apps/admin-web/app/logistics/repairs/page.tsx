import RepairsClient from './repairs-client'
import { loadRepairsSnapshot } from './repairs-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function LogisticsRepairsPage() {
  const snapshot = await loadRepairsSnapshot()

  return <RepairsClient snapshot={snapshot} />
}
