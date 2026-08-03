import type { Metadata } from 'next'
import StockTransferDetailClient from './stock-transfer-detail-client'
import { loadStockTransferDetailSnapshot } from './stock-transfer-detail-data'

type PageProps = {
  params: Promise<{ id: string }>
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  return {
    title: `库存调拨单 ${id} - M5 指挥台`,
    description: `查看库存调拨单 ${id} 的详细信息、状态流转、商品明细及操作记录。`,
  }
}

export default async function StockTransferDetailPage({ params }: PageProps) {
  const { id } = await params
  const snapshot = await loadStockTransferDetailSnapshot(id)
  return <StockTransferDetailClient snapshot={snapshot} />
}
