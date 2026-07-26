import { AdminPermissionGate } from '../components/admin-permission-gate'
import AnnouncementsClient from './announcements-client'
import { loadAnnouncementsSnapshot } from './announcements-data'

const permissionGate = {
  requiredPermission: 'foundation.governance.read',
  title: 'announcements 访问受限',
  description: '公告管理页已切换为服务端快照壳层，仅具备 foundation.governance.read 权限的账号可查看公告来源态、编排结果与归档演练。',
} as const

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AnnouncementsPage() {
  const snapshot = await loadAnnouncementsSnapshot()
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    sourceLabel: snapshot.sourceLabel,
    controlPlaneSource: 'loadAnnouncementsSnapshot -> defaultAnnouncements snapshot',
    businessDataSource: 'local announcements sample snapshot records',
    refreshPath: 'AnnouncementsPage -> loadAnnouncementsSnapshot',
    generatedAt: snapshot.generatedAt,
    note: '当前页面消费本地公告快照样本，不代表实时消息中心主数据，也不可作为闭环复签证据。',
  } as const

  return (
    <AdminPermissionGate {...permissionGate}>
      <div style={{ padding: 24 }}>
        <div
          style={{
            maxWidth: 1120,
            margin: '0 auto',
            marginBottom: 16,
            padding: '12px 16px',
            borderRadius: 12,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(148,163,184,0.08)',
            fontSize: 12,
            color: '#cbd5e1',
            lineHeight: 1.7,
          }}
        >
          <div>
            Delivery {sourceEvidence.deliveryMode} · 来源标签: {sourceEvidence.sourceLabel}
          </div>
          <div>
            控制面来源: {sourceEvidence.controlPlaneSource} · 业务数据: {sourceEvidence.businessDataSource}
          </div>
          <div>
            刷新路径: {sourceEvidence.refreshPath} · generatedAt: {sourceEvidence.generatedAt}
          </div>
          <div>{sourceEvidence.note}</div>
        </div>
        <AnnouncementsClient snapshot={snapshot} />
      </div>
    </AdminPermissionGate>
  )
}
