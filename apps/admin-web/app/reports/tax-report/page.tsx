import TaxReportClient from './tax-report-client'
import { loadTaxReportSnapshot } from './tax-report-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function TaxReportPage() {
  const snapshot = await loadTaxReportSnapshot()

  return <TaxReportClient snapshot={snapshot} />
}
