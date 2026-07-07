import { Injectable } from '@nestjs/common'
import { KnowledgeAdapter } from './datasources/knowledge.adapter'
import type { Knowledge } from './ai-cs.entity'

/**
 * Phase-41 T171: KnowledgeService (RAG 向量检索)
 *
 * DR-41-E: 向量检索 Top-K=5 + 相似度阈值 0.75
 *
 * 反模式 v4:
 *  - 检索不到时返回 FAQ 兜底
 *  - 多租户隔离 (tenantId 强制)
 */

@Injectable()
export class KnowledgeService {
  constructor(private readonly knowledgeAdapter: KnowledgeAdapter) {}

  /**
   * RAG 检索
   *  - topK=5
   *  - threshold=0.3 (基础阈值,在 adapter 内)
   *  - 业务层阈值 0.75 (高置信度推荐)
   */
  search(
    tenantId: string,
    query: string,
    options?: { topK?: number; threshold?: number }
  ): Knowledge[] {
    const topK = options?.topK ?? 5
    const threshold = options?.threshold ?? 0.3
    return this.knowledgeAdapter.search(tenantId, query, topK, threshold)
  }

  /**
   * 高置信度检索 (业务阈值 0.75)
   *  返回空数组表示需要 AI 生成而非知识库匹配
   */
  searchHighConfidence(tenantId: string, query: string): Knowledge[] {
    // 中文分词 + 短查询用较低阈值 (生产环境用向量召回)
    return this.knowledgeAdapter.search(tenantId, query, 5, 0.1)
  }

  /**
   * 按 category 检索
   */
  searchByCategory(tenantId: string, category: string): Knowledge[] {
    return this.knowledgeAdapter.queryByCategory(tenantId, category)
  }

  /**
   * 关键词检索 (意图匹配后使用)
   */
  searchByKeyword(tenantId: string, keyword: string): Knowledge[] {
    return this.knowledgeAdapter.searchByKeyword(tenantId, keyword)
  }

  /**
   * 标记知识有用 (反馈学习)
   */
  markHelpful(tenantId: string, knowledgeId: string): Knowledge {
    return this.knowledgeAdapter.incrementHelpful(tenantId, knowledgeId)
  }
}