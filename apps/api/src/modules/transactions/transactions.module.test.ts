import assert from 'node:assert/strict'
import test from 'node:test'
import { TransactionsModule } from './transactions.module'
import { TransactionsController } from './transactions.controller'
import { TransactionsService } from './transactions.service'

test('TransactionsModule exposes controller, provider, export wiring', () => {
  const imports = Reflect.getMetadata('imports', TransactionsModule) as unknown[] | undefined
  const controllers = Reflect.getMetadata('controllers', TransactionsModule) as unknown[] | undefined
  const providers = Reflect.getMetadata('providers', TransactionsModule) as unknown[] | undefined
  const exportsList = Reflect.getMetadata('exports', TransactionsModule) as unknown[] | undefined

  assert.ok(Array.isArray(imports))
  assert.ok(controllers?.includes(TransactionsController))
  assert.ok(providers?.includes(TransactionsService))
  assert.ok(exportsList?.includes(TransactionsService))
})
