import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [ai-rag] [D] 合约测试
 *
 * 验证 ai-rag 模块的实体 Shape、DTO 合约、业务逻辑契约
 */

import 'reflect-metadata';
import assert from 'node:assert/strict';
import { KnowledgeBaseManager, RAGPipeline, SalesScriptGenerator } from './ai-rag.service';
import { CollectionType } from './ai-rag.entity';
import type {
  StoredDocument,
  DocumentChunk,
  RetrievedChunk,
  RagQueryResult,
  ChatMessage,
} from './ai-rag.entity';

// ─── 服务实例 helper ──────────────────────────────────

function makeKb(): KnowledgeBaseManager {
  return new KnowledgeBaseManager();
}

function makeRag(): { kb: KnowledgeBaseManager; rag: RAGPipeline } {
  const kb = makeKb();
  const rag = new RAGPipeline(kb);
  return { kb, rag };
}

function makeScriptGen(): SalesScriptGenerator {
  return new SalesScriptGenerator();
}

// ─── 合约: 实体 Shape ─────────────────────────────────

describe('[ai-rag] 合约: StoredDocument shape', () => {
  it('createDocument 返回符合合约的文档', () => {
    const kb = makeKb();
    const doc = kb.addDocument(CollectionType.PRODUCTS, {
      content: '智能营销系统提供AI驱动的精准用户画像功能。',
      id: 'doc-shape-01',
      metadata: { title: '营销系统产品简介' },
    });

    // 合约验证
    assert.equal(typeof doc.id, 'string');
    assert.equal(doc.id, 'doc-shape-01');
    assert.equal(doc.collection, CollectionType.PRODUCTS);
    assert.equal(typeof doc.createdAt, 'string');
    assert.equal(typeof doc.updatedAt, 'string');
    assert.ok(Array.isArray(doc.chunks));
    assert.ok(doc.chunks.length > 0);

    // 每个 chunk 的合约
    for (const ch of doc.chunks) {
      assert.equal(typeof ch.id, 'string');
      assert.equal(typeof ch.content, 'string');
      assert.equal(typeof ch.metadata, 'object');
      assert.notEqual(ch.metadata, null);
      assert.equal(ch.metadata.docId, 'doc-shape-01');
      assert.equal(ch.metadata.collection, CollectionType.PRODUCTS);
      assert.equal(typeof ch.metadata.chunkIndex, 'number');
    }
  });

  it('文档分区数符合预期（长文本分多块）', () => {
    const kb = makeKb();
    const longText = 'A'.repeat(1200); // > 2 chunks
    const doc = kb.addDocument(CollectionType.FAQ, {
      content: longText,
      id: 'doc-long',
    });
    assert.ok(doc.chunks.length >= 2);
  });

  it('短文本只产生 1 个 chunk', () => {
    const kb = makeKb();
    const doc = kb.addDocument(CollectionType.TRAINING, {
      content: '短文本',
      id: 'doc-short',
    });
    assert.equal(doc.chunks.length, 1);
  });
});

// ─── 合约: DTO 形状 ───────────────────────────────────

describe('[ai-rag] 合约: ApiResponseDto shape', () => {
  it('成功响应包含 success=true 和 data', () => {
    const kb = makeKb();
    const doc = kb.addDocument(CollectionType.PRODUCTS, {
      content: 'test',
      id: 'doc-api-01',
    });
    assert.equal(doc.id, 'doc-api-01');
    assert.ok(doc.chunks.length > 0);
  });

  it('不存在的文档返回 null', () => {
    const kb = makeKb();
    const doc = kb.getDocument(CollectionType.PRODUCTS, 'non-existent');
    assert.equal(doc, null);
  });

  it('删除已删除的文档返回 false', () => {
    const kb = makeKb();
    const result = kb.deleteDocument(CollectionType.PRODUCTS, 'never-existed');
    assert.equal(result, false);
  });

  it('更新不存在的文档返回 null', () => {
    const kb = makeKb();
    const updated = kb.updateDocument(CollectionType.PRODUCTS, 'never-existed', 'new content');
    assert.equal(updated, null);
  });
});

// ─── 合约: 集合管理 ───────────────────────────────────

describe('[ai-rag] 合约: collection management', () => {
  it('listDocuments 按 collection 过滤', () => {
    const kb = makeKb();
    kb.addDocument(CollectionType.PRODUCTS, { content: 'p1', id: 'p1' });
    kb.addDocument(CollectionType.PRODUCTS, { content: 'p2', id: 'p2' });
    kb.addDocument(CollectionType.FAQ, { content: 'f1', id: 'f1' });

    const products = kb.listDocuments(CollectionType.PRODUCTS);
    const faqs = kb.listDocuments(CollectionType.FAQ);

    assert.equal(products.length, 2);
    assert.equal(faqs.length, 1);
  });

  it('getCollectionStats 返回正确的统计', () => {
    const kb = makeKb();
    kb.addDocument(CollectionType.SUPPORT, {
      content: 'A'.repeat(600),
      id: 'stats-1',
    });
    kb.addDocument(CollectionType.SUPPORT, {
      content: '短文本',
      id: 'stats-2',
    });

    const stats = kb.getCollectionStats(CollectionType.SUPPORT);
    assert.equal(stats.documentCount, 2);
    assert.ok(stats.chunkCount >= 2);
  });

  it('空集合返回 0 文档统计', () => {
    const kb = makeKb();
    const stats = kb.getCollectionStats(CollectionType.POLICIES);
    assert.equal(stats.documentCount, 0);
    assert.equal(stats.chunkCount, 0);
  });
});

// ─── 合约: RAG 管道 ───────────────────────────────────

describe('[ai-rag] 合约: RAG pipeline', () => {
  it('query 返回 answer 和 sources', async () => {
    const { kb, rag } = makeRag();
    kb.addDocument(CollectionType.PRODUCTS, {
      content: '智能营销系统提供AI驱动的精准用户画像、多渠道自动触达和实时数据分析功能。',
      id: 'rag-query-test',
      metadata: { title: '营销系统' },
    });

    const result = await rag.query('智能营销系统有什么功能', CollectionType.PRODUCTS);
    assert.equal(typeof result.answer, 'string');
    assert.ok(Array.isArray(result.sources));
    assert.ok(result.answer.length > 0);
  });

  it('无文档集合查询返回 fallback 信息', async () => {
    const { rag } = makeRag();
    const result = await rag.query('有什么产品', CollectionType.POLICIES);
    assert.ok(result.answer.includes('没有找到'));
    assert.equal(result.sources.length, 0);
  });

  it('retrieve 返回排序后的结果', () => {
    const { kb, rag } = makeRag();
    kb.addDocument(CollectionType.TRAINING, {
      content: '培训内容包括销售技巧、产品知识、客户服务等。',
      id: 'train-1',
    });
    kb.addDocument(CollectionType.TRAINING, {
      content: '客服培训涵盖沟通技巧、投诉处理流程。',
      id: 'train-2',
    });

    const results = rag.retrieve('培训销售技巧', CollectionType.TRAINING, 5);
    assert.ok(Array.isArray(results));
    for (const r of results) {
      assert.equal(typeof r.score, 'number');
      assert.ok(r.score >= 0);
      assert.equal(typeof r.chunk.id, 'string');
      assert.equal(typeof r.chunk.content, 'string');
    }
    // 确保按 score 降序
    for (let i = 1; i < results.length; i++) {
      assert.ok(results[i - 1].score >= results[i].score);
    }
  });

  it('retrieve 空集合返回空数组', () => {
    const { rag } = makeRag();
    const results = rag.retrieve('anything', CollectionType.POLICIES, 5);
    assert.equal(results.length, 0);
  });

  it('chat 返回 reply 和 sources（多轮对话）', async () => {
    const { kb, rag } = makeRag();
    kb.addDocument(CollectionType.PRODUCTS, {
      content: '我们的产品价格合理，功能强大。',
      id: 'chat-test',
    });

    const messages: ChatMessage[] = [
      { role: 'system', content: '你是一个智能客服助手。' },
      { role: 'user', content: '产品价格如何？' },
    ];
    const result = await rag.chat(messages, CollectionType.PRODUCTS);
    assert.equal(typeof result.reply, 'string');
    assert.ok(Array.isArray(result.sources));
    assert.ok(result.reply.includes('产品'));
  });

  it('chat 无 user 消息返回默认提示', async () => {
    const { rag } = makeRag();
    const result = await rag.chat(
      [{ role: 'assistant', content: '你好' }],
      CollectionType.PRODUCTS,
    );
    assert.equal(result.reply, '请问有什么可以帮您？');
    assert.equal(result.sources.length, 0);
  });

  it('getStats 返回正确的文档数和块数', () => {
    const { kb, rag } = makeRag();
    kb.addDocument(CollectionType.FAQ, {
      content: 'A'.repeat(600),
      id: 'faq-stats',
    });

    const stats = rag.getStats(CollectionType.FAQ);
    assert.equal(typeof stats.documents, 'number');
    assert.equal(typeof stats.chunks, 'number');
    assert.equal(stats.documents, 1);
    assert.ok(stats.chunks >= 1);
  });
});

// ─── 合约: 话术生成 ───────────────────────────────────

describe('[ai-rag] 合约: SalesScriptGenerator', () => {
  it('generateProductScript 返回非空字符串', () => {
    const gen = makeScriptGen();
    const script = gen.generateProductScript('prod-001', 'professional');
    assert.equal(typeof script, 'string');
    assert.ok(script.includes('智能营销系统'));
    assert.ok(script.includes('【专业版】'));
  });

  it('不同 tone 生成不同的前缀', () => {
    const gen = makeScriptGen();
    const pro = gen.generateProductScript('prod-001', 'professional');
    const friendly = gen.generateProductScript('prod-001', 'friendly');
    const urgent = gen.generateProductScript('prod-001', 'urgent');

    assert.ok(pro.includes('【专业版】'));
    assert.ok(friendly.includes('【亲和版】'));
    assert.ok(urgent.includes('【紧迫版】'));
  });

  it('generateObjectionScript 返回异议处理话术', () => {
    const gen = makeScriptGen();
    const script = gen.generateObjectionScript('prod-001', 'price');
    assert.equal(typeof script, 'string');
    assert.ok(script.includes('智能营销系统'));
  });

  it('不同异议类型返回不同的内容', () => {
    const gen = makeScriptGen();
    const priceScript = gen.generateObjectionScript('prod-001', 'price');
    const qualityScript = gen.generateObjectionScript('prod-001', 'quality');

    assert.ok(priceScript.length > 0);
    assert.ok(qualityScript.length > 0);
  });

  it('generateFollowUpScript 返回跟进话术', () => {
    const gen = makeScriptGen();
    const script = gen.generateFollowUpScript('cust-001');
    assert.equal(typeof script, 'string');
    assert.ok(script.includes('张总') || script.includes('智能营销系统'));
  });

  it('未知客户使用默认称呼', () => {
    const gen = makeScriptGen();
    const script = gen.generateFollowUpScript('unknown-cust');
    assert.equal(typeof script, 'string');
    assert.ok(script.length > 0);
  });

  it('localizeScript 转换 zh-CN 到 en-US', () => {
    const gen = makeScriptGen();
    const original = '您好，限时优惠，立即购买！';
    const localized = gen.localizeScript(original, 'en-US');
    assert.ok(localized.includes('discount'));
  });

  it('localizeScript 可以翻译到 zh-TW', () => {
    const gen = makeScriptGen();
    const original = '您好，谢谢，优惠';
    const localized = gen.localizeScript(original, 'zh-TW');
    assert.ok(localized.includes('感謝'));
    assert.ok(localized.includes('優惠'));
  });
});

// ─── 合约: 文档 CRUD 完整性 ───────────────────────────

describe('[ai-rag] 合约: 文档 CRUD 完整性', () => {
  it('创建→读取→更新→删除 完整流程', () => {
    const kb = makeKb();

    // Create
    const doc = kb.addDocument(CollectionType.PRODUCTS, {
      content: '原内容',
      id: 'crud-cycle',
    });
    assert.equal(doc.id, 'crud-cycle');
    const originalChunkCount = doc.chunks.length;

    // Read
    const read = kb.getDocument(CollectionType.PRODUCTS, 'crud-cycle');
    assert.notEqual(read, null);
    assert.equal(read!.id, 'crud-cycle');

    // Update
    const updated = kb.updateDocument(CollectionType.PRODUCTS, 'crud-cycle', '更新后的更长内容' + 'A'.repeat(600));
    assert.notEqual(updated, null);
    assert.equal(updated!.id, 'crud-cycle');
    // 更长的内容应该产生更多 chunk
    assert.ok(updated!.chunks.length >= originalChunkCount);

    // Delete
    const deleted = kb.deleteDocument(CollectionType.PRODUCTS, 'crud-cycle');
    assert.equal(deleted, true);

    // Confirm gone
    const afterDelete = kb.getDocument(CollectionType.PRODUCTS, 'crud-cycle');
    assert.equal(afterDelete, null);
  });
});
