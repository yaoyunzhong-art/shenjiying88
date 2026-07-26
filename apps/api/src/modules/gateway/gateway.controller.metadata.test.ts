import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { GatewayController } from './gateway.controller'
import {
  PERMISSIONS_METADATA_KEY,
  TENANT_SCOPE_METADATA_KEY,
} from '../foundation/identity-access/identity-access.decorator'

const resolvePermissions = (handler: Function) =>
  Reflect.getMetadata(PERMISSIONS_METADATA_KEY, handler)
  ?? Reflect.getMetadata(PERMISSIONS_METADATA_KEY, GatewayController)

const resolveTenantScope = (handler: Function) =>
  Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, handler)
  ?? Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, GatewayController)

describe('GatewayController metadata', () => {
  const readHandlers = [
    GatewayController.prototype.routeLookup,
    GatewayController.prototype.authenticate,
    GatewayController.prototype.checkRateLimit,
    GatewayController.prototype.getQuotaStatus,
    GatewayController.prototype.listApiKeys,
    GatewayController.prototype.getRequestLogs,
    GatewayController.prototype.getAnalyticsSummary,
    GatewayController.prototype.getEndpointAnalytics,
    GatewayController.prototype.getClientAnalytics,
    GatewayController.prototype.getTimeSeries,
    GatewayController.prototype.detectAnomalies,
  ]

  const writeHandlers = [
    GatewayController.prototype.consumeToken,
    GatewayController.prototype.setQuota,
    GatewayController.prototype.createApiKey,
    GatewayController.prototype.revokeApiKey,
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
