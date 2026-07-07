// personalized-recommender.service.ts - Phase-19 T33
// 用途: 个性化推荐 - Champion context + RAG 召回 → 推荐列表
// 关联: phase-19-intelligence/spec.md §Phase 3
import { Injectable } from '@nestjs/common';
import { ContextBuilderService, type RecommendationContext } from './context-builder.service';
import { RagRetrievalService, type RankedResult } from './rag-retrieval.service';

export interface Recommendation {
  rank: number;
  chunkId: string;
  sourcePath: string;
  title?: string;
  section?: string;
  reason: string;
  confidence: number;
  content: string;
  status: 'pending' | 'read' | 'adopted' | 'dismissed';
  createdAt: string;
}

export interface RecommendResponse {
  context: RecommendationContext;
  recommendations: Recommendation[];
  /** 是否被采纳 (Phase-19 后续追踪) */
  adoptionRate?: number;
}

@Injectable()
export class PersonalizedRecommenderService {
  constructor(
    private readonly contextBuilder: ContextBuilderService,
    private readonly ragRetrieval: RagRetrievalService,
  ) {}

  /**
   * 主入口 - 生成推荐
   */
  recommend(input: {
    champion: import('./context-builder.service').ChampionSummary;
    currentFiles: string[];
    branch?: string;
    allChampions: import('./context-builder.service').ChampionSummary[];
    topK?: number;
  }): RecommendResponse {
    const context = this.contextBuilder.build(input);
    const ranked: RankedResult[] = this.ragRetrieval.retrieve({ context, topK: input.topK });

    const now = new Date().toISOString();
    const recommendations: Recommendation[] = ranked.map((r, i) => ({
      rank: i + 1,
      chunkId: r.chunkId,
      sourcePath: r.sourcePath,
      title: r.title,
      section: r.section,
      reason: r.reason,
      confidence: r.totalScore,
      content: r.content,
      status: 'pending',
      createdAt: now,
    }));

    return { context, recommendations };
  }

  /**
   * 格式化推荐输出 (用于 LLM prompt 或邮件)
   */
  formatForLLM(response: RecommendResponse): string {
    const lines: string[] = [];
    lines.push(`# Recommendations for ${response.context.champion.name}`);
    lines.push(`Current task: ${response.context.currentTask.module}`);
    lines.push('');
    for (const rec of response.recommendations) {
      lines.push(`## ${rec.rank}. ${rec.title ?? rec.sourcePath}`);
      lines.push(`Section: ${rec.section ?? 'N/A'}`);
      lines.push(`Reason: ${rec.reason}`);
      lines.push(`Confidence: ${(rec.confidence * 100).toFixed(0)}%`);
      lines.push('');
      lines.push(rec.content.slice(0, 300));
      lines.push('---');
    }
    return lines.join('\n');
  }
}
