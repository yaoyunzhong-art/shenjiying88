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
  Reflect.getMetadata(PERMISSIONS_METADATA_KEY, handler) ??
  Reflect.getMetadata(PERMISSIONS_METADATA_KEY, ReportController)

const resolveTenantScope = (handler: Function) =>
  Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, handler) ??
  Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, ReportController)

describe('ReportController metadata', () => {
  const readHandlers = [
    ReportController.prototype.revenueReport,
    ReportController.prototype.inventoryReport,
    ReportController.prototype.memberReport,
    ReportController.prototype.refundReport,
    ReportController.prototype.orderReport,
    ReportController.prototype.productRankingReport,
    ReportController.prototype.paymentMixReport,
    ReportController.prototype.hourlyHeatmapReport,
    ReportController.prototype.channelFunnelReport,
    ReportController.prototype.inventoryAlertReport,
    ReportController.prototype.listDefinitions,
    ReportController.prototype.getDefinition,
    ReportController.prototype.exportReport,
    ReportController.prototype.listBatchExportTasks,
    ReportController.prototype.getBatchExportTask,
    ReportController.prototype.downloadBatchExportTask,
    ReportController.prototype.cacheStats,
  ]

  const writeHandlers = [
    ReportController.prototype.createDefinition,
    ReportController.prototype.updateDefinition,
    ReportController.prototype.deleteDefinition,
    ReportController.prototype.createBatchExportTask,
    ReportController.prototype.deleteBatchExportTask,
    ReportController.prototype.invalidateCache,
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
