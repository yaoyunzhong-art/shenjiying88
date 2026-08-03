import ReconciliationClient from './reconciliation-client'
import { loadReconciliationSnapshot } from './reconciliation-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ReconciliationPage() {
  const snapshot = await loadReconciliationSnapshot()

  return <ReconciliationClient snapshot={snapshot} />
}
