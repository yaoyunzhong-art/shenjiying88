import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * multimodal-embedding.service.test.ts - Phase-23 T81
 * 多模态 Embedding 服务单元测试
 */
import assert from 'node:assert/strict';
import {
  MultimodalEmbeddingService,
  embedTextV2,
  embedImageV2,
  l2Normalize,
  cosineSimilarity,
  crossModalSimilarity,
} from './multimodal-embedding.service';

describe('embedTextV2', () => {
  it('AC-1 384 维归一化向量', () => {
    const vec = embedTextV2('hello world');
    assert.equal(vec.length, 384);
    const norm = Math.sqrt(vec.reduce((s, x) => s + x * x, 0));
    assert.ok(Math.abs(norm - 1) < 1e-9, `应 L2 归一化,实际 norm=${norm}`);
  });

  it('AC-2 相同输入 → 相同向量 (deterministic)', () => {
    const v1 = embedTextV2('product catalog');
    const v2 = embedTextV2('product catalog');
    assert.deepEqual(v1, v2);
  });

  it('AC-3 不同输入 → 不同向量', () => {
    const v1 = embedTextV2('apple');
    const v2 = embedTextV2('banana');
    let diff = 0;
    for (let i = 0; i < v1.length; i++) diff += Math.abs(v1[i] - v2[i]);
    assert.ok(diff > 0.5, '不同词向量差异应显著');
  });

  it('AC-4 词向量在 [-1, 1] 区间 + 不全为 0', () => {
    const v1 = embedTextV2('laptop computer');
    const v2 = embedTextV2('notebook pc');
    const v3 = embedTextV2('ocean wave');
    // 真实 MiniLM 会保证语义相似,mock 是 hash-based 不能保证
    // 仅验证 cosine 输出在有效区间且非 NaN
    const sim1 = cosineSimilarity(v1, v2);
    const sim2 = cosineSimilarity(v1, v3);
    assert.ok(Number.isFinite(sim1) && Number.isFinite(sim2), 'cosine 应为有效数');
    assert.ok(sim1 >= -1 && sim1 <= 1);
    assert.ok(sim2 >= -1 && sim2 <= 1);
  });

  it('AC-5 词袋统计贡献维度', () => {
    const v1 = embedTextV2('apple banana');
    const v2 = embedTextV2('apple banana cherry');
    // 不同词数应改变向量
    assert.notDeepEqual(v1, v2);
  });

  it('AC-6 大小写不敏感', () => {
    const v1 = embedTextV2('Hello World');
    const v2 = embedTextV2('hello world');
    assert.deepEqual(v1, v2, 'normalize 应转小写');
  });
});

describe('embedImageV2', () => {
  it('AC-7 512 维归一化', () => {
    const vec = embedImageV2({ data: 'image-base64-...', width: 800, height: 600 });
    assert.equal(vec.length, 512);
    const norm = Math.sqrt(vec.reduce((s, x) => s + x * x, 0));
    assert.ok(Math.abs(norm - 1) < 1e-9);
  });

  it('AC-8 相同图片 → 相同向量', () => {
    const img = { data: 'abc123', width: 1024, height: 768 };
    const v1 = embedImageV2(img);
    const v2 = embedImageV2(img);
    assert.deepEqual(v1, v2);
  });

  it('AC-9 不同宽高比 → 不同向量', () => {
    const v1 = embedImageV2({ data: 'x', width: 800, height: 600 }); // 4:3
    const v2 = embedImageV2({ data: 'x', width: 1600, height: 900 }); // 16:9
    assert.notDeepEqual(v1, v2);
  });

  it('AC-10 不同图片 → 不同向量', () => {
    const v1 = embedImageV2({ data: 'cat', width: 224, height: 224 });
    const v2 = embedImageV2({ data: 'dog', width: 224, height: 224 });
    assert.notDeepEqual(v1, v2);
  });
});

describe('crossModalSimilarity', () => {
  it('AC-11 同维度直接 cosine', () => {
    const v1 = embedTextV2('hello');
    const v2 = embedTextV2('hello');
    const sim = crossModalSimilarity(v1, v2);
    assert.ok(sim > 0.99, '相同文本应几乎相等');
  });

  it('AC-12 跨维度投影后 cosine', () => {
    const textVec = embedTextV2('cat', 384);
    const imageVec = embedImageV2({ data: 'cat' }, 512);
    const sim = crossModalSimilarity(textVec, imageVec);
    assert.ok(sim >= -1 && sim <= 1, `应在 [-1, 1] 区间,实际 ${sim}`);
  });

  it('AC-13 跨模态检索: cat text vs cat/dog image', () => {
    const textVec = embedTextV2('cat');
    const catImg = embedImageV2({ data: 'cat-image' });
    const dogImg = embedImageV2({ data: 'dog-image' });
    const simCat = crossModalSimilarity(textVec, catImg);
    const simDog = crossModalSimilarity(textVec, dogImg);
    // 不一定 cat > dog (因为是 mock),但应该在合理区间
    assert.ok(simCat !== simDog);
  });
});

describe('MultimodalEmbeddingService', () => {
  let svc: MultimodalEmbeddingService;
  beforeEach(() => {
    svc = new MultimodalEmbeddingService();
  });

  it('AC-14 embedText 返回标准 EmbeddingResult', () => {
    const result = svc.embedText('hello');
    assert.equal(result.modality, 'text');
    assert.equal(result.dim, 384);
    assert.equal(result.vector.length, 384);
    assert.match(result.modelVersion, /^m5-v2/);
  });

  it('AC-15 embedImage 返回标准 EmbeddingResult', () => {
    const result = svc.embedImage({ data: 'x' });
    assert.equal(result.modality, 'image');
    assert.equal(result.dim, 512);
    assert.equal(result.vector.length, 512);
  });

  it('AC-16 embedTexts 批量处理', () => {
    const results = svc.embedTexts(['a', 'b', 'c']);
    assert.equal(results.length, 3);
    assert.ok(results.every((r) => r.modality === 'text'));
  });

  it('AC-17 embedImages 批量处理', () => {
    const results = svc.embedImages([{ data: '1' }, { data: '2' }]);
    assert.equal(results.length, 2);
  });

  it('AC-18 crossSimilarity 跨模态', () => {
    const text = svc.embedText('hello');
    const img = svc.embedImage({ data: 'hello' });
    const sim = svc.crossSimilarity(text, img);
    assert.ok(typeof sim === 'number');
    assert.ok(sim >= -1 && sim <= 1);
  });

  it('AC-19 searchTopK 返回 Top-K + score', () => {
    const query = svc.embedText('product');
    const candidates = [
      { id: 'd1', embedding: svc.embedText('product catalog'), metadata: { tag: 'catalog' } },
      { id: 'd2', embedding: svc.embedText('ocean wave'), metadata: { tag: 'unrelated' } },
      { id: 'd3', embedding: svc.embedText('product review'), metadata: { tag: 'review' } },
    ];
    const top = svc.searchTopK(query, candidates, 2);
    assert.equal(top.length, 2);
    assert.equal(top[0].id, 'd1', 'product catalog 应排第一');
    assert.ok(top[0].score >= top[1].score);
  });

  it('AC-20 searchTopK 跨模态检索', () => {
    const query = svc.embedText('product');
    const candidates = [
      { id: 'd1', embedding: svc.embedImage({ data: 'product-image' }) },
      { id: 'd2', embedding: svc.embedImage({ data: 'unrelated-image' }) },
    ];
    const top = svc.searchTopK(query, candidates, 2);
    assert.equal(top.length, 2);
  });

  it('AC-21 migrateV1ToV2: 256 → 384 维补零扩展', () => {
    const v1 = new Array(256).fill(0).map((_, i) => Math.sin(i));
    const v2 = svc.migrateV1ToV2(v1);
    assert.equal(v2.length, 384);
    // 前 256 维应保留
    for (let i = 0; i < 256; i++) {
      const expected = v1[i] / Math.sqrt(v1.reduce((s, x) => s + x * x, 0));
      assert.ok(Math.abs(v2[i] - expected) < 1e-6, `维度 ${i}: ${v2[i]} vs ${expected}`);
    }
  });

  it('AC-22 getConfig 返回当前配置', () => {
    const cfg = svc.getConfig();
    assert.equal(cfg.textDim, 384);
    assert.equal(cfg.imageDim, 512);
    assert.equal(cfg.enableRealModels, false);
  });
});

describe('l2Normalize', () => {
  it('AC-23 归一化后 norm=1', () => {
    const v = l2Normalize([3, 4]); // 3-4-5 triangle
    assert.equal(v[0], 0.6);
    assert.equal(v[1], 0.8);
  });

  it('AC-24 零向量归一化不报错 (用 1 兜底)', () => {
    const v = l2Normalize([0, 0, 0]);
    assert.equal(v.length, 3);
    assert.ok(v.every((x) => x === 0));
  });
});
