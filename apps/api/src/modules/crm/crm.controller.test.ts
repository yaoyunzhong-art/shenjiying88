/**
 * crm.controller.test.ts — CRM Controller 测试
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { CrmController } from './crm.controller'
import { CrmService } from './crm.service'

describe('CrmController', () => {
  let controller: CrmController
  let service: CrmService
  let customerId: string

  beforeEach(() => {
    service = new CrmService()
    controller = new CrmController(service)
    customerId = service.list()[0].id
  })

  // ── List Customers ──

  it('should list all customers', () => {
    const res = controller.listCustomers({})
    expect(res.success).toBe(true)
    expect(res.data.total).toBeGreaterThanOrEqual(3)
  })

  it('should filter customers by status', () => {
    const res = controller.listCustomers({ status: 'active' })
    expect(res.success).toBe(true)
    expect(res.data.customers.every((c: { status: string }) => c.status === 'active')).toBe(true)
  })

  it('should filter customers by lead status', () => {
    const res = controller.listCustomers({ status: 'lead' })
    expect(res.success).toBe(true)
    expect(res.data.customers.every((c: { status: string }) => c.status === 'lead')).toBe(true)
  })

  it('should search customers by name', () => {
    const res = controller.listCustomers({ search: '张三' })
    expect(res.success).toBe(true)
    expect(res.data.customers.length).toBeGreaterThanOrEqual(1)
  })

  it('should return empty for unmatched search', () => {
    const res = controller.listCustomers({ search: '不存在的客户' })
    expect(res.success).toBe(true)
    expect(res.data.customers).toHaveLength(0)
  })

  // ── Get Customer ──

  it('should get customer by id', () => {
    const res = controller.getCustomer(customerId)
    expect(res.success).toBe(true)
    expect(res.data.id).toBe(customerId)
  })

  it('should throw for nonexistent customer', () => {
    expect(() => controller.getCustomer('nonexistent')).toThrow()
  })

  // ── Update Score ──

  it('should update engagement score', () => {
    const res = controller.updateScore(customerId, { delta: 10 })
    expect(res.success).toBe(true)
    expect(res.data.engagementScore).toBeGreaterThanOrEqual(85)
  })

  it('should decrease engagement score', () => {
    const before = service.getById(customerId).engagementScore
    const res = controller.updateScore(customerId, { delta: -20 })
    expect(res.success).toBe(true)
    expect(res.data.engagementScore).toBe(before - 20)
  })

  // ── Interactions ──

  it('should add interaction', () => {
    const res = controller.addInteraction(customerId, {
      type: 'call',
      summary: '咨询套餐',
      details: '客户询问会员套餐详情',
      createdBy: 'admin',
    })
    expect(res.success).toBe(true)
    expect(res.data.summary).toBe('咨询套餐')
    expect(res.data.type).toBe('call')
  })

  it('should list interactions', () => {
    controller.addInteraction(customerId, {
      type: 'email', summary: '邮件沟通', details: '发送报价单', createdBy: 'admin',
    })
    const res = controller.listInteractions(customerId)
    expect(res.success).toBe(true)
    expect(res.data.total).toBe(1)
  })

  it('should return empty interactions for new customer', () => {
    const res = controller.listInteractions(customerId)
    expect(res.success).toBe(true)
    expect(res.data.interactions).toHaveLength(0)
  })

  it('should add multiple interactions', () => {
    controller.addInteraction(customerId, { type: 'chat', summary: '在线沟通', details: '', createdBy: 'u1' })
    controller.addInteraction(customerId, { type: 'visit', summary: '上门拜访', details: '', createdBy: 'u2' })
    const res = controller.listInteractions(customerId)
    expect(res.data.total).toBe(2)
  })

  // ── Tickets ──

  it('should create ticket', () => {
    const res = controller.createTicket(customerId, {
      subject: '价格咨询',
      description: '客户咨询VIP价格',
      priority: 'medium',
      assignedTo: 'admin',
    })
    expect(res.success).toBe(true)
    expect(res.data.subject).toBe('价格咨询')
    expect(res.data.status).toBe('open')
  })

  it('should create high priority ticket', () => {
    const res = controller.createTicket(customerId, {
      subject: '紧急问题',
      description: '系统故障',
      priority: 'urgent',
      assignedTo: 'tech-support',
    })
    expect(res.success).toBe(true)
    expect(res.data.priority).toBe('urgent')
  })

  it('should list tickets', () => {
    controller.createTicket(customerId, { subject: '测试工单', description: '', priority: 'low', assignedTo: 'u1' })
    const res = controller.listTickets(customerId)
    expect(res.success).toBe(true)
    expect(res.data.total).toBe(1)
  })

  it('should update ticket status', () => {
    const created = controller.createTicket(customerId, {
      subject: '待处理', description: '', priority: 'high', assignedTo: 'admin',
    })
    const ticketId = created.data.id
    const res = controller.updateTicketStatus(customerId, ticketId, { status: 'resolved' })
    expect(res.success).toBe(true)
    expect(res.data.status).toBe('resolved')
  })

  it('should close ticket with closedAt', () => {
    const created = controller.createTicket(customerId, {
      subject: '可关闭', description: '', priority: 'low', assignedTo: 'u1',
    })
    const res = controller.updateTicketStatus(customerId, created.data.id, { status: 'closed' })
    expect(res.success).toBe(true)
    expect(res.data.status).toBe('closed')
    expect(res.data.closedAt).toBeDefined()
  })

  it('should throw on ticket with empty subject', () => {
    expect(() =>
      controller.createTicket(customerId, { subject: '', description: '', priority: 'low', assignedTo: '' })
    ).toThrow()
  })

  it('should throw on update nonexistent ticket', () => {
    expect(() =>
      controller.updateTicketStatus(customerId, 'nonexistent', { status: 'closed' })
    ).toThrow()
  })
})
// Total: 20 tests
