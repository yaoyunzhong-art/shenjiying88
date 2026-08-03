import RefundDetailClient from './refund-detail-client'
import { loadRefundDetailSnapshot } from './refund-detail-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function RefundDetailPage({ params }: PageProps) {
  const { id } = await params
  const snapshot = await loadRefundDetailSnapshot(id)

  return <RefundDetailClient snapshot={snapshot} />
}
