const permissionGate = {
  requiredPermission: 'member:read',
  title: '客户画像标签访问受限',
  description: '客户画像标签页已切换为服务端快照壳层，只有具备 member:read 的账号才能查看标签快照、覆盖统计与维护动作。',
} as const
import { AdminPermissionGate } from '../components/admin-permission-gate'
import CustomerTagsClient from './customer-tags-client'
import { loadCustomerTagsSnapshot } from './customer-tags-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function CustomerTagsPage() {
  const snapshot = await loadCustomerTagsSnapshot()
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    sourceLabel: snapshot.sourceLabel,
    controlPlaneSource: 'loadCustomerTagsSnapshot -> defaultTags snapshot',
    businessDataSource: 'local customer tags sample snapshot records',
    refreshPath: 'CustomerTagsPage -> loadCustomerTagsSnapshot',
    generatedAt: snapshot.generatedAt,
    note: '当前页面消费本地客户标签快照样本，不代表实时画像标签主数据，也不可作为闭环复签证据。',
  } as const

  return (
    <AdminPermissionGate {...permissionGate}>
      <div style={{ padding: 24 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', marginBottom: 16, padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(148,163,184,0.08)', fontSize: 12, color: '#cbd5e1', lineHeight: 1.7 }}>
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
        <CustomerTagsClient snapshot={snapshot} />
      </div>
    </AdminPermissionGate>
  )
}
