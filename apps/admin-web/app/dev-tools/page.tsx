import { AdminPermissionGate } from '../components/admin-permission-gate'
import DevToolsClient from './dev-tools-client'
import { loadDevToolsSnapshot } from './dev-tools-data'

const permissionGate = {
  requiredPermission: 'dev-tools:read',
  title: '开发工具访问受限',
  description:
    '开发工具页已接入管理员本地 session，只有具备 dev-tools:read 的账号才能查看工具目录、分类筛选与搜索结果。',
} as const

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function DevToolsPage() {
  const snapshot = await loadDevToolsSnapshot()
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    controlPlaneSource:
      'loadDevToolsSnapshot -> defaultDevToolEntries/defaultRecentActivities/defaultEnvironments/defaultServiceStatuses',
    businessDataSource: 'local dev-tools catalog snapshot',
    refreshPath: 'DevToolsPage -> loadDevToolsSnapshot',
    generatedAt: snapshot.generatedAt,
    note: '当前页面使用本地开发工具目录与环境样本，不代表真实发布主链，也不可作为闭环复签证据。',
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
        <DevToolsClient snapshot={snapshot} />
      </div>
    </AdminPermissionGate>
  )
}
