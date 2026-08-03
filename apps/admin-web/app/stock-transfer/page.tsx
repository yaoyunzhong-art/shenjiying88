import StockTransferClient from './stock-transfer-client'
import { loadStockTransferPageSnapshot } from './stock-transfer-page-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function StockTransferListPage() {
  const snapshot = await loadStockTransferPageSnapshot()
  return <StockTransferClient snapshot={snapshot} />
}
