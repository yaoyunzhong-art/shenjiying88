import MemberOperationSourceDetailClient from './member-operation-source-detail-client'
import { loadMemberOperationSourceDetailSnapshot } from './member-operation-source-detail-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type PageProps = {
  params: Promise<{ id: string; kind: 'order' | 'payment'; sourceId: string }>
}

export default async function MemberOperationSourceDetailPage({ params }: PageProps) {
  const { id: memberId, kind, sourceId } = await params
  const snapshot = await loadMemberOperationSourceDetailSnapshot(memberId, kind, sourceId)
  return (
    <MemberOperationSourceDetailClient snapshot={snapshot} memberId={memberId} kind={kind} sourceId={sourceId} />
  )
}
