import StockClient from './stock-client'
import { loadStockPageSnapshot } from './stock-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function StockPage() {
  const snapshot = await loadStockPageSnapshot()
  return <StockClient snapshot={snapshot} />
}
