import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { QualityInspectionController } from './quality-inspection.controller'

describe('QualityInspectionController metadata', () => {
  it('controller should keep quality-inspections path', () => {
    assert.equal(Reflect.getMetadata('path', QualityInspectionController), 'quality-inspections')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [QualityInspectionController.prototype.createInspection, 1, '/'],
      [QualityInspectionController.prototype.listInspections, 0, '/'],
      [QualityInspectionController.prototype.getInspection, 0, ':inspectId'],
      [QualityInspectionController.prototype.updateInspection, 4, ':inspectId'],
      [QualityInspectionController.prototype.deleteInspection, 3, ':inspectId'],
      [QualityInspectionController.prototype.getFailedInspections, 0, 'views/failed'],
      [QualityInspectionController.prototype.getPassRate, 0, 'views/pass-rate'],
      [QualityInspectionController.prototype.getInspectionsByType, 0, 'type/:type'],
      [QualityInspectionController.prototype.getInspectionsByItem, 0, 'item/:itemName'],
    ] as const

    cases.forEach(([handler, method, path]) => {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    })
  })
})
