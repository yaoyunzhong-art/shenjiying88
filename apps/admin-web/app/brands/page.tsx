import { AdminPermissionGate } from '../components/admin-permission-gate'
import BrandsClient from './brands-client'
import { loadBrandsSnapshot } from './brands-data'

const permissionGate = {
  requiredPermission: 'brands:read',
  title: '品牌管理访问受限',
  description:
    '品牌管理页已切换为服务端快照壳层，只有具备 brands:read 的账号才能查看品牌列表、筛选统计与来源态证据。',
} as const

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function BrandsPage() {
  const snapshot = await loadBrandsSnapshot()
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    sourceLabel: snapshot.sourceLabel,
    controlPlaneSource: 'loadBrandsSnapshot -> defaultBrands snapshot',
    businessDataSource: 'local brand sample snapshot records',
    refreshPath: 'BrandsPage -> loadBrandsSnapshot',
    generatedAt: snapshot.generatedAt,
    note: '当前页面使用本地品牌快照样本，不代表真实品牌主数据，也不可作为闭环复签证据。',
  } as const

  return (
    <AdminPermissionGate
      requiredPermission={permissionGate.requiredPermission}
      title={permissionGate.title}
      description={permissionGate.description}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 12,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(148,163,184,0.08)',
            fontSize: 12,
            color: '#cbd5e1',
            lineHeight: 1.7,
            marginBottom: 16,
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
        <BrandsClient snapshot={snapshot} />
      </div>
    </AdminPermissionGate>
  )
}
