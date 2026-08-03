import ApprovalDetailClient from './approval-detail-client'
import { loadApprovalDetailSnapshot } from './approval-detail-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function ApprovalDetailPage({ params }: PageProps) {
  const { id } = await params
  const snapshot = await loadApprovalDetailSnapshot(id)

  return <ApprovalDetailClient snapshot={snapshot} />
}
