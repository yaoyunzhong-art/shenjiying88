import {
  loadAdminMemberOperationSourceDetail,
  type AdminMemberOperationSourceDetailSnapshot,
  type MemberOperationsSourceKind,
} from '../../../../../members-view-model'

export type { AdminMemberOperationSourceDetailSnapshot, MemberOperationsSourceKind }

export interface MemberOperationSourceDetailSnapshot extends AdminMemberOperationSourceDetailSnapshot {
  sourceLabel: string
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
}

export async function loadMemberOperationSourceDetailSnapshot(
  memberId: string,
  kind: MemberOperationsSourceKind,
  sourceId: string
): Promise<MemberOperationSourceDetailSnapshot> {
  const snapshot = await loadAdminMemberOperationSourceDetail(memberId, kind, sourceId)

  return {
    ...snapshot,
    sourceLabel:
      snapshot.deliveryMode === 'api'
        ? 'member-operation-source-detail-api'
        : 'member-operation-source-detail-fallback',
    generatedAt: new Date().toISOString(),
    controlPlaneSource:
      snapshot.deliveryMode === 'api'
        ? 'loadMemberOperationSourceDetailSnapshot -> loadAdminMemberOperationSourceDetail -> member persistent detail'
        : 'loadMemberOperationSourceDetailSnapshot -> loadAdminMemberOperationSourceDetail fallback -> local member detail samples',
    businessDataSource:
      snapshot.deliveryMode === 'api'
        ? 'member operations source detail snapshot'
        : 'local member operations source samples',
    refreshPath: `MemberOperationSourceDetailPage -> loadMemberOperationSourceDetailSnapshot(${memberId}, ${kind}, ${sourceId})`,
    note:
      snapshot.deliveryMode === 'api'
        ? '当前运营来源详情页优先消费真实来源治理快照。'
        : '当前运营来源详情页已回退到本地来源样本，批处理结果需结合上游恢复情况复核。',
  }
}
