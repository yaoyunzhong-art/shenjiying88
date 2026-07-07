import { describe, it, expect, beforeEach } from 'vitest'
import { PushTaskService } from './ai-push-task.service'

describe('PushTaskService', () => {
  let service: PushTaskService

  beforeEach(() => {
    service = new PushTaskService()
  })

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
  })

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
  })

  describe('getStats', () => {
    it('无数据时应返回零统计', () => {
      const stats = service.getStats()
      expect(stats.totalTasks).toBe(0)
      expect(stats.totalRecords).toBe(0)
    })
  })
})
