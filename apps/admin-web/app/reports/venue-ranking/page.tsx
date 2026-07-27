import { AdminPermissionGate } from '../../components/admin-permission-gate'
import VenueRankingClient from './venue-ranking-client'
import { loadVenueRankingSnapshot } from './venue-ranking-data'

const permissionGate = {
  requiredPermission: 'dashboard:read',
  title: '场馆排名访问受限',
  description:
    '场馆排名报表页已接入管理员本地 session，只有具备 dashboard:read 的账号才能查看场馆营收、订单、评分与热门服务排名。',
} as const

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function VenueRankingPage() {
  const snapshot = await loadVenueRankingSnapshot()
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
      <div style={{ maxWidth: 1320, margin: '0 auto', padding: 24 }}>
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
          <div>Delivery {sourceEvidence.deliveryMode} / {sourceEvidence.sourceLabel}</div>
          <div>控制面来源: {sourceEvidence.controlPlaneSource} / 业务数据: {sourceEvidence.businessDataSource}</div>
          <div>刷新路径: {sourceEvidence.refreshPath} / generatedAt: {sourceEvidence.generatedAt}</div>
          <div>{sourceEvidence.note}</div>
        </div>
        <VenueRankingClient snapshot={snapshot} />
      </div>
    </AdminPermissionGate>
  )
}
