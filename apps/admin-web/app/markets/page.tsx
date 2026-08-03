import MarketsClient from './markets-client'
import { loadMarketsSnapshot } from '../markets-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function MarketsPage() {
  const snapshot = await loadMarketsSnapshot()
  return <MarketsClient snapshot={snapshot} />
}
