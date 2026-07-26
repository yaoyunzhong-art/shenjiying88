import { AdminPermissionGate } from '../../components/admin-permission-gate'
import InventoryRulesClient from './inventory-rules-client'
import { loadInventoryRulesSnapshot } from './inventory-rules-data'

const permissionGate = {
  requiredPermission: 'inventory:rules:read',
  title: '库存规则 访问受限',
  description: '该页面已接入管理员权限管控，仅具备 inventory:rules:read 权限的账号可访问。',
} as const

export const dynamic = 'force-dynamic'
export const revalidate = 0

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function resolveTenantId(value: string | string[] | undefined): string {
  const tenantId = Array.isArray(value) ? value[0] : value
  return tenantId?.trim() ? tenantId.trim() : 'demo-tenant'
}

export default async function InventoryRulesPage({ searchParams }: PageProps) {
  const query = await searchParams
  const snapshot = await loadInventoryRulesSnapshot(resolveTenantId(query.tenantId))
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
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
            Delivery {sourceEvidence.deliveryMode} · 控制面来源: {sourceEvidence.controlPlaneSource}
          </div>
          <div>
            业务数据: {sourceEvidence.businessDataSource} · 刷新路径: {sourceEvidence.refreshPath}
          </div>
          <div>
            generatedAt: {sourceEvidence.generatedAt} · 来源标签: {snapshot.sourceLabel}
          </div>
          <div>{sourceEvidence.note}</div>
        </div>
        <InventoryRulesClient snapshot={snapshot} />
      </div>
    </AdminPermissionGate>
  )
}
