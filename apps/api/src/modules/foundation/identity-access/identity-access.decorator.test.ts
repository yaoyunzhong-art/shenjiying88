import 'reflect-metadata'
import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import {
  RequireRoles,
  RequirePermissions,
  RequireTenantScope,
  ROLES_METADATA_KEY,
  PERMISSIONS_METADATA_KEY,
  TENANT_SCOPE_METADATA_KEY
} from './identity-access.decorator'

/**
 * NestJS SetMetadata 将 metadata 定义在 descriptor.value 上（当 descriptor 存在时）。
 * 因此读取时必须从 descriptor.value 读取。
 */
function getMetadataFromDecorator(key: string, target: any, propertyKey: string) {
  return Reflect.getMetadata(key, target[propertyKey])
}

describe('identity-access.decorator', () => {
  describe('RequireRoles', () => {
    test('should set ROLES_METADATA_KEY on descriptor.value', () => {
      const target: Record<string, any> = {}
      const method = () => {}
      target['testMethod'] = method
      const desc: PropertyDescriptor = { value: method }
      RequireRoles('admin', 'operator')(target, 'testMethod', desc)

      const metadata = Reflect.getMetadata(ROLES_METADATA_KEY, desc.value)
      assert.deepEqual(metadata, ['admin', 'operator'])
    })

    test('should handle single role', () => {
      const target: Record<string, any> = {}
      const method = () => {}
      target['singleRole'] = method
      const desc: PropertyDescriptor = { value: method }
      RequireRoles('admin')(target, 'singleRole', desc)

      const metadata = Reflect.getMetadata(ROLES_METADATA_KEY, desc.value)
      assert.deepEqual(metadata, ['admin'])
    })

    test('should handle empty roles array', () => {
      const target: Record<string, any> = {}
      const method = () => {}
      target['noRoles'] = method
      const desc: PropertyDescriptor = { value: method }
      RequireRoles()(target, 'noRoles', desc)

      const metadata = Reflect.getMetadata(ROLES_METADATA_KEY, desc.value)
      assert.deepEqual(metadata, [])
    })
  })

  describe('RequirePermissions', () => {
    test('should set PERMISSIONS_METADATA_KEY on descriptor.value', () => {
      const target: Record<string, any> = {}
      const method = () => {}
      target['permMethod'] = method
      const desc: PropertyDescriptor = { value: method }
      RequirePermissions('read:users', 'write:users')(target, 'permMethod', desc)

      const metadata = Reflect.getMetadata(PERMISSIONS_METADATA_KEY, desc.value)
      assert.deepEqual(metadata, ['read:users', 'write:users'])
    })

    test('should handle single permission', () => {
      const target: Record<string, any> = {}
      const method = () => {}
      target['singlePerm'] = method
      const desc: PropertyDescriptor = { value: method }
      RequirePermissions('read:users')(target, 'singlePerm', desc)

      const metadata = Reflect.getMetadata(PERMISSIONS_METADATA_KEY, desc.value)
      assert.deepEqual(metadata, ['read:users'])
    })
  })

  describe('RequireTenantScope', () => {
    test('should set TENANT_SCOPE_METADATA_KEY with default empty object', () => {
      const target: Record<string, any> = {}
      const method = () => {}
      target['scopeMethod'] = method
      const desc: PropertyDescriptor = { value: method }
      RequireTenantScope()(target, 'scopeMethod', desc)

      const metadata = Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, desc.value)
      assert.deepEqual(metadata, {})
    })

    test('should set TENANT_SCOPE_METADATA_KEY with provided metadata', () => {
      const target: Record<string, any> = {}
      const method = () => {}
      target['scopedMethod'] = method
      const desc: PropertyDescriptor = { value: method }
      const scopeMeta = { tenantIdParam: 'tenantId', brandIdParam: 'brandId' }
      RequireTenantScope(scopeMeta)(target, 'scopedMethod', desc)

      const metadata = Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, desc.value)
      assert.deepEqual(metadata, scopeMeta)
    })

    test('should set TENANT_SCOPE_METADATA_KEY with full metadata', () => {
      const target: Record<string, any> = {}
      const method = () => {}
      target['fullScope'] = method
      const desc: PropertyDescriptor = { value: method }
      const scopeMeta = {
        tenantIdParam: 'tId',
        brandIdParam: 'bId',
        storeIdParam: 'sId',
        useRequestTenant: true
      }
      RequireTenantScope(scopeMeta)(target, 'fullScope', desc)

      const metadata: any = Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, desc.value)
      assert.equal(metadata.tenantIdParam, 'tId')
      assert.equal(metadata.brandIdParam, 'bId')
      assert.equal(metadata.storeIdParam, 'sId')
      assert.equal(metadata.useRequestTenant, true)
    })
  })

  describe('metadata key constants', () => {
    test('ROLES_METADATA_KEY should be identity-access:roles', () => {
      assert.equal(ROLES_METADATA_KEY, 'identity-access:roles')
    })

    test('PERMISSIONS_METADATA_KEY should be identity-access:permissions', () => {
      assert.equal(PERMISSIONS_METADATA_KEY, 'identity-access:permissions')
    })

    test('TENANT_SCOPE_METADATA_KEY should be identity-access:tenant-scope', () => {
      assert.equal(TENANT_SCOPE_METADATA_KEY, 'identity-access:tenant-scope')
    })
  })
})
