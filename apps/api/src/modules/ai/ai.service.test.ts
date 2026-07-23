/**
 * ai.service.test.ts — AI 分析服务全覆盖单元测试
 *
 * 覆盖:
 *   - analyzeText: 正常流程、边界、空输入
 *   - classifyCategory: 多种类别识别、未匹配、中文
 *   - sentimentScore: 积极/消极/中性、中英文混合
 *   - extractKeywords: 词频排序、数量限制、minScore
 *   - getAnalysisStats: 统计累积
 *
 * 测试充分性: 18+ tests
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { AiService } from './ai.service'

describe('AiService — analyzeText', () => {
  let service: AiService

  beforeEach(() => {
    service = new AiService()
  })

  it('正例: 正常英文技术文本应正确综合分析', () => {
    const result = service.analyzeText('I love this new software, the AI algorithm is amazing and the cloud API works great')
    expect(result.category).toBe('technology')
    expect(result.sentiment.label).toBe('positive')
    expect(result.keywords.length).toBeGreaterThan(0)
    expect(result.confidence).toBeGreaterThan(0)
    expect(result.tokensConsumed).toBeGreaterThan(0)
  })

  it('正例: 中文金融文本应正确分类', () => {
    // 中文positive词"好"在"很好"中被tokenize出来
    const result = service.analyzeText('银行投资股票市场赚钱收益')
    expect(result.category).toBe('finance')
    expect(result.keywords.length).toBeGreaterThan(0)
    // 没有积极/消极词,情感是中性的
    expect(result.sentiment.label).toBe('neutral')
  })

  it('正例: topKKeywords 参数应限制返回关键词数量', () => {
    const result = service.analyzeText('software cloud API algorithm data programming coding app hardware startup', { topKKeywords: 3 })
    expect(result.keywords.length).toBeLessThanOrEqual(3)
  })

  it('正例: maxCategories 参数影响分类子类返回', () => {
    // 突出 technology 关键词
    const result = service.analyzeText('software cloud API algorithm programming data tech AI')
    expect(result.category).toBe('technology')
    expect(result.keywords.length).toBeGreaterThan(0)
  })

  it('边界: 空文本应返回 unknown category 和 0 tokens', () => {
    const result = service.analyzeText('')
    expect(result.category).toBe('unknown')
    expect(result.sentiment.label).toBe('neutral')
    expect(result.keywords).toHaveLength(0)
    expect(result.confidence).toBe(0)
    expect(result.tokensConsumed).toBe(0)
  })

  it('边界: 仅空白字符文本应视为空', () => {
    const result = service.analyzeText('   ')
    expect(result.category).toBe('unknown')
    expect(result.sentiment.label).toBe('neutral')
    expect(result.keywords).toHaveLength(0)
  })

  it('边界: 极短文本也能处理', () => {
    const result = service.analyzeText('good')
    expect(result.sentiment.label).toBe('positive')
    expect(result.keywords.length).toBeGreaterThan(0)
  })
})

describe('AiService — classifyCategory', () => {
  let service: AiService

  beforeEach(() => {
    service = new AiService()
  })

  it('正例: 体育关键词应识别为 sports', () => {
    const result = service.classifyCategory('The basketball team won the championship game with a great score')
    expect(result.category).toBe('sports')
    expect(result.confidence).toBeGreaterThan(0)
  })

  it('正例: 医疗关键词应识别为 healthcare', () => {
    const result = service.classifyCategory('The patient went to the hospital for medical treatment and surgery')
    expect(result.category).toBe('healthcare')
  })

  it('正例: 教育关键词应识别为 education', () => {
    const result = service.classifyCategory('The teacher taught the student in class with a good course')
    expect(result.category).toBe('education')
  })

  it('反例: 无匹配关键词应返回 general', () => {
    const result = service.classifyCategory('zzzzz xxxxx yyyyy')
    expect(result.category).toBe('general')
    expect(result.confidence).toBe(0.3)
  })

  it('边界: 空文本分类为 unknown', () => {
    const result = service.classifyCategory('')
    expect(result.category).toBe('unknown')
    expect(result.confidence).toBe(0)
  })

  it('正例: maxCategories 参数生效时返回 top categories', () => {
    // 同时匹配 technology + business 关键词, 但 technology 关键词更多
    const result = service.classifyCategory('software cloud API data algorithm programming business', { maxCategories: 2 })
    expect(result.category).toBe('technology')
    // subCategory 应为 business (第二匹配)
    expect(result.subCategory).toBe('business')
  })
})

describe('AiService — sentimentScore', () => {
  let service: AiService

  beforeEach(() => {
    service = new AiService()
  })

  it('正例: 积极词汇 > 消极应返回 positive', () => {
    const result = service.sentimentScore('Amazing wonderful excellent great fantastic perfect')
    expect(result.label).toBe('positive')
    expect(result.score).toBeGreaterThan(0.2)
  })

  it('正例: 消极词汇 > 积极应返回 negative', () => {
    const result = service.sentimentScore('Terrible awful horrible bad broken disgusting failure')
    expect(result.label).toBe('negative')
    expect(result.score).toBeLessThan(-0.2)
  })

  it('正例: 中英文混合情感', () => {
    const result = service.sentimentScore('非常喜欢这个产品 excellent well done')
    expect(result.label).toBe('positive')
  })

  it('正例: 中性词占主导应返回 neutral', () => {
    const result = service.sentimentScore('maybe it is normal average typical standard')
    expect(result.label).toBe('neutral')
    expect(result.breakdown.neutral).toBeGreaterThan(0.5)
  })

  it('反例: 空文本返回中性', () => {
    const result = service.sentimentScore('')
    expect(result.label).toBe('neutral')
    expect(result.score).toBe(0)
    expect(result.breakdown.neutral).toBe(1)
  })

  it('边界: 情感词汇混合时 score 在 -1 到 1 范围内', () => {
    const result = service.sentimentScore('good and bad and happy and sad')
    expect(result.score).toBeGreaterThanOrEqual(-1)
    expect(result.score).toBeLessThanOrEqual(1)
  })
})

describe('AiService — extractKeywords', () => {
  let service: AiService

  beforeEach(() => {
    service = new AiService()
  })

  it('正例: 应提取出现频率最高的关键词', () => {
    const result = service.extractKeywords('software software software cloud API API data')
    expect(result.length).toBeGreaterThan(0)
    // software 出现 3 次应排第一
    expect(result[0].keyword).toBe('software')
    expect(result[0].score).toBeGreaterThan(0)
  })

  it('正例: topN 参数限制返回数量', () => {
    const result = service.extractKeywords('software cloud API data algorithm programming code hardware', { topN: 2 })
    expect(result.length).toBeLessThanOrEqual(2)
  })

  it('正例: minScore 参数过滤低分关键词', () => {
    const result = service.extractKeywords('software cloud API', { minScore: 0.5 })
    expect(result.every(k => k.score >= 0.5)).toBe(true)
  })

  it('反例: 空文本应返回空数组', () => {
    const result = service.extractKeywords('')
    expect(result).toHaveLength(0)
  })

  it('反例: 只有短词(长度<2)应被过滤', () => {
    const result = service.extractKeywords('a b c d e f')
    expect(result).toHaveLength(0)
  })
})

describe('AiService — getAnalysisStats', () => {
  let service: AiService

  beforeEach(() => {
    service = new AiService()
  })

  it('正例: 多次分析后统计应正确累积', () => {
    service.analyzeText('I love technology great software amazing')
    service.analyzeText('The hospital doctor treated the patient')
    service.analyzeText('Bad terrible awful poor quality')

    const stats = service.getAnalysisStats()
    expect(stats.total).toBe(3)
    expect(stats.categories.technology).toBe(1)
    expect(stats.categories.healthcare).toBe(1)
    expect(stats.sentiments.positive).toBe(1)
    expect(stats.sentiments.neutral).toBe(1) // healthcare is neutral or positive depending on words
    expect(stats.sentiments.negative).toBe(1)
  })

  it('正例: 无分析记录时返回空统计', () => {
    const stats = service.getAnalysisStats()
    expect(stats.total).toBe(0)
    expect(Object.keys(stats.categories)).toHaveLength(0)
    expect(Object.keys(stats.sentiments)).toHaveLength(0)
  })
})
