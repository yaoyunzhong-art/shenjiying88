/**
 * crm.service.spec.ts — CRM 客户关系管理服务全覆盖测试 V24
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
    it('正例: list 应返回默认3个客户', () => {
      const list = service.list()
      expect(list).toHaveLength(3)
    })

    it('正例: list 支持按状态筛选', () => {
      const leads = service.list('lead')
      expect(leads).toHaveLength(1)
      expect(leads[0].status).toBe('lead')
    })

    it('正例: list 按状态筛不出结果时空数组', () => {
      const res = service.list('churned')
      expect(res).toEqual([])
    })

    it('正例: list 支持按名称/邮箱搜索', () => {
      const res = service.list(undefined, '张三')
      expect(res).toHaveLength(1)
      expect(res[0].name).toBe('张三')
    })

    it('正例: list 搜索不匹配时返回空', () => {
      const res = service.list(undefined, '不存在的客户')
      expect(res).toEqual([])
    })

    it('正例: getById 返回客户', () => {
      const all = service.list()
      const c = service.getById(all[0].id)
      expect(c.name).toBeTruthy()
    })

    it('异常: getById 不存在的 ID 抛 NotFoundException', () => {
      expect(() => service.getById('nonexistent')).toThrow()
    })

    it('正例: create 创建 lead 客户', () => {
      const c = service.create({ name: '新客户', email: 'new@test.com', phone: '13900000001' })
      expect(c.name).toBe('新客户')
      expect(c.status).toBe('lead')
      expect(c.engagementScore).toBe(0)
    })

    it('正例: create 可指定状态', () => {
      const c = service.create({ name: 'VIP客户', email: 'vip@test.com', phone: '13900000002', status: 'active' })
      expect(c.status).toBe('active')
    })

    it('异常: create 空名抛 ConflictException', () => {
      expect(() => service.create({ name: '', email: 'a@b.com', phone: '13900000001' })).toThrow()
    })

    it('异常: create 空邮箱抛 ConflictException', () => {
      expect(() => service.create({ name: 'test', email: '', phone: '13900000001' })).toThrow()
    })

    it('异常: create 空名 + 空邮箱抛错', () => {
      expect(() => service.create({ name: '', email: '', phone: '' })).toThrow()
    })

    it('正例: update 部分更新名称邮箱状态', () => {
      const all = service.list()
      const updated = service.update(all[0].id, { name: '新名字', email: 'new@mail.com', status: 'inactive' })
      expect(updated.name).toBe('新名字')
      expect(updated.email).toBe('new@mail.com')
      expect(updated.status).toBe('inactive')
    })

    it('正例: update 更新标签', () => {
      const all = service.list()
      const updated = service.update(all[0].id, { tags: ['vip', '重要'] })
      expect(updated.tags).toEqual(['vip', '重要'])
    })

    it('正例: update 更新消费信息', () => {
      const all = service.list()
      const updated = service.update(all[0].id, { totalSpentCents: 999999, visitCount: 42, lastVisitAt: '2026-07-29T00:00:00Z' })
      expect(updated.totalSpentCents).toBe(999999)
      expect(updated.visitCount).toBe(42)
    })

    it('正例: delete 删除后不可查询', () => {
      const c = service.create({ name: 'delMe', email: 'del@test.com', phone: '13900000002' })
      service.delete(c.id)
      expect(() => service.getById(c.id)).toThrow()
    })

    it('异常: delete 不存在的客户抛错', () => {
      expect(() => service.delete('nonexistent-id')).toThrow()
    })
  })

  // ── 评分管理 ─────────────────────────────────────────────────────────────

  describe('Engagement Score', () => {
    it('正例: updateEngagementScore 正 delta', () => {
      const c = service.create({ name: 'scoreTest', email: 's@t.com', phone: '13900000003' })
      const u = service.updateEngagementScore(c.id, 20)
      expect(u.engagementScore).toBe(20)
    })

    it('正例: updateEngagementScore 负 delta 不跌到 0 以下', () => {
      const c = service.create({ name: 'scoreNeg', email: 'n@t.com', phone: '13900000004' })
      const u = service.updateEngagementScore(c.id, -500)
      expect(u.engagementScore).toBe(0)
    })

    it('边界: updateEngagementScore 超过 100 的上限', () => {
      const c = service.create({ name: 'high', email: 'h@t.com', phone: '13900000005' })
      const u = service.updateEngagementScore(c.id, 999)
      expect(u.engagementScore).toBe(100)
    })

    it('正例: setEngagementScore 精确设置', () => {
      const c = service.create({ name: 'setTest', email: 'set@t.com', phone: '13900000006' })
      const u = service.setEngagementScore(c.id, 85)
      expect(u.engagementScore).toBe(85)
    })

    it('边界: setEngagementScore 超过 100 截断', () => {
      const c = service.create({ name: 'over', email: 'o@t.com', phone: '13900000007' })
      const u = service.setEngagementScore(c.id, 200)
      expect(u.engagementScore).toBe(100)
    })

    it('边界: setEngagementScore 低于 0 截断', () => {
      const c = service.create({ name: 'under', email: 'u@t.com', phone: '13900000008' })
      const u = service.setEngagementScore(c.id, -50)
      expect(u.engagementScore).toBe(0)
    })
  })

  // ── 标签管理 ─────────────────────────────────────────────────────────────

  describe('Tags', () => {
    it('正例: addTag 添加新标签', () => {
      const c = service.create({ name: 'tagTest', email: 'tag@t.com', phone: '13900000009' })
      service.addTag(c.id, 'vip')
      expect(service.getById(c.id).tags).toContain('vip')
    })

    it('正例: addTag 重复标签不重复添加', () => {
      const c = service.create({ name: 'tagDedup', email: 'td@t.com', phone: '13900000010' })
      service.addTag(c.id, 'vip')
      service.addTag(c.id, 'vip')
      expect(service.getById(c.id).tags).toEqual(['vip'])
    })

    it('异常: addTag 空标签抛错', () => {
      const c = service.create({ name: 'tagErr', email: 'te@t.com', phone: '13900000011' })
      expect(() => service.addTag(c.id, '')).toThrow()
    })

    it('正例: removeTag 移除存在的标签', () => {
      const c = service.create({ name: 'rmTag', email: 'rm@t.com', phone: '13900000012' })
      service.addTag(c.id, 'vip')
      service.addTag(c.id, 'important')
      service.removeTag(c.id, 'vip')
      expect(service.getById(c.id).tags).not.toContain('vip')
      expect(service.getById(c.id).tags).toContain('important')
    })

    it('正例: removeTag 不存在的标签不抛错', () => {
      const c = service.create({ name: 'rmNone', email: 'rn@t.com', phone: '13900000013' })
      expect(() => service.removeTag(c.id, 'nonexistent-tag')).not.toThrow()
    })
  })

  // ── 客户标记 ─────────────────────────────────────────────────────────────

  describe('markCustomer', () => {
    it('正例: 标记为 active', () => {
      const c = service.create({ name: 'toActive', email: 'a@t.com', phone: '13900000014' })
      const m = service.markCustomer(c.id, 'active')
      expect(m.status).toBe('active')
    })

    it('正例: 标记为 churned 后评分降至 ≤ 20', () => {
      const c = service.create({ name: 'churnTest', email: 'ch@t.com', phone: '13900000015' })
      service.setEngagementScore(c.id, 80)
      const m = service.markCustomer(c.id, 'churned')
      expect(m.status).toBe('churned')
      expect(m.engagementScore).toBeLessThanOrEqual(20)
    })

    it('正例: 标记为 inactive 不影响评分', () => {
      const c = service.create({ name: 'inactiveTest', email: 'ia@t.com', phone: '13900000016' })
      service.setEngagementScore(c.id, 75)
      const m = service.markCustomer(c.id, 'inactive')
      expect(m.status).toBe('inactive')
      expect(m.engagementScore).toBe(75) // unchanged
    })
  })

  // ── 备注 ──────────────────────────────────────────────────────────────────

  describe('Notes', () => {
    it('正例: addNote 添加备注', () => {
      const c = service.create({ name: 'noteTest', email: 'n@t.com', phone: '13900000017' })
      const note = service.addNote(c.id, '重要客户', 'admin')
      expect(note.content).toBe('重要客户')
      expect(note.createdBy).toBe('admin')
      expect(service.listNotes(c.id)).toHaveLength(1)
    })

    it('异常: addNote 空内容抛错', () => {
      const c = service.create({ name: 'noteErr', email: 'ne@t.com', phone: '13900000018' })
      expect(() => service.addNote(c.id, '', 'admin')).toThrow()
    })

    it('正例: listNotes 返回空列表', () => {
      const c = service.create({ name: 'noNotes', email: 'nn@t.com', phone: '13900000019' })
      expect(service.listNotes(c.id)).toEqual([])
    })

    it('正例: 多条备注按添加顺序排列', () => {
      const c = service.create({ name: 'multiNote', email: 'mn@t.com', phone: '13900000020' })
      service.addNote(c.id, '备注一', 'admin')
      service.addNote(c.id, '备注二', 'admin')
      expect(service.listNotes(c.id)).toHaveLength(2)
    })
  })

  // ── 交互记录 ─────────────────────────────────────────────────────────────

  describe('Interactions', () => {
    it('正例: addInteraction 添加电话交互', () => {
      const c = service.create({ name: 'iaCall', email: 'ia@t.com', phone: '13900000021' })
      const ia = service.addInteraction(c.id, { type: 'call', summary: '电话跟进', details: '续约沟通', createdBy: 'admin' })
      expect(ia.type).toBe('call')
      expect(ia.summary).toBe('电话跟进')
    })

    it('正例: addInteraction 支持所有交互类型', () => {
      const c = service.create({ name: 'iaTypes', email: 'iat@t.com', phone: '13900000022' })
      for (const t of ['call', 'email', 'chat', 'visit', 'ticket', 'other'] as const) {
        service.addInteraction(c.id, { type: t, summary: t, details: '', createdBy: 'admin' })
      }
      expect(service.listInteractions(c.id)).toHaveLength(6)
    })

    it('正例: listInteractions 空时返回空数组', () => {
      const c = service.create({ name: 'noIA', email: 'nia@t.com', phone: '13900000023' })
      expect(service.listInteractions(c.id)).toEqual([])
    })
  })

  // ── 工单管理 ─────────────────────────────────────────────────────────────

  describe('Tickets', () => {
    it('正例: createTicket 创建 open 工单', () => {
      const c = service.create({ name: 'ticketTest', email: 'tick@t.com', phone: '13900000024' })
      const t = service.createTicket(c.id, { subject: '设备故障', description: '投篮机无法使用', priority: 'high', assignedTo: '王工' })
      expect(t.status).toBe('open')
      expect(t.priority).toBe('high')
    })

    it('异常: createTicket 空主题抛错', () => {
      const c = service.create({ name: 'ticketErr', email: 'te@t.com', phone: '13900000025' })
      expect(() => service.createTicket(c.id, { subject: '', description: 'd', priority: 'low', assignedTo: 'admin' })).toThrow()
    })

    it('正例: listTickets 空返回空数组', () => {
      const c = service.create({ name: 'noTickets', email: 'nt@t.com', phone: '13900000026' })
      expect(service.listTickets(c.id)).toEqual([])
    })

    it('正例: updateTicketStatus 可依次变更', () => {
      const c = service.create({ name: 'ticketFlow', email: 'tf@t.com', phone: '13900000027' })
      const t = service.createTicket(c.id, { subject: '测试', description: 'd', priority: 'low', assignedTo: 'admin' })
      const ip = service.updateTicketStatus(c.id, t.id, 'in_progress')
      expect(ip.status).toBe('in_progress')
      const resolved = service.updateTicketStatus(c.id, t.id, 'resolved')
      expect(resolved.status).toBe('resolved')
    })

    it('正例: updateTicketStatus closed 记录关闭时间', () => {
      const c = service.create({ name: 'ticketClose', email: 'tc@t.com', phone: '13900000028' })
      const t = service.createTicket(c.id, { subject: '关闭测试', description: 'd', priority: 'medium', assignedTo: 'admin' })
      const closed = service.updateTicketStatus(c.id, t.id, 'closed')
      expect(closed.status).toBe('closed')
      expect(closed.closedAt).toBeTruthy()
    })

    it('异常: updateTicketStatus 不存在的工单抛错', () => {
      const c = service.create({ name: 'ticketBadId', email: 'tbi@t.com', phone: '13900000029' })
      expect(() => service.updateTicketStatus(c.id, 'fake-ticket-id', 'closed')).toThrow()
    })
  })

  // ── Stats ────────────────────────────────────────────────────────────────

  describe('getStats', () => {
    it('正例: 返回完整统计结构', () => {
      const stats = service.getStats()
      expect(stats.total).toBeGreaterThan(0)
      expect(stats.byStatus).toHaveProperty('active')
      expect(stats.byStatus).toHaveProperty('lead')
      expect(stats.byStatus).toHaveProperty('inactive')
      expect(stats.byStatus).toHaveProperty('churned')
      expect(stats.avgScore).toBeGreaterThan(0)
      expect(stats.totalSpentCents).toBeGreaterThan(0)
    })

    it('正例: 创建新客户后统计更新', () => {
      const before = service.getStats()
      service.create({ name: 'statsTest', email: 'st@t.com', phone: '13900000030' })
      const after = service.getStats()
      expect(after.total).toBe(before.total + 1)
      expect(after.byStatus.lead).toBe(before.byStatus.lead + 1)
    })

    it('正例: 删除客户后统计更新', () => {
      const c = service.create({ name: 'delStat', email: 'ds@t.com', phone: '13900000031' })
      const before = service.getStats()
      service.delete(c.id)
      const after = service.getStats()
      expect(after.total).toBe(before.total - 1)
    })
  })
})
