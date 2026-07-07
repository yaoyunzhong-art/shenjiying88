// rag-retrieval.service.ts - Phase-19 T32
// 用途: 基于 Champion context 的多维度 RAG 召回 + 重排
// 关联: phase-19-intelligence/spec.md §Phase 3
import { Injectable } from '@nestjs/common';
import { KnowledgeIndexerService, type QueryResponse } from '../knowledge/knowledge-indexer.service';
import type { RecommendationContext } from './context-builder.service';

export interface RankedResult {
  chunkId: string;
  sourcePath: string;
  content: string;
  title?: string;
  section?: string;
  kind?: string;
  scores: {
    semantic: number;
    recency: number;
    championAffinity: number;
  };
  totalScore: number;
  reason: string;
}

@Injectable()
export class RagRetrievalService {
  constructor(private readonly indexer: KnowledgeIndexerService) {}

  /**
   * 多维度召回 + 重排
   */
  retrieve(input: {
    context: RecommendationContext;
    topK?: number;
    recencyBoostDays?: number;
  }): RankedResult[] {
    const topK = input.topK ?? 5;
    const recencyBoostDays = input.recencyBoostDays ?? 30;

    // 1. 改写 query - 加入 Champion context
    const rewrittenQuery = this.rewriteQuery(input.context);

    // 2. 基础语义召回
    const initial: QueryResponse = this.indexer.query({ query: rewrittenQuery, topK: topK * 3 });
    const candidateChunks = initial.results.map((r) => r.chunk);

    // 3. 重排:加入 recency + champion affinity
    const ranked = candidateChunks.map((chunk) => {
      const semantic = initial.results.find((r) => r.chunk.id === chunk.id)?.score ?? 0;
      const recency = this.computeRecencyScore(chunk, recencyBoostDays);
      const championAffinity = this.computeChampionAffinity(chunk, input.context);
      const total = semantic * 0.5 + recency * 0.2 + championAffinity * 0.3;
      return {
        chunkId: chunk.id,
        sourcePath: chunk.sourcePath,
        content: chunk.content,
        title: chunk.metadata.title,
        section: chunk.metadata.section,
        kind: chunk.metadata.kind,
        scores: { semantic, recency, championAffinity },
        totalScore: total,
        reason: this.composeReason(semantic, recency, championAffinity),
      };
    });

    return ranked.sort((a, b) => b.totalScore - a.totalScore).slice(0, topK);
  }

  /**
   * query 改写 - 注入 context 信息
   */
  private rewriteQuery(ctx: RecommendationContext): string {
    const parts = [ctx.currentTask.module, ctx.currentTask.description ?? ''];
    if (ctx.champion.topModules.length > 0) {
      parts.push(ctx.champion.topModules.join(' '));
    }
    return parts.filter(Boolean).join(' ');
  }

  /**
   * recency score - 越新越高
   */
  private computeRecencyScore(chunk: { createdAt: string }, boostDays: number): number {
    const ageMs = Date.now() - new Date(chunk.createdAt).getTime();
    const ageDays = ageMs / (24 * 60 * 60 * 1000);
    if (ageDays > boostDays) return 0;
    return 1 - ageDays / boostDays;
  }

  /**
   * champion affinity - 与 Champion top module 匹配
   */
  private computeChampionAffinity(chunk: { sourcePath: string; metadata: { section?: string } }, ctx: RecommendationContext): number {
    const moduleMatch = ctx.champion.topModules.some((m) => chunk.sourcePath.includes(m));
    const sectionMatch = ctx.currentTask.module && chunk.metadata.section?.includes(ctx.currentTask.module);
    return moduleMatch ? 0.7 : sectionMatch ? 0.5 : 0.2;
  }

  private composeReason(semantic: number, recency: number, affinity: number): string {
    const parts: string[] = [];
    if (semantic > 0.5) parts.push('highly relevant');
    if (recency > 0.7) parts.push('recent');
    if (affinity > 0.5) parts.push('matches your expertise');
    return parts.join(', ') || 'baseline match';
  }
}
