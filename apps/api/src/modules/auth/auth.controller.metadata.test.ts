import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { AuthController } from './auth.controller'
import { TENANT_OPTIONAL_KEY } from '../agent/tenant-guard.decorator'
import { IS_PUBLIC_KEY } from '../foundation/identity-access/public.decorator'

describe('AuthController metadata', () => {
  const publicHandlers = [
    AuthController.prototype.loginBySms,
    AuthController.prototype.loginByPassword,
    AuthController.prototype.loginByWechat,
    AuthController.prototype.refreshToken,
    AuthController.prototype.logout,
    AuthController.prototype.getCurrentUser,
  ]

  it('controller should not stay public', () => {
    assert.equal(Reflect.getMetadata(IS_PUBLIC_KEY, AuthController), undefined)
  })

  it('public auth routes should allow skipping tenant guard', () => {
    publicHandlers.forEach((handler) => {
      assert.equal(Reflect.getMetadata(IS_PUBLIC_KEY, handler), true)
      assert.equal(Reflect.getMetadata(TENANT_OPTIONAL_KEY, handler), true)
    })
  })
})
