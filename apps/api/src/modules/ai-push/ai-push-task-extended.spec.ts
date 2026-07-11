/**
 * ai-push-task-extended.spec.ts — 推送任务服务扩展测试
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { PushTaskService } from './ai-push-task-expanded.service'

describe('PushTaskService Extended', () => {
  let s: PushTaskService
  beforeEach(() => { s = new PushTaskService() })

  it('创建带优先级', () => {
    const t = s.createTask({ title: 'Hi', content: 'Msg', channel: 'push', priority: 'high' })
    expect(t.priority).toBe('high')
  })

  it('创建默认优先级', () => {
    const t = s.createTask({ title: 'Hi', content: 'Msg', channel: 'push' })
    expect(t.priority).toBe('normal')
  })

  it('创建带模板ID', () => {
    const t = s.createTask({ title: 'Hi', content: 'Msg', channel: 'push', templateId: 'tpl-1' })
    expect(t.templateId).toBe('tpl-1')
  })

  it('创建带个性化配置', () => {
    const t = s.createTask({ title: 'Hi', content: 'Msg', channel: 'push', personalization: { name: '张三' } })
    expect(t.personalization).toEqual({ name: '张三' })
  })

  it('获取任务', () => {
    const t = s.createTask({ title: 'T', content: 'C', channel: 'push' })
    expect(s.getTask(t.id)!.id).toBe(t.id)
  })

  it('获取不存在的任务', () => {
    expect(s.getTask('nonexistent')).toBeUndefined()
  })

  it('取消存在的任务', () => {
    const t = s.createTask({ title: 'T', content: 'C', channel: 'push' })
    const result = s.cancelTask(t.id)
    expect(typeof result).toBe('boolean')
  })

  it('取消不存在的任务', () => {
    expect(s.cancelTask('ghost')).toBe(false)
  })

  it('重试不存在的任务', () => {
    expect(s.retryTask('ghost')).toBe(false)
  })

  it('统计信息', () => {
    s.createTask({ title: 'T', content: 'C', channel: 'push' })
    const stats = s.getStats()
    expect(stats.totalTasks).toBe(1)
    expect(stats.totalTargetCount).toBe(0)
    expect(typeof stats.overallDeliveryRate).toBe('number')
  })
})
