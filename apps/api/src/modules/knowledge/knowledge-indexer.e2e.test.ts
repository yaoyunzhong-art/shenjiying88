import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
import { KnowledgeIndexerService } from './knowledge-indexer.service';

describe('KnowledgeIndexerService · Phase-18 T23', () => {
  let service: KnowledgeIndexerService;

  beforeEach(() => {
    service = new KnowledgeIndexerService();
  });

  // AC-1: markdown 按标题切分
  it('AC-1 chunkDocument splits by markdown headers', () => {
    const chunks = service.chunkDocument({
      sourcePath: '.trae/specs/phase-17/test.md',
      content: `# Phase-17 Test
Some intro paragraph.

## Section A
Content for section A.

## Section B
Content for section B.
Another paragraph for B.`,
      kind: 'spec',
    });
    expect(chunks.length).toBeGreaterThanOrEqual(3);
    expect(chunks[0].metadata.title).toBe('Phase-17 Test');
    expect(chunks[0].metadata.kind).toBe('spec');
    const sections = chunks.map((c) => c.metadata.section).filter(Boolean);
    expect(sections).toContain('Section A');
    expect(sections).toContain('Section B');
  });

  // AC-2: 短段落合并 + chunk token 上限 512
  it('AC-2 short paragraphs merged + max 512 tokens', () => {
    const chunks = service.chunkDocument({
      sourcePath: 'a.md',
      content: `# Doc
Long paragraph one. '.repeat(200)}

Long paragraph two with lots of content.

Long paragraph three. '.repeat(150)}`,
      kind: 'doc',
    });
    expect(chunks.length).toBeGreaterThanOrEqual(2);
    for (const c of chunks) {
      expect(c.tokenCount).toBeLessThanOrEqual(512);
    }
  });

  // AC-3: embedding 维度 + 归一化 (norm ≈ 1)
  it('AC-3 embedding dimension + normalization', () => {
    const vec = service.embed('hello world');
    expect(vec.length).toBe(256);
    const norm = Math.sqrt(vec.reduce((s, x) => s + x * x, 0));
    expect(norm).toBeCloseTo(1, 3);
    // 同样输入 → 同样输出 (deterministic)
    const vec2 = service.embed('hello world');
    expect(vec).toEqual(vec2);
  });

  // AC-4: indexDocument + query 语义搜索
  it('AC-4 indexDocument + query semantic search', () => {
    service.indexDocument({
      sourcePath: '.trae/lessons/phase-17.md',
      content: `# Phase-17 Lessons
## Anti-patterns
quota-double-increment bug found in coupon service.
Reserve already incremented, business code increment again causing double count.

## Patterns
Three-level referral chain lookup pattern for viral growth.
Ancestor chain lookup avoiding child traversal.`,
      kind: 'lesson',
    });
    service.indexDocument({
      sourcePath: '.trae/specs/phase-17/spec.md',
      content: `# Phase-17 Spec
Cross-store coupon redemption flow with quota tracking.
Tenant quota check before business execution.`,
      kind: 'spec',
    });

    // 查询:与已索引文档高度相关的词
    const response = service.query({
      query: 'quota double increment bug',
      topK: 3,
    });
    expect(response.results.length).toBeGreaterThan(0);
    expect(response.results[0].score).toBeGreaterThan(0);
    expect(response.totalCandidates).toBeGreaterThan(0);

    // kindFilter
    const lessonsOnly = service.query({
      query: 'referral',
      topK: 5,
      kindFilter: 'lesson',
    });
    expect(lessonsOnly.results.every((r) => r.chunk.metadata.kind === 'lesson')).toBe(true);
  });

  // AC-5: 统计聚合 (totalDocuments / totalChunks / byKind)
  it('AC-5 getStats aggregation', () => {
    service.indexDocument({
      sourcePath: 'a.md',
      content: '# Doc A\n\nThis is a lesson about quota double increment.\n\nSecond paragraph about reserve and increment.',
      kind: 'lesson',
    });
    service.indexDocument({
      sourcePath: 'b.md',
      content: '# Doc B\n\nA pattern for three-level chain lookup.\n\nSecond paragraph about ancestor chain.',
      kind: 'pattern',
    });
    service.indexDocument({
      sourcePath: 'c.md',
      content: '# Doc C\n\nAnother pattern about tenant isolation.\n\nSecond pattern about missing tenantId.',
      kind: 'pattern',
    });
    const stats = service.getStats();
    expect(stats.totalDocuments).toBe(3);
    expect(stats.totalChunks).toBeGreaterThanOrEqual(3);
    expect(stats.byKind['lesson']).toBeGreaterThanOrEqual(1);
    expect(stats.byKind['pattern']).toBeGreaterThanOrEqual(2);
    expect(stats.averageChunkSize).toBeGreaterThan(0);
  });
});
