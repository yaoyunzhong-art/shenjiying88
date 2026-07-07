/**
 * ai-rag.dto.test.ts - RAG 知识库 DTO 测试
 */
import { describe, it, expect } from 'vitest'
import { CollectionType } from './ai-rag.entity'
import type {
  CreateDocumentDto,
  UpdateDocumentDto,
  RagQueryDto,
  ChatMessageDto,
  ChatDto,
  GenerateProductScriptDto,
  GenerateObjectionScriptDto,
  GenerateFollowUpDto,
  LocalizeScriptDto,
  ApiResponseDto,
} from './ai-rag.dto'

describe('AiRagDto', () => {
  describe('CreateDocumentDto', () => {
    it('RAG-DTO-1 should create a valid CreateDocumentDto', () => {
      const dto: CreateDocumentDto = {
        content: '这是一个测试文档内容',
        collection: CollectionType.FAQ,
        title: '测试文档',
        metadata: { author: 'tester' },
      }
      expect(dto.content).toBeDefined()
      expect(dto.collection).toBe('faq')
      expect(dto.title).toBe('测试文档')
      expect(dto.metadata?.author).toBe('tester')
    })

    it('RAG-DTO-2 should create with minimal fields', () => {
      const dto: CreateDocumentDto = {
        content: '最小内容',
        collection: CollectionType.PRODUCTS,
      }
      expect(dto.content).toBe('最小内容')
      expect(dto.id).toBeUndefined()
      expect(dto.title).toBeUndefined()
    })

    it('RAG-DTO-3 should accept custom id', () => {
      const dto: CreateDocumentDto = {
        id: 'custom-id-001',
        content: '带自定义ID的内容',
        collection: CollectionType.SUPPORT,
      }
      expect(dto.id).toBe('custom-id-001')
    })
  })

  describe('UpdateDocumentDto', () => {
    it('RAG-DTO-4 should create a valid UpdateDocumentDto', () => {
      const dto: UpdateDocumentDto = {
        content: '更新后的内容',
        title: '新标题',
        metadata: { version: 2 },
      }
      expect(dto.content).toBe('更新后的内容')
      expect(dto.title).toBe('新标题')
    })

    it('RAG-DTO-5 should require content only', () => {
      const dto: UpdateDocumentDto = { content: '仅更新内容' }
      expect(dto.content).toBe('仅更新内容')
      expect(dto.title).toBeUndefined()
    })
  })

  describe('RagQueryDto', () => {
    it('RAG-DTO-6 should create a valid RagQueryDto', () => {
      const dto: RagQueryDto = {
        question: '如何重置密码？',
        collection: CollectionType.FAQ,
        topK: 5,
      }
      expect(dto.question).toBe('如何重置密码？')
      expect(dto.collection).toBe('faq')
      expect(dto.topK).toBe(5)
    })

    it('RAG-DTO-7 should not require topK', () => {
      const dto: RagQueryDto = {
        question: '测试问题',
        collection: CollectionType.SUPPORT,
      }
      expect(dto.topK).toBeUndefined()
    })
  })

  describe('ChatDto', () => {
    it('RAG-DTO-8 should create a valid ChatDto', () => {
      const messages: ChatMessageDto[] = [
        { role: 'user', content: '你好' },
        { role: 'assistant', content: '您好！' },
      ]
      const dto: ChatDto = {
        messages,
        collection: CollectionType.SUPPORT,
      }
      expect(dto.messages).toHaveLength(2)
      expect(dto.collection).toBe('support')
    })
  })

  describe('Script generation DTOs', () => {
    it('RAG-DTO-9 should create GenerateProductScriptDto', () => {
      const dto: GenerateProductScriptDto = {
        productId: 'prod-001',
        tone: 'friendly',
      }
      expect(dto.productId).toBe('prod-001')
      expect(dto.tone).toBe('friendly')
    })

    it('RAG-DTO-10 should create GenerateObjectionScriptDto', () => {
      const dto: GenerateObjectionScriptDto = {
        productId: 'prod-001',
        objectionType: 'price',
      }
      expect(dto.objectionType).toBe('price')
    })

    it('RAG-DTO-11 should create GenerateFollowUpDto', () => {
      const dto: GenerateFollowUpDto = { customerId: 'cust-001' }
      expect(dto.customerId).toBe('cust-001')
    })

    it('RAG-DTO-12 should create LocalizeScriptDto', () => {
      const dto: LocalizeScriptDto = {
        script: 'Hello',
        locale: 'zh-CN',
      }
      expect(dto.locale).toBe('zh-CN')
    })
  })

  describe('ApiResponseDto', () => {
    it('RAG-DTO-13 should create success response', () => {
      const res: ApiResponseDto<string> = { success: true, data: 'ok' }
      expect(res.success).toBe(true)
      expect(res.data).toBe('ok')
    })

    it('RAG-DTO-14 should create error response', () => {
      const res: ApiResponseDto = { success: false, message: '出错了' }
      expect(res.success).toBe(false)
      expect(res.message).toBe('出错了')
    })
  })
})
