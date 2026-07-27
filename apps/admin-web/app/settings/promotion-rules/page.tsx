import { AdminPermissionGate } from '../../components/admin-permission-gate'
import PromotionRulesClient from './promotion-rules-client'
import { loadPromotionRulesSnapshot } from './promotion-rules-data'

const permissionGate = {
  requiredPermission: 'foundation.governance.read',
  title: '促销规则访问受限',
  description: '促销规则页已切换为服务端快照壳层，只有具备 foundation.governance.read 权限的账号才能查看规则清单与类型说明。',
} as const

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function PromotionRulesPage() {
  const snapshot = await loadPromotionRulesSnapshot()
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    sourceLabel: snapshot.sourceLabel,
    controlPlaneSource: 'loadPromotionRulesSnapshot -> local marketing rules snapshot',
    businessDataSource: 'local promotion rules and type descriptions samples',
    refreshPath: 'PromotionRulesPage -> loadPromotionRulesSnapshot',
    generatedAt: snapshot.generatedAt,
    note: '当前页面使用本地促销规则样本，不代表真实营销规则主链，也不可作为闭环复签证据。',
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
        <PromotionRulesClient snapshot={snapshot} />
      </div>
    </AdminPermissionGate>
  )
}
