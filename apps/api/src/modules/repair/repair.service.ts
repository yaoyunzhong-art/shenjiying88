import { randomUUID } from 'node:crypto'
import { Injectable } from '@nestjs/common'
import {
  RepairStatus,
  RepairCategory,
  UrgencyLevel,
  type RepairRequest,
} from './repair.entity'

// ── In-memory store ──

const repairStore = new Map<string, RepairRequest>()

function generateRequestNo(): string {
  const prefix = 'RR'
  const date = new Date().toISOString().slice(2, 10).replace(/-/g, '')
  const seq = String(Math.floor(Math.random() * 9000) + 1000)
  return `${prefix}${date}${seq}`
}

@Injectable()
export class RepairService {
  // ═══════════════════════════════════════════════════════════════════
  // CRUD
  // ═══════════════════════════════════════════════════════════════════

  createRequest(input: {
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
    const req: RepairRequest = {
      id: `repair-${randomUUID()}`,
      requestNo: generateRequestNo(),
      title: input.title,
      description: input.description,
      category: input.category,
      urgency: input.urgency,
      status: RepairStatus.Pending,
      reporterName: input.reporterName,
      reporterPhone: input.reporterPhone,
      location: input.location,
      deviceName: input.deviceName,
      deviceId: input.deviceId,
      remark: input.remark,
      tenantId: input.tenantId,
      createdAt: now,
      updatedAt: now,
    }
    repairStore.set(req.id, req)
    return req
  }

  getRequest(requestId: string, tenantId: string): RepairRequest | undefined {
    const r = repairStore.get(requestId)
    if (!r || r.tenantId !== tenantId) return undefined
    return r
  }

  listRequests(
    tenantId: string,
    filters?: {
      status?: RepairStatus
      category?: RepairCategory
      urgency?: UrgencyLevel
      reporterName?: string
      assignedTo?: string
      location?: string
      deviceName?: string
    },
  ): RepairRequest[] {
    const all = Array.from(repairStore.values())
    return all.filter((r) => {
      if (r.tenantId !== tenantId) return false
      if (filters?.status && r.status !== filters.status) return false
      if (filters?.category && r.category !== filters.category) return false
      if (filters?.urgency && r.urgency !== filters.urgency) return false
      if (filters?.reporterName && !r.reporterName.includes(filters.reporterName)) return false
      if (filters?.assignedTo && !(r.assignedTo?.includes(filters.assignedTo) ?? false)) return false
      if (filters?.location && !r.location.includes(filters.location)) return false
      if (filters?.deviceName && !(r.deviceName?.includes(filters.deviceName) ?? false)) return false
      return true
    })
  }

  updateRequest(
    requestId: string,
    tenantId: string,
    input: {
      title?: string
      description?: string
      category?: RepairCategory
      urgency?: UrgencyLevel
      location?: string
      deviceName?: string
      deviceId?: string
      remark?: string
    },
  ): RepairRequest {
    const r = this.getRequest(requestId, tenantId)
    if (!r) {
      throw new Error(`Repair request not found: ${requestId}`)
    }
    const updated: RepairRequest = {
      ...r,
      title: input.title ?? r.title,
      description: input.description ?? r.description,
      category: input.category ?? r.category,
      urgency: input.urgency ?? r.urgency,
      location: input.location ?? r.location,
      deviceName: input.deviceName !== undefined ? input.deviceName : r.deviceName,
      deviceId: input.deviceId !== undefined ? input.deviceId : r.deviceId,
      remark: input.remark !== undefined ? input.remark : r.remark,
      updatedAt: new Date().toISOString(),
    }
    repairStore.set(requestId, updated)
    return updated
  }

  // ═══════════════════════════════════════════════════════════════════
  // Dispatch — assign maintainer and accept the request
  // ═══════════════════════════════════════════════════════════════════

  dispatchRepair(
    requestId: string,
    tenantId: string,
    input: {
      status: RepairStatus
      assignedTo: string
      estimatedCost?: number
    },
  ): RepairRequest {
    const r = this.getRequest(requestId, tenantId)
    if (!r) {
      throw new Error(`Repair request not found: ${requestId}`)
    }
    if (r.status !== RepairStatus.Pending) {
      throw new Error(
        `Cannot dispatch repair that is already in status ${r.status}`,
      )
    }
    const updated: RepairRequest = {
      ...r,
      status: input.status,
      assignedTo: input.assignedTo,
      estimatedCost: input.estimatedCost ?? r.estimatedCost,
      updatedAt: new Date().toISOString(),
    }
    repairStore.set(requestId, updated)
    return updated
  }

  // ═══════════════════════════════════════════════════════════════════
  // Start Repair — begin working on the repair
  // ═══════════════════════════════════════════════════════════════════

  startRepair(requestId: string, tenantId: string): RepairRequest {
    const r = this.getRequest(requestId, tenantId)
    if (!r) {
      throw new Error(`Repair request not found: ${requestId}`)
    }
    if (r.status !== RepairStatus.Accepted) {
      throw new Error(
        `Cannot start repair that is in status ${r.status}, expected ACCEPTED`,
      )
    }
    const updated: RepairRequest = {
      ...r,
      status: RepairStatus.InProgress,
      updatedAt: new Date().toISOString(),
    }
    repairStore.set(requestId, updated)
    return updated
  }

  // ═══════════════════════════════════════════════════════════════════
  // Complete Repair
  // ═══════════════════════════════════════════════════════════════════

  completeRepair(
    requestId: string,
    tenantId: string,
    input: {
      status: RepairStatus
      result?: string
      actualCost?: number
      remark?: string
    },
  ): RepairRequest {
    const r = this.getRequest(requestId, tenantId)
    if (!r) {
      throw new Error(`Repair request not found: ${requestId}`)
    }
    if (r.status !== RepairStatus.InProgress) {
      throw new Error(
        `Cannot complete repair that is in status ${r.status}, expected IN_PROGRESS`,
      )
    }
    const now = new Date().toISOString()
    const updated: RepairRequest = {
      ...r,
      status: input.status,
      completedAt: now,
      result: input.result ?? r.result,
      actualCost: input.actualCost ?? r.actualCost,
      remark: input.remark !== undefined ? input.remark : r.remark,
      updatedAt: now,
    }
    repairStore.set(requestId, updated)
    return updated
  }

  // ═══════════════════════════════════════════════════════════════════
  // Cancel Repair
  // ═══════════════════════════════════════════════════════════════════

  cancelRepair(
    requestId: string,
    tenantId: string,
    remark?: string,
  ): RepairRequest {
    const r = this.getRequest(requestId, tenantId)
    if (!r) {
      throw new Error(`Repair request not found: ${requestId}`)
    }
    if (r.status === RepairStatus.Completed || r.status === RepairStatus.Cancelled) {
      throw new Error(
        `Cannot cancel repair that is already ${r.status}`,
      )
    }
    const now = new Date().toISOString()
    const updated: RepairRequest = {
      ...r,
      status: RepairStatus.Cancelled,
      completedAt: now,
      remark: remark ?? r.remark,
      updatedAt: now,
    }
    repairStore.set(requestId, updated)
    return updated
  }

  // ═══════════════════════════════════════════════════════════════════
  // Statistics
  // ═══════════════════════════════════════════════════════════════════

  getStats(tenantId: string, fromDate?: string, toDate?: string) {
    const all = Array.from(repairStore.values()).filter((r) => {
      if (r.tenantId !== tenantId) return false
      if (fromDate && r.createdAt < fromDate) return false
      if (toDate && r.createdAt > toDate) return false
      return true
    })

    const byStatus: Record<string, number> = {
      PENDING: 0,
      ACCEPTED: 0,
      IN_PROGRESS: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    }
    for (const r of all) byStatus[r.status]++

    const byCategory: Record<string, number> = {}
    for (const r of all) {
      byCategory[r.category] = (byCategory[r.category] || 0) + 1
    }

    const byUrgency: Record<string, number> = {}
    for (const r of all) {
      byUrgency[r.urgency] = (byUrgency[r.urgency] || 0) + 1
    }

    const totalCost = all
      .filter((r) => r.actualCost)
      .reduce((sum, r) => sum + (r.actualCost ?? 0), 0)

    const completedRepairs = all.filter(
      (r) => r.status === RepairStatus.Completed,
    )
    const avgCost =
      completedRepairs.length > 0
        ? totalCost / completedRepairs.length
        : 0

    const pendingUrgent = all.filter(
      (r) =>
        (r.status === RepairStatus.Pending ||
          r.status === RepairStatus.Accepted) &&
        r.urgency === UrgencyLevel.Urgent,
    ).length

    return {
      total: all.length,
      byStatus,
      byCategory,
      byUrgency,
      totalCost,
      avgCost,
      pendingUrgent,
      completionRate: all.length > 0
        ? completedRepairs.length / all.length
        : 0,
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // Mock Data
  // ═══════════════════════════════════════════════════════════════════

  seedMockData(tenantId: string): void {
    const now = new Date()
    const mockList: Array<{
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
      result?: string
      remark?: string
    }> = [
      {
        title: '3号VR头显屏幕闪烁',
        description: 'VR头显-3号设备屏幕出现不规则闪烁，影响玩家体验',
        category: RepairCategory.Electronic,
        urgency: UrgencyLevel.High,
        status: RepairStatus.Pending,
        reporterName: '李华',
        reporterPhone: '13800138001',
        location: 'A区-VR体验区',
        deviceName: 'VR头显-3号',
        deviceId: 'VR-003',
        remark: '设备运行时发热严重',
      },
      {
        title: '1号跑步机传送带异响',
        description: '跑步机运行时有"嘎吱"声，传送带有轻微偏移',
        category: RepairCategory.Mechanical,
        urgency: UrgencyLevel.Medium,
        status: RepairStatus.Accepted,
        reporterName: '王明',
        reporterPhone: '13800138002',
        location: 'B区-健身区',
        deviceName: '跑步机-1号',
        deviceId: 'TM-001',
        assignedTo: '陈工',
        estimatedCost: 500,
      },
      {
        title: '前台接待椅椅面破损',
        description: '前台接待区域电竞椅椅面皮革大面积开裂脱落',
        category: RepairCategory.Furniture,
        urgency: UrgencyLevel.Medium,
        status: RepairStatus.InProgress,
        reporterName: '张丽',
        reporterPhone: '13800138003',
        location: '前台接待区',
        deviceName: '电竞椅-前台',
        deviceId: 'CHAIR-001',
        assignedTo: '赵工',
        estimatedCost: 300,
      },
      {
        title: '卫生间洗手台漏水',
        description: '男卫生间第三个洗手台下方水管漏水，地面有积水',
        category: RepairCategory.Plumbing,
        urgency: UrgencyLevel.Urgent,
        status: RepairStatus.InProgress,
        reporterName: '保洁阿姨',
        reporterPhone: '13800138004',
        location: 'A区-男卫生间',
        assignedTo: '李工',
        estimatedCost: 200,
      },
      {
        title: '空调-2号不制冷',
        description: '2号立式空调开启后只吹风不制冷，出风温度与室温相同',
        category: RepairCategory.Ac,
        urgency: UrgencyLevel.Urgent,
        status: RepairStatus.Completed,
        reporterName: '刘伟',
        reporterPhone: '13800138005',
        location: 'C区-电竞比赛区',
        deviceName: '立式空调-2号',
        deviceId: 'AC-002',
        assignedTo: '王工',
        estimatedCost: 800,
        actualCost: 1200,
        result: '压缩机启动电容烧毁，已更换。补充制冷剂。制冷恢复正常。',
        remark: '建议储备备用电容',
      },
      {
        title: '展示柜灯光不亮',
        description: '奖杯展示柜内部LED灯带不亮，影响展示效果',
        category: RepairCategory.Electric,
        urgency: UrgencyLevel.Low,
        status: RepairStatus.Completed,
        reporterName: '赵小琳',
        reporterPhone: '13800138006',
        location: 'A区-展厅',
        assignedTo: '陈工',
        actualCost: 80,
        result: 'LED驱动电源损坏，更换后恢复正常',
      },
      {
        title: '收银台POS机死机',
        description: '前台收银POS机每隔2小时自动重启，影响收银效率',
        category: RepairCategory.Electronic,
        urgency: UrgencyLevel.High,
        status: RepairStatus.Completed,
        reporterName: '周慧',
        reporterPhone: '13800138007',
        location: '前台收银台',
        deviceName: 'POS机-1号',
        deviceId: 'POS-001',
        assignedTo: '王工',
        actualCost: 0,
        result: '系统缓存过多，清理缓存并更新驱动后正常',
        remark: '建议定期清理缓存',
      },
      {
        title: '逃生指示灯失灵',
        description: 'C区后门上方应急逃生指示灯不亮',
        category: RepairCategory.Electric,
        urgency: UrgencyLevel.High,
        status: RepairStatus.Pending,
        reporterName: '安全员',
        reporterPhone: '13800138008',
        location: 'C区-后门',
        remark: '安全巡检发现问题',
      },
      {
        title: '模拟赛车方向盘松脱',
        description: '模拟赛车设备-2号的方向盘固定螺丝松动，转动时有虚位',
        category: RepairCategory.Mechanical,
        urgency: UrgencyLevel.Medium,
        status: RepairStatus.Pending,
        reporterName: '张涛',
        reporterPhone: '13800138009',
        location: 'B区-模拟赛车区',
        deviceName: '模拟赛车-2号',
        deviceId: 'SIM-RACE-002',
      },
      {
        title: '音响设备杂音',
        description: '比赛区主音箱播放时出现"嘶嘶"杂音，音质严重下降',
        category: RepairCategory.Electronic,
        urgency: UrgencyLevel.Medium,
        status: RepairStatus.Accepted,
        reporterName: '王啸',
        reporterPhone: '13800138010',
        location: 'C区-比赛区',
        deviceName: '主音箱',
        deviceId: 'SPK-MAIN',
        assignedTo: '赵工',
        estimatedCost: 2000,
      },
      {
        title: 'KTV包间麦克风无声',
        description: '3号KTV包间无线麦克风无声音输出，已更换电池无效',
        category: RepairCategory.Electronic,
        urgency: UrgencyLevel.Medium,
        status: RepairStatus.Pending,
        reporterName: '陈浩',
        reporterPhone: '13800138011',
        location: 'D区-KTV-3号包间',
        deviceName: '无线麦克风',
        deviceId: 'MIC-003',
        remark: '需要紧急处理，今晚有预定',
      },
      {
        title: '幕布升降故障',
        description: '投影幕布升起到一半卡住，无法继续上升或下降',
        category: RepairCategory.Mechanical,
        urgency: UrgencyLevel.High,
        status: RepairStatus.Completed,
        reporterName: '吴经理',
        reporterPhone: '13800138012',
        location: 'C区-会议室',
        deviceName: '投影幕布',
        deviceId: 'SCR-001',
        assignedTo: '李工',
        estimatedCost: 600,
        actualCost: 450,
        result: '幕布齿轮卡住，清理异物并润滑后恢复正常',
      },
      {
        title: '吧台制冰机故障',
        description: '制冰机停止制冰，显示"E3"错误代码',
        category: RepairCategory.Mechanical,
        urgency: UrgencyLevel.Urgent,
        status: RepairStatus.InProgress,
        reporterName: '调酒师',
        reporterPhone: '13800138013',
        location: '吧台区',
        deviceName: '制冰机',
        deviceId: 'ICE-001',
        assignedTo: '张工',
        estimatedCost: 1500,
      },
      {
        title: '桌面电竞插座烧坏',
        description: '6号桌的嵌入式电源插座有烧焦味，已停止使用',
        category: RepairCategory.Electric,
        urgency: UrgencyLevel.Urgent,
        status: RepairStatus.Pending,
        reporterName: '保洁阿姨',
        reporterPhone: '13800138014',
        location: 'A区-6号桌',
        deviceName: '嵌入式插座',
        deviceId: 'OUTLET-006',
        remark: '建议立即断电检查',
      },
      {
        title: '门禁刷卡器故障',
        description: 'VIP包间区域门禁刷卡器读卡灵敏度下降，多次刷卡才能开门',
        category: RepairCategory.Electronic,
        urgency: UrgencyLevel.Medium,
        status: RepairStatus.Pending,
        reporterName: '安保部',
        reporterPhone: '13800138015',
        location: 'VIP包间通道',
        deviceName: '门禁刷卡器',
        deviceId: 'ACS-VIP',
      },
    ]

    for (const m of mockList) {
      this.createRequest({
        tenantId,
        title: m.title,
        description: m.description,
        category: m.category,
        urgency: m.urgency,
        reporterName: m.reporterName,
        reporterPhone: m.reporterPhone,
        location: m.location,
        deviceName: m.deviceName,
        deviceId: m.deviceId,
        remark: m.remark,
      })

      const reqId = Array.from(repairStore.values()).find(
        (r) => r.title === m.title && r.tenantId === tenantId,
      )!.id

      const req = repairStore.get(reqId)!
      req.status = m.status
      req.assignedTo = m.assignedTo
      req.estimatedCost = m.estimatedCost
      req.actualCost = m.actualCost
      req.result = m.result
      req.remark = m.remark ?? req.remark
      if (m.status === RepairStatus.Completed) {
        req.completedAt = req.createdAt // use creation time for mock
      }
      repairStore.set(reqId, req)
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // Test Helpers
  // ═══════════════════════════════════════════════════════════════════

  resetRepairStoresForTests(): void {
    repairStore.clear()
  }
}
