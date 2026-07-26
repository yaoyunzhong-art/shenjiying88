import { AdminPermissionGate } from '../components/admin-permission-gate'
import CouponTemplatesClient from './coupon-templates-client'
import { loadCouponTemplatesSnapshot } from './coupon-templates-data'

const permissionGate = {
  requiredPermission: 'coupon-templates:read',
  title: 'coupon-templates 访问受限',
  description: '优惠券模板页已切换为服务端快照壳层，仅具备 coupon-templates:read 权限的账号可查看模板来源态、筛选结果与收口动作。',
} as const

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function CouponTemplatesPage() {
  const snapshot = await loadCouponTemplatesSnapshot()
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    sourceLabel: snapshot.sourceLabel,
    controlPlaneSource: 'loadCouponTemplatesSnapshot -> defaultCouponTemplates snapshot',
    businessDataSource: 'local coupon template sample snapshot records',
    refreshPath: 'CouponTemplatesPage -> loadCouponTemplatesSnapshot',
    generatedAt: snapshot.generatedAt,
    note: '当前页面消费本地优惠券模板快照样本，不代表实时营销主数据，也不可作为闭环复签证据。',
  } as const

  return (
    <AdminPermissionGate {...permissionGate}>
      <div style={{ padding: 24 }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', marginBottom: 16, padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(148,163,184,0.08)', fontSize: 12, color: '#cbd5e1', lineHeight: 1.7 }}>
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
        <CouponTemplatesClient snapshot={snapshot} />
      </div>
    </AdminPermissionGate>
  )
}
