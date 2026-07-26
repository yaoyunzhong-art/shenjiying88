import type { MemberItem } from '../members-data'
import { loadAdminMemberList } from '../members-view-model'

export interface MembersPageSnapshot {
  deliveryMode: 'api' | 'fallback'
  sourceLabel: string
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
  members: MemberItem[]
}

export async function loadMembersPageSnapshot(): Promise<MembersPageSnapshot> {
  const snapshot = await loadAdminMemberList()

  return {
    deliveryMode: snapshot.deliveryMode,
    sourceLabel:
      snapshot.deliveryMode === 'api' ? 'member persistent api snapshot' : 'member fallback snapshot',
    generatedAt: new Date().toISOString(),
    controlPlaneSource:
      snapshot.deliveryMode === 'api'
        ? 'loadMembersPageSnapshot -> loadAdminMemberList -> /members/persistent'
        : 'loadMembersPageSnapshot -> loadAdminMemberList fallback -> MOCK_MEMBERS',
    businessDataSource:
      snapshot.deliveryMode === 'api' ? 'persistent member records' : 'local member samples',
    refreshPath: 'MembersPage -> loadMembersPageSnapshot',
    note:
      snapshot.deliveryMode === 'api'
        ? '当前页面直接消费持久化会员列表快照。'
        : '当前页面已回退到本地会员样本，不可作为闭环复签证据。',
    members: snapshot.members,
  }
}
