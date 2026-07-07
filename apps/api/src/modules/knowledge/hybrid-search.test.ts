import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * hybrid-search.test.ts - Phase-23 T84
 * Hybrid Search (BM25 + 向量 + RRF) 单元测试
 */
import assert from 'node:assert/strict';
import {
  BM25Index,
  VectorIndex,
  HybridSearch,
  DEFAULT_BM25_CONFIG,
} from './hybrid-search';
import { embedTextV2 } from './multimodal-embedding.service';

describe('BM25Index', () => {
  it('AC-1 添加文档 → size 增加', () => {
    const idx = new BM25Index();
    idx.add({ id: 'd1', text: 'hello world' });
    assert.equal(idx.size(), 1);
  });

  it('AC-2 关键词匹配得分高', () => {
    const idx = new BM25Index();
    idx.add({ id: 'd1', text: 'apple banana cherry' });
    idx.add({ id: 'd2', text: 'orange grape' });
    const results = idx.search('apple');
    assert.equal(results[0].id, 'd1');
    assert.ok(results[0].score > results[1]?.score || results.length === 1);
  });

  it('AC-3 多个关键词', () => {
    const idx = new BM25Index();
    idx.add({ id: 'd1', text: 'mobile push notification setup' });
    idx.add({ id: 'd2', text: 'mobile offline queue' });
    const results = idx.search('mobile push');
    assert.equal(results[0].id, 'd1', 'd1 同时匹配 push');
    assert.ok(results[0].score > results[1].score);
  });

  it('AC-4 IDF: 罕见词权重高', () => {
    const idx = new BM25Index();
    idx.add({ id: 'd1', text: 'common word rare' });
    idx.add({ id: 'd2', text: 'common word other' });
    idx.add({ id: 'd3', text: 'common word another' });
    const results = idx.search('rare');
    assert.equal(results.length, 1);
    assert.equal(results[0].id, 'd1');
    assert.ok(results[0].score > 0);
  });

  it('AC-5 大小写不敏感', () => {
    const idx = new BM25Index();
    idx.add({ id: 'd1', text: 'Apple' });
    const results = idx.search('apple');
    assert.equal(results.length, 1);
  });

  it('AC-6 空查询 → 全部 0 分', () => {
    const idx = new BM25Index();
    idx.add({ id: 'd1', text: 'hello' });
    const results = idx.search('');
    assert.ok(results.every((r) => r.score === 0));
  });
});

describe('VectorIndex', () => {
  it('AC-7 添加 + 检索', () => {
    const idx = new VectorIndex();
    const v1 = embedTextV2('apple');
    const v2 = embedTextV2('orange');
    idx.add({ id: 'd1', vector: v1, metadata: {} });
    idx.add({ id: 'd2', vector: v2, metadata: {} });
    const results = idx.search(v1);
    assert.equal(results[0].id, 'd1');
    assert.ok(results[0].score > 0.99);
  });

  it('AC-8 topK 限制', () => {
    const idx = new VectorIndex();
    for (let i = 0; i < 20; i++) {
      idx.add({ id: `d${i}`, vector: embedTextV2(`doc-${i}`), metadata: {} });
    }
    const results = idx.search(embedTextV2('doc-5'), 5);
    assert.equal(results.length, 5);
  });
});

describe('HybridSearch', () => {
  let search: HybridSearch;
  beforeEach(() => {
    search = new HybridSearch({ topK: 5 });
    search.addDoc({ id: 'd1', text: 'mobile push notification setup', vector: embedTextV2('mobile push notification') });
    search.addDoc({ id: 'd2', text: 'mobile offline queue implementation', vector: embedTextV2('mobile offline queue') });
    search.addDoc({ id: 'd3', text: 'gdpr data export', vector: embedTextV2('gdpr data export') });
  });

  it('AC-9 关键词 + 语义混合检索', () => {
    const results = search.search({
      text: 'mobile push',
      vector: embedTextV2('mobile push notification'),
    });
    assert.ok(results.length > 0);
    assert.equal(results[0].id, 'd1', '应首先匹配 mobile push');
  });

  it('AC-10 BM25 单独命中', () => {
    const results = search.search({
      text: 'gdpr',
      vector: embedTextV2('data privacy compliance'),
    });
    const gdprHit = results.find((r) => r.id === 'd3');
    assert.ok(gdprHit);
  });

  it('AC-11 metadata 过滤', () => {
    search = new HybridSearch({
      topK: 5,
      metadataFilter: (m) => m.tenant === 't-A',
    });
    search.addDoc({ id: 'd1', text: 'foo', vector: embedTextV2('foo'), metadata: { tenant: 't-A' } });
    search.addDoc({ id: 'd2', text: 'foo', vector: embedTextV2('foo'), metadata: { tenant: 't-B' } });
    const results = search.search({ text: 'foo', vector: embedTextV2('foo') });
    assert.equal(results.length, 1);
    assert.equal(results[0].id, 'd1');
  });

  it('AC-12 RRF 合并:BM25 + 向量各贡献', () => {
    const results = search.search({
      text: 'mobile',
      vector: embedTextV2('mobile push'),
    });
    const d1 = results.find((r) => r.id === 'd1');
    assert.ok(d1);
    assert.ok(d1.sources.bm25 !== undefined);
    assert.ok(d1.sources.vector !== undefined);
  });

  it('AC-13 权重配置生效', () => {
    const searchBm25 = new HybridSearch({ topK: 3, bm25Weight: 1, vectorWeight: 0 });
    const searchVec = new HybridSearch({ topK: 3, bm25Weight: 0, vectorWeight: 1 });
    searchBm25.addDoc({ id: 'd1', text: 'apple banana', vector: embedTextV2('apple') });
    searchBm25.addDoc({ id: 'd2', text: 'orange grape', vector: embedTextV2('orange') });
    searchVec.addDoc({ id: 'd1', text: 'apple banana', vector: embedTextV2('apple') });
    searchVec.addDoc({ id: 'd2', text: 'orange grape', vector: embedTextV2('orange') });
    const bm25Results = searchBm25.search({ text: 'apple', vector: embedTextV2('orange') });
    const vecResults = searchVec.search({ text: 'apple', vector: embedTextV2('orange') });
    assert.equal(bm25Results[0].id, 'd1', '纯 BM25 应优先 apple');
    assert.equal(vecResults[0].id, 'd2', '纯向量应优先 orange');
  });

  it('AC-14 size 报告', () => {
    const size = search.size();
    assert.equal(size.bm25, 3);
    assert.equal(size.vector, 3);
  });
});

describe('DEFAULT_BM25_CONFIG', () => {
  it('AC-15 默认 k1=1.5, b=0.75', () => {
    assert.equal(DEFAULT_BM25_CONFIG.k1, 1.5);
    assert.equal(DEFAULT_BM25_CONFIG.b, 0.75);
  });
});
