import { AdminPermissionGate } from '../../components/admin-permission-gate'
import MemberDetailClient from './member-detail-client'
import { loadMemberDetailPageSnapshot } from './member-detail-data'

const permissionGate = {
  requiredPermission: 'member:read',
  title: '会员详情访问受限',
  description:
    '会员详情页已接入管理员本地 session，只有具备 member:read 的账号才能查看档案、积分、充值与到店记录。',
} as const

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const snapshot = await loadMemberDetailPageSnapshot(id)

  return (
    <AdminPermissionGate {...permissionGate}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
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
          <div>Delivery {snapshot.deliveryMode} · 控制面来源: {snapshot.controlPlaneSource}</div>
          <div>业务数据: {snapshot.businessDataSource} · 刷新路径: {snapshot.refreshPath}</div>
          <div>generatedAt: {snapshot.generatedAt} · 来源标签: {snapshot.sourceLabel}</div>
          <div>{snapshot.note}</div>
        </div>
        <MemberDetailClient snapshot={snapshot} />
      </div>
    </AdminPermissionGate>
  )
}
