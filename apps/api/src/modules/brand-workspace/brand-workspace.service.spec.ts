/**
 * 圈梁五道箍
 * brand-workspace.service.spec.ts — 品牌工作台 Service 单元测试
 *
 * 覆盖: 工作台布局 / 任务 / 审批流 / 日历事件 / 快捷操作 / 工作台汇总
 * 规则: 无 describe.skip · 无 it.only · beforeEach 隔离
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { BrandWorkspaceService } from './brand-workspace.service'

describe('BrandWorkspaceService', () => {
  let service: BrandWorkspaceService

  beforeEach(() => {
    service = new BrandWorkspaceService()
  })

  // ── 工作台布局 ──

  describe('getLayout', () => {
    it('正例: 返回新租户默认布局', async () => {
      const layout = await service.getLayout('tenant-1')
      expect(layout.tenantId).toBe('tenant-1')
      expect(layout.name).toBe('默认工作台')
      expect(layout.grid).toHaveLength(6)
      expect(layout.theme).toBe('auto')
    })

    it('正例: 不同租户返回各自独立布局', async () => {
      const layoutA = await service.getLayout('tenant-a')
      const layoutB = await service.getLayout('tenant-b')
      expect(layoutA.workspaceId).not.toBe(layoutB.workspaceId)
      expect(layoutA.tenantId).toBe('tenant-a')
      expect(layoutB.tenantId).toBe('tenant-b')
    })

    it('正例: 第二次调用返回缓存的上次布局', async () => {
      const first = await service.getLayout('tenant-1')
      const second = await service.getLayout('tenant-1')
      expect(second.workspaceId).toBe(first.workspaceId)
    })
  })

  describe('updateLayout', () => {
    it('正例: 更新布局属性（名称与主题）', async () => {
      const updated = await service.updateLayout('tenant-1', { name: '自定义工作台', theme: 'dark' })
      expect(updated.name).toBe('自定义工作台')
      expect(updated.theme).toBe('dark')
    })

    it('正例: 仅更新名称时不影响其他属性', async () => {
      await service.updateLayout('tenant-1', { name: '工作台-V2' })
      const layout = await service.getLayout('tenant-1')
      expect(layout.name).toBe('工作台-V2')
      expect(layout.theme).toBe('auto') // 默认值不变
      expect(layout.grid).toHaveLength(6)
    })
  })

  // ── 工作台任务 ──

  describe('createTask / getTasks / updateTaskStatus', () => {
    it('正例: 创建并获取任务', async () => {
      const task = await service.createTask({
        tenantId: 'tenant-1', title: '测试任务', description: '测试描述',
        assignee: 'user-1', priority: 'high', status: 'todo', dueDate: '2026-08-01',
      })
      expect(task.id).toMatch(/^t-/)
      expect(task.title).toBe('测试任务')
      const tasks = await service.getTasks('tenant-1')
      expect(tasks).toHaveLength(1)
    })

    it('正例: 按状态筛选', async () => {
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

    it('正例: 按负责人筛选', async () => {
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

    it('正例: 组合筛选（状态+负责人）', async () => {
      await service.createTask({
        tenantId: 'tenant-1', title: '待办A', assignee: 'user-a', priority: 'high',
        status: 'todo', dueDate: '2026-08-01',
      })
      await service.createTask({
        tenantId: 'tenant-1', title: '完成A', assignee: 'user-a', priority: 'low',
        status: 'done', dueDate: '2026-08-01',
      })
      const result = await service.getTasks('tenant-1', { status: 'todo', assignee: 'user-a' })
      expect(result).toHaveLength(1)
      expect(result[0].title).toBe('待办A')
    })

    it('边界: 无任务的租户返回空数组', async () => {
      const tasks = await service.getTasks('tenant-empty')
      expect(tasks).toHaveLength(0)
    })

    it('正例: updateTaskStatus 更新状态', async () => {
      const task = await service.createTask({
        tenantId: 'tenant-1', title: '可更新', assignee: 'u1', priority: 'high',
        status: 'todo', dueDate: '2026-08-01',
      })
      const updated = await service.updateTaskStatus(task.id, 'done')
      expect(updated.status).toBe('done')
    })

    it('反例: updateTaskStatus 抛出不存在异常', async () => {
      await expect(service.updateTaskStatus('nonexistent', 'done')).rejects.toThrow('Task')
    })
  })

  // ── 审批流程 ──

  describe('createApproval / getApprovals / approveFlow', () => {
    it('正例: 创建并检索审批流', async () => {
      const flow = await service.createApproval({
        tenantId: 'tenant-1', type: 'campaign', title: '审批测试',
        requesterId: 'user-1', requesterName: '张三',
        status: 'draft', steps: [],
      })
      expect(flow.id).toMatch(/^ap-/)
      const approvals = await service.getApprovals('tenant-1')
      expect(approvals).toHaveLength(1)
    })

    it('正例: 按状态筛选审批流', async () => {
      await service.createApproval({
        tenantId: 'tenant-1', type: 'campaign', title: '草稿',
        requesterId: 'u1', requesterName: 'A', status: 'draft', steps: [],
      })
      await service.createApproval({
        tenantId: 'tenant-1', type: 'campaign', title: '进行中',
        requesterId: 'u1', requesterName: 'A', status: 'in_progress', steps: [],
      })
      const drafts = await service.getApprovals('tenant-1', { status: 'draft' })
      expect(drafts).toHaveLength(1)
    })

    it('边界: 无审批的租户返回空数组', async () => {
      const approvals = await service.getApprovals('tenant-empty')
      expect(approvals).toHaveLength(0)
    })

    it('正例: approveFlow 变更为已批准', async () => {
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

    it('反例: approveFlow 抛出不存在异常', async () => {
      await expect(service.approveFlow('nope', 'x')).rejects.toThrow('Approval')
    })
  })

  // ── 日历事件 ──

  describe('createEvent / getEvents', () => {
    it('正例: 创建并检索事件', async () => {
      const event = await service.createEvent({
        tenantId: 'tenant-1', title: '品牌活动', eventType: 'campaign_launch',
        startDate: '2026-08-01', endDate: '2026-08-03', status: 'scheduled',
        allDay: false,
      })
      expect(event.id).toMatch(/^ev-/)
      const events = await service.getEvents('tenant-1')
      expect(events).toHaveLength(1)
    })

    it('正例: 全日期事件', async () => {
      const event = await service.createEvent({
        tenantId: 'tenant-1', title: '全天活动', eventType: 'meeting',
        startDate: '2026-08-01', endDate: '2026-08-01', status: 'scheduled',
        allDay: true,
      })
      expect(event.allDay).toBe(true)
    })

    it('正例: 按日期范围筛选', async () => {
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

    it('正例: 仅指定起始日期筛选', async () => {
      await service.createEvent({
        tenantId: 'tenant-1', title: '早期', eventType: 'campaign_launch',
        startDate: '2026-07-01', endDate: '2026-07-03', status: 'scheduled', allDay: false,
      })
      await service.createEvent({
        tenantId: 'tenant-1', title: '晚期', eventType: 'campaign_launch',
        startDate: '2026-08-15', endDate: '2026-08-20', status: 'scheduled', allDay: false,
      })
      const afterAug = await service.getEvents('tenant-1', '2026-08-01')
      expect(afterAug).toHaveLength(1)
      expect(afterAug[0].title).toBe('晚期')
    })

    it('边界: 无事件的租户返回空数组', async () => {
      const events = await service.getEvents('tenant-empty')
      expect(events).toHaveLength(0)
    })
  })

  // ── 快捷操作 ──

  describe('registerAction / getQuickActions', () => {
    it('正例: 注册并返回快捷操作', async () => {
      const action = await service.registerAction({
        tenantId: 'tenant-1', label: '新建活动', icon: 'add',
        actionType: 'create_campaign', config: {}, sortOrder: 1,
      })
      expect(action.id).toMatch(/^qa-/)
      const actions = await service.getQuickActions('tenant-1')
      expect(actions).toHaveLength(1)
    })

    it('正例: 注册多个操作并按租户隔离', async () => {
      await service.registerAction({
        tenantId: 'tenant-1', label: 'A', icon: 'a',
        actionType: 'create_campaign', config: {}, sortOrder: 1,
      })
      await service.registerAction({
        tenantId: 'tenant-2', label: 'B', icon: 'b',
        actionType: 'create_task', config: {}, sortOrder: 2,
      })
      const actions1 = await service.getQuickActions('tenant-1')
      expect(actions1).toHaveLength(1)
      expect(actions1[0].label).toBe('A')
    })

    it('边界: 无操作的租户返回空数组', async () => {
      const actions = await service.getQuickActions('tenant-empty')
      expect(actions).toHaveLength(0)
    })
  })

  // ── 工作台汇总 ──

  describe('getSummary', () => {
    it('正例: 初始状态返回零计数', async () => {
      const summary = await service.getSummary('tenant-1')
      expect(summary.tenantId).toBe('tenant-1')
      expect(summary.pendingTasks).toBe(0)
      expect(summary.pendingApprovals).toBe(0)
    })

    it('正例: 反映创建的任务和审批', async () => {
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
      expect(summary.totalTasks).toBe(1)
      expect(summary.completedTasks).toBe(0)
    })

    it('正例: 计算已完成任务', async () => {
      await service.createTask({
        tenantId: 'tenant-1', title: '已完成', assignee: 'u1', priority: 'low',
        status: 'done', dueDate: '2026-08-01',
      })
      const summary = await service.getSummary('tenant-1')
      expect(summary.completedTasks).toBe(1)
      expect(summary.pendingTasks).toBe(0)
    })
  })
})
