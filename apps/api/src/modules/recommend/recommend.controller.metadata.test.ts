import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { RecommendController } from './recommend.controller'
import {
  PERMISSIONS_METADATA_KEY,
  TENANT_SCOPE_METADATA_KEY,
} from '../foundation/identity-access/identity-access.decorator'
import { IS_PUBLIC_KEY } from '../foundation/identity-access/public.decorator'

const resolvePermissions = (handler: Function) =>
  Reflect.getMetadata(PERMISSIONS_METADATA_KEY, handler)
  ?? Reflect.getMetadata(PERMISSIONS_METADATA_KEY, RecommendController)

const resolveTenantScope = (handler: Function) =>
  Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, handler)
  ?? Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, RecommendController)

describe('RecommendController metadata', () => {
  const readHandlers = [
    RecommendController.prototype.recommend,
    RecommendController.prototype.similar,
    RecommendController.prototype.cacheStats,
    RecommendController.prototype.health,
  ]

  const writeHandlers = [
    RecommendController.prototype.trackView,
    RecommendController.prototype.trackPurchase,
    RecommendController.prototype.updatePreferences,
    RecommendController.prototype.invalidateCache,
  ]

  it('controller should no longer stay public', () => {
    assert.equal(Reflect.getMetadata(IS_PUBLIC_KEY, RecommendController), undefined)
  })

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
