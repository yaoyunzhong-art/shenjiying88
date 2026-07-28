/**
 * crm.service.spec.ts — CRM 客户关系管理服务 V23 全覆盖测试
 *
 * 覆盖:
 *   - Customer CRUD (list / getById / create / update / delete)
 *   - 评分管理 (updateEngagementScore / setEngagementScore)
 *   - 标签管理 (addTag / removeTag)
 *   - 客户标记 (markCustomer)
 *   - 备注 (addNote / listNotes)
 *   - 交互记录 (addInteraction / listInteractions)
 *   - 工单管理 (createTicket / listTickets / updateTicketStatus)
 *   - getStats
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { CrmService } from './crm.service'

describe('CrmService', () => {
  let service: CrmService

  beforeEach(() => {
    service = new CrmService()
  })

  // ── Customer CRUD ────────────────────────────────────────────────────────

  describe('Customer CRUD', () => {
    it('正例: list 应返回默认客户', () => {
      const list = service.list()
      expect(list.length).toBe(3)
    })

    it('正例: list 支持按状态和搜索筛选', () => {
      const lead = service.list('lead')
      expect(lead).toHaveLength(1)
      const zhangs = service.list(undefined, '张三')
      expect(zhangs).toHaveLength(1)
    })

    it('正例: getById 应返回客户', () => {
      const all = service.list()
      const c = service.getById(all[0].id)
      expect(c.name).toBeTruthy()
    })

    it('异常: getById 不存应抛 NotFoundException', () => {
      expect(() => service.getById('nonexistent')).toThrow()
    })

    it('正例: create 应创建 lead 客户', () => {
      const c = service.create({ name: '新客户', email: 'new@test.com', phone: '13900000001' })
      expect(c.name).toBe('新客户')
      expect(c.status).toBe('lead')
      expect(c.engagementScore).toBe(0)
    })

    it('异常: create 空名应抛 ConflictException', () => {
      expect(() => service.create({ name: '', email: 'a@b.com', phone: '13900000001' })).toThrow()
    })

    it('正例: update 应部分更新', () => {
      const all = service.list()
      const updated = service.update(all[0].id, { name: '新名字', tags: ['vip', '重要'] })
      expect(updated.name).toBe('新名字')
      expect(updated.tags).toContain('vip')
    })

    it('正例: delete 应删除客户', () => {
      const c = service.create({ name: 'deleteMe', email: 'del@test.com', phone: '13900000002' })
      service.delete(c.id)
      expect(() => service.getById(c.id)).toThrow()
    })
  })

  // ── 评分管理 ─────────────────────────────────────────────────────────────

  describe('Engagement Score', () => {
    it('正例: updateEngagementScore delta 调整', () => {
      const c = service.create({ name: 'scoreTest', email: 's@t.com', phone: '13900000003' })
      const updated = service.updateEngagementScore(c.id, 20)
      expect(updated.engagementScore).toBe(20)
      const clamped = service.updateEngagementScore(c.id, -500)
      expect(clamped.engagementScore).toBe(0)
    })

    it('正例: setEngagementScore 直接设置', () => {
      const c = service.create({ name: 'setTest', email: 'set@t.com', phone: '13900000004' })
      const updated = service.setEngagementScore(c.id, 85)
      expect(updated.engagementScore).toBe(85)
      const over = service.setEngagementScore(c.id, 200)
      expect(over.engagementScore).toBe(100)
    })
  })

  // ── 标签管理 ─────────────────────────────────────────────────────────────

  describe('Tags', () => {
    it('正例: addTag 应添加不重复标签', () => {
      const c = service.create({ name: 'tagTest', email: 'tag@t.com', phone: '13900000005' })
      service.addTag(c.id, 'vip')
      service.addTag(c.id, 'vip')
      expect(service.getById(c.id).tags).toEqual(['vip'])
    })

    it('异常: 空标签应抛错', () => {
      const c = service.create({ name: 'tagErr', email: 'err@t.com', phone: '13900000006' })
      expect(() => service.addTag(c.id, '')).toThrow()
    })

    it('正例: removeTag 应移除标签', () => {
      const c = service.create({ name: 'removeTag', email: 'r@t.com', phone: '13900000007' })
      service.addTag(c.id, 'vip')
      service.addTag(c.id, 'important')
      service.removeTag(c.id, 'vip')
      expect(service.getById(c.id).tags).not.toContain('vip')
      expect(service.getById(c.id).tags).toContain('important')
    })
  })

  // ── 客户标记 ─────────────────────────────────────────────────────────────

  describe('markCustomer', () => {
    it('正例: 标记为 churned 应降低评分', () => {
      const c = service.create({ name: 'markTest', email: 'm@t.com', phone: '13900000008' })
      service.setEngagementScore(c.id, 80)
      const marked = service.markCustomer(c.id, 'churned')
      expect(marked.status).toBe('churned')
      expect(marked.engagementScore).toBeLessThanOrEqual(20)
    })
  })

  // ── 备注 ──────────────────────────────────────────────────────────────────

  describe('Notes', () => {
    it('正例: addNote 应添加备注', () => {
      const c = service.create({ name: 'noteTest', email: 'n@t.com', phone: '13900000009' })
      const note = service.addNote(c.id, '重要客户', 'admin')
      expect(note.content).toBe('重要客户')
      expect(service.listNotes(c.id)).toHaveLength(1)
    })

    it('异常: 空备注应抛错', () => {
      const c = service.create({ name: 'noteErr', email: 'ne@t.com', phone: '13900000010' })
      expect(() => service.addNote(c.id, '', 'admin')).toThrow()
    })
  })

  // ── 交互记录 ─────────────────────────────────────────────────────────────

  describe('Interactions', () => {
    it('正例: addInteraction 应添加交互记录', () => {
      const c = service.create({ name: 'interactTest', email: 'i@t.com', phone: '13900000011' })
      const ia = service.addInteraction(c.id, { type: 'call', summary: '电话跟进', details: '沟通续约事宜', createdBy: 'admin' })
      expect(ia.type).toBe('call')
      expect(service.listInteractions(c.id)).toHaveLength(1)
    })
  })

  // ── 工单管理 ─────────────────────────────────────────────────────────────

  describe('Tickets', () => {
    it('正例: createTicket 应创建 open 工单', () => {
      const c = service.create({ name: 'ticketTest', email: 'tick@t.com', phone: '13900000012' })
      const ticket = service.createTicket(c.id, { subject: '设备故障', description: '投篮机无法使用', priority: 'high', assignedTo: '王工' })
      expect(ticket.status).toBe('open')
      expect(service.listTickets(c.id)).toHaveLength(1)
    })

    it('正例: updateTicketStatus 应更新状态', () => {
      const c = service.create({ name: 'ticketUpd', email: 'tu@t.com', phone: '13900000013' })
      const ticket = service.createTicket(c.id, { subject: '测试', description: 'd', priority: 'low', assignedTo: 'admin' })
      const closed = service.updateTicketStatus(c.id, ticket.id, 'closed')
      expect(closed.status).toBe('closed')
      expect(closed.closedAt).toBeTruthy()
    })

    it('异常: 空工单主题应抛错', () => {
      const c = service.create({ name: 'ticketErr', email: 'te@t.com', phone: '13900000014' })
      expect(() => service.createTicket(c.id, { subject: '', description: 'd', priority: 'low', assignedTo: 'admin' })).toThrow()
    })
  })

  // ── Stats ────────────────────────────────────────────────────────────────

  describe('getStats', () => {
    it('正例: 应返回客户统计', () => {
      const stats = service.getStats()
      expect(stats.total).toBeGreaterThan(0)
      expect(stats.byStatus.active).toBeGreaterThan(0)
      expect(stats.byStatus.lead).toBeGreaterThan(0)
      expect(stats.avgScore).toBeGreaterThan(0)
    })
  })
})
