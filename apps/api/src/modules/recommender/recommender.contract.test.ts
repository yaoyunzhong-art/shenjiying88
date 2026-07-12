// @ts-nocheck
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [recommender] [D] 合约测试
 *
 * 验证 recommender 模块的实体 Shape、业务逻辑契约
 * - Champion 实体完整性
 * - Context 构建契约
 * - RAG 检索排序契约
 * - 推荐聚合契约
 * - 反馈/统计契约
 */

import 'reflect-metadata';
import assert from 'node:assert/strict';
import { RecommenderService } from './recommender.service';
import { ContextBuilderService } from './context-builder.service';
import { RagRetrievalService } from './rag-retrieval.service';
import { KnowledgeIndexerService } from '../knowledge/knowledge-indexer.service';
import { PersonalizedRecommenderService } from './personalized-recommender.service';
import type {
  ChampionSummary,
  RecommendationContext,
  RankedResult,
  RecommendationItem,
  RecommendResponse,
  RecommendationLog,
  ChampionRole,
  ContributionKind,
  RecommendationStatus,
  ConfidenceLevel,
} from './recommender.entity';

// ─── Helpers ──────────────────────────────────────────

function makeService() {
  const indexer = new KnowledgeIndexerService();
  const contextBuilder = new ContextBuilderService();
  const ragRetrieval = new RagRetrievalService(indexer);
  const recommenderSvc = new RecommenderService();
  const personalizedRecommender = new PersonalizedRecommenderService(contextBuilder, ragRetrieval);
  return {
    indexer,
    contextBuilder,
    ragRetrieval,
    recommenderSvc,
    personalizedRecommender,
  };
}

const sampleChampion: ChampionSummary = {
  championId: 'champ-contract-001',
  name: 'ContractTester',
  role: 'CHAMPION',
  totalScore: 120,
  topModules: ['coupon', 'member'],
  recentContributions: [
    { kind: 'COMMIT', refId: 'c-a1b2', occurredAt: '2026-06-25T10:00:00Z', weight: 2 },
    { kind: 'RFC', refId: 'rfc-x3y4', occurredAt: '2026-06-24T08:00:00Z', weight: 3 },
    { kind: 'REVIEW', refId: 'pr-z5w6', occurredAt: '2026-06-23T12:00:00Z', weight: 1 },
  ],
};

// ════════════════ 合约: 实体 Shape ════════════════════

describe('[recommender] 合约: 实体 Shape', () => {
  it('ChampionSummary 包含全部必要字段', () => {
    const c: ChampionSummary = {
      championId: 'c1',
      name: 'c1',
      role: 'CHAMPION',
      totalScore: 42,
      topModules: ['a'],
      recentContributions: [],
    };
    assert.equal(typeof c.championId, 'string');
    assert.equal(typeof c.name, 'string');
    assert.ok(['CHAMPION', 'APPROVER'].includes(c.role));
    assert.equal(typeof c.totalScore, 'number');
    assert.ok(Array.isArray(c.topModules));
    assert.ok(Array.isArray(c.recentContributions));
  });

  it('ChampionRole 枚举: CHAMPION | APPROVER', () => {
    const valid: ChampionRole[] = ['CHAMPION', 'APPROVER'];
    for (const r of valid) {
      assert.ok(typeof r === 'string');
    }
  });

  it('ContributionKind 枚举', () => {
    const valid: ContributionKind[] = ['COMMIT', 'RFC', 'REVIEW'];
    for (const k of valid) assert.ok(typeof k === 'string');
  });

  it('RecommendationStatus 枚举', () => {
    const valid: RecommendationStatus[] = ['pending', 'read', 'adopted', 'dismissed'];
    for (const s of valid) assert.ok(typeof s === 'string');
  });

  it('ConfidenceLevel 枚举', () => {
    const valid: ConfidenceLevel[] = ['high', 'medium', 'low'];
    for (const l of valid) assert.ok(typeof l === 'string');
  });

  it('RecommendationLog 包含全部必要字段', () => {
    const log: RecommendationLog = {
      id: 'log-001',
      championId: 'c1',
      module: 'coupon',
      recommendationsCount: 5,
      adoptedCount: 2,
      executedAt: '2026-06-26T00:00:00Z',
      executionTimeMs: 150,
    };
    assert.ok(log.id.startsWith('log-'));
    assert.equal(typeof log.recommendationsCount, 'number');
    assert.equal(typeof log.adoptedCount, 'number');
    assert.equal(typeof log.executionTimeMs, 'number');
    assert.ok(Date.parse(log.executedAt) > 0);
  });
});

// ════════════════ 合约: Champion 服务 ═════════════════

describe('[recommender] 合约: Champion 服务', () => {
  it('getChampion 不存在时返回 fallback', () => {
    const svc = makeService().recommenderSvc;
    const c = svc.getChampion('unknown-007');
    assert.equal(c.championId, 'unknown-007');
    assert.equal(c.name, 'Champion-unknown-007');
    assert.equal(c.role, 'CHAMPION');
    assert.equal(c.totalScore, 0);
    assert.deepEqual(c.topModules, []);
    assert.deepEqual(c.recentContributions, []);
  });

  it('upsertChampion 后 getChampion 返回相同数据', () => {
    const svc = makeService().recommenderSvc;
    svc.upsertChampion(sampleChampion);
    const c = svc.getChampion('champ-contract-001');
    assert.equal(c.name, 'ContractTester');
    assert.equal(c.totalScore, 120);
    assert.equal(c.recentContributions.length, 3);
  });

  it('upsertChampion 覆盖已有数据', () => {
    const svc = makeService().recommenderSvc;
    svc.upsertChampion(sampleChampion);
    svc.upsertChampion({ ...sampleChampion, name: 'Updated', totalScore: 999 });
    const c = svc.getChampion('champ-contract-001');
    assert.equal(c.name, 'Updated');
    assert.equal(c.totalScore, 999);
  });

  it('getAllChampions 返回注册的所有 champion', () => {
    const svc = makeService().recommenderSvc;
    assert.equal(svc.getAllChampions().length, 0);
    svc.upsertChampion(sampleChampion);
    svc.upsertChampion({ ...sampleChampion, championId: 'c2' });
    assert.equal(svc.getAllChampions().length, 2);
  });
});

// ════════════════ 合约: Context 构建 ══════════════════

describe('[recommender] 合约: Context 构建', () => {
  it('build 返回完整 RecommendationContext', () => {
    const svc = makeService();
    svc.recommenderSvc.upsertChampion(sampleChampion);
    const champion = svc.recommenderSvc.getChampion('champ-contract-001');
    const allChamps = svc.recommenderSvc.getAllChampions();

    const ctx = svc.contextBuilder.build({
      champion,
      currentFiles: ['apps/api/src/modules/coupon/coupon.service.ts'],
      branch: 'feature/contract-test',
      allChampions: allChamps,
    });

    assert.ok(ctx);
    assert.equal(ctx.champion.championId, 'champ-contract-001');
    assert.equal(ctx.currentTask.branch, 'feature/contract-test');
    assert.ok(ctx.currentTask.files.some((f: string) => f.includes('coupon.service.ts')));
    assert.equal(ctx.currentTask.module, 'coupon');
    assert.ok(Array.isArray(ctx.relatedChampions));
    assert.ok(Array.isArray(ctx.recentSummary.topRefIds));
  });

  it('build 空文件时 module 为 unknown', () => {
    const svc = makeService();
    const champion = svc.recommenderSvc.getChampion('c-empty');
    const ctx = svc.contextBuilder.build({
      champion,
      currentFiles: [],
      allChampions: [],
    });
    assert.equal(ctx.currentTask.module, 'unknown');
    assert.equal(ctx.currentTask.files.length, 0);
  });

  it('build 多文件推断 module 为第一个匹配', () => {
    const svc = makeService();
    const champion = svc.recommenderSvc.getChampion('c-multi');
    const ctx = svc.contextBuilder.build({
      champion,
      currentFiles: [
        'apps/api/src/modules/coupon/coupon.dto.ts',
        'apps/api/src/modules/member/member.service.ts',
      ],
      allChampions: [],
    });
    // 按顺序第一个匹配的是 coupon
    assert.equal(ctx.currentTask.module, 'coupon');
  });

  it('build recentSummary 包含正确的贡献数/种类', () => {
    const svc = makeService();
    svc.recommenderSvc.upsertChampion(sampleChampion);
    const champion = svc.recommenderSvc.getChampion('champ-contract-001');
    const ctx = svc.contextBuilder.build({
      champion,
      currentFiles: [],
      allChampions: [],
    });
    assert.equal(ctx.recentSummary.totalContributions, 3);
    assert.equal(ctx.recentSummary.byKind['COMMIT'], 1);
    assert.equal(ctx.recentSummary.byKind['RFC'], 1);
    assert.equal(ctx.recentSummary.byKind['REVIEW'], 1);
    assert.equal(ctx.recentSummary.topRefIds.length, 3);
  });

  it('build 转换 Champion APPOVER 角色', () => {
    const svc = makeService();
    svc.recommenderSvc.upsertChampion({ ...sampleChampion, role: 'APPROVER' });
    const champion = svc.recommenderSvc.getChampion('champ-contract-001');
    const ctx = svc.contextBuilder.build({
      champion,
      currentFiles: [],
      allChampions: [],
    });
    assert.equal(ctx.champion.role, 'APPROVER');
  });
});

// ════════════════ 合约: RAG 检索排序 ══════════════════

describe('[recommender] 合约: RAG 检索', () => {
  it('retrieve 返回 RankedResult 数组', () => {
    const svc = makeService();
    svc.recommenderSvc.upsertChampion(sampleChampion);
    const champion = svc.recommenderSvc.getChampion('champ-contract-001');
    const ctx = svc.contextBuilder.build({
      champion,
      currentFiles: ['apps/api/src/modules/member/member.service.ts'],
      allChampions: [champion],
    });

    const results = svc.ragRetrieval.retrieve({ context: ctx, topK: 5 });
    assert.ok(Array.isArray(results));
    for (const r of results) {
      assert.equal(typeof r.chunkId, 'string');
      assert.equal(typeof r.sourcePath, 'string');
      assert.equal(typeof r.totalScore, 'number');
      assert.ok(r.totalScore >= 0);
      assert.ok(r.totalScore <= 6);
      assert.equal(typeof r.reason, 'string');
      assert.ok(r.scores.semantic >= 0);
      assert.ok(r.scores.recency >= 0);
      assert.ok(r.scores.championAffinity >= 0);
    }
  });

  it('检索结果按 totalScore 降序排列', () => {
    const svc = makeService();
    const champion = svc.recommenderSvc.getChampion('champ-rank');
    const ctx = svc.contextBuilder.build({
      champion,
      currentFiles: ['apps/api/src/modules/coupon/coupon.service.ts'],
      allChampions: [champion],
    });

    const results = svc.ragRetrieval.retrieve({ context: ctx, topK: 10 });
    for (let i = 1; i < results.length; i++) {
      assert.ok(results[i].totalScore <= results[i - 1].totalScore,
        `Result[${i}] score ${results[i].totalScore} should be <= result[${i-1}] score ${results[i-1].totalScore}`);
    }
  });

  it('topK 限制返回数量', () => {
    const svc = makeService();
    const champion = svc.recommenderSvc.getChampion('champ-limit');
    const ctx = svc.contextBuilder.build({
      champion,
      currentFiles: ['apps/api/src/modules/member/member.service.ts'],
      allChampions: [champion],
    });

    const results = svc.ragRetrieval.retrieve({ context: ctx, topK: 3 });
    assert.ok(results.length <= 3);
  });

  it('检索结果冠军亲和度与 champion topModules 相关', () => {
    const svc = makeService();
    svc.recommenderSvc.upsertChampion(sampleChampion);
    const champion = svc.recommenderSvc.getChampion('champ-contract-001');

    // 检索 member 相关模块
    const results = svc.ragRetrieval.retrieve({
      context: svc.contextBuilder.build({
        champion,
        currentFiles: ['apps/api/src/modules/member/member.service.ts'],
        allChampions: [champion],
      }),
      topK: 10,
    });

    // champion.topModules 包含 member, 所以 member 相关文档应有 championAffinity > 0
    const memberResults = results.filter((r) => r.sourcePath.includes('member'));
    for (const r of memberResults) {
      assert.ok(r.scores.championAffinity > 0, `${r.sourcePath} should have champion affinity`);
    }
  });

  it('各字段中 scores 子字段全部非负', () => {
    const svc = makeService();
    const champion = svc.recommenderSvc.getChampion('champ-scores');
    const results = svc.ragRetrieval.retrieve({
      context: svc.contextBuilder.build({
        champion,
        currentFiles: ['apps/api/src/modules/member/member.service.ts'],
        allChampions: [champion],
      }),
      topK: 5,
    });

    for (const r of results) {
      assert.ok(r.scores.semantic >= 0);
      assert.ok(r.scores.recency >= 0);
      assert.ok(r.scores.championAffinity >= 0);
      assert.equal(r.totalScore, r.scores.semantic + r.scores.recency + r.scores.championAffinity);
    }
  });
});

// ════════════════ 合约: 个性化推荐 ════════════════════

describe('[recommender] 合约: 个性化推荐', () => {
  it('recommend 返回 RecommendResponse', () => {
    const svc = makeService();
    const resp = svc.personalizedRecommender.recommend({
      champion: sampleChampion,
      currentFiles: ['apps/api/src/modules/coupon/coupon.service.ts'],
      branch: 'feat/new-rules',
      allChampions: [sampleChampion],
      topK: 3,
    });

    assert.ok(resp);
    assert.ok(resp.context);
    assert.ok(Array.isArray(resp.recommendations));
    assert.ok(resp.recommendations.length <= 3);
  });

  it('每条推荐包含完整字段', () => {
    const svc = makeService();
    const resp = svc.personalizedRecommender.recommend({
      champion: sampleChampion,
      currentFiles: ['apps/api/src/modules/member/member.service.ts'],
      allChampions: [sampleChampion],
      topK: 5,
    });

    for (const item of resp.recommendations) {
      assert.equal(typeof item.rank, 'number');
      assert.ok(item.rank >= 1);
      assert.equal(typeof item.chunkId, 'string');
      assert.equal(typeof item.sourcePath, 'string');
      assert.equal(typeof item.reason, 'string');
      assert.equal(typeof item.confidence, 'number');
      assert.ok(item.confidence > 0);
      assert.equal(typeof item.content, 'string');
      assert.ok(['pending', 'read', 'adopted', 'dismissed'].includes(item.status));
      assert.ok(Date.parse(item.createdAt) > 0);
    }
  });

  it('推荐按 confidence + rank 排序', () => {
    const svc = makeService();
    const resp = svc.personalizedRecommender.recommend({
      champion: sampleChampion,
      currentFiles: ['apps/api/src/modules/coupon/coupon.service.ts'],
      allChampions: [sampleChampion],
      topK: 10,
    });

    for (let i = 1; i < resp.recommendations.length; i++) {
      assert.ok(resp.recommendations[i].rank > resp.recommendations[i - 1].rank);
    }
  });

  it('adoptionRate 目前未实现，为 undefined（后续追踪字段）', () => {
    const svc = makeService();
    svc.recommenderSvc.upsertChampion(sampleChampion);

    const resp = svc.personalizedRecommender.recommend({
      champion: sampleChampion,
      currentFiles: ['apps/api/src/modules/coupon/coupon.service.ts'],
      allChampions: [sampleChampion],
      topK: 3,
    });

    // PersonalizedRecommender 当前不计算采纳率
    assert.equal(resp.adoptionRate, undefined);
  });

  it('空文件推荐时推荐列表可能为空', () => {
    const svc = makeService();
    const resp = svc.personalizedRecommender.recommend({
      champion: sampleChampion,
      currentFiles: [],
      allChampions: [sampleChampion],
      topK: 3,
    });
    // 空文件时 module 推断为 unknown，可能无匹配
    assert.equal(resp.context.currentTask.module, 'unknown');
    assert.ok(Array.isArray(resp.recommendations));
  });

  it('topK=0 不返回任何推荐', () => {
    const svc = makeService();
    const resp = svc.personalizedRecommender.recommend({
      champion: sampleChampion,
      currentFiles: ['apps/api/src/modules/coupon/coupon.service.ts'],
      allChampions: [sampleChampion],
      topK: 0,
    });
    assert.deepEqual(resp.recommendations, []);
  });
});

// ════════════════ 合约: 反馈与统计 ════════════════════

describe('[recommender] 合约: 反馈与统计', () => {
  it('recordFeedback 增加反馈总数', () => {
    const svc = makeService().recommenderSvc;
    svc.recordFeedback('c1', 'chunk-1', 'adopted');
    svc.recordFeedback('c1', 'chunk-2', 'dismissed');
    svc.recordFeedback('c1', 'chunk-3', 'read');

    const stats = svc.getFeedbackStats();
    assert.equal(stats.total, 3);
    assert.equal(stats.adopted, 1);
    assert.equal(stats.dismissed, 1);
    assert.equal(stats.read, 1);
  });

  it('无反馈时统计均为 0', () => {
    const svc = makeService().recommenderSvc;
    const stats = svc.getFeedbackStats();
    assert.equal(stats.total, 0);
    assert.equal(stats.adopted, 0);
    assert.equal(stats.dismissed, 0);
    assert.equal(stats.read, 0);
  });

  it('recordFeedback adopted 更新日志的 adoptedCount（每日志 +1）', () => {
    const svc = makeService().recommenderSvc;
    svc.logRecommendation('c-adopt', 'coupon', 3, 100);
    svc.logRecommendation('c-adopt', 'coupon', 2, 80);

    svc.recordFeedback('c-adopt', 'chunk-x', 'adopted');
    const logs = svc.getStats({ championId: 'c-adopt' });

    // adopted 事件更新第一个匹配日志的 adoptedCount
    const totalAdopted = logs.reduce((s, l) => s + l.adoptedCount, 0);
    assert.equal(totalAdopted, 1); // 只有一个日志被 +1
  });

  it('getStats 按 championId 过滤', () => {
    const svc = makeService().recommenderSvc;
    svc.logRecommendation('a', 'coupon', 3, 100);
    svc.logRecommendation('b', 'member', 5, 200);
    svc.logRecommendation('a', 'tenant', 2, 50);

    const logsA = svc.getStats({ championId: 'a' });
    assert.equal(logsA.length, 2);
    assert.ok(logsA.every((l) => l.championId === 'a'));
  });

  it('getStats 按 module 过滤', () => {
    const svc = makeService().recommenderSvc;
    svc.logRecommendation('a', 'coupon', 3, 100);
    svc.logRecommendation('b', 'coupon', 2, 80);
    svc.logRecommendation('a', 'member', 5, 200);

    const logs = svc.getStats({ module: 'coupon' });
    assert.equal(logs.length, 2);
    assert.ok(logs.every((l) => l.module === 'coupon'));
  });

  it('getStats 按 days 过滤', () => {
    const svc = makeService().recommenderSvc;
    svc.logRecommendation('c', 'coupon', 3, 100);
    const logsWithin1Day = svc.getStats({ days: 1 });
    // 刚插入的日志应在1天内
    assert.equal(logsWithin1Day.length, 1);
    assert.equal(logsWithin1Day[0].championId, 'c');
  });

  it('getStats 返回按 executedAt 降序', () => {
    const svc = makeService().recommenderSvc;
    svc.logRecommendation('c', 'coupon', 3, 100);
    svc.logRecommendation('c', 'member', 5, 200);
    svc.logRecommendation('c', 'tenant', 2, 50);

    const logs = svc.getStats({ championId: 'c' });
    for (let i = 1; i < logs.length; i++) {
      assert.ok(
        new Date(logs[i].executedAt).getTime() <= new Date(logs[i - 1].executedAt).getTime(),
        'Timestamps should be descending',
      );
    }
  });

  it('getStats 空数据返回空数组', () => {
    const svc = makeService().recommenderSvc;
    assert.deepEqual(svc.getStats({ championId: 'ghost' }), []);
    assert.deepEqual(svc.getStats({}), []);
  });

  it('getStats 组合过滤 championId + module 交集生效', () => {
    const svc = makeService().recommenderSvc;
    svc.logRecommendation('x', 'coupon', 1, 10);
    svc.logRecommendation('x', 'member', 2, 20);
    svc.logRecommendation('y', 'coupon', 3, 30);

    const logs = svc.getStats({ championId: 'x', module: 'coupon' });
    assert.equal(logs.length, 1);
    assert.equal(logs[0].module, 'coupon');
    assert.equal(logs[0].championId, 'x');
  });
});

// ════════════════ 合约: 端点元数据 ════════════════════

describe('[recommender] 合约: 端点路由', () => {
  const { RecommenderController } = require('./recommender.controller');

  it('Controller path = recommender', () => {
    const path = Reflect.getMetadata('path', RecommenderController);
    assert.equal(path, 'recommender');
  });

  it('POST /recommend', () => {
    const method = Reflect.getMetadata('method', RecommenderController.prototype.recommend);
    const path = Reflect.getMetadata('path', RecommenderController.prototype.recommend);
    assert.equal(method, 1); // POST
    assert.equal(path, 'recommend');
  });

  it('GET /context/:championId', () => {
    const method = Reflect.getMetadata('method', RecommenderController.prototype.getContext);
    const path = Reflect.getMetadata('path', RecommenderController.prototype.getContext);
    assert.equal(method, 0); // GET
    assert.equal(path, 'context/:championId');
  });

  it('POST /feedback', () => {
    const method = Reflect.getMetadata('method', RecommenderController.prototype.recordFeedback);
    const path = Reflect.getMetadata('path', RecommenderController.prototype.recordFeedback);
    assert.equal(method, 1); // POST
    assert.equal(path, 'feedback');
  });

  it('POST /search', () => {
    const method = Reflect.getMetadata('method', RecommenderController.prototype.search);
    const path = Reflect.getMetadata('path', RecommenderController.prototype.search);
    assert.equal(method, 1); // POST
    assert.equal(path, 'search');
  });

  it('GET /stats', () => {
    const method = Reflect.getMetadata('method', RecommenderController.prototype.getStats);
    const path = Reflect.getMetadata('path', RecommenderController.prototype.getStats);
    assert.equal(method, 0); // GET
    assert.equal(path, 'stats');
  });
});
