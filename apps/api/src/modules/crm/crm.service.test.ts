/**
 * crm.service.test.ts — CRM Service 单元测试
 *
 * 覆盖:
 *   - 客户 CRUD (list/getById/create/update/delete/filter/search)
 *   - 评分管理 (delta/直接设置/边界值)
 *   - 标签管理 (添加/重复/移除)
 *   - 客户标记状态 (churned/inactive)
 *   - 备注 (添加/列表)
 *   - 交互记录 (添加/列表)
 *   - 工单管理 (创建/列表/状态流转/空主题/不存在)
 *   - 统计
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { CrmService } from './crm.service'
import { NotFoundException, ConflictException } from '@nestjs/common'

describe('CrmService', () => {
  let service: CrmService

  beforeEach(() => { service = new CrmService() })

  // ═══ 客户 CRUD ═══

  describe('客户 CRUD', () => {
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

    it('should search by email', () => {
      const results = service.list(undefined, 'li@example.com')
      expect(results.length).toBeGreaterThanOrEqual(1)
    })

    it('should create customer', () => {
      const c = service.create({ name: '赵六', email: 'zhao@test.com', phone: '13900009999', status: 'lead' })
      expect(c.name).toBe('赵六')
      expect(c.status).toBe('lead')
      expect(c.engagementScore).toBe(0)
    })

    it('should throw on create with empty name', () => {
      expect(() => service.create({ name: '', email: 'x@x.com', phone: '' })).toThrow(ConflictException)
    })

    it('should throw on create with empty email', () => {
      expect(() => service.create({ name: '测试', email: '', phone: '' })).toThrow(ConflictException)
    })

    it('should update customer', () => {
      const c = service.list()[0]
      const updated = service.update(c.id, { name: '张三改名', tags: ['vip'] })
      expect(updated.name).toBe('张三改名')
      expect(updated.tags).toContain('vip')
    })

    it('should delete customer', () => {
      const c = service.list()[0]
      service.delete(c.id)
      expect(() => service.getById(c.id)).toThrow(NotFoundException)
    })

    it('should throw on delete nonexistent', () => {
      expect(() => service.delete('nonexistent')).toThrow(NotFoundException)
    })
  })

  // ═══ 评分管理 ═══

  describe('评分管理', () => {
    it('should update engagement score (delta)', () => {
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

    it('should set engagement score directly', () => {
      const c = service.list()[0]
      const updated = service.setEngagementScore(c.id, 42)
      expect(updated.engagementScore).toBe(42)
    })

    it('should clamp set score to 0', () => {
      const c = service.list()[0]
      expect(service.setEngagementScore(c.id, -5).engagementScore).toBe(0)
    })

    it('should clamp set score to 100', () => {
      const c = service.list()[0]
      expect(service.setEngagementScore(c.id, 999).engagementScore).toBe(100)
    })
  })

  // ═══ 标签管理 ═══

  describe('标签管理', () => {
    it('should add tag', () => {
      const c = service.list()[0]
      const updated = service.addTag(c.id, 'premium')
      expect(updated.tags).toContain('premium')
    })

    it('should not duplicate tag', () => {
      const c = service.list()[0]
      service.addTag(c.id, 'test-tag')
      service.addTag(c.id, 'test-tag')
      expect(c.tags.filter((t) => t === 'test-tag')).toHaveLength(1)
    })

    it('should remove tag', () => {
      const c = service.list()[0]
      service.addTag(c.id, 'toremove')
      service.removeTag(c.id, 'toremove')
      expect(c.tags).not.toContain('toremove')
    })

    it('should throw on empty tag', () => {
      const c = service.list()[0]
      expect(() => service.addTag(c.id, '')).toThrow(ConflictException)
    })
  })

  // ═══ 客户标记 ═══

  describe('客户标记', () => {
    it('should mark customer as churned and lower score', () => {
      const c = service.list()[0]
      const updated = service.markCustomer(c.id, 'churned')
      expect(updated.status).toBe('churned')
      expect(updated.engagementScore).toBeLessThanOrEqual(20)
    })

    it('should mark customer as inactive', () => {
      const c = service.list()[1]
      const updated = service.markCustomer(c.id, 'inactive')
      expect(updated.status).toBe('inactive')
    })
  })

  // ═══ 备注 ═══

  describe('备注', () => {
    it('should add note', () => {
      const c = service.list()[0]
      const note = service.addNote(c.id, '客户偏好', 'sales-01')
      expect(note.content).toBe('客户偏好')
      expect(note.createdBy).toBe('sales-01')
    })

    it('should list notes', () => {
      const c = service.list()[0]
      service.addNote(c.id, '备注1', 'u1')
      service.addNote(c.id, '备注2', 'u2')
      const notes = service.listNotes(c.id)
      expect(notes).toHaveLength(2)
    })

    it('should throw on empty note', () => {
      const c = service.list()[0]
      expect(() => service.addNote(c.id, '', 'u1')).toThrow(ConflictException)
    })
  })

  // ═══ 交互记录 ═══

  describe('交互记录', () => {
    it('should add interaction', () => {
      const c = service.list()[0]
      const interaction = service.addInteraction(c.id, { type: 'call', summary: '咨询', details: '客户咨询套餐', createdBy: 'admin' })
      expect(interaction.summary).toBe('咨询')
      expect(service.listInteractions(c.id)).toHaveLength(1)
    })

    it('should list multiple interactions', () => {
      const c = service.list()[0]
      service.addInteraction(c.id, { type: 'chat', summary: '聊', details: '', createdBy: 'u1' })
      service.addInteraction(c.id, { type: 'email', summary: '邮件', details: '', createdBy: 'u2' })
      expect(service.listInteractions(c.id)).toHaveLength(2)
    })
  })

  // ═══ 工单管理 ═══

  describe('工单管理', () => {
    it('should create ticket', () => {
      const c = service.list()[0]
      const ticket = service.createTicket(c.id, { subject: '价格问题', description: '客户反映价格过高', priority: 'medium', assignedTo: 'admin' })
      expect(ticket.status).toBe('open')
      expect(ticket.subject).toBe('价格问题')
    })

    it('should throw on empty ticket subject', () => {
      const c = service.list()[0]
      expect(() => service.createTicket(c.id, { subject: '', description: '', priority: 'low', assignedTo: '' })).toThrow(ConflictException)
    })

    it('should update ticket status to resolved', () => {
      const c = service.list()[0]
      const ticket = service.createTicket(c.id, { subject: '测试', description: '', priority: 'high', assignedTo: 'admin' })
      const updated = service.updateTicketStatus(c.id, ticket.id, 'resolved')
      expect(updated.status).toBe('resolved')
    })

    it('should set closedAt when closing ticket', () => {
      const c = service.list()[0]
      const ticket = service.createTicket(c.id, { subject: 'close', description: '', priority: 'low', assignedTo: 'u1' })
      const closed = service.updateTicketStatus(c.id, ticket.id, 'closed')
      expect(closed.closedAt).toBeDefined()
    })

    it('should throw on update nonexistent ticket', () => {
      const c = service.list()[0]
      expect(() => service.updateTicketStatus(c.id, 'nonexistent', 'closed')).toThrow(NotFoundException)
    })
  })

  // ═══ 统计 ═══

  describe('统计', () => {
    it('should return stats', () => {
      const stats = service.getStats()
      expect(stats.total).toBeGreaterThanOrEqual(3)
      expect(stats.byStatus.active).toBeGreaterThanOrEqual(2)
      expect(stats.byStatus.lead).toBeGreaterThanOrEqual(1)
      expect(stats.totalSpentCents).toBeGreaterThan(0)
    })

    it('should update stats after creating customer', () => {
      service.create({ name: '新增', email: 'x@x.com', phone: '' })
      expect(service.getStats().total).toBeGreaterThanOrEqual(4)
    })
  })

  // ═══ 边界值 ═══

  describe('边界值', () => {
    it('should return empty for churned filter (no churned defaults)', () => {
      const churned = service.list('churned')
      expect(churned).toHaveLength(0)
    })

    it('should handle empty string search gracefully', () => {
      const results = service.list(undefined, '')
      expect(results.length).toBeGreaterThanOrEqual(3)
    })
  })
})
// Total: 40 tests
