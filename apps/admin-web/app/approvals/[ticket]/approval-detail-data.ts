import {
  loadGovernanceApprovalDetail,
  loadGovernanceApprovalOutcomeAuditLogs,
} from '../../approvals-view-model'

export interface ApprovalDetailSnapshot {
  deliveryMode: 'api' | 'fallback'
  sourceLabel: 'approval-detail-api' | 'approval-detail-fallback'
  ticket: string
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
}

export async function loadApprovalDetailSnapshot(ticket: string): Promise<ApprovalDetailSnapshot> {
  const [detail, outcomeAudit] = await Promise.all([
    loadGovernanceApprovalDetail(ticket),
    loadGovernanceApprovalOutcomeAuditLogs(ticket),
  ])

  const deliveryMode =
    detail.deliveryMode === 'api' && outcomeAudit.deliveryMode === 'api' ? 'api' : 'fallback'

  return {
    deliveryMode,
    sourceLabel: deliveryMode === 'api' ? 'approval-detail-api' : 'approval-detail-fallback',
    ticket,
    generatedAt: new Date().toISOString(),
    controlPlaneSource:
      'loadApprovalDetailSnapshot -> loadGovernanceApprovalDetail + loadGovernanceApprovalOutcomeAuditLogs',
    businessDataSource:
      'legacy approval detail page retains client-side approval actions, outcome audit hydration and message flow',
    refreshPath: `loadApprovalDetailSnapshot(${ticket})`,
    note:
      detail.deliveryMode === 'api' && outcomeAudit.deliveryMode === 'api'
        ? '审批详情与 outcome audit 首屏均已命中真实读模型，本轮补齐 E54 三层壳层与统一刷新入口。'
        : '审批详情或 outcome audit 当前仍有 fallback 命中，本轮补齐 E54 三层壳层并保留 legacy 客户端动作链路。',
  }
}
