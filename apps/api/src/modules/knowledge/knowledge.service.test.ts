import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
/**
 * knowledge.service.test.ts — 知识库服务层测试
 *
 * 覆盖:
 * - indexDocument (新增/幂等/空内容/大文档)
 * - query (语义查询/过滤)
 * - getSuggestions
 * - listDocuments / getDocument / findBySourcePath / listByKind
 * - getStats / deleteDocument / isValidKind / reset
 */

import { KnowledgeService } from './knowledge.service'
import { KnowledgeIndexerService } from './knowledge-indexer.service'

function freshService(): KnowledgeService {
  return new KnowledgeService(new KnowledgeIndexerService())
}

describe('KnowledgeService', () => {
  let service: KnowledgeService

  beforeEach(() => {
    service = freshService()
  })

  // ── indexDocument ──

  describe('indexDocument', () => {
    it('应索引文档并返回 chunk 数和 documentId', () => {
      const result = service.indexDocument({
        sourcePath: 'guides/onboarding.md',
        content: '# Onboarding\n\nWelcome to the platform!\n\n## Quick Start\n\nRun pnpm dev.',
        kind: 'doc',
      })
      expect(result.chunks).toBeGreaterThanOrEqual(1)
      expect(result.documentId).toBeDefined()
      expect(result.documentId).toMatch(/^doc-/)
    })

    it('应保持索引幂等: 同 sourcePath 覆盖更新', () => {
      const r1 = service.indexDocument({
        sourcePath: 'docs/same.md',
        content: '# V1\n\nFirst version.',
        kind: 'doc',
      })
      const r2 = service.indexDocument({
        sourcePath: 'docs/same.md',
        content: '# V2\n\nUpdated version.\n\nMore content here.',
        kind: 'doc',
      })
      // 同路径应复用相同 documentId
      expect(r2.documentId).toBe(r1.documentId)
      // 更新后 chunk 数可能变化
      expect(r2.chunks).toBeGreaterThanOrEqual(1)
    })

    it('应支持不同 kind 类型', () => {
      const kinds = ['spec', 'lesson', 'pattern', 'decision', 'anti-pattern', 'doc'] as const
      for (const kind of kinds) {
        const result = service.indexDocument({
          sourcePath: `${kind}.md`,
          content: `# ${kind}\n\nTest content for ${kind}.`,
          kind,
        })
        expect(result.chunks).toBeGreaterThanOrEqual(1)
      }
    })

    it('应处理空内容', () => {
      const result = service.indexDocument({
        sourcePath: 'empty.md',
        content: '',
        kind: 'doc',
      })
      expect(result.chunks).toBeGreaterThanOrEqual(0)
    })

    it('应处理大文档 (跨 chunk)', () => {
      const bigContent = `# Big Doc\n\n${'word '.repeat(1000)}\n\n## Section 2\n\n${'data '.repeat(500)}`
      const result = service.indexDocument({
        sourcePath: 'big.md',
        content: bigContent,
        kind: 'spec',
      })
      expect(result.chunks).toBeGreaterThanOrEqual(2)
    })

    it('应支持 tags 参数', () => {
      const result = service.indexDocument({
        sourcePath: 'tagged.md',
        content: '# Tagged\n\nWith tags.',
        kind: 'pattern',
        tags: ['v2', 'refactor'],
      })
      expect(result.chunks).toBeGreaterThanOrEqual(1)
    })
  })

  // ── query ──

  describe('query', () => {
    it('索引后查询应返回匹配结果', () => {
      service.indexDocument({
        sourcePath: 'a.md',
        content: '# A\n\ndouble increment bug found in quota calculation.',
        kind: 'lesson',
      })
      const resp = service.query({ query: 'quota double increment', topK: 5 })
      expect(resp.results.length).toBeGreaterThan(0)
      expect(resp.results[0].score).toBeGreaterThan(0)
      expect(resp.query).toBe('quota double increment')
      expect(resp.totalCandidates).toBeGreaterThanOrEqual(1)
    })

    it('无匹配时返回空列表', () => {
      service.indexDocument({
        sourcePath: 'a.md',
        content: '# A\n\nOnly cats and dogs.',
        kind: 'doc',
      })
      const resp = service.query({ query: 'quantum physics', topK: 3, minScore: 0.9 })
      expect(resp.results).toHaveLength(0)
    })

    it('kindFilter 过滤正确', () => {
      service.indexDocument({
        sourcePath: 'spec.md',
        content: '# Spec\n\nSpec content for API.',
        kind: 'spec',
      })
      service.indexDocument({
        sourcePath: 'lesson.md',
        content: '# Lesson\n\nLesson content for API.',
        kind: 'lesson',
      })
      const resp = service.query({ query: 'content', topK: 5, kindFilter: 'spec' })
      for (const r of resp.results) {
        expect(r.kind).toBe('spec')
      }
    })
  })

  // ── getSuggestions ──

  describe('getSuggestions', () => {
    it('应返回补全建议', () => {
      service.indexDocument({
        sourcePath: 'guide.md',
        content: '# Guide\n\nThis is a guide about membership tier upgrade.',
        kind: 'doc',
      })
      service.indexDocument({
        sourcePath: 'faq.md',
        content: '# FAQ\n\nMembership tier requires monthly spending.',
        kind: 'doc',
      })
      const suggestions = service.getSuggestions({ query: 'membership tier', maxSuggestions: 2 })
      expect(suggestions.length).toBeLessThanOrEqual(2)
      if (suggestions.length > 0) {
        expect(suggestions[0].sourcePath).toBeDefined()
        expect(suggestions[0].title).toBeDefined()
        expect(suggestions[0].snippet).toBeDefined()
        expect(suggestions[0].score).toBeGreaterThan(0)
      }
    })

    it('无索引时返回空列表', () => {
      const suggestions = service.getSuggestions({ query: 'anything', maxSuggestions: 5 })
      expect(suggestions).toHaveLength(0)
    })

    it('默认 maxSuggestions 为 3', () => {
      service.indexDocument({
        sourcePath: 'a.md',
        content: '# A\n\nContent A about important topics.',
        kind: 'doc',
      })
      service.indexDocument({
        sourcePath: 'b.md',
        content: '# B\n\nContent B about important topics.',
        kind: 'doc',
      })
      service.indexDocument({
        sourcePath: 'c.md',
        content: '# C\n\nContent C about important topics.',
        kind: 'doc',
      })
      const suggestions = service.getSuggestions({ query: 'important' })
      expect(suggestions.length).toBeLessThanOrEqual(3)
    })
  })

  // ── listDocuments ──

  describe('listDocuments', () => {
    it('空索引返回空列表', () => {
      const docs = service.listDocuments()
      expect(docs).toHaveLength(0)
    })

    it('索引后应返回文档列表', () => {
      service.indexDocument({
        sourcePath: 'a.md',
        content: '# A\n\nContent.',
        kind: 'lesson',
      })
      const docs = service.listDocuments()
      expect(docs.length).toBeGreaterThanOrEqual(1)
      expect(docs[0].kind).toBe('lesson')
      expect(docs[0].title).toBe('A')
    })

    it('返回的每个文档应包含必要字段', () => {
      service.indexDocument({
        sourcePath: 'validate.md',
        content: '# Validate\n\nTest field schema.',
        kind: 'spec',
        tags: ['api'],
      })
      const docs = service.listDocuments()
      for (const doc of docs) {
        expect(doc.id).toBeDefined()
        expect(doc.title).toBeDefined()
        expect(doc.kind).toBeDefined()
        expect(Array.isArray(doc.tags)).toBe(true)
        expect(typeof doc.chunkCount).toBe('number')
        expect(typeof doc.createdAt).toBe('string')
        expect(Date.parse(doc.createdAt)).toBeGreaterThan(0)
      }
    })
  })

  // ── getDocument ──

  describe('getDocument', () => {
    it('应返回存在的文档', () => {
      const { documentId } = service.indexDocument({
        sourcePath: 'a.md',
        content: '# A\n\nContent.',
        kind: 'pattern',
      })
      const doc = service.getDocument(documentId)
      expect(doc).not.toBeNull()
      expect(doc!.id).toBe(documentId)
      expect(doc!.kind).toBe('pattern')
    })

    it('不存在时返回 null', () => {
      const doc = service.getDocument('non-existent')
      expect(doc).toBeNull()
    })
  })

  // ── findBySourcePath ──

  describe('findBySourcePath', () => {
    it('应按路径找到文档', () => {
      service.indexDocument({
        sourcePath: 'pkg/README.md',
        content: '# Readme\n\nDoc.',
        kind: 'doc',
      })
      const doc = service.findBySourcePath('pkg/README.md')
      expect(doc).not.toBeNull()
      expect(doc!.sourcePath).toBe('pkg/README.md') // DTO 包含 sourcePath
      expect(doc!.title).toBe('Readme')
    })

    it('不存在时返回 null', () => {
      const doc = service.findBySourcePath('missing/file.md')
      expect(doc).toBeNull()
    })
  })

  // ── listByKind ──

  describe('listByKind', () => {
    it('按 kind 过滤文档', () => {
      service.indexDocument({ sourcePath: 's.md', content: '# S\n\nContent.', kind: 'spec' })
      service.indexDocument({ sourcePath: 'l.md', content: '# L\n\nContent.', kind: 'lesson' })
      const specs = service.listByKind('spec')
      expect(specs.length).toBe(1)
      expect(specs[0].kind).toBe('spec')
    })

    it('无匹配时返回空列表', () => {
      const docs = service.listByKind('doc')
      expect(docs).toHaveLength(0)
    })
  })

  // ── getStats ──

  describe('getStats', () => {
    it('空索引应返回零值', () => {
      const stats = service.getStats()
      expect(stats.totalDocuments).toBe(0)
      expect(stats.totalChunks).toBe(0)
    })

    it('索引后统计正确', () => {
      service.indexDocument({
        sourcePath: 'a.md',
        content: '# A\n\nContent.',
        kind: 'lesson',
      })
      const stats = service.getStats()
      expect(stats.totalDocuments).toBe(1)
      expect(stats.totalChunks).toBeGreaterThanOrEqual(1)
    })
  })

  // ── deleteDocument ──

  describe('deleteDocument', () => {
    it('删除存在的文档返回 true', () => {
      const { documentId } = service.indexDocument({
        sourcePath: 'del.md',
        content: '# Del\n\nTo be deleted.',
        kind: 'doc',
      })
      expect(service.deleteDocument(documentId)).toBe(true)
      expect(service.getDocument(documentId)).toBeNull()
    })

    it('删除不存在的文档返回 false', () => {
      expect(service.deleteDocument('non-existent')).toBe(false)
    })
  })

  // ── isValidKind ──

  describe('isValidKind', () => {
    it('应识别合法 kind', () => {
      expect(service.isValidKind('spec')).toBe(true)
      expect(service.isValidKind('lesson')).toBe(true)
      expect(service.isValidKind('pattern')).toBe(true)
      expect(service.isValidKind('decision')).toBe(true)
      expect(service.isValidKind('anti-pattern')).toBe(true)
      expect(service.isValidKind('doc')).toBe(true)
    })

    it('应拒绝非法 kind', () => {
      expect(service.isValidKind('invalid')).toBe(false)
      expect(service.isValidKind('')).toBe(false)
      expect(service.isValidKind('Spec')).toBe(false) // 大小写敏感
    })
  })

  // ── reset ──

  describe('reset', () => {
    it('应清空所有数据', () => {
      service.indexDocument({
        sourcePath: 'a.md',
        content: '# A\n\nContent.',
        kind: 'doc',
      })
      service.reset()
      expect(service.listDocuments()).toHaveLength(0)
      const stats = service.getStats()
      expect(stats.totalDocuments).toBe(0)
      expect(stats.totalChunks).toBe(0)
    })

    it('reset 后应可重新索引', () => {
      service.indexDocument({ sourcePath: 'a.md', content: '# A\n\nFirst.', kind: 'doc' })
      service.reset()
      const result = service.indexDocument({ sourcePath: 'b.md', content: '# B\n\nSecond.', kind: 'doc' })
      expect(result.chunks).toBeGreaterThanOrEqual(1)
      expect(service.listDocuments()).toHaveLength(1)
    })
  })
})
