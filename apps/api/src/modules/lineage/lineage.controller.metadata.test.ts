import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { LineageController } from './lineage.controller'

describe('LineageController metadata', () => {
  it('controller should keep lineage path', () => {
    assert.equal(Reflect.getMetadata('path', LineageController), 'lineage')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [LineageController.prototype.registerField, 1, 'fields/register'],
      [LineageController.prototype.registerEdge, 1, 'edges'],
      [LineageController.prototype.getLineage, 0, 'lineage/:tableName/:fieldName'],
      [LineageController.prototype.getDownstream, 0, 'downstream/:tableName/:fieldName'],
      [LineageController.prototype.analyzeImpact, 1, 'impact'],
      [LineageController.prototype.getFullGraph, 0, 'graph'],
      [LineageController.prototype.classifyField, 1, 'classify'],
      [LineageController.prototype.classifyFieldBatch, 1, 'classify/batch'],
      [LineageController.prototype.getClassification, 0, 'classify/:tableName/:fieldName'],
      [LineageController.prototype.updateClassification, 1, 'classify/update'],
      [LineageController.prototype.listSensitiveFields, 0, 'classify/sensitive/:tableName'],
      [LineageController.prototype.getAllClassifications, 0, 'classify/all'],
      [LineageController.prototype.trackDataFlow, 1, 'flows/track'],
      [LineageController.prototype.registerTransfer, 1, 'flows/transfer'],
      [LineageController.prototype.getDataFlowReport, 0, 'flows/report'],
      [LineageController.prototype.getExposureRisks, 0, 'flows/risks'],
      [LineageController.prototype.generateComplianceReport, 0, 'compliance/report'],
      [LineageController.prototype.getComplianceScore, 0, 'compliance/score'],
      [LineageController.prototype.getViolations, 0, 'compliance/violations'],
      [LineageController.prototype.getReportById, 0, 'compliance/report/:reportId'],
    ] as const

    for (const [handler, method, path] of cases) {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    }
  })
})
