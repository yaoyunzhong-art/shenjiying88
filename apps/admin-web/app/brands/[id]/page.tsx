import { AdminPermissionGate } from '../../components/admin-permission-gate'
import BrandDetailClient from './brand-detail-client'
import { loadBrandDetailSnapshot } from './brand-detail-data'

const permissionGate = {
  requiredPermission: 'brands:read',
  title: '品牌详情访问受限',
  description:
    '品牌详情页已接入管理员本地 session，只有具备 brands:read 的账号才能查看品牌档案、编辑表单与收口动作。',
} as const

export const dynamic = 'force-dynamic'
export const revalidate = 0

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function BrandDetailPage({ params }: PageProps) {
  const { id } = await params
  const snapshot = await loadBrandDetailSnapshot(id)
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    sourceLabel: snapshot.sourceLabel,
    controlPlaneSource: snapshot.controlPlaneSource,
    businessDataSource: snapshot.businessDataSource,
    refreshPath: snapshot.refreshPath,
    generatedAt: snapshot.generatedAt,
    note: snapshot.note,
  } as const

  return (
    <AdminPermissionGate {...permissionGate}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: 24 }}>
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
          <div>
            Delivery {sourceEvidence.deliveryMode} · 来源标签: {sourceEvidence.sourceLabel} · 控制面来源:{' '}
            {sourceEvidence.controlPlaneSource}
          </div>
          <div>
            业务数据: {sourceEvidence.businessDataSource} · 刷新路径: {sourceEvidence.refreshPath}
          </div>
          <div>
            generatedAt: {sourceEvidence.generatedAt} · {sourceEvidence.note}
          </div>
        </div>
        <BrandDetailClient snapshot={snapshot} />
      </div>
    </AdminPermissionGate>
  )
}
