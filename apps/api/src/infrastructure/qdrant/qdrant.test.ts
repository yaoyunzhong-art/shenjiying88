import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * Qdrant Service Tests (T119-2)
 * 使用 vitest globals
 */
import {
  QdrantClient,
  EmbeddingService,
  KnowledgeBaseService,
  Point
} from './qdrant.service'

// ── QdrantClient Tests ─────────────────────────────────────────────────────────

describe('QdrantClient', () => {
  let client: QdrantClient

  beforeEach(() => {
    client = new QdrantClient()
  })

  describe('connect', () => {
    it('should connect successfully', async () => {
      await expect(client.connect()).resolves.not.toThrow()
    })
  })

  describe('createCollection', () => {
    it('should create a collection successfully', async () => {
      await client.createCollection('test_col', 128)
      const exists = await client.collectionExists('test_col')
      expect(exists).toBe(true)
    })

    it('should throw error when collection already exists', async () => {
      await client.createCollection('test_col', 128)
      await expect(client.createCollection('test_col', 128)).rejects.toThrow(
        "Collection 'test_col' already exists"
      )
    })

    it('should store correct vector size', async () => {
      await client.createCollection('test_col', 256)
      const info = await client.getCollectionInfo('test_col')
      expect(info?.vectorSize).toBe(256)
    })
  })

  describe('upsert and search', () => {
    it('should upsert points and find them by search', async () => {
      await client.createCollection('test_col', 128)
      const vector = new Array(128).fill(0).map(() => Math.random())
      const points: Point[] = [
        {
          id: 'point1',
          vector,
          payload: { text: 'hello world' }
        }
      ]
      await client.upsert('test_col', points)
      const results = await client.search('test_col', vector, 1)
      expect(results.length).toBe(1)
      expect(results[0].id).toBe('point1')
      expect(results[0].score).toBeCloseTo(1, 2)
    })

    it('should rank similar content higher', async () => {
      await client.createCollection('test_col', 128)
      const embedding = new EmbeddingService(128)

      const doc1Vector = embedding.embed('machine learning is great')
      const doc2Vector = embedding.embed('cooking recipes for dinner')
      const queryVector = embedding.embed('artificial intelligence and ML')

      await client.upsert('test_col', [
        { id: 'doc1', vector: doc1Vector, payload: { text: 'machine learning' } },
        { id: 'doc2', vector: doc2Vector, payload: { text: 'cooking recipes' } }
      ])

      const results = await client.search('test_col', queryVector, 2)
      expect(results[0].id).toBe('doc1')
      expect(results[0].score).toBeGreaterThan(results[1].score)
    })

    it('should filter results by payload', async () => {
      await client.createCollection('test_col', 128)
      const vector = new Array(128).fill(0).map(() => Math.random())
      await client.upsert('test_col', [
        { id: 'p1', vector, payload: { type: 'A', text: 'doc A' } },
        { id: 'p2', vector, payload: { type: 'B', text: 'doc B' } }
      ])

      const results = await client.search('test_col', vector, 10, { type: 'A' })
      expect(results.length).toBe(1)
      expect(results[0].payload.type).toBe('A')
    })
  })

  describe('delete', () => {
    it('should delete a point successfully', async () => {
      await client.createCollection('test_col', 128)
      const vector = new Array(128).fill(0.1)
      await client.upsert('test_col', [
        { id: 'point1', vector, payload: {} }
      ])
      await client.delete('test_col', 'point1')

      const results = await client.search('test_col', vector, 10)
      expect(results.find((r) => r.id === 'point1')).toBeUndefined()
    })

    it('should throw error when deleting non-existent point', async () => {
      await client.createCollection('test_col', 128)
      await expect(client.delete('test_col', 'nonexistent')).rejects.toThrow(
        "Point 'nonexistent' not found"
      )
    })
  })
})

// ── EmbeddingService Tests ─────────────────────────────────────────────────────

describe('EmbeddingService', () => {
  let embedding: EmbeddingService

  beforeEach(() => {
    embedding = new EmbeddingService(128)
  })

  describe('embed', () => {
    it('should generate vector with correct size', () => {
      const vector = embedding.embed('hello world')
      expect(vector.length).toBe(128)
    })

    it('should generate normalized vectors', () => {
      const vector = embedding.embed('test text')
      const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0))
      expect(magnitude).toBeCloseTo(1, 5)
    })

    it('should generate same vector for same text', () => {
      const vec1 = embedding.embed('consistent text')
      const vec2 = embedding.embed('consistent text')
      expect(vec1).toEqual(vec2)
    })
  })

  describe('embedBatch', () => {
    it('should embed multiple texts with consistent dimensions', () => {
      const texts = ['text one', 'text two', 'text three']
      const vectors = embedding.embedBatch(texts)
      expect(vectors.length).toBe(3)
      vectors.forEach((v) => expect(v.length).toBe(128))
    })
  })

  describe('chunkText', () => {
    it('should split text by chunkSize', () => {
      const text = 'a'.repeat(300)
      const chunks = embedding.chunkText(text, 100, 0)
      expect(chunks.length).toBe(3)
      expect(chunks[0].length).toBe(100)
      expect(chunks[1].length).toBe(100)
      expect(chunks[2].length).toBe(100)
    })

    it('should handle overlap correctly', () => {
      const text = 'abcdefghij'
      const chunks = embedding.chunkText(text, 4, 2)
      expect(chunks.length).toBe(4)
      expect(chunks[0]).toBe('abcd')
      expect(chunks[1]).toBe('cdef')
      expect(chunks[2]).toBe('efgh')
      expect(chunks[3]).toBe('ghij')
    })

    it('should throw error when overlap >= chunkSize', () => {
      expect(() => embedding.chunkText('some text', 5, 5)).toThrow(
        'Overlap must be smaller than chunkSize'
      )
    })

    it('should return empty array for empty text', () => {
      const chunks = embedding.chunkText('', 100, 0)
      expect(chunks).toEqual([])
    })
  })
})

// ── KnowledgeBaseService Tests ─────────────────────────────────────────────────

describe('KnowledgeBaseService', () => {
  let qdrant: QdrantClient
  let embedding: EmbeddingService
  let kb: KnowledgeBaseService

  beforeEach(async () => {
    qdrant = new QdrantClient()
    embedding = new EmbeddingService(1536)
    kb = new KnowledgeBaseService(qdrant, embedding)
    await qdrant.connect()
    await qdrant.createCollection('knowledge_base', 1536)
  })

  describe('indexDocument', () => {
    it('should index a document and make it searchable', async () => {
      await kb.indexDocument('doc1', 'This is a test document about machine learning', {
        source: 'test'
      })
      const results = await kb.searchSimilar('artificial intelligence', 1)
      expect(results.length).toBeGreaterThan(0)
    })

    it('should store document metadata', async () => {
      await kb.indexDocument('doc2', 'Hello world document', {
        source: 'test',
        author: 'tester'
      })
      const results = await kb.searchSimilar('greetings', 5)
      const doc2Results = results.filter((r) => r.payload.docId === 'doc2')
      expect(doc2Results.length).toBeGreaterThan(0)
      expect(doc2Results[0].payload.author).toBe('tester')
    })
  })

  describe('searchSimilar', () => {
    it('should return relevant results for a query', async () => {
      await kb.indexDocument('doc1', 'The weather is sunny today')
      await kb.indexDocument('doc2', 'Programming in Python is fun')
      const results = await kb.searchSimilar('sunny day', 2)
      expect(results.length).toBeLessThanOrEqual(2)
    })
  })

  describe('deleteDocument', () => {
    it('should delete document and make it unfindable', async () => {
      await kb.indexDocument('doc_to_delete', 'This document will be deleted')
      await kb.deleteDocument('doc_to_delete')
      const results = await kb.searchSimilar('document deleted', 10)
      const deleted = results.filter((r) => r.payload.docId === 'doc_to_delete')
      expect(deleted.length).toBe(0)
    })
  })

  describe('rebuildIndex', () => {
    it('should clear all points in a collection', async () => {
      await kb.indexDocument('doc1', 'Some content to clear')
      await kb.rebuildIndex('knowledge_base')
      const info = await qdrant.getCollectionInfo('knowledge_base')
      expect(info?.pointsCount).toBe(0)
    })
  })
})
