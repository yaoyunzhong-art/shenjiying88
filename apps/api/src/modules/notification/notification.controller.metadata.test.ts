import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { NotificationController } from './notification.controller'
import {
  PERMISSIONS_METADATA_KEY,
  TENANT_SCOPE_METADATA_KEY,
} from '../foundation/identity-access/identity-access.decorator'
import { IS_PUBLIC_KEY } from '../foundation/identity-access/public.decorator'

const resolvePermissions = (handler: Function) =>
  Reflect.getMetadata(PERMISSIONS_METADATA_KEY, handler)
  ?? Reflect.getMetadata(PERMISSIONS_METADATA_KEY, NotificationController)

const resolveTenantScope = (handler: Function) =>
  Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, handler)
  ?? Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, NotificationController)

describe('NotificationController metadata', () => {
  const readHandlers = [
    NotificationController.prototype.listTemplates,
    NotificationController.prototype.getTemplate,
    NotificationController.prototype.listDispatches,
    NotificationController.prototype.getDispatch,
  ]

  const writeHandlers = [
    NotificationController.prototype.registerTemplate,
    NotificationController.prototype.updateTemplate,
    NotificationController.prototype.send,
    NotificationController.prototype.retryDispatch,
    NotificationController.prototype.cancelDispatch,
  ]

  it('controller should no longer stay public', () => {
    assert.equal(Reflect.getMetadata(IS_PUBLIC_KEY, NotificationController), undefined)
  })

  it('all routes should require tenant scope', () => {
    ;[...readHandlers, ...writeHandlers].forEach((handler) => {
      assert.deepEqual(resolveTenantScope(handler), {})
    })
  })

  it('read routes should reuse notification:read', () => {
    readHandlers.forEach((handler) => {
      assert.deepEqual(resolvePermissions(handler), ['notification:read'])
    })
  })

  it('write routes should reuse notification:write', () => {
    writeHandlers.forEach((handler) => {
      assert.deepEqual(resolvePermissions(handler), ['notification:write'])
    })
  })
})
