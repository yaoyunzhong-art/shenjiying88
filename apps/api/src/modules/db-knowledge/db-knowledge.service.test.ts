/**
 * db-knowledge.service.test.ts — DB Knowledge 服务单元测试
 *
 * 🐜 V17: thin-module-test-batch
 *
 * 覆盖:
 *   正例 × 8: 各方法存在性 / 降级行为
 *   反例 × 4: DB 不可用时优雅降级
 *   边界 × 2: 空查询 / 超大 limit
 */

import { describe, it, expect } from 'vitest'
import { DbKnowledgeService } from './db-knowledge.service'

describe('DbKnowledgeService', () => {
  // ── 正例 (8) ────────────────────────────────────────────────

  it('available 为 false（默认因 pg-pool 不可用）', () => {
    const svc = new DbKnowledgeService()
    expect(svc.available).toBe(false)
  })

  it('search 在 DB 不可用时返回空数组', async () => {
    const svc = new DbKnowledgeService()
    const result = await svc.search('测试')
    expect(Array.isArray(result)).toBe(true)
    expect(result).toHaveLength(0)
  })

  it('getDocumentsByKind 在 DB 不可用时返回空数组', async () => {
    const svc = new DbKnowledgeService()
    const result = await svc.getDocumentsByKind('guide')
    expect(Array.isArray(result)).toBe(true)
    expect(result).toHaveLength(0)
  })

  it('getExperts 在 DB 不可用时返回空数组', async () => {
    const svc = new DbKnowledgeService()
    const result = await svc.getExperts()
    expect(Array.isArray(result)).toBe(true)
    expect(result).toHaveLength(0)
  })

  it('getRecentPulses 在 DB 不可用时返回空数组', async () => {
    const svc = new DbKnowledgeService()
    const result = await svc.getRecentPulses()
    expect(Array.isArray(result)).toBe(true)
    expect(result).toHaveLength(0)
  })

  it('getActivePhases 在 DB 不可用时返回空数组', async () => {
    const svc = new DbKnowledgeService()
    const result = await svc.getActivePhases()
    expect(Array.isArray(result)).toBe(true)
    expect(result).toHaveLength(0)
  })

  it('getPatterns 在 DB 不可用时返回空数组', async () => {
    const svc = new DbKnowledgeService()
    const result = await svc.getPatterns('anti-pattern')
    expect(Array.isArray(result)).toBe(true)
    expect(result).toHaveLength(0)
  })

  it('getVenuesByCity 在 DB 不可用时返回空数组', async () => {
    const svc = new DbKnowledgeService()
    const result = await svc.getVenuesByCity('上海')
    expect(Array.isArray(result)).toBe(true)
    expect(result).toHaveLength(0)
  })

  // ── 反例 (4) ────────────────────────────────────────────────

  it('getTodayBrief 在 DB 不可用时返回 null', async () => {
    const svc = new DbKnowledgeService()
    const result = await svc.getTodayBrief()
    expect(result).toBeNull()
  })

  it('logSearch 在 DB 不可用时静默忽略', async () => {
    const svc = new DbKnowledgeService()
    await expect(
      svc.logSearch('test', 0, 0)
    ).resolves.toBeUndefined()
  })

  it('search 传空字符串不抛异常', async () => {
    const svc = new DbKnowledgeService()
    const result = await svc.search('')
    expect(Array.isArray(result)).toBe(true)
  })

  it('getDocumentsByKind 传空字符串不抛异常', async () => {
    const svc = new DbKnowledgeService()
    const result = await svc.getDocumentsByKind('')
    expect(Array.isArray(result)).toBe(true)
  })

  // ── 边界 (2) ────────────────────────────────────────────────

  it('getRecentPulses 传超大 limit 不抛异常', async () => {
    const svc = new DbKnowledgeService()
    const result = await svc.getRecentPulses(99999)
    expect(Array.isArray(result)).toBe(true)
  })

  it('getPatterns 传 undefined type 返回空数组', async () => {
    const svc = new DbKnowledgeService()
    const result = await svc.getPatterns(undefined)
    expect(Array.isArray(result)).toBe(true)
  })
})
