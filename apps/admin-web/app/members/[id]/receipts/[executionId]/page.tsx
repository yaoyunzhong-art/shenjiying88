import MemberOperationReceiptDetailClient from './member-operation-receipt-detail-client'
import { loadMemberOperationReceiptDetailSnapshot } from './member-operation-receipt-detail-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type PageProps = {
  params: Promise<{ id: string; executionId: string }>
}

export default async function MemberOperationReceiptDetailPage({ params }: PageProps) {
  const { id: memberId, executionId } = await params
  const snapshot = await loadMemberOperationReceiptDetailSnapshot(memberId, executionId)
  return (
    <MemberOperationReceiptDetailClient snapshot={snapshot} memberId={memberId} executionId={executionId} />
  )
}
