export type ActivityStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'

export type ActivityType = 'team_building' | 'dinner' | 'travel' | 'sports' | 'other'

export interface TeamBuildingRecord {
  id: string
  name: string
  date: string
  status: ActivityStatus
  participantCount: number
  budget: number
  location: string
  type: ActivityType
  description: string
  createdAt: string
  actualParticipants?: number
}

export interface NewActivityForm {
  name: string
  date: string
  location: string
  budget: string
  participantCount: string
  description: string
  type: ActivityType
}

export interface TeamBuildingSnapshotDelivery {
  deliveryMode: 'mock'
  activities: TeamBuildingRecord[]
  generatedAt: string
}

export const ACTIVITY_STATUS_LABEL: Record<ActivityStatus, string> = {
  pending: '待报名',
  in_progress: '进行中',
  completed: '已完成',
  cancelled: '已取消',
}

export const ACTIVITY_STATUS_VARIANT: Record<
  ActivityStatus,
  'warning' | 'processing' | 'success' | 'default'
> = {
  pending: 'warning',
  in_progress: 'processing',
  completed: 'success',
  cancelled: 'default',
}

export const ACTIVITY_TYPES: { value: ActivityType; label: string }[] = [
  { value: 'team_building', label: '团队拓展' },
  { value: 'dinner', label: '聚餐' },
  { value: 'travel', label: '旅游' },
  { value: 'sports', label: '运动' },
  { value: 'other', label: '其他' },
]

export const ACTIVITY_TYPE_LABEL: Record<ActivityType, string> = {
  team_building: '团队拓展',
  dinner: '聚餐',
  travel: '旅游',
  sports: '运动',
  other: '其他',
}

export const TEAM_BUILDING_STATUSES: ActivityStatus[] = [
  'pending',
  'in_progress',
  'completed',
  'cancelled',
]

export const defaultActivities: TeamBuildingRecord[] = [
  {
    id: 'tb-001',
    name: 'Q3季度团建拓展',
    date: '2026-08-15',
    status: 'pending',
    participantCount: 45,
    budget: 30000,
    location: '北京怀柔拓展基地',
    type: 'team_building',
    description: '年度Q3季度全员拓展训练，包含高空项目和团队协作',
    createdAt: '2026-07-10',
    actualParticipants: 0,
  },
  {
    id: 'tb-002',
    name: '研发中心聚餐',
    date: '2026-07-25',
    status: 'in_progress',
    participantCount: 30,
    budget: 5000,
    location: '望京海底捞',
    type: 'dinner',
    description: '研发部门季度聚餐',
    createdAt: '2026-07-15',
    actualParticipants: 0,
  },
  {
    id: 'tb-003',
    name: '销售团队张家界团建',
    date: '2026-09-10',
    status: 'pending',
    participantCount: 20,
    budget: 80000,
    location: '张家界国家森林公园',
    type: 'travel',
    description: '销售精英团队三天两夜团建旅游',
    createdAt: '2026-07-18',
    actualParticipants: 0,
  },
  {
    id: 'tb-004',
    name: '羽毛球友谊赛',
    date: '2026-07-20',
    status: 'completed',
    participantCount: 16,
    budget: 2000,
    location: '朝阳体育馆',
    type: 'sports',
    description: '跨部门羽毛球友谊赛',
    createdAt: '2026-07-05',
    actualParticipants: 14,
  },
  {
    id: 'tb-005',
    name: '新员工破冰活动',
    date: '2026-08-01',
    status: 'pending',
    participantCount: 25,
    budget: 5000,
    location: '公司多功能厅',
    type: 'team_building',
    description: 'Q3新入职员工破冰团建',
    createdAt: '2026-07-20',
    actualParticipants: 0,
  },
  {
    id: 'tb-006',
    name: '年中全员大团建',
    date: '2026-06-30',
    status: 'completed',
    participantCount: 120,
    budget: 150000,
    location: '北京古北水镇',
    type: 'travel',
    description: '年中华北区全员大型团建活动',
    createdAt: '2026-06-01',
    actualParticipants: 108,
  },
  {
    id: 'tb-007',
    name: '产品部桌游之夜',
    date: '2026-07-28',
    status: 'in_progress',
    participantCount: 12,
    budget: 1500,
    location: '望京SOHO桌游吧',
    type: 'other',
    description: '产品团队桌游团建',
    createdAt: '2026-07-19',
    actualParticipants: 0,
  },
  {
    id: 'tb-008',
    name: 'Q2季度团建',
    date: '2026-05-20',
    status: 'completed',
    participantCount: 80,
    budget: 60000,
    location: '奥森公园',
    type: 'sports',
    description: 'Q2季度户外运动团建',
    createdAt: '2026-04-15',
    actualParticipants: 72,
  },
  {
    id: 'tb-009',
    name: '十公里徒步挑战',
    date: '2026-08-08',
    status: 'pending',
    participantCount: 35,
    budget: 8000,
    location: '香山公园',
    type: 'sports',
    description: '健康徒步团建活动',
    createdAt: '2026-07-22',
    actualParticipants: 0,
  },
  {
    id: 'tb-010',
    name: '中秋节茶话会',
    date: '2026-09-17',
    status: 'pending',
    participantCount: 50,
    budget: 10000,
    location: '公司大会议室',
    type: 'dinner',
    description: '中秋佳节员工茶话会暨团建活动',
    createdAt: '2026-07-20',
    actualParticipants: 0,
  },
  {
    id: 'tb-011',
    name: '骑行团建活动',
    date: '2026-07-10',
    status: 'cancelled',
    participantCount: 20,
    budget: 3000,
    location: '延庆百里画廊',
    type: 'sports',
    description: '因天气原因取消的骑行团建',
    createdAt: '2026-06-25',
    actualParticipants: 0,
  },
]

export const emptyActivityForm: NewActivityForm = {
  name: '',
  date: '',
  location: '',
  budget: '',
  participantCount: '',
  description: '',
  type: 'team_building',
}

export function formatCurrency(amount: number): string {
  if (amount >= 10_000) return `¥${(amount / 10_000).toFixed(1)}万`
  if (amount >= 1_000) return `¥${(amount / 1_000).toFixed(1)}K`
  return `¥${amount}`
}

export function computeTeamBuildingStats(activities: TeamBuildingRecord[]) {
  const total = activities.length
  const inProgress = activities.filter((activity) => activity.status === 'in_progress').length
  const completed = activities.filter((activity) => activity.status === 'completed').length
  const totalParticipants = activities.reduce(
    (sum, activity) => sum + Math.max(activity.actualParticipants ?? 0, 0),
    0,
  )
  return { total, inProgress, completed, totalParticipants }
}

export function filterActivities(
  activities: TeamBuildingRecord[],
  searchTerm: string,
  statusFilter: ActivityStatus | 'all',
) {
  const normalized = searchTerm.trim().toLowerCase()
  return activities.filter((activity) => {
    if (statusFilter !== 'all' && activity.status !== statusFilter) {
      return false
    }
    if (!normalized) {
      return true
    }
    return (
      activity.name.toLowerCase().includes(normalized) ||
      activity.location.toLowerCase().includes(normalized) ||
      activity.description.toLowerCase().includes(normalized)
    )
  })
}

export async function mockCreateTeamBuildingActivity(
  form: NewActivityForm,
  seed: number,
): Promise<TeamBuildingRecord> {
  return {
    id: `tb-${String(seed).padStart(3, '0')}`,
    name: form.name.trim(),
    date: form.date,
    status: 'pending',
    participantCount: Number(form.participantCount),
    budget: Number(form.budget),
    location: form.location.trim(),
    type: form.type,
    description: form.description.trim(),
    createdAt: new Date().toISOString().slice(0, 10),
    actualParticipants: 0,
  }
}

export async function loadTeamBuildingSnapshot(): Promise<TeamBuildingSnapshotDelivery> {
  return {
    deliveryMode: 'mock',
    activities: defaultActivities,
    generatedAt: new Date().toISOString(),
  }
}
