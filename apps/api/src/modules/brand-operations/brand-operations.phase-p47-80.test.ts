/**
 * brand-operations.phase-p47-80.test.ts
 * P-47 Phase 80% 新增测试
 *
 * 覆盖:
 * 1. 品牌活动定时调度 (CampaignSchedule) CRUD
 * 2. 定时调度执行 (executeDueSchedules)
 * 3. 定时调度取消
 * 4. 联名收入分成计算
 * 5. 收入分成结算/争议
 * 6. 收入分成汇总
 * 7. 资产分类 CRUD
 * 8. 资产分类树形结构
 * 9. 资产标签管理
 * 10. 品牌看板数据
 * 11. 资产使用统计
 * 12. 活动效果统计
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { BrandOperationsService, resetBrandOpsStoresForTests } from './brand-operations.service'

const TENANT = 'tenant-p47-80'

describe('P-47 Phase 80%: 品牌活动定时调度', () => {
  let service: BrandOperationsService

  beforeEach(() => {
    service = new BrandOperationsService()
    resetBrandOpsStoresForTests()
  })

  it('AC-47-01: 创建定时发布调度', () => {
    // 先创建活动
    const camp = service.createCampaign({
      tenantId: TENANT,
      brandId: 'brand-1',
      title: '国庆促销',
      description: '国庆节促销活动',
      storeIds: ['s-1'],
      startDate: '2026-10-01T00:00:00Z',
      endDate: '2026-10-07T23:59:59Z',
      createdBy: 'u-1',
    })
    // 审批通过
    service.submitCampaignForReview(camp.id, TENANT)
    service.approveCampaign(camp.id, TENANT, {
      reviewerId: 'r-1',
      reviewerName: '审批人',
      note: '通过',
    })

    const schedule = service.createCampaignSchedule({
      tenantId: TENANT,
      campaignId: camp.id,
      action: 'publish',
      scheduledAt: '2026-09-30T08:00:00.000Z',
      createdBy: 'u-1',
    })
    expect(schedule.id).toMatch(/^cs-/)
    expect(schedule.action).toBe('publish')
    expect(schedule.status).toBe('pending')
  })

  it('AC-47-01: 创建定时下架调度', () => {
    const camp = service.createCampaign({
      tenantId: TENANT, brandId: 'brand-1',
      title: '限时特惠', description: '特惠活动',
      storeIds: ['s-1'], startDate: '2026-08-01T00:00:00Z',
      endDate: '2026-08-31T23:59:59Z', createdBy: 'u-1',
    })
    const schedule = service.createCampaignSchedule({
      tenantId: TENANT, campaignId: camp.id,
      action: 'unpublish', scheduledAt: '2026-09-01T00:00:00.000Z',
      createdBy: 'u-1',
    })
    expect(schedule.action).toBe('unpublish')
  })

  it('AC-47-01: 不存在的活动创建调度报错', () => {
    expect(() => service.createCampaignSchedule({
      tenantId: TENANT, campaignId: 'nonexistent',
      action: 'publish', scheduledAt: '2026-10-01T00:00:00Z',
      createdBy: 'u-1',
    })).toThrow('BrandCampaign not found')
  })

  it('AC-47-01: 查询调度', () => {
    const camp = service.createCampaign({
      tenantId: TENANT, brandId: 'brand-1', title: '活动A',
      description: '描述', storeIds: ['s-1'],
      startDate: '2026-08-01T00:00:00Z', endDate: '2026-08-31T23:59:59Z',
      createdBy: 'u-1',
    })
    const s = service.createCampaignSchedule({
      tenantId: TENANT, campaignId: camp.id,
      action: 'publish', scheduledAt: '2026-09-01T00:00:00Z',
      createdBy: 'u-1',
    })
    const found = service.getCampaignSchedule(s.id, TENANT)
    expect(found).toBeDefined()
    expect(found!.id).toBe(s.id)
  })

  it('AC-47-01: 跨租户查询返回undefined', () => {
    const camp = service.createCampaign({
      tenantId: TENANT, brandId: 'brand-1', title: '活动B',
      description: '描述', storeIds: ['s-1'],
      startDate: '2026-08-01T00:00:00Z', endDate: '2026-08-31T23:59:59Z',
      createdBy: 'u-1',
    })
    const s = service.createCampaignSchedule({
      tenantId: TENANT, campaignId: camp.id,
      action: 'publish', scheduledAt: '2026-09-01T00:00:00Z',
      createdBy: 'u-1',
    })
    expect(service.getCampaignSchedule(s.id, 'other-tenant')).toBeUndefined()
  })

  it('AC-47-02: 执行到期的定时发布', () => {
    // 创建活动并审批通过
    const camp = service.createCampaign({
      tenantId: TENANT, brandId: 'brand-1', title: '待发布活动',
      description: '描述', storeIds: ['s-1'],
      startDate: '2026-10-01T00:00:00Z', endDate: '2026-10-07T23:59:59Z',
      createdBy: 'u-1',
    })
    service.submitCampaignForReview(camp.id, TENANT)
    service.approveCampaign(camp.id, TENANT, {
      reviewerId: 'r-1', reviewerName: '审批人', note: '通过',
    })

    service.createCampaignSchedule({
      tenantId: TENANT, campaignId: camp.id,
      action: 'publish', scheduledAt: '2026-08-01T08:00:00.000Z',
      createdBy: 'u-1',
    })

    const results = service.executeDueSchedules('2026-08-02T00:00:00.000Z')
    expect(results).toHaveLength(1)
    expect(results[0].status).toBe('executed')
    expect(results[0].executedAt).toBeDefined()

    // 验证活动状态变为 active
    const updated = service.getCampaign(camp.id, TENANT)
    expect(updated!.status).toBe('active')
  })

  it('AC-47-02: 执行到期的定时下架', () => {
    const camp = service.createCampaign({
      tenantId: TENANT, brandId: 'brand-1', title: '待下架活动',
      description: '描述', storeIds: ['s-1'],
      startDate: '2026-07-01T00:00:00Z', endDate: '2026-07-31T23:59:59Z',
      createdBy: 'u-1',
      assets: [],
    })
    // 直接激活
    service.updateCampaign(camp.id, TENANT, { status: 'active' })

    service.createCampaignSchedule({
      tenantId: TENANT, campaignId: camp.id,
      action: 'unpublish', scheduledAt: '2026-07-15T08:00:00.000Z',
      createdBy: 'u-1',
    })

    const results = service.executeDueSchedules('2026-07-16T00:00:00.000Z')
    expect(results).toHaveLength(1)
    expect(results[0].status).toBe('executed')

    const updated = service.getCampaign(camp.id, TENANT)
    expect(updated!.status).toBe('ended')
  })

  it('AC-47-02: 未到期调度不会执行', () => {
    const camp = service.createCampaign({
      tenantId: TENANT, brandId: 'brand-1', title: '未来调度',
      description: '描述', storeIds: ['s-1'],
      startDate: '2026-10-01T00:00:00Z', endDate: '2026-10-07T23:59:59Z',
      createdBy: 'u-1',
    })
    service.submitCampaignForReview(camp.id, TENANT)
    service.approveCampaign(camp.id, TENANT, {
      reviewerId: 'r-1', reviewerName: '审批人', note: '通过',
    })

    service.createCampaignSchedule({
      tenantId: TENANT, campaignId: camp.id,
      action: 'publish', scheduledAt: '2026-12-01T08:00:00.000Z',
      createdBy: 'u-1',
    })

    const results = service.executeDueSchedules('2026-08-01T00:00:00.000Z')
    expect(results).toHaveLength(0)
  })

  it('AC-47-03: 取消调度', () => {
    const camp = service.createCampaign({
      tenantId: TENANT, brandId: 'brand-1', title: '可取消调度',
      description: '描述', storeIds: ['s-1'],
      startDate: '2026-10-01T00:00:00Z', endDate: '2026-10-07T23:59:59Z',
      createdBy: 'u-1',
    })
    const s = service.createCampaignSchedule({
      tenantId: TENANT, campaignId: camp.id,
      action: 'publish', scheduledAt: '2026-10-01T00:00:00Z',
      createdBy: 'u-1',
    })
    const cancelled = service.cancelCampaignSchedule(s.id, TENANT)
    expect(cancelled.status).toBe('cancelled')
  })

  it('AC-47-03: 已执行调度不能取消', () => {
    const camp = service.createCampaign({
      tenantId: TENANT, brandId: 'brand-1', title: '已执行调度',
      description: '描述', storeIds: ['s-1'],
      startDate: '2026-07-01T00:00:00Z', endDate: '2026-07-31T23:59:59Z',
      createdBy: 'u-1',
    })
    service.submitCampaignForReview(camp.id, TENANT)
    service.approveCampaign(camp.id, TENANT, {
      reviewerId: 'r-1', reviewerName: '审批人', note: '通过',
    })
    const s = service.createCampaignSchedule({
      tenantId: TENANT, campaignId: camp.id,
      action: 'publish', scheduledAt: '2026-07-01T00:00:00Z',
      createdBy: 'u-1',
    })
    service.executeDueSchedules('2026-07-02T00:00:00.000Z')
    expect(() => service.cancelCampaignSchedule(s.id, TENANT)).toThrow('Cannot cancel')
  })
})

describe('P-47 Phase 80%: 联名收入分成', () => {
  let service: BrandOperationsService

  beforeEach(() => {
    service = new BrandOperationsService()
    resetBrandOpsStoresForTests()
  })

  it('AC-47-04: 计算收入分成 - 固定比例', () => {
    const collab = service.createCollaboration({
      tenantId: TENANT, brandId: 'brand-1',
      title: '联名活动', description: '测试',
      type: 'co_branding',
      partner: { name: '合作伙伴', contactName: '张三', contactPhone: '13800000000', grade: 'gold' },
      revenueShare: { type: 'fixed_rate', rate: 0.3 },
      startDate: '2026-07-01T00:00:00Z', endDate: '2026-09-30T23:59:59Z',
      createdBy: 'u-1',
    })
    // 激活合作
    service.updateCollaboration(collab.id, TENANT, { status: 'active' })

    const record = service.calculateRevenueShare({
      tenantId: TENANT,
      collaborationId: collab.id,
      periodStart: '2026-07-01',
      periodEnd: '2026-07-31',
      totalRevenue: 1000000, // 10000元
      shareRate: 0.3,
    })
    expect(record.id).toMatch(/^rs-/)
    expect(record.totalRevenue).toBe(1000000)
    expect(record.partnerShare).toBe(300000)
    expect(record.ourShare).toBe(700000)
    expect(record.shareRate).toBe(0.3)
    expect(record.settlementStatus).toBe('pending')
  })

  it('AC-47-04: 四舍五入扣减正确', () => {
    const collab = service.createCollaboration({
      tenantId: TENANT, brandId: 'brand-1',
      title: '联名活动2', description: '测试',
      type: 'sponsorship',
      partner: { name: '伙伴B', contactName: '李四', contactPhone: '13900000000', grade: 'platinum' },
      revenueShare: { type: 'fixed_rate', rate: 0.15 },
      startDate: '2026-07-01T00:00:00Z', endDate: '2026-09-30T23:59:59Z',
      createdBy: 'u-1',
    })
    service.updateCollaboration(collab.id, TENANT, { status: 'active' })

    // 总金额不可整除
    const record = service.calculateRevenueShare({
      tenantId: TENANT, collaborationId: collab.id,
      periodStart: '2026-07-01', periodEnd: '2026-07-31',
      totalRevenue: 100, shareRate: 0.15,
    })
    expect(record.partnerShare).toBe(15) // Math.round(100 * 0.15) = 15
    expect(record.ourShare).toBe(85) // 100 - 15 = 85
    expect(record.partnerShare + record.ourShare).toBe(100)
  })

  it('AC-47-04: 非活跃合作不能计算分成', () => {
    const collab = service.createCollaboration({
      tenantId: TENANT, brandId: 'brand-1',
      title: '未激活合作', description: '测试',
      type: 'cross_marketing',
      partner: { name: '伙伴C', contactName: '王五', contactPhone: '13700000000', grade: 'silver' },
      revenueShare: { type: 'fixed_rate', rate: 0.2 },
      startDate: '2026-07-01T00:00:00Z', endDate: '2026-09-30T23:59:59Z',
      createdBy: 'u-1',
    })
    expect(() => service.calculateRevenueShare({
      tenantId: TENANT, collaborationId: collab.id,
      periodStart: '2026-07-01', periodEnd: '2026-07-31',
      totalRevenue: 100000, shareRate: 0.2,
    })).toThrow('non-active')
  })

  it('AC-47-05: 结算分成记录', () => {
    const collab = service.createCollaboration({
      tenantId: TENANT, brandId: 'brand-1',
      title: '待结算', description: '测试',
      type: 'co_branding',
      partner: { name: '伙伴D', contactName: '赵六', contactPhone: '13600000000', grade: 'gold' },
      revenueShare: { type: 'fixed_rate', rate: 0.25 },
      startDate: '2026-07-01T00:00:00Z', endDate: '2026-09-30T23:59:59Z',
      createdBy: 'u-1',
    })
    service.updateCollaboration(collab.id, TENANT, { status: 'active' })
    const record = service.calculateRevenueShare({
      tenantId: TENANT, collaborationId: collab.id,
      periodStart: '2026-07-01', periodEnd: '2026-07-31',
      totalRevenue: 500000, shareRate: 0.25,
    })
    const settled = service.settleRevenueShare(record.id, TENANT, {
      settledBy: 'finance-1',
      notes: '已完成结算',
    })
    expect(settled.settlementStatus).toBe('settled')
    expect(settled.settledBy).toBe('finance-1')
    expect(settled.settledAt).toBeDefined()
  })

  it('AC-47-05: 争议分成记录', () => {
    const collab = service.createCollaboration({
      tenantId: TENANT, brandId: 'brand-1',
      title: '有争议', description: '测试',
      type: 'joint_promotion',
      partner: { name: '伙伴E', contactName: '钱七', contactPhone: '13500000000', grade: 'bronze' },
      revenueShare: { type: 'fixed_rate', rate: 0.1 },
      startDate: '2026-07-01T00:00:00Z', endDate: '2026-09-30T23:59:59Z',
      createdBy: 'u-1',
    })
    service.updateCollaboration(collab.id, TENANT, { status: 'active' })
    const record = service.calculateRevenueShare({
      tenantId: TENANT, collaborationId: collab.id,
      periodStart: '2026-07-01', periodEnd: '2026-07-31',
      totalRevenue: 200000, shareRate: 0.1,
    })
    const disputed = service.disputeRevenueShare(record.id, TENANT, '收入数据有异议')
    expect(disputed.settlementStatus).toBe('disputed')
  })

  it('AC-47-05: 已结算记录不能争议', () => {
    const collab = service.createCollaboration({
      tenantId: TENANT, brandId: 'brand-1',
      title: '已结算', description: '测试',
      type: 'co_branding',
      partner: { name: '伙伴F', contactName: '孙八', contactPhone: '13400000000', grade: 'gold' },
      revenueShare: { type: 'fixed_rate', rate: 0.2 },
      startDate: '2026-07-01T00:00:00Z', endDate: '2026-09-30T23:59:59Z',
      createdBy: 'u-1',
    })
    service.updateCollaboration(collab.id, TENANT, { status: 'active' })
    const record = service.calculateRevenueShare({
      tenantId: TENANT, collaborationId: collab.id,
      periodStart: '2026-07-01', periodEnd: '2026-07-31',
      totalRevenue: 100000, shareRate: 0.2,
    })
    service.settleRevenueShare(record.id, TENANT, { settledBy: 'finance-1' })
    expect(() => service.disputeRevenueShare(record.id, TENANT, 'test'))
      .toThrow('already settled')
  })

  it('AC-47-06: 收入分成汇总', () => {
    const collab = service.createCollaboration({
      tenantId: TENANT, brandId: 'brand-1',
      title: '汇总测试', description: '测试',
      type: 'co_branding',
      partner: { name: '伙伴G', contactName: '周九', contactPhone: '13300000000', grade: 'platinum' },
      revenueShare: { type: 'fixed_rate', rate: 0.3 },
      startDate: '2026-07-01T00:00:00Z', endDate: '2026-09-30T23:59:59Z',
      createdBy: 'u-1',
    })
    service.updateCollaboration(collab.id, TENANT, { status: 'active' })
    service.calculateRevenueShare({
      tenantId: TENANT, collaborationId: collab.id,
      periodStart: '2026-07-01', periodEnd: '2026-07-15',
      totalRevenue: 1000000, shareRate: 0.3,
    })
    service.calculateRevenueShare({
      tenantId: TENANT, collaborationId: collab.id,
      periodStart: '2026-07-16', periodEnd: '2026-07-31',
      totalRevenue: 500000, shareRate: 0.3,
    })
    const summary = service.getRevenueShareSummary(TENANT)
    expect(summary.totalRecords).toBe(2)
    expect(summary.totalRevenue).toBe(1500000)
    expect(summary.totalPartnerShare).toBe(450000)
    expect(summary.totalOurShare).toBe(1050000)
    expect(summary.pendingCount).toBe(2)
  })
})

describe('P-47 Phase 80%: 资产分类管理', () => {
  let service: BrandOperationsService

  beforeEach(() => {
    service = new BrandOperationsService()
    resetBrandOpsStoresForTests()
  })

  it('AC-47-07: 创建资产分类', () => {
    const cat = service.createAssetCategory({
      tenantId: TENANT,
      name: '品牌Logo',
      description: '所有品牌Logo素材',
      sortOrder: 1,
    })
    expect(cat.id).toMatch(/^acat-/)
    expect(cat.name).toBe('品牌Logo')
    expect(cat.sortOrder).toBe(1)
  })

  it('AC-47-07: 创建子分类', () => {
    const parent = service.createAssetCategory({
      tenantId: TENANT, name: '图片素材', sortOrder: 1,
    })
    const child = service.createAssetCategory({
      tenantId: TENANT, name: '节日海报', parentId: parent.id, sortOrder: 1,
    })
    expect(child.parentId).toBe(parent.id)
  })

  it('AC-47-07: 父分类不存在报错', () => {
    expect(() => service.createAssetCategory({
      tenantId: TENANT, name: '子分类', parentId: 'nonexistent',
    })).toThrow('Parent category not found')
  })

  it('AC-47-07: 查询分类', () => {
    const cat = service.createAssetCategory({
      tenantId: TENANT, name: '测试分类', sortOrder: 0,
    })
    const found = service.getAssetCategory(cat.id, TENANT)
    expect(found).toBeDefined()
    expect(found!.name).toBe('测试分类')
  })

  it('AC-47-07: 跨租户查询返回undefined', () => {
    const cat = service.createAssetCategory({
      tenantId: TENANT, name: '租户A分类', sortOrder: 0,
    })
    expect(service.getAssetCategory(cat.id, 'other')).toBeUndefined()
  })

  it('AC-47-07: 列表按序号+名称排序', () => {
    service.createAssetCategory({ tenantId: TENANT, name: 'B类', sortOrder: 2 })
    service.createAssetCategory({ tenantId: TENANT, name: 'A类', sortOrder: 1 })
    const list = service.listAssetCategories(TENANT)
    expect(list).toHaveLength(2)
    expect(list[0].sortOrder).toBeLessThanOrEqual(list[1].sortOrder)
  })

  it('AC-47-08: 分类树形结构', () => {
    const root = service.createAssetCategory({ tenantId: TENANT, name: '根分类', sortOrder: 1 })
    const child1 = service.createAssetCategory({ tenantId: TENANT, name: '子分类1', parentId: root.id, sortOrder: 1 })
    service.createAssetCategory({ tenantId: TENANT, name: '子子分类', parentId: child1.id, sortOrder: 1 })

    const tree = service.getAssetCategoryTree(TENANT)
    expect(tree).toHaveLength(1)
    expect(tree[0].children).toHaveLength(1)
    expect(tree[0].children[0].children).toHaveLength(1)
  })

  it('AC-47-09: 更新分类', () => {
    const cat = service.createAssetCategory({
      tenantId: TENANT, name: '原名', sortOrder: 0,
    })
    const updated = service.updateAssetCategory(cat.id, TENANT, { name: '新名称', sortOrder: 99 })
    expect(updated.name).toBe('新名称')
    expect(updated.sortOrder).toBe(99)
  })

  it('AC-47-09: 删除分类', () => {
    const cat = service.createAssetCategory({ tenantId: TENANT, name: '待删除', sortOrder: 0 })
    expect(service.deleteAssetCategory(cat.id, TENANT)).toBe(true)
    expect(service.getAssetCategory(cat.id, TENANT)).toBeUndefined()
  })
})

describe('P-47 Phase 80%: 资产标签管理', () => {
  let service: BrandOperationsService

  beforeEach(() => {
    service = new BrandOperationsService()
    resetBrandOpsStoresForTests()
  })

  it('AC-47-10: 创建标签', () => {
    const tag = service.createAssetTag({
      tenantId: TENANT, name: '热门', color: '#FF0000',
    })
    expect(tag.id).toMatch(/^atag-/)
    expect(tag.name).toBe('热门')
    expect(tag.color).toBe('#FF0000')
  })

  it('AC-47-10: 列表标签', () => {
    service.createAssetTag({ tenantId: TENANT, name: 'B标签' })
    service.createAssetTag({ tenantId: TENANT, name: 'A标签' })
    const list = service.listAssetTags(TENANT)
    expect(list).toHaveLength(2)
    expect(list[0].name).toBe('A标签') // 按名称排序
  })

  it('AC-47-10: 删除标签', () => {
    const tag = service.createAssetTag({ tenantId: TENANT, name: '待删除' })
    expect(service.deleteAssetTag(tag.id, TENANT)).toBe(true)
    expect(service.listAssetTags(TENANT)).toHaveLength(0)
  })

  it('AC-47-10: 删除不存在的标签返回false', () => {
    expect(service.deleteAssetTag('nonexistent', TENANT)).toBe(false)
  })
})

describe('P-47 Phase 80%: 品牌数据看板', () => {
  let service: BrandOperationsService

  beforeEach(() => {
    service = new BrandOperationsService()
    resetBrandOpsStoresForTests()
  })

  it('AC-47-11: 空数据看板', () => {
    const dash = service.getBrandDashboard(TENANT)
    expect(dash.totalAssets).toBe(0)
    expect(dash.totalCampaigns).toBe(0)
    expect(dash.totalCollaborations).toBe(0)
    expect(dash.storeSyncRate).toBe(0)
    expect(dash.assetUsageStats).toEqual([])
    expect(dash.campaignEffectiveness).toEqual([])
  })

  it('AC-47-11: 带数据的看板', () => {
    // 创建素材
    service.createAsset({
      tenantId: TENANT, brandId: 'b-1', type: 'logo', url: '/logos/1.png', name: '品牌Logo', active: true,
    })
    service.createAsset({
      tenantId: TENANT, brandId: 'b-1', type: 'banner', url: '/banners/1.png', name: '主视觉', active: true,
    })
    service.createAsset({
      tenantId: TENANT, brandId: 'b-1', type: 'video', url: '/videos/1.mp4', name: '宣传视频', active: false,
    })

    // 创建活动
    const camp = service.createCampaign({
      tenantId: TENANT, brandId: 'b-1', title: '活动A',
      description: '描述', storeIds: ['s-1', 's-2'],
      startDate: '2026-01-01T00:00:00Z', endDate: '2026-01-31T23:59:59Z',
      createdBy: 'u-1',
    })
    service.updateCampaign(camp.id, TENANT, { status: 'active' })
    service.syncToStores(camp.id, TENANT)

    // 创建合作
    const collab = service.createCollaboration({
      tenantId: TENANT, brandId: 'b-1', title: '联名合作',
      description: '合作', type: 'co_branding',
      partner: { name: '伙伴', contactName: '联系', contactPhone: '13800000000', grade: 'gold' },
      revenueShare: { type: 'fixed_rate', rate: 0.2 },
      startDate: '2026-01-01T00:00:00Z', endDate: '2026-12-31T23:59:59Z',
      createdBy: 'u-1',
    })
    service.updateCollaboration(collab.id, TENANT, { status: 'active' })

    // 创建模板
    service.createTemplate({
      tenantId: TENANT, brandId: 'b-1', name: '模板A',
      description: '模板', tags: ['seasonal'], published: true,
      createdBy: 'u-1',
    })

    const dash = service.getBrandDashboard(TENANT)
    expect(dash.totalAssets).toBe(3)
    expect(dash.activeAssets).toBe(2)
    expect(dash.assetUsageStats).toHaveLength(3)
    expect(dash.totalCampaigns).toBe(1)
    expect(dash.activeCampaigns).toBe(1)
    expect(dash.totalCollaborations).toBe(1)
    expect(dash.activeCollaborations).toBe(1)
    expect(dash.totalTemplates).toBe(1)
    expect(dash.publishedTemplates).toBe(1)
  })

  it('AC-47-11: 素材使用统计', () => {
    const asset1 = service.createAsset({
      tenantId: TENANT, brandId: 'b-1', type: 'logo', url: '/l1.png', name: 'Logo1', active: true,
    })
    const asset2 = service.createAsset({
      tenantId: TENANT, brandId: 'b-1', type: 'banner', url: '/b1.png', name: 'Banner1', active: true,
    })
    // 活动引用素材
    service.createCampaign({
      tenantId: TENANT, brandId: 'b-1', title: '引用活动',
      description: '描述', storeIds: ['s-1'],
      startDate: '2026-01-01T00:00:00Z', endDate: '2026-01-31T23:59:59Z',
      assets: [asset1.id, asset2.id], createdBy: 'u-1',
    })

    const dash = service.getBrandDashboard(TENANT)
    const logoStat = dash.assetUsageStats.find((s) => s.type === 'logo')
    const bannerStat = dash.assetUsageStats.find((s) => s.type === 'banner')
    expect(logoStat).toBeDefined()
    expect(logoStat!.usageCount).toBe(1)
    expect(bannerStat).toBeDefined()
    expect(bannerStat!.usageCount).toBe(1)
  })

  it('AC-47-12: 活动效果统计', () => {
    const camp = service.createCampaign({
      tenantId: TENANT, brandId: 'b-1', title: '活动效果',
      description: '描述', storeIds: ['s-1', 's-2', 's-3'],
      startDate: '2026-01-01T00:00:00Z', endDate: '2026-01-31T23:59:59Z',
      createdBy: 'u-1',
    })
    service.updateCampaign(camp.id, TENANT, { status: 'active' })
    service.syncToStores(camp.id, TENANT)

    const dash = service.getBrandDashboard(TENANT)
    expect(dash.campaignEffectiveness).toHaveLength(1)
    const eff = dash.campaignEffectiveness[0]
    expect(eff.count).toBe(1)
    expect(eff.totalStores).toBe(3)
    expect(eff.syncedStores).toBe(3)
  })
})
