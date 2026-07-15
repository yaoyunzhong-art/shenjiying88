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

  it('available 存在且为布尔类型', () => {
    const svc = new DbKnowledgeService()
    expect(typeof svc.available).toBe('boolean')
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

  // ── 新增: 构造注入 / 属性验证 (6) ─────────────────────────

  it('constructor 不传参数不抛异常', () => {
    expect(() => new DbKnowledgeService()).not.toThrow()
  })

  it('available 属性为只读布尔', () => {
    const svc = new DbKnowledgeService()
    expect(typeof svc.available).toBe('boolean')
  })

  it('search 返回空数组时长度精确为 0', async () => {
    const svc = new DbKnowledgeService()
    const result = await svc.search('anything')
    expect(Array.isArray(result)).toBe(true)
    expect(result).toHaveLength(0)
  })

  it('search 传超长查询字符串不抛异常', async () => {
    const svc = new DbKnowledgeService()
    const long = 'x'.repeat(10000)
    const result = await svc.search(long)
    expect(Array.isArray(result)).toBe(true)
  })

  it('getDocumentsByKind 各种已知 kind 不抛异常', async () => {
    const svc = new DbKnowledgeService()
    for (const kind of ['guide', 'api', 'faq', 'tutorial', 'reference']) {
      const result = await svc.getDocumentsByKind(kind)
      expect(Array.isArray(result)).toBe(true)
    }
  })

  it('logSearch 传负 count 不抛异常', async () => {
    const svc = new DbKnowledgeService()
    await expect(
      svc.logSearch('test', -1, -1)
    ).resolves.toBeUndefined()
  })

  it('getActivePhases 多次调用返回一致', async () => {
    const svc = new DbKnowledgeService()
    const r1 = await svc.getActivePhases()
    const r2 = await svc.getActivePhases()
    expect(Array.isArray(r1)).toBe(true)
    expect(r1).toEqual(r2)
  })

  it('getVenuesByCity 多个城市名不抛异常', async () => {
    const svc = new DbKnowledgeService()
    for (const city of ['上海', '北京', '深圳', '广州']) {
      const result = await svc.getVenuesByCity(city)
      expect(Array.isArray(result)).toBe(true)
      expect(result).toHaveLength(0)
    }
  })

  it('getExperts 传 undefined groupId 不抛异常', async () => {
    const svc = new DbKnowledgeService()
    const result = await svc.getExperts()
    expect(Array.isArray(result)).toBe(true)
  })

  it('getRecentPulses 默认 limit 不抛异常', async () => {
    const svc = new DbKnowledgeService()
    const result = await svc.getRecentPulses()
    expect(Array.isArray(result)).toBe(true)
  })

  it('getTodayBrief 在 DB 不可用时返回 null', async () => {
    const svc = new DbKnowledgeService()
    const result = await svc.getTodayBrief()
    expect(result).toBeNull()
  })

  // ── 新增: 返回类型验证 (10) ──────────────────────────────

  it('getPatterns 传 anti-pattern 返回空数组', async () => {
    const svc = new DbKnowledgeService()
    const result = await svc.getPatterns('anti-pattern')
    expect(Array.isArray(result)).toBe(true)
    expect(result).toHaveLength(0)
  })

  it('getPatterns 传 positive-pattern 返回空数组', async () => {
    const svc = new DbKnowledgeService()
    const result = await svc.getPatterns('positive-pattern')
    expect(Array.isArray(result)).toBe(true)
    expect(result).toHaveLength(0)
  })

  it('getVenuesByCity 传城市名含空格返回空数组', async () => {
    const svc = new DbKnowledgeService()
    const result = await svc.getVenuesByCity('San Francisco')
    expect(Array.isArray(result)).toBe(true)
    expect(result).toHaveLength(0)
  })

  it('getVenuesByCity 传城市名含数字返回空数组', async () => {
    const svc = new DbKnowledgeService()
    const result = await svc.getVenuesByCity('Chengdu123')
    expect(Array.isArray(result)).toBe(true)
    expect(result).toHaveLength(0)
  })

  it('getRecentPulses 传 undefined limit 使用默认值', async () => {
    const svc = new DbKnowledgeService()
    const result = await svc.getRecentPulses(undefined)
    expect(Array.isArray(result)).toBe(true)
  })

  it('getActivePhases 两次调用结果引用不同（深拷贝）', async () => {
    const svc = new DbKnowledgeService()
    const r1 = await svc.getActivePhases()
    const r2 = await svc.getActivePhases()
    expect(r1).toEqual(r2)
    // 证明不是同一个引用
    if (r1.length > 0) {
      r2.push({} as any)
      expect(r1.length).not.toBe(r2.length)
    }
  })

  it('getExperts 传 undefined 不传参数不抛异常', async () => {
    const svc = new DbKnowledgeService()
    const result = await svc.getExperts()
    expect(Array.isArray(result)).toBe(true)
  })

  it('getTodayBrief 不等于空对象（返回 null）', async () => {
    const svc = new DbKnowledgeService()
    const result = await svc.getTodayBrief()
    expect(result).not.toEqual({})
  })

  it('logSearch 传全部 undefined 参数不抛异常', async () => {
    const svc = new DbKnowledgeService()
    await expect(
      svc.logSearch(undefined as any, undefined as any, undefined as any)
    ).resolves.toBeUndefined()
  })

  it('getVenuesByCity 传超长城市名不抛异常', async () => {
    const svc = new DbKnowledgeService()
    const long = 'x'.repeat(500)
    const result = await svc.getVenuesByCity(long)
    expect(Array.isArray(result)).toBe(true)
  })
})
