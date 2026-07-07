import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert'
import { validate } from 'class-validator'
import { plainToInstance } from 'class-transformer'
import {
  SendMessageDto,
  SendMessageOptionsDto,
  HandoffDto,
  AddKnowledgeDto,
  SearchKnowledgeDto,
  ListSessionsDto,
  GetSessionDto
} from './ai-cs.dto'

describe('AiCs DTOs', () => {
  describe('SendMessageDto', () => {
    it('should validate valid send-message request', async () => {
      const dto = plainToInstance(SendMessageDto, {
        tenantId: 'tnt-001',
        memberId: 'mem-123',
        channel: 'web',
        content: '你好，我想了解一下会员套餐',
        options: { forceHandoff: false, language: 'zh-CN' }
      })
      const errors = await validate(dto)
      assert.strictEqual(errors.length, 0)
    })

    it('should reject empty tenantId', async () => {
      const dto = plainToInstance(SendMessageDto, {
        tenantId: '',
        channel: 'web',
        content: 'hello'
      })
      const errors = await validate(dto)
      assert.ok(errors.length > 0)
    })

    it('should reject invalid channel', async () => {
      const dto = plainToInstance(SendMessageDto, {
        tenantId: 'tnt-001',
        channel: 'slack',
        content: 'hello'
      })
      const errors = await validate(dto)
      assert.ok(errors.length > 0)
    })

    it('should reject content exceeding 2000 chars', async () => {
      const dto = plainToInstance(SendMessageDto, {
        tenantId: 'tnt-001',
        channel: 'web',
        content: 'x'.repeat(2001)
      })
      const errors = await validate(dto)
      assert.ok(errors.length > 0)
    })

    it('should accept content exactly at 2000 chars boundary', async () => {
      const dto = plainToInstance(SendMessageDto, {
        tenantId: 'tnt-001',
        channel: 'web',
        content: 'x'.repeat(2000)
      })
      const errors = await validate(dto)
      assert.strictEqual(errors.length, 0)
    })

    it('should accept optional fields omitted', async () => {
      const dto = plainToInstance(SendMessageDto, {
        tenantId: 'tnt-001',
        channel: 'wechat',
        content: 'hello'
      })
      const errors = await validate(dto)
      assert.strictEqual(errors.length, 0)
    })
  })

  describe('HandoffDto', () => {
    it('should validate valid handoff request', async () => {
      const dto = plainToInstance(HandoffDto, {
        tenantId: 'tnt-001',
        conversationId: 'conv-abc',
        reason: 'low-confidence',
        priority: 'high'
      })
      const errors = await validate(dto)
      assert.strictEqual(errors.length, 0)
    })

    it('should reject invalid handoff reason', async () => {
      const dto = plainToInstance(HandoffDto, {
        tenantId: 'tnt-001',
        conversationId: 'conv-abc',
        reason: 'invalid-reason'
      })
      const errors = await validate(dto)
      assert.ok(errors.length > 0)
    })

    it('should accept handoff without optional priority', async () => {
      const dto = plainToInstance(HandoffDto, {
        tenantId: 'tnt-001',
        conversationId: 'conv-abc',
        reason: 'user-request'
      })
      const errors = await validate(dto)
      assert.strictEqual(errors.length, 0)
    })

    it('should accept all valid handoff reasons', async () => {
      for (const reason of ['low-confidence', 'user-request', 'complex-query', 'sentiment-negative']) {
        const dto = plainToInstance(HandoffDto, {
          tenantId: 'tnt-001',
          conversationId: 'conv-abc',
          reason
        })
        const errors = await validate(dto)
        assert.strictEqual(errors.length, 0, `reason "${reason}" should be valid`)
      }
    })
  })

  describe('AddKnowledgeDto', () => {
    it('should validate valid knowledge entry', async () => {
      const dto = plainToInstance(AddKnowledgeDto, {
        tenantId: 'tnt-001',
        category: 'membership',
        title: '银卡会员权益',
        content: '银卡会员可享受8折优惠',
        tags: ['membership', 'silver']
      })
      const errors = await validate(dto)
      assert.strictEqual(errors.length, 0)
    })

    it('should reject empty title', async () => {
      const dto = plainToInstance(AddKnowledgeDto, {
        tenantId: 'tnt-001',
        category: 'faq',
        title: '',
        content: 'some content'
      })
      const errors = await validate(dto)
      assert.ok(errors.length > 0)
    })

    it('should accept knowledge without tags', async () => {
      const dto = plainToInstance(AddKnowledgeDto, {
        tenantId: 'tnt-001',
        category: 'faq',
        title: '常见问题',
        content: '一些常见问题的解答'
      })
      const errors = await validate(dto)
      assert.strictEqual(errors.length, 0)
    })

    it('should reject content exceeding 10000 chars', async () => {
      const dto = plainToInstance(AddKnowledgeDto, {
        tenantId: 'tnt-001',
        category: 'faq',
        title: '太长',
        content: 'x'.repeat(10001)
      })
      const errors = await validate(dto)
      assert.ok(errors.length > 0)
    })
  })

  describe('SearchKnowledgeDto', () => {
    it('should validate valid search request', async () => {
      const dto = plainToInstance(SearchKnowledgeDto, {
        tenantId: 'tnt-001',
        q: '会员折扣',
        topK: 10
      })
      const errors = await validate(dto)
      assert.strictEqual(errors.length, 0)
    })

    it('should reject missing query', async () => {
      const dto = plainToInstance(SearchKnowledgeDto, {
        tenantId: 'tnt-001'
      })
      const errors = await validate(dto)
      assert.ok(errors.length > 0)
    })

    it('should reject negative topK', async () => {
      const dto = plainToInstance(SearchKnowledgeDto, {
        tenantId: 'tnt-001',
        q: 'test',
        topK: -1
      })
      const errors = await validate(dto)
      assert.ok(errors.length > 0)
    })

    it('should accept search without topK (optional)', async () => {
      const dto = plainToInstance(SearchKnowledgeDto, {
        tenantId: 'tnt-001',
        q: 'test'
      })
      const errors = await validate(dto)
      assert.strictEqual(errors.length, 0)
    })
  })

  describe('ListSessionsDto', () => {
    it('should validate valid list request', async () => {
      const dto = plainToInstance(ListSessionsDto, {
        tenantId: 'tnt-001'
      })
      const errors = await validate(dto)
      assert.strictEqual(errors.length, 0)
    })

    it('should accept optional memberId', async () => {
      const dto = plainToInstance(ListSessionsDto, {
        tenantId: 'tnt-001',
        memberId: 'mem-123'
      })
      const errors = await validate(dto)
      assert.strictEqual(errors.length, 0)
    })

    it('should reject empty tenantId', async () => {
      const dto = plainToInstance(ListSessionsDto, {
        tenantId: ''
      })
      const errors = await validate(dto)
      assert.ok(errors.length > 0)
    })
  })

  describe('GetSessionDto', () => {
    it('should validate valid get-session request', async () => {
      const dto = plainToInstance(GetSessionDto, {
        tenantId: 'tnt-001',
        id: 'conv-abc'
      })
      const errors = await validate(dto)
      assert.strictEqual(errors.length, 0)
    })

    it('should reject empty session id', async () => {
      const dto = plainToInstance(GetSessionDto, {
        tenantId: 'tnt-001',
        id: ''
      })
      const errors = await validate(dto)
      assert.ok(errors.length > 0)
    })
  })
})
