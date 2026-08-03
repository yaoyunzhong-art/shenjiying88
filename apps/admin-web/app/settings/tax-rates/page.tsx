import TaxRatesClient from './tax-rates-client'
import { loadTaxRatesSnapshot } from './tax-rates-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function TaxRatesPage() {
  const snapshot = await loadTaxRatesSnapshot()

  return <TaxRatesClient snapshot={snapshot} />
}
