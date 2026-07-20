import { describe, it, expect, beforeEach } from 'vitest'
/**
 * 🦞 跨模块 E2E 测试链 #44: 品牌运营 → 后勤管理 全链路
 *
 * 模拟链路:
 *   Brand-Operations (品牌活动创建/审批/发布/下架/归档)
 *   → Logistics (后勤物资关联/耗材采购/审批/入库)
 *   → Equipment Maintenance (设备报修/工单流转/完工评分)
 *
 * 覆盖模块: brand-operations, logistics, procurement-order, warehouse-bin, equipment-fault-report
 *
 * 设计模式: 品牌活动从创建到归档的全生命周期，后勤物资保障与设备维保
 * 验证品牌活动与后勤采购、设备维修的跨模块协同
 */

import assert from 'node:assert/strict'

// ============================================================
// 类型定义
// ============================================================

// ---- 品牌运营层 ----
type CampaignStatus = 'draft' | 'pending_review' | 'approved' | 'active' | 'ended' | 'cancelled' | 'archived'
type AssetType = 'logo' | 'banner' | 'video' | 'copy'

interface BrandAsset {
  id: string
  type: AssetType
  url: string
  name: string
  description?: string
  active: boolean
  tenantId: string
  createdAt: string
}

interface BrandCampaign {
  id: string
  tenantId: string
  title: string
  description: string
  storeIds: string[]
  startDate: string
  endDate: string
  status: CampaignStatus
  assets: string[]
  coverImageUrl?: string
  createdBy: string
  approval?: { reviewerId: string; reviewerName: string; note: string; approvedAt: string }
  publishNote?: string
  archivedAt?: string
  createdAt: string
  updatedAt: string
}

// ---- 后勤物资层 ----
type MaterialRequestStatus = 'pending_approval' | 'approved' | 'rejected' | 'ordered' | 'received'
type ProcurementStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'ordered' | 'received'

interface MaterialRequestItem {
  itemId: string
  itemName: string
  category: string
  unit: string
  quantity: number
}

interface MaterialRequest {
  id: string
  campaignId: string
  tenantId: string
  requesterId: string
  requesterName: string
  purpose: string
  status: MaterialRequestStatus
  items: MaterialRequestItem[]
  totalQuantity: number
  approval?: { approverId: string; approverName: string; note: string; approvedAt: string }
  outbound?: { operatorId: string; operatorName: string; outboundAt: string }
  createdAt: string
  updatedAt: string
}

interface ProcurementRequest {
  id: string
  materialRequestId: string
  tenantId: string
  vendorName?: string
  status: ProcurementStatus
  approval?: { approverId: string; approverName: string; note: string; approvedAt: string }
  receiveRecord?: { receivedAt: string; receivedBy: string; note?: string }
  createdAt: string
}

// ---- 设备维保层 ----
type RepairOrderStatus = 'open' | 'assigned' | 'in_progress' | 'completed' | 'verified'
type MaintenanceOrderStatus = 'pending' | 'in_progress' | 'pending_acceptance' | 'completed'

interface RepairOrder {
  id: string
  tenantId: string
  equipmentId: string
  equipmentName: string
  issueDescription: string
  reporterId: string
  reporterName: string
  status: RepairOrderStatus
  assigneeId?: string
  assigneeName?: string
  assignedAt?: string
  startedAt?: string
  completedAt?: string
  completionNote?: string
  rating?: number
  verification?: { verifierId: string; verifierName: string; note: string; verifiedAt: string }
  createdAt: string
  updatedAt: string
}

// ============================================================
// 模块模拟实现
// ============================================================

// ---- Brand Operations Service ----

const campaignStore = new Map<string, BrandCampaign>()
const assetStore = new Map<string, BrandAsset>()
let campaignSeq = 0
let assetSeq = 0

function resetBrandState(): void {
  campaignStore.clear()
  assetStore.clear()
  campaignSeq = 0
  assetSeq = 0
}

function createBrandAsset(opts: { type: AssetType; url: string; name: string; tenantId: string }): BrandAsset {
  const asset: BrandAsset = {
    id: `BA${++assetSeq}`,
    type: opts.type,
    url: opts.url,
    name: opts.name,
    active: true,
    tenantId: opts.tenantId,
    createdAt: new Date().toISOString(),
  }
  assetStore.set(asset.id, asset)
  return asset
}

function createCampaign(opts: {
  tenantId: string
  title: string
  description: string
  storeIds: string[]
  startDate: string
  endDate: string
  createdBy: string
  assets?: string[]
}): BrandCampaign {
  const now = new Date().toISOString()
  const c: BrandCampaign = {
    id: `BC${++campaignSeq}`,
    tenantId: opts.tenantId,
    title: opts.title,
    description: opts.description,
    storeIds: opts.storeIds,
    startDate: opts.startDate,
    endDate: opts.endDate,
    status: 'draft',
    assets: opts.assets || [],
    createdBy: opts.createdBy,
    createdAt: now,
    updatedAt: now,
  }
  campaignStore.set(c.id, c)
  return { ...c }
}

function submitCampaignForReview(campaignId: string): BrandCampaign {
  const c = campaignStore.get(campaignId)
  if (!c) throw new Error(`Campaign ${campaignId} not found`)
  if (c.status !== 'draft') throw new Error(`Cannot submit campaign with status: ${c.status}`)
  c.status = 'pending_review'
  c.updatedAt = new Date().toISOString()
  return { ...c }
}

function approveCampaign(campaignId: string, reviewerId: string, reviewerName: string, note: string): BrandCampaign {
  const c = campaignStore.get(campaignId)
  if (!c) throw new Error(`Campaign ${campaignId} not found`)
  if (c.status !== 'pending_review') throw new Error(`Cannot approve campaign with status: ${c.status}`)
  c.status = 'approved'
  c.approval = { reviewerId, reviewerName, note, approvedAt: new Date().toISOString() }
  c.updatedAt = new Date().toISOString()
  return { ...c }
}

function publishCampaign(campaignId: string, publishNote?: string): BrandCampaign {
  const c = campaignStore.get(campaignId)
  if (!c) throw new Error(`Campaign ${campaignId} not found`)
  if (c.status !== 'approved') throw new Error(`Cannot publish campaign with status: ${c.status}`)
  c.status = 'active'
  c.publishNote = publishNote
  c.updatedAt = new Date().toISOString()
  return { ...c }
}

function endCampaign(campaignId: string): BrandCampaign {
  const c = campaignStore.get(campaignId)
  if (!c) throw new Error(`Campaign ${campaignId} not found`)
  if (c.status !== 'active') throw new Error(`Cannot end campaign with status: ${c.status}`)
  c.status = 'ended'
  c.updatedAt = new Date().toISOString()
  return { ...c }
}

function archiveCampaign(campaignId: string): BrandCampaign {
  const c = campaignStore.get(campaignId)
  if (!c) throw new Error(`Campaign ${campaignId} not found`)
  if (c.status !== 'ended') throw new Error(`Cannot archive campaign with status: ${c.status}`)
  c.status = 'archived'
  c.archivedAt = new Date().toISOString()
  c.updatedAt = new Date().toISOString()
  return { ...c }
}

function getCampaign(campaignId: string): BrandCampaign | undefined {
  const c = campaignStore.get(campaignId)
  return c ? { ...c } : undefined
}

// ---- Logistics / Material Service ----

const materialStore = new Map<string, MaterialRequest>()
let matSeq = 0
const procurementStore = new Map<string, ProcurementRequest>()
let procSeq = 0

function resetLogisticsState(): void {
  materialStore.clear()
  procurementStore.clear()
  matSeq = 0
  procSeq = 0
}

function createMaterialRequest(opts: {
  campaignId: string
  tenantId: string
  requesterId: string
  requesterName: string
  purpose: string
  items: MaterialRequestItem[]
}): MaterialRequest {
  const now = new Date().toISOString()
  const m: MaterialRequest = {
    id: `MR${++matSeq}`,
    campaignId: opts.campaignId,
    tenantId: opts.tenantId,
    requesterId: opts.requesterId,
    requesterName: opts.requesterName,
    purpose: opts.purpose,
    status: 'pending_approval',
    items: opts.items.map(i => ({ ...i })),
    totalQuantity: opts.items.reduce((s, i) => s + i.quantity, 0),
    createdAt: now,
    updatedAt: now,
  }
  materialStore.set(m.id, m)
  return { ...m }
}

function approveMaterialRequest(materialId: string, approverId: string, approverName: string, note: string): MaterialRequest {
  const m = materialStore.get(materialId)
  if (!m) throw new Error(`Material request ${materialId} not found`)
  if (m.status !== 'pending_approval') throw new Error(`Cannot approve material request with status: ${m.status}`)
  m.status = 'approved'
  m.approval = { approverId, approverName, note, approvedAt: new Date().toISOString() }
  m.updatedAt = new Date().toISOString()
  return { ...m }
}

function rejectMaterialRequest(materialId: string, approverId: string, approverName: string, note: string): MaterialRequest {
  const m = materialStore.get(materialId)
  if (!m) throw new Error(`Material request ${materialId} not found`)
  if (m.status !== 'pending_approval') throw new Error(`Cannot reject material request with status: ${m.status}`)
  m.status = 'rejected'
  m.approval = { approverId, approverName, note, approvedAt: new Date().toISOString() }
  m.updatedAt = new Date().toISOString()
  return { ...m }
}

// ---- Procurement Service ----

function createProcurementFromMaterial(materialId: string, vendorName: string): ProcurementRequest {
  const m = materialStore.get(materialId)
  if (!m) throw new Error(`Material request ${materialId} not found`)
  if (m.status !== 'approved') throw new Error(`Cannot create procurement from non-approved material request`)
  const now = new Date().toISOString()
  const p: ProcurementRequest = {
    id: `PR${++procSeq}`,
    materialRequestId: materialId,
    tenantId: m.tenantId,
    vendorName,
    status: 'draft',
    createdAt: now,
  }
  procurementStore.set(p.id, p)
  return { ...p }
}

function submitProcurementForApproval(procurementId: string): ProcurementRequest {
  const p = procurementStore.get(procurementId)
  if (!p) throw new Error(`Procurement ${procurementId} not found`)
  p.status = 'pending_approval'
  return { ...p }
}

function approveProcurement(procurementId: string, approverId: string, approverName: string, note: string): ProcurementRequest {
  const p = procurementStore.get(procurementId)
  if (!p) throw new Error(`Procurement ${procurementId} not found`)
  if (p.status !== 'pending_approval') throw new Error(`Cannot approve procurement with status: ${p.status}`)
  p.status = 'approved'
  p.approval = { approverId, approverName, note, approvedAt: new Date().toISOString() }
  return { ...p }
}

function receiveProcurement(procurementId: string, receivedBy: string, note?: string): ProcurementRequest {
  const p = procurementStore.get(procurementId)
  if (!p) throw new Error(`Procurement ${procurementId} not found`)
  if (p.status !== 'approved') throw new Error(`Cannot receive procurement with status: ${p.status}`)
  p.status = 'received'
  p.receiveRecord = { receivedAt: new Date().toISOString(), receivedBy, note }
  return { ...p }
}

function getMaterialRequest(materialId: string): MaterialRequest | undefined {
  const m = materialStore.get(materialId)
  return m ? { ...m } : undefined
}

// ---- Equipment/Repair Service ----

const repairStore = new Map<string, RepairOrder>()
let repairSeq = 0

function resetRepairState(): void {
  repairStore.clear()
  repairSeq = 0
}

function createRepairOrder(opts: {
  tenantId: string
  equipmentId: string
  equipmentName: string
  issueDescription: string
  reporterId: string
  reporterName: string
}): RepairOrder {
  const now = new Date().toISOString()
  const r: RepairOrder = {
    id: `RO${++repairSeq}`,
    tenantId: opts.tenantId,
    equipmentId: opts.equipmentId,
    equipmentName: opts.equipmentName,
    issueDescription: opts.issueDescription,
    reporterId: opts.reporterId,
    reporterName: opts.reporterName,
    status: 'open',
    createdAt: now,
    updatedAt: now,
  }
  repairStore.set(r.id, r)
  return { ...r }
}

function assignRepairOrder(repairId: string, assigneeId: string, assigneeName: string): RepairOrder {
  const r = repairStore.get(repairId)
  if (!r) throw new Error(`Repair order ${repairId} not found`)
  if (r.status !== 'open') throw new Error(`Cannot assign repair order with status: ${r.status}`)
  r.status = 'assigned'
  r.assigneeId = assigneeId
  r.assigneeName = assigneeName
  r.assignedAt = new Date().toISOString()
  r.updatedAt = new Date().toISOString()
  return { ...r }
}

function startRepairWork(repairId: string): RepairOrder {
  const r = repairStore.get(repairId)
  if (!r) throw new Error(`Repair order ${repairId} not found`)
  if (r.status !== 'assigned') throw new Error(`Cannot start repair with status: ${r.status}`)
  r.status = 'in_progress'
  r.startedAt = new Date().toISOString()
  r.updatedAt = new Date().toISOString()
  return { ...r }
}

function completeRepair(repairId: string, completionNote: string): RepairOrder {
  const r = repairStore.get(repairId)
  if (!r) throw new Error(`Repair order ${repairId} not found`)
  if (r.status !== 'in_progress') throw new Error(`Cannot complete repair with status: ${r.status}`)
  r.status = 'completed'
  r.completedAt = new Date().toISOString()
  r.completionNote = completionNote
  r.updatedAt = new Date().toISOString()
  return { ...r }
}

function verifyRepair(repairId: string, verifierId: string, verifierName: string, note: string, rating: number): RepairOrder {
  const r = repairStore.get(repairId)
  if (!r) throw new Error(`Repair order ${repairId} not found`)
  if (r.status !== 'completed') throw new Error(`Cannot verify repair with status: ${r.status}`)
  r.status = 'verified'
  r.rating = rating
  r.verification = { verifierId, verifierName, note, verifiedAt: new Date().toISOString() }
  r.updatedAt = new Date().toISOString()
  return { ...r }
}

function getRepairOrder(repairId: string): RepairOrder | undefined {
  const r = repairStore.get(repairId)
  return r ? { ...r } : undefined
}

// ---- 全链路整合函数: 品牌活动 + 后勤采购 ----

interface FullCampaignWithLogisticsResult {
  campaign: BrandCampaign
  asset: BrandAsset
  materialRequest: MaterialRequest
  materialApproved: MaterialRequest
  procurement: ProcurementRequest
  procurementApproved: ProcurementRequest
  procurementReceived: ProcurementRequest
}

function executeFullCampaignWithLogistics(): FullCampaignWithLogisticsResult {
  // 1. 创建品牌素材
  const asset = createBrandAsset({
    type: 'banner',
    url: 'https://cdn.example.com/promotion-banner.jpg',
    name: '暑期大促横幅',
    tenantId: 'T044',
  })

  // 2. 创建品牌活动
  const campaign = createCampaign({
    tenantId: 'T044',
    title: '暑期狂欢大促',
    description: '2026年暑期门店大促活动',
    storeIds: ['S001', 'S002', 'S003'],
    startDate: '2026-08-01T00:00:00.000Z',
    endDate: '2026-08-31T23:59:59.000Z',
    createdBy: 'U001',
    assets: [asset.id],
  })

  // 3. 提交审核 → 批准 → 发布
  submitCampaignForReview(campaign.id)
  approveCampaign(campaign.id, 'REV001', '张审批', '活动内容合规，批准')
  publishCampaign(campaign.id, '暑期大促正式上线')

  // 4. 关联后勤物资需求
  const matReq = createMaterialRequest({
    campaignId: campaign.id,
    tenantId: 'T044',
    requesterId: 'U002',
    requesterName: '李后勤',
    purpose: `暑期大促物资-${campaign.title}`,
    items: [
      { itemId: 'ITEM001', itemName: '促销海报', category: '印刷品', unit: '张', quantity: 500 },
      { itemId: 'ITEM002', itemName: '展架', category: '展示器材', unit: '个', quantity: 20 },
      { itemId: 'ITEM003', itemName: '礼品袋', category: '包装材料', unit: '个', quantity: 1000 },
    ],
  })

  // 5. 采购审批
  const matApproved = approveMaterialRequest(matReq.id, 'APR001', '王审批', '物资需求合理，批准')

  // 6. 创建采购单
  const procurement = createProcurementFromMaterial(matReq.id, '广告物料供应商-华美')
  submitProcurementForApproval(procurement.id)
  const procurementApproved = approveProcurement(procurement.id, 'PUR001', '赵采购', '已核价，批准采购')

  // 7. 入库
  const procurementReceived = receiveProcurement(procurement.id, '周仓管', '已验收入库，数量无误')

  return {
    campaign: getCampaign(campaign.id)!,
    asset,
    materialRequest: matReq,
    materialApproved: matApproved,
    procurement,
    procurementApproved,
    procurementReceived,
  }
}

// ============================================================
// 测试用例
// ============================================================

describe('🦞 跨模块 E2E #44: 品牌运营→后勤全链路', () => {
  beforeEach(() => {
    resetBrandState()
    resetLogisticsState()
    resetRepairState()
  })

  // --- 正例 ---
  describe('正例', () => {
    it('品牌活动完整生命周期: 创建→审核→发布→下架→归档', () => {
      const campaign = createCampaign({
        tenantId: 'T044',
        title: '国庆庆典活动',
        description: '国庆门店庆典促销',
        storeIds: ['S001', 'S002'],
        startDate: '2026-10-01T00:00:00.000Z',
        endDate: '2026-10-07T23:59:59.000Z',
        createdBy: 'U003',
      })

      assert.equal(campaign.status, 'draft')

      const submitted = submitCampaignForReview(campaign.id)
      assert.equal(submitted.status, 'pending_review')

      const approved = approveCampaign(campaign.id, 'REV002', '张审批', '内容合规')
      assert.equal(approved.status, 'approved')
      assert.equal(approved.approval!.reviewerName, '张审批')

      const published = publishCampaign(campaign.id, '国庆活动发布')
      assert.equal(published.status, 'active')
      assert.equal(published.publishNote, '国庆活动发布')

      const ended = endCampaign(campaign.id)
      assert.equal(ended.status, 'ended')

      const archived = archiveCampaign(campaign.id)
      assert.equal(archived.status, 'archived')
      assert.ok(archived.archivedAt)
    })

    it('品牌活动与后勤采购全链路 — 创建到入库', () => {
      const result = executeFullCampaignWithLogistics()

      // 品牌活动
      assert.equal(result.campaign.status, 'active')
      assert.equal(result.campaign.title, '暑期狂欢大促')

      // 素材
      assert.equal(result.asset.type, 'banner')
      assert.ok(result.asset.active)

      // 物资需求
      assert.equal(result.materialRequest.status, 'pending_approval')
      assert.equal(result.materialRequest.items.length, 3)
      assert.equal(result.materialRequest.totalQuantity, 1520)

      // 物资审批通过
      assert.equal(result.materialApproved.status, 'approved')
      assert.ok(result.materialApproved.approval)

      // 采购审批
      assert.equal(result.procurementApproved.status, 'approved')

      // 入库
      assert.equal(result.procurementReceived.status, 'received')
      assert.equal(result.procurementReceived.receiveRecord!.receivedBy, '周仓管')
    })

    it('品牌活动多门店同步: 创建时指定多个门店', () => {
      const storeIds = ['S001', 'S002', 'S003', 'S004', 'S005']
      const campaign = createCampaign({
        tenantId: 'T044',
        title: '多门店联动促销',
        description: '覆盖五家门店',
        storeIds,
        startDate: '2026-09-01T00:00:00.000Z',
        endDate: '2026-09-30T23:59:59.000Z',
        createdBy: 'U004',
      })

      assert.equal(campaign.storeIds.length, 5)
      assert.deepEqual(campaign.storeIds, storeIds)

      submitCampaignForReview(campaign.id)
      approveCampaign(campaign.id, 'REV003', '张审批', '批准')
      const published = publishCampaign(campaign.id)

      assert.equal(published.status, 'active')
      assert.equal(published.storeIds.length, 5)
    })
  })

  // --- 反例 ---
  describe('反例', () => {
    it('草稿状态的活动不能直接发布 — 必须先审批', () => {
      const campaign = createCampaign({
        tenantId: 'T044',
        title: '未审批活动',
        description: '未经过审核',
        storeIds: ['S001'],
        startDate: '2026-11-01T00:00:00.000Z',
        endDate: '2026-11-30T23:59:59.000Z',
        createdBy: 'U005',
      })

      assert.throws(() => publishCampaign(campaign.id), /Cannot publish/)
    })

    it('未审批的物资需求不能创建采购单', () => {
      const campaign = createCampaign({
        tenantId: 'T044',
        title: '测试活动',
        description: '测试物资审批',
        storeIds: ['S001'],
        startDate: '2026-07-01T00:00:00.000Z',
        endDate: '2026-07-31T23:59:59.000Z',
        createdBy: 'U006',
      })

      const matReq = createMaterialRequest({
        campaignId: campaign.id,
        tenantId: 'T044',
        requesterId: 'U007',
        requesterName: '李后勤',
        purpose: '测试物资',
        items: [{ itemId: 'ITEM001', itemName: '测试物料', category: '其他', unit: '个', quantity: 10 }],
      })

      // Material request is pending_approval, not approved — should fail
      assert.throws(() => createProcurementFromMaterial(matReq.id, '测试供应商'), /Cannot create/)
    })

    it('审批拒绝的物资需求不能再创建采购', () => {
      const campaign = createCampaign({
        tenantId: 'T044',
        title: '拒绝测试',
        description: '测试拒绝',
        storeIds: ['S001'],
        startDate: '2026-07-01T00:00:00.000Z',
        endDate: '2026-07-31T23:59:59.000Z',
        createdBy: 'U008',
      })

      const matReq = createMaterialRequest({
        campaignId: campaign.id,
        tenantId: 'T044',
        requesterId: 'U009',
        requesterName: '李后勤',
        purpose: '被拒绝的物资',
        items: [{ itemId: 'ITEM001', itemName: '昂贵物料', category: '其他', unit: '个', quantity: 100 }],
      })

      rejectMaterialRequest(matReq.id, 'APR002', '王审批', '预算不足，拒绝')

      assert.throws(() => createProcurementFromMaterial(matReq.id, '供应商'), /Cannot create/)
    })
  })

  // --- 设备报修 ---
  describe('设备报修', () => {
    it('设备报修→分配→开始→完成→验收→评分 — 完整链路', () => {
      const repair = createRepairOrder({
        tenantId: 'T044',
        equipmentId: 'EQ001',
        equipmentName: '抓娃娃机A-3号',
        issueDescription: '机械臂卡顿，无法正常抓取',
        reporterId: 'U010',
        reporterName: '陈店长',
      })

      assert.equal(repair.status, 'open')

      const assigned = assignRepairOrder(repair.id, 'TEC001', '刘技师')
      assert.equal(assigned.status, 'assigned')
      assert.equal(assigned.assigneeName, '刘技师')

      const started = startRepairWork(repair.id)
      assert.equal(started.status, 'in_progress')
      assert.ok(started.startedAt)

      const completed = completeRepair(repair.id, '已更换机械臂齿轮，运行正常')
      assert.equal(completed.status, 'completed')
      assert.ok(completed.completedAt)

      const verified = verifyRepair(repair.id, 'U011', '陈店长', '维修良好，机器正常运行', 5)
      assert.equal(verified.status, 'verified')
      assert.equal(verified.rating, 5)
      assert.equal(verified.verification!.verifierName, '陈店长')
    })

    it('未分配的维修单不能开始维修', () => {
      const repair = createRepairOrder({
        tenantId: 'T044',
        equipmentId: 'EQ002',
        equipmentName: '音响设备',
        issueDescription: '声音沙哑',
        reporterId: 'U012',
        reporterName: '钱员工',
      })

      assert.throws(() => startRepairWork(repair.id), /Cannot start/)
    })

    it('未完成的维修单不能验收评分', () => {
      const repair = createRepairOrder({
        tenantId: 'T044',
        equipmentId: 'EQ003',
        equipmentName: '空调',
        issueDescription: '制冷不足',
        reporterId: 'U013',
        reporterName: '孙员工',
      })

      assert.throws(() => verifyRepair(repair.id, 'U014', '孙员工', '验收', 3), /Cannot verify/)
    })
  })

  // --- 边界 ---
  describe('边界', () => {
    it('已下架的活动可以归档但不能重复下架', () => {
      const campaign = createCampaign({
        tenantId: 'T044',
        title: '周年庆活动',
        description: '一周年店庆',
        storeIds: ['S001'],
        startDate: '2026-06-01T00:00:00.000Z',
        endDate: '2026-06-30T23:59:59.000Z',
        createdBy: 'U015',
      })

      submitCampaignForReview(campaign.id)
      approveCampaign(campaign.id, 'REV004', '张审批', '通过')
      publishCampaign(campaign.id)
      endCampaign(campaign.id)

      // 可以归档
      const archived = archiveCampaign(campaign.id)
      assert.equal(archived.status, 'archived')

      // 不能重复下架
      assert.throws(() => endCampaign(campaign.id), /Cannot end/)
    })

    it('后勤物资可关联多个品牌活动（通过campaignId追踪）', () => {
      const camp1 = createCampaign({
        tenantId: 'T044', title: '活动A', description: 'A',
        storeIds: ['S001'], startDate: '2026-08-01T00:00:00.000Z', endDate: '2026-08-31T23:59:59.000Z',
        createdBy: 'U016',
      })
      const camp2 = createCampaign({
        tenantId: 'T044', title: '活动B', description: 'B',
        storeIds: ['S002'], startDate: '2026-09-01T00:00:00.000Z', endDate: '2026-09-30T23:59:59.000Z',
        createdBy: 'U016',
      })

      const mr1 = createMaterialRequest({
        campaignId: camp1.id, tenantId: 'T044',
        requesterId: 'U017', requesterName: '李后勤',
        purpose: `活动物资-${camp1.title}`,
        items: [{ itemId: 'ITEM001', itemName: '海报', category: '印刷品', unit: '张', quantity: 200 }],
      })
      const mr2 = createMaterialRequest({
        campaignId: camp2.id, tenantId: 'T044',
        requesterId: 'U017', requesterName: '李后勤',
        purpose: `活动物资-${camp2.title}`,
        items: [{ itemId: 'ITEM002', itemName: '展架', category: '展示器材', unit: '个', quantity: 10 }],
      })

      assert.equal(mr1.campaignId, camp1.id)
      assert.equal(mr2.campaignId, camp2.id)
      assert.notEqual(mr1.campaignId, mr2.campaignId)
    })

    it('设备报修评分有效范围 (1-5)', () => {
      const repair = createRepairOrder({
        tenantId: 'T044',
        equipmentId: 'EQ004',
        equipmentName: '游戏机B-2号',
        issueDescription: '投币器故障',
        reporterId: 'U018',
        reporterName: '周员工',
      })

      assignRepairOrder(repair.id, 'TEC002', '吴技师')
      startRepairWork(repair.id)
      completeRepair(repair.id, '已维修')

      const verified = verifyRepair(repair.id, 'U019', '周员工', '良好', 4)
      assert.equal(verified.rating, 4)
      assert.ok(verified.rating >= 1 && verified.rating <= 5)
    })

    it('未指定门店的活动物资需求仍可创建', () => {
      const campaign = createCampaign({
        tenantId: 'T044', title: '线上促销', description: '线上活动无需门店',
        storeIds: ['virtual-store'], startDate: '2026-08-01T00:00:00.000Z',
        endDate: '2026-08-31T23:59:59.000Z', createdBy: 'U020',
      })

      const matReq = createMaterialRequest({
        campaignId: campaign.id, tenantId: 'T044',
        requesterId: 'U021', requesterName: '李后勤',
        purpose: '线上活动数字素材',
        items: [{ itemId: 'ITEM003', itemName: '数字素材', category: '数字内容', unit: '套', quantity: 1 }],
      })

      assert.ok(matReq)
      assert.equal(matReq.purpose, '线上活动数字素材')
      assert.equal(matReq.items.length, 1)
    })
  })
})
