/**
 * crm.entity.ts — CRM 客户关系管理 Entity 定义
 *
 * 定义客户、交互记录、工单的数据模型。
 */

export type CrmCustomerStatus = 'active' | 'inactive' | 'churned' | 'lead'
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent'
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'

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
  type: 'call' | 'email' | 'chat' | 'visit' | 'ticket' | 'other'
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
