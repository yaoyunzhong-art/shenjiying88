import { Injectable, NotFoundException } from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import type { WorkspaceLayout, WorkspaceTask, ApprovalFlow, BrandCalendarEvent, QuickAction, RecentActivity, WorkspaceSummary } from './brand-workspace.entity'

@Injectable()
export class BrandWorkspaceService {
  private layouts = new Map<string, WorkspaceLayout>()
  private tasks = new Map<string, WorkspaceTask>()
  private approvals = new Map<string, ApprovalFlow>()
  private events = new Map<string, BrandCalendarEvent>()
  private actions = new Map<string, QuickAction>()

  // ── 工作台布局 ───────────────────────────────────────────────────────────

  async getLayout(tenantId: string): Promise<WorkspaceLayout> {
    const existing = Array.from(this.layouts.values()).find(l => l.tenantId === tenantId)
    if (existing) return existing
    const layout: WorkspaceLayout = {
      workspaceId: `ws-${randomUUID()}`, tenantId, name: '默认工作台',
      grid: [
        { widgetId: 'w1', widgetType: 'kpi_overview', position: { x:0,y:0,w:6,h:4 }, config: {}, visible: true },
        { widgetId: 'w2', widgetType: 'pending_approval', position: { x:0,y:4,w:4,h:4 }, config: {}, visible: true },
        { widgetId: 'w3', widgetType: 'brand_health', position: { x:4,y:4,w:4,h:4 }, config: {}, visible: true },
        { widgetId: 'w4', widgetType: 'recent_activity', position: { x:0,y:8,w:6,h:4 }, config: {}, visible: true },
        { widgetId: 'w5', widgetType: 'quick_actions', position: { x:6,y:0,w:2,h:6 }, config: {}, visible: true },
        { widgetId: 'w6', widgetType: 'upcoming_schedule', position: { x:6,y:6,w:2,h:6 }, config: {}, visible: true },
      ],
      theme: 'auto', createdAt: new Date(), updatedAt: new Date(),
    }
    this.layouts.set(layout.workspaceId, layout)
    return layout
  }

  async updateLayout(tenantId: string, updates: Partial<WorkspaceLayout>): Promise<WorkspaceLayout> {
    const layout = await this.getLayout(tenantId)
    const updated = { ...layout, ...updates, updatedAt: new Date() }
    this.layouts.set(layout.workspaceId, updated)
    return updated
  }

  // ── 工作台任务 ───────────────────────────────────────────────────────────

  async createTask(data: Omit<WorkspaceTask, 'id' | 'createdAt' | 'updatedAt'>): Promise<WorkspaceTask> {
    const task: WorkspaceTask = { id: `t-${randomUUID()}`, ...data, createdAt: new Date(), updatedAt: new Date() }
    this.tasks.set(task.id, task)
    return task
  }

  async getTasks(tenantId: string, filter?: { status?: string; assignee?: string }): Promise<WorkspaceTask[]> {
    return Array.from(this.tasks.values()).filter(t => {
      if (t.tenantId !== tenantId) return false
      if (filter?.status && t.status !== filter.status) return false
      if (filter?.assignee && t.assignee !== filter.assignee) return false
      return true
    })
  }

  async updateTaskStatus(id: string, status: string): Promise<WorkspaceTask> {
    const task = this.tasks.get(id)
    if (!task) throw new NotFoundException(`Task ${id} not found`)
    const updated = { ...task, status: status as any, updatedAt: new Date() }
    this.tasks.set(id, updated)
    return updated
  }

  // ── 审批流程 ─────────────────────────────────────────────────────────────

  async createApproval(data: Omit<ApprovalFlow, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApprovalFlow> {
    const flow: ApprovalFlow = { id: `ap-${randomUUID()}`, ...data, createdAt: new Date(), updatedAt: new Date() }
    this.approvals.set(flow.id, flow)
    return flow
  }

  async getApprovals(tenantId: string, filter?: { status?: string }): Promise<ApprovalFlow[]> {
    return Array.from(this.approvals.values()).filter(a => {
      if (a.tenantId !== tenantId) return false
      if (filter?.status && a.status !== filter.status) return false
      return true
    })
  }

  async approveFlow(id: string, approverId: string, comment?: string): Promise<ApprovalFlow> {
    const flow = this.approvals.get(id)
    if (!flow) throw new NotFoundException(`Approval ${id} not found`)
    const updated = { ...flow, status: 'approved' as const, approverId, comment, approvedAt: new Date(), updatedAt: new Date() }
    this.approvals.set(id, updated)
    return updated
  }

  // ── 日历事件 ─────────────────────────────────────────────────────────────

  async createEvent(data: Omit<BrandCalendarEvent, 'id'>): Promise<BrandCalendarEvent> {
    const event: BrandCalendarEvent = { id: `ev-${randomUUID()}`, ...data }
    this.events.set(event.id, event)
    return event
  }

  async getEvents(tenantId: string, startDate?: string, endDate?: string): Promise<BrandCalendarEvent[]> {
    return Array.from(this.events.values()).filter(e => {
      if (e.tenantId !== tenantId) return false
      if (startDate && e.startDate < startDate) return false
      if (endDate && e.endDate > endDate) return false
      return true
    })
  }

  // ── 快捷操作 ─────────────────────────────────────────────────────────────

  async getQuickActions(tenantId: string): Promise<QuickAction[]> {
    return Array.from(this.actions.values()).filter(a => a.tenantId === tenantId)
  }

  async registerAction(data: Omit<QuickAction, 'id'>): Promise<QuickAction> {
    const action: QuickAction = { id: `qa-${randomUUID()}`, ...data }
    this.actions.set(action.id, action)
    return action
  }

  // ── 工作台汇总 ───────────────────────────────────────────────────────────

  async getSummary(tenantId: string): Promise<WorkspaceSummary> {
    const tasks = await this.getTasks(tenantId)
    const approvals = await this.getApprovals(tenantId, { status: 'pending' })
    const events = await this.getEvents(tenantId)
    return {
      tenantId,
      pendingTasks: tasks.filter(t => t.status === 'todo' || t.status === 'in_progress').length,
      pendingApprovals: approvals.length,
      upcomingEvents: events.filter(e => e.startDate >= new Date().toISOString().slice(0, 10)).length,
      totalTasks: tasks.length,
      completedTasks: tasks.filter(t => t.status === 'done').length,
      generatedAt: new Date(),
    }
  }
}
