import { AdminPermissionGate } from '../../components/admin-permission-gate'
import MembershipLevelsClient from './membership-levels-client'
import { loadMembershipLevelsSnapshot } from './membership-levels-data'

const permissionGate = {
  requiredPermission: 'foundation.governance.read',
  title: '会员等级配置访问受限',
  description: '会员等级页已切换为服务端快照壳层，只有具备 foundation.governance.read 权限的账号才能查看等级体系与升降级规则。',
} as const

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function MembershipLevelsPage() {
  const snapshot = await loadMembershipLevelsSnapshot()
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    sourceLabel: snapshot.sourceLabel,
    controlPlaneSource: 'loadMembershipLevelsSnapshot -> local membership governance snapshot',
    businessDataSource: 'local membership levels and level rules samples',
    refreshPath: 'MembershipLevelsPage -> loadMembershipLevelsSnapshot',
    generatedAt: snapshot.generatedAt,
    note: '当前页面使用本地会员等级样本，不代表真实会员治理主链，也不可作为闭环复签证据。',
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
        <MembershipLevelsClient snapshot={snapshot} />
      </div>
    </AdminPermissionGate>
  )
}
