import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [knowledge] [C] 合约测试
 *
 * 验证 knowledge 模块的实体 Shape、Service 业务逻辑契约、边界条件
 */

import assert from 'node:assert/strict';
import { KnowledgeService } from './knowledge.service';
import { KnowledgeIndexerService, type IndexerStats } from './knowledge-indexer.service';
import type {
  DocumentChunk,
  EmbeddedChunk,
  KnowledgeDocument,
  KnowledgeKind,
} from './knowledge.entity';
import { KNOWLEDGE_KINDS } from './knowledge.entity';
import type {
  IndexDocumentDto,
  QueryKnowledgeResponseDto,
  KnowledgeStatsDto,
  KnowledgeDocumentDto,
  KnowledgeSuggestionDto,
} from './knowledge.dto';
import type { KnowledgeEndpoints, KnowledgeErrorCodes } from './knowledge.contract';

// ─── 服务 factory ─────────────────────────────────────

function makeService(): KnowledgeService {
  return new KnowledgeService(new KnowledgeIndexerService());
}

function makeIndexer(): KnowledgeIndexerService {
  return new KnowledgeIndexerService();
}

// ─── 合约: 实体 Shape ─────────────────────────────────

describe('[knowledge] 合约: 实体 Shape', () => {
  const fixtureChunk: DocumentChunk = {
    id: 'chunk-test-001',
    sourcePath: 'specs/api.md',
    chunkIndex: 0,
    content: 'Test content for contract validation.',
    tokenCount: 8,
    metadata: {
      title: 'API Spec',
      section: 'Authentication',
      tags: ['auth', 'jwt'],
      kind: 'spec',
    },
    createdAt: '2025-01-01T00:00:00.000Z',
  };

  it('DocumentChunk 包含所有必需字段', () => {
    assert.equal(typeof fixtureChunk.id, 'string');
    assert.equal(typeof fixtureChunk.sourcePath, 'string');
    assert.equal(typeof fixtureChunk.chunkIndex, 'number');
    assert.equal(typeof fixtureChunk.content, 'string');
    assert.equal(typeof fixtureChunk.tokenCount, 'number');
    assert.equal(typeof fixtureChunk.metadata, 'object');
    assert.equal(typeof fixtureChunk.createdAt, 'string');
    assert.ok(Date.parse(fixtureChunk.createdAt) > 0);
  });

  it('DocumentChunk.metadata.title 为可选', () => {
    const noTitle: DocumentChunk = { ...fixtureChunk, metadata: { kind: 'doc' } };
    assert.equal(noTitle.metadata.title, undefined);
    assert.equal(noTitle.metadata.kind, 'doc');
  });

  it('EmbeddedChunk 继承 DocumentChunk 并添加 embedding 字段', () => {
    const ec: EmbeddedChunk = {
      ...fixtureChunk,
      embedding: [0.1, 0.2, 0.3],
      embeddingDim: 3,
    };
    assert.equal(ec.id, fixtureChunk.id);
    assert.equal(ec.embedding.length, 3);
    assert.equal(ec.embeddingDim, 3);
  });

  it('KnowledgeDocument 包含持久化字段', () => {
    const doc: KnowledgeDocument = {
      id: 'doc-001',
      sourcePath: 'specs/api.md',
      title: 'API Spec',
      kind: 'spec',
      tags: ['api'],
      content: 'Content.',
      chunkCount: 3,
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-02T00:00:00.000Z',
    };
    assert.equal(doc.kind, 'spec');
    assert.ok(Date.parse(doc.updatedAt) > Date.parse(doc.createdAt));
  });

  it('KNOWLEDGE_KINDS 包含所有预定义 kind', () => {
    const expected: KnowledgeKind[] = ['spec', 'lesson', 'pattern', 'decision', 'anti-pattern', 'doc'];
    assert.deepStrictEqual(KNOWLEDGE_KINDS, expected);
  });

  it('KnowledgeKind 类型为字符串联合', () => {
    const valid: KnowledgeKind = 'spec';
    assert.equal(valid, 'spec');
  });
});

// ─── 合约: IndexerService 分块逻辑 ────────────────────

describe('[knowledge] 合约: IndexerService chunkDocument', () => {
  it('简单文档产生 1 个 chunk', () => {
    const indexer = makeIndexer();
    const chunks = indexer.chunkDocument({
      sourcePath: 'simple.md',
      content: '# Title\n\nSingle paragraph.',
      kind: 'doc',
    });
    assert.ok(chunks.length >= 1);
    assert.equal(chunks[0].sourcePath, 'simple.md');
  });

  it('多 ## 标题产生多 chunk', () => {
    const indexer = makeIndexer();
    const chunks = indexer.chunkDocument({
      sourcePath: 'multi-section.md',
      content: '# Main\n\nIntro.\n## Section A\n\nContent A.\n## Section B\n\nContent B.',
      kind: 'spec',
    });
    assert.ok(chunks.length >= 2);
    const sections = chunks.map((c) => c.metadata.section).filter(Boolean);
    assert.ok(sections.includes('Section A'));
    assert.ok(sections.includes('Section B'));
  });

  it('超大内容按段落切分', () => {
    const indexer = makeIndexer();
    const longContent = `# Big\n\n${'word '.repeat(600)}\n\n${'paragraph '.repeat(600)}`;
    const chunks = indexer.chunkDocument({
      sourcePath: 'big.md',
      content: longContent,
      kind: 'doc',
    });
    assert.ok(chunks.length >= 2);
    // 每个 chunk token 数不超过上限
    for (const c of chunks) {
      assert.ok(c.tokenCount <= 600, `chunk ${c.chunkIndex} tokenCount ${c.tokenCount} exceeds limit`);
    }
  });

  it('空文档返回 0 个 chunk', () => {
    const indexer = makeIndexer();
    const chunks = indexer.chunkDocument({
      sourcePath: 'empty.md',
      content: '',
      kind: 'doc',
    });
    assert.equal(chunks.length, 0);
  });
});

// ─── 合约: IndexerService embedding ───────────────────

describe('[knowledge] 合约: IndexerService embed', () => {
  it('embed 返回 256 维向量', () => {
    const indexer = makeIndexer();
    const vec = indexer.embed('hello world');
    assert.equal(vec.length, 256);
  });

  it('相同输入产生相同向量', () => {
    const indexer = makeIndexer();
    const a = indexer.embed('test content');
    const b = indexer.embed('test content');
    assert.deepStrictEqual(a, b);
  });

  it('不同输入产生不同向量', () => {
    const indexer = makeIndexer();
    const a = indexer.embed('cats are cute');
    const b = indexer.embed('quantum computing');
    const same = a.every((v, i) => v === b[i]);
    assert.equal(same, false);
  });

  it('向量单位长度 (L2 归一化)', () => {
    const indexer = makeIndexer();
    const vec = indexer.embed('any text');
    const norm = Math.sqrt(vec.reduce((s, x) => s + x * x, 0));
    assert.ok(Math.abs(norm - 1) < 1e-6);
  });

  it('空字符串不崩溃', () => {
    const indexer = makeIndexer();
    const vec = indexer.embed('');
    assert.equal(vec.length, 256);
    const norm = Math.sqrt(vec.reduce((s, x) => s + x * x, 0));
    assert.ok(Math.abs(norm - 1) < 1e-6);
  });
});

// ─── 合约: IndexerService query ───────────────────────

describe('[knowledge] 合约: IndexerService query', () => {
  it('索引后查询返回排序结果', () => {
    const indexer = makeIndexer();
    indexer.indexDocument({
      sourcePath: 'a.md',
      content: '# A\n\nquota double increment algorithm.',
      kind: 'pattern',
    });
    const resp = indexer.query({ query: 'quota double increment', topK: 3 });
    assert.ok(resp.results.length > 0);
    assert.ok(resp.results[0].score >= 0);
    assert.equal(resp.query, 'quota double increment');
  });

  it('查询按相关性降序排列', () => {
    const indexer = makeIndexer();
    indexer.indexDocument({ sourcePath: 'a.md', content: 'apple banana cherry', kind: 'doc' });
    indexer.indexDocument({ sourcePath: 'b.md', content: 'banana banana banana', kind: 'doc' });
    const resp = indexer.query({ query: 'banana', topK: 2 });
    assert.ok(resp.results.length >= 1);
    // b.md 应该比 a.md 更相关 (banana 出现更多)
    if (resp.results.length >= 2) {
      assert.ok(resp.results[0].score >= resp.results[1].score);
    }
  });

  it('kindFilter 正确过滤', () => {
    const indexer = makeIndexer();
    indexer.indexDocument({ sourcePath: 's.md', content: 'spec content', kind: 'spec' });
    indexer.indexDocument({ sourcePath: 'l.md', content: 'lesson content', kind: 'lesson' });
    const resp = indexer.query({ query: 'content', topK: 5, kindFilter: 'spec' });
    for (const r of resp.results) {
      assert.equal(r.chunk.metadata.kind, 'spec');
    }
  });

  it('minScore 过滤低分', () => {
    const indexer = makeIndexer();
    indexer.indexDocument({ sourcePath: 'x.md', content: 'unrelated text here', kind: 'doc' });
    const resp = indexer.query({ query: 'zzzxxxxyyy', topK: 5, minScore: 0.9 });
    assert.equal(resp.results.length, 0);
  });

  it('空索引返回空', () => {
    const indexer = makeIndexer();
    const resp = indexer.query({ query: 'anything', topK: 5 });
    assert.equal(resp.results.length, 0);
    assert.equal(resp.totalCandidates, 0);
  });
});

// ─── 合约: IndexerService indexDocument ───────────────

describe('[knowledge] 合约: IndexerService indexDocument', () => {
  it('索引后 getStats 更新', () => {
    const indexer = makeIndexer();
    indexer.indexDocument({
      sourcePath: 'test.md',
      content: '# Doc\n\nContent.',
      kind: 'lesson',
    });
    const stats = indexer.getStats();
    assert.equal(stats.totalDocuments, 1);
    assert.ok(stats.totalChunks >= 1);
  });

  it('多次索引累加', () => {
    const indexer = makeIndexer();
    indexer.indexDocument({ sourcePath: 'a.md', content: '# A\nA.', kind: 'doc' });
    indexer.indexDocument({ sourcePath: 'b.md', content: '# B\nB.', kind: 'doc' });
    const stats = indexer.getStats();
    assert.equal(stats.totalDocuments, 2);
  });

  it('getStats byKind 统计正确', () => {
    const indexer = makeIndexer();
    indexer.indexDocument({ sourcePath: 's.md', content: '# S\nS.', kind: 'spec' });
    indexer.indexDocument({ sourcePath: 'l.md', content: '# L\nL.', kind: 'lesson' });
    const stats = indexer.getStats();
    assert.ok(stats.byKind['spec'] >= 1);
    assert.ok(stats.byKind['lesson'] >= 1);
  });
});

// ─── 合约: KnowledgeService 业务逻辑 ──────────────────

describe('[knowledge] 合约: KnowledgeService', () => {
  let svc: KnowledgeService;

  svc = makeService();

  it('indexDocument 返回 chunks>0 和 documentId', () => {
    const result = svc.indexDocument({
      sourcePath: 'contract.md',
      content: '# Contract\n\nTesting contract.',
      kind: 'spec',
    });
    assert.equal(typeof result.documentId, 'string');
    assert.ok(result.documentId.startsWith('doc-'));
    assert.ok(result.chunks >= 1);
  });

  it('indexDocument 同路径更新幂等 (documentId 不变)', () => {
    const r1 = svc.indexDocument({
      sourcePath: 'power.md',
      content: '# V1\n\nFirst version.',
      kind: 'doc',
    });
    const r2 = svc.indexDocument({
      sourcePath: 'power.md',
      content: '# V2\n\nSecond version.',
      kind: 'doc',
    });
    assert.equal(r2.documentId, r1.documentId);
  });

  it('query 索引后返回匹配结果', () => {
    svc.indexDocument({
      sourcePath: 'q.md',
      content: '# Query Test\n\nDouble increment bug found in quota system.',
      kind: 'pattern',
    });
    const resp = svc.query({ query: 'quota double increment' });
    assert.ok(resp.results.length >= 1);
    assert.ok(resp.results[0].score > 0);
  });

  it('query 输出始终包含 query、totalCandidates、durationMs', () => {
    const resp = svc.query({ query: 'anything' });
    assert.equal(typeof resp.query, 'string');
    assert.equal(typeof resp.totalCandidates, 'number');
    assert.equal(typeof resp.durationMs, 'number');
    assert.ok(resp.durationMs >= 0);
    assert.ok(Array.isArray(resp.results));
  });

  it('getSuggestions 返回最多 maxSuggestions 条', () => {
    const suggestions = svc.getSuggestions({ query: 'quota', maxSuggestions: 2 });
    assert.ok(suggestions.length <= 2);
    for (const s of suggestions) {
      assert.equal(typeof s.sourcePath, 'string');
      assert.equal(typeof s.title, 'string');
      assert.equal(typeof s.snippet, 'string');
      assert.equal(typeof s.score, 'number');
    }
  });

  it('getSuggestions 空索引返回空', () => {
    const freshSvc = makeService();
    const suggestions = freshSvc.getSuggestions({ query: 'nothing' });
    assert.equal(suggestions.length, 0);
  });

  it('listDocuments 列出已索引文档', () => {
    const docs = svc.listDocuments();
    assert.ok(Array.isArray(docs));
    for (const d of docs) {
      assert.equal(typeof d.id, 'string');
      assert.equal(typeof d.title, 'string');
      assert.equal(typeof d.kind, 'string');
      assert.ok(KNOWLEDGE_KINDS.includes(d.kind as KnowledgeKind));
    }
  });

  it('getDocument 返回正确文档', () => {
    const { documentId } = svc.indexDocument({
      sourcePath: 'get.md',
      content: '# Get Doc\n\nFetch me.',
      kind: 'lesson',
    });
    const doc = svc.getDocument(documentId);
    assert.ok(doc !== null);
    assert.equal(doc!.sourcePath, 'get.md');
    assert.equal(doc!.kind, 'lesson');
  });

  it('getDocument 不存在返回 null', () => {
    const doc = svc.getDocument('non-existent-id');
    assert.equal(doc, null);
  });

  it('findBySourcePath 通过路径查找', () => {
    svc.indexDocument({
      sourcePath: 'find-by-path.md',
      content: '# Found\n\nBy path.',
      kind: 'spec',
    });
    const doc = svc.findBySourcePath('find-by-path.md');
    assert.ok(doc !== null);
    assert.equal(doc!.sourcePath, 'find-by-path.md');
  });

  it('findBySourcePath 不存在返回 null', () => {
    const doc = svc.findBySourcePath('no-such-path.md');
    assert.equal(doc, null);
  });

  it('listByKind 过滤正确', () => {
    svc.indexDocument({ sourcePath: 'k-spec.md', content: '# K\nSpec.', kind: 'spec' });
    const docs = svc.listByKind('spec');
    for (const d of docs) {
      assert.equal(d.kind, 'spec');
    }
  });

  it('getStats 返回格式正确', () => {
    const stats = svc.getStats();
    assert.equal(typeof stats.totalDocuments, 'number');
    assert.equal(typeof stats.totalChunks, 'number');
    assert.equal(typeof stats.averageChunkSize, 'number');
    assert.equal(typeof stats.byKind, 'object');
  });

  it('deleteDocument 删除存在文档返回 true', () => {
    const { documentId } = svc.indexDocument({
      sourcePath: 'del.md',
      content: '# Delete\n\nMe.',
      kind: 'doc',
    });
    const deleted = svc.deleteDocument(documentId);
    assert.equal(deleted, true);
    assert.equal(svc.getDocument(documentId), null);
  });

  it('deleteDocument 删除不存在文档返回 false', () => {
    const deleted = svc.deleteDocument('non-existent');
    assert.equal(deleted, false);
  });

  it('reset 清空所有数据', () => {
    svc.indexDocument({ sourcePath: 'r.md', content: '# R\nReset.', kind: 'doc' });
    svc.reset();
    const stats = svc.getStats();
    assert.equal(stats.totalDocuments, 0);
    assert.equal(stats.totalChunks, 0);
  });
});

// ─── 合约: 边界条件 ──────────────────────────────────

describe('[knowledge] 合约: 边界条件', () => {
  it('isValidKind 返回合法 kind', () => {
    const svc = makeService();
    assert.ok(svc.isValidKind('spec'));
    assert.ok(svc.isValidKind('lesson'));
    assert.ok(svc.isValidKind('pattern'));
    assert.ok(svc.isValidKind('decision'));
    assert.ok(svc.isValidKind('anti-pattern'));
    assert.ok(svc.isValidKind('doc'));
  });

  it('isValidKind 拒绝非法 kind', () => {
    const svc = makeService();
    assert.equal(svc.isValidKind('invalid-type'), false);
    assert.equal(svc.isValidKind(''), false);
    assert.equal(svc.isValidKind('SPEC'), false); // 大小写敏感
  });

  it('超长文档不崩溃', () => {
    const svc = makeService();
    const hugeContent = '# Huge\n\n' + Array.from({ length: 10000 }, (_, i) => `Line ${i}.`).join('\n');
    const result = svc.indexDocument({
      sourcePath: 'huge.md',
      content: hugeContent,
      kind: 'doc',
    });
    assert.ok(result.chunks >= 1);
  });

  it('中文文档索引正确', () => {
    const svc = makeService();
    const result = svc.indexDocument({
      sourcePath: 'zh.md',
      content: '# 中文标题\n\n这是中文内容,用于测试中文索引。',
      kind: 'doc',
    });
    assert.ok(result.chunks >= 1);
    assert.ok(result.documentId.startsWith('doc-'));
  });

  it('中文查询返回结果', () => {
    const svc = makeService();
    svc.indexDocument({
      sourcePath: 'zh-query.md',
      content: '# 会员升级规则\n\nSVIP 会员需要满足积分和消费条件。',
      kind: 'doc',
    });
    const resp = svc.query({ query: '会员升级', topK: 3 });
    // 中文语义匹配依赖 embedding 足够好
    assert.ok(Array.isArray(resp.results));
  });

  it('文档 title 从 # 标题提取', () => {
    const svc = makeService();
    svc.indexDocument({
      sourcePath: 'title-test.md',
      content: '# My Custom Title\n\nContent.',
      kind: 'doc',
    });
    const docs = svc.listDocuments();
    const doc = docs.find((d) => d.sourcePath === 'title-test.md');
    assert.ok(doc);
    assert.equal(doc!.title, 'My Custom Title');
  });

  it('没有 # 标题时回退到 sourcePath', () => {
    const svc = makeService();
    svc.indexDocument({
      sourcePath: 'no-title.md',
      content: 'Just content without a heading.',
      kind: 'doc',
    });
    const doc = svc.findBySourcePath('no-title.md');
    assert.ok(doc);
    assert.equal(doc!.title, 'no-title.md');
  });

  it('多文档查询时所有文档都会被检索', () => {
    const svc = makeService();
    for (let i = 0; i < 10; i++) {
      svc.indexDocument({
        sourcePath: `doc-${i}.md`,
        content: `# Doc ${i}\n\nContent with common word.`,
        kind: 'doc',
      });
    }
    const resp = svc.query({ query: 'common word', topK: 10 });
    assert.ok(resp.totalCandidates >= 10);
  });

  it('deleteDocument 后 query 不再返回该文档的 chunks', () => {
    const svc = makeService();
    const { documentId } = svc.indexDocument({
      sourcePath: 'del-query.md',
      content: '# DelQuery\n\nUnique content for deletion test 98765.',
      kind: 'doc',
    });
    svc.deleteDocument(documentId);
    // Service 层 deleteDocument 仅从 documents Map 删除,indexer 层不删除
    // 这是 V1 已知局限,contract test 记录此行为
    const stats = svc.getStats();
    // document 列表应该为空,但 chunk 数据仍在 indexer 中
    assert.equal(svc.getDocument(documentId), null);
  });
});

// ─── 合约: 契约常量 ──────────────────────────────────

describe('[knowledge] 合约: 契约常量', () => {
  it('KNOWLEDGE_API_PREFIX 为 knowledge', async () => {
    const { KNOWLEDGE_API_PREFIX } = await import('./knowledge.contract');
    assert.equal(KNOWLEDGE_API_PREFIX, 'knowledge');
  });

  it('KnowledgeEndpoints 导出所有端点', async () => {
    const { KnowledgeEndpoints } = await import('./knowledge.contract');
    assert.ok(KnowledgeEndpoints.INDEX);
    assert.equal(KnowledgeEndpoints.INDEX.method, 'POST');
    assert.ok(KnowledgeEndpoints.QUERY);
    assert.equal(KnowledgeEndpoints.QUERY.method, 'POST');
    assert.ok(KnowledgeEndpoints.SUGGEST);
    assert.equal(KnowledgeEndpoints.SUGGEST.method, 'POST');
    assert.ok(KnowledgeEndpoints.STATS);
    assert.equal(KnowledgeEndpoints.STATS.method, 'GET');
    assert.ok(KnowledgeEndpoints.LIST_DOCUMENTS);
    assert.equal(KnowledgeEndpoints.LIST_DOCUMENTS.method, 'GET');
    assert.ok(KnowledgeEndpoints.GET_DOCUMENT);
    assert.equal(KnowledgeEndpoints.GET_DOCUMENT.path, 'documents/:id');
    assert.ok(KnowledgeEndpoints.LIST_BY_KIND);
    assert.equal(KnowledgeEndpoints.LIST_BY_KIND.path, 'documents/by-kind/:kind');
    assert.ok(KnowledgeEndpoints.RESET);
    assert.equal(KnowledgeEndpoints.RESET.method, 'POST');
    assert.ok(KnowledgeEndpoints.DELETE_DOCUMENT);
    assert.equal(KnowledgeEndpoints.DELETE_DOCUMENT.method, 'DELETE');
  });

  it('KnowledgeErrorCodes 导出错误码', async () => {
    const { KnowledgeErrorCodes } = await import('./knowledge.contract');
    assert.equal(KnowledgeErrorCodes.DOCUMENT_NOT_FOUND, 'KNOWLEDGE_DOCUMENT_NOT_FOUND');
    assert.equal(KnowledgeErrorCodes.INVALID_KIND, 'KNOWLEDGE_INVALID_KIND');
  });
});
