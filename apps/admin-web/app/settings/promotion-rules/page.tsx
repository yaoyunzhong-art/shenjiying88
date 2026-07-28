import PromotionRulesClient from './promotion-rules-client'
import { loadPromotionRulesSnapshot } from './promotion-rules-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function PromotionRulesPage() {
  const snapshot = await loadPromotionRulesSnapshot()

  return <PromotionRulesClient snapshot={snapshot} />
}
