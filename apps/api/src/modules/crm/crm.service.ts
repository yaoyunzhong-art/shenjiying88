/**
 * crm.service.ts — CRM客户关系管理 Service
 */
import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common'
import { randomUUID as uuid } from 'crypto'

export type CrmCustomerStatus = 'active' | 'inactive' | 'churned' | 'lead'
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent'
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'

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
  createdAt: string
  updatedAt: string
  interactions: CrmInteraction[]
  tickets: Ticket[]
}

@Injectable()
export class CrmService {
  private readonly logger = new Logger(CrmService.name)
  private customers: Map<string, CustomerProfile> = new Map()

  constructor() {
    this.initializeDefaults()
  }

  private initializeDefaults(): void {
    const now = new Date().toISOString()
    const customer1 = this.makeCustomer(uuid(), '张三', 'zhang@example.com', '13800001111', 'active', 85, 5000000, 23, now)
    const customer2 = this.makeCustomer(uuid(), '李四', 'li@example.com', '13800002222', 'active', 62, 1200000, 8, now)
    const customer3 = this.makeCustomer(uuid(), '王五', 'wang@example.com', '13800003333', 'lead', 10, 0, 0, now)
    this.customers.set(customer1.id, customer1)
    this.customers.set(customer2.id, customer2)
    this.customers.set(customer3.id, customer3)
  }

  private makeCustomer(id: string, name: string, email: string, phone: string, status: CrmCustomerStatus, score: number, spent: number, visits: number, now: string): CustomerProfile {
    return {
      id, name, email, phone, status,
      engagementScore: score, totalSpentCents: spent,
      visitCount: visits, lastVisitAt: now,
      tags: [], createdAt: now, updatedAt: now,
      interactions: [],
      tickets: [],
    }
  }

  list(status?: CrmCustomerStatus, search?: string): CustomerProfile[] {
    let result = Array.from(this.customers.values())
    if (status) result = result.filter((c) => c.status === status)
    if (search) {
      const s = search.toLowerCase()
      result = result.filter((c) => c.name.toLowerCase().includes(s) || c.email.toLowerCase().includes(s))
    }
    return result
  }

  getById(id: string): CustomerProfile {
    const c = this.customers.get(id)
    if (!c) throw new NotFoundException(`客户 ${id} 不存在`)
    return c
  }

  updateEngagementScore(id: string, delta: number): CustomerProfile {
    const c = this.getById(id)
    c.engagementScore = Math.max(0, Math.min(100, c.engagementScore + delta))
    c.updatedAt = new Date().toISOString()
    this.logger.log(`EngagementScore updated: ${id} → ${c.engagementScore}`)
    return c
  }

  addInteraction(customerId: string, interaction: Omit<CrmInteraction, 'id' | 'customerId' | 'createdAt'>): CrmInteraction {
    const c = this.getById(customerId)
    const newInteraction: CrmInteraction = {
      id: uuid(), customerId, ...interaction,
      createdAt: new Date().toISOString(),
    }
    c.interactions.push(newInteraction)
    c.updatedAt = new Date().toISOString()
    return newInteraction
  }

  listInteractions(customerId: string): CrmInteraction[] {
    return this.getById(customerId).interactions
  }

  createTicket(customerId: string, data: { subject: string; description: string; priority: TicketPriority; assignedTo: string }): Ticket {
    const c = this.getById(customerId)
    if (!data.subject?.trim()) throw new ConflictException('工单主题不能为空')
    const ticket: Ticket = {
      id: uuid(), customerId, status: 'open',
      subject: data.subject.trim(), description: data.description ?? '',
      priority: data.priority, assignedTo: data.assignedTo ?? '',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    }
    c.tickets.push(ticket)
    c.updatedAt = new Date().toISOString()
    return ticket
  }

  listTickets(customerId: string): Ticket[] {
    return this.getById(customerId).tickets
  }

  updateTicketStatus(customerId: string, ticketId: string, status: TicketStatus): Ticket {
    const c = this.getById(customerId)
    const ticket = c.tickets.find((t) => t.id === ticketId)
    if (!ticket) throw new NotFoundException(`工单 ${ticketId} 不存在`)
    ticket.status = status
    ticket.updatedAt = new Date().toISOString()
    if (status === 'closed') ticket.closedAt = new Date().toISOString()
    return ticket
  }
}
