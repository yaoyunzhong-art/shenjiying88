import { AdminPermissionGate } from '../components/admin-permission-gate'
import ContractsClient from './contracts-client'
import { loadContractsSnapshot } from './contracts-data'

const permissionGate = {
  requiredPermission: 'contracts:read',
  title: 'contracts 访问受限',
  description: '该页面已接入管理员权限管控，仅具备 contracts:read 权限的账号可访问。',
} as const

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ContractsPage() {
  const snapshot = await loadContractsSnapshot()
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    sourceLabel: snapshot.sourceLabel,
    controlPlaneSource:
      snapshot.deliveryMode === 'api'
        ? 'loadContractsSnapshot -> contracts'
        : 'loadContractsSnapshot -> defaultContracts fallback',
    businessDataSource:
      snapshot.deliveryMode === 'api' ? 'contract-manager upstream contracts' : 'local contract samples',
    refreshPath: 'ContractsPage -> loadContractsSnapshot',
    generatedAt: snapshot.generatedAt,
    note:
      snapshot.deliveryMode === 'api'
        ? '当前页面优先消费合同管理真实接口；签署与备注优先走 /api/contracts 代理写链路。'
        : '当前页面已回退到本地合同样本；签署与备注写链路若上游不可达将失败，不可作为闭环复签证据。',
  } as const

  return (
    <AdminPermissionGate {...permissionGate}>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs leading-6 text-slate-700">
          <div>
            Delivery {sourceEvidence.deliveryMode} · 控制面来源: {sourceEvidence.controlPlaneSource}
          </div>
          <div>
            sourceLabel: {sourceEvidence.sourceLabel} · 业务数据: {sourceEvidence.businessDataSource}
          </div>
          <div>
            刷新路径: {sourceEvidence.refreshPath}
          </div>
          <div>
            generatedAt: {sourceEvidence.generatedAt} · {sourceEvidence.note}
          </div>
        </div>
        <ContractsClient snapshot={snapshot} />
      </div>
    </AdminPermissionGate>
  )
}
