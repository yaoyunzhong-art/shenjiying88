import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [quality-inspection] [D] DTO 测试
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import {
  CreateDefectDto,
  CreateInspectionRecordDto,
  UpdateInspectionRecordDto,
  InspectionRecordQueryDto,
} from './quality-inspection.dto'
import {
  InspectionType,
  InspectionResult,
  Severity,
} from './quality-inspection.entity'

describe('QualityInspection DTOs', () => {
  describe('CreateDefectDto', () => {
    it('should accept all fields', () => {
      const dto = Object.assign(new CreateDefectDto(), {
        code: 'COL-001',
        description: '颜色偏差',
        severity: Severity.Major,
      })

      assert.equal(dto.code, 'COL-001')
      assert.equal(dto.severity, Severity.Major)
    })

    it('should be instanceof CreateDefectDto', () => {
      const dto = Object.assign(new CreateDefectDto(), {
        code: 'C1', description: '缺陷', severity: Severity.Minor,
      })
      assert.ok(dto instanceof CreateDefectDto)
    })
  })

  describe('CreateInspectionRecordDto', () => {
    it('should accept all required fields', () => {
      const defectDto = Object.assign(new CreateDefectDto(), {
        code: 'DIM-001', description: '尺寸偏差', severity: Severity.Minor,
      })

      const dto = Object.assign(new CreateInspectionRecordDto(), {
        inspectNo: 'IQC-2026-0100',
        type: InspectionType.Incoming,
        itemName: '测试零件',
        itemBatch: 'BATCH-TEST-001',
        defects: [defectDto],
        inspector: '王工',
        inspectedAt: '2026-07-16T00:00:00.000Z',
      })

      assert.equal(dto.inspectNo, 'IQC-2026-0100')
      assert.equal(dto.type, InspectionType.Incoming)
      assert.equal(dto.itemName, '测试零件')
      assert.equal(dto.defects.length, 1)
      assert.equal(dto.inspector, '王工')
    })

    it('should accept optional fields', () => {
      const dto = Object.assign(new CreateInspectionRecordDto(), {
        inspectNo: 'IQC-0101', type: InspectionType.Final,
        itemName: '成品', itemBatch: 'BATCH-FG', defects: [],
        inspector: '李工', inspectedAt: '2026-07-16T00:00:00.000Z',
        result: InspectionResult.Pass,
        severity: Severity.Minor,
        notes: '测试备注',
      })

      assert.equal(dto.result, InspectionResult.Pass)
      assert.equal(dto.notes, '测试备注')
    })

    it('should be instanceof CreateInspectionRecordDto', () => {
      const dto = Object.assign(new CreateInspectionRecordDto(), {
        inspectNo: 'I1', type: InspectionType.Incoming,
        itemName: 'Item', itemBatch: 'B1',
        defects: [], inspector: 'Insp', inspectedAt: '2026-07-16T00:00:00.000Z',
      })
      assert.ok(dto instanceof CreateInspectionRecordDto)
    })
  })

  describe('UpdateInspectionRecordDto', () => {
    it('should accept partial data', () => {
      const dto = Object.assign(new UpdateInspectionRecordDto(), {
        result: InspectionResult.Fail,
        notes: '不合格',
      })

      assert.equal(dto.result, InspectionResult.Fail)
      assert.equal(dto.notes, '不合格')
    })

    it('should accept empty object', () => {
      const dto = new UpdateInspectionRecordDto()
      assert.equal(dto.itemName, undefined)
    })
  })

  describe('InspectionRecordQueryDto', () => {
    it('should hold query filters', () => {
      const dto = Object.assign(new InspectionRecordQueryDto(), {
        type: InspectionType.Incoming,
        result: InspectionResult.Fail,
        severity: Severity.Critical,
        inspector: '王工',
        search: '电阻',
      })

      assert.equal(dto.type, InspectionType.Incoming)
      assert.equal(dto.result, InspectionResult.Fail)
      assert.equal(dto.severity, Severity.Critical)
      assert.equal(dto.inspector, '王工')
      assert.equal(dto.search, '电阻')
    })

    it('should accept empty query', () => {
      const dto = new InspectionRecordQueryDto()
      assert.equal(dto.type, undefined)
      assert.equal(dto.result, undefined)
    })
  })
})
