import { AdminPermissionGate } from '../../components/admin-permission-gate'
import AnnouncementDetailClient from './announcement-detail-client'
import {
  loadAnnouncementDetailSnapshot,
  normalizeAnnouncementDetailParam,
} from './announcement-detail-data'

const permissionGate = {
  requiredPermission: 'foundation.governance.read',
  title: '公告详情访问受限',
  description:
    '公告详情页已切换为 server wrapper + snapshot loader，仅具备 foundation.governance.read 权限的账号可查看来源态证据、正文与演练动作。',
} as const

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AnnouncementDetailPage({
  params,
}: {
  params: Promise<{ id?: string | string[] }>
}) {
  const resolvedParams = await params
  const snapshot = await loadAnnouncementDetailSnapshot(
    normalizeAnnouncementDetailParam(resolvedParams.id),
  )

  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    sourceLabel: snapshot.sourceLabel,
    controlPlaneSource:
      'AnnouncementDetailPage -> loadAnnouncementDetailSnapshot -> defaultAnnouncements snapshot',
    businessDataSource: 'local announcements detail sample snapshot',
    refreshPath: 'AnnouncementDetailPage -> loadAnnouncementDetailSnapshot',
    generatedAt: snapshot.generatedAt,
    requestedId: snapshot.requestedId || '—',
    note: snapshot.notFound
      ? '当前详情未命中本地公告样本，页面仍保留来源态证据与刷新路径，便于诊断参数与快照差异。'
      : '当前详情消费本地公告快照样本，仅用于结构固证与交互演练，不作为实时消息中心复签证据。',
  } as const

  return (
    <AdminPermissionGate {...permissionGate}>
      <div style={shellStyle}>
        <div style={evidenceStyle}>
          <div>
            Delivery {sourceEvidence.deliveryMode} · sourceLabel:{' '}
            {sourceEvidence.sourceLabel}
          </div>
          <div>
            控制面来源: {sourceEvidence.controlPlaneSource} · 业务数据:{' '}
            {sourceEvidence.businessDataSource}
          </div>
          <div>requestedId: {sourceEvidence.requestedId}</div>
          <div>
            refreshPath: {sourceEvidence.refreshPath} · generatedAt:{' '}
            {sourceEvidence.generatedAt}
          </div>
          <div>{sourceEvidence.note}</div>
        </div>
        <AnnouncementDetailClient snapshot={snapshot} />
      </div>
    </AdminPermissionGate>
  )
}

const shellStyle = {
  padding: 24,
}

const evidenceStyle = {
  maxWidth: 1120,
  margin: '0 auto 16px',
  padding: '12px 16px',
  borderRadius: 12,
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(148,163,184,0.08)',
  fontSize: 12,
  color: '#cbd5e1',
  lineHeight: 1.7,
}
