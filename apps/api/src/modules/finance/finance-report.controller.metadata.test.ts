import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { FinanceReportController } from './finance-report.controller'
import {
  PERMISSIONS_METADATA_KEY,
  TENANT_SCOPE_METADATA_KEY,
} from '../foundation/identity-access/identity-access.decorator'

const resolvePermissions = (handler: Function) =>
  Reflect.getMetadata(PERMISSIONS_METADATA_KEY, handler)
  ?? Reflect.getMetadata(PERMISSIONS_METADATA_KEY, FinanceReportController)

const resolveTenantScope = (handler: Function) =>
  Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, handler)
  ?? Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, FinanceReportController)

describe('FinanceReportController metadata', () => {
  const readHandlers = [
    FinanceReportController.prototype.listReports,
    FinanceReportController.prototype.getReport,
    FinanceReportController.prototype.getExportResult,
  ]

  const writeHandlers = [
    FinanceReportController.prototype.createReport,
    FinanceReportController.prototype.regenerateReport,
    FinanceReportController.prototype.exportReport,
    FinanceReportController.prototype.deleteReport,
  ]

  it('all routes should require tenant scope', () => {
    ;[...readHandlers, ...writeHandlers].forEach((handler) => {
      assert.deepEqual(resolveTenantScope(handler), {})
    })
  })

  it('read routes should reuse finance:read', () => {
    readHandlers.forEach((handler) => {
      assert.deepEqual(resolvePermissions(handler), ['finance:read'])
    })
  })

  it('write routes should reuse finance:*', () => {
    writeHandlers.forEach((handler) => {
      assert.deepEqual(resolvePermissions(handler), ['finance:*'])
    })
  })
})
