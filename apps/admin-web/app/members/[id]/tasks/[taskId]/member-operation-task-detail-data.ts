import {
  loadAdminMemberOperationTaskDetail,
  type AdminMemberOperationTaskDetailSnapshot,
} from '../../../../members-view-model'

export type { AdminMemberOperationTaskDetailSnapshot }

export interface MemberOperationTaskDetailSnapshot extends AdminMemberOperationTaskDetailSnapshot {
  sourceLabel: string
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
}

export async function loadMemberOperationTaskDetailSnapshot(
  memberId: string,
  taskId: string
): Promise<MemberOperationTaskDetailSnapshot> {
  const snapshot = await loadAdminMemberOperationTaskDetail(memberId, taskId)

  return {
    ...snapshot,
    sourceLabel:
      snapshot.deliveryMode === 'api'
        ? 'member-operation-task-detail-api'
        : 'member-operation-task-detail-fallback',
    generatedAt: new Date().toISOString(),
    controlPlaneSource:
      snapshot.deliveryMode === 'api'
        ? 'loadMemberOperationTaskDetailSnapshot -> loadAdminMemberOperationTaskDetail -> member persistent detail'
        : 'loadMemberOperationTaskDetailSnapshot -> loadAdminMemberOperationTaskDetail fallback -> local member detail samples',
    businessDataSource:
      snapshot.deliveryMode === 'api'
        ? 'member operations task detail snapshot'
        : 'local member operations task samples',
    refreshPath: `MemberOperationTaskDetailPage -> loadMemberOperationTaskDetailSnapshot(${memberId}, ${taskId})`,
    note:
      snapshot.deliveryMode === 'api'
        ? '当前运营任务详情页优先消费真实会员任务快照。'
        : '当前运营任务详情页已回退到本地任务样本，需结合上游恢复情况复核。',
  }
}
