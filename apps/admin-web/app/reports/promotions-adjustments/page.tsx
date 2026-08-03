import PromotionsAdjustmentsClient from './promotions-adjustments-client'
import { loadPromotionsAdjustmentsSnapshot } from './promotions-adjustments-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function PromotionsAdjustmentsPage() {
  const snapshot = await loadPromotionsAdjustmentsSnapshot()

  return <PromotionsAdjustmentsClient snapshot={snapshot} />
}
