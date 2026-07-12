import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * graph-rag.test.ts - Phase-23 T91
 * GraphRAG 单元测试
 */
import assert from 'node:assert/strict';
import { GraphRAG, extractEntities } from './graph-rag';
import { KnowledgeGraph } from './knowledge-graph';
import { HybridSearch } from '../knowledge/hybrid-search';
import { embedTextV2 } from '../knowledge/multimodal-embedding.service';

describe('extractEntities', () => {
  it('AC-1 精确匹配 entity name', () => {
    const graph = new KnowledgeGraph();
    graph.addEntity({ type: 'Person', name: 'Alice', properties: {}, aliases: [] });
    graph.addEntity({ type: 'Company', name: 'Acme', properties: {}, aliases: [] });
    const entities = extractEntities('Tell me about Alice', graph);
    assert.equal(entities.length, 1);
    assert.equal(entities[0].name, 'Alice');
  });

  it('AC-2 匹配多个 entities', () => {
    const graph = new KnowledgeGraph();
    graph.addEntity({ type: 'Person', name: 'Alice', properties: {}, aliases: [] });
    graph.addEntity({ type: 'Company', name: 'Acme', properties: {}, aliases: [] });
    const entities = extractEntities('Alice works at Acme', graph);
    assert.equal(entities.length, 2);
  });

  it('AC-3 匹配 aliases', () => {
    const graph = new KnowledgeGraph();
    graph.addEntity({ type: 'Person', name: 'Alice', aliases: ['Alicia', 'Al'], properties: {} });
    const entities = extractEntities('Alicia is here', graph);
    assert.equal(entities.length, 1);
    assert.equal(entities[0].name, 'Alice');
  });

  it('AC-4 无匹配返回空', () => {
    const graph = new KnowledgeGraph();
    graph.addEntity({ type: 'Person', name: 'Alice', properties: {}, aliases: [] });
    const entities = extractEntities('Random query', graph);
    assert.equal(entities.length, 0);
  });

  it('AC-5 大小写不敏感', () => {
    const graph = new KnowledgeGraph();
    graph.addEntity({ type: 'Person', name: 'Alice', properties: {}, aliases: [] });
    const entities = extractEntities('alice alice alice', graph);
    assert.equal(entities.length, 1);
    assert.equal(entities[0].name, 'Alice');
  });
});

describe('GraphRAG · 主流程', () => {
  let graph: KnowledgeGraph;
  let vector: HybridSearch;
  let rag: GraphRAG;
  beforeEach(() => {
    graph = new KnowledgeGraph();
    // 建立小图: Alice → Acme → NYC
    const alice = graph.addEntity({ type: 'Person', name: 'Alice', properties: {}, aliases: [] });
    const acme = graph.addEntity({ type: 'Company', name: 'Acme', properties: {}, aliases: [] });
    const nyc = graph.addEntity({ type: 'Place', name: 'NYC', properties: {}, aliases: [] });
    graph.addRelation({ from: alice.id, to: acme.id, type: 'works_at', confidence: 1, properties: {} });
    graph.addRelation({ from: acme.id, to: nyc.id, type: 'located_in', confidence: 1, properties: {} });

    vector = new HybridSearch();
    rag = new GraphRAG(graph, vector);
  });

  it('AC-6 retrieve 返回 subgraph + vector + paths', () => {
    const result = rag.retrieve({ query: 'Where does Alice work?' });
    // 分步断言精确定位失败点
    assert.ok(result.subgraph.nodes.length > 0, '应返回非空子图');
    assert.ok(result.vectorResults.length > 0, '应返回向量结果 [' + result.subgraph.nodes.length + ' nodes, ' + result.vectorResults.length + ' vectors]');
    assert.ok(result.durationMs >= 0, 'durationMs 应 >= 0');
  });

  it('AC-7 subgraph 包含 Alice + Acme', () => {
    const result = rag.retrieve({ query: 'Alice' });
    const names = result.subgraph.nodes.map((n) => n.entity.name);
    assert.ok(names.includes('Alice'));
    assert.ok(names.includes('Acme'));
  });

  it('AC-8 combined 排序 by score', () => {
    const result = rag.retrieve({ query: 'Alice' });
    for (let i = 1; i < result.combined.length; i++) {
      assert.ok(result.combined[i - 1].score >= result.combined[i].score, '应按 score 倒序');
    }
  });

  it('AC-9 maxHops 限制子图大小', () => {
    const result = rag.retrieve({ query: 'Alice', maxHops: 1 });
    // 1-hop 应该只有 Alice + Acme
    assert.equal(result.subgraph.stats.nodeCount, 2);
  });

  it('AC-10 topK 限制结果数', () => {
    const result = rag.retrieve({ query: 'Alice', topK: 2 });
    assert.ok(result.vectorResults.length <= 2);
  });

  it('AC-11 stats() 透传 graph', () => {
    const stats = rag.stats();
    assert.equal(stats.entityCount, 3);
  });
});
