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
import { TenantConfigRepository } from './tenant-config.repository'

it('TenantConfigModule exposes controller, providers, and exports', () => {
  const controllers = Reflect.getMetadata('controllers', TenantConfigModule) as unknown[] | undefined
  const providers = Reflect.getMetadata('providers', TenantConfigModule) as unknown[] | undefined
  const exportsList = Reflect.getMetadata('exports', TenantConfigModule) as unknown[] | undefined

  assert.ok(Array.isArray(controllers), 'controllers should be an array')
  assert.ok(Array.isArray(providers), 'providers should be an array')
  assert.ok(Array.isArray(exportsList), 'exports should be an array')

  assert.ok(controllers?.includes(TenantConfigController), 'TenantConfigController should be registered')
  assert.ok(providers?.includes(TenantConfigService), 'TenantConfigService should be a provider')
  assert.ok(providers?.includes(TenantConfigRepository), 'TenantConfigRepository should be a provider (P0-A1)')
  assert.ok(exportsList?.includes(TenantConfigService), 'TenantConfigService should be exported')
  assert.ok(exportsList?.includes(TenantConfigRepository), 'TenantConfigRepository should be exported (P0-A1)')
})

it('TenantConfigModule has exactly 1 controller and 2 providers (P0-A1 added repository)', () => {
  const controllers = Reflect.getMetadata('controllers', TenantConfigModule) as unknown[]
  const providers = Reflect.getMetadata('providers', TenantConfigModule) as unknown[]
  assert.equal(controllers.length, 1, `Expected 1 controller, got ${controllers.length}`)
  // P0-A1 修复: 增加 TenantConfigRepository 作为 provider (Prisma 持久化)
  assert.equal(providers.length, 2, `Expected 2 providers (Service + Repository), got ${providers.length}`)
})

it('TenantConfigModule is NOT @Global (P0-A4: 业务模块不应全局共享)', () => {
  const isGlobal = Reflect.getMetadata('__module:global__', TenantConfigModule)
  assert.notEqual(isGlobal, true, 'TenantConfigModule should NOT be decorated with @Global() (P0-A4 fix)')
})
