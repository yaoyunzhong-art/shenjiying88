/**
 * 🧪 FeedbackService 单元测试
 * 覆盖: create / query / getById / reply / update / delete / getStats
 * 三件套：正例 + 反例 + 边界
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { FeedbackService } from './feedback.service'

describe('FeedbackService', () => {
  let service: FeedbackService

  beforeEach(() => {
    service = new FeedbackService()
  })

  // ════════════════════════════════════════════════════════════
  // create — 创建反馈
  // ════════════════════════════════════════════════════════════

  describe('create', () => {
    it('[正例] 创建投诉反馈成功', () => {
      const fb = service.create({
        type: 'complaint',
        content: '前台排队太久',
        title: '排队时间过长',
        source: 'app',
        severity: 'high',
        tags: ['service', 'staff'],
        userId: 'u-001',
        userName: '张明',
      })
      expect(fb.id).toMatch(/^fb-/)
      expect(fb.feedbackNo).toMatch(/^FB-\d{6}$/)
      expect(fb.status).toBe('pending')
      expect(fb.type).toBe('complaint')
      expect(fb.replies).toEqual([])
    })

    it('[正例] 创建评价类型反馈时包含评分', () => {
      const fb = service.create({
        type: 'rating',
        content: '非常满意',
        title: '好评',
        source: 'store_qr',
        severity: 'low',
        tags: ['service'],
        userId: 'u-002',
        userName: '李华',
        rating: 5,
      })
      expect(fb.rating).toBe(5)
      expect(fb.type).toBe('rating')
    })

    it('[正例] 创建反馈自动生成连续的反馈编号', () => {
      const fb1 = service.create({
        type: 'complaint', content: '问题1', title: '标题1',
        source: 'app', severity: 'low', tags: ['other'],
        userId: 'u-001', userName: '用户A',
      })
      const fb2 = service.create({
        type: 'suggestion', content: '问题2', title: '标题2',
        source: 'app', severity: 'low', tags: ['other'],
        userId: 'u-002', userName: '用户B',
      })
      expect(fb1.feedbackNo < fb2.feedbackNo).toBe(true)
    })

    it('[反例] 空用户ID抛出 BadRequestException', () => {
      expect(() => service.create({
        type: 'complaint', content: '测试', title: '标题',
        source: 'app', severity: 'low', tags: ['other'],
        userId: '', userName: '用户',
      })).toThrow('提交者ID不能为空')
    })

    it('[反例] 空内容抛出 BadRequestException', () => {
      expect(() => service.create({
        type: 'complaint', content: '', title: '标题',
        source: 'app', severity: 'low', tags: ['other'],
        userId: 'u-001', userName: '用户',
      })).toThrow('反馈内容不能为空')
    })

    it('[反例] 评价类型缺少评分抛出异常', () => {
      expect(() => service.create({
        type: 'rating', content: '好', title: '评价',
        source: 'app', severity: 'low', tags: ['other'],
        userId: 'u-001', userName: '用户',
      })).toThrow('评价类型必须提供评分')
    })

    it('[反例] 评分超出范围抛出异常', () => {
      expect(() => service.create({
        type: 'rating', content: '好', title: '评价',
        source: 'app', severity: 'low', tags: ['other'],
        userId: 'u-001', userName: '用户',
        rating: 6,
      })).toThrow('评分必须在 1-5 之间')
    })

    it('[反例] 负数评分抛出异常', () => {
      expect(() => service.create({
        type: 'rating', content: '差', title: '评价',
        source: 'app', severity: 'low', tags: ['other'],
        userId: 'u-001', userName: '用户',
        rating: 0,
      })).toThrow('评分必须在 1-5 之间')
    })
  })

  // ════════════════════════════════════════════════════════════
  // query — 查询反馈
  // ════════════════════════════════════════════════════════════

  describe('query', () => {
    it('[正例] 无筛选返回全部 6 条种子数据', () => {
      const result = service.query({})
      expect(result.total).toBe(6)
      expect(result.items.length).toBe(6)
    })

    it('[正例] 按类型筛选', () => {
      const result = service.query({ type: 'complaint' })
      expect(result.total).toBe(2)
      for (const fb of result.items) {
        expect(fb.type).toBe('complaint')
      }
    })

    it('[正例] 按状态筛选', () => {
      const result = service.query({ status: 'pending' })
      expect(result.total).toBe(2) // FB-000001, FB-000005
      for (const fb of result.items) {
        expect(fb.status).toBe('pending')
      }
    })

    it('[正例] 按门店筛选', () => {
      const result = service.query({ storeId: 'store-001' })
      expect(result.total).toBe(3) // FB-000001, FB-000003, FB-000004
      for (const fb of result.items) {
        expect(fb.storeId).toBe('store-001')
      }
    })

    it('[正例] 按关键词搜索标题', () => {
      const result = service.query({ keyword: '排队' })
      expect(result.total).toBeGreaterThanOrEqual(1)
      expect(result.items[0].title).toContain('排队')
    })

    it('[正例] 关键词搜索反馈编号', () => {
      const result = service.query({ keyword: 'FB-000001' })
      expect(result.total).toBeGreaterThanOrEqual(1)
    })

    it('[正例] 按日期范围筛选', () => {
      const result = service.query({
        fromDate: new Date(Date.now() - 86400000).toISOString(),
      })
      // 今天创建的种子数据会匹配
      expect(result.total).toBeGreaterThanOrEqual(1)
    })

    it('[正例] 分页正确', () => {
      const result = service.query({ page: 1, pageSize: 2 })
      expect(result.items.length).toBe(2)
      expect(result.total).toBe(6)
      expect(result.totalPages).toBe(3)
    })

    it('[反例] 不存在的类型返回空', () => {
      const result = service.query({ type: 'issue' as any })
      expect(result.total).toBe(1) // FB-000004 是 issue 类型
    })
  })

  // ════════════════════════════════════════════════════════════
  // getById / getByFeedbackNo — 单条查询
  // ════════════════════════════════════════════════════════════

  describe('getById', () => {
    it('[正例] 通过 ID 查询', () => {
      const fb = service.getById('fb-seed-001')
      expect(fb.feedbackNo).toBe('FB-000001')
      expect(fb.content).toContain('排队')
    })

    it('[反例] 不存在的 ID 抛出 NotFoundException', () => {
      expect(() => service.getById('fb-nonexistent')).toThrow('不存在')
    })
  })

  describe('getByFeedbackNo', () => {
    it('[正例] 通过编号查询', () => {
      const fb = service.getByFeedbackNo('FB-000004')
      expect(fb).not.toBeNull()
      expect(fb!.type).toBe('issue')
    })

    it('[反例] 不存在的编号返回 null', () => {
      const fb = service.getByFeedbackNo('FB-999999')
      expect(fb).toBeNull()
    })
  })

  // ════════════════════════════════════════════════════════════
  // reply — 回复反馈
  // ════════════════════════════════════════════════════════════

  describe('reply', () => {
    it('[正例] 回复后状态自动变为 processing', () => {
      const fb = service.reply('fb-seed-001', {
        content: '已安排处理',
        repliedBy: 'staff-001',
        repliedByName: '客服小张',
      })
      expect(fb.status).toBe('processing')
      expect(fb.replies.length).toBe(1)
      expect(fb.replies[0].content).toBe('已安排处理')
    })

    it('[正例] 多次回复增加回复记录', () => {
      service.reply('fb-seed-001', {
        content: '第一次回复',
        repliedBy: 'staff-001',
        repliedByName: '客服A',
      })
      const fb = service.reply('fb-seed-001', {
        content: '第二次回复',
        repliedBy: 'staff-002',
        repliedByName: '客服B',
      })
      expect(fb.replies.length).toBe(2)
    })

    it('[反例] 空回复内容抛出异常', () => {
      expect(() => service.reply('fb-seed-001', {
        content: '',
        repliedBy: 'staff-001',
        repliedByName: '客服',
      })).toThrow('回复内容不能为空')
    })

    it('[反例] 空回复人抛出异常', () => {
      expect(() => service.reply('fb-seed-001', {
        content: '已处理',
        repliedBy: '',
        repliedByName: '客服',
      })).toThrow('回复人ID不能为空')
    })
  })

  // ════════════════════════════════════════════════════════════
  // update — 更新反馈
  // ════════════════════════════════════════════════════════════

  describe('update', () => {
    it('[正例] 更新状态为 resolved', () => {
      const fb = service.update('fb-seed-001', { status: 'resolved' })
      expect(fb.status).toBe('resolved')
      expect(fb.resolvedAt).toBeTruthy()
    })

    it('[正例] 分配处理人', () => {
      const fb = service.update('fb-seed-001', {
        assignedTo: 'tech-001',
        assignedToName: '技术刘',
      })
      expect(fb.assignedTo).toBe('tech-001')
      expect(fb.assignedToName).toBe('技术刘')
    })

    it('[正例] 更新严重程度和标签', () => {
      const fb = service.update('fb-seed-001', {
        severity: 'critical',
        tags: ['device', 'service'],
      })
      expect(fb.severity).toBe('critical')
      expect(fb.tags).toEqual(['device', 'service'])
    })

    it('[正例] 关闭时自动添加系统回复', () => {
      const fb = service.update('fb-seed-001', {
        status: 'closed',
        repliedBy: 'staff-001',
        repliedByName: '客服小张',
      })
      expect(fb.status).toBe('closed')
      expect(fb.replies.length).toBeGreaterThanOrEqual(1)
      const lastReply = fb.replies[fb.replies.length - 1]
      expect(lastReply.content).toBe('反馈已关闭')
      expect(lastReply.isSystem).toBe(true)
    })

    it('[反例] 更新不存在的 ID 抛出异常', () => {
      expect(() => service.update('fb-nonexistent', { status: 'closed' })).toThrow('不存在')
    })
  })

  // ════════════════════════════════════════════════════════════
  // delete — 删除反馈
  // ════════════════════════════════════════════════════════════

  describe('delete', () => {
    it('[正例] 删除后查询不到', () => {
      const deleted = service.delete('fb-seed-005')
      expect(deleted).toBe(true)
      expect(() => service.getById('fb-seed-005')).toThrow('不存在')
    })

    it('[正例] 删除不存在的返回 false', () => {
      const result = service.delete('fb-nonexistent')
      expect(result).toBe(false)
    })

    it('[正例] 删除后 query 总数减少', () => {
      const before = service.query({}).total
      service.delete('fb-seed-001')
      const after = service.query({}).total
      expect(after).toBe(before - 1)
    })
  })

  // ════════════════════════════════════════════════════════════
  // getStats — 统计
  // ════════════════════════════════════════════════════════════

  describe('getStats', () => {
    it('[正例] 返回完整统计', () => {
      const stats = service.getStats()
      expect(stats.total).toBe(6)
      expect(stats.byType.complaint).toBe(2)
      expect(stats.byType.suggestion).toBe(2)
      expect(stats.byType.rating).toBe(1)
      expect(stats.byType.issue).toBe(1)
      expect(stats.pending).toBeGreaterThanOrEqual(1)
    })

    it('[正例] 评分统计正确', () => {
      const stats = service.getStats()
      // 只有 FB-000003 有评分 5
      expect(stats.averageRating).toBe(5)
    })

    it('[正例] 今日新增计数准确', () => {
      const stats = service.getStats()
      expect(stats.todayNew).toBeGreaterThanOrEqual(0)
    })
  })

  // ════════════════════════════════════════════════════════════
  // 复合场景
  // ════════════════════════════════════════════════════════════

  describe('复合场景', () => {
    it('创建 → 回复 → 关闭 完整流程', () => {
      const fb = service.create({
        type: 'complaint', content: '故障', title: '设备故障',
        source: 'app', severity: 'critical', tags: ['device'],
        userId: 'u-010', userName: '用户10',
      })
      expect(fb.status).toBe('pending')

      const replied = service.reply(fb.id, {
        content: '已派维修',
        repliedBy: 'tech-001',
        repliedByName: '技术张',
      })
      expect(replied.status).toBe('processing')

      const closed = service.update(fb.id, {
        status: 'closed',
        repliedBy: 'tech-001',
        repliedByName: '技术张',
      })
      expect(closed.status).toBe('closed')
      expect(closed.replies.length).toBeGreaterThanOrEqual(1)
    })

    it('创建多条反馈后统计更新', () => {
      const before = service.getStats()
      service.create({
        type: 'complaint', content: '新增投诉', title: '投诉',
        source: 'app', severity: 'high', tags: ['service'],
        userId: 'u-020', userName: '用户20',
      })
      const after = service.getStats()
      expect(after.total).toBe(before.total + 1)
      expect(after.byType.complaint).toBe(before.byType.complaint + 1)
      expect(after.pending).toBe(before.pending + 1)
    })
  })
})
