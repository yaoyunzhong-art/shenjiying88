import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { SessionController } from './session.controller'
import {
  PERMISSIONS_METADATA_KEY,
  TENANT_SCOPE_METADATA_KEY,
} from '../foundation/identity-access/identity-access.decorator'

const resolvePermissions = (handler: Function) =>
  Reflect.getMetadata(PERMISSIONS_METADATA_KEY, handler)
  ?? Reflect.getMetadata(PERMISSIONS_METADATA_KEY, SessionController)

const resolveTenantScope = (handler: Function) =>
  Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, handler)
  ?? Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, SessionController)

describe('SessionController metadata', () => {
  const readHandlers = [
    SessionController.prototype.validateSession,
    SessionController.prototype.getUserSessions,
    SessionController.prototype.getSession,
  ]

  const writeHandlers = [
    SessionController.prototype.createSession,
    SessionController.prototype.revokeSession,
    SessionController.prototype.revokeAllUserSessions,
    SessionController.prototype.deleteSession,
  ]

  it('all routes should require tenant scope', () => {
    ;[...readHandlers, ...writeHandlers].forEach((handler) => {
      assert.deepEqual(resolveTenantScope(handler), {})
    })
  })

  it('read routes should reuse identity-access:read', () => {
    readHandlers.forEach((handler) => {
      assert.deepEqual(resolvePermissions(handler), ['identity-access:read'])
    })
  })

  it('write routes should reuse identity-access:write', () => {
    writeHandlers.forEach((handler) => {
      assert.deepEqual(resolvePermissions(handler), ['identity-access:write'])
    })
  })
})
