/**
 * ai.service.spec.ts — AI 分析服务 V23 全覆盖测试
 *
 * 覆盖:
 *   - analyzeText:    综合分析
 *   - classifyCategory: 文本分类
 *   - sentimentScore:   情感评分
 *   - extractKeywords:  关键词提取
 *   - getAnalysisStats: 统计
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { AiService, type AnalysisResult } from './ai.service'

describe('AiService', () => {
  let service: AiService

  beforeEach(() => {
    service = new AiService()
  })

  // ── analyzeText ──────────────────────────────────────────────────────────

  describe('analyzeText', () => {
    it('正例: 正常英文科技文本应返回完整分析结果', () => {
      const r = service.analyzeText('I love this new software, the AI algorithm is amazing')
      expect(r.category).toBe('technology')
      expect(r.sentiment.label).toBe('positive')
      expect(r.keywords.length).toBeGreaterThan(0)
      expect(r.confidence).toBeGreaterThan(0)
      expect(r.tokensConsumed).toBeGreaterThan(0)
      expect(r.processedAt).toBeTruthy()
    })

    it('正例: topKKeywords 参数应限制返回关键词数量', () => {
      const r = service.analyzeText('software cloud API algorithm data programming coding app', { topKKeywords: 3 })
      expect(r.keywords.length).toBeLessThanOrEqual(3)
    })

    it('异常: 空字符串应返回 unknown/neutral 结果', () => {
      const r = service.analyzeText('')
      expect(r.category).toBe('unknown')
      expect(r.sentiment.label).toBe('neutral')
      expect(r.keywords).toEqual([])
      expect(r.confidence).toBe(0)
      expect(r.tokensConsumed).toBe(0)
    })

    it('边缘: 纯空白文本应返回降级结果', () => {
      const r = service.analyzeText('   ')
      expect(r.category).toBe('unknown')
      expect(r.keywords).toEqual([])
    })
  })

  // ── classifyCategory ─────────────────────────────────────────────────────

  describe('classifyCategory', () => {
    it('正例: 科技关键词文本应分类为 technology', () => {
      const r = service.classifyCategory('The new cloud API and data algorithm')
      expect(r.category).toBe('technology')
      expect(r.confidence).toBeGreaterThan(0)
    })

    it('正例: 金融关键词文本应分类为 finance', () => {
      const r = service.classifyCategory('bank loan investment stock market')
      expect(r.category).toBe('finance')
    })

    it('正例: maxCategories 影响子类返回', () => {
      // 同时包含 tech 和 business 词
      const r = service.classifyCategory('software startup cloud API business strategy money bank', { maxCategories: 3 })
      expect(r.category).toBe('technology')
      expect(r.subCategory).toBeTruthy()
    })

    it('异常: 空输入应返回 unknown', () => {
      const r = service.classifyCategory('')
      expect(r.category).toBe('unknown')
      expect(r.confidence).toBe(0)
    })

    it('边缘: 无匹配词汇应返回 general', () => {
      const r = service.classifyCategory('xyznonexistentword helloworld')
      expect(r.category).toBe('general')
      expect(r.confidence).toBe(0.3)
    })
  })

  // ── sentimentScore ───────────────────────────────────────────────────────

  describe('sentimentScore', () => {
    it('正例: 积极词汇应返回 positive', () => {
      const r = service.sentimentScore('This is amazing wonderful great excellent perfect')
      expect(r.label).toBe('positive')
      expect(r.score).toBeGreaterThan(0.2)
    })

    it('正例: 消极词汇应返回 negative', () => {
      const r = service.sentimentScore('This is terrible horrible bad awful disappointing')
      expect(r.label).toBe('negative')
      expect(r.score).toBeLessThan(-0.2)
    })

    it('正例: 中性词汇应返回 neutral', () => {
      const r = service.sentimentScore('This is normal average standard moderate')
      expect(r.label).toBe('neutral')
    })

    it('异常: 空输入应返回 neutral 零值', () => {
      const r = service.sentimentScore('')
      expect(r.label).toBe('neutral')
      expect(r.score).toBe(0)
      expect(r.breakdown.neutral).toBe(1)
    })

    it('边缘: 混合情感应正确计算得分', () => {
      const r = service.sentimentScore('good and bad, average quality')
      expect(r.label).toBe('positive') // good > bad
      expect(r.score).toBeGreaterThan(0)
      expect(r.score).toBeLessThanOrEqual(1)
    })
  })

  // ── extractKeywords ──────────────────────────────────────────────────────

  describe('extractKeywords', () => {
    it('正例: 应提取高频词并按分数排序', () => {
      const r = service.extractKeywords('software software software API API data')
      expect(r.length).toBeGreaterThan(0)
      expect(r[0].score).toBeGreaterThan(0)
      // software 词频最高
      expect(r[0].keyword).toBe('software')
    })

    it('正例: topN 参数应限制返回条数', () => {
      const r = service.extractKeywords('software API data algorithm cloud programming code', { topN: 3 })
      expect(r.length).toBeLessThanOrEqual(3)
    })

    it('正例: minScore 过滤低分关键词', () => {
      const r = service.extractKeywords('software AI', { minScore: 0.5, topN: 10 })
      for (const k of r) {
        expect(k.score).toBeGreaterThanOrEqual(0.5)
      }
    })

    it('异常: 空输入应返回空数组', () => {
      const r = service.extractKeywords('')
      expect(r).toEqual([])
    })

    it('异常: 单字符文本应被过滤', () => {
      const r = service.extractKeywords('a b c d e f g')
      expect(r).toEqual([])
    })
  })

  // ── getAnalysisStats ─────────────────────────────────────────────────────

  describe('getAnalysisStats', () => {
    it('正例: 多次分析后应累积统计', () => {
      service.analyzeText('I love software amazing')
      service.analyzeText('This is terrible bug')
      const stats = service.getAnalysisStats()
      expect(stats.total).toBe(2)
      expect(stats.categories.technology).toBeGreaterThan(0)
      expect(stats.sentiments.positive).toBe(1)
      expect(stats.sentiments.negative).toBe(1)
    })

    it('正例: 未分析时统计应为空', () => {
      const stats = service.getAnalysisStats()
      expect(stats.total).toBe(0)
      expect(Object.keys(stats.categories)).toHaveLength(0)
    })
  })
})
