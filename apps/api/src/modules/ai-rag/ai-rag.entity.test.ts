/**
 * ai-rag.entity.test.ts - RAG 知识库实体测试
 */
import { describe, it, expect } from 'vitest'
import { CollectionType } from './ai-rag.entity'
import type {
  DocumentChunk,
  StoredDocument,
  RetrievedChunk,
  RagQueryResult,
  ChatMessage,
  CollectionStats,
  RagPipelineStats,
} from './ai-rag.entity'

describe('AiRagEntity', () => {
  describe('CollectionType enum', () => {
    it('RAG-ENTITY-1 should have all expected collection types', () => {
      expect(CollectionType.PRODUCTS).toBe('products')
      expect(CollectionType.FAQ).toBe('faq')
      expect(CollectionType.SUPPORT).toBe('support')
      expect(CollectionType.TRAINING).toBe('training')
      expect(CollectionType.POLICIES).toBe('policies')
    })
  })

  describe('DocumentChunk interface', () => {
    it('RAG-ENTITY-2 should create a valid DocumentChunk', () => {
      const chunk: DocumentChunk = {
        id: 'chunk-001',
        content: '测试内容',
        metadata: { docId: 'doc-1', collection: 'faq', chunkIndex: 0 },
      }
      expect(chunk.id).toBe('chunk-001')
      expect(chunk.content).toBe('测试内容')
      expect(chunk.metadata.docId).toBe('doc-1')
    })

    it('RAG-ENTITY-3 should allow arbitrary metadata', () => {
      const chunk: DocumentChunk = {
        id: 'chunk-002',
        content: '内容',
        metadata: { author: 'tester', version: 2, tags: ['ai', 'rag'] },
      }
      expect(chunk.metadata.author).toBe('tester')
      expect(chunk.metadata.version).toBe(2)
      expect(chunk.metadata.tags).toEqual(['ai', 'rag'])
    })
  })

  describe('StoredDocument interface', () => {
    it('RAG-ENTITY-4 should create a valid StoredDocument', () => {
      const doc: StoredDocument = {
        id: 'doc-001',
        collection: CollectionType.FAQ,
        title: '常见问题',
        chunks: [
          { id: 'c1', content: 'Q1', metadata: {} },
          { id: 'c2', content: 'A1', metadata: {} },
        ],
        metadata: {},
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-02T00:00:00Z',
      }
      expect(doc.collection).toBe('faq')
      expect(doc.chunks).toHaveLength(2)
      expect(doc.title).toBe('常见问题')
    })

    it('RAG-ENTITY-5 should allow custom collection string', () => {
      const doc: StoredDocument = {
        id: 'doc-002',
        collection: 'custom-collection',
        chunks: [],
        metadata: {},
        createdAt: '',
        updatedAt: '',
      }
      expect(doc.collection).toBe('custom-collection')
    })

    it('RAG-ENTITY-6 should require timestamps', () => {
      const doc: StoredDocument = {
        id: 'doc-003',
        collection: CollectionType.PRODUCTS,
        chunks: [],
        metadata: {},
        createdAt: '2026-06-01T00:00:00Z',
        updatedAt: '2026-06-02T00:00:00Z',
      }
      expect(new Date(doc.createdAt).getTime()).toBeLessThan(new Date(doc.updatedAt).getTime())
    })
  })

  describe('RetrievedChunk interface', () => {
    it('RAG-ENTITY-7 should create a valid RetrievedChunk with score', () => {
      const retrieved: RetrievedChunk = {
        chunk: { id: 'c1', content: '相关段落', metadata: {} },
        score: 0.85,
      }
      expect(retrieved.score).toBeGreaterThan(0)
      expect(retrieved.score).toBeLessThanOrEqual(1)
      expect(retrieved.chunk.content).toBe('相关段落')
    })

    it('RAG-ENTITY-8 should allow zero score', () => {
      const retrieved: RetrievedChunk = {
        chunk: { id: 'c2', content: '不相关内容', metadata: {} },
        score: 0,
      }
      expect(retrieved.score).toBe(0)
    })
  })

  describe('RagQueryResult interface', () => {
    it('RAG-ENTITY-9 should create a valid RagQueryResult', () => {
      const result: RagQueryResult = {
        answer: '答案是 42',
        sources: ['doc-001', 'doc-002'],
        retrievedChunks: 3,
        latencyMs: 150,
      }
      expect(result.sources).toHaveLength(2)
      expect(result.retrievedChunks).toBe(3)
      expect(result.latencyMs).toBeGreaterThan(0)
    })

    it('RAG-ENTITY-10 should allow empty sources', () => {
      const result: RagQueryResult = {
        answer: '未找到相关信息',
        sources: [],
        retrievedChunks: 0,
        latencyMs: 5,
      }
      expect(result.sources).toEqual([])
      expect(result.retrievedChunks).toBe(0)
    })
  })

  describe('ChatMessage interface', () => {
    it('RAG-ENTITY-11 should create messages with valid roles', () => {
      const messages: ChatMessage[] = [
        { role: 'user', content: '你好' },
        { role: 'assistant', content: '您好' },
        { role: 'system', content: '请礼貌回答' },
      ]
      expect(messages.every((m) => ['user', 'assistant', 'system'].includes(m.role))).toBe(true)
    })
  })

  describe('CollectionStats and RagPipelineStats', () => {
    it('RAG-ENTITY-12 should create CollectionStats', () => {
      const stats: CollectionStats = { documentCount: 10, chunkCount: 45 }
      expect(stats.documentCount).toBe(10)
      expect(stats.chunkCount).toBe(45)
    })

    it('RAG-ENTITY-13 should create RagPipelineStats', () => {
      const stats: RagPipelineStats = { totalQueries: 100, totalRetrievals: 200, avgLatencyMs: 85 }
      expect(stats.totalQueries).toBe(100)
      expect(stats.avgLatencyMs).toBe(85)
    })
  })
})
