/**
 * brand-operations.phase-p47-100.test.ts
 * P-47 品牌运营 Phase 100% 测试
 *
 * 覆盖:
 * 1. 品牌活动数据导出 - ExportRecord CRUD + 数据生成
 * 2. 联名合作合同管理 - CollaborationContract CRUD + 状态
 * 3. 品牌活动A/B测试 - 创建/启动/暂停/恢复/指标/决策
 * 4. 品牌运营日历 - Calendar timeline 生成
 * 5. 品牌资产回收站 - 软删除/恢复/永久删除/过期清理
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { BrandOperationsService, resetBrandOpsStoresForTests } from './brand-operations.service'

const TENANT = 'tenant-p47-100'
const BRAND = 'brand-p47-100'

describe('P-47 Phase 100%: 品牌活动数据导出', () => {
  let service: BrandOperationsService

  beforeEach(() => {
    service = new BrandOperationsService()
    resetBrandOpsStoresForTests()
  })

  it('TC-47-101: 请求导出campaigns数据(同步生成完成)', () => {
    // 先准备一些数据
    service.createCampaign({
      tenantId: TENANT,
      brandId: BRAND,
      title: 'Export Test Campaign',
      description: '用于测试导出',
      storeIds: ['s-1'],
      startDate: '2026-07-01T00:00:00Z',
      endDate: '2026-07-31T23:59:59Z',
      createdBy: 'u-1',
    })

    const record = service.requestExport({
      tenantId: TENANT,
      format: 'csv',
      scope: 'campaigns',
      requestedBy: 'u-1',
    })

    // 当前实现中数据同步生成，返回时已完成
    expect(record.id).toMatch(/^export-/)
    expect(record.scope).toBe('campaigns')
    expect(record.format).toBe('csv')
    expect(record.requestedBy).toBe('u-1')

    const completed = service.getExportRecord(record.id, TENANT)
    expect(completed).toBeDefined()
    expect(completed!.status).toBe('completed')
    expect(completed!.recordCount).toBeGreaterThanOrEqual(1)
    expect(completed!.filePath).toMatch(/^\/exports\//)
    expect(completed!.completedAt).toBeTruthy()
  })

  it('TC-47-102: 请求导出assets数据', () => {
    service.createAsset({
      tenantId: TENANT,
      brandId: BRAND,
      type: 'logo',
      url: 'https://cdn.example.com/logo.png',
      name: 'Test Logo',
    })

    const record = service.requestExport({
      tenantId: TENANT,
      format: 'xlsx',
      scope: 'assets',
      requestedBy: 'u-2',
    })

    const fetched = service.getExportRecord(record.id, TENANT)
    expect(fetched!.status).toBe('completed')
    expect(fetched!.recordCount).toBe(1)
    expect(fetched!.format).toBe('xlsx')
  })

  it('TC-47-103: 列出导出记录并支持scope/format筛选', () => {
    service.requestExport({ tenantId: TENANT, format: 'csv', scope: 'campaigns', requestedBy: 'u-1' })
    service.requestExport({ tenantId: TENANT, format: 'xlsx', scope: 'assets', requestedBy: 'u-1' })
    service.requestExport({ tenantId: TENANT, format: 'csv', scope: 'templates', requestedBy: 'u-1' })

    const all = service.listExportRecords(TENANT)
    expect(all).toHaveLength(3)

    const csvOnly = service.listExportRecords(TENANT, { format: 'csv' })
    expect(csvOnly).toHaveLength(2)

    const assetsOnly = service.listExportRecords(TENANT, { scope: 'assets' })
    expect(assetsOnly).toHaveLength(1)
  })

  it('TC-47-104: 导出记录隔离租户', () => {
    const r1 = service.requestExport({ tenantId: TENANT, format: 'csv', scope: 'campaigns', requestedBy: 'u-1' })
    const r2 = service.requestExport({ tenantId: 'other-tenant', format: 'csv', scope: 'campaigns', requestedBy: 'u-2' })

    expect(service.getExportRecord(r1.id, 'other-tenant')).toBeUndefined()
    expect(service.getExportRecord(r2.id, TENANT)).toBeUndefined()
    expect(service.listExportRecords(TENANT)).toHaveLength(1)
  })
})

describe('P-47 Phase 100%: 联名合作合同管理', () => {
  let service: BrandOperationsService

  beforeEach(() => {
    service = new BrandOperationsService()
    resetBrandOpsStoresForTests()
  })

  it('TC-47-201: 创建联名合同(含全部字段)', () => {
    const collab = service.createCollaboration({
      tenantId: TENANT,
      brandId: BRAND,
      title: '测试合作',
      description: 'test',
      type: 'co_branding',
      partner: { name: 'PartnerCo', grade: 'gold', contactName: '张三', contactPhone: '13800138000', contactEmail: 'partner@test.com' },
      revenueShare: { type: 'fixed_rate', rate: 0.3 },
      startDate: '2026-08-01T00:00:00Z',
      endDate: '2026-12-31T23:59:59Z',
      createdBy: 'u-1',
    })

    const contract = service.createCollaborationContract({
      tenantId: TENANT,
      collaborationId: collab.id,
      contractNumber: 'CN-2026-001',
      title: '联名合作协议',
      filePath: '/contracts/cn-2026-001.pdf',
      effectiveDate: '2026-08-01T00:00:00Z',
      expiryDate: '2026-12-31T23:59:59Z',
      amount: 500000,
      parties: [{ name: '我方', role: '甲方' }, { name: 'PartnerCo', role: '乙方' }],
      termsSummary: '合作分成比例30%',
      autoRenew: true,
      createdBy: 'u-1',
    })

    expect(contract.id).toMatch(/^ccont-/)
    expect(contract.contractNumber).toBe('CN-2026-001')
    expect(contract.status).toBe('draft')
    expect(contract.amount).toBe(500000)
    expect(contract.parties).toHaveLength(2)
    expect(contract.autoRenew).toBe(true)
  })

  it('TC-47-202: 合同CRUD基本操作', () => {
    const collab = service.createCollaboration({
      tenantId: TENANT, brandId: BRAND, title: 'C', description: 'd',
      type: 'sponsorship',
      partner: { name: 'P', grade: 'silver', contactName: 'L', contactPhone: 'T', contactEmail: 'E' },
      revenueShare: { type: 'fixed_amount', fixedAmount: 100000 },
      startDate: '2026-09-01T00:00:00Z', endDate: '2026-12-31T23:59:59Z',
      createdBy: 'u-1',
    })

    const c = service.createCollaborationContract({
      tenantId: TENANT, collaborationId: collab.id,
      contractNumber: 'CN-001', title: 'Test',
      effectiveDate: '2026-09-01T00:00:00Z', expiryDate: '2026-12-31T23:59:59Z',
      amount: 100000, createdBy: 'u-1',
    })

    // GET
    const fetched = service.getCollaborationContract(c.id, TENANT)
    expect(fetched!.title).toBe('Test')

    // UPDATE
    const updated = service.updateCollaborationContract(c.id, TENANT, {
      status: 'signed',
      filePath: '/contracts/signed.pdf',
      termsSummary: '已签署',
    })
    expect(updated.status).toBe('signed')
    expect(updated.filePath).toBe('/contracts/signed.pdf')

    // DELETE
    const deleted = service.deleteCollaborationContract(c.id, TENANT)
    expect(deleted).toBe(true)
    expect(service.getCollaborationContract(c.id, TENANT)).toBeUndefined()
  })

  it('TC-47-203: 合同状态流转(draft→signed→active→expired)', () => {
    const collab = service.createCollaboration({
      tenantId: TENANT, brandId: BRAND, title: 'C', description: 'd',
      type: 'joint_promotion',
      partner: { name: 'P', grade: 'platinum', contactName: 'L', contactPhone: 'T', contactEmail: 'E' },
      revenueShare: { type: 'fixed_rate', rate: 0.25 },
      startDate: '2026-10-01T00:00:00Z', endDate: '2027-09-30T23:59:59Z',
      createdBy: 'u-1',
    })

    let c = service.createCollaborationContract({
      tenantId: TENANT, collaborationId: collab.id,
      contractNumber: 'CN-2026-002', title: '年度合作',
      effectiveDate: '2026-10-01T00:00:00Z', expiryDate: '2027-09-30T23:59:59Z',
      amount: 1000000, createdBy: 'u-1',
    })
    expect(c.status).toBe('draft')

    c = service.updateCollaborationContract(c.id, TENANT, { status: 'signed', signedAt: '2026-09-15T00:00:00Z' })
    expect(c.status).toBe('signed')

    c = service.updateCollaborationContract(c.id, TENANT, { status: 'active' })
    expect(c.status).toBe('active')

    c = service.updateCollaborationContract(c.id, TENANT, { status: 'expired' })
    expect(c.status).toBe('expired')
  })

  it('TC-47-204: 合同按联名合作ID和状态筛选', () => {
    const collab1 = service.createCollaboration({
      tenantId: TENANT, brandId: BRAND, title: 'C1', description: 'd',
      type: 'co_branding',
      partner: { name: 'P1', grade: 'gold', contactName: 'N', contactPhone: 'T', contactEmail: 'E' },
      revenueShare: { type: 'fixed_rate', rate: 0.3 },
      startDate: '2026-08-01T00:00:00Z', endDate: '2026-12-31T23:59:59Z',
      createdBy: 'u-1',
    })
    const collab2 = service.createCollaboration({
      tenantId: TENANT, brandId: BRAND, title: 'C2', description: 'd',
      type: 'sponsorship',
      partner: { name: 'P2', grade: 'silver', contactName: 'N', contactPhone: 'T', contactEmail: 'E' },
      revenueShare: { type: 'fixed_amount', fixedAmount: 50000 },
      startDate: '2026-09-01T00:00:00Z', endDate: '2027-03-31T23:59:59Z',
      createdBy: 'u-1',
    })

    const c1 = service.createCollaborationContract({
      tenantId: TENANT, collaborationId: collab1.id,
      contractNumber: 'CN-001', title: 'Contract A',
      effectiveDate: '2026-08-01T00:00:00Z', expiryDate: '2026-12-31T23:59:59Z',
      amount: 300000, createdBy: 'u-1', status: 'active',
    })
    const c2 = service.createCollaborationContract({
      tenantId: TENANT, collaborationId: collab2.id,
      contractNumber: 'CN-002', title: 'Contract B',
      effectiveDate: '2026-09-01T00:00:00Z', expiryDate: '2027-03-31T23:59:59Z',
      amount: 50000, createdBy: 'u-1', status: 'draft',
    })

    const byCollab = service.listCollaborationContracts(TENANT, { collaborationId: collab1.id })
    expect(byCollab).toHaveLength(1)
    expect(byCollab[0].title).toBe('Contract A')

    const byStatus = service.listCollaborationContracts(TENANT, { status: 'active' })
    expect(byStatus).toHaveLength(1)
  })
})

describe('P-47 Phase 100%: 品牌活动A/B测试', () => {
  let service: BrandOperationsService

  beforeEach(() => {
    service = new BrandOperationsService()
    resetBrandOpsStoresForTests()
  })

  it('TC-47-301: 创建A/B测试(含2个变体)', () => {
    const camp = service.createCampaign({
      tenantId: TENANT, brandId: BRAND, title: 'AB测试活动', description: 'test',
      storeIds: ['s-1', 's-2'], startDate: '2026-08-01T00:00:00Z', endDate: '2026-08-31T23:59:59Z',
      createdBy: 'u-1',
    })

    const abTest = service.createCampaignABTest({
      tenantId: TENANT,
      campaignId: camp.id,
      name: '标题A/B测试',
      description: '测试不同标题的转化效果',
      variants: [
        { name: 'Variant A', description: '促销标题A', storeIds: ['s-1'] },
        { name: 'Variant B', description: '促销标题B', variantTitle: '限时大促', storeIds: ['s-2'] },
      ],
      createdBy: 'u-1',
    })

    expect(abTest.id).toMatch(/^abtest-/)
    expect(abTest.status).toBe('draft')
    expect(abTest.variants).toHaveLength(2)
    expect(abTest.variants[0].ctr).toBe(0)
    expect(abTest.variants[1].variantTitle).toBe('限时大促')
  })

  it('TC-47-302: A/B测试状态流转(draft→running→paused→running→completed)', () => {
    const camp = service.createCampaign({
      tenantId: TENANT, brandId: BRAND, title: '状态流转', description: 'test',
      storeIds: ['s-1'], startDate: '2026-08-01T00:00:00Z', endDate: '2026-08-31T23:59:59Z',
      createdBy: 'u-1',
    })

    let abTest = service.createCampaignABTest({
      tenantId: TENANT, campaignId: camp.id, name: 'Test', description: 'd',
      variants: [
        { name: 'A', description: 'a', storeIds: ['s-1'] },
        { name: 'B', description: 'b', storeIds: ['s-1'] },
      ],
      createdBy: 'u-1',
    })
    expect(abTest.status).toBe('draft')

    abTest = service.startCampaignABTest(abTest.id, TENANT)
    expect(abTest.status).toBe('running')
    expect(abTest.startedAt).toBeTruthy()

    abTest = service.pauseCampaignABTest(abTest.id, TENANT)
    expect(abTest.status).toBe('paused')

    abTest = service.resumeCampaignABTest(abTest.id, TENANT)
    expect(abTest.status).toBe('running')
  })

  it('TC-47-303: 记录变体指标并计算CTR/转化率', () => {
    const camp = service.createCampaign({
      tenantId: TENANT, brandId: BRAND, title: '指标测试', description: 'test',
      storeIds: ['s-1'], startDate: '2026-08-01T00:00:00Z', endDate: '2026-08-31T23:59:59Z',
      createdBy: 'u-1',
    })

    let abTest = service.createCampaignABTest({
      tenantId: TENANT, campaignId: camp.id, name: 'Metrics', description: 'd',
      variants: [
        { name: 'A', description: 'a', storeIds: ['s-1'] },
        { name: 'B', description: 'b', storeIds: ['s-1'] },
      ],
      createdBy: 'u-1',
    })

    abTest = service.startCampaignABTest(abTest.id, TENANT)
    const variantA = abTest.variants[0]
    const variantB = abTest.variants[1]

    // 变体指标累加
    abTest = service.recordVariantMetrics(abTest.id, variantA.id, TENANT, {
      impressions: 1000, clicks: 100, conversions: 20,
    })
    abTest = service.recordVariantMetrics(abTest.id, variantB.id, TENANT, {
      impressions: 800, clicks: 60, conversions: 15,
    })

    const va = abTest.variants.find((v) => v.id === variantA.id)!
    expect(va.impressions).toBe(1000)
    expect(va.clicks).toBe(100)
    expect(va.ctr).toBe(0.1) // 100/1000
    expect(va.conversionRate).toBe(0.02) // 20/1000

    const vb = abTest.variants.find((v) => v.id === variantB.id)!
    expect(vb.ctr).toBe(0.075) // 60/800
    // 四舍五入到4位小数: 15/800 = 0.01875 → 0.0188
    expect(vb.conversionRate).toBe(0.0188)
  })

  it('TC-47-304: 选择获胜变体并获取对比分析', () => {
    const camp = service.createCampaign({
      tenantId: TENANT, brandId: BRAND, title: 'Winner', description: 'test',
      storeIds: ['s-1'], startDate: '2026-08-01T00:00:00Z', endDate: '2026-08-31T23:59:59Z',
      createdBy: 'u-1',
    })

    let abTest = service.createCampaignABTest({
      tenantId: TENANT, campaignId: camp.id, name: 'Winner Test', description: 'd',
      variants: [
        { name: 'Control', description: '原版', storeIds: ['s-1'] },
        { name: 'Treatment', description: '优化版', storeIds: ['s-1'] },
      ],
      createdBy: 'u-1',
    })

    abTest = service.startCampaignABTest(abTest.id, TENANT)
    const winnerId = abTest.variants[1].id

    abTest = service.recordVariantMetrics(abTest.id, abTest.variants[0].id, TENANT, {
      impressions: 500, clicks: 25, conversions: 5,
    })
    abTest = service.recordVariantMetrics(abTest.id, winnerId, TENANT, {
      impressions: 500, clicks: 60, conversions: 18,
    })

    // 选择获胜变体
    abTest = service.decideABTestWinner(abTest.id, winnerId, TENANT)
    expect(abTest.status).toBe('completed')
    expect(abTest.winnerVariantId).toBe(winnerId)
    expect(abTest.endedAt).toBeTruthy()

    // 对比分析
    const comparison = service.getABTestComparison(abTest.id, TENANT)
    expect(comparison.bestVariant).not.toBeNull()
    expect(comparison.recommendation).toContain('Treatment')
  })
})

describe('P-47 Phase 100%: 品牌运营日历', () => {
  let service: BrandOperationsService

  beforeEach(() => {
    service = new BrandOperationsService()
    resetBrandOpsStoresForTests()
  })

  it('TC-47-401: 获取日历时间轴(含活动启动/结束事件)', () => {
    // 创建跨时间段的活动
    service.createCampaign({
      tenantId: TENANT, brandId: BRAND,
      title: '2026夏季促销', description: '夏季活动',
      storeIds: ['s-1'], startDate: '2026-07-15T00:00:00Z', endDate: '2026-08-15T23:59:59Z',
      createdBy: 'u-1',
    })
    service.createCampaign({
      tenantId: TENANT, brandId: BRAND,
      title: '2026秋季上新', description: '秋季活动',
      storeIds: ['s-2'], startDate: '2026-09-01T00:00:00Z', endDate: '2026-09-30T23:59:59Z',
      createdBy: 'u-1',
    })

    const timeline = service.getCalendarTimeline(TENANT, '2026-07-01T00:00:00Z', '2026-09-30T23:59:59Z')

    // 2个活动 × 2个事件(start+end) = 4
    expect(timeline.events.length).toBe(4)
    expect(timeline.events.filter((e) => e.type === 'campaign_start')).toHaveLength(2)
    expect(timeline.events.filter((e) => e.type === 'campaign_end')).toHaveLength(2)

    // 每日统计
    expect(timeline.dailyCounts.length).toBeGreaterThanOrEqual(2)

    // 每月统计
    expect(timeline.monthlyCounts.length).toBeGreaterThanOrEqual(2)
  })

  it('TC-47-402: 日历过滤指定事件类型', () => {
    // 创建活动
    service.createCampaign({
      tenantId: TENANT, brandId: BRAND,
      title: '促销', description: 'd',
      storeIds: ['s-1'], startDate: '2026-08-01T00:00:00Z', endDate: '2026-08-15T23:59:59Z',
      createdBy: 'u-1',
    })
    // 创建联名
    service.createCollaboration({
      tenantId: TENANT, brandId: BRAND,
      title: '联名合作', description: 'd',
      type: 'co_branding',
      partner: { name: 'X', grade: 'gold', contactName: 'N', contactPhone: 'T', contactEmail: 'E' },
      revenueShare: { type: 'fixed_rate', rate: 0.2 },
      startDate: '2026-08-10T00:00:00Z', endDate: '2026-09-10T23:59:59Z',
      createdBy: 'u-1',
    })

    const allEvents = service.getCalendarTimeline(TENANT, '2026-08-01T00:00:00Z', '2026-09-30T23:59:59Z')
    expect(allEvents.events.length).toBe(4) // 2×2

    const startOnly = service.getCalendarTimeline(TENANT, '2026-08-01T00:00:00Z', '2026-09-30T23:59:59Z', 'campaign_start')
    expect(startOnly.events).toHaveLength(1)
    expect(startOnly.events[0].type).toBe('campaign_start')
  })

  it('TC-47-403: 日历非法日期抛错', () => {
    expect(() => service.getCalendarTimeline(TENANT, 'invalid', '2026-08-31T23:59:59Z')).toThrow('Invalid date range')
    expect(() => service.getCalendarTimeline(TENANT, '2026-09-01T00:00:00Z', '2026-08-01T00:00:00Z')).toThrow('Start date must be before end date')
  })
})

describe('P-47 Phase 100%: 品牌资产回收站', () => {
  let service: BrandOperationsService

  beforeEach(() => {
    service = new BrandOperationsService()
    resetBrandOpsStoresForTests()
  })

  it('TC-47-501: 软删除资产并入回收站', () => {
    const asset = service.createAsset({
      tenantId: TENANT, brandId: BRAND,
      type: 'logo', url: 'https://cdn.example.com/logo.png', name: '待删除Logo',
    })

    const binItem = service.softDeleteEntity({
      tenantId: TENANT,
      entityType: 'asset',
      entityId: asset.id,
      deletedBy: 'u-1',
    })

    expect(binItem.id).toMatch(/^rb-/)
    expect(binItem.entityType).toBe('asset')
    expect(binItem.entityId).toBe(asset.id)
    expect(binItem.entitySummary).toContain('待删除Logo')
    expect(binItem.originalData).toBeTruthy()
    expect(binItem.deletedAt).toBeTruthy()
    expect(binItem.expiresAt).toBeTruthy()

    // 确认原实体已删除
    expect(service.getAsset(asset.id, TENANT)).toBeUndefined()
  })

  it('TC-47-502: 软删除活动并入回收站', () => {
    const camp = service.createCampaign({
      tenantId: TENANT, brandId: BRAND,
      title: '待删除活动', description: 'd',
      storeIds: ['s-1'], startDate: '2026-08-01T00:00:00Z', endDate: '2026-08-31T23:59:59Z',
      createdBy: 'u-1',
    })

    const binItem = service.softDeleteEntity({
      tenantId: TENANT, entityType: 'campaign', entityId: camp.id, deletedBy: 'u-1',
    })
    expect(binItem.entitySummary).toContain('待删除活动')
    expect(service.getCampaign(camp.id, TENANT)).toBeUndefined()
  })

  it('TC-47-503: 从回收站恢复实体', () => {
    const camp = service.createCampaign({
      tenantId: TENANT, brandId: BRAND,
      title: '待恢复活动', description: 'd',
      storeIds: ['s-1', 's-2'], startDate: '2026-08-01T00:00:00Z', endDate: '2026-08-31T23:59:59Z',
      createdBy: 'u-1',
    })
    const campId = camp.id

    const binItem = service.softDeleteEntity({
      tenantId: TENANT, entityType: 'campaign', entityId: campId, deletedBy: 'u-1',
    })

    expect(service.getCampaign(campId, TENANT)).toBeUndefined()

    const restored = service.restoreFromRecycleBin(binItem.id, TENANT)
    expect(restored.restoredAt).toBeTruthy()

    // 验证恢复完整
    const recovered = service.getCampaign(campId, TENANT)
    expect(recovered).toBeDefined()
    expect(recovered!.title).toBe('待恢复活动')
    expect(recovered!.storeIds).toEqual(['s-1', 's-2'])
  })

  it('TC-47-504: 永久删除回收站项目', () => {
    const asset = service.createAsset({
      tenantId: TENANT, brandId: BRAND,
      type: 'banner', url: 'https://example.com/banner.jpg', name: '永久删除测试',
    })

    const binItem = service.softDeleteEntity({
      tenantId: TENANT, entityType: 'asset', entityId: asset.id, deletedBy: 'u-1',
    })

    const result = service.permanentlyDeleteFromRecycleBin(binItem.id, TENANT)
    expect(result).toBe(true)

    expect(service.permanentlyDeleteFromRecycleBin('non-existent', TENANT)).toBe(false)
  })

  it('TC-47-505: 回收站按实体类型和搜索筛选', () => {
    const a1 = service.createAsset({ tenantId: TENANT, brandId: BRAND, type: 'logo', url: 'u1', name: 'Logo1' })
    const a2 = service.createAsset({ tenantId: TENANT, brandId: BRAND, type: 'banner', url: 'u2', name: 'Banner1' })
    const c1 = service.createCampaign({
      tenantId: TENANT, brandId: BRAND, title: 'Camp1', description: 'd',
      storeIds: ['s-1'], startDate: '2026-08-01T00:00:00Z', endDate: '2026-08-31T23:59:59Z',
      createdBy: 'u-1',
    })

    service.softDeleteEntity({ tenantId: TENANT, entityType: 'asset', entityId: a1.id, deletedBy: 'u-1' })
    service.softDeleteEntity({ tenantId: TENANT, entityType: 'asset', entityId: a2.id, deletedBy: 'u-1' })
    service.softDeleteEntity({ tenantId: TENANT, entityType: 'campaign', entityId: c1.id, deletedBy: 'u-1' })

    const all = service.listRecycleBinItems(TENANT)
    expect(all).toHaveLength(3)

    const assetsOnly = service.listRecycleBinItems(TENANT, { entityType: 'asset' })
    expect(assetsOnly).toHaveLength(2)

    const campaignOnly = service.listRecycleBinItems(TENANT, { entityType: 'campaign' })
    expect(campaignOnly).toHaveLength(1)

    const searchResult = service.listRecycleBinItems(TENANT, { search: 'Logo' })
    expect(searchResult).toHaveLength(1)
  })

  it('TC-47-506: 清理过期回收站项目', () => {
    const asset = service.createAsset({
      tenantId: TENANT, brandId: BRAND,
      type: 'logo', url: 'https://example.com/logo.png', name: 'Expired Asset',
    })
    const binItem = service.softDeleteEntity({
      tenantId: TENANT, entityType: 'asset', entityId: asset.id, deletedBy: 'u-1',
    })

    // 用未来时间: 不过期
    let count = service.cleanExpiredRecycleBinItems('2026-01-01T00:00:00Z')
    expect(count).toBe(0)

    // 用过去时间: 全部过期
    count = service.cleanExpiredRecycleBinItems('2100-01-01T00:00:00Z')
    expect(count).toBe(1)

    expect(service.listRecycleBinItems(TENANT)).toHaveLength(0)
  })

  it('TC-47-507: 不支持实体类型抛错', () => {
    expect(() =>
      service.softDeleteEntity({
        tenantId: TENANT, entityType: 'unknown' as any, entityId: 'x', deletedBy: 'u-1',
      })
    ).toThrow('Unsupported entity type')
  })
})
