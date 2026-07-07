import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
import { ContextBuilderService } from './context-builder.service';
import { RagRetrievalService } from './rag-retrieval.service';
import { PersonalizedRecommenderService } from './personalized-recommender.service';
import { KnowledgeIndexerService } from '../knowledge/knowledge-indexer.service';

describe('Phase-19 T31-T33 推荐引擎', () => {
  let contextBuilder: ContextBuilderService;
  let indexer: KnowledgeIndexerService;
  let rag: RagRetrievalService;
  let recommender: PersonalizedRecommenderService;

  beforeEach(() => {
    contextBuilder = new ContextBuilderService();
    indexer = new KnowledgeIndexerService();
    rag = new RagRetrievalService(indexer);
    recommender = new PersonalizedRecommenderService(contextBuilder, rag);
  });

  // AC-1: Champion context 构建 (T31)
  it('AC-1 context builder infers module + relations', () => {
    const alice = {
      championId: 'c1', name: 'Alice', role: 'CHAMPION', totalScore: 100,
      topModules: ['coupon', 'tenant'],
      recentContributions: [
        { kind: 'COMMIT', refId: 'c-001', occurredAt: '2026-06-25', weight: 2 },
        { kind: 'RFC', refId: 'DR-005', occurredAt: '2026-06-20', weight: 8 },
      ],
    };
    const bob = {
      championId: 'c2', name: 'Bob', role: 'APPROVER', totalScore: 80,
      topModules: ['coupon'],
      recentContributions: [],
    };
    const ctx = contextBuilder.build({
      champion: alice,
      currentFiles: ['apps/api/src/modules/coupon/coupon.service.ts'],
      branch: 'feat/coupon-quota',
      allChampions: [alice, bob],
    });
    expect(ctx.currentTask.module).toBe('coupon');
    expect(ctx.currentTask.branch).toBe('feat/coupon-quota');
    expect(ctx.relatedChampions.length).toBe(1);
    expect(ctx.relatedChampions[0].name).toBe('Bob');
    expect(ctx.recentSummary.byKind['COMMIT']).toBe(1);
    expect(ctx.recentSummary.byKind['RFC']).toBe(1);
  });

  // AC-2: RAG 检索 (T32)
  it('AC-2 RAG retrieval with multi-dim scoring', () => {
    // 索引一些文档
    indexer.indexDocument({
      sourcePath: '.trae/specs/phase-17/coupon.md',
      content: '# Coupon Spec\n## Quota\nQuota double increment bug found in coupon service.\n\nReserve already incremented, business code increment again causing double count.\n\nFix: use check not reserve.',
      kind: 'spec',
    });
    indexer.indexDocument({
      sourcePath: '.trae/specs/phase-17/referral.md',
      content: '# Referral\n## Chain\nThree-level referral chain lookup.',
      kind: 'spec',
    });

    const champion = {
      championId: 'c1', name: 'Alice', role: 'CHAMPION', totalScore: 100,
      topModules: ['coupon'],
      recentContributions: [],
    };
    const allChampions = [champion];
    const ctx = contextBuilder.build({
      champion,
      currentFiles: ['apps/api/src/modules/coupon/coupon.service.ts'],
      allChampions,
    });
    const ranked = rag.retrieve({ context: ctx, topK: 3 });
    expect(ranked.length).toBeGreaterThan(0);
    expect(ranked[0].sourcePath).toContain('coupon');
  });

  // AC-3: Recommender 完整流程 (T33)
  it('AC-3 personalized recommender end-to-end', () => {
    indexer.indexDocument({
      sourcePath: 'a.md',
      content: '# A\n## B\nCoupon redemption pattern with quota check.',
      kind: 'spec',
    });
    const champion = {
      championId: 'c1', name: 'Alice', role: 'CHAMPION', totalScore: 100,
      topModules: ['coupon'],
      recentContributions: [],
    };
    const response = recommender.recommend({
      champion,
      currentFiles: ['modules/coupon/x.ts'],
      allChampions: [champion],
      topK: 3,
    });
    expect(response.recommendations.length).toBeGreaterThan(0);
    expect(response.recommendations[0].rank).toBe(1);
    expect(response.context.currentTask.module).toBe('coupon');
  });

  // AC-4: formatForLLM 输出格式
  it('AC-4 formatForLLM produces readable output', () => {
    indexer.indexDocument({
      sourcePath: 'x.md',
      content: '# Doc\n## Section\nContent here.',
      kind: 'doc',
    });
    const champion = {
      championId: 'c1', name: 'Alice', role: 'CHAMPION', totalScore: 0,
      topModules: [],
      recentContributions: [],
    };
    const response = recommender.recommend({
      champion,
      currentFiles: ['modules/test.ts'],
      allChampions: [champion],
    });
    const formatted = recommender.formatForLLM(response);
    expect(formatted).toContain('Recommendations for Alice');
    expect(formatted).toContain('Current task:');
  });

  // AC-5: 空索引 fallback
  it('AC-5 empty index fallback', () => {
    const champion = {
      championId: 'c1', name: 'Alice', role: 'CHAMPION', totalScore: 0,
      topModules: [],
      recentContributions: [],
    };
    const response = recommender.recommend({
      champion,
      currentFiles: ['modules/test.ts'],
      allChampions: [champion],
    });
    expect(response.recommendations.length).toBe(0);
    // 不抛错,优雅降级
  });
});
