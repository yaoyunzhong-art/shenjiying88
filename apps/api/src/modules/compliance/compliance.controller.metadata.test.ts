import 'reflect-metadata'
import assert from 'node:assert/strict'
import { describe, it } from 'vitest'
import { ComplianceController } from './compliance.controller'

describe('ComplianceController metadata', () => {
  it('controller should keep compliance path', () => {
    assert.equal(Reflect.getMetadata('path', ComplianceController), 'compliance')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [ComplianceController.prototype.detectPII, 1, 'pii/detect'],
      [ComplianceController.prototype.batchDetectPII, 1, 'pii/batch-detect'],
      [ComplianceController.prototype.maskPII, 1, 'pii/mask'],
      [ComplianceController.prototype.batchMaskPII, 1, 'pii/batch-mask'],
      [ComplianceController.prototype.requestErasure, 1, 'erasure'],
      [ComplianceController.prototype.cancelErasure, 1, 'erasure/:userId/cancel'],
      [ComplianceController.prototype.hardDelete, 1, 'erasure/:userId/hard-delete'],
      [ComplianceController.prototype.processScheduledDeletions, 1, 'erasure/process-scheduled'],
      [ComplianceController.prototype.getErasureStatus, 0, 'erasure/:userId'],
      [ComplianceController.prototype.getErasureAuditTrail, 0, 'erasure/audit/:tenantId'],
      [ComplianceController.prototype.appendAuditLog, 1, 'audit/append'],
      [ComplianceController.prototype.queryAuditLog, 1, 'audit/query'],
      [ComplianceController.prototype.exportAuditLog, 1, 'audit/export'],
      [ComplianceController.prototype.verifyAuditChain, 0, 'audit/verify'],
      [ComplianceController.prototype.checkGates, 0, 'gate/check'],
      [ComplianceController.prototype.getGateConfig, 0, 'gate/config'],
      [ComplianceController.prototype.updateGateConfig, 1, 'gate/config'],
      [ComplianceController.prototype.getHealth, 0, 'health'],
    ] as const

    cases.forEach(([handler, method, path]) => {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    })
  })
})
