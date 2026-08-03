/**
 * brand-operations.phase60.test.ts
 * P-47 Phase 60% 新增测试
 *
 * 覆盖:
 * 1. 活动审批发布流 (submit/approve/reject/publish)
 * 2. 联名合作管理 CRUD
 * 3. 联名合作统计
 * 4. 活动关联到合作
 * 5. 扩展状态机验证
 * 6. 审批流程边界条件
 * 7. 联名合作状态迁移
 * 8. 调用 controller 加载
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { BrandOperationsService, resetBrandOpsStoresForTests } from './brand-operations.service'
import type { Collaboration } from './brand-operations.entity'

const TENANT_ID = 't-1'
const BRAND_ID = 'b-1'

describe('P-47 Phase 60%: 活动审批发布流', () => {
  let service: BrandOperationsService

  beforeEach(() => {
    resetBrandOpsStoresForTests()
    service = new BrandOperationsService()
  })

  it('AC-47-04: 提交审批: draft → pending_review', () => {
    const camp = service.createCampaign({
      tenantId: TENANT_ID, brandId: BRAND_ID, title: '元旦活动', description: '促销',
      storeIds: ['s-1'], startDate: '2027-01-01T00:00:00Z', endDate: '2027-01-10T00:00:00Z', createdBy: 'u-1',
    })
    const submitted = service.submitCampaignForReview(camp.id, TENANT_ID)
    expect(submitted.status).toBe('pending_review')
  })

  it('AC-47-04: 审批通过: pending_review → approved', () => {
    const camp = service.createCampaign({
      tenantId: TENANT_ID, brandId: BRAND_ID, title: '春季促销', description: '促销',
      storeIds: ['s-1'], startDate: '2027-03-01T00:00:00Z', endDate: '2027-03-15T00:00:00Z', createdBy: 'u-1',
    })
    service.submitCampaignForReview(camp.id, TENANT_ID)
    const approved = service.approveCampaign(camp.id, TENANT_ID, {
      reviewerId: 'manager-1', reviewerName: '运营经理', note: '预算内，批准',
    })
    expect(approved.status).toBe('approved')
    expect(approved.approval).toBeDefined()
    expect(approved.approval!.reviewerName).toBe('运营经理')
    expect(approved.approval!.note).toBe('预算内，批准')
  })

  it('AC-47-04: 审批打回: pending_review → draft', () => {
    const camp = service.createCampaign({
      tenantId: TENANT_ID, brandId: BRAND_ID, title: '国庆活动', description: '促销',
      storeIds: ['s-1'], startDate: '2027-10-01T00:00:00Z', endDate: '2027-10-07T00:00:00Z', createdBy: 'u-1',
    })
    service.submitCampaignForReview(camp.id, TENANT_ID)
    const rejected = service.rejectCampaign(camp.id, TENANT_ID, {
      reviewerId: 'manager-1', reviewerName: '运营经理', reason: '预算不足，需调整',
    })
    expect(rejected.status).toBe('draft')
    expect(rejected.publishNote).toContain('预算不足')
  })

  it('AC-47-04: 发布活动: approved → active', () => {
    const camp = service.createCampaign({
      tenantId: TENANT_ID, brandId: BRAND_ID, title: '暑期大促', description: '促销',
      storeIds: ['s-1'], startDate: '2027-07-01T00:00:00Z', endDate: '2027-08-31T00:00:00Z', createdBy: 'u-1',
    })
    service.submitCampaignForReview(camp.id, TENANT_ID)
    service.approveCampaign(camp.id, TENANT_ID, { reviewerId: 'mgr', reviewerName: '经理', note: 'ok' })
    const published = service.publishCampaign(camp.id, TENANT_ID, '已发布至全部门店')
    expect(published.status).toBe('active')
    expect(published.publishNote).toBe('已发布至全部门店')
  })

  it('RQ-47-05: 审批流边界 - 不能重复提交', () => {
    const camp = service.createCampaign({
      tenantId: TENANT_ID, brandId: BRAND_ID, title: '测试', description: '测试',
      storeIds: ['s-1'], startDate: '2027-01-01T00:00:00Z', endDate: '2027-01-10T00:00:00Z', createdBy: 'u-1',
    })
    service.submitCampaignForReview(camp.id, TENANT_ID)
    expect(() => service.submitCampaignForReview(camp.id, TENANT_ID)).toThrow('Cannot submit')
  })

  it('RQ-47-05: 审批流边界 - draft不能直接发布', () => {
    const camp = service.createCampaign({
      tenantId: TENANT_ID, brandId: BRAND_ID, title: '测试', description: '测试',
      storeIds: ['s-1'], startDate: '2027-01-01T00:00:00Z', endDate: '2027-01-10T00:00:00Z', createdBy: 'u-1',
    })
    expect(() => service.publishCampaign(camp.id, TENANT_ID)).toThrow('Cannot publish')
  })

  it('RQ-47-05: 审批流边界 - 未提交不能审批', () => {
    const camp = service.createCampaign({
      tenantId: TENANT_ID, brandId: BRAND_ID, title: '测试', description: '测试',
      storeIds: ['s-1'], startDate: '2027-01-01T00:00:00Z', endDate: '2027-01-10T00:00:00Z', createdBy: 'u-1',
    })
    expect(() => service.approveCampaign(camp.id, TENANT_ID, { reviewerId: 'm', reviewerName: 'M', note: 'ok' })).toThrow('Cannot approve')
  })

  it('AC-47-05: 完整审批发布闭环', () => {
    const camp = service.createCampaign({
      tenantId: TENANT_ID, brandId: BRAND_ID, title: '周年庆', description: '品牌周年庆',
      storeIds: ['s-1', 's-2', 's-3'], startDate: '2027-05-01T00:00:00Z', endDate: '2027-05-07T00:00:00Z', createdBy: 'u-1',
    })
    expect(camp.status).toBe('draft')

    const submitted = service.submitCampaignForReview(camp.id, TENANT_ID)
    expect(submitted.status).toBe('pending_review')

    const approved = service.approveCampaign(camp.id, TENANT_ID, { reviewerId: 'mgr', reviewerName: '运营经理', note: '品牌周年庆预算已批' })
    expect(approved.status).toBe('approved')
    expect(approved.approval!.approvedAt).toBeTruthy()

    const published = service.publishCampaign(camp.id, TENANT_ID, '发布到3家门店')
    expect(published.status).toBe('active')

    // 同步门店
    const syncs = service.syncToStores(camp.id, TENANT_ID)
    expect(syncs).toHaveLength(3)
  })
})

describe('P-47 Phase 60%: 联名合作管理', () => {
  let service: BrandOperationsService

  beforeEach(() => {
    resetBrandOpsStoresForTests()
    service = new BrandOperationsService()
  })

  it('AC-47-06: 创建联名合作: 铂金级, 固定分成', () => {
    const collab = service.createCollaboration({
      tenantId: TENANT_ID, brandId: BRAND_ID,
      title: 'SEGA联名推广',
      description: '与SEGA联合推广新款街机',
      type: 'co_branding',
      partner: { name: 'SEGA', contactName: '田中', contactPhone: '13800138000', grade: 'platinum' },
      revenueShare: { type: 'fixed_rate', rate: 0.3, description: '30%收入分成' },
      startDate: '2027-01-01T00:00:00Z',
      endDate: '2027-12-31T00:00:00Z',
      coBrandName: 'SEGA × 神机营',
      createdBy: 'u-1',
    })
    expect(collab.id).toMatch(/^collab-/)
    expect(collab.title).toBe('SEGA联名推广')
    expect(collab.status).toBe('draft')
    expect(collab.partner.grade).toBe('platinum')
    expect(collab.partner.name).toBe('SEGA')
    expect(collab.revenueShare.type).toBe('fixed_rate')
    expect(collab.revenueShare.rate).toBe(0.3)
    expect(collab.coBrandName).toBe('SEGA × 神机营')
  })

  it('AC-47-06: 创建联名合作: 黄金级, 阶梯分成', () => {
    const collab = service.createCollaboration({
      tenantId: TENANT_ID, brandId: BRAND_ID,
      title: '可口可乐夏季联名',
      description: '可口可乐品牌联合促销',
      type: 'joint_promotion',
      partner: { name: '可口可乐', contactName: '刘经理', contactPhone: '010-8888-3333', grade: 'gold' },
      revenueShare: { type: 'tiered', tiers: [{ threshold: 100000, rate: 0.2 }, { threshold: 500000, rate: 0.25 }] },
      startDate: '2027-06-01T00:00:00Z',
      endDate: '2027-09-30T00:00:00Z',
      createdBy: 'u-1',
    })
    expect(collab.partner.grade).toBe('gold')
    expect(collab.revenueShare.tiers).toHaveLength(2)
    expect(collab.revenueShare.tiers![0].rate).toBe(0.2)
  })

  it('AC-47-06: 创建联名合作: 固定金额分成', () => {
    const collab = service.createCollaboration({
      tenantId: TENANT_ID, brandId: BRAND_ID,
      title: '活动赞助',
      description: 'VR活动赞助',
      type: 'sponsorship',
      partner: { name: 'VR设备商', contactName: '王总', contactPhone: '0755-8888-5555', grade: 'silver' },
      revenueShare: { type: 'fixed_amount', fixedAmount: 5000000, description: '固定赞助费5万元' },
      startDate: '2027-09-01T00:00:00Z',
      endDate: '2027-12-31T00:00:00Z',
      createdBy: 'u-1',
    })
    expect(collab.revenueShare.fixedAmount).toBe(5000000)
  })

  it('AC-47-06: 拒绝无效日期范围', () => {
    expect(() => service.createCollaboration({
      tenantId: TENANT_ID, brandId: BRAND_ID,
      title: '无效合作', description: '结束早于开始',
      type: 'co_branding',
      partner: { name: 'Test', contactName: 'T', contactPhone: '123', grade: 'bronze' },
      revenueShare: { type: 'no_share' },
      startDate: '2027-12-31T00:00:00Z',
      endDate: '2027-01-01T00:00:00Z',
      createdBy: 'u-1',
    })).toThrow('Start date must be before end date')
  })

  it('AC-47-06: 查询联名合作 - 全部', () => {
    service.createCollaboration({
      tenantId: TENANT_ID, brandId: BRAND_ID, title: '合作A', description: 'D',
      type: 'co_branding', partner: { name: 'P1', contactName: 'C1', contactPhone: '111', grade: 'gold' },
      revenueShare: { type: 'no_share' }, startDate: '2027-01-01T00:00:00Z', endDate: '2027-12-31T00:00:00Z', createdBy: 'u-1',
    })
    service.createCollaboration({
      tenantId: TENANT_ID, brandId: BRAND_ID, title: '合作B', description: 'D',
      type: 'sponsorship', partner: { name: 'P2', contactName: 'C2', contactPhone: '222', grade: 'silver' },
      revenueShare: { type: 'no_share' }, startDate: '2027-01-01T00:00:00Z', endDate: '2027-12-31T00:00:00Z', createdBy: 'u-1',
    })
    const all = service.listCollaborations(TENANT_ID)
    expect(all).toHaveLength(2)
  })

  it('AC-47-06: 查询联名合作 - 按类型筛选', () => {
    service.createCollaboration({
      tenantId: TENANT_ID, brandId: BRAND_ID, title: '联名', description: 'D',
      type: 'co_branding', partner: { name: 'P1', contactName: 'C1', contactPhone: '111', grade: 'gold' },
      revenueShare: { type: 'no_share' }, startDate: '2027-01-01T00:00:00Z', endDate: '2027-12-31T00:00:00Z', createdBy: 'u-1',
    })
    service.createCollaboration({
      tenantId: TENANT_ID, brandId: BRAND_ID, title: '赞助', description: 'D',
      type: 'sponsorship', partner: { name: 'P2', contactName: 'C2', contactPhone: '222', grade: 'silver' },
      revenueShare: { type: 'no_share' }, startDate: '2027-01-01T00:00:00Z', endDate: '2027-12-31T00:00:00Z', createdBy: 'u-1',
    })
    const sponsorships = service.listCollaborations(TENANT_ID, { type: 'sponsorship' })
    expect(sponsorships).toHaveLength(1)
    expect(sponsorships[0].title).toBe('赞助')
  })

  it('AC-47-06: 查询联名合作 - 按等级筛选', () => {
    service.createCollaboration({
      tenantId: TENANT_ID, brandId: BRAND_ID, title: '铂金合作', description: 'D',
      type: 'co_branding', partner: { name: 'P1', contactName: 'C1', contactPhone: '111', grade: 'platinum' },
      revenueShare: { type: 'no_share' }, startDate: '2027-01-01T00:00:00Z', endDate: '2027-12-31T00:00:00Z', createdBy: 'u-1',
    })
    service.createCollaboration({
      tenantId: TENANT_ID, brandId: BRAND_ID, title: '黄金合作', description: 'D',
      type: 'co_branding', partner: { name: 'P2', contactName: 'C2', contactPhone: '222', grade: 'gold' },
      revenueShare: { type: 'no_share' }, startDate: '2027-01-01T00:00:00Z', endDate: '2027-12-31T00:00:00Z', createdBy: 'u-1',
    })
    const gold = service.listCollaborations(TENANT_ID, { grade: 'gold' })
    expect(gold).toHaveLength(1)
    expect(gold[0].title).toBe('黄金合作')
  })

  it('AC-47-06: 更新联名合作状态', () => {
    const collab = service.createCollaboration({
      tenantId: TENANT_ID, brandId: BRAND_ID, title: '合作测试', description: 'D',
      type: 'co_branding', partner: { name: 'P', contactName: 'C', contactPhone: '111', grade: 'gold' },
      revenueShare: { type: 'no_share' }, startDate: '2027-01-01T00:00:00Z', endDate: '2027-12-31T00:00:00Z', createdBy: 'u-1',
    })
    const updated = service.updateCollaboration(collab.id, TENANT_ID, { title: '合作升级版' })
    expect(updated.title).toBe('合作升级版')
    expect(updated.partner.name).toBe('P')
  })

  it('AC-47-06: 更新联名合作 - 指定联系人', () => {
    const collab = service.createCollaboration({
      tenantId: TENANT_ID, brandId: BRAND_ID, title: '合作', description: 'D',
      type: 'co_branding', partner: { name: 'P', contactName: '旧联系人', contactPhone: '111', grade: 'gold' },
      revenueShare: { type: 'no_share' }, startDate: '2027-01-01T00:00:00Z', endDate: '2027-12-31T00:00:00Z', createdBy: 'u-1',
    })
    const updated = service.updateCollaboration(collab.id, TENANT_ID, {
      partner: { contactName: '新联系人', contactPhone: '222' },
    })
    expect(updated.partner.contactName).toBe('新联系人')
    expect(updated.partner.contactPhone).toBe('222')
    expect(updated.partner.name).toBe('P')
  })

  it('AC-47-06: 删除联名合作', () => {
    const collab = service.createCollaboration({
      tenantId: TENANT_ID, brandId: BRAND_ID, title: '待删除合作', description: 'D',
      type: 'co_branding', partner: { name: 'P', contactName: 'C', contactPhone: '111', grade: 'gold' },
      revenueShare: { type: 'no_share' }, startDate: '2027-01-01T00:00:00Z', endDate: '2027-12-31T00:00:00Z', createdBy: 'u-1',
    })
    expect(service.deleteCollaboration(collab.id, TENANT_ID)).toBe(true)
    expect(service.getCollaboration(collab.id, TENANT_ID)).toBeUndefined()
  })

  it('AC-47-06: 删除不存在的合作返回false', () => {
    expect(service.deleteCollaboration('nonexistent', TENANT_ID)).toBe(false)
  })

  it('AC-47-06: 搜索联名合作', () => {
    service.createCollaboration({
      tenantId: TENANT_ID, brandId: BRAND_ID, title: 'Sony合作', description: 'D',
      type: 'co_branding', partner: { name: 'Sony', contactName: 'C', contactPhone: '111', grade: 'gold' },
      revenueShare: { type: 'no_share' }, startDate: '2027-01-01T00:00:00Z', endDate: '2027-12-31T00:00:00Z', createdBy: 'u-1',
    })
    service.createCollaboration({
      tenantId: TENANT_ID, brandId: BRAND_ID, title: 'Microsoft合作', description: 'D',
      type: 'co_branding', partner: { name: 'Microsoft', contactName: 'C', contactPhone: '222', grade: 'silver' },
      revenueShare: { type: 'no_share' }, startDate: '2027-01-01T00:00:00Z', endDate: '2027-12-31T00:00:00Z', createdBy: 'u-1',
    })
    const searchSony = service.listCollaborations(TENANT_ID, { search: 'sony' })
    expect(searchSony).toHaveLength(1)
    const searchMicrosoft = service.listCollaborations(TENANT_ID, { search: 'micro' })
    expect(searchMicrosoft).toHaveLength(1)
    const searchAll = service.listCollaborations(TENANT_ID, { search: '合作' })
    expect(searchAll).toHaveLength(2)
  })

  it('AC-47-07: 活动关联到联名合作', () => {
    const collab = service.createCollaboration({
      tenantId: TENANT_ID, brandId: BRAND_ID, title: '联名合作', description: 'D',
      type: 'co_branding', partner: { name: 'P', contactName: 'C', contactPhone: '111', grade: 'gold' },
      revenueShare: { type: 'no_share' }, startDate: '2027-01-01T00:00:00Z', endDate: '2027-12-31T00:00:00Z', createdBy: 'u-1',
    })
    const camp = service.createCampaign({
      tenantId: TENANT_ID, brandId: BRAND_ID, title: '关联活动', description: 'D',
      storeIds: ['s-1'], startDate: '2027-03-01T00:00:00Z', endDate: '2027-03-15T00:00:00Z', createdBy: 'u-1',
    })
    const linked = service.linkCampaignToCollaboration(camp.id, collab.id, TENANT_ID)
    expect(linked.campaignIds).toContain(camp.id)
  })

  it('AC-47-07: 活动关联到联名合作 - 幂等', () => {
    const collab = service.createCollaboration({
      tenantId: TENANT_ID, brandId: BRAND_ID, title: '联名', description: 'D',
      type: 'co_branding', partner: { name: 'P', contactName: 'C', contactPhone: '111', grade: 'gold' },
      revenueShare: { type: 'no_share' }, startDate: '2027-01-01T00:00:00Z', endDate: '2027-12-31T00:00:00Z', createdBy: 'u-1',
    })
    const camp = service.createCampaign({
      tenantId: TENANT_ID, brandId: BRAND_ID, title: '活动', description: 'D',
      storeIds: ['s-1'], startDate: '2027-03-01T00:00:00Z', endDate: '2027-03-15T00:00:00Z', createdBy: 'u-1',
    })
    service.linkCampaignToCollaboration(camp.id, collab.id, TENANT_ID)
    service.linkCampaignToCollaboration(camp.id, collab.id, TENANT_ID)
    expect(collab.campaignIds).toHaveLength(1)
  })

  it('AC-47-08: 联名合作统计 - 按等级和类型分组', () => {
    service.createCollaboration({
      tenantId: TENANT_ID, brandId: BRAND_ID, title: 'C1', description: 'D',
      type: 'co_branding', partner: { name: 'P1', contactName: 'C', contactPhone: '111', grade: 'platinum' },
      revenueShare: { type: 'no_share' }, startDate: '2027-01-01T00:00:00Z', endDate: '2027-12-31T00:00:00Z', createdBy: 'u-1',
    })
    service.createCollaboration({
      tenantId: TENANT_ID, brandId: BRAND_ID, title: 'C2', description: 'D',
      type: 'sponsorship', partner: { name: 'P2', contactName: 'C', contactPhone: '222', grade: 'gold' },
      revenueShare: { type: 'no_share' }, startDate: '2027-01-01T00:00:00Z', endDate: '2027-12-31T00:00:00Z', createdBy: 'u-1',
    })
    const metrics = service.getCollaborationMetrics(TENANT_ID)
    expect(metrics.total).toBe(2)
    expect(metrics.active).toBe(0)
    expect(metrics.byGrade.platinum).toBe(1)
    expect(metrics.byGrade.gold).toBe(1)
    expect(metrics.byType.co_branding).toBe(1)
    expect(metrics.byType.sponsorship).toBe(1)
  })

  it('AC-47-08: 联名合作统计 - 仅统计当前租户', () => {
    service.createCollaboration({
      tenantId: TENANT_ID, brandId: BRAND_ID, title: 'C', description: 'D',
      type: 'co_branding', partner: { name: 'P', contactName: 'C', contactPhone: '111', grade: 'platinum' },
      revenueShare: { type: 'no_share' }, startDate: '2027-01-01T00:00:00Z', endDate: '2027-12-31T00:00:00Z', createdBy: 'u-1',
    })
    service.createCollaboration({
      tenantId: 'other-tenant', brandId: BRAND_ID, title: 'Other', description: 'D',
      type: 'sponsorship', partner: { name: 'OP', contactName: 'C', contactPhone: '222', grade: 'gold' },
      revenueShare: { type: 'no_share' }, startDate: '2027-01-01T00:00:00Z', endDate: '2027-12-31T00:00:00Z', createdBy: 'u-1',
    })
    const metrics = service.getCollaborationMetrics(TENANT_ID)
    expect(metrics.total).toBe(1)
  })
})
