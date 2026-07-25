/**
 * ai.controller.test.ts — AI 分析 Controller 单元测试
 *
 * 覆盖 AiController 全部 3 个 POST 端点:
 *   - POST /ai/analyze — 综合 AI 分析
 *   - POST /ai/sentiment — 情感评分
 *   - POST /ai/keywords — 关键词提取
 *
 * 测试项: 18 项 (正例 + 反例 + 边界 + 参数传递)
 * 树哥自动: 补全 Controller 层测试覆盖
 */

import { Test, TestingModule } from '@nestjs/testing'
import { AiController } from './ai.controller'
import { AiService } from './ai.service'

describe('AiController — analyze', () => {
  let controller: AiController
  let service: AiService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AiController],
      providers: [AiService],
    }).compile()

    controller = module.get<AiController>(AiController)
    service = module.get<AiService>(AiService)
  })

  describe('POST /ai/analyze', () => {
    it('正例: 英文文本综合分析返回完整结构', () => {
      const result = controller.analyze({ text: 'This software product is excellent and the cloud API is amazing' })
      expect(result).toHaveProperty('text')
      expect(result).toHaveProperty('category')
      expect(result).toHaveProperty('sentiment')
      expect(result).toHaveProperty('keywords')
      expect(result).toHaveProperty('confidence')
      expect(result).toHaveProperty('processedAt')
      expect(result).toHaveProperty('tokensConsumed')
    })

    it('正例: 中文文本应正确分类和情感分析', () => {
      const result = controller.analyze({ text: '银行贷款利率上升投资股票市场风险加大' })
      expect(result.category).toBe('finance')
      expect(['positive', 'neutral', 'negative']).toContain(result.sentiment.label)
    })

    it('正例: topKKeywords 参数应限制关键词数量', () => {
      const result = controller.analyze({
        text: 'software cloud API algorithm data programming',
        topKKeywords: 2,
      })
      expect(result.keywords.length).toBeLessThanOrEqual(2)
    })

    it('正例: maxCategories 参数应影响分类结果', () => {
      const result = controller.analyze({
        text: 'hospital investment stock software cloud API',
        maxCategories: 2,
      })
      expect(result.category).toBeTruthy()
      // 多类别时应正确识别
      expect(['healthcare', 'finance', 'technology']).toContain(result.category)
    })

    it('反例: 空文本返回 unknown + 默认值', () => {
      const result = controller.analyze({ text: '' })
      expect(result.category).toBe('unknown')
      expect(result.sentiment.label).toBe('neutral')
      expect(result.keywords).toHaveLength(0)
      expect(result.confidence).toBe(0)
      expect(result.tokensConsumed).toBe(0)
    })

    it('反例: 纯空白文本视为空输入', () => {
      const result = controller.analyze({ text: '   \n\t  ' })
      expect(result.category).toBe('unknown')
      expect(result.keywords).toHaveLength(0)
    })

    it('边界: 单字符文本也能正常处理', () => {
      const result = controller.analyze({ text: 'a' })
      expect(result).toHaveProperty('processedAt')
      expect(typeof result.processedAt).toBe('string')
    })
  })

  describe('POST /ai/sentiment', () => {
    it('正例: 积极文本返回 positive 标签', () => {
      const result = controller.sentiment({ text: 'amazing excellent perfect wonderful fantastic great' })
      expect(result.label).toBe('positive')
      expect(result.score).toBeGreaterThan(0.2)
      expect(result.breakdown.positive).toBeGreaterThan(0)
    })

    it('正例: 消极文本返回 negative 标签', () => {
      const result = controller.sentiment({ text: 'terrible awful horrible bad disgusting failure' })
      expect(result.label).toBe('negative')
      expect(result.score).toBeLessThan(-0.2)
      expect(result.breakdown.negative).toBeGreaterThan(0)
    })

    it('正例: 中性文本返回 neutral 标签', () => {
      const result = controller.sentiment({ text: 'maybe it is normal average standard typical' })
      expect(result.label).toBe('neutral')
      expect(result.breakdown.neutral).toBeGreaterThan(0.5)
    })

    it('正例: 中英文混合情感文本', () => {
      const result = controller.sentiment({ text: '好 优秀 完美 excellent wonderful great' })
      expect(result.label).toBe('positive')
      expect(result.score).toBe(1)
    })

    it('反例: 空文本返回中性默认值', () => {
      const result = controller.sentiment({ text: '' })
      expect(result.label).toBe('neutral')
      expect(result.score).toBe(0)
      expect(result.breakdown.neutral).toBe(1)
    })

    it('边界: score 在 -1 到 1 之间', () => {
      const result = controller.sentiment({ text: 'good bad happy sad love hate' })
      expect(result.score).toBeGreaterThanOrEqual(-1)
      expect(result.score).toBeLessThanOrEqual(1)
    })
  })

  describe('POST /ai/keywords', () => {
    it('正例: 提取高频关键词并排序', () => {
      const result = controller.keywords({ text: 'software software software cloud API API data' })
      expect(result.length).toBeGreaterThan(0)
      expect(result[0].keyword).toBe('software')
    })

    it('正例: topK 参数限制返回数量', () => {
      const result = controller.keywords({
        text: 'software cloud API algorithm data programming code',
        topK: 2,
      })
      expect(result.length).toBeLessThanOrEqual(2)
    })

    it('反例: 空文本返回空数组', () => {
      const result = controller.keywords({ text: '' })
      expect(result).toHaveLength(0)
    })

    it('反例: 纯标点文本返回空数组', () => {
      const result = controller.keywords({ text: '!!!...???,,,;;;' })
      expect(result).toHaveLength(0)
    })

    it('边界: 全短词文本返回空数组', () => {
      const result = controller.keywords({ text: 'a b c d e f g' })
      expect(result).toHaveLength(0)
    })
  })
})
