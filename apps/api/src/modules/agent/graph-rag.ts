/**
 * graph-rag.ts - Phase-23 T91
 * GraphRAG (Graph + 向量混合检索)
 *
 * 模式:
 * 1. 从 query 抽取实体 (mock: 关键词匹配)
 * 2. 在知识图谱中找相关子图 (subgraph)
 * 3. 子图节点与 query 向量比对 (semantic)
 * 4. 综合 BM25 / 向量 / Graph 三路结果 (RRF)
 *
 * 应用:
 * - 比纯 RAG 更适合多跳问题 (multi-hop reasoning)
 * - 比纯 Graph 更鲁棒 (向量检索兜底)
 */
import { Injectable } from '@nestjs/common';
import { KnowledgeGraph, Entity, Relation, GraphQueryResult } from './knowledge-graph';
import { HybridSearch, HybridSearchResult } from '../knowledge/hybrid-search';
import { embedTextV2, cosineSimilarity } from '../knowledge/multimodal-embedding.service';

// ── Types ──

export interface GraphRAGQuery {
  query: string;
  topK?: number;
  /** 最大图遍历跳数 */
  maxHops?: number;
}

export interface GraphRAGResult {
  /** 最终综合结果 */
  combined: HybridSearchResult[];
  /** Graph 子图结果 */
  subgraph: GraphQueryResult;
  /** 向量检索结果 */
  vectorResults: Array<{ entity: Entity; score: number }>;
  /** 路径 (从 query 实体到答案实体的路径) */
  paths: Relation[][];
  /** 总耗时 */
  durationMs: number;
}

// ── Entity Extractor (V2 mock) ──

/**
 * V2 mock entity extractor: 基于子串匹配
 * 生产接 LLM-based NER 或专用模型 (e.g., spaCy)
 */
export function extractEntities(query: string, graph: KnowledgeGraph): Entity[] {
  const lower = query.toLowerCase();
  const matched: Entity[] = [];
  const seen = new Set<string>();
  // 迭代所有 entities (不限于特定 type)
  const allEntities: Entity[] = [];
  for (const entity of graph.listEntitiesByType('Person')) allEntities.push(entity);
  for (const entity of graph.listEntitiesByType('Place')) allEntities.push(entity);
  for (const entity of graph.listEntitiesByType('Product')) allEntities.push(entity);
  for (const entity of graph.listEntitiesByType('Concept')) allEntities.push(entity);
  for (const entity of graph.listEntitiesByType('Company')) allEntities.push(entity);

  for (const entity of allEntities) {
    if (seen.has(entity.id)) continue;
    if (lower.includes(entity.name.toLowerCase())) {
      matched.push(entity);
      seen.add(entity.id);
      continue;
    }
    for (const alias of entity.aliases) {
      if (lower.includes(alias.toLowerCase())) {
        matched.push(entity);
        seen.add(entity.id);
        break;
      }
    }
  }
  return matched;
}

// ── GraphRAG ──

@Injectable()
export class GraphRAG {
  private readonly graph: KnowledgeGraph;
  private readonly vectorIndex: HybridSearch;

  constructor(graph: KnowledgeGraph, vectorIndex: HybridSearch) {
    this.graph = graph;
    this.vectorIndex = vectorIndex;
  }

  /**
   * GraphRAG 主流程
   */
  retrieve(q: GraphRAGQuery): GraphRAGResult {
    const start = Date.now();
    const topK = q.topK ?? 10;
    const maxHops = q.maxHops ?? 2;

    // 1. 实体抽取
    const entities = extractEntities(q.query, this.graph);

    // 2. 子图提取 (从抽取的实体出发, 多起点 union)
    let combinedSubgraph: GraphQueryResult = { nodes: [], relations: [], stats: { nodeCount: 0, relationCount: 0, maxDepth: 0 } };
    for (const e of entities) {
      const sub = this.graph.subgraph(e.id, maxHops);
      // union
      const existingNodeIds = new Set(combinedSubgraph.nodes.map((n) => n.entity.id));
      for (const node of sub.nodes) {
        if (!existingNodeIds.has(node.entity.id)) {
          combinedSubgraph.nodes.push(node);
        }
      }
      const existingRelIds = new Set(combinedSubgraph.relations.map((r) => r.id));
      for (const rel of sub.relations) {
        if (!existingRelIds.has(rel.id)) {
          combinedSubgraph.relations.push(rel);
        }
      }
    }
    combinedSubgraph.stats = {
      nodeCount: combinedSubgraph.nodes.length,
      relationCount: combinedSubgraph.relations.length,
      maxDepth: Math.max(...combinedSubgraph.nodes.map((n) => n.distance), 0),
    };

    // 3. 向量检索 (semantic): 每个节点与 query 比对
    const queryVec = embedTextV2(q.query);
    const vectorResults = combinedSubgraph.nodes
      .map((node) => {
        // 拼接 entity name + aliases + properties 文本 → embed
        const text = [
          node.entity.name,
          ...node.entity.aliases,
          ...Object.entries(node.entity.properties).map(([k, v]) => `${k}: ${String(v)}`),
        ].join(' ');
        const vec = embedTextV2(text);
        const score = cosineSimilarity(queryVec, vec);
        return { entity: node.entity, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    // 4. 路径提取 (从 query 实体到 top 向量结果)
    const paths: Relation[][] = [];
    for (const target of vectorResults.slice(0, 3)) {
      for (const startEntity of entities) {
        const path = this.graph.shortestPath(startEntity.id, target.entity.id);
        if (path && path.length > 0) {
          paths.push(path);
          break;
        }
      }
    }

    // 5. 综合 (按 score 排序 + 转换格式)
    const combined: HybridSearchResult[] = vectorResults.map((r) => ({
      id: r.entity.id,
      score: r.score,
      sources: { vector: r.score },
      metadata: {
        name: r.entity.name,
        type: r.entity.type,
        aliases: r.entity.aliases,
        properties: r.entity.properties,
      },
    }));

    return {
      combined,
      subgraph: combinedSubgraph,
      vectorResults,
      paths,
      durationMs: Date.now() - start,
    };
  }

  /**
   * 列出图谱统计
   */
  stats() {
    return this.graph.stats();
  }
}
