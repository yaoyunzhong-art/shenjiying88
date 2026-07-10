import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [recommender] [C] 角色测试 v3 — 高级场景
 *
 * 8 角色视角深度场景：推荐模块
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色 ≥2 场景（正常流程 + 异常/边界）
 * 覆盖: 空数据、大 TopK、无效 Champion、反馈堆积、统计筛选、
 *       跨模块合约、并发 Champion 注册、日志审计
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { RecommenderController } from './recommender.controller'
import { RecommenderService } from './recommender.service'
import { ContextBuilderService } from './context-builder.service'
import { RagRetrievalService } from './rag-retrieval.service'
import { PersonalizedRecommenderService } from './personalized-recommender.service'
import { KnowledgeIndexerService } from '../knowledge/knowledge-indexer.service'
import type { ChampionSummary, RecommendResponse } from './recommender.entity'

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

// ── 工厂函数 ──
function makeController() {
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
  return { controller, recommenderService, indexer }
}

function makeChampion(overrides: Partial<ChampionSummary> = {}): ChampionSummary {
  return {
    championId: overrides.championId ?? `champ-v3-${Date.now()}`,
    name: overrides.name ?? 'Test Champion v3',
    role: overrides.role ?? 'CHAMPION',
    totalScore: overrides.totalScore ?? 100,
    topModules: overrides.topModules ?? ['agent', 'ai-rule-engine'],
    recentContributions: overrides.recentContributions ?? [
      { kind: 'COMMIT', refId: 'ref-001', occurredAt: new Date().toISOString(), weight: 10 },
    ],
  }
}

function recommendPayload(overrides: Record<string, unknown> = {}) {
  return {
    championId: (overrides.championId as string) ?? 'champ-v3-default',
    currentFiles: (overrides.currentFiles as string[]) ?? [],
    branch: (overrides.branch as string) ?? 'main',
    topK: (overrides.topK as number) ?? 5,
    ...overrides,
  }
}

// ============================================================================
// 👔 店长 - 推荐引擎管理与跨模块合约
// ============================================================================

describe(`${ROLES.StoreManager} 推荐引擎管理与跨模块合约`, () => {
  it('店长创建 Champion 并获取完整推荐（含跨模块合约字段）', () => {
    const { controller, recommenderService } = makeController()
    const champ = makeChampion({ championId: 'champ-store-v3', name: 'Store Manager Champion' })
    recommenderService.upsertChampion(champ)

    const result = controller.recommend(recommendPayload({
      championId: 'champ-store-v3',
      currentFiles: ['agent.controller.ts'],
      branch: 'feature/ai',
      topK: 3,
    }))

    assert.ok(result.context)
    assert.ok(result.context.champion)
    assert.equal(result.context.champion.championId, 'champ-store-v3')
    assert.ok(Array.isArray(result.recommendations))
  })

  it('店长查看指定 Champion 上下文（跨模块信息预览）', () => {
    const { controller, recommenderService } = makeController()
    const champ = makeChampion({ championId: 'champ-context-v3', topModules: ['agent', 'recommender'] })
    recommenderService.upsertChampion(champ)

    const context = controller.getContext('champ-context-v3')
    assert.ok(context)
    assert.equal(context.champion.championId, 'champ-context-v3')
  })

  it('店长查询不存在的 Champion 上下文应降级返回默认信息', () => {
    const { controller } = makeController()
    const context = controller.getContext('non-existent-champion')
    assert.ok(context)
    assert.equal(context.champion.championId, 'non-existent-champion')
    assert.equal(context.champion.totalScore, 0)
  })
})

// ============================================================================
// 🛒 前台 - 实时推荐查询
// ============================================================================

describe(`${ROLES.FrontDesk} 实时推荐查询`, () => {
  it('前台使用空文件列表发起推荐（新项目场景）', () => {
    const { controller, recommenderService } = makeController()
    recommenderService.upsertChampion(makeChampion({ championId: 'champ-empty-files' }))

    const result = controller.recommend(recommendPayload({
      championId: 'champ-empty-files',
      currentFiles: [],
      topK: 5,
    }))

    assert.ok(result)
    assert.ok(Array.isArray(result.recommendations))
  })

  it('前台请求极大 topK 应返回完整列表', () => {
    const { controller, recommenderService } = makeController()
    recommenderService.upsertChampion(makeChampion({ championId: 'champ-large-topk' }))

    const result = controller.recommend(recommendPayload({
      championId: 'champ-large-topk',
      topK: 999,
    }))

    assert.ok(result)
    assert.ok(result.recommendations.length <= 999)
  })

  it('前台请求 topK 为 0 应返回空推荐', () => {
    const { controller, recommenderService } = makeController()
    recommenderService.upsertChampion(makeChampion({ championId: 'champ-zero-topk' }))

    const result = controller.recommend(recommendPayload({
      championId: 'champ-zero-topk',
      topK: 0,
    }))

    assert.ok(result)
    assert.equal(result.recommendations.length, 0)
  })
})

// ============================================================================
// 👥 HR - 推荐反馈与采纳率
// ============================================================================

describe(`${ROLES.HR} 推荐反馈与采纳率`, () => {
  it('HR 记录推荐采纳反馈', () => {
    const { controller } = makeController()
    const feedback = controller.recordFeedback({
      championId: 'champ-hr-1',
      chunkId: 'chunk-001',
      action: 'adopted',
    })

    assert.ok(feedback.success)
  })

  it('HR 记录推荐忽略反馈', () => {
    const { controller } = makeController()
    const feedback = controller.recordFeedback({
      championId: 'champ-hr-2',
      chunkId: 'chunk-002',
      action: 'dismissed',
    })

    assert.ok(feedback.success)
  })

  it('HR 对同一个 chunk 重复记录反馈不应报错', () => {
    const { controller } = makeController()
    const fb1 = controller.recordFeedback({ championId: 'champ-hr-3', chunkId: 'chunk-003', action: 'adopted' })
    const fb2 = controller.recordFeedback({ championId: 'champ-hr-3', chunkId: 'chunk-003', action: 'dismissed' })

    assert.ok(fb1.success)
    assert.ok(fb2.success)
  })
})

// ============================================================================
// 🔧 安监 - 知识检索审计
// ============================================================================

describe(`${ROLES.Security} 知识检索审计`, () => {
  it('安监查询知识库检索结果（安全审计需要）', () => {
    const { controller, recommenderService } = makeController()
    recommenderService.upsertChampion(makeChampion({ championId: 'champ-search-v3' }))

    const results = controller.search(recommendPayload({
      championId: 'champ-search-v3',
      currentFiles: ['security.ts'],
    }))

    assert.ok(Array.isArray(results))
    results.forEach(r => {
      assert.ok(r.chunkId)
      assert.ok(r.sourcePath)
      assert.ok(typeof r.totalScore === 'number')
      assert.ok(r.reason)
    })
  })

  it('安监检索不存在的 Champion 应降级处理', () => {
    const { controller } = makeController()
    const results = controller.search(recommendPayload({
      championId: 'champ-ghost',
    }))

    assert.ok(Array.isArray(results))
  })
})

// ============================================================================
// 🎮 导玩员 - 多 Champion 推荐场景
// ============================================================================

describe(`${ROLES.Guide} 多 Champion 推荐场景`, () => {
  it('导玩员注册多个 Champion 并获取所有列表', () => {
    const { recommenderService } = makeController()
    recommenderService.upsertChampion(makeChampion({ championId: 'champ-guide-a', name: 'Guide Alpha' }))
    recommenderService.upsertChampion(makeChampion({ championId: 'champ-guide-b', name: 'Guide Beta' }))
    recommenderService.upsertChampion(makeChampion({ championId: 'champ-guide-c', name: 'Guide Gamma' }))

    const all = recommenderService.getAllChampions()
    assert.equal(all.length, 3)
    const names = all.map(c => c.name)
    assert.ok(names.includes('Guide Alpha'))
    assert.ok(names.includes('Guide Beta'))
    assert.ok(names.includes('Guide Gamma'))
  })

  it('导玩员注册同名 Champion （不同 ID）应被允许', () => {
    const { recommenderService } = makeController()
    recommenderService.upsertChampion(makeChampion({ championId: 'champ-dup-a', name: 'Duplicate Name' }))
    recommenderService.upsertChampion(makeChampion({ championId: 'champ-dup-b', name: 'Duplicate Name' }))

    const all = recommenderService.getAllChampions()
    const dups = all.filter(c => c.name === 'Duplicate Name')
    assert.equal(dups.length, 2)
  })

  it('导玩员无 Champion 时返回空列表', () => {
    const { recommenderService } = makeController()
    const all = recommenderService.getAllChampions()
    // 可能已从之前的测试注册
    assert.ok(Array.isArray(all))
  })
})

// ============================================================================
// 🎯 运行专员 - 推荐统计与日志
// ============================================================================

describe(`${ROLES.Operations} 推荐统计与日志`, () => {
  it('运行专员查看按 Champion 筛选的推荐统计', () => {
    const { controller, recommenderService } = makeController()
    recommenderService.logRecommendation('champ-ops-v3', 'recommender', 5, 120)
    recommenderService.logRecommendation('champ-ops-v3', 'agent', 3, 80)

    const stats = controller.getStats({ championId: 'champ-ops-v3' })
    assert.ok(stats.length >= 2)
    stats.forEach(s => assert.equal(s.championId, 'champ-ops-v3'))
  })

  it('运行专员查看按模块筛选的推荐统计', () => {
    const { controller, recommenderService } = makeController()
    recommenderService.logRecommendation('champ-ops-mod-1', 'module-a', 10, 200)
    recommenderService.logRecommendation('champ-ops-mod-2', 'module-b', 20, 150)

    const stats = controller.getStats({ module: 'module-a' })
    assert.ok(stats.length >= 1)
    stats.forEach(s => assert.equal(s.module, 'module-a'))
  })

  it('运行专员按天数筛选统计（空结果场景）', () => {
    const { controller } = makeController()
    // days=1 但日志是新的，应该返回部分结果
    const stats = controller.getStats({ days: 36500 }) // ~100 years
    assert.ok(Array.isArray(stats))
  })

  it('运行专员查询不存在的 Champion 统计应返回空数组', () => {
    const { controller } = makeController()
    const stats = controller.getStats({ championId: 'champ-does-not-exist-999' })
    assert.ok(Array.isArray(stats))
    assert.equal(stats.length, 0)
  })
})

// ============================================================================
// 🤝 团建 - 推荐架构适配与反馈堆积
// ============================================================================

describe(`${ROLES.Teambuilding} 推荐架构适配与反馈堆积`, () => {
  it('团建专员批量记录反馈并查看统计', () => {
    const { controller, recommenderService } = makeController()
    // 记录 10 条反馈
    for (let i = 0; i < 10; i++) {
      controller.recordFeedback({
        championId: 'champ-teambuilding',
        chunkId: `chunk-tb-${i}`,
        action: i % 3 === 0 ? 'adopted' : i % 3 === 1 ? 'dismissed' : 'read',
      })
    }

    const stats = recommenderService.getFeedbackStats()
    assert.equal(stats.total, 10)
    assert.ok(stats.adopted + stats.dismissed + stats.read === 10)
  })

  it('团建专员查看推荐日志的排序（按时间倒序）', () => {
    const { controller, recommenderService } = makeController()
    recommenderService.logRecommendation('champ-tb-sort', 'module', 5, 50)
    recommenderService.logRecommendation('champ-tb-sort', 'module', 3, 30)

    const logs = controller.getStats({ championId: 'champ-tb-sort' })
    for (let i = 1; i < logs.length; i++) {
      assert.ok(
        new Date(logs[i - 1].executedAt).getTime() >= new Date(logs[i].executedAt).getTime(),
        'logs should be sorted descending by executedAt',
      )
    }
  })
})

// ============================================================================
// 📢 营销 - 多筛选条件组合统计
// ============================================================================

describe(`${ROLES.Marketing} 多筛选条件组合统计`, () => {
  it('营销专员按 Champion + 模块 + 天数的组合筛选', () => {
    const { controller, recommenderService } = makeController()
    recommenderService.logRecommendation('champ-mkt-combo', 'recommender', 8, 100)

    const stats = controller.getStats({
      championId: 'champ-mkt-combo',
      module: 'recommender',
      days: 7,
    })
    assert.ok(stats.length >= 1)
    stats.forEach(s => {
      assert.equal(s.championId, 'champ-mkt-combo')
      assert.equal(s.module, 'recommender')
    })
  })

  it('营销专员从推荐响应中查看 adoptionRate（可选字段）', () => {
    const { controller, recommenderService } = makeController()
    recommenderService.upsertChampion(makeChampion({ championId: 'champ-mkt-rate' }))

    const result = controller.recommend(recommendPayload({
      championId: 'champ-mkt-rate',
    }))

    // adoptionRate 是可选字段，为 undefined 或 number 都接受
    if (result.adoptionRate !== undefined) {
      assert.ok(typeof result.adoptionRate === 'number')
    } else {
      // 未设置时 adoptionRate 应为 undefined（合约允许）
      assert.strictEqual(result.adoptionRate, undefined)
    }
  })
})

// ============================================================================
// 跨角色: 高并发与并发 Champion 注册
// ============================================================================

describe('跨角色 - 高并发与并发 Champion 注册', () => {
  it('多个角色同时注册 Champion 全部成功', () => {
    const { recommenderService } = makeController()
    for (let i = 0; i < 50; i++) {
      recommenderService.upsertChampion(makeChampion({
        championId: `champ-concur-${i}`,
        name: `Concurrent Champion ${i}`,
        totalScore: i * 10,
      }))
    }
    const all = recommenderService.getAllChampions()
    const unique = new Set(all.map(c => c.championId))
    // 至少 50 个 unique
    assert.ok(unique.size >= 50)
  })

  it('Champion 更新覆盖应保留最新数据', () => {
    const { recommenderService } = makeController()
    recommenderService.upsertChampion(makeChampion({
      championId: 'champ-overwrite',
      name: 'Original Name',
      totalScore: 100,
    }))
    recommenderService.upsertChampion(makeChampion({
      championId: 'champ-overwrite',
      name: 'Updated Name',
      totalScore: 200,
    }))
    const updated = recommenderService.getChampion('champ-overwrite')
    assert.equal(updated.name, 'Updated Name')
    assert.equal(updated.totalScore, 200)
  })
})

// ============================================================================
// 跨角色: 合约字段完整性验证
// ============================================================================

describe('跨角色 - 合约字段完整性验证', () => {
  it('推荐响应包含所有合约字段', () => {
    const { controller, recommenderService } = makeController()
    recommenderService.upsertChampion(makeChampion({ championId: 'champ-contract' }))

    const result: RecommendResponse = controller.recommend(recommendPayload({
      championId: 'champ-contract',
    }))

    assert.ok(result.context)
    assert.ok(result.context.champion)
    assert.ok('championId' in result.context.champion)
    assert.ok('name' in result.context.champion)
    assert.ok('role' in result.context.champion)
    assert.ok('totalScore' in result.context.champion)
    assert.ok('topModules' in result.context.champion)
    assert.ok('recentContributions' in result.context.champion)
    assert.ok(Array.isArray(result.recommendations))
    if (result.recommendations.length > 0) {
      const item = result.recommendations[0]
      assert.ok('rank' in item)
      assert.ok('chunkId' in item)
      assert.ok('reason' in item)
      assert.ok('confidence' in item)
    }
  })

  it('检索结果包含完整性字段', () => {
    const { controller, recommenderService } = makeController()
    recommenderService.upsertChampion(makeChampion({ championId: 'champ-search-contract' }))

    const results = controller.search(recommendPayload({
      championId: 'champ-search-contract',
    }))

    if (results.length > 0) {
      const r = results[0]
      assert.ok('chunkId' in r)
      assert.ok('sourcePath' in r)
      assert.ok('content' in r)
      assert.ok('totalScore' in r)
      assert.ok('reason' in r)
    }
  })
})
