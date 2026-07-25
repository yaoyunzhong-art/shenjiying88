import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { MonitoringController } from './monitoring.controller'
import {
  PERMISSIONS_METADATA_KEY,
  TENANT_SCOPE_METADATA_KEY,
} from '../foundation/identity-access/identity-access.decorator'

const resolvePermissions = (handler: Function) =>
  Reflect.getMetadata(PERMISSIONS_METADATA_KEY, handler)
  ?? Reflect.getMetadata(PERMISSIONS_METADATA_KEY, MonitoringController)

const resolveTenantScope = (handler: Function) =>
  Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, handler)
  ?? Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, MonitoringController)

describe('MonitoringController metadata', () => {
  const readHandlers = [
    MonitoringController.prototype.listMetrics,
    MonitoringController.prototype.getMetric,
    MonitoringController.prototype.listRules,
    MonitoringController.prototype.listAlerts,
    MonitoringController.prototype.auditLogs,
  ]

  const writeHandlers = [
    MonitoringController.prototype.record,
    MonitoringController.prototype.recordBatch,
    MonitoringController.prototype.createRule,
    MonitoringController.prototype.updateRule,
    MonitoringController.prototype.silence,
  ]

  it('all routes should require tenant scope', () => {
    ;[...readHandlers, ...writeHandlers].forEach((handler) => {
      assert.deepEqual(resolveTenantScope(handler), {})
    })
  })

  it('read routes should reuse foundation.governance.read', () => {
    readHandlers.forEach((handler) => {
      assert.deepEqual(resolvePermissions(handler), ['foundation.governance.read'])
    })
  })

  it('write routes should reuse foundation.governance.write', () => {
    writeHandlers.forEach((handler) => {
      assert.deepEqual(resolvePermissions(handler), ['foundation.governance.write'])
    })
  })
})
