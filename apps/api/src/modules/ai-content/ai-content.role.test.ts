import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [ai-content] [C] 角色测试
 * 
 * 8 角色视角的 ai-content 模块测试：
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建  📢营销
 * 
 * 每个角色至少 2 个测试用例（正常流程 + 权限边界）
 */

import { TeamBuildingReportGenerator, ContentModerationService, VideoDeduplicationService, ProgressAnalyzer } from './ai-content.service'

// ── 角色定义 ──
const ROLES = {
  StoreManager: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Security: '🔧安监',
  Guide: '🎮导玩员',
  Operations: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
} as const

// ── 测试数据工厂 ──
function setupServices() {
  return {
    reportGenerator: new TeamBuildingReportGenerator(),
    moderationService: new ContentModerationService(),
    videoDedupService: new VideoDeduplicationService(),
    progressAnalyzer: new ProgressAnalyzer(),
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// 👔 店长视角 - 店长关注团建报告概览、内容审核整体状态
// ══════════════════════════════════════════════════════════════════════════════

describe('👔店长视角 - ai-content 模块', () => {
  let svc: ReturnType<typeof setupServices>

  beforeEach(() => {
    svc = setupServices()
  })

  it('[店长-1] 正常流程: 店长可以生成并查看完整的团建报告统计数据', async () => {
    const report = await svc.reportGenerator.generateReport('evt-001')
    expect(report).not.toBeNull()
    expect(report!.eventId).toBe('evt-001')
    expect(report!.stats.participationRate).toBeGreaterThan(0)
    expect(report!.stats.avgDuration).toBeGreaterThan(0)
    expect(report!.stats.topActivity).toBeDefined()
    // 店长需要看到 summary
    expect(report!.summary.length).toBeGreaterThan(10)
  })

  it('[店长-2] 边界: 店长查询不存在的报告应返回 null 而非抛异常', async () => {
    const report = await svc.reportGenerator.generateReport('evt-nonexistent')
    expect(report).toBeNull()
  })

  it('[店长-3] 正常流程: 店长可以查看审核队列了解待审核内容总量', async () => {
    // 先存储一些内容并标记审核
    svc.moderationService.storeContent('c001', '测试内容', 'text')
    svc.moderationService.flagForReview('c001')
    const queue = svc.moderationService.getReviewQueue()
    expect(Array.isArray(queue)).toBe(true)
    expect(queue.length).toBeGreaterThanOrEqual(1)
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// 🛒 前台视角 - 前台关心内容提交通道、审核结果快速展示
// ══════════════════════════════════════════════════════════════════════════════

describe('🛒前台视角 - ai-content 模块', () => {
  let svc: ReturnType<typeof setupServices>

  beforeEach(() => {
    svc = setupServices()
  })

  it('[前台-1] 正常流程: 前台提交的文字内容通过审核后标记为通过', () => {
    svc.moderationService.storeContent('c010', '今天天气真好', 'text')
    const result = svc.moderationService.moderateContent('今天天气真好', 'text')
    expect(result.passed).toBe(true)
    expect(result.violations).toHaveLength(0)
    expect(result.flagged).toBe(false)
  })

  it('[前台-2] 边界: 前台提交含敏感词的文本应被标记违规并触发人工审核', () => {
    svc.moderationService.storeContent('c011', '打架事件报告', 'text')
    const result = svc.moderationService.moderateContent('打架事件报告', 'text')
    expect(result.passed).toBe(false)
    expect(result.violations.length).toBeGreaterThan(0)
    expect(result.flagged).toBe(true)
  })

  it('[前台-3] 正常流程: 前台可提交图片描述并通过内容审核', () => {
    const result = svc.moderationService.moderateContent('团建活动合影', 'image_description')
    expect(result.passed).toBe(true)
    expect(result.violations).toHaveLength(0)
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// 👥HR 视角 - HR 关注成员进步幅度、绩效对比
// ══════════════════════════════════════════════════════════════════════════════

describe('👥HR视角 - ai-content 模块', () => {
  let svc: ReturnType<typeof setupServices>

  beforeEach(() => {
    svc = setupServices()
  })

  it('[HR-1] 正常流程: HR 可以记录并查询成员的进步幅度', () => {
    svc.progressAnalyzer.recordMetric('mem-001', '2024-Q1', 'sales', 80)
    svc.progressAnalyzer.recordMetric('mem-001', '2024-Q2', 'sales', 120)
    const improvement = svc.progressAnalyzer.calculateImprovement('mem-001', 'sales')
    expect(improvement).not.toBeNull()
    // Q1=80, Q2=120 => improvement = (120-80)/80 * 100 = 50
    expect(improvement).toBe(50)
  })

  it('[HR-2] 边界: HR 查询一个尚无历史记录成员的进步幅度应获默认值', () => {
    const improvement = svc.progressAnalyzer.calculateImprovement('mem-new-001', 'attendance')
    // 无历史数据时返回模拟值，不会抛异常
    expect(improvement).not.toBeNull()
    expect(typeof improvement).toBe('number')
  })

  it('[HR-3] 正常流程: HR 可以比较两个周期成员的表现数据', () => {
    svc.progressAnalyzer.recordMetric('mem-002', '2024-Q1', 'revenue', 5000)
    svc.progressAnalyzer.recordMetric('mem-002', '2024-Q1', 'revenue', 6000)
    svc.progressAnalyzer.recordMetric('mem-002', '2024-Q2', 'revenue', 8000)

    const comparison = svc.progressAnalyzer.comparePerformance('mem-002', '2024-Q1', '2024-Q2')
    expect(comparison).not.toBeNull()
    expect(comparison!.before).toBeGreaterThan(0)
    expect(comparison!.after).toBeGreaterThan(0)
    expect(comparison!.improvement).toBeGreaterThan(0)
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// 🔧安监视角 - 内容安全审核、视频去重、违规检测
// ══════════════════════════════════════════════════════════════════════════════

describe('🔧安监视角 - ai-content 模块', () => {
  let svc: ReturnType<typeof setupServices>

  beforeEach(() => {
    svc = setupServices()
  })

  it('[安监-1] 正常流程: 安监可以检测含暴力关键词的内容', () => {
    const result = svc.moderationService.moderateContent('有人打架了需要处理', 'text')
    expect(result.passed).toBe(false)
    expect(result.violations.some((v) => v.type === 'violence')).toBe(true)
    expect(result.violations[0].severity).toBe('medium')
  })

  it('[安监-2] 边界: 安监检测混合违规内容应列出所有违规类型', () => {
    const result = svc.moderationService.moderateContent('分裂打架加微信', 'text')
    expect(result.violations.length).toBeGreaterThanOrEqual(3) // political + violence + advertising
  })

  it('[安监-3] 正常流程: 安监可以标记内容进行人工复查并查看审核队列', () => {
    svc.moderationService.storeContent('c020', '待审核内容', 'text')
    svc.moderationService.storeContent('c021', '另一条待审核', 'text')
    svc.moderationService.flagForReview('c020')
    svc.moderationService.flagForReview('c021')
    const queue = svc.moderationService.getReviewQueue()
    expect(queue).toContain('c020')
    expect(queue).toContain('c021')
  })

  it('[安监-4] 正常流程: 安监审批通过内容后将其移出队列', () => {
    svc.moderationService.storeContent('c022', '审批测试', 'text')
    svc.moderationService.flagForReview('c022')
    expect(svc.moderationService.getReviewQueue()).toContain('c022')
    const approved = svc.moderationService.approveContent('c022')
    expect(approved).toBe(true)
    expect(svc.moderationService.getReviewQueue()).not.toContain('c022')
  })

  it('[安监-5] 边界: 安监审批一个不存在的内容应返回 false', () => {
    const result = svc.moderationService.approveContent('content-not-exists')
    expect(result).toBe(false)
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// 🎮导玩员视角 - 导玩员关注视频去重、内容分享
// ══════════════════════════════════════════════════════════════════════════════

describe('🎮导玩员视角 - ai-content 模块', () => {
  let svc: ReturnType<typeof setupServices>

  beforeEach(() => {
    svc = setupServices()
  })

  it('[导玩员-1] 正常流程: 导玩员可以为教学视频计算指纹并比对相似度', () => {
    const fp1 = svc.videoDedupService.computeVideoFingerprint('vid-coach-001')
    const fp2 = svc.videoDedupService.computeVideoFingerprint('vid-coach-001')
    // 相同视频的指纹应完全一致（id相同）
    expect(fp1.hash).toBe(fp2.hash)
    const similarity = svc.videoDedupService.computeSimilarity(fp1.hash, fp2.hash)
    expect(similarity).toBe(1.0)
  })

  it('[导玩员-2] 边界: 导玩员计算不存在视频的指纹不会报错', () => {
    // 计算新视频指纹，引擎会生成伪随机但一致的指纹
    const fp = svc.videoDedupService.computeVideoFingerprint('vid-new-003')
    expect(fp.videoId).toBe('vid-new-003')
    expect(fp.hash.length).toBe(16)
    expect(fp.frames.length).toBe(30)
    expect(fp.duration).toBeGreaterThan(0)
  })

  it('[导玩员-3] 正常流程: 导玩员可以对报告添加高亮标记', async () => {
    const report = await svc.reportGenerator.generateReport('evt-002')
    expect(report).not.toBeNull()

    const updated = svc.reportGenerator.addHighlights(report!.id, ['漂流过程很刺激', '团队配合默契'])
    expect(updated).not.toBeNull()
    expect(updated!.highlights).toContain('漂流过程很刺激')
    expect(updated!.highlights).toContain('团队配合默契')
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// 🎯运行专员视角 - 运行专员关注重复视频检测、性能指标追踪
// ══════════════════════════════════════════════════════════════════════════════

describe('🎯运行专员视角 - ai-content 模块', () => {
  let svc: ReturnType<typeof setupServices>

  beforeEach(() => {
    svc = setupServices()
  })

  it('[运行专员-1] 正常流程: 运行专员可以检测重复视频（相同ID返回自身无匹配）', () => {
    svc.videoDedupService.computeVideoFingerprint('vid-ops-001')
    svc.videoDedupService.computeVideoFingerprint('vid-ops-002')
    const duplicates = svc.videoDedupService.findDuplicates('vid-ops-001')
    expect(Array.isArray(duplicates)).toBe(true)
    // 两个不同视频指纹通常会低于0.8阈值
    duplicates.forEach((d) => {
      expect(d.videoId).not.toBe('vid-ops-001')
    })
  })

  it('[运行专员-2] 边界: 运行专员计算两个完全不同长度指纹的相似度为 0', () => {
    const similarity = svc.videoDedupService.computeSimilarity('abc', 'defgh')
    expect(similarity).toBe(0)
  })

  it('[运行专员-3] 正常流程: 运行专员可以记录并获取成员进步数据', () => {
    svc.progressAnalyzer.recordMetric('mem-ops-001', '2024-W01', 'efficiency', 75)
    svc.progressAnalyzer.recordMetric('mem-ops-001', '2024-W02', 'efficiency', 85)
    svc.progressAnalyzer.recordMetric('mem-ops-001', '2024-W03', 'efficiency', 95)
    const improvement = svc.progressAnalyzer.calculateImprovement('mem-ops-001', 'efficiency')
    expect(improvement).not.toBeNull()
    // 75 -> 95 = (95-75)/75 * 100 ≈ 26.67
    expect(improvement).toBeCloseTo(26.67, 0)
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// 🤝团建视角 - 团建专员关心报告生成、分享、高亮
// ══════════════════════════════════════════════════════════════════════════════

describe('🤝团建视角 - ai-content 模块', () => {
  let svc: ReturnType<typeof setupServices>

  beforeEach(() => {
    svc = setupServices()
  })

  it('[团建-1] 正常流程: 团建专员可以生成报告并分享给指定成员', async () => {
    const report = await svc.reportGenerator.generateReport('evt-001')
    expect(report).not.toBeNull()

    const shared = svc.reportGenerator.shareReport(report!.id, ['张三', '李四'])
    expect(shared).not.toBeNull()
    expect(shared!.sharedWith).toContain('张三')
    expect(shared!.sharedWith).toContain('李四')
  })

  it('[团建-2] 边界: 团建专员分享不存在的报告应返回 null', () => {
    const result = svc.reportGenerator.shareReport('nonexistent-report', ['张三'])
    expect(result).toBeNull()
  })

  it('[团建-3] 正常流程: 团建专员可以生成多个不同类型活动报告并获取各自统计数据', async () => {
    const report1 = await svc.reportGenerator.generateReport('evt-001') // 春季团建
    const report2 = await svc.reportGenerator.generateReport('evt-002') // 夏日漂流

    expect(report1).not.toBeNull()
    expect(report2).not.toBeNull()
    expect(report1!.eventId).not.toBe(report2!.eventId)

    // 春季团建: 45/50 = 90% 参与率
    expect(report1!.stats.participationRate).toBe(90)
    // 夏日漂流: 28/30 ≈ 93.3%
    expect(report2!.stats.participationRate).toBeCloseTo(93.3, 0)
  })

  it('[团建-4] 正常流程: 团建专员可以通过 eventId 查询已经生成的报告', async () => {
    await svc.reportGenerator.generateReport('evt-001')
    const fetched = svc.reportGenerator.getReport('evt-001')
    expect(fetched).not.toBeNull()
    expect(fetched!.eventId).toBe('evt-001')
  })

  it('[团建-5] 边界: 团建专员查询尚未生成报告的 eventId 返回 null', () => {
    const fetched = svc.reportGenerator.getReport('evt-not-generated')
    expect(fetched).toBeNull()
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// 📢营销视角 - 营销关注内容合规、批量审核、数据看板
// ══════════════════════════════════════════════════════════════════════════════

describe('📢营销视角 - ai-content 模块', () => {
  let svc: ReturnType<typeof setupServices>

  beforeEach(() => {
    svc = setupServices()
  })

  it('[营销-1] 正常流程: 营销专员可以批量审核多条策划文案', () => {
    const items = [
      { id: 'ad-001', content: '欢迎光临本店', type: 'text' as const },
      { id: 'ad-002', content: '优惠活动进行中', type: 'text' as const },
    ]
    for (const item of items) {
      svc.moderationService.storeContent(item.id, item.content, 'text')
      const result = svc.moderationService.moderateContent(item.content, 'text')
      if (!result.passed) {
        svc.moderationService.flagForReview(item.id)
      }
    }
    const queue = svc.moderationService.getReviewQueue()
    // '促销' 是广告关键词，ad-002 应被标记
    expect(queue.length).toBeGreaterThanOrEqual(1)
  })

  it('[营销-2] 边界: 营销专员需识别含营销关键词的内容并标记违规', () => {
    const result = svc.moderationService.moderateContent('加我微信了解更多优惠促销', 'text')
    expect(result.passed).toBe(false)
    expect(result.violations.some((v) => v.type === 'advertising')).toBe(true)
    // 广告违规为 low 严重度，flagged 为 false（仅高/中严重度触发 flagged）
    expect(result.flagged).toBe(false)
  })

  it('[营销-3] 正常流程: 营销专员可以查看已通过审核的内容统计', () => {
    svc.moderationService.storeContent('mkt-001', '合规广告文案', 'text')
    svc.moderationService.storeContent('mkt-002', '合法宣传内容', 'text')
    svc.moderationService.approveContent('mkt-001')
    svc.moderationService.approveContent('mkt-002')
    // 审核通过后内容不在队列中
    const queue = svc.moderationService.getReviewQueue()
    expect(queue).not.toContain('mkt-001')
    expect(queue).not.toContain('mkt-002')
  })
})
