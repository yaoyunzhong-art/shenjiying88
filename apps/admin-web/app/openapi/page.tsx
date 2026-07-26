import { AdminPermissionGate } from '../components/admin-permission-gate'
import OpenApiWorkbenchClient from './openapi-client'
import { loadOpenApiWorkbenchSnapshot } from './openapi-data'

const permissionGate = {
  requiredPermission: 'foundation.governance.read',
  title: '开放 API 工作台访问受限',
  description:
    '开放 API 工作台已切换到 server wrapper + snapshot loader，仅具备 foundation.governance.read 权限的账号可查看来源态证据与治理快照。',
} as const

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function OpenApiWorkbenchPage() {
  const snapshot = await loadOpenApiWorkbenchSnapshot()
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    sourceLabel: snapshot.sourceLabel,
    controlPlaneSource: 'loadOpenApiWorkbenchSnapshot -> local governance snapshot bundle',
    businessDataSource: 'local api-key/webhook/sandbox/usage sample snapshot records',
    refreshPath: 'OpenApiWorkbenchPage -> loadOpenApiWorkbenchSnapshot',
    generatedAt: snapshot.generatedAt,
    note: '当前页面消费本地开放 API 治理快照样本，适用于结构固证与交互演练，不作为实时授权复签证据。',
  } as const

  return (
    <AdminPermissionGate {...permissionGate}>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs leading-6 text-slate-700">
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
        <OpenApiWorkbenchClient snapshot={snapshot} />
      </div>
    </AdminPermissionGate>
  )
}
