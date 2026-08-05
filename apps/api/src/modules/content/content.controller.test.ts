/**
 * content.controller.spec.ts - 内容管理 Controller 单元测试
 * 策略: 内联 Controller + Mock Service (不使用 NestJS DI)
 * 覆盖所有路由端点: 正例 + 反例 + 边界
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import assert from 'node:assert/strict'

// ── Mock ContentService ──────────────────────────────────────────────────
class MockContentService {
  private store = new Map<string, any>()
  private idCounter = 0

  constructor() {
    this.reset()
  }

  async create(input: any) {
    if (this.slugExists(input.slug)) {
      throw new Error(`Slug "${input.slug}" already exists`)
    }
    this.idCounter++
    const entity = {
      id: `content_${Date.now()}_${this.idCounter}`,
      ...input,
      status: 'draft',
      metadata: input.metadata ?? { version: 1 },
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    this.store.set(entity.id, { ...entity })
    return { ...entity }
  }

  async findById(id: string) {
    const e = this.store.get(id)
    return e ? { ...e } : null
  }

  async findBySlug(slug: string) {
    for (const e of this.store.values()) {
      if (e.slug === slug) return { ...e }
    }
    return null
  }

  async query(query: any) {
    let results = Array.from(this.store.values())
    if (query.category) results = results.filter((c) => c.category === query.category)
    if (query.status) results = results.filter((c) => c.status === query.status)
    if (query.authorId) results = results.filter((c) => c.authorId === query.authorId)
    if (query.search) {
      const q = query.search.toLowerCase()
      results = results.filter((c) => c.title.toLowerCase().includes(q) || c.body.toLowerCase().includes(q))
    }
    if (query.fromDate) {
      const from = new Date(query.fromDate)
      results = results.filter((c) => c.createdAt >= from)
    }
    if (query.toDate) {
      const to = new Date(query.toDate)
      results = results.filter((c) => c.createdAt <= to)
    }
    const total = results.length
    const limit = query.limit ?? 20
    const offset = query.offset ?? 0
    results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    results = results.slice(offset, offset + limit)
    return { items: results.map((c) => ({ ...c })), total, limit, offset }
  }

  async update(id: string, input: any) {
    const existing = this.store.get(id)
    if (!existing) return null
    if (input.slug && input.slug !== existing.slug && this.slugExists(input.slug, id)) {
      throw new Error(`Slug "${input.slug}" already exists`)
    }
    // Only overwrite defined fields
    const updated: any = { ...existing, updatedAt: new Date() }
    for (const key of Object.keys(input)) {
      if (input[key] !== undefined) updated[key] = input[key]
    }
    this.store.set(id, updated)
    return { ...updated }
  }

  async publish(id: string, publishAt?: Date) {
    const e = this.store.get(id)
    if (!e) return null
    const updated = { ...e, status: 'published', publishedAt: publishAt ?? new Date(), updatedAt: new Date() }
    this.store.set(id, updated)
    return { ...updated }
  }

  async archive(id: string) {
    const e = this.store.get(id)
    if (!e) return null
    const updated = { ...e, status: 'archived', updatedAt: new Date() }
    this.store.set(id, updated)
    return { ...updated }
  }

  async softDelete(id: string) {
    const e = this.store.get(id)
    if (!e) return false
    const updated = { ...e, status: 'deleted', updatedAt: new Date() }
    this.store.set(id, updated)
    return true
  }

  private slugExists(slug: string, excludeId?: string) {
    for (const e of this.store.values()) {
      if (e.slug === slug && e.id !== excludeId) return true
    }
    return false
  }

  reset() {
    this.store.clear()
    this.idCounter = 0
  }
}

// ── Controller (inline, same logic as content.controller.ts) ─────────────
function createController(service: MockContentService) {
  function toResponse(entity: any) {
    return {
      id: entity.id,
      title: entity.title,
      slug: entity.slug,
      summary: entity.summary,
      body: entity.body,
      category: entity.category,
      status: entity.status,
      authorId: entity.authorId,
      coverImageUrl: entity.coverImageUrl,
      metadata: entity.metadata,
      publishedAt: entity.publishedAt?.toISOString(),
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    }
  }

  return {
    async create(dto: any) {
      const entity = await service.create({
        title: dto.title,
        slug: dto.slug,
        summary: dto.summary,
        body: dto.body,
        category: dto.category,
        authorId: dto.authorId,
        coverImageUrl: dto.coverImageUrl,
        metadata: dto.metadata,
      })
      return { data: toResponse(entity) }
    },

    async findAll(query: any) {
      const result = await service.query({
        category: query.category,
        status: query.status,
        search: query.search,
        authorId: query.authorId,
        fromDate: query.fromDate,
        toDate: query.toDate,
        limit: query.limit,
        offset: query.offset,
      })
      return {
        items: result.items.map((item: any) => toResponse(item)),
        total: result.total,
        limit: result.limit,
        offset: result.offset,
      }
    },

    async findOne(id: string) {
      const entity = await service.findById(id)
      if (!entity) return { success: false, message: `Content ${id} not found` }
      return { data: toResponse(entity) }
    },

    async findBySlug(slug: string) {
      const entity = await service.findBySlug(slug)
      if (!entity) return { success: false, message: `Content with slug "${slug}" not found` }
      return { data: toResponse(entity) }
    },

    async update(id: string, dto: any) {
      const entity = await service.update(id, {
        title: dto.title,
        slug: dto.slug,
        summary: dto.summary,
        body: dto.body,
        category: dto.category,
        status: dto.status,
        coverImageUrl: dto.coverImageUrl,
        metadata: dto.metadata,
      })
      if (!entity) return { success: false, message: `Content ${id} not found` }
      return { data: toResponse(entity) }
    },

    async publish(id: string, dto: any) {
      const entity = await service.publish(id, dto.publishAt ? new Date(dto.publishAt) : undefined)
      if (!entity) return { success: false, message: `Content ${id} not found` }
      return { data: toResponse(entity) }
    },

    async archive(id: string) {
      const entity = await service.archive(id)
      if (!entity) return { success: false, message: `Content ${id} not found` }
      return { data: toResponse(entity) }
    },

    async remove(id: string) {
      const result = await service.softDelete(id)
      if (!result) return { success: false, message: `Content ${id} not found` }
      return { success: true, message: 'Content deleted' }
    },
  }
}

// ── Test Data Builders ────────────────────────────────────────────────────
function makeCreateDto(overrides: Record<string, any> = {}) {
  return {
    title: '测试公告',
    slug: 'test-notice',
    summary: '这是一个摘要',
    body: '这是正文内容',
    category: 'notice',
    authorId: 'user-001',
    coverImageUrl: 'https://example.com/cover.jpg',
    metadata: { tags: ['test'], version: 1 },
    ...overrides,
  }
}

function makeUpdateDto(overrides: Record<string, any> = {}) {
  return {
    title: '更新标题',
    slug: 'updated-slug',
    summary: '更新摘要',
    body: '更新正文',
    category: 'activity',
    status: 'published',
    coverImageUrl: 'https://example.com/new-cover.jpg',
    metadata: { tags: ['updated'], version: 2 },
    ...overrides,
  }
}

// ── Test Suite ────────────────────────────────────────────────────────────
describe('ContentController (spec)', () => {
  let service: MockContentService
  let controller: ReturnType<typeof createController>

  beforeEach(() => {
    service = new MockContentService()
    controller = createController(service)
  })

  afterEach(() => {
    service.reset()
  })

  // ── POST /content ────────────────────────────────────────────────────
  describe('create()', () => {
    it('should create content successfully', async () => {
      const result = await controller.create(makeCreateDto())

      assert(result.data, 'should return data')
      assert.equal(result.data.title, '测试公告')
      assert.equal(result.data.slug, 'test-notice')
      assert.equal(result.data.status, 'draft')
      assert.equal(result.data.category, 'notice')
      assert.ok(result.data.id, 'should have id')
      assert.ok(result.data.createdAt, 'should have timestamp')
    })

    it('should reject duplicate slug', async () => {
      await controller.create(makeCreateDto())
      await expect(controller.create(makeCreateDto())).rejects.toThrow('already exists')
    })

    it('should accept minimal required fields', async () => {
      const result = await controller.create({
        title: 'minimal',
        slug: 'minimal-post',
        body: 'body',
        category: 'other',
        authorId: 'user-1',
      })
      assert(result.data, 'minimal create should succeed')
      assert.equal(result.data.title, 'minimal')
    })
  })

  // ── GET /content ─────────────────────────────────────────────────────
  describe('findAll()', () => {
    beforeEach(async () => {
      await controller.create(makeCreateDto({ title: 'A', slug: 'a' }))
      await controller.create(makeCreateDto({ title: 'B', slug: 'b', category: 'activity' }))
      await controller.create(makeCreateDto({ title: 'C', slug: 'c', category: 'news' }))
    })

    it('should return all content without filters', async () => {
      const result = await controller.findAll({})
      assert.equal(result.total, 3)
      assert.equal(result.items.length, 3)
    })

    it('should filter by category', async () => {
      const result = await controller.findAll({ category: 'activity' })
      assert.equal(result.total, 1)
      assert.equal(result.items[0].title, 'B')
    })

    it('should search by title', async () => {
      const result = await controller.findAll({ search: 'A' })
      assert.equal(result.total, 1)
    })

    it('should support pagination', async () => {
      const result = await controller.findAll({ limit: 1, offset: 0 })
      assert.equal(result.items.length, 1)
      assert.equal(result.total, 3)
    })

    it('should return empty result for non-matching filter', async () => {
      const result = await controller.findAll({ category: 'guide' })
      assert.equal(result.total, 0)
      assert.equal(result.items.length, 0)
    })
  })

  // ── GET /content/:id ─────────────────────────────────────────────────
  describe('findOne()', () => {
    it('should find content by existing id', async () => {
      const created = await controller.create(makeCreateDto())
      const result = await controller.findOne(created.data.id)
      assert(result.data, 'should find content')
      assert.equal(result.data.id, created.data.id)
    })

    it('should return not-found for non-existing id', async () => {
      const result = await controller.findOne('nonexistent-id')
      assert(!result.data, 'should not have data')
      assert.equal(result.success, false)
      assert(result.message.includes('not found'))
    })

    it('should return not-found for empty id', async () => {
      const result = await controller.findOne('')
      assert.equal(result.success, false)
    })
  })

  // ── GET /content/slug/:slug ──────────────────────────────────────────
  describe('findBySlug()', () => {
    it('should find content by existing slug', async () => {
      await controller.create(makeCreateDto())
      const result = await controller.findBySlug('test-notice')
      assert(result.data, 'should find by slug')
      assert.equal(result.data.slug, 'test-notice')
    })

    it('should return not-found for non-existing slug', async () => {
      const result = await controller.findBySlug('no-such-slug')
      assert.equal(result.success, false)
      assert(result.message.includes('not found'))
    })
  })

  // ── PUT /content/:id ─────────────────────────────────────────────────
  describe('update()', () => {
    it('should update content fields', async () => {
      const created = await controller.create(makeCreateDto())
      const result = await controller.update(created.data.id, makeUpdateDto())
      assert(result.data, 'update should succeed')
      assert.equal(result.data.title, '更新标题')
      assert.equal(result.data.status, 'published')
    })

    it('should return not-found for non-existing id', async () => {
      const result = await controller.update('bad-id', makeUpdateDto())
      assert.equal(result.success, false)
    })

    it('should partially update with single field', async () => {
      const created = await controller.create(makeCreateDto())
      const result = await controller.update(created.data.id, { title: '仅改标题' })
      assert(result.data, 'partial update should succeed')
      assert.equal(result.data.title, '仅改标题')
      // slug should remain unchanged
      assert.equal(result.data.slug, 'test-notice')
    })
  })

  // ── POST /content/:id/publish ────────────────────────────────────────
  describe('publish()', () => {
    it('should publish content as published status', async () => {
      const created = await controller.create(makeCreateDto())
      const result = await controller.publish(created.data.id, {})
      assert(result.data, 'publish should succeed')
      assert.equal(result.data.status, 'published')
      assert.ok(result.data.publishedAt, 'should have publishedAt')
    })

    it('should return not-found for non-existing id', async () => {
      const result = await controller.publish('bad-id', {})
      assert.equal(result.success, false)
    })

    it('should support scheduled publishing', async () => {
      const created = await controller.create(makeCreateDto())
      const futureDate = new Date(Date.now() + 86400000).toISOString()
      const result = await controller.publish(created.data.id, { publishAt: futureDate })
      assert(result.data, 'scheduled publish should succeed')
      assert.equal(result.data.status, 'published')
    })
  })

  // ── POST /content/:id/archive ────────────────────────────────────────
  describe('archive()', () => {
    it('should archive content', async () => {
      const created = await controller.create(makeCreateDto())
      const result = await controller.archive(created.data.id)
      assert(result.data, 'archive should succeed')
      assert.equal(result.data.status, 'archived')
    })

    it('should return not-found for non-existing id', async () => {
      const result = await controller.archive('bad-id')
      assert.equal(result.success, false)
    })
  })

  // ── DELETE /content/:id ──────────────────────────────────────────────
  describe('remove()', () => {
    it('should soft delete content', async () => {
      const created = await controller.create(makeCreateDto())
      const result = await controller.remove(created.data.id)
      assert(result.success, 'soft delete should succeed')
      assert.equal(result.message, 'Content deleted')

      // Verify status changed to deleted
      const fetched = await controller.findOne(created.data.id)
      assert(fetched.data, 'content should still exist')
      assert.equal(fetched.data.status, 'deleted')
    })

    it('should return not-found for non-existing id', async () => {
      const result = await controller.remove('bad-id')
      assert.equal(result.success, false)
    })
  })

  // ── 边界测试 ─────────────────────────────────────────────────────────
  describe('edge cases', () => {
    it('should handle extremely long title', async () => {
      const longTitle = 'x'.repeat(500)
      const result = await controller.create(makeCreateDto({ title: longTitle, slug: 'long-title' }))
      assert(result.data, 'long title should work')
      assert.equal(result.data.title.length, 500)
    })

    it('should handle special characters in body', async () => {
      const specialBody = '<script>alert("xss")</script> 中文\nUnicode 🎉'
      const result = await controller.create(makeCreateDto({ body: specialBody, slug: 'special-body' }))
      assert(result.data, 'special chars should work')
      assert.equal(result.data.body, specialBody)
    })
  })
})
