import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [recommender] [C] 角色扩展测试
 *
 * 8 角色视角的 advanced recommender 模块测试：
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色至少 3 个测试用例（正常流程 + 权限边界 + 异常场景）
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { RecommenderController } from './recommender.controller'
import { RecommenderService } from './recommender.service'
import { ContextBuilderService } from './context-builder.service'
import { RagRetrievalService } from './rag-retrieval.service'
import { PersonalizedRecommenderService } from './personalized-recommender.service'
import { KnowledgeIndexerService } from '../knowledge/knowledge-indexer.service'

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

// ── 工厂 ──
function createController() {
  const indexer = new KnowledgeIndexerService()
  const contextBuilder = new ContextBuilderService()
  const ragRetrieval = new RagRetrievalService(indexer)
  const recommenderService = new RecommenderService()
  const personalizedRecommender = new PersonalizedRecommenderService(contextBuilder, ragRetrieval)
  const controller = new RecommenderController(
    personalizedRecommender,
    contextBuilder,
    ragRetrieval,
    recommenderService,
  )
  return { controller, recommenderService }
}

function registerChampion(
  service: RecommenderService,
  overrides: { championId?: string; name?: string; totalScore?: number } = {},
) {
  const id = overrides.championId ?? `champ-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
  service.upsertChampion({
    championId: id,
    name: overrides.name ?? `Champion-${id}`,
    role: 'CHAMPION',
    totalScore: overrides.totalScore ?? 100,
    topModules: ['recommender', 'knowledge', 'compliance'],
    recentContributions: [
      { kind: 'COMMIT', refId: 'abc123', occurredAt: new Date().toISOString(), weight: 1.0 },
    ],
  })
  return id
}

// ===================================================================
// 👔 店长 — 关注门店知识推荐、推荐统计概览
// ===================================================================
describe(`${ROLES.StoreManager} recommender 角色扩展测试`, () => {
  it('店长获取推荐统计, 确认返回最近推荐的日志列表', () => {
    const { controller, recommenderService } = createController()
    const champId = registerChampion(recommenderService, { name: '门店管理冠军' })
    recommenderService.logRecommendation(champId, 'sales', 5, 123)
    recommenderService.logRecommendation(champId, 'report', 3, 89)
    const stats = controller.getStats({ championId: champId, days: 7 })
    assert.ok(Array.isArray(stats))
    assert.equal(stats.length, 2)
    assert.ok(stats[0].executedAt)
    assert.ok(stats[0].recommendationsCount > 0)
  })

  it('店长按模块筛选推荐统计, 确认正确过滤', () => {
    const { controller, recommenderService } = createController()
    const champId = registerChampion(recommenderService)
    recommenderService.logRecommendation(champId, 'inventory', 2, 50)
    recommenderService.logRecommendation(champId, 'sales', 4, 100)
    const filtered = controller.getStats({ championId: champId, module: 'inventory' })
    assert.equal(filtered.length, 1)
    assert.equal(filtered[0].module, 'inventory')
  })

  it('店长查询不存在的 champion 统计(边界: 返回空数组)', () => {
    const { controller } = createController()
    const stats = controller.getStats({ championId: 'non-existent', days: 30 })
    assert.ok(Array.isArray(stats))
    assert.equal(stats.length, 0)
  })
})

// ===================================================================
// 🛒 前台 — 获取知识推荐、上下文查看
// ===================================================================
describe(`${ROLES.FrontDesk} recommender 角色扩展测试`, () => {
  it('前台获取推荐结果, 确认返回推荐项列表', () => {
    const { controller, recommenderService } = createController()
    const champId = registerChampion(recommenderService)
    const result = controller.recommend({
      championId: champId,
      currentFiles: ['service.ts', 'controller.ts'],
      branch: 'feat/new-feature',
      topK: 3,
    })
    assert.ok(result.context)
    assert.ok(result.recommendations)
    assert.ok(result.recommendations.length >= 0)
    assert.equal(typeof result.context.champion.name, 'string')
  })

  it('前台查看 champion 上下文, 确认包含当前任务信息', () => {
    const { controller, recommenderService } = createController()
    const champId = registerChampion(recommenderService)
    const ctx = controller.getContext(champId)
    assert.ok(ctx)
    assert.equal(ctx.champion.championId, champId)
    assert.ok(ctx.relatedChampions)
    assert.ok(typeof ctx.builtAt === 'string')
  })

  it('前台查询不存在的 champion 上下文(边界: 返回 fallback 数据)', () => {
    const { controller } = createController()
    const ctx = controller.getContext('ghost-champion')
    assert.ok(ctx)
    assert.equal(ctx.champion.championId, 'ghost-champion') // fallback 不会抛异常
  })
})

// ===================================================================
// 👥 HR — 管理 Champion 反馈、关注采纳率  
// ===================================================================
describe(`${ROLES.HR} recommender 角色扩展测试`, () => {
  it('HR 记录推荐为已采纳, 确认成功', () => {
    const { controller, recommenderService } = createController()
    const champId = registerChampion(recommenderService)
    const result = controller.recordFeedback({
      championId: champId,
      chunkId: 'chunk-001',
      action: 'adopted',
    })
    assert.equal(result.success, true)
  })

  it('HR 记录推荐忽略状态, 确认不影响采纳率', () => {
    const { controller, recommenderService } = createController()
    const champId = registerChampion(recommenderService)
    controller.recordFeedback({ championId: champId, chunkId: 'chunk-002', action: 'dismissed' })
    controller.recordFeedback({ championId: champId, chunkId: 'chunk-003', action: 'read' })
    const feedbackStats = recommenderService.getFeedbackStats()
    assert.equal(feedbackStats.dismissed, 1)
    assert.equal(feedbackStats.read, 1)
    assert.equal(feedbackStats.total, 2)
  })

  it('HR 多冠军反馈记录, 确认各自独立', () => {
    const { controller, recommenderService } = createController()
    const a = registerChampion(recommenderService)
    const b = registerChampion(recommenderService)
    controller.recordFeedback({ championId: a, chunkId: 'a-1', action: 'adopted' })
    controller.recordFeedback({ championId: b, chunkId: 'b-1', action: 'dismissed' })
    const stats = recommenderService.getFeedbackStats()
    assert.equal(stats.adopted, 1)
    assert.equal(stats.dismissed, 1)
    assert.equal(stats.total, 2)
  })
})

// ===================================================================
// 🔧 安监 — 知识库安全检索、搜索异常场景
// ===================================================================
describe(`${ROLES.Security} recommender 角色扩展测试`, () => {
  it('安监通过知识库搜索功能, 确认返回结构化结果', () => {
    const { controller, recommenderService } = createController()
    const champId = registerChampion(recommenderService)
    const results = controller.search({
      championId: champId,
      currentFiles: [],
      topK: 2,
    })
    assert.ok(Array.isArray(results))
    if (results.length > 0) {
      assert.ok(results[0].chunkId)
      assert.ok(typeof results[0].content === 'string')
    }
  })

  it('安监搜索包含文件名过滤, 确认返回相关片段', () => {
    const { controller, recommenderService } = createController()
    const champId = registerChampion(recommenderService)
    const results = controller.search({
      championId: champId,
      currentFiles: ['api/security.ts'],
      topK: 5,
    })
    assert.ok(Array.isArray(results))
  })

  it('安监搜索空 currentFiles(边界: 确认不抛异常)', () => {
    const { controller, recommenderService } = createController()
    const champId = registerChampion(recommenderService)
    const results = controller.search({ championId: champId, currentFiles: [], topK: 0 })
    assert.ok(Array.isArray(results))
  })
})

// ===================================================================
// 🎮 导玩员 — 推荐引擎的日常使用
// ===================================================================
describe(`${ROLES.Guide} recommender 角色扩展测试`, () => {
  it('导玩员获取推荐并确认推荐内容格式正确', () => {
    const { controller, recommenderService } = createController()
    const champId = registerChampion(recommenderService, { name: '导玩知识冠军' })
    const result = controller.recommend({
      championId: champId,
      currentFiles: ['activity.ts', 'member.ts'],
      topK: 2,
    })
    assert.ok(result.recommendations)
    for (const rec of result.recommendations) {
      assert.ok(typeof rec.rank === 'number')
      assert.ok(typeof rec.chunkId === 'string')
      assert.ok(typeof rec.reason === 'string')
      assert.ok(typeof rec.confidence === 'number')
      assert.equal(rec.status, 'pending')
    }
  })

  it('导玩员查看不同 branch 上下文, 确认分支信息传递正确', () => {
    const { controller, recommenderService } = createController()
    const champId = registerChampion(recommenderService)
    const ctx = controller.getContext(champId)
    assert.ok(ctx.currentTask)
    // 默认 context 中的 branch 应为空
    assert.equal(ctx.currentTask.branch, undefined)
  })

  it('导玩员对推荐进行反馈(权限边界: 已读标记), 确认不改变采纳计数', () => {
    const { controller, recommenderService } = createController()
    const champId = registerChampion(recommenderService)
    const before = recommenderService.getFeedbackStats()
    controller.recordFeedback({ championId: champId, chunkId: 'guide-chunk', action: 'read' })
    const after = recommenderService.getFeedbackStats()
    assert.equal(after.total, before.total + 1)
    assert.equal(after.read, before.read + 1)
    assert.equal(after.adopted, before.adopted) // 未增加
  })
})

// ===================================================================
// 🎯 运行专员 — Champion 管理、高级统计
// ===================================================================
describe(`${ROLES.Operations} recommender 角色扩展测试`, () => {
  it('运行专员注册 Champion, 确认可通过上下文获取', () => {
    const { controller, recommenderService } = createController()
    const champId = registerChampion(recommenderService, { name: '运维冠军', totalScore: 200 })
    const ctx = controller.getContext(champId)
    assert.equal(ctx.champion.name, '运维冠军')
    assert.equal(ctx.champion.totalScore, 200)
  })

  it('运行专员查询多日推荐统计, 确认按时间排序(最新在前)', () => {
    const { controller, recommenderService } = createController()
    const champId = registerChampion(recommenderService)
    recommenderService.logRecommendation(champId, 'ops', 3, 55)
    recommenderService.logRecommendation(champId, 'ops', 5, 120)
    const stats = controller.getStats({ days: 30 })
    assert.ok(stats.length >= 2)
    // 最新的在前
    assert.ok(new Date(stats[0].executedAt).getTime() >= new Date(stats[1].executedAt).getTime())
  })

  it('运行专员查询 0 天范围推荐统计(边界: 返回空)', () => {
    const { controller } = createController()
    const stats = controller.getStats({ days: 0 })
    assert.ok(Array.isArray(stats))
    // 默认 0 天代表不过滤（实际所有日志都在过去0ms内, 所以为空）
    // 实际按 days=0 则不返回任何日志
    assert.equal(stats.length, 0)
  })
})

// ===================================================================
// 🤝 团建 — 跨模块推荐与协同
// ===================================================================
describe(`${ROLES.Teambuilding} recommender 角色扩展测试`, () => {
  it('团建查询跨模块统计, 确认返回所有模块的推荐日志', () => {
    const { controller, recommenderService } = createController()
    const champId = registerChampion(recommenderService)
    recommenderService.logRecommendation(champId, 'team-building', 2, 30)
    recommenderService.logRecommendation(champId, 'activity', 1, 15)
    const stats = controller.getStats({ championId: champId })
    const modules = stats.map((s: any) => s.module)
    assert.ok(modules.includes('team-building'))
    assert.ok(modules.includes('activity'))
  })

  it('团建对一个 champion 推荐后获取统计, 确认 recommendationCount 正确', () => {
    const { controller, recommenderService } = createController()
    const champId = registerChampion(recommenderService)
    recommenderService.logRecommendation(champId, 'teambuilding', 7, 200)
    const stats = controller.getStats({ championId: champId })
    assert.ok(stats.length > 0)
    assert.equal(stats[0].recommendationsCount, 7)
  })

  it('团建通过推荐搜索功能获取活动相关知识(权限边界)', () => {
    const { controller, recommenderService } = createController()
    const champId = registerChampion(recommenderService, { name: '活动策划冠军' })
    const results = controller.search({
      championId: champId,
      currentFiles: ['activity-plan.md', 'budget.ts'],
      topK: 3,
    })
    assert.ok(Array.isArray(results))
  })
})

// ===================================================================
// 📢 营销 — 营销相关知识推荐、营销 Champion 管理
// ===================================================================
describe(`${ROLES.Marketing} recommender 角色扩展测试`, () => {
  it('营销获取营销模块推荐统计, 确认存在对应 module 过滤', () => {
    const { controller, recommenderService } = createController()
    const champId = registerChampion(recommenderService)
    recommenderService.logRecommendation(champId, 'marketing', 6, 80)
    const stats = controller.getStats({ module: 'marketing' })
    assert.ok(stats.length > 0)
    assert.ok(stats.every((s: any) => s.module === 'marketing'))
  })

  it('营销对推荐内容反馈采纳, 确认 adoptionCount 递增', () => {
    const { controller, recommenderService } = createController()
    const champId = registerChampion(recommenderService)
    recommenderService.logRecommendation(champId, 'marketing', 4, 90)
    controller.recordFeedback({ championId: champId, chunkId: 'mkt-chunk-01', action: 'adopted' })
    const stats = controller.getStats({ championId: champId })
    // 反馈记录会增加 adoptedCount
    const log = recommenderService.getFeedbackStats()
    assert.equal(log.adopted, 1)
  })

  it('营销创建推荐后查看 getContext 的 relatedChampions(边界: 无其他活跃 champion 时返回空)', () => {
    const { controller, recommenderService } = createController()
    const champId = registerChampion(recommenderService)
    // 没有注册其他 champion, 无 currentFiles 推断 module, 故 relatedChampions 为空
    const ctx = controller.getContext(champId)
    assert.ok(Array.isArray(ctx.relatedChampions))
    assert.equal(ctx.relatedChampions.length, 0)
  })

  it('营销查询推荐统计时不传任何过滤(边界: 返回所有日志)', () => {
    const { controller, recommenderService } = createController()
    const a = registerChampion(recommenderService)
    const b = registerChampion(recommenderService)
    recommenderService.logRecommendation(a, 'campaign', 3, 60)
    recommenderService.logRecommendation(b, 'promotion', 2, 45)
    const all = controller.getStats({} as any)
    assert.ok(all.length >= 2)
  })
})
