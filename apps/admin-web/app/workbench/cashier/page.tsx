import { AdminPermissionGate } from '../../components/admin-permission-gate'
import CashierWorkbenchClient from './cashier-workbench-client'
import { loadCashierWorkbenchSnapshot } from './cashier-workbench-data'

const permissionGate = {
  requiredPermission: 'workbench.read',
  title: '收银工作台访问受限',
  description:
    '收银工作台已接入管理员本地 session，只有具备 workbench.read 的账号才能查看当班营收、交易流水与快速收银操作。',
} as const

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function CashierWorkbenchPage() {
  const snapshot = await loadCashierWorkbenchSnapshot()
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
          <div>
            Delivery {sourceEvidence.deliveryMode} · 来源标签: {sourceEvidence.sourceLabel} · 控制面来源:{' '}
            {sourceEvidence.controlPlaneSource}
          </div>
          <div>
            业务数据: {sourceEvidence.businessDataSource} · 刷新路径: {sourceEvidence.refreshPath}
          </div>
          <div>
            generatedAt: {sourceEvidence.generatedAt} · {sourceEvidence.note}
          </div>
        </div>
        <CashierWorkbenchClient snapshot={snapshot} />
      </div>
    </AdminPermissionGate>
  )
}
