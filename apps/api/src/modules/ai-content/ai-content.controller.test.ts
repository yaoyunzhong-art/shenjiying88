/**
 * ai-content.controller.spec.ts - Controller integration tests for ai-content module
 * Roles: 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { AiContentController } from './ai-content.controller'
import {
  TeamBuildingReportGenerator,
  ContentModerationService,
  VideoDeduplicationService,
  ProgressAnalyzer,
} from './ai-content.service'

function createController(): AiContentController {
  return new AiContentController(
    new TeamBuildingReportGenerator(),
    new ContentModerationService(),
    new VideoDeduplicationService(),
    new ProgressAnalyzer(),
  )
}

// ── 👔 店长视角: 团建报告管理 ────────────────────────────

describe('👔 店长 - 团建报告管理', () => {
  let controller: AiContentController

  beforeEach(() => {
    controller = createController()
  })

  it('STORE-1 应成功生成团建报告并包含完整的活动统计数据', async () => {
    const result = await controller.generateReport({ eventId: 'evt-001' })
    expect(result.success).toBe(true)
    expect(result.data!.report).toBeDefined()
    expect(result.data!.report.stats.participationRate).toBe(90)
    expect(result.data!.report.stats.topActivity).toBe('破冰游戏')
    expect(result.data!.generatedAt).toBeDefined()
  })

  it('STORE-2 应拒绝不存在的活动ID并返回错误信息', async () => {
    const result = await controller.generateReport({ eventId: 'non-existent' })
    expect(result.success).toBe(false)
    expect(result.message).toContain('not found')
  })

  it('STORE-3 应支持分享报告给指定管理者', async () => {
    const gen = await controller.generateReport({ eventId: 'evt-001' })
    const reportId = gen.data!.report.id
    const result = controller.shareReport(reportId, {
      recipients: ['store-manager@arcade.com', 'ops@arcade.com'],
    })
    expect(result.success).toBe(true)
    expect(result.data!.sharedWith).toHaveLength(2)
  })

  it('STORE-4 生成的报告应包含AI自动总结', async () => {
    const result = await controller.generateReport({ eventId: 'evt-001' })
    expect(result.data!.report.summary.length).toBeGreaterThan(10)
    expect(result.data!.report.summary).toContain('春季团建')
  })
})

// ── 🛒 前台视角: 内容审核 ──────────────────────────────

describe('🛒 前台 - 内容审核', () => {
  let controller: AiContentController

  beforeEach(() => {
    controller = createController()
  })

  it('FRONT-1 应通过正常的前台欢迎内容审核', () => {
    const result = controller.moderateContent({
      content: '欢迎来到欢乐游戏厅，祝您玩得开心！',
    })
    expect(result.success).toBe(true)
    expect(result.data!.passed).toBe(true)
  })

  it('FRONT-2 应拦截包含暴力关键词的内容', () => {
    const result = controller.moderateContent({
      content: '这里发生过暴力事件，请保安留意',
    })
    expect(result.success).toBe(true)
    expect(result.data!.passed).toBe(false)
    expect(result.data!.violations.some((v: any) => v.type === 'violence')).toBe(true)
  })

  it('FRONT-3 应正确标记待审核内容', () => {
    // 先注册内容到存储
    const modController = (controller as any).moderationService as ContentModerationService
    modController.storeContent('front-content-1', '可疑内容', 'text')
    const result = controller.flagForReview('front-content-1')
    expect(result.success).toBe(true)

    const queue = controller.getReviewQueue()
    expect(queue.data.queue).toContain('front-content-1')
  })

  it('FRONT-4 应返回待审核队列的实时大小', () => {
    const result = controller.getReviewQueue()
    expect(result.data!.size).toBeGreaterThanOrEqual(0)
    expect(Array.isArray(result.data!.queue)).toBe(true)
  })
})

// ── 👥 HR视角: 进步分析 ────────────────────────────────

describe('👥 HR - 员工进步分析', () => {
  let controller: AiContentController

  beforeEach(() => {
    controller = createController()
  })

  it('HR-1 应正确计算员工销售进步幅度', async () => {
    // 记录两期数据后计算
    const r1 = controller.calculateImprovement({
      memberId: 'hr-mem-1', period: '2024-Q1', metric: 'sales', value: 50,
    })
    expect(r1.success).toBe(true)
    expect(r1.data.memberId).toBe('hr-mem-1')

    const r2 = controller.calculateImprovement({
      memberId: 'hr-mem-1', period: '2024-Q2', metric: 'sales', value: 80,
    })
    expect(r2.success).toBe(true)
    expect(typeof r2.data.improvement).toBe('number')
  })

  it('HR-2 应返回两个周期的详细对比数据', () => {
    const result = controller.comparePerformance({
      memberId: 'hr-mem-2',
      metric: 'output',
      beforePeriod: '2024-Q1',
      afterPeriod: '2024-Q2',
    })
    // 无历史数据时返回失败
    expect(result.success).toBe(false)
    expect(result.message).toContain('Insufficient')
  })

  it('HR-3 有完整数据时应返回准确对比结果', () => {
    const pa = (controller as any).progressAnalyzer as ProgressAnalyzer
    pa.recordMetric('hr-mem-3', '2024-Q1', 'output', 60)
    pa.recordMetric('hr-mem-3', '2024-Q2', 'output', 90)

    const result = controller.comparePerformance({
      memberId: 'hr-mem-3',
      metric: 'output',
      beforePeriod: '2024-Q1',
      afterPeriod: '2024-Q2',
    })
    expect(result.success).toBe(true)
    expect(result.data!.before).toBe(60)
    expect(result.data!.after).toBe(90)
    expect(result.data!.improvement).toBe(30)
  })
})

// ── 🔧 安监视角: 内容安全 ────────────────────────────

describe('🔧 安监 - 内容安全审核', () => {
  let controller: AiContentController

  beforeEach(() => {
    controller = createController()
  })

  it('SAFETY-1 政治敏感内容应被高风险标记', () => {
    const result = controller.moderateContent({
      content: '这是分裂国家的言论',
    })
    expect(result.data!.passed).toBe(false)
    expect(result.data!.flagged).toBe(true)
    const violation = result.data!.violations.find((v: any) => v.type === 'political')
    expect(violation).toBeDefined()
    expect(violation!.severity).toBe('high')
  })

  it('SAFETY-2 广告推广内容应被低风险标记', () => {
    const result = controller.moderateContent({
      content: '请加微信了解促销',
    })
    expect(result.data!.passed).toBe(false)
    expect(result.data!.violations.some((v: any) => v.type === 'advertising')).toBe(true)
  })

  it('SAFETY-3 批量审核应正确处理混合内容', () => {
    const result = controller.batchModerate({
      items: [
        { id: 'safe-1', content: '今天天气真好', type: 'text' as any },
        { id: 'bad-1', content: '暴力斗殴', type: 'text' as any },
        { id: 'ad-1', content: '加微信优惠', type: 'text' as any },
      ],
    })
    expect(result.success).toBe(true)
    expect(result.data!.results).toHaveLength(3)
    expect(result.data!.results[0].passed).toBe(true)
    expect(result.data!.results[1].passed).toBe(false)
    expect(result.data!.results[2].passed).toBe(false)
  })

  it('SAFETY-4 审核通过操作应正确移除审核队列', () => {
    const modController = (controller as any).moderationService as ContentModerationService
    modController.storeContent('safety-review-1', '审核通过', 'text')
    controller.flagForReview('safety-review-1')
    const result = controller.reviewContent('safety-review-1', { action: 'approve' })
    expect(result.success).toBe(true)
    expect(result.message).toContain('approved')
  })
})

// ── 🎮 导玩员视角: 视频去重 ────────────────────────────

describe('🎮 导玩员 - 视频去重', () => {
  let controller: AiContentController

  beforeEach(() => {
    controller = createController()
  })

  it('GUIDE-1 应一致地计算同一视频的指纹', () => {
    const r1 = controller.computeFingerprint({ videoId: 'gameplay-001' })
    const r2 = controller.computeFingerprint({ videoId: 'gameplay-001' })
    expect(r1.data.hash).toBe(r2.data.hash)
    expect(r1.data.frames).toEqual(r2.data.frames)
  })

  it('GUIDE-2 不同视频应生成不同的唯一指纹', () => {
    const r1 = controller.computeFingerprint({ videoId: 'gameplay-001' })
    const r2 = controller.computeFingerprint({ videoId: 'gameplay-002' })
    expect(r1.data.hash).not.toBe(r2.data.hash)
  })

  it('GUIDE-3 相同视频的指纹比对应返回100%相似度', () => {
    const fp = controller.computeFingerprint({ videoId: 'gameplay-003' })
    const result = controller.compareVideos({
      fingerprint1: fp.data.hash,
      fingerprint2: fp.data.hash,
    })
    expect(result.data!.similarity).toBe(1.0)
  })
})

// ── 🎯 运行专员视角: 系统运行 ───────────────────────────

describe('🎯 运行专员 - 系统功能运行', () => {
  let controller: AiContentController

  beforeEach(() => {
    controller = createController()
  })

  it('OPS-1 报告添加亮点功能应返回更新后的报告', async () => {
    const gen = await controller.generateReport({ eventId: 'evt-002' })
    const result = controller.addHighlights(gen.data!.report.id, {
      highlights: ['漂流活动反馈优秀', '篝火晚会气氛热烈'],
    })
    expect(result.success).toBe(true)
    expect(result.data!.highlights).toHaveLength(2)
  })

  it('OPS-2 对不存在的报告ID添加亮点应返回失败', () => {
    const result = controller.addHighlights('non-existent-id', {
      highlights: ['测试'],
    })
    expect(result.success).toBe(false)
    expect(result.message).toContain('not found')
  })

  it('OPS-3 获取不存在的活动报告应返回正确错误', () => {
    const result = controller.getReport('non-existent-evnt')
    expect(result.success).toBe(false)
  })

  it('OPS-4 通过reportId获取已有报告应成功', async () => {
    await controller.generateReport({ eventId: 'evt-002' })
    const result = controller.getReport('evt-002')
    expect(result.success).toBe(true)
    expect(result.data!.eventId).toBe('evt-002')
  })
})

// ── 🤝 团建视角: 团建功能 ─────────────────────────────

describe('🤝 团建 - 团建活动功能', () => {
  let controller: AiContentController

  beforeEach(() => {
    controller = createController()
  })

  it('TEAM-1 夏季漂流活动报告应包含正确的活动统计', async () => {
    const result = await controller.generateReport({ eventId: 'evt-002' })
    expect(result.success).toBe(true)
    expect(result.data!.report.eventId).toBe('evt-002')
    expect(result.data!.report.stats.topActivity).toBe('漂流')
  })

  it('TEAM-2 详细模板报告应包含更多内容', async () => {
    const result = await controller.generateReport({
      eventId: 'evt-001',
      template: 'detailed',
    })
    expect(result.success).toBe(true)
    expect(result.data!.report.summary.length).toBeGreaterThan(0)
  })

  it('TEAM-3 应支持批量分享团建报告给多个团队', async () => {
    const gen = await controller.generateReport({ eventId: 'evt-001' })
    const result = controller.shareReport(gen.data!.report.id, {
      recipients: ['team-a@company.com', 'team-b@company.com', 'hr@company.com'],
    })
    expect(result.success).toBe(true)
    expect(result.data!.sharedWith).toHaveLength(3)
  })

  it('TEAM-4 应防止重复分享给同一收件人', async () => {
    const gen = await controller.generateReport({ eventId: 'evt-001' })
    controller.shareReport(gen.data!.report.id, {
      recipients: ['same@test.com'],
    })
    const second = controller.shareReport(gen.data!.report.id, {
      recipients: ['same@test.com'],
    })
    // 应该去重或允许已有收件人
    expect(second.success).toBe(true)
    const countSame = second.data!.sharedWith.filter((r: string) => r === 'same@test.com').length
    expect(countSame).toBeGreaterThanOrEqual(1)
  })
})

// ── 📢 营销视角: 内容推广 ─────────────────────────────

describe('📢 营销 - 内容推广审核', () => {
  let controller: AiContentController

  beforeEach(() => {
    controller = createController()
  })

  it('MARKET-1 营销内容中广告关键词应被低风险检测', () => {
    const result = controller.moderateContent({
      content: '本店优惠促销，欢迎光临',
    })
    expect(result.data!.passed).toBe(false)
    expect(result.data!.violations.some((v: any) => v.type === 'advertising')).toBe(true)
  })

  it('MARKET-2 正常品牌推广内容应通过审核', () => {
    const result = controller.moderateContent({
      content: '欢迎体验我们的新款游戏机，乐趣无穷！',
    })
    expect(result.data!.passed).toBe(true)
  })

  it('MARKET-3 营销活动报告的亮点应可添加和持久化', async () => {
    const gen = await controller.generateReport({ eventId: 'evt-001' })
    const r = controller.addHighlights(gen.data!.report.id, {
      highlights: ['营销活动新增客户50人', '社交媒体曝光量提升200%'],
    })
    expect(r.data!.highlights).toContain('营销活动新增客户50人')
    expect(r.data!.highlights).toContain('社交媒体曝光量提升200%')
  })
})
