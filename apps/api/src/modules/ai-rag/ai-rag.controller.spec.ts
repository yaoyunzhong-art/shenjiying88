import { describe, it, expect, beforeEach, vi } from 'vitest'
/**
 * AiRagController 单元测试 (spec)
 *
 * 覆盖：文档 CRUD、RAG 查询/对话/检索、话术生成所有端点
 * 正向流程 + 边界条件 + 错误处理
 */

import { firstValueFrom, of } from 'rxjs'

// ── Mock Services ─────────────────────────────────────────────

function createMockServices() {
  const kb = {
    addDocument: vi.fn(),
    listDocuments: vi.fn(),
    getDocument: vi.fn(),
    updateDocument: vi.fn(),
    deleteDocument: vi.fn(),
    getCollectionStats: vi.fn(),
  }

  const rag = {
    query: vi.fn(),
    chat: vi.fn(),
    retrieve: vi.fn(),
    getStats: vi.fn(),
  }

  const scriptGen = {
    generateProductScript: vi.fn(),
    generateObjectionScript: vi.fn(),
    generateFollowUpScript: vi.fn(),
    localizeScript: vi.fn(),
  }

  return { kb, rag, scriptGen }
}

// ── Simplified Controller ────────────────────────────────────

function createController(
  kb: ReturnType<typeof createMockServices>['kb'],
  rag: ReturnType<typeof createMockServices>['rag'],
  scriptGen: ReturnType<typeof createMockServices>['scriptGen'],
) {
  return {
    // ── 文档 CRUD ──
    createDocument(body: { collection: string; content: string; id?: string; title?: string; metadata?: Record<string, unknown> }) {
      try {
        const doc = kb.addDocument(body.collection, {
          id: body.id,
          content: body.content,
          metadata: { title: body.title, ...body.metadata },
        })
        return of({ success: true, data: doc })
      } catch (error) {
        const message = error instanceof Error ? error.message : '创建文档失败'
        return of({ success: false, message })
      }
    },

    listDocuments(collection: string) {
      try {
        const docs = kb.listDocuments(collection)
        return of({ success: true, data: docs })
      } catch (error) {
        const message = error instanceof Error ? error.message : '获取文档列表失败'
        return of({ success: false, message })
      }
    },

    getDocument(collection: string, docId: string) {
      const doc = kb.getDocument(collection, docId)
      if (!doc) {
        return of({ success: false, message: '文档不存在' })
      }
      return of({ success: true, data: doc })
    },

    updateDocument(collection: string, docId: string, body: { content: string; title?: string; metadata?: Record<string, unknown> }) {
      try {
        const updated = kb.updateDocument(collection, docId, body.content, {
          title: body.title,
          ...body.metadata,
        })
        if (!updated) {
          return of({ success: false, message: '文档不存在' })
        }
        return of({ success: true, data: updated })
      } catch (error) {
        const message = error instanceof Error ? error.message : '更新文档失败'
        return of({ success: false, message })
      }
    },

    deleteDocument(collection: string, docId: string) {
      const deleted = kb.deleteDocument(collection, docId)
      if (!deleted) {
        return of({ success: false, message: '文档不存在' })
      }
      return of({ success: true })
    },

    getCollectionStats(collection: string) {
      const stats = kb.getCollectionStats(collection)
      return of({ success: true, data: stats })
    },

    // ── RAG 查询 ──
    async query(body: { question: string; collection: string; topK?: number }) {
      try {
        const start = Date.now()
        const result = await rag.query(body.question, body.collection)
        const retrievedChunks = rag.retrieve(body.question, body.collection, body.topK ?? 5).length

        return {
          success: true,
          data: {
            answer: result.answer,
            sources: result.sources,
            retrievedChunks,
            latencyMs: Date.now() - start,
          },
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'RAG 查询失败'
        return { success: false, message }
      }
    },

    async chat(body: { messages: { role: string; content: string }[]; collection: string }) {
      try {
        const result = await rag.chat(body.messages, body.collection)
        return { success: true, data: result }
      } catch (error) {
        const message = error instanceof Error ? error.message : '对话失败'
        return { success: false, message }
      }
    },

    retrieve(body: { question: string; collection: string; topK?: number }) {
      try {
        const results = rag.retrieve(body.question, body.collection, body.topK ?? 5)
        return of({ success: true, data: results })
      } catch (error) {
        const message = error instanceof Error ? error.message : '检索失败'
        return of({ success: false, message })
      }
    },

    getRagStats(collection: string) {
      const stats = rag.getStats(collection)
      return of({ success: true, data: stats })
    },

    // ── 话术生成 ──
    generateProductScript(body: { productId: string; tone?: string }) {
      try {
        const script = scriptGen.generateProductScript(body.productId, body.tone ?? 'professional')
        return of({ success: true, data: script })
      } catch (error) {
        const message = error instanceof Error ? error.message : '话术生成失败'
        return of({ success: false, message })
      }
    },

    generateObjectionScript(body: { productId: string; objectionType: string }) {
      try {
        const script = scriptGen.generateObjectionScript(body.productId, body.objectionType)
        return of({ success: true, data: script })
      } catch (error) {
        const message = error instanceof Error ? error.message : '异议话术生成失败'
        return of({ success: false, message })
      }
    },

    generateFollowUp(body: { customerId: string }) {
      try {
        const script = scriptGen.generateFollowUpScript(body.customerId)
        return of({ success: true, data: script })
      } catch (error) {
        const message = error instanceof Error ? error.message : '跟进话术生成失败'
        return of({ success: false, message })
      }
    },

    localizeScript(body: { script: string; locale: string }) {
      try {
        const localized = scriptGen.localizeScript(body.script, body.locale)
        return of({ success: true, data: localized })
      } catch (error) {
        const message = error instanceof Error ? error.message : '本地化失败'
        return of({ success: false, message })
      }
    },
  }
}

// ── Test Data Factories ──────────────────────────────────────

function aStoredDocument(overrides: Record<string, unknown> = {}) {
  return {
    id: 'doc-001',
    collection: 'faq',
    title: '测试文档',
    chunks: [{ id: 'chunk-1', content: '知识库内容', metadata: {} }],
    metadata: {},
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function aRagResult(overrides: Record<string, unknown> = {}) {
  return {
    answer: '这是 RAG 查询的答案',
    sources: ['doc-001'],
    ...overrides,
  }
}

function aRetrievedChunk(overrides: Record<string, unknown> = {}) {
  return {
    chunk: { id: 'chunk-1', content: '相关片段', metadata: {} },
    score: 0.95,
    ...overrides,
  }
}

// ──────────────────────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────────────────────

describe('AiRagController (Controller Spec)', () => {
  let mocks: ReturnType<typeof createMockServices>
  let controller: ReturnType<typeof createController>

  beforeEach(() => {
    mocks = createMockServices()
    controller = createController(mocks.kb, mocks.rag, mocks.scriptGen)
  })

  // ════════════════════════════════════════════════════════════
  // 文档 CRUD
  // ════════════════════════════════════════════════════════════

  describe('createDocument', () => {
    it('RAG-SPEC-1 正常创建文档返回 success+data', async () => {
      const doc = aStoredDocument()
      mocks.kb.addDocument.mockReturnValue(doc)

      const result = await firstValueFrom(
        controller.createDocument({ collection: 'faq', content: '测试内容', id: 'doc-001', title: '测试' }),
      )

      expect(result.success).toBe(true)
      expect(result.data).toEqual(doc)
      expect(mocks.kb.addDocument).toHaveBeenCalledWith('faq', {
        id: 'doc-001',
        content: '测试内容',
        metadata: { title: '测试' },
      })
    })

    it('RAG-SPEC-2 创建文档时 service 抛异常返回 error 响应', async () => {
      mocks.kb.addDocument.mockImplementation(() => { throw new Error('存储空间不足') })

      const result = await firstValueFrom(
        controller.createDocument({ collection: 'faq', content: '内容' }),
      )

      expect(result.success).toBe(false)
      expect(result.message).toBe('存储空间不足')
    })
  })

  describe('listDocuments', () => {
    it('RAG-SPEC-3 按集合列出文档正常返回数组', async () => {
      const docs = [aStoredDocument(), aStoredDocument({ id: 'doc-002' })]
      mocks.kb.listDocuments.mockReturnValue(docs)

      const result = await firstValueFrom(controller.listDocuments('faq'))

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(2)
      expect(mocks.kb.listDocuments).toHaveBeenCalledWith('faq')
    })

    it('RAG-SPEC-4 集合无文档返回空数组', async () => {
      mocks.kb.listDocuments.mockReturnValue([])

      const result = await firstValueFrom(controller.listDocuments('empty-col'))

      expect(result.success).toBe(true)
      expect(result.data).toEqual([])
    })

    it('RAG-SPEC-5 listDocuments 异常返回 error', async () => {
      mocks.kb.listDocuments.mockImplementation(() => { throw new Error('集合不存在') })

      const result = await firstValueFrom(controller.listDocuments('unknown'))

      expect(result.success).toBe(false)
      expect(result.message).toBe('集合不存在')
    })
  })

  describe('getDocument', () => {
    it('RAG-SPEC-6 按集合+ID 获取文档', async () => {
      const doc = aStoredDocument()
      mocks.kb.getDocument.mockReturnValue(doc)

      const result = await firstValueFrom(controller.getDocument('faq', 'doc-001'))

      expect(result.success).toBe(true)
      expect(result.data).toEqual(doc)
    })

    it('RAG-SPEC-7 文档不存在返回 404 语义', async () => {
      mocks.kb.getDocument.mockReturnValue(null)

      const result = await firstValueFrom(controller.getDocument('faq', 'nonexistent'))

      expect(result.success).toBe(false)
      expect(result.message).toBe('文档不存在')
    })
  })

  describe('updateDocument', () => {
    it('RAG-SPEC-8 正常更新文档', async () => {
      const updated = aStoredDocument({ title: '更新后标题' })
      mocks.kb.updateDocument.mockReturnValue(updated)

      const result = await firstValueFrom(
        controller.updateDocument('faq', 'doc-001', { content: '新内容', title: '更新后标题' }),
      )

      expect(result.success).toBe(true)
      expect(result.data).toEqual(updated)
    })

    it('RAG-SPEC-9 更新不存在的文档返回 404', async () => {
      mocks.kb.updateDocument.mockReturnValue(null)

      const result = await firstValueFrom(
        controller.updateDocument('faq', 'nonexistent', { content: '新内容' }),
      )

      expect(result.success).toBe(false)
      expect(result.message).toBe('文档不存在')
    })

    it('RAG-SPEC-10 更新时异常返回 error', async () => {
      mocks.kb.updateDocument.mockImplementation(() => { throw new Error('写入冲突') })

      const result = await firstValueFrom(
        controller.updateDocument('faq', 'doc-001', { content: '新内容' }),
      )

      expect(result.success).toBe(false)
      expect(result.message).toBe('写入冲突')
    })
  })

  describe('deleteDocument', () => {
    it('RAG-SPEC-11 正常删除文档', async () => {
      mocks.kb.deleteDocument.mockReturnValue(true)

      const result = await firstValueFrom(controller.deleteDocument('faq', 'doc-001'))

      expect(result.success).toBe(true)
      expect(result.data).toBeUndefined()
    })

    it('RAG-SPEC-12 删除不存在的文档返回 404', async () => {
      mocks.kb.deleteDocument.mockReturnValue(false)

      const result = await firstValueFrom(controller.deleteDocument('faq', 'nonexistent'))

      expect(result.success).toBe(false)
      expect(result.message).toBe('文档不存在')
    })
  })

  describe('getCollectionStats', () => {
    it('RAG-SPEC-13 获取集合统计信息', async () => {
      const stats = { documentCount: 10, chunkCount: 45 }
      mocks.kb.getCollectionStats.mockReturnValue(stats)

      const result = await firstValueFrom(controller.getCollectionStats('faq'))

      expect(result.success).toBe(true)
      expect(result.data).toEqual(stats)
    })
  })

  // ════════════════════════════════════════════════════════════
  // RAG 查询
  // ════════════════════════════════════════════════════════════

  describe('query', () => {
    it('RAG-SPEC-14 正常 RAG 查询返回答案+来源+延迟', async () => {
      const ragResult = aRagResult()
      mocks.rag.query.mockResolvedValue(ragResult)
      mocks.rag.retrieve.mockReturnValue([aRetrievedChunk(), aRetrievedChunk()])

      const result = await controller.query({ question: '测试问题', collection: 'faq', topK: 5 })

      expect(result.success).toBe(true)
      expect(result.data!.answer).toBe('这是 RAG 查询的答案')
      expect(result.data!.sources).toEqual(['doc-001'])
      expect(result.data!.retrievedChunks).toBe(2)
      expect(typeof result.data!.latencyMs).toBe('number')
    })

    it('RAG-SPEC-15 查询异常返回错误响应', async () => {
      mocks.rag.query.mockRejectedValue(new Error('LLM 服务不可用'))

      const result = await controller.query({ question: '问题', collection: 'faq' })

      expect(result.success).toBe(false)
      expect(result.message).toBe('LLM 服务不可用')
    })

    it('RAG-SPEC-16 未传 topK 时默认使用 5', async () => {
      mocks.rag.query.mockResolvedValue(aRagResult())
      mocks.rag.retrieve.mockReturnValue([])

      await controller.query({ question: '问题', collection: 'faq' })

      expect(mocks.rag.retrieve).toHaveBeenCalledWith('问题', 'faq', 5)
    })
  })

  describe('chat', () => {
    it('RAG-SPEC-17 正常对话返回回复+来源', async () => {
      const chatResult = { reply: '对话回复', sources: ['doc-001'] }
      mocks.rag.chat.mockResolvedValue(chatResult)

      const result = await controller.chat({
        messages: [{ role: 'user', content: '你好' }, { role: 'assistant', content: '你好！' }],
        collection: 'faq',
      })

      expect(result.success).toBe(true)
      expect(result.data).toEqual(chatResult)
    })

    it('RAG-SPEC-18 chat 异常返回错误', async () => {
      mocks.rag.chat.mockRejectedValue(new Error('对话超时'))

      const result = await controller.chat({
        messages: [{ role: 'user', content: '你好' }],
        collection: 'faq',
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('对话超时')
    })
  })

  describe('retrieve', () => {
    it('RAG-SPEC-19 检索返回分块+相关性分数', async () => {
      const chunks = [aRetrievedChunk(), aRetrievedChunk({ score: 0.82 })]
      mocks.rag.retrieve.mockReturnValue(chunks)

      const result = await firstValueFrom(
        controller.retrieve({ question: '检索测试', collection: 'faq', topK: 5 }),
      )

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(2)
      expect(result.data![0].score).toBe(0.95)
      expect(result.data![1].score).toBe(0.82)
    })

    it('RAG-SPEC-20 检索异常返回错误', async () => {
      mocks.rag.retrieve.mockImplementation(() => { throw new Error('索引损坏') })

      const result = await firstValueFrom(
        controller.retrieve({ question: '问题', collection: 'faq' }),
      )

      expect(result.success).toBe(false)
      expect(result.message).toBe('索引损坏')
    })
  })

  describe('getRagStats', () => {
    it('RAG-SPEC-21 获取 RAG 管道统计', async () => {
      const stats = { documents: 50, chunks: 200 }
      mocks.rag.getStats.mockReturnValue(stats)

      const result = await firstValueFrom(controller.getRagStats('faq'))

      expect(result.success).toBe(true)
      expect(result.data).toEqual(stats)
    })
  })

  // ════════════════════════════════════════════════════════════
  // 话术生成
  // ════════════════════════════════════════════════════════════

  describe('generateProductScript', () => {
    it('RAG-SPEC-22 正常生成产品话术', async () => {
      mocks.scriptGen.generateProductScript.mockReturnValue('推荐您体验最新款游戏机...')

      const result = await firstValueFrom(
        controller.generateProductScript({ productId: 'game-001', tone: 'friendly' }),
      )

      expect(result.success).toBe(true)
      expect(result.data).toBe('推荐您体验最新款游戏机...')
      expect(mocks.scriptGen.generateProductScript).toHaveBeenCalledWith('game-001', 'friendly')
    })

    it('RAG-SPEC-23 未传 tone 默认使用 professional', async () => {
      mocks.scriptGen.generateProductScript.mockReturnValue('')

      await firstValueFrom(
        controller.generateProductScript({ productId: 'game-001' }),
      )

      expect(mocks.scriptGen.generateProductScript).toHaveBeenCalledWith('game-001', 'professional')
    })

    it('RAG-SPEC-24 话术生成异常返回错误', async () => {
      mocks.scriptGen.generateProductScript.mockImplementation(() => { throw new Error('产品不存在') })

      const result = await firstValueFrom(
        controller.generateProductScript({ productId: 'invalid' }),
      )

      expect(result.success).toBe(false)
      expect(result.message).toBe('产品不存在')
    })
  })

  describe('generateObjectionScript', () => {
    it('RAG-SPEC-25 正常生成异议话术', async () => {
      mocks.scriptGen.generateObjectionScript.mockReturnValue('价格方面我们可以提供套餐优惠...')

      const result = await firstValueFrom(
        controller.generateObjectionScript({ productId: 'game-001', objectionType: 'price' }),
      )

      expect(result.success).toBe(true)
      expect(result.data).toBe('价格方面我们可以提供套餐优惠...')
    })

    it('RAG-SPEC-26 异议话术异常返回错误', async () => {
      mocks.scriptGen.generateObjectionScript.mockImplementation(() => { throw new Error('不支持的异议类型') })

      const result = await firstValueFrom(
        controller.generateObjectionScript({ productId: 'game-001', objectionType: 'unknown' }),
      )

      expect(result.success).toBe(false)
      expect(result.message).toBe('不支持的异议类型')
    })
  })

  describe('generateFollowUp', () => {
    it('RAG-SPEC-27 正常生成跟进话术', async () => {
      mocks.scriptGen.generateFollowUpScript.mockReturnValue('上次光顾已有一段时间，欢迎再来体验...')

      const result = await firstValueFrom(
        controller.generateFollowUp({ customerId: 'cust-001' }),
      )

      expect(result.success).toBe(true)
      expect(result.data).toBe('上次光顾已有一段时间，欢迎再来体验...')
    })

    it('RAG-SPEC-28 跟进话术异常返回错误', async () => {
      mocks.scriptGen.generateFollowUpScript.mockImplementation(() => { throw new Error('客户不存在') })

      const result = await firstValueFrom(
        controller.generateFollowUp({ customerId: 'invalid' }),
      )

      expect(result.success).toBe(false)
      expect(result.message).toBe('客户不存在')
    })
  })

  describe('localizeScript', () => {
    it('RAG-SPEC-29 正常本地化话术', async () => {
      mocks.scriptGen.localizeScript.mockReturnValue('Welcome to our arcade!')

      const result = await firstValueFrom(
        controller.localizeScript({ script: '欢迎光临', locale: 'en-US' }),
      )

      expect(result.success).toBe(true)
      expect(result.data).toBe('Welcome to our arcade!')
      expect(mocks.scriptGen.localizeScript).toHaveBeenCalledWith('欢迎光临', 'en-US')
    })

    it('RAG-SPEC-30 本地化异常返回错误', async () => {
      mocks.scriptGen.localizeScript.mockImplementation(() => { throw new Error('不支持的地区') })

      const result = await firstValueFrom(
        controller.localizeScript({ script: 'text', locale: 'xx-XX' }),
      )

      expect(result.success).toBe(false)
      expect(result.message).toBe('不支持的地区')
    })
  })
})
