import assert from 'node:assert/strict'
import test from 'node:test'
import { QueueController } from './queue.controller'
import { QueueModule } from './queue.module'
import { QueueService } from './queue.service'

test('QueueModule exposes controller, provider, export wiring', () => {
  const controllers = Reflect.getMetadata('controllers', QueueModule) as unknown[] | undefined
  const providers = Reflect.getMetadata('providers', QueueModule) as unknown[] | undefined
  const exportsList = Reflect.getMetadata('exports', QueueModule) as unknown[] | undefined

  assert.ok(controllers?.includes(QueueController))
  assert.ok(providers?.includes(QueueService))
  assert.ok(exportsList?.includes(QueueService))
})
