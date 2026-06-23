import assert from 'node:assert/strict'
import test from 'node:test'
import { CashierModule } from './cashier.module'
import { CashierController } from './cashier.controller'
import { CashierService } from './cashier.service'

test('CashierModule exposes controller, provider, export wiring', () => {
  const metadata = Reflect.getMetadata('imports', CashierModule) as unknown[] | undefined
  const controllers = Reflect.getMetadata('controllers', CashierModule) as unknown[] | undefined
  const providers = Reflect.getMetadata('providers', CashierModule) as unknown[] | undefined
  const exportsList = Reflect.getMetadata('exports', CashierModule) as unknown[] | undefined

  assert.ok(Array.isArray(metadata))
  assert.ok(controllers?.includes(CashierController))
  assert.ok(providers?.includes(CashierService))
  assert.ok(exportsList?.includes(CashierService))
})
