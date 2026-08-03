import BudgetClient from './budget-client'
import { loadBudgetSnapshot } from './budget-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function BudgetPage() {
  const snapshot = await loadBudgetSnapshot()

  return <BudgetClient snapshot={snapshot} />
}
