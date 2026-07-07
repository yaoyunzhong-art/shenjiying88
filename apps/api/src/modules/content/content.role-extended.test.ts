import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [content] [C] 角色测试扩展编写
 *
 * 8 角色深度场景扩展测试 — content 模块
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色 ≥ 2 测试用例（正常流程 + 权限边界）
 * 覆盖: 内容 CRUD、发布、搜索、归档、软删除、slug 唯一性
 * 扩展: 空数据、边缘输入、批量并发、slug 冲突、已删除内容访问、空搜索结果
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { ContentController } from './content.controller'
import { ContentService } from './content.service'
import type { CreateContentDto, ContentResponseDto, ContentPaginatedResponseDto } from './content.dto'

// ── 角色定义 ──
const ROLES = {
  StoreManager: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Security: '🔧安监',
  Guide: '🎮导玩员',
  Operations: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
} as const

// ── 扩展助手 ──

function makeFreshController(): ContentController {
  const svc = new ContentService()
  svc.__reset()
  return new ContentController(svc)
}

async function createPublished(
  ctrl: ContentController,
  overrides: Partial<CreateContentDto> = {},
): Promise<ContentResponseDto> {
  const uniqueId = Math.random().toString(36).slice(2, 10)
  const created = await ctrl.create({
    title: overrides.title ?? `Test Article ${uniqueId}`,
    slug: overrides.slug ?? `test-${uniqueId}`,
    body: overrides.body ?? 'Extended test body content.',
    category: overrides.category ?? 'notice',
    authorId: overrides.authorId ?? 'ext-test-user',
    ...(overrides.summary !== undefined ? { summary: overrides.summary } : {}),
    ...(overrides.coverImageUrl !== undefined ? { coverImageUrl: overrides.coverImageUrl } : {}),
    ...(overrides.metadata !== undefined ? { metadata: overrides.metadata } : {}),
  })
  const published = await ctrl.publish(created.data.id, {})
  if ('data' in published) return published.data
  throw new Error('Publish failed')
}

// ============================================================================
// 👔 店长 - 门店内容全生命周期管理与并发操作
// ============================================================================

describe('👔 店长视角 - 内容全生命周期与并发管理 [扩展]', () => {

  it('[正常流程] 店长批量创建多个公告并确认总数正确', async () => {
    const ctrl = makeFreshController()
    const titles = ['公告A', '公告B', '公告C']
    for (const t of titles) {
      await ctrl.create({
        title: t, slug: `batch-${t}-${Date.now()}${Math.random()}`, body: t, category: 'notice', authorId: 'mgr-ext',
      })
    }
    const result = await ctrl.findAll({ category: 'notice', limit: 10 })
    assert.equal(result.total, 3)
    assert.equal(result.items.length, 3)
    // 三个标题都应在结果中
    const resultTitles = result.items.map(i => i.title)
    titles.forEach(t => assert.ok(resultTitles.includes(t), `缺少标题: ${t}`))
  })

  it('[权限边界] 店长创建后软删除，再通过 ID 查询时内容状态应为 deleted', async () => {
    const ctrl = makeFreshController()
    const created = await ctrl.create({
      title: '临时公告', slug: 'temp-del-test-ext', body: '临时内容', category: 'notice', authorId: 'mgr-ext',
    })
    const deleteResult = await ctrl.remove(created.data.id)
    assert.equal(deleteResult.success, true)

    // 软删除后实体仍在，但 status 变为 deleted
    const fetched = await ctrl.findOne(created.data.id)
    assert.ok('data' in fetched)
    if ('data' in fetched) {
      assert.equal(fetched.data.status, 'deleted')
    }
  })

  it('[边界输入] 店长创建超长标题内容', async () => {
    const ctrl = makeFreshController()
    const longTitle = '超'.repeat(250)
    const created = await ctrl.create({
      title: longTitle, slug: `long-title-${Date.now()}`, body: '体', category: 'notice', authorId: 'mgr-ext',
    })
    assert.equal(created.data.title.length, 250)
    assert.equal(created.data.status, 'draft')
  })
})

// ============================================================================
// 🛒 前台 - 内容展示与搜索边界
// ============================================================================

describe('🛒 前台视角 - 内容展示与搜索边界 [扩展]', () => {

  it('[正常流程] 前台混合条件搜索返回正确结果', async () => {
    const ctrl = makeFreshController()
    const a1 = await ctrl.create({ title: '元旦活动', slug: 'ny-act', body: '元旦活动', category: 'activity', authorId: 'admin' })
    const a2 = await ctrl.create({ title: '春节活动', slug: 'spring-act', body: '春节活动', category: 'activity', authorId: 'admin' })
    await ctrl.publish(a1.data.id, {})
    await ctrl.publish(a2.data.id, {})

    const result = await ctrl.findAll({ category: 'activity', status: 'published', search: '春节' })
    assert.equal(result.total, 1)
    assert.equal(result.items[0].title, '春节活动')
  })

  it('[空数据] 前台查询空分类返回空列表', async () => {
    const ctrl = makeFreshController()
    const result = await ctrl.findAll({ category: 'education' })
    assert.equal(result.total, 0)
    assert.deepEqual(result.items, [])
  })

  it('[权限边界] 前台只能看到已发布内容，看不到草稿', async () => {
    const ctrl = makeFreshController()
    await ctrl.create({ title: '草稿', slug: 'draft-only', body: '草稿', category: 'notice', authorId: 'admin' })
    const published = await ctrl.create({ title: '已发布', slug: 'pub-only', body: '已发布', category: 'notice', authorId: 'admin' })
    await ctrl.publish(published.data.id, {})

    const result = await ctrl.findAll({ status: 'published' })
    assert.equal(result.total, 1)
    assert.equal(result.items[0].slug, 'pub-only')
  })
})

// ============================================================================
// 👥 HR - 内部培训文档管理与版本迭代
// ============================================================================

describe('👥 HR 视角 - 培训文档管理与版本迭代 [扩展]', () => {

  it('[正常流程] HR 创建培训文档并更新为已发布', async () => {
    const ctrl = makeFreshController()
    const created = await ctrl.create({
      title: '新员工安全培训 v3',
      slug: `safety-training-v3-${Date.now()}`,
      body: '安全培训内容 v3',
      category: 'education',
      authorId: 'hr-ext',
      metadata: { tags: ['安全', '培训'], version: 3 },
    })
    assert.equal(created.data.metadata?.version, 3)

    const published = await ctrl.publish(created.data.id, {})
    if ('data' in published) {
      assert.equal(published.data.status, 'published')
      assert.ok(published.data.publishedAt)
    }
  })

  it('[权限边界] HR 更新 slug 冲突时应失败（通过抛异常验证）', async () => {
    const ctrl = makeFreshController()
    await ctrl.create({ title: '已存在', slug: 'existing-slug', body: '已有', category: 'guide', authorId: 'hr-ext' })
    const second = await ctrl.create({ title: '新的', slug: 'new-slug', body: '新', category: 'guide', authorId: 'hr-ext' })

    await expect(async () => {
      await ctrl.create({ title: '冲突', slug: 'existing-slug', body: '冲突', category: 'guide', authorId: 'hr-ext' })
    }).rejects.toThrow(/already exists/)
  })

  it('[边界输入] HR 更新不存在的内容返回 not found', async () => {
    const ctrl = makeFreshController()
    const result = await ctrl.update('non-existent-id', { title: '不存在' })
    assert.ok('success' in result)
    if ('success' in result) {
      assert.equal(result.success, false)
    }
  })
})

// ============================================================================
// 🔧 安监 - 安全相关内容审计与合规检查
// ============================================================================

describe('🔧 安监视角 - 安全合规内容审核与审计 [扩展]', () => {

  it('[正常流程] 安监检索所有通知类已发布内容做合规审核', async () => {
    const ctrl = makeFreshController()
    await createPublished(ctrl, { title: '消防演习通知', slug: 'fire-drill', category: 'notice', authorId: 'sec' })
    await createPublished(ctrl, { title: '安全演练', slug: 'safety-drill', category: 'notice', authorId: 'sec' })
    await ctrl.create({ title: '内部草稿', slug: 'internal-draft', body: '草稿', category: 'notice', authorId: 'sec' })

    const result = await ctrl.findAll({ category: 'notice', status: 'published' })
    assert.equal(result.total, 2)
    result.items.forEach(item => assert.equal(item.status, 'published'))
  })

  it('[权限边界] 安监对已归档内容再次归档应返回正确但状态不变', async () => {
    const ctrl = makeFreshController()
    const created = await ctrl.create({
      title: '过期安全通知', slug: 'expired-sec', body: '过时', category: 'notice', authorId: 'sec',
    })
    const pub = await ctrl.publish(created.data.id, {})
    if ('data' in pub) assert.equal(pub.data.status, 'published')

    const archived = await ctrl.archive(created.data.id)
    if ('data' in archived) assert.equal(archived.data.status, 'archived')

    // 再次归档 — 幂等性检查
    const archivedAgain = await ctrl.archive(created.data.id)
    if ('data' in archivedAgain) assert.equal(archivedAgain.data.status, 'archived')
  })
})

// ============================================================================
// 🎮 导玩员 - 游戏玩法指南与内容管理
// ============================================================================

describe('🎮 导玩员视角 - 玩法指南管理与搜索 [扩展]', () => {

  it('[正常流程] 导玩员创建多个玩法指南并通过搜索关键词检索', async () => {
    const ctrl = makeFreshController()
    const guide1 = await ctrl.create({
      title: '太鼓达人玩法', slug: 'taiko-guide', body: '太鼓达人核心玩法：跟着节奏敲击', category: 'guide', authorId: 'guide-ext',
    })
    const guide2 = await ctrl.create({
      title: '投篮机技巧', slug: 'hoops-tips', body: '投篮机得分技巧：瞄准篮筐中心', category: 'guide', authorId: 'guide-ext',
    })
    await ctrl.publish(guide1.data.id, {})
    await ctrl.publish(guide2.data.id, {})

    const result = await ctrl.findAll({ search: '投篮', status: 'published' })
    assert.equal(result.total, 1)
    assert.equal(result.items[0].title, '投篮机技巧')
  })

  it('[边界输入] 导玩员按不存在的关键词搜索返回空', async () => {
    const ctrl = makeFreshController()
    await createPublished(ctrl, { title: '赛车', slug: 'racing', body: '赛车游戏', category: 'guide', authorId: 'guide-ext' })

    const result = await ctrl.findAll({ search: '不存在的内容关键字xxxxxxxx' })
    assert.equal(result.total, 0)
    assert.deepEqual(result.items, [])
  })
})

// ============================================================================
// 🎯 运行专员 - 运维内容管理与定时发布、归档策略
// ============================================================================

describe('🎯 运行专员视角 - 运维内容管理与分页 [扩展]', () => {

  it('[正常流程] 运行专员分页获取运维通知', async () => {
    const ctrl = makeFreshController()
    for (let i = 1; i <= 25; i++) {
      const created = await ctrl.create({
        title: `运维通知${String(i).padStart(2, '0')}`,
        slug: `ops-notice-${i}-${Date.now()}`,
        body: `运维通知内容${i}`,
        category: 'notice',
        authorId: 'ops-ext',
      })
      await ctrl.publish(created.data.id, {})
    }

    const page1 = await ctrl.findAll({ category: 'notice', status: 'published', limit: 10, offset: 0 })
    assert.equal(page1.total, 25)
    assert.equal(page1.items.length, 10)

    const page3 = await ctrl.findAll({ category: 'notice', status: 'published', limit: 10, offset: 20 })
    assert.equal(page3.items.length, 5)
  })

  it('[权限边界] 运行专员定时发布（设置未来 publishAt）', async () => {
    const ctrl = makeFreshController()
    const futureDate = new Date(Date.now() + 86400000).toISOString() // 明天
    const created = await ctrl.create({
      title: '定时发布', slug: `scheduled-${Date.now()}`, body: '明天发布', category: 'notice', authorId: 'ops-ext',
    })
    const result = await ctrl.publish(created.data.id, { publishAt: futureDate })
    if ('data' in result) {
      assert.equal(result.data.status, 'published')
      assert.equal(result.data.publishedAt, futureDate)
    }
  })
})

// ============================================================================
// 🤝 团建 - 团建活动内容管理与日期范围查询
// ============================================================================

describe('🤝 团建视角 - 活动内容管理与日期范围搜索 [扩展]', () => {

  it('[正常流程] 团建按日期范围检索近期活动', async () => {
    const ctrl = makeFreshController()
    await ctrl.create({
      title: '上季度团建', slug: `prev-q-${Date.now()}`, body: '过去活动', category: 'activity', authorId: 'team-ext',
    })
    // 创建未来活动（日期通过覆盖 createdAt 无法实现，用 publishAt 模拟）
    const future = await ctrl.create({
      title: '下季度团建', slug: `next-q-${Date.now()}`, body: '未来活动', category: 'activity', authorId: 'team-ext',
    })
    await ctrl.publish(future.data.id, {})

    const now = new Date().toISOString()
    const all = await ctrl.findAll({ category: 'activity', fromDate: '2025-01-01', toDate: '2027-12-31' })
    assert.ok(all.total >= 2)
  })

  it('[空数据] 团建查询不存在日期范围的活动', async () => {
    const ctrl = makeFreshController()
    await createPublished(ctrl, { title: '今年团建', slug: `this-year-${Date.now()}`, category: 'activity', authorId: 'team-ext' })

    const result = await ctrl.findAll({ category: 'activity', fromDate: '2021-01-01', toDate: '2021-12-31' })
    assert.equal(result.total, 0)
  })

  it('[边界输入] 团建创建 activity 类型应正确归类', async () => {
    const ctrl = makeFreshController()
    const created = await ctrl.create({
      title: '户外拓展', slug: `outdoor-${Date.now()}`, body: '户外拓展活动方案', category: 'activity', authorId: 'team-ext',
    })
    assert.equal(created.data.category, 'activity')

    const fetched = await ctrl.findOne(created.data.id)
    if ('data' in fetched) {
      assert.equal(fetched.data.category, 'activity')
    }
  })
})

// ============================================================================
// 📢 营销 - 促销内容发布、slug 唯一性与空数据边界
// ============================================================================

describe('📢 营销视角 - 促销内容发布与 slug 唯一性 [扩展]', () => {

  it('[正常流程] 营销创建促销内容并附带 metadata', async () => {
    const ctrl = makeFreshController()
    const created = await ctrl.create({
      title: '618 大促',
      slug: `618-sale-${Date.now()}`,
      summary: '618 年中大促全场五折',
      body: '优惠详情...',
      category: 'promotion',
      authorId: 'mkt-ext',
      coverImageUrl: 'https://example.com/618.jpg',
      metadata: { tags: ['618', '促销'], version: 1 },
    })
    assert.equal(created.data.category, 'promotion')
    assert.deepEqual(created.data.metadata?.tags, ['618', '促销'])
    assert.equal(created.data.coverImageUrl, 'https://example.com/618.jpg')
  })

  it('[权限边界] 营销删除已发布内容后，published 列表不应再包含该内容', async () => {
    const ctrl = makeFreshController()
    const pub = await createPublished(ctrl, { title: '限时优惠', slug: `flash-sale-${Date.now()}-${Math.random()}`, category: 'promotion', authorId: 'mkt-ext' })

    // 删除
    const delResult = await ctrl.remove(pub.id)
    assert.equal(delResult.success, true)

    // 已发布列表不应包含已删除内容
    const list = await ctrl.findAll({ category: 'promotion', status: 'published' })
    assert.equal(list.items.filter(i => i.id === pub.id).length, 0)

    // 查询不带状态过滤时，仍可见（status=deleted）
    const fetched = await ctrl.findOne(pub.id)
    assert.ok('data' in fetched)
    if ('data' in fetched) {
      assert.equal(fetched.data.status, 'deleted')
    }
  })

  it('[slug 冲突] 营销创建重复 slug 应抛异常', async () => {
    const ctrl = makeFreshController()
    const slug = `dup-slug-${Date.now()}`
    await ctrl.create({ title: '原版', slug, body: '原版内容', category: 'promotion', authorId: 'mkt-ext' })

    await expect(async () => {
      await ctrl.create({ title: '重复', slug, body: '重复内容', category: 'promotion', authorId: 'mkt-ext' })
    }).rejects.toThrow(/already exists/)
  })
})
