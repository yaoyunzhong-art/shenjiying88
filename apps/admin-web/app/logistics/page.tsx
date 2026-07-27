const permissionGate = {
  requiredPermission: 'logistics:read',
  title: 'logistics 访问受限',
  description: '后勤配送页已切换为服务端快照壳层，仅具备 logistics:read 权限的账号可访问。',
} as const
import { AdminPermissionGate } from '../components/admin-permission-gate'
import LogisticsClient from './logistics-client'
import { loadLogisticsSnapshot } from './logistics-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function LogisticsPage() {
  const snapshot = await loadLogisticsSnapshot()
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    sourceLabel: snapshot.sourceLabel,
    controlPlaneSource: 'loadLogisticsSnapshot -> local logistics order snapshot',
    businessDataSource: 'local logistics orders and delivery status samples',
    refreshPath: 'LogisticsPage -> loadLogisticsSnapshot',
    generatedAt: snapshot.generatedAt,
    note: '当前页面使用本地后勤配送样本，不代表真实物流主链，也不可作为闭环复签证据。',
  } as const

  return (
    <AdminPermissionGate {...permissionGate}>
      <div style={{ padding: 24 }}>
        <div
          style={{
            maxWidth: 1220,
            margin: '0 auto 16px',
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
        <LogisticsClient snapshot={snapshot} />
      </div>
    </AdminPermissionGate>
  )
}
