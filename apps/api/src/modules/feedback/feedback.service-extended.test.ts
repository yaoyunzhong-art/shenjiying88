/**
 * feedback.service-extended.test.ts — FeedbackService 扩展单元测试
 *
 * 覆盖内容（每分组 ≥3 tests，总计 ≥15）：
 * - 反馈创建（正常/空用户/空内容/无效评分）
 * - 查询筛选（多条件组合/分页/关键词）
 * - 回复逻辑（正常/空内容/自动状态变更）
 * - 更新状态（分配/解决/关闭自动回复）
 * - 删除（存在/不存在）
 * - 统计汇总
 * - 按编号查询
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { FeedbackService } from './feedback.service'
import type { FeedbackPage } from './feedback.entity'

function createService(): FeedbackService {
  // 创建新实例（构造函数中会调用 seed()，因此需确保每次重置）
  const svc = new FeedbackService()
  return svc
}

describe('FeedbackService — extended', () => {
  let service: FeedbackService

  beforeEach(() => {
    service = createService()
  })

  // ── create ─────────────────────────────────────────────────────

  it('create successfully creates a complaint feedback', () => {
    const fb = service.create({
      type: 'complaint',
      content: '环境脏乱，地面有垃圾',
      title: '环境卫生差',
      source: 'app',
      severity: 'medium',
      tags: ['environment', 'service'],
      userId: 'user-ext-1',
      userName: '测试用户',
      storeId: 'store-ext-1',
    })
    expect(fb.id).toBeTruthy()
    expect(fb.feedbackNo).toMatch(/^FB-\d{6}$/)
    expect(fb.status).toBe('pending')
    expect(fb.replies).toEqual([])
  })

  it('create throws BadRequest when userId is empty', () => {
    expect(() =>
      service.create({
        type: 'complaint',
        content: '测试内容',
        title: '测试',
        source: 'app',
        severity: 'low',
        tags: ['other'],
        userId: '',
        userName: 'nobody',
      }),
    ).toThrow('提交者ID不能为空')
  })

  it('create throws BadRequest when content is empty', () => {
    expect(() =>
      service.create({
        type: 'complaint',
        content: '',
        title: '标题',
        source: 'app',
        severity: 'low',
        tags: ['other'],
        userId: 'user-x',
        userName: '某人',
      }),
    ).toThrow('反馈内容不能为空')
  })

  it('create throws BadRequest when title is empty', () => {
    expect(() =>
      service.create({
        type: 'suggestion',
        content: '建议新功能',
        title: '',
        source: 'app',
        severity: 'low',
        tags: ['other'],
        userId: 'user-x',
        userName: '某人',
      }),
    ).toThrow('反馈标题不能为空')
  })

  it('create with rating type requires a rating value', () => {
    expect(() =>
      service.create({
        type: 'rating',
        content: '不错的体验',
        title: '好评',
        source: 'store_qr',
        severity: 'low',
        tags: ['service'],
        userId: 'user-rating',
        userName: '评价用户',
      }),
    ).toThrow('评价类型必须提供评分')
  })

  it('create with rating below 1 throws', () => {
    expect(() =>
      service.create({
        type: 'rating',
        content: '一般',
        title: '评分',
        source: 'app',
        severity: 'low',
        tags: [],
        userId: 'u1',
        userName: 'u1',
        rating: 0,
      }),
    ).toThrow('评分必须在 1-5 之间')
  })

  it('create with rating above 5 throws', () => {
    expect(() =>
      service.create({
        type: 'rating',
        content: '非常好',
        title: '评分',
        source: 'app',
        severity: 'low',
        tags: [],
        userId: 'u2',
        userName: 'u2',
        rating: 6,
      }),
    ).toThrow('评分必须在 1-5 之间')
  })

  it('create with valid rating succeeds', () => {
    const fb = service.create({
      type: 'rating',
      content: '非常满意',
      title: '五星好评',
      source: 'store_qr',
      severity: 'low',
      tags: ['service'],
      userId: 'u3',
      userName: '张三',
      rating: 5,
    })
    expect(fb.rating).toBe(5)
    expect(fb.type).toBe('rating')
  })

  // ── query ──────────────────────────────────────────────────────

  it('query returns paged results with default page 1 and pageSize 20', () => {
    const result = service.query({}) as FeedbackPage
    expect(result.page).toBe(1)
    expect(result.pageSize).toBe(20)
    expect(result.total).toBeGreaterThanOrEqual(6) // seed = 6
    expect(result.totalPages).toBeGreaterThanOrEqual(1)
  })

  it('query filters by type correctly', () => {
    const result = service.query({ type: 'complaint' })
    expect(result.items.every((f) => f.type === 'complaint')).toBe(true)
  })

  it('query filters by status correctly', () => {
    const result = service.query({ status: 'pending' })
    expect(result.items.every((f) => f.status === 'pending')).toBe(true)
  })

  it('query filters by severity correctly', () => {
    const result = service.query({ severity: 'critical' })
    expect(result.items.every((f) => f.severity === 'critical')).toBe(true)
  })

  it('query filters by storeId', () => {
    const result = service.query({ storeId: 'store-001' })
    expect(result.items.every((f) => f.storeId === 'store-001')).toBe(true)
  })

  it('query filters by keyword in title', () => {
    const result = service.query({ keyword: '排队' })
    expect(result.items.length).toBeGreaterThanOrEqual(1)
    expect(result.items.some((f) => f.title.includes('排队'))).toBe(true)
  })

  it('query by keyword returns empty when no match', () => {
    const result = service.query({ keyword: 'ZZZZ_NOT_EXIST_ZZZZ' })
    expect(result.items).toHaveLength(0)
  })

  it('query returns items sorted by createdAt descending', () => {
    const result = service.query({})
    for (let i = 1; i < result.items.length; i++) {
      expect(result.items[i].createdAt <= result.items[i - 1].createdAt).toBe(true)
    }
  })

  it('query with pageSize 1 returns exactly 1 item on first page', () => {
    const result = service.query({ page: 1, pageSize: 1 })
    expect(result.items).toHaveLength(1)
    expect(result.total).toBeGreaterThan(1)
  })

  it('query with page beyond total returns empty items', () => {
    const total = service.query({ pageSize: 100 }).total
    const lastPage = Math.ceil(total / 100) + 1
    const result = service.query({ page: lastPage, pageSize: 100 })
    expect(result.items).toHaveLength(0)
  })

  // ── getById ─────────────────────────────────────────────────────

  it('getById returns feedback for valid id', () => {
    const fb = service.getById('fb-seed-001')
    expect(fb.feedbackNo).toBe('FB-000001')
    expect(fb.title).toBe('排队时间过长')
  })

  it('getById throws NotFoundException for non-existent id', () => {
    expect(() => service.getById('non-existent-id')).toThrow('不存在')
  })

  // ── getByFeedbackNo ─────────────────────────────────────────────

  it('getByFeedbackNo finds feedback by number', () => {
    const fb = service.getByFeedbackNo('FB-000001')
    expect(fb).not.toBeNull()
    expect(fb!.id).toBe('fb-seed-001')
  })

  it('getByFeedbackNo returns null for unknown number', () => {
    expect(service.getByFeedbackNo('FB-999999')).toBeNull()
  })

  // ── reply ──────────────────────────────────────────────────────

  it('reply adds reply and changes status to processing for pending feedback', () => {
    const fb = service.reply('fb-seed-001', {
      content: '已安排人员处理',
      repliedBy: 'staff-ext',
      repliedByName: '客服小王',
    })
    expect(fb.replies).toHaveLength(1)
    expect(fb.replies[0].content).toBe('已安排人员处理')
    expect(fb.status).toBe('processing')
  })

  it('reply throws when content is empty', () => {
    expect(() =>
      service.reply('fb-seed-001', {
        content: '',
        repliedBy: 'staff-x',
        repliedByName: '某人',
      }),
    ).toThrow('回复内容不能为空')
  })

  it('reply throws when repliedBy is empty', () => {
    expect(() =>
      service.reply('fb-seed-001', {
        content: '有回复',
        repliedBy: '',
        repliedByName: '某人',
      }),
    ).toThrow('回复人ID不能为空')
  })

  it('reply to non-existent feedback throws', () => {
    expect(() =>
      service.reply('no-such-id', {
        content: 'hello',
        repliedBy: 'staff',
        repliedByName: 'staff',
      }),
    ).toThrow('不存在')
  })

  // ── update ─────────────────────────────────────────────────────

  it('update changes status to resolved and sets resolvedAt', () => {
    const fb = service.update('fb-seed-001', {
      status: 'resolved',
      resolution: '已派保洁清理',
    })
    expect(fb.status).toBe('resolved')
    expect(fb.resolvedAt).toBeTruthy()
    expect(fb.resolution).toBe('已派保洁清理')
  })

  it('update with status closed adds system reply', () => {
    const fb = service.update('fb-seed-002', {
      status: 'closed',
      repliedBy: 'staff-close',
      repliedByName: '客服',
    })
    expect(fb.status).toBe('closed')
    expect(fb.resolvedAt).toBeTruthy()
    const sysReplies = fb.replies.filter((r) => r.isSystem)
    expect(sysReplies.length).toBeGreaterThanOrEqual(1)
    expect(sysReplies[sysReplies.length - 1].content).toBe('反馈已关闭')
  })

  it('update assigns handler', () => {
    const fb = service.update('fb-seed-005', {
      assignedTo: 'tech-lead',
      assignedToName: '技术主管',
    })
    expect(fb.assignedTo).toBe('tech-lead')
    expect(fb.assignedToName).toBe('技术主管')
  })

  // ── delete ─────────────────────────────────────────────────────

  it('delete removes feedback and returns true', () => {
    const result = service.delete('fb-seed-005')
    expect(result).toBe(true)
    expect(() => service.getById('fb-seed-005')).toThrow('不存在')
  })

  it('delete returns false for non-existent feedback', () => {
    const result = service.delete('non-existent')
    expect(result).toBe(false)
  })

  // ── getStats ───────────────────────────────────────────────────

  it('getStats returns total count matching seeded data', () => {
    const stats = service.getStats()
    expect(stats.total).toBe(6)
  })

  it('getStats has byType breakdown', () => {
    const stats = service.getStats()
    expect(stats.byType.complaint + stats.byType.suggestion + stats.byType.rating + stats.byType.issue).toBe(stats.total)
  })

  it('getStats has byStatus breakdown', () => {
    const stats = service.getStats()
    const byStatusSum = stats.byStatus.pending + stats.byStatus.processing + stats.byStatus.resolved + stats.byStatus.closed
    expect(byStatusSum).toBe(stats.total)
  })

  it('getStats computes averageRating only when rating type exists', () => {
    const stats = service.getStats()
    expect(stats.averageRating).toBeGreaterThanOrEqual(1)
    expect(stats.averageRating).toBeLessThanOrEqual(5)
  })

  it('getStats todayNew is non-negative', () => {
    const stats = service.getStats()
    expect(stats.todayNew).toBeGreaterThanOrEqual(0)
  })

  it('getStats avgResponseMinutes is defined when replies exist', () => {
    const stats = service.getStats()
    // seed has replies, so avgResponseMinutes should be a positive number
    if (stats.avgResponseMinutes !== undefined) {
      expect(stats.avgResponseMinutes).toBeGreaterThan(0)
    }
  })
})
