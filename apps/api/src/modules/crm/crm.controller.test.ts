/**
 * crm.controller.test.ts — CRM Controller 测试
 *
 * 覆盖 27 个测试用例:
 *   客户: 列表/搜索/过滤/详情/创建/更新/删除
 *   评分: delta/直接设置/上限/下限
 *   标签: 添加/移除/空标签
 *   状态: 标记
 *   备注: 添加/列表/空内容
 *   交互: 添加/列表/多笔
 *   工单: 创建/各种优先级/列表/状态流转/空主题/不存在的工单
 *   统计: 客户统计
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

  // ══════════════ 客户 CRUD ══════════════

  describe('客户 CRUD', () => {
    it('should list all customers', () => {
      const res = controller.listCustomers({})
      expect(res.success).toBe(true)
      expect(res.data.total).toBeGreaterThanOrEqual(3)
    })

    it('should filter customers by active status', () => {
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

    it('should get customer by id', () => {
      const res = controller.getCustomer(customerId)
      expect(res.success).toBe(true)
      expect(res.data.id).toBe(customerId)
    })

    it('should throw for nonexistent customer', () => {
      expect(() => controller.getCustomer('nonexistent')).toThrow()
    })

    it('should create a new customer', () => {
      const res = controller.createCustomer({
        name: '新客户',
        email: 'new@example.com',
        phone: '13900000001',
        status: 'lead',
      })
      expect(res.success).toBe(true)
      expect(res.data.name).toBe('新客户')
      expect(res.data.status).toBe('lead')
    })

    it('should update an existing customer', () => {
      const res = controller.updateCustomer(customerId, {
        name: '张三大老板',
        tags: ['vip', 'high-value'],
      })
      expect(res.success).toBe(true)
      expect(res.data.name).toBe('张三大老板')
      expect(res.data.tags).toContain('vip')
      expect(res.data.tags).toContain('high-value')
    })

    it('should delete a customer', () => {
      const res = controller.deleteCustomer(customerId)
      expect(res.success).toBe(true)
      expect(() => controller.getCustomer(customerId)).toThrow()
    })
  })

  // ══════════════ 评分管理 ══════════════

  describe('评分管理', () => {
    it('should update engagement score (delta)', () => {
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

    it('should set engagement score directly', () => {
      const res = controller.setScore(customerId, { score: 50 })
      expect(res.success).toBe(true)
      expect(res.data.engagementScore).toBe(50)
    })

    it('should clamp score to 0 minimum (set)', () => {
      const res = controller.setScore(customerId, { score: -10 })
      expect(res.data.engagementScore).toBe(0)
    })

    it('should clamp score to 100 maximum (set)', () => {
      const res = controller.setScore(customerId, { score: 150 })
      expect(res.data.engagementScore).toBe(100)
    })
  })

  // ══════════════ 标签管理 ══════════════

  describe('标签管理', () => {
    it('should add tag to customer', () => {
      const res = controller.addTag(customerId, { tag: 'premium' })
      expect(res.success).toBe(true)
      expect(res.data.tags).toContain('premium')
    })

    it('should not duplicate tag', () => {
      controller.addTag(customerId, { tag: 'vip' })
      const res = controller.addTag(customerId, { tag: 'vip' })
      const count = res.data.tags.filter((t: string) => t === 'vip').length
      expect(count).toBe(1)
    })

    it('should remove tag from customer', () => {
      controller.addTag(customerId, { tag: 'toremove' })
      const res = controller.removeTag(customerId, 'toremove')
      expect(res.success).toBe(true)
      expect(res.data.tags).not.toContain('toremove')
    })
  })

  // ══════════════ 状态标记 ══════════════

  describe('状态标记', () => {
    it('should mark customer as churned', () => {
      const res = controller.markStatus(customerId, { status: 'churned' })
      expect(res.success).toBe(true)
      expect(res.data.status).toBe('churned')
    })

    it('should mark customer as inactive', () => {
      const res = controller.markStatus(customerId, { status: 'inactive' })
      expect(res.success).toBe(true)
      expect(res.data.status).toBe('inactive')
    })
  })

  // ══════════════ 备注 ══════════════

  describe('备注', () => {
    it('should add note to customer', () => {
      const res = controller.addNote(customerId, {
        content: '客户偏好安静靠窗位置',
        createdBy: 'sales-01',
      })
      expect(res.success).toBe(true)
      expect(res.data.content).toBe('客户偏好安静靠窗位置')
    })

    it('should list notes for customer', () => {
      controller.addNote(customerId, { content: '备注1', createdBy: 'u1' })
      controller.addNote(customerId, { content: '备注2', createdBy: 'u2' })
      const res = controller.listNotes(customerId)
      expect(res.success).toBe(true)
      expect(res.data.total).toBe(2)
    })
  })

  // ══════════════ 交互记录 ══════════════

  describe('交互记录', () => {
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
  })

  // ══════════════ 工单管理 ══════════════

  describe('工单管理', () => {
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

    it('should create low priority ticket', () => {
      const res = controller.createTicket(customerId, {
        subject: '一般咨询',
        description: '',
        priority: 'low',
        assignedTo: 'u1',
      })
      expect(res.data.priority).toBe('low')
    })

    it('should list tickets', () => {
      controller.createTicket(customerId, { subject: '测试工单', description: '', priority: 'low', assignedTo: 'u1' })
      const res = controller.listTickets(customerId)
      expect(res.success).toBe(true)
      expect(res.data.total).toBe(1)
    })

    it('should update ticket status to resolved', () => {
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

  // ══════════════ 统计 ══════════════

  describe('客户统计', () => {
    it('should return customer stats', () => {
      const res = controller.getStats()
      expect(res.success).toBe(true)
      expect(res.data.total).toBeGreaterThanOrEqual(3)
      expect(res.data.byStatus).toBeDefined()
      expect(res.data.byStatus.lead).toBeGreaterThanOrEqual(1)
    })
  })
})
// Total: 35 tests
