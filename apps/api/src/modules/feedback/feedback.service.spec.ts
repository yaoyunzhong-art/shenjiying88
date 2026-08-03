/**
 * feedback.service.spec.ts — 用户反馈 Service 单元测试 (V23)
 *
 * 覆盖: create / query / getById / getByFeedbackNo / reply / update / delete / getStats
 * 规则: 无 describe.skip · 无 it.only · beforeEach 隔离
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { FeedbackService } from './feedback.service'
import type { Feedback, FeedbackType, FeedbackStatus, FeedbackSeverity, FeedbackSource, FeedbackTag } from './feedback.entity'

describe('FeedbackService', () => {
  let service: FeedbackService

  beforeEach(() => {
    service = new FeedbackService()
  })

  // ════════════════════════════════════════════
  // create
  // ════════════════════════════════════════════

  describe('create', () => {
    it('正例: 创建投诉反馈成功', () => {
      const fb = service.create({
        type: 'complaint',
        title: '测试投诉',
        content: '服务态度不好',
        source: 'app',
        severity: 'high',
        tags: ['service'],
        userId: 'u-001',
        userName: '测试用户',
      })
      expect(fb.id).toBeTruthy()
      expect(fb.feedbackNo).toMatch(/^FB-\d{6}$/)
      expect(fb.status).toBe('pending')
      expect(fb.type).toBe('complaint')
    })

    it('正例: 创建评分反馈带评分', () => {
      const fb = service.create({
        type: 'rating',
        title: '好评',
        content: '很不错',
        source: 'store_qr',
        severity: 'low',
        tags: ['service', 'environment'],
        userId: 'u-002',
        userName: '顾客1',
        rating: 5,
      })
      expect(fb.rating).toBe(5)
      expect(fb.type).toBe('rating')
    })

    it('反例: 空userId抛异常', () => {
      expect(() =>
        service.create({
          type: 'complaint',
          title: '测试',
          content: '内容',
          source: 'app',
          severity: 'low',
          tags: [],
          userId: '',
          userName: 'u',
        }),
      ).toThrow('提交者ID不能为空')
    })

    it('反例: 空content抛异常', () => {
      expect(() =>
        service.create({
          type: 'complaint',
          title: '测试',
          content: '',
          source: 'app',
          severity: 'low',
          tags: [],
          userId: 'u-001',
          userName: 'u',
        }),
      ).toThrow('反馈内容不能为空')
    })

    it('反例: 评分类型未提供评分抛异常', () => {
      expect(() =>
        service.create({
          type: 'rating',
          title: '测试',
          content: '好',
          source: 'app',
          severity: 'low',
          tags: [],
          userId: 'u-001',
          userName: 'u',
        }),
      ).toThrow('评价类型必须提供评分')
    })

    it('边界: 评分超出范围抛异常', () => {
      expect(() =>
        service.create({
          type: 'rating',
          title: '测试',
          content: '好',
          source: 'app',
          severity: 'low',
          tags: [],
          userId: 'u-001',
          userName: 'u',
          rating: 6,
        }),
      ).toThrow('评分必须在 1-5 之间')
    })
  })

  // ════════════════════════════════════════════
  // query / getById / getByFeedbackNo
  // ════════════════════════════════════════════

  describe('query', () => {
    it('正例: 分页查询所有', () => {
      const page = service.query({ page: 1, pageSize: 3 })
      expect(page.total).toBeGreaterThanOrEqual(6)
      expect(page.items.length).toBeLessThanOrEqual(3)
      expect(page.page).toBe(1)
      expect(page.totalPages).toBeGreaterThanOrEqual(1)
    })

    it('正例: 按type筛选', () => {
      const page = service.query({ type: 'complaint' })
      expect(page.items.every(f => f.type === 'complaint')).toBe(true)
    })

    it('正例: 按keyword搜索', () => {
      const page = service.query({ keyword: '排队' })
      expect(page.items.length).toBeGreaterThanOrEqual(1)
    })

    it('边界: 不存在的筛选条件返回空', () => {
      const page = service.query({ storeId: 'store-nonexist' })
      expect(page.total).toBe(0)
    })

    it('边界: page超出范围返回空items', () => {
      const page = service.query({ page: 999, pageSize: 20 })
      expect(page.items.length).toBe(0)
      expect(page.total).toBeGreaterThanOrEqual(1)
    })
  })

  describe('getById', () => {
    it('正例: 按ID查找', () => {
      const fb = service.getById('fb-seed-001')
      expect(fb.feedbackNo).toBe('FB-000001')
    })

    it('反例: 不存在的ID抛异常', () => {
      expect(() => service.getById('nonexist')).toThrow('不存在')
    })
  })

  describe('getByFeedbackNo', () => {
    it('正例: 按编号查找', () => {
      const fb = service.getByFeedbackNo('FB-000001')
      expect(fb).not.toBeNull()
      expect(fb!.id).toBe('fb-seed-001')
    })

    it('边界: 不存在的编号返回null', () => {
      expect(service.getByFeedbackNo('FB-999999')).toBeNull()
    })
  })

  // ════════════════════════════════════════════
  // reply
  // ════════════════════════════════════════════

  describe('reply', () => {
    it('正例: 回复pending反馈自动转为processing', () => {
      const fb = service.reply('fb-seed-001', {
        content: '已收到，正在处理',
        repliedBy: 'staff-001',
        repliedByName: '客服小王',
      })
      expect(fb.replies.length).toBe(1)
      expect(fb.status).toBe('processing')
    })

    it('反例: 空回复抛异常', () => {
      expect(() =>
        service.reply('fb-seed-001', {
          content: '',
          repliedBy: 'staff-001',
          repliedByName: '客服',
        }),
      ).toThrow('回复内容不能为空')
    })

    it('反例: 空回复人ID抛异常', () => {
      expect(() =>
        service.reply('fb-seed-001', {
          content: '回复',
          repliedBy: '',
          repliedByName: '客服',
        }),
      ).toThrow('回复人ID不能为空')
    })
  })

  // ════════════════════════════════════════════
  // update
  // ════════════════════════════════════════════

  describe('update', () => {
    it('正例: 更新状态为resolved', () => {
      const fb = service.update('fb-seed-001', { status: 'resolved' })
      expect(fb.status).toBe('resolved')
      expect(fb.resolvedAt).toBeTruthy()
    })

    it('正例: 更新为closed自动添加系统回复', () => {
      const fb = service.update('fb-seed-001', {
        status: 'closed',
        repliedBy: 'admin',
        repliedByName: '管理员',
      })
      expect(fb.status).toBe('closed')
      expect(fb.replies.some(r => r.isSystem)).toBe(true)
    })

    it('正例: 分配处理人', () => {
      const fb = service.update('fb-seed-001', {
        assignedTo: 'tech-li',
        assignedToName: '技术-李',
      })
      expect(fb.assignedTo).toBe('tech-li')
    })
  })

  // ════════════════════════════════════════════
  // delete
  // ════════════════════════════════════════════

  describe('delete', () => {
    it('正例: 删除反馈返回true', () => {
      expect(service.delete('fb-seed-001')).toBe(true)
      expect(() => service.getById('fb-seed-001')).toThrow()
    })

    it('反例: 删除不存在反馈返回false', () => {
      expect(service.delete('nonexist')).toBe(false)
    })
  })

  // ════════════════════════════════════════════
  // getStats
  // ════════════════════════════════════════════

  describe('getStats', () => {
    it('正例: 返回统计信息', () => {
      const stats = service.getStats()
      expect(stats.total).toBeGreaterThanOrEqual(6)
      expect(stats.byType.complaint).toBeGreaterThanOrEqual(2)
      expect(stats.byStatus.pending).toBeGreaterThanOrEqual(1)
      expect(stats.bySeverity.critical).toBeGreaterThanOrEqual(1)
      expect(typeof stats.averageRating).toBe('number')
    })

    it('正例: 统计字段结构完整', () => {
      const stats = service.getStats()
      expect(stats).toHaveProperty('byType')
      expect(stats).toHaveProperty('byStatus')
      expect(stats).toHaveProperty('bySeverity')
      expect(stats).toHaveProperty('bySource')
      expect(stats).toHaveProperty('todayNew')
      expect(stats).toHaveProperty('pending')
      expect(stats).toHaveProperty('processing')
      expect(stats).toHaveProperty('resolved')
    })
  })
})
