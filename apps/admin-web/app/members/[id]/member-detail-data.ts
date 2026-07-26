export type MemberStatus = 'active' | 'inactive' | 'frozen' | 'expired'
export type Gender = 'male' | 'female' | 'other'
export type MemberTier = 'normal' | 'silver' | 'gold' | 'diamond' | 'platinum'

export interface MemberDetail {
  id: string
  name: string
  phone: string
  gender: Gender
  birthday: string
  email: string
  wechat: string
  memberNo: string
  tier: MemberTier
  status: MemberStatus
  joinDate: string
  lastActive: string
  totalPoints: number
  availablePoints: number
  totalRecharge: number
  balance: number
  totalSpent: number
  visitCount: number
  avgSpend: number
  referrer: string
  tags: string[]
  notes: string
}

export interface PointRecord {
  id: string
  date: string
  type: 'earn' | 'redeem' | 'expire' | 'adjust'
  amount: number
  balance: number
  source: string
  orderNo: string
}

export interface RechargeRecord {
  id: string
  date: string
  amount: number
  giftAmount: number
  paymentMethod: string
  paymentNo: string
  operator: string
  status: 'completed' | 'pending' | 'refunded'
}

export interface VisitRecord {
  date: string
  duration: string
  spend: number
  devices: string
  staff: string
}

export interface MemberDetailPageSnapshot {
  deliveryMode: 'fallback'
  sourceLabel: 'member-detail-fallback-snapshot'
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
  memberId: string
  member: MemberDetail
  points: PointRecord[]
  recharges: RechargeRecord[]
  visits: VisitRecord[]
}

export const STATUS_MAP: Record<
  MemberStatus,
  { label: string; variant: 'success' | 'neutral' | 'warning' | 'danger' }
> = {
  active: { label: '活跃', variant: 'success' },
  inactive: { label: '沉默', variant: 'neutral' },
  frozen: { label: '冻结', variant: 'danger' },
  expired: { label: '已过期', variant: 'warning' },
}

export const TIER_LABELS: Record<MemberTier, string> = {
  normal: '普通会员',
  silver: '银卡',
  gold: '金卡',
  diamond: '钻石',
  platinum: '至尊',
}

export const TIER_COLORS: Record<MemberTier, string> = {
  normal: '#6b7280',
  silver: '#94a3b8',
  gold: '#eab308',
  diamond: '#3b82f6',
  platinum: '#8b5cf6',
}

export function formatMemberCurrency(amount: number): string {
  return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`
}

export function buildMockMember(id: string): MemberDetail {
  return {
    id,
    name: '张明',
    phone: '13812345678',
    gender: 'male',
    birthday: '1995-06-15',
    email: 'zhangming@example.com',
    wechat: 'zm_wechat',
    memberNo: `M5-${id}`,
    tier: 'diamond',
    status: 'active',
    joinDate: '2024-03-10',
    lastActive: '2026-07-11',
    totalPoints: 24850,
    availablePoints: 12350,
    totalRecharge: 18600,
    balance: 3520,
    totalSpent: 15820,
    visitCount: 86,
    avgSpend: 184,
    referrer: '李娜',
    tags: ['高消费', '周末活跃', '生日会员'],
    notes: '喜欢夹娃娃机和赛车',
  }
}

export function buildPointRecords(): PointRecord[] {
  return [
    {
      id: 'PT-1',
      date: '2026-07-10',
      type: 'earn',
      amount: 320,
      balance: 12350,
      source: '消费',
      orderNo: 'ORD-20260710',
    },
    {
      id: 'PT-2',
      date: '2026-07-07',
      type: 'redeem',
      amount: -180,
      balance: 12030,
      source: '积分兑换',
      orderNo: 'ORD-20260707',
    },
    {
      id: 'PT-3',
      date: '2026-07-03',
      type: 'earn',
      amount: 560,
      balance: 12210,
      source: '消费',
      orderNo: 'ORD-20260703',
    },
    {
      id: 'PT-4',
      date: '2026-06-28',
      type: 'adjust',
      amount: 100,
      balance: 11650,
      source: '客服补偿',
      orderNo: '',
    },
    {
      id: 'PT-5',
      date: '2026-06-20',
      type: 'expire',
      amount: -240,
      balance: 11550,
      source: '积分过期',
      orderNo: '',
    },
  ]
}

export function buildRechargeRecords(): RechargeRecord[] {
  return [
    {
      id: 'RCH-1',
      date: '2026-07-08',
      amount: 1000,
      giftAmount: 100,
      paymentMethod: '微信支付',
      paymentNo: 'PAY100001',
      operator: '张三',
      status: 'completed',
    },
    {
      id: 'RCH-2',
      date: '2026-06-25',
      amount: 2000,
      giftAmount: 200,
      paymentMethod: '支付宝',
      paymentNo: 'PAY100002',
      operator: '张三',
      status: 'completed',
    },
    {
      id: 'RCH-3',
      date: '2026-06-12',
      amount: 500,
      giftAmount: 0,
      paymentMethod: '银行卡',
      paymentNo: 'PAY100003',
      operator: '李四',
      status: 'pending',
    },
  ]
}

export function buildVisitRecords(): VisitRecord[] {
  return [
    {
      date: '2026-07-11',
      duration: '90min',
      spend: 268,
      devices: '娃娃机',
      staff: '收银员A',
    },
    {
      date: '2026-07-06',
      duration: '75min',
      spend: 198,
      devices: '赛车',
      staff: '收银员B',
    },
    {
      date: '2026-06-29',
      duration: '60min',
      spend: 158,
      devices: '篮球机',
      staff: '收银员A',
    },
    {
      date: '2026-06-18',
      duration: '120min',
      spend: 320,
      devices: '跳舞机',
      staff: '收银员C',
    },
  ]
}

export async function loadMemberDetailPageSnapshot(
  memberId: string
): Promise<MemberDetailPageSnapshot> {
  return {
    deliveryMode: 'fallback',
    sourceLabel: 'member-detail-fallback-snapshot',
    generatedAt: '2026-07-27T15:20:00Z',
    controlPlaneSource:
      'loadMemberDetailPageSnapshot -> buildMockMember / buildPointRecords / buildRechargeRecords / buildVisitRecords',
    businessDataSource: 'local member detail samples',
    refreshPath: `MemberDetailPage -> loadMemberDetailPageSnapshot(${memberId})`,
    note: '当前会员详情页使用本地样本快照，已显式暴露来源态与刷新路径，不可作为实时复签证据。',
    memberId,
    member: buildMockMember(memberId),
    points: buildPointRecords(),
    recharges: buildRechargeRecords(),
    visits: buildVisitRecords(),
  }
}
