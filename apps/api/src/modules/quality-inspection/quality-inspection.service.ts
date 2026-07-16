import { randomUUID } from 'node:crypto'
import { Injectable } from '@nestjs/common'
import {
  InspectionType,
  InspectionResult,
  Severity,
  type Defect,
  type InspectionRecord,
} from './quality-inspection.entity'

// ── In-memory store ──

const inspectionStore = new Map<string, InspectionRecord>()

// ── Mock data seeded on first use ──

let seeded = false

function seedMockInspections(): void {
  if (seeded) return
  seeded = true

  const tenant = 'tenant-001'

  interface MockInspectionData {
    inspectNo: string; type: InspectionType; itemName: string; itemBatch: string
    result: InspectionResult; severity: Severity
    defects: Array<{ code: string; description: string; severity: Severity }>
    inspector: string; inspectedAt: Date; notes?: string
  }

  const mockInspections: MockInspectionData[] = [
    { inspectNo: 'IQC-2026-0001', type: InspectionType.Incoming, itemName: '电阻器套装', itemBatch: 'BATCH-R-0725', result: InspectionResult.Pass, severity: Severity.Minor, defects: [{ code: 'DIM-001', description: '尺寸偏差在允许范围内', severity: Severity.Minor }], inspector: '王工', inspectedAt: new Date('2026-07-01') },
    { inspectNo: 'IQC-2026-0002', type: InspectionType.Incoming, itemName: 'ABS塑料颗粒', itemBatch: 'BATCH-ABS-0726', result: InspectionResult.Fail, severity: Severity.Critical, defects: [{ code: 'COL-001', description: '颜色偏差超标', severity: Severity.Major }, { code: 'IMP-001', description: '杂质含量超出标准', severity: Severity.Critical }], inspector: '李工', inspectedAt: new Date('2026-07-02'), notes: '整批退回供应商' },
    { inspectNo: 'IQC-2026-0003', type: InspectionType.Incoming, itemName: '精密轴承', itemBatch: 'BATCH-BRG-0727', result: InspectionResult.Conditional, severity: Severity.Major, defects: [{ code: 'RGH-001', description: '表面光洁度不达标', severity: Severity.Major }], inspector: '张工', inspectedAt: new Date('2026-07-03'), notes: '降级使用，特采处理' },
    { inspectNo: 'OQC-2026-0001', type: InspectionType.Outgoing, itemName: '无线蓝牙耳机', itemBatch: 'BATCH-BT-0728', result: InspectionResult.Pass, severity: Severity.Observation, defects: [{ code: 'PKG-001', description: '包装标签轻微偏移', severity: Severity.Observation }], inspector: '赵工', inspectedAt: new Date('2026-07-04') },
    { inspectNo: 'OQC-2026-0002', type: InspectionType.Outgoing, itemName: '智能手环', itemBatch: 'BATCH-BAND-0729', result: InspectionResult.Fail, severity: Severity.Critical, defects: [{ code: 'FUN-001', description: '心率监测功能失效', severity: Severity.Critical }, { code: 'BAT-001', description: '电池续航不足标称值50%', severity: Severity.Critical }], inspector: '刘工', inspectedAt: new Date('2026-07-05'), notes: '全部返工处理' },
    { inspectNo: 'IPQC-2026-0001', type: InspectionType.InProcess, itemName: 'PCB板焊接', itemBatch: 'BATCH-PCB-0730', result: InspectionResult.Pass, severity: Severity.Minor, defects: [{ code: 'SLD-001', description: '个别焊点偏大', severity: Severity.Minor }], inspector: '陈工', inspectedAt: new Date('2026-07-06') },
    { inspectNo: 'IPQC-2026-0002', type: InspectionType.InProcess, itemName: '注塑件', itemBatch: 'BATCH-MLD-0731', result: InspectionResult.Conditional, severity: Severity.Major, defects: [{ code: 'FLS-001', description: '飞边毛刺需修整', severity: Severity.Major }], inspector: '孙工', inspectedAt: new Date('2026-07-07'), notes: '修整后复检' },
    { inspectNo: 'FQC-2026-0001', type: InspectionType.Final, itemName: '电动叉车', itemBatch: 'BATCH-FORK-0732', result: InspectionResult.Pass, severity: Severity.Minor, defects: [{ code: 'PAI-001', description: '油漆表面有小气泡', severity: Severity.Minor }], inspector: '周工', inspectedAt: new Date('2026-07-08') },
    { inspectNo: 'FQC-2026-0002', type: InspectionType.Final, itemName: '空调扇', itemBatch: 'BATCH-FAN-0733', result: InspectionResult.Fail, severity: Severity.Critical, defects: [{ code: 'NOI-001', description: '运行噪音超标20dB', severity: Severity.Major }, { code: 'VIB-001', description: '机身振动幅度过大', severity: Severity.Critical }], inspector: '吴工', inspectedAt: new Date('2026-07-09'), notes: '不合格，退回生产线调整' },
    { inspectNo: 'IQC-2026-0004', type: InspectionType.Incoming, itemName: '不锈钢螺丝M6', itemBatch: 'BATCH-SCR-0734', result: InspectionResult.Pass, severity: Severity.Observation, defects: [], inspector: '郑工', inspectedAt: new Date('2026-07-10') },
    { inspectNo: 'IQC-2026-0005', type: InspectionType.Incoming, itemName: '瓦楞纸箱', itemBatch: 'BATCH-BOX-0735', result: InspectionResult.Pass, severity: Severity.Minor, defects: [{ code: 'STR-001', description: '纸箱抗压强度略低', severity: Severity.Minor }], inspector: '黄工', inspectedAt: new Date('2026-07-11') },
    { inspectNo: 'OQC-2026-0003', type: InspectionType.Outgoing, itemName: '冻虾仁', itemBatch: 'BATCH-SHR-0736', result: InspectionResult.Pass, severity: Severity.Observation, defects: [], inspector: '林工', inspectedAt: new Date('2026-07-12') },
    { inspectNo: 'IPQC-2026-0003', type: InspectionType.InProcess, itemName: '电子产品组装', itemBatch: 'BATCH-ASM-0737', result: InspectionResult.Pass, severity: Severity.Minor, defects: [{ code: 'TOL-001', description: '组装间隙略大', severity: Severity.Minor }], inspector: '马工', inspectedAt: new Date('2026-07-13') },
    { inspectNo: 'FQC-2026-0003', type: InspectionType.Final, itemName: 'LED显示屏', itemBatch: 'BATCH-LED-0738', result: InspectionResult.Conditional, severity: Severity.Major, defects: [{ code: 'BRI-001', description: '亮度均匀性未达标', severity: Severity.Major }], inspector: '朱工', inspectedAt: new Date('2026-07-14'), notes: '需调整参数后复检' },
    { inspectNo: 'IQC-2026-0006', type: InspectionType.Incoming, itemName: '冷冻三文鱼', itemBatch: 'BATCH-SAL-0739', result: InspectionResult.Fail, severity: Severity.Critical, defects: [{ code: 'TEM-001', description: '中心温度超标', severity: Severity.Critical }, { code: 'FRM-001', description: '解冻后重量与标称不符', severity: Severity.Major }], inspector: '曹工', inspectedAt: new Date('2026-07-14'), notes: '整批拒收' },
    { inspectNo: 'IQC-2026-0007', type: InspectionType.Incoming, itemName: '浓缩果汁', itemBatch: 'BATCH-JUIC-0740', result: InspectionResult.Pass, severity: Severity.Minor, defects: [{ code: 'LAB-001', description: '标签成分表格式不符', severity: Severity.Minor }], inspector: '沈工', inspectedAt: new Date('2026-07-15') },
    { inspectNo: 'OQC-2026-0004', type: InspectionType.Outgoing, itemName: '保温杯', itemBatch: 'BATCH-CUP-0741', result: InspectionResult.Pass, severity: Severity.Observation, defects: [], inspector: '杨工', inspectedAt: new Date('2026-07-15') },
    { inspectNo: 'IPQC-2026-0004', type: InspectionType.InProcess, itemName: '纺织品染色', itemBatch: 'BATCH-DYE-0742', result: InspectionResult.Fail, severity: Severity.Major, defects: [{ code: 'CLR-001', description: '色差超过4级', severity: Severity.Major }], inspector: '高峰', inspectedAt: new Date('2026-07-15'), notes: '重新染色处理' },
    { inspectNo: 'FQC-2026-0004', type: InspectionType.Final, itemName: '不锈钢锅具', itemBatch: 'BATCH-POT-0743', result: InspectionResult.Pass, severity: Severity.Minor, defects: [{ code: 'SCR-001', description: '锅底有轻微划痕', severity: Severity.Minor }], inspector: '韩冰', inspectedAt: new Date('2026-07-15') },
    { inspectNo: 'IQC-2026-0008', type: InspectionType.Incoming, itemName: '润滑油', itemBatch: 'BATCH-OIL-0744', result: InspectionResult.Conditional, severity: Severity.Major, defects: [{ code: 'VIS-001', description: '粘度偏高', severity: Severity.Major }], inspector: '梁健', inspectedAt: new Date('2026-07-15'), notes: '需在特定温度下使用' },
    { inspectNo: 'IQC-2026-0009', type: InspectionType.Incoming, itemName: 'LED驱动电源', itemBatch: 'BATCH-DRV-0745', result: InspectionResult.Pass, severity: Severity.Minor, defects: [], inspector: '汪洋', inspectedAt: new Date('2026-07-15') },
  ]

  for (const m of mockInspections) {
    const defects: Defect[] = m.defects.map((d) => ({
      id: `defect-${randomUUID()}`,
      code: d.code,
      description: d.description,
      severity: d.severity,
    }))

    const record: InspectionRecord = {
      id: `inspect-${randomUUID()}`,
      inspectNo: m.inspectNo,
      type: m.type,
      itemName: m.itemName,
      itemBatch: m.itemBatch,
      result: m.result,
      severity: m.severity,
      defects,
      inspector: m.inspector,
      inspectedAt: m.inspectedAt.toISOString(),
      notes: m.notes,
      tenantId: tenant,
      createdAt: m.inspectedAt.toISOString(),
    }
    inspectionStore.set(record.id, record)
  }
}

@Injectable()
export class QualityInspectionService {
  // ═══════════════════════════════════════════════════════════════════
  // Inspection CRUD
  // ═══════════════════════════════════════════════════════════════════

  createInspection(input: {
    tenantId: string
    inspectNo: string
    type: InspectionType
    itemName: string
    itemBatch: string
    result?: InspectionResult
    severity?: Severity
    defects: Array<{ code: string; description: string; severity: Severity }>
    inspector: string
    inspectedAt: string
    notes?: string
  }): InspectionRecord {
    const now = new Date().toISOString()
    const defects: Defect[] = input.defects.map((d) => ({
      id: `defect-${randomUUID()}`,
      code: d.code,
      description: d.description,
      severity: d.severity,
    }))

    const record: InspectionRecord = {
      id: `inspect-${randomUUID()}`,
      tenantId: input.tenantId,
      inspectNo: input.inspectNo,
      type: input.type,
      itemName: input.itemName,
      itemBatch: input.itemBatch,
      result: input.result ?? InspectionResult.Pass,
      severity: input.severity ?? Severity.Minor,
      defects,
      inspector: input.inspector,
      inspectedAt: input.inspectedAt,
      notes: input.notes,
      createdAt: now,
    }
    inspectionStore.set(record.id, record)
    return record
  }

  updateInspection(
    inspectId: string,
    tenantId: string,
    input: {
      type?: InspectionType
      itemName?: string
      itemBatch?: string
      result?: InspectionResult
      severity?: Severity
      defects?: Array<{ code: string; description: string; severity: Severity }>
      inspector?: string
      inspectedAt?: string
      notes?: string
    }
  ): InspectionRecord {
    const record = this.requireInspection(inspectId, tenantId)

    if (input.type !== undefined) record.type = input.type
    if (input.itemName !== undefined) record.itemName = input.itemName
    if (input.itemBatch !== undefined) record.itemBatch = input.itemBatch
    if (input.result !== undefined) record.result = input.result
    if (input.severity !== undefined) record.severity = input.severity
    if (input.defects !== undefined) {
      record.defects = input.defects.map((d) => ({
        id: `defect-${randomUUID()}`,
        code: d.code,
        description: d.description,
        severity: d.severity,
      }))
    }
    if (input.inspector !== undefined) record.inspector = input.inspector
    if (input.inspectedAt !== undefined) record.inspectedAt = input.inspectedAt
    if (input.notes !== undefined) record.notes = input.notes

    inspectionStore.set(inspectId, record)
    return record
  }

  getInspection(inspectId: string, tenantId: string): InspectionRecord | undefined {
    const record = inspectionStore.get(inspectId)
    if (!record || record.tenantId !== tenantId) return undefined
    return record
  }

  listInspections(
    tenantId: string,
    filter?: {
      type?: InspectionType
      result?: InspectionResult
      severity?: Severity
      inspector?: string
      search?: string
    }
  ): InspectionRecord[] {
    seedMockInspections()
    return Array.from(inspectionStore.values())
      .filter((r) => r.tenantId === tenantId)
      .filter((r) => (filter?.type ? r.type === filter.type : true))
      .filter((r) => (filter?.result ? r.result === filter.result : true))
      .filter((r) => (filter?.severity ? r.severity === filter.severity : true))
      .filter((r) => (filter?.inspector ? r.inspector === filter.inspector : true))
      .filter((r) => {
        if (!filter?.search) return true
        const q = filter.search.toLowerCase()
        return (
          r.inspectNo.toLowerCase().includes(q) ||
          r.itemName.toLowerCase().includes(q) ||
          r.itemBatch.toLowerCase().includes(q) ||
          r.inspector.toLowerCase().includes(q)
        )
      })
      .sort((a, b) => b.inspectedAt.localeCompare(a.inspectedAt))
  }

  deleteInspection(inspectId: string, tenantId: string): void {
    const record = this.requireInspection(inspectId, tenantId)
    inspectionStore.delete(record.id)
  }

  // ═══════════════════════════════════════════════════════════════════
  // Query helpers
  // ═══════════════════════════════════════════════════════════════════

  getInspectionsByItems(itemName: string, tenantId: string): InspectionRecord[] {
    seedMockInspections()
    return Array.from(inspectionStore.values())
      .filter((r) => r.tenantId === tenantId && r.itemName === itemName)
      .sort((a, b) => b.inspectedAt.localeCompare(a.inspectedAt))
  }

  getFailedInspections(tenantId: string): InspectionRecord[] {
    seedMockInspections()
    return Array.from(inspectionStore.values())
      .filter((r) => r.tenantId === tenantId && r.result === InspectionResult.Fail)
      .sort((a, b) => b.inspectedAt.localeCompare(a.inspectedAt))
  }

  getInspectionsByType(type: InspectionType, tenantId: string): InspectionRecord[] {
    seedMockInspections()
    return Array.from(inspectionStore.values())
      .filter((r) => r.tenantId === tenantId && r.type === type)
      .sort((a, b) => b.inspectedAt.localeCompare(a.inspectedAt))
  }

  getPassRate(tenantId: string): { total: number; passed: number; failed: number; passRate: number } {
    seedMockInspections()
    const records = Array.from(inspectionStore.values()).filter((r) => r.tenantId === tenantId)
    const total = records.length
    const passed = records.filter((r) => r.result === InspectionResult.Pass).length
    const failed = records.filter((r) => r.result === InspectionResult.Fail).length
    return {
      total,
      passed,
      failed,
      passRate: total > 0 ? (passed / total) * 100 : 0,
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // Internals
  // ═══════════════════════════════════════════════════════════════════

  private requireInspection(inspectId: string, tenantId: string): InspectionRecord {
    const record = inspectionStore.get(inspectId)
    if (!record || record.tenantId !== tenantId) {
      throw new Error(`Inspection record not found: ${inspectId}`)
    }
    return record
  }

  // ═══════════════════════════════════════════════════════════════════
  // Test helpers
  // ═══════════════════════════════════════════════════════════════════

  resetInspectionStoresForTests(): void {
    inspectionStore.clear()
    seeded = false
  }
}
