/**
 * db-knowledge.service.spec.ts — 数据库知识库服务 V23 全覆盖测试
 *
 * 覆盖:
 *   - available 属性 (无 DB 时 false)
 *   - search (无 DB 时返回 [])
 *   - getDocumentsByKind / getExperts / getRecentPulses / getActivePhases
 *   - getPatterns / getVenuesByCity / getTodayBrief
 *   - logSearch
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { DbKnowledgeService } from './db-knowledge.service'

describe('DbKnowledgeService', () => {
  let service: DbKnowledgeService

  beforeEach(() => {
    service = new DbKnowledgeService()
  })

  // ── available ────────────────────────────────────────────────────────────

  describe('available', () => {
    it('正例: 无 PostgreSQL 连接时应返回 false', () => {
      expect(service.available).toBe(false)
    })
  })

  // ── search ───────────────────────────────────────────────────────────────

  describe('search', () => {
    it('异常: 无 DB 连接时应返回空数组', async () => {
      const results = await service.search('test')
      expect(results).toEqual([])
    })
  })

  // ── getDocumentsByKind ───────────────────────────────────────────────────

  describe('getDocumentsByKind', () => {
    it('异常: 无 DB 连接时应返回空数组', async () => {
      const results = await service.getDocumentsByKind('api-doc')
      expect(results).toEqual([])
    })
  })

  // ── getExperts ───────────────────────────────────────────────────────────

  describe('getExperts', () => {
    it('异常: 无 DB 连接时应返回空数组', async () => {
      const results = await service.getExperts()
      expect(results).toEqual([])
    })

    it('正例: 无 DB 时按 groupId 筛选也应返回空', async () => {
      const results = await service.getExperts('group-1')
      expect(results).toEqual([])
    })
  })

  // ── getRecentPulses ──────────────────────────────────────────────────────

  describe('getRecentPulses', () => {
    it('异常: 无 DB 连接时应返回空数组', async () => {
      const results = await service.getRecentPulses()
      expect(results).toEqual([])
    })

    it('正例: 自定义 limit 参数也应容错', async () => {
      const results = await service.getRecentPulses(5)
      expect(results).toEqual([])
    })
  })

  // ── getActivePhases ──────────────────────────────────────────────────────

  describe('getActivePhases', () => {
    it('异常: 无 DB 连接时应返回空数组', async () => {
      const results = await service.getActivePhases()
      expect(results).toEqual([])
    })
  })

  // ── getPatterns ──────────────────────────────────────────────────────────

  describe('getPatterns', () => {
    it('异常: 无 DB 连接时应返回空数组', async () => {
      const results = await service.getPatterns()
      expect(results).toEqual([])
    })

    it('正例: 按类型筛选也应容错', async () => {
      const results = await service.getPatterns('anti-pattern')
      expect(results).toEqual([])
    })
  })

  // ── getVenuesByCity ──────────────────────────────────────────────────────

  describe('getVenuesByCity', () => {
    it('异常: 无 DB 连接时应返回空数组', async () => {
      const results = await service.getVenuesByCity('北京')
      expect(results).toEqual([])
    })
  })

  // ── getTodayBrief ────────────────────────────────────────────────────────

  describe('getTodayBrief', () => {
    it('异常: 无 DB 连接时应返回 null', async () => {
      const result = await service.getTodayBrief()
      expect(result).toBeNull()
    })
  })

  // ── logSearch ────────────────────────────────────────────────────────────

  describe('logSearch', () => {
    it('异常: 无 DB 连接时不应抛错', async () => {
      await expect(service.logSearch('test query', 5, 120)).resolves.toBeUndefined()
    })
  })
})
