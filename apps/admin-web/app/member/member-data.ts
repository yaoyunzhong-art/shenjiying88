import {
  MOCK_MEMBERS,
  MEMBER_STATUS_MAP,
  MEMBER_TIER_MAP,
  type MemberItem,
  type MemberStatus,
  type MemberTier,
} from '../members-data'
import { loadAdminMemberList } from '../members-view-model'

export type { MemberItem, MemberStatus, MemberTier } from '../members-data'
export { MEMBER_STATUS_MAP, MEMBER_TIER_MAP }
export const FALLBACK_MEMBERS = MOCK_MEMBERS

export interface MemberSnapshotDelivery {
  deliveryMode: 'api' | 'fallback'
  members: MemberItem[]
  stats: {
    total: number
    active: number
    diamond: number
    gold: number
    dormant: number
    totalSpent: number
  }
  generatedAt: string
  error?: string
}

function computeMemberStats(items: MemberItem[]) {
  return {
    total: items.length,
    active: items.filter((item) => item.status === 'active').length,
    diamond: items.filter((item) => item.tier === 'diamond').length,
    gold: items.filter((item) => item.tier === 'gold').length,
    dormant: items.filter((item) => item.status === 'dormant').length,
    totalSpent: items.reduce((sum, item) => sum + item.totalSpent, 0),
  }
}

function getLatestMemberTimestamp(items: MemberItem[]): string {
  const values = items.flatMap((item) => [item.registeredAt, item.lastVisitAt]).filter(Boolean)
  return values.sort().at(-1) ?? '—'
}

export async function loadMemberSnapshot(): Promise<MemberSnapshotDelivery> {
  const snapshot = await loadAdminMemberList()

  if (snapshot.deliveryMode === 'api') {
    return {
      deliveryMode: 'api',
      members: snapshot.members,
      stats: computeMemberStats(snapshot.members),
      generatedAt: new Date().toISOString(),
    }
  }

  return {
    deliveryMode: 'fallback',
    members: FALLBACK_MEMBERS,
    stats: computeMemberStats(FALLBACK_MEMBERS),
    generatedAt: getLatestMemberTimestamp(FALLBACK_MEMBERS),
    error: '会员实时接口不可达，已切换到 fallback 样本数据。',
  }
}
