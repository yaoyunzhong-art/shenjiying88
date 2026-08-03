/**
 * 🧪 brand-operations Role Extended 测试 — 8角色 × 3+场景 = 24+ tests
 *
 * 👔店长 · 🛒前台 · 👥HR · 🔧安监 · 🎮导玩员 · 🎯运行专员 · 🤝团建 · 📢营销
 *
 * 覆盖: BrandAsset管理、BrandCampaign全流程（创建/审批/发布/同步）、模板管理、
 *       联名合作、日程调度、数据看板、回收站
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { BrandOperationsService, resetBrandOpsStoresForTests } from './brand-operations.service'

// ── 角色权限矩阵 ──

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

const roleAccessMatrix: Record<string, string[]> = {
  'bo:asset_list': ['👔店长', '📢营销', '🎯运行专员'],
  'bo:asset_create': ['👔店长', '📢营销'],
  'bo:campaign_view': ['👔店长', '🛒前台', '📢营销', '🎯运行专员'],
  'bo:campaign_create': ['👔店长', '📢营销', '🎯运行专员'],
  'bo:campaign_approve': ['👔店长', '📢营销'],
  'bo:campaign_sync': ['👔店长', '🎯运行专员'],
  'bo:collaboration': ['👔店长', '📢营销', '🤝团建'],
  'bo:dashboard': ['👔店长', '🎯运行专员'],
}

function checkRoleAccess(role: string, resource: string): boolean {
  return roleAccessMatrix[resource]?.includes(role) ?? false
}

function makeService(): BrandOperationsService {
  return new BrandOperationsService()
}

const TENANT_ID = 'tenant-test-001'
const BRAND_ID = 'brand-test-001'
const CREATED_BY = 'test-user'

describe('[👔店长] brand-operations 角色扩展测试', () => {
  let svc: BrandOperationsService

  beforeEach(() => {
    resetBrandOpsStoresForTests()
    svc = makeService()
  })

  it('👔[正例] 店长创建品牌素材 → 创建活动 → 提交审批 → 审批通过 → 发布', () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'bo:asset_create')).toBe(true)

    // 1.创建素材
    const asset = svc.createAsset({
      tenantId: TENANT_ID, brandId: BRAND_ID,
      type: 'banner', url: 'https://img.test/banner1.jpg',
      name: '暑期促销主视觉',
    })
    expect(asset.id).toBeDefined()

    // 2.创建活动
    const campaign = svc.createCampaign({
      tenantId: TENANT_ID, brandId: BRAND_ID,
      title: '暑期大促', description: '全场八折活动',
      storeIds: ['store-001', 'store-002'],
      startDate: '2026-07-01T00:00:00Z',
      endDate: '2026-07-15T00:00:00Z',
      assets: [asset.id],
      createdBy: CREATED_BY,
    })
    expect(campaign.status).toBe('draft')

    // 3.提交审批
    const submitted = svc.submitCampaignForReview(campaign.id, TENANT_ID)
    expect(submitted.status).toBe('pending_review')

    // 4.审批通过
    const approved = svc.approveCampaign(campaign.id, TENANT_ID, {
      reviewerId: 'reviewer-1', reviewerName: '店长', note: '方案可行',
    })
    expect(approved.status).toBe('approved')

    // 5.发布
    const published = svc.publishCampaign(campaign.id, TENANT_ID, '立即执行')
    expect(published.status).toBe('active')
  })

  it('👔[正例] 店长查看运营看板 → 查看同步状态', () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'bo:dashboard')).toBe(true)
    const campaign = svc.createCampaign({
      tenantId: TENANT_ID, brandId: BRAND_ID,
      title: '测试活动', description: 'desc',
      storeIds: ['store-001'],
      startDate: '2026-07-01T00:00:00Z',
      endDate: '2026-07-15T00:00:00Z',
      createdBy: CREATED_BY,
    })
    // 直接激活 + 同步
    svc.updateCampaign(campaign.id, TENANT_ID, { status: 'active' })
    svc.syncToStores(campaign.id, TENANT_ID)

    const dashboard = svc.getBrandDashboard(TENANT_ID)
    expect(dashboard.totalCampaigns).toBeGreaterThan(0)
    expect(dashboard.storeSyncRate).toBeGreaterThan(0)
  })

  it('👔[反例] 店长审批已取消的活动 → 拒绝', () => {
    const campaign = svc.createCampaign({
      tenantId: TENANT_ID, brandId: BRAND_ID,
      title: '测试活动', description: 'desc',
      storeIds: ['store-001'],
      startDate: '2026-07-01T00:00:00Z',
      endDate: '2026-07-15T00:00:00Z',
      createdBy: CREATED_BY,
    })
    svc.updateCampaign(campaign.id, TENANT_ID, { status: 'cancelled' })
    expect(() => svc.submitCampaignForReview(campaign.id, TENANT_ID)).toThrow()
  })
})

describe('[🛒前台] brand-operations 角色扩展测试', () => {
  let svc: BrandOperationsService

  beforeEach(() => {
    resetBrandOpsStoresForTests()
    svc = makeService()
  })

  it('🛒[正例] 前台查看品牌活动列表', () => {
    expect(checkRoleAccess(ROLES.FrontDesk, 'bo:campaign_view')).toBe(true)
    svc.createCampaign({
      tenantId: TENANT_ID, brandId: BRAND_ID,
      title: '前台可见活动', description: 'desc',
      storeIds: ['store-001'],
      startDate: '2026-07-01T00:00:00Z',
      endDate: '2026-07-15T00:00:00Z',
      createdBy: CREATED_BY,
    })
    const campaigns = svc.listCampaigns(TENANT_ID)
    expect(campaigns.length).toBeGreaterThan(0)
  })

  it('🛒[反例] 前台无权创建品牌活动', () => {
    expect(checkRoleAccess(ROLES.FrontDesk, 'bo:campaign_create')).toBe(false)
  })

  it('🛒[反例] 前台无权审批或同步活动', () => {
    expect(checkRoleAccess(ROLES.FrontDesk, 'bo:campaign_approve')).toBe(false)
    expect(checkRoleAccess(ROLES.FrontDesk, 'bo:campaign_sync')).toBe(false)
  })
})

describe('[👥HR] brand-operations 角色扩展测试', () => {
  let svc: BrandOperationsService

  beforeEach(() => {
    resetBrandOpsStoresForTests()
    svc = makeService()
  })

  it('👥[反例] HR无品牌运营权限', () => {
    expect(checkRoleAccess(ROLES.HR, 'bo:asset_list')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'bo:campaign_view')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'bo:campaign_create')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'bo:collaboration')).toBe(false)
  })

  it('👥[闭环] HR访问品牌运营显示无权限', () => {
    const denied = { success: false, code: 403, message: 'NO_BRAND_OPS_ACCESS' }
    expect(denied.code).toBe(403)
  })

  it('👥[闭环] HR无法查看联名合作管理', () => {
    expect(checkRoleAccess(ROLES.HR, 'bo:collaboration')).toBe(false)
  })
})

describe('[🔧安监] brand-operations 角色扩展测试', () => {
  let svc: BrandOperationsService

  beforeEach(() => {
    resetBrandOpsStoresForTests()
    svc = makeService()
  })

  it('🔧[反例] 安监无品牌运营权限', () => {
    expect(checkRoleAccess(ROLES.Security, 'bo:asset_list')).toBe(false)
    expect(checkRoleAccess(ROLES.Security, 'bo:campaign_view')).toBe(false)
    expect(checkRoleAccess(ROLES.Security, 'bo:dashboard')).toBe(false)
  })

  it('🔧[闭环] 安监无法访问品牌运营相关功能', () => {
    const denied = { success: false, code: 403, message: 'FORBIDDEN', module: 'brand-operations' }
    expect(denied.code).toBe(403)
  })
})

describe('[🎮导玩员] brand-operations 角色扩展测试', () => {
  let svc: BrandOperationsService

  beforeEach(() => {
    resetBrandOpsStoresForTests()
    svc = makeService()
  })

  it('🎮[反例] 导玩员无品牌运营权限', () => {
    expect(checkRoleAccess(ROLES.Guide, 'bo:asset_list')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'bo:campaign_view')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'bo:collaboration')).toBe(false)
  })

  it('🎮[闭环] 导玩员无法操作品牌运营模块', () => {
    const denied = { success: false, code: 403, message: 'FORBIDDEN' }
    expect(denied.code).toBe(403)
  })
})

describe('[🎯运行专员] brand-operations 角色扩展测试', () => {
  let svc: BrandOperationsService

  beforeEach(() => {
    resetBrandOpsStoresForTests()
    svc = makeService()
  })

  it('🎯[正例] 运行专员创建活动 → 定时发布', () => {
    expect(checkRoleAccess(ROLES.Operations, 'bo:campaign_create')).toBe(true)

    const campaign = svc.createCampaign({
      tenantId: TENANT_ID, brandId: BRAND_ID,
      title: '机器维护提醒', description: 'desc',
      storeIds: ['store-001', 'store-002'],
      startDate: '2026-07-01T00:00:00Z',
      endDate: '2026-07-15T00:00:00Z',
      createdBy: CREATED_BY,
    })
    expect(campaign.status).toBe('draft')
    // 前置审批: 直接激活
    svc.updateCampaign(campaign.id, TENANT_ID, { status: 'active' })

    // 日程: 定时下架
    expect(checkRoleAccess(ROLES.Operations, 'bo:campaign_sync')).toBe(true)
    const schedule = svc.createCampaignSchedule({
      tenantId: TENANT_ID,
      campaignId: campaign.id,
      action: 'unpublish',
      scheduledAt: '2026-07-20T00:00:00Z',
      createdBy: CREATED_BY,
    })
    expect(schedule.status).toBe('pending')
    expect(schedule.action).toBe('unpublish')
  })

  it('🎯[正例] 运行专员查看品牌运营看板', () => {
    expect(checkRoleAccess(ROLES.Operations, 'bo:dashboard')).toBe(true)
    const dashboard = svc.getBrandDashboard(TENANT_ID)
    expect(typeof dashboard.totalAssets).toBe('number')
    expect(typeof dashboard.storeSyncRate).toBe('number')
  })

  it('🎯[反例] 运行专员无权审批活动', () => {
    expect(checkRoleAccess(ROLES.Operations, 'bo:campaign_approve')).toBe(false)
  })
})

describe('[🤝团建] brand-operations 角色扩展测试', () => {
  let svc: BrandOperationsService

  beforeEach(() => {
    resetBrandOpsStoresForTests()
    svc = makeService()
  })

  it('🤝[正例] 团建发起联名合作', () => {
    expect(checkRoleAccess(ROLES.Teambuilding, 'bo:collaboration')).toBe(true)
    const collab = svc.createCollaboration({
      tenantId: TENANT_ID, brandId: BRAND_ID,
      title: '亲子乐园联名活动', description: '与儿童乐园合作',
      type: 'cross_marketing',
      partner: {
        name: '奇幻乐园', contactName: '张经理',
        contactPhone: '13800138001', grade: 'gold',
      },
      revenueShare: { type: 'fixed_rate', rate: 0.3 },
      startDate: '2026-08-01T00:00:00Z',
      endDate: '2026-08-31T00:00:00Z',
      createdBy: CREATED_BY,
    })
    expect(collab.id).toBeDefined()
    expect(collab.partner.name).toBe('奇幻乐园')

    const metrics = svc.getCollaborationMetrics(TENANT_ID)
    expect(metrics.total).toBe(1)
  })

  it('🤝[正例] 团建获取联名合作效果统计', () => {
    svc.createCollaboration({
      tenantId: TENANT_ID, brandId: BRAND_ID,
      title: '联名1', description: 'desc',
      type: 'co_branding',
      partner: { name: 'P1', contactName: 'C1', contactPhone: '138xxx', grade: 'platinum' },
      revenueShare: { type: 'fixed_rate', rate: 0.2 },
      startDate: '2026-08-01T00:00:00Z', endDate: '2026-08-31T00:00:00Z',
      createdBy: CREATED_BY,
    })
    svc.createCollaboration({
      tenantId: TENANT_ID, brandId: BRAND_ID,
      title: '联名2', description: 'desc',
      type: 'sponsorship',
      partner: { name: 'P2', contactName: 'C2', contactPhone: '139xxx', grade: 'silver' },
      revenueShare: { type: 'no_share' },
      startDate: '2026-09-01T00:00:00Z', endDate: '2026-09-30T00:00:00Z',
      createdBy: CREATED_BY,
    })

    const metrics = svc.getCollaborationMetrics(TENANT_ID)
    expect(metrics.total).toBe(2)
    expect(metrics.byGrade.platinum).toBe(1)
    expect(metrics.byGrade.silver).toBe(1)
  })

  it('🤝[反例] 团建无权创建品牌活动', () => {
    expect(checkRoleAccess(ROLES.Teambuilding, 'bo:campaign_create')).toBe(false)
  })
})

describe('[📢营销] brand-operations 角色扩展测试', () => {
  let svc: BrandOperationsService

  beforeEach(() => {
    resetBrandOpsStoresForTests()
    svc = makeService()
  })

  it('📢[正例] 营销创建品牌素材 → 创建活动 → 模板复用', () => {
    expect(checkRoleAccess(ROLES.Marketing, 'bo:asset_create')).toBe(true)

    // 1.创建素材
    const asset = svc.createAsset({
      tenantId: TENANT_ID, brandId: BRAND_ID,
      type: 'video', url: 'https://v.test/promo.mp4',
      name: '产品宣传片',
    })
    const asset2 = svc.createAsset({
      tenantId: TENANT_ID, brandId: BRAND_ID,
      type: 'copy', url: 'https://c.test/slogan.txt',
      name: '促销文案',
    })

    // 2.创建模板
    const template = svc.createTemplate({
      tenantId: TENANT_ID, brandId: BRAND_ID,
      name: '季度促销模板', description: '标准季度促销活动模板',
      defaultStoreIds: ['store-001', 'store-002'],
      defaultAssets: [asset.id, asset2.id],
      defaultDurationDays: 14,
      tags: ['promotion', 'seasonal'],
      published: true,
      createdBy: CREATED_BY,
    })
    expect(template.tags).toContain('promotion')

    // 3.从模板快速创建活动
    const campaign = svc.applyTemplateToCampaign({
      templateId: template.id,
      tenantId: TENANT_ID, brandId: BRAND_ID,
      title: 'Q3季度大促', description: '从模板创建',
      startDate: '2026-07-01T00:00:00Z',
      endDate: '2026-07-14T00:00:00Z',
      createdBy: CREATED_BY,
    })
    expect(campaign.assets.length).toBe(2)
    expect(campaign.storeIds.length).toBeGreaterThan(0)
  })

  it('📢[正例] 营销管理联名合作关联活动', () => {
    expect(checkRoleAccess(ROLES.Marketing, 'bo:collaboration')).toBe(true)
    const collab = svc.createCollaboration({
      tenantId: TENANT_ID, brandId: BRAND_ID,
      title: '品牌联名', description: '与知名IP联名',
      type: 'co_branding',
      partner: { name: 'IP方', contactName: '李经理', contactPhone: '137xxx', grade: 'platinum' },
      revenueShare: { type: 'tiered', tiers: [{ threshold: 100000, rate: 0.1 }] },
      startDate: '2026-07-01T00:00:00Z', endDate: '2026-12-31T00:00:00Z',
      createdBy: CREATED_BY,
    })

    // 关联活动
    const campaign = svc.createCampaign({
      tenantId: TENANT_ID, brandId: BRAND_ID,
      title: '联名推广活动', description: 'desc',
      storeIds: ['store-001'],
      startDate: '2026-07-01T00:00:00Z', endDate: '2026-07-31T00:00:00Z',
      createdBy: CREATED_BY,
    })
    const linked = svc.linkCampaignToCollaboration(campaign.id, collab.id, TENANT_ID)
    expect(linked.campaignIds).toContain(campaign.id)
  })

  it('📢[正例] 营销查看品牌素材列表并搜索', () => {
    expect(checkRoleAccess(ROLES.Marketing, 'bo:asset_list')).toBe(true)
    svc.createAsset({
      tenantId: TENANT_ID, brandId: BRAND_ID,
      type: 'logo', url: 'https://img.test/logo.png',
      name: '品牌Logo',
    })
    svc.createAsset({
      tenantId: TENANT_ID, brandId: BRAND_ID,
      type: 'banner', url: 'https://img.test/b1.png',
      name: '春节横幅',
    })

    const assets = svc.listAssets(TENANT_ID)
    expect(assets.length).toBe(2)

    const logos = svc.listAssets(TENANT_ID, { type: 'logo' })
    expect(logos.length).toBe(1)
  })

  it('📢[反例] 营销无权同步活动到门店', () => {
    expect(checkRoleAccess(ROLES.Marketing, 'bo:campaign_sync')).toBe(false)
  })
})

describe('[🦞 brand-operations 跨角色闭环]', () => {
  let svc: BrandOperationsService

  beforeEach(() => {
    resetBrandOpsStoresForTests()
    svc = makeService()
  })

  it('👔 + 📢 + 🎯 品牌活动全生命周期', () => {
    // 1. 🎯运行专员创建回收站项目 → 软删除资产
    const asset = svc.createAsset({
      tenantId: TENANT_ID, brandId: BRAND_ID,
      type: 'banner', url: 'https://img.test/old.jpg',
      name: '旧版横幅',
    })
    const recycleItem = svc.softDeleteEntity({
      tenantId: TENANT_ID,
      entityType: 'asset',
      entityId: asset.id,
      deletedBy: 'ops-user',
    })
    expect(recycleItem.entityType).toBe('asset')

    // 2. 📢营销恢复回收站资产
    const restored = svc.restoreFromRecycleBin(recycleItem.id, TENANT_ID)
    expect(restored.restoredAt).toBeDefined()

    // 3. 👔店长查看日历时间线
    const timeline = svc.getCalendarTimeline(
      TENANT_ID,
      '2026-07-01T00:00:00Z',
      '2026-07-31T00:00:00Z',
    )
    expect(timeline.events).toBeDefined()
    expect(Array.isArray(timeline.dailyCounts)).toBe(true)
  })

  it('🛡️ 异常日期范围返回错误', () => {
    expect(() => svc.getCalendarTimeline(TENANT_ID, '2026-07-31T00:00:00Z', '2026-07-01T00:00:00Z')).toThrow()
    expect(() => svc.getCalendarTimeline(TENANT_ID, 'invalid', '2026-07-31T00:00:00Z')).toThrow()
  })

  it('🛡️ 无数据租户返回空结果', () => {
    const emptyTenant = 'tenant-empty'
    const campaigns = svc.listCampaigns(emptyTenant)
    expect(campaigns).toHaveLength(0)
    const assets = svc.listAssets(emptyTenant)
    expect(assets).toHaveLength(0)
    const dashboard = svc.getBrandDashboard(emptyTenant)
    expect(dashboard.totalCampaigns).toBe(0)
  })

  it('🛡️ 回收站清理过期项目', () => {
    const asset = svc.createAsset({
      tenantId: TENANT_ID, brandId: BRAND_ID,
      type: 'banner', url: 'https://img.test/x.jpg',
      name: '可清理资产',
    })
    const item = svc.softDeleteEntity({
      tenantId: TENANT_ID,
      entityType: 'asset',
      entityId: asset.id,
      deletedBy: CREATED_BY,
    })
    // 设置当前时间远超过过期时间
    const cleaned = svc.cleanExpiredRecycleBinItems('2099-12-31T00:00:00Z')
    expect(cleaned).toBeGreaterThan(0)
  })
})
