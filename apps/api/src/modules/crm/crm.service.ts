/**
 * crm.service.ts — CRM客户关系管理 Service
 *
 * 功能:
 *   - 客户 CRUD (列表/详情/创建/更新)
 *   - 客户评分管理
 *   - 客户标记（标签/状态标记）
 *   - 交互记录
 *   - 客户备注
 *   - 工单管理
 */
import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common'
import { randomUUID as uuid } from 'crypto'

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

export interface CreateCustomerDto {
  name: string
  email: string
  phone: string
  status?: CrmCustomerStatus
}

export interface UpdateCustomerDto {
  name?: string
  email?: string
  phone?: string
  status?: CrmCustomerStatus
  totalSpentCents?: number
  visitCount?: number
  lastVisitAt?: string
  tags?: string[]
}

@Injectable()
export class CrmService {
  private readonly logger = new Logger(CrmService.name)
  private customers: Map<string, CustomerProfile> = new Map()
  private nextNum = 1

  constructor() {
    this.initializeDefaults()
  }

  private initializeDefaults(): void {
    const now = new Date().toISOString()
    const c1Id = this.makeId()
    const c2Id = this.makeId()
    const c3Id = this.makeId()
    const customer1 = this.makeCustomer(c1Id, '张三', 'zhang@example.com', '13800001111', 'active', 85, 5000000, 23, now, ['vip'])
    const customer2 = this.makeCustomer(c2Id, '李四', 'li@example.com', '13800002222', 'active', 62, 1200000, 8, now, ['regular'])
    const customer3 = this.makeCustomer(c3Id, '王五', 'wang@example.com', '13800003333', 'lead', 10, 0, 0, now, ['new'])
    this.customers.set(customer1.id, customer1)
    this.customers.set(customer2.id, customer2)
    this.customers.set(customer3.id, customer3)
  }

  private makeId(): string {
    return `crm-${String(this.nextNum++).padStart(4, '0')}`
  }

  private makeCustomer(
    id: string, name: string, email: string, phone: string,
    status: CrmCustomerStatus, score: number, spent: number,
    visits: number, now: string, tags: string[] = [],
  ): CustomerProfile {
    return {
      id, name, email, phone, status,
      engagementScore: score, totalSpentCents: spent,
      visitCount: visits, lastVisitAt: now,
      tags, notes: [], createdAt: now, updatedAt: now,
      interactions: [],
      tickets: [],
    }
  }

  // ────────── 客户 CRUD ──────────

  list(status?: CrmCustomerStatus, search?: string): CustomerProfile[] {
    let result = Array.from(this.customers.values())
    if (status) result = result.filter((c) => c.status === status)
    if (search) {
      const s = search.toLowerCase()
      result = result.filter(
        (c) => c.name.toLowerCase().includes(s) || c.email.toLowerCase().includes(s),
      )
    }
    return result
  }

  getById(id: string): CustomerProfile {
    const c = this.customers.get(id)
    if (!c) throw new NotFoundException(`客户 ${id} 不存在`)
    return c
  }

  /** 创建新客户 */
  create(data: CreateCustomerDto): CustomerProfile {
    if (!data.name?.trim()) throw new ConflictException('客户名称不能为空')
    if (!data.email?.trim()) throw new ConflictException('客户邮箱不能为空')

    const now = new Date().toISOString()
    const id = this.makeId()
    const customer = this.makeCustomer(
      id, data.name.trim(), data.email.trim(), data.phone?.trim() ?? '',
      data.status ?? 'lead', 0, 0, 0, now,
    )
    this.customers.set(customer.id, customer)
    this.logger.log(`客户创建: ${customer.id} — ${customer.name}`)
    return customer
  }

  /** 更新客户信息 */
  update(id: string, data: UpdateCustomerDto): CustomerProfile {
    const c = this.getById(id)
    if (data.name !== undefined) c.name = data.name.trim()
    if (data.email !== undefined) c.email = data.email.trim()
    if (data.phone !== undefined) c.phone = data.phone.trim()
    if (data.status !== undefined) c.status = data.status
    if (data.totalSpentCents !== undefined) c.totalSpentCents = data.totalSpentCents
    if (data.visitCount !== undefined) c.visitCount = data.visitCount
    if (data.lastVisitAt !== undefined) c.lastVisitAt = data.lastVisitAt
    if (data.tags !== undefined) c.tags = [...data.tags]
    c.updatedAt = new Date().toISOString()
    this.logger.log(`客户更新: ${c.id}`)
    return c
  }

  /** 删除客户 */
  delete(id: string): void {
    const c = this.getById(id)
    this.customers.delete(id)
    this.logger.log(`客户删除: ${c.id} — ${c.name}`)
  }

  // ────────── 评分管理 ──────────

  updateEngagementScore(id: string, delta: number): CustomerProfile {
    const c = this.getById(id)
    c.engagementScore = Math.max(0, Math.min(100, c.engagementScore + delta))
    c.updatedAt = new Date().toISOString()
    this.logger.log(`评分更新: ${id} → ${c.engagementScore}`)
    return c
  }

  /** 直接设置评分（不 delta） */
  setEngagementScore(id: string, score: number): CustomerProfile {
    const c = this.getById(id)
    c.engagementScore = Math.max(0, Math.min(100, score))
    c.updatedAt = new Date().toISOString()
    return c
  }

  // ────────── 标签管理 ──────────

  /** 添加标签 */
  addTag(id: string, tag: string): CustomerProfile {
    const c = this.getById(id)
    if (!tag?.trim()) throw new ConflictException('标签内容不能为空')
    if (!c.tags.includes(tag.trim())) {
      c.tags.push(tag.trim())
      c.updatedAt = new Date().toISOString()
    }
    return c
  }

  /** 移除标签 */
  removeTag(id: string, tag: string): CustomerProfile {
    const c = this.getById(id)
    c.tags = c.tags.filter((t) => t !== tag)
    c.updatedAt = new Date().toISOString()
    return c
  }

  // ────────── 客户标记 ──────────

  /** 标记客户状态（含说明） */
  markCustomer(id: string, status: CrmCustomerStatus): CustomerProfile {
    const c = this.getById(id)
    c.status = status
    if (status === 'churned') c.engagementScore = Math.min(c.engagementScore, 20)
    c.updatedAt = new Date().toISOString()
    this.logger.log(`客户标记: ${id} → ${status}`)
    return c
  }

  // ────────── 备注 ──────────

  /** 添加客户备注 */
  addNote(customerId: string, content: string, createdBy: string): CrmNote {
    if (!content?.trim()) throw new ConflictException('备注内容不能为空')
    const c = this.getById(customerId)
    const note: CrmNote = {
      id: uuid(), customerId,
      content: content.trim(), createdBy,
      createdAt: new Date().toISOString(),
    }
    c.notes.push(note)
    c.updatedAt = new Date().toISOString()
    return note
  }

  /** 获取客户备注列表 */
  listNotes(customerId: string): CrmNote[] {
    return this.getById(customerId).notes
  }

  // ────────── 交互记录 ──────────

  addInteraction(
    customerId: string,
    interaction: Omit<CrmInteraction, 'id' | 'customerId' | 'createdAt'>,
  ): CrmInteraction {
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

  // ────────── 工单管理 ──────────

  createTicket(
    customerId: string,
    data: { subject: string; description: string; priority: TicketPriority; assignedTo: string },
  ): Ticket {
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

  /** 获取客户统计 */
  getStats() {
    const all = Array.from(this.customers.values())
    return {
      total: all.length,
      byStatus: {
        active: all.filter((c) => c.status === 'active').length,
        inactive: all.filter((c) => c.status === 'inactive').length,
        churned: all.filter((c) => c.status === 'churned').length,
        lead: all.filter((c) => c.status === 'lead').length,
      },
      avgScore: all.length > 0
        ? Math.round(all.reduce((s, c) => s + c.engagementScore, 0) / all.length)
        : 0,
      totalSpentCents: all.reduce((s, c) => s + c.totalSpentCents, 0),
      totalTickets: all.reduce((s, c) => s + c.tickets.length, 0),
    }
  }
}
