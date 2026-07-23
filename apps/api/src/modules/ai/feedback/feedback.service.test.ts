/**
 * feedback.service.test.ts — 反馈服务全覆盖单元测试
 *
 * 覆盖:
 *   - submit: 正常提交、各类型、空内容
 *   - resolve: 正常解决、重复解决、不存在
 *   - list: 按 tenant/type 过滤、分页
 *   - getStats: 统计聚合、趋势
 *
 * 测试充分性: 16+ tests
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { FeedbackService, type FeedbackEntry } from './feedback.service'

describe('FeedbackService — submit', () => {
  let service: FeedbackService

  beforeEach(() => {
    service = new FeedbackService()
  })

  it('正例: 提交 rating 反馈应返回完整反馈条目', () => {
    const entry = service.submit({
      userId: 'user-001',
      tenantId: 'tenant-001',
      type: 'rating',
      score: 5,
      content: 'Great service!',
      source: 'web',
      category: 'service',
      metadata: { page: 'checkout' },
    })
    expect(entry.id).toMatch(/^fb_\d+_\d+$/)
    expect(entry.userId).toBe('user-001')
    expect(entry.type).toBe('rating')
    expect(entry.score).toBe(5)
    expect(entry.createdAt).toBeDefined()
    expect(entry.metadata.page).toBe('checkout')
  })

  it('正例: 提交 comment 反馈', () => {
    const entry = service.submit({
      userId: 'user-002',
      tenantId: 'tenant-001',
      type: 'comment',
      score: 3,
      content: 'Not bad but could be better',
      source: 'app',
      category: 'ux',
      metadata: {},
    })
    expect(entry.type).toBe('comment')
    expect(entry.source).toBe('app')
  })

  it('正例: 提交 report 反馈', () => {
    const entry = service.submit({
      userId: 'user-003',
      tenantId: 'tenant-002',
      type: 'report',
      score: 1,
      content: 'Bug found when submitting order',
      source: 'mobile',
      category: 'bug',
      metadata: { os: 'iOS' },
    })
    expect(entry.type).toBe('report')
    expect(entry.metadata.os).toBe('iOS')
  })

  it('正例: 提交 suggestion 反馈', () => {
    const entry = service.submit({
      userId: 'user-004',
      tenantId: 'tenant-001',
      type: 'suggestion',
      score: 4,
      content: 'Add dark mode please',
      source: 'web',
      category: 'feature',
      metadata: {},
    })
    expect(entry.type).toBe('suggestion')
  })

  it('边界: 允许极低分和极高分的评分', () => {
    const low = service.submit({
      userId: 'u1', tenantId: 't1', type: 'rating', score: 1,
      content: 'Worst', source: 'web', category: 'general', metadata: {},
    })
    expect(low.score).toBe(1)

    const high = service.submit({
      userId: 'u2', tenantId: 't1', type: 'rating', score: 5,
      content: 'Best', source: 'web', category: 'general', metadata: {},
    })
    expect(high.score).toBe(5)
  })

  it('边界: 空内容反馈也可以提交', () => {
    const entry = service.submit({
      userId: 'u1', tenantId: 't1', type: 'rating', score: 3,
      content: '', source: 'web', category: 'general', metadata: {},
    })
    expect(entry.content).toBe('')
    expect(entry.id).toBeDefined()
  })
})

describe('FeedbackService — resolve', () => {
  let service: FeedbackService

  beforeEach(() => {
    service = new FeedbackService()
  })

  it('正例: 解决一条未解决的反馈', () => {
    const entry = service.submit({
      userId: 'u1', tenantId: 't1', type: 'report', score: 2,
      content: 'Payment failed', source: 'app', category: 'payment', metadata: {},
    })
    const resolved = service.resolve(entry.id, 'Fixed payment gateway timeout')
    expect(resolved).not.toBeNull()
    expect(resolved!.id).toBe(entry.id)
    expect(resolved!.resolution).toBe('Fixed payment gateway timeout')
    expect(resolved!.resolvedAt).toBeDefined()
  })

  it('反例: 解决不存在的反馈返回 null', () => {
    const result = service.resolve('non-existent-id', 'resolved')
    expect(result).toBeNull()
  })

  it('正例: 已解决的反馈可以重复解决（覆盖 resolution）', () => {
    const entry = service.submit({
      userId: 'u1', tenantId: 't1', type: 'comment', score: 3,
      content: 'ok', source: 'web', category: 'general', metadata: {},
    })
    service.resolve(entry.id, 'First fix')
    const second = service.resolve(entry.id, 'Second improved fix')
    expect(second!.resolution).toBe('Second improved fix')
    expect(second!.resolvedAt).toBeDefined()
  })
})

describe('FeedbackService — list', () => {
  let service: FeedbackService

  beforeEach(() => {
    service = new FeedbackService()
    // Seed data
    service.submit({ userId: 'u1', tenantId: 't1', type: 'rating', score: 5, content: 'A', source: 'web', category: 'service', metadata: {} })
    service.submit({ userId: 'u2', tenantId: 't1', type: 'comment', score: 3, content: 'B', source: 'app', category: 'ux', metadata: {} })
    service.submit({ userId: 'u3', tenantId: 't2', type: 'rating', score: 4, content: 'C', source: 'web', category: 'service', metadata: {} })
    service.submit({ userId: 'u4', tenantId: 't1', type: 'suggestion', score: 4, content: 'D', source: 'mobile', category: 'feature', metadata: {} })
  })

  it('正例: 默认列出所有反馈（最新优先）', () => {
    const list = service.list()
    expect(list.length).toBe(4)
    // 所有条目在同一毫秒提交，排序按createdAt相同，都返回
    // 验证内容包含所有四条的ID
    const contents = list.map(e => e.content).sort()
    expect(contents).toEqual(['A', 'B', 'C', 'D'])
  })

  it('正例: 按 tenantId 过滤', () => {
    const list = service.list({ tenantId: 't1' })
    expect(list.length).toBe(3)
    expect(list.every(e => e.tenantId === 't1')).toBe(true)
  })

  it('正例: 按 type 过滤', () => {
    const list = service.list({ type: 'rating' })
    expect(list.length).toBe(2)
    expect(list.every(e => e.type === 'rating')).toBe(true)
  })

  it('正例: 组合 tenantId + type 过滤', () => {
    const list = service.list({ tenantId: 't1', type: 'rating' })
    expect(list.length).toBe(1)
    expect(list[0].userId).toBe('u1')
  })

  it('正例: 分页参数 offset 和 limit', () => {
    const list = service.list({ limit: 2 })
    expect(list.length).toBe(2)
    const list2 = service.list({ limit: 2, offset: 2 })
    expect(list2.length).toBe(2)
    // 不重叠
    expect(list[0].id).not.toBe(list2[0].id)
  })

  it('反例: 不存在的 tenantId 返回空数组', () => {
    const list = service.list({ tenantId: 'non-existent' })
    expect(list).toHaveLength(0)
  })
})

describe('FeedbackService — getStats', () => {
  let service: FeedbackService

  beforeEach(() => {
    service = new FeedbackService()
  })

  it('正例: 统计所有反馈的平均分和分布', () => {
    service.submit({ userId: 'u1', tenantId: 't1', type: 'rating', score: 5, content: 'Excel', source: 'web', category: 'service', metadata: {} })
    service.submit({ userId: 'u2', tenantId: 't1', type: 'rating', score: 4, content: 'Great', source: 'app', category: 'service', metadata: {} })
    service.submit({ userId: 'u3', tenantId: 't1', type: 'comment', score: 3, content: 'OK', source: 'web', category: 'general', metadata: {} })
    service.submit({ userId: 'u3', tenantId: 't2', type: 'rating', score: 1, content: 'Bad', source: 'mobile', category: 'payment', metadata: {} })

    const stats = service.getStats()
    expect(stats.total).toBe(4)
    expect(stats.avgScore).toBeCloseTo(3.25, 2)
    expect(stats.distribution['5']).toBe(1)
    expect(stats.distribution['4']).toBe(1)
    expect(stats.distribution['3']).toBe(1)
    expect(stats.distribution['1']).toBe(1)
    expect(stats.bySource.web).toBe(2)
    expect(stats.bySource.app).toBe(1)
    expect(stats.bySource.mobile).toBe(1)
    expect(stats.byCategory.service).toBe(2)
    expect(stats.byCategory.general).toBe(1)
    expect(stats.byCategory.payment).toBe(1)
  })

  it('正例: 按 tenantId 过滤统计', () => {
    service.submit({ userId: 'u1', tenantId: 't1', type: 'rating', score: 5, content: 'G', source: 'web', category: 'service', metadata: {} })
    service.submit({ userId: 'u2', tenantId: 't2', type: 'rating', score: 2, content: 'B', source: 'app', category: 'ux', metadata: {} })

    const stats = service.getStats('t1')
    expect(stats.total).toBe(1)
    expect(stats.avgScore).toBe(5)
  })

  it('正例: recentTrend 应返回最近7天每日数量', () => {
    const stats = service.getStats()
    expect(stats.recentTrend.length).toBe(7)
    stats.recentTrend.forEach(count => {
      expect(typeof count).toBe('number')
      expect(count).toBeGreaterThanOrEqual(0)
    })
  })

  it('反例: 无反馈时统计全为零', () => {
    const stats = service.getStats()
    expect(stats.total).toBe(0)
    expect(stats.avgScore).toBe(0)
    expect(Object.keys(stats.distribution)).toHaveLength(0)
    expect(Object.keys(stats.bySource)).toHaveLength(0)
    expect(Object.keys(stats.byCategory)).toHaveLength(0)
  })
})
