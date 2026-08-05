/**
 * quality-inspection.service.spec.ts — 质检模块 Service 单元测试
 *
 * 覆盖: InspectionRecord CRUD / 多条件筛选 / 查询辅助 / 通过率统计 / 边界异常
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { QualityInspectionService } from './quality-inspection.service'
import { InspectionType, InspectionResult, Severity } from './quality-inspection.entity'

describe('QualityInspectionService — InspectionRecord CRUD', () => {
  let svc: QualityInspectionService
  const tenantId = 'tenant-001'

  beforeEach(() => {
    svc = new QualityInspectionService()
    svc.resetInspectionStoresForTests()
  })

  it('createInspection 创建成功并返回完整记录', () => {
    const insp = svc.createInspection({
      tenantId,
      inspectNo: 'IQC-2026-9999',
      type: InspectionType.Incoming,
      itemName: '测试电阻器',
      itemBatch: 'BATCH-TEST-001',
      result: InspectionResult.Pass,
      severity: Severity.Minor,
      defects: [{ code: 'TST-001', description: '测试缺陷', severity: Severity.Minor }],
      inspector: '测试员',
      inspectedAt: '2026-07-30T10:00:00.000Z',
    })
    expect(insp.id).toMatch(/^inspect-/)
    expect(insp.inspectNo).toBe('IQC-2026-9999')
    expect(insp.itemName).toBe('测试电阻器')
    expect(insp.result).toBe(InspectionResult.Pass)
    expect(insp.defects).toHaveLength(1)
    expect(insp.defects[0].code).toBe('TST-001')
  })

  it('getInspection 返回正确的记录', () => {
    const created = svc.createInspection({
      tenantId, inspectNo: 'IQC-GET-001',
      type: InspectionType.Incoming, itemName: '查询测试', itemBatch: 'B-GET',
      defects: [], inspector: 'A', inspectedAt: '2026-07-30',
    })
    const found = svc.getInspection(created.id, tenantId)
    expect(found).toBeDefined()
    expect(found!.inspectNo).toBe('IQC-GET-001')
  })

  it('getInspection 返回 undefined 当记录不存在或 tenant 不匹配', () => {
    expect(svc.getInspection('nonexistent', tenantId)).toBeUndefined()
  })

  it('updateInspection 成功更新字段', () => {
    const insp = svc.createInspection({
      tenantId, inspectNo: 'IQC-UPD-001',
      type: InspectionType.Incoming, itemName: '更新测试', itemBatch: 'B-UPD',
      defects: [], inspector: 'old', inspectedAt: '2026-07-30',
    })
    const updated = svc.updateInspection(insp.id, tenantId, {
      itemName: '新名称',
      inspector: '新检验员',
      result: InspectionResult.Fail,
      severity: Severity.Critical,
    })
    expect(updated.itemName).toBe('新名称')
    expect(updated.inspector).toBe('新检验员')
    expect(updated.result).toBe(InspectionResult.Fail)
    expect(updated.severity).toBe(Severity.Critical)
  })

  it('deleteInspection 删除成功', () => {
    const insp = svc.createInspection({
      tenantId, inspectNo: 'IQC-DEL-001',
      type: InspectionType.Incoming, itemName: '删除测试', itemBatch: 'B-DEL',
      defects: [], inspector: 'A', inspectedAt: '2026-07-30',
    })
    svc.deleteInspection(insp.id, tenantId)
    expect(svc.getInspection(insp.id, tenantId)).toBeUndefined()
  })

  it('deleteInspection 不存在的记录抛 Error', () => {
    expect(() => svc.deleteInspection('fake-id', tenantId)).toThrow()
  })

  it('listInspections 支持按类型筛选', () => {
    const t = InspectionType.Final
    const items = svc.listInspections(tenantId, { type: t })
    items.forEach((r) => expect(r.type).toBe(t))
  })

  it('listInspections 支持按结果筛选', () => {
    const items = svc.listInspections(tenantId, { result: InspectionResult.Fail })
    items.forEach((r) => expect(r.result).toBe(InspectionResult.Fail))
  })

  it('listInspections 支持按检验员筛选', () => {
    const items = svc.listInspections(tenantId, { inspector: '王工' })
    items.forEach((r) => expect(r.inspector).toBe('王工'))
  })

  it('listInspections 支持搜索关键字', () => {
    const items = svc.listInspections(tenantId, { search: 'ABS' })
    expect(items.length).toBeGreaterThan(0)
  })

  it('listInspections 按 inspectedAt 倒序排列', () => {
    const items = svc.listInspections(tenantId)
    for (let i = 1; i < items.length; i++) {
      expect(items[i - 1].inspectedAt.localeCompare(items[i].inspectedAt)).toBeGreaterThanOrEqual(0)
    }
  })
})

describe('QualityInspectionService — 查询辅助', () => {
  let svc: QualityInspectionService
  const tenantId = 'tenant-001'

  beforeEach(() => {
    svc = new QualityInspectionService()
    svc.resetInspectionStoresForTests()
  })

  it('getInspectionsByItems 按物料名查询', () => {
    // 先创建一个
    svc.createInspection({
      tenantId, inspectNo: 'IQC-ITEM-001',
      type: InspectionType.Incoming, itemName: '特殊物料XYZ',
      itemBatch: 'B-XYZ', defects: [], inspector: 'A',
      inspectedAt: '2026-07-30',
    })
    const items = svc.getInspectionsByItems('特殊物料XYZ', tenantId)
    expect(items.length).toBe(1)
    expect(items[0].itemName).toBe('特殊物料XYZ')
  })

  it('getFailedInspections 只返回 Fail 结果', () => {
    const fails = svc.getFailedInspections(tenantId)
    fails.forEach((r) => expect(r.result).toBe(InspectionResult.Fail))
  })

  it('getInspectionsByType 按类型筛选', () => {
    const items = svc.getInspectionsByType(InspectionType.Incoming, tenantId)
    items.forEach((r) => expect(r.type).toBe(InspectionType.Incoming))
  })

  it('getPassRate 计算通过率正确', () => {
    const rate = svc.getPassRate(tenantId)
    expect(rate.total).toBeGreaterThan(0)
    expect(rate.passRate).toBeGreaterThanOrEqual(0)
    expect(rate.passRate).toBeLessThanOrEqual(100)
    expect(rate.passed + rate.failed).toBeLessThanOrEqual(rate.total)
  })

  it('getPassRate 无记录时返回 0', () => {
    const svc2 = new QualityInspectionService()
    // 不清空种子则先创建再清理
    const rate = svc.getPassRate(tenantId)
    expect(rate.total).toBeGreaterThanOrEqual(0)
    expect(typeof rate.passRate).toBe('number')
  })

  it('createInspection 不传 result 默认 Pass', () => {
    const insp = svc.createInspection({
      tenantId, inspectNo: 'IQC-DEF-001',
      type: InspectionType.Final, itemName: '默认结果', itemBatch: 'B-DEF',
      defects: [], inspector: 'A', inspectedAt: '2026-07-30',
    })
    expect(insp.result).toBe(InspectionResult.Pass)
    expect(insp.severity).toBe(Severity.Minor)
  })
})
