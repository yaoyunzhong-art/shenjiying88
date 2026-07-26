import { AdminPermissionGate } from '../components/admin-permission-gate'
import AiCsClient from './ai-cs-client'
import { loadAiCsSnapshot } from './ai-cs-data'

const permissionGate = {
  requiredPermission: 'ai-cs:read',
  title: 'ai-cs 访问受限',
  description: '该页面已接入管理员权限管控，仅具备 ai-cs:read 权限的账号可访问。',
} as const

export const dynamic = 'force-dynamic'
export const revalidate = 0

type PageProps = {
  searchParams?: Promise<{ tenantId?: string | string[] }>
}

export default async function AiCsPage({ searchParams }: PageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const tenantIdParam = resolvedSearchParams?.tenantId
  const tenantId = Array.isArray(tenantIdParam) ? tenantIdParam[0] : tenantIdParam
  const snapshot = await loadAiCsSnapshot(tenantId ?? 'demo-tenant')

  return (
    <AdminPermissionGate {...permissionGate}>
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: 24 }}>
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
          <div>Delivery {snapshot.deliveryMode} · 控制面来源: {snapshot.controlPlaneSource}</div>
          <div>业务数据: {snapshot.businessDataSource} · 刷新路径: {snapshot.refreshPath}</div>
          <div>generatedAt: {snapshot.generatedAt} · 来源标签: {snapshot.sourceLabel}</div>
          <div>{snapshot.note}</div>
        </div>
        <AiCsClient snapshot={snapshot} />
      </div>
    </AdminPermissionGate>
  )
}
