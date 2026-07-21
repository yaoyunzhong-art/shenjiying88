import { randomUUID } from 'node:crypto'
import { Injectable } from '@nestjs/common'
import type { RequestTenantContext } from '../tenant/tenant.types'
import { FaultSeverity, FaultStatus, type EquipmentFaultReport } from './equipment-fault-report.entity'
import type { FaultQueryDto, CreateFaultReportDto, UpdateFaultReportDto } from './equipment-fault-report.dto'

const faultStore = new Map<string, EquipmentFaultReport>()

export function resetEquipmentFaultReportTestState() {
  faultStore.clear()
}

function seedMockData() {
  if (faultStore.size > 0) return

  const now = new Date().toISOString()
  const tenantId = 'default'

  const dateSub = (hours: number) => new Date(Date.now() - hours * 3600_000).toISOString()
  const mockFaults: EquipmentFaultReport[] = [
    // --- minor (3 条) ---
    {
      id: 'fault-minor-1', tenantId, equipmentId: 'eq-001', equipmentName: '收银机 A01',
      equipmentType: '收银设备', faultDescription: '收据打印模糊，字迹看不清',
      severity: FaultSeverity.Minor, status: FaultStatus.Pending,
      reporterName: '张明', occurredAt: dateSub(2), createdAt: dateSub(2), updatedAt: dateSub(2),
    },
    {
      id: 'fault-minor-2', tenantId, equipmentId: 'eq-002', equipmentName: '扫码枪 B03',
      equipmentType: '扫码设备', faultDescription: '扫码灵敏度略有下降',
      severity: FaultSeverity.Minor, status: FaultStatus.InProgress,
      reporterName: '李华', assignee: '王工', occurredAt: dateSub(5),
      createdAt: dateSub(5), updatedAt: dateSub(1),
    },
    {
      id: 'fault-minor-3', tenantId, equipmentId: 'eq-003', equipmentName: '电子秤 C02',
      equipmentType: '称重设备', faultDescription: '偶尔显示误差0.01kg',
      severity: FaultSeverity.Minor, status: FaultStatus.Resolved,
      reporterName: '赵四', assignee: '刘技师', resolution: '重新校准后恢复正常',
      occurredAt: dateSub(24), resolvedAt: dateSub(2),
      createdAt: dateSub(24), updatedAt: dateSub(2),
    },
    // --- major (3 条) ---
    {
      id: 'fault-major-1', tenantId, equipmentId: 'eq-004', equipmentName: '冷柜 D01',
      equipmentType: '制冷设备', faultDescription: '冷柜温度不稳定，波动范围超过5°C',
      severity: FaultSeverity.Major, status: FaultStatus.Pending,
      reporterName: '钱六', occurredAt: dateSub(1), createdAt: dateSub(1), updatedAt: dateSub(1),
    },
    {
      id: 'fault-major-2', tenantId, equipmentId: 'eq-005', equipmentName: '空调主机 E01',
      equipmentType: '空调设备', faultDescription: '空调制冷效果差，出风口温度偏高',
      severity: FaultSeverity.Major, status: FaultStatus.InProgress,
      reporterName: '孙七', assignee: '陈工', occurredAt: dateSub(8),
      createdAt: dateSub(8), updatedAt: dateSub(3),
    },
    {
      id: 'fault-major-3', tenantId, equipmentId: 'eq-006', equipmentName: '货架 F01-03',
      equipmentType: '货架设备', faultDescription: '第三层横梁轻微变形',
      severity: FaultSeverity.Major, status: FaultStatus.Resolved,
      reporterName: '周八', assignee: '吴师傅', resolution: '更换横梁，加固处理',
      occurredAt: dateSub(48), resolvedAt: dateSub(12),
      createdAt: dateSub(48), updatedAt: dateSub(12),
    },
    // --- critical (2 条) ---
    {
      id: 'fault-crit-1', tenantId, equipmentId: 'eq-007', equipmentName: '配电柜 G01',
      equipmentType: '电力设备', faultDescription: '配电柜异常发热，有焦糊味',
      severity: FaultSeverity.Critical, status: FaultStatus.InProgress,
      reporterName: '吴九', assignee: '紧急抢修组',
      occurredAt: dateSub(1), createdAt: dateSub(1), updatedAt: dateSub(1),
    },
    {
      id: 'fault-crit-2', tenantId, equipmentId: 'eq-008', equipmentName: '升降机 H01',
      equipmentType: '升降设备', faultDescription: '升降机运行异响，急停按钮触发',
      severity: FaultSeverity.Critical, status: FaultStatus.Pending,
      reporterName: '郑十', occurredAt: dateSub(3), createdAt: dateSub(3), updatedAt: dateSub(3),
    },
  ]

  for (const fault of mockFaults) {
    faultStore.set(fault.id, fault)
  }
}

@Injectable()
export class EquipmentFaultReportService {
  constructor() {
    seedMockData()
  }

  list(
    tenantContext: RequestTenantContext,
    query?: FaultQueryDto,
  ): { items: EquipmentFaultReport[]; total: number; offset: number; limit: number } {
    const limit = query?.limit && query.limit > 0 ? query.limit : 20
    const offset = query?.offset && query.offset > 0 ? query.offset : 0

    let faults = Array.from(faultStore.values())
      .filter((f) => f.tenantId === tenantContext.tenantId)

    if (query?.severity) {
      faults = faults.filter((f) => f.severity === query.severity)
    }
    if (query?.status) {
      faults = faults.filter((f) => f.status === query.status)
    }
    if (query?.equipmentType) {
      faults = faults.filter((f) => f.equipmentType === query.equipmentType)
    }
    if (query?.keyword) {
      const kw = query.keyword.toLowerCase()
      faults = faults.filter(
        (f) =>
          f.equipmentName.toLowerCase().includes(kw) ||
          f.faultDescription.toLowerCase().includes(kw) ||
          f.reporterName.toLowerCase().includes(kw),
      )
    }

    faults.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
    const total = faults.length
    const items = faults.slice(offset, offset + limit)

    return { items, total, offset, limit }
  }

  getById(id: string, tenantContext: RequestTenantContext): EquipmentFaultReport {
    const fault = faultStore.get(id)
    if (!fault || fault.tenantId !== tenantContext.tenantId) {
      throw new Error(`Equipment fault report ${id} not found`)
    }
    return fault
  }

  getSummary(tenantContext: RequestTenantContext) {
    const faults = Array.from(faultStore.values())
      .filter((f) => f.tenantId === tenantContext.tenantId)

    const byEquipmentType: Record<string, number> = {}
    for (const f of faults) {
      byEquipmentType[f.equipmentType] = (byEquipmentType[f.equipmentType] || 0) + 1
    }

    return {
      total: faults.length,
      pending: faults.filter((f) => f.status === FaultStatus.Pending).length,
      inProgress: faults.filter((f) => f.status === FaultStatus.InProgress).length,
      resolved: faults.filter((f) => f.status === FaultStatus.Resolved).length,
      minorCount: faults.filter((f) => f.severity === FaultSeverity.Minor).length,
      majorCount: faults.filter((f) => f.severity === FaultSeverity.Major).length,
      criticalCount: faults.filter((f) => f.severity === FaultSeverity.Critical).length,
      byEquipmentType,
    }
  }

  create(tenantContext: RequestTenantContext, input: CreateFaultReportDto): EquipmentFaultReport {
    const now = new Date().toISOString()
    const fault: EquipmentFaultReport = {
      id: `fault-${randomUUID()}`,
      tenantId: tenantContext.tenantId,
      equipmentId: input.equipmentId,
      equipmentName: input.equipmentName,
      equipmentType: input.equipmentType,
      faultDescription: input.faultDescription,
      severity: input.severity,
      status: FaultStatus.Pending,
      reporterName: input.reporterName,
      occurredAt: input.occurredAt,
      createdAt: now,
      updatedAt: now,
    }
    faultStore.set(fault.id, fault)
    return fault
  }

  update(
    id: string,
    tenantContext: RequestTenantContext,
    updates: UpdateFaultReportDto,
  ): EquipmentFaultReport {
    const fault = this.getById(id, tenantContext)

    if (updates.status !== undefined) {
      fault.status = updates.status
      if (updates.status === FaultStatus.Resolved) {
        fault.resolvedAt = new Date().toISOString()
      }
    }
    if (updates.assignee !== undefined) {
      fault.assignee = updates.assignee
    }
    if (updates.resolution !== undefined) {
      fault.resolution = updates.resolution
    }

    fault.updatedAt = new Date().toISOString()
    faultStore.set(fault.id, fault)
    return fault
  }

  delete(id: string, tenantContext: RequestTenantContext): void {
    const fault = faultStore.get(id)
    if (!fault || fault.tenantId !== tenantContext.tenantId) {
      throw new Error(`Equipment fault report ${id} not found`)
    }
    faultStore.delete(id)
  }
}
