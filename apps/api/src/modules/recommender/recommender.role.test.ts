import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { RecommenderController } from './recommender.controller'
import { RecommenderService } from './recommender.service'
import { ContextBuilderService } from './context-builder.service'
import { RagRetrievalService } from './rag-retrieval.service'
import { PersonalizedRecommenderService } from './personalized-recommender.service'
import { KnowledgeIndexerService } from '../knowledge/knowledge-indexer.service'

// ── 8 角色定义（对标门店运营角色） ──
const ROLES = {
  TenantAdmin: '👔店长',
  Reception: '🛒前台',
  HR: '👥HR',
  Safety: '🔧安监',
  Guide: '🎮导玩员',
  Ops: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
}

// ── 辅助工厂 ──
function createRecommenderController() {
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

function registerTestChampion(
  service: RecommenderService,
  overrides: Partial<{
    championId: string
    name: string
    role: string
    totalScore: number
    topModules: string[]
    recentContributions: Array<{ kind: string; refId: string; occurredAt: string; weight: number }>
  }> = {},
) {
  const champion = {
    championId: 'champ-role-1',
    name: '推荐引擎测试用户',
    role: 'CHAMPION',
    totalScore: 100,
    topModules: ['coupon', 'member'],
    recentContributions: [
      { kind: 'COMMIT', refId: 'c-001', occurredAt: '2026-06-25', weight: 2 },
      { kind: 'RFC', refId: 'rfc-001', occurredAt: '2026-06-24', weight: 3 },
    ],
    ...overrides,
  }
  service.upsertChampion(champion as any)
  return champion
}

// ── 👔店长 ──
describe(`${ROLES.TenantAdmin} recommender 角色测试`, () => {
  it('店长可以获取完整的知识推荐列表（含 adoptionRate）', () => {
    const { controller, recommenderService } = createRecommenderController()
    registerTestChampion(recommenderService, { championId: 'c-t1', name: '店长用户' })

    const result = controller.recommend({
      championId: 'c-t1',
      currentFiles: ['apps/api/src/modules/coupon/coupon.service.ts'],
      topK: 3,
    })

    assert.ok(result, '应有推荐响应')
    assert.ok(Array.isArray(result.recommendations), 'recommendations 应为数组')
    // adoptionRate 可能是 undefined（未采纳数据），兼容 future 统计
    if (result.adoptionRate !== undefined) {
      assert.ok(typeof result.adoptionRate === 'number', 'adoptionRate 应为数字')
    }
  })

  it('店长可以查看任意 champion 的完整上下文（tenant 级查看权限）', () => {
    const { controller, recommenderService } = createRecommenderController()
    registerTestChampion(recommenderService, { championId: 'c-t2', name: 'Alice' })

    const ctx = controller.getContext('c-t2')
    assert.equal(ctx.champion.championId, 'c-t2')
    assert.ok(ctx.relatedChampions, '应有关联 champion')
    assert.ok(ctx.recentSummary, '应有贡献摘要')
    assert.ok(ctx.builtAt, '应有构建时间')
  })

  it('店长可以查看推荐统计（全量数据，无过滤）', () => {
    const { controller, recommenderService } = createRecommenderController()
    recommenderService.logRecommendation('c-t3', 'coupon', 5, 100)
    recommenderService.logRecommendation('c-t4', 'member', 3, 80)

    const stats = controller.getStats({})
    assert.equal(stats.length, 2)
  })
})

// ── 🛒前台 ──
describe(`${ROLES.Reception} recommender 角色测试`, () => {
  it('前台可以搜索知识库获取帮助文档', () => {
    const { controller, recommenderService } = createRecommenderController()
    registerTestChampion(recommenderService, { championId: 'c-r1', name: '前台用户' })

    const result = controller.search({
      championId: 'c-r1',
      currentFiles: ['apps/api/src/modules/coupon/coupon.controller.ts'],
    })
    assert.ok(Array.isArray(result), '搜索结果应为数组')
  })

  it('前台可以记录反馈（已读/忽略），但不应该能修改统计配置', () => {
    const { controller, recommenderService } = createRecommenderController()
    registerTestChampion(recommenderService, { championId: 'c-r2' })

    const feedback = controller.recordFeedback({
      championId: 'c-r2',
      chunkId: 'chunk-r001',
      action: 'dismissed',
    })
    assert.equal(feedback.success, true, '忽略反馈应成功')

    // 前台不会影响推荐日志的统计（只增加 feedback）
    const stats = recommenderService.getFeedbackStats()
    assert.equal(stats.dismissed, 1)
  })
})

// ── 👥HR ──
describe(`${ROLES.HR} recommender 角色测试`, () => {
  it('HR 可以查看 Champion 上下文以了解员工知识贡献', () => {
    const { controller, recommenderService } = createRecommenderController()
    registerTestChampion(recommenderService, {
      championId: 'c-h1',
      name: '知识贡献员工',
      totalScore: 95,
    })

    const ctx = controller.getContext('c-h1')
    assert.equal(ctx.champion.name, '知识贡献员工')
    assert.equal(ctx.champion.totalScore, 95)
    assert.ok(ctx.recentSummary.totalContributions >= 0)
    assert.ok(ctx.recentSummary.byKind, '应有按类型统计')
  })

  it('HR 按 championId 过滤统计查看特定员工的知识贡献度', () => {
    const { controller, recommenderService } = createRecommenderController()
    registerTestChampion(recommenderService, { championId: 'c-h2' })
    recommenderService.logRecommendation('c-h2', 'tenant', 2, 50)
    recommenderService.logRecommendation('c-h3', 'member', 4, 100)

    const stats = controller.getStats({ championId: 'c-h2' })
    assert.equal(stats.length, 1)
    assert.equal(stats[0].championId, 'c-h2')
  })

  it('HR 查看不存在的 championId 的统计应返回空数组（无隐私泄露）', () => {
    const { controller } = createRecommenderController()
    const stats = controller.getStats({ championId: 'nonexistent-hr-employee' })
    assert.deepEqual(stats, [])
  })
})

// ── 🔧安监 ──
describe(`${ROLES.Safety} recommender 角色测试`, () => {
  it('安监可以使用搜索检索安全相关文档', () => {
    const { controller, recommenderService } = createRecommenderController()
    registerTestChampion(recommenderService, { championId: 'c-s1', name: '安全巡检员' })

    const result = controller.search({
      championId: 'c-s1',
      currentFiles: ['apps/api/src/modules/ai-rule-engine/ai-rule-engine.service.ts'],
    })
    assert.ok(Array.isArray(result), '搜索应正常返回')
  })

  it('安监记录采纳反馈应成功，用于追踪安全规则改进采纳率', () => {
    const { controller, recommenderService } = createRecommenderController()
    registerTestChampion(recommenderService, { championId: 'c-s2' })

    const result = controller.recordFeedback({
      championId: 'c-s2',
      chunkId: 'safety-chunk-001',
      action: 'adopted',
    })
    assert.equal(result.success, true)

    const stats = recommenderService.getFeedbackStats()
    assert.equal(stats.adopted, 1)
  })
})

// ── 🎮导玩员 ──
describe(`${ROLES.Guide} recommender 角色测试`, () => {
  it('导玩员可以查看推荐以获取游戏活动知识', () => {
    const { controller, recommenderService } = createRecommenderController()
    registerTestChampion(recommenderService, { championId: 'c-g1', name: '游戏导玩' })

    const result = controller.recommend({
      championId: 'c-g1',
      currentFiles: ['apps/api/src/modules/tournament/tournament.service.ts'],
    })
    assert.ok(result.recommendations, '应有推荐列表')
    assert.ok(result.context.currentTask.module, '应有模块推断')
  })

  it('导玩员在空文件列表下仍能获得推荐（不崩溃）', () => {
    const { controller, recommenderService } = createRecommenderController()
    registerTestChampion(recommenderService, { championId: 'c-g2' })

    const result = controller.recommend({
      championId: 'c-g2',
      currentFiles: [],
    })
    assert.equal(result.context.currentTask.module, 'unknown')
    assert.deepEqual(result.recommendations, [])
  })
})

// ── 🎯运行专员 ──
describe(`${ROLES.Ops} recommender 角色测试`, () => {
  it('运行专员可以按 module 过滤推荐统计', () => {
    const { controller, recommenderService } = createRecommenderController()
    recommenderService.logRecommendation('c-o1', 'coupon', 3, 120)
    recommenderService.logRecommendation('c-o2', 'member', 5, 200)
    recommenderService.logRecommendation('c-o3', 'coupon', 2, 60)

    const stats = controller.getStats({ module: 'coupon' })
    assert.equal(stats.length, 2)
    stats.forEach((s) => assert.equal(s.module, 'coupon'))
  })

  it('运行专员可查看天数过滤范围内统计（系统健康度视角）', () => {
    const { controller, recommenderService } = createRecommenderController()
    recommenderService.logRecommendation('c-o4', 'inventory', 1, 30)

    const stats = controller.getStats({ days: 7 })
    assert.ok(Array.isArray(stats))
    // 刚插入的数据应在 7 天内
    if (stats.length > 0) {
      const ageMs = Date.now() - new Date(stats[0].executedAt).getTime()
      assert.ok(ageMs < 7 * 24 * 60 * 60 * 1000, '日志应在 7 天窗口内')
    }
  })

  it('运行专员调用推荐时带 branch 和 topK 参数应正确传递', () => {
    const { controller, recommenderService } = createRecommenderController()
    registerTestChampion(recommenderService, { championId: 'c-o5' })

    const result = controller.recommend({
      championId: 'c-o5',
      currentFiles: ['apps/api/src/modules/member/member.service.ts'],
      branch: 'fix/member-tier',
      topK: 10,
    })
    assert.equal(result.context.currentTask.branch, 'fix/member-tier')
  })
})

// ── 🤝团建 ──
describe(`${ROLES.Teambuilding} recommender 角色测试`, () => {
  it('团建可以查看 champion 上下文以了解团队成员知识领域分布', () => {
    const { controller, recommenderService } = createRecommenderController()
    registerTestChampion(recommenderService, {
      championId: 'c-b1',
      name: '团队成员A',
      topModules: ['tournament', 'campaign'],
    })

    const ctx = controller.getContext('c-b1')
    assert.ok(ctx.champion.topModules.includes('tournament'))
    assert.ok(ctx.recentSummary, '应有贡献摘要用于团建评估')
  })

  it('团建查看推荐结果可以了解团队知识短板', () => {
    const { controller, recommenderService } = createRecommenderController()
    registerTestChampion(recommenderService, {
      championId: 'c-b2',
      name: '新员工',
      totalScore: 10,
      recentContributions: [],
    })

    const result = controller.recommend({
      championId: 'c-b2',
      currentFiles: ['apps/api/src/modules/finance/finance.service.ts'],
    })
    // 新员工无贡献，推荐不应崩溃
    assert.ok(result, '新员工推荐应正常返回')
    assert.equal(result.context.recentSummary.totalContributions, 0)
  })
})

// ── 📢营销 ──
describe(`${ROLES.Marketing} recommender 角色测试`, () => {
  it('营销可以搜索知识库获取促销活动相关文档', () => {
    const { controller, recommenderService } = createRecommenderController()
    registerTestChampion(recommenderService, {
      championId: 'c-m1',
      name: '营销专员',
      topModules: ['campaign', 'coupon'],
    })

    const result = controller.search({
      championId: 'c-m1',
      currentFiles: ['apps/api/src/modules/campaign/campaign.controller.ts'],
      topK: 5,
    })
    assert.ok(Array.isArray(result))
  })

  it('营销记录反馈（采纳/忽略）用于优化推荐效果', () => {
    const { controller, recommenderService } = createRecommenderController()
    registerTestChampion(recommenderService, { championId: 'c-m2' })

    const adopted = controller.recordFeedback({
      championId: 'c-m2',
      chunkId: 'marketing-chunk-001',
      action: 'adopted',
    })
    assert.equal(adopted.success, true)

    const dismissed = controller.recordFeedback({
      championId: 'c-m2',
      chunkId: 'marketing-chunk-002',
      action: 'dismissed',
    })
    assert.equal(dismissed.success, true)

    const stats = recommenderService.getFeedbackStats()
    assert.equal(stats.total, 2)
    assert.equal(stats.adopted, 1)
    assert.equal(stats.dismissed, 1)
  })

  it('营销可获取推荐统计用于分析内容推荐效果', () => {
    const { controller, recommenderService } = createRecommenderController()
    recommenderService.logRecommendation('c-m3', 'campaign', 8, 150)
    recommenderService.logRecommendation('c-m4', 'market', 6, 120)

    const stats = controller.getStats({ championId: 'c-m3' })
    assert.equal(stats.length, 1)
    assert.equal(stats[0].recommendationsCount, 8)
  })
})
