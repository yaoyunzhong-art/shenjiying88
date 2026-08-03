import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { StoreRevenueReportController } from './store-revenue-report.controller'
import {
  PERMISSIONS_METADATA_KEY,
  TENANT_SCOPE_METADATA_KEY,
} from '../foundation/identity-access/identity-access.decorator'

const resolvePermissions = (handler: Function) =>
  Reflect.getMetadata(PERMISSIONS_METADATA_KEY, handler)
  ?? Reflect.getMetadata(PERMISSIONS_METADATA_KEY, StoreRevenueReportController)

const resolveTenantScope = (handler: Function) =>
  Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, handler)
  ?? Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, StoreRevenueReportController)

describe('StoreRevenueReportController metadata', () => {
  const readHandlers = [
    StoreRevenueReportController.prototype.listReports,
    StoreRevenueReportController.prototype.getReport,
    StoreRevenueReportController.prototype.getStoreSummary,
    StoreRevenueReportController.prototype.getOverallSummary,
  ]

  const writeHandlers = [
    StoreRevenueReportController.prototype.generateReport,
    StoreRevenueReportController.prototype.deleteReport,
  ]

  it('all routes should require tenant scope', () => {
    ;[...readHandlers, ...writeHandlers].forEach((handler) => {
      assert.deepEqual(resolveTenantScope(handler), {})
    })
  })

  it('read routes should reuse report:read', () => {
    readHandlers.forEach((handler) => {
      assert.deepEqual(resolvePermissions(handler), ['report:read'])
    })
  })

  it('write routes should reuse report:export', () => {
    writeHandlers.forEach((handler) => {
      assert.deepEqual(resolvePermissions(handler), ['report:export'])
    })
  })
})
