import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import assert from 'node:assert/strict'
import { Test } from '@nestjs/testing'
import { TransactionsModule } from './transactions.module'
import { TransactionsController } from './transactions.controller'
import { TransactionsService } from './transactions.service'

it('TransactionsModule exposes controller, provider, export wiring', () => {
  const imports = Reflect.getMetadata('imports', TransactionsModule) as unknown[] | undefined
  const controllers = Reflect.getMetadata('controllers', TransactionsModule) as unknown[] | undefined
  const providers = Reflect.getMetadata('providers', TransactionsModule) as unknown[] | undefined
  const exportsList = Reflect.getMetadata('exports', TransactionsModule) as unknown[] | undefined

  assert.ok(Array.isArray(imports))
  assert.ok(controllers?.includes(TransactionsController))
  assert.ok(providers?.includes(TransactionsService))
  assert.ok(exportsList?.includes(TransactionsService))
})

it('TransactionsModule can resolve TransactionsService through Nest DI', async () => {
  const moduleRef = await Test.createTestingModule({
    imports: [TransactionsModule]
  }).compile()

  const service = moduleRef.get(TransactionsService)
  assert.ok(service instanceof TransactionsService)

  await moduleRef.close()
})
