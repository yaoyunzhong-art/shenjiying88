/**
 * 🐜 链64: Facility Repair 物品报修/设备维修全链路闭环
 *
 * 路径: Repair (提交报修→派单→维修→完成/取消)
 *       → Facility (设备档案关联)
 *       → Auth (租户隔离)
 *
 * 覆盖模块: repair · facility · auth (3 模块)
 * 新增角色: 👤报修人(员工/客户), 👔维修组长(派单人), 🔧维修工(执行人)
 *
 * Pulse-v23 新增 · 2026-07-21
 */

import { describe, it, beforeEach, afterEach } from 'vitest'
import assert from 'node:assert/strict'

// ═══════════════════════════════════════════════════════════════════════
// 类型定义
// ═══════════════════════════════════════════════════════════════════════

type RepairStatus = 'PENDING' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'

type UrgencyLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
type RepairCategory = 'ELECTRONIC' | 'MECHANICAL' | 'FURNITURE' | 'PLUMBING' | 'ELECTRIC' | 'AC' | 'OTHER'

interface RepairRequest {
  id: string
  requestNo: string
  title: string
  description: string
  category: RepairCategory
  urgency: UrgencyLevel
  status: RepairStatus
  reporterName: string
  reporterPhone: string
  location: string
  deviceName?: string
  deviceId?: string
  assignedTo?: string
  estimatedCost?: number
  actualCost?: number
  completedAt?: string
  result?: string
  remark?: string
  tenantId: string
  createdAt: string
  updatedAt: string
}

interface FacilityDevice {
  id: string
  tenantId: string
  name: string
  deviceNo: string
  category: string
  location: string
  status: 'working' | 'faulty' | 'maintenance' | 'retired'
  purchaseDate: string
  lastRepairDate?: string
  repairCount: number
}

// ═══════════════════════════════════════════════════════════════════════
// 全局状态
// ═══════════════════════════════════════════════════════════════════════

let requestIdCounter = 0
const repairStore: RepairRequest[] = []
const facilityStore: FacilityDevice[] = []
const actionLog: string[] = []

const TENANTS = ['tenant-hq', 'tenant-branch'] as const

// ═══════════════════════════════════════════════════════════════════════
// 辅助函数
// ═══════════════════════════════════════════════════════════════════════

function resetAll(): void {
  requestIdCounter = 0
  repairStore.length = 0
  facilityStore.length = 0
  actionLog.length = 0
}

function generateRequestNo(): string {
  return `RR${new Date().toISOString().slice(2, 10).replace(/-/g, '')}${String(Math.floor(Math.random() * 9000) + 1000)}`
}

// ── 2. facility 模块 ──

function modFacility_addDevice(params: {
  tenantId: string
  name: string
  deviceNo: string
  category: string
  location: string
  purchaseDate: string
}): FacilityDevice {
  const device: FacilityDevice = {
    id: `dev-${params.name}`,
    tenantId: params.tenantId,
    name: params.name,
    deviceNo: params.deviceNo,
    category: params.category,
    location: params.location,
    status: 'working',
    purchaseDate: params.purchaseDate,
    repairCount: 0,
  }
  facilityStore.push(device)
  actionLog.push(`[facility] 添加设备 #${device.id}: ${params.name}(${params.category}) @ ${params.location}`)
  return device
}

function modFacility_getDevice(deviceId: string, tenantId: string): FacilityDevice | undefined {
  return facilityStore.find((d) => d.id === deviceId && d.tenantId === tenantId)
}

function modFacility_markFaulty(deviceId: string, tenantId: string): FacilityDevice {
  const idx = facilityStore.findIndex((d) => d.id === deviceId && d.tenantId === tenantId)
  if (idx === -1) throw new Error(`Device not found: ${deviceId}`)
  const updated = { ...facilityStore[idx], status: 'faulty' as const }
  facilityStore[idx] = updated
  actionLog.push(`[facility] 标记设备 ${deviceId} 为故障状态`)
  return updated
}

function modFacility_recordRepair(deviceId: string, tenantId: string): FacilityDevice {
  const idx = facilityStore.findIndex((d) => d.id === deviceId && d.tenantId === tenantId)
  if (idx === -1) throw new Error(`Device not found: ${deviceId}`)
  const d = facilityStore[idx]
  const updated: FacilityDevice = {
    ...d,
    status: 'working' as const,
    lastRepairDate: new Date().toISOString(),
    repairCount: d.repairCount + 1,
  }
  facilityStore[idx] = updated
  actionLog.push(`[facility] 设备 ${deviceId} 维修完成，状态恢复为正常工作`)
  return updated
}

// ── 1. repair 模块 ──

function modRepair_submit(params: {
  tenantId: string
  title: string
  description: string
  category: RepairCategory
  urgency: UrgencyLevel
  reporterName: string
  reporterPhone: string
  location: string
  deviceName?: string
  deviceId?: string
  remark?: string
}): RepairRequest {
  const now = new Date().toISOString()
  requestIdCounter++
  const req: RepairRequest = {
    id: `repair-${requestIdCounter}`,
    requestNo: generateRequestNo(),
    title: params.title,
    description: params.description,
    category: params.category,
    urgency: params.urgency,
    status: 'PENDING',
    reporterName: params.reporterName,
    reporterPhone: params.reporterPhone,
    location: params.location,
    deviceName: params.deviceName,
    deviceId: params.deviceId,
    remark: params.remark,
    tenantId: params.tenantId,
    createdAt: now,
    updatedAt: now,
  }

  repairStore.push(req)
  actionLog.push(`[repair] 提交报修 #${req.id}: ${params.title} (${params.category}/${params.urgency}) @ ${params.location}`)

  // Update facility device status if deviceId provided
  if (params.deviceId) {
    modFacility_markFaulty(params.deviceId, params.tenantId)
  }

  return req
}

function modRepair_get(requestId: string, tenantId: string): RepairRequest | undefined {
  return repairStore.find((r) => r.id === requestId && r.tenantId === tenantId)
}

function modRepair_list(tenantId: string, filters?: {
  status?: RepairStatus
  category?: RepairCategory
  urgency?: UrgencyLevel
}): RepairRequest[] {
  return repairStore.filter((r) => {
    if (r.tenantId !== tenantId) return false
    if (filters?.status && r.status !== filters.status) return false
    if (filters?.category && r.category !== filters.category) return false
    if (filters?.urgency && r.urgency !== filters.urgency) return false
    return true
  })
}

function modRepair_dispatch(
  requestId: string,
  tenantId: string,
  assignedTo: string,
  estimatedCost?: number,
): RepairRequest | null {
  const idx = repairStore.findIndex((r) => r.id === requestId && r.tenantId === tenantId)
  if (idx === -1) return null

  const req = repairStore[idx]
  if (req.status !== 'PENDING') {
    throw new Error(`Cannot dispatch repair that is already ${req.status}`)
  }

  const now = new Date().toISOString()
  const updated: RepairRequest = {
    ...req,
    status: 'ACCEPTED',
    assignedTo,
    estimatedCost: estimatedCost ?? req.estimatedCost,
    updatedAt: now,
  }
  repairStore[idx] = updated
  actionLog.push(`[repair] 派单 #${req.id} → ${assignedTo}`)
  return updated
}

function modRepair_start(requestId: string, tenantId: string): RepairRequest | null {
  const idx = repairStore.findIndex((r) => r.id === requestId && r.tenantId === tenantId)
  if (idx === -1) return null

  const req = repairStore[idx]
  if (req.status !== 'ACCEPTED') {
    throw new Error(`Cannot start repair in status ${req.status}`)
  }

  const now = new Date().toISOString()
  const updated: RepairRequest = {
    ...req,
    status: 'IN_PROGRESS',
    updatedAt: now,
  }
  repairStore[idx] = updated
  actionLog.push(`[repair] 开始维修 #${req.id}`)
  return updated
}

function modRepair_complete(
  requestId: string,
  tenantId: string,
  input: { result?: string; actualCost?: number; remark?: string },
): RepairRequest | null {
  const idx = repairStore.findIndex((r) => r.id === requestId && r.tenantId === tenantId)
  if (idx === -1) return null

  const req = repairStore[idx]
  if (req.status !== 'IN_PROGRESS') {
    throw new Error(`Cannot complete repair in status ${req.status}`)
  }

  const now = new Date().toISOString()
  const updated: RepairRequest = {
    ...req,
    status: 'COMPLETED',
    completedAt: now,
    result: input.result ?? req.result,
    actualCost: input.actualCost ?? req.actualCost,
    remark: input.remark ?? req.remark,
    updatedAt: now,
  }
  repairStore[idx] = updated
  actionLog.push(`[repair] 完成维修 #${req.id}: ${input.result ?? '完成'}`)

  // Record repair in facility
  if (req.deviceId) {
    modFacility_recordRepair(req.deviceId, tenantId)
  }

  return updated
}

function modRepair_cancel(
  requestId: string,
  tenantId: string,
  remark?: string,
): RepairRequest | null {
  const idx = repairStore.findIndex((r) => r.id === requestId && r.tenantId === tenantId)
  if (idx === -1) return null

  const req = repairStore[idx]
  if (req.status === 'COMPLETED' || req.status === 'CANCELLED') {
    throw new Error(`Cannot cancel repair that is already ${req.status}`)
  }

  const now = new Date().toISOString()
  const updated: RepairRequest = {
    ...req,
    status: 'CANCELLED',
    completedAt: now,
    remark: remark ?? req.remark,
    updatedAt: now,
  }
  repairStore[idx] = updated
  actionLog.push(`[repair] 取消报修 #${req.id}: ${remark ?? ''}`)
  return updated
}

function modRepair_stats(tenantId: string) {
  const all = modRepair_list(tenantId)
  const byStatus: Record<string, number> = {
    PENDING: 0, ACCEPTED: 0, IN_PROGRESS: 0, COMPLETED: 0, CANCELLED: 0,
  }
  for (const r of all) byStatus[r.status]++

  const totalCost = all.filter((r) => r.actualCost)
    .reduce((sum, r) => sum + (r.actualCost ?? 0), 0)
  const completedCount = byStatus.COMPLETED
  const pendingUrgent = all.filter(
    (r) => (r.status === 'PENDING' || r.status === 'ACCEPTED') && r.urgency === 'URGENT',
  ).length

  return {
    total: all.length,
    byStatus,
    totalCost,
    avgCost: completedCount > 0 ? totalCost / completedCount : 0,
    pendingUrgent,
    completionRate: all.length > 0 ? completedCount / all.length : 0,
  }
}

// ═══════════════════════════════════════════════════════════════════════
// E2E 测试场景
// ═══════════════════════════════════════════════════════════════════════

describe('E2E: Facility Repair #64', () => {
  beforeEach(() => {
    resetAll()
    // 初始化设备档案
    modFacility_addDevice({
      tenantId: 'tenant-hq', name: '电脑-5号', deviceNo: 'PC-005',
      category: 'ELECTRONIC', location: 'A区-5号机位', purchaseDate: '2025-06-01',
    })
    modFacility_addDevice({
      tenantId: 'tenant-hq', name: 'VR头显-3号', deviceNo: 'VR-003',
      category: 'ELECTRONIC', location: 'A区-VR体验区', purchaseDate: '2025-03-15',
    })
    modFacility_addDevice({
      tenantId: 'tenant-hq', name: '立式空调-2号', deviceNo: 'AC-002',
      category: 'AC', location: 'C区-比赛区', purchaseDate: '2024-08-01',
    })
    modFacility_addDevice({
      tenantId: 'tenant-branch', name: '跑步机-1号', deviceNo: 'TM-001',
      category: 'MECHANICAL', location: 'B区-健身区', purchaseDate: '2025-01-10',
    })
  })

  afterEach(() => {
    resetAll()
  })

  // ── S1: 报修提交 ──

  it('S1: 员工应能提交报修请求,关联设备状态变为故障', () => {
    const req = modRepair_submit({
      tenantId: 'tenant-hq',
      title: '电脑蓝屏',
      description: '5号电脑频繁蓝屏重启',
      category: 'ELECTRONIC',
      urgency: 'HIGH',
      reporterName: '张三',
      reporterPhone: '13800138000',
      location: 'A区-5号机位',
      deviceName: '电脑-5号',
      deviceId: 'dev-电脑-5号',
    })

    assert.equal(req.status, 'PENDING')
    assert.equal(req.title, '电脑蓝屏')
    assert.equal(req.category, 'ELECTRONIC')
    assert.equal(req.urgency, 'HIGH')
    assert.ok(req.requestNo.startsWith('RR'))
    assert.ok(actionLog.some((l) => l.startsWith('[repair]')))

    // Verify device marked as faulty
    const device = modFacility_getDevice('dev-电脑-5号', 'tenant-hq')
    assert.equal(device?.status, 'faulty')
  })

  // ── S2: 派单给维修工 ──

  it('S2: 维修组长应能派单给维修工(ACCEPTED)', () => {
    const req = modRepair_submit({
      tenantId: 'tenant-hq', title: 'VR头显闪烁', description: '屏幕闪烁',
      category: 'ELECTRONIC', urgency: 'MEDIUM', reporterName: '李华',
      reporterPhone: '13800138001', location: 'VR体验区',
      deviceId: 'dev-VR头显-3号',
    })

    const dispatched = modRepair_dispatch(req.id, 'tenant-hq', '王工', 500)
    assert.ok(dispatched)
    assert.equal(dispatched!.status, 'ACCEPTED')
    assert.equal(dispatched!.assignedTo, '王工')
    assert.equal(dispatched!.estimatedCost, 500)
    assert.ok(actionLog.some((l) => l.includes('派单')))
  })

  // ── S3: 开始维修 ──

  it('S3: 维修工应能开始维修(ACCEPTED→IN_PROGRESS)', () => {
    const req = modRepair_submit({
      tenantId: 'tenant-hq', title: '空调不制冷', description: '空调吹热风',
      category: 'AC', urgency: 'URGENT', reporterName: '刘伟',
      reporterPhone: '13800138005', location: 'C区',
      deviceId: 'dev-立式空调-2号',
    })

    modRepair_dispatch(req.id, 'tenant-hq', '王工')
    const started = modRepair_start(req.id, 'tenant-hq')
    assert.ok(started)
    assert.equal(started!.status, 'IN_PROGRESS')
  })

  // ── S4: 完成维修 ──

  it('S4: 维修工应能完成维修,设备状态恢复正常', () => {
    const req = modRepair_submit({
      tenantId: 'tenant-hq', title: '空调不制冷', description: '吹热风',
      category: 'AC', urgency: 'URGENT', reporterName: '刘伟',
      reporterPhone: '13800138005', location: 'C区',
      deviceId: 'dev-立式空调-2号',
    })

    modRepair_dispatch(req.id, 'tenant-hq', '王工')
    modRepair_start(req.id, 'tenant-hq')
    const completed = modRepair_complete(req.id, 'tenant-hq', {
      result: '更换压缩机启动电容',
      actualCost: 1200,
      remark: '需要备件储备',
    })

    assert.ok(completed)
    assert.equal(completed!.status, 'COMPLETED')
    assert.equal(completed!.result, '更换压缩机启动电容')
    assert.equal(completed!.actualCost, 1200)
    assert.ok(completed!.completedAt)

    // Verify facility device restored
    const device = modFacility_getDevice('dev-立式空调-2号', 'tenant-hq')
    assert.equal(device?.status, 'working')
    assert.equal(device?.repairCount, 1)
    assert.ok(device?.lastRepairDate)
  })

  // ── S5: 取消报修 ──

  it('S5: 报修人应能取消Pending状态的报修', () => {
    const req = modRepair_submit({
      tenantId: 'tenant-hq', title: '灯不亮', description: 'LED灯不亮',
      category: 'ELECTRIC', urgency: 'LOW', reporterName: '赵小琳',
      reporterPhone: '13800138006', location: 'A区-展厅',
    })

    const cancelled = modRepair_cancel(req.id, 'tenant-hq', '自行修复')
    assert.ok(cancelled)
    assert.equal(cancelled!.status, 'CANCELLED')
    assert.equal(cancelled!.remark, '自行修复')
    assert.ok(cancelled!.completedAt)
  })

  // ── S6: 不可重复派单 ──

  it('S6: 已派单的报修不可重复派单', () => {
    const req = modRepair_submit({
      tenantId: 'tenant-hq', title: '鼠标失灵', description: '右键不灵敏',
      category: 'ELECTRONIC', urgency: 'LOW', reporterName: '王明',
      reporterPhone: '13800138002', location: 'B区',
    })

    modRepair_dispatch(req.id, 'tenant-hq', '王工')

    assert.throws(() => {
      modRepair_dispatch(req.id, 'tenant-hq', '李工')
    }, /Cannot dispatch/)
  })

  // ── S7: 不可跳过状态 ──

  it('S7: 不可跳过A状态直接完成维修', () => {
    const req = modRepair_submit({
      tenantId: 'tenant-hq', title: '直接完成', description: '跳过步骤',
      category: 'OTHER', urgency: 'LOW', reporterName: 'Test',
      reporterPhone: '13800138007', location: '某处',
    })

    assert.throws(() => {
      modRepair_complete(req.id, 'tenant-hq', {})
    }, /Cannot complete repair/)
  })

  // ── S8: 已完成报修不可取消 ──

  it('S8: 已完成报修不可取消', () => {
    const req = modRepair_submit({
      tenantId: 'tenant-hq', title: '已完成故障', description: '测试',
      category: 'OTHER', urgency: 'LOW', reporterName: 'X',
      reporterPhone: '13800138008', location: '某处',
    })

    modRepair_dispatch(req.id, 'tenant-hq', '王工')
    modRepair_start(req.id, 'tenant-hq')
    modRepair_complete(req.id, 'tenant-hq', { result: 'OK' })

    assert.throws(() => {
      modRepair_cancel(req.id, 'tenant-hq')
    }, /already COMPLETED/)
  })

  // ── S9: 多租户隔离 ──

  it('S9: 跨租户数据隔离', () => {
    // 总公司
    modRepair_submit({
      tenantId: 'tenant-hq', title: '电脑故障', description: '蓝屏',
      category: 'ELECTRONIC', urgency: 'HIGH', reporterName: '张三',
      reporterPhone: '13800138000', location: 'A区',
      deviceId: 'dev-电脑-5号',
    })
    // 分公司
    modRepair_submit({
      tenantId: 'tenant-branch', title: '跑步机故障', description: '异响',
      category: 'MECHANICAL', urgency: 'MEDIUM', reporterName: '李四',
      reporterPhone: '13800138001', location: 'B区',
      deviceId: 'dev-跑步机-1号',
    })

    const hqList = modRepair_list('tenant-hq')
    const branchList = modRepair_list('tenant-branch')
    assert.equal(hqList.length, 1)
    assert.equal(branchList.length, 1)

    // Verify facility device isolation
    const hqDevice = modFacility_getDevice('dev-电脑-5号', 'tenant-hq')
    const branchDevice = modFacility_getDevice('dev-跑步机-1号', 'tenant-branch')
    assert.equal(hqDevice?.status, 'faulty')
    assert.equal(branchDevice?.status, 'faulty')
  })

  // ── S10: 按状态和分类筛选 ──

  it('S10: 应按状态和分类筛选报修列表', () => {
    modRepair_submit({
      tenantId: 'tenant-hq', title: '电脑问题', description: '故障',
      category: 'ELECTRONIC', urgency: 'MEDIUM', reporterName: 'A',
      reporterPhone: '13800138000', location: 'A区',
    })
    modRepair_submit({
      tenantId: 'tenant-hq', title: '空调问题', description: '制冷',
      category: 'AC', urgency: 'URGENT', reporterName: 'B',
      reporterPhone: '13800138001', location: 'C区',
    })

    const all = modRepair_list('tenant-hq')
    const electronic = modRepair_list('tenant-hq', { category: 'ELECTRONIC' })
    const urgent = modRepair_list('tenant-hq', { urgency: 'URGENT' })
    const pending = modRepair_list('tenant-hq', { status: 'PENDING' })

    assert.equal(all.length, 2)
    assert.equal(electronic.length, 1)
    assert.equal(urgent.length, 1)
    assert.equal(pending.length, 2)
  })

  // ── S11: 统计看板 ──

  it('S11: 统计看板应返回完整数据', () => {
    // 3个报修在不同状态
    const r1 = modRepair_submit({
      tenantId: 'tenant-hq', title: '待处理', description: 'D1',
      category: 'ELECTRONIC', urgency: 'URGENT', reporterName: 'A',
      reporterPhone: '13800138000', location: 'A区',
    })
    const r2 = modRepair_submit({
      tenantId: 'tenant-hq', title: '进行中', description: 'D2',
      category: 'MECHANICAL', urgency: 'MEDIUM', reporterName: 'B',
      reporterPhone: '13800138001', location: 'B区',
    })
    const r3 = modRepair_submit({
      tenantId: 'tenant-hq', title: '已完成', description: 'D3',
      category: 'AC', urgency: 'HIGH', reporterName: 'C',
      reporterPhone: '13800138002', location: 'C区',
    })

    // 派单+维修+完成 r3
    modRepair_dispatch(r3.id, 'tenant-hq', '王工')
    modRepair_start(r3.id, 'tenant-hq')
    modRepair_complete(r3.id, 'tenant-hq', { actualCost: 800 })

    // 派单+开始 r2
    modRepair_dispatch(r2.id, 'tenant-hq', '李工')
    modRepair_start(r2.id, 'tenant-hq')

    const stats = modRepair_stats('tenant-hq')
    assert.equal(stats.total, 3)
    assert.equal(stats.byStatus.PENDING, 1)
    assert.equal(stats.byStatus.IN_PROGRESS, 1)
    assert.equal(stats.byStatus.COMPLETED, 1)
    assert.equal(stats.totalCost, 800)
    assert.equal(stats.avgCost, 800)
    assert.equal(stats.pendingUrgent, 1)
    assert.equal(stats.completionRate, 1 / 3)
  })

  // ── S12: 满状态流转 ──

  it('S12: 完整状态流转: Pending→Accepted→InProgress→Completed', () => {
    const req = modRepair_submit({
      tenantId: 'tenant-hq', title: '完整流程', description: '测试全流程',
      category: 'ELECTRIC', urgency: 'HIGH', reporterName: 'Z',
      reporterPhone: '13800138009', location: '某处',
    })

    assert.equal(req.status, 'PENDING')

    const dispatched = modRepair_dispatch(req.id, 'tenant-hq', '赵工', 300)
    assert.equal(dispatched!.status, 'ACCEPTED')

    const started = modRepair_start(req.id, 'tenant-hq')
    assert.equal(started!.status, 'IN_PROGRESS')

    const completed = modRepair_complete(req.id, 'tenant-hq', {
      result: '维修完成',
      actualCost: 280,
    })
    assert.equal(completed!.status, 'COMPLETED')
    assert.equal(completed!.actualCost, 280)

    // Verify action log has full chain
    const repairActions = actionLog.filter((l) => l.startsWith('[repair]'))
    assert.equal(repairActions.length, 4)
    assert.ok(repairActions.some((l) => l.includes('提交报修')))
    assert.ok(repairActions.some((l) => l.includes('派单')))
    assert.ok(repairActions.some((l) => l.includes('开始维修')))
    assert.ok(repairActions.some((l) => l.includes('完成维修')))
  })

  // ── S13: 不存在的报修ID ──

  it('S13: 操作不存在的报修应返回null', () => {
    assert.equal(modRepair_get('repair-nonexistent', 'tenant-hq'), undefined)
    assert.equal(modRepair_dispatch('repair-nonexistent', 'tenant-hq', '王工'), null)
    assert.equal(modRepair_start('repair-nonexistent', 'tenant-hq'), null)
    assert.equal(modRepair_complete('repair-nonexistent', 'tenant-hq', {}), null)
    assert.equal(modRepair_cancel('repair-nonexistent', 'tenant-hq'), null)
  })
})
