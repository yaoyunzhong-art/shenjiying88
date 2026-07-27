import { AdminPermissionGate } from '../../components/admin-permission-gate'
import CustomerNewShellClient from './customer-new-client'
import { loadCustomerNewSnapshot } from './customer-new-data'

const permissionGate = {
  requiredPermission: 'customers:new:read',
  title: 'Customer Create Restricted',
  description: 'Only admins with customers:new:read can access this page.',
} as const

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function NewCustomerPage() {
  const snapshot = await loadCustomerNewSnapshot()
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
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: 24 }}>
        <div style={{ marginBottom: 24, fontSize: 12, lineHeight: 1.8 }}>
          <div>Delivery {sourceEvidence.deliveryMode} · Source label: {sourceEvidence.sourceLabel}</div>
          <div>Control plane: {sourceEvidence.controlPlaneSource} · Business: {sourceEvidence.businessDataSource}</div>
          <div>Refresh: {sourceEvidence.refreshPath} · generatedAt: {sourceEvidence.generatedAt} · {sourceEvidence.note}</div>
        </div>
        <CustomerNewShellClient snapshot={snapshot} />
      </div>
    </AdminPermissionGate>
  )
}
