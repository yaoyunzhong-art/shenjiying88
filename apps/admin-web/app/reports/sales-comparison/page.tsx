import SalesComparisonClient from './sales-comparison-client'
import { loadSalesComparisonSnapshot } from './sales-comparison-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function SalesComparisonPage() {
  const snapshot = await loadSalesComparisonSnapshot()

  return <SalesComparisonClient snapshot={snapshot} />
}
