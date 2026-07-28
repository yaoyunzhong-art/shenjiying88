/**
 * brand-workspace.service.spec.ts — 品牌工作台服务 V23 全覆盖测试
 *
 * 覆盖:
 *   - getLayout / updateLayout
 *   - createTask / getTasks / updateTaskStatus
 *   - createApproval / getApprovals / approveFlow
 *   - createEvent / getEvents
 *   - getQuickActions / registerAction
 *   - getSummary
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { BrandWorkspaceService } from './brand-workspace.service'

describe('BrandWorkspaceService', () => {
  let service: BrandWorkspaceService

  beforeEach(() => {
    service = new BrandWorkspaceService()
  })

  // ── Layout ────────────────────────────────────────────────────────────────

  describe('Layout', () => {
    it('正例: getLayout 应返回默认工作台布局', async () => {
      const layout = await service.getLayout('t1')
      expect(layout.workspaceId).toBeTruthy()
      expect(layout.grid).toHaveLength(6)
      expect(layout.theme).toBe('auto')
    })

    it('正例: updateLayout 应合并更新', async () => {
      const updated = await service.updateLayout('t1', { theme: 'dark' })
      expect(updated.theme).toBe('dark')
    })
  })

  // ── Tasks ────────────────────────────────────────────────────────────────

  describe('Tasks', () => {
    it('正例: createTask 应创建任务', async () => {
      const task = await service.createTask({
        tenantId: 't1', title: '审核素材', description: '检查活动平面素材',
        assignee: '张三', status: 'todo', priority: 'high', dueDate: new Date(),
      })
      expect(task.id).toMatch(/^t-/)
      expect(task.title).toBe('审核素材')
    })

    it('正例: getTasks 支持状态和负责人筛选', async () => {
      await service.createTask({ tenantId: 't1', title: 'T1', description: 'd', assignee: '张三', status: 'todo', priority: 'medium', dueDate: new Date() })
      await service.createTask({ tenantId: 't1', title: 'T2', description: 'd', assignee: '李四', status: 'done', priority: 'low', dueDate: new Date() })
      const todo = await service.getTasks('t1', { status: 'todo' })
      expect(todo).toHaveLength(1)
      const zhangTasks = await service.getTasks('t1', { assignee: '张三' })
      expect(zhangTasks).toHaveLength(1)
    })

    it('正例: updateTaskStatus 应更新任务状态', async () => {
      const task = await service.createTask({ tenantId: 't1', title: 'T', description: 'd', assignee: 'A', status: 'todo', priority: 'high', dueDate: new Date() })
      const updated = await service.updateTaskStatus(task.id, 'done')
      expect(updated.status).toBe('done')
    })

    it('异常: updateTaskStatus 不存应抛 NotFoundException', async () => {
      await expect(service.updateTaskStatus('nonexistent', 'done')).rejects.toThrow()
    })
  })

  // ── Approvals ────────────────────────────────────────────────────────────

  describe('Approvals', () => {
    it('正例: createApproval 应创建审批', async () => {
      const a = await service.createApproval({
        tenantId: 't1', title: '活动审批', type: 'campaign',
        status: 'pending', submittedBy: '张三',
      })
      expect(a.id).toMatch(/^ap-/)
    })

    it('正例: approveFlow 应更新审批状态', async () => {
      const a = await service.createApproval({
        tenantId: 't1', title: '活动审批', type: 'campaign',
        status: 'pending', submittedBy: '张三',
      })
      const approved = await service.approveFlow(a.id, '李四', '同意')
      expect(approved.status).toBe('approved')
      expect(approved.approverId).toBe('李四')
    })

    it('正例: getApprovals 支持状态筛选', async () => {
      await service.createApproval({ tenantId: 't1', title: 'A1', type: 'campaign', status: 'pending', submittedBy: '张三' })
      await service.createApproval({ tenantId: 't1', title: 'A2', type: 'campaign', status: 'approved', submittedBy: '李四' })
      const pending = await service.getApprovals('t1', { status: 'pending' })
      expect(pending).toHaveLength(1)
    })
  })

  // ── Events ───────────────────────────────────────────────────────────────

  describe('Events', () => {
    it('正例: createEvent 应创建日历事件', async () => {
      const e = await service.createEvent({
        tenantId: 't1', title: '促销上线', type: 'campaign',
        startDate: '2026-08-01', endDate: '2026-08-31', allDay: true,
      })
      expect(e.id).toMatch(/^ev-/)
    })

    it('正例: getEvents 支持日期范围筛选', async () => {
      await service.createEvent({ tenantId: 't1', title: 'E1', type: 'campaign', startDate: '2026-08-01', endDate: '2026-08-05', allDay: true })
      await service.createEvent({ tenantId: 't1', title: 'E2', type: 'campaign', startDate: '2026-09-01', endDate: '2026-09-05', allDay: true })
      const august = await service.getEvents('t1', '2026-08-01', '2026-08-31')
      expect(august).toHaveLength(1)
    })
  })

  // ── QuickActions ─────────────────────────────────────────────────────────

  describe('QuickActions', () => {
    it('正例: registerAction 应注册快捷操作', async () => {
      const a = await service.registerAction({
        tenantId: 't1', label: '创建活动', icon: 'add',
        route: '/campaigns/new', sortOrder: 1,
      })
      expect(a.id).toMatch(/^qa-/)
    })

    it('正例: getQuickActions 应返回租户下的操作', async () => {
      await service.registerAction({ tenantId: 't1', label: '创建活动', icon: 'add', route: '/new', sortOrder: 1 })
      await service.registerAction({ tenantId: 't1', label: '查看报告', icon: 'chart', route: '/reports', sortOrder: 2 })
      const actions = await service.getQuickActions('t1')
      expect(actions).toHaveLength(2)
    })
  })

  // ── Summary ──────────────────────────────────────────────────────────────

  describe('Summary', () => {
    it('正例: getSummary 应返回工作台汇总', async () => {
      await service.createTask({ tenantId: 't1', title: 'T', description: 'd', assignee: 'A', status: 'todo', priority: 'high', dueDate: new Date() })
      await service.createApproval({ tenantId: 't1', title: 'A', type: 'campaign', status: 'pending', submittedBy: '张三' })
      const summary = await service.getSummary('t1')
      expect(summary.pendingTasks).toBe(1)
      expect(summary.pendingApprovals).toBe(1)
    })
  })
})
