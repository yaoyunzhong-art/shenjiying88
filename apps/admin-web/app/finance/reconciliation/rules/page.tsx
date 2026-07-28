import ReconciliationRulesClient from './rules-client'
import { loadReconciliationRulesSnapshot } from './rules-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ReconciliationRulesPage() {
  const snapshot = await loadReconciliationRulesSnapshot()
  return <ReconciliationRulesClient snapshot={snapshot} />
}
