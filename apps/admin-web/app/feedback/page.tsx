import { AdminPermissionGate } from '../components/admin-permission-gate'
import FeedbackClient from './feedback-client'
import { loadFeedbackSnapshot } from './feedback-data'

const permissionGate = {
  requiredPermission: 'feedback:read',
  title: 'feedback 访问受限',
  description: '客户反馈页已切换为服务端快照壳层，仅具备 feedback:read 权限的账号可查看反馈来源态、分类结果与处置线索。',
} as const

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function FeedbackPage() {
  const snapshot = await loadFeedbackSnapshot()
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    sourceLabel: snapshot.sourceLabel,
    controlPlaneSource: 'loadFeedbackSnapshot -> defaultFeedbacks snapshot',
    businessDataSource: 'local customer feedback sample snapshot records',
    refreshPath: 'FeedbackPage -> loadFeedbackSnapshot',
    generatedAt: snapshot.generatedAt,
    note: '当前页面使用本地客户反馈快照样本，不代表实时客服工单流，也不可作为闭环复签证据。',
  } as const

  return (
    <AdminPermissionGate {...permissionGate}>
      <div style={{ padding: 24 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', marginBottom: 16, padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(148,163,184,0.08)', fontSize: 12, color: '#cbd5e1', lineHeight: 1.7 }}>
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
        <FeedbackClient snapshot={snapshot} />
      </div>
    </AdminPermissionGate>
  )
}
