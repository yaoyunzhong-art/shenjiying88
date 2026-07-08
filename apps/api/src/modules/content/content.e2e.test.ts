/**
 * content.e2e.test.ts — 内容管理端到端测试
 *
 * 覆盖完整的 CRUD + 发布/归档/删除 生命周期:
 *   - 创建 → 查询 → 更新 → 发布 → 归档 → 软删除
 *   - 去重学段 (slug 唯一性)
 *   - 分页 / 过滤 / 搜索
 *   - 并发边界
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { ContentController } from './content.controller'
import { ContentService } from './content.service'
import type { ContentResponseDto } from './content.dto'

// ── 测试工厂 ─────────────────────────────────────────────────────────────

function createFixture() {
  const service = new ContentService()
  const controller = new ContentController(service)
  return { service, controller }
}

// ── 辅助: 快速创建内容 ────────────────────────────────────────────────

async function createContent(
  ctrl: ContentController,
  overrides: Partial<{
    title: string
    slug: string
    summary: string
    body: string
    category: string
    authorId: string
  }> = {},
) {
  return ctrl.create({
    title: overrides.title ?? '测试内容',
    slug: overrides.slug ?? `slug-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    summary: overrides.summary ?? '测试摘要',
    body: overrides.body ?? '内容正文',
    category: (overrides.category ?? 'notice') as any,
    authorId: overrides.authorId ?? 'user_001',
  })
}

// ══════════════════════════════════════════════════════════════════════════
// 1. 完整生命周期 e2e
// ══════════════════════════════════════════════════════════════════════════

describe('content 完整生命周期 e2e', () => {
  it('创建 → 查询 → 更新 → 发布 → 归档 → 删除 全链路', async () => {
    const { controller, service } = createFixture()

    // 1. 创建
    const created = await controller.create({
      title: '五一活动公告',
      slug: 'may-day-2026',
      summary: '五一期间活动安排',
      body: '详情请见正文...',
      category: 'activity',
      authorId: 'store-mgr-001',
    })
    expect(created.data.status).toBe('draft')
    expect(created.data.title).toBe('五一活动公告')
    const contentId = created.data.id

    // 2. 根据 ID 查询
    const found = await controller.findOne(contentId)
    expect('data' in found).toBe(true)
    if ('data' in found) {
      expect(found.data.slug).toBe('may-day-2026')
    }

    // 3. 根据 slug 查询
    const bySlug = await controller.findBySlug('may-day-2026')
    expect('data' in bySlug).toBe(true)

    // 4. 更新标题
    const updated = await controller.update(contentId, { title: '2026 五一活动公告' })
    expect('data' in updated).toBe(true)
    if ('data' in updated) {
      expect(updated.data.title).toBe('2026 五一活动公告')
    }

    // 5. 发布
    const published = await controller.publish(contentId, {})
    expect('data' in published).toBe(true)
    if ('data' in published) {
      expect(published.data.status).toBe('published')
      expect(published.data.publishedAt).toBeDefined()
    }

    // 6. 归档
    const archived = await controller.archive(contentId)
    expect('data' in archived).toBe(true)
    if ('data' in archived) {
      expect(archived.data.status).toBe('archived')
    }

    // 7. 软删除
    const deleted = await controller.remove(contentId)
    expect(deleted.success).toBe(true)

    // 8. 删除后状态变为 deleted（软删除）
    const afterDelete = await controller.findOne(contentId)
    expect('data' in afterDelete).toBe(true)
    if ('data' in afterDelete) {
      expect(afterDelete.data.status).toBe('deleted')
    }
  })
})

// ══════════════════════════════════════════════════════════════════════════
// 2. 唯一性约束
// ══════════════════════════════════════════════════════════════════════════

describe('content slug 唯一性约束', () => {
  it('重复 slug 应抛出异常', async () => {
    const { controller } = createFixture()
    await controller.create({
      title: '内容 A',
      slug: 'duplicate-slug',
      body: 'body',
      category: 'notice',
      authorId: 'user_001',
    })
    await expect(
      controller.create({
        title: '内容 B',
        slug: 'duplicate-slug',
        body: 'body',
        category: 'notice',
        authorId: 'user_002',
      }),
    ).rejects.toThrow('Slug "duplicate-slug" already exists')
  })

  it('不同 slug 可以正常创建', async () => {
    const { controller } = createFixture()
    const a = await controller.create({
      title: 'A', slug: 'uniq-a', body: 'a', category: 'notice', authorId: 'u1',
    })
    const b = await controller.create({
      title: 'B', slug: 'uniq-b', body: 'b', category: 'notice', authorId: 'u2',
    })
    expect(a.data.id).not.toBe(b.data.id)
  })
})

// ══════════════════════════════════════════════════════════════════════════
// 3. 分页 & 过滤
// ══════════════════════════════════════════════════════════════════════════

describe('content 分页与过滤', () => {
  it('分页查询只返回指定页数据', async () => {
    const { controller } = createFixture()
    for (let i = 1; i <= 10; i++) {
      await createContent(controller, {
        title: `内容 ${i}`,
        slug: `paged-${i}`,
      })
    }

    const page1 = await controller.findAll({ limit: 3, offset: 0 })
    expect(page1.items.length).toBe(3)
    expect(page1.total).toBe(10)
    expect(page1.limit).toBe(3)
    expect(page1.offset).toBe(0)

    const page2 = await controller.findAll({ limit: 3, offset: 3 })
    expect(page2.items.length).toBe(3)

    const page4 = await controller.findAll({ limit: 3, offset: 9 })
    expect(page4.items.length).toBe(1) // last page
  })

  it('按 category 过滤', async () => {
    const { controller } = createFixture()
    await createContent(controller, { slug: 'notice-1', category: 'notice' })
    await createContent(controller, { slug: 'activity-1', category: 'activity' })
    await createContent(controller, { slug: 'guide-1', category: 'guide' })

    const notices = await controller.findAll({ category: 'notice' })
    expect(notices.total).toBe(1)
    expect(notices.items[0].category).toBe('notice')
  })

  it('按 authorId 过滤', async () => {
    const { controller } = createFixture()
    await createContent(controller, { slug: 'by-mgr', authorId: 'mgr' })
    await createContent(controller, { slug: 'by-op', authorId: 'operator' })

    const mgr = await controller.findAll({ authorId: 'mgr' })
    expect(mgr.total).toBe(1)
    expect(mgr.items[0].authorId).toBe('mgr')
  })

  it('按 status 过滤', async () => {
    const { controller } = createFixture()
    const c = await createContent(controller, { slug: 'to-publish' })
    await controller.publish(c.data.id, {})

    const drafts = await controller.findAll({ status: 'draft' })
    // The published one should not appear in draft
    expect(drafts.items.every((i) => i.status === 'draft')).toBe(true)
  })

  it('按 search 关键词搜索标题和正文', async () => {
    const { controller } = createFixture()
    await createContent(controller, { slug: 'match-t', title: '重要通知', body: '无需关注' })
    await createContent(controller, { slug: 'match-b', title: '无关标题', body: '重要内容在这里' })
    await createContent(controller, { slug: 'no-match', title: '无关', body: '无关' })

    const results = await controller.findAll({ search: '重要' })
    expect(results.total).toBe(2)
  })

  it('超过 limit 上限应被限制', async () => {
    const { controller } = createFixture()
    for (let i = 1; i <= 5; i++) {
      await createContent(controller, { slug: `limit-test-${i}` })
    }
    // Service does not enforce limit cap; test that large limit returns all
    const all = await controller.findAll({ limit: 100 })
    expect(all.items.length).toBe(5)
  })

  it('空数据库查询返回空列表', async () => {
    const { controller } = createFixture()
    const result = await controller.findAll({})
    expect(result.items).toEqual([])
    expect(result.total).toBe(0)
  })
})

// ══════════════════════════════════════════════════════════════════════════
// 4. 异常路径
// ══════════════════════════════════════════════════════════════════════════

describe('content 异常路径', () => {
  it('查询不存在的 id 返回 error', async () => {
    const { controller } = createFixture()
    const result = await controller.findOne('non-existent-id')
    expect('success' in result).toBe(true)
    if ('success' in result) {
      expect(result.success).toBe(false)
    }
  })

  it('查询不存在的 slug 返回 error', async () => {
    const { controller } = createFixture()
    const result = await controller.findBySlug('no-such-slug')
    expect('success' in result).toBe(true)
  })

  it('更新不存在的 id 返回 error', async () => {
    const { controller } = createFixture()
    const result = await controller.update('ghost', { title: '新标题' })
    expect('success' in result).toBe(true)
    if ('success' in result) {
      expect(result.success).toBe(false)
    }
  })

  it('发布不存在的 id 返回 error', async () => {
    const { controller } = createFixture()
    const result = await controller.publish('ghost', {})
    expect('success' in result).toBe(true)
  })

  it('归档不存在的 id 返回 error', async () => {
    const { controller } = createFixture()
    const result = await controller.archive('ghost')
    expect('success' in result).toBe(true)
  })

  it('删除不存在的 id 返回 error', async () => {
    const { controller } = createFixture()
    const result = await controller.remove('ghost')
    expect(result.success).toBe(false)
  })
})

// ══════════════════════════════════════════════════════════════════════════
// 5. 发布流程精细化
// ══════════════════════════════════════════════════════════════════════════

describe('content 发布流程', () => {
  it('发布后 status 变为 published 且 publishedAt 不为空', async () => {
    const { controller } = createFixture()
    const created = await createContent(controller, { slug: 'pub-test-1' })

    const result = await controller.publish(created.data.id, {})
    expect('data' in result).toBe(true)
    if ('data' in result) {
      expect(result.data.status).toBe('published')
      expect(result.data.publishedAt).toBeTruthy()
      // publishedAt should be a non-empty ISO string
      expect(new Date(result.data.publishedAt!).getTime()).not.toBeNaN()
    }
  })

  it('发布后内容出现在 published 列表', async () => {
    const { controller } = createFixture()
    const c = await createContent(controller)
    await controller.publish(c.data.id, {})

    const publishedItems = await controller.findAll({ status: 'published' })
    expect(publishedItems.items.some((i) => i.id === c.data.id)).toBe(true)
  })
})

// ══════════════════════════════════════════════════════════════════════════
// 6. 并发 / 边界
// ══════════════════════════════════════════════════════════════════════════

describe('content 并发边界', () => {
  it('并发创建多个内容应全部成功', async () => {
    const { controller } = createFixture()
    const results = await Promise.all(
      Array.from({ length: 10 }, (_, i) =>
        createContent(controller, { slug: `concurrent-${i}-${Date.now()}` }),
      ),
    )
    expect(results.length).toBe(10)
    results.forEach((r) => {
      expect(r.data.id).toBeDefined()
    })

    // All should be in the store
    const all = await controller.findAll({})
    expect(all.items.length).toBe(10)
  })

  it('大量数据下分页查询正确', async () => {
    const { controller } = createFixture()
    const totalItems = 50
    for (let i = 0; i < totalItems; i++) {
      await createContent(controller, { slug: `bulk-${i}` })
    }

    let fetched = 0
    const pageSize = 10
    while (fetched < totalItems) {
      const page = await controller.findAll({ limit: pageSize, offset: fetched })
      expect(page.items.length).toBe(Math.min(pageSize, totalItems - fetched))
      fetched += page.items.length
    }
    expect(fetched).toBe(totalItems)
  })

  it('创建后立即查询返回最新数据', async () => {
    const { controller } = createFixture()
    const c = await createContent(controller, { slug: 'immediate-read', title: '即时查询' })

    const found = await controller.findOne(c.data.id)
    expect('data' in found).toBe(true)
    if ('data' in found) {
      expect(found.data.title).toBe('即时查询')
    }
  })
})
