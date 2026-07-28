import OperationsClient from './operations-client'
import { loadOperationsSnapshot } from './operations-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function OperationsPage() {
  const snapshot = await loadOperationsSnapshot()
  return <OperationsClient snapshot={snapshot} />
}
