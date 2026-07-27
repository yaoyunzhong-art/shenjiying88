export type TicketStatus = 'open' | 'processing' | 'resolved' | 'closed'
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface ServiceTicket {
  id: string
  title: string
  type: string
  customer: string
  priority: TicketPriority
  status: TicketStatus
  assignee: string
  createdAt: string
  resolvedAt?: string
  slaHours: number
}

export interface ServiceSummary {
  total: number
  open: number
  processing: number
  resolved: number
  urgent: number
  avgSlaHours: number
}

export interface ServiceSnapshot {
  deliveryMode: 'mock'
  sourceLabel: 'store-service-mock'
  storeId: string
  tickets: ServiceTicket[]
  summary: ServiceSummary
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
  error?: string
}

export const SERVICE_TICKETS: ServiceTicket[] = [
  { id: 'TK-001', title: 'VR设备画面闪烁', type: '设备故障', customer: '张先生', priority: 'high', status: 'processing', assignee: '王师傅', createdAt: '2026-07-13 14:00', slaHours: 4 },
  { id: 'TK-002', title: '会员卡无法充值', type: '系统问题', customer: '李女士', priority: 'urgent', status: 'open', assignee: '李开发', createdAt: '2026-07-13 16:30', slaHours: 2 },
  { id: 'TK-003', title: '空调制冷不足', type: '环境', customer: '赵先生', priority: 'medium', status: 'processing', assignee: '物业', createdAt: '2026-07-13 10:00', slaHours: 8 },
  { id: 'TK-004', title: '游戏币兑换故障', type: '设备故障', customer: '王女士', priority: 'medium', status: 'resolved', assignee: '王师傅', createdAt: '2026-07-12 20:00', resolvedAt: '2026-07-13 09:00', slaHours: 8 },
  { id: 'TK-005', title: '预约系统显示异常', type: '系统问题', customer: '刘先生', priority: 'low', status: 'closed', assignee: '李开发', createdAt: '2026-07-11 15:00', resolvedAt: '2026-07-12 10:00', slaHours: 24 },
  { id: 'TK-006', title: '空调噪音过大', type: '环境', customer: '周先生', priority: 'high', status: 'open', assignee: '物业', createdAt: '2026-07-13 18:00', slaHours: 4 },
  { id: 'TK-007', title: '充值未到账投诉', type: '客诉', customer: '吴女士', priority: 'urgent', status: 'processing', assignee: '张店长', createdAt: '2026-07-13 17:00', slaHours: 2 },
  { id: 'TK-008', title: '台球桌台面磨损', type: '设备维护', customer: '内部', priority: 'low', status: 'open', assignee: '王师傅', createdAt: '2026-07-13 09:00', slaHours: 48 },
]

export function buildServiceSummary(tickets: ServiceTicket[]): ServiceSummary {
  return {
    total: tickets.length,
    open: tickets.filter((item) => item.status === 'open').length,
    processing: tickets.filter((item) => item.status === 'processing').length,
    resolved: tickets.filter((item) => item.status === 'resolved').length,
    urgent: tickets.filter((item) => item.priority === 'urgent').length,
    avgSlaHours: tickets.length
      ? Math.round(tickets.reduce((sum, item) => sum + item.slaHours, 0) / tickets.length)
      : 0,
  }
}

export async function loadServiceSnapshot(
  storeId: string
): Promise<ServiceSnapshot> {
  const tickets = SERVICE_TICKETS.map((item) => ({ ...item }))

  return {
    deliveryMode: 'mock',
    sourceLabel: 'store-service-mock',
    storeId,
    tickets,
    summary: buildServiceSummary(tickets),
    generatedAt: '2026-07-27T16:35:00.000Z',
    controlPlaneSource: 'loadServiceSnapshot -> SERVICE_TICKETS + buildServiceSummary',
    businessDataSource: 'local service ticket samples + derived SLA summary',
    refreshPath: `ServicePage -> loadServiceSnapshot(${storeId})`,
    note: '当前门店售后页消费本地 service snapshot loader，已显式暴露来源态、刷新路径与 mock 边界，不作为真实工单流转凭据。',
    error: '门店售后控制面尚未接入真实工单系统，当前展示 mock 快照。',
  }
}
