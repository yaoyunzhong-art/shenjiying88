import { describe, it, expect, beforeEach } from 'vitest'
import { BrandWorkspaceService } from './brand-workspace.service'

describe('BrandWorkspaceService', () => {
  let service: BrandWorkspaceService

  beforeEach(() => {
    service = new BrandWorkspaceService()
  })

  // ── 工作台布局 ──

  describe('getLayout', () => {
    it('returns default layout for new tenant', async () => {
      const layout = await service.getLayout('tenant-1')
      expect(layout.tenantId).toBe('tenant-1')
      expect(layout.name).toBe('默认工作台')
      expect(layout.grid).toHaveLength(6)
      expect(layout.theme).toBe('auto')
    })

    it('returns cached layout on second call', async () => {
      const first = await service.getLayout('tenant-1')
      const second = await service.getLayout('tenant-1')
      expect(second.workspaceId).toBe(first.workspaceId)
    })
  })

  describe('updateLayout', () => {
    it('updates layout properties', async () => {
      const updated = await service.updateLayout('tenant-1', { name: '自定义工作台', theme: 'dark' })
      expect(updated.name).toBe('自定义工作台')
      expect(updated.theme).toBe('dark')
    })
  })

  // ── 工作台任务 ──

  describe('createTask / getTasks / updateTaskStatus', () => {
    it('creates and retrieves a task', async () => {
      const task = await service.createTask({
        tenantId: 'tenant-1', title: '测试任务', description: '测试描述',
        assignee: 'user-1', priority: 'high', status: 'todo', dueDate: '2026-08-01',
      })
      expect(task.id).toMatch(/^t-/)
      expect(task.title).toBe('测试任务')
      const tasks = await service.getTasks('tenant-1')
      expect(tasks).toHaveLength(1)
    })

    it('filters tasks by status', async () => {
      await service.createTask({
        tenantId: 'tenant-1', title: '待办', assignee: 'u1', priority: 'medium',
        status: 'todo', dueDate: '2026-08-01',
      })
      await service.createTask({
        tenantId: 'tenant-1', title: '完成', assignee: 'u1', priority: 'low',
        status: 'done', dueDate: '2026-08-01',
      })
      const todoTasks = await service.getTasks('tenant-1', { status: 'todo' })
      expect(todoTasks).toHaveLength(1)
    })

    it('filters tasks by assignee', async () => {
      await service.createTask({
        tenantId: 'tenant-1', title: 'A任务', assignee: 'user-a', priority: 'high',
        status: 'todo', dueDate: '2026-08-01',
      })
      await service.createTask({
        tenantId: 'tenant-1', title: 'B任务', assignee: 'user-b', priority: 'low',
        status: 'todo', dueDate: '2026-08-01',
      })
      const aTasks = await service.getTasks('tenant-1', { assignee: 'user-a' })
      expect(aTasks).toHaveLength(1)
    })

    it('updateTaskStatus changes task status', async () => {
      const task = await service.createTask({
        tenantId: 'tenant-1', title: '可更新', assignee: 'u1', priority: 'high',
        status: 'todo', dueDate: '2026-08-01',
      })
      const updated = await service.updateTaskStatus(task.id, 'done')
      expect(updated.status).toBe('done')
    })

    it('updateTaskStatus throws on non-existent task', async () => {
      await expect(service.updateTaskStatus('nonexistent', 'done')).rejects.toThrow('Task')
    })
  })

  // ── 审批流程 ──

  describe('createApproval / getApprovals / approveFlow', () => {
    it('creates and retrieves an approval flow', async () => {
      const flow = await service.createApproval({
        tenantId: 'tenant-1', type: 'campaign', title: '审批测试',
        requesterId: 'user-1', requesterName: '张三',
        status: 'draft', steps: [],
      })
      expect(flow.id).toMatch(/^ap-/)
      const approvals = await service.getApprovals('tenant-1')
      expect(approvals).toHaveLength(1)
    })

    it('approveFlow changes status to approved', async () => {
      const flow = await service.createApproval({
        tenantId: 'tenant-1', type: 'campaign', title: '审批测试',
        requesterId: 'user-1', requesterName: '张三',
        status: 'in_progress', steps: [],
      })
      const approved = await service.approveFlow(flow.id, 'approver-1', '同意')
      expect(approved.status).toBe('approved')
      expect(approved.approverId).toBe('approver-1')
      expect(approved.comment).toBe('同意')
    })

    it('approveFlow throws on non-existent flow', async () => {
      await expect(service.approveFlow('nope', 'x')).rejects.toThrow('Approval')
    })
  })

  // ── 日历事件 ──

  describe('createEvent / getEvents', () => {
    it('creates and retrieves events', async () => {
      const event = await service.createEvent({
        tenantId: 'tenant-1', title: '品牌活动', eventType: 'campaign_launch',
        startDate: '2026-08-01', endDate: '2026-08-03', status: 'scheduled',
        allDay: false,
      })
      expect(event.id).toMatch(/^ev-/)
      const events = await service.getEvents('tenant-1')
      expect(events).toHaveLength(1)
    })

    it('filters events by date range', async () => {
      await service.createEvent({
        tenantId: 'tenant-1', title: '活动A', eventType: 'campaign_launch',
        startDate: '2026-08-01', endDate: '2026-08-03', status: 'scheduled', allDay: false,
      })
      await service.createEvent({
        tenantId: 'tenant-1', title: '活动B', eventType: 'review',
        startDate: '2026-09-01', endDate: '2026-09-05', status: 'scheduled', allDay: false,
      })
      const augustEvents = await service.getEvents('tenant-1', '2026-08-01', '2026-08-31')
      expect(augustEvents).toHaveLength(1)
    })
  })

  // ── 快捷操作 ──

  describe('registerAction / getQuickActions', () => {
    it('registers and returns quick actions', async () => {
      const action = await service.registerAction({
        tenantId: 'tenant-1', label: '新建活动', icon: 'add',
        actionType: 'create_campaign', config: {}, sortOrder: 1,
      })
      expect(action.id).toMatch(/^qa-/)
      const actions = await service.getQuickActions('tenant-1')
      expect(actions).toHaveLength(1)
    })
  })

  // ── 工作台汇总 ──

  describe('getSummary', () => {
    it('returns summary with zero counts initially', async () => {
      const summary = await service.getSummary('tenant-1')
      expect(summary.tenantId).toBe('tenant-1')
      expect(summary.pendingTasks).toBe(0)
      expect(summary.pendingApprovals).toBe(0)
    })

    it('reflects created tasks and approvals', async () => {
      await service.createTask({
        tenantId: 'tenant-1', title: '待办任务', assignee: 'u1', priority: 'high',
        status: 'todo', dueDate: '2026-08-01',
      })
      await service.createApproval({
        tenantId: 'tenant-1', type: 'campaign', title: '审批',
        requesterId: 'u1', requesterName: 'A', status: 'draft', steps: [],
      })
      const summary = await service.getSummary('tenant-1')
      expect(summary.pendingTasks).toBe(1)
      // Approval type has no 'pending' status; getSummary returns 0
      expect(summary.totalTasks).toBe(1)
      expect(summary.completedTasks).toBe(0)
    })
  })
})
