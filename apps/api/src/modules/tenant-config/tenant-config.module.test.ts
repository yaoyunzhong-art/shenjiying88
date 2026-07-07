import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [tenant-config] [D] module 补全
 *
 * TenantConfig Module 集成测试
 */
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { TenantConfigModule } from './tenant-config.module'
import { TenantConfigController } from './tenant-config.controller'
import { TenantConfigService } from './tenant-config.service'

it('TenantConfigModule exposes controller, providers, and exports', () => {
  const controllers = Reflect.getMetadata('controllers', TenantConfigModule) as unknown[] | undefined
  const providers = Reflect.getMetadata('providers', TenantConfigModule) as unknown[] | undefined
  const exportsList = Reflect.getMetadata('exports', TenantConfigModule) as unknown[] | undefined

  assert.ok(Array.isArray(controllers), 'controllers should be an array')
  assert.ok(Array.isArray(providers), 'providers should be an array')
  assert.ok(Array.isArray(exportsList), 'exports should be an array')

  assert.ok(controllers?.includes(TenantConfigController), 'TenantConfigController should be registered')
  assert.ok(providers?.includes(TenantConfigService), 'TenantConfigService should be a provider')
  assert.ok(exportsList?.includes(TenantConfigService), 'TenantConfigService should be exported')
})

it('TenantConfigModule has exactly 1 controller and 1 provider', () => {
  const controllers = Reflect.getMetadata('controllers', TenantConfigModule) as unknown[]
  const providers = Reflect.getMetadata('providers', TenantConfigModule) as unknown[]
  assert.equal(controllers.length, 1, `Expected 1 controller, got ${controllers.length}`)
  assert.equal(providers.length, 1, `Expected 1 provider, got ${providers.length}`)
})

it('TenantConfigModule is Global (can be used anywhere)', () => {
  const isGlobal = Reflect.getMetadata('__module:global__', TenantConfigModule)
  assert.equal(isGlobal, true, 'TenantConfigModule should be decorated with @Global()')
})
