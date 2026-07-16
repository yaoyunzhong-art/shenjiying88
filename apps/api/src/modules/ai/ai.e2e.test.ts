/**
 * ai.e2e.test.ts — AI 分析服务模块 E2E 测试
 *
 * 链路:
 *   HTTP → TestAiController → AiService
 *
 * 验证:
 *   - AI 模型调用 (analyzeText, classifyCategory, sentimentScore)
 *   - 参数验证 (空文本、Options 参数)
 *   - 结果缓存/统计 (getAnalysisStats)
 */

import { describe, it, expect, beforeEach } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { Controller, Get, Post, Body, Query, Injectable } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { AiService } from './ai.service'

@Controller('ai')
@Injectable()
class TestAiController {
  constructor(private readonly aiService: AiService) {}

  @Post('analyze')
  analyze(@Body() body: { text: string; topKKeywords?: number }) {
    return this.aiService.analyzeText(body.text, { topKKeywords: body.topKKeywords })
  }

  @Post('classify')
  classify(@Body() body: { text: string; maxCategories?: number }) {
    return this.aiService.classifyCategory(body.text, { maxCategories: body.maxCategories })
  }

  @Post('sentiment')
  sentiment(@Body() body: { text: string }) {
    return this.aiService.sentimentScore(body.text)
  }

  @Post('keywords')
  keywords(@Body() body: { text: string; topN?: number }) {
    return this.aiService.extractKeywords(body.text, { topN: body.topN })
  }

  @Get('stats')
  stats() {
    return this.aiService.getAnalysisStats()
  }
}

async function buildApp() {
  const aiService = new AiService()
  const moduleRef = await Test.createTestingModule({
    controllers: [TestAiController],
    providers: [
      { provide: AiService, useValue: aiService },
    ],
  }).compile()

  const app = moduleRef.createNestApplication()
  await app.init()
  return { app, aiService }
}

describe('AI E2E', () => {
  describe('AI 模型调用 — 综合分析', () => {
    it('英文科技文本分类为 technology', async () => {
      const { app } = await buildApp()
      try {
        const res = await request(app.getHttpServer())
          .post('/ai/analyze')
          .send({ text: 'The new AI cloud API algorithm improves data processing efficiency significantly.' })
        assert.equal(res.statusCode, 201)
        assert.equal(res.body.category, 'technology')
        assert.ok(res.body.confidence > 0)
        assert.ok(res.body.keywords.length >= 1)
        assert.ok(res.body.sentiment.label === 'positive' || res.body.sentiment.label === 'neutral')
      } finally {
        await app.close()
      }
    })

    it('中文金融文本分类为 finance', async () => {
      const { app } = await buildApp()
      try {
        const res = await request(app.getHttpServer())
          .post('/ai/analyze')
          .send({ text: '银行存款利率上升，投资者纷纷涌入股票市场' })
        assert.equal(res.statusCode, 201)
        assert.equal(res.body.category, 'finance')
        assert.ok(res.body.tokensConsumed > 0)
      } finally {
        await app.close()
      }
    })

    it('空文本返回 unknown 类别和零情感', async () => {
      const { app } = await buildApp()
      try {
        const res = await request(app.getHttpServer())
          .post('/ai/analyze')
          .send({ text: '' })
        assert.equal(res.statusCode, 201)
        assert.equal(res.body.category, 'unknown')
        assert.equal(res.body.confidence, 0)
        assert.equal(res.body.sentiment.score, 0)
        assert.equal(res.body.sentiment.label, 'neutral')
        assert.equal(res.body.keywords.length, 0)
        assert.equal(res.body.tokensConsumed, 0)
      } finally {
        await app.close()
      }
    })
  })

  describe('参数验证 — 额外选项', () => {
    it('topKKeywords 参数限制输出关键词数量', async () => {
      const { app } = await buildApp()
      try {
        const res = await request(app.getHttpServer())
          .post('/ai/analyze')
          .send({ text: 'software cloud API machine learning algorithm data science', topKKeywords: 2 })
        assert.equal(res.statusCode, 201)
        assert.ok(res.body.keywords.length <= 2)
      } finally {
        await app.close()
      }
    })

    it('自定义 maxCategories 返回多个候选类别', async () => {
      const { app } = await buildApp()
      try {
        const res = await request(app.getHttpServer())
          .post('/ai/classify')
          .send({ text: 'The hospital uses AI software for medical diagnosis and data analysis.', maxCategories: 2 })
        assert.equal(res.statusCode, 201)
        assert.ok(res.body.category !== 'unknown')
        assert.ok(res.body.confidence > 0)
      } finally {
        await app.close()
      }
    })
  })

  describe('情感评分', () => {
    it('积极文本返回 positive 标签', async () => {
      const { app } = await buildApp()
      try {
        const res = await request(app.getHttpServer())
          .post('/ai/sentiment')
          .send({ text: 'This is an amazing and wonderful product! Absolutely love it!' })
        assert.equal(res.statusCode, 201)
        assert.equal(res.body.label, 'positive')
        assert.ok(res.body.score > 0.2)
      } finally {
        await app.close()
      }
    })

    it('消极文本返回 negative 标签', async () => {
      const { app } = await buildApp()
      try {
        const res = await request(app.getHttpServer())
          .post('/ai/sentiment')
          .send({ text: 'This is terrible, awful, and horrible. The worst experience ever.' })
        assert.equal(res.statusCode, 201)
        assert.equal(res.body.label, 'negative')
        assert.ok(res.body.score < -0.2)
      } finally {
        await app.close()
      }
    })

    it('中性文本返回 neutral 标签', async () => {
      const { app } = await buildApp()
      try {
        const res = await request(app.getHttpServer())
          .post('/ai/sentiment')
          .send({ text: 'The system is operating under normal conditions with average performance.' })
        assert.equal(res.statusCode, 201)
        assert.equal(res.body.label, 'neutral')
      } finally {
        await app.close()
      }
    })
  })

  describe('关键词提取', () => {
    it('提取的关键词包含相关术语', async () => {
      const { app } = await buildApp()
      try {
        const res = await request(app.getHttpServer())
          .post('/ai/keywords')
          .send({ text: 'machine learning and artificial intelligence are transforming healthcare and education' })
        assert.equal(res.statusCode, 201)
        assert.ok(Array.isArray(res.body))
        assert.ok(res.body.length >= 1)
        // Should include education or healthcare
        const hasRelevantKeyword = res.body.some((k: any) =>
          k.keyword === 'education' || k.keyword === 'healthcare' || k.keyword === 'machine'
        )
        assert.ok(hasRelevantKeyword)
      } finally {
        await app.close()
      }
    })
  })

  describe('分析统计', () => {
    it('调用统计计数与调用次数一致', async () => {
      const { app } = await buildApp()
      try {
        await request(app.getHttpServer()).post('/ai/analyze').send({ text: 'First test text for statistics' })
        await request(app.getHttpServer()).post('/ai/analyze').send({ text: 'Second test for statistics tracking' })

        const res = await request(app.getHttpServer()).get('/ai/stats')
        assert.equal(res.statusCode, 200)
        assert.ok(res.body.total >= 2)
      } finally {
        await app.close()
      }
    })
  })
})
