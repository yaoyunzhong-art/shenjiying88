import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { AnalyticsController } from './analytics.controller'
import {
  PERMISSIONS_METADATA_KEY,
  TENANT_SCOPE_METADATA_KEY,
} from '../foundation/identity-access/identity-access.decorator'
import { IS_PUBLIC_KEY } from '../foundation/identity-access/public.decorator'

const resolvePermissions = (handler: Function) =>
  Reflect.getMetadata(PERMISSIONS_METADATA_KEY, handler) ??
  Reflect.getMetadata(PERMISSIONS_METADATA_KEY, AnalyticsController)

const resolveTenantScope = (handler: Function) =>
  Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, handler) ??
  Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, AnalyticsController)

describe('AnalyticsController metadata', () => {
  const handlers = [
    AnalyticsController.prototype.getOperationSnapshot,
    AnalyticsController.prototype.getDiagnostics,
    AnalyticsController.prototype.getRecommendations,
  ]

  it('controller should no longer stay public', () => {
    assert.equal(Reflect.getMetadata(IS_PUBLIC_KEY, AnalyticsController), undefined)
  })

  it('all routes should require tenant scope', () => {
    handlers.forEach((handler) => {
      assert.deepEqual(resolveTenantScope(handler), {})
    })
  })

  it('all routes should reuse report:read', () => {
    handlers.forEach((handler) => {
      assert.deepEqual(resolvePermissions(handler), ['report:read'])
    })
  })
})
