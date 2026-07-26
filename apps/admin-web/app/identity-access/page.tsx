import type { IdentityAccessWorkspaceQuery } from '@m5/types'
import { AdminPermissionGate } from '../components/admin-permission-gate'
import { loadIdentityAccessPageSnapshot } from './identity-access-data'
import IdentityAccessWorkspaceClient from './identity-access-workspace-client'

const permissionGate = {
  requiredPermission: 'foundation.governance.read',
  title: '身份访问控制访问受限',
  description:
    '身份认证与访问控制页已接入管理员本地 session，只有具备 foundation.governance.read 的账号才能查看身份上下文、角色权限与租户边界校验。',
} as const

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface IdentityAccessPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

function readQueryParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0]
  }
  return value
}

function normalizeIdentityAccessQuery(
  params: Record<string, string | string[] | undefined> = {},
): IdentityAccessWorkspaceQuery {
  return {
    tenantId: readQueryParam(params.tenantId),
    brandId: readQueryParam(params.brandId),
    storeId: readQueryParam(params.storeId),
    marketCode: readQueryParam(params.marketCode),
  }
}

export default async function IdentityAccessPage({ searchParams }: IdentityAccessPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const snapshot = await loadIdentityAccessPageSnapshot(
    normalizeIdentityAccessQuery(resolvedSearchParams),
  )
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    sourceLabel: snapshot.sourceLabel,
    controlPlaneSource:
      snapshot.workspaceDeliveryMode === 'api'
        ? 'loadIdentityAccessPageSnapshot -> loadIdentityAccessWorkspace'
        : 'loadIdentityAccessPageSnapshot -> loadIdentityAccessWorkspace fallback',
    businessDataSource:
      snapshot.workspaceDeliveryMode === 'api'
        ? 'identity-access context + role/permission/tenant validation responses'
        : 'fallback identity-access workspace samples',
    refreshPath: 'IdentityAccessPage -> loadIdentityAccessPageSnapshot',
    generatedAt: snapshot.generatedAt,
    query: `tenant=${snapshot.query.tenantId} · brand=${snapshot.query.brandId} · store=${snapshot.query.storeId} · market=${snapshot.query.marketCode}`,
    note:
      snapshot.deliveryMode === 'api'
        ? `当前页面读取身份校验服务端快照，workbench bootstrap 为 ${snapshot.bootstrapDeliveryMode}。`
        : `当前页面存在 fallback 数据源，workspace=${snapshot.workspaceDeliveryMode} / workbench=${snapshot.bootstrapDeliveryMode}，仅可作为来源态证据。`,
  } as const

  return (
    <AdminPermissionGate {...permissionGate}>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs leading-6 text-slate-700">
          <div>
            Delivery {sourceEvidence.deliveryMode} · sourceLabel: {sourceEvidence.sourceLabel}
          </div>
          <div>
            控制面来源: {sourceEvidence.controlPlaneSource} · 业务数据: {sourceEvidence.businessDataSource}
          </div>
          <div>query: {sourceEvidence.query}</div>
          <div>
            refreshPath: {sourceEvidence.refreshPath} · generatedAt: {sourceEvidence.generatedAt}
          </div>
          <div>{sourceEvidence.note}</div>
        </div>
        <IdentityAccessWorkspaceClient snapshot={snapshot} />
      </div>
    </AdminPermissionGate>
  )
}
