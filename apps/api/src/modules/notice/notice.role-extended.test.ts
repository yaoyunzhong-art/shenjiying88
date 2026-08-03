import { describe, it, expect, beforeEach } from 'vitest'
/**
 * 🐜 [notice] 8角色扩展测试
 * 覆盖公告创建/列表/详情/发布/归档/更新/删除/标记已读/置顶排序
 * 8角色×3场景 = 24+ tests
 *
 * 8角色: 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 */

import { NoticeController } from './notice.controller'
import { NoticeService, resetNoticeServiceTestState } from './notice.service'
import type { RequestTenantContext } from '../tenant/tenant.types'
import { NoticePriority, NoticeScope } from './notice.entity'

let service: NoticeService
let controller: NoticeController
const defaultTenantCtx: RequestTenantContext = {
  tenantId: 't-demo',
  brandId: 'b-demo',
  storeId: 's-demo',
  marketCode: 'zh-cn',
}

/** 每次 describe 前重置 NoticeService 的静态状态 */
function resetSvc() {
  resetNoticeServiceTestState()
  service = new NoticeService()
  controller = new NoticeController(service)
}

/**
 * 创建公告并返回内部 notice id（controller 合约隐藏 id，需要通过 service 回查）
 */
function createNotice(opts: {
  title: string
  content: string
  scope: NoticeScope
  priority?: NoticePriority
  authorId?: string
  authorName?: string
  scheduledAt?: string
  expireAt?: string
  stickyOrder?: number
  coverUrl?: string
  summary?: string
  tags?: string[]
}) {
  const contract = controller.create(defaultTenantCtx, {
    title: opts.title,
    content: opts.content,
    scope: opts.scope,
    priority: opts.priority ?? NoticePriority.Normal,
    authorId: opts.authorId ?? 'test-user',
    authorName: opts.authorName ?? '测试用户',
    scheduledAt: opts.scheduledAt,
    expireAt: opts.expireAt,
    stickyOrder: opts.stickyOrder,
    coverUrl: opts.coverUrl,
    summary: opts.summary,
    tags: opts.tags,
  })
  const notice = service.getByCode(contract.code)
  if (!notice) throw new Error(`Notice with code ${contract.code} not found`)
  return { contract, noticeId: notice.id, code: contract.code }
}

// ══════════════════════════════════════════════════════════════
// 👔店长 — 公告 CRUD 与全局管理
// ══════════════════════════════════════════════════════════════
describe('👔店长 notice 扩展测试', () => {
  beforeEach(() => resetSvc())

  it('店长创建门店级公告并查看详情', () => {
    const { contract } = createNotice({
      title: '明日设备检修通知',
      content: '明日上午9-11时暂停营业进行设备检修',
      scope: NoticeScope.Store,
      priority: NoticePriority.High,
      authorId: 'mgr-001',
      authorName: '王店长',
    })
    expect(contract.title).toBe('明日设备检修通知')
    expect(contract.status).toBe('DRAFT')
    expect(contract.scope).toBe('STORE')
  })

  it('店长发布公告后状态变为 PUBLISHED', () => {
    const { noticeId } = createNotice({
      title: '开业通知', content: '今日正常营业',
      scope: NoticeScope.Store, priority: NoticePriority.Normal,
      authorId: 'mgr-002', authorName: '李店长',
    })
    const published = controller.publish(noticeId)
    expect(published.status).toBe('PUBLISHED')
    expect(published.publishedAt).toBeDefined()
  })

  it('店长查询公告列表包含已创建的公告', () => {
    createNotice({
      title: '盘点通知', content: '今晚盘点',
      scope: NoticeScope.Store, priority: NoticePriority.Normal,
      authorId: 'mgr-003', authorName: '店长张',
    })
    const list = controller.list(defaultTenantCtx, {})
    expect(list.total).toBeGreaterThanOrEqual(1)
  })
})

// ══════════════════════════════════════════════════════════════
// 🛒前台 — 前台查看已发布公告
// ══════════════════════════════════════════════════════════════
describe('🛒前台 notice 扩展测试', () => {
  beforeEach(() => resetSvc())

  it('前台查看已发布公告列表', () => {
    const { noticeId } = createNotice({
      title: '今日活动', content: '充值优惠',
      scope: NoticeScope.Store, priority: NoticePriority.Normal,
      authorId: 'admin', authorName: '系统',
    })
    controller.publish(noticeId)
    const published = controller.listPublished({})
    expect(published.total).toBeGreaterThanOrEqual(1)
    expect(published.items[0].status).toBe('PUBLISHED')
  })

  it('前台标记公告为已读', () => {
    const { noticeId } = createNotice({
      title: '重要通知', content: '安全须知',
      scope: NoticeScope.Store, priority: NoticePriority.Urgent,
      authorId: 'admin', authorName: '系统',
    })
    controller.publish(noticeId)
    const read = controller.markRead(noticeId, { userId: 'recept-001', userName: '前台小赵' })
    expect(read.readCount).toBe(1)
    expect(read.read).toBe(true)
  })

  it('前台重复标记已读不增加计数', () => {
    const { noticeId } = createNotice({
      title: '多读测试', content: '公告内容',
      scope: NoticeScope.Tenant, priority: NoticePriority.Normal,
      authorId: 'admin', authorName: '系统',
    })
    controller.publish(noticeId)
    controller.markRead(noticeId, { userId: 'recept-002', userName: '前台' })
    controller.markRead(noticeId, { userId: 'recept-002', userName: '前台' })
    const detail = controller.getById(noticeId, 'recept-002')
    expect(detail).toBeDefined()
    expect(detail!.readCount).toBe(1)
  })
})

// ══════════════════════════════════════════════════════════════
// 👥HR — HR 发布人事相关公告
// ══════════════════════════════════════════════════════════════
describe('👥HR notice 扩展测试', () => {
  beforeEach(() => resetSvc())

  it('HR 创建员工福利公告（品牌级）', () => {
    const { contract } = createNotice({
      title: '2026年度旅游通知',
      content: '年度旅游定于8月举行',
      scope: NoticeScope.Brand,
      priority: NoticePriority.Normal,
      authorId: 'hr-001',
      authorName: 'HR张',
      tags: ['福利', '旅游'],
    })
    expect(contract.scope).toBe('BRAND')
    expect(contract.tags).toContain('福利')
  })

  it('HR 更新公告内容', () => {
    const { noticeId } = createNotice({
      title: '培训通知', content: '原始内容',
      scope: NoticeScope.Tenant, priority: NoticePriority.Normal,
      authorId: 'hr-002', authorName: 'HR李',
    })
    const updated = controller.update(noticeId, {
      title: '【更新】培训通知',
      content: '更新后的培训安排',
    })
    expect(updated.title).toBe('【更新】培训通知')
    expect(updated.content).toBe('更新后的培训安排')
  })

  it('HR 删除草稿公告', () => {
    const { noticeId } = createNotice({
      title: '临时通知', content: '待删除',
      scope: NoticeScope.Tenant, priority: NoticePriority.Low,
      authorId: 'hr-003', authorName: 'HR王',
    })
    const result = controller.delete(noticeId)
    expect(result.id).toBe(noticeId)
    const detail = controller.getById(noticeId)
    expect(detail).not.toBeNull()
    expect(detail!.status).toBe('DELETED')
  })
})

// ══════════════════════════════════════════════════════════════
// 🔧安监 — 安全相关公告
// ══════════════════════════════════════════════════════════════
describe('🔧安监 notice 扩展测试', () => {
  beforeEach(() => resetSvc())

  it('安监创建紧急安全公告（URGENT 级别）', () => {
    const { contract } = createNotice({
      title: '紧急：消防演习通知',
      content: '今日下午3点进行消防演习',
      scope: NoticeScope.Store,
      priority: NoticePriority.Urgent,
      authorId: 'safety-001',
      authorName: '安监老刘',
    })
    expect(contract.priority).toBe('URGENT')
  })

  it('安监创建带定时发布的公告', () => {
    const futureTime = new Date(Date.now() + 86400000).toISOString()
    const { contract } = createNotice({
      title: '下周安全检查通知',
      content: '下周一开始全店安全巡查',
      scope: NoticeScope.Store,
      priority: NoticePriority.High,
      authorId: 'safety-002',
      authorName: '安监陈',
      scheduledAt: futureTime,
    })
    expect(contract.scheduledAt).toBe(futureTime)
  })

  it('安监按优先级筛选公告', () => {
    createNotice({
      title: '常规安全提醒', content: '注意用电安全',
      scope: NoticeScope.Store, priority: NoticePriority.Low,
      authorId: 'safety-003', authorName: '安监赵',
    })
    createNotice({
      title: '紧急通知', content: '火警测试',
      scope: NoticeScope.Store, priority: NoticePriority.Urgent,
      authorId: 'safety-003', authorName: '安监赵',
    })
    const urgentList = controller.list(defaultTenantCtx, { priority: 'URGENT' })
    expect(urgentList.total).toBeGreaterThanOrEqual(1)
    urgentList.items.forEach(n => expect(n.priority).toBe('URGENT'))
  })
})

// ══════════════════════════════════════════════════════════════
// 🎮导玩员 — 游戏区运营公告
// ══════════════════════════════════════════════════════════════
describe('🎮导玩员 notice 扩展测试', () => {
  beforeEach(() => resetSvc())

  it('导玩员创建游戏区设备公告', () => {
    const { contract } = createNotice({
      title: '3号街机维护完成',
      content: '3号街机已完成维护',
      scope: NoticeScope.Store,
      priority: NoticePriority.Normal,
      authorId: 'guide-001',
      authorName: '导玩员小张',
      tags: ['设备维护'],
    })
    expect(contract.authorName).toBe('导玩员小张')
  })

  it('导玩员创建置顶公告', () => {
    const { contract } = createNotice({
      title: '【置顶】新游戏上架',
      content: '新到4台格斗游戏机',
      scope: NoticeScope.Store,
      priority: NoticePriority.Normal,
      authorId: 'guide-002',
      authorName: '导玩员小李',
      stickyOrder: 10,
    })
    expect(contract.stickyOrder).toBe(10)
  })

  it('导玩员发布公告后查询已发布列表', () => {
    const { noticeId } = createNotice({
      title: '比赛通知', content: '周末拳皇比赛',
      scope: NoticeScope.Store, priority: NoticePriority.Normal,
      authorId: 'guide-003', authorName: '导玩员小王',
    })
    controller.publish(noticeId)
    const publishedList = controller.listPublished({ scope: NoticeScope.Store })
    expect(publishedList.total).toBeGreaterThanOrEqual(1)
  })
})

// ══════════════════════════════════════════════════════════════
// 🎯运行专员 — 系统运维公告管理
// ══════════════════════════════════════════════════════════════
describe('🎯运行专员 notice 扩展测试', () => {
  beforeEach(() => resetSvc())

  it('运行专员创建系统级公告', () => {
    const { contract } = createNotice({
      title: '系统维护通知',
      content: '今晚凌晨2-4点系统升级',
      scope: NoticeScope.System,
      priority: NoticePriority.High,
      authorId: 'ops-001',
      authorName: '运维老赵',
    })
    expect(contract.scope).toBe('SYSTEM')
  })

  it('运行专员归档已发布公告', () => {
    const { noticeId } = createNotice({
      title: '过期活动', content: '已结束活动',
      scope: NoticeScope.Tenant, priority: NoticePriority.Low,
      authorId: 'ops-002', authorName: '运维陈',
    })
    controller.publish(noticeId)
    const archived = controller.archive(noticeId)
    expect(archived.status).toBe('ARCHIVED')
    expect(archived.archivedAt).toBeDefined()
  })

  it('运行专员按作者筛选公告', () => {
    createNotice({
      title: '运维A通知', content: '内容A',
      scope: NoticeScope.Tenant, priority: NoticePriority.Normal,
      authorId: 'ops-003', authorName: '运维刘',
    })
    createNotice({
      title: '运维A通知2', content: '内容B',
      scope: NoticeScope.Tenant, priority: NoticePriority.Normal,
      authorId: 'ops-003', authorName: '运维刘',
    })
    const list = controller.list(defaultTenantCtx, { authorId: 'ops-003' })
    expect(list.total).toBe(2)
  })
})

// ══════════════════════════════════════════════════════════════
// 🤝团建 — 团建活动公告
// ══════════════════════════════════════════════════════════════
describe('🤝团建 notice 扩展测试', () => {
  beforeEach(() => resetSvc())

  it('团建创建活动公告带封面图', () => {
    const { contract } = createNotice({
      title: '季度团建活动',
      content: '本季度团建地点：户外拓展基地',
      scope: NoticeScope.Brand,
      priority: NoticePriority.Normal,
      authorId: 'team-lead-001',
      authorName: '团建队长',
      coverUrl: 'https://img.example.com/team-building.jpg',
      summary: '季度团建报名通知',
    })
    expect(contract.coverUrl).toBeDefined()
    expect(contract.summary).toBe('季度团建报名通知')
  })

  it('团建创建带过期时间的公告', () => {
    const futureExpire = new Date(Date.now() + 30 * 86400000).toISOString()
    const { contract } = createNotice({
      title: '团建报名截止', content: '请于月底前报名',
      scope: NoticeScope.Brand, priority: NoticePriority.Normal,
      authorId: 'team-lead-002', authorName: '团建小李',
      expireAt: futureExpire,
    })
    expect(contract.expireAt).toBe(futureExpire)
  })

  it('团建通过关键字搜索自己的公告', () => {
    createNotice({
      title: '团建：海边一日游', content: '报名中',
      scope: NoticeScope.Brand, priority: NoticePriority.Normal,
      authorId: 'team-lead-003', authorName: '团建小王',
    })
    const list = controller.list(defaultTenantCtx, { keyword: '海边' })
    expect(list.total).toBeGreaterThanOrEqual(1)
  })
})

// ══════════════════════════════════════════════════════════════
// 📢营销 — 营销活动公告管理
// ══════════════════════════════════════════════════════════════
describe('📢营销 notice 扩展测试', () => {
  beforeEach(() => resetSvc())

  it('营销创建促销活动公告', () => {
    const { contract } = createNotice({
      title: '双11大促活动',
      content: '全场5折起，充值满100送20',
      scope: NoticeScope.Tenant,
      priority: NoticePriority.High,
      authorId: 'mkt-001',
      authorName: '市场总监王',
      tags: ['促销', '双11'],
    })
    expect(contract.tags).toContain('促销')
  })

  it('营销发布公告后按 scope 过滤', () => {
    createNotice({
      title: '品牌活动', content: '品牌合作',
      scope: NoticeScope.Brand, priority: NoticePriority.Normal,
      authorId: 'mkt-002', authorName: '市场小李',
    })
    createNotice({
      title: '租户通知', content: '租户活动',
      scope: NoticeScope.Tenant, priority: NoticePriority.Normal,
      authorId: 'mkt-002', authorName: '市场小李',
    })
    const brandList = controller.list(defaultTenantCtx, { scope: NoticeScope.Brand })
    brandList.items.forEach(n => expect(n.scope).toBe('BRAND'))
  })

  it('营销查看未读公告已读状态为 false', () => {
    const { noticeId } = createNotice({
      title: '新活动上线', content: '注册送券',
      scope: NoticeScope.Tenant, priority: NoticePriority.Normal,
      authorId: 'mkt-003', authorName: '市场小张',
    })
    const detail = controller.getById(noticeId, 'mkt-viewer-001')
    expect(detail).toBeDefined()
    expect(detail!).not.toBeNull()
    expect(detail!.read).toBe(false)
    expect(detail!.readCount).toBe(0)
  })
})
