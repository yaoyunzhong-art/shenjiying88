import StockTransferFormClient from './stock-transfer-form-client'
import { loadStockTransferFormSnapshot } from './stock-transfer-form-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function StockTransferFormPage() {
  const snapshot = await loadStockTransferFormSnapshot()
  return <StockTransferFormClient snapshot={snapshot} />
}
