import 'reflect-metadata'
import assert from 'node:assert/strict'
import test from 'node:test'
import { IdentityAccessController } from './identity-access.controller'

test('identity-access controller path metadata is set', () => {
  const path = Reflect.getMetadata('path', IdentityAccessController)
  assert.equal(path, 'identity-access')
})

test('identity-access controller getContext route has GET metadata', () => {
  const method = Reflect.getMetadata('method', IdentityAccessController.prototype.getContext)
  const path = Reflect.getMetadata('path', IdentityAccessController.prototype.getContext)

  assert.equal(method, 0) // GET = 0 in RequestMethod enum
  assert.equal(path, 'context')
})

test('identity-access controller validateRole route has GET metadata', () => {
  const method = Reflect.getMetadata('method', IdentityAccessController.prototype.validateRole)
  const path = Reflect.getMetadata('path', IdentityAccessController.prototype.validateRole)

  assert.equal(method, 0)
  assert.equal(path, 'validate/role')
})

test('identity-access controller validatePermission route has GET metadata', () => {
  const method = Reflect.getMetadata('method', IdentityAccessController.prototype.validatePermission)
  const path = Reflect.getMetadata('path', IdentityAccessController.prototype.validatePermission)

  assert.equal(method, 0)
  assert.equal(path, 'validate/permission')
})

test('identity-access controller validateTenantScope route has GET metadata', () => {
  const method = Reflect.getMetadata('method', IdentityAccessController.prototype.validateTenantScope)
  const path = Reflect.getMetadata('path', IdentityAccessController.prototype.validateTenantScope)

  assert.equal(method, 0)
  assert.equal(path, 'validate/tenant/:tenantId')
})
