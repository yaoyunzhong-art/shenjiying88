import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import {
  PERMISSIONS_METADATA_KEY,
  ROLES_METADATA_KEY,
  TENANT_SCOPE_METADATA_KEY,
} from '../foundation/identity-access/identity-access.decorator'
import { IS_PUBLIC_KEY } from '../foundation/identity-access/public.decorator'
import { TENANT_OPTIONAL_KEY } from '../agent/tenant-guard.decorator'
import { HealthController } from './health.controller'

describe('HealthController metadata', () => {
  const publicHandlers = [
    [HealthController.prototype.getHealth, 0, '/'],
    [HealthController.prototype.getBackupStatus, 0, 'backup'],
    [HealthController.prototype.triggerBackup, 0, 'backup/trigger'],
    [HealthController.prototype.getPing, 0, 'ping'],
  ] as const

  it('controller should keep health path', () => {
    assert.equal(Reflect.getMetadata('path', HealthController), 'health')
  })

  it('public probe routes should keep REST metadata and stay tenant-optional', () => {
    publicHandlers.forEach(([handler, method, path]) => {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
      assert.equal(Reflect.getMetadata(IS_PUBLIC_KEY, handler), true)
      assert.equal(Reflect.getMetadata(TENANT_OPTIONAL_KEY, handler), true)
    })
  })

  it('readiness route should keep protection metadata', () => {
    const handler = HealthController.prototype.getReadiness
    assert.equal(Reflect.getMetadata('method', handler), 0)
    assert.equal(Reflect.getMetadata('path', handler), 'readiness')
    assert.equal(Reflect.getMetadata(IS_PUBLIC_KEY, handler), undefined)
    assert.equal(Reflect.getMetadata(TENANT_OPTIONAL_KEY, handler), undefined)
    assert.deepEqual(Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, handler), {})
    assert.deepEqual(Reflect.getMetadata(ROLES_METADATA_KEY, handler), [
      'SUPER_ADMIN',
      'TENANT_ADMIN',
      'OPERATIONS',
      'SECURITY_ADMIN',
    ])
    assert.deepEqual(Reflect.getMetadata(PERMISSIONS_METADATA_KEY, handler), [
      'foundation.governance.read',
    ])
  })
})
