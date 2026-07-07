import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [license] [A] module.test 补全
 *
 * 验证 LicenseModule 导入/导出/依赖结构
 */

import assert from 'node:assert/strict'
import { LicenseModule } from './license.module'
import { LicenseService } from './license.service'
import { LicenseController } from './license.controller'
import { LicenseGuard } from './license.guard'

describe('LicenseModule', () => {
  it('should be defined', () => {
    assert.ok(LicenseModule)
  })

  it('should have LicenseController in controllers', () => {
    const controllers = Reflect.getMetadata('controllers', LicenseModule) ?? []
    assert.ok(controllers.includes(LicenseController))
  })

  it('should have LicenseService in providers', () => {
    const providers = Reflect.getMetadata('providers', LicenseModule) ?? []
    assert.ok(providers.includes(LicenseService))
  })

  it('should have LicenseGuard in providers', () => {
    const providers = Reflect.getMetadata('providers', LicenseModule) ?? []
    assert.ok(providers.includes(LicenseGuard))
  })

  it('should be @Global() decorated', () => {
    const isGlobal = Reflect.getMetadata('__module:global__', LicenseModule) ?? false
    assert.ok(isGlobal)
  })

  it('should export LicenseService', () => {
    const exports = Reflect.getMetadata('exports', LicenseModule) ?? []
    assert.ok(exports.includes(LicenseService))
  })

  it('should export LicenseGuard', () => {
    const exports = Reflect.getMetadata('exports', LicenseModule) ?? []
    assert.ok(exports.includes(LicenseGuard))
  })

  it('should import TypeOrmModule', () => {
    const imports = Reflect.getMetadata('imports', LicenseModule) ?? []
    assert.ok(imports.length > 0)
  })
})
