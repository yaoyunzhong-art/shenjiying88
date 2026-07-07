import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * entity-linking.test.ts - Phase-23 T92
 * 实体链接 + 关系抽取单元测试
 */
import assert from 'node:assert/strict';
import { EntityLinker, extractRelation, extractMentions, stringSimilarity } from './entity-linking';
import { KnowledgeGraph } from './knowledge-graph';

describe('stringSimilarity', () => {
  it('AC-1 完全相同 → 1', () => {
    assert.equal(stringSimilarity('hello', 'hello'), 1);
  });

  it('AC-2 大小写不敏感', () => {
    assert.equal(stringSimilarity('Hello', 'hello'), 1);
  });

  it('AC-3 完全不同 → 接近 0', () => {
    assert.ok(stringSimilarity('abc', 'xyz') < 0.5);
  });

  it('AC-4 部分相似', () => {
    const sim = stringSimilarity('Alice', 'Alicia');
    assert.ok(sim > 0.6 && sim < 1);
  });

  it('AC-5 空字符串', () => {
    assert.equal(stringSimilarity('', ''), 1);
    assert.equal(stringSimilarity('a', ''), 0);
  });
});

describe('extractMentions', () => {
  it('AC-6 单个 entity 匹配', () => {
    const graph = new KnowledgeGraph();
    graph.addEntity({ type: 'Person', name: 'Alice', properties: {}, aliases: [] });
    const mentions = extractMentions('Hello Alice', graph);
    assert.equal(mentions.length, 1);
    assert.equal(mentions[0].linkedEntity?.name, 'Alice');
    assert.equal(mentions[0].confidence, 1.0);
  });

  it('AC-7 alias 匹配', () => {
    const graph = new KnowledgeGraph();
    graph.addEntity({ type: 'Person', name: 'Alice', aliases: ['Alicia'], properties: {} });
    const mentions = extractMentions('Alicia says hi', graph);
    assert.equal(mentions.length, 1);
  });

  it('AC-8 长 entity 优先匹配', () => {
    const graph = new KnowledgeGraph();
    graph.addEntity({ type: 'Person', name: 'Al', properties: {}, aliases: [] });
    graph.addEntity({ type: 'Person', name: 'Alice', properties: {}, aliases: [] });
    const mentions = extractMentions('Alice is here', graph);
    assert.equal(mentions.length, 1);
    assert.equal(mentions[0].linkedEntity?.name, 'Alice', 'Alice 优先于 Al');
  });

  it('AC-9 无匹配返回空', () => {
    const graph = new KnowledgeGraph();
    graph.addEntity({ type: 'Person', name: 'Alice', properties: {}, aliases: [] });
    assert.equal(extractMentions('Hello world', graph).length, 0);
  });
});

describe('extractRelation', () => {
  it('AC-10 works_at 关键词', () => {
    const alice = { id: 'a', type: 'Person', name: 'Alice', aliases: [], properties: {}, createdAt: 0 };
    const acme = { id: 'c', type: 'Company', name: 'Acme', aliases: [], properties: {}, createdAt: 0 };
    const rel = extractRelation(alice, acme, 'Alice works at Acme');
    assert.ok(rel);
    assert.equal(rel?.type, 'works_at');
  });

  it('AC-11 CEO of → works_at', () => {
    const alice = { id: 'a', type: 'Person', name: 'Alice', aliases: [], properties: {}, createdAt: 0 };
    const acme = { id: 'c', type: 'Company', name: 'Acme', aliases: [], properties: {}, createdAt: 0 };
    const rel = extractRelation(alice, acme, 'Alice is the CEO of Acme');
    assert.ok(rel);
    assert.equal(rel?.type, 'works_at');
  });

  it('AC-12 located_in 关键词', () => {
    const acme = { id: 'c', type: 'Company', name: 'Acme', aliases: [], properties: {}, createdAt: 0 };
    const nyc = { id: 'n', type: 'Place', name: 'NYC', aliases: [], properties: {}, createdAt: 0 };
    const rel = extractRelation(acme, nyc, 'Acme is located in NYC');
    assert.ok(rel);
    assert.equal(rel?.type, 'located_in');
  });

  it('AC-13 无关键词 → undefined', () => {
    const alice = { id: 'a', type: 'Person', name: 'Alice', aliases: [], properties: {}, createdAt: 0 };
    const acme = { id: 'c', type: 'Company', name: 'Acme', aliases: [], properties: {}, createdAt: 0 };
    assert.equal(extractRelation(alice, acme, 'Alice and Acme'), undefined);
  });
});

describe('EntityLinker · 链接流程', () => {
  let graph: KnowledgeGraph;
  let linker: EntityLinker;
  beforeEach(() => {
    graph = new KnowledgeGraph();
    graph.addEntity({ type: 'Person', name: 'Alice', aliases: ['Alicia'], properties: {} });
    graph.addEntity({ type: 'Company', name: 'Acme', properties: {}, aliases: [] });
    linker = new EntityLinker();
  });

  it('AC-14 link 返回所有 mentions', () => {
    const result = linker.link('Alice and Acme', graph);
    assert.equal(result.mentions.length, 2);
  });

  it('AC-15 unresolved 列表', () => {
    const result = linker.link('Unknown person and Alice', graph);
    // Unknown 没匹配, Alice 匹配
    assert.equal(result.unresolved.length, 0, '所有 mentions 都应已链接');
  });

  it('AC-16 模糊匹配 (fuzzy)', () => {
    const linker = new EntityLinker({ fuzzyThreshold: 0.7 });
    const result = linker.link('Alicee is here', graph);
    // Alicee (6 字符) vs Alice (5 字符): 5/6 = 0.83 相似度 → 应匹配
    assert.ok(result.mentions.length > 0);
    assert.ok(result.mentions[0].confidence > 0.7);
  });

  it('AC-17 禁用 fuzzy → 严格匹配', () => {
    const linker = new EntityLinker({ enableFuzzy: false });
    const result = linker.link('Alicee is here', graph);
    // 严格匹配找不到 Alicee
    assert.equal(result.mentions.length, 0);
  });
});

describe('EntityLinker · 关系抽取', () => {
  let graph: KnowledgeGraph;
  let linker: EntityLinker;
  beforeEach(() => {
    graph = new KnowledgeGraph();
    graph.addEntity({ type: 'Person', name: 'Alice', properties: {}, aliases: [] });
    graph.addEntity({ type: 'Company', name: 'Acme', properties: {}, aliases: [] });
    linker = new EntityLinker();
  });

  it('AC-18 extractRelations 抽取 works_at', () => {
    const linkResult = linker.link('Alice works at Acme', graph);
    const rels = linker.extractRelations('Alice works at Acme', linkResult);
    assert.ok(rels.length > 0);
    assert.equal(rels[0].type, 'works_at');
    assert.equal(rels[0].from.name, 'Alice');
    assert.equal(rels[0].to.name, 'Acme');
  });

  it('AC-19 ingest 写入 graph', () => {
    const result = linker.ingest('Alice works at Acme', graph);
    assert.ok(result.mentions >= 2);
    assert.ok(result.relations >= 1);
    assert.equal(graph.stats().relationCount, 1);
  });
});
