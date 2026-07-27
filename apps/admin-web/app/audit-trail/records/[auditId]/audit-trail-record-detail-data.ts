import {
  loadAuditTrailRecordDetail,
  type AuditTrailRecordDetail,
} from '../../../audit-trail-detail-view-model'

export interface AuditTrailRecordDetailSnapshot extends AuditTrailRecordDetail {
  sourceLabel: 'audit-trail-record-detail-api' | 'audit-trail-record-detail-fallback'
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
}

export async function loadAuditTrailRecordDetailSnapshot(
  auditId: string,
): Promise<AuditTrailRecordDetailSnapshot> {
  const snapshot = await loadAuditTrailRecordDetail(auditId)

  return {
    ...snapshot,
    sourceLabel:
      snapshot.deliveryMode === 'api'
        ? 'audit-trail-record-detail-api'
        : 'audit-trail-record-detail-fallback',
    generatedAt: new Date().toISOString(),
    controlPlaneSource: 'loadAuditTrailRecordDetailSnapshot -> loadAuditTrailRecordDetail',
    businessDataSource:
      'audit trail record detail renderer consumes detail view-model snapshot and related records',
    refreshPath: `loadAuditTrailRecordDetailSnapshot(${auditId})`,
    note:
      snapshot.deliveryMode === 'api'
        ? '审计详情与关联记录首屏来自真实读模型，本轮补齐 E54 三层壳层与统一刷新入口。'
        : '审计详情当前回退到 fallback 读模型结果，本轮补齐 E54 三层壳层并保留显式来源态证据。',
  }
}
