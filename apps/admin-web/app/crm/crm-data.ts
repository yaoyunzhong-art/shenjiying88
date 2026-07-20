/**
 * crm-data.ts — admin-web CRM客户管理 mock 数据
 *
 * 遵循 PRD v23.1 (v23-prd-crm-management.md) 数据模型:
 * - CustomerProfile (engagementScore 0-100, tags, notes, interactions, tickets)
 * - CrmInteraction
 * - Ticket
 *
 * 后端端点: GET /api/crm/customers, GET /api/crm/stats
 *           GET /api/crm/customers/:id, GET /api/crm/customers/:id/interactions
 *           GET /api/crm/customers/:id/tickets
 */

export type CrmCustomerStatus = 'active' | 'inactive' | 'churned' | 'lead'
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent'
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'
export type InteractionType = 'call' | 'email' | 'chat' | 'visit' | 'ticket' | 'other'

export type StatusBadgeVariant = 'success' | 'warning' | 'danger' | 'neutral' | 'info'

// ─── 数据模型 ───

export interface CrmNote {
  id: string
  customerId: string
  content: string
  createdBy: string
  createdAt: string
}

export interface CrmInteraction {
  id: string
  customerId: string
  type: InteractionType
  summary: string
  details: string
  createdAt: string
  createdBy: string
}

export interface Ticket {
  id: string
  customerId: string
  subject: string
  description: string
  priority: TicketPriority
  status: TicketStatus
  assignedTo: string
  createdAt: string
  updatedAt: string
  closedAt?: string
}

export interface CustomerProfile {
  id: string
  name: string
  email: string
  phone: string
  status: CrmCustomerStatus
  engagementScore: number
  totalSpentCents: number
  visitCount: number
  lastVisitAt: string
  tags: string[]
  notes: CrmNote[]
  createdAt: string
  updatedAt: string
  interactions: CrmInteraction[]
  tickets: Ticket[]
}

export interface CrmStats {
  totalCustomers: number
  activeCustomers: number
  inactiveCustomers: number
  churnedCustomers: number
  leadCustomers: number
  averageScore: number
  totalSpent: number
  openTickets: number
}

// ─── 状态映射 ───

export const CRM_STATUS_MAP: Record<CrmCustomerStatus, { label: string; variant: StatusBadgeVariant }> = {
  active: { label: '活跃', variant: 'success' },
  inactive: { label: '沉默', variant: 'warning' },
  churned: { label: '流失', variant: 'neutral' },
  lead: { label: '潜在', variant: 'info' },
}

export const CRM_STATUSES: CrmCustomerStatus[] = ['active', 'inactive', 'churned', 'lead']

export const INTERACTION_TYPE_MAP: Record<InteractionType, string> = {
  call: '电话沟通',
  email: '邮件往来',
  chat: '在线聊天',
  visit: '到店拜访',
  ticket: '工单关联',
  other: '其他',
}

export const TICKET_PRIORITY_MAP: Record<TicketPriority, { label: string; variant: StatusBadgeVariant }> = {
  low: { label: '低', variant: 'neutral' },
  medium: { label: '中', variant: 'warning' },
  high: { label: '高', variant: 'danger' },
  urgent: { label: '紧急', variant: 'danger' },
}

export const TICKET_STATUS_MAP: Record<TicketStatus, { label: string; variant: StatusBadgeVariant }> = {
  open: { label: '待处理', variant: 'danger' },
  in_progress: { label: '处理中', variant: 'warning' },
  resolved: { label: '已解决', variant: 'success' },
  closed: { label: '已关闭', variant: 'neutral' },
}

export const INTERACTION_TYPES: InteractionType[] = ['call', 'email', 'chat', 'visit', 'ticket', 'other']
export const TICKET_PRIORITIES: TicketPriority[] = ['low', 'medium', 'high', 'urgent']
export const TICKET_STATUSES: TicketStatus[] = ['open', 'in_progress', 'resolved', 'closed']

// ─── Mock 数据 ───

export const MOCK_CRM_CUSTOMERS: CustomerProfile[] = [
  {
    id: 'crm-001', name: '张明', email: 'zhangming@example.com', phone: '138****0001',
    status: 'active', engagementScore: 85, totalSpentCents: 1580000, visitCount: 42,
    lastVisitAt: '2026-07-18T14:30:00Z', tags: ['高消费', '常客'],
    notes: [
      { id: 'n-001', customerId: 'crm-001', content: '周末常带家人来，偏好娃娃机区域', createdBy: '前台-小王', createdAt: '2026-07-15T10:00:00Z' },
    ],
    createdAt: '2024-03-10T08:00:00Z', updatedAt: '2026-07-18T14:30:00Z',
    interactions: [
      { id: 'i-001', customerId: 'crm-001', type: 'visit', summary: '到店消费', details: '消费¥158，使用黄金会员折扣', createdAt: '2026-07-18T14:30:00Z', createdBy: '系统' },
      { id: 'i-002', customerId: 'crm-001', type: 'chat', summary: '会员日咨询', details: '询问会员日活动安排', createdAt: '2026-07-16T09:15:00Z', createdBy: '客服-小李' },
    ],
    tickets: [
      { id: 't-001', customerId: 'crm-001', subject: '娃娃机故障', description: '3号娃娃机爪子力度异常', priority: 'medium', status: 'resolved', assignedTo: '技术-小陈', createdAt: '2026-07-10T11:00:00Z', updatedAt: '2026-07-11T16:00:00Z', closedAt: '2026-07-11T16:00:00Z' },
    ],
  },
  {
    id: 'crm-002', name: '李芳', email: 'lifang@example.com', phone: '139****0002',
    status: 'active', engagementScore: 95, totalSpentCents: 5200000, visitCount: 89,
    lastVisitAt: '2026-07-19T19:00:00Z', tags: ['VIP', '高消费', '活跃'],
    notes: [
      { id: 'n-002', customerId: 'crm-002', content: '每月到店8次以上，企业团购客户', createdBy: '店长-老赵', createdAt: '2026-07-01T09:00:00Z' },
    ],
    createdAt: '2023-06-01T10:00:00Z', updatedAt: '2026-07-19T19:00:00Z',
    interactions: [
      { id: 'i-003', customerId: 'crm-002', type: 'visit', summary: '团建消费', details: '带团队10人到店，消费¥3200', createdAt: '2026-07-19T19:00:00Z', createdBy: '系统' },
      { id: 'i-004', customerId: 'crm-002', type: 'call', summary: '预约咨询', details: '预约下周团建，预计15人', createdAt: '2026-07-17T14:00:00Z', createdBy: '前台-小王' },
    ],
    tickets: [],
  },
  {
    id: 'crm-003', name: '王浩', email: 'wanghao@example.com', phone: '137****0003',
    status: 'active', engagementScore: 55, totalSpentCents: 380000, visitCount: 15,
    lastVisitAt: '2026-07-10T15:00:00Z', tags: ['新客'],
    notes: [],
    createdAt: '2025-02-14T09:00:00Z', updatedAt: '2026-07-10T15:00:00Z',
    interactions: [
      { id: 'i-005', customerId: 'crm-003', type: 'visit', summary: '首次充值', details: '新会员充值¥500', createdAt: '2026-07-10T15:00:00Z', createdBy: '系统' },
    ],
    tickets: [],
  },
  {
    id: 'crm-004', name: '陈雪', email: 'chenxue@example.com', phone: '158****0004',
    status: 'inactive', engagementScore: 20, totalSpentCents: 45000, visitCount: 3,
    lastVisitAt: '2026-05-01T11:00:00Z', tags: ['沉睡'],
    notes: [
      { id: 'n-003', customerId: 'crm-004', content: '近2月未到店，建议发送唤醒优惠券', createdBy: '营销-小刘', createdAt: '2026-06-15T10:00:00Z' },
    ],
    createdAt: '2026-01-20T08:00:00Z', updatedAt: '2026-05-01T11:00:00Z',
    interactions: [
      { id: 'i-006', customerId: 'crm-004', type: 'email', summary: '推送优惠信息', details: '发送满减优惠券', createdAt: '2026-06-16T10:00:00Z', createdBy: '系统' },
    ],
    tickets: [],
  },
  {
    id: 'crm-005', name: '赵刚', email: 'zhaogang@example.com', phone: '136****0005',
    status: 'churned', engagementScore: 10, totalSpentCents: 950000, visitCount: 28,
    lastVisitAt: '2026-04-15T16:00:00Z', tags: ['历史投诉'],
    notes: [
      { id: 'n-004', customerId: 'crm-005', content: '涉嫌违规操作，已冻结账户', createdBy: '安监-老张', createdAt: '2026-04-16T09:00:00Z' },
    ],
    createdAt: '2024-08-05T08:00:00Z', updatedAt: '2026-04-15T16:00:00Z',
    interactions: [
      { id: 'i-007', customerId: 'crm-005', type: 'ticket', summary: '投诉工单处理', details: '投诉退款问题', createdAt: '2026-04-10T14:00:00Z', createdBy: '客服-小李' },
    ],
    tickets: [
      { id: 't-002', customerId: 'crm-005', subject: '退款投诉', description: '客户要求退还余额¥500', priority: 'high', status: 'closed', assignedTo: '客服-小李', createdAt: '2026-04-10T14:00:00Z', updatedAt: '2026-04-15T16:00:00Z', closedAt: '2026-04-15T16:00:00Z' },
    ],
  },
  {
    id: 'crm-006', name: '刘洋', email: 'liuyang@example.com', phone: '150****0006',
    status: 'active', engagementScore: 35, totalSpentCents: 120000, visitCount: 8,
    lastVisitAt: '2026-07-16T13:00:00Z', tags: ['新客'],
    notes: [],
    createdAt: '2025-11-03T08:00:00Z', updatedAt: '2026-07-16T13:00:00Z',
    interactions: [
      { id: 'i-008', customerId: 'crm-006', type: 'chat', summary: '咨询会员升级', details: '询问如何升级到白银会员', createdAt: '2026-07-14T11:00:00Z', createdBy: '客服-小李' },
    ],
    tickets: [],
  },
  {
    id: 'crm-007', name: '周婷', email: 'zhouting@example.com', phone: '159****0007',
    status: 'inactive', engagementScore: 15, totalSpentCents: 310000, visitCount: 12,
    lastVisitAt: '2026-03-20T10:00:00Z', tags: ['沉睡'],
    notes: [
      { id: 'n-005', customerId: 'crm-007', content: '超90天未到店', createdBy: '系统', createdAt: '2026-06-21T00:00:00Z' },
    ],
    createdAt: '2024-12-01T08:00:00Z', updatedAt: '2026-03-20T10:00:00Z',
    interactions: [
      { id: 'i-009', customerId: 'crm-007', type: 'call', summary: '回访电话', details: '客户表示近期工作忙，有空会来', createdAt: '2026-06-10T15:00:00Z', createdBy: '营销-小刘' },
    ],
    tickets: [],
  },
  {
    id: 'crm-008', name: '孙磊', email: 'sunlei@example.com', phone: '188****0008',
    status: 'active', engagementScore: 92, totalSpentCents: 4200000, visitCount: 65,
    lastVisitAt: '2026-07-19T20:00:00Z', tags: ['VIP', '高消费', '活跃'],
    notes: [
      { id: 'n-006', customerId: 'crm-008', content: '企业团购客户，负责公司团建活动采购', createdBy: '店长-老赵', createdAt: '2026-07-01T09:00:00Z' },
    ],
    createdAt: '2023-10-15T08:00:00Z', updatedAt: '2026-07-19T20:00:00Z',
    interactions: [
      { id: 'i-010', customerId: 'crm-008', type: 'visit', summary: '团建活动', details: '30人团建，消费¥4500', createdAt: '2026-07-19T20:00:00Z', createdBy: '系统' },
      { id: 'i-011', customerId: 'crm-008', type: 'email', summary: '团建方案确认', details: '发送团建方案并获得确认', createdAt: '2026-07-15T09:00:00Z', createdBy: '营销-小刘' },
    ],
    tickets: [],
  },
  {
    id: 'crm-009', name: '吴娟', email: 'wujuan@example.com', phone: '186****0009',
    status: 'lead', engagementScore: 25, totalSpentCents: 0, visitCount: 0,
    lastVisitAt: '', tags: ['潜在客户'],
    notes: [
      { id: 'n-007', customerId: 'crm-009', content: '通过朋友推荐关注，尚未到店', createdBy: '前台-小王', createdAt: '2026-07-10T14:00:00Z' },
    ],
    createdAt: '2026-07-10T14:00:00Z', updatedAt: '2026-07-10T14:00:00Z',
    interactions: [
      { id: 'i-012', customerId: 'crm-009', type: 'other', summary: '线上咨询', details: '通过公众号咨询门店位置和营业时间', createdAt: '2026-07-10T14:00:00Z', createdBy: '系统' },
    ],
    tickets: [],
  },
  {
    id: 'crm-010', name: '郑强', email: 'zhengqiang@example.com', phone: '182****0010',
    status: 'active', engagementScore: 78, totalSpentCents: 1280000, visitCount: 35,
    lastVisitAt: '2026-07-17T16:30:00Z', tags: ['高消费', '常客'],
    notes: [
      { id: 'n-008', customerId: 'crm-010', content: '娃娃机爱好者，每周至少到店2次', createdBy: '前台-小王', createdAt: '2026-07-10T10:00:00Z' },
    ],
    createdAt: '2024-05-20T08:00:00Z', updatedAt: '2026-07-17T16:30:00Z',
    interactions: [
      { id: 'i-013', customerId: 'crm-010', type: 'visit', summary: '到店娱乐', details: '充值¥200', createdAt: '2026-07-17T16:30:00Z', createdBy: '系统' },
    ],
    tickets: [
      { id: 't-003', customerId: 'crm-010', subject: '积分兑换咨询', description: '询问积分兑换礼品规则', priority: 'low', status: 'resolved', assignedTo: '客服-小李', createdAt: '2026-07-14T10:00:00Z', updatedAt: '2026-07-14T15:00:00Z', closedAt: '2026-07-14T15:00:00Z' },
    ],
  },
  {
    id: 'crm-011', name: '黄丽', email: 'huangli@example.com', phone: '135****0011',
    status: 'active', engagementScore: 45, totalSpentCents: 560000, visitCount: 22,
    lastVisitAt: '2026-07-14T18:00:00Z', tags: ['活跃'],
    notes: [],
    createdAt: '2024-09-10T08:00:00Z', updatedAt: '2026-07-14T18:00:00Z',
    interactions: [
      { id: 'i-014', customerId: 'crm-011', type: 'visit', summary: '到店消费', details: '消费¥89', createdAt: '2026-07-14T18:00:00Z', createdBy: '系统' },
    ],
    tickets: [],
  },
  {
    id: 'crm-012', name: '何文', email: 'hewen@example.com', phone: '131****0012',
    status: 'churned', engagementScore: 5, totalSpentCents: 68000, visitCount: 5,
    lastVisitAt: '2025-10-05T12:00:00Z', tags: ['已流失'],
    notes: [
      { id: 'n-009', customerId: 'crm-012', content: '已流失，超过6个月未到店', createdBy: '系统', createdAt: '2026-04-06T00:00:00Z' },
    ],
    createdAt: '2025-05-15T08:00:00Z', updatedAt: '2025-10-05T12:00:00Z',
    interactions: [],
    tickets: [],
  },
]

export const MOCK_CRM_STATS: CrmStats = (() => {
  const total = MOCK_CRM_CUSTOMERS.length
  const active = MOCK_CRM_CUSTOMERS.filter((c) => c.status === 'active').length
  const inactive_customers = MOCK_CRM_CUSTOMERS.filter((c) => c.status === 'inactive').length
  const churned = MOCK_CRM_CUSTOMERS.filter((c) => c.status === 'churned').length
  const lead = MOCK_CRM_CUSTOMERS.filter((c) => c.status === 'lead').length
  const avgScore = Math.round(MOCK_CRM_CUSTOMERS.reduce((s, c) => s + c.engagementScore, 0) / total)
  const totalSpent = MOCK_CRM_CUSTOMERS.reduce((s, c) => s + c.totalSpentCents, 0)
  const openTickets = MOCK_CRM_CUSTOMERS.reduce((s, c) => s + c.tickets.filter((t) => t.status === 'open' || t.status === 'in_progress').length, 0)

  return {
    totalCustomers: total,
    activeCustomers: active,
    inactiveCustomers: inactive_customers,
    churnedCustomers: churned,
    leadCustomers: lead,
    averageScore: avgScore,
    totalSpent,
    openTickets,
  }
})()

// ─── 格式化辅助 ───

export function formatCents(n: number): string {
  const yuan = n / 100
  if (yuan >= 1_000_000) return `¥${(yuan / 10_000).toFixed(1)}万`
  if (yuan >= 1_000) return `¥${(yuan / 1000).toFixed(1)}K`
  return `¥${yuan}`
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '-'
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
  } catch {
    return dateStr
  }
}

export function formatDateTime(dateStr: string): string {
  if (!dateStr) return '-'
  try {
    const d = new Date(dateStr)
    return d.toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
  } catch {
    return dateStr
  }
}

export function getScoreLevel(score: number): { label: string; color: string } {
  if (score >= 80) return { label: '高价值', color: '#22c55e' }
  if (score >= 50) return { label: '中等', color: '#eab308' }
  if (score >= 20) return { label: '低活跃', color: '#f97316' }
  return { label: '沉睡', color: '#ef4444' }
}
