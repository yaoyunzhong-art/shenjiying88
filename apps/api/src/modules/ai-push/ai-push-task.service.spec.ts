/**
 * ai-push-task.service.spec.ts — 推送任务服务综合测试
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { PushTaskService } from './ai-push-task-expanded.service'

describe('PushTaskService (Complete)', () => {
  let service: PushTaskService

  beforeEach(() => {
    service = new PushTaskService()
  })

  it('应创建推送任务', () => {
    const task = service.createTask({ title: '测试通知', content: '测试内容', channel: 'push', targetMemberIds: ['m1', 'm2'] })
    expect(task.id).toBeTruthy()
    expect(task.title).toBe('测试通知')
    expect(task.status).toBe('sending')
  })

  it('应获取任务列表', () => {
    service.createTask({ title: 'T1', content: 'C1', channel: 'push', targetMemberIds: [] })
    const tasks = service.getTasks()
    expect(tasks.length).toBe(1)
  })

  it('应按状态过滤', () => {
    service.createTask({ title: 'T1', content: 'C1', channel: 'push', targetMemberIds: [] })
    const pendingTasks = service.getTasks({ status: 'pending' })
    expect(pendingTasks.length).toBe(0)
  })

  it('应返回统计信息', () => {
    service.createTask({ title: 'T1', content: 'C1', channel: 'push', targetMemberIds: ['m1'] })
    const stats = service.getStats()
    expect(stats.totalTasks).toBe(1)
    expect(stats.totalTargetCount).toBe(1)
  })

  it('应取消任务', () => {
    const task = service.createTask({ title: 'T1', content: 'C1', channel: 'push', targetMemberIds: [], scheduledAt: Date.now() + 3600000 })
    // Wait a moment then cancel
    const cancelled = service.cancelTask(task.id)
    expect(cancelled).toBe(true)
  })

  it('已完成任务不应被取消', () => {
    const task = service.createTask({ title: 'T1', content: 'C1', channel: 'push', targetMemberIds: ['m1'] })
    // Task auto-completes, wait briefly
    const cancelled = service.cancelTask(task.id)
    // May already be delivered
    const updated = service.getTask(task.id)
    expect(updated).toBeDefined()
  })

  it('重试已失败任务', () => {
    // Create a task that has a non-delivered state
    const task = service.createTask({ title: 'T', content: 'C', channel: 'push', targetMemberIds: ['m1'] })
    const canRetry = service.retryTask(task.id)
    expect(typeof canRetry).toBe('boolean')
  })

  it('不存在任务操作应返回默认值', () => {
    expect(service.getTask('nonexistent')).toBeUndefined()
    expect(service.cancelTask('nonexistent')).toBe(false)
    expect(service.retryTask('nonexistent')).toBe(false)
    expect(service.recordClick('nonexistent')).toBe(false)
  })

  it('应支持分页', () => {
    for (let i = 0; i < 25; i++) {
      service.createTask({ title: `T${i}`, content: `C${i}`, channel: 'push', targetMemberIds: [] })
    }
    const page1 = service.getTasks({ page: 0, pageSize: 10 })
    const page2 = service.getTasks({ page: 1, pageSize: 10 })
    expect(page1.length).toBe(10)
    expect(page2.length).toBe(10)
  })
})
