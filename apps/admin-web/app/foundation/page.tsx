import { AdminPermissionGate } from '../components/admin-permission-gate'
import FoundationWorkspaceClient from './foundation-workspace-client'
import { loadFoundationPageSnapshot, normalizeFoundationQuery } from './foundation-data'

const permissionGate = {
  requiredPermission: 'foundation.governance.read',
  title: 'Foundation 总览访问受限',
  description:
    'Foundation 总览页已接入管理员本地 session，只有具备 foundation.governance.read 的账号才能查看模块目录、治理基线与消费者依赖。',
} as const

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface FoundationPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function FoundationPage({ searchParams }: FoundationPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const snapshot = await loadFoundationPageSnapshot(
    normalizeFoundationQuery(resolvedSearchParams),
  )
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    sourceLabel: snapshot.sourceLabel,
    controlPlaneSource:
      snapshot.deliveryMode === 'api'
        ? 'FoundationPage -> loadFoundationPageSnapshot -> loadFoundationWorkspace -> foundation bootstrap/overview/module detail'
        : 'FoundationPage -> loadFoundationPageSnapshot -> loadFoundationWorkspace fallback',
    businessDataSource:
      snapshot.deliveryMode === 'api'
        ? 'foundation bootstrap, overview alerts and selected module detail responses'
        : 'local foundation workspace fallback samples',
    refreshPath: 'FoundationPage -> loadFoundationPageSnapshot',
    generatedAt: snapshot.generatedAt,
    query: `module=${snapshot.query.moduleKey} · consumer=${snapshot.query.consumer}`,
    note: snapshot.note,
  } as const

  return (
    <AdminPermissionGate {...permissionGate}>
      <div style={shellStyle}>
        <div style={evidenceStyle}>
          <div>
            Delivery {sourceEvidence.deliveryMode} · sourceLabel: {sourceEvidence.sourceLabel}
          </div>
          <div>
            控制面来源: {sourceEvidence.controlPlaneSource} · 业务数据:{' '}
            {sourceEvidence.businessDataSource}
          </div>
          <div>query: {sourceEvidence.query}</div>
          <div>
            refreshPath: {sourceEvidence.refreshPath} · generatedAt: {sourceEvidence.generatedAt}
          </div>
          <div>{sourceEvidence.note}</div>
        </div>
        <FoundationWorkspaceClient query={snapshot.query} workspace={snapshot.workspace} />
      </div>
    </AdminPermissionGate>
  )
}

const shellStyle = {
  maxWidth: 1280,
  margin: '0 auto',
  padding: 24,
}

const evidenceStyle = {
  marginBottom: 24,
  borderRadius: 14,
  border: '1px solid rgba(148, 163, 184, 0.22)',
  background: 'rgba(248, 250, 252, 0.96)',
  padding: 16,
  color: '#334155',
  fontSize: 12,
  lineHeight: 1.8,
}
