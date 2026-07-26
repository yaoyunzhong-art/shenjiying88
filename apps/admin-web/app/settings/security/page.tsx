import { AdminPermissionGate } from '../../components/admin-permission-gate'
import SecurityClient from './security-client'
import { loadSecuritySnapshot } from './security-data'

const permissionGate = {
  requiredPermission: 'foundation.governance.read',
  title: '安全设置访问受限',
  description:
    '安全设置页已切换为服务端快照壳层，仅具备 foundation.governance.read 权限的账号可查看密码策略、登录保护和来源态证据。',
} as const

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function SecurityPage() {
  const snapshot = await loadSecuritySnapshot()
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    sourceLabel: snapshot.sourceLabel,
    controlPlaneSource: 'loadSecuritySnapshot -> local security policy snapshot',
    businessDataSource: 'local security governance samples',
    refreshPath: 'SecurityPage -> loadSecuritySnapshot',
    generatedAt: snapshot.generatedAt,
    note: '当前页面使用本地安全策略样本，不代表真实安全中台主链，也不可作为闭环复签证据。',
  } as const

  return (
    <AdminPermissionGate {...permissionGate}>
      <div style={{ padding: 24 }}>
        <div
          style={{
            maxWidth: 1080,
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
        <SecurityClient snapshot={snapshot} />
      </div>
    </AdminPermissionGate>
  )
}
