import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { SecurityController } from './security.controller'
import {
  PERMISSIONS_METADATA_KEY,
  TENANT_SCOPE_METADATA_KEY,
} from '../foundation/identity-access/identity-access.decorator'

const resolvePermissions = (handler: Function) =>
  Reflect.getMetadata(PERMISSIONS_METADATA_KEY, handler)
  ?? Reflect.getMetadata(PERMISSIONS_METADATA_KEY, SecurityController)

const resolveTenantScope = (handler: Function) =>
  Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, handler)
  ?? Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, SecurityController)

describe('SecurityController metadata', () => {
  const readHandlers = [
    SecurityController.prototype.listWAFRules,
    SecurityController.prototype.getWAFLogs,
  ]

  const writeHandlers = [
    SecurityController.prototype.scan,
    SecurityController.prototype.batchScan,
    SecurityController.prototype.detectSensitiveData,
    SecurityController.prototype.detectJWTWeakSecret,
    SecurityController.prototype.detectIDOR,
    SecurityController.prototype.detectMissingRateLimit,
    SecurityController.prototype.generateReport,
    SecurityController.prototype.exportJSONReport,
    SecurityController.prototype.createWAFRule,
    SecurityController.prototype.updateWAFRule,
    SecurityController.prototype.deleteWAFRule,
    SecurityController.prototype.evaluateWAF,
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
