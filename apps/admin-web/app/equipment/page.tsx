import { AdminPermissionGate } from '../components/admin-permission-gate'
import EquipmentClient from './equipment-client'
import { loadEquipmentSnapshot } from './equipment-data'

const permissionGate = {
  requiredPermission: 'equipment:read',
  title: '设备管理访问受限',
  description:
    '设备管理页已切换为服务端快照壳层，只有具备 equipment:read 的账号才能查看设备列表、状态筛选与来源态证据。',
} as const

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function EquipmentPage() {
  const snapshot = await loadEquipmentSnapshot()
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    sourceLabel: snapshot.sourceLabel,
    controlPlaneSource: 'loadEquipmentSnapshot -> defaultEquipment snapshot',
    businessDataSource: 'local equipment sample snapshot records',
    refreshPath: 'EquipmentPage -> loadEquipmentSnapshot',
    generatedAt: snapshot.generatedAt,
    note: '当前页面使用本地设备快照样本，不代表真实设备资产主数据，也不可作为闭环复签证据。',
  } as const

  return (
    <AdminPermissionGate
      requiredPermission={permissionGate.requiredPermission}
      title={permissionGate.title}
      description={permissionGate.description}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 12,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(148,163,184,0.08)',
            fontSize: 12,
            color: '#cbd5e1',
            lineHeight: 1.7,
            marginBottom: 16,
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
        <EquipmentClient snapshot={snapshot} />
      </div>
    </AdminPermissionGate>
  )
}
