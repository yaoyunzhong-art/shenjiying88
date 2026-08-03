import AlliancesClient from './alliances-client'
import { loadAlliancesSnapshot } from './alliances-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AlliancesPage() {
  const snapshot = await loadAlliancesSnapshot()
  return <AlliancesClient snapshot={snapshot} />
}
