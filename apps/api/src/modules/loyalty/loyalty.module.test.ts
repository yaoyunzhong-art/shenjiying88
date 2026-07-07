import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import assert from 'node:assert/strict'
import { MarketingMetricsModule } from '../marketing-metrics/marketing-metrics.module'
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
