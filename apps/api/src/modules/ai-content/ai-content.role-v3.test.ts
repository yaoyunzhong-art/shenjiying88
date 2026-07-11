import { describe, it, expect, beforeEach } from 'vitest'
/**
 * 🐜 自动: [ai-content] [C] 角色测试 v3（高级场景覆盖）
 *
 * 进阶 8 角色视角的 ai-content 模块测试：
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色至少 2 个高级测试用例：
 *   - 正常流程（跨功能组合）
 *   - 权限边界 / 数据缺失 / 空输入
 *
 * 覆盖 ai-content controller 所有端点:
 *   report/generate, report/:eventId, report/:reportId/highlights, report/:reportId/share
 *   moderate, moderate/batch, moderate/:contentId/flag, moderate/:contentId/review, moderate/queue
 *   video/fingerprint, video/detect-duplicates, video/compare
 *   progress/improvement, progress/compare
 */

import assert from 'node:assert/strict'
import { AiContentController } from './ai-content.controller'
import {
  TeamBuildingReportGenerator,
  ContentModerationService,
  VideoDeduplicationService,
  ProgressAnalyzer,
} from './ai-content.service'
import { ContentTypeEnum } from './ai-content.dto'

// ── 角色定义 ──
const ROLES = {
  StoreManager: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Safety: '🔧安监',
  Guide: '🎮导玩员',
  Ops: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
} as const

// ── 测试工厂（注入已存储内容的 moderationService） ──
function createController() {
  const reportGenerator = new TeamBuildingReportGenerator()
  const moderationService = new ContentModerationService()
  const videoDedupService = new VideoDeduplicationService()
  const progressAnalyzer = new ProgressAnalyzer()

  // 预存内容供 flag/review 流程使用
  moderationService.storeContent('front-flagged-content', '玩家留言：手感很好', ContentTypeEnum.TEXT)
  moderationService.storeContent('safety-flagged-001', '我要退款！垃圾机台！', ContentTypeEnum.TEXT)
  moderationService.storeContent('mkt-spam-001', '扫码加微信领大奖', ContentTypeEnum.TEXT)

  return new AiContentController(
    reportGenerator,
    moderationService,
    videoDedupService,
    progressAnalyzer,
  )
}

// ══════════════════════════════════════════════════════════════
// 👔 店长（StoreManager）
// 店长关注门店 AI 能力全景：团建报告、内容审核总览、玩家进步
// ══════════════════════════════════════════════════════════════
describe(`${ROLES.StoreManager} ai-content 角色 v3 测试`, () => {
  it('[店长] 生成报告后添加亮点 — 完整团建流程', async () => {
    const ctrl = createController()

    // 1) 生成团建报告（使用预定义的事件 ID）
    const genRes = await ctrl.generateReport({ eventId: 'evt-001' })
    assert.equal(genRes.success, true)
    assert.ok(genRes.data)
    assert.ok(genRes.data!.report.eventId === 'evt-001')
    assert.ok(genRes.data!.report.stats.participationRate > 0)

    // 2) getReport 根据 eventId 查找
    const getRes = ctrl.getReport('evt-001')
    assert.equal(getRes.success, true)
    assert.ok(getRes.data)
    assert.equal(getRes.data!.eventId, 'evt-001')

    // 3) 添加亮点
    assert.ok(getRes.data)
    const highlightRes = ctrl.addHighlights(getRes.data!.id, {
      highlights: ['团队默契提升 30%', '新人融入率 100%'],
    })
    assert.equal(highlightRes.success, true)
    assert.ok(highlightRes.data)
    assert.ok(highlightRes.data!.highlights.length >= 2)

    // 4) 分享报告
    assert.ok(getRes.data)
    const shareRes = ctrl.shareReport(getRes.data!.id, {
      recipients: ['assistant@store-1'],
    })
    assert.equal(shareRes.success, true)
    assert.ok(shareRes.data)
    assert.ok(shareRes.data!.sharedWith.length >= 1)
  })

  it('[店长] 查看不存在的报告 — 优雅失败', () => {
    const ctrl = createController()
    const res = ctrl.getReport('non-existent-event-id')
    assert.equal(res.success, false)
    assert.ok(res.message?.includes('not found'))
  })

  it('[店长] 浏览审核队列中待审内容', () => {
    const ctrl = createController()
    const queue = ctrl.getReviewQueue()
    assert.equal(queue.success, true)
    assert.ok(queue.data)
    assert.ok(Array.isArray(queue.data!.queue))
    assert.equal(typeof queue.data!.size, 'number')
  })
})

// ══════════════════════════════════════════════════════════════
// 🛒 前台（FrontDesk）
// 前台关心内容审核与玩家进步数据，应对日常查询
// ══════════════════════════════════════════════════════════════
describe(`${ROLES.FrontDesk} ai-content 角色 v3 测试`, () => {
  it('[前台] 审核一段玩家留言（正常文本）', () => {
    const ctrl = createController()
    const res = ctrl.moderateContent({
      content: '今天游戏很好玩！',
      type: ContentTypeEnum.TEXT,
    })
    assert.equal(res.success, true)
    assert.ok(res.data)
    assert.equal(res.data!.passed, true)
    assert.equal(res.data!.flagged, false)
    assert.equal(res.data!.violations.length, 0)
  })

  it('[前台] 批量审核多条内容 — 返回每条结果', () => {
    const ctrl = createController()
    const res = ctrl.batchModerate({
      items: [
        { id: 'msg-01', content: '高手玩家，太厉害了', type: ContentTypeEnum.TEXT },
        { id: 'msg-02', content: '机台故障，请处理', type: ContentTypeEnum.TEXT },
      ],
    })
    assert.equal(res.success, true)
    assert.ok(res.data)
    assert.equal(res.data!.results.length, 2)
    assert.equal(res.data!.results[0].id, 'msg-01')
    assert.equal(res.data!.results[1].id, 'msg-02')
    // 两条都无违规
    assert.equal(res.data!.results[0].passed, true)
    assert.equal(res.data!.results[1].passed, true)
  })

  it('[前台] 存储内容后标记待审核再通过 — 完整审核流程', () => {
    const ctrl = createController()
    // 标记
    const flagRes = ctrl.flagForReview('front-flagged-content')
    assert.equal(flagRes.success, true)
    // 审批通过
    const approveRes = ctrl.reviewContent('front-flagged-content', { action: 'approve' })
    assert.equal(approveRes.success, true)
    assert.ok(approveRes.message?.includes('approved'))
  })
})

// ══════════════════════════════════════════════════════════════
// 👥 HR
// HR 关注员工进步分析与团建活动数据
// ══════════════════════════════════════════════════════════════
describe(`${ROLES.HR} ai-content 角色 v3 测试`, () => {
  it('[HR] 记录员工进步指标并计算改善', () => {
    const ctrl = createController()
    const recRes = ctrl.calculateImprovement({
      memberId: 'emp-hr-001',
      period: '2026-Q2',
      metric: 'score',
      value: 85,
    })
    assert.equal(recRes.success, true)
    assert.ok(recRes.data)
    assert.equal(recRes.data!.memberId, 'emp-hr-001')
    assert.equal(recRes.data!.metric, 'score')
    // calculateImprovement 直接调用 service 的逻辑
    assert.equal(typeof recRes.data!.improvement, 'number')
  })

  it('[HR] 比较员工两期绩效 — 有足够数据', () => {
    const ctrl = createController()
    // record 两期数据（controller 的 calculateImprovement 内部会 recordMetric）
    ctrl.calculateImprovement({ memberId: 'emp-hr-002', period: '2026-Q1', metric: 'score', value: 60 })
    ctrl.calculateImprovement({ memberId: 'emp-hr-002', period: '2026-Q2', metric: 'score', value: 85 })
    const compareRes = ctrl.comparePerformance({
      memberId: 'emp-hr-002',
      metric: 'score',
      beforePeriod: '2026-Q1',
      afterPeriod: '2026-Q2',
    })
    assert.equal(compareRes.success, true)
    assert.ok(compareRes.data)
    assert.ok(typeof compareRes.data!.improvement === 'number')
  })

  it('[HR] 比较数据不足的两期 — 优雅失败', () => {
    const ctrl = createController()
    const res = ctrl.comparePerformance({
      memberId: 'emp-unknown',
      metric: 'score',
      beforePeriod: '2025-Q1',
      afterPeriod: '2025-Q2',
    })
    assert.equal(res.success, false)
    assert.ok(res.message?.includes('Insufficient data'))
  })
})

// ══════════════════════════════════════════════════════════════
// 🔧 安监（Safety/Security）
// 安监关注内容安全审核与视频去重，防止违规内容传播
// ══════════════════════════════════════════════════════════════
describe(`${ROLES.Safety} ai-content 角色 v3 测试`, () => {
  it('[安监] 审核含暴力敏感词内容 — 触发标记', () => {
    const ctrl = createController()
    const res = ctrl.moderateContent({
      content: '打架斗殴是暴力行为',
      type: ContentTypeEnum.TEXT,
    })
    assert.equal(res.success, true)
    assert.ok(res.data)
    // 应该检测到暴力违规（medium 级别，flagged=true）
    assert.equal(res.data!.passed, false)
    assert.equal(res.data!.flagged, true)
    assert.ok(res.data!.violations.length > 0)
    const violenceViolations = res.data!.violations.filter((v: { type: string }) => v.type === 'violence')
    assert.ok(violenceViolations.length > 0)
  })

  it('[安监] 审核正常内容 — 无违规', () => {
    const ctrl = createController()
    const res = ctrl.moderateContent({
      content: '这个机台好好玩，下次再来',
      type: ContentTypeEnum.TEXT,
    })
    assert.equal(res.success, true)
    assert.ok(res.data)
    assert.equal(res.data!.passed, true)
    assert.equal(res.data!.flagged, false)
  })

  it('[安监] 拒绝违规内容 — content rejected 流程', () => {
    const ctrl = createController()
    const flagRes = ctrl.flagForReview('safety-flagged-001')
    assert.equal(flagRes.success, true)
    const rejectRes = ctrl.reviewContent('safety-flagged-001', { action: 'reject' })
    assert.equal(rejectRes.success, true)
    assert.ok(rejectRes.message?.includes('rejected'))
  })
})

// ══════════════════════════════════════════════════════════════
// 🎮 导玩员（Guide）
// 导玩员关注视频去重与重复内容识别
// ══════════════════════════════════════════════════════════════
describe(`${ROLES.Guide} ai-content 角色 v3 测试`, () => {
  it('[导玩员] 计算视频指纹 — 返回指纹对象', () => {
    const ctrl = createController()
    const res = ctrl.computeFingerprint({ videoId: 'gameplay-highlight-001' })
    assert.equal(res.success, true)
    assert.ok(res.data)
    assert.ok(typeof res.data!.hash === 'string')
    assert.ok(res.data!.hash.length > 0)
    assert.ok(typeof res.data!.duration === 'number')
    assert.ok(Array.isArray(res.data!.frames))
  })

  it('[导玩员] 检测重复视频 — 无重复时返回空数组', () => {
    const ctrl = createController()
    const res = ctrl.detectDuplicates({ videoId: 'unique-video-abc' })
    assert.equal(res.success, true)
    assert.ok(res.data)
    assert.equal(res.data!.videoId, 'unique-video-abc')
    assert.ok(Array.isArray(res.data!.duplicates))
    assert.equal(res.data!.duplicates.length, 0)
  })

  it('[导玩员] 比较两个视频指纹的相似度', () => {
    const ctrl = createController()
    const fp1Res = ctrl.computeFingerprint({ videoId: 'vid-a' })
    const fp2Res = ctrl.computeFingerprint({ videoId: 'vid-b' })
    assert.ok(fp1Res.data)
    assert.ok(fp2Res.data)
    const compareRes = ctrl.compareVideos({
      fingerprint1: fp1Res.data!.hash,
      fingerprint2: fp2Res.data!.hash,
    })
    assert.equal(compareRes.success, true)
    assert.ok(compareRes.data)
    assert.ok(typeof compareRes.data!.similarity === 'number')
    assert.ok(compareRes.data!.similarity >= 0 && compareRes.data!.similarity <= 1)
  })
})

// ══════════════════════════════════════════════════════════════
// 🎯 运行专员（Operations）
// 运行专员关注系统功能完整性、不可用报告回退
// ══════════════════════════════════════════════════════════════
describe(`${ROLES.Ops} ai-content 角色 v3 测试`, () => {
  it('[运行专员] 查看不存在的报告 — 返回友好错误', () => {
    const ctrl = createController()
    const res = ctrl.getReport('ops-missing-report')
    assert.equal(res.success, false)
    assert.ok(res.message?.includes('not found'))
  })

  it('[运行专员] 生成报告并立即读取 — 数据一致性', async () => {
    const ctrl = createController()
    await ctrl.generateReport({ eventId: 'evt-001' })
    const readRes = ctrl.getReport('evt-001')
    assert.equal(readRes.success, true)
    assert.ok(readRes.data)
    assert.equal(readRes.data!.eventId, 'evt-001')
  })

  it('[运行专员] 记录进步指标为零值 — 边界处理', () => {
    const ctrl = createController()
    const res = ctrl.calculateImprovement({
      memberId: 'ops-zero',
      period: '2026-Q2',
      metric: 'score',
      value: 0,
    })
    assert.equal(res.success, true)
    assert.ok(res.data)
    assert.equal(typeof res.data!.improvement, 'number')
  })
})

// ══════════════════════════════════════════════════════════════
// 🤝 团建（Teambuilding）
// 团建是 ai-content 的核心功能，关注报告生成与分享
// ══════════════════════════════════════════════════════════════
describe(`${ROLES.Teambuilding} ai-content 角色 v3 测试`, () => {
  it('[团建] 生成团建报告后获取 — 报告含统计数据', async () => {
    const ctrl = createController()
    const genRes = await ctrl.generateReport({ eventId: 'evt-001' })
    assert.equal(genRes.success, true)
    assert.ok(genRes.data)
    assert.ok(genRes.data!.report.stats.participationRate > 0)
    assert.ok(typeof genRes.data!.report.stats.topActivity === 'string' && genRes.data!.report.stats.topActivity.length > 0)

    // 获取报告并验证内容
    const getRes = ctrl.getReport('evt-001')
    assert.equal(getRes.success, true)
    assert.ok(getRes.data)
    assert.ok(getRes.data!.stats.participationRate > 0)
  })

  it('[团建] 为报告添加多条亮点 — 亮点追加成功', async () => {
    const ctrl = createController()
    await ctrl.generateReport({ eventId: 'evt-001' })
    const getRes = ctrl.getReport('evt-001')
    assert.ok(getRes.data)
    const reportId = getRes.data!.id

    const res = ctrl.addHighlights(reportId, {
      highlights: ['气氛活跃', '团队协作提升', '优秀个人表彰', '新纪录诞生'],
    })
    assert.equal(res.success, true)
    assert.ok(res.data)
    assert.ok(res.data!.highlights.length >= 4)
  })

  it('[团建] 分享报告给多人 — sharedWith 被正确更新', async () => {
    const ctrl = createController()
    await ctrl.generateReport({ eventId: 'evt-001' })
    const getRes = ctrl.getReport('evt-001')
    assert.ok(getRes.data)
    const reportId = getRes.data!.id

    const res = ctrl.shareReport(reportId, {
      recipients: ['manager@arcade', 'hr@arcade'],
    })
    assert.equal(res.success, true)
    assert.ok(res.data)
    assert.ok(res.data!.sharedWith.includes('manager@arcade'))
    assert.ok(res.data!.sharedWith.includes('hr@arcade'))
  })
})

// ══════════════════════════════════════════════════════════════
// 📢 营销（Marketing）
// 营销关注内容审核合规与玩家进步数据用于活动策划
// ══════════════════════════════════════════════════════════════
describe(`${ROLES.Marketing} ai-content 角色 v3 测试`, () => {
  it('[营销] 批量审核营销文案 — 批量结果正确', () => {
    const ctrl = createController()
    const res = ctrl.batchModerate({
      items: [
        { id: 'ad-001', content: '新用户充值送100积分！', type: ContentTypeEnum.TEXT },
        { id: 'ad-002', content: '本周六电竞赛报名', type: ContentTypeEnum.TEXT },
        { id: 'ad-003', content: '点击链接领取大奖', type: ContentTypeEnum.TEXT },
      ],
    })
    assert.equal(res.success, true)
    assert.ok(res.data)
    assert.equal(res.data!.results.length, 3)
    // 营销文案可能触发广告检测
    res.data!.results.forEach((r: { id: string; passed: boolean }) => {
      assert.ok(typeof r.passed === 'boolean')
    })
  })

  it('[营销] 计算玩家进步指标用于营销活动定向', () => {
    const ctrl = createController()
    ctrl.calculateImprovement({ memberId: 'player-star', period: '2026-Q1', metric: 'game_score', value: 2000 })
    ctrl.calculateImprovement({ memberId: 'player-star', period: '2026-Q2', metric: 'game_score', value: 5000 })
    const compareRes = ctrl.comparePerformance({
      memberId: 'player-star',
      metric: 'game_score',
      beforePeriod: '2026-Q1',
      afterPeriod: '2026-Q2',
    })
    assert.equal(compareRes.success, true)
    assert.ok(compareRes.data)
    assert.ok(typeof compareRes.data!.improvement === 'number')
  })

  it('[营销] 标记并拒绝不当营销内容', () => {
    const ctrl = createController()
    const flagRes = ctrl.flagForReview('mkt-spam-001')
    assert.equal(flagRes.success, true)
    const rejectRes = ctrl.reviewContent('mkt-spam-001', { action: 'reject' })
    assert.equal(rejectRes.success, true)
    assert.ok(rejectRes.message?.includes('rejected'))
  })
})
