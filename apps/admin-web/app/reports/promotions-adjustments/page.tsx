import { AdminPermissionGate } from '../../components/admin-permission-gate'
import PromotionsAdjustmentsClient from './promotions-adjustments-client'
import { loadPromotionsAdjustmentsSnapshot } from './promotions-adjustments-data'

const permissionGate = {
  requiredPermission: 'dashboard:read',
  title: '促销调整访问受限',
  description:
    '促销调整报表页已接入管理员本地 session，只有具备 dashboard:read 的账号才能查看活动预算、ROI、核销与状态表现。',
} as const

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function PromotionsAdjustmentsPage() {
  const snapshot = await loadPromotionsAdjustmentsSnapshot()
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
      <div style={{ maxWidth: 1320, margin: '0 auto', padding: 24 }}>
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
          <div>Delivery {sourceEvidence.deliveryMode} / {sourceEvidence.sourceLabel}</div>
          <div>控制面来源: {sourceEvidence.controlPlaneSource} / 业务数据: {sourceEvidence.businessDataSource}</div>
          <div>刷新路径: {sourceEvidence.refreshPath} / generatedAt: {sourceEvidence.generatedAt}</div>
          <div>{sourceEvidence.note}</div>
        </div>
        <PromotionsAdjustmentsClient snapshot={snapshot} />
      </div>
    </AdminPermissionGate>
  )
}
