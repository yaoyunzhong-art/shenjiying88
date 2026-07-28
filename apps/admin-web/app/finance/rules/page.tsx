import FinanceRulesClient from './rules-client'
import { loadFinanceRulesSnapshot } from './rules-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function FinanceRulesPage() {
  const snapshot = await loadFinanceRulesSnapshot()

  return <FinanceRulesClient snapshot={snapshot} />
}
