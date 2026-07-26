import { AdminPermissionGate } from '../../components/admin-permission-gate'
import MemberReportsClient from './member-reports-client'
import { loadMemberReportsPageSnapshot } from './member-reports-data'

const permissionGate = {
  requiredPermission: 'member:read',
  title: '会员数据报告访问受限',
  description:
    '会员数据报告页已接入管理员本地 session，只有具备 member:read 的账号才能查看增长分析、RFM 分群、活跃度与 LTV 指标。',
} as const

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function MemberReportsPage() {
  const snapshot = await loadMemberReportsPageSnapshot()
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    controlPlaneSource:
      snapshot.deliveryMode === 'api'
        ? 'loadMemberReportsPageSnapshot -> members/persistent'
        : 'loadMemberReportsPageSnapshot -> buildMemberMetrics / buildRfmSegments / buildMemberActivity fallback',
    businessDataSource:
      snapshot.deliveryMode === 'api'
        ? 'real members/persistent profile list + fallback analytics trend/activity/LTV samples'
        : 'local member analytics samples',
    refreshPath: 'MemberReportsPage -> loadMemberReportsPageSnapshot',
    generatedAt: snapshot.generatedAt,
    sourceLabel: snapshot.sourceLabel,
    note:
      snapshot.deliveryMode === 'api'
        ? '当前页为部分真替换：当前概览与 RFM 来自真实会员列表，趋势/活跃/LTV 仍保留 fallback。'
        : '当前会员报表页使用本地样本快照，不可作为实时复签证据。',
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
          <div>Delivery {sourceEvidence.deliveryMode} · 控制面来源: {sourceEvidence.controlPlaneSource}</div>
          <div>业务数据: {sourceEvidence.businessDataSource} · 刷新路径: {sourceEvidence.refreshPath}</div>
          <div>generatedAt: {sourceEvidence.generatedAt} · 来源标签: {sourceEvidence.sourceLabel}</div>
          <div>API字段: {snapshot.apiBackedFields.join(' / ') || '无'} · Fallback字段: {snapshot.fallbackFields.join(' / ') || '无'}</div>
          <div>{sourceEvidence.note}</div>
        </div>
        <MemberReportsClient snapshot={snapshot} />
      </div>
    </AdminPermissionGate>
  )
}
