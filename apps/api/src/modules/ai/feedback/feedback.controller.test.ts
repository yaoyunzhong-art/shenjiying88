/**
 * feedback.controller.test.ts — AI Feedback Controller 单元测试
 *
 * 🐜 V23 L5: feedback 控制器欠缺测试 → controller spec 补充
 *
 * 覆盖:
 *   正例: POST submit, POST resolve, GET list, GET stats — 完整路由
 *   反例: resolve 不存在的 ID、stats 空数据
 *   边界: list 分页、type 过滤
 */

import { Test, TestingModule } from '@nestjs/testing'
import { FeedbackController } from './feedback.controller'
import { FeedbackService } from './feedback.service'

describe('FeedbackController', () => {
  let controller: FeedbackController
  let service: FeedbackService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FeedbackController],
      providers: [FeedbackService],
    }).compile()

    controller = module.get<FeedbackController>(FeedbackController)
    service = module.get<FeedbackService>(FeedbackService)
  })

  describe('POST /ai/feedback - submit', () => {
    it('应提交一条评分反馈并返回完整 entry', () => {
      const result = controller.submit({
        userId: 'u-1', tenantId: 't-1',
        type: 'rating', score: 5,
        content: '体验很棒', source: 'app',
        category: 'ux',
      })

      expect(result.id).toMatch(/^fb_/)
      expect(result.type).toBe('rating')
      expect(result.score).toBe(5)
      expect(result.content).toBe('体验很棒')
      expect(result.createdAt).toBeDefined()
      expect(result.resolvedAt).toBeUndefined()
    })

    it('应提交一条建议反馈', () => {
      const result = controller.submit({
        userId: 'u-2', tenantId: 't-1',
        type: 'suggestion', score: 3,
        content: '增加导出功能', source: 'web',
        category: 'feature',
      })
      expect(result.type).toBe('suggestion')
      expect(result.category).toBe('feature')
    })

    it('应支持 metadata 可选字段', () => {
      const result = controller.submit({
        userId: 'u-3', tenantId: 't-2',
        type: 'report', score: 1,
        content: '支付页面崩溃', source: 'app',
        category: 'bug',
        metadata: { page: '/pay', errorCode: 'E001' },
      })
      expect(result.metadata).toEqual({ page: '/pay', errorCode: 'E001' })
    })

    it('metadata 为空时应传默认 {}', () => {
      const result = controller.submit({
        userId: 'u-4', tenantId: 't-1',
        type: 'comment', score: 4,
        content: '还行', source: 'mini',
        category: 'general',
        // no metadata
      } as any)
      expect(result.metadata).toBeDefined()
    })
  })

  describe('POST /ai/feedback/:id/resolve', () => {
    it('应标记反馈为已解决', () => {
      const submitted = controller.submit({
        userId: 'u-1', tenantId: 't-1',
        type: 'report', score: 2,
        content: 'loading 太慢', source: 'web',
        category: 'performance',
      })
      const result = controller.resolve(submitted.id, { resolution: '已优化首屏加载' })
      expect(result).not.toBeNull()
      expect(result!.resolvedAt).toBeDefined()
      expect(result!.resolution).toBe('已优化首屏加载')
    })

    it('resolve 不存在的 ID 应返回 null', () => {
      const result = controller.resolve('fb_nonexistent', { resolution: 'dummy' })
      expect(result).toBeNull()
    })

    it('多次 resolve 同一反馈会覆盖 resolution', () => {
      const submitted = controller.submit({
        userId: 'u-2', tenantId: 't-1',
        type: 'comment', score: 3,
        content: '颜色太暗', source: 'app',
        category: 'design',
      })
      const first = controller.resolve(submitted.id, { resolution: '已调整色调' })
      expect(first!.resolution).toBe('已调整色调')

      const second = controller.resolve(submitted.id, { resolution: '二次调整高对比度' })
      expect(second!.resolution).toBe('二次调整高对比度')
    })
  })

  describe('GET /ai/feedback - list', () => {
    beforeEach(() => {
      // 填充多条数据
      controller.submit({ userId: 'u-1', tenantId: 't-a', type: 'rating', score: 5, content: '好', source: 'app', category: 'ux' })
      controller.submit({ userId: 'u-2', tenantId: 't-a', type: 'comment', score: 4, content: '不错', source: 'web', category: 'design' })
      controller.submit({ userId: 'u-3', tenantId: 't-b', type: 'rating', score: 3, content: '一般', source: 'app', category: 'ux' })
      controller.submit({ userId: 'u-4', tenantId: 't-a', type: 'report', score: 1, content: '报错', source: 'app', category: 'bug' })
      controller.submit({ userId: 'u-5', tenantId: 't-b', type: 'suggestion', score: 5, content: 'idea', source: 'mini', category: 'feature' })
    })

    it('应返回所有反馈（不传参）', () => {
      const result = controller.list()
      expect(result.length).toBe(5)
    })

    it('应按 tenantId 过滤', () => {
      const result = controller.list('t-a')
      expect(result.length).toBe(3)
    })

    it('应按 type 过滤', () => {
      const result = controller.list(undefined, 'rating')
      expect(result.length).toBe(2)
      result.forEach(e => expect(e.type).toBe('rating'))
    })

    it('应同时按 tenantId 和 type 过滤', () => {
      const result = controller.list('t-b', 'rating')
      expect(result.length).toBe(1)
      expect(result[0].tenantId).toBe('t-b')
      expect(result[0].type).toBe('rating')
    })

    it('应根据 limit 和 offset 分页', () => {
      const page1 = controller.list(undefined, undefined, '2', '0')
      expect(page1.length).toBe(2)

      const page2 = controller.list(undefined, undefined, '2', '2')
      expect(page2.length).toBe(2)

      const page3 = controller.list(undefined, undefined, '2', '4')
      expect(page3.length).toBe(1)

      // 验证分页不重叠
      const ids = [...page1.map(e => e.id), ...page2.map(e => e.id), ...page3.map(e => e.id)]
      expect(new Set(ids).size).toBe(5)
    })

    it('limit 非法值应默认为 20', () => {
      const result = controller.list(undefined, undefined, 'abc', '0')
      expect(result.length).toBe(5) // 默认 limit=20 足够
    })

    it('offset 非法值应默认为 0', () => {
      const result = controller.list(undefined, undefined, '2', 'xyz')
      expect(result.length).toBe(2) // offset=0, 返回前2条
    })
  })

  describe('GET /ai/feedback/stats', () => {
    it('空数据库应返回全零 stats', () => {
      const result = controller.stats()
      expect(result.total).toBe(0)
      expect(result.avgScore).toBe(0)
      expect(result.recentTrend.every(n => n === 0)).toBe(true)
    })

    it('应正确计算有数据时的统计', () => {
      controller.submit({ userId: 'u-1', tenantId: 't-1', type: 'rating', score: 5, content: 'A', source: 'app', category: 'ux' })
      controller.submit({ userId: 'u-2', tenantId: 't-1', type: 'rating', score: 3, content: 'B', source: 'app', category: 'ux' })
      controller.submit({ userId: 'u-3', tenantId: 't-2', type: 'rating', score: 1, content: 'C', source: 'web', category: 'bug' })

      const all = controller.stats()
      expect(all.total).toBe(3)
      expect(all.avgScore).toBe(3) // (5+3+1)/3
      expect(all.bySource.app).toBe(2)
      expect(all.bySource.web).toBe(1)
      expect(all.byCategory.ux).toBe(2)
      expect(all.byCategory.bug).toBe(1)
    })

    it('应按 tenantId 过滤 stats', () => {
      controller.submit({ userId: 'u-1', tenantId: 't-a', type: 'rating', score: 5, content: 'A', source: 'app', category: 'ux' })
      controller.submit({ userId: 'u-2', tenantId: 't-b', type: 'rating', score: 1, content: 'B', source: 'web', category: 'bug' })

      const statsA = controller.stats('t-a')
      expect(statsA.total).toBe(1)
      expect(statsA.avgScore).toBe(5)

      const statsNone = controller.stats('t-none')
      expect(statsNone.total).toBe(0)
    })

    it('score distribution 应正确', () => {
      controller.submit({ userId: 'u-1', tenantId: 't-1', type: 'rating', score: 5, content: 'A', source: 'app', category: 'ux' })
      controller.submit({ userId: 'u-2', tenantId: 't-1', type: 'rating', score: 5, content: 'B', source: 'app', category: 'ux' })

      const stats = controller.stats()
      expect(stats.distribution['5']).toBe(2)
    })
  })
})
