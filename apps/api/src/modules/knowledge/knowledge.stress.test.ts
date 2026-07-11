import { describe, it, expect, beforeEach } from 'vitest'
/**
 * 🐜 自动: [knowledge] [D] controller spec 补全 - 压力/韧性测试
 *
 * 覆盖边界场景:
 * - 高吞吐索引 (大量文档同时索引)
 * - 极端输入值 (超大内容、空内容、特殊字符)
 * - 快速连续查询 (语义搜索吞吐)
 * - 长时间操作的内存稳定性
 */

import assert from 'node:assert/strict'
import { KnowledgeService } from './knowledge.service'
import { KnowledgeIndexerService } from './knowledge-indexer.service'

function makeService(): KnowledgeService {
  return new KnowledgeService(new KnowledgeIndexerService())
}

describe('Knowledge - Stress & Resilience', () => {
  let service: KnowledgeService

  beforeEach(() => {
    service = makeService()
  })

  // ─── 高吞吐批量索引 ───

  describe('高吞吐批量索引', () => {
    it('同时索引 100 个文档不崩溃', () => {
      for (let i = 0; i < 100; i++) {
        const result = service.indexDocument({
          sourcePath: `docs/stress-${i}.md`,
          content: `# Document ${i}\n\nThis is stress test document number ${i}.\n\n## Section A\n\nContent for section A of document ${i}. Repeat repeat repeat.`,
          kind: 'doc',
        })
        assert.ok(result.chunks >= 1)
        assert.ok(result.documentId.startsWith('doc-'))
      }

      const stats = service.getStats()
      assert.equal(stats.totalDocuments, 100)
      assert.ok(stats.totalChunks >= 100)
    })

    it('批量不同类型文档保持统计正确', () => {
      const kinds = ['spec', 'lesson', 'pattern', 'decision', 'anti-pattern', 'doc'] as const
      let count = 0
      for (let i = 0; i < 60; i++) {
        const kind = kinds[i % kinds.length]
        service.indexDocument({
          sourcePath: `batch/${kind}/${i}.md`,
          content: `# ${kind} ${i}\n\nBatch test content for kind ${kind}.`,
          kind,
        })
        count++
      }

      const stats = service.getStats()
      assert.equal(stats.totalDocuments, 60)

      // Verify byKind counts
      for (const kind of kinds) {
        assert.equal(stats.byKind[kind], 10, `expected 10 documents of kind ${kind}`)
      }
    })

    it('幂等索引: 重复索引相同 sourcePath 应复用 documentId', () => {
      const r1 = service.indexDocument({
        sourcePath: 'idempotent/doc.md',
        content: '# V1\n\nFirst version.',
        kind: 'doc',
      })
      // 重复 10 次
      for (let i = 0; i < 10; i++) {
        const rn = service.indexDocument({
          sourcePath: 'idempotent/doc.md',
          content: `# V${i + 2}\n\nVersion ${i + 2}.`,
          kind: 'doc',
        })
        assert.equal(rn.documentId, r1.documentId)
      }

      // 应只有 1 个文档
      const docs = service.listDocuments()
      assert.equal(docs.length, 1)
    })
  })

  // ─── 极端输入值 ───

  describe('极端输入值', () => {
    it('超大文档内容不崩溃', () => {
      const hugeContent = '# Huge Doc\n' + Array.from({ length: 500 }, (_, i) => `## Section ${i}\n\nContent for section ${i}. ${'word '.repeat(200)}`).join('\n')
      const result = service.indexDocument({
        sourcePath: 'huge/doc.md',
        content: hugeContent,
        kind: 'doc',
      })
      assert.ok(result.chunks >= 10) // 大文档应被切成多个 chunk
      assert.ok(result.documentId.startsWith('doc-'))
    })

    it('空内容文档不崩溃', () => {
      const result = service.indexDocument({
        sourcePath: 'empty/doc.md',
        content: '',
        kind: 'doc',
      })
      assert.ok(result.chunks >= 0)
      assert.ok(result.documentId.startsWith('doc-'))
    })

    it('纯特殊字符内容不崩溃', () => {
      const specials = [
        '###\n@@@\n!!!\n***',
        '\0\n\x00\n\x01',
        '\n'.repeat(1000),
        '\t'.repeat(500),
        '\\n\\n\\n\\n',
        'a'.repeat(10000),
        ' '.repeat(10000),
      ]
      for (const content of specials) {
        const result = service.indexDocument({
          sourcePath: `special/${content.slice(0, 5)}.md`,
          content,
          kind: 'doc',
        })
        assert.ok(result.chunks >= 0)
      }
    })

    it('超大 sourcePath 不崩溃', () => {
      const longPath = 'a/'.repeat(100) + 'doc.md'
      const result = service.indexDocument({
        sourcePath: longPath,
        content: '# Long Path\n\nTest.',
        kind: 'doc',
      })
      assert.ok(result.chunks >= 1)
    })

    it('注入式内容不影响索引', () => {
      const injections = [
        '<script>alert(1)</script>',
        '{{7*7}}',
        "' OR '1'='1",
        '../../etc/passwd',
        '__proto__',
        'constructor',
      ]
      for (const inj of injections) {
        const result = service.indexDocument({
          sourcePath: `inject/${inj.replace(/[^a-zA-Z0-9]/g, '_')}.md`,
          content: `# Injection\n\n${inj}`,
          kind: 'doc',
        })
        assert.ok(result.chunks >= 1)
      }
    })
  })

  // ─── 高吞吐查询 ───

  describe('高吞吐语义查询', () => {
    beforeEach(() => {
      // 预索引一些文档
      const docs = [
        { path: 'docs/ai.md', content: '# AI Platform\n\nArtificial Intelligence platform for gaming.\n\n## Features\n\nRule engine, recommendations, content generation.' },
        { path: 'docs/payment.md', content: '# Payment System\n\nPayment gateway integration.\n\n## Methods\n\nAlipay, WeChat Pay, credit card.' },
        { path: 'docs/membership.md', content: '# Membership\n\nMember level management.\n\n## Tiers\n\nRegular, VIP, SVIP.' },
        { path: 'docs/marketing.md', content: '# Marketing\n\nCampaign management and analytics.\n\n## Channels\n\nEmail, SMS, push notifications.' },
        { path: 'docs/analytics.md', content: '# Analytics\n\nData analysis and reporting.\n\n## Metrics\n\nDAU, MAU, ARPU, conversion rates.' },
        { path: 'docs/security.md', content: '# Security\n\nSecurity policies and compliance.\n\n## Protocols\n\nEncryption, audit logging, access control.' },
        { path: 'docs/deploy.md', content: '# Deployment\n\nCI/CD pipeline and deployment strategies.\n\n## Environments\n\nDev, staging, production, canary.' },
        { path: 'docs/monitor.md', content: '# Monitoring\n\nSystem monitoring and alerting.\n\n## Metrics\n\nCPU, memory, disk, network, error rate.' },
        { path: 'docs/backup.md', content: '# Backup\n\nData backup and disaster recovery.\n\n## Strategy\n\nDaily full, hourly incremental backups.' },
        { path: 'docs/audit.md', content: '# Audit\n\nAudit logging and compliance reporting.\n\n## Logs\n\nUser actions, system events, data changes.' },
      ]
      for (const doc of docs) {
        service.indexDocument({
          sourcePath: doc.path,
          content: doc.content,
          kind: 'doc',
        })
      }
    })

    it('连续查询 50 次不崩溃', () => {
      const queries = [
        'AI rule engine', 'payment method', 'member VIP',
        'marketing campaign', 'data analytics', 'security',
        'deployment pipeline', 'monitoring metrics', 'backup recovery',
        'audit log', 'performance', 'alerts', 'user management',
        'reporting', 'machine learning', 'architecture',
      ]

      for (let round = 0; round < 3; round++) {
        for (const q of queries) {
          const result = service.query({ query: q, topK: 3 })
          assert.ok(result.results.length >= 0)
          assert.ok(result.results.length <= 3)
          assert.ok(result.durationMs >= 0)
          assert.ok(result.totalCandidates >= 0)
          assert.equal(result.query, q)
        }
      }
    })

    it('空查询字符串不崩溃', () => {
      const result = service.query({ query: '', topK: 5 })
      // 空查询可能返回低分结果或空列表
      assert.ok(Array.isArray(result.results))
    })

    it('查询超长字符串不崩溃', () => {
      const result = service.query({ query: 'a'.repeat(10000), topK: 5 })
      assert.ok(Array.isArray(result.results))
    })

    it('查询特殊字符不崩溃', () => {
      const queries = ['', '\n', '\t', '{}', '[]', '!@#$%^&*()', '\0']
      for (const q of queries) {
        const result = service.query({ query: q, topK: 3 })
        assert.ok(Array.isArray(result.results))
      }
    })

    it('高 topK 值不崩溃', () => {
      const result = service.query({ query: 'test', topK: 1000 })
      assert.ok(result.results.length <= 10) // 上限为已索引文档的 chunk 数
    })

    it('kindFilter + query 组合过滤正确', () => {
      // 所有文档都是 kind=doc
      const result = service.query({ query: 'AI', kindFilter: 'doc', topK: 5 })
      assert.ok(result.results.length >= 1)

      // 不存在 kind 应返回空
      const noResult = service.query({ query: 'AI', kindFilter: 'lesson', topK: 5 })
      assert.equal(noResult.results.length, 0)
    })
  })

  // ─── 大文档 + 查询 + 统计混合操作 ───

  describe('混合操作压力', () => {
    it('反复索引 + 查询 + 统计不崩溃', () => {
      // 5 轮: 每轮索引 10 个文档,执行 5 次查询,获取 2 次统计
      for (let round = 0; round < 5; round++) {
        for (let i = 0; i < 10; i++) {
          service.indexDocument({
            sourcePath: `mix/round-${round}/doc-${i}.md`,
            content: `# Round ${round} Doc ${i}\n\nMixed stress test operation.\n\n## Details\n\n${'content '.repeat(i * 5)}`,
            kind: 'doc',
          })
        }

        const queries = ['mixed', 'stress test', 'documents', 'content', 'operations']
        for (const q of queries) {
          service.query({ query: q, topK: 3 })
        }

        const stats1 = service.getStats()
        assert.ok(stats1.totalDocuments >= 10 * (round + 1))

        const suggestions = service.getSuggestions({ query: 'test', maxSuggestions: 3 })
        assert.ok(suggestions.length >= 0)
        assert.ok(suggestions.length <= 3)
      }
    })

    it('索引后立即查询结果时效性', () => {
      service.indexDocument({
        sourcePath: 'timely/doc.md',
        content: '# Fresh Index\n\nThis is freshly indexed content for query testing.\n\n## Keywords\n\nfresh, index, query, immediate.',
        kind: 'doc',
      })

      const result = service.query({ query: 'fresh index', topK: 5 })
      assert.ok(result.results.length >= 1)
      // 第一条结果应该与插入内容最相关（cosine similarity > 0）
      assert.ok(result.results[0].score > 0)
    })
  })

  // ─── 文档管理压力 ───

  describe('文档管理压力', () => {
    it('索引大量文档后 listDocuments 不超时', () => {
      for (let i = 0; i < 200; i++) {
        service.indexDocument({
          sourcePath: `listtest/doc-${i}.md`,
          content: `# Doc ${i}\n\nContent for listing test.`,
          kind: 'doc',
        })
      }

      const docs = service.listDocuments()
      assert.equal(docs.length, 200)
    })

    it('删除不存在的文档返回 false', () => {
      const result = service.deleteDocument('non-existent-id')
      assert.equal(result, false)
    })

    it('按 kind 过滤后查询结果正确', () => {
      service.indexDocument({ sourcePath: 'specs/api.md', content: '# API Spec\n\nREST API documentation.', kind: 'spec' })
      service.indexDocument({ sourcePath: 'lessons/learn.md', content: '# Lesson\n\nLearning material.', kind: 'lesson' })

      const specDocs = service.listByKind('spec')
      assert.equal(specDocs.length, 1)
      assert.equal(specDocs[0].kind, 'spec')

      const lessonDocs = service.listByKind('lesson')
      assert.equal(lessonDocs.length, 1)
      assert.equal(lessonDocs[0].kind, 'lesson')
    })

    it('findBySourcePath 在大量文档中正确查找', () => {
      for (let i = 0; i < 100; i++) {
        service.indexDocument({
          sourcePath: `findtest/doc-${i}.md`,
          content: `# Doc ${i}\n\nFinding test content.`,
          kind: 'doc',
        })
      }

      const found = service.findBySourcePath('findtest/doc-42.md')
      assert.ok(found !== null)
      assert.ok(found.sourcePath.endsWith('doc-42.md'))

      const notFound = service.findBySourcePath('findtest/nonexistent.md')
      assert.equal(notFound, null)
    })
  })

  // ─── 引擎/服务重置韧性 ───

  describe('服务重置与状态恢复', () => {
    it('reset 后所有数据清空', () => {
      service.indexDocument({ sourcePath: 'reset/doc.md', content: '# Reset\n\nTo be cleared.', kind: 'doc' })
      assert.ok(service.listDocuments().length > 0)

      service.reset()
      assert.equal(service.listDocuments().length, 0)

      const stats = service.getStats()
      assert.equal(stats.totalDocuments, 0)
      assert.equal(stats.totalChunks, 0)
    })

    it('reset 后重新索引正常工作', () => {
      service.indexDocument({ sourcePath: 'reset/doc1.md', content: '# Doc 1\n\nBefore reset.', kind: 'doc' })
      service.reset()

      service.indexDocument({ sourcePath: 'reset/doc2.md', content: '# Doc 2\n\nAfter reset.', kind: 'doc' })
      const docs = service.listDocuments()
      assert.equal(docs.length, 1)
      assert.ok(docs[0].sourcePath.includes('doc2'))
    })
  })

  // ─── 幂等性与稳定性 ───

  describe('幂等性与结果稳定性', () => {
    it('相同输入索引应产生相同 chunk 数量', () => {
      const input = {
        sourcePath: 'stable/doc.md',
        content: '# Stable\n\nStable content for testing.\n\n## Section 1\n\nContent here.',
        kind: 'doc' as const,
      }
      // 首次索引后删除再重建
      const r1 = service.indexDocument(input)
      service.reset()
      const r2 = service.indexDocument(input)

      assert.equal(r1.chunks, r2.chunks)
    })

    it('相同查询在不同时间返回相同排序', () => {
      service.indexDocument({
        sourcePath: 'stable/docs.md',
        content: '# Docs\n\nThis is a test document about query stability.\n\n## More\n\nAdditional content for testing.',
        kind: 'doc',
      })

      const r1 = service.query({ query: 'test document', topK: 5 })
      const r2 = service.query({ query: 'test document', topK: 5 })

      assert.equal(r1.results.length, r2.results.length)
      if (r1.results.length > 0) {
        assert.equal(r1.results[0].id, r2.results[0].id)
        assert.equal(r1.results[0].score, r2.results[0].score)
      }
    })

    it('getSuggestions 调用多次结果一致', () => {
      service.indexDocument({
        sourcePath: 'stable/suggest.md',
        content: '# Suggestion\n\nSuggestion test content for knowledge base.',
        kind: 'doc',
      })

      const s1 = service.getSuggestions({ query: 'suggestion', maxSuggestions: 2 })
      const s2 = service.getSuggestions({ query: 'suggestion', maxSuggestions: 2 })

      assert.equal(s1.length, s2.length)
    })
  })

  // ─── 边界: kind 校验 ───

  describe('kind 校验边界', () => {
    it('isValidKind 对已知 kind 返回 true', () => {
      const validKinds = ['spec', 'lesson', 'pattern', 'decision', 'anti-pattern', 'doc']
      for (const k of validKinds) {
        assert.ok(service.isValidKind(k), `${k} should be valid`)
      }
    })

    it('isValidKind 对非法 kind 返回 false', () => {
      const invalidKinds = ['', 'unknown', 'SPEC', 'Doc', 'lesson ', null, undefined]
      for (const k of invalidKinds) {
        assert.equal(service.isValidKind(k as string), false)
      }
    })
  })
})
