/**
 * customers-data.ts — admin-web 客户管理 mock 数据
 *
 * 门店视角客户管理：会员/散客区分、消费行为、画像标签
 */

export type CustomerStatus = 'active' | 'inactive' | 'blocked' | 'churned'
export type CustomerSource = 'walkin' | 'referral' | 'social' | 'online' | 'partner'
export type CustomerGender = 'male' | 'female' | 'unknown'
export type MemberLevel = 'none' | 'bronze' | 'silver' | 'gold' | 'diamond'

export interface CustomerRecord {
  id: string
  name: string
  phone: string
  gender: CustomerGender
  memberLevel: MemberLevel
  status: CustomerStatus
  source: CustomerSource
  totalVisits: number
  totalSpent: number
  lastVisit: string
  registeredAt: string
  birthDate: string
  age: number
  city: string
  tags: string[]
  remark: string
}

export type StatusBadgeVariant = 'success' | 'warning' | 'danger' | 'neutral'
export type MemberLevelBadgeVariant = 'neutral' | 'default' | 'success' | 'info'

export const CUSTOMER_STATUS_MAP: Record<CustomerStatus, { label: string; variant: StatusBadgeVariant }> = {
  active: { label: '活跃', variant: 'success' },
  inactive: { label: '沉默', variant: 'warning' },
  blocked: { label: '冻结', variant: 'danger' },
  churned: { label: '流失', variant: 'neutral' },
}

export const CUSTOMER_SOURCE_MAP: Record<CustomerSource, string> = {
  walkin: '自然到店',
  referral: '朋友推荐',
  social: '社交平台',
  online: '线上渠道',
  partner: '异业合作',
}

export const MEMBER_LEVEL_MAP: Record<MemberLevel, { label: string; variant: MemberLevelBadgeVariant }> = {
  none: { label: '非会员', variant: 'neutral' },
  bronze: { label: '青铜会员', variant: 'default' },
  silver: { label: '白银会员', variant: 'neutral' },
  gold: { label: '黄金会员', variant: 'success' },
  diamond: { label: '钻石会员', variant: 'info' },
}

export const GENDER_LABEL: Record<CustomerGender, string> = {
  male: '男',
  female: '女',
  unknown: '未知',
}

export const CUSTOMER_STATUSES: CustomerStatus[] = ['active', 'inactive', 'blocked', 'churned']
export const CUSTOMER_SOURCES: CustomerSource[] = ['walkin', 'referral', 'social', 'online', 'partner']
export const MEMBER_LEVELS: MemberLevel[] = ['none', 'bronze', 'silver', 'gold', 'diamond']

export const MOCK_CUSTOMERS: CustomerRecord[] = [
  {
    id: 'c-001', name: '张明', phone: '138****0001', gender: 'male',
    memberLevel: 'gold', status: 'active', source: 'walkin',
    totalVisits: 42, totalSpent: 15800, lastVisit: '2026-07-18',
    registeredAt: '2024-03-10', birthDate: '1990-05-15', age: 36,
    city: '广州', tags: ['高消费', '常客'], remark: '周末常带家人来',
  },
  {
    id: 'c-002', name: '李芳', phone: '139****0002', gender: 'female',
    memberLevel: 'diamond', status: 'active', source: 'referral',
    totalVisits: 89, totalSpent: 52000, lastVisit: '2026-07-19',
    registeredAt: '2023-06-01', birthDate: '1988-11-22', age: 37,
    city: '深圳', tags: ['VIP', '高消费', '活跃'], remark: '每月到店8次以上',
  },
  {
    id: 'c-003', name: '王浩', phone: '137****0003', gender: 'male',
    memberLevel: 'silver', status: 'active', source: 'social',
    totalVisits: 15, totalSpent: 3800, lastVisit: '2026-07-10',
    registeredAt: '2025-02-14', birthDate: '1995-08-03', age: 30,
    city: '东莞', tags: ['新客'], remark: '',
  },
  {
    id: 'c-004', name: '陈雪', phone: '158****0004', gender: 'female',
    memberLevel: 'none', status: 'inactive', source: 'walkin',
    totalVisits: 3, totalSpent: 450, lastVisit: '2026-05-01',
    registeredAt: '2026-01-20', birthDate: '2000-02-28', age: 26,
    city: '广州', tags: [], remark: '近2月未到店',
  },
  {
    id: 'c-005', name: '赵刚', phone: '136****0005', gender: 'male',
    memberLevel: 'gold', status: 'blocked', source: 'online',
    totalVisits: 28, totalSpent: 9500, lastVisit: '2026-04-15',
    registeredAt: '2024-08-05', birthDate: '1992-12-10', age: 33,
    city: '佛山', tags: ['高消费'], remark: '涉嫌违规操作',
  },
  {
    id: 'c-006', name: '刘洋', phone: '150****0006', gender: 'female',
    memberLevel: 'bronze', status: 'active', source: 'referral',
    totalVisits: 8, totalSpent: 1200, lastVisit: '2026-07-16',
    registeredAt: '2025-11-03', birthDate: '1998-07-25', age: 27,
    city: '深圳', tags: ['新客'], remark: '',
  },
  {
    id: 'c-007', name: '周婷', phone: '159****0007', gender: 'female',
    memberLevel: 'silver', status: 'inactive', source: 'partner',
    totalVisits: 12, totalSpent: 3100, lastVisit: '2026-03-20',
    registeredAt: '2024-12-01', birthDate: '1993-09-14', age: 32,
    city: '广州', tags: ['沉睡'], remark: '超90天未到店',
  },
  {
    id: 'c-008', name: '孙磊', phone: '188****0008', gender: 'male',
    memberLevel: 'diamond', status: 'active', source: 'social',
    totalVisits: 65, totalSpent: 42000, lastVisit: '2026-07-19',
    registeredAt: '2023-10-15', birthDate: '1985-04-08', age: 41,
    city: '珠海', tags: ['VIP', '高消费', '活跃'], remark: '企业团购客户',
  },
  {
    id: 'c-009', name: '吴娟', phone: '186****0009', gender: 'female',
    memberLevel: 'none', status: 'churned', source: 'walkin',
    totalVisits: 2, totalSpent: 180, lastVisit: '2025-12-10',
    registeredAt: '2025-10-01', birthDate: '2001-06-30', age: 25,
    city: '惠州', tags: [], remark: '超过6个月未到店',
  },
  {
    id: 'c-010', name: '郑强', phone: '182****0010', gender: 'male',
    memberLevel: 'gold', status: 'active', source: 'online',
    totalVisits: 35, totalSpent: 12800, lastVisit: '2026-07-17',
    registeredAt: '2024-05-20', birthDate: '1991-01-18', age: 35,
    city: '广州', tags: ['高消费', '常客'], remark: '娃娃机爱好者',
  },
  {
    id: 'c-011', name: '黄丽', phone: '135****0011', gender: 'female',
    memberLevel: 'silver', status: 'active', source: 'referral',
    totalVisits: 22, totalSpent: 5600, lastVisit: '2026-07-14',
    registeredAt: '2024-09-10', birthDate: '1996-03-21', age: 30,
    city: '深圳', tags: ['活跃'], remark: '',
  },
  {
    id: 'c-012', name: '何文', phone: '131****0012', gender: 'male',
    memberLevel: 'bronze', status: 'churned', source: 'walkin',
    totalVisits: 5, totalSpent: 680, lastVisit: '2025-10-05',
    registeredAt: '2025-05-15', birthDate: '1994-10-12', age: 31,
    city: '佛山', tags: [], remark: '已流失',
  },
]
