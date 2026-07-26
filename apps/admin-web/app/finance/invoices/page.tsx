import { AdminPermissionGate } from '../../components/admin-permission-gate'
import FinanceInvoicesClient from './invoices-client'
import { loadFinanceInvoicesSnapshot } from './invoices-data'

const permissionGate = {
  requiredPermission: 'finance:invoices:read',
  title: '发票管理访问受限',
  description:
    '发票管理页已接入管理员本地 session，只有具备 finance:invoices:read 的账号才能查看发票列表、筛选状态与新建弹窗。',
} as const

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function FinanceInvoicesPage() {
  const snapshot = await loadFinanceInvoicesSnapshot()
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    controlPlaneSource: 'loadFinanceInvoicesSnapshot -> defaultInvoices',
    businessDataSource: 'local finance invoice samples',
    refreshPath: 'FinanceInvoicesPage -> loadFinanceInvoicesSnapshot',
    writePath: 'FinanceInvoicesClient:create/issue/cancel -> local state mutation only',
    generatedAt: snapshot.generatedAt,
    note: '当前页面使用服务端 mock 快照和本地演示写链路，不可作为闭环复签证据。',
  } as const

  return (
    <AdminPermissionGate {...permissionGate}>
      <div className="mx-auto max-w-6xl space-y-6 p-6">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs leading-6 text-slate-700">
          <div>
            Delivery {sourceEvidence.deliveryMode} · 控制面来源: {sourceEvidence.controlPlaneSource}
          </div>
          <div>
            业务数据: {sourceEvidence.businessDataSource} · 刷新路径: {sourceEvidence.refreshPath}
          </div>
          <div>
            写入路径: {sourceEvidence.writePath} · generatedAt: {sourceEvidence.generatedAt}
          </div>
          <div>{sourceEvidence.note}</div>
        </div>
        <FinanceInvoicesClient snapshot={snapshot} />
      </div>
    </AdminPermissionGate>
  )
}
