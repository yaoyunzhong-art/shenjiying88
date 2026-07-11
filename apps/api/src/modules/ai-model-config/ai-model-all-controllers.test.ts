/**
 * ai-model-config-controller.test.ts — AI 模型配置 Controller 测试
 */
import { describe, it, expect, beforeEach } from 'vitest'
import 'reflect-metadata'
import { AiModelConfigController } from './ai-model-config.controller'
import { AiModelConfigService } from './ai-model-config.service'

describe('AiModelConfigController', () => {
  let controller: AiModelConfigController
  let service: AiModelConfigService

  beforeEach(() => {
    service = new AiModelConfigService()
    controller = new AiModelConfigController(service)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  it('GET / should return model list', () => {
    const result = controller.getModels()
    expect(result).toBeInstanceOf(Array)
  })

  it('GET /:id should return config', () => {
    const result = controller.getConfig('model-1')
    expect(result).toBeDefined()
  })

  it('POST /:id should update config', () => {
    const result = controller.updateConfig('model-1', { temperature: 0.5 })
    expect(result).toBeDefined()
  })

  it('POST /:id/switch-version should switch version', () => {
    const result = controller.switchVersion('model-1', { version: '2.0' })
    expect(result).toBeDefined()
  })

  it('DELETE /:id should delete config', () => {
    const result = controller.deleteConfig('model-1')
    expect(result).toBe(true)
  })
})

/**
 * ai-review.controller.test.ts — AI 审查 Controller 测试
 */
import { AiReviewController } from './ai-review.controller'
import { AiReviewService } from './ai-review.service'

describe('AiReviewController', () => {
  let controller: AiReviewController
  let service: AiReviewService

  beforeEach(() => {
    service = new AiReviewService()
    controller = new AiReviewController(service)
  })

  it('should be defined', () => { expect(controller).toBeDefined() })

  it('POST /review should review code', () => {
    const result = controller.reviewCode({
      files: [{ path: 'test.ts', content: 'const x = 1;' }],
      language: 'typescript',
    })
    expect(result).toBeDefined()
  })
})

/**
 * ai-rag.controller.test.ts — AI RAG Controller 测试
 */
import { AiRagController } from './ai-rag.controller'
import { KnowledgeBaseManager, RAGPipeline, SalesScriptGenerator } from './ai-rag.service'

describe('AiRagController', () => {
  let controller: AiRagController
  let kb: KnowledgeBaseManager
  let pipeline: RAGPipeline
  let scriptGen: SalesScriptGenerator

  beforeEach(() => {
    kb = new KnowledgeBaseManager()
    pipeline = new RAGPipeline(kb)
    scriptGen = new SalesScriptGenerator()
    controller = new AiRagController(kb, pipeline, scriptGen)
  })

  it('should be defined', () => { expect(controller).toBeDefined() })

  it('POST /documents should add document', () => {
    const result = controller.addDocument({ collection: 'faq', content: '测试内容' })
    expect(result).toBeDefined()
    expect(result.id).toBeTruthy()
  })

  it('GET /documents should list documents', () => {
    controller.addDocument({ collection: 'faq', content: '内容1' })
    controller.addDocument({ collection: 'faq', content: '内容2' })
    const docs = controller.listDocuments('faq')
    expect(docs.length).toBe(2)
  })

  it('POST /query should answer', async () => {
    controller.addDocument({ collection: 'faq', content: '密码重置方法。' })
    const result = await controller.query({ question: '如何重置密码？', collection: 'faq' })
    expect(result.answer).toBeTruthy()
  })

  it('POST /chat should handle multi-turn', async () => {
    controller.addDocument({ collection: 'faq', content: '价格99元。' })
    const result = await controller.chat({
      messages: [{ role: 'user', content: '价格多少？' }],
      collection: 'faq',
    })
    expect(result.reply).toBeTruthy()
  })

  it('POST /script/product should generate product script', () => {
    const result = controller.generateProductScript({
      productId: 'prod-001',
      tone: 'friendly',
    })
    expect(result).toBeTruthy()
  })

  it('POST /script/objection should handle objection', () => {
    const result = controller.generateObjectionScript({
      productId: 'prod-001',
      objectionType: 'price',
    })
    expect(result).toBeTruthy()
  })

  it('POST /script/follow-up should generate follow-up', () => {
    const result = controller.generateFollowUpScript({
      customerId: 'cust-001',
    })
    expect(result).toBeTruthy()
  })
})
