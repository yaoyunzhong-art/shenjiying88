import assert from 'node:assert/strict'
import test from 'node:test'
import { LoyaltyController } from './loyalty.controller'
import { LoyaltyModule } from './loyalty.module'
import { LoyaltyService } from './loyalty.service'

test('LoyaltyModule exposes controller, provider, export wiring', () => {
  const controllers = Reflect.getMetadata('controllers', LoyaltyModule) as unknown[] | undefined
  const providers = Reflect.getMetadata('providers', LoyaltyModule) as unknown[] | undefined
  const exportsList = Reflect.getMetadata('exports', LoyaltyModule) as unknown[] | undefined

  assert.ok(controllers?.includes(LoyaltyController))
  assert.ok(providers?.includes(LoyaltyService))
  assert.ok(exportsList?.includes(LoyaltyService))
})
