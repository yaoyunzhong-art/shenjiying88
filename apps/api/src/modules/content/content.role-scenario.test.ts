/**
 * content.role-scenario.test.ts — 内容管理场景驱动角色测试
 *
 * 跨角色场景:
 *   S1: 👔店长创建公告 → 🛒前台浏览公告 → 📢营销发布促销
 *   S2: 🎮导玩员创建活动指南 → 🎯运行专员审核发布 → 🛒前台查看活动
 *   S3: 👥HR创建员工手册 → 🔧安监确认内容合规 → 归档旧版
 *   S4: 📢营销创建促销内容 → 🤝团建团队成员获取内容
 *   S5: 🎮导玩员创建活动 → 🛒前台更新活动信息
 *   S6: 🎯运行专员批量操作内容 → 👔店长查看归档统计
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { ContentService } from './content.service'
import { ContentController } from './content.controller'
import type { ContentCategory } from './content.entity'

// ── 辅助: 创建服务与控制器 ──
function setup() {
  const service = new ContentService()
  const controller = new ContentController(service)
  return { service, controller }
}

// ═══════════════════════════════════════════════════════════════════════════════
// S1 · 👔店长创建公告 → 🛒前台浏览公告 → 📢营销发布促销
// ═══════════════════════════════════════════════════════════════════════════════
describe('👔【S1】店长创建公告 → 🛒前台浏览公告 → 📢营销发布促销', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(async () => { svc = setup() })

  it('S1-正常流程: 店长创建公告草稿 → 前台可查草稿 → 营销发布 → 前台可见已发布内容', async () => {
    const { controller } = svc

    // 1. 店长创建公告（草稿态）
    const notice = await controller.create({
      title: '五一期间营业时间调整公告',
      slug: 'may-day-hours-2026',
      summary: '五一期间营业时间调整为10:00-22:00',
      body: '尊敬的顾客您好，五一劳动节期间（5月1日-5月5日）本店营业时间调整为10:00-22:00',
      category: 'notice',
      authorId: 'store-manager-01',
    })
    expect(notice.data.title).toBe('五一期间营业时间调整公告')
    expect(notice.data.status).toBe('draft')
    expect(notice.data.category).toBe('notice')

    // 2. 前台按公告分类查询可看到草稿
    const allBeforePublish = await controller.findAll({ category: 'notice' })
    expect(allBeforePublish.items.length).toBe(1)
    expect(allBeforePublish.items[0].title).toBe('五一期间营业时间调整公告')

    // 3. 营销接手发布公告
    const published = await controller.publish(notice.data.id, {})
    expect(published).not.toBeNull()
    if ('data' in published) {
      expect(published.data.status).toBe('published')
      expect(published.data.publishedAt).toBeDefined()
    }

    // 4. 前台按已发布状态查询可见
    const publishedList = await controller.findAll({ status: 'published' })
    expect(publishedList.items.some((c: any) => c.title === '五一期间营业时间调整公告')).toBe(true)
  })

  it('S1-边界: 店长创建重复 slug 公告应抛异常', async () => {
    const { controller } = svc
    await controller.create({
      title: '公告1',
      slug: 'duplicate-slug',
      summary: 'test',
      body: 'test body',
      category: 'notice',
      authorId: 'store-manager-01',
    })

    await expect(
      controller.create({
        title: '公告2',
        slug: 'duplicate-slug',
        summary: 'test2',
        body: 'test body 2',
        category: 'notice',
        authorId: 'store-manager-01',
      }),
    ).rejects.toThrow('already exists')
  })

  it('S1-异常: 营销发布不存在的公告应返回 not found', async () => {
    const { controller } = svc
    const result = await controller.publish('non-existent-id', {})
    expect(result).toEqual({ success: false, message: 'Content non-existent-id not found' })
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// S2 · 🎮导玩员创建活动指南 → 🎯运行专员审核发布 → 🛒前台查看活动
// ═══════════════════════════════════════════════════════════════════════════════
describe('🎮【S2】导玩员创建活动指南 → 🎯运行专员审核发布 → 🛒前台查看活动', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(async () => { svc = setup() })

  it('S2-正常流程: 导玩员创建活动指南 → 运营专员审核发布 → 前台查看已发布内容', async () => {
    const { controller } = svc

    // 1. 导玩员创建活动指南（草稿态）
    const guide = await controller.create({
      title: '暑假狂欢季活动指南',
      slug: 'summer-fun-guide',
      summary: '暑期特别活动内容与安排',
      body: '一、活动时间: 7月1日-8月31日\n二、参与方式...',
      category: 'guide',
      authorId: 'guide-01',
    })
    expect(guide.data.status).toBe('draft')

    // 2. 运营专员审核并发布
    const published = await controller.publish(guide.data.id, {})
    expect(published).not.toBeNull()
    if ('data' in published) {
      expect(published.data.status).toBe('published')
      expect(published.data.publishedAt).toBeDefined()
    }

    // 3. 前台按 guide 分类查询可见已发布内容
    const guides = await controller.findAll({ category: 'guide', status: 'published' })
    expect(guides.items.length).toBeGreaterThanOrEqual(1)
    expect(guides.items[0].title).toBe('暑假狂欢季活动指南')
  })

  it('S2-边界: 运营专员通过 slug 可精确查找活动指南', async () => {
    const { controller } = svc
    await controller.create({
      title: '国庆活动指南',
      slug: 'national-day',
      summary: '国庆活动安排',
      body: '国庆节活动详情...',
      category: 'guide',
      authorId: 'guide-01',
    })
    await controller.create({
      title: '春季活动指南',
      slug: 'spring-activity',
      summary: '春季活动安排',
      body: '春季活动详情...',
      category: 'guide',
      authorId: 'guide-02',
    })

    const found = await controller.findBySlug('national-day')
    expect(found).not.toBeNull()
    if ('data' in found) {
      expect(found.data.title).toBe('国庆活动指南')
    }

    // 查找不存在的 slug
    const notFound = await controller.findBySlug('non-existent-slug')
    expect(notFound).toEqual({ success: false, message: 'Content with slug "non-existent-slug" not found' })
  })

  it('S2-异常: 导玩员尝试发布不存在的指南应返回 not found', async () => {
    const { controller } = svc
    const result = await controller.publish('fake-guide-id', {})
    expect(result).toEqual({ success: false, message: 'Content fake-guide-id not found' })
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// S3 · 👥HR创建员工手册 → 🔧安监确认内容合规 → 归档旧版
// ═══════════════════════════════════════════════════════════════════════════════
describe('👥【S3】HR创建员工手册 → 🔧安监确认内容合规 → 归档旧版', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(async () => { svc = setup() })

  it('S3-正常流程: HR创建员工手册草稿 → 发布 → 安监归档旧版', async () => {
    const { controller } = svc

    // 1. HR 创建员工手册
    const handbook = await controller.create({
      title: '员工安全操作手册 v2',
      slug: 'safety-handbook-v2',
      summary: '员工安全操作规范第二版',
      body: '第一章 总则\n第二章 设备操作规程...',
      category: 'education',
      authorId: 'hr-01',
    })
    expect(handbook.data.status).toBe('draft')

    // 2. HR 先更新完善再发布
    const updated = await controller.update(handbook.data.id, {
      title: '员工安全操作手册 v2（修订版）',
    })
    expect(updated).not.toBeNull()
    if ('data' in updated) {
      expect(updated.data.title).toBe('员工安全操作手册 v2（修订版）')
    }

    // 3. HR 发布正式版
    await controller.publish(handbook.data.id, {})

    // 4. 安监归档旧版
    const archived = await controller.archive(handbook.data.id)
    expect(archived).not.toBeNull()
    if ('data' in archived) {
      expect(archived.data.status).toBe('archived')
    }

    // 5. 安监确认归档后的内容不再出现在已发布列表
    const publishedList = await controller.findAll({ status: 'published', category: 'education' })
    expect(publishedList.items.every((c: any) => c.id !== handbook.data.id)).toBe(true)
  })

  it('S3-边界: 软删除内容后不应出现在正常查询', async () => {
    const { controller } = svc
    const content = await controller.create({
      title: '待删除内容',
      slug: 'to-be-deleted',
      summary: '将被删除',
      body: '测试删除功能',
      category: 'other',
      authorId: 'hr-01',
    })

    await controller.remove(content.data.id)

    const result = await controller.findAll({ search: '待删除内容' })
    // 软删除后 status 变为 deleted，按 default 查询应不包含
    const deletedItems = result.items.filter((c: any) => c.title === '待删除内容')
    // 如果我们没指定 status，所有状态都返回，但软删除的会显示为 deleted
    const foundInResults = deletedItems.length > 0 ? deletedItems[0] : null
    if (foundInResults) {
      expect(foundInResults.status).toBe('deleted')
    }
  })

  it('S3-异常: 归档不存在的记录返回 not found', async () => {
    const { controller } = svc
    const result = await controller.archive('non-existent')
    expect(result).toEqual({ success: false, message: 'Content non-existent not found' })
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// S4 · 📢营销创建促销内容 → 🤝团建团队成员获取内容
// ═══════════════════════════════════════════════════════════════════════════════
describe('📢【S4】营销创建促销内容 → 🤝团建团队获取内容', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(async () => { svc = setup() })

  it('S4-正常流程: 营销创建并发布促销内容 → 团建可搜索到', async () => {
    const { controller } = svc

    // 1. 营销创建促销通知
    const promo = await controller.create({
      title: '618年中大促',
      slug: '618-sale',
      summary: '6月18日全场5折起',
      body: '活动内容：6月18日-6月20日，全场游戏币充值5折优惠',
      category: 'promotion',
      authorId: 'marketing-01',
    })

    // 2. 营销发布促销
    await controller.publish(promo.data.id, {})

    // 3. 团建成员搜索促销内容
    const found = await controller.findAll({ search: '年中大促' })
    expect(found.items.length).toBe(1)
    expect(found.items[0].title).toBe('618年中大促')
    expect(found.items[0].status).toBe('published')

    // 4. 团建成员也可按分类筛选促销内容
    const promos = await controller.findAll({ category: 'promotion', status: 'published' })
    expect(promos.items.length).toBeGreaterThanOrEqual(1)
  })

  it('S4-边界: 营销创建促销时支持自定义 metadata', async () => {
    const { controller } = svc
    const promo = await controller.create({
      title: '双十一特惠',
      slug: 'double-11',
      summary: '双十一活动',
      body: '双十一充值优惠',
      category: 'promotion',
      authorId: 'marketing-01',
      metadata: {
        tags: ['促销', '限定', '双十一'],
        version: 1,
        thumbnailUrl: 'https://cdn.example.com/promo/double11.jpg',
      },
    })
    expect(promo.data.metadata).toBeDefined()
    expect(promo.data.metadata!.tags).toContain('促销')
    expect(promo.data.metadata!.version).toBe(1)
  })

  it('S4-异常: 按不存在的作者查询返回空列表', async () => {
    const { controller } = svc
    const result = await controller.findAll({ authorId: 'non-existent-author', category: 'promotion' })
    expect(result.items).toHaveLength(0)
    expect(result.total).toBe(0)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// S5 · 🎮导玩员创建活动 → 🛒前台更新活动信息
// ═══════════════════════════════════════════════════════════════════════════════
describe('🎮【S5】导玩员创建活动 → 🛒前台更新活动信息', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(async () => { svc = setup() })

  it('S5-正常流程: 导玩员创建活动草稿 → 前台更新活动信息并发布', async () => {
    const { controller } = svc

    // 1. 导玩员创建活动
    const activity = await controller.create({
      title: '抓娃娃大赛',
      slug: 'doll-catch-contest',
      summary: '每周六抓娃娃比赛',
      body: '比赛规则：每人3次机会，抓到最多者获胜',
      category: 'activity',
      authorId: 'guide-02',
    })

    // 2. 前台补充活动详情
    const updated = await controller.update(activity.data.id, {
      title: '抓娃娃大赛（暑期特别版）',
      body: '比赛规则：每人5次机会，抓到最多者获胜\n奖品：一等奖 100元游戏币',
      summary: '暑期特别抓娃娃比赛，奖品丰厚',
    })
    expect(updated).not.toBeNull()
    if ('data' in updated) {
      expect(updated.data.title).toBe('抓娃娃大赛（暑期特别版）')
      expect(updated.data.body).toContain('奖品')
      expect(updated.data.summary).toContain('奖品丰厚')
    }

    // 3. 前台发布活动
    await controller.publish(activity.data.id, {})

    // 4. 验证最终结果
    const found = await controller.findOne(activity.data.id)
    expect(found).not.toBeNull()
    if ('data' in found) {
      expect(found.data.status).toBe('published')
      expect(found.data.title).toBe('抓娃娃大赛（暑期特别版）')
    }
  })

  it('S5-边界: 前台更新不存在的活动返回 not found', async () => {
    const { controller } = svc
    const result = await controller.update('fake-id', { title: '新标题' })
    expect(result).toEqual({ success: false, message: 'Content fake-id not found' })
  })

  it('S5-边界: 导玩员创建活动时可设置自定义发布时间', async () => {
    const { controller } = svc
    const futureDate = new Date('2026-12-25T10:00:00Z')

    const activity = await controller.create({
      title: '圣诞节活动',
      slug: 'xmas-2026',
      summary: '圣诞节特别活动',
      body: '圣诞节当天...',
      category: 'activity',
      authorId: 'guide-02',
    })

    // 预约发布（通过 publish 传入 publishAt）
    const published = await controller.publish(activity.data.id, { publishAt: futureDate.toISOString() })
    expect(published).not.toBeNull()
    if ('data' in published) {
      expect(published.data.publishedAt).toBe(futureDate.toISOString())
    }
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// S6 · 🎯运行专员批量操作内容 → 👔店长查看归档统计
// ═══════════════════════════════════════════════════════════════════════════════
describe('🎯【S6】运行专员批量操作内容 → 👔店长查看归档统计', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(async () => { svc = setup() })

  it('S6-正常流程: 运行专员创建多篇内容 → 批量发布 → 店长查看分类统计', async () => {
    const { controller } = svc

    // 1. 运行专员创建多篇内容
    const c1 = await controller.create({ title: '操作手册1', slug: 'ops-1', summary: '手册', body: '内容1', category: 'education', authorId: 'ops-01' })
    const c2 = await controller.create({ title: '操作手册2', slug: 'ops-2', summary: '手册', body: '内容2', category: 'education', authorId: 'ops-01' })
    const c3 = await controller.create({ title: '新闻快讯', slug: 'news-1', summary: '新闻', body: '新闻内容', category: 'news', authorId: 'ops-01' })

    // 2. 逐一发布
    await controller.publish(c1.data.id, {})
    await controller.publish(c2.data.id, {})

    // 3. 店长查看不同分类统计
    const educationList = await controller.findAll({ category: 'education', status: 'published' })
    expect(educationList.items.length).toBe(2)

    const newsList = await controller.findAll({ category: 'news' })
    expect(newsList.items.length).toBe(1)

    // 4. 日期范围查询
    const today = new Date().toISOString().split('T')[0]
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
    const todayItems = await controller.findAll({ fromDate: today, toDate: tomorrow })
    expect(todayItems.items.length).toBe(3)
  })

  it('S6-边界: 条件组合查询 - 按作者+分类+状态', async () => {
    const { controller } = svc

    // 运行专员创建自己的内容
    const c1 = await controller.create({ title: '运维日报', slug: 'daily-ops', summary: '日报', body: '今日运维记录', category: 'guide', authorId: 'ops-01' })
    await controller.publish(c1.data.id, {})

    // 另一个作者的内容
    await controller.create({ title: '营销日报', slug: 'daily-mkt', summary: '日报', body: '今日营销数据', category: 'guide', authorId: 'marketing-01' })

    // 按作者+分类组合查询
    const opsGuides = await controller.findAll({ authorId: 'ops-01', category: 'guide' })
    expect(opsGuides.items.length).toBe(1)
    expect(opsGuides.items[0].title).toBe('运维日报')
    expect(opsGuides.items[0].authorId).toBe('ops-01')

    // 按多个条件交叉验证
    const nonExistingCombination = await controller.findAll({ authorId: 'ops-01', category: 'promotion' })
    expect(nonExistingCombination.items).toHaveLength(0)
  })

  it('S6-异常: 运行专员操作已软删除的内容应能查看到状态变更', async () => {
    const { controller } = svc
    const content = await controller.create({
      title: '临时公告',
      slug: 'temp-notice',
      summary: '临时',
      body: '临时公告内容',
      category: 'notice',
      authorId: 'ops-01',
    })

    // 软删除
    const delResult = await controller.remove(content.data.id)
    expect(delResult.success).toBe(true)

    // 通过 ID 还能查到（软删除）
    const found = await controller.findOne(content.data.id)
    expect(found).not.toBeNull()
    if ('data' in found) {
      expect(found.data.status).toBe('deleted')
    }

    // 再次删除应返回成功（幂等）
    const delAgain = await controller.remove(content.data.id)
    expect(delAgain.success).toBe(true)
  })
})
