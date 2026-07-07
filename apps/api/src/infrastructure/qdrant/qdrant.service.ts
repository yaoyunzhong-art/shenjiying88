/**
 * Qdrant Vector Database Service (T119-2)
 *
 * 使用内存 Map 模拟 Qdrant，向量搜索使用余弦相似度。
 * Embedding 使用随机向量模拟。
 */
import { Logger } from '@nestjs/common'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Point {
  id: string
  vector: number[]
  payload: Record<string, any>
}

export interface SearchResult {
  id: string
  score: number
  payload: Record<string, any>
}

export interface CollectionInfo {
  name: string
  vectorSize: number
  pointsCount: number
}

export interface ChunkOptions {
  chunkSize: number
  overlap: number
}

// ── QdrantClient ───────────────────────────────────────────────────────────────

export class QdrantClient {
  private collections = new Map<string, Map<string, Point>>()
  private vectorSizes = new Map<string, number>()
  private readonly logger = new Logger(QdrantClient.name)

  async connect(): Promise<void> {
    this.logger.log('Qdrant client connected (in-memory)')
  }

  async createCollection(name: string, vectorSize: number): Promise<void> {
    if (this.collections.has(name)) {
      throw new Error(`Collection '${name}' already exists`)
    }
    this.collections.set(name, new Map())
    this.vectorSizes.set(name, vectorSize)
    this.logger.log(`Collection '${name}' created (vectorSize=${vectorSize})`)
  }

  async collectionExists(name: string): Promise<boolean> {
    return this.collections.has(name)
  }

  async upsert(collection: string, points: Point[]): Promise<void> {
    const col = this.collections.get(collection)
    if (!col) {
      throw new Error(`Collection '${collection}' not found`)
    }
    for (const point of points) {
      if (point.vector.length !== this.vectorSizes.get(collection)) {
        throw new Error(
          `Vector size mismatch: expected ${this.vectorSizes.get(collection)}, got ${point.vector.length}`
        )
      }
      col.set(point.id, { ...point })
    }
    this.logger.log(`Upserted ${points.length} points into '${collection}'`)
  }

  async search(
    collection: string,
    vector: number[],
    limit: number,
    filter?: Record<string, any>
  ): Promise<SearchResult[]> {
    const col = this.collections.get(collection)
    if (!col) {
      throw new Error(`Collection '${collection}' not found`)
    }

    const results: SearchResult[] = []
    for (const point of col.values()) {
      let included = true
      if (filter) {
        for (const [key, value] of Object.entries(filter)) {
          if (point.payload[key] !== value) {
            included = false
            break
          }
        }
      }
      if (included) {
        const score = cosineSimilarity(vector, point.vector)
        results.push({ id: point.id, score, payload: point.payload })
      }
    }

    results.sort((a, b) => b.score - a.score)
    return results.slice(0, limit)
  }

  async delete(collection: string, id: string): Promise<void> {
    const col = this.collections.get(collection)
    if (!col) {
      throw new Error(`Collection '${collection}' not found`)
    }
    if (!col.has(id)) {
      throw new Error(`Point '${id}' not found in collection '${collection}'`)
    }
    col.delete(id)
    this.logger.log(`Deleted point '${id}' from '${collection}'`)
  }

  async getCollectionInfo(name: string): Promise<CollectionInfo | null> {
    if (!this.collections.has(name)) {
      return null
    }
    const col = this.collections.get(name)!
    return {
      name,
      vectorSize: this.vectorSizes.get(name) ?? 0,
      pointsCount: col.size
    }
  }

  async clearCollection(name: string): Promise<void> {
    if (this.collections.has(name)) {
      this.collections.get(name)!.clear()
    }
  }
}

// ── EmbeddingService ───────────────────────────────────────────────────────────

const DEFAULT_VECTOR_SIZE = 1536

export class EmbeddingService {
  private readonly vectorSize: number

  constructor(vectorSize = DEFAULT_VECTOR_SIZE) {
    this.vectorSize = vectorSize
  }

  embed(text: string): number[] {
    if (!text || text.trim() === '') {
      return this.generateZeroVector()
    }
    return this.generateRandomVector(text)
  }

  embedBatch(texts: string[]): number[][] {
    return texts.map((text) => this.embed(text))
  }

  chunkText(text: string, chunkSize: number, overlap: number): string[] {
    if (!text || chunkSize <= 0) {
      return []
    }
    if (overlap >= chunkSize) {
      throw new Error('Overlap must be smaller than chunkSize')
    }

    const chunks: string[] = []
    let start = 0

    while (start < text.length) {
      let end = start + chunkSize
      if (end >= text.length) {
        end = text.length
        chunks.push(text.slice(start, end))
        break
      }
      chunks.push(text.slice(start, end))
      start += chunkSize - overlap
    }

    return chunks
  }

  getVectorSize(): number {
    return this.vectorSize
  }

  private generateRandomVector(seed: string): number[] {
    const vector: number[] = []
    let hash = this.hashString(seed)
    for (let i = 0; i < this.vectorSize; i++) {
      hash = (hash * 1664525 + 1013904223) & 0xffffffff
      const value = (hash >>> 0) / 0xffffffff
      vector.push(value)
    }
    return this.normalize(vector)
  }

  private generateZeroVector(): number[] {
    return new Array(this.vectorSize).fill(0)
  }

  private hashString(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash + char) | 0
    }
    return hash
  }

  private normalize(vector: number[]): number[] {
    const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0))
    if (magnitude === 0) return vector
    return vector.map((v) => v / magnitude)
  }
}

// ── KnowledgeBaseService ───────────────────────────────────────────────────────

export class KnowledgeBaseService {
  constructor(
    private readonly qdrant: QdrantClient,
    private readonly embedding: EmbeddingService
  ) {}

  async indexDocument(
    docId: string,
    text: string,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    const chunks = this.embedding.chunkText(text, 500, 50)
    const points: Point[] = chunks.map((chunk, idx) => ({
      id: `${docId}_${idx}`,
      vector: this.embedding.embed(chunk),
      payload: {
        docId,
        chunkIndex: idx,
        text: chunk,
        ...metadata
      }
    }))

    await this.qdrant.upsert('knowledge_base', points)
  }

  async searchSimilar(query: string, topK = 5): Promise<SearchResult[]> {
    const queryVector = this.embedding.embed(query)
    return this.qdrant.search('knowledge_base', queryVector, topK)
  }

  async deleteDocument(docId: string): Promise<void> {
    const info = await this.qdrant.getCollectionInfo('knowledge_base')
    if (!info || info.pointsCount === 0) return

    const results = await this.qdrant.search('knowledge_base', new Array(this.embedding.getVectorSize()).fill(0), info.pointsCount)
    for (const result of results) {
      if (result.payload.docId === docId) {
        await this.qdrant.delete('knowledge_base', result.id)
      }
    }
  }

  async rebuildIndex(collection: string): Promise<void> {
    const info = await this.qdrant.getCollectionInfo(collection)
    if (!info) return
    await this.qdrant.clearCollection(collection)
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Vector dimension mismatch: ${a.length} vs ${b.length}`)
  }

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB)
  if (denominator === 0) return 0
  return dotProduct / denominator
}
