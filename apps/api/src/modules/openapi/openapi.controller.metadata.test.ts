import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { OpenAPIController } from './openapi.controller'
import {
  PERMISSIONS_METADATA_KEY,
  TENANT_SCOPE_METADATA_KEY,
} from '../foundation/identity-access/identity-access.decorator'

const resolvePermissions = (handler: Function) =>
  Reflect.getMetadata(PERMISSIONS_METADATA_KEY, handler)
  ?? Reflect.getMetadata(PERMISSIONS_METADATA_KEY, OpenAPIController)

const resolveTenantScope = (handler: Function) =>
  Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, handler)
  ?? Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, OpenAPIController)

describe('OpenAPIController metadata', () => {
  const readHandlers = [
    OpenAPIController.prototype.getDocs,
    OpenAPIController.prototype.listKeysV2,
    OpenAPIController.prototype.getUsageV2,
    OpenAPIController.prototype.listKeys,
    OpenAPIController.prototype.keyStats,
    OpenAPIController.prototype.getKey,
    OpenAPIController.prototype.listWebhooks,
    OpenAPIController.prototype.listDeliveries,
    OpenAPIController.prototype.deadLetter,
    OpenAPIController.prototype.webhookStats,
    OpenAPIController.prototype.listSandboxes,
    OpenAPIController.prototype.checkSandbox,
    OpenAPIController.prototype.usageReport,
    OpenAPIController.prototype.listBuckets,
  ]

  const writeHandlers = [
    OpenAPIController.prototype.createKeyV2,
    OpenAPIController.prototype.deleteKeyV2,
    OpenAPIController.prototype.createKey,
    OpenAPIController.prototype.revokeKey,
    OpenAPIController.prototype.subscribe,
    OpenAPIController.prototype.pauseWebhook,
    OpenAPIController.prototype.resumeWebhook,
    OpenAPIController.prototype.dispatchWebhook,
    OpenAPIController.prototype.retryDelivery,
    OpenAPIController.prototype.createSandbox,
    OpenAPIController.prototype.setSandboxStatus,
    OpenAPIController.prototype.cleanupSandbox,
    OpenAPIController.prototype.createBucket,
    OpenAPIController.prototype.checkUsage,
    OpenAPIController.prototype.verifySignature,
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
