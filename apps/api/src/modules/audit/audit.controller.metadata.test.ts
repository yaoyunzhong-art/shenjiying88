import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { AuditController } from './audit.controller'
import {
  PERMISSIONS_METADATA_KEY,
  TENANT_SCOPE_METADATA_KEY,
} from '../foundation/identity-access/identity-access.decorator'
import { IS_PUBLIC_KEY } from '../foundation/identity-access/public.decorator'

const resolvePermissions = (handler: Function) =>
  Reflect.getMetadata(PERMISSIONS_METADATA_KEY, handler)
  ?? Reflect.getMetadata(PERMISSIONS_METADATA_KEY, AuditController)

const resolveTenantScope = (handler: Function) =>
  Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, handler)
  ?? Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, AuditController)

describe('AuditController metadata', () => {
  const readHandlers = [
    AuditController.prototype.findAll,
    AuditController.prototype.findOne,
    AuditController.prototype.getUserActivity,
    AuditController.prototype.detectAnomalies,
    AuditController.prototype.computeRiskScore,
    AuditController.prototype.getSettlementAuditTrail,
  ]

  const writeHandlers = [
    AuditController.prototype.create,
    AuditController.prototype.createBatch,
    AuditController.prototype.logSettlement,
    AuditController.prototype.exportReport,
    AuditController.prototype.generateComplianceReport,
  ]

  it('controller should no longer stay public', () => {
    assert.equal(Reflect.getMetadata(IS_PUBLIC_KEY, AuditController), undefined)
  })

  it('all routes should require tenant scope', () => {
    ;[...readHandlers, ...writeHandlers].forEach((handler) => {
      assert.deepEqual(resolveTenantScope(handler), {})
    })
  })

  it('read routes should reuse audit:read', () => {
    readHandlers.forEach((handler) => {
      assert.deepEqual(resolvePermissions(handler), ['audit:read'])
    })
  })

  it('write routes should reuse audit:export', () => {
    writeHandlers.forEach((handler) => {
      assert.deepEqual(resolvePermissions(handler), ['audit:export'])
    })
  })
})
