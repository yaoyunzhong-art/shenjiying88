import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * knowledge-graph.test.ts - Phase-23 T90
 * 知识图谱单元测试
 */
import assert from 'node:assert/strict';
import { KnowledgeGraph } from './knowledge-graph';

describe('KnowledgeGraph · Entity CRUD', () => {
  let graph: KnowledgeGraph;
  beforeEach(() => {
    graph = new KnowledgeGraph();
  });

  it('AC-1 addEntity + getEntity', () => {
    const e = graph.addEntity({ type: 'Person', name: 'Alice', aliases: ['Al'], properties: {} });
    assert.ok(e.id);
    assert.equal(graph.getEntity(e.id)?.name, 'Alice');
  });

  it('AC-2 findEntityByName 含 alias', () => {
    const e = graph.addEntity({ type: 'Person', name: 'Alice', aliases: ['Al', 'Alicia'], properties: {} });
    assert.equal(graph.findEntityByName('al')?.id, e.id);
    assert.equal(graph.findEntityByName('Alicia')?.id, e.id);
  });

  it('AC-3 大小写不敏感', () => {
    const e = graph.addEntity({ type: 'Person', name: 'Alice', properties: {}, aliases: [] });
    assert.equal(graph.findEntityByName('ALICE')?.id, e.id);
    assert.equal(graph.findEntityByName('alice')?.id, e.id);
  });

  it('AC-4 deleteEntity 同步删除相关 relations', () => {
    const a = graph.addEntity({ type: 'Person', name: 'Alice', properties: {}, aliases: [] });
    const b = graph.addEntity({ type: 'Person', name: 'Bob', properties: {}, aliases: [] });
    const c = graph.addEntity({ type: 'Company', name: 'Acme', properties: {}, aliases: [] });
    graph.addRelation({ from: a.id, to: b.id, type: 'knows', confidence: 1, properties: {} });
    graph.addRelation({ from: a.id, to: c.id, type: 'works_at', confidence: 1, properties: {} });
    assert.equal(graph.stats().relationCount, 2);
    graph.deleteEntity(a.id);
    assert.equal(graph.stats().relationCount, 0, 'a 相关 relations 应被删除');
  });
});

describe('KnowledgeGraph · Relation CRUD', () => {
  let graph: KnowledgeGraph;
  beforeEach(() => {
    graph = new KnowledgeGraph();
    const a = graph.addEntity({ type: 'Person', name: 'Alice', properties: {}, aliases: [] });
    const b = graph.addEntity({ type: 'Company', name: 'Acme', properties: {}, aliases: [] });
    graph.addRelation({ from: a.id, to: b.id, type: 'works_at', confidence: 0.95, properties: {} });
  });

  it('AC-5 addRelation', () => {
    const stats = graph.stats();
    assert.equal(stats.relationCount, 1);
    assert.ok(stats.relationTypes.includes('works_at'));
  });

  it('AC-6 relation 不存在的 entity 抛错', () => {
    assert.throws(
      () => graph.addRelation({ from: 'nonexistent', to: 'foo', type: 'knows', confidence: 1, properties: {} }),
      /not found/,
    );
  });

  it('AC-7 deleteRelation', () => {
    const rels = graph.listRelationsByType('works_at');
    assert.equal(rels.length, 1);
    graph.deleteRelation(rels[0].id);
    assert.equal(graph.listRelationsByType('works_at').length, 0);
  });
});

describe('KnowledgeGraph · Query', () => {
  let graph: KnowledgeGraph;
  beforeEach(() => {
    graph = new KnowledgeGraph();
    // Alice works at Acme, Acme in NYC
    const alice = graph.addEntity({ type: 'Person', name: 'Alice', properties: {}, aliases: [] });
    const acme = graph.addEntity({ type: 'Company', name: 'Acme', properties: {}, aliases: [] });
    const nyc = graph.addEntity({ type: 'Place', name: 'NYC', properties: {}, aliases: [] });
    graph.addRelation({ from: alice.id, to: acme.id, type: 'works_at', confidence: 1, properties: {} });
    graph.addRelation({ from: acme.id, to: nyc.id, type: 'located_in', confidence: 1, properties: {} });
  });

  it('AC-8 getNeighbors out', () => {
    const alice = graph.findEntityByName('Alice')!;
    const neighbors = graph.getNeighbors(alice.id, 'out');
    assert.equal(neighbors.length, 1);
    assert.equal(neighbors[0].type, 'works_at');
  });

  it('AC-9 getNeighbors in', () => {
    const acme = graph.findEntityByName('Acme')!;
    const neighbors = graph.getNeighbors(acme.id, 'in');
    assert.equal(neighbors.length, 1);
  });

  it('AC-10 subgraph 2-hop', () => {
    const alice = graph.findEntityByName('Alice')!;
    const sub = graph.subgraph(alice.id, 2);
    assert.equal(sub.stats.nodeCount, 3, 'Alice + Acme + NYC');
    assert.equal(sub.stats.relationCount, 2);
    assert.equal(sub.stats.maxDepth, 2);
  });

  it('AC-11 subgraph 1-hop 只到 Acme', () => {
    const alice = graph.findEntityByName('Alice')!;
    const sub = graph.subgraph(alice.id, 1);
    assert.equal(sub.stats.nodeCount, 2, 'Alice + Acme');
  });

  it('AC-12 subgraph relationTypes 过滤', () => {
    const alice = graph.findEntityByName('Alice')!;
    const sub = graph.subgraph(alice.id, 2, ['works_at']);
    assert.equal(sub.stats.relationCount, 1, '只保留 works_at');
  });

  it('AC-13 shortestPath 存在', () => {
    const alice = graph.findEntityByName('Alice')!;
    const nyc = graph.findEntityByName('NYC')!;
    const path = graph.shortestPath(alice.id, nyc.id);
    assert.ok(path);
    assert.equal(path?.length, 2);
  });

  it('AC-14 shortestPath 不存在', () => {
    const alice = graph.findEntityByName('Alice')!;
    const fake = graph.addEntity({ type: 'Person', name: 'Stranger', properties: {}, aliases: [] });
    const path = graph.shortestPath(alice.id, fake.id);
    assert.equal(path, undefined);
  });
});

describe('KnowledgeGraph · Stats', () => {
  it('AC-15 stats 返回正确', () => {
    const graph = new KnowledgeGraph();
    graph.addEntity({ type: 'Person', name: 'Alice', properties: {}, aliases: [] });
    graph.addEntity({ type: 'Person', name: 'Bob', properties: {}, aliases: [] });
    graph.addEntity({ type: 'Company', name: 'Acme', properties: {}, aliases: [] });
    const a = graph.findEntityByName('Alice')!;
    const b = graph.findEntityByName('Bob')!;
    const c = graph.findEntityByName('Acme')!;
    graph.addRelation({ from: a.id, to: c.id, type: 'works_at', confidence: 1, properties: {} });
    graph.addRelation({ from: b.id, to: c.id, type: 'works_at', confidence: 1, properties: {} });
    const stats = graph.stats();
    assert.equal(stats.entityCount, 3);
    assert.equal(stats.relationCount, 2);
    assert.ok(stats.entityTypes.includes('Person'));
    assert.ok(stats.relationTypes.includes('works_at'));
  });
});
