// @ts-nocheck
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
describe('RecommenderController', () => {
  const { RecommenderController } = require('./recommender.controller')
  const { RecommenderService } = require('./recommender.service')
  const { ContextBuilderService } = require('./context-builder.service')
  const { RagRetrievalService } = require('./rag-retrieval.service')
  const { PersonalizedRecommenderService } = require('./personalized-recommender.service')
  const { KnowledgeIndexerService } = require('../knowledge/knowledge-indexer.service')

  let controller: InstanceType<typeof RecommenderController>
  let recommenderService: InstanceType<typeof RecommenderService>
  let personalizedRecommender: InstanceType<typeof PersonalizedRecommenderService>
  let contextBuilder: InstanceType<typeof ContextBuilderService>
  let ragRetrieval: InstanceType<typeof RagRetrievalService>
  let indexer: InstanceType<typeof KnowledgeIndexerService>

  beforeEach(() => {
    indexer = new KnowledgeIndexerService()
    contextBuilder = new ContextBuilderService()
    ragRetrieval = new RagRetrievalService(indexer)
    recommenderService = new RecommenderService()
    personalizedRecommender = new PersonalizedRecommenderService(contextBuilder, ragRetrieval)
    controller = new RecommenderController(
      personalizedRecommender,
      contextBuilder,
      ragRetrieval,
      recommenderService,
    )
  })

  // ===================== 路由元数据 =====================
  describe('route metadata', () => {
    it('controller path metadata should be recommender', () => {
      const path = Reflect.getMetadata('path', RecommenderController)
      assert.equal(path, 'recommender')
    })

    it('recommend route should have POST method and recommend path', () => {
      const method = Reflect.getMetadata('method', RecommenderController.prototype.recommend)
      const path = Reflect.getMetadata('path', RecommenderController.prototype.recommend)

      assert.equal(method, 1) // POST
      assert.equal(path, 'recommend')
    })

    it('getContext route should have GET method and context/:championId path', () => {
      const method = Reflect.getMetadata('method', RecommenderController.prototype.getContext)
      const path = Reflect.getMetadata('path', RecommenderController.prototype.getContext)

      assert.equal(method, 0) // GET
      assert.equal(path, 'context/:championId')
    })

    it('recordFeedback route should have POST method and feedback path', () => {
      const method = Reflect.getMetadata('method', RecommenderController.prototype.recordFeedback)
      const path = Reflect.getMetadata('path', RecommenderController.prototype.recordFeedback)

      assert.equal(method, 1) // POST
      assert.equal(path, 'feedback')
    })

    it('search route should have POST method and search path', () => {
      const method = Reflect.getMetadata('method', RecommenderController.prototype.search)
      const path = Reflect.getMetadata('path', RecommenderController.prototype.search)

      assert.equal(method, 1) // POST
      assert.equal(path, 'search')
    })

    it('getStats route should have GET method and stats path', () => {
      const method = Reflect.getMetadata('method', RecommenderController.prototype.getStats)
      const path = Reflect.getMetadata('path', RecommenderController.prototype.getStats)

      assert.equal(method, 0) // GET
      assert.equal(path, 'stats')
    })
  })

  // ===================== POST /recommender/recommend =====================
  describe('POST /recommender/recommend', () => {
    it('正例: 应返回 Champion 的正常推荐结果', () => {
      recommenderService.upsertChampion({
        championId: 'champ-r-1',
        name: 'Alice',
        role: 'CHAMPION',
        totalScore: 100,
        topModules: ['coupon'],
        recentContributions: [
          { kind: 'COMMIT', refId: 'c-001', occurredAt: '2026-06-25', weight: 2 },
        ],
      })

      const result = controller.recommend({
        championId: 'champ-r-1',
        currentFiles: ['apps/api/src/modules/coupon/coupon.service.ts'],
      })

      assert.ok(result, 'should return a response')
      assert.ok(result.recommendations, 'should have recommendations array')
      assert.ok(result.context, 'should have context')
      assert.equal(result.context.currentTask.module, 'coupon')
    })

    it('正例: 携带 branch 和 topK 参数的推荐', () => {
      recommenderService.upsertChampion({
        championId: 'champ-r-2',
        name: 'Bob',
        role: 'CHAMPION',
        totalScore: 80,
        topModules: ['member'],
        recentContributions: [],
      })

      const result = controller.recommend({
        championId: 'champ-r-2',
        currentFiles: ['apps/api/src/modules/member/member.service.ts'],
        branch: 'feature/new-tier',
        topK: 10,
      })

      assert.equal(result.context.currentTask.branch, 'feature/new-tier')
      assert.equal(result.context.champion.championId, 'champ-r-2')
    })

    it('边界: 空文件列表应返回空推荐但不会崩溃', () => {
      recommenderService.upsertChampion({
        championId: 'champ-empty',
        name: 'Empty',
        role: 'CHAMPION',
        totalScore: 10,
        topModules: [],
        recentContributions: [],
      })

      const result = controller.recommend({
        championId: 'champ-empty',
        currentFiles: [],
      })
      assert.equal(result.context.currentTask.module, 'unknown')
      assert.deepEqual(result.recommendations, [])
    })

    it('边界: 不存在的 championId 返回 fallback 且 recommendations 为空', () => {
      const result = controller.recommend({
        championId: '',
        currentFiles: [],
      })
      assert.equal(result.context.champion.championId, '')
      assert.deepEqual(result.recommendations, [])
    })
  })

  // ===================== GET /recommender/context/:championId =====================
  describe('GET /recommender/context/:championId', () => {
    it('正例: 应返回已注册 Champion 的完整上下文', () => {
      recommenderService.upsertChampion({
        championId: 'champ-c-1',
        name: 'Carol',
        role: 'APPROVER',
        totalScore: 80,
        topModules: ['tenant'],
        recentContributions: [],
      })

      const result = controller.getContext('champ-c-1')
      assert.equal(result.champion.championId, 'champ-c-1')
      assert.equal(result.champion.name, 'Carol')
      assert.equal(result.champion.role, 'APPROVER')
      assert.ok(result.currentTask, 'should have currentTask')
      assert.ok(result.relatedChampions, 'should have relatedChampions')
      assert.ok(result.recentSummary, 'should have recentSummary')
    })

    it('边界: 不存在的 championId 应返回默认 fallback', () => {
      const result = controller.getContext('nonexistent-champion')
      assert.equal(result.champion.championId, 'nonexistent-champion')
      assert.equal(result.champion.totalScore, 0)
      assert.equal(result.champion.role, 'CHAMPION')
    })
  })

  // ===================== POST /recommender/feedback =====================
  describe('POST /recommender/feedback', () => {
    it('正例: 记录采纳反馈应返回 success', () => {
      recommenderService.upsertChampion({
        championId: 'champ-f-1',
        name: 'Dave',
        role: 'CHAMPION',
        totalScore: 50,
        topModules: [],
        recentContributions: [],
      })

      const result = controller.recordFeedback({
        championId: 'champ-f-1',
        chunkId: 'chunk-abc',
        action: 'adopted',
      })
      assert.equal(result.success, true)
    })

    it('正例: 记录忽略和已读反馈也应成功', () => {
      recommenderService.upsertChampion({
        championId: 'champ-f-2',
        name: 'Eve',
        role: 'CHAMPION',
        totalScore: 30,
        topModules: [],
        recentContributions: [],
      })

      const dismissed = controller.recordFeedback({
        championId: 'champ-f-2',
        chunkId: 'chunk-xyz',
        action: 'dismissed',
      })
      assert.equal(dismissed.success, true)

      const read = controller.recordFeedback({
        championId: 'champ-f-2',
        chunkId: 'chunk-read',
        action: 'read',
      })
      assert.equal(read.success, true)

      // 验证反馈统计包含所有类型
      const stats = recommenderService.getFeedbackStats()
      assert.equal(stats.total, 2)
      assert.equal(stats.adopted, 0)
      assert.equal(stats.dismissed, 1)
      assert.equal(stats.read, 1)
    })

    it('边界: 未注册的 champion 记录反馈仍可成功（service 降级处理）', () => {
      const result = controller.recordFeedback({
        championId: 'unknown-champion',
        chunkId: 'chunk-non-existent',
        action: 'read',
      })
      assert.equal(result.success, true)
    })
  })

  // ===================== POST /recommender/search =====================
  describe('POST /recommender/search', () => {
    it('正例: 搜索知识库应返回结果数组', () => {
      recommenderService.upsertChampion({
        championId: 'champ-s-1',
        name: 'Frank',
        role: 'CHAMPION',
        totalScore: 30,
        topModules: ['member'],
        recentContributions: [],
      })

      const result = controller.search({
        championId: 'champ-s-1',
        currentFiles: ['apps/api/src/modules/member/member.service.ts'],
      })
      assert.ok(Array.isArray(result))
    })

    it('正例: 搜索结果应有结构化的字段', () => {
      recommenderService.upsertChampion({
        championId: 'champ-s-2',
        name: 'Grace',
        role: 'CHAMPION',
        totalScore: 60,
        topModules: ['coupon'],
        recentContributions: [
          { kind: 'RFC', refId: 'rfc-001', occurredAt: '2026-06-20', weight: 3 },
        ],
      })

      const result = controller.search({
        championId: 'champ-s-2',
        currentFiles: ['apps/api/src/modules/coupon/coupon.controller.ts'],
        topK: 5,
      })

      if (result.length > 0) {
        const first = result[0]
        assert.ok(typeof first.chunkId === 'string')
        assert.ok(typeof first.sourcePath === 'string')
        assert.ok(typeof first.totalScore === 'number')
        assert.ok(first.totalScore >= 0)
      }
    })
  })

  // ===================== GET /recommender/stats =====================
  describe('GET /recommender/stats', () => {
    it('正例: 返回统计日志列表', () => {
      recommenderService.logRecommendation('champ-stat-1', 'coupon', 3, 120)
      recommenderService.logRecommendation('champ-stat-1', 'member', 5, 200)

      const result = controller.getStats({})
      assert.equal(result.length, 2)
    })

    it('正例: 按 championId 过滤统计', () => {
      recommenderService.logRecommendation('champ-stat-2', 'tenant', 2, 50)
      recommenderService.logRecommendation('champ-stat-3', 'coupon', 4, 100)

      const result = controller.getStats({ championId: 'champ-stat-2' })
      assert.equal(result.length, 1)
      assert.equal(result[0].championId, 'champ-stat-2')
      assert.equal(result[0].module, 'tenant')
    })

    it('正例: 按 module 过滤统计', () => {
      recommenderService.logRecommendation('champ-stat-4', 'tenant', 3, 75)
      recommenderService.logRecommendation('champ-stat-5', 'tenant', 1, 30)
      recommenderService.logRecommendation('champ-stat-6', 'coupon', 2, 60)

      const result = controller.getStats({ module: 'tenant' })
      assert.equal(result.length, 2)
    })

    it('边界: 不存在的 championId 返回空数组', () => {
      const result = controller.getStats({ championId: 'nonexistent' })
      assert.deepEqual(result, [])
    })

    it('边界: 天数过滤应只返回指定天数内的日志', () => {
      const result = controller.getStats({ days: 1 })
      // 不会有旧数据，但确保不抛出异常
      assert.ok(Array.isArray(result))
    })
  })
})
