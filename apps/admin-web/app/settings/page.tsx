import { AdminPermissionGate } from '../components/admin-permission-gate'
import SettingsClient from './settings-client'
import { loadSettingsSnapshot } from './settings-page-data'

const permissionGate = {
  requiredPermission: 'foundation.governance.read',
  title: '设置中心访问受限',
  description:
    '设置中心页已切换为服务端快照壳层，只有具备 foundation.governance.read 权限的账号才能查看配置目录、状态摘要与模块权限缺口。',
} as const

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function SettingsPage() {
  const snapshot = await loadSettingsSnapshot()
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    sourceLabel: snapshot.sourceLabel,
    controlPlaneSource: 'loadSettingsSnapshot -> local settings center snapshot',
    businessDataSource: 'local settings modules and permission samples',
    refreshPath: 'SettingsPage -> loadSettingsSnapshot',
    generatedAt: snapshot.generatedAt,
    note: '当前页面使用本地设置中心快照，不代表真实配置中台主链，也不可作为闭环复签证据。',
  } as const

  return (
    <AdminPermissionGate {...permissionGate}>
      <div style={{ padding: 24 }}>
        <div
          style={{
            maxWidth: 1120,
            margin: '0 auto 16px',
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
        <SettingsClient snapshot={snapshot} />
      </div>
    </AdminPermissionGate>
  )
}
