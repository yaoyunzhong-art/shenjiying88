import SettlementReconciliationClient from './settlement-reconciliation-client'
import { loadSettlementReconciliationSnapshot } from './settlement-reconciliation-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function SettlementReconciliationPage() {
  const snapshot = await loadSettlementReconciliationSnapshot()

  return <SettlementReconciliationClient snapshot={snapshot} />
}
