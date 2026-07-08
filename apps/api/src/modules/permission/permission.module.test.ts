import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
/**
 * 🐜 自动: [permission] [A] module.test 补全
 *
 * 验证 PermissionModule 导入/导出/依赖结构
 */

import assert from 'node:assert/strict'
import { PermissionModule } from './permission.module'
import { PermissionService } from './permission.service'
import { RbacService } from './rbac.service'
import { DataScopeService } from './data-scope.service'
import { PermissionController } from './permission.controller'

describe('PermissionModule', () => {
  it('should be defined', () => {
    assert.ok(PermissionModule)
  })

  it('should have PermissionController in controllers', () => {
    const controllers = Reflect.getMetadata('controllers', PermissionModule) ?? []
    assert.ok(controllers.includes(PermissionController))
  })

  it('should have PermissionService in providers', () => {
    const providers = Reflect.getMetadata('providers', PermissionModule) ?? []
    assert.ok(providers.includes(PermissionService))
  })

  it('should have RbacService in providers', () => {
    const providers = Reflect.getMetadata('providers', PermissionModule) ?? []
    assert.ok(providers.includes(RbacService))
  })

  it('should have DataScopeService in providers', () => {
    const providers = Reflect.getMetadata('providers', PermissionModule) ?? []
    assert.ok(providers.includes(DataScopeService))
  })

  it('should export PermissionService', () => {
    const exports = Reflect.getMetadata('exports', PermissionModule) ?? []
    assert.ok(exports.includes(PermissionService))
  })

  it('should export RbacService', () => {
    const exports = Reflect.getMetadata('exports', PermissionModule) ?? []
    assert.ok(exports.includes(RbacService))
  })

  it('should export DataScopeService', () => {
    const exports = Reflect.getMetadata('exports', PermissionModule) ?? []
    assert.ok(exports.includes(DataScopeService))
  })

  it('should have no imports (standalone module)', () => {
    const imports = Reflect.getMetadata('imports', PermissionModule) ?? []
    assert.equal(imports.length, 0)
  })

  it('should not be @Global() decorated', () => {
    const isGlobal = Reflect.getMetadata('__module:global__', PermissionModule) ?? false
    assert.ok(!isGlobal)
  })
})
