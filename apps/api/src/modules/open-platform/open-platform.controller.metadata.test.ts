import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { OpenPlatformController } from './open-platform.controller'
import {
  PERMISSIONS_METADATA_KEY,
  TENANT_SCOPE_METADATA_KEY,
} from '../foundation/identity-access/identity-access.decorator'

const resolvePermissions = (handler: Function) =>
  Reflect.getMetadata(PERMISSIONS_METADATA_KEY, handler)
  ?? Reflect.getMetadata(PERMISSIONS_METADATA_KEY, OpenPlatformController)

const resolveTenantScope = (handler: Function) =>
  Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, handler)
  ?? Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, OpenPlatformController)

describe('OpenPlatformController metadata', () => {
  const readHandlers = [
    OpenPlatformController.prototype.getDeveloper,
    OpenPlatformController.prototype.listDevelopers,
    OpenPlatformController.prototype.listApps,
    OpenPlatformController.prototype.getApp,
    OpenPlatformController.prototype.getUsage,
    OpenPlatformController.prototype.getSla,
    OpenPlatformController.prototype.listApiVersions,
    OpenPlatformController.prototype.listSdks,
    OpenPlatformController.prototype.listMarketplace,
  ]

  const writeHandlers = [
    OpenPlatformController.prototype.registerDeveloper,
    OpenPlatformController.prototype.registerApp,
    OpenPlatformController.prototype.updateAppStatus,
    OpenPlatformController.prototype.generateKey,
    OpenPlatformController.prototype.rotateKey,
    OpenPlatformController.prototype.revokeKey,
    OpenPlatformController.prototype.recordCall,
    OpenPlatformController.prototype.generateBilling,
    OpenPlatformController.prototype.settleBilling,
    OpenPlatformController.prototype.createSla,
    OpenPlatformController.prototype.registerApiVersion,
    OpenPlatformController.prototype.deprecateVersion,
    OpenPlatformController.prototype.publishSdk,
    OpenPlatformController.prototype.publishToMarket,
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
