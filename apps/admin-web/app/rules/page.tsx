import { AdminPermissionGate } from '../components/admin-permission-gate'
import RulesClient from './rules-client'
import { loadRulesSnapshot } from './rules-data'

const permissionGate = {
  requiredPermission: 'rules:read',
  title: 'rules 访问受限',
  description: '规则管理页已切换为服务端快照壳层，仅具备 rules:read 权限的账号可查看规则来源态、筛选结构与分类分布。',
} as const

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function RulesPage() {
  const snapshot = await loadRulesSnapshot()
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    sourceLabel: snapshot.sourceLabel,
    controlPlaneSource: 'loadRulesSnapshot -> defaultRules snapshot',
    businessDataSource: 'local rules sample snapshot records',
    refreshPath: 'RulesPage -> loadRulesSnapshot',
    generatedAt: snapshot.generatedAt,
    note: '当前页面消费本地规则快照样本，不代表实时规则引擎主数据，也不可作为闭环复签证据。',
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
        <RulesClient snapshot={snapshot} />
      </div>
    </AdminPermissionGate>
  )
}
