import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [quality-inspection] [D] controller 测试
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { QualityInspectionController } from './quality-inspection.controller'
import { QualityInspectionService } from './quality-inspection.service'
import {
  InspectionType,
  InspectionResult,
  Severity,
} from './quality-inspection.entity'

describe('QualityInspectionController', () => {
  let controller: InstanceType<typeof QualityInspectionController>
  let service: InstanceType<typeof QualityInspectionService>

  const TENANT = { tenantId: 'tenant-001', brandId: 'brand-1', storeId: 'store-001' }

  const sampleDefects = [
    { code: 'DIM-001', description: '尺寸偏差', severity: Severity.Minor },
  ]

  beforeEach(() => {
    service = new QualityInspectionService()
    controller = new QualityInspectionController(service)
  })

  afterEach(() => {
    service.resetInspectionStoresForTests()
  })

  // ── Route metadata ──

  describe('route metadata', () => {
    it('controller path should be quality-inspections', () => {
      const path = Reflect.getMetadata('path', QualityInspectionController)
      assert.equal(path, 'quality-inspections')
    })

    it('createInspection should be POST /', () => {
      const method = Reflect.getMetadata('method', QualityInspectionController.prototype.createInspection)
      const path = Reflect.getMetadata('path', QualityInspectionController.prototype.createInspection)
      assert.equal(method, 1)
      assert.equal(path, '/')
    })

    it('listInspections should be GET /', () => {
      const method = Reflect.getMetadata('method', QualityInspectionController.prototype.listInspections)
      const path = Reflect.getMetadata('path', QualityInspectionController.prototype.listInspections)
      assert.equal(method, 0)
      assert.equal(path, '/')
    })

    it('getInspection should be GET /:inspectId', () => {
      const method = Reflect.getMetadata('method', QualityInspectionController.prototype.getInspection)
      const path = Reflect.getMetadata('path', QualityInspectionController.prototype.getInspection)
      assert.equal(method, 0)
      assert.equal(path, ':inspectId')
    })

    it('updateInspection should be PATCH /:inspectId', () => {
      const method = Reflect.getMetadata('method', QualityInspectionController.prototype.updateInspection)
      const path = Reflect.getMetadata('path', QualityInspectionController.prototype.updateInspection)
      assert.equal(method, 4)
      assert.equal(path, ':inspectId')
    })

    it('deleteInspection should be DELETE /:inspectId', () => {
      const method = Reflect.getMetadata('method', QualityInspectionController.prototype.deleteInspection)
      const path = Reflect.getMetadata('path', QualityInspectionController.prototype.deleteInspection)
      assert.equal(method, 3)
      assert.equal(path, ':inspectId')
    })

    it('getFailedInspections should be GET /views/failed', () => {
      const method = Reflect.getMetadata('method', QualityInspectionController.prototype.getFailedInspections)
      const path = Reflect.getMetadata('path', QualityInspectionController.prototype.getFailedInspections)
      assert.equal(method, 0)
      assert.equal(path, 'views/failed')
    })

    it('getPassRate should be GET /views/pass-rate', () => {
      const method = Reflect.getMetadata('method', QualityInspectionController.prototype.getPassRate)
      const path = Reflect.getMetadata('path', QualityInspectionController.prototype.getPassRate)
      assert.equal(method, 0)
      assert.equal(path, 'views/pass-rate')
    })
  })

  // ── CRUD via controller ──

  describe('POST /quality-inspections', () => {
    it('should create an inspection', () => {
      const result = controller.createInspection(TENANT, {
        inspectNo: 'IQC-001',
        type: InspectionType.Incoming,
        itemName: '测试品',
        itemBatch: 'BATCH-001',
        defects: sampleDefects,
        inspector: '测试员',
        inspectedAt: '2026-07-16T00:00:00.000Z',
      })

      assert.equal(result.inspectNo, 'IQC-001')
      assert.equal(result.result, InspectionResult.Pass)
      assert.ok(result.id.startsWith('inspect-'))
    })
  })

  describe('GET /quality-inspections', () => {
    it('should list inspections (with seed data)', () => {
      controller.createInspection(TENANT, {
        inspectNo: 'IQC-001', type: InspectionType.Incoming,
        itemName: 'A', itemBatch: 'B1',
        defects: sampleDefects, inspector: 'Tester',
        inspectedAt: '2026-07-16T00:00:00.000Z',
      })

      const list = controller.listInspections(TENANT, {})
      // listInspections seeds mock data
      assert.ok(list.length >= 21)
      assert.ok(list.some((r) => r.inspectNo === 'IQC-001'))
    })

    it('should filter by type', () => {
      controller.createInspection(TENANT, {
        inspectNo: 'IN', type: InspectionType.Incoming,
        itemName: 'A', itemBatch: 'B1',
        defects: sampleDefects, inspector: 'T1',
        inspectedAt: '2026-07-16T00:00:00.000Z',
      })
      controller.createInspection(TENANT, {
        inspectNo: 'OUT', type: InspectionType.Outgoing,
        itemName: 'B', itemBatch: 'B2',
        defects: sampleDefects, inspector: 'T2',
        inspectedAt: '2026-07-16T00:00:00.000Z',
      })

      const list = controller.listInspections(TENANT, { type: InspectionType.Outgoing })
      assert.ok(list.length >= 1)
      assert.ok(list.some((r) => r.inspectNo === 'OUT'))
    })
  })

  describe('GET /quality-inspections/:inspectId', () => {
    it('should get inspection', () => {
      const created = controller.createInspection(TENANT, {
        inspectNo: 'IQC-GET', type: InspectionType.Incoming,
        itemName: 'A', itemBatch: 'B1',
        defects: sampleDefects, inspector: 'T1',
        inspectedAt: '2026-07-16T00:00:00.000Z',
      })

      const found = controller.getInspection(TENANT, created.id)
      assert.ok(found)
      assert.equal(found.inspectNo, 'IQC-GET')
    })
  })

  describe('PATCH /quality-inspections/:inspectId', () => {
    it('should update inspection', () => {
      const created = controller.createInspection(TENANT, {
        inspectNo: 'IQC-OLD', type: InspectionType.Incoming,
        itemName: 'A', itemBatch: 'B1',
        defects: sampleDefects, inspector: 'T1',
        inspectedAt: '2026-07-16T00:00:00.000Z',
      })

      const updated = controller.updateInspection(TENANT, created.id, { notes: '新备注' })
      assert.equal(updated.notes, '新备注')
    })
  })

  describe('DELETE /quality-inspections/:inspectId', () => {
    it('should delete inspection', () => {
      const created = controller.createInspection(TENANT, {
        inspectNo: 'IQC-DEL', type: InspectionType.Incoming,
        itemName: 'A', itemBatch: 'B1',
        defects: sampleDefects, inspector: 'T1',
        inspectedAt: '2026-07-16T00:00:00.000Z',
      })

      const result = controller.deleteInspection(TENANT, created.id)
      assert.deepStrictEqual(result, { success: true })
    })
  })

  // ── Error handling ──

  describe('error propagation from service', () => {
    it('should propagate inspection not found', () => {
      assert.throws(
        () => controller.getInspection(TENANT, 'nonexistent'),
        /Inspection record not found/
      )
    })
  })
})
