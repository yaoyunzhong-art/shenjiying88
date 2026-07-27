import { describe, it, expect, beforeEach } from 'vitest'
import { PushTaskService } from './ai-push-task.service'

describe('PushTaskService', () => {
  let service: PushTaskService

  beforeEach(() => {
    service = new PushTaskService()
  })

  // ════════════════════════════════════════════════════════════
  // createTask — 创建任务 (6 tests)
  // ════════════════════════════════════════════════════════════

  describe('createTask', () => {
    it('应该创建定时推送任务', () => {
      const futureTime = Date.now() + 86400000
      const task = service.createTask({
        title: '明日促销',
        content: '明天开始大促',
        channel: 'push',
        targetMemberIds: ['m1', 'm2'],
        scheduledAt: futureTime,
      })

      expect(task.id).toMatch(/^task-/)
      expect(task.title).toBe('明日促销')
      expect(task.status).toBe('pending')
      expect(task.scheduledAt).toBe(futureTime)
    })

    it('立即推送任务状态应为 sent', () => {
      const task = service.createTask({
        title: '即时通知',
        content: '立即推送',
        channel: 'sms',
        targetMemberIds: ['m1'],
        scheduledAt: Date.now() - 1000,
      })

      expect(task.status).toBe('sent')
      expect(task.sentAt).toBeDefined()
    })

    it('应自动生成唯一 ID', () => {
      const t1 = service.createTask({ title: 'a', content: 'b', channel: 'push', targetMemberIds: [], scheduledAt: Date.now() })
      const t2 = service.createTask({ title: 'c', content: 'd', channel: 'push', targetMemberIds: [], scheduledAt: Date.now() })
      expect(t1.id).not.toBe(t2.id)
    })

    it('创建 email 渠道任务', () => {
      const task = service.createTask({ title: '邮件', content: '邮件内容', channel: 'email', targetMemberIds: ['m1'], scheduledAt: Date.now() + 3600000 })
      expect(task.channel).toBe('email')
      expect(task.title).toBe('邮件')
    })

    it('创建 wechat 渠道任务', () => {
      const task = service.createTask({ title: '微信', content: '微信内容', channel: 'wechat', targetMemberIds: ['m1'], scheduledAt: Date.now() + 3600000 })
      expect(task.channel).toBe('wechat')
    })

    it('创建 app 渠道任务', () => {
      const task = service.createTask({ title: 'APP', content: 'APP内容', channel: 'app', targetMemberIds: ['m1', 'm2'], scheduledAt: Date.now() + 7200000 })
      expect(task.channel).toBe('app')
      expect(task.targetMemberIds).toHaveLength(2)
    })
  })

  // ════════════════════════════════════════════════════════════
  // getTasks — 任务列表 (6 tests)
  // ════════════════════════════════════════════════════════════

  describe('getTasks', () => {
    it('空任务池应返回空数组', () => {
      const tasks = service.getTasks({ page: 0, pageSize: 20 })
      expect(tasks).toHaveLength(0)
    })

    it('应支持按渠道过滤', () => {
      service.createTask({ title: 'a', content: 'b', channel: 'push', targetMemberIds: [], scheduledAt: Date.now() })
      service.createTask({ title: 'c', content: 'd', channel: 'email', targetMemberIds: [], scheduledAt: Date.now() })

      const filtered = service.getTasks({ channel: 'push', page: 0, pageSize: 20 })
      expect(filtered).toHaveLength(1)
      expect(filtered[0].channel).toBe('push')
    })

    it('应支持按状态过滤', () => {
      service.createTask({ title: '未来', content: 'c', channel: 'push', targetMemberIds: [], scheduledAt: Date.now() + 86400000 })
      service.createTask({ title: '立即', content: 'c', channel: 'push', targetMemberIds: [], scheduledAt: Date.now() - 1000 })

      const pendingTasks = service.getTasks({ status: 'pending', page: 0, pageSize: 20 })
      expect(pendingTasks).toHaveLength(1)
      expect(pendingTasks[0].title).toBe('未来')

      const sentTasks = service.getTasks({ status: 'sent', page: 0, pageSize: 20 })
      expect(sentTasks).toHaveLength(1)
      expect(sentTasks[0].title).toBe('立即')
    })

    it('应支持分页', () => {
      for (let i = 0; i < 10; i++) {
        service.createTask({ title: `t${i}`, content: 'c', channel: 'push', targetMemberIds: [], scheduledAt: Date.now() })
      }

      const page1 = service.getTasks({ page: 0, pageSize: 3 })
      expect(page1).toHaveLength(3)

      const page2 = service.getTasks({ page: 1, pageSize: 3 })
      expect(page2).toHaveLength(3)

      const page4 = service.getTasks({ page: 4, pageSize: 3 })
      expect(page4).toHaveLength(0)
    })

    it('按创建时间降序排列', async () => {
      service.createTask({ title: 'a-older', content: 'c', channel: 'push', targetMemberIds: [], scheduledAt: Date.now() })
      await new Promise(r => setTimeout(r, 10))
      service.createTask({ title: 'b-newer', content: 'c', channel: 'push', targetMemberIds: [], scheduledAt: Date.now() })

      const tasks = service.getTasks({ page: 0, pageSize: 20 })
      expect(tasks).toHaveLength(2)
      expect(tasks[0].title).toBe('b-newer')
      expect(tasks[1].title).toBe('a-older')
    })

    it('未传 channel 返回所有任务', () => {
      service.createTask({ title: 'push', content: 'c', channel: 'push', targetMemberIds: [], scheduledAt: Date.now() })
      service.createTask({ title: 'sms', content: 'c', channel: 'sms', targetMemberIds: [], scheduledAt: Date.now() })
      service.createTask({ title: 'email', content: 'c', channel: 'email', targetMemberIds: [], scheduledAt: Date.now() })

      const all = service.getTasks({ page: 0, pageSize: 20 })
      expect(all).toHaveLength(3)
    })
  })

  // ════════════════════════════════════════════════════════════
  // getTask / getStats — 任务详情 & 统计 (6 tests)
  // ════════════════════════════════════════════════════════════

  describe('getTask & getStats', () => {
    it('getTask 返回已创建的任务', () => {
      const created = service.createTask({ title: '详情', content: '内容', channel: 'push', targetMemberIds: ['m1'], scheduledAt: Date.now() })
      const fetched = service.getTask(created.id)
      expect(fetched).toBeDefined()
      expect(fetched!.id).toBe(created.id)
      expect(fetched!.title).toBe('详情')
    })

    it('getTask 不存在的返回 undefined', () => {
      const fetched = service.getTask('nonexistent-task-id')
      expect(fetched).toBeUndefined()
    })

    it('getStats 无数据时应返回零统计', () => {
      const stats = service.getStats()
      expect(stats.totalTasks).toBe(0)
      expect(stats.totalRecords).toBe(0)
    })

    it('getStats 创建任务后统计正确', () => {
      service.createTask({ title: '未来', content: 'c', channel: 'push', targetMemberIds: ['m1'], scheduledAt: Date.now() + 86400000 })
      service.createTask({ title: '立即', content: 'c', channel: 'push', targetMemberIds: ['m1'], scheduledAt: Date.now() - 1000 })

      const stats = service.getStats()
      expect(stats.totalTasks).toBe(2)
      expect(stats.deliveryRate).toBe(0)
    })

    it('getStats 支持时间窗口过滤', () => {
      const now = Date.now()
      service.createTask({ title: '历史', content: 'c', channel: 'push', targetMemberIds: ['m1'], scheduledAt: now - 86400000 * 2 })

      const statsUpTo = service.getStats(0, now - 86400000)
      expect(statsUpTo.totalTasks).toBe(1)
      expect(statsUpTo.totalRecords).toBe(0)
    })

    it('sendPush 更新任务状态并创建记录', () => {
      const created = service.createTask({ title: '发送测试', content: '内容', channel: 'push', targetMemberIds: ['m1', 'm2', 'm3'], scheduledAt: Date.now() - 1000 })
      expect(created.status).toBe('sent')
      expect(created.sentAt).toBeDefined()

      const stats = service.getStats()
      expect(stats.totalTasks).toBe(1)
    })
  })
})
