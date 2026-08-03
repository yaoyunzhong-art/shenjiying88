import FinanceClient from './finance-client'
import { loadFinanceSnapshot } from './finance-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function FinancePage() {
  const snapshot = await loadFinanceSnapshot()

  return <FinanceClient snapshot={snapshot} />
}
