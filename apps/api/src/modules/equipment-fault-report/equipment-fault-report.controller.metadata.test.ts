import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { EquipmentFaultReportController } from './equipment-fault-report.controller'
import {
  PERMISSIONS_METADATA_KEY,
  TENANT_SCOPE_METADATA_KEY,
} from '../foundation/identity-access/identity-access.decorator'

const resolvePermissions = (handler: Function) =>
  Reflect.getMetadata(PERMISSIONS_METADATA_KEY, handler)
  ?? Reflect.getMetadata(PERMISSIONS_METADATA_KEY, EquipmentFaultReportController)

const resolveTenantScope = (handler: Function) =>
  Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, handler)
  ?? Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, EquipmentFaultReportController)

describe('EquipmentFaultReportController metadata', () => {
  const readHandlers = [
    EquipmentFaultReportController.prototype.list,
    EquipmentFaultReportController.prototype.summary,
    EquipmentFaultReportController.prototype.getById,
  ]

  const writeHandlers = [
    EquipmentFaultReportController.prototype.create,
    EquipmentFaultReportController.prototype.delete,
  ]

  it('all routes should require tenant scope', () => {
    ;[...readHandlers, ...writeHandlers].forEach((handler) => {
      assert.deepEqual(resolveTenantScope(handler), {})
    })
  })

  it('read routes should reuse equipment:read', () => {
    readHandlers.forEach((handler) => {
      assert.deepEqual(resolvePermissions(handler), ['equipment:read'])
    })
  })

  it('write routes should reuse store:update', () => {
    writeHandlers.forEach((handler) => {
      assert.deepEqual(resolvePermissions(handler), ['store:update'])
    })
  })
})
