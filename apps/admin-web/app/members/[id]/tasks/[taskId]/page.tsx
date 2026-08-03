import MemberOperationTaskDetailClient from './member-operation-task-detail-client'
import { loadMemberOperationTaskDetailSnapshot } from './member-operation-task-detail-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type PageProps = {
  params: Promise<{ id: string; taskId: string }>
}

export default async function MemberOperationTaskDetailPage({ params }: PageProps) {
  const { id: memberId, taskId } = await params
  const snapshot = await loadMemberOperationTaskDetailSnapshot(memberId, taskId)
  return <MemberOperationTaskDetailClient snapshot={snapshot} memberId={memberId} taskId={taskId} />
}
