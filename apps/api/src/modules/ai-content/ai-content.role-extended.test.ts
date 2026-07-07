import { describe, it, expect, beforeEach } from 'vitest'
import {
  TeamBuildingReportGenerator,
  ContentModerationService,
  VideoDeduplicationService,
  ProgressAnalyzer,
} from './ai-content.service'

/**
 * 🐜 [ai-content] 角色扩展测试
 * 从 8 个角色视角覆盖更多边界、异常和复杂场景
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 */

const ROLES = {
  StoreManager: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Safety: '🔧安监',
  Guide: '🎮导玩员',
  Ops: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
}

function setup() {
  return {
    reportGenerator: new TeamBuildingReportGenerator(),
    moderationService: new ContentModerationService(),
    videoDedupService: new VideoDeduplicationService(),
    progressAnalyzer: new ProgressAnalyzer(),
  }
}

describe(`${ROLES.StoreManager} ai-content 扩展测试`, () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('店长查询团建报告统计时确认参与率和时长数据', async () => {
    const r = await svc.reportGenerator.generateReport('evt-001')
    expect(r).not.toBeNull()
    expect(r!.stats.participationRate).toBeGreaterThanOrEqual(0)
    expect(r!.stats.participationRate).toBeLessThanOrEqual(100)
    expect(r!.stats.avgDuration).toBeGreaterThan(0)
    expect(r!.stats.topActivity).toBeTruthy()
  })

  it('店长查看审核队列空状态不报错', () => {
    const q = svc.moderationService.getReviewQueue()
    expect(Array.isArray(q)).toBe(true)
    expect(q).toHaveLength(0)
  })

  it('店长添加高亮后报告更新时间应变化', async () => {
    const r = await svc.reportGenerator.generateReport('evt-001')
    const before = r!.updatedAt
    await new Promise(r => setTimeout(r, 10))
    svc.reportGenerator.addHighlights(r!.id, ['新亮点'])
    const after = svc.reportGenerator.getReport('evt-001')!.updatedAt
    expect(after).not.toBe(before)
  })
})

describe(`${ROLES.FrontDesk} ai-content 扩展测试`, () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('前台提交通用合规内容时应无违规通过', () => {
    const r = svc.moderationService.moderateContent('欢迎光临游乐场', 'text')
    expect(r.passed).toBe(true)
    expect(r.violations).toHaveLength(0)
  })

  it('前台提交含政治敏感词内容应被标记', () => {
    const r = svc.moderationService.moderateContent('分裂行为不可取', 'text')
    expect(r.passed).toBe(false)
    expect(r.violations.some(v => v.type === 'political')).toBe(true)
    expect(r.violations[0].severity).toBe('high')
  })

  it('前台提交空字符串应通过审核', () => {
    const r = svc.moderationService.moderateContent('', 'text')
    expect(r.passed).toBe(true)
  })
})

describe(`${ROLES.HR} ai-content 扩展测试`, () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('HR 记录单一指标不足两条时不返回 null', () => {
    svc.progressAnalyzer.recordMetric('mem-hr', '2024-Q1', 'score', 50)
    const imp = svc.progressAnalyzer.calculateImprovement('mem-hr', 'score')
    expect(imp).not.toBeNull()
    expect(typeof imp).toBe('number')
  })

  it('HR 比较两个周期时返回提升百分比', () => {
    svc.progressAnalyzer.recordMetric('mem-hr2', '2024-Q1', 'sales', 100)
    svc.progressAnalyzer.recordMetric('mem-hr2', '2024-Q1', 'sales', 200)
    svc.progressAnalyzer.recordMetric('mem-hr2', '2024-Q2', 'sales', 300)
    const c = svc.progressAnalyzer.comparePerformance('mem-hr2', '2024-Q1', '2024-Q2')
    expect(c).not.toBeNull()
    expect(c!.before).toBe(150)
    expect(c!.after).toBe(300)
    expect(c!.improvement).toBe(150)
  })

  it('HR 查询不存在的成员比较应返回 null', () => {
    const c = svc.progressAnalyzer.comparePerformance('no-such-member', 'Q1', 'Q2')
    expect(c).toBeNull()
  })
})

describe(`${ROLES.Safety} ai-content 扩展测试`, () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('安监检测混合违规列出所有类型', () => {
    const r = svc.moderationService.moderateContent('分裂暴力加微信', 'text')
    expect(r.violations.length).toBeGreaterThanOrEqual(3)
  })

  it('安监标记不存在内容返回 false', () => {
    const r = svc.moderationService.flagForReview('not-exists')
    expect(r).toBe(false)
  })

  it('安监审核通过不存在内容返回 false', () => {
    const r = svc.moderationService.approveContent('no-such')
    expect(r).toBe(false)
  })
})

describe(`${ROLES.Guide} ai-content 扩展测试`, () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('导玩员比较两个不同视频指纹的相似度', () => {
    const fp1 = svc.videoDedupService.computeVideoFingerprint('vid-a')
    const fp2 = svc.videoDedupService.computeVideoFingerprint('vid-b')
    const sim = svc.videoDedupService.computeSimilarity(fp1.hash, fp2.hash)
    expect(sim).toBeGreaterThanOrEqual(0)
    expect(sim).toBeLessThanOrEqual(1)
  })

  it('导玩员查找重复时自身不应出现在结果中', () => {
    svc.videoDedupService.computeVideoFingerprint('vid-self')
    const dups = svc.videoDedupService.findDuplicates('vid-self')
    expect(dups.every(d => d.videoId !== 'vid-self')).toBe(true)
  })

  it('导玩员添加高亮后报告内容应包含新增', async () => {
    const r = await svc.reportGenerator.generateReport('evt-001')
    svc.reportGenerator.addHighlights(r!.id, ['团队表现优异'])
    const updated = svc.reportGenerator.getReport('evt-001')
    expect(updated!.highlights).toContain('团队表现优异')
  })
})

describe(`${ROLES.Ops} ai-content 扩展测试`, () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('运行专员记录多项指标并获取整体进步', () => {
    svc.progressAnalyzer.recordMetric('mem-ops', '2024-W01', 'speed', 60)
    svc.progressAnalyzer.recordMetric('mem-ops', '2024-W02', 'speed', 80)
    svc.progressAnalyzer.recordMetric('mem-ops', '2024-W03', 'speed', 100)
    const imp = svc.progressAnalyzer.calculateImprovement('mem-ops', 'speed')
    expect(imp).toBeCloseTo(66.67, 0)
  })

  it('运行专员对空视频集合查重不报错', () => {
    const dups = svc.videoDedupService.findDuplicates('vid-orphan')
    expect(Array.isArray(dups)).toBe(true)
  })
})

describe(`${ROLES.Teambuilding} ai-content 扩展测试`, () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('团建专员生成报告后通过 eventId 查询', async () => {
    await svc.reportGenerator.generateReport('evt-001')
    const r = svc.reportGenerator.getReport('evt-001')
    expect(r).not.toBeNull()
    expect(r!.summary).toContain('春季团建')
  })

  it('团建专员分享报告传递多个收件人', async () => {
    const r = await svc.reportGenerator.generateReport('evt-001')
    const s = svc.reportGenerator.shareReport(r!.id, ['alice', 'bob', 'carol'])
    expect(s!.sharedWith).toEqual(['alice', 'bob', 'carol'])
  })
})

describe(`${ROLES.Marketing} ai-content 扩展测试`, () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('营销专员批量审核识别含促销关键词的文案', () => {
    const r1 = svc.moderationService.moderateContent('春节促销大优惠', 'text')
    const r2 = svc.moderationService.moderateContent('加微信领红包', 'text')
    expect(r1.violations.some(v => v.type === 'advertising')).toBe(true)
    expect(r2.violations.some(v => v.type === 'advertising')).toBe(true)
  })

  it('营销专员查看已标记审核内容统计', () => {
    svc.moderationService.storeContent('mkt-c1', '待审核文案', 'text')
    svc.moderationService.storeContent('mkt-c2', '未通过文案', 'text')
    svc.moderationService.flagForReview('mkt-c1')
    svc.moderationService.flagForReview('mkt-c2')
    expect(svc.moderationService.getReviewQueue()).toHaveLength(2)
    svc.moderationService.approveContent('mkt-c1')
    expect(svc.moderationService.getReviewQueue()).toHaveLength(1)
  })

  it('营销专员视频去重后确认相似度范围合理', () => {
    const fp = svc.videoDedupService.computeVideoFingerprint('mkt-vid')
    const sim = svc.videoDedupService.computeSimilarity(fp.hash, fp.hash)
    expect(sim).toBe(1.0)
  })
})
