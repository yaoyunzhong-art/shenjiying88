import { AdminPermissionGate } from '../components/admin-permission-gate'
import CustomersClient from './customers-client'
import { loadCustomersSnapshot } from './customers-data'

const permissionGate = {
  requiredPermission: 'customers:read',
  title: 'customers 访问受限',
  description: '该页面已接入管理员权限管控，仅具备 customers:read 权限的账号可访问。',
} as const

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function CustomersPage() {
  const snapshot = await loadCustomersSnapshot()
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    controlPlaneSource:
      snapshot.deliveryMode === 'api'
        ? 'loadCustomersSnapshot -> crm/customers + crm/stats'
        : 'loadCustomersSnapshot -> MOCK_CUSTOMERS fallback',
    businessDataSource:
      snapshot.deliveryMode === 'api'
        ? 'crm upstream API response with fallback-enriched customer profile fields'
        : 'local customer workspace samples',
    refreshPath: 'CustomersPage -> loadCustomersSnapshot',
    generatedAt: snapshot.generatedAt,
    sourceLabel: snapshot.sourceLabel,
    note:
      snapshot.deliveryMode === 'api'
        ? '当前页面已优先接入真实 CRM 客户快照，缺失画像字段会显式保留 fallback 补洞。'
        : '当前客户管理页展示的是本地样本快照，不可作为实时复签证据。',
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
          <div>Delivery {sourceEvidence.deliveryMode} · 控制面来源: {sourceEvidence.controlPlaneSource}</div>
          <div>业务数据: {sourceEvidence.businessDataSource} · 刷新路径: {sourceEvidence.refreshPath}</div>
          <div>generatedAt: {sourceEvidence.generatedAt} · 来源标签: {sourceEvidence.sourceLabel}</div>
          <div>{sourceEvidence.note}</div>
        </div>
        <CustomersClient snapshot={snapshot} />
      </div>
    </AdminPermissionGate>
  )
}
