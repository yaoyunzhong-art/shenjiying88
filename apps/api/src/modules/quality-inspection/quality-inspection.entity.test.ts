import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [quality-inspection] [D] entity 测试
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import {
  InspectionType,
  InspectionResult,
  Severity,
  type Defect,
  type InspectionRecord,
} from './quality-inspection.entity'

describe('QualityInspection Entity', () => {
  describe('enums', () => {
    it('InspectionType should have correct values', () => {
      assert.equal(InspectionType.Incoming, 'INCOMING')
      assert.equal(InspectionType.Outgoing, 'OUTGOING')
      assert.equal(InspectionType.InProcess, 'IN_PROCESS')
      assert.equal(InspectionType.Final, 'FINAL')
    })

    it('InspectionResult should have correct values', () => {
      assert.equal(InspectionResult.Pass, 'PASS')
      assert.equal(InspectionResult.Fail, 'FAIL')
      assert.equal(InspectionResult.Conditional, 'CONDITIONAL')
    })

    it('Severity should have correct values', () => {
      assert.equal(Severity.Critical, 'CRITICAL')
      assert.equal(Severity.Major, 'MAJOR')
      assert.equal(Severity.Minor, 'MINOR')
      assert.equal(Severity.Observation, 'OBSERVATION')
    })
  })

  describe('Defect interface', () => {
    it('should create a valid defect', () => {
      const defect: Defect = {
        id: 'defect-001',
        code: 'COL-001',
        description: '颜色偏差超标',
        severity: Severity.Major,
      }

      assert.equal(defect.code, 'COL-001')
      assert.equal(defect.severity, Severity.Major)
    })
  })

  describe('InspectionRecord interface shape', () => {
    it('should create a valid inspection record with defects', () => {
      const defect: Defect = {
        id: 'defect-001',
        code: 'COL-001',
        description: '颜色偏差',
        severity: Severity.Major,
      }

      const record: InspectionRecord = {
        id: 'inspect-001',
        inspectNo: 'IQC-2026-0001',
        type: InspectionType.Incoming,
        itemName: '电阻器套装',
        itemBatch: 'BATCH-R-0725',
        result: InspectionResult.Pass,
        severity: Severity.Minor,
        defects: [defect],
        inspector: '王工',
        inspectedAt: '2026-07-01T00:00:00.000Z',
        notes: '常规抽检',
        tenantId: 'tenant-001',
        createdAt: '2026-07-01T00:00:00.000Z',
      }

      assert.equal(record.inspectNo, 'IQC-2026-0001')
      assert.equal(record.type, InspectionType.Incoming)
      assert.equal(record.result, InspectionResult.Pass)
      assert.equal(record.severity, Severity.Minor)
      assert.equal(record.defects.length, 1)
      assert.equal(record.inspector, '王工')
      assert.equal(record.notes, '常规抽检')
    })

    it('should support record without notes and with no defects', () => {
      const record: InspectionRecord = {
        id: 'inspect-002',
        inspectNo: 'IQC-2026-0002',
        type: InspectionType.Outgoing,
        itemName: '成品',
        itemBatch: 'BATCH-FG-001',
        result: InspectionResult.Pass,
        severity: Severity.Observation,
        defects: [],
        inspector: '李工',
        inspectedAt: '2026-07-02T00:00:00.000Z',
        tenantId: 'tenant-001',
        createdAt: '2026-07-02T00:00:00.000Z',
      }

      assert.equal(record.notes, undefined)
      assert.equal(record.defects.length, 0)
    })
  })
})
