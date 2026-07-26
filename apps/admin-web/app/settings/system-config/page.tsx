import { AdminPermissionGate } from '../../components/admin-permission-gate'
import SystemConfigClient from './system-config-client'
import { loadSystemConfigSnapshot } from './system-config-data'

const permissionGate = {
  requiredPermission: 'foundation.governance.read',
  title: '系统配置访问受限',
  description:
    '系统配置页已切换为服务端快照壳层，仅具备 foundation.governance.read 权限的账号可查看分类配置、来源态证据与刷新结果。',
} as const

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function SystemConfigPage() {
  const snapshot = await loadSystemConfigSnapshot()
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    sourceLabel: snapshot.sourceLabel,
    controlPlaneSource:
      snapshot.deliveryMode === 'api'
        ? 'loadSystemConfigSnapshot -> system-config + system-config/meta/categories'
        : 'loadSystemConfigSnapshot -> fallbackSettings + fallbackCategories',
    businessDataSource:
      snapshot.deliveryMode === 'api'
        ? 'system-config upstream API response'
        : 'local system governance samples',
    refreshPath: 'SystemConfigPage -> loadSystemConfigSnapshot',
    generatedAt: snapshot.generatedAt,
    note:
      snapshot.deliveryMode === 'api'
        ? '当前页面直接消费 system-config 服务端快照。'
        : '当前页面已回退到本地系统治理样本，不可作为闭环复签证据。',
  } as const

  return (
    <AdminPermissionGate {...permissionGate}>
      <div style={{ padding: 24 }}>
        <div
          style={{
            maxWidth: 1120,
            margin: '0 auto',
            marginBottom: 16,
            padding: '12px 16px',
            borderRadius: 12,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(148,163,184,0.08)',
            fontSize: 12,
            color: '#cbd5e1',
            lineHeight: 1.7,
          }}
        >
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
        <SystemConfigClient snapshot={snapshot} />
      </div>
    </AdminPermissionGate>
  )
}
