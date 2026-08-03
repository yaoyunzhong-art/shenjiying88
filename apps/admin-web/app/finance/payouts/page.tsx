import FinancePayoutsClient from './payouts-client'
import { loadFinancePayoutsSnapshot } from './payouts-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function FinancePayoutsPage() {
  const snapshot = await loadFinancePayoutsSnapshot()

  return <FinancePayoutsClient snapshot={snapshot} />
}
