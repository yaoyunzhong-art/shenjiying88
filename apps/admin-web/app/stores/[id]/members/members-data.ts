export type MemberTier = 'diamond' | 'gold' | 'silver' | 'bronze' | 'basic'
export type MemberStatus = 'active' | 'inactive' | 'frozen'

export interface LevelConfig {
  key: MemberTier
  label: string
  color: string
  minPoints: number
}

export interface MemberRecord {
  id: string
  name: string
  phone: string
  tier: MemberTier
  points: number
  balance: number
  totalSpent: number
  totalVisits: number
  lastVisit: string
  createdAt: string
  status: MemberStatus
  tags?: string[]
}

export interface TierDistribution {
  tier: MemberTier
  label: string
  color: string
  count: number
}

export interface MembersSnapshotSummary {
  totalMembers: number
  activeMembers: number
  newThisMonth: number
  active7d: number
  totalPoints: number
  totalBalance: number
  tierDistribution: TierDistribution[]
}

export interface MembersSnapshot {
  deliveryMode: 'mock'
  sourceLabel: 'store-members-mock'
  storeId: string
  members: MemberRecord[]
  levels: LevelConfig[]
  summary: MembersSnapshotSummary
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
  error?: string
}

export const MEMBER_LEVELS: LevelConfig[] = [
  { key: 'basic', label: '普通', color: '#64748b', minPoints: 0 },
  { key: 'bronze', label: '铜卡', color: '#d97706', minPoints: 500 },
  { key: 'silver', label: '银卡', color: '#94a3b8', minPoints: 2000 },
  { key: 'gold', label: '黄金', color: '#fbbf24', minPoints: 5000 },
  { key: 'diamond', label: '钻石', color: '#a78bfa', minPoints: 10000 },
]

export const MEMBER_RECORDS: MemberRecord[] = [
  {
    id: 'M001',
    name: '张明',
    phone: '138****1024',
    tier: 'diamond',
    points: 12600,
    balance: 1680,
    totalSpent: 42000,
    totalVisits: 56,
    lastVisit: '2026-07-26',
    createdAt: '2026-01-08',
    status: 'active',
    tags: ['VIP', '高频'],
  },
  {
    id: 'M002',
    name: '李芳',
    phone: '139****2218',
    tier: 'gold',
    points: 6800,
    balance: 860,
    totalSpent: 19800,
    totalVisits: 37,
    lastVisit: '2026-07-25',
    createdAt: '2026-02-18',
    status: 'active',
    tags: ['亲子'],
  },
  {
    id: 'M003',
    name: '王强',
    phone: '137****4456',
    tier: 'silver',
    points: 3580,
    balance: 420,
    totalSpent: 8900,
    totalVisits: 22,
    lastVisit: '2026-07-23',
    createdAt: '2026-03-02',
    status: 'active',
    tags: ['电竞'],
  },
  {
    id: 'M004',
    name: '赵丽',
    phone: '136****3345',
    tier: 'bronze',
    points: 980,
    balance: 120,
    totalSpent: 3600,
    totalVisits: 11,
    lastVisit: '2026-07-12',
    createdAt: '2026-05-09',
    status: 'inactive',
    tags: ['沉默'],
  },
  {
    id: 'M005',
    name: '刘伟',
    phone: '135****8091',
    tier: 'basic',
    points: 240,
    balance: 60,
    totalSpent: 1200,
    totalVisits: 6,
    lastVisit: '2026-07-20',
    createdAt: '2026-07-02',
    status: 'active',
    tags: ['新客'],
  },
  {
    id: 'M006',
    name: '陈静',
    phone: '133****7765',
    tier: 'silver',
    points: 2980,
    balance: 280,
    totalSpent: 7300,
    totalVisits: 19,
    lastVisit: '2026-07-18',
    createdAt: '2026-04-17',
    status: 'frozen',
    tags: ['风控关注'],
  },
]

export function buildMembersSummary(
  members: MemberRecord[],
  levels: LevelConfig[]
): MembersSnapshotSummary {
  return {
    totalMembers: members.length,
    activeMembers: members.filter((item) => item.status === 'active').length,
    newThisMonth: members.filter((item) => item.createdAt.startsWith('2026-07')).length,
    active7d: members.filter((item) => item.lastVisit >= '2026-07-20').length,
    totalPoints: members.reduce((sum, item) => sum + item.points, 0),
    totalBalance: members.reduce((sum, item) => sum + item.balance, 0),
    tierDistribution: levels.map((level) => ({
      tier: level.key,
      label: level.label,
      color: level.color,
      count: members.filter((item) => item.tier === level.key).length,
    })),
  }
}

export async function loadMembersSnapshot(storeId: string): Promise<MembersSnapshot> {
  const levels = MEMBER_LEVELS.map((item) => ({ ...item }))
  const members = MEMBER_RECORDS.map((item) => ({ ...item, tags: item.tags ? [...item.tags] : undefined }))

  return {
    deliveryMode: 'mock',
    sourceLabel: 'store-members-mock',
    storeId,
    members,
    levels,
    summary: buildMembersSummary(members, levels),
    generatedAt: '2026-07-27T17:20:00.000Z',
    controlPlaneSource: 'loadMembersSnapshot -> MEMBER_LEVELS + MEMBER_RECORDS + buildMembersSummary',
    businessDataSource: 'local member samples + derived tier distribution and activity counters',
    refreshPath: `MembersPage -> loadMembersSnapshot(${storeId})`,
    note: '当前门店会员页消费本地 members snapshot loader，已显式暴露来源态与刷新路径，积分、余额与导入操作仍为 mock 演示。',
    error: '门店会员控制面尚未接入实时 CRM 上游，当前展示 mock 快照。',
  }
}
