import { AdminPermissionGate } from '../components/admin-permission-gate'
import FirePreventionClient from './fire-prevention-client'
import { loadFirePreventionSnapshot } from './fire-prevention-data'

const permissionGate = {
  requiredPermission: 'foundation.governance.read',
  title: '消防管理访问受限',
  description:
    '消防管理页已接入管理员本地 session，只有具备 foundation.governance.read 的账号才能查看检查记录、风险等级、导出报告与合规状态。',
} as const

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function FirePreventionPage() {
  const snapshot = await loadFirePreventionSnapshot()
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    controlPlaneSource: 'loadFirePreventionSnapshot -> defaultInspectionItems',
    businessDataSource: 'local fire prevention inspection samples',
    refreshPath: 'FirePreventionPage -> loadFirePreventionSnapshot',
    generatedAt: snapshot.generatedAt,
    note: '当前页面首屏检查列表来自本地消防样本；创建、编辑、批量完成与导出仍为客户端 fake write，不可作为闭环复签证据。',
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
        <FirePreventionClient snapshot={snapshot} />
      </div>
    </AdminPermissionGate>
  )
}
