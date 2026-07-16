import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [quality-inspection] [D] service 测试
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { QualityInspectionService } from './quality-inspection.service'
import {
  InspectionType,
  InspectionResult,
  Severity,
  type InspectionRecord,
} from './quality-inspection.entity'

describe('QualityInspectionService', () => {
  let service: QualityInspectionService

  const TENANT = 'tenant-001'

  beforeEach(() => {
    service = new QualityInspectionService()
  })

  afterEach(() => {
    service.resetInspectionStoresForTests()
  })

  function createTestInspection(overrides?: Partial<Parameters<QualityInspectionService['createInspection']>[0]>): InspectionRecord {
    return service.createInspection({
      tenantId: TENANT,
      inspectNo: 'IQC-TEST-001',
      type: InspectionType.Incoming,
      itemName: '测试品',
      itemBatch: 'BATCH-TEST-001',
      defects: [
        { code: 'DIM-001', description: '尺寸偏差', severity: Severity.Minor },
      ],
      inspector: '测试员',
      inspectedAt: '2026-07-16T00:00:00.000Z',
      ...overrides,
    })
  }

  // ── CRUD ──

  describe('createInspection', () => {
    it('should create an inspection record', () => {
      const r = createTestInspection()

      assert.equal(r.inspectNo, 'IQC-TEST-001')
      assert.equal(r.type, InspectionType.Incoming)
      assert.equal(r.itemName, '测试品')
      assert.equal(r.result, InspectionResult.Pass)
      assert.equal(r.severity, Severity.Minor)
      assert.equal(r.defects.length, 1)
      assert.equal(r.inspector, '测试员')
      assert.equal(r.tenantId, TENANT)
      assert.ok(r.id.startsWith('inspect-'))
    })

    it('should create inspection with FAIL result and critical severity', () => {
      const r = createTestInspection({
        inspectNo: 'IQC-FAIL',
        result: InspectionResult.Fail,
        severity: Severity.Critical,
        defects: [
          { code: 'COL-001', description: '颜色偏差', severity: Severity.Major },
          { code: 'IMP-001', description: '杂质超标', severity: Severity.Critical },
        ],
        notes: '整批拒收',
      })

      assert.equal(r.result, InspectionResult.Fail)
      assert.equal(r.severity, Severity.Critical)
      assert.equal(r.defects.length, 2)
      assert.equal(r.notes, '整批拒收')
    })
  })

  describe('getInspection', () => {
    it('should return inspection by id', () => {
      const r = createTestInspection()
      const found = service.getInspection(r.id, TENANT)
      assert.ok(found)
      assert.equal(found?.id, r.id)
    })

    it('should return undefined for non-existent', () => {
      const found = service.getInspection('nonexistent', TENANT)
      assert.equal(found, undefined)
    })

    it('should return undefined for wrong tenant', () => {
      const r = createTestInspection()
      const found = service.getInspection(r.id, 'wrong-tenant')
      assert.equal(found, undefined)
    })
  })

  describe('listInspections', () => {
    it('should list all inspections for tenant (with seed data)', () => {
      createTestInspection({ inspectNo: 'I1' })
      createTestInspection({ inspectNo: 'I2' })

      const list = service.listInspections(TENANT)
      // listInspections seeds mock data
      assert.ok(list.length >= 21)
      assert.ok(list.some((r) => r.inspectNo === 'I1'))
    })

    it('should filter by type', () => {
      createTestInspection({ inspectNo: 'IN', type: InspectionType.Incoming })
      createTestInspection({ inspectNo: 'OUT', type: InspectionType.Outgoing })

      const outgoing = service.listInspections(TENANT, { type: InspectionType.Outgoing })
      assert.ok(outgoing.length >= 1)
      assert.ok(outgoing.some((r) => r.inspectNo === 'OUT'))
    })

    it('should filter by result', () => {
      const r = createTestInspection({ inspectNo: 'FAIL' })
      service.updateInspection(r.id, TENANT, { result: InspectionResult.Fail })

      const failed = service.listInspections(TENANT, { result: InspectionResult.Fail })
      assert.ok(failed.length >= 1)
      assert.ok(failed.some((r) => r.inspectNo === 'FAIL'))
    })

    it('should filter by inspector', () => {
      createTestInspection({ inspectNo: 'I1', inspector: '张三' })
      createTestInspection({ inspectNo: 'I2', inspector: '李四' })

      const list = service.listInspections(TENANT, { inspector: '张三' })
      assert.ok(list.length >= 1)
      assert.ok(list.every((r) => r.inspector === '张三'))
    })
  })

  describe('updateInspection', () => {
    it('should update inspection fields', () => {
      const r = createTestInspection()
      const updated = service.updateInspection(r.id, TENANT, {
        notes: '更新备注',
        result: InspectionResult.Conditional,
      })

      assert.equal(updated.notes, '更新备注')
      assert.equal(updated.result, InspectionResult.Conditional)
    })

    it('should update defects', () => {
      const r = createTestInspection()
      const updated = service.updateInspection(r.id, TENANT, {
        defects: [
          { code: 'NEW-001', description: '新缺陷', severity: Severity.Critical },
        ],
      })

      assert.equal(updated.defects.length, 1)
      assert.equal(updated.defects[0].code, 'NEW-001')
    })

    it('should throw for non-existent', () => {
      assert.throws(
        () => service.updateInspection('nonexistent', TENANT, { notes: 'X' }),
        /Inspection record not found/
      )
    })
  })

  describe('deleteInspection', () => {
    it('should delete an inspection', () => {
      const r = createTestInspection()
      service.deleteInspection(r.id, TENANT)

      const found = service.getInspection(r.id, TENANT)
      assert.equal(found, undefined)
    })

    it('should throw for non-existent', () => {
      assert.throws(
        () => service.deleteInspection('nonexistent', TENANT),
        /Inspection record not found/
      )
    })
  })

  // ── Query helpers ──

  describe('getInspectionsByItems', () => {
    it('should return inspections for an item', () => {
      createTestInspection({ inspectNo: 'I1', itemName: '电阻器' })
      createTestInspection({ inspectNo: 'I2', itemName: '电阻器' })
      createTestInspection({ inspectNo: 'I3', itemName: '电容器' })

      const list = service.getInspectionsByItems('电阻器', TENANT)
      assert.equal(list.length, 2)
    })
  })

  describe('getFailedInspections', () => {
    it('should return failed inspections', () => {
      const r = createTestInspection({ inspectNo: 'PASS' })
      const r2 = createTestInspection({ inspectNo: 'FAIL' })
      service.updateInspection(r2.id, TENANT, { result: InspectionResult.Fail })

      const failed = service.getFailedInspections(TENANT)
      // getFailedInspections seeds mock data; seed has its own FAIL records
      assert.ok(failed.length >= 1)
      assert.ok(failed.some((r) => r.inspectNo === 'FAIL'))
    })
  })

  describe('getInspectionsByType', () => {
    it('should return inspections by type', () => {
      createTestInspection({ inspectNo: 'I1', type: InspectionType.Incoming })
      createTestInspection({ inspectNo: 'I2', type: InspectionType.Final })

      const finalList = service.getInspectionsByType(InspectionType.Final, TENANT)
      assert.ok(finalList.length >= 1)
      assert.ok(finalList.some((r) => r.inspectNo === 'I2'))
    })
  })

  describe('getPassRate', () => {
    it('should return pass rate stats (with seed data)', () => {
      createTestInspection({ inspectNo: 'PASS1' })
      createTestInspection({ inspectNo: 'PASS2' })
      const fail = createTestInspection({ inspectNo: 'FAIL' })
      service.updateInspection(fail.id, TENANT, { result: InspectionResult.Fail })

      const stats = service.getPassRate(TENANT)
      // getPassRate seeds mock data
      assert.ok(stats.total >= 3)
      assert.ok(stats.passed >= 2)
      assert.ok(stats.failed >= 1)
    })
  })
})
