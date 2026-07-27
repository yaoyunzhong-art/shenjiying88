import { AdminPermissionGate } from '../../components/admin-permission-gate'
import DiscountRulesClient from './discount-rules-client'
import { loadDiscountRulesSnapshot } from './discount-rules-data'

const permissionGate = {
  requiredPermission: 'shop:discount-rules:read',
  title: '折扣规则访问受限',
  description:
    '折扣规则页已切换到 server wrapper + snapshot loader，仅具备 shop:discount-rules:read 权限的账号可查看规则来源态证据。',
} as const

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function DiscountRulesPage() {
  const snapshot = await loadDiscountRulesSnapshot()
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
        <DiscountRulesClient snapshot={snapshot} />
      </div>
    </AdminPermissionGate>
  )
}
