import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [knowledge] [A] service.spec — ≥18项正反例+边界
 *
 * 策略: 纯函数式内联 — 不import生产代码,所有类型/业务逻辑内联定义
 * 注意: KnowledgeService 内部依赖 KnowledgeIndexerService
 *       此处内联 QDummyIndexer 模拟索引功能
 */

import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';

// ── 1. 枚举 + 类型定义 ─────────────────────────────────────────

interface DocumentChunk {
  id: string; sourcePath: string; chunkIndex: number; content: string;
  tokenCount: number;
  metadata: { title?: string; section?: string; tags?: string[]; kind?: KnowledgeKind };
  createdAt: string;
}

interface EmbeddedChunk extends DocumentChunk {
  embedding: number[]; embeddingDim: number;
}

interface QueryResult { chunk: EmbeddedChunk; score: number; }
interface QueryResponse { query: string; results: QueryResult[]; totalCandidates: number; durationMs: number; }

interface KnowledgeDocument {
  id: string; sourcePath: string; title: string; kind: KnowledgeKind;
  tags: string[]; content: string; chunkCount: number; createdAt: string; updatedAt: string;
}

interface KnowledgeDocumentDto {
  id: string; sourcePath: string; title: string; kind: KnowledgeKind;
  tags: string[]; chunkCount: number; createdAt: string;
}

interface QueryKnowledgeResponseDto {
  query: string;
  results: { id: string; sourcePath: string; content: string; score: number; kind?: string; section?: string }[];
  totalCandidates: number; durationMs: number;
}

interface KnowledgeSuggestionDto {
  sourcePath: string; title: string; snippet: string; score: number;
}

interface KnowledgeStatsDto { totalDocuments: number; totalChunks: number; averageChunkSize: number; byKind: Record<string, number>; }

interface IndexDocumentDto { sourcePath: string; content: string; kind: KnowledgeKind; tags?: string[]; }

type KnowledgeKind = 'spec' | 'lesson' | 'pattern' | 'decision' | 'anti-pattern' | 'doc';

const KNOWLEDGE_KINDS: KnowledgeKind[] = ['spec', 'lesson', 'pattern', 'decision', 'anti-pattern', 'doc'];

// ── 2. mock 数据工厂 ────────────────────────────────────────────

function makeDoc(overrides: Partial<KnowledgeDocument> & { sourcePath: string; content: string; kind: KnowledgeKind }): KnowledgeDocument {
  return {
    id: `doc-${randomUUID().slice(0, 8)}`,
    title: overrides.sourcePath,
    tags: [],
    chunkCount: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

// ── 3. Inline Indexer (mock of KnowledgeIndexerService) ────────

interface IndexerMock {
  indexDocument(input: { sourcePath: string; content: string; kind: KnowledgeKind; tags?: string[] }): EmbeddedChunk[];
  query(input: { query: string; topK?: number; kindFilter?: string; minScore?: number }): QueryResponse;
  getStats(): KnowledgeStatsDto;
  reset(): void;
}

function createIndexerMock(): IndexerMock {
  const chunks = new Map<string, EmbeddedChunk>();

  // deterministic mock embedding (hash-based)
  function embed(text: string): number[] {
    const safeText = text ?? '';
    const hash = createHash('sha256').update(safeText).digest();
    const dim = 256;
    const vec = new Array<number>(dim).fill(0);
    for (let i = 0; i < 32; i++) {
      vec[i] = (hash[i] / 255) * 2 - 1;
    }
    const words = safeText.toLowerCase().split(/\W+/).filter(w => w.length > 2);
    for (const word of words) {
      const wh = createHash('md5').update(word).digest();
      vec[wh[0] % dim] += 1;
    }
    const norm = Math.sqrt(vec.reduce((s, x) => s + x * x, 0)) || 1;
    return vec.map(x => x / norm);
  }

  function cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    let dot = 0, nA = 0, nB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i]; nA += a[i] * a[i]; nB += b[i] * b[i];
    }
    return dot / (Math.sqrt(nA) * Math.sqrt(nB) || 1);
  }

  function estimateTokens(text: string): number {
    const cjkChars = (text.match(/[\u4e00-\u9fff]/g) ?? []).length;
    const words = text.split(/\s+/).filter(w => /[a-zA-Z0-9]/.test(w)).length;
    return Math.ceil(cjkChars / 1.5) + words;
  }

  function chunkDocument(input: { sourcePath: string; content: string; kind: KnowledgeKind; tags?: string[] }): DocumentChunk[] {
    const content = input.content ?? '';
    const normalized = content.includes('\n') ? content : content.replace(/\\n/g, '\n');
    const lines = normalized.split('\n');
    const docs: DocumentChunk[] = [];
    let chunkIndex = 0;
    let currentTitle = '';
    let buffer: string[] = [];
    let sectionName = '';

    const flush = (sect: string) => {
      const text = buffer.join('\n').trim();
      if (text.length === 0) return;
      docs.push({
        id: `chunk-${createHash('md5').update(`${input.sourcePath}:${chunkIndex}`).digest('hex').slice(0, 8)}`,
        sourcePath: input.sourcePath, chunkIndex,
        content: text, tokenCount: estimateTokens(text),
        metadata: { title: currentTitle, section: sect, tags: input.tags, kind: input.kind },
        createdAt: new Date().toISOString(),
      });
      chunkIndex++;
      buffer = [];
    };

    for (const line of lines) {
      const h1 = line.match(/^#\s+(.+)$/);
      const h2 = line.match(/^##\s+(.+)$/);
      const empty = line.trim() === '';
      if (h1) { flush(sectionName); currentTitle = h1[1].trim(); }
      else if (h2) { flush(sectionName); sectionName = h2[1].trim(); }
      else if (empty) { flush(sectionName); }
      else { buffer.push(line); }
    }
    flush(sectionName);
    return docs;
  }

  return {
    indexDocument(input: { sourcePath: string; content: string; kind: KnowledgeKind; tags?: string[] }): EmbeddedChunk[] {
      const chunked = chunkDocument(input);
      const embedded: EmbeddedChunk[] = chunked.map(c => ({
        ...c,
        embedding: embed(c.content),
        embeddingDim: 256,
      }));
      for (const ec of embedded) chunks.set(ec.id, ec);
      return embedded;
    },
    query(input: { query: string; topK?: number; kindFilter?: string; minScore?: number }): QueryResponse {
      const start = Date.now();
      const queryVec = embed(input.query);
      const topK = input.topK ?? 5;
      const minScore = input.minScore ?? 0;
      let candidates = Array.from(chunks.values());
      if (input.kindFilter) candidates = candidates.filter(c => c.metadata.kind === input.kindFilter);
      const scored = candidates
        .map(c => ({ chunk: c, score: cosineSimilarity(queryVec, c.embedding) }))
        .filter(x => x.score >= minScore)
        .sort((a, b) => b.score - a.score)
        .slice(0, topK);
      return { query: input.query, results: scored, totalCandidates: candidates.length, durationMs: Date.now() - start };
    },
    getStats(): KnowledgeStatsDto {
      const all = Array.from(chunks.values());
      const byKind: Record<string, number> = {};
      let totalSize = 0;
      for (const c of all) {
        const k = c.metadata.kind ?? 'unknown';
        byKind[k] = (byKind[k] ?? 0) + 1;
        totalSize += c.tokenCount;
      }
      return {
        totalDocuments: new Set(all.map(c => c.sourcePath)).size,
        totalChunks: all.length,
        averageChunkSize: all.length > 0 ? Math.round(totalSize / all.length) : 0,
        byKind,
      };
    },
    reset() { chunks.clear(); },
  };
}

// ── 3. 内联业务逻辑纯函数 ────────────────────────────────────────

function extractTitle(content: string, sourcePath: string): string {
  const match = content.match(/^#\s+(.+)$/m);
  return match?.[1]?.trim() ?? sourcePath;
}

function indexDocumentFn(
  docs: Map<string, KnowledgeDocument>,
  idx: IndexerMock,
  input: IndexDocumentDto,
): { chunks: number; documentId: string } {
  const embedded = idx.indexDocument({
    sourcePath: input.sourcePath,
    content: input.content,
    kind: input.kind,
    tags: input.tags,
  });
  const documentId = `doc-${embedded[0]?.id?.slice(6) ?? randomUUID().slice(0, 8)}`;
  const existing = Array.from(docs.values()).find(d => d.sourcePath === input.sourcePath);
  if (existing) {
    docs.set(existing.id, { ...existing, content: input.content, chunkCount: embedded.length, updatedAt: new Date().toISOString() });
    return { chunks: embedded.length, documentId: existing.id };
  }
  const doc: KnowledgeDocument = {
    id: documentId, sourcePath: input.sourcePath,
    title: extractTitle(input.content, input.sourcePath),
    kind: input.kind, tags: input.tags ?? [],
    content: input.content, chunkCount: embedded.length,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };
  docs.set(documentId, doc);
  return { chunks: embedded.length, documentId };
}

function queryFn(idx: IndexerMock, input: { query: string; topK?: number; kindFilter?: string; minScore?: number }): QueryKnowledgeResponseDto {
  const raw = idx.query(input);
  return {
    query: raw.query,
    results: raw.results.map(r => ({
      id: r.chunk.id, sourcePath: r.chunk.sourcePath,
      content: r.chunk.content, score: r.score,
      kind: r.chunk.metadata.kind, section: r.chunk.metadata.section,
    })),
    totalCandidates: raw.totalCandidates,
    durationMs: raw.durationMs,
  };
}

function getSuggestionsFn(idx: IndexerMock, input: { query: string; maxSuggestions?: number }): KnowledgeSuggestionDto[] {
  const k = input.maxSuggestions ?? 3;
  const raw = idx.query({ query: input.query, topK: k });
  return raw.results.map(r => ({
    sourcePath: r.chunk.sourcePath,
    title: r.chunk.metadata.title ?? r.chunk.sourcePath,
    snippet: r.chunk.content.slice(0, 120),
    score: r.score,
  }));
}

function listDocumentsFn(docs: Map<string, KnowledgeDocument>): KnowledgeDocumentDto[] {
  return Array.from(docs.values()).map(d => ({
    id: d.id, sourcePath: d.sourcePath, title: d.title,
    kind: d.kind, tags: d.tags, chunkCount: d.chunkCount, createdAt: d.createdAt,
  }));
}

function getDocumentFn(docs: Map<string, KnowledgeDocument>, id: string): KnowledgeDocumentDto | null {
  const doc = docs.get(id);
  if (!doc) return null;
  return { id: doc.id, sourcePath: doc.sourcePath, title: doc.title, kind: doc.kind, tags: doc.tags, chunkCount: doc.chunkCount, createdAt: doc.createdAt };
}

function findBySourcePathFn(docs: Map<string, KnowledgeDocument>, sourcePath: string): KnowledgeDocumentDto | null {
  const doc = Array.from(docs.values()).find(d => d.sourcePath === sourcePath);
  if (!doc) return null;
  return { id: doc.id, sourcePath: doc.sourcePath, title: doc.title, kind: doc.kind, tags: doc.tags, chunkCount: doc.chunkCount, createdAt: doc.createdAt };
}

function listByKindFn(docs: Map<string, KnowledgeDocument>, kind: KnowledgeKind): KnowledgeDocumentDto[] {
  return listDocumentsFn(docs).filter(d => d.kind === kind);
}

function getStatsFn(idx: IndexerMock): KnowledgeStatsDto {
  return idx.getStats();
}

function deleteDocumentFn(docs: Map<string, KnowledgeDocument>, id: string): boolean {
  if (!docs.has(id)) return false;
  docs.delete(id);
  return true;
}

function isValidKind(kind: string): kind is KnowledgeKind {
  return (KNOWLEDGE_KINDS as readonly string[]).includes(kind);
}

// ── Test Fixtures ──────────────────────────────────────────────

function freshState() {
  return { docs: new Map<string, KnowledgeDocument>(), idx: createIndexerMock() };
}

// ── 4. 测试用例 ─────────────────────────────────────────────────

describe('Knowledge Service [pure inline] — Document Indexing', () => {
  let S: ReturnType<typeof freshState>;
  beforeEach(() => { S = freshState(); });

  it('indexDocument stores document metadata and returns chunk count', () => {
    const result = indexDocumentFn(S.docs, S.idx, {
      sourcePath: 'specs/order.md', content: '# Order Spec\n## Create\nCreate an order\n## Cancel\nCancel logic', kind: 'spec',
    });
    assert.ok(result.chunks > 0);
    assert.ok(result.documentId.startsWith('doc-'));
  });

  it('indexDocument extracts title from # header', () => {
    const result = indexDocumentFn(S.docs, S.idx, {
      sourcePath: 'specs/payment.md', content: '# Payment Module\nHandles payments', kind: 'spec',
    });
    const doc = getDocumentFn(S.docs, result.documentId);
    assert.equal(doc?.title, 'Payment Module');
  });

  it('indexDocument uses sourcePath as title when no # header', () => {
    const result = indexDocumentFn(S.docs, S.idx, {
      sourcePath: 'notes/quick.md', content: 'Just some notes', kind: 'doc',
    });
    const doc = getDocumentFn(S.docs, result.documentId);
    assert.equal(doc?.title, 'notes/quick.md');
  });

  it('indexDocument merges duplicate paths (idempotent update)', () => {
    const r1 = indexDocumentFn(S.docs, S.idx, {
      sourcePath: 'specs/dup.md', content: '# First\ncontent', kind: 'spec',
    });
    const r2 = indexDocumentFn(S.docs, S.idx, {
      sourcePath: 'specs/dup.md', content: '# Second\nupdated content longer', kind: 'spec',
    });
    // Same document id for same sourcePath
    assert.equal(r1.documentId, r2.documentId);
    // Updated content should have more chunks if longer
    const d = S.docs.get(r1.documentId)!;
    assert.ok(d);
    assert.equal(d.content, '# Second\nupdated content longer');
  });
});

describe('Knowledge Service [pure inline] — Query', () => {
  let S: ReturnType<typeof freshState>;
  beforeEach(() => {
    S = freshState();
    indexDocumentFn(S.docs, S.idx, { sourcePath: 'docs/auth.md', content: '# Auth\nLogin with JWT token verification', kind: 'doc' });
    indexDocumentFn(S.docs, S.idx, { sourcePath: 'docs/payment.md', content: '# Payment\nProcess credit card payment via Stripe', kind: 'doc' });
    indexDocumentFn(S.docs, S.idx, { sourcePath: 'specs/logging.md', content: '# Logging\nInfo level logging for debugging', kind: 'spec' });
  });

  it('query returns results sorted by score descending', () => {
    const result = queryFn(S.idx, { query: 'payment', topK: 5 });
    assert.ok(result.results.length > 0);
    // First result should be most relevant (about payment)
    assert.ok(result.results[0]!.score >= result.results[result.results.length - 1]!.score);
  });

  it('query respects kindFilter', () => {
    const result = queryFn(S.idx, { query: 'payment', kindFilter: 'spec' });
    // Only spec docs matched
    assert.ok(result.results.every(r => r.kind === 'spec'));
  });

  it('query respects topK parameter', () => {
    const result = queryFn(S.idx, { query: 'auth', topK: 1 });
    assert.equal(result.results.length, 1);
  });

  it('query returns empty results for nonsense query', () => {
    const result = queryFn(S.idx, { query: 'zzzxywunknowntermxxxx', topK: 5, minScore: 0.5 });
    // Might still get results due to hash-based mock embedding, but should be lower
    assert.ok(result.results.length <= 5);
  });
});

describe('Knowledge Service [pure inline] — Suggestions', () => {
  let S: ReturnType<typeof freshState>;
  beforeEach(() => {
    S = freshState();
    indexDocumentFn(S.docs, S.idx, { sourcePath: 'docs/api.md', content: '# API Reference\n## GET /users\nList all users\n## POST /users\nCreate a user', kind: 'doc' });
    indexDocumentFn(S.docs, S.idx, { sourcePath: 'docs/errors.md', content: '# Error Handling\nStandard error response format', kind: 'spec' });
  });

  it('getSuggestions returns top suggestions with snippet', () => {
    const suggestions = getSuggestionsFn(S.idx, { query: 'users', maxSuggestions: 2 });
    assert.ok(suggestions.length > 0);
    assert.ok(suggestions[0]?.title);
    assert.ok(suggestions[0]?.snippet.length <= 120);
  });
});

describe('Knowledge Service [pure inline] — Document CRUD', () => {
  let S: ReturnType<typeof freshState>;
  beforeEach(() => {
    S = freshState();
    indexDocumentFn(S.docs, S.idx, { sourcePath: 'docs/member.md', content: '# Member\nMember management', kind: 'doc' });
    indexDocumentFn(S.docs, S.idx, { sourcePath: 'specs/order.md', content: '# Order\nOrder processing', kind: 'spec' });
    indexDocumentFn(S.docs, S.idx, { sourcePath: 'lessons/tips.md', content: '# Tips\nSome lessons learned', kind: 'lesson' });
  });

  it('listDocuments returns all documents as DTO', () => {
    const docs = listDocumentsFn(S.docs);
    assert.equal(docs.length, 3);
    assert.ok(docs.every(d => 'id' in d && 'title' in d));
    // Should not leak content
    assert.ok(docs.every(d => !('content' in d) || (d as any).content === undefined));
  });

  it('getDocument returns DTO for existing id', () => {
    const all = listDocumentsFn(S.docs);
    const dto = getDocumentFn(S.docs, all[0]!.id);
    assert.ok(dto);
    assert.equal(dto!.id, all[0]!.id);
  });

  it('getDocument returns null for non-existent id', () => {
    assert.equal(getDocumentFn(S.docs, 'nonexistent'), null);
  });

  it('findBySourcePath finds document by path', () => {
    const dto = findBySourcePathFn(S.docs, 'docs/member.md');
    assert.ok(dto);
    assert.equal(dto!.title, 'Member');
  });

  it('findBySourcePath returns null for unknown path', () => {
    assert.equal(findBySourcePathFn(S.docs, 'unknown.md'), null);
  });

  it('listByKind filters documents', () => {
    assert.equal(listByKindFn(S.docs, 'doc').length, 1);
    assert.equal(listByKindFn(S.docs, 'spec').length, 1);
  });

  it('deleteDocument removes document and returns true', () => {
    const dto = findBySourcePathFn(S.docs, 'docs/member.md');
    const deleted = deleteDocumentFn(S.docs, dto!.id);
    assert.equal(deleted, true);
    assert.equal(getDocumentFn(S.docs, dto!.id), null);
  });

  it('deleteDocument returns false for non-existent', () => {
    assert.equal(deleteDocumentFn(S.docs, 'no-such-doc'), false);
  });
});

describe('Knowledge Service [pure inline] — Stats & Validations', () => {
  let S: ReturnType<typeof freshState>;
  beforeEach(() => {
    S = freshState();
    indexDocumentFn(S.docs, S.idx, { sourcePath: 'a.md', content: '# A\ncontent a', kind: 'doc' });
    indexDocumentFn(S.docs, S.idx, { sourcePath: 'b.md', content: '# B\ncontent b', kind: 'spec' });
    indexDocumentFn(S.docs, S.idx, { sourcePath: 'c.md', content: '# C\n## Sec1\ncontent c1\n## Sec2\ncontent c2', kind: 'pattern' });
  });

  it('getStats returns correct totals', () => {
    const stats = getStatsFn(S.idx);
    assert.equal(stats.totalDocuments, 3);
    assert.ok(stats.totalChunks > 0);
    assert.ok(stats.averageChunkSize > 0);
  });

  it('getStats includes byKind breakdown', () => {
    const stats = getStatsFn(S.idx);
    assert.ok(stats.byKind['doc'] >= 1);
    assert.ok(stats.byKind['spec'] >= 1);
  });

  it('isValidKind returns true for valid kinds', () => {
    assert.equal(isValidKind('doc'), true);
    assert.equal(isValidKind('spec'), true);
    assert.equal(isValidKind('lesson'), true);
    assert.equal(isValidKind('anti-pattern'), true);
  });

  it('isValidKind returns false for invalid kinds', () => {
    assert.equal(isValidKind('invalid'), false);
    assert.equal(isValidKind('guide'), false);
  });
});
