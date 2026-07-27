import { AdminPermissionGate } from '../../components/admin-permission-gate'
import RepairsClient from './repairs-client'
import { loadRepairsSnapshot } from './repairs-data'

const permissionGate = {
  requiredPermission: 'logistics:repairs:read',
  title: 'logistics repairs 访问受限',
  description: '维修工单页已切换为服务端快照壳层，仅具备 logistics:repairs:read 权限的账号可访问。',
} as const

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function RepairsPage() {
  const snapshot = await loadRepairsSnapshot()
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    sourceLabel: snapshot.sourceLabel,
    controlPlaneSource: 'loadRepairsSnapshot -> local repair workorder snapshot',
    businessDataSource: 'local repair records and status samples',
    refreshPath: 'RepairsPage -> loadRepairsSnapshot',
    generatedAt: snapshot.generatedAt,
    note: '当前页面使用本地维修工单样本，不代表真实工单主链，也不可作为闭环复签证据。',
  } as const

  return (
    <AdminPermissionGate {...permissionGate}>
      <div style={{ padding: 24 }}>
        <div
          style={{
            maxWidth: 1120,
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
        <RepairsClient snapshot={snapshot} />
      </div>
    </AdminPermissionGate>
  )
}
