import SalesSummaryClient from './sales-summary-client'
import { loadSalesSummarySnapshot } from './sales-summary-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function SalesSummaryPage() {
  const snapshot = await loadSalesSummarySnapshot()

  return <SalesSummaryClient snapshot={snapshot} />
}
