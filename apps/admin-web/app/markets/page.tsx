import { AdminPermissionGate } from '../components/admin-permission-gate'
import MarketsClient from './markets-client'
import { loadMarketsSnapshot } from '../markets-data'

const permissionGate = {
  requiredPermission: 'dashboard:read',
  title: '市场管理中心访问受限',
  description:
    '市场管理中心已接入管理员本地 session，只有具备 dashboard:read 的账号才能查看全球市场分布、区域筛选结果与部署概览。',
} as const

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function MarketsPage() {
  const snapshot = await loadMarketsSnapshot()
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    controlPlaneSource:
      snapshot.deliveryMode === 'api'
        ? 'loadMarketsSnapshot -> markets'
        : 'loadMarketsSnapshot -> MOCK_MARKETS fallback',
    businessDataSource:
      snapshot.deliveryMode === 'api'
        ? 'markets upstream API response'
        : 'local market configuration samples',
    refreshPath: 'MarketsPage -> loadMarketsSnapshot',
    generatedAt: snapshot.generatedAt,
    note:
      snapshot.deliveryMode === 'api'
        ? '当前页面直接消费市场服务端快照。'
        : '当前页面已回退到本地市场样本，不可作为闭环复签证据。',
  } as const

  return (
    <AdminPermissionGate {...permissionGate}>
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: 32 }}>
        <div
          style={{
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
            Delivery {sourceEvidence.deliveryMode} · 控制面来源: {sourceEvidence.controlPlaneSource}
          </div>
          <div>
            业务数据: {sourceEvidence.businessDataSource} · 刷新路径: {sourceEvidence.refreshPath}
          </div>
          <div>
            generatedAt: {sourceEvidence.generatedAt} · {sourceEvidence.note}
          </div>
        </div>
        <MarketsClient snapshot={snapshot} />
      </div>
    </AdminPermissionGate>
  )
}
