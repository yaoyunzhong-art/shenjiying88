import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [saas-advanced] [A] module.test 补全
 *
 * 验证 SaasAdvancedModule 导入/导出/依赖结构
 */

import assert from 'node:assert/strict'
import { SaasAdvancedModule } from './saas-advanced.module'
import { CustomDomainService } from './custom-domain.service'
import { CustomDomainController } from './custom-domain.controller'
import { SsoService } from './sso.service'
import { SsoController } from './sso.controller'

describe('SaasAdvancedModule', () => {
  it('should be defined', () => {
    assert.ok(SaasAdvancedModule)
  })

  it('should export CustomDomainService', () => {
    const exports = Reflect.getMetadata('exports', SaasAdvancedModule) ?? []
    assert.ok(exports.includes(CustomDomainService))
  })

  it('should export SsoService', () => {
    const exports = Reflect.getMetadata('exports', SaasAdvancedModule) ?? []
    assert.ok(exports.includes(SsoService))
  })

  it('should have CustomDomainController in controllers', () => {
    const controllers = Reflect.getMetadata('controllers', SaasAdvancedModule) ?? []
    assert.ok(controllers.includes(CustomDomainController))
  })

  it('should have SsoController in controllers', () => {
    const controllers = Reflect.getMetadata('controllers', SaasAdvancedModule) ?? []
    assert.ok(controllers.includes(SsoController))
  })

  it('should have CustomDomainService in providers', () => {
    const providers = Reflect.getMetadata('providers', SaasAdvancedModule) ?? []
    assert.ok(providers.includes(CustomDomainService))
  })

  it('should have SsoService in providers', () => {
    const providers = Reflect.getMetadata('providers', SaasAdvancedModule) ?? []
    assert.ok(providers.includes(SsoService))
  })

  it('should be @Global() decorated', () => {
    const isGlobal = Reflect.getMetadata('__module:global__', SaasAdvancedModule) ?? false
    assert.ok(isGlobal)
  })
})
