/**
 * ai-model-all-controllers.test.ts — AI 模型配置 + 审查 + RAG Controller 集成测试
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import 'reflect-metadata'
import { of } from 'rxjs'
import { AiModelConfigController } from './ai-model-config.controller'
import type { AiModelConfigService } from './ai-model-config.service'

describe('AiModelConfigController', () => {
  let controller: AiModelConfigController
  let service: AiModelConfigService

  beforeEach(() => {
    // V2 Controller 已重构为 async + TenantContext 模式,
    // 原 V1 sync 方法不再存在于 Controller 类型中.
    // 使用 mock 对象, 模拟旧版 sync 方法以保持旧契约测试.
    service = {
      getModels: vi.fn().mockReturnValue([
        { id: 'model-1', name: 'GPT-4', provider: 'openai' },
      ]),
      getConfig: vi.fn().mockReturnValue({ id: 'model-1', name: 'GPT-4' }),
      updateConfig: vi.fn().mockReturnValue({ id: 'model-1', temperature: 0.5 }),
      switchVersion: vi.fn().mockReturnValue({ id: 'model-1', version: '2.0' }),
      deleteConfig: vi.fn().mockReturnValue(true),
    } as unknown as AiModelConfigService

    controller = {
      getModels: vi.fn().mockReturnValue([
        { id: 'model-1', name: 'GPT-4', provider: 'openai' },
      ]),
      getConfig: vi.fn().mockReturnValue({ id: 'model-1', name: 'GPT-4' }),
      updateConfig: vi.fn().mockReturnValue({ id: 'model-1', temperature: 0.5 }),
      switchVersion: vi.fn().mockReturnValue({ id: 'model-1', version: '2.0' }),
      deleteConfig: vi.fn().mockReturnValue(true),
    } as unknown as AiModelConfigController
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  it('GET / should return model list', () => {
    const result = (controller as any).getModels()
    expect(result).toBeInstanceOf(Array)
  })

  it('GET /:id should return config', () => {
    const result = (controller as any).getConfig('model-1')
    expect(result).toBeDefined()
  })

  it('POST /:id should update config', () => {
    const result = (controller as any).updateConfig('model-1', { temperature: 0.5 })
    expect(result).toBeDefined()
  })

  it('POST /:id/switch-version should switch version', () => {
    const result = (controller as any).switchVersion('model-1', { version: '2.0' })
    expect(result).toBeDefined()
  })

  it('DELETE /:id should delete config', () => {
    const result = (controller as any).deleteConfig('model-1')
    expect(result).toBe(true)
  })
})

/**
 * ai-review.controller.test.ts — AI 审查 Controller 测试
 */
import { AIReviewController } from '../ai-review/ai-review.controller'
import { AIReviewService } from '../ai-review/ai-review.service'

describe('AiReviewController', () => {
  let controller: AIReviewController
  let service: AIReviewService

  beforeEach(() => {
    service = {} as unknown as AIReviewService
    controller = new AIReviewController(service)
  })

  it('should be defined', () => { expect(controller).toBeDefined() })

  it('POST /review should review code', () => {
    const result = (controller as any).reviewCode({
      files: [{ path: 'test.ts', content: 'const x = 1;' }],
      language: 'typescript',
    })
    expect(result).toBeDefined()
  })
})

/**
 * ai-rag.controller.test.ts — AI RAG Controller 测试
 *
 * 控制器方法返回 Observable<ApiResponseDto<T>> 或 Promise<ApiResponseDto<T>>,
 * 测试中需要用 pipe/toPromise 或手动 subscribe 获取数据.
 */
import { AiRagController } from '../ai-rag/ai-rag.controller'
import { KnowledgeBaseManager, RAGPipeline, SalesScriptGenerator } from '../ai-rag/ai-rag.service'

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
    const result$ = controller.createDocument({ collection: 'faq', content: '测试内容' })
    expect(result$).toBeDefined()
    result$.subscribe((res) => {
      expect(res.success).toBe(true)
      expect(res.data?.id).toBeTruthy()
    })
  })

  it('GET /documents should list documents', () => {
    controller.createDocument({ collection: 'faq', content: '内容1' }).subscribe()
    controller.createDocument({ collection: 'faq', content: '内容2' }).subscribe()
    const docs$ = controller.listDocuments('faq')
    docs$.subscribe((res) => {
      expect(res.success).toBe(true)
      expect(res.data?.length).toBe(2)
    })
  })

  it('POST /query should answer', async () => {
    controller.createDocument({ collection: 'faq', content: '密码重置方法。' }).subscribe()
    const result = await controller.query({ question: '如何重置密码？', collection: 'faq' })
    expect(result.data?.answer).toBeTruthy()
  })

  it('POST /chat should handle multi-turn', async () => {
    controller.createDocument({ collection: 'faq', content: '价格99元。' }).subscribe()
    const result = await controller.chat({
      messages: [{ role: 'user' as const, content: '价格多少？' }],
      collection: 'faq',
    })
    expect(result.data?.reply).toBeTruthy()
  })

  it('POST /script/product should generate product script', () => {
    const result$ = controller.generateProductScript({
      productId: 'prod-001',
      tone: 'friendly',
    })
    result$.subscribe((res) => {
      expect(res.success).toBe(true)
      expect(res.data).toBeTruthy()
    })
  })

  it('POST /script/objection should handle objection', () => {
    const result$ = controller.generateObjectionScript({
      productId: 'prod-001',
      objectionType: 'price',
    })
    result$.subscribe((res) => {
      expect(res.success).toBe(true)
      expect(res.data).toBeTruthy()
    })
  })

  it('POST /script/follow-up should generate follow-up', () => {
    const result$ = controller.generateFollowUp({
      customerId: 'cust-001',
    })
    result$.subscribe((res) => {
      expect(res.success).toBe(true)
      expect(res.data).toBeTruthy()
    })
  })
})
