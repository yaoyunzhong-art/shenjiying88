import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import { Test, TestingModule } from '@nestjs/testing'
import { RecommenderController } from './recommender.controller'
import { RecommenderService } from './recommender.service'
import { PersonalizedRecommenderService } from './personalized-recommender.service'
import { ContextBuilderService } from './context-builder.service'
import { RagRetrievalService } from './rag-retrieval.service'
import { KnowledgeIndexerService } from '../knowledge/knowledge-indexer.service'
import type { RecommendResponse } from './personalized-recommender.service'

describe('RecommenderController', () => {
  let controller: RecommenderController
  let recommenderService: RecommenderService
  let personalizedRecommender: PersonalizedRecommenderService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecommenderController],
      providers: [
        RecommenderService,
        ContextBuilderService,
        RagRetrievalService,
        PersonalizedRecommenderService,
        KnowledgeIndexerService,
      ],
    }).compile()

    controller = module.get<RecommenderController>(RecommenderController)
    recommenderService = module.get<RecommenderService>(RecommenderService)
    personalizedRecommender = module.get<PersonalizedRecommenderService>(PersonalizedRecommenderService)
  })

  // ── 正例 1: POST /recommender/recommend — 正常推荐 ──
  it('POST /recommender/recommend — should return recommendations for a champion', () => {
    recommenderService.upsertChampion({
      championId: 'champ-1',
      name: 'Alice',
      role: 'CHAMPION',
      totalScore: 100,
      topModules: ['coupon'],
      recentContributions: [
        { kind: 'COMMIT', refId: 'c-001', occurredAt: '2026-06-25', weight: 2 },
      ],
    })

    const result = controller.recommend({
      championId: 'champ-1',
      currentFiles: ['apps/api/src/modules/coupon/coupon.service.ts'],
    })

    expect(result).toBeDefined()
    expect(result.recommendations).toBeDefined()
    expect(result.context.currentTask.module).toBe('coupon')
  })

  // ── 正例 2: GET /recommender/context/:championId — 获取上下文 ──
  it('GET /recommender/context/:championId — should return champion context', () => {
    recommenderService.upsertChampion({
      championId: 'champ-2',
      name: 'Bob',
      role: 'APPROVER',
      totalScore: 80,
      topModules: ['tenant'],
      recentContributions: [],
    })

    const result = controller.getContext('champ-2')
    expect(result.champion.championId).toBe('champ-2')
    expect(result.champion.name).toBe('Bob')
  })

  // ── 正例 3: POST /recommender/feedback — 记录反馈 ──
  it('POST /recommender/feedback — should record adoption feedback', () => {
    recommenderService.upsertChampion({
      championId: 'champ-3',
      name: 'Carol',
      role: 'CHAMPION',
      totalScore: 50,
      topModules: [],
      recentContributions: [],
    })

    const result = controller.recordFeedback({
      championId: 'champ-3',
      chunkId: 'chunk-123',
      action: 'adopted',
    })
    expect(result.success).toBe(true)
  })

  // ── 正例 4: POST /recommender/search — 知识检索 ──
  it('POST /recommender/search — should search knowledge base', () => {
    recommenderService.upsertChampion({
      championId: 'champ-4',
      name: 'Dave',
      role: 'CHAMPION',
      totalScore: 30,
      topModules: ['member'],
      recentContributions: [],
    })

    const result = controller.search({
      championId: 'champ-4',
      currentFiles: ['apps/api/src/modules/member/member.service.ts'],
    })
    expect(Array.isArray(result)).toBe(true)
  })

  // ── 正例 5: GET /recommender/stats — 获取统计 ──
  it('GET /recommender/stats — should return recommendation logs', () => {
    recommenderService.logRecommendation('champ-5', 'coupon', 3, 120)

    const result = controller.getStats({})
    expect(result.length).toBeGreaterThanOrEqual(1)
    expect(result[0].championId).toBe('champ-5')
  })

  // ── 正例 6: POST /recommender/recommend — 带 branch 和 topK ──
  it('POST /recommender/recommend — should pass branch and topK parameters', () => {
    recommenderService.upsertChampion({
      championId: 'champ-6',
      name: 'Eve',
      role: 'CHAMPION',
      totalScore: 60,
      topModules: ['campaign'],
      recentContributions: [
        { kind: 'RFC', refId: 'rfc-001', occurredAt: '2026-06-26', weight: 5 },
      ],
    })

    const result = controller.recommend({
      championId: 'champ-6',
      currentFiles: ['apps/api/src/modules/campaign/campaign.service.ts'],
      branch: 'feature/spring-promo',
      topK: 10,
    })
    expect(result.context.currentTask.branch).toBe('feature/spring-promo')
  })

  // ── 正例 7: GET /recommender/stats — 按 championId 过滤 ──
  it('GET /recommender/stats — should filter by championId', () => {
    recommenderService.logRecommendation('champ-a', 'coupon', 2, 80)
    recommenderService.logRecommendation('champ-b', 'member', 5, 150)

    const stats = controller.getStats({ championId: 'champ-a' })
    expect(stats.length).toBe(1)
    expect(stats[0].championId).toBe('champ-a')
  })

  // ── 正例 8: GET /recommender/stats — 按 module 过滤 ──
  it('GET /recommender/stats — should filter by module name', () => {
    recommenderService.logRecommendation('champ-c', 'inventory', 3, 100)
    recommenderService.logRecommendation('champ-d', 'coupon', 4, 200)

    const stats = controller.getStats({ module: 'inventory' })
    expect(stats.length).toBe(1)
    expect(stats[0].module).toBe('inventory')
  })

  // ── 正例 9: POST /recommender/feedback — 记录 dismissed 反馈 ──
  it('POST /recommender/feedback — should record dismissed feedback', () => {
    recommenderService.upsertChampion({
      championId: 'champ-fb',
      name: 'Frank',
      role: 'CHAMPION',
      totalScore: 20,
      topModules: [],
      recentContributions: [],
    })

    const result = controller.recordFeedback({
      championId: 'champ-fb',
      chunkId: 'chunk-dismissed-1',
      action: 'dismissed',
    })
    expect(result.success).toBe(true)

    const stats = recommenderService.getFeedbackStats()
    expect(stats.dismissed).toBe(1)
  })

  // ── 正例 10: POST /recommender/feedback — 记录 read 反馈 ──
  it('POST /recommender/feedback — should record read feedback', () => {
    recommenderService.upsertChampion({
      championId: 'champ-fb2',
      name: 'Grace',
      role: 'CHAMPION',
      totalScore: 15,
      topModules: [],
      recentContributions: [],
    })

    const result = controller.recordFeedback({
      championId: 'champ-fb2',
      chunkId: 'chunk-read-1',
      action: 'read',
    })
    expect(result.success).toBe(true)

    const stats = recommenderService.getFeedbackStats()
    expect(stats.read).toBe(1)
  })

  // ── 边界: 不存在的 championId 应返回默认 Champion ──
  it('should return fallback champion for unknown championId', () => {
    const result = controller.getContext('nonexistent-champion')
    expect(result.champion.championId).toBe('nonexistent-champion')
    expect(result.champion.totalScore).toBe(0)
  })

  // ── 边界: 空文件列表的推荐 ──
  it('should handle empty currentFiles gracefully', () => {
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
    expect(result.context.currentTask.module).toBe('unknown')
    expect(result.recommendations).toEqual([])
  })

  // ── 反例: 空 championId 返回 fallback（不抛出，应用层降级）─
  it('should return fallback for empty championId in recommend', () => {
    const result = controller.recommend({
      championId: '',
      currentFiles: [],
    })
    expect(result.context.champion.championId).toBe('')
    expect(result.recommendations).toEqual([])
  })

  // ── 边界: 超大 topK 不报错 ──
  it('should handle large topK value gracefully', () => {
    recommenderService.upsertChampion({
      championId: 'champ-topk',
      name: 'TopK',
      role: 'CHAMPION',
      totalScore: 100,
      topModules: ['coupon', 'member'],
      recentContributions: [
        { kind: 'COMMIT', refId: 'c-001', occurredAt: '2026-06-25', weight: 2 },
      ],
    })

    const result = controller.recommend({
      championId: 'champ-topk',
      currentFiles: ['apps/api/src/modules/coupon/coupon.service.ts'],
      topK: 999,
    })
    expect(result).toBeDefined()
    expect(Array.isArray(result.recommendations)).toBe(true)
  })

  // ── 边界: 按 days 过滤统计 ──
  it('GET /recommender/stats — should filter by days range', () => {
    recommenderService.logRecommendation('champ-days', 'finance', 7, 300)

    const stats = controller.getStats({ days: 30 })
    expect(stats.length).toBeGreaterThanOrEqual(1)
    // 刚插入的数据应在 30 天内
    const ageMs = Date.now() - new Date(stats[0].executedAt).getTime()
    expect(ageMs).toBeLessThan(30 * 24 * 60 * 60 * 1000)
  })

  // ── 边界: 带 branch 和空 files 的推荐 ──
  it('should handle branch with empty files gracefully', () => {
    recommenderService.upsertChampion({
      championId: 'champ-branch-empty',
      name: 'BranchTest',
      role: 'CHAMPION',
      totalScore: 30,
      topModules: [],
      recentContributions: [],
    })

    const result = controller.recommend({
      championId: 'champ-branch-empty',
      currentFiles: [],
      branch: 'hotfix/urgent',
    })
    expect(result.context.currentTask.branch).toBe('hotfix/urgent')
    expect(result.context.currentTask.module).toBe('unknown')
  })

  // ── 边界: 按不存在的 championId 过滤统计 ──
  it('GET /recommender/stats — should return empty array for nonexistent championId', () => {
    recommenderService.logRecommendation('champ-existing', 'member', 3, 100)

    const stats = controller.getStats({ championId: 'champ-nonexistent' })
    expect(stats).toEqual([])
  })

  // ── 边界: 按不存在的 module 过滤统计 ──
  it('GET /recommender/stats — should return empty array for nonexistent module', () => {
    recommenderService.logRecommendation('champ-exist', 'member', 3, 100)

    const stats = controller.getStats({ module: 'nonexistent-module' })
    expect(stats).toEqual([])
  })
})
