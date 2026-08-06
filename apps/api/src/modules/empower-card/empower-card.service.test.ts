/**
 * empower-card.service.spec.ts — 赋能卡片服务 V23 全覆盖测试
 *
 * 覆盖:
 *   - create / getById / list
 *   - search (按 tag / module / q)
 *   - autoMatchForDispatch
 *   - recordQuote / getQuoteLog
 *   - applyDecay / healthCheck / getTodayEmpowerScore
 *   - batchImport
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { EmpowerCardService } from './empower-card.service'

vi.mock('../../database/pg-pool', () => ({
  getPgPool: () => null,
  closePgPool: vi.fn(),
}))

describe('EmpowerCardService', () => {
  let service: EmpowerCardService

  beforeEach(() => {
    service = new EmpowerCardService()
  })

  const createDto = () => ({
    tag: 'test-tag',
    summary: '测试赋能卡片内容',
    source: '测试来源',
    moduleMapping: 'api-test',
    detailUrl: 'https://example.com',
  })

  // ── create ───────────────────────────────────────────────────────────────

  describe('create', () => {
    it('正例: 无 DB 时使用降级创建', async () => {
      const card = await service.create(createDto())
      expect(card.id).toBeTruthy()
      expect(card.tag).toBe('test-tag')
      expect(card.freshnessScore).toBe(100)
    })

    it('正例: creationTimestamp 应正确', async () => {
      const card = await service.create(createDto())
      expect(card.createdAt).toBeTruthy()
      expect(card.updatedAt).toBeTruthy()
    })
  })

  // ── getById ──────────────────────────────────────────────────────────────

  describe('getById', () => {
    it('正例: 降级模式应返回已创建卡片', async () => {
      const card = await service.create(createDto())
      const got = await service.getById(card.id)
      expect(got.id).toBe(card.id)
    })

    it('异常: 不存应抛 NotFoundException', async () => {
      await expect(service.getById('00000000-0000-0000-0000-000000000000')).rejects.toThrow()
    })
  })

  // ── list ─────────────────────────────────────────────────────────────────

  describe('list', () => {
    it('正例: 降级模式应列出卡片', async () => {
      await service.create(createDto())
      await service.create({ ...createDto(), tag: 'another' })
      const list = await service.list()
      expect(list.length).toBeGreaterThanOrEqual(2)
    })

    it('正例: minFreshness 应过滤', async () => {
      await service.create(createDto())
      const list = await service.list(100) // freshness=100
      expect(list.length).toBeGreaterThanOrEqual(1)
      const high = await service.list(200) // no card has 200
      expect(high).toHaveLength(0)
    })
  })

  // ── search ───────────────────────────────────────────────────────────────

  describe('search', () => {
    it('正例: 降级模式按 tag 搜索', async () => {
      await service.create(createDto())
      const result = await service.search({ tag: 'test-tag', limit: 5 })
      expect(result.total).toBeGreaterThanOrEqual(1)
      expect(result.cards[0].tag).toBe('test-tag')
    })

    it('正例: 按 q 搜索', async () => {
      await service.create(createDto())
      const result = await service.search({ q: '赋能卡片', limit: 5 })
      expect(result.total).toBeGreaterThanOrEqual(1)
    })

    it('边缘: 无匹配应返回 0', async () => {
      const result = await service.search({ q: 'zzznoexist', limit: 5 })
      expect(result.total).toBe(0)
    })
  })

  // ── autoMatchForDispatch ─────────────────────────────────────────────────

  describe('autoMatchForDispatch', () => {
    it('正例: 降级模式应返回最多 3 张卡片', async () => {
      await service.create({ ...createDto(), tag: 'match-1' })
      const cards = await service.autoMatchForDispatch('api-test')
      expect(cards.length).toBeGreaterThan(0)
      expect(cards.length).toBeLessThanOrEqual(3)
    })
  })

  // ── recordQuote ──────────────────────────────────────────────────────────

  describe('recordQuote', () => {
    it('正例: 降级模式应更新引用计数', async () => {
      const card = await service.create(createDto())
      await service.recordQuote(card.id, '测试任务', 'api-test', 'bot')
      const got = await service.getById(card.id)
      expect(got.quoteCount).toBe(1)
      expect(got.lastQuotedAt).toBeTruthy()
    })
  })

  // ── getQuoteLog ──────────────────────────────────────────────────────────

  describe('getQuoteLog', () => {
    it('正例: 降级模式应返回空数组', async () => {
      const log = await service.getQuoteLog()
      expect(log).toEqual([])
    })
  })

  // ── applyDecay ───────────────────────────────────────────────────────────

  describe('applyDecay', () => {
    it('正例: 降级模式应返回 {0,0}', async () => {
      const result = await service.applyDecay()
      expect(result).toEqual({ decayed: 0, archived: 0 })
    })
  })

  // ── healthCheck ──────────────────────────────────────────────────────────

  describe('healthCheck', () => {
    it('正例: 降级模式应返回 degraded/ok', async () => {
      await service.create(createDto())
      const health = await service.healthCheck()
      expect(health.status).toBe('degraded') // cardCount>0 but quoteApi not reachable
      expect(health.cardsCount).toBeGreaterThan(0)
      expect(health.timestamp).toBeTruthy()
    })
  })

  // ── getTodayEmpowerScore ─────────────────────────────────────────────────

  describe('getTodayEmpowerScore', () => {
    it('正例: 降级模式应返回 {0,0,0}', async () => {
      const score = await service.getTodayEmpowerScore()
      expect(score).toEqual({ score: 0, quotes: 0, newCards: 0 })
    })
  })

  // ── batchImport ──────────────────────────────────────────────────────────

  describe('batchImport', () => {
    it('正例: 批量导入应返回成功数', async () => {
      const count = await service.batchImport([
        { tag: 'batch-1', summary: '批量1', source: 'src' },
        { tag: 'batch-2', summary: '批量2', source: 'src' },
      ])
      expect(count).toBe(2)
      const list = await service.list()
      expect(list.length).toBeGreaterThanOrEqual(2)
    })
  })
})
