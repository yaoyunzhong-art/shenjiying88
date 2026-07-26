import { AdminPermissionGate } from '../components/admin-permission-gate'
import ConfigurationWorkspaceClient from './configuration-workspace-client'
import {
  loadConfigurationPageSnapshot,
  normalizeConfigurationQuery,
} from './configuration-data'

const permissionGate = {
  requiredPermission: 'foundation.governance.read',
  title: '配置治理访问受限',
  description:
    '配置治理页已切换为 server wrapper + snapshot loader，仅具备 foundation.governance.read 权限的账号可查看来源态证据、治理总览与明细快照。',
} as const

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface ConfigurationPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function ConfigurationPage({
  searchParams,
}: ConfigurationPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const snapshot = await loadConfigurationPageSnapshot(
    normalizeConfigurationQuery(resolvedSearchParams),
  )

  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    sourceLabel: snapshot.sourceLabel,
    controlPlaneSource:
      snapshot.deliveryMode === 'api'
        ? 'ConfigurationPage -> loadConfigurationPageSnapshot -> loadConfigurationGovernanceSnapshot -> configuration governance overview/metadata'
        : 'ConfigurationPage -> loadConfigurationPageSnapshot -> loadConfigurationGovernanceSnapshot fallback',
    businessDataSource:
      snapshot.deliveryMode === 'api'
        ? 'configuration-governance overview + management metadata responses'
        : 'local configuration-governance fallback snapshot',
    refreshPath: 'ConfigurationPage -> loadConfigurationPageSnapshot',
    generatedAt: snapshot.generatedAt,
    query: `tenant=${snapshot.query.tenantId ?? '—'} · brand=${snapshot.query.brandId ?? '—'} · store=${snapshot.query.storeId ?? '—'} · market=${snapshot.query.marketCode ?? '—'}`,
    note: snapshot.note,
  } as const

  return (
    <AdminPermissionGate {...permissionGate}>
      <div style={shellStyle}>
        <div style={evidenceStyle}>
          <div>
            Delivery {sourceEvidence.deliveryMode} · sourceLabel:{' '}
            {sourceEvidence.sourceLabel}
          </div>
          <div>
            控制面来源: {sourceEvidence.controlPlaneSource} · 业务数据:{' '}
            {sourceEvidence.businessDataSource}
          </div>
          <div>query: {sourceEvidence.query}</div>
          <div>
            refreshPath: {sourceEvidence.refreshPath} · generatedAt:{' '}
            {sourceEvidence.generatedAt}
          </div>
          <div>{sourceEvidence.note}</div>
        </div>
        <ConfigurationWorkspaceClient
          overview={snapshot.overview}
          managementMetadata={snapshot.managementMetadata}
          scopeChain={snapshot.overview.scopeChain}
        />
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
