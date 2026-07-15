/**
 * crm.service.test.ts — CRM Service 测试
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { CrmService } from './crm.service'
import { NotFoundException, ConflictException } from '@nestjs/common'

describe('CrmService', () => {
  let service: CrmService

  beforeEach(() => { service = new CrmService() })

  it('should list customers', () => {
    const list = service.list()
    expect(list.length).toBeGreaterThanOrEqual(3)
  })

  it('should get customer by id', () => {
    const c = service.list()[0]
    expect(service.getById(c.id).id).toBe(c.id)
  })

  it('should throw on nonexistent id', () => {
    expect(() => service.getById('nonexistent')).toThrow(NotFoundException)
  })

  it('should filter by status', () => {
    const actives = service.list('active')
    expect(actives.every((c) => c.status === 'active')).toBe(true)
  })

  it('should search by name', () => {
    const results = service.list(undefined, '张三')
    expect(results.length).toBeGreaterThanOrEqual(1)
  })

  it('should update engagement score', () => {
    const c = service.list()[0]
    const before = c.engagementScore
    const updated = service.updateEngagementScore(c.id, 10)
    expect(updated.engagementScore).toBe(before + 10)
  })

  it('should clamp engagement score to 0', () => {
    const c = service.list()[0]
    const updated = service.updateEngagementScore(c.id, -999)
    expect(updated.engagementScore).toBe(0)
  })

  it('should clamp engagement score to 100', () => {
    const c = service.list()[0]
    const updated = service.updateEngagementScore(c.id, 999)
    expect(updated.engagementScore).toBe(100)
  })

  it('should add interaction', () => {
    const c = service.list()[0]
    const interaction = service.addInteraction(c.id, { type: 'call', summary: '咨询', details: '客户咨询套餐', createdBy: 'admin' })
    expect(interaction.summary).toBe('咨询')
    const interactions = service.listInteractions(c.id)
    expect(interactions).toHaveLength(1)
  })

  it('should create ticket', () => {
    const c = service.list()[0]
    const ticket = service.createTicket(c.id, {
      subject: '价格问题',
      description: '客户反映价格过高',
      priority: 'medium',
      assignedTo: 'admin',
    })
    expect(ticket.status).toBe('open')
    expect(ticket.subject).toBe('价格问题')
  })

  it('should throw on ticket with empty subject', () => {
    const c = service.list()[0]
    expect(() => service.createTicket(c.id, { subject: '', description: '', priority: 'low', assignedTo: '' })).toThrow(ConflictException)
  })

  it('should update ticket status', () => {
    const c = service.list()[0]
    const ticket = service.createTicket(c.id, { subject: '测试', description: '', priority: 'high', assignedTo: 'admin' })
    const updated = service.updateTicketStatus(c.id, ticket.id, 'resolved')
    expect(updated.status).toBe('resolved')
    expect(updated.updatedAt).toBeDefined()
  })

  it('should throw on update nonexistent ticket', () => {
    const c = service.list()[0]
    expect(() => service.updateTicketStatus(c.id, 'nonexistent', 'closed')).toThrow(NotFoundException)
  })

  it('should return empty list for filtered status', () => {
    const churned = service.list('churned')
    expect(churned).toHaveLength(0)
  })
})
// Total: 13 tests
