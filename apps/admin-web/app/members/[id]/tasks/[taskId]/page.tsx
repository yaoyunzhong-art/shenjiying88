import { AdminPermissionGate } from '../../../../components/admin-permission-gate'
import MemberOperationTaskDetailClient from './member-operation-task-detail-client'
import { loadMemberOperationTaskDetailSnapshot } from './member-operation-task-detail-data'

const permissionGate = {
  requiredPermission: 'member:read',
  title: '会员运营任务访问受限',
  description:
    '会员运营任务详情页已接入管理员本地 session，只有具备 member:read 的账号才能查看任务链路、同源回执与来源聚合信息。',
} as const

export const dynamic = 'force-dynamic'
export const revalidate = 0

type PageProps = {
  params: Promise<{ id: string; taskId: string }>
}

export default async function MemberOperationTaskDetailPage({ params }: PageProps) {
  const { id: memberId, taskId } = await params
  const snapshot = await loadMemberOperationTaskDetailSnapshot(memberId, taskId)
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    sourceLabel: snapshot.sourceLabel,
    controlPlaneSource: snapshot.controlPlaneSource,
    businessDataSource: snapshot.businessDataSource,
    refreshPath: snapshot.refreshPath,
    generatedAt: snapshot.generatedAt,
    note: snapshot.note,
  } as const

  return (
    <AdminPermissionGate {...permissionGate}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: 24 }}>
        <div
          style={{
            marginBottom: 24,
            borderRadius: 16,
            border: '1px solid rgba(148, 163, 184, 0.18)',
            background: 'rgba(248, 250, 252, 0.92)',
            padding: 16,
            color: '#334155',
            fontSize: 12,
            lineHeight: 1.8,
          }}
        >
          <div>
            Delivery {sourceEvidence.deliveryMode} · 来源标签: {sourceEvidence.sourceLabel} · 控制面来源:{' '}
            {sourceEvidence.controlPlaneSource}
          </div>
          <div>
            业务数据: {sourceEvidence.businessDataSource} · 刷新路径: {sourceEvidence.refreshPath}
          </div>
          <div>
            generatedAt: {sourceEvidence.generatedAt} · {sourceEvidence.note}
          </div>
        </div>
        <MemberOperationTaskDetailClient snapshot={snapshot} memberId={memberId} taskId={taskId} />
      </div>
    </AdminPermissionGate>
  )
}
