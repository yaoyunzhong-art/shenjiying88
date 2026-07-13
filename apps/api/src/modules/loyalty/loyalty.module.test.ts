import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import assert from 'node:assert/strict'
import { MarketingMetricsModule } from '../marketing-metrics/marketing-metrics.module'
import { MemberModule } from '../member/member.module'
import { LoyaltyController } from './loyalty.controller'
import { LoyaltyModule } from './loyalty.module'
import { LoyaltyService } from './loyalty.service'

it('LoyaltyModule exposes controller, provider, export wiring', () => {
  const imports = Reflect.getMetadata('imports', LoyaltyModule) as unknown[] | undefined
  const controllers = Reflect.getMetadata('controllers', LoyaltyModule) as unknown[] | undefined
  const providers = Reflect.getMetadata('providers', LoyaltyModule) as unknown[] | undefined
  const exportsList = Reflect.getMetadata('exports', LoyaltyModule) as unknown[] | undefined

  assert.ok(Array.isArray(imports))
  assert.ok(imports?.includes(MarketingMetricsModule))
  assert.ok(controllers?.includes(LoyaltyController))
  assert.ok(providers?.includes(LoyaltyService))
  assert.ok(exportsList?.includes(LoyaltyService))
})

it('LoyaltyModule imports MemberModule alongside MarketingMetricsModule', () => {
  const imports = Reflect.getMetadata('imports', LoyaltyModule) as unknown[] | undefined

  assert.ok(Array.isArray(imports))
  assert.ok(imports.includes(MemberModule), 'should import MemberModule')
  assert.equal(imports.length, 2, 'exactly two imports')
})

it('LoyaltyModule controller list contains only LoyaltyController', () => {
  const controllers = Reflect.getMetadata('controllers', LoyaltyModule) as unknown[] | undefined

  assert.ok(Array.isArray(controllers))
  assert.equal(controllers.length, 1, 'single controller')
  assert.equal(controllers[0], LoyaltyController)
})

it('LoyaltyModule provider list contains only LoyaltyService', () => {
  const providers = Reflect.getMetadata('providers', LoyaltyModule) as unknown[] | undefined

  assert.ok(Array.isArray(providers))
  assert.equal(providers.length, 1, 'single provider')
  assert.equal(providers[0], LoyaltyService)
})

it('LoyaltyModule exports LoyaltyService but not MarketingMetricsModule', () => {
  const exportsList = Reflect.getMetadata('exports', LoyaltyModule) as unknown[] | undefined

  assert.ok(Array.isArray(exportsList))
  assert.ok(exportsList.includes(LoyaltyService))
  assert.ok(!exportsList.includes(MarketingMetricsModule), 'should not export other modules')
})

it('LoyaltyModule is a NestJS @Module decorated class', () => {
  assert.equal(typeof LoyaltyModule, 'function')
  const instance = new LoyaltyModule()
  assert.equal(instance.constructor, LoyaltyModule)
})
