import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { ReportController } from './report.controller'
import {
  PERMISSIONS_METADATA_KEY,
  TENANT_SCOPE_METADATA_KEY,
} from '../foundation/identity-access/identity-access.decorator'
import { IS_PUBLIC_KEY } from '../foundation/identity-access/public.decorator'

const resolvePermissions = (handler: Function) =>
  Reflect.getMetadata(PERMISSIONS_METADATA_KEY, handler)
  ?? Reflect.getMetadata(PERMISSIONS_METADATA_KEY, ReportController)

const resolveTenantScope = (handler: Function) =>
  Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, handler)
  ?? Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, ReportController)

describe('ReportController metadata', () => {
  const readHandlers = [
    ReportController.prototype.listReports,
    ReportController.prototype.getReport,
    ReportController.prototype.query,
    ReportController.prototype.aggregate,
    ReportController.prototype.listDashboards,
    ReportController.prototype.getDashboard,
    ReportController.prototype.revenueReport,
    ReportController.prototype.trafficReport,
    ReportController.prototype.conversionReport,
  ]

  const writeHandlers = [
    ReportController.prototype.createReport,
    ReportController.prototype.ingest,
    ReportController.prototype.createDashboard,
    ReportController.prototype.deleteReport,
    ReportController.prototype.updateDashboard,
  ]

  it('controller should no longer stay public', () => {
    assert.equal(Reflect.getMetadata(IS_PUBLIC_KEY, ReportController), undefined)
  })

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
