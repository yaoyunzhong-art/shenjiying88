import DiscountRulesClient from './discount-rules-client'
import { loadDiscountRulesSnapshot } from './discount-rules-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function DiscountRulesPage() {
  const snapshot = await loadDiscountRulesSnapshot()

  return <DiscountRulesClient snapshot={snapshot} />
}
