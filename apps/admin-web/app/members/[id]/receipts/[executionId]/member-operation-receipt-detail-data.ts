import {
  loadAdminMemberOperationReceiptDetail,
  type AdminMemberOperationReceiptDetailSnapshot,
} from '../../../../members-view-model'

export type { AdminMemberOperationReceiptDetailSnapshot }

export interface MemberOperationReceiptDetailSnapshot extends AdminMemberOperationReceiptDetailSnapshot {
  sourceLabel: string
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
}

export async function loadMemberOperationReceiptDetailSnapshot(
  memberId: string,
  executionId: string
): Promise<MemberOperationReceiptDetailSnapshot> {
  const snapshot = await loadAdminMemberOperationReceiptDetail(memberId, executionId)

  return {
    ...snapshot,
    sourceLabel:
      snapshot.deliveryMode === 'api'
        ? 'member-operation-receipt-detail-api'
        : 'member-operation-receipt-detail-fallback',
    generatedAt: new Date().toISOString(),
    controlPlaneSource:
      snapshot.deliveryMode === 'api'
        ? 'loadMemberOperationReceiptDetailSnapshot -> loadAdminMemberOperationReceiptDetail -> member persistent detail'
        : 'loadMemberOperationReceiptDetailSnapshot -> loadAdminMemberOperationReceiptDetail fallback -> local member detail samples',
    businessDataSource:
      snapshot.deliveryMode === 'api'
        ? 'member operations receipt detail snapshot'
        : 'local member operations receipt samples',
    refreshPath: `MemberOperationReceiptDetailPage -> loadMemberOperationReceiptDetailSnapshot(${memberId}, ${executionId})`,
    note:
      snapshot.deliveryMode === 'api'
        ? '当前运营回执详情页优先消费真实会员回执快照。'
        : '当前运营回执详情页已回退到本地回执样本，需结合上游恢复情况复核。',
  }
}
