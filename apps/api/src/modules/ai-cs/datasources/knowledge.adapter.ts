import { Injectable } from '@nestjs/common'
import type { Knowledge } from '../ai-cs.entity'

@Injectable()
export class KnowledgeAdapter {
  private knowledge = new Map<string, Knowledge>()

  seed(items: Knowledge[]): void {
    for (const k of items) {
      this.knowledge.set(k.id, { ...k })
    }
  }

  add(item: Knowledge): Knowledge {
    if (this.knowledge.has(item.id)) {
      throw new Error(`Knowledge ${item.id} already exists`)
    }
    this.knowledge.set(item.id, { ...item })
    return item
  }

  query(tenantId: string, knowledgeId: string): Knowledge | null {
    const k = this.knowledge.get(knowledgeId)
    if (!k || k.tenantId !== tenantId) return null
    return { ...k }
  }

  queryByCategory(tenantId: string, category: string): Knowledge[] {
    return Array.from(this.knowledge.values())
      .filter(k => k.tenantId === tenantId && k.category === category)
      .map(k => ({ ...k }))
  }

  queryAll(tenantId: string): Knowledge[] {
    return Array.from(this.knowledge.values())
      .filter(k => k.tenantId === tenantId)
      .map(k => ({ ...k }))
  }

  search(tenantId: string, query: string, topK: number = 5, threshold: number = 0.3): Knowledge[] {
    const candidates = this.queryAll(tenantId)
    const queryTokens = this.tokenize(query)
    if (queryTokens.length === 0) return []

    const scored = candidates.map(k => {
      const contentTokens = this.tokenize(`${k.title} ${k.content} ${k.tags.join(' ')}`)
      const similarity = this.cosineSimilarity(queryTokens, contentTokens)
      return { k, similarity }
    })

    return scored
      .filter(s => s.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK)
      .map(s => ({ ...s.k, metadata: { ...s.k.metadata, viewCount: s.k.metadata.viewCount + 1 } }))
  }

  searchByKeyword(tenantId: string, keyword: string): Knowledge[] {
    const lower = keyword.toLowerCase()
    return Array.from(this.knowledge.values())
      .filter(k => k.tenantId === tenantId &&
        (k.title.toLowerCase().includes(lower) ||
         k.content.toLowerCase().includes(lower) ||
         k.tags.some(t => t.toLowerCase().includes(lower))))
      .map(k => ({ ...k }))
  }

  incrementHelpful(tenantId: string, knowledgeId: string): Knowledge {
    const k = this.knowledge.get(knowledgeId)
    if (!k || k.tenantId !== tenantId) {
      throw new Error(`Knowledge ${knowledgeId} not found in tenant ${tenantId}`)
    }
    k.metadata.helpfulCount++
    return { ...k }
  }

  reset(): void {
    this.knowledge.clear()
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s\u4e00-\u9fa5]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 1)
  }

  private cosineSimilarity(a: string[], b: string[]): number {
    const setA = new Set(a)
    const setB = new Set(b)
    const allTokens = new Set([...setA, ...setB])

    let dotProduct = 0
    let normA = 0
    let normB = 0
    for (const t of allTokens) {
      const inA = setA.has(t) ? 1 : 0
      const inB = setB.has(t) ? 1 : 0
      dotProduct += inA * inB
      normA += inA * inA
      normB += inB * inB
    }

    if (normA === 0 || normB === 0) return 0
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
  }
}