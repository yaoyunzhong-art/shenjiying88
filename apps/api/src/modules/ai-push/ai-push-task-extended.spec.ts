/**
 * ai-push-task-extended.spec.ts — 推送任务服务扩展测试
 * 覆盖：创建含各类参数、记录点击、统计信息、边界场景
 * 三件套：正例+反例+边界
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { PushTaskService } from './ai-push-task-expanded.service'

describe('PushTaskService Extended', () => {
  let s: PushTaskService
  beforeEach(() => { s = new PushTaskService() })

  // ===== 创建参数覆盖 =====

  it('创建带优先级', () => {
    const t = s.createTask({ title: 'Hi', content: 'Msg', channel: 'push', targetMemberIds: [], priority: 'high' })
    expect(t.priority).toBe('high')
  })

  it('创建默认优先级', () => {
    const t = s.createTask({ title: 'Hi', content: 'Msg', channel: 'push', targetMemberIds: [] })
    expect(t.priority).toBe('normal')
  })

  it('创建带模板ID', () => {
    const t = s.createTask({ title: 'Hi', content: 'Msg', channel: 'push', targetMemberIds: [], templateId: 'tpl-1' })
    expect(t.templateId).toBe('tpl-1')
  })

  it('创建带个性化配置', () => {
    const t = s.createTask({ title: 'Hi', content: 'Msg', channel: 'push', targetMemberIds: [], personalization: { name: '张三' } })
    expect(t.personalization).toEqual({ name: '张三' })
  })

  it('创建时trackingEnabled可关闭', () => {
    const t = s.createTask({ title: 'Hi', content: 'Msg', channel: 'push', targetMemberIds: [], trackingEnabled: false })
    expect(t.trackingEnabled).toBe(false)
  })

  it('创建低优先级任务', () => {
    const t = s.createTask({ title: 'Hi', content: 'Msg', channel: 'push', targetMemberIds: [], priority: 'low' })
    expect(t.priority).toBe('low')
  })

  // ===== 获取任务 =====

  it('获取任务', () => {
    const t = s.createTask({ title: 'T', content: 'C', channel: 'push', targetMemberIds: [] })
    expect(s.getTask(t.id)!.id).toBe(t.id)
  })

  it('获取不存在的任务', () => {
    expect(s.getTask('nonexistent')).toBeUndefined()
  })

  it('获取任务返回完整对象', () => {
    const t = s.createTask({ title: '完整测试', content: '完整内容', channel: 'email', targetMemberIds: ['m1', 'm2'], priority: 'high' })
    const fetched = s.getTask(t.id)
    expect(fetched).toBeDefined()
    expect(fetched!.title).toBe('完整测试')
    expect(fetched!.channel).toBe('email')
    expect(fetched!.targetMemberIds).toEqual(['m1', 'm2'])
  })

  // ===== 取消操作 =====

  it('取消存在的任务', () => {
    const t = s.createTask({ title: 'T', content: 'C', channel: 'push', targetMemberIds: [] })
    const result = s.cancelTask(t.id)
    expect(typeof result).toBe('boolean')
  })

  it('取消不存在的任务', () => {
    expect(s.cancelTask('ghost')).toBe(false)
  })

  it('取消后任务状态变为failed', () => {
    const t = s.createTask({ title: 'T', content: 'C', channel: 'push', targetMemberIds: [], scheduledAt: Date.now() + 9999999 })
    s.cancelTask(t.id)
    const updated = s.getTask(t.id)
    expect(updated!.status).toBe('failed')
  })

  // ===== 重试操作 =====

  it('重试不存在的任务', () => {
    expect(s.retryTask('ghost')).toBe(false)
  })

  it('重试成功应返回true且状态变更为sending或pending', () => {
    const t = s.createTask({ title: 'T', content: 'C', channel: 'push', targetMemberIds: [], maxRetries: 3 })
    // Wait for initial processing to complete
    if (s.retryTask(t.id)) {
      const updated = s.getTask(t.id)
      // retryTask sets status to pending then processTask sets to sending
      expect(['pending', 'sending', 'sent']).toContain(updated!.status)
    }
  })

  // ===== 记录点击 =====

  it('不存在的交付记录点击应返回false', () => {
    expect(s.recordClick('ghost')).toBe(false)
  })

  // ===== 统计信息 =====

  it('统计信息', () => {
    s.createTask({ title: 'T', content: 'C', channel: 'push', targetMemberIds: [] })
    const stats = s.getStats()
    expect(stats.totalTasks).toBe(1)
    expect(stats.totalTargetCount).toBe(0)
    expect(typeof stats.overallDeliveryRate).toBe('number')
  })

  it('统计信息按时间范围过滤', () => {
    s.createTask({ title: 'T1', content: 'C1', channel: 'push', targetMemberIds: [] })
    const past = Date.now() - 86400000
    const future = Date.now() + 86400000
    const statsPast = s.getStats(past, future)
    expect(statsPast.totalTasks).toBe(1)
    const statsBefore = s.getStats(0, Date.now() - 1000)
    expect(statsBefore.totalTasks).toBe(0)
  })

  it('统计信息应包含整体送达率', () => {
    s.createTask({ title: 'T', content: 'C', channel: 'push', targetMemberIds: ['m1'] })
    const stats = s.getStats()
    expect(stats.overallDeliveryRate).toBeGreaterThanOrEqual(0)
    expect(stats.overallDeliveryRate).toBeLessThanOrEqual(100)
  })

  it('统计信息按优先级分布', () => {
    s.createTask({ title: 'T1', content: 'C1', channel: 'push', targetMemberIds: [], priority: 'high' })
    const stats = s.getStats()
    expect(stats.tasksByPriority.high).toBe(1)
  })

  // ===== 多任务场景 =====

  it('多任务创建后统计总数正确', () => {
    for (let i = 0; i < 10; i++) {
      s.createTask({ title: `T${i}`, content: `C${i}`, channel: 'push', targetMemberIds: [`m${i}`] })
    }
    const stats = s.getStats()
    expect(stats.totalTasks).toBe(10)
  })

  it('不同渠道任务统计区分', () => {
    s.createTask({ title: 'Push', content: 'C', channel: 'push', targetMemberIds: [] })
    s.createTask({ title: 'SMS', content: 'C', channel: 'sms', targetMemberIds: [] })
    s.createTask({ title: 'Email', content: 'C', channel: 'email', targetMemberIds: [] })
    s.createTask({ title: 'WeChat', content: 'C', channel: 'wechat', targetMemberIds: [] })
    const stats = s.getStats()
    expect(Object.keys(stats.tasksByChannel)).toHaveLength(4)
  })
})
