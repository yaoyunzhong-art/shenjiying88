/**
 * content.service.spec.ts — 内容管理 Service 纯函数式单元测试
 *
 * 覆盖 ContentService 六大方法：
 *   正例 — 创建 / 查询 / 更新 / 发布 / 归档 / 软删除 / 硬删除 / 分页搜索
 *   反例 — 不存在 / 重复 slug / 硬删除不存在
 *   边界 — 空搜索 / 极限分页 / 多条件组合过滤
 *
 * ≥ 20 项测试，纯内联 mock（基于 Map 的内存存储）
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { ContentService } from './content.service'
import type { ContentCategory, ContentStatus } from './content.entity'

describe('ContentService', () => {
  let svc: ContentService

  beforeEach(() => {
    svc = new ContentService()
    svc.__reset()
  })

  // ── 正例：创建 ──────────────────────────────────────────────

  describe('create', () => {
    it('正例: 创建内容返回完整实体', async () => {
      const entity = await svc.create({
        title: '测试文章',
        slug: 'test-article',
        summary: '这是一篇测试文章',
        body: '# Hello World',
        category: 'news',
        authorId: 'author-1',
      })

      expect(entity.id).toBeTruthy()
      expect(entity.title).toBe('测试文章')
      expect(entity.slug).toBe('test-article')
      expect(entity.summary).toBe('这是一篇测试文章')
      expect(entity.body).toBe('# Hello World')
      expect(entity.category).toBe('news')
      expect(entity.authorId).toBe('author-1')
      expect(entity.status).toBe('draft')
      expect(entity.createdAt).toBeInstanceOf(Date)
      expect(entity.updatedAt).toBeInstanceOf(Date)
    })

    it('正例: 创建内容时可传入 metadata', async () => {
      const entity = await svc.create({
        title: '带元数据',
        slug: 'with-meta',
        body: 'body',
        category: 'guide',
        authorId: 'author-1',
        metadata: { tags: ['tag1', 'tag2'], version: 2 },
      })

      expect(entity.metadata).toEqual({ tags: ['tag1', 'tag2'], version: 2 })
    })

    it('反例: 重复 slug 抛出错误', async () => {
      await svc.create({
        title: '第一篇文章',
        slug: 'duplicate-slug',
        body: 'body',
        category: 'notice',
        authorId: 'author-1',
      })

      await expect(
        svc.create({
          title: '第二篇文章',
          slug: 'duplicate-slug',
          body: 'body',
          category: 'notice',
          authorId: 'author-1',
        }),
      ).rejects.toThrow(/already exists/)
    })
  })

  // ── 正例：查询 ──────────────────────────────────────────────

  describe('findById', () => {
    it('正例: 根据 ID 查询已存在的内容', async () => {
      const created = await svc.create({
        title: '查询测试',
        slug: 'find-by-id',
        body: 'body',
        category: 'news',
        authorId: 'author-1',
      })

      const found = await svc.findById(created.id)
      expect(found).not.toBeNull()
      expect(found!.title).toBe('查询测试')
    })

    it('反例: 查询不存在的内容返回 null', async () => {
      const found = await svc.findById('non-existent-id')
      expect(found).toBeNull()
    })
  })

  describe('findBySlug', () => {
    it('正例: 根据 slug 查询', async () => {
      await svc.create({
        title: 'Slug 查询',
        slug: 'my-unique-slug',
        body: 'body',
        category: 'promotion',
        authorId: 'author-1',
      })

      const found = await svc.findBySlug('my-unique-slug')
      expect(found).not.toBeNull()
      expect(found!.title).toBe('Slug 查询')
    })

    it('反例: 查询不存在的 slug 返回 null', async () => {
      const found = await svc.findBySlug('never-existed')
      expect(found).toBeNull()
    })
  })

  // ── 分页查询 ──────────────────────────────────────────────

  describe('query', () => {
    beforeEach(async () => {
      // 插入 5 条测试数据
      const categories: ContentCategory[] = ['news', 'guide', 'notice', 'promotion', 'activity']
      for (let i = 0; i < 5; i++) {
        await svc.create({
          title: `文章${i + 1}`,
          slug: `article-${i + 1}`,
          body: `这是第${i + 1}篇文章的内容`,
          category: categories[i],
          authorId: i < 3 ? 'author-1' : 'author-2',
        })
      }
    })

    it('正例: 无参数查询返回全部', async () => {
      const result = await svc.query({})
      expect(result.items).toHaveLength(5)
      expect(result.total).toBe(5)
    })

    it('正例: 按分类过滤', async () => {
      const result = await svc.query({ category: 'news' })
      expect(result.items).toHaveLength(1)
      expect(result.items[0].category).toBe('news')
    })

    it('正例: 按作者过滤', async () => {
      const result = await svc.query({ authorId: 'author-2' })
      expect(result.items).toHaveLength(2)
    })

    it('正例: 关键词搜索（标题）', async () => {
      const result = await svc.query({ search: '文章1' })
      expect(result.items.length).toBeGreaterThanOrEqual(1)
      expect(result.items[0].title).toContain('文章1')
    })

    it('正例: 关键词搜索（正文）', async () => {
      const result = await svc.query({ search: '第3篇' })
      expect(result.items.length).toBeGreaterThanOrEqual(1)
    })

    it('正例: 分页参数 - limit', async () => {
      const result = await svc.query({ limit: 2 })
      expect(result.items).toHaveLength(2)
      expect(result.limit).toBe(2)
      expect(result.total).toBe(5)
    })

    it('正例: 分页参数 - offset', async () => {
      const result = await svc.query({ offset: 3, limit: 10 })
      expect(result.items).toHaveLength(2)
      expect(result.offset).toBe(3)
    })

    it('正例: 多条件组合过滤', async () => {
      const result = await svc.query({
        authorId: 'author-1',
        category: 'news',
      })
      expect(result.items).toHaveLength(1)
    })

    it('边界: 空搜索词返回全部', async () => {
      const result = await svc.query({ search: '' })
      expect(result.items).toHaveLength(5)
    })

    it('边界: 搜索无匹配返回空', async () => {
      const result = await svc.query({ search: 'zzz_no_match_999' })
      expect(result.items).toHaveLength(0)
      expect(result.total).toBe(0)
    })

    it('边界: 超大 offset 返回空', async () => {
      const result = await svc.query({ offset: 999, limit: 10 })
      expect(result.items).toHaveLength(0)
      expect(result.total).toBe(5)
    })
  })

  // ── 更新 ──────────────────────────────────────────────────

  describe('update', () => {
    it('正例: 更新标题', async () => {
      const created = await svc.create({
        title: '旧标题',
        slug: 'old-title',
        body: 'body',
        category: 'news',
        authorId: 'author-1',
      })

      const updated = await svc.update(created.id, { title: '新标题' })
      expect(updated).not.toBeNull()
      expect(updated!.title).toBe('新标题')
      expect(updated!.slug).toBe('old-title') // 其他字段不变
    })

    it('正例: 更新多个字段', async () => {
      const created = await svc.create({
        title: '原始',
        slug: 'original',
        body: '原始正文',
        category: 'news',
        authorId: 'author-1',
      })

      const updated = await svc.update(created.id, {
        title: '更新后',
        body: '更新正文',
        category: 'guide',
        status: 'published' as ContentStatus,
      })
      expect(updated!.title).toBe('更新后')
      expect(updated!.body).toBe('更新正文')
      expect(updated!.category).toBe('guide')
      expect(updated!.status).toBe('published')
    })

    it('反例: 更新不存在的内容返回 null', async () => {
      const result = await svc.update('non-existent', { title: '新标题' })
      expect(result).toBeNull()
    })

    it('反例: 更新 slug 冲突抛出错误', async () => {
      await svc.create({
        title: 'A',
        slug: 'slug-a',
        body: 'body',
        category: 'news',
        authorId: 'author-1',
      })
      const b = await svc.create({
        title: 'B',
        slug: 'slug-b',
        body: 'body',
        category: 'news',
        authorId: 'author-1',
      })

      await expect(svc.update(b.id, { slug: 'slug-a' })).rejects.toThrow(/already exists/)
    })
  })

  // ── 发布 ──────────────────────────────────────────────────

  describe('publish', () => {
    it('正例: 发布内容状态变为 published', async () => {
      const created = await svc.create({
        title: '待发布',
        slug: 'to-publish',
        body: 'body',
        category: 'news',
        authorId: 'author-1',
      })

      const published = await svc.publish(created.id)
      expect(published).not.toBeNull()
      expect(published!.status).toBe('published')
      expect(published!.publishedAt).toBeInstanceOf(Date)
    })

    it('正例: 发布时指定发布时间', async () => {
      const created = await svc.create({
        title: '定时发布',
        slug: 'scheduled',
        body: 'body',
        category: 'news',
        authorId: 'author-1',
      })
      const future = new Date('2026-12-31T00:00:00Z')
      const published = await svc.publish(created.id, future)
      expect(published!.publishedAt!.toISOString()).toBe(future.toISOString())
    })

    it('反例: 发布不存在的内容返回 null', async () => {
      const result = await svc.publish('non-existent')
      expect(result).toBeNull()
    })
  })

  // ── 归档 ──────────────────────────────────────────────────

  describe('archive', () => {
    it('正例: 归档内容状态变为 archived', async () => {
      const created = await svc.create({
        title: '待归档',
        slug: 'to-archive',
        body: 'body',
        category: 'notice',
        authorId: 'author-1',
      })

      const archived = await svc.archive(created.id)
      expect(archived).not.toBeNull()
      expect(archived!.status).toBe('archived')
    })

    it('反例: 归档不存在的内容返回 null', async () => {
      const result = await svc.archive('non-existent')
      expect(result).toBeNull()
    })
  })

  // ── 删除 ──────────────────────────────────────────────────

  describe('softDelete', () => {
    it('正例: 软删除内容状态变为 deleted', async () => {
      const created = await svc.create({
        title: '待删除',
        slug: 'to-delete',
        body: 'body',
        category: 'other',
        authorId: 'author-1',
      })

      const result = await svc.softDelete(created.id)
      expect(result).toBe(true)

      const deleted = await svc.findById(created.id)
      expect(deleted).not.toBeNull()
      expect(deleted!.status).toBe('deleted')
    })

    it('反例: 软删除不存在的内容返回 false', async () => {
      const result = await svc.softDelete('non-existent')
      expect(result).toBe(false)
    })
  })

  describe('hardDelete', () => {
    it('正例: 硬删除成功返回 true', async () => {
      const created = await svc.create({
        title: '硬删除',
        slug: 'hard-delete',
        body: 'body',
        category: 'other',
        authorId: 'author-1',
      })

      const deleted = await svc.hardDelete(created.id)
      expect(deleted).toBe(true)

      const found = await svc.findById(created.id)
      expect(found).toBeNull()
    })

    it('反例: 硬删除不存在的内容返回 false', async () => {
      const result = await svc.hardDelete('non-existent')
      expect(result).toBe(false)
    })
  })
})
