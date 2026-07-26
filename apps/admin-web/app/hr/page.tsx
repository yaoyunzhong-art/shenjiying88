import { AdminPermissionGate } from '../components/admin-permission-gate'
import HrClient from './hr-client'
import { loadHrSnapshot } from './hr-data'

const permissionGate = {
  requiredPermission: 'foundation.governance.read',
  title: 'HR 管理访问受限',
  description: 'HR 管理页已接入管理员本地 session，只有具备 foundation.governance.read 的账号才能查看员工档案与组织概览。',
} as const

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function HrPage() {
  const snapshot = await loadHrSnapshot()
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    controlPlaneSource:
      snapshot.deliveryMode === 'api'
        ? 'loadHrSnapshot -> hr/employees + hr/stats + hr/departments'
        : 'loadHrSnapshot -> defaultEmployees/defaultStats/defaultDepartments',
    businessDataSource:
      snapshot.deliveryMode === 'api' ? 'hr upstream API responses' : 'local hr samples',
    refreshPath: 'HrPage -> loadHrSnapshot',
    generatedAt: snapshot.generatedAt,
    note:
      snapshot.deliveryMode === 'api'
        ? '当前页面直接消费 HR 服务端快照。'
        : '当前页面已回退到本地 HR 样本，不可作为闭环复签证据。',
  } as const

  return (
    <AdminPermissionGate {...permissionGate}>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs leading-6 text-slate-700">
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
        <HrClient snapshot={snapshot} />
      </div>
    </AdminPermissionGate>
  )
}
