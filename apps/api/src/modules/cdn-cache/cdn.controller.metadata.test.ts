import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { CdnCacheController } from './cdn.controller'
import {
  PERMISSIONS_METADATA_KEY,
  TENANT_SCOPE_METADATA_KEY,
} from '../foundation/identity-access/identity-access.decorator'
import { IS_PUBLIC_KEY } from '../foundation/identity-access/public.decorator'

const resolvePermissions = (handler: Function) =>
  Reflect.getMetadata(PERMISSIONS_METADATA_KEY, handler)
  ?? Reflect.getMetadata(PERMISSIONS_METADATA_KEY, CdnCacheController)

describe('CdnCacheController metadata', () => {
  const readHandlers = [
    CdnCacheController.prototype.listRules,
    CdnCacheController.prototype.getRule,
    CdnCacheController.prototype.match,
    CdnCacheController.prototype.listNodes,
    CdnCacheController.prototype.nodeStats,
    CdnCacheController.prototype.listInvalidations,
  ]

  const writeHandlers = [
    CdnCacheController.prototype.createRule,
    CdnCacheController.prototype.updateRule,
    CdnCacheController.prototype.deleteRule,
    CdnCacheController.prototype.addNode,
    CdnCacheController.prototype.removeNode,
    CdnCacheController.prototype.invalidate,
  ]

  it('controller should keep cdn path and stay non-public', () => {
    assert.equal(Reflect.getMetadata('path', CdnCacheController), 'cdn')
    assert.equal(Reflect.getMetadata(IS_PUBLIC_KEY, CdnCacheController), undefined)
    assert.deepEqual(Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, CdnCacheController), {})
    assert.deepEqual(Reflect.getMetadata(PERMISSIONS_METADATA_KEY, CdnCacheController), ['foundation.governance.read'])
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [CdnCacheController.prototype.createRule, 1, 'rules'],
      [CdnCacheController.prototype.listRules, 0, 'rules'],
      [CdnCacheController.prototype.getRule, 0, 'rules/:id'],
      [CdnCacheController.prototype.updateRule, 4, 'rules/:id'],
      [CdnCacheController.prototype.deleteRule, 3, 'rules/:id'],
      [CdnCacheController.prototype.match, 0, 'match'],
      [CdnCacheController.prototype.addNode, 1, 'nodes'],
      [CdnCacheController.prototype.listNodes, 0, 'nodes'],
      [CdnCacheController.prototype.nodeStats, 0, 'nodes/stats'],
      [CdnCacheController.prototype.removeNode, 3, 'nodes/:id'],
      [CdnCacheController.prototype.invalidate, 1, 'invalidate'],
      [CdnCacheController.prototype.listInvalidations, 0, 'invalidate'],
    ] as const

    for (const [handler, method, path] of cases) {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    }
  })

  it('read routes should reuse governance read permission', () => {
    readHandlers.forEach((handler) => {
      assert.deepEqual(resolvePermissions(handler), ['foundation.governance.read'])
    })
  })

  it('write routes should reuse governance write permission', () => {
    writeHandlers.forEach((handler) => {
      assert.deepEqual(resolvePermissions(handler), ['foundation.governance.write'])
    })
  })
})
